// HST / Tax — the original ANS Accounting screen: summary cards, HST working paper (review → file → pay),
// filing periods and "New HST Period". Amounts come from the ledger (HST collected 23000, ITCs 23001).
import { useState } from "react";
import { useAcct, useAcctAction } from "../acctShared";
import { LuPercent, LuPlus } from "./icons";
import { Empty, Modal, MoneyInput, Notice, PageHead, Stat, fr, todayYmd } from "./ui";

type Period = { uuid: string; periodStart: string; periodEnd: string; frequency: string; hstCollected: number; itcs: number; adjustments: number; netHst: number; status: string; reviewedAt: string | null; filedAt: string | null; paidAt: string | null };
const d10 = (v?: string | null) => (v ? String(v).slice(0, 10) : "");
const n = (v: unknown) => Number(v || 0);

export default function Hst() {
  const periods = useAcct("/hst-periods");
  const history = ((periods.rows as { history?: Period[] } | undefined)?.history || []) as Period[];
  const banks = useAcct("/bank-accounts");
  const today = todayYmd();
  const preview = useAcct("/hst-preview", { from: today.slice(0, 8) + "01", to: today });
  const { run, loading } = useAcctAction();
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const selected = history.find((p) => p.uuid === selectedUuid) || null;
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ periodStart: today, periodEnd: today, frequency: "MONTHLY", adjustments: "0" });
  const [paying, setPaying] = useState(false);
  const [pay, setPay] = useState({ bankAccountId: "", paidAt: today });

  const live = (preview.rows || {}) as { hstCollected?: number; itcs?: number };
  const collected = selected ? n(selected.hstCollected) : n(live.hstCollected);
  const itc = selected ? n(selected.itcs) : n(live.itcs);
  const adjustments = n(selected?.adjustments);
  const net = collected - itc + adjustments;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.periodStart > form.periodEnd) return alert("Period start must be on or before period end.");
    const saved = (await run("/hst-periods", { ...form, adjustments: Number(form.adjustments || 0) }, { success: "HST working paper created." })) as Period | null;
    if (saved) {
      setSelectedUuid(saved.uuid);
      setCreating(false);
    }
  };
  const mark = async (step: "review" | "file") => {
    if (!selected) return;
    if (step === "file" && !selected.reviewedAt) return alert("Mark the working paper reviewed before recording filing.");
    await run(`/hst-periods/${selected.uuid}/${step}`, step === "file" ? { filedAt: today } : {});
  };
  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!selected.filedAt) return alert("Record the filed status before recording payment or refund.");
    if (await run(`/hst-periods/${selected.uuid}/pay`, { bankAccountId: Number(pay.bankAccountId), paidAt: pay.paidAt })) setPaying(false);
  };
  const operatingBanks = ((banks.rows || []) as { id: number; name: string; accountCategory?: string; status?: string }[]).filter((b) => !["REAL_ESTATE_TRUST", "COMMISSION_TRUST"].includes(String(b.accountCategory)) && b.status !== "inactive");

  return (
    <>
      <PageHead title="HST / Tax" desc="Automatic HST working paper from finalized transactions and recorded expenses.">
        <button className="primary" onClick={() => setCreating(true)}><LuPlus /> New HST Period</button>
      </PageHead>
      <div className="grid3">
        <Stat title="HST Collected" value={fr(collected)} sub="Within selected period" />
        <Stat title="Eligible ITCs" value={fr(itc)} sub="Recorded expense HST" />
        <Stat title="Net HST" value={fr(net)} sub={net >= 0 ? "Payable" : "Refund"} />
      </div>
      <section className="panel">
        <div className="paneltitle"><h2>HST working paper</h2>{selected && <span className="pill">{selected.status}</span>}</div>
        {selected ? (
          <>
            <div className="grid4">
              <Stat title="Collected" value={fr(collected)} sub="Revenue HST" />
              <Stat title="ITCs" value={fr(itc)} sub="Expense HST" />
              <Stat title="Adjustments" value={fr(adjustments)} sub="Manual adjustment" />
              <Stat title="Net tax" value={fr(net)} sub={net >= 0 ? "Amount payable" : "Potential refund"} />
            </div>
            <div className="actions">
              <button className="secondary" onClick={() => mark("review")} disabled={!!selected.reviewedAt || loading}>Mark Reviewed</button>
              <button className="secondary" onClick={() => mark("file")} disabled={!!selected.filedAt || !selected.reviewedAt || loading}>Mark Filed</button>
              <button className="primary" onClick={() => setPaying(true)} disabled={!!selected.paidAt || !selected.filedAt || loading}>Record Payment / Refund</button>
            </div>
            <Notice>Review the working paper and supporting documents before filing. Net HST is calculated as collected minus eligible ITCs plus adjustments.</Notice>
          </>
        ) : (
          <Empty icon={<LuPercent />} title="Select a filing period" text="Create a period to generate the working paper automatically." />
        )}
      </section>
      <section className="panel tablewrap">
        <h2>Filing periods</h2>
        <table>
          <thead><tr><th>Period</th><th>Frequency</th><th>Collected</th><th>ITCs</th><th>Adjustments</th><th>Net</th><th>Status</th><th /></tr></thead>
          <tbody>
            {history.map((p) => (
              <tr key={p.uuid}>
                <td>{d10(p.periodStart)} → {d10(p.periodEnd)}</td>
                <td>{p.frequency}</td>
                <td>{fr(p.hstCollected)}</td>
                <td>{fr(p.itcs)}</td>
                <td>{fr(p.adjustments)}</td>
                <td>{fr(p.netHst)}</td>
                <td>{p.status}</td>
                <td><button className="textbutton" onClick={() => setSelectedUuid(p.uuid)}>Open</button></td>
              </tr>
            ))}
            {!history.length && (
              <tr><td colSpan={8}><Empty icon={<LuPercent />} title="No HST periods yet" text="Create a monthly, quarterly or annual filing period." /></td></tr>
            )}
          </tbody>
        </table>
      </section>
      {creating && (
        <Modal title="New HST Period" onClose={() => setCreating(false)}>
          <form onSubmit={create}>
            <div className="formgrid">
              <label>Period start<input type="date" required value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} /></label>
              <label>Period end<input type="date" required value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} /></label>
              <label>Frequency
                <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                  <option>MONTHLY</option><option>QUARTERLY</option><option>ANNUAL</option>
                </select>
              </label>
              <label>Adjustments<MoneyInput value={form.adjustments} onChange={(v) => setForm({ ...form, adjustments: v })} /></label>
            </div>
            <Notice>The system will calculate HST collected and ITCs automatically from the selected dates.</Notice>
            <div className="modalactions">
              <button className="secondary" type="button" onClick={() => setCreating(false)}>Cancel</button>
              <button className="primary" disabled={loading}>Create Working Paper</button>
            </div>
          </form>
        </Modal>
      )}
      {paying && selected && (
        <Modal title={`Record ${net >= 0 ? "Payment" : "Refund"} — ${fr(Math.abs(n(selected.netHst)))}`} onClose={() => setPaying(false)}>
          <form onSubmit={recordPayment}>
            <div className="formgrid">
              <label>Date<input type="date" required value={pay.paidAt} onChange={(e) => setPay({ ...pay, paidAt: e.target.value })} /></label>
              <label>Bank account
                <select required value={pay.bankAccountId} onChange={(e) => setPay({ ...pay, bankAccountId: e.target.value })}>
                  <option value="">Select account</option>
                  {operatingBanks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
            </div>
            <Notice>The payment (or refund) is posted to the ledger: HST collected and ITCs are cleared, adjustments go to suspense for review, and the net goes through the selected bank account.</Notice>
            <div className="modalactions">
              <button className="secondary" type="button" onClick={() => setPaying(false)}>Cancel</button>
              <button className="primary" disabled={loading}>Record {net >= 0 ? "Payment" : "Refund"}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
