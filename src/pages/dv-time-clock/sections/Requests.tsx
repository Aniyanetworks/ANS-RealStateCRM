// Approvals (management), My Requests (employee self-service) and Availability.
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useLazyTcGetQuery, useTcGetQuery } from "../../../redux/api/common/dvTimeClockSlice";
import { nameOf, useCan, useTcAction, useTimeClock } from "../TimeClockContext";
import { Attendance, Shift, TcRequest, fmtDate, localInputDateTime, overlaps, requestPayload, todayKey } from "../tcUtils";
import { tcConfirm, tcPrompt } from "../tcDialog";

type ShiftRequest = { uuid: string; shiftUuid: string; userId: number; status: string; createdAt: string };
type Offsite = { uuid: string; userId: number; reason: string; status: string; createdAt: string };
type Availability = { uuid: string; userId: number; availabilityType: string; startDate: string; endDate: string; startTime: string | null; endTime: string | null; notes: string | null; status: string };

/** Short description of a request (the original's requestDetailsText). */
export function requestDetailsText(r: TcRequest, shifts: Shift[] = [], nameFor: (id: number) => string = (id) => String(id)) {
  const d = requestPayload(r.details) as Record<string, string>;
  const shiftLabel = (uuid: string) => {
    const s = shifts.find((x) => x.uuid === uuid);
    return s ? `${s.shiftDate} ${s.startTime.slice(0, 5)}–${s.endTime.slice(0, 5)}` : uuid;
  };
  if (d.kind === "Time Off" || d.kind === "Availability Update") return `${d.start_date || ""} through ${d.end_date || ""} · ${d.reason || ""}`;
  if (d.kind === "Shift Swap") return `Exchange requested shift ${shiftLabel(d.shift_id)} with ${nameFor(Number(d.target_employee_id))} shift ${shiftLabel(d.target_shift_id)}${d.reason ? ` · ${d.reason}` : ""}`;
  if (d.kind === "Attendance Correction") return `Requested clock-in ${d.correct_clock_in ? new Date(d.correct_clock_in).toLocaleString() : ""}; clock-out ${d.correct_clock_out ? new Date(d.correct_clock_out).toLocaleString() : "not specified"} · ${d.reason || ""}`;
  if (d.kind) return d.reason || String(r.details || "");
  return typeof r.details === "string" ? r.details : d.text || "";
}

