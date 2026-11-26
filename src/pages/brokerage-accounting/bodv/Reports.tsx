// Reports — the original DV Accounting report centre: choose one of 14 reports, filter (dates, status, agent,
// search), preview, export CSV or PDF; live ledger summary. Data comes from the accounting ledger and AgentHub.
import { useState } from "react";
import jsPDF from "jspdf";
import { useLazyAcctGetQuery } from "../../../redux/api/accounting/brokerageAccountingSlice";
import { useAcct } from "../acctShared";
import { LuFileText } from "./icons";
import { Modal, Notice, PageHead, Stat, fr } from "./ui";

const REPORTS = ["Profit & Loss", "Balance Sheet", "Trial Balance", "General Ledger", "Revenue by Month", "Expense Summary", "Sales Volume", "Agent Ranking", "Listings & Units", "Trust Reconciliation", "HST Working Paper", "Payroll Register", "T4 Payroll Working Paper", "T4A Commission Working Paper"];
const STATUSES = ["DRAFT", "OPEN", "PENDING", "FINALIZED", "CLOSED", "COMPLETED", "POSTED", "PAID", "UNPAID", "VOID", "ISSUED", "RECONCILED", "APPROVED", "RELEASED"];
type Cell = string | number | null | undefined;
type Built = { name: string; headers: string[]; lines: Cell[][] };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const MONEY = /(debit|credit|balance|amount|price|commission|revenue|volume|expense|hst|itc|adjustment|gross pay|cpp|ei|income tax|net pay|fees deducted|net cheques|employment income)/i;
const DATE = /(^date$| date|^month$|period start|period end|tax year|^year$|last reconciled)/i;
const fmtMoney = (v: Cell) => {
  const n = Number(v);
  return v !== null && v !== "" && v !== undefined && Number.isFinite(n) ? "$" + n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v;
};

