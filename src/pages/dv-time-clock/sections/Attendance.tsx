// Attendance & Reports: filterable daily attendance report (print/PDF, CSV), manual hours, corrections.
import { useMemo, useState } from "react";
import { useTcGetQuery } from "../../../redux/api/common/dvTimeClockSlice";
import { useCan, useTcAction, useTimeClock } from "../TimeClockContext";
import logo from "../../../assets/dv-time-clock-logo.svg";
import { Attendance, attendanceReportHours, csvCell, downloadText, fmtDate, localDateKey, localInputDateTime, todayKey } from "../tcUtils";
import { tcConfirm } from "../tcDialog";

const prefKey = (userId: number, which: string) => `dv-attendance-report-${userId}-${which}`;
const readPref = (userId: number, which: string) => {
  try { return localStorage.getItem(prefKey(userId, which)) || todayKey(); } catch { return todayKey(); }
};
const timeOf = (v: string | null) => (v ? new Date(v).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : null);

type ManualRow = { clockIn: string; clockOut: string; note: string };

function AddHoursForm() {
  const { members, branches, toast, closeModal } = useTimeClock();
  const act = useTcAction();
  const employees = members.filter((m) => m.isEmployee);
  const [userId, setUserId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [rows, setRows] = useState<ManualRow[]>([{ clockIn: localInputDateTime(new Date()), clockOut: "", note: "" }]);
  const setRow = (i: number, patch: Partial<ManualRow>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const save = async () => {
    if (!userId || !branchId) return toast("Employee and branch are required.");
    if (!rows.length) return toast("Add at least one shift.");
    const records = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.clockIn) return toast(`Clock-in is required for shift ${i + 1}.`);
      if (r.clockOut && new Date(r.clockOut) <= new Date(r.clockIn)) return toast(`Clock-out must be after clock-in for shift ${i + 1}.`);
      records.push({ userId: Number(userId), branchId: Number(branchId), clockIn: new Date(r.clockIn).toISOString(), clockOut: r.clockOut ? new Date(r.clockOut).toISOString() : null, notes: r.note.trim() || "Manual attendance entry by management." });
    }
    try {
      await act("/attendance", "POST", { records });
      closeModal();
      toast(`${records.length} attendance shift(s) added.`);
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <>
      <div className="formgrid">
        <div className="field"><label>Employee *</label>
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Select employee</option>
            {employees.map((e) => <option key={e.userId} value={e.userId}>{e.fullName || e.employeeCode || e.userId}</option>)}
          </select>
        </div>
        <div className="field"><label>Branch *</label>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">Select branch</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>
      <p className="muted">Add multiple separate worked shifts for the same employee and date. Each shift is saved as its own attendance record.</p>
      {rows.map((r, i) => (
        <div key={i} className="manual-shift-row" style={{ border: "1px solid #dfe4ec", borderRadius: 10, padding: 12, margin: "10px 0" }}>
          <b>{i === 0 ? "Shift 1" : "Additional Shift"}</b>
          <div className="formgrid">
            <div className="field"><label>Clock In *</label><input type="datetime-local" required value={r.clockIn} onChange={(e) => setRow(i, { clockIn: e.target.value })} /></div>
            <div className="field"><label>Clock Out</label><input type="datetime-local" value={r.clockOut} onChange={(e) => setRow(i, { clockOut: e.target.value })} /></div>
            <div className="field"><label>Shift note (optional)</label><input placeholder="Reason / details" value={r.note} onChange={(e) => setRow(i, { note: e.target.value })} /></div>
          </div>
          {i > 0 && <button type="button" className="danger" onClick={() => setRows((x) => x.filter((_, j) => j !== i))}>Remove Shift</button>}
        </div>
      ))}
      <button type="button" className="ghost" onClick={() => setRows((x) => [...x, { clockIn: "", clockOut: "", note: "" }])}>＋ Add Another Shift</button>{" "}
      <button onClick={save}>Save All Employee Hours</button>
    </>
  );
}

export function EditAttendanceForm({ a }: { a: Attendance }) {
  const { branches, toast, closeModal } = useTimeClock();
  const can = useCan();
  const act = useTcAction();
  const [branchId, setBranchId] = useState(a.branchId ? String(a.branchId) : "");
  const [cin, setCin] = useState(a.clockIn ? localInputDateTime(a.clockIn) : "");
  const [cout, setCout] = useState(a.clockOut ? localInputDateTime(a.clockOut) : "");
  const [note, setNote] = useState(a.notes || "");
  const save = async () => {
    if (!cin) return toast("Clock-in time is required.");
    if (cout && new Date(cout) <= new Date(cin)) return toast("Clock-out must be after clock-in.");
    if (!branchId) return toast("Branch is required.");
    if (!note.trim()) return toast("A reason is required for every clock time correction.");
    try {
      await act(`/attendance/${a.uuid}`, "PATCH", { branchId: Number(branchId), clockIn: new Date(cin).toISOString(), clockOut: cout ? new Date(cout).toISOString() : null, notes: note.trim() });
      closeModal();
      toast("Attendance corrected.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  const remove = async () => {
    if (!(await tcConfirm("Permanently delete this attendance record? This cannot be undone.", { title: "Delete attendance record", confirmText: "Delete", danger: true }))) return;
    try {
      await act(`/attendance/${a.uuid}`, "DELETE");
      closeModal();
      toast("Attendance record deleted.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <>
      <div className="formgrid">
        <div className="field"><label>Branch *</label>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">Select branch</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="field"><label>Clock In</label><input type="datetime-local" value={cin} onChange={(e) => setCin(e.target.value)} /></div>
        <div className="field"><label>Clock Out</label><input type="datetime-local" value={cout} onChange={(e) => setCout(e.target.value)} /></div>
        <div className="field span3"><label>Reason for correction *</label><textarea required placeholder="Explain why the clock time is being corrected." value={note} onChange={(e) => setNote(e.target.value)} /></div>
      </div>
      <div className="actions">
        <button onClick={save}>Save Correction</button>
        {can("attendance.delete") && <button className="danger" onClick={remove}>Delete Record</button>}
      </div>
    </>
  );
}

export function AttendanceSection() {
  const { me, members, branches, toast, openModal } = useTimeClock();
  const can = useCan();
  const rowsQ = useTcGetQuery({ path: "/attendance", params: { order: "asc" } }, { pollingInterval: 30000 });
  const all = (rowsQ.data || []) as Attendance[];
  const [from, setFrom] = useState(() => readPref(me.userId, "from"));
  const [to, setTo] = useState(() => readPref(me.userId, "to"));
  const [employee, setEmployee] = useState("");
  const [branch, setBranch] = useState("");
  const employees = members.filter((m) => m.isEmployee);
  const memberOf = (id: number) => members.find((m) => m.userId === id);
  const savePref = (which: string, v: string) => {
    try { localStorage.setItem(prefKey(me.userId, which), v); } catch { /* storage unavailable */ }
  };

  const rows = useMemo(() => all.filter((a) => {
    const day = localDateKey(a.clockIn), branchId = a.branchId || memberOf(a.userId)?.branchId || "";
    return (!from || day >= from) && (!to || day <= to) && (!employee || String(a.userId) === employee) && (!branch || String(branchId) === branch);
  }).sort((a, b) => localDateKey(a.clockIn).localeCompare(localDateKey(b.clockIn)) || String(a.userId).localeCompare(String(b.userId)) || String(a.clockIn).localeCompare(String(b.clockIn))), [all, from, to, employee, branch, members]); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(() => {
    const buckets = new Map<string, { day: string; employee: string; employeeId: string; branch: string; records: { row: Attendance; hours: number }[]; daily: number }>();
    for (const a of rows) {
      const day = localDateKey(a.clockIn), emp = memberOf(a.userId), b = branches.find((x) => x.id === (a.branchId || emp?.branchId));
      const key = `${day}|${a.userId}`;
      if (!buckets.has(key)) buckets.set(key, { day, employee: emp?.fullName || emp?.employeeCode || "Employee", employeeId: emp?.employeeCode || "", branch: b?.name || "Branch not set", records: [], daily: 0 });
      const g = buckets.get(key)!, hours = attendanceReportHours(a);
      g.records.push({ row: a, hours });
      g.daily += hours;
    }
    return [...buckets.values()].sort((a, b) => a.day.localeCompare(b.day) || a.employee.localeCompare(b.employee));
  }, [rows, branches, members]); // eslint-disable-line react-hooks/exhaustive-deps
  const grand = groups.reduce((n, g) => n + g.daily, 0);
  const canEditClock = me.role === "superadmin" || can("attendance.edit_clock_times");
  const empLabel = employee ? memberOf(Number(employee))?.fullName || "Employee" : "All employees";
  const branchLabel = branch ? branches.find((b) => String(b.id) === branch)?.name || "Branch" : "All branches";

  const exportCSV = () => {
    const daily = new Map<string, number>();
    for (const a of rows) {
      const key = `${localDateKey(a.clockIn)}|${a.userId}`;
      daily.set(key, (daily.get(key) || 0) + attendanceReportHours(a));
    }
    const out: unknown[][] = [["Date", "Employee", "Employee ID", "Branch", "Clock In", "Clock Out", "Hours Worked", "Daily Total Hours"]];
    for (const a of rows) {
      const emp = memberOf(a.userId), b = branches.find((x) => x.id === (a.branchId || emp?.branchId)), key = `${localDateKey(a.clockIn)}|${a.userId}`;
      out.push([localDateKey(a.clockIn), emp?.fullName || "Employee", emp?.employeeCode || "", b?.name || "Branch not set", a.clockIn ? new Date(a.clockIn).toLocaleString() : "", a.clockOut ? new Date(a.clockOut).toLocaleString() : "Open", attendanceReportHours(a).toFixed(2), (daily.get(key) || 0).toFixed(2)]);
    }
    out.push([], ["GRAND TOTAL HOURS", "", "", "", "", "", rows.reduce((s, a) => s + attendanceReportHours(a), 0).toFixed(2), ""]);
    downloadText("dream-valley-attendance-report.csv", out.map((r) => r.map(csvCell).join(",")).join("\r\n"), "text/csv;charset=utf-8");
  };
  const print = () => {
    if (!document.querySelector(".dvtc .report-print-area")) return toast("Generate a report first.");
    window.print();
  };

  return (
    <div className="panel">
      <div className="print-brand"><img src={logo} alt="Dream Valley Realty" /><h2>Dream Valley Realty — Attendance Report</h2></div>
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <h2>Attendance &amp; Reports <small>v1.4.8</small></h2>
        <div className="actions">
          {can("attendance.edit") && <button onClick={() => openModal("Add Employee Hours", <AddHoursForm />)}>＋ Add Hours / Attendance</button>}
          <button onClick={exportCSV}>Export CSV</button>
          <button className="secondary" onClick={print}>Print Report / Save PDF</button>
        </div>
      </div>
      <p className="muted">Select any date range and optionally filter by one employee, one branch, or both. Each shift is listed with daily totals and a grand total for all filtered records.</p>
      <div className="formgrid">
        <div className="field"><label>From Date</label><input type="date" value={from} onChange={(e) => { setFrom(e.target.value); savePref("from", e.target.value); }} /></div>
        <div className="field"><label>To Date</label><input type="date" value={to} onChange={(e) => { setTo(e.target.value); savePref("to", e.target.value); }} /></div>
        <div className="field"><label>Employee</label>
          <select value={employee} onChange={(e) => setEmployee(e.target.value)}>
            <option value="">All employees</option>
            {employees.map((e) => <option key={e.userId} value={e.userId}>{e.fullName || e.employeeCode || "Employee"}</option>)}
          </select>
        </div>
        <div className="field"><label>Branch</label>
          <select value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">All branches</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>
      <div id="report">
        <div className="report-print-area">
          <header className="attendance-print-header">
            <div className="attendance-print-brand">
              <img src={logo} alt="Dream Valley Realty logo" />
              <div><div className="attendance-print-company">DREAM VALLEY REALTY</div><div className="attendance-print-subtitle">Attendance &amp; Time Records</div></div>
            </div>
            <div className="attendance-print-title"><h1>Daily Attendance Report</h1><p>Prepared {new Date().toLocaleString()}</p></div>
          </header>
          <section className="attendance-print-meta">
            <div><span>Report Period</span><b>{from || "Any date"} to {to || "Any date"}</b></div>
            <div><span>Employee</span><b>{empLabel}</b></div>
            <div><span>Branch</span><b>{branchLabel}</b></div>
            <div><span>Attendance Entries</span><b>{rows.length}</b></div>
          </section>
          {!groups.length ? (
            <p>{rowsQ.isLoading ? "Loading attendance…" : "No attendance records found for the selected filters."}</p>
          ) : (
            <>
              <div className="tablewrap">
                <table className="table attendance-report-table">
                  <thead><tr><th>Date</th><th>Employee</th><th>Branch</th><th>Clock In</th><th>Clock Out</th><th>Hours Worked</th><th>Daily Total</th>{canEditClock && <th>Action</th>}</tr></thead>
                  <tbody>
                    {groups.map((g) => g.records.map((item, i) => (
                      <tr key={item.row.uuid}>
                        <td>{i === 0 ? fmtDate(g.day) : ""}</td>
                        <td>{i === 0 ? `${g.employee}${g.employeeId ? ` (${g.employeeId})` : ""}` : ""}</td>
                        <td>{i === 0 ? g.branch : ""}</td>
                        <td>{timeOf(item.row.clockIn) || "—"}</td>
                        <td>{timeOf(item.row.clockOut) || "Open"}</td>
                        <td>{item.hours.toFixed(2)}</td>
                        <td>{i === 0 ? <b>{g.daily.toFixed(2)}</b> : ""}</td>
                        {canEditClock && <td><button className="ghost" onClick={() => openModal("Edit Attendance Record", <EditAttendanceForm a={item.row} />)}>Edit</button></td>}
                      </tr>
                    )))}
                  </tbody>
                  <tfoot><tr><th colSpan={5} style={{ textAlign: "right" }}>GRAND TOTAL HOURS</th><th>{grand.toFixed(2)}</th><th>{grand.toFixed(2)}</th>{canEditClock && <th />}</tr></tfoot>
                </table>
              </div>
              <p className="muted">Hours use payable hours when recorded; otherwise completed clock-in/out duration. Open shifts count as 0.00 hours until clock-out.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
