// Trade Transactions → transaction editor: bodv's eight-tab transaction screen on ANS RealStateCRM's trade sheet.
// Data comes from the existing trade sheet (get-spacific-trade-sheet), finalize uses the existing
// trade-accounting endpoint, status changes use the existing admin status endpoint, and trust movements
// use Brokerage Accounting's trust ledger. Trade details themselves stay owned by the trade sheet form.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useGetSpacificTradeSheetListDataQuery, useChangeTradeAdminStatusMutation } from "../../redux/api/agent/trade-sheet/tradeSheetSlice";
import { useCreateTradeTransactionMutation } from "../../redux/api/accounting/tradeAccountingSlice";
import { useAcct, useAcctAction } from "../brokerage-accounting/acctShared";
import { fr, shortDate, todayYmd, Empty, MoneyInput } from "../brokerage-accounting/bodv/ui";
import { LuX, LuPrinter, LuChevronRight, LuCircleAlert, LuEye } from "../brokerage-accounting/bodv/icons";
import { getFileUrl } from "../../utils/constant";
import { calcCommission, finalizePayload } from "./commission";
import { printTradeRecord } from "./tradeRecord";

export const TABS = ["Key Info", "People", "Outside Brokers", "Trust", "Commission", "Agent Info", "Trade Status", "Files & Audit"];
const ADMIN_STATUSES = [["approved", "Approved"], ["underReview", "Under Review"], ["draft", "Draft"], ["rejected", "Rejected"], ["closed", "Closed"]];

const nm = (a: any) => [a?.firstName, a?.lastName].filter(Boolean).join(" ").trim();
/** Sellers saved on the listing (PropertyListing.sellersInfo: JSON text or object, { sellersInfo: [...] }). */
export function listingSellers(listing: any): any[] {
  let v = listing?.sellersInfo;
  try {
    if (typeof v === "string") v = JSON.parse(v);
    if (typeof v === "string") v = JSON.parse(v);
  } catch {
    return [];
  }
  const arr = Array.isArray(v) ? v : Array.isArray(v?.sellersInfo) ? v.sellersInfo : [];
  return arr.filter((x: any) => x && typeof x === "object");
}
const yes = (v: boolean) => (v ? "Yes" : "No");
const repLabel = (t: any) =>
  t?.representationType === "multiple"
    ? `Multiple (${(t?.multipleRepresentation || "").split(",").map((s: string) => s.trim()).filter(Boolean).join(", ") || "—"})`
    : ({ seller: "Seller side", buyer: "Buyer side", landlord: "Landlord side", tenant: "Tenant side" } as Record<string, string>)[t?.representation] || "—";

function Field({ label, value, wide, children }: { label: string; value?: ReactNode; wide?: boolean; children?: ReactNode }) {
  return (
    <label className={`tx-field${wide ? " tx-wide" : ""}`}>
      <span>{label}</span>
      {children ?? <input readOnly value={value === null || value === undefined || value === "" ? "—" : String(value)} />}
    </label>
  );
}

