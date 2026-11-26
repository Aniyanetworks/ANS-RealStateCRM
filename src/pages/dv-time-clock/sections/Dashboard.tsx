import { useEffect, useState } from "react";
import { useTcGetQuery } from "../../../redux/api/common/dvTimeClockSlice";
import { branchName, useTimeClock } from "../TimeClockContext";
import { useClockActions } from "../useClockActions";
import { Attendance, fmtDuration, periodBounds, rowHours, todayKey } from "../tcUtils";

export function LiveTimer({ start }: { start: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return <>{fmtDuration(now - new Date(start).getTime())}</>;
}

export function DashboardAlerts() {
  const { me, isEmployeeView, go } = useTimeClock();
  const { data } = useTcGetQuery({ path: "/counts", params: { userId: me.userId, asEmployee: isEmployeeView ? 1 : undefined } }, { pollingInterval: 30000 });
  const c = (data || {}) as { unreadMessages?: number; newResponses?: number; pendingRequests?: number; missedClockouts?: number };
  const msg = c.unreadMessages || 0, req = (isEmployeeView ? c.newResponses : c.pendingRequests) || 0, missed = c.missedClockouts || 0;
  return (
    <div className="panel" style={{ marginTop: 14 }}>
      <h3 style={{ margin: "0 0 10px" }}>Notifications</h3>
      <div className="actions" style={{ gap: 10, flexWrap: "wrap" }}>
        <button className={msg ? "secondary" : "ghost"} onClick={() => go("messages")}>
          {msg ? `🔔 ${msg} new message${msg === 1 ? "" : "s"}` : "Messages · No unread items"}
        </button>
        <button className={req ? "secondary" : "ghost"} onClick={() => go("requests")}>
          {isEmployeeView
            ? req ? `📩 ${req} request update${req === 1 ? "" : "s"}` : "My Requests · No new updates"
            : req ? `📋 ${req} pending request${req === 1 ? "" : "s"}` : "Approvals · No pending requests"}
        </button>
        {!isEmployeeView && (
          <button className={missed ? "secondary" : "ghost"} onClick={() => go("attendance")}>
            {missed ? `⚠ ${missed} possible missed clock-out${missed === 1 ? "" : "s"}` : "Timesheets · No old open shifts"}
          </button>
        )}
      </div>
      <small className="muted">Possible missed clock-outs are open records older than 12 hours; review before correcting.</small>
    </div>
  );
}

function StatLink({ label, value, onOpen }: { label: string; value: number | string; onOpen: () => void }) {
  return (
    <div
      className="stat stat-link"
      role="button"
      tabIndex={0}
      title={`Open ${label}`}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}
      style={{ cursor: "pointer", transition: "border-color .15s, box-shadow .15s, transform .15s" }}
      onMouseEnter={(e) => Object.assign(e.currentTarget.style, { borderColor: "#5eead4", boxShadow: "0 6px 16px #111f3714", transform: "translateY(-1px)" })}
      onMouseLeave={(e) => Object.assign(e.currentTarget.style, { borderColor: "", boxShadow: "", transform: "" })}
    >
      <span>{label}</span><b>{value}</b>
    </div>
  );
}

