// Banking & Reconciliation — the original ANS Accounting screen: Trust Banking (account tabs with book balance and
// bank entries, trust controls, trust ledger, client/matter liabilities, reconciliation history) and Journal Entries
// (manual journals; Super Admin can edit/delete manual journals in open periods). Trust activity posts to the ledger.
import { Fragment, useMemo, useState } from "react";
import { useAppSelector } from "../../../redux/hooks";
import { useAcct, useAcctAction } from "../acctShared";
import { LuCheck, LuLandmark, LuPlus, LuRefreshCw, LuSearch, LuShieldCheck, LuTrash2, LuX, LuFileText } from "./icons";
import { Empty, Modal, MoneyInput, Notice, PageHead, Stat, fr, todayYmd } from "./ui";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
type Bank = { id: number; name: string; accountCategory: string | null; openingBalance: number; bookBalance: number; status: string };
const TRUST = ["REAL_ESTATE_TRUST", "COMMISSION_TRUST"];
const label = (v?: string | null) => String(v || "").replace(/_/g, " ");
const d10 = (v?: string | null) => (v ? String(v).slice(0, 10) : "—");

// Trust activity types: the original's deposit/disbursement plus ANS RealStateCRM's commission flows.
const ACTIVITY: Record<string, { label: string; path: string; account: string[]; trade?: boolean; party: "received" | "payee" | null; hst?: boolean; transfer?: "ret-ct" | "ct-op" }> = {
  DEPOSIT: { label: "DEPOSIT", path: "/trust/deposit", account: ["REAL_ESTATE_TRUST"], party: "received" },
  COMMISSION_RECEIPT: { label: "DEPOSIT — commission receipt (Commission Trust)", path: "/trust/commission-receipt", account: ["COMMISSION_TRUST"], trade: true, party: "received", hst: true },
  DISBURSEMENT: { label: "DISBURSEMENT", path: "/trust/disbursement", account: TRUST, party: "payee" },
  COMMISSION_TRANSFER: { label: "Commission transfer — Real Estate Trust → Commission Trust", path: "/trust/commission-transfer", account: [], trade: true, party: null, hst: true, transfer: "ret-ct" },
  COOP: { label: "Pay cooperating brokerage", path: "/trust/coop-payment", account: ["COMMISSION_TRUST"], trade: true, party: "payee" },
  OPERATING: { label: "Transfer brokerage share to operating", path: "/trust/transfer-to-operating", account: [], party: null, transfer: "ct-op" },
  REFUND: { label: "DFT — refund deposit", path: "/trust/refund", account: ["REAL_ESTATE_TRUST"], trade: true, party: "payee" },
};

function TradePicker({ value, onChange, required }: { value: string; onChange: (id: string, t?: Any) => void; required?: boolean }) {
  const [q, setQ] = useState("");
  const trades = useAcct("/trust/trades", { q });
  const rows = (trades.rows || []) as Any[];
  return (
    <>
      <input placeholder="Search trade #, client or address" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 6 }} />
      <select required={required} value={value} onChange={(e) => onChange(e.target.value, rows.find((t) => String(t.id) === e.target.value))}>
        <option value="">Select transaction</option>
        {rows.map((t) => <option key={t.id} value={t.id}>{t.tradeSheetTypeId || "No trade #"} · {t.properties?.[0]?.propertyAddress || "Property"}</option>)}
      </select>
    </>
  );
}

