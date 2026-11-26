import { useState } from "react";
import { useAppSelector } from "../../../redux/hooks";
import { useAcct, useAcctAction } from "../acctShared";
import { LuCheck } from "./icons";
import { Notice, PageHead, fr, todayYmd } from "./ui";

const ITEMS: [string, string | null][] = [
  ["Real Estate Trust reconciliation", "trustReconciled"],
  ["Commission Trust reconciliation", "commissionTrustReconciled"],
  ["Operating reconciliation", "operatingReconciled"],
  ["Trust liability agrees to bank", "trustLiabilityAgrees"],
  ["HST review", "hstReviewed"],
  ["Payroll / CRA remittance review", "payrollReviewed"],
  ["P&L review", "pnlReviewed"],
  ["Close month", null],
];
const DONE = ["RECONCILED", "COMPLETED", "CLOSED"];
type Rec = { status?: string; statementBalance?: number; bookBalance?: number; periodEnd?: string } | null;
type Data = { periodEnd: string; record: Record<string, unknown> | null; reconciliations: { bank: { id: number; name: string; accountCategory?: string }; reconciliation: Rec }[]; history: Record<string, unknown>[] };

export default function MonthEnd() {
  const { user } = useAppSelector((s) => s.user) as { user: { roleId?: number; userType?: string } };
  const isSuper = user?.roleId == 1 || user?.userType === "superAdmin";
  const [month, setMonth] = useState(todayYmd().slice(0, 7));
  const q = useAcct("/month-end", { month });
  const data = q.rows as Data | undefined;
  const { run, loading } = useAcctAction();
  const record = (data?.record || {}) as Record<string, unknown>;
  const closed = Boolean(record.closedAt);
  const checked = (key: string | null) => (key ? Boolean(record[key]) : closed);
  const recs = data?.reconciliations || [];
  const reconciledCount = recs.filter((r) => r.reconciliation && DONE.includes(String(r.reconciliation.status || "").toUpperCase())).length;

  const toggle = (key: string) => run("/month-end/item", { month, item: key, value: !record[key] }, { silent: true });
  const close = async () => {
    if (!ITEMS.slice(0, 7).every(([, k]) => checked(k))) return alert("Complete all seven review attestations before closing this month.");
    const missing = recs.filter((r) => !r.reconciliation || !DONE.includes(String(r.reconciliation.status || "").toUpperCase()));
    if (missing.length) return alert(`Month-end close blocked: save a completed bank reconciliation for every active bank account for ${data?.periodEnd}. Missing: ${missing.map((m) => m.bank.name).join(", ")}`);
    await run("/month-end/close", { month });
  };

  return (
    <>
      <PageHead title="Compliance & Month End" desc="Monthly review attestations and reconciliation evidence for brokerage accounting.">
        <button className="primary" onClick={close} disabled={loading || closed}><LuCheck /> {loading ? "Saving..." : closed ? "Month Closed" : "Close Month"}</button>
        {closed && isSuper && <button className="secondary" disabled={loading} onClick={() => window.confirm("Reopen this month? Postings dated in it will be editable again.") && run("/month-end/reopen", { month })}>Reopen Month</button>}
      </PageHead>
      <section className="panel">
        <div className="formgrid">
          <label>Accounting month<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label>
          <label>Period end<input type="date" value={data?.periodEnd || ""} readOnly /></label>
        </div>
        <Notice>Check each item only after you have reviewed its source documents. These are recorded attestations; the system does not independently certify CRA, payroll, HST, or trust compliance.</Notice>
        {ITEMS.map(([label, key], i) => (
          <div className="check big" key={label}>
            <input type="checkbox" checked={checked(key)} disabled={!key || loading || closed} onChange={() => key && toggle(key)} />
            <span className={checked(key) ? "done" : ""}>{i + 1}. {label}</span>
            <span className={checked(key) ? "complete" : "todo"}>{checked(key) ? "Complete" : "Pending"}</span>
          </div>
        ))}
      </section>
      <section className="panel">
        <div className="paneltitle">
          <h2>Bank reconciliation evidence · {data?.periodEnd}</h2>
          <span className="pill">{reconciledCount}/{recs.length} reconciled</span>
        </div>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Bank account</th><th>Type</th><th>Statement period</th><th>Difference</th><th>Status</th></tr></thead>
            <tbody>
              {recs.map(({ bank, reconciliation: r }) => (
                <tr key={bank.id}>
                  <td>{bank.name}</td>
                  <td>{String(bank.accountCategory || "").replace(/_/g, " ")}</td>
                  <td>{r?.periodEnd ? String(r.periodEnd).slice(0, 10) : "Missing"}</td>
                  <td>{r ? fr(Number(r.statementBalance || 0) - Number(r.bookBalance || 0)) : "—"}</td>
                  <td>{r?.status || "Not reconciled"}</td>
                </tr>
              ))}
              {!recs.length && <tr><td colSpan={5}>No active bank accounts configured.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel tablewrap">
        <h2>Month-end history</h2>
        <table>
          <thead><tr><th>Period</th><th>Trust</th><th>Commission Trust</th><th>Operating</th><th>HST</th><th>Payroll</th><th>Closed at</th></tr></thead>
          <tbody>
            {(data?.history || []).map((h) => (
              <tr key={String(h.id)}>
                <td>{String(h.periodEnd || "").slice(0, 10)}</td>
                <td>{h.trustReconciled ? "Reviewed" : "Pending"}</td>
                <td>{h.commissionTrustReconciled ? "Reviewed" : "Pending"}</td>
                <td>{h.operatingReconciled ? "Reviewed" : "Pending"}</td>
                <td>{h.hstReviewed ? "Reviewed" : "Pending"}</td>
                <td>{h.payrollReviewed ? "Reviewed" : "Pending"}</td>
                <td>{h.closedAt ? new Date(String(h.closedAt)).toLocaleString() : "—"}</td>
              </tr>
            ))}
            {!(data?.history || []).length && <tr><td colSpan={7}>No month-end records yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </>
  );
}