function downloadCsv(name: string, headers: string[], lines: Cell[][]) {
  const esc = (v: Cell) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...lines].map((r) => r.map(esc).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  a.download = name.toLowerCase().replace(/ /g, "-") + ".csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

function downloadPdf(name: string, headers: string[], lines: Cell[][]) {
  const doc = new jsPDF({ orientation: headers.length > 6 ? "landscape" : "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 12;
  const navy: [number, number, number] = [15, 33, 65], gold: [number, number, number] = [158, 133, 86], grey: [number, number, number] = [90, 100, 115];
  doc.setTextColor(...navy); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(name, M, 14);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...grey); doc.text("Generated " + new Date().toLocaleString("en-CA"), W - M, 14, { align: "right" });
  doc.setDrawColor(...gold); doc.setLineWidth(0.6); doc.line(M, 19, W - M, 19);
  const usable = W - M * 2, colW = usable / Math.max(headers.length, 1), fs = headers.length > 8 ? 6.5 : headers.length > 5 ? 7 : 8, pad = 1.7, lh = fs * 0.42 + 1.1;
  let y = 24;
  const head = () => {
    doc.setFillColor(...navy); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(fs);
    const split = headers.map((h) => doc.splitTextToSize(String(h ?? ""), Math.max(4, colW - pad * 2)));
    const h = Math.max(8, ...split.map((s) => s.length * lh + pad * 2));
    doc.rect(M, y, usable, h, "F");
    split.forEach((s, i) => doc.text(s, M + i * colW + pad, y + pad + lh * 0.75));
    y += h;
    doc.setFont("helvetica", "normal"); doc.setTextColor(35, 40, 48);
  };
  head();
  lines.forEach((row, ri) => {
    const split = row.map((c) => doc.splitTextToSize(String(c ?? "—"), Math.max(4, colW - pad * 2)));
    const h = Math.max(7, ...split.map((s) => s.length * lh + pad * 2));
    if (y + h > H - 15) { doc.addPage(); y = 14; head(); }
    if (ri % 2 === 1) { doc.setFillColor(245, 247, 250); doc.rect(M, y, usable, h, "F"); }
    doc.setDrawColor(220, 224, 230); doc.setLineWidth(0.15); doc.line(M, y + h, W - M, y + h);
    split.forEach((s, i) => doc.text(s, M + i * colW + pad, y + pad + lh * 0.75));
    y += h;
  });
  if (!lines.length) { doc.setFontSize(9); doc.setTextColor(...grey); doc.text("No records found for this report.", M, y + 7); }
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) { doc.setPage(p); doc.setFontSize(8); doc.setTextColor(...grey); doc.text("Confidential", M, H - 6); doc.text(`Page ${p} of ${pages}`, W - M, H - 6, { align: "right" }); }
  doc.save(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".pdf");
}

export default function Reports() {
  const [fetchAcct] = useLazyAcctGetQuery();
  const [report, setReport] = useState("Profit & Loss");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("ALL");
  const [agent, setAgent] = useState("ALL");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<Built | null>(null);
  const [busy, setBusy] = useState(false);
  const year = new Date().getFullYear();
  const summary = useAcct("/reports/summary");
  const pnl = useAcct("/reports/profit-loss", { from: `${year}-01-01`, to: `${year}-12-31` });
  const dash = useAcct("/admin-dashboard");
  const agents = ((dash.rows as Any)?.agents || []) as { id: number; name: string }[];
  const s = (summary.rows || {}) as { postedLines?: number; transactions?: number };
  const p = (pnl.rows || {}) as { totalIncome?: number; totalExpenses?: number; totalCostOfSales?: number };
  const postedRevenue = Number(p.totalIncome || 0), postedExpenses = Number(p.totalExpenses || 0) + Number(p.totalCostOfSales || 0);

  const get = async (path: string, params?: Record<string, string | number>) => ((await fetchAcct({ path, params }, false).unwrap()) as Any)?.data;
  const lo = from || "2000-01-01", hi = to || "2100-12-31";

  const build = async (name: string): Promise<Built> => {
    let headers = ["Account Code", "Account", "Type", "Debit", "Credit", "Balance"];
    let lines: Cell[][] = [];
    if (name === "Profit & Loss") {
      const d = await get("/reports/profit-loss", { from: lo, to: hi });
      lines = [...(d.income || []), ...(d.costOfSales || []), ...(d.expenses || [])].map((r: Any) => [r.code, r.name, r.accountType, "", "", r.balance]);
    } else if (name === "Balance Sheet") {
      const d = await get("/reports/balance-sheet", { to: hi });
      lines = [...(d.assets || []), ...(d.liabilities || []), ...(d.equity || [])].map((r: Any) => [r.code, r.name, r.accountType, "", "", r.balance]);
      lines.push(["", "Current earnings", "EQUITY", "", "", d.currentEarnings]);
    } else if (name === "Trial Balance") {
      const d = await get("/reports/trial-balance", { to: hi });
      lines = (d.rows || []).map((r: Any) => [r.code, r.name, r.accountType, r.debit, r.credit, r.debitBalance || -Number(r.creditBalance || 0)]);
    } else if (name === "General Ledger") {
      headers = ["Date", "Account Code", "Account", "Type", "Memo", "Debit", "Credit", "Balance"];
      const d = await get("/reports/general-ledger", { from: lo, to: hi });
      lines = (d.accounts || []).flatMap((a: Any) => a.lines.map((l: Any) => [l.date, a.account.code, a.account.name, a.account.accountType, l.memo, l.debit, l.credit, l.balance]));
    } else if (name === "Revenue by Month") {
      headers = ["Month", "Posted Revenue"];
      const years = new Set<number>();
      for (let y = Number((from || `${year}`).slice(0, 4)); y <= Number((to || `${year}`).slice(0, 4)); y++) years.add(y);
      for (const y of years) {
        const d = await get("/reports/revenue-by-month", { year: y });
        lines.push(...(d || []).map((m: Any) => [m.month, m.revenue]));
      }
    } else if (name === "Expense Summary") {
      headers = ["Date", "Vendor", "Category", "Description", "Amount", "HST", "Status"];
      const d = await get("/reports/expense-summary", { from: lo, to: hi });
      lines = (d.bills || []).map((b: Any) => [b.date, b.vendor, b.category, b.description, b.amount, b.hst, b.status]);
    } else if (name === "Sales Volume") {
      headers = ["Trade Number", "Date", "Address", "Agent", "Status", "Sale Price", "Gross Commission"];
      const d = (dash.rows as Any) || (await get("/admin-dashboard"));
      const nameOf = (id: number) => (d.agents || []).find((a: Any) => a.id === id)?.name || "";
      lines = (d.trades || []).map((t: Any) => [t.number, t.closeDate, t.address, nameOf(t.agentId), t.status, t.salePrice, t.grossCommission]);
    } else if (name === "Agent Ranking") {
      headers = ["Agent", "Completed Units", "Sales Volume", "Gross Commission"];
      const d = (dash.rows as Any) || (await get("/admin-dashboard"));
      lines = (d.agents || []).map((a: Any) => {
        const ts = (d.trades || []).filter((t: Any) => t.agentId === a.id && ["FINALIZED", "CLOSED"].includes(t.status));
        return [a.name, ts.length, ts.reduce((n: number, t: Any) => n + Number(t.salePrice || 0), 0), ts.reduce((n: number, t: Any) => n + Number(t.grossCommission || 0), 0)];
      }).sort((x: Any, y: Any) => y[2] - x[2]);
    } else if (name === "Listings & Units") {
      headers = ["Listing Number", "Address", "Agent", "List Price", "List Date", "Status"];
      lines = ((await get("/reports/listings")) || []).map((l: Any) => [l.listingNumber, l.address, l.agent, l.listPrice, l.listDate, l.status]);
    } else if (name === "Trust Reconciliation") {
      headers = ["Bank Account", "Account Type", "Period End", "Statement Balance", "Book Balance", "Difference", "Status"];
      const d = await get("/reports/trust-reconciliation", { to: hi });
      lines = (d.rows || []).map((r: Any) => [r.bank, r.accountCategory, r.lastReconciled, r.statementBalance, r.bookBalance, r.difference, r.status]);
    } else if (name === "HST Working Paper") {
      headers = ["Period Start", "Period End", "Frequency", "HST Collected", "ITCs", "Adjustments", "Net HST", "Status"];
      const d = await get("/hst-periods");
      lines = (d.history || []).map((h: Any) => [String(h.periodStart).slice(0, 10), String(h.periodEnd).slice(0, 10), h.frequency, h.hstCollected, h.itcs, h.adjustments, h.netHst, h.status]);
    } else if (name === "Payroll Register") {
      headers = ["Period Start", "Period End", "Pay Date", "Gross Pay", "CPP", "CPP2", "EI", "Income Tax", "Status"];
      const d = await get("/payroll-runs");
      lines = (Array.isArray(d) ? d : d?.rows || []).map((r: Any) => [String(r.periodStart).slice(0, 10), String(r.periodEnd).slice(0, 10), String(r.payDate).slice(0, 10), r.grossPay, r.cpp, r.cpp2, r.ei, r.incomeTax, r.status]);
    } else if (name === "T4 Payroll Working Paper") {
      headers = ["Tax Year", "Employee", "Employment Income (Box 14 working total)", "Income Tax (Box 22 working total)", "CPP (Box 16 working total)", "CPP2 (Box 16A working total)", "EI (Box 18 working total)", "Net Pay", "Payroll Lines / Prior Periods"];
      lines = ((await get("/reports/t4-working-paper")) || []).map((r: Any) => [r.year, r.name, r.gross, r.tax, r.cpp, r.cpp2, r.ei, r.net, r.count]);
    } else if (name === "T4A Commission Working Paper") {
      headers = ["Tax Year", "Agent", "Gross Commissions Paid (review for Box 20)", "Fees Deducted", "Net Cheques", "Issued Cheques"];
      lines = ((await get("/reports/t4a-working-paper")) || []).map((r: Any) => [r.year, r.name, r.gross, r.fees, r.net, r.count]);
    }

    // Shared filters (same rules as the original): dates, status, agent, free-text search; then money formatting.
    const moneyIdx = headers.map((h, i) => (MONEY.test(h) ? i : -1)).filter((i) => i >= 0);
    const dateIdx = headers.map((h, i) => (DATE.test(h.toLowerCase()) ? i : -1)).filter((i) => i >= 0);
    const statusIdx = headers.map((h, i) => (h.toLowerCase().includes("status") ? i : -1)).filter((i) => i >= 0);
    const agentIdx = headers.map((h, i) => (h.toLowerCase().includes("agent") ? i : -1)).filter((i) => i >= 0);
    const term = search.trim().toLowerCase();
    const filtered = lines.filter((row) => {
      if (from || to) {
        const ds = dateIdx.map((i) => String(row[i] ?? "").slice(0, 10)).filter((d) => d.length === 10 && d[4] === "-" && d[7] === "-");
        if (ds.length && !ds.some((d) => (!from || d >= from) && (!to || d <= to))) return false;
      }
      if (status !== "ALL" && statusIdx.length && !statusIdx.some((i) => String(row[i] ?? "").toUpperCase() === status)) return false;
      if (agent !== "ALL" && agentIdx.length && !agentIdx.some((i) => String(row[i] ?? "") === agent)) return false;
      if (term && !row.some((c) => String(c ?? "").toLowerCase().includes(term))) return false;
      return true;
    }).map((row) => row.map((c, i) => (moneyIdx.includes(i) ? fmtMoney(c) : c)));
    return { name, headers, lines: filtered };
  };

  const go = async (mode: "view" | "csv" | "pdf") => {
    if (["Profit & Loss", "Balance Sheet", "Trial Balance", "General Ledger"].includes(report) && !s.postedLines) {
      alert("No posted journal entries are available. These financial reports cannot be treated as complete until transactions, expenses, payroll and bank activity are posted to the general ledger.");
      return;
    }
    setBusy(true);
    try {
      const b = await build(report);
      if (mode === "view") setPreview(b);
      else if (mode === "pdf") downloadPdf(b.name, b.headers, b.lines);
      else downloadCsv(b.name, b.headers, b.lines);
    } catch (e) {
      alert((e as Any)?.data?.message || "Could not build this report.");
    } finally {
      setBusy(false);
    }
  };

  const labelStyle = { display: "grid", gap: 5, fontSize: 12, fontWeight: 700 } as const;
  return (
    <>
      <PageHead title="Reports" desc="Financial statements use posted double-entry journal lines. T4/T4A exports are reconciliation working papers, not official CRA slips." />
      {!s.postedLines && <Notice>No general-ledger postings found. Do not rely on the Profit &amp; Loss or Balance Sheet exports until source transactions and expenses have been posted to the ledger.</Notice>}
      <section className="panel" style={{ padding: 16, marginBottom: 16, marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,1.5fr) repeat(2,minmax(135px,1fr))", gap: 10, alignItems: "end" }}>
          <label style={labelStyle}>Choose report
            <select value={report} onChange={(e) => setReport(e.target.value)} style={{ width: "100%", minWidth: 0 }}>{REPORTS.map((r) => <option key={r} value={r}>{r}</option>)}</select>
          </label>
          <label style={labelStyle}>From date<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label style={labelStyle}>To date<input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label>
          <label style={labelStyle}>Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="ALL">All statuses</option>{STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}</select>
          </label>
          <label style={labelStyle}>Agent
            <select value={agent} onChange={(e) => setAgent(e.target.value)}><option value="ALL">All agents</option>{agents.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}</select>
          </label>
          <label style={labelStyle}>Search results<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Address, vendor, number…" /></label>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
          <button type="button" className="primary" disabled={busy} onClick={() => go("view")}><LuFileText size={15} style={{ marginRight: 6, verticalAlign: "middle" }} />Preview report</button>
          <button type="button" className="secondary" disabled={busy} onClick={() => go("csv")}>Export CSV</button>
          <button type="button" className="secondary" disabled={busy} onClick={() => go("pdf")}>Export PDF</button>
          <button type="button" className="secondary" onClick={() => { setFrom(""); setTo(""); setStatus("ALL"); setAgent("ALL"); setSearch(""); }}>Clear filters</button>
          <span style={{ fontSize: 12, color: "var(--muted,#667085)" }}>Choose one report and apply filters before preview or export.</span>
        </div>
      </section>
      <section className="panel">
        <div className="paneltitle"><h2>Live summary</h2><span className="pill">{s.postedLines || 0} posted journal lines</span></div>
        <div className="grid4">
          <Stat title="Posted Revenue" value={fr(postedRevenue)} sub="From general ledger" />
          <Stat title="Posted Expenses" value={fr(postedExpenses)} sub="From general ledger" />
          <Stat title="Posted Net Income" value={fr(postedRevenue - postedExpenses)} sub="Before tax, ledger basis" />
          <Stat title="Transactions" value={s.transactions || 0} sub="All statuses" />
        </div>
      </section>
      {preview && (
        <Modal title={`${preview.name} — Report Preview`} onClose={() => setPreview(null)}>
          <div style={{ padding: 21 }}>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginBottom: 12, flexWrap: "wrap" }}>
              <button type="button" className="secondary" onClick={() => downloadCsv(preview.name, preview.headers, preview.lines)}>Export CSV</button>
              <button type="button" className="primary" onClick={() => downloadPdf(preview.name, preview.headers, preview.lines)}>Export PDF</button>
            </div>
            <div className="tablewrap" style={{ maxHeight: "65vh", overflow: "auto" }}>
              <table>
                <thead><tr>{preview.headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
                <tbody>
                  {preview.lines.map((row, ri) => <tr key={ri}>{preview.headers.map((_, ci) => <td key={ci}>{row[ci] === null || row[ci] === undefined || row[ci] === "" ? "—" : String(row[ci])}</td>)}</tr>)}
                  {!preview.lines.length && <tr><td colSpan={preview.headers.length}><div className="empty small"><LuFileText /><p>No records found for this report.</p></div></td></tr>}
                </tbody>
              </table>
            </div>
            <div className="modalactions"><button type="button" className="secondary" onClick={() => setPreview(null)}>Close</button></div>
          </div>
        </Modal>
      )}
    </>
  );
}