function TrustActivityModal({ banks, onClose }: { banks: Bank[]; onClose: () => void }) {
  const { run, loading } = useAcctAction();
  const [type, setType] = useState("DEPOSIT");
  const cfg = ACTIVITY[type];
  const [f, setF] = useState<Any>({ bankAccountId: "", retBankAccountId: "", ctBankAccountId: "", operatingBankAccountId: "", tradeSheetId: "", ledgerDate: todayYmd(), party: "", matter: "", description: "", amount: "", hstAmount: "", reference: "", paymentType: "CHEQUE", releaseAuthorized: false, authorityReference: "" });
  const of = (cats: string[]) => banks.filter((b) => cats.includes(String(b.accountCategory)) && b.status !== "inactive");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "REFUND" && !f.releaseAuthorized) return alert("A signed mutual release / written direction must be on file before refunding trust money.");
    const body: Any = {
      ledgerDate: f.ledgerDate, amount: f.amount === "" ? undefined : Number(f.amount), reference: f.reference || null, paymentType: f.paymentType,
      description: [f.description, f.matter && `Matter: ${f.matter}`].filter(Boolean).join(" · ") || undefined,
      tradeSheetId: f.tradeSheetId ? Number(f.tradeSheetId) : undefined,
    };
    if (cfg.transfer === "ret-ct") Object.assign(body, { retBankAccountId: Number(f.retBankAccountId), ctBankAccountId: Number(f.ctBankAccountId) });
    else if (cfg.transfer === "ct-op") Object.assign(body, { ctBankAccountId: Number(f.ctBankAccountId), operatingBankAccountId: Number(f.operatingBankAccountId) });
    else body.bankAccountId = Number(f.bankAccountId);
    if (cfg.party === "received") body.receivedFrom = f.party;
    if (cfg.party === "payee") body.payeeName = f.party;
    if (cfg.hst && f.hstAmount !== "") body.hstAmount = Number(f.hstAmount);
    if (type === "REFUND") Object.assign(body, { releaseAuthorized: true, authorityReference: f.authorityReference || null });
    if (await run(cfg.path, body)) onClose();
  };
  const bankSelect = (key: string, cats: string[], text: string) => (
    <label>{text}
      <select required value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })}>
        <option value="">Select</option>
        {of(cats).map((b) => <option key={b.id} value={b.id}>{b.name} · {label(b.accountCategory)}</option>)}
      </select>
    </label>
  );
  return (
    <Modal title="Trust Deposit / Disbursement" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="formgrid">
          <label>Type
            <select value={type} onChange={(e) => setType(e.target.value)}>{Object.entries(ACTIVITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
          </label>
          {cfg.transfer === "ret-ct" && <>{bankSelect("retBankAccountId", ["REAL_ESTATE_TRUST"], "From Real Estate Trust")}{bankSelect("ctBankAccountId", ["COMMISSION_TRUST"], "To Commission Trust")}</>}
          {cfg.transfer === "ct-op" && <>{bankSelect("ctBankAccountId", ["COMMISSION_TRUST"], "From Commission Trust")}{bankSelect("operatingBankAccountId", ["OPERATING"], "To operating account")}</>}
          {!cfg.transfer && bankSelect("bankAccountId", cfg.account, "Trust account")}
          <label>Related Transaction
            <TradePicker required={!!cfg.trade} value={f.tradeSheetId} onChange={(id, t) => setF({ ...f, tradeSheetId: id, matter: t?.tradeSheetTypeId || f.matter, description: f.description || (type === "COMMISSION_RECEIPT" ? `Commission AR receipt ${t?.tradeSheetTypeId || ""}` : f.description) })} />
          </label>
          <label>Date<input type="date" required value={f.ledgerDate} onChange={(e) => setF({ ...f, ledgerDate: e.target.value })} /></label>
          {cfg.party && <label>{cfg.party === "received" ? "Client / Beneficiary (received from)" : type === "COOP" ? "Cooperating brokerage" : "Payee"}<input required={type !== "REFUND"} value={f.party} onChange={(e) => setF({ ...f, party: e.target.value })} /></label>}
          <label>Matter / Deal<input value={f.matter} onChange={(e) => setF({ ...f, matter: e.target.value })} /></label>
          <label>Description<input required={type === "DEPOSIT" || type === "DISBURSEMENT"} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
          <label>{type === "REFUND" ? "Amount (blank = full balance)" : "Amount"}<MoneyInput min={0.01} required={type !== "REFUND"} value={f.amount} onChange={(v) => setF({ ...f, amount: v })} /></label>
          {cfg.hst && <label>HST included<MoneyInput min={0} value={f.hstAmount} onChange={(v) => setF({ ...f, hstAmount: v })} /></label>}
          {!cfg.transfer && (
            <label>Payment type
              <select value={f.paymentType} onChange={(e) => setF({ ...f, paymentType: e.target.value })}>{["CHEQUE", "BANK_DRAFT", "EFT", "WIRE", "CASH"].map((p) => <option key={p} value={p}>{label(p)}</option>)}</select>
            </label>
          )}
          <label>Reference<input value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} /></label>
          {type === "REFUND" && (
            <>
              <label>Release / direction reference<input value={f.authorityReference} onChange={(e) => setF({ ...f, authorityReference: e.target.value })} placeholder="e.g. Mutual release signed 2026-10-12" /></label>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" style={{ width: "auto" }} checked={f.releaseAuthorized} onChange={(e) => setF({ ...f, releaseAuthorized: e.target.checked })} />A signed mutual release / written direction is on file</label>
            </>
          )}
        </div>
        <Notice>This posts to the trust ledger and bank activity automatically. Deposits are client liabilities, not brokerage revenue; commission receipts and transfers recognise commission net of HST.</Notice>
        <div className="modalactions">
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button className="primary" disabled={loading}><LuCheck /> Post Trust Activity</button>
        </div>
      </form>
    </Modal>
  );
}

