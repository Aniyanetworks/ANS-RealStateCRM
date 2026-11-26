// Trade Transactions — bodv's Transactions screen on ANS RealStateCRM's existing accounting data:
// approved/closed trade sheets with their finalize state (TradeTransaction), cheque posting,
// commission payroll and trust balances. Accounting → Trade List is unchanged.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";
import { useLazyGetSpacificTradeSheetListDataQuery } from "../../redux/api/agent/trade-sheet/tradeSheetSlice";
import { useAcct } from "../brokerage-accounting/acctShared";
import { fr, shortDate, PageHead, Stat, Empty } from "../brokerage-accounting/bodv/ui";
import { LuRefreshCw, LuSearch, LuChevronDown, LuArrowLeftRight } from "../brokerage-accounting/bodv/icons";
import TransactionEditor from "./TransactionEditor";
import { printTradeRecord } from "./tradeRecord";
import "../brokerage-accounting/bodv.css";
import "../brokerage-accounting/bodvLayout.css";

type Row = {
  id: number; uuid: string; number: string | null; stage: "DRAFT" | "FINALIZED" | "PAID" | "CLOSED"; sheetStatus: string; tradeStatus: string | null;
  entryDate: string | null; closingDate: string | null; property: string | null; client: string | null; representation: string | null;
  representationType: string | null; multipleRepresentation: string | null; listType: string | null; agent: string | null; sharedAgents: string[];
  salePrice: number; commissionReceivable: number | null; agentPayable: number | null; otherBrokeragePayable: number;
  transaction: { uuid: string; chequePosted: boolean } | null; trust: { realEstate: number; commission: number; commissionReceived: number };
  payroll: { count: number; paid: number; posted: number };
};

const STAGE_STYLE: Record<string, { background: string; color: string }> = {
  DRAFT: { background: "#f1f3f6", color: "#5c687a" },
  FINALIZED: { background: "#e8f0fb", color: "#2c5aa0" },
  PAID: { background: "#e7f5ec", color: "#2f7a4b" },
  CLOSED: { background: "#f1eadf", color: "#0f766e" },
};
const REP: Record<string, string> = { seller: "Seller", buyer: "Buyer", landlord: "Landlord", tenant: "Tenant" };
const repText = (r: Row) =>
  r.representationType === "multiple"
    ? (r.multipleRepresentation || "").split(",").map((s) => REP[s.trim()] || s.trim()).filter(Boolean).join(" + ") || "Multiple"
    : REP[r.representation || ""] || "—";
const payrollText = (r: Row) => (!r.payroll.count ? "—" : r.payroll.paid === r.payroll.count ? "Paid" : `${r.payroll.paid}/${r.payroll.count} paid`);

function RowActions({ r, onOpen, onRecord }: { r: Row; onOpen: (tab: number) => void; onRecord: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const item = (label: string, fn: () => void) => (
    <button type="button" onClick={() => { setOpen(false); fn(); }} style={{ display: "block", width: "100%", textAlign: "left", border: 0, background: "none", padding: "8px 12px", fontSize: 12, cursor: "pointer", color: "#22314d" }}>{label}</button>
  );
  return (
    <div ref={ref} className="transaction-row-actions" style={{ position: "relative", display: "inline-block" }}>
      <button type="button" className="secondary" onClick={() => setOpen(!open)} style={{ padding: "6px 10px", fontSize: 11 }}>Actions <LuChevronDown size={12} /></button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 30, background: "#fff", border: "1px solid #e1e6ee", borderRadius: 10, boxShadow: "0 12px 30px #0b33311f", minWidth: 220, padding: "4px 0" }}>
          {item("Open / Edit", () => onOpen(0))}
          {item("Trade Record: Preview / Print", onRecord)}
          {!r.transaction && item("Finalize", () => onOpen(4))}
          {item("Trust deposit / commission receipt", () => onOpen(3))}
          {r.otherBrokeragePayable > 0 && item("Pay Other Brokerage", () => onOpen(3))}
          {item("Trade Status", () => onOpen(6))}
          {r.transaction && !r.transaction.chequePosted && (
            <NavLink to={`/dashboard/accounting/account-cheque-posting/${r.transaction.uuid}`} style={{ display: "block", padding: "8px 12px", fontSize: 12, color: "#22314d" }}>Cheque Posting</NavLink>
          )}
          <NavLink to="/dashboard/accounting/tradesheet-invoicing" style={{ display: "block", padding: "8px 12px", fontSize: 12, color: "#22314d" }}>Invoice / Preview / Print</NavLink>
        </div>
      )}
    </div>
  );
}

