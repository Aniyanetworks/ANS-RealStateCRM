// Payroll & Labour Cost (gross pay from recorded hours + deduction estimator) and the Audit & Activity Log.
import { ReactNode, useMemo, useState } from "react";
import { useTcGetQuery } from "../../../redux/api/common/dvTimeClockSlice";
import { useTimeClock } from "../TimeClockContext";
import logo from "../../../assets/dv-time-clock-logo.svg";
import { Attendance, csvCell, dateForPeriod, downloadText, money, todayKey } from "../tcUtils";

// ---------- Payroll ----------

function DeductionEstimator() {
  const [v, setV] = useState({ g: "1000", cpp: "5.95", ei: "1.64", tax: "15" });
  const [res, setRes] = useState<null | { g: number; cpp: number; ei: number; tax: number; net: number }>(null);
  const calc = () => {
    const g = Math.max(0, Number(v.g) || 0);
    const cpp = (g * Math.max(0, Number(v.cpp) || 0)) / 100, ei = (g * Math.max(0, Number(v.ei) || 0)) / 100, tax = (g * Math.max(0, Number(v.tax) || 0)) / 100;
    setRes({ g, cpp, ei, tax, net: Math.max(0, g - cpp - ei - tax) });
  };
  const input = (label: string, key: keyof typeof v, max?: number) => (
    <div className="field"><label>{label}</label><input type="number" min={0} max={max} step="0.01" value={v[key]} onChange={(e) => setV({ ...v, [key]: e.target.value })} /></div>
  );
  return (
    <>
      <p className="notice">Planning estimate only. This is not a CRA payroll calculation and must not be used for remittances, tax filing, or final pay. Confirm deductions with current CRA payroll tables or payroll software.</p>
      <div className="formgrid">
        {input("Gross Pay (CAD)", "g")}
        {input("CPP estimate rate (%)", "cpp", 100)}
        {input("EI estimate rate (%)", "ei", 100)}
        {input("Income tax estimate (%)", "tax", 100)}
      </div>
      <button onClick={calc}>Calculate Estimate</button>
      {res && (
        <div style={{ marginTop: 14 }}>
          <div className="stats">
            <div className="stat"><span>Gross</span><b>{money(res.g)}</b></div>
            <div className="stat"><span>CPP estimate</span><b>{money(res.cpp)}</b></div>
            <div className="stat"><span>EI estimate</span><b>{money(res.ei)}</b></div>
            <div className="stat"><span>Income tax estimate</span><b>{money(res.tax)}</b></div>
            <div className="stat"><span>Estimated Net</span><b>{money(res.net)}</b></div>
          </div>
        </div>
      )}
    </>
  );
}