export function ManagerDashboard() {
  const { me, members, branches, go } = useTimeClock();
  const countsQ = useTcGetQuery({ path: "/counts", params: { userId: me.userId, asEmployee: undefined } }, { pollingInterval: 30000 });
  const openQ = useTcGetQuery({ path: "/attendance", params: { open: 1 } }, { pollingInterval: 30000 });
  const c = (countsQ.data || {}) as { attendanceRecords?: number; openShifts?: number; pendingShiftRequests?: number };
  const loading = countsQ.isLoading;
  const employees = members.filter((m) => m.isEmployee);
  const active = ((openQ.data || []) as Attendance[]).slice().sort((a, b) => String(a.clockIn).localeCompare(String(b.clockIn)));
  return (
    <>
      <div className="stats">
        <StatLink label="Employees" value={members.length ? employees.filter((e) => e.active).length : "…"} onOpen={() => go("employees")} />
        <StatLink label="Open Shifts" value={loading ? "…" : c.openShifts ?? 0} onOpen={() => go("scheduling")} />
        <StatLink label="Attendance Records" value={loading ? "…" : c.attendanceRecords ?? 0} onOpen={() => go("attendance")} />
        <StatLink label="Pending Requests" value={loading ? "…" : c.pendingShiftRequests ?? 0} onOpen={() => go("requests")} />
      </div>
      <div className="panel">
        <div className="actions" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2>Current Shift Timers</h2>
            <p className="muted">Live timers for employees currently clocked in. Timers refresh automatically.</p>
          </div>
          <span className="badge">{active.length} active</span>
        </div>
        <div className="tablewrap">
          <table className="table">
            <thead><tr><th>Employee</th><th>Employee ID</th><th>Branch</th><th>Elapsed Shift</th><th>Clocked In At</th></tr></thead>
            <tbody>
              {active.length ? active.map((a) => {
                const e = members.find((m) => m.userId === a.userId);
                return (
                  <tr key={a.uuid}>
                    <td>{e?.fullName || e?.employeeCode || a.userId}</td>
                    <td>{e?.employeeCode || "—"}</td>
                    <td>{a.branchId || e?.branchId ? branchName(branches, a.branchId || e?.branchId) : "—"}</td>
                    <td><b><LiveTimer start={a.clockIn} /></b></td>
                    <td>{new Date(a.clockIn).toLocaleString()}</td>
                  </tr>
                );
              }) : <tr><td colSpan={5}>{openQ.isLoading ? "Loading…" : "No employees are currently clocked in."}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="actions"><button className="secondary" onClick={() => go("attendance")}>Open Attendance &amp; Reports</button></div>
      </div>
      <DashboardAlerts />
    </>
  );
}

export function EmployeeDashboard() {
  const { me, settings, go } = useTimeClock();
  const { clockIn, clockOut } = useClockActions();
  const bounds = periodBounds(todayKey(), settings);
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const openQ = useTcGetQuery({ path: "/attendance", params: { userId: me.userId, open: 1, limit: 1 } }, { pollingInterval: 30000 });
  const periodQ = useTcGetQuery({ path: "/attendance", params: { userId: me.userId, from: `${bounds.start}T00:00:00`, to: `${bounds.end}T23:59:59` } }, { pollingInterval: 30000 });
  const weekQ = useTcGetQuery({ path: "/attendance", params: { userId: me.userId, from: weekStart.toISOString(), before: weekEnd.toISOString() } }, { pollingInterval: 30000 });
  const active = ((openQ.data || []) as Attendance[])[0] || null;
  const periodHours = periodQ.data ? (periodQ.data as Attendance[]).reduce((n, r) => n + rowHours(r), 0) : null;
  const weekly = ((weekQ.data || []) as Attendance[]).reduce((sum, r) => sum + rowHours(r), 0);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<boolean>) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };
  return (
    <>
      <div className="panel dashboard-clock-panel">
        <h2>Time Clock</h2>
        {active ? (
          <>
            <button className="dashboard-clock-button dashboard-clock-out" disabled={busy} onClick={() => run(() => clockOut(active))}>Clock Out</button>
            <p className="muted">You are currently clocked in. Tap to end your shift.</p>
          </>
        ) : (
          <>
            <button className="dashboard-clock-button dashboard-clock-in" disabled={busy} onClick={() => run(clockIn)}>Clock In</button>
            <p className="muted">Clock in when you arrive at your assigned branch. Location verification applies.</p>
          </>
        )}
      </div>
      <div className="stats">
        <div className="stat"><span>Employee ID</span><b style={{ fontSize: 18 }}>{me.employeeCode || "—"}</b></div>
        <div className="stat"><span>Status</span><b style={{ fontSize: 18 }}>{me.active ? "Active" : "Inactive"}</b></div>
        <div className="stat"><span>Current Shift Timer</span><b>{active ? <LiveTimer start={active.clockIn} /> : "Not clocked in"}</b></div>
        {periodHours != null ? (
          <div className="stat"><span>Hours This Pay Period</span><b>{periodHours.toFixed(2)} hrs</b><small>{bounds.start} to {bounds.end}</small></div>
        ) : (
          <div className="stat"><span>Hours This Pay Period</span><b>Unavailable</b></div>
        )}
        <div className="stat"><span>Hours This Week</span><b>{weekly.toFixed(2)} hrs</b><small>Monday–Sunday · includes current open shift estimate</small></div>
      </div>
      <div className="panel">
        <div className="actions" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2>Open Shifts</h2>
            <p className="muted">Open the monthly calendar or list to browse available shifts.</p>
          </div>
          <button onClick={() => go("openshifts")}>Browse Open Shifts</button>
        </div>
      </div>
      <DashboardAlerts />
    </>
  );
}