function Section({ title, hint, right, children }: { title: string; hint?: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="tx-section">
      <div className="tx-subhead" style={{ marginTop: 4 }}>
        <div><h3>{title}</h3>{hint && <p>{hint}</p>}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

const SourceNote = () => (
  <div className="notice" style={{ marginBottom: 14 }}>
    <LuCircleAlert size={16} /> Trade details come from the agent's trade sheet. Changes to them are made on the trade sheet so the agent record, approvals and documents stay in step.
  </div>
);

// ---------- tabs ----------

function KeyInfo({ t }: { t: any }) {
  const p = t.properties?.[0] || {};
  const address = p.propertyAddress || [p.address, p.city?.name, p.postalCode].filter(Boolean).join(", ") || t.propertyListing?.propertyAddress;
  return (
    <>
      <SourceNote />
      <Section title="Key Information">
        <div className="tx-grid">
          <Field label="Trade Number" value={t.tradeSheetTypeId} />
          <Field label="MLS Number" value={p.mlsNumber} />
          <Field label="Our Listing?" value={yes(t.representation === "seller" || t.representation === "landlord")} />
          <Field label="Brokerage Lead?" value={t.lead ? `Yes — ${t.lead.name || "lead"}${t.lead.campaign?.name ? ` (${t.lead.campaign.name})` : ""}` : "No"} />
          <Field label="Property Address" value={address} wide />
          <Field label="City" value={p.city?.name} />
          <Field label="Postal Code" value={p.postalCode} />
          <Field label="Listing Price" value={p.listingPrice ? fr(p.listingPrice) : null} />
          <Field label="Offer Date" value={shortDate(p.offerDate)} />
          <Field label="Firm Date" value={shortDate(p.firmDate)} />
          <Field label="Closing Date" value={shortDate(p.closingDate)} />
          <Field label="Entry Date" value={shortDate(t.approvedAt || t.createdAt)} />
          <Field label="Finalized Date" value={t.tradeTransaction?.[0] ? shortDate(t.tradeTransaction[0].createdAt) : null} />
          <Field label="Transaction Type" value={t.listType} />
          <Field label="Transaction Side" value={repLabel(t)} />
          <Field label="Market Segment" value={t.listType === "Commercial" ? "Commercial" : "Residential"} />
          <Field label="Sale Value" value={fr(Number(p.soldPrice) || Number(p.salesPrice))} />
        </div>
      </Section>
      <Section title="Conditions & File Requirements">
        {(t.conditions || []).length ? (
          <div className="tablewrap">
            <table>
              <thead><tr><th>Condition</th><th>Due Date</th><th>Met Date</th><th>Status</th></tr></thead>
              <tbody>
                {t.conditions.map((c: any) => (
                  <tr key={c.id}><td>{c.conditionType || "—"}</td><td>{shortDate(c.dueDate)}</td><td>{shortDate(c.conditionMetDate)}</td><td><span className="status">{c.completeStatus || "pending"}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty small"><p>No conditions on this trade.</p></div>}
      </Section>
    </>
  );
}

function LawyerCard({ role, l }: { role: string; l: any }) {
  if (!l) return null;
  return (
    <div className="tx-card">
      <div className="tx-cardhead"><b>{role}</b><span className="pill">Solicitor / Lawyer</span></div>
      <div className="tx-grid">
        <Field label="Name" value={l.name || nm(l)} />
        <Field label="Company / Law Firm" value={l.lawyerFirmName || l.firm?.lawyerFirmName || l.firm?.name} />
        <Field label="Email" value={l.email} />
        <Field label="Phone" value={l.phoneNumber || l.cellPhoneNumber} />
        <Field label="Fax" value={l.faxNumber} />
        <Field label="Street Address" value={[l.streetAddress, l.streetAddressLine2].filter(Boolean).join(", ") || l.address} />
        <Field label="City" value={l.city?.name} />
        <Field label="Province" value={l.state?.name} />
        <Field label="Postal Code" value={l.postalZipCode} />
      </div>
    </div>
  );
}

function People({ t }: { t: any }) {
  const ld = t.lawyerDetails?.[0];
  const d = t.agentDetails?.[0] || {};
  const lease = t.listType === "Lease" || t.representation === "landlord" || t.representation === "tenant";
  const sellerRole = lease ? "Landlord" : "Seller", buyerRole = lease ? "Tenant" : "Buyer";
  // Sellers on the trade sheet; for our own listing they may only be saved on the listing.
  const sellers = (t.sellerInformations || []).length ? t.sellerInformations : listingSellers(t.propertyListing);
  const clients = [
    ...sellers.map((s: any) => ({ role: sellerRole, name: nm(s), email: s.email || "", phone: s.phone || s.phoneNumber || "", source: (t.sellerInformations || []).length ? "Trade sheet" : "Listing" })),
    ...(t.buyerInformations || []).map((b: any) => ({ role: buyerRole, name: nm(b), email: "", phone: "", source: "Trade sheet" })),
  ].filter((x) => x.name);
  const agentRow = (side: string, internal: boolean, first?: string, last?: string, email?: string, brokerage?: any) =>
    first || last || email ? { role: `${side} agent`, name: [first, last].filter(Boolean).join(" ") || "—", email: email || "", company: internal ? "Our brokerage" : brokerage?.brokerageName || "Outside brokerage" } : null;
  const agents = [
    agentRow(lease ? "Landlord" : "Listing", Boolean(d.intSellerAgentId), d.sellerFirstName, d.sellerLastName, d.sellerEmail, d.sellerBrokerage),
    agentRow(lease ? "Tenant" : "Buyer", Boolean(d.intBuyerAgentId), d.buyerFirstName, d.buyerLastName, d.buyerEmail, d.buyerBrokerage),
    ...(t.sharedUsers || []).map((u: any) => ({ role: "Shared agent", name: u.name || nm(u) || "—", email: u.email || "", company: u.userPercentage != null ? `${u.userPercentage}% allocation` : "Our brokerage" })),
  ].filter(Boolean) as any[];
  return (
    <>
      <SourceNote />
      <Section title="People on this transaction" hint="Buyers, sellers, agents and solicitors recorded on the trade sheet.">
        <div className="tx-subhead" style={{ marginTop: 0 }}><div><h3 style={{ fontSize: 15 }}>Clients</h3></div></div>
        {clients.length ? (
          <div className="tablewrap"><table><thead><tr><th>Role</th><th>Name</th><th>Email</th><th>Phone</th><th>Source</th></tr></thead>
            <tbody>{clients.map((x, i) => <tr key={i}><td>{x.role}</td><td>{x.name}</td><td>{x.email || "—"}</td><td>{x.phone || "—"}</td><td><span className="status">{x.source}</span></td></tr>)}</tbody></table></div>
        ) : <div className="empty small"><p>No buyers or sellers are recorded on this trade sheet or its listing.</p></div>}
        <div className="tx-subhead"><div><h3 style={{ fontSize: 15 }}>Agents</h3></div></div>
        {agents.length ? (
          <div className="tablewrap"><table><thead><tr><th>Role</th><th>Name</th><th>Email</th><th>Brokerage / Allocation</th></tr></thead>
            <tbody>{agents.map((x, i) => <tr key={i}><td>{x.role}</td><td>{x.name}</td><td>{x.email || "—"}</td><td>{x.company}</td></tr>)}</tbody></table></div>
        ) : <div className="empty small"><p>No agents recorded.</p></div>}
        <div className="tx-subhead"><div><h3 style={{ fontSize: 15 }}>Solicitors / Lawyers</h3></div></div>
        <LawyerCard role="Seller's Lawyer" l={ld?.sellerLawyer} />
        <LawyerCard role="Buyer's Lawyer" l={ld?.buyerLawyer} />
        {!ld?.sellerLawyer && !ld?.buyerLawyer && <div className="empty small"><p>No lawyers are recorded on this trade sheet yet.</p></div>}
      </Section>
    </>
  );
}

function BrokerCard({ side, d, prefix }: { side: string; d: any; prefix: "seller" | "buyer" }) {
  const b = d[`${prefix}Brokerage`];
  return (
    <div className="tx-card">
      <div className="tx-cardhead"><b>{side}</b><span className="pill">Cooperating brokerage</span></div>
      <div className="tx-grid">
        <Field label="Company Name" value={b?.brokerageName} />
        <Field label="Brokerage Phone" value={b?.phoneNumber} />
        <Field label="Brokerage Fax" value={b?.faxNumber} />
        <Field label="Agent Name" value={[d[`${prefix}FirstName`], d[`${prefix}LastName`]].filter(Boolean).join(" ")} />
        <Field label="Agent Email" value={d[`${prefix}Email`]} />
        <Field label="Billing Email" value={b?.billingEmailAddress} />
        <Field label="Brokerage Address" value={[b?.streetAddress || b?.address, b?.city?.name, b?.state?.name, b?.postalZipCode].filter(Boolean).join(", ")} wide />
        <Field label="Commission" value={d[`${prefix}CommissionType`] === "amount" ? fr(d[`${prefix}Commission`]) : d[`${prefix}Commission`] != null ? `${d[`${prefix}Commission`]}%` : null} />
      </div>
    </div>
  );
}

function OutsideBrokers({ t }: { t: any }) {
  const d = t.agentDetails?.[0];
  const sellerExt = d && !d.intSellerAgentId && (d.sellerBrokerage || d.sellerFirstName);
  const buyerExt = d && !d.intBuyerAgentId && (d.buyerBrokerage || d.buyerFirstName);
  return (
    <>
      <SourceNote />
      <Section title="Outside Brokers" hint="Cooperating brokerages on the other side of this trade.">
        {sellerExt && <BrokerCard side="Listing side" d={d} prefix="seller" />}
        {buyerExt && <BrokerCard side="Buyer side" d={d} prefix="buyer" />}
        {!sellerExt && !buyerExt && <div className="empty small"><h3>No outside brokerage</h3><p>Both sides of this trade are represented by our agents.</p></div>}
      </Section>
    </>
  );
}

function Trust({ t, onChanged }: { t: any; onChanged: () => void }) {
  const summary = useAcct(`/trust/trades/${t.id}`);
  const banks = (useAcct("/bank-accounts").rows || []) as any[];
  const { run, loading } = useAcctAction();
  const [form, setForm] = useState<null | "deposit" | "receipt" | "coop">(null);
  const [f, setF] = useState<any>({});
  const s = summary.rows || {};
  const trustBanks = (cat: string) => banks.filter((b) => b.accountCategory === cat && String(b.status || "active").toLowerCase() !== "inactive");
  const c = calcCommission(t);
  const open = (kind: "deposit" | "receipt" | "coop") => {
    const d = t.agentDetails?.[0] || {};
    const brokerage = d.intBuyerAgentId ? d.sellerBrokerage : d.buyerBrokerage;
    setF({
      ledgerDate: todayYmd(), paymentType: kind === "coop" ? "CHEQUE" : "CHEQUE", reference: "", description: "",
      amount: kind === "receipt" ? (t.tradeTransaction?.[0]?.baseOfficeCommissionTotal ?? c.baseTotal) : "",
      hstAmount: kind === "receipt" ? (t.tradeTransaction?.[0]?.baseOfficeCommissionTax ?? c.baseTax) : "",
      receivedFrom: kind === "receipt" ? (t.lawyerDetails?.[0]?.sellerLawyer?.name || "") : "",
      payeeName: kind === "coop" ? brokerage?.brokerageName || "" : "",
      bankAccountId: (trustBanks(kind === "deposit" ? "REAL_ESTATE_TRUST" : "COMMISSION_TRUST")[0] || {}).id || "",
    });
    setForm(kind);
  };
  const submit = async () => {
    const path = form === "deposit" ? "/trust/deposit" : form === "receipt" ? "/trust/commission-receipt" : "/trust/coop-payment";
    const ok = await run(path, { ...f, tradeSheetId: t.id });
    if (ok) {
      setForm(null);
      summary.refetch();
      onChanged();
    }
  };
  const cat = form === "deposit" ? "REAL_ESTATE_TRUST" : "COMMISSION_TRUST";
  return (
    <>
      <Section
        title="Trust Deposit & Commission Trust"
        hint="Movements post to the Brokerage Accounting trust ledger and general ledger for this trade."
        right={<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="secondary" onClick={() => open("deposit")}>Record Deposit</button>
          <button type="button" className="secondary" onClick={() => open("receipt")}>Commission A/R Received</button>
          <button type="button" className="secondary" onClick={() => open("coop")}>Pay Other Brokerage</button>
        </div>}
      >
        <div className="tx-summary">
          <span>Real Estate Trust balance (deposit held)</span><b>{fr(s.realEstateTrustBalance)}</b>
          <span>Commission Trust balance</span><b>{fr(s.commissionTrustBalance)}</b>
          <span>Commission A/R received</span><b>{fr(s.commissionReceived)}</b>
        </div>
        {form && (
          <div className="tx-card" style={{ marginTop: 16 }}>
            <div className="tx-cardhead"><b>{form === "deposit" ? "Record buyer deposit (Real Estate Trust)" : form === "receipt" ? "Commission receivable (A/R) payment" : "Pay other brokerage (from Commission Trust)"}</b>
              <button type="button" className="textbutton" style={{ marginTop: 0 }} onClick={() => setForm(null)}>Cancel</button></div>
            <div className="tx-grid">
              <Field label={form === "deposit" ? "Real Estate Trust Account" : "Commission Trust Account"}>
                <select value={f.bankAccountId} onChange={(e) => setF({ ...f, bankAccountId: e.target.value })}>
                  <option value="">Select trust account</option>
                  {trustBanks(cat).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
              <Field label="Date"><input type="date" value={f.ledgerDate} onChange={(e) => setF({ ...f, ledgerDate: e.target.value })} /></Field>
              <Field label="Amount"><MoneyInput value={f.amount} onChange={(v) => setF({ ...f, amount: v })} /></Field>
              {form === "receipt" && <Field label="HST included"><MoneyInput value={f.hstAmount} onChange={(v) => setF({ ...f, hstAmount: v })} /></Field>}
              {form !== "coop"
                ? <Field label="Received From"><input value={f.receivedFrom} onChange={(e) => setF({ ...f, receivedFrom: e.target.value })} /></Field>
                : <Field label="Other brokerage"><input value={f.payeeName} onChange={(e) => setF({ ...f, payeeName: e.target.value })} /></Field>}
              <Field label="Payment Type">
                <select value={f.paymentType} onChange={(e) => setF({ ...f, paymentType: e.target.value })}>
                  {["CHEQUE", "EFT", "WIRE", "BANK_DRAFT", "CASH"].map((x) => <option key={x} value={x}>{x.replace("_", " ")}</option>)}
                </select>
              </Field>
              <Field label="Reference / Cheque #"><input value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} /></Field>
              {form !== "receipt" && <Field label="Description" wide><input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>}
            </div>
            {!trustBanks(cat).length && <div className="notice" style={{ marginTop: 12 }}><LuCircleAlert size={16} /> No {form === "deposit" ? "Real Estate Trust" : "Commission Trust"} bank account yet. Set one up under Brokerage Accounting → Banking.</div>}
            <div className="tx-footer"><span /><button type="button" className="primary" disabled={loading} onClick={submit}>{loading ? "Saving…" : "Save & Post"}</button></div>
          </div>
        )}
        <div className="tx-card" style={{ marginTop: 16 }}>
          <div className="tx-cardhead"><b>Trust movements</b></div>
          {(s.transactions || []).length ? (
            <div className="tablewrap">
              <table>
                <thead><tr><th>Date</th><th>Account</th><th>Type</th><th>From / To</th><th>Reference</th><th style={{ textAlign: "right" }}>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {s.transactions.map((r: any) => (
                    <tr key={r.uuid}>
                      <td>{shortDate(r.ledgerDate)}</td><td>{r.bankAccount?.name || "—"}</td><td>{String(r.kind || "").replace(/_/g, " ")}</td>
                      <td>{r.clientName || r.payeeName || "—"}</td><td>{r.reference || "—"}</td>
                      <td style={{ textAlign: "right" }}>{r.direction === "DISBURSEMENT" ? "−" : ""}{fr(r.amount)}</td><td><span className="status">{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="empty small"><p>No deposit or trust movement recorded for this trade.</p></div>}
        </div>
      </Section>
    </>
  );
}

function Commission({ t, onChanged }: { t: any; onChanged: () => void }) {
  const navigate = useNavigate();
  const [createTradeTransaction, { isLoading }] = useCreateTradeTransactionMutation();
  const c = useMemo(() => calcCommission(t), [t]);
  const [step, setStep] = useState(0); // 1 funds received? 2 A/R summary 3 post cash receipt?
  const saved = t.tradeTransaction?.[0];
  const d = t.agentDetails?.[0] || {};
  const fundsHold = Number(t.fundsHold || 0);
  const finalize = async () => {
    setStep(0);
    try {
      const res = await createTradeTransaction(finalizePayload(t, c)).unwrap();
      toast.success("Trade transaction created successfully.");
      onChanged();
      navigate("/dashboard/accounting/account-cheque-posting/" + res?.data?.newTradeTransaction?.uuid);
    } catch (e: any) {
      toast.error(`Error: ${e?.data?.message || "Something went wrong"}`);
    }
  };
  if (c.mode === "none") {
    return <Section title="Commission"><div className="empty small"><p>Commission finalizing applies to buyer, seller and multiple representation trades.</p></div></Section>;
  }
  const row = (label: string, amount: number, tax: number, taxLabel: string, total: number) => (
    <tr><td>{label}</td><td style={{ textAlign: "right" }}>{fr(amount)}</td><td style={{ textAlign: "right" }}>{fr(tax)} <span className="muted">({taxLabel})</span></td><td style={{ textAlign: "right" }}><b>{fr(total)}</b></td></tr>
  );
  return (
    <>
      <Section title="Commission" hint="Calculated from the trade sheet commissions and the agent's plan — the same calculation as Accounting → Trade List.">
        <div className="tx-commission-grid">
          <div className="tx-card">
            <h4>Listing side</h4>
            <div className="tx-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <Field label="Agent" value={[d.sellerFirstName, d.sellerLastName].filter(Boolean).join(" ")} />
              <Field label="Internal agent?" value={yes(Boolean(d.intSellerAgentId))} />
              <Field label="Brokerage" value={d.sellerBrokerage?.brokerageName} />
              <Field label="Commission (%)" value={d.sellerCommission} />
            </div>
          </div>
          <div className="tx-card">
            <h4>Buyer side</h4>
            <div className="tx-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <Field label="Agent" value={[d.buyerFirstName, d.buyerLastName].filter(Boolean).join(" ")} />
              <Field label="Internal agent?" value={yes(Boolean(d.intBuyerAgentId))} />
              <Field label="Brokerage" value={d.buyerBrokerage?.brokerageName} />
              <Field label="Commission (%)" value={d.buyerCommission} />
            </div>
          </div>
        </div>
        <div className="tx-card">
          <div className="tx-cardhead"><b>Commission calculation breakdown</b><span className="pill">Sale value {fr(c.price)} × {c.propertyCommission}%</span></div>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Line</th><th style={{ textAlign: "right" }}>Amount</th><th style={{ textAlign: "right" }}>HST</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
              <tbody>
                {row("Base office commission (A/R)", c.base, c.baseTax, "13%", c.baseTotal)}
                {row("Commission to agent", c.agent, c.agentTax, c.isAgentHst ? "13%" : "0%", c.agentTotal)}
                {c.mode === "seller" && row("Buyer agent commission", c.buyerAgent, 0, "0%", c.buyerAgent)}
                {row("Unclaimed tax", 0, c.unclaimedTax, c.isAgentHst ? "0%" : "13%", c.unclaimedTax)}
                {row("Net to office", c.net, c.netTax, "13%", c.netTotal)}
              </tbody>
            </table>
          </div>
        </div>
        {saved ? (
          <div className="tx-summary">
            <span>Finalized on</span><b>{shortDate(saved.createdAt)}</b>
            <span>Commission receivable (saved)</span><b>{fr(saved.baseOfficeCommissionTotal)}</b>
            <span>Agent commission (saved)</span><b>{fr(saved.agentCommissionTotal)}</b>
            <span>Net to office (saved)</span><b>{fr(saved.netCommissionTotal)}</b>
          </div>
        ) : null}
        <div className="tx-footer">
          <span className="muted">
            {saved?.chequePosting?.length ? "The cheque has been posted for this trade." : saved ? "Trade finalized. Next: post the commission cheque." : "Finalize saves the commission figures and opens Cheque Posting."}
          </span>
          <div className="tx-footer-right">
            {saved && !saved.chequePosting?.length && <NavLink className="primary" style={{ textDecoration: "none" }} to={`/dashboard/accounting/account-cheque-posting/${saved.uuid}`}>Cheque Posting</NavLink>}
            {!saved && <button type="button" className="primary" disabled={isLoading} onClick={() => setStep(1)}>{isLoading ? "Finalizing…" : "Finalize"}</button>}
          </div>
        </div>
      </Section>
      {step > 0 && (
        <div className="overlay" style={{ zIndex: 200 }} onMouseDown={(e) => e.target === e.currentTarget && setStep(0)}>
          <div className="modal" style={{ width: "min(460px,94vw)" }}>
            <div className="modalhead"><h2>Finalize trade</h2><button type="button" className="iconbtn" onClick={() => setStep(0)}><LuX /></button></div>
            <div style={{ padding: 21 }}>
              {step === 1 && <p>Have you received the funds yet?</p>}
              {step === 2 && (
                <div className="tx-summary" style={{ marginTop: 0 }}>
                  <span>Commissions</span><b>{fr(c.baseTotal)}</b>
                  <span>Funds hold</span><b>− {fr(fundsHold)}</b>
                  <span>A/R</span><b>{fr(c.baseTotal - fundsHold)}</b>
                </div>
              )}
              {step === 3 && <p>Would you like to post a cash receipt?</p>}
              <div className="modalactions">
                <button type="button" className="secondary" onClick={() => setStep(0)}>No</button>
                <button type="button" className="primary" onClick={() => (step < 3 ? setStep(step + 1) : finalize())}>Yes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AgentInfo({ t }: { t: any }) {
  const d = t.agentDetails?.[0] || {};
  const c = calcCommission(t);
  const ours = [
    d.intSellerAgentId && { side: "Listing agent", a: d.sellerAgentAccount, pct: d.sellerCommission },
    d.intBuyerAgentId && { side: "Buyer agent", a: d.buyerAgentAccount, pct: d.buyerCommission },
  ].filter(Boolean) as any[];
  return (
    <>
      <SourceNote />
      <Section title="Agent Information & Net Payable">
        {ours.map((x, i) => (
          <div className="tx-card" key={i}>
            <div className="tx-cardhead"><b>{x.side}</b>{x.a?.plan?.name && <span className="pill">{x.a.plan.name}{x.a.plan.type ? ` (${x.a.plan.type})` : ""}</span>}</div>
            <div className="tx-grid">
              <Field label="Deal Agent" value={nm(x.a) || x.a?.email} />
              <Field label="Agent #" value={x.a?.agentAccountId} />
              <Field label="Agent HST Registration #" value={x.a?.hstNo || "Not registered"} />
              <Field label="Commission (%)" value={x.pct} />
              <Field label="Plan split (owner / agent)" value={x.a?.plan?.planItems?.[1] ? `${x.a.plan.planItems[1].commissionOwner ?? "—"} / ${x.a.plan.planItems[1].commissionAgent ?? "—"}` : null} />
              <Field label="Admin fee (plan)" value={x.a?.plan?.planItems?.[1]?.planSubItems?.[0]?.value != null ? fr(x.a.plan.planItems[1].planSubItems[0].value) : null} />
            </div>
          </div>
        ))}
        {!ours.length && <div className="empty small"><p>No internal agent is linked on this trade sheet.</p></div>}
        {c.mode !== "none" && (
          <div className="tx-summary">
            <span>Agent commission before HST</span><b>{fr(c.agent)}</b>
            <span>HST added to agent payment</span><b>{fr(c.agentTax)}</b>
            <span>Total payment to agent</span><b>{fr(c.agentTotal)}</b>
          </div>
        )}
        <div className="tx-subhead"><div><h3>Additional Representing Agents</h3><p>Shared agents on this trade sheet.</p></div></div>
        {(t.sharedUsers || []).length ? (
          <div className="tablewrap">
            <table>
              <thead><tr><th>Agent</th><th>Email</th><th>Representation</th><th>Allocation %</th><th>Commission</th></tr></thead>
              <tbody>
                {t.sharedUsers.map((s: any) => (
                  <tr key={s.id}><td>{s.name || nm(s)}</td><td>{s.email || "—"}</td><td>{s.representationType || "—"}</td><td>{s.userPercentage ?? "—"}</td><td>{s.commission != null ? (s.commissionType === "amount" ? fr(s.commission) : `${s.commission}%`) : "—"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty small"><p>No additional agents.</p></div>}
      </Section>
    </>
  );
}

function TradeStatus({ t, onChanged }: { t: any; onChanged: () => void }) {
  const [changeTradeAdminStatus, { isLoading }] = useChangeTradeAdminStatusMutation();
  const [status, setStatus] = useState(t.status);
  const [reason, setReason] = useState("");
  const saved = t.tradeTransaction?.[0];
  const save = async () => {
    if (status === "rejected" && !reason.trim()) return toast.error("Enter the reject reason.");
    try {
      const res = await changeTradeAdminStatus({ data: { status, rejectReason: reason }, uuid: t.uuid }).unwrap();
      toast.success(res?.message || "Status updated.");
      onChanged();
    } catch (e: any) {
      toast.error(`Error: ${e?.data?.message || "Something went wrong"}`);
    }
  };
  return (
    <Section title="Trade Status" hint="Trade sheet approval status and where the trade is in the accounting workflow.">
      <div className="tx-grid">
        <Field label="Trade Sheet Status">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {ADMIN_STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Trade Status" value={t.tradeStatus || "—"} />
        <Field label="Approved" value={shortDate(t.approvedAt)} />
        {status === "rejected" && <Field label="Reject reason" wide><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter reject reason" /></Field>}
      </div>
      <div className="tx-footer">
        <span className="muted">Uses the same status change as the Trade Sheet List (the agent is notified).</span>
        <button type="button" className="primary" disabled={isLoading || status === t.status} onClick={save}>{isLoading ? "Saving…" : "Save Status"}</button>
      </div>
      <div className="tx-summary">
        <span>Finalized</span><b>{saved ? `Yes — ${shortDate(saved.createdAt)}` : "No"}</b>
        <span>Commission cheque posted</span><b>{saved?.chequePosting?.length ? "Yes" : "No"}</b>
        <span>Commission invoices</span><b>{(t.tradeCommissionInvoice || []).length}</b>
      </div>
      <div className="tx-footer">
        <span className="muted">Continue in Accounting:</span>
        <div className="tx-footer-right" style={{ flexWrap: "wrap" }}>
          {saved && <NavLink className="secondary" style={{ textDecoration: "none" }} to={`/dashboard/accounting/account-cheque-posting/${saved.uuid}`}>Cheque Posting</NavLink>}
          <NavLink className="secondary" style={{ textDecoration: "none" }} to="/dashboard/accounting/issue-agent-cheque">Issue Agent Cheque</NavLink>
          <NavLink className="secondary" style={{ textDecoration: "none" }} to="/dashboard/accounting/tradesheet-invoicing">Invoicing</NavLink>
        </div>
      </div>
    </Section>
  );
}

function FilesAudit({ t }: { t: any }) {
  const files = [
    ...(t.paperWorkAttachmentFiles || []).map((f: any) => ({ id: `p${f.id}`, name: f.uploadFileName?.name || "Trade document", path: f.filePath, status: f.status, date: f.createdAt })),
    ...(t.paperWorkOtherAttachments || []).map((f: any) => ({ id: `o${f.id}`, name: "Other document", path: f.filePath, status: f.status, date: f.createdAt })),
  ];
  const logs = [...(t.activityLog || [])].sort((a: any, b: any) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return (
    <>
      <Section title="Transaction Files" hint="Documents uploaded with the trade sheet.">
        {files.length ? (
          <div className="tablewrap">
            <table>
              <thead><tr><th>Document</th><th>Status</th><th>Uploaded</th><th>Actions</th></tr></thead>
              <tbody>
                {files.map((f) => (
                  <tr key={f.id}>
                    <td>{f.name}</td><td><span className="status">{f.status || "—"}</span></td><td>{shortDate(f.date)}</td>
                    <td>{f.path ? <a className="textbutton" style={{ marginTop: 0 }} href={getFileUrl(f.path)} target="_blank" rel="noreferrer"><LuEye size={14} /> Open</a> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty small"><p>No files uploaded on this trade sheet.</p></div>}
      </Section>
      <Section title="Audit Trail" hint="Trade sheet activity, newest first.">
        {logs.length ? (
          <div className="tablewrap">
            <table>
              <thead><tr><th>When</th><th>User</th><th>Action</th><th>Details</th></tr></thead>
              <tbody>
                {logs.map((l: any) => (
                  <tr key={l.id}><td>{l.createdAt ? new Date(l.createdAt).toLocaleString("en-CA") : "—"}</td><td>{l.userName || "—"}</td><td>{l.action || "—"}</td><td>{l.historyText || "—"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty small"><p>No activity recorded.</p></div>}
      </Section>
    </>
  );
}

// ---------- editor ----------

export default function TransactionEditor({ uuid, initialTab = 0, onClose, onChanged }: { uuid: string; initialTab?: number; onClose: () => void; onChanged: () => void }) {
  const { data, isLoading, isError, refetch } = useGetSpacificTradeSheetListDataQuery(uuid);
  const t = data?.data?.tradeSheetData;
  const [tab, setTab] = useState(initialTab);
  const changed = () => {
    refetch();
    onChanged();
  };
  // Rendered at <body> level (with its own .dvac scope for the bodv styles) so the app sidebar/header,
  // which sit above the page content, can never cover the transaction window.
  return createPortal(
    <div className="dvac" style={{ height: 0, background: "transparent", overflow: "visible" }}>
    <div className="overlay" style={{ zIndex: 3000 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal tx-modal" style={{ display: "flex", flexDirection: "column", height: "94vh", maxHeight: "94vh" }}>
        <div className="modalhead" style={{ flex: "0 0 auto" }}>
          <h2>Transaction {t?.tradeSheetTypeId ? `· ${t.tradeSheetTypeId}` : ""}</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {t && <button type="button" className="secondary" onClick={() => printTradeRecord(t)}><LuPrinter size={15} /> Trade Record</button>}
            <button type="button" className="iconbtn" onClick={onClose} aria-label="Close"><LuX /></button>
          </div>
        </div>
        {/* bodv layout: .tx-editor is a fixed flex column (overflow hidden !important); the tabs stay on top
            and the body below them is the scroll area, with the footer pinned to its bottom. */}
        <div className="tx-editor">
          <div className="tx-tabs">
            {TABS.map((name, i) => (
              <button key={name} type="button" className={i === tab ? "active" : ""} onClick={() => setTab(i)}>{name}</button>
            ))}
          </div>
          {/* key={tab}: each tab opens scrolled to the top */}
          <div
            key={tab}
            className="tx-body"
            style={{ display: "flex", flexDirection: "column", flex: "1 1 auto", minHeight: 0, padding: "18px 0 0", overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain", scrollbarGutter: "stable" }}
          >
          {isLoading && <div className="empty small"><p>Loading transaction…</p></div>}
          {isError && <Empty title="Could not load this trade" text="Check your connection and try again." />}
          {t && (
            <>
              {tab === 0 && <KeyInfo t={t} />}
              {tab === 1 && <People t={t} />}
              {tab === 2 && <OutsideBrokers t={t} />}
              {tab === 3 && <Trust t={t} onChanged={changed} />}
              {tab === 4 && <Commission t={t} onChanged={changed} />}
              {tab === 5 && <AgentInfo t={t} />}
              {tab === 6 && <TradeStatus t={t} onChanged={changed} />}
              {tab === 7 && <FilesAudit t={t} />}
              <div className="tx-footer" style={{ position: "sticky", bottom: 0, zIndex: 6, marginTop: "auto", paddingBottom: 13, background: "#fffffff7" }}>
                <button type="button" className="secondary" onClick={onClose}>Close</button>
                <div className="tx-footer-right">
                  {tab > 0 && <button type="button" className="secondary" onClick={() => setTab(tab - 1)}>Back</button>}
                  {tab < TABS.length - 1 && <button type="button" className="secondary" onClick={() => setTab(tab + 1)}>Next <LuChevronRight size={14} /></button>}
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
    </div>,
    document.body,
  );
}
