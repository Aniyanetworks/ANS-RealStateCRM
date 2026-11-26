// Employee console screens (My Schedule, My Attendance Report, Open Shifts, Shift Tasks) and the
// management Shift Task Lists.
import { useState } from "react";
import { useTcGetQuery } from "../../../redux/api/common/dvTimeClockSlice";
import { useTcAction, useTimeClock } from "../TimeClockContext";
import { CAL_HEAD, HandoverNoteForm } from "./Scheduling";
import logo from "../../../assets/dv-time-clock-logo.svg";
import { Attendance, Shift, addMonths, fmtDate, holidayName, lastDayOfMonth, localDateKey, monthName, monthShift, thisMonth } from "../tcUtils";
import { tcConfirm } from "../tcDialog";

const t5 = (v?: string | null) => (v || "").slice(0, 5);
type Note = { uuid: string; shiftUuid: string; note: string };
type Task = { uuid: string; shiftUuid: string; title: string; details: string | null };

const HolidayTag = ({ name, inline }: { name: string; inline?: boolean }) => (
  <div
    className="holiday-marker"
    style={inline
      ? { display: "inline-block", marginTop: 4, padding: "3px 6px", borderRadius: 5, background: "#fff1cc", border: "1px solid #d6a94b", color: "#684b12", fontSize: 11, fontWeight: 700 }
      : { margin: "4px 0", padding: "4px 6px", borderRadius: 5, background: "#fff1cc", border: "1px solid #d6a94b", color: "#684b12", fontSize: 11, fontWeight: 700, lineHeight: 1.25 }}
  >
    ★ {name}
  </div>
);