function ReconcileModal({ banks, onClose }: { banks: Bank[]; onClose: () => void }) {
  const { run, loading } = useAcctAction();
  const [bankId, setBankId] = useState("");
  const [periodEnd, setPeriodEnd] = useState(todayYmd());
  const [statement, setStatement] = useState("");
  const [cleared, setCleared] = useState<number[] | null>(null);
  const ws = useAcct(bankId ? "/reconciliations/worksheet" : null, { bankAccountId: bankId, periodEnd });
  const liab = useAcct("/trust/liabilities");
  const w = (ws.rows || {}) as Any;
  const lines = (w.lines || []) as { id: number; date: string; entryNumber: string; memo: string; amount: number }[];
  const picked = cleared ?? (w.reconciliation?.clearedLineIds || lines.map((l: Any) => l.id));
  const clearedBalance = Number(w.openingClearedBalance || 0) + lines.filter((l) => picked.includes(l.id)).reduce((n, l) => n + l.amount, 0);
  const bank = banks.find((b) => String(b.id) === bankId);
  const liability = bank && TRUST.includes(String(bank.accountCategory)) ? ((liab.rows as Any)?.summary || []).find((s: Any) => s.trustAccountType === bank.accountCategory)?.clientLiability : null;
  const diff = Number(statement || 0) - clearedBalance;
  const save = async (finalize: boolean) => {
    if (!bankId) return alert("Select an account.");
    if (await run("/reconciliations", { bankAccountId: Number(bankId), periodEnd, statementBalance: Number(statement || 0), clearedLineIds: picked, finalize })) onClose();
  };
  return (
    <Modal title="Monthly Reconciliation" onClose={onClose} wide>
      <div style={{ padding: 16, overflow: "auto" }}>
        <div className="formgrid">
          <label>Account
            <select required value={bankId} onChange={(e) => { setBankId(e.target.value); setCleared(null); }}>
              <option value="">Select</option>
              {banks.filter((b) => b.status !== "inactive").map((b) => <option key={b.id} value={b.id}>{b.name} · {label(b.accountCategory)}</option>)}
            </select>
          </label>
          <label>Period end<input type="date" required value={periodEnd} onChange={(e) => { setPeriodEnd(e.target.value); setCleared(null); }} /></label>
          <label>Statement balance<MoneyInput required value={statement} onChange={setStatement} /></label>
        </div>
        {bankId && (
          <>
            <div className="grid4" style={{ marginTop: 14 }}>
              <Stat title="Book balance" value={fr(w.bookBalance)} sub={`Ledger at ${periodEnd}`} />
              <Stat title="Cleared balance" value={fr(clearedBalance)} sub="Opening + cleared items" />
              <Stat title="Bank − cleared" value={fr(diff)} sub={Math.abs(diff) < 0.01 ? "Balanced" : "Difference to resolve"} />
              {liability != null && <Stat title="Book − trust liability" value={fr(Number(w.bookBalance || 0) - Number(liability || 0))} sub="Must be zero for trust accounts" />}
            </div>
            <h3>Items to clear</h3>
            <div className="tablewrap">
              <table>
                <thead><tr><th /><th>Date</th><th>Entry</th><th>Description</th><th>Amount</th></tr></thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id}>
                      <td><input type="checkbox" style={{ width: "auto" }} checked={picked.includes(l.id)} onChange={(e) => setCleared(e.target.checked ? [...picked, l.id] : picked.filter((x: number) => x !== l.id))} /></td>
                      <td>{l.date}</td><td>{l.entryNumber}</td><td>{l.memo || "—"}</td><td>{fr(l.amount)}</td>
                    </tr>
                  ))}
                  {!lines.length && <tr><td colSpan={5} className="muted">No uncleared items for this account up to the period end.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
        <Notice>Reconciliation is only complete when bank = cleared book balance and, for trust accounts, book = client/matter trust liability. Completing records your sign-off time.</Notice>
        <div className="modalactions">
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="secondary" disabled={loading || !bankId} onClick={() => save(false)}>Save Draft</button>
          <button type="button" className="primary" disabled={loading || !bankId} onClick={() => save(true)}><LuShieldCheck /> Save Reconciliation</button>
        </div>
      </div>
    </Modal>
  );
}

