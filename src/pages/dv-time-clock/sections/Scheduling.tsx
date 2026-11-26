// Scheduling: month calendar / list of shifts with recorded hours, holidays, create (single, repeating,
// multiple), edit, assign, delete, shift notes, and the "Email Employee Schedule" helper.
import { useCallback, useMemo, useState } from "react";
import { useLazyTcGetQuery, useTcGetQuery } from "../../../redux/api/common/dvTimeClockSlice";
import { useCan, useTcAction, useTimeClock } from "../TimeClockContext";
import { EditAttendanceForm } from "./Attendance";
import {
  Attendance, Member, Shift, addMonths, fmtDate, holidayName, lastDayOfMonth, localDateKey, monthName, monthShift, shiftConflictWarnings, shiftHours, thisMonth,
} from "../tcUtils";
import { tcConfirm } from "../tcDialog";

const PALETTE = ["#2563eb", "#7c3aed", "#0891b2", "#db2777", "#059669", "#d97706", "#dc2626", "#4f46e5"];
const colorFor = (v: unknown) => {
  const s = String(v || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
};
const t5 = (v?: string | null) => (v || "").slice(0, 5);
const clock = (v: string) => new Date(v).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const CAL_HEAD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Notify employees about shift changes through Messages (as the original does). */
export function useShiftNotifier() {
  const { me } = useTimeClock();
  const act = useTcAction();
  const notify = useCallback(async (userId: number | null | undefined, subject: string, body: string) => {
    if (!userId) return;
    try { await act("/messages", "POST", { senderId: me.userId, recipientIds: [userId], subject, body }); } catch (e) { console.warn("Shift notification could not be sent:", e); }
  }, [act, me.userId]);
  const notifyRows = useCallback(async (rows: { userId: number | null; shiftDate: string; startTime: string; endTime: string }[], prefix: string) => {
    for (const r of rows) {
      if (!r.userId) continue;
      await notify(r.userId, `${prefix} — ${r.shiftDate || "Shift"}`, `Your shift: ${r.shiftDate}, ${t5(r.startTime)}–${t5(r.endTime)}. Branch details are available in My Schedule. Please review your schedule in ANS Time Clock.`);
    }
  }, [notify]);
  return { notify, notifyRows };
}

/** Load shifts on the proposed dates and confirm any overlap / duplicate / >12h warnings. */
export function useConflictCheck() {
  const [fetchTc] = useLazyTcGetQuery();
  const { toast } = useTimeClock();
  return useCallback(async (proposed: Parameters<typeof shiftConflictWarnings>[0], excludeUuid: string | null = null) => {
    const candidates = proposed.filter((x) => x.userId);
    if (!candidates.length) return true;
    const dates = [...new Set(candidates.map((x) => x.shiftDate))];
    let existing: Shift[] = [];
    try {
      existing = ((await fetchTc({ path: "/shifts", params: { dates: dates.join(",") } }, false).unwrap()) || []) as Shift[];
    } catch (e) {
      toast(`Could not check scheduling conflicts: ${(e as { data?: { message?: string } })?.data?.message || "error"}`);
      return false;
    }
    const warnings = shiftConflictWarnings(proposed, existing, excludeUuid);
    if (!warnings.length) return true;
    return tcConfirm(`${warnings.join("\n")}\n\nContinue anyway? This override will proceed with the shift save.`, { title: "Scheduling warning", confirmText: "Save anyway" });
  }, [fetchTc, toast]);
}

const activeEmployees = (members: Member[]) => members.filter((m) => m.isEmployee && m.active !== false);
const selectedValues = (el: HTMLSelectElement) => [...el.selectedOptions].map((o) => Number(o.value));

function CreateShiftForm() {
  const { members, branches, settings, toast, closeModal } = useTimeClock();
  const act = useTcAction();
  const check = useConflictCheck();
  const { notifyRows } = useShiftNotifier();
  const [f, setF] = useState({ name: "Shift", date: "", branchId: "", start: "", end: "", override: false, repeat: false, until: "", notes: "" });
  const [emps, setEmps] = useState<number[]>([]);
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const save = async () => {
    if (!f.date || !f.start || !f.end) return toast("Date and times are required.");
    if (f.repeat && (!f.until || f.until < f.date)) return toast("Choose a repeat-through date on or after the start date.");
    let dates: string[] = [];
    if (f.repeat) {
      if (!weekdays.length) return toast("Select at least one repeat weekday.");
      const d = new Date(f.date + "T12:00:00"), last = new Date(f.until + "T12:00:00");
      while (d <= last) {
        if (weekdays.includes(d.getDay())) dates.push(d.toISOString().slice(0, 10));
        d.setDate(d.getDate() + 1);
      }
    } else dates = [f.date];
    const holidays = dates.map((d) => ({ date: d, name: holidayName(d, settings.optionalHolidays) })).filter((x) => x.name);
    if (holidays.length && !f.override) return toast(`Office is closed for ${holidays.map((x) => `${x.name} (${x.date})`).join(", ")}. Check the holiday override to create shifts anyway.`);
    const people = emps.length ? emps : [null];
    const rows = dates.flatMap((day) => people.map((userId) => ({ name: f.name.trim() || "Shift", shiftDate: day, branchId: f.branchId ? Number(f.branchId) : null, userId, startTime: f.start, endTime: f.end, totalHours: shiftHours(f.start, f.end), notes: f.notes.trim(), status: userId ? "assigned" : "open" })));
    if (!rows.length) return toast("No matching dates selected.");
    if (!(await check(rows))) return;
    try {
      await act("/shifts", "POST", { shifts: rows });
    } catch (e) {
      return toast((e as Error).message);
    }
    await notifyRows(rows, "New shift assigned");
    closeModal();
    toast(`${rows.length} shift(s) created.`);
  };
  return (
    <>
      <div className="formgrid">
        <div className="field"><label>Shift Name</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="field"><label>Start Date</label><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
        <div className="field"><label>Branch</label>
          <select value={f.branchId} onChange={(e) => setF({ ...f, branchId: e.target.value })}>
            <option value="">Select branch</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="field"><label>Start</label><input type="time" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></div>
        <div className="field"><label>End</label><input type="time" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></div>
        <div className="field span3"><label>Assign employee(s) (optional; select multiple with Ctrl/Command)</label>
          <select multiple size={5} value={emps.map(String)} onChange={(e) => setEmps(selectedValues(e.target))}>
            {activeEmployees(members).map((e) => <option key={e.userId} value={e.userId}>{e.fullName || e.employeeCode}</option>)}
          </select>
          <small className="muted">Leave unselected to create an open shift.</small>
        </div>
        <div className="field span3"><label><input type="checkbox" style={{ width: "auto" }} checked={f.override} onChange={(e) => setF({ ...f, override: e.target.checked })} /> Override holiday closure</label><small className="muted">Ontario office holidays are closed by default. Check to create shifts on a holiday.</small></div>
        <div className="field"><label><input type="checkbox" style={{ width: "auto" }} checked={f.repeat} onChange={(e) => setF({ ...f, repeat: e.target.checked })} /> Repeat weekly</label></div>
        <div className="field"><label>Repeat through (inclusive)</label><input type="date" value={f.until} onChange={(e) => setF({ ...f, until: e.target.value })} /></div>
        <div className="field span3"><label>Repeat weekdays (used when weekly repeat is checked)</label>
          <div className="actions">
            {WEEKDAYS.map((x, i) => (
              <label key={x} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <input type="checkbox" style={{ width: "auto" }} checked={weekdays.includes(i)} onChange={(e) => setWeekdays((w) => (e.target.checked ? [...w, i] : w.filter((d) => d !== i)))} /> {x}
              </label>
            ))}
          </div>
        </div>
        <div className="field span3"><label>Notes</label><textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
      </div>
      <button onClick={save}>Create Shift(s)</button>
    </>
  );
}

function MultiShiftForm() {
  const { members, branches, settings, toast, closeModal } = useTimeClock();
  const act = useTcAction();
  const check = useConflictCheck();
  const { notifyRows } = useShiftNotifier();
  const [f, setF] = useState({ name: "Shift", from: "", to: "", branchId: "", start: "", end: "", qty: "1", override: false });
  const [emps, setEmps] = useState<number[]>([]);
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const save = async () => {
    if (!f.from || !f.to || f.from > f.to) return toast("Choose a valid date range.");
    if (!weekdays.length) return toast("Select at least one weekday.");
    const people = emps.length ? emps : [null];
    const rows = [];
    const d = new Date(f.from + "T12:00:00"), last = new Date(f.to + "T12:00:00");
    while (d <= last) {
      const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      if (weekdays.includes(d.getDay()) && (f.override || !holidayName(key, settings.optionalHolidays))) {
        for (let i = 0; i < Math.max(1, Number(f.qty) || 1); i++) {
          for (const userId of people) rows.push({ name: f.name.trim() || "Open Shift", shiftDate: d.toISOString().slice(0, 10), branchId: f.branchId ? Number(f.branchId) : null, userId, startTime: f.start, endTime: f.end, totalHours: shiftHours(f.start, f.end), status: userId ? "assigned" : "open" });
        }
      }
      d.setDate(d.getDate() + 1);
    }
    if (!rows.length) return toast("No matching dates after excluding office holidays. Check the holiday override if needed.");
    if (!(await check(rows))) return;
    try {
      await act("/shifts", "POST", { shifts: rows });
    } catch (e) {
      return toast((e as Error).message);
    }
    await notifyRows(rows, "New shift assigned");
    closeModal();
    toast(`${rows.length} shifts created.`);
  };
  return (
    <>
      <div className="formgrid">
        <div className="field"><label>Shift Name</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="field"><label>Start Date</label><input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></div>
        <div className="field"><label>End Date</label><input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></div>
        <div className="field"><label>Branch</label>
          <select value={f.branchId} onChange={(e) => setF({ ...f, branchId: e.target.value })}>
            <option value="">Select branch</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="field"><label>Start</label><input type="time" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></div>
        <div className="field"><label>End</label><input type="time" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></div>
        <div className="field"><label>Employee(s) optional; Ctrl/Command to select multiple</label>
          <select multiple size={5} value={emps.map(String)} onChange={(e) => setEmps(selectedValues(e.target))}>
            {activeEmployees(members).map((e) => <option key={e.userId} value={e.userId}>{e.fullName || e.employeeCode}</option>)}
          </select>
        </div>
        <div className="field"><label>Copies per selected day</label><input type="number" min={1} max={50} value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /></div>
        <div className="field span3"><label><input type="checkbox" style={{ width: "auto" }} checked={f.override} onChange={(e) => setF({ ...f, override: e.target.checked })} /> Override holiday closure</label><small className="muted">Holiday dates are skipped unless checked.</small></div>
        <div className="field span3"><label>Weekdays</label>
          <div className="actions">
            {WEEKDAYS.map((x, i) => (
              <label key={x}><input type="checkbox" style={{ width: "auto" }} checked={weekdays.includes(i)} onChange={(e) => setWeekdays((w) => (e.target.checked ? [...w, i] : w.filter((d) => d !== i)))} /> {x}</label>
            ))}
          </div>
        </div>
      </div>
      <button onClick={save}>Create Shifts</button>
    </>
  );
}

function EditShiftForm({ s }: { s: Shift }) {
  const { members, branches, toast, closeModal } = useTimeClock();
  const act = useTcAction();
  const check = useConflictCheck();
  const { notify } = useShiftNotifier();
  const [f, setF] = useState({ name: s.name || "Shift", date: s.shiftDate, branchId: s.branchId ? String(s.branchId) : "", start: t5(s.startTime), end: t5(s.endTime), userId: s.userId ? String(s.userId) : "", notes: s.notes || "" });
  const save = async () => {
    if (!f.date || !f.start || !f.end) return toast("Date and times are required.");
    const userId = f.userId ? Number(f.userId) : null;
    const proposed = { uuid: s.uuid, userId, shiftDate: f.date, startTime: f.start, endTime: f.end, totalHours: shiftHours(f.start, f.end) };
    if (!(await check([proposed], s.uuid))) return;
    try {
      await act(`/shifts/${s.uuid}`, "PATCH", { name: f.name.trim() || "Shift", shiftDate: f.date, branchId: f.branchId ? Number(f.branchId) : null, userId, startTime: f.start, endTime: f.end, totalHours: proposed.totalHours, notes: f.notes.trim(), status: userId ? "assigned" : "open" });
    } catch (e) {
      return toast((e as Error).message);
    }
    if (s.userId && s.userId !== userId) await notify(s.userId, "Shift reassigned / cancelled", `Your shift on ${s.shiftDate} has been reassigned. Please check with management if you have questions.`);
    if (userId) await notify(userId, `Shift updated — ${f.date}`, `Your shift has been added or updated: ${f.date}, ${f.start}–${f.end}. Please review My Schedule.`);
    closeModal();
    toast("Shift updated.");
  };
  return (
    <>
      <div className="formgrid">
        <div className="field"><label>Shift Name</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="field"><label>Date</label><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
        <div className="field"><label>Branch</label>
          <select value={f.branchId} onChange={(e) => setF({ ...f, branchId: e.target.value })}>
            <option value="">No branch</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="field"><label>Start</label><input type="time" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></div>
        <div className="field"><label>End</label><input type="time" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></div>
        <div className="field"><label>Employee</label>
          <select value={f.userId} onChange={(e) => setF({ ...f, userId: e.target.value })}>
            <option value="">Open / Unassigned</option>
            {members.filter((m) => m.isEmployee).map((e) => <option key={e.userId} value={e.userId}>{e.fullName || e.employeeCode}</option>)}
          </select>
        </div>
        <div className="field span3"><label>Notes</label><textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
      </div>
      <button onClick={save}>Save Shift</button>
    </>
  );
}

function AssignShiftForm({ s }: { s: Shift }) {
  const { members, toast, closeModal } = useTimeClock();
  const act = useTcAction();
  const [userId, setUserId] = useState("");
  const save = async () => {
    if (!userId) return toast("Select an employee.");
    try {
      await act(`/shifts/${s.uuid}`, "PATCH", { userId: Number(userId), status: "assigned", onlyIfStatus: "open" });
      closeModal();
      toast("Shift assigned.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <>
      <div className="field"><label>Employee</label>
        <select value={userId} onChange={(e) => setUserId(e.target.value)}>
          <option value="">Select employee</option>
          {members.filter((m) => m.isEmployee && m.active).map((e) => <option key={e.userId} value={e.userId}>{e.fullName || e.employeeCode}</option>)}
        </select>
      </div>
      <button onClick={save}>Assign</button>
    </>
  );
}

/** "Leave Shift Note" (used by Scheduling and My Schedule). */
export function HandoverNoteForm({ shiftUuid }: { shiftUuid: string }) {
  const { me, toast, closeModal } = useTimeClock();
  const act = useTcAction();
  const [note, setNote] = useState("");
  const save = async () => {
    if (!note.trim()) return toast("Enter a note.");
    try {
      await act("/handover-notes", "POST", { shiftUuid, userId: me.userId, note: note.trim() });
      closeModal();
      toast("Shift note saved.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <>
      <div className="field"><label>Shift note</label><textarea rows={5} placeholder="Add a shift update, handover detail, or follow-up" value={note} onChange={(e) => setNote(e.target.value)} /></div>
      <div className="actions"><button onClick={save}>Save Note</button><button className="ghost" onClick={closeModal}>Cancel</button></div>
    </>
  );
}

function CopyScheduleEmail({ email, subject, body }: { email: string; subject: string; body: string }) {
  const { toast } = useTimeClock();
  const [s, setS] = useState(subject);
  const [b, setB] = useState(body);
  const copy = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(msg);
    } catch {
      toast("Copying was blocked. Select the text and use Ctrl+C.");
    }
  };
  return (
    <>
      <p>Copy the subject and message below, then paste them into your email. Recipient: <strong>{email}</strong></p>
      <div className="field"><label>Email subject</label><textarea rows={2} value={s} onChange={(e) => setS(e.target.value)} /><button className="secondary" onClick={() => copy(s, "Copied to clipboard.")}>Copy Subject</button></div>
      <div className="field"><label>Email message</label><textarea rows={12} value={b} onChange={(e) => setB(e.target.value)} /><button onClick={() => copy(b, "Copied to clipboard.")}>Copy Email Message</button></div>
      <button className="secondary" onClick={() => copy(`Subject: ${s}\n\n${b}`, "Subject and message copied.")}>Copy Subject + Message</button>
    </>
  );
}

function EmailScheduleForm() {
  const { members, branches, toast, openModal } = useTimeClock();
  const [fetchTc] = useLazyTcGetQuery();
  const [userId, setUserId] = useState("");
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date(Date.now() + 13 * 86400000).toISOString().slice(0, 10));
  const [branchId, setBranchId] = useState("");
  const compose = async () => {
    if (!userId || !from || !to || to < from) return toast("Select an employee and valid date range.");
    const emp = members.find((m) => String(m.userId) === userId);
    if (!emp?.email) return toast("This employee profile has no email address.");
    let shifts: Shift[] = [];
    try {
      shifts = ((await fetchTc({ path: "/shifts", params: { userId, from, to } }, false).unwrap()) || []) as Shift[];
    } catch {
      return toast("Could not load shifts.");
    }
    if (branchId) shifts = shifts.filter((s) => String(s.branchId) === branchId);
    const lines = shifts.map((sh) => `${fmtDate(sh.shiftDate)} | ${sh.name || "Shift"} | ${t5(sh.startTime)}–${t5(sh.endTime)} | ${branches.find((b) => b.id === sh.branchId)?.name || "Location not specified"}`);
    const subject = `Your Work Schedule: ${from} to ${to}`;
    const body = `Hello ${emp.fullName},\n\nHere is your scheduled work schedule for ${from} through ${to}.\n\n${lines.length ? lines.join("\n") : "No shifts are currently scheduled for this timeframe."}\n\nANS RealStateCRM`;
    openModal("Copy Schedule Email", <CopyScheduleEmail email={emp.email} subject={subject} body={body} />);
  };
  return (
    <>
      <p className="muted">Choose one employee and a date range. This prepares the schedule, shift times, and branch locations for you to copy into an email.</p>
      <div className="formgrid">
        <div className="field"><label>Employee</label>
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Select employee</option>
            {activeEmployees(members).map((e) => <option key={e.userId} value={e.userId}>{e.fullName || e.employeeCode} — {e.email || "No email"}</option>)}
          </select>
        </div>
        <div className="field"><label>From</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="field"><label>Through</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div className="field"><label>Location filter (optional)</label>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">All locations</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>
      <button onClick={compose}>Compose Schedule Email</button>
    </>
  );
}

type Note = { uuid: string; shiftUuid: string; note: string; createdAt: string };

export function SchedulingSection() {
  const { me, members, branches, settings, toast, openModal } = useTimeClock();
  const can = useCan();
  const act = useTcAction();
  const { notify } = useShiftNotifier();
  const [month, setMonth] = useState(thisMonth());
  const [empFilter, setEmpFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [mode, setMode] = useState<"calendar" | "list">("calendar");
  const shiftsQ = useTcGetQuery({ path: "/shifts", params: { from: `${month}-01`, to: lastDayOfMonth(month) } }, { pollingInterval: 30000 });
  const attQ = useTcGetQuery({ path: "/attendance", params: { from: `${month}-01T00:00:00`, to: `${lastDayOfMonth(month)}T23:59:59`, order: "asc" } }, { pollingInterval: 30000 });
  const rows = (shiftsQ.data || []) as Shift[];
  const notesQ = useTcGetQuery({ path: "/handover-notes", params: { shiftUuids: rows.map((s) => s.uuid).join(",") } }, { skip: !rows.length });
  const notes = (notesQ.data || []) as Note[];
  const attendance = (attQ.data || []) as Attendance[];
  const employees = members.filter((m) => m.isEmployee);
  const memberOf = (id: number | null) => members.find((m) => m.userId === id);
  const branchOf = (id: number | null | undefined) => branches.find((b) => b.id === id);

  const filtered = rows.filter((s) => s.shiftDate.startsWith(month) && (!empFilter || String(s.userId) === empFilter) && (!branchFilter || String(s.branchId) === branchFilter));
  const scheduledIds = useMemo(() => new Set(rows.map((s) => s.uuid)), [rows]);
  const attendanceByShift = useMemo(() => new Map(attendance.filter((a) => a.shiftUuid && scheduledIds.has(a.shiftUuid)).map((a) => [a.shiftUuid, a])), [attendance, scheduledIds]);
  const recorded = attendance.filter((a) => a.clockIn && (!a.shiftUuid || !scheduledIds.has(a.shiftUuid)) && localDateKey(a.clockIn).startsWith(month) && (!empFilter || String(a.userId) === empFilter) && (!branchFilter || String(a.branchId || memberOf(a.userId)?.branchId) === branchFilter));

  const actualFor = (s: Shift) => {
    const a = attendanceByShift.get(s.uuid);
    if (!a) return null;
    const hrs = a.clockOut ? Math.max(0, (+new Date(a.clockOut) - +new Date(a.clockIn)) / 3600000) : 0;
    return <small className="actual-shift-time">Actual: {clock(a.clockIn)}–{a.clockOut ? clock(a.clockOut) : "Still clocked in"}{a.clockOut ? ` · ${hrs.toFixed(2)}h` : ""}</small>;
  };
  const branchBadge = (s: Shift) => {
    const c = colorFor(s.branchId || "branch");
    return <span className="shift-badge" style={{ border: `1px solid ${c}33`, color: c }}><i className="mini-dot" style={{ background: c }} />{branchOf(s.branchId)?.name || "No Branch"}</span>;
  };
  const empBadge = (s: Shift) => {
    const c = colorFor(s.userId || "employee");
    return <span className="shift-badge" style={{ border: `1px solid ${c}33`, color: c }}><i className="mini-dot" style={{ background: c }} />{memberOf(s.userId)?.fullName || "Assigned"}</span>;
  };
  const notePreview = (s: Shift) => {
    const ns = notes.filter((n) => n.shiftUuid === s.uuid);
    if (!ns.length) return null;
    return (
      <div className="shift-note-preview" style={{ marginTop: 5, padding: 5, background: "#f8fafc", borderLeft: "3px solid #0d6b64", borderRadius: 3, fontSize: 11 }}>
        <b>Notes ({ns.length})</b>
        {ns.slice(0, 2).map((n) => <div key={n.uuid}>{n.note}</div>)}
        {ns.length > 2 && <div>…</div>}
      </div>
    );
  };
  const deleteShift = async (s: Shift) => {
    if (!["superadmin", "admin", "management"].includes(me.role)) return toast("Management scheduling permission is required to delete shifts.");
    if (!(await tcConfirm("Delete this shift? This cannot be undone.", { title: "Delete shift", confirmText: "Delete", danger: true }))) return;
    if (s.userId) await notify(s.userId, "Shift cancelled", "Your shift has been cancelled by management. Please review My Schedule.");
    try {
      await act(`/shifts/${s.uuid}`, "DELETE");
      toast("Shift deleted.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  const deleteAttendance = async (a: Attendance) => {
    if (!(await tcConfirm("Permanently delete this attendance record? This cannot be undone.", { title: "Delete attendance record", confirmText: "Delete", danger: true }))) return;
    try {
      await act(`/attendance/${a.uuid}`, "DELETE");
      toast("Attendance record deleted.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  const editAtt = (a: Attendance) => openModal("Edit Attendance Record", <EditAttendanceForm a={a} />);
  const smallBtn = { fontSize: 10, padding: "4px 6px" } as const;
  const recordedHours = (a: Attendance) => (a.clockOut ? Math.max(0, (+new Date(a.clockOut) - +new Date(a.clockIn)) / 3600000) : 0);

  const listView = (
    <div className="tablewrap">
      <table className="table">
        <thead><tr><th>Date</th><th>Shift / Entry</th><th>Branch</th><th>Employee</th><th>Status</th><th>Time</th><th>Hours</th><th>Action</th></tr></thead>
        <tbody>
          {filtered.map((s) => (
            <tr key={s.uuid}>
              <td>{fmtDate(s.shiftDate)}</td>
              <td>{s.name}</td>
              <td>{branchBadge(s)}</td>
              <td>{s.userId ? empBadge(s) : <span className="muted">—</span>}</td>
              <td><span className={`pill ${s.userId ? "green" : "gold"}`}>{s.userId ? "Assigned" : "Open"}</span></td>
              <td>{t5(s.startTime)}–{t5(s.endTime)}{actualFor(s)}</td>
              <td>{Number(s.totalHours).toFixed(2)}</td>
              <td>
                <button className="ghost" onClick={() => openModal("Edit Shift", <EditShiftForm s={s} />)}>Edit</button>{" "}
                <button className="ghost" onClick={() => openModal("Leave Shift Note", <HandoverNoteForm shiftUuid={s.uuid} />)}>＋ Shift Note</button>{" "}
                <button className="danger" onClick={() => deleteShift(s)}>Delete</button>
                {!s.userId && <> <button onClick={() => openModal("Assign Open Shift", <AssignShiftForm s={s} />)}>Assign</button></>}
              </td>
            </tr>
          ))}
          {recorded.map((a) => {
            const e = memberOf(a.userId), b = branchOf(a.branchId || e?.branchId);
            return (
              <tr key={a.uuid} style={{ background: "#f0fdfa" }}>
                <td>{fmtDate(localDateKey(a.clockIn))}</td>
                <td><b>Recorded Hours</b></td>
                <td>{b?.name || "Branch not set"}</td>
                <td>{e?.fullName || e?.employeeCode || "Employee"}</td>
                <td>Completed</td>
                <td>{clock(a.clockIn)}–{a.clockOut ? clock(a.clockOut) : "Open"}</td>
                <td>{recordedHours(a).toFixed(2)}</td>
                <td>
                  {can("attendance.edit") && <><button className="ghost" onClick={() => editAtt(a)}>Edit</button> </>}
                  {can("attendance.delete") ? <button className="danger" onClick={() => deleteAttendance(a)}>Delete</button> : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const dt = monthShift(month), y = dt.getFullYear(), m = dt.getMonth(), lead = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  const calendarView = (
    <>
      <div className="calendar-head">{CAL_HEAD.map((x) => <div key={x}>{x}</div>)}</div>
      <div className="calendar-scroll">
        <div className="calendar">
          {Array.from({ length: lead }, (_, i) => <div className="day" key={`l${i}`} />)}
          {Array.from({ length: days }, (_, i) => {
            const d = i + 1, key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const holiday = holidayName(key, settings.optionalHolidays);
            return (
              <div className="day" key={key}>
                <div className="daynum">{d}</div>
                {holiday && <div className="holiday-marker" style={{ margin: "4px 0", padding: "4px 6px", borderRadius: 5, background: "#fff1cc", border: "1px solid #d6a94b", color: "#684b12", fontSize: 11, fontWeight: 700, lineHeight: 1.25 }}>★ {holiday}</div>}
                {filtered.filter((s) => s.shiftDate === key).map((s) => (
                  <div key={s.uuid} className={`shift ${s.userId ? "assigned" : "open"}`}>
                    <b>{s.name}</b>
                    <small>{t5(s.startTime)}–{t5(s.endTime)} · {Number(s.totalHours).toFixed(2)}h</small>
                    {actualFor(s)}
                    {branchBadge(s)}
                    {s.userId ? empBadge(s) : <span className="shift-badge status-open">OPEN</span>}
                    {s.userId ? <span className="shift-badge status-assigned">ASSIGNED</span> : <button style={{ marginTop: 5, padding: "4px 6px", fontSize: 10 }} onClick={() => openModal("Assign Open Shift", <AssignShiftForm s={s} />)}>Assign</button>}
                    {notePreview(s)}
                    <div className="actions" style={{ marginTop: 5 }}>
                      <button className="ghost" style={smallBtn} onClick={() => openModal("Leave Shift Note", <HandoverNoteForm shiftUuid={s.uuid} />)}>Shift Note</button>
                      <button className="ghost" style={smallBtn} onClick={() => openModal("Edit Shift", <EditShiftForm s={s} />)}>Edit</button>
                      <button className="danger" style={smallBtn} onClick={() => deleteShift(s)}>Delete</button>
                    </div>
                  </div>
                ))}
                {recorded.filter((a) => localDateKey(a.clockIn) === key).map((a) => {
                  const e = memberOf(a.userId), b = branchOf(a.branchId || e?.branchId);
                  return (
                    <div className="shift recorded-shift" key={a.uuid}>
                      <b>Worked Shift · Recorded Hours</b>
                      <small>{e?.fullName || e?.employeeCode || "Employee"} · {clock(a.clockIn)}–{a.clockOut ? clock(a.clockOut) : "Open"} · {recordedHours(a).toFixed(2)}h</small>
                      <span className="shift-badge">{b?.name || "Branch not set"}</span>
                      <div className="actions" style={{ marginTop: 5 }}>
                        {can("attendance.edit") && <button className="ghost" style={smallBtn} onClick={() => editAtt(a)}>Edit</button>}
                        {can("attendance.delete") && <button className="danger" style={smallBtn} onClick={() => deleteAttendance(a)}>Delete</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <div className="panel">
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <div>
          <h2>Scheduling</h2>
          <div className="legend">
            <span className="legend-item"><i className="dot branch" />Branch</span>
            <span className="legend-item"><i className="dot employee" />Employee</span>
            <span className="legend-item"><i className="dot assigned" />Assigned</span>
            <span className="legend-item"><i className="dot open" />Open / Unassigned</span>
          </div>
        </div>
        <div className="actions">
          <button onClick={() => openModal("Create Multiple Shifts", <MultiShiftForm />)}>Create Multiple Shifts</button>
          <button onClick={() => openModal("Create Shift", <CreateShiftForm />)}>Create Shift</button>
          <button className="secondary" onClick={() => openModal("Email Employee Schedule", <EmailScheduleForm />)}>Email Employee Schedule</button>
        </div>
      </div>
      <div className="calendar-nav">
        <button className="ghost" onClick={() => setMonth(addMonths(month, -1))}>‹ Previous</button>
        <b>{monthName(month)}</b>
        <button className="ghost" onClick={() => setMonth(addMonths(month, 1))}>Next ›</button>
      </div>
      <div className="formgrid" style={{ margin: "12px 0" }}>
        <div className="field"><label>View by employee</label>
          <select value={empFilter} onChange={(e) => setEmpFilter(e.target.value)}>
            <option value="">All employees</option>
            {employees.map((e) => <option key={e.userId} value={e.userId}>{e.fullName || e.employeeCode || "Employee"}</option>)}
          </select>
        </div>
        <div className="field"><label>View by branch</label>
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
            <option value="">All branches</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="field"><label>Display</label>
          <div className="viewtoggle">
            <button className={mode === "calendar" ? "active" : ""} onClick={() => setMode("calendar")}>Calendar</button>
            <button className={mode === "list" ? "active" : ""} onClick={() => setMode("list")}>List</button>
          </div>
        </div>
      </div>
      <div id="schedBody">{mode === "list" ? listView : calendarView}</div>
    </div>
  );
}