export function PayrollSection() {
  const { members, branches, openModal } = useTimeClock();
  const today = todayKey();
  const initial = dateForPeriod("Monthly", today);
  const [period, setPeriod] = useState("Monthly");
  const [anchor, setAnchor] = useState(today);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [branch, setBranch] = useState("");
  const att = (useTcGetQuery({ path: "/attendance" }, { pollingInterval: 30000 }).data || []) as Attendance[];
  const applyPeriod = (p: string, a: string) => {
    if (p === "Custom") return;
    const r = dateForPeriod(p, a);
    setFrom(r.from);
    setTo(r.to);
  };

  const rows = useMemo(() => members.filter((e) => e.isEmployee && (!branch || String(e.branchId) === branch)).map((e) => {
    const records = att.filter((a) => a.userId === e.userId && a.clockIn && a.clockIn.slice(0, 10) >= from && a.clockIn.slice(0, 10) <= to && a.clockOut);
    const hours = records.reduce((sum, a) => sum + Math.max(0, a.payableHours != null ? Number(a.payableHours) : (+new Date(a.clockOut!) - +new Date(a.clockIn)) / 3600000), 0);
    let gross = 0;
    if (e.payType === "hourly") gross = hours * Number(e.hourlyRate || 0);
    else if (e.payType === "monthly") {
      const cur = new Date(from + "T12:00:00"), last = new Date(to + "T12:00:00");
      if (from && to && last >= cur) {
        while (cur <= last) {
          const monthDays = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
          const days = Math.min(monthDays - cur.getDate() + 1, Math.floor((+last - +new Date(cur.getFullYear(), cur.getMonth(), 1, 12)) / 86400000) + 1);
          gross += (Number(e.monthlySalary || 0) * days) / monthDays;
          cur.setDate(cur.getDate() + days);
        }
      }
    } else if (e.payType === "yearly") {
      const days = from && to ? Math.max(0, (+new Date(to + "T12:00:00") - +new Date(from + "T12:00:00")) / 86400000 + 1) : 0;
      const yearDays = from ? (new Date(from + "T12:00:00").getFullYear() % 4 === 0 ? 366 : 365) : 365;
      gross = (Number(e.yearlySalary || 0) * days) / yearDays;
    }
    const rate = e.payType === "hourly" ? Number(e.hourlyRate || 0) : e.payType === "monthly" ? Number(e.monthlySalary || 0) : Number(e.yearlySalary || 0);
    return { employee: e.fullName || e.employeeCode || "Employee", employeeCode: e.employeeCode || "", branch: branches.find((b) => b.id === e.branchId)?.name || "Not Assigned", payType: e.payType || "hourly", hours, gross, rate };
  }), [members, branches, att, from, to, branch]);
  const total = rows.reduce((s, r) => s + r.gross, 0), hours = rows.reduce((s, r) => s + r.hours, 0);
  const exportCSV = () => {
    const csv = [["Employee", "Employee ID", "Branch", "Pay Type", "Hours", "Gross Pay"], ...rows.map((r) => [r.employee, r.employeeCode, r.branch, r.payType, r.hours.toFixed(2), r.gross.toFixed(2)])].map((r) => r.map(csvCell).join(",")).join("\r\n");
    downloadText("dream-valley-payroll.csv", csv, "text/csv;charset=utf-8");
  };

  return (
    <div className="panel">
      <div className="print-brand"><img src={logo} alt="ANS RealStateCRM" /><h2>ANS RealStateCRM — Payroll Summary</h2></div>
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <div><h2>Payroll &amp; Labour Cost</h2><p className="muted">Gross payroll is calculated from recorded hours and employee compensation. This does not file or remit payroll taxes.</p></div>
        <div className="actions">
          <button onClick={() => openModal("Payroll Deduction Estimator", <DeductionEstimator />)}>Payroll Deduction Estimator</button>
          <button className="secondary" onClick={exportCSV}>Export Payroll CSV</button>
          <button className="ghost" onClick={() => window.print()}>Print / Save PDF</button>
        </div>
      </div>
      <div className="formgrid">
        <div className="field"><label>Pay Period</label>
          <select value={period} onChange={(e) => { setPeriod(e.target.value); applyPeriod(e.target.value, anchor); }}>
            {["Weekly", "Bi-Weekly", "Semi-Monthly", "Monthly", "Yearly", "Custom"].map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="field"><label>Anchor / To Date</label><input type="date" value={anchor} onChange={(e) => { setAnchor(e.target.value); applyPeriod(period, e.target.value); }} /></div>
        <div className="field"><label>From</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="field"><label>To</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div className="field"><label>Branch Filter</label>
          <select value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">All branches</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>
      <div className="stats">
        <div className="stat"><span>Employees</span><b>{rows.length}</b></div>
        <div className="stat"><span>Recorded Hours</span><b>{hours.toFixed(2)}</b></div>
        <div className="stat"><span>Estimated Gross Payroll</span><b>{money(total)}</b></div>
      </div>
      <div className="tablewrap">
        <table className="table">
          <thead><tr><th>Employee</th><th>Branch</th><th>Pay Type</th><th>Hours</th><th>Rate / Salary</th><th>Gross Pay</th></tr></thead>
          <tbody>
            {rows.map((r, i) => <tr key={i}><td>{r.employee}</td><td>{r.branch}</td><td>{r.payType}</td><td>{r.hours.toFixed(2)}</td><td>{money(r.rate)}</td><td><b>{money(r.gross)}</b></td></tr>)}
          </tbody>
          <tfoot><tr><th colSpan={3}>Total</th><th>{hours.toFixed(2)}</th><th /><th>{money(total)}</th></tr></tfoot>
        </table>
      </div>
    </div>
  );
}

// ---------- Audit log ----------

type AuditRow = { id: number; actorId: number | null; actorName: string | null; actorRole: string | null; action: string; entity: string; recordId: string | null; oldData: unknown; newData: unknown; details: unknown; createdAt: string };

const prettyKey = (k: string) => String(k || "").replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (c) => c.toUpperCase());
const isDateKey = (k: string) => /(?:^|_)(?:created_at|updated_at|clock_in|clock_out|scheduled_start|scheduled_end|approved_at|deleted_at)$|^(createdAt|updatedAt|clockIn|clockOut|reviewedAt|usedAt|startAt|endAt)$/.test(String(k || ""));
const formatDateValue = (value: unknown) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};
function AuditValue({ k, value }: { k: string; value: unknown }): ReactNode {
  if (value === null || value === undefined || value === "") return <span className="audit-value-empty">Not set</span>;
  if (isDateKey(k)) return <>{formatDateValue(value)}</>;
  if (typeof value === "boolean") return <>{value ? "Yes" : "No"}</>;
  if (Array.isArray(value)) {
    if (!value.length) return <span className="audit-value-empty">None</span>;
    return <ul className="audit-value-list">{value.map((item, i) => <li key={i}>{item && typeof item === "object" ? JSON.stringify(item) : String(item)}</li>)}</ul>;
  }
  if (typeof value === "object") {
    return <div className="audit-value-object">{Object.entries(value as Record<string, unknown>).map(([kk, v]) => <span key={kk}><strong>{prettyKey(kk)}:</strong> {v == null ? <span className="audit-value-empty">Not set</span> : typeof v === "object" ? JSON.stringify(v) : String(v)}</span>)}</div>;
  }
  return <>{String(value)}</>;
}