export function MySchedule() {
  const { me, branches, settings, openModal } = useTimeClock();
  const [month, setMonth] = useState(thisMonth());
  const [mode, setMode] = useState<"calendar" | "list">("calendar");
  const shifts = (useTcGetQuery({ path: "/shifts", params: { userId: me.userId, from: `${month}-01`, to: lastDayOfMonth(month) } }, { pollingInterval: 30000 }).data || []) as Shift[];
  const branchIds = [...new Set(shifts.map((s) => s.branchId).filter(Boolean))];
  const notes = (useTcGetQuery({ path: "/handover-notes", params: { branchIds: branchIds.join(",") } }, { skip: !branchIds.length }).data || []) as Note[];
  const total = shifts.reduce((a, s) => a + Number(s.totalHours || 0), 0);
  const bname = (id: number | null) => branches.find((b) => b.id === id)?.name || "Not assigned";
  const leaveNote = (s: Shift) => openModal("Leave Shift Note", <HandoverNoteForm shiftUuid={s.uuid} />);
  const dt = monthShift(month), y = dt.getFullYear(), m = dt.getMonth(), lead = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  return (
    <div className="panel">
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <div><h2>My Schedule</h2><div className="hours">{total.toFixed(2)} scheduled hours</div></div>
        <div className="actions">
          <button className="ghost" onClick={() => window.print()}>Print Schedule</button>
          <div className="viewtoggle">
            <button className={mode === "calendar" ? "active" : ""} onClick={() => setMode("calendar")}>Calendar</button>
            <button className={mode === "list" ? "active" : ""} onClick={() => setMode("list")}>List</button>
          </div>
        </div>
      </div>
      <div className="calendar-nav">
        <button className="ghost" onClick={() => setMonth(addMonths(month, -1))}>‹ Previous</button>
        <b>{monthName(month)}</b>
        <button className="ghost" onClick={() => setMonth(addMonths(month, 1))}>Next ›</button>
      </div>
      <div className="print-brand"><img src={logo} alt="ANS RealStateCRM" /><h2>ANS RealStateCRM — My Schedule</h2></div>
      {mode === "list" ? (
        <>
          <div className="tablewrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Shift</th><th>Location / Branch</th><th>Time</th><th>Hours</th><th>Handover notes</th><th>Action</th></tr></thead>
              <tbody>
                {shifts.map((sh) => {
                  const holiday = holidayName(sh.shiftDate, settings.optionalHolidays);
                  const ns = notes.filter((n) => n.shiftUuid === sh.uuid);
                  return (
                    <tr key={sh.uuid}>
                      <td>{fmtDate(sh.shiftDate)}{holiday && <><br /><HolidayTag name={holiday} inline /></>}</td>
                      <td>{sh.name || "Shift"}</td>
                      <td>{bname(sh.branchId)}</td>
                      <td>{t5(sh.startTime)}–{t5(sh.endTime)}</td>
                      <td>{Number(sh.totalHours || 0).toFixed(2)}</td>
                      <td>{ns.length ? ns.map((n) => <div key={n.uuid}>{n.note}</div>) : "—"}</td>
                      <td><button className="ghost" onClick={() => leaveNote(sh)}>＋ Leave Note</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!shifts.length && <p className="muted">No shifts scheduled for this month.</p>}
        </>
      ) : (
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
                    {holiday && <HolidayTag name={holiday} />}
                    {shifts.filter((sh) => sh.shiftDate === key).map((sh) => (
                      <div className="shift assigned" key={sh.uuid}>
                        <b>{sh.name || "Shift"}</b>
                        <small>{t5(sh.startTime)}–{t5(sh.endTime)} · {Number(sh.totalHours || 0).toFixed(2)}h</small>
                        <span className="shift-badge">{bname(sh.branchId)}</span>
                        <button className="ghost" style={{ fontSize: 11, padding: 4 }} onClick={() => leaveNote(sh)}>Leave Note</button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
          {!shifts.length && <p className="muted">No shifts scheduled for this month.</p>}
        </>
      )}
    </div>
  );
}

export function MyAttendanceReport() {
  const { me, toast } = useTimeClock();
  const rows = (useTcGetQuery({ path: "/attendance", params: { userId: me.userId, order: "asc" } }, { pollingInterval: 30000 }).data || []) as Attendance[];
  const first = new Date();
  first.setDate(1);
  const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const [from, setFrom] = useState(key(first));
  const [to, setTo] = useState(key(new Date()));
  const [applied, setApplied] = useState({ from: key(first), to: key(new Date()) });
  const shown = rows.filter((a) => {
    if (!a.clockIn) return false;
    const d = localDateKey(a.clockIn);
    return (!applied.from || d >= applied.from) && (!applied.to || d <= applied.to);
  });
  const hours = (a: Attendance) => {
    if (!a.clockIn || !a.clockOut) return 0;
    const actual = Math.max(0, (+new Date(a.clockOut) - +new Date(a.clockIn)) / 3600000);
    return a.payableHours != null ? Math.max(0, Number(a.payableHours) || 0) : actual;
  };
  const fmt = (t: string | null) => (t ? new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—");
  const days = new Map<string, { rows: { a: Attendance; h: number }[]; total: number }>();
  let total = 0;
  for (const a of shown) {
    const d = localDateKey(a.clockIn);
    if (!days.has(d)) days.set(d, { rows: [], total: 0 });
    const h = hours(a);
    days.get(d)!.rows.push({ a, h });
    days.get(d)!.total += h;
    total += h;
  }
  const print = () => {
    if (!document.querySelector(".dvtc #myAttendanceReportResult .report-print-area")) return toast("Generate a report first.");
    window.print();
  };
  const invalid = applied.from && applied.to && applied.from > applied.to;
  return (
    <div className="panel">
      <div className="actions"><h2>My Attendance Report</h2><span className="muted">v1.4.8</span></div>
      <p className="muted">Choose a date range to review your own clock-in/out records, daily hours, and period total. You can print or save the report as PDF.</p>
      <div className="formgrid">
        <div className="field"><label>From Date</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="field"><label>To Date</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      </div>
      <div className="actions"><button onClick={() => setApplied({ from, to })}>Generate Report</button><button className="secondary" onClick={print}>Print / Save PDF</button></div>
      <div id="myAttendanceReportResult">
        {invalid ? <p className="notice">Start date must be on or before end date.</p> : (
          <div className="report-print-area">
            <header className="attendance-print-header">
              <div className="attendance-print-brand">
                <img src={logo} alt="ANS RealStateCRM logo" />
                <div><div className="attendance-print-company">ANS REALSTATECRM</div><div className="attendance-print-subtitle">Employee Attendance &amp; Time Records</div></div>
              </div>
              <div className="attendance-print-title"><h1>My Attendance Report</h1><p>Prepared {new Date().toLocaleString()}</p></div>
            </header>
            <section className="attendance-print-meta">
              <div><span>Employee</span><b>{me.fullName || "Employee"}</b></div>
              <div><span>Employee ID</span><b>{me.employeeCode || "—"}</b></div>
              <div><span>Report Period</span><b>{applied.from || "Any date"} to {applied.to || "Any date"}</b></div>
              <div><span>Attendance Entries</span><b>{shown.length}</b></div>
            </section>
            {!shown.length ? <p>No attendance records found for the selected dates.</p> : (
              <>
                <div className="tablewrap">
                  <table className="table attendance-report-table">
                    <thead><tr><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Hours Worked</th><th>Daily Total</th><th>Status</th></tr></thead>
                    <tbody>
                      {[...days.entries()].map(([day, g]) => g.rows.map((x, i) => (
                        <tr key={x.a.uuid}>
                          <td>{day}</td><td>{fmt(x.a.clockIn)}</td><td>{fmt(x.a.clockOut)}</td><td>{x.h.toFixed(2)}</td><td>{i === 0 ? g.total.toFixed(2) : ""}</td><td>{x.a.clockOut ? "Complete" : "Open shift"}</td>
                        </tr>
                      )))}
                    </tbody>
                    <tfoot><tr><th colSpan={4} style={{ textAlign: "right" }}>Grand Total Hours</th><th>{total.toFixed(2)}</th><th /></tr></tfoot>
                  </table>
                </div>
                <p className="attendance-report-footnote">Hours use recorded payable hours when available; otherwise completed clock-in/out duration. Open shifts are shown but are not included in completed hours.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function OpenShifts() {
  const { me, toast } = useTimeClock();
  const act = useTcAction();
  const [month, setMonth] = useState(thisMonth());
  const [view, setView] = useState<"list" | "calendar">("list");
  const data = (useTcGetQuery({ path: "/shifts", params: { status: "open" } }, { pollingInterval: 30000 }).data || []) as Shift[];
  const rows = data.filter((s) => s.shiftDate && s.shiftDate.startsWith(month)).sort((a, b) => a.shiftDate.localeCompare(b.shiftDate) || String(a.startTime).localeCompare(String(b.startTime)));
  const request = async (s: Shift) => {
    try {
      await act("/shift-requests", "POST", { shiftUuid: s.uuid, userId: me.userId });
      toast("Shift request submitted.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  const dt = monthShift(month), y = dt.getFullYear(), m = dt.getMonth(), lead = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
  return (
    <div className="panel">
      <div className="actions" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div><h2>Open Shifts</h2><p className="muted">Browse available shifts and request assignment.</p></div>
        <div className="viewtoggle">
          <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>List</button>
          <button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>Calendar</button>
        </div>
      </div>
      <div className="calendar-nav">
        <button className="ghost" onClick={() => setMonth(addMonths(month, -1))}>‹ Previous</button>
        <b>{monthName(month)}</b>
        <button className="ghost" onClick={() => setMonth(addMonths(month, 1))}>Next ›</button>
      </div>
      {view === "list" ? (
        <div className="open-list">
          {rows.length ? rows.map((s) => (
            <div className="open-item" key={s.uuid}>
              <div><b>{s.name || "Open shift"}</b><div className="muted">{fmtDate(s.shiftDate)} · {t5(s.startTime)}–{t5(s.endTime)} · {Number(s.totalHours || 0).toFixed(2)} hrs</div></div>
              <button onClick={() => request(s)}>Request Shift</button>
            </div>
          )) : <p className="muted">No open shifts in {monthName(month)}.</p>}
        </div>
      ) : (
        <>
          <div className="calendar-head">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((x) => <div key={x}>{x}</div>)}</div>
          <div className="calendar-scroll">
            <div className="calendar open-month-calendar">
              {Array.from({ length: lead }, (_, i) => <div className="day empty-day" key={`l${i}`} />)}
              {Array.from({ length: days }, (_, i) => {
                const d = i + 1, key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                return (
                  <div className="day" key={key}>
                    <div className="daynum">{d}</div>
                    {rows.filter((s) => s.shiftDate === key).map((s) => (
                      <div className="shift open" key={s.uuid}>
                        <b>{s.name || "Open shift"}</b>
                        <small>{t5(s.startTime)}–{t5(s.endTime)} · {Number(s.totalHours || 0).toFixed(2)}h</small>
                        <button className="ghost" style={{ fontSize: 11, padding: "5px 7px", marginTop: 5 }} onClick={() => request(s)}>Request</button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const weekAgo = () => new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

export function EmployeeShiftTasks() {
  const { me, toast } = useTimeClock();
  const act = useTcAction();
  const shifts = (useTcGetQuery({ path: "/shifts", params: { userId: me.userId, from: weekAgo() } }).data || []) as Shift[];
  const tasks = (useTcGetQuery({ path: "/tasks", params: { shiftUuids: shifts.map((s) => s.uuid).join(",") } }, { skip: !shifts.length }).data || []) as Task[];
  const comps = (useTcGetQuery({ path: "/task-completions", params: { userId: me.userId } }).data || []) as { taskUuid: string; completed: boolean }[];
  const done = new Map(comps.map((c) => [c.taskUuid, c.completed]));
  const setDone = async (t: Task, completed: boolean) => {
    try {
      await act("/task-completions", "PUT", { taskUuid: t.uuid, userId: me.userId, completed });
      toast("Task updated.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <div className="panel">
      <h2>Shift Tasks</h2>
      <p className="muted">Complete tasks assigned to your shifts.</p>
      {tasks.length ? tasks.map((t) => {
        const sh = shifts.find((s) => s.uuid === t.shiftUuid);
        return (
          <div className="open-item" key={t.uuid}>
            <div><b>{t.title}</b><div className="muted">{sh?.name || "Shift"} · {fmtDate(sh?.shiftDate)}</div><p>{t.details || ""}</p></div>
            <label><input type="checkbox" style={{ width: "auto" }} checked={Boolean(done.get(t.uuid))} onChange={(e) => setDone(t, e.target.checked)} /> Done</label>
          </div>
        );
      }) : <p className="muted">No tasks assigned to your upcoming shifts.</p>}
    </div>
  );
}

export function ManagementShiftTasks() {
  const { members, branches, toast, go } = useTimeClock();
  const act = useTcAction();
  const shiftsQ = useTcGetQuery({ path: "/shifts", params: { from: weekAgo() } });
  const tasksQ = useTcGetQuery({ path: "/tasks" });
  const shifts = (shiftsQ.data || []) as Shift[];
  const tasks = (tasksQ.data || []) as Task[];
  const [f, setF] = useState({ shift: "", title: "", details: "" });
  const [busy, setBusy] = useState(false);
  const label = (s: Shift) => {
    const branch = branches.find((b) => b.id === s.branchId)?.name || "Branch not set";
    const emp = members.find((m) => m.userId === s.userId);
    const employee = emp?.fullName || emp?.employeeCode || (s.userId ? "Assigned employee" : "Open / Unassigned");
    return [s.shiftDate || "Date not set", s.startTime && s.endTime ? `${t5(s.startTime)}–${t5(s.endTime)}` : "Time not set", branch, employee, s.name].filter(Boolean).join(" · ");
  };
  const shiftUuid = f.shift || shifts[0]?.uuid || "";
  const add = async () => {
    if (!shiftUuid || !f.title.trim()) return toast("Select a shift and enter a task.");
    setBusy(true);
    try {
      await act("/tasks", "POST", { shiftUuid, title: f.title.trim(), details: f.details.trim() });
      toast("Task assigned.");
      setF({ ...f, title: "", details: "" });
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async (t: Task) => {
    if (!(await tcConfirm("Delete this shift task?", { title: "Delete task", confirmText: "Delete", danger: true }))) return;
    try { await act(`/tasks/${t.uuid}`, "DELETE"); } catch (e) { toast((e as Error).message); }
  };
  const noShifts = !shiftsQ.isLoading && !shifts.length;
  return (
    <div className="tc-two-col" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.15fr)", gap: 16, alignItems: "start" }}>
      <div className="panel">
        <h2 style={{ margin: "0 0 4px" }}>Assign a task</h2>
        <p className="muted" style={{ margin: "0 0 16px" }}>Add a checklist item to a scheduled shift. The employee sees it under Shift Tasks.</p>
        {noShifts ? (
          <div className="notice" style={{ margin: 0 }}>
            <b>No upcoming shifts yet.</b> Tasks are attached to a scheduled shift, so create a shift first.
            <div style={{ marginTop: 10 }}><button className="secondary" onClick={() => go("scheduling")}>Go to Scheduling</button></div>
          </div>
        ) : (
          <>
            <div className="field"><label>Shift</label>
              <select value={shiftUuid} disabled={shiftsQ.isLoading} onChange={(e) => setF({ ...f, shift: e.target.value })}>
                {shiftsQ.isLoading ? <option value="">Loading shifts…</option> : shifts.map((s) => <option key={s.uuid} value={s.uuid}>{label(s)}</option>)}
              </select>
            </div>
            <div className="field"><label>Task</label><input placeholder="e.g. Prepare meeting room" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
            <div className="field"><label>Instructions (optional)</label><textarea rows={3} placeholder="Anything the employee should know" value={f.details} onChange={(e) => setF({ ...f, details: e.target.value })} /></div>
            <div className="actions" style={{ justifyContent: "flex-end" }}>
              <button disabled={busy || !shiftUuid || !f.title.trim()} onClick={add}>{busy ? "Assigning…" : "Assign Task"}</button>
            </div>
          </>
        )}
      </div>

      <div className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Assigned tasks</h2>
          <span className="pill">{tasks.length}</span>
        </div>
        {tasksQ.isLoading ? (
          <p className="muted" style={{ margin: 0 }}>Loading tasks…</p>
        ) : tasks.length ? (
          <div className="open-list">
            {tasks.map((t) => {
              const sh = shifts.find((s) => s.uuid === t.shiftUuid);
              return (
                <div className="open-item" key={t.uuid} style={{ alignItems: "flex-start" }}>
                  <div style={{ minWidth: 0 }}>
                    <b>{t.title}</b>
                    <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>{sh ? label(sh) : "Past or removed shift"}</div>
                    {t.details && <p style={{ margin: "6px 0 0", fontSize: 13 }}>{t.details}</p>}
                  </div>
                  <button className="ghost" onClick={() => remove(t)} style={{ color: "var(--danger)", borderColor: "#f1c4c0", flex: "0 0 auto" }}>Delete</button>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "26px 10px" }}>
            <p style={{ margin: "0 0 4px", fontWeight: 700, color: "var(--navy)" }}>No tasks assigned yet</p>
            <p className="muted" style={{ margin: 0 }}>Tasks you assign to shifts will be listed here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