function LateClockoutCard({ r }: { r: TcRequest }) {
  const d = requestPayload(r.details) as Record<string, string>;
  const actual = d.actual_clock_out ? new Date(d.actual_clock_out) : null, scheduled = d.scheduled_end ? new Date(d.scheduled_end) : null;
  const late = actual && scheduled ? Math.max(0, Math.floor((+actual - +scheduled) / 60000)) : null;
  const extra = late === null ? Number(d.extra_minutes || 0) : Math.max(0, late - 10);
  const when = (x: Date | null) => (x && !Number.isNaN(x.getTime()) ? x.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—");
  return (
    <div className="request-detail-card">
      <b>Late Clock-out Approval</b>
      <div className="request-detail-grid">
        <span>Scheduled end</span><strong>{when(scheduled)}</strong>
        <span>Actual clock-out</span><strong>{when(actual)}</strong>
        <span>Late by</span><strong>{late === null ? "—" : `${late} minutes`}</strong>
        <span>Extra time requested (after 10-minute grace)</span><strong>{extra} minutes</strong>
        <span>Employee reason</span><strong>{d.reason || "Not provided"}</strong>
      </div>
      <small className="muted">Extra time is added to payable hours only after approval.</small>
    </div>
  );
}

function EditRequestForm({ r }: { r: TcRequest }) {
  const { toast, closeModal } = useTimeClock();
  const act = useTcAction();
  const [f, setF] = useState({ requestType: r.requestType || "", subject: r.subject || "", details: typeof r.details === "string" ? r.details : JSON.stringify(r.details ?? ""), requestedDate: r.requestedDate || "", status: r.status, managementNote: r.managementNote || "" });
  const save = async () => {
    if (!f.subject.trim() || !f.details.trim()) return toast("Subject and details are required.");
    try {
      await act(`/requests/${r.uuid}`, "PATCH", { requestType: f.requestType.trim(), subject: f.subject.trim(), details: f.details.trim(), requestedDate: f.requestedDate || null, status: f.status, managementNote: f.managementNote.trim() });
      closeModal();
      toast("Employee request updated.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <>
      <div className="formgrid">
        <div className="field"><label>Request type</label><input value={f.requestType} onChange={(e) => setF({ ...f, requestType: e.target.value })} /></div>
        <div className="field"><label>Subject</label><input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /></div>
        <div className="field span3"><label>Details</label><textarea value={f.details} onChange={(e) => setF({ ...f, details: e.target.value })} /></div>
        <div className="field"><label>Requested date</label><input type="date" value={f.requestedDate} onChange={(e) => setF({ ...f, requestedDate: e.target.value })} /></div>
        <div className="field"><label>Status</label>
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="field span3"><label>Management note</label><textarea value={f.managementNote} onChange={(e) => setF({ ...f, managementNote: e.target.value })} /></div>
      </div>
      <button onClick={save}>Save Changes</button>
    </>
  );
}

export function ApprovalsSection() {
  const { me, members, toast, openModal } = useTimeClock();
  const can = useCan();
  const act = useTcAction();
  const [fetchTc] = useLazyTcGetQuery();
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const shiftReqs = (useTcGetQuery({ path: "/shift-requests" }, { pollingInterval: 30000 }).data || []) as ShiftRequest[];
  const shifts = (useTcGetQuery({ path: "/shifts" }, { pollingInterval: 30000 }).data || []) as Shift[];
  const offsite = (useTcGetQuery({ path: "/offsite" }, { pollingInterval: 30000 }).data || []) as Offsite[];
  const empReqs = (useTcGetQuery({ path: "/requests" }, { pollingInterval: 30000 }).data || []) as TcRequest[];
  const allowed = me.role === "superadmin" || can("approvals.manage") || can("offsite.approve") || can("requests.edit");
  const nm = (id: number) => nameOf(members, id);
  const shiftOf = (uuid: string) => shifts.find((s) => s.uuid === uuid);
  const count = (st: string) => [shiftReqs, offsite, empReqs].reduce((n, list) => n + list.filter((x: { status: string }) => x.status === st).length, 0);
  const matches = (...parts: unknown[]) => !search || parts.join(" ").toLowerCase().includes(search.toLowerCase());

  const get = async <T,>(path: string, params?: Record<string, string | number>) => ((await fetchTc({ path, params }, false).unwrap()) || []) as T;

  const reviewShift = async (r: ShiftRequest, status: string) => {
    try {
      await act(`/shift-requests/${r.uuid}/review`, "POST", { status });
      toast(status === "approved" ? "Request approved." : "Request rejected.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  const reviewOffsite = async (r: Offsite, status: string) => {
    if (!can("offsite.approve") && !can("approvals.manage")) return toast("Permission denied.");
    try {
      await act(`/offsite/${r.uuid}/review`, "POST", { status });
      toast(`Offsite request ${status}.`);
    } catch (e) {
      toast((e as Error).message);
    }
  };
  /** The original's reviewEmployeeRequest: swaps, late clock-out time and attendance corrections are applied on approval. */
  const reviewEmployee = async (r: TcRequest, status: string) => {
    const p = requestPayload(r.details) as Record<string, string>;
    try {
      if (status === "approved" && p.kind === "Shift Swap") {
        if (!p.shift_id || !p.target_employee_id || !p.target_shift_id) return toast("Swap request is missing one of the shifts or employee details.");
        if (!(await tcConfirm("Approve and exchange the two shift assignments?", { title: "Approve shift swap", confirmText: "Approve swap" }))) return;
        const both = await get<Shift[]>("/shifts", { uuids: `${p.shift_id},${p.target_shift_id}` });
        const own = both.find((s) => s.uuid === p.shift_id), other = both.find((s) => s.uuid === p.target_shift_id);
        if (!own || !other) return toast("One of the shifts no longer exists.");
        if (own.userId !== r.userId || other.userId !== Number(p.target_employee_id)) return toast("One of the shifts has changed since the request. Refresh and review before approving.");
        const receiverDay = await get<Shift[]>("/shifts", { userId: Number(p.target_employee_id), from: own.shiftDate, to: own.shiftDate });
        if (overlaps(own, receiverDay, other.uuid)) return toast("Swap blocked: the receiving employee already has an overlapping shift.");
        const requesterDay = await get<Shift[]>("/shifts", { userId: r.userId, from: other.shiftDate, to: other.shiftDate });
        if (overlaps(other, requesterDay, own.uuid)) return toast("Swap blocked: the requesting employee already has an overlapping shift.");
        await act(`/shifts/${own.uuid}`, "PATCH", { userId: Number(p.target_employee_id) });
        try {
          await act(`/shifts/${other.uuid}`, "PATCH", { userId: r.userId });
        } catch (e) {
          await act(`/shifts/${own.uuid}`, "PATCH", { userId: r.userId });
          return toast(`Second shift update failed; attempted to restore the first assignment: ${(e as Error).message}`);
        }
      }
      if (status === "approved" && p.kind === "Late Clock-out Approval") {
        if (!p.attendance_id || !(Number(p.extra_minutes) > 0)) return toast("Late clock-out approval request is incomplete.");
        const rows = await get<Attendance[]>("/attendance", { userId: r.userId });
        const att = rows.find((a) => a.uuid === p.attendance_id);
        if (!att) return toast("Attendance record not found.");
        if (!att.clockOut) return toast("The attendance entry is still open.");
        const actualOut = p.actual_clock_out ? new Date(p.actual_clock_out) : new Date(att.clockOut);
        const scheduledEnd = p.scheduled_end ? new Date(p.scheduled_end) : null;
        const eligible = scheduledEnd && !Number.isNaN(actualOut.getTime()) ? Math.max(0, Math.floor((+actualOut - +scheduledEnd) / 60000) - 10) : Number(p.extra_minutes);
        if (!Number.isFinite(eligible) || eligible <= 0) return toast("No payable extra minutes are eligible after the 10-minute grace period.");
        const approvedHours = Number(p.base_payable_hours ?? att.payableHours ?? 0) + eligible / 60;
        await act(`/attendance/${att.uuid}`, "PATCH", { payableHours: Number(approvedHours.toFixed(4)), lateExtraMinutes: eligible, lateExtraApproved: true });
      }
      if (status === "approved" && p.kind === "Attendance Correction") {
        if (!p.attendance_id || !p.correct_clock_in) return toast("Correction request is missing attendance details.");
        if (!(await tcConfirm("Apply the employee’s requested clock-in/clock-out correction?", { title: "Apply correction", confirmText: "Apply" }))) return;
        await act(`/attendance/${p.attendance_id}`, "PATCH", { clockIn: p.correct_clock_in, clockOut: p.correct_clock_out || null });
      }
      // As before: skipping the note still completes the review (any swap or correction above is already applied).
      const note = (await tcPrompt("Add an optional note for the employee.", { title: "Note for employee", placeholder: "Note (optional)", multiline: true, confirmText: "Save", cancelText: "No note" })) || "";
      await act(`/requests/${r.uuid}`, "PATCH", { status, managementNote: note });
      toast(`Request ${status}.`);
    } catch (e) {
      toast((e as Error).message);
    }
  };
  const del = async (path: string, label: string) => {
    if (!(await tcConfirm(`Permanently delete this ${label}? This cannot be undone.`, { title: `Delete ${label}`, confirmText: "Delete", danger: true }))) return;
    try {
      await act(path, "DELETE");
      toast(`${label.charAt(0).toUpperCase()}${label.slice(1)} deleted.`);
    } catch (e) {
      toast((e as Error).message);
    }
  };

  if (!allowed) return <div className="panel"><h2>Approvals</h2><p className="notice">Permission denied.</p></div>;
  const pendingButtons = (onApprove: () => void, onReject: () => void) => (
    <><button className="tc-btn-sm" onClick={onApprove}>Approve</button><button className="tc-btn-sm tc-btn-outline-danger" onClick={onReject}>Reject</button></>
  );
  const statusPill = (s: string) => <span className={`tc-status tc-status-${s}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
  // One card per request type; a type with nothing in this tab collapses to a single line.
  const group = (title: string, hint: string, n: number, emptyText: string, table: ReactNode) => (
    <section className={`tc-group${n ? "" : " tc-group-empty"}`}>
      <div className="tc-group-head">
        <div><h3>{title}</h3>{n > 0 && <p className="muted">{hint}</p>}</div>
        <span className="tc-count">{n}</span>
      </div>
      {n ? <div className="tablewrap" style={{ marginTop: 0 }}>{table}</div> : <p className="muted tc-group-none">{emptyText}</p>}
    </section>
  );
  const empRows = empReqs.filter((r) => r.status === tab && matches(nm(r.userId), r.requestType, r.subject, requestDetailsText(r, shifts, nm), r.requestedDate, r.status));
  const shiftRows = shiftReqs.filter((r) => r.status === tab && matches(nm(r.userId), shiftOf(r.shiftUuid)?.name, shiftOf(r.shiftUuid)?.shiftDate, r.status));
  const offRows = offsite.filter((r) => r.status === tab && matches(nm(r.userId), r.reason, r.status));

  return (
    <div className="panel">
      <h2 style={{ margin: "0 0 4px" }}>Approvals</h2>
      <p className="muted" style={{ margin: "0 0 16px" }}>Pending requests need action. Approved and rejected requests stay in their own tabs.</p>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <div className="tc-seg" role="tablist" aria-label="Approval status">
          {(["pending", "approved", "rejected"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span className="tc-count">{count(t)}</span>
            </button>
          ))}
        </div>
        <label className="tc-search">
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" aria-label="Search approvals" placeholder="Search employee, request, shift, date…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
      </div>
      {!empRows.length && !shiftRows.length && !offRows.length ? (
        <div className="tc-empty">
          <p style={{ margin: "0 0 4px", fontWeight: 700, color: "var(--navy)" }}>{search ? "No matching requests" : `No ${tab} approvals`}</p>
          <p className="muted" style={{ margin: 0 }}>
            {search ? "Try a different search." : tab === "pending" ? "You're all caught up. New employee, shift and offsite requests will appear here." : `${tab.charAt(0).toUpperCase() + tab.slice(1)} requests will be listed here.`}
          </p>
        </div>
      ) : (
        <>
          {group("Employee Requests", "Time off, availability, swaps, corrections and late clock-outs.", empRows.length, `No ${tab} employee requests.`,
            <table className="table">
              <thead><tr><th>Employee</th><th>Type</th><th>Subject / Details</th><th>Date</th><th>Status</th><th style={{ textAlign: "right" }}>Action</th></tr></thead>
              <tbody>
                {empRows.map((r) => (
                  <tr key={r.uuid}>
                    <td><b>{nm(r.userId)}</b></td>
                    <td><span className="pill">{r.requestType || "Request"}</span></td>
                    <td><b>{r.subject}</b>{requestPayload(r.details).kind === "Late Clock-out Approval" ? <LateClockoutCard r={r} /> : <div className="muted">{requestDetailsText(r, shifts, nm)}</div>}{r.managementNote && <div className="muted">Note: {r.managementNote}</div>}</td>
                    <td>{r.requestedDate || "—"}</td>
                    <td>{statusPill(r.status)}</td>
                    <td><div className="tc-row-actions">
                      {r.status === "pending" && pendingButtons(() => reviewEmployee(r, "approved"), () => reviewEmployee(r, "rejected"))}
                      {can("requests.edit") && <button className="tc-btn-sm tc-btn-outline" onClick={() => openModal("Edit Employee Request", <EditRequestForm r={r} />)}>Edit</button>}
                      {can("requests.delete") && <button className="tc-btn-sm tc-btn-outline-danger" onClick={() => del(`/requests/${r.uuid}`, "employee request")}>Delete</button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>)}
          {group("Shift Requests", "Employees asking to take an open shift.", shiftRows.length, `No ${tab} shift requests.`,
            <table className="table">
              <thead><tr><th>Date</th><th>Employee</th><th>Shift</th><th>Status</th><th style={{ textAlign: "right" }}>Action</th></tr></thead>
              <tbody>
                {shiftRows.map((r) => {
                  const sh = shiftOf(r.shiftUuid);
                  return (
                    <tr key={r.uuid}>
                      <td>{fmtDate(sh?.shiftDate)}</td>
                      <td><b>{nm(r.userId)}</b></td>
                      <td>{sh?.name || "—"}{sh?.startTime && <div className="muted">{sh.startTime.slice(0, 5)}–{sh.endTime?.slice(0, 5)}</div>}</td>
                      <td>{statusPill(r.status)}</td>
                      <td><div className="tc-row-actions">
                        {r.status === "pending" && pendingButtons(() => reviewShift(r, "approved"), () => reviewShift(r, "rejected"))}
                        {can("approvals.manage") && r.status !== "pending" && <button className="tc-btn-sm tc-btn-outline-danger" onClick={() => del(`/shift-requests/${r.uuid}`, "shift approval request")}>Delete</button>}
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>)}
          {group("Offsite Clock-in Requests", "Requests to clock in away from the assigned branch.", offRows.length, `No ${tab} offsite clock-in requests.`,
            <table className="table">
              <thead><tr><th>Employee</th><th>Reason</th><th>Requested</th><th>Status</th><th style={{ textAlign: "right" }}>Action</th></tr></thead>
              <tbody>
                {offRows.map((r) => (
                  <tr key={r.uuid}>
                    <td><b>{nm(r.userId)}</b></td>
                    <td>{r.reason}</td>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                    <td>{statusPill(r.status)}</td>
                    <td><div className="tc-row-actions">
                      {r.status === "pending" && pendingButtons(() => reviewOffsite(r, "approved"), () => reviewOffsite(r, "rejected"))}
                      {can("approvals.manage") && r.status !== "pending" && <button className="tc-btn-sm tc-btn-outline-danger" onClick={() => del(`/offsite/${r.uuid}`, "offsite clock-in request")}>Delete</button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>)}
        </>
      )}
    </div>
  );
}

// ---------- My Requests (employee) ----------

function NewRequestForm() {
  const { me, members, toast, closeModal } = useTimeClock();
  const act = useTcAction();
  const today = todayKey();
  const myShifts = (useTcGetQuery({ path: "/shifts", params: { userId: me.userId, from: today } }).data || []) as Shift[];
  const allShifts = (useTcGetQuery({ path: "/shifts", params: { from: today } }).data || []) as Shift[];
  const myAttendance = (useTcGetQuery({ path: "/attendance", params: { userId: me.userId, limit: 100 } }).data || []) as Attendance[];
  const colleagues = members.filter((m) => m.isEmployee && m.userId !== me.userId && m.active !== false);
  const [type, setType] = useState("Time Off");
  const [f, setF] = useState({ start: "", end: "", reason: "", shift: "", swapWith: "", targetShift: "", attendance: "", correctIn: "", correctOut: "", subject: "" });
  const targetShifts = allShifts.filter((s) => String(s.userId) === f.swapWith);
  useEffect(() => {
    const a = myAttendance.find((x) => x.uuid === f.attendance);
    if (a) setF((x) => ({ ...x, correctIn: localInputDateTime(a.clockIn), correctOut: a.clockOut ? localInputDateTime(a.clockOut) : "" }));
  }, [f.attendance]); // eslint-disable-line react-hooks/exhaustive-deps
  const label = (s: Shift) => `${s.shiftDate} · ${s.startTime.slice(0, 5)}–${s.endTime.slice(0, 5)} · ${s.name || "Shift"}`;
  const submit = async () => {
    let subject = type, requestedDate: string | null = null, payload: Record<string, unknown> = { kind: type };
    const reason = f.reason.trim();
    if (type === "Time Off" || type === "Availability Update") {
      if (!f.start || !f.end || f.end < f.start || !reason) return toast("Enter a valid date range and reason.");
      payload = { kind: type, start_date: f.start, end_date: f.end, reason };
      requestedDate = f.start;
      subject = type === "Time Off" ? `Time off: ${f.start} to ${f.end}` : `Availability: ${f.start} to ${f.end}`;
    } else if (type === "Shift Swap") {
      if (!f.shift || !f.swapWith || !f.targetShift) return toast("Select both shifts and the employee to swap with.");
      payload = { kind: type, shift_id: f.shift, target_employee_id: Number(f.swapWith), target_shift_id: f.targetShift, reason };
      requestedDate = myShifts.find((x) => x.uuid === f.shift)?.shiftDate || null;
      subject = "Shift swap request";
    } else if (type === "Attendance Correction") {
      if (!f.attendance || !f.correctIn || !reason) return toast("Select an entry, corrected clock-in, and reason.");
      if (f.correctOut && new Date(f.correctOut) <= new Date(f.correctIn)) return toast("Clock-out must be after clock-in.");
      payload = { kind: type, attendance_id: f.attendance, correct_clock_in: new Date(f.correctIn).toISOString(), correct_clock_out: f.correctOut ? new Date(f.correctOut).toISOString() : null, reason };
      requestedDate = f.correctIn.slice(0, 10);
      subject = "Attendance correction request";
    } else {
      subject = f.subject.trim();
      payload = { kind: type, reason };
      if (!subject || !reason) return toast("Enter a subject and details.");
    }
    try {
      await act("/requests", "POST", { userId: me.userId, requestType: type, subject, details: JSON.stringify(payload), requestedDate });
      closeModal();
      toast("Request submitted for management review.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <>
      <div className="field"><label>Request type</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="Time Off">Time Off / Vacation</option><option value="Availability Update">Availability</option><option value="Shift Swap">Shift Swap</option>
          <option value="Attendance Correction">Attendance Correction</option><option value="Other">Other Request</option>
        </select>
      </div>
      {(type === "Time Off" || type === "Availability Update") && (
        <>
          <div className="formgrid">
            <div className="field"><label>Start date *</label><input type="date" required value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></div>
            <div className="field"><label>End date *</label><input type="date" required value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></div>
          </div>
          <div className="field"><label>Reason / availability details *</label><textarea rows={3} placeholder="Add details for management" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></div>
        </>
      )}
      {type === "Shift Swap" && (
        <>
          <div className="field"><label>Your scheduled shift *</label>
            <select value={f.shift} onChange={(e) => setF({ ...f, shift: e.target.value })}>
              <option value="">Select shift</option>
              {myShifts.map((s) => <option key={s.uuid} value={s.uuid}>{label(s)}</option>)}
            </select>
          </div>
          <div className="field"><label>Request swap with employee *</label>
            <select value={f.swapWith} onChange={(e) => setF({ ...f, swapWith: e.target.value, targetShift: "" })}>
              <option value="">Select employee</option>
              {colleagues.map((e) => <option key={e.userId} value={e.userId}>{e.fullName || e.employeeCode || "Employee"}</option>)}
            </select>
          </div>
          <div className="field"><label>Their shift *</label>
            <select value={f.targetShift} onChange={(e) => setF({ ...f, targetShift: e.target.value })}>
              <option value="">Select shift</option>
              {targetShifts.map((s) => <option key={s.uuid} value={s.uuid}>{label(s)}</option>)}
            </select>
          </div>
          <div className="field"><label>Reason / details</label><textarea rows={3} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></div>
          <p className="muted">The shift will not change unless management approves.</p>
        </>
      )}
      {type === "Attendance Correction" && (
        <>
          <div className="field"><label>Attendance entry *</label>
            <select value={f.attendance} onChange={(e) => setF({ ...f, attendance: e.target.value })}>
              <option value="">Select entry</option>
              {myAttendance.map((a) => <option key={a.uuid} value={a.uuid}>{new Date(a.clockIn).toLocaleString()} · {a.clockOut ? new Date(a.clockOut).toLocaleTimeString() : "Still open"}</option>)}
            </select>
          </div>
          <div className="formgrid">
            <div className="field"><label>Correct clock-in *</label><input type="datetime-local" value={f.correctIn} onChange={(e) => setF({ ...f, correctIn: e.target.value })} /></div>
            <div className="field"><label>Correct clock-out (optional)</label><input type="datetime-local" value={f.correctOut} onChange={(e) => setF({ ...f, correctOut: e.target.value })} /></div>
          </div>
          <div className="field"><label>Reason for correction *</label><textarea rows={3} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></div>
          <p className="muted">Management reviews and applies approved corrections.</p>
        </>
      )}
      {type === "Other" && (
        <>
          <div className="field"><label>Subject *</label><input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /></div>
          <div className="field"><label>Details *</label><textarea rows={4} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></div>
        </>
      )}
      <div className="actions"><button onClick={submit}>Submit Request</button><button className="ghost" onClick={closeModal}>Cancel</button></div>
    </>
  );
}

export function MyRequests() {
  const { me, members, openModal } = useTimeClock();
  const act = useTcAction();
  const q = useTcGetQuery({ path: "/requests", params: { userId: me.userId, mine: 1 } }, { pollingInterval: 30000 });
  const rows = useMemo(() => (q.data || []) as TcRequest[], [q.data]);
  const shifts = (useTcGetQuery({ path: "/shifts", params: { userId: me.userId } }).data || []) as Shift[];
  const [search, setSearch] = useState("");
  // Seeing the list marks decided requests as read (clears the badge), as in the original.
  useEffect(() => {
    const unseen = rows.filter((r) => r.status !== "pending" && !r.employeeSeenAt).map((r) => r.uuid);
    if (unseen.length) act("/requests/seen", "POST", { uuids: unseen }).catch(() => undefined);
  }, [rows, act]);
  const nm = (id: number) => nameOf(members, id);
  const shown = rows.filter((r) => !search || [r.requestType, r.subject, requestDetailsText(r, shifts, nm), r.status, r.managementNote].join(" ").toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="panel">
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <div><h2>My Requests</h2><p className="muted">Submit time off, shift changes, schedule changes, or another request.</p></div>
        <button onClick={() => openModal("Employee Self-Service Request", <NewRequestForm />)}>＋ New Request</button>
      </div>
      <div className="field"><label>Search my requests</label><input type="search" placeholder="Search type, subject, details, status..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <div className="tablewrap">
        <table className="table">
          <thead><tr><th>Type</th><th>Subject</th><th>Details</th><th>Date</th><th>Status</th><th>Management Note</th></tr></thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.uuid}>
                <td>{r.requestType}</td><td>{r.subject}</td><td>{requestDetailsText(r, shifts, nm)}</td><td>{r.requestedDate || "—"}</td><td>{r.status}</td><td>{r.managementNote || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Availability ----------

function AvailabilityForm() {
  const { me, members, isEmployeeView, toast, closeModal } = useTimeClock();
  const act = useTcAction();
  const employees = members.filter((m) => m.isEmployee);
  const [f, setF] = useState({ userId: String(employees[0]?.userId || ""), type: "available", start: "", end: "", st: "", en: "", notes: "" });
  const save = async () => {
    if (!f.start || !f.end || f.end < f.start) return toast("Enter a valid date range.");
    if ((f.st && !f.en) || (!f.st && f.en)) return toast("Enter both times or leave both blank.");
    const userId = isEmployeeView ? me.userId : Number(f.userId);
    if (!userId) return toast("Select an employee.");
    try {
      await act("/availability", "POST", { userId, availabilityType: f.type, startDate: f.start, endDate: f.end, startTime: f.st || null, endTime: f.en || null, notes: f.notes.trim() || null });
      closeModal();
      toast("Availability submitted for management review.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <>
      {!isEmployeeView && (
        <div className="field span3"><label>Employee</label>
          <select value={f.userId} onChange={(e) => setF({ ...f, userId: e.target.value })}>
            {employees.map((e) => <option key={e.userId} value={e.userId}>{e.fullName || e.employeeCode || e.userId}</option>)}
          </select>
        </div>
      )}
      <div className="formgrid">
        <div className="field"><label>Availability Type</label>
          <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="available">Available to work</option><option value="unavailable">Unavailable</option></select>
        </div>
        <div className="field"><label>Start Date</label><input type="date" required value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></div>
        <div className="field"><label>End Date</label><input type="date" required value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></div>
        <div className="field"><label>Start Time (optional)</label><input type="time" value={f.st} onChange={(e) => setF({ ...f, st: e.target.value })} /></div>
        <div className="field"><label>End Time (optional)</label><input type="time" value={f.en} onChange={(e) => setF({ ...f, en: e.target.value })} /></div>
        <div className="field span3"><label>Notes</label><textarea placeholder="Optional details" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
      </div>
      <div className="actions"><button onClick={save}>Submit Availability</button><button className="ghost" onClick={closeModal}>Cancel</button></div>
    </>
  );
}

export function AvailabilitySection() {
  const { me, members, isEmployeeView, toast, openModal } = useTimeClock();
  const act = useTcAction();
  const q = useTcGetQuery({ path: "/availability", params: isEmployeeView ? { userId: me.userId, mine: 1 } : {} }, { pollingInterval: 30000 });
  const rows = (q.data || []) as Availability[];
  const review = async (a: Availability, status: string) => {
    try {
      await act(`/availability/${a.uuid}/review`, "POST", { status });
      toast(`Availability ${status}.`);
    } catch (e) {
      toast((e as Error).message);
    }
  };
  const times = (a: Availability) => `${a.startTime || "Any"} – ${a.endTime || "Any"}`;
  if (isEmployeeView) {
    return (
      <div className="panel">
        <div className="actions" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div><h2>My Availability</h2><p className="muted">Submit dates and times when you are available or unavailable. Management can review your entries.</p></div>
          <button onClick={() => openModal("Add Availability", <AvailabilityForm />)}>＋ Add Availability</button>
        </div>
        <div className="tablewrap">
          <table className="table">
            <thead><tr><th>Type</th><th>Dates</th><th>Time</th><th>Notes</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.uuid}>
                  <td>{a.availabilityType}</td><td>{fmtDate(a.startDate)} – {fmtDate(a.endDate)}</td><td>{times(a)}</td><td>{a.notes || ""}</td>
                  <td><span className={`pill ${a.status === "approved" ? "green" : a.status === "rejected" ? "" : "gold"}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  return (
    <div className="panel">
      <div className="actions" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div><h2>Employee Availability</h2><p className="muted">Review submissions or enter availability on behalf of an employee.</p></div>
        <button onClick={() => openModal("Add Availability", <AvailabilityForm />)}>＋ Add Availability</button>
      </div>
      <div className="tablewrap">
        <table className="table">
          <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Time</th><th>Notes</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.uuid}>
                <td>{nameOf(members, a.userId)}</td><td>{a.availabilityType}</td><td>{fmtDate(a.startDate)} – {fmtDate(a.endDate)}</td><td>{times(a)}</td><td>{a.notes || ""}</td><td>{a.status}</td>
                <td>{a.status === "pending" ? <><button onClick={() => review(a, "approved")}>Approve</button> <button className="danger" onClick={() => review(a, "rejected")}>Reject</button></> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