function AuditDetail({ r }: { r: AuditRow }) {
  const old = (r.oldData && typeof r.oldData === "object" ? r.oldData : {}) as Record<string, unknown>;
  const next = (r.newData && typeof r.newData === "object" ? r.newData : {}) as Record<string, unknown>;
  const keys = [...new Set([...Object.keys(old), ...Object.keys(next)])];
  const changed = keys.filter((k) => JSON.stringify(old[k] ?? null) !== JSON.stringify(next[k] ?? null));
  const raw = (label: string, value: unknown) => <details className="audit-raw"><summary>{label}</summary><pre>{JSON.stringify(value ?? {}, null, 2)}</pre></details>;
  return (
    <div className="audit-detail">
      <div className="audit-summary">
        <div><label>Action</label><b>{r.action} · {r.entity}</b></div>
        <div><label>Date / time (your local time)</label>{new Date(r.createdAt).toLocaleString()}</div>
        <div><label>Actor</label>{r.actorName || r.actorId || "System"} ({r.actorRole || ""})</div>
        <div><label>Branch ID</label>—</div>
        <div className="wide"><label>Record ID</label>{r.recordId || "—"}</div>
      </div>
      <section className="audit-section">
        <h3>Change summary</h3>
        {changed.length ? (
          <div className="tablewrap">
            <table className="audit-change-table">
              <thead><tr><th>Field</th><th>Previous value</th><th>New value</th></tr></thead>
              <tbody>{changed.map((k) => <tr key={k}><th scope="row">{prettyKey(k)}</th><td><AuditValue k={k} value={old[k]} /></td><td><AuditValue k={k} value={next[k]} /></td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="muted">No field-level differences were recorded. See the raw event data below.</p>}
      </section>
      {raw("View previous values (raw JSON)", r.oldData)}
      {raw("View new values (raw JSON)", r.newData)}
      {raw("View reason / metadata", r.details)}
    </div>
  );
}

export function AuditSection() {
  const { me, toast, openModal } = useTimeClock();
  const [f, setF] = useState({ from: "", to: todayKey(), action: "", entity: "", search: "" });
  const [applied, setApplied] = useState(f);
  const params = {
    from: applied.from ? new Date(applied.from + "T00:00:00").toISOString() : undefined,
    to: applied.to ? new Date(new Date(applied.to + "T00:00:00").getTime() + 86400000).toISOString() : undefined,
    action: applied.action || undefined,
    entity: applied.entity.trim().toLowerCase() || undefined,
  };
  const q = useTcGetQuery({ path: "/audit", params });
  const rows = ((q.data || []) as AuditRow[]).filter((r) => !applied.search || [r.actorName, r.actorRole, r.entity, r.recordId, r.action, JSON.stringify(r.oldData), JSON.stringify(r.newData)].join(" ").toLowerCase().includes(applied.search.toLowerCase()));
  if (!["superadmin", "admin", "management"].includes(me.role)) return <div className="panel"><p className="notice">Audit log access is restricted to management.</p></div>;
  const exportCSV = () => {
    if (!rows.length) return toast("No audit records to export.");
    const cols: [string, keyof AuditRow][] = [["created_at", "createdAt"], ["actor_name", "actorName"], ["actor_role", "actorRole"], ["actor_id", "actorId"], ["action", "action"], ["entity", "entity"], ["record_id", "recordId"], ["old_data", "oldData"], ["new_data", "newData"], ["metadata", "details"]];
    const csv = [cols.map((c) => c[0]).join(","), ...rows.map((r) => cols.map(([, k]) => csvCell(typeof r[k] === "object" && r[k] !== null ? JSON.stringify(r[k]) : r[k])).join(","))].join("\r\n");
    downloadText(`dream-valley-audit-log-${todayKey()}.csv`, csv, "text/csv;charset=utf-8");
  };
  const clear = () => {
    const empty = { from: "", to: "", action: "", entity: "", search: "" };
    setF(empty);
    setApplied(empty);
  };
  return (
    <div className="panel">
      <div className="actions" style={{ justifyContent: "space-between" }}>
        <div><h2>Audit &amp; Activity Log</h2><p className="muted">Review recorded changes across attendance, scheduling, employees, messages, settings, and approvals.</p></div>
        <button className="secondary" onClick={exportCSV}>Export CSV</button>
      </div>
      <div className="formgrid">
        <div className="field"><label>From</label><input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></div>
        <div className="field"><label>To</label><input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></div>
        <div className="field"><label>Action</label>
          <select value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })}>
            <option value="">All actions</option><option>INSERT</option><option>UPDATE</option><option>DELETE</option>
          </select>
        </div>
        <div className="field"><label>Record type</label><input placeholder="e.g. attendance, shifts" value={f.entity} onChange={(e) => setF({ ...f, entity: e.target.value })} /></div>
        <div className="field"><label>Search</label><input placeholder="User, record ID, details..." value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} /></div>
      </div>
      <div className="actions"><button onClick={() => setApplied(f)}>Apply Filters</button><button className="ghost" onClick={clear}>Clear</button></div>
      <div id="auditResults">
        {q.isFetching && !q.data ? <p className="muted">Loading activity…</p> : (
          <>
            <p className="muted">Showing {rows.length} recent matching events. The query is limited to the latest 1,000 events.</p>
            <div className="tablewrap">
              <table className="table">
                <thead><tr><th>Date / Time</th><th>Actor</th><th>Action</th><th>Record</th><th>Details</th></tr></thead>
                <tbody>
                  {rows.length ? rows.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.createdAt).toLocaleString()}</td>
                      <td>{r.actorName || r.actorId || "System"}<br /><small>{r.actorRole || ""}</small></td>
                      <td><span className={`pill ${r.action === "DELETE" ? "gold" : "green"}`}>{r.action}</span></td>
                      <td>{r.entity}<br /><small>{r.recordId || ""}</small></td>
                      <td><button className="ghost" onClick={() => openModal("Audit Event Details", <AuditDetail r={r} />, "audit-modal")}>View changes</button></td>
                    </tr>
                  )) : <tr><td colSpan={5}>No matching activity found.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