type Line = { glAccountId: string; debit: string; credit: string };
function JournalModal({ title, initial, onClose, onSave, saving }: { title: string; initial: { entryDate: string; memo: string; lines: Line[] }; onClose: () => void; onSave: (v: { entryDate: string; memo: string; lines: Line[] }) => void; saving: boolean }) {
  const gl = useAcct("/gl-accounts");
  const accounts = ((gl.rows || []) as Any[]).filter((a) => a.active !== false);
  const [j, setJ] = useState(initial);
  const total = (k: "debit" | "credit") => j.lines.reduce((n, l) => n + Number(l[k] || 0), 0);
  const setLine = (i: number, patch: Partial<Line>) => setJ({ ...j, lines: j.lines.map((l, k) => (k === i ? { ...l, ...patch } : l)) });
  const submit = () => {
    const ls = j.lines.map((l) => ({ ...l, d: Number(l.debit || 0), c: Number(l.credit || 0) }));
    if (!j.entryDate) return alert("Enter a journal date.");
    if (ls.length < 2 || ls.some((l) => !l.glAccountId) || ls.some((l) => l.d < 0 || l.c < 0 || (l.d > 0 && l.c > 0)) || Math.abs(total("debit") - total("credit")) > 0.009 || total("debit") <= 0) return alert("A journal must have at least two valid lines and total debits must equal total credits.");
    onSave(j);
  };
  return (
    <Modal title={title} onClose={onClose} wide>
      <div style={{ padding: 16, overflow: "auto" }}>
        <Notice>Manual journals affect the general ledger and financial reports. Enter a clear memo and balanced debit/credit lines. Closed periods are not allowed.</Notice>
        <div className="formgrid">
          <label>Journal date<input type="date" value={j.entryDate} onChange={(e) => setJ({ ...j, entryDate: e.target.value })} /></label>
          <label>Description / memo<input value={j.memo} onChange={(e) => setJ({ ...j, memo: e.target.value })} placeholder="Reason for this journal adjustment" /></label>
        </div>
        <h3>Journal lines</h3>
        <div className="tablewrap">
          <table>
            <thead><tr><th>General ledger account</th><th>Debit</th><th>Credit</th><th /></tr></thead>
            <tbody>
              {j.lines.map((l, i) => (
                <tr key={i}>
                  <td>
                    <select value={l.glAccountId} onChange={(e) => setLine(i, { glAccountId: e.target.value })}>
                      <option value="">Select account</option>
                      {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                    </select>
                  </td>
                  <td><MoneyInput min={0} value={l.debit} onChange={(v) => setLine(i, { debit: v, credit: Number(v) > 0 ? "0" : l.credit })} /></td>
                  <td><MoneyInput min={0} value={l.credit} onChange={(v) => setLine(i, { credit: v, debit: Number(v) > 0 ? "0" : l.debit })} /></td>
                  <td><button type="button" className="secondary" disabled={j.lines.length <= 2} onClick={() => setJ({ ...j, lines: j.lines.filter((_, k) => k !== i) })}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="actions" style={{ marginTop: 14 }}>
          <button type="button" className="secondary" onClick={() => setJ({ ...j, lines: [...j.lines, { glAccountId: "", debit: "0", credit: "0" }] })}><LuPlus size={15} /> Add line</button>
          <span>Debits: {fr(total("debit"))} · Credits: {fr(total("credit"))}</span>
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="primary" disabled={saving} onClick={submit}><LuCheck size={15} /> {saving ? "Saving…" : "Save Journal"}</button>
        </div>
      </div>
    </Modal>
  );
}

function Journals({ isSuper }: { isSuper: boolean }) {
  const [search, setSearch] = useState("");
  const q = useAcct("/journals", { search, limit: 500 });
  const me = useAcct("/month-end", { month: todayYmd().slice(0, 7) });
  const { run, loading } = useAcctAction();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Any>(null);
  const rows = (q.rows || []) as Any[];
  const closedThrough = (((me.rows as Any)?.history || []) as Any[]).filter((h) => h.closedAt).map((h) => String(h.periodEnd).slice(0, 10)).sort().pop() || "";
  const isClosed = (e: Any) => Boolean(closedThrough && String(e.entryDate).slice(0, 10) <= closedThrough);
  const toForm = (e: Any) => ({ entryDate: String(e.entryDate).slice(0, 10), memo: e.memo || "", lines: e.lines.map((l: Any) => ({ glAccountId: String(l.glAccountId), debit: String(Number(l.debit || 0)), credit: String(Number(l.credit || 0)) })) });
  const save = async (v: Any, uuid?: string) => {
    const body = { entryDate: v.entryDate, memo: v.memo, lines: v.lines.map((l: Line) => ({ glAccountId: Number(l.glAccountId), debit: Number(l.debit || 0), credit: Number(l.credit || 0) })) };
    if (await run(uuid ? `/journals/${uuid}` : "/journals", body, { method: uuid ? "PATCH" : "POST", success: uuid ? "Journal entry updated." : "Manual journal entry created." })) { setAdding(false); setEditing(null); }
  };
  const remove = async (e: Any) => {
    if (!window.confirm(`Permanently delete journal ${e.entryNumber}?\nDate: ${String(e.entryDate).slice(0, 10)}\nMemo: ${e.memo || "—"}\nDebits: ${fr(e.totalDebit)}\n\nThis cannot be undone.`)) return;
    await run(`/journals/${e.uuid}`, undefined, { method: "DELETE", success: "Journal entry deleted." });
  };
  return (
    <>
      <section className="panel">
        <div className="paneltitle">
          <h2>General Ledger Journals</h2>
          <div style={{ display: "flex", gap: 8 }}>
            {isSuper && <button className="primary" onClick={() => setAdding(true)}><LuPlus size={16} /> Add Journal Entry</button>}
            <button className="secondary" onClick={() => q.refetch()}><LuRefreshCw size={16} /> Refresh</button>
          </div>
        </div>
        <div className="toolbar">
          <div className="search"><LuSearch size={17} /><input placeholder="Search date, memo, source or journal ID" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <span className="muted">{rows.length} journal entries</span>
        </div>
        <Notice>Journal entries feed the General Ledger and reports. Only Super Admin can edit or delete manual entries; system entries are changed from their source record. Closed accounting periods are locked.</Notice>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Date</th><th>Journal / Source</th><th>Description</th><th>Debits</th><th>Credits</th><th>Balance</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map((e) => {
                const closed = isClosed(e), balanced = Math.abs(Number(e.totalDebit) - Number(e.totalCredit)) < 0.01, editable = isSuper && e.source === "MANUAL" && e.status === "POSTED";
                return (
                  <Fragment key={e.uuid}>
                    <tr>
                      <td>{String(e.entryDate).slice(0, 10)}</td>
                      <td><div>{e.entryNumber}</div><small>{e.source || "Manual"}{e.status === "VOID" ? " · VOID" : ""}</small></td>
                      <td>{e.memo || "—"}</td>
                      <td>{fr(e.totalDebit)}</td>
                      <td>{fr(e.totalCredit)}</td>
                      <td><span className="pill" style={{ background: balanced ? "#e7f6ec" : "#fff0ed" }}>{balanced ? "Balanced" : "Out of balance"}</span></td>
                      <td>
                        {editable && (
                          <div className="actions">
                            <button className="secondary" disabled={closed || loading} onClick={() => setEditing(e)}>Edit</button>
                            <button className="secondary" disabled={closed || loading} onClick={() => remove(e)}><LuX size={14} /> Delete</button>
                          </div>
                        )}
                        {closed && <small>Closed period</small>}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={7} style={{ background: "#f8fafc", padding: "8px 14px" }}>
                        <details>
                          <summary>View journal lines ({e.lines.length})</summary>
                          <table>
                            <thead><tr><th>Account</th><th>Account name</th><th>Debit</th><th>Credit</th></tr></thead>
                            <tbody>
                              {e.lines.map((l: Any) => <tr key={l.id}><td>{l.glAccount?.code || "—"}</td><td>{l.glAccount?.name || "Unknown account"}</td><td>{fr(l.debit)}</td><td>{fr(l.credit)}</td></tr>)}
                              {!e.lines.length && <tr><td colSpan={4}>No journal lines were returned.</td></tr>}
                            </tbody>
                          </table>
                        </details>
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
              {!rows.length && <tr><td colSpan={7}><Empty icon={<LuFileText />} title="No journal entries found" text="Refresh the list or check your reporting permissions." /></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {adding && <JournalModal title="Add Manual Journal Entry" saving={loading} initial={{ entryDate: todayYmd(), memo: "", lines: [{ glAccountId: "", debit: "0", credit: "0" }, { glAccountId: "", debit: "0", credit: "0" }] }} onClose={() => setAdding(false)} onSave={(v) => save(v)} />}
      {editing && <JournalModal title="Edit Journal Entry" saving={loading} initial={toForm(editing)} onClose={() => setEditing(null)} onSave={(v) => save(v, editing.uuid)} />}
    </>
  );
}

export default function Banking() {
  const { user } = useAppSelector((s) => s.user) as { user: { roleId?: number; userType?: string } };
  const isSuper = user?.roleId == 1 || user?.userType === "superAdmin";
  const [tab, setTab] = useState<"trust" | "journals">("trust");
  const banksQ = useAcct("/bank-accounts");
  const banks = ((banksQ.rows || []) as Bank[]).slice().sort((a, b) => String(a.accountCategory || "").localeCompare(String(b.accountCategory || "")) || a.name.localeCompare(b.name));
  const trustBanks = banks.filter((b) => TRUST.includes(String(b.accountCategory)));
  const [bankId, setBankId] = useState<number | null>(null);
  const current = banks.find((b) => b.id === bankId) || banks[0];
  const register = useAcct(current ? `/bank-accounts/${current.id}/register` : null, { from: "2000-01-01", to: "2100-12-31" });
  const trustTx = useAcct("/trust/transactions", { status: "POSTED", from: "2000-01-01", to: "2100-12-31" });
  const liab = useAcct("/trust/liabilities");
  const recs = useAcct("/reconciliations");
  const { run } = useAcctAction();
  const [activity, setActivity] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  const entries = ((register.rows as Any)?.rows || []).slice().reverse() as Any[];
  const trust = (trustTx.rows || []) as Any[];
  const accountTrust = trust.filter((t) => t.bankAccountId === current?.id);
  const summary = ((liab.rows as Any)?.summary || []) as Any[];
  const matters = ((liab.rows as Any)?.matters || []) as Any[];
  const trustRecs = useMemo(() => ((recs.rows || []) as Any[]).filter((r) => trustBanks.some((b) => b.id === r.bankAccountId)), [recs.rows, trustBanks]);

  const voidTrust = async (t: Any) => {
    if (!isSuper) return alert("Only a Super Admin can delete banking transactions.");
    const reason = window.prompt(`Void this trust banking transaction?\n\nDate: ${d10(t.ledgerDate)}\nAccount: ${t.bankAccount?.name || "Unknown"}\nClient: ${t.clientName || t.payeeName || "—"}\nType: ${t.direction}\nAmount: ${fr(t.amount)}\nReference: ${t.reference || "—"}\n\nIts journal is reversed (and its paired transfer leg, if any). Enter a reason:`);
    if (!reason) return;
    await run(`/trust/transactions/${t.uuid}/void`, { reason });
  };

  return (
    <>
      <PageHead title="Banking & Reconciliation" desc="Manage trust banking, monthly reconciliations, and general-ledger journal entries.">
        <button className="secondary" onClick={() => setActivity(true)} disabled={!trustBanks.length}><LuPlus /> Trust Deposit / Disbursement</button>
        <button className="primary" onClick={() => setReconciling(true)} disabled={!banks.length}><LuShieldCheck /> Reconcile</button>
      </PageHead>
      <div className="tabs" style={{ display: "flex", gap: 8, margin: "12px 0 18px", flexWrap: "wrap" }}>
        <button className={tab === "trust" ? "primary" : "secondary"} onClick={() => setTab("trust")}>Trust Banking</button>
        <button className={tab === "journals" ? "primary" : "secondary"} onClick={() => setTab("journals")}>Journal Entries</button>
      </div>
      {tab === "journals" ? <Journals isSuper={isSuper} /> : (
        <>
          <div className="tabs" style={{ display: "flex", gap: 8, margin: "12px 0 18px", flexWrap: "wrap" }}>
            {banks.map((b) => <button key={b.id} className={current?.id === b.id ? "primary" : "secondary"} onClick={() => setBankId(b.id)}>{b.name} <small style={{ opacity: 0.8 }}>· {label(b.accountCategory)}</small></button>)}
          </div>
          {current && (
            <section className="panel">
              <div className="paneltitle"><h2>{current.name}</h2><span className="pill">{label(current.accountCategory)}</span></div>
              <div className="grid3">
                <Stat title="Opening Balance" value={fr(current.openingBalance)} sub="Account setup balance" />
                <Stat title="Current Book Balance" value={fr(current.bookBalance)} sub="Opening balance plus posted bank entries" />
                <Stat title="Bank Entries" value={String(entries.length)} sub="Entries recorded for this account" />
              </div>
              <div className="tablewrap">
                <table>
                  <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Reference</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {entries.map((e) => <tr key={e.id}><td>{e.date}</td><td>{e.deposit ? "DEPOSIT" : "WITHDRAWAL"}</td><td>{e.memo || "—"}</td><td>{e.entryNumber || "—"}</td><td>{fr(e.deposit ? e.deposit : -e.withdrawal)}</td><td>Posted</td></tr>)}
                    {!entries.length && <tr><td colSpan={6}><Empty icon={<LuLandmark />} title="No bank entries for this account" text="Posted payments and deposits linked to this account will appear here." /></td></tr>}
                  </tbody>
                </table>
              </div>
              {accountTrust.length > 0 && (
                <>
                  <h3 style={{ marginTop: 18 }}>Trust ledger entries for this account</h3>
                  <div className="tablewrap">
                    <table>
                      <thead><tr><th>Date</th><th>Client / Matter</th><th>Direction</th><th>Description</th><th>Reference</th><th>Amount</th></tr></thead>
                      <tbody>{accountTrust.map((t) => <tr key={t.uuid}><td>{d10(t.ledgerDate)}</td><td>{[t.clientName || t.payeeName, t.tradeSheet?.tradeSheetTypeId || t.matter].filter(Boolean).join(" · ") || "—"}</td><td>{t.direction}</td><td>{t.description || label(t.kind)}</td><td>{t.reference || "—"}</td><td>{fr(t.amount)}</td></tr>)}</tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          )}
          <div className="grid3">{trustBanks.map((b) => <Stat key={b.id} title={b.name} value={fr(b.bookBalance)} sub={label(b.accountCategory)} />)}</div>
          <section className="panel">
            <div className="paneltitle"><h2>Trust controls</h2><span className="pill">Bank balance must equal client liability</span></div>
            <div className="grid3">
              {TRUST.map((type) => {
                const s = summary.find((x) => x.trustAccountType === type);
                return <Stat key={type} title={type === "REAL_ESTATE_TRUST" ? "Real Estate Trust Liability" : "Commission Trust Liability"} value={fr(s?.clientLiability)} sub={s && Math.abs(Number(s.difference)) >= 0.01 ? `Bank differs by ${fr(s.difference)}` : "Outstanding client/matter liability"} />;
              })}
            </div>
            <Notice>Trust deposits are liabilities, not brokerage revenue. Trust disbursements reduce the related client/matter liability. The system will block a disbursement above the available liability.</Notice>
          </section>
          <section className="panel tablewrap">
            <div className="paneltitle"><h2>Trust ledger</h2></div>
            <table>
              <thead><tr><th>Date</th><th>Account</th><th>Client / Matter</th><th>Type</th><th>Description</th><th>Amount</th>{isSuper && <th>Actions</th>}</tr></thead>
              <tbody>
                {trust.slice(0, 100).map((t) => (
                  <tr key={t.uuid}>
                    <td>{d10(t.ledgerDate)}</td>
                    <td>{t.bankAccount?.name || "—"}</td>
                    <td>{[t.clientName || t.payeeName, t.tradeSheet?.tradeSheetTypeId || t.matter].filter(Boolean).join(" · ") || "—"}</td>
                    <td>{t.direction}</td>
                    <td>{t.description || label(t.kind)}</td>
                    <td>{fr(t.amount)}</td>
                    {isSuper && <td><button type="button" className="secondary" onClick={() => voidTrust(t)} title="Void trust transaction"><LuTrash2 size={15} /> Delete</button></td>}
                  </tr>
                ))}
                {!trust.length && <tr><td colSpan={7}><Empty icon={<LuLandmark />} title="No trust activity yet" text="Add a trust deposit when funds are received and a disbursement when funds are released." /></td></tr>}
              </tbody>
            </table>
          </section>
          <section className="panel tablewrap">
            <div className="paneltitle"><h2>Client / matter liabilities</h2></div>
            <table>
              <thead><tr><th>Client / Matter</th><th>Trust type</th><th>Outstanding</th></tr></thead>
              <tbody>
                {matters.map((m, i) => <tr key={i}><td>{[m.trade?.name, m.trade?.tradeSheetTypeId || m.matter].filter(Boolean).join(" · ") || "Unassigned"}</td><td>{m.trustAccountType}</td><td>{fr(m.balance)}</td></tr>)}
                {!matters.length && <tr><td colSpan={3}>No outstanding liabilities.</td></tr>}
              </tbody>
            </table>
          </section>
          <section className="panel tablewrap">
            <h2>Reconciliation history</h2>
            <table>
              <thead><tr><th>Account</th><th>Period</th><th>Bank</th><th>Book</th><th>Cleared</th><th>Bank−Cleared</th><th>Status</th></tr></thead>
              <tbody>
                {trustRecs.map((r) => <tr key={r.id}><td>{r.bankAccount?.name || "—"}</td><td>{d10(r.periodEnd)}</td><td>{fr(r.statementBalance)}</td><td>{fr(r.bookBalance)}</td><td>{fr(r.clearedBalance)}</td><td>{fr(r.difference)}</td><td>{r.status}</td></tr>)}
                {!trustRecs.length && <tr><td colSpan={7} className="muted">No trust reconciliations saved yet.</td></tr>}
              </tbody>
            </table>
          </section>
        </>
      )}
      {activity && <TrustActivityModal banks={banks} onClose={() => setActivity(false)} />}
      {reconciling && <ReconcileModal banks={banks} onClose={() => setReconciling(false)} />}
    </>
  );
}