export default function TradeTransactions() {
  const { user } = useAppSelector((state) => state.user);
  const allowed = user?.roleId == 1 || user?.userType === "superAdmin" || user?.userType === "accountant";
  const list = useAcct(allowed ? "/transactions" : null);
  const rows = (list.rows || []) as Row[];
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("");
  const [rep, setRep] = useState("");
  // ?open=<trade sheet uuid> opens that trade directly (links from other screens).
  const [editing, setEditing] = useState<{ uuid: string; tab: number } | null>(() => {
    const open = new URLSearchParams(window.location.search).get("open");
    return open ? { uuid: open, tab: 0 } : null;
  });
  const [loadTrade] = useLazyGetSpacificTradeSheetListDataQuery();

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) =>
      (!stage || r.stage === stage) &&
      (!rep || r.representation === rep || (r.multipleRepresentation || "").includes(rep)) &&
      (!s || [r.number, r.property, r.client, r.agent, ...r.sharedAgents].some((v) => String(v || "").toLowerCase().includes(s))),
    );
  }, [rows, q, stage, rep]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  useEffect(() => setPage(1), [q, stage, rep, pageSize]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const pageRows = filtered.slice((current - 1) * pageSize, current * pageSize);
  // Compact page list: first, last and the pages around the current one.
  const pageList = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - current) <= 2);

  const totals = useMemo(() => ({
    open: rows.filter((r) => r.stage === "DRAFT").length,
    finalized: rows.filter((r) => r.stage === "FINALIZED").length,
    receivable: rows.filter((r) => r.stage !== "CLOSED").reduce((n, r) => n + Number(r.commissionReceivable || 0), 0),
    trust: rows.reduce((n, r) => n + Number(r.trust.realEstate || 0), 0),
  }), [rows]);

  const record = async (r: Row) => {
    const res = await loadTrade(r.uuid).unwrap().catch(() => null);
    if (res?.data?.tradeSheetData) printTradeRecord(res.data.tradeSheetData);
  };

  if (!allowed) {
    return (
      <div className="dvac"><div className="content">
        <PageHead title="Trade Transactions" desc="Trade accounting is limited to Super Admin and Accountant users." />
      </div></div>
    );
  }

  return (
    <div className="dvac">
      <div className="content">
        <PageHead title="Transactions" desc="Approved trade sheets with commission, trust, cheque and payroll status." />

        <div className="grid4" style={{ marginBottom: 18 }}>
          <Stat title="Open (not finalized)" value={totals.open} />
          <Stat title="Finalized, awaiting payroll" value={totals.finalized} />
          <Stat title="Commission receivable" value={fr(totals.receivable)} sub="Finalized trades not yet closed" />
          <Stat title="Deposits held in trust" value={fr(totals.trust)} />
        </div>

        <section className="panel transaction-list-panel">
          <div className="transaction-toolbar" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
            <div style={{ position: "relative", flex: "1 1 280px" }}>
              <LuSearch size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#98a2b3" }} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search trade number, property, client or agent..." style={{ width: "100%", paddingLeft: 32 }} />
            </div>
            <button type="button" className="secondary" onClick={() => list.refetch()} disabled={list.isFetching} style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <LuRefreshCw size={15} /> {list.isFetching ? "Refreshing…" : "Refresh"}
            </button>
            <select value={stage} onChange={(e) => setStage(e.target.value)} style={{ flex: "0 0 170px" }}>
              <option value="">All statuses</option>
              {["DRAFT", "FINALIZED", "PAID", "CLOSED"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={rep} onChange={(e) => setRep(e.target.value)} style={{ flex: "0 0 170px" }}>
              <option value="">All representation</option>
              {Object.entries(REP).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {list.isFetching && !rows.length ? (
            <div className="empty small"><p>Loading transactions…</p></div>
          ) : !filtered.length ? (
            <Empty icon={<LuArrowLeftRight />} title={rows.length ? "No matching transactions" : "No transactions yet"} text={rows.length ? "Try a different search or filter." : "Approved trade sheets appear here automatically."} />
          ) : (
            <div className="tablewrap">
              <table className="transaction-list-table">
                <thead>
                  <tr>
                    <th>Entry Date</th><th>Trade #</th><th>Property</th><th>Client</th><th>Our Representation</th>
                    <th style={{ textAlign: "right" }}>Sale Price</th><th style={{ textAlign: "right" }}>Commission Receivable</th>
                    <th style={{ textAlign: "right" }}>Other Brokerage Payable</th><th style={{ textAlign: "right" }}>Agent Payable</th>
                    <th style={{ textAlign: "right" }}>Trust Deposit</th><th>Status</th><th>Payroll</th><th className="transaction-actions-label">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr key={r.uuid}>
                      <td>{shortDate(r.entryDate)}</td>
                      <td><button type="button" className="textbutton" style={{ marginTop: 0 }} onClick={() => setEditing({ uuid: r.uuid, tab: 0 })}>{r.number || "—"}</button></td>
                      <td style={{ maxWidth: 240 }}>{r.property || "—"}<div className="muted" style={{ fontSize: 10 }}>{r.agent || ""}{r.sharedAgents.length ? ` + ${r.sharedAgents.join(", ")}` : ""}</div></td>
                      <td>{r.client || "—"}</td>
                      <td>{repText(r)}{r.listType ? <div className="muted" style={{ fontSize: 10 }}>{r.listType}</div> : null}</td>
                      <td style={{ textAlign: "right" }}>{fr(r.salePrice)}</td>
                      <td style={{ textAlign: "right" }}>{r.commissionReceivable == null ? <span className="muted">Not finalized</span> : fr(r.commissionReceivable)}</td>
                      <td style={{ textAlign: "right" }}>{r.otherBrokeragePayable ? fr(r.otherBrokeragePayable) : "—"}</td>
                      <td style={{ textAlign: "right" }}>{r.agentPayable == null ? "—" : fr(r.agentPayable)}</td>
                      <td style={{ textAlign: "right" }}>{r.trust.realEstate ? fr(r.trust.realEstate) : "—"}</td>
                      <td><span className="status" style={STAGE_STYLE[r.stage]}>{r.stage}</span>{r.transaction?.chequePosted ? <div className="muted" style={{ fontSize: 10 }}>Cheque posted</div> : null}</td>
                      <td>{payrollText(r)}</td>
                      <td><RowActions r={r} onOpen={(tab) => setEditing({ uuid: r.uuid, tab })} onRecord={() => record(r)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filtered.length > 0 && (
            <div className="transaction-pager" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
              <span className="muted" style={{ fontSize: 12 }}>
                Showing {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, filtered.length)} of {filtered.length} transactions
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <button type="button" className="secondary" disabled={current === 1} onClick={() => setPage(current - 1)} style={{ padding: "6px 10px", fontSize: 11 }}>Previous</button>
                {pageList.map((n, i) => (
                  <span key={n} style={{ display: "contents" }}>
                    {i > 0 && n - pageList[i - 1] > 1 && <span className="muted">…</span>}
                    <button type="button" className={n === current ? "primary" : "secondary"} onClick={() => setPage(n)} style={{ padding: "6px 10px", fontSize: 11, minWidth: 34 }}>{n}</button>
                  </span>
                ))}
                <button type="button" className="secondary" disabled={current === pages} onClick={() => setPage(current + 1)} style={{ padding: "6px 10px", fontSize: 11 }}>Next</button>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ width: "auto", padding: "5px 8px", fontSize: 11 }}>
                  {[25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
                </select>
              </div>
            </div>
          )}
        </section>
      </div>
      {editing && <TransactionEditor uuid={editing.uuid} initialTab={editing.tab} onClose={() => setEditing(null)} onChanged={() => list.refetch()} />}
    </div>
  );
}
