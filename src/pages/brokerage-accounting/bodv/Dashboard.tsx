// Admin Dashboard — the original DV Accounting dashboard (layout, panels, per-panel date ranges, Top Agents,
// RECO renewal status, Brokerage Income for Super Admin), using AgentHub agents, trade sheets and accounting.
import { useEffect, useMemo, useState } from "react";
import { LuLandmark, LuPlus, LuReceipt, LuSettings, LuWallet } from "./icons";
import { useAcct, useAcctAction } from "../acctShared";
import { CountNotice, Modal, PageHead, Panel, Stat, fr, shortDate, ymd } from "./ui";

type Agent = { id: number; name: string; active: boolean; dob: string | null; startDate: string | null; terminationDate: string | null; recoExpiry: string | null; recoNumber: string | null; renewalStatus: string; renewalAppliedDate: string | null };
type Trade = { id: number; uuid: string; number: string | null; address: string | null; agentId: number | null; closeDate: string | null; finalizedDate: string | null; closedAt: string | null; status: string; salePrice: number; grossCommission: number; netToOffice: number; received: number; receivedDate: string | null };
type Listing = { id: number; agentId: number | null; startDate: string | null; status: string; kind: "LEASE" | "SALE" };
type Range = { start: string; end: string; dateBasis?: string };
type Widgets = { visible: string[]; topMetric: string; [k: string]: unknown };
type DashData = {
  canCustomize: boolean; isSuperAdmin: boolean; widgets: Widgets | null; agents: Agent[]; banks: { id: number; name: string; accountCategory: string; balance: number }[];
  trades: Trade[]; listings: Listing[]; generalIncome: { id: number; date: string; amount: number }[]; expensesTotal: number;
};

const WIDGETS = [
  { id: "birthdays", label: "Agent birthdays" },
  { id: "anniversaries", label: "Agent anniversaries" },
  { id: "licences", label: "Licences expiring" },
  { id: "balances", label: "Bank account balances" },
  { id: "closings", label: "Deals closing" },
  { id: "topAgents", label: "Top agents" },
];

const now = new Date();
const monthStart = ymd(new Date(now.getFullYear(), now.getMonth(), 1));
const monthEnd = ymd(new Date(now.getFullYear(), now.getMonth() + 1, 0));
const DEFAULTS: Widgets = {
  visible: WIDGETS.map((w) => w.id),
  birthdays: { start: monthStart, end: monthEnd },
  anniversaries: { start: monthStart, end: monthEnd },
  licences: { start: monthStart, end: monthEnd },
  closings: { start: monthStart, end: monthEnd },
  topAgents: { start: monthStart, end: monthEnd },
  topMetric: "volume",
};
const preset = (which: string): Range => {
  const y = now.getFullYear(), m = now.getMonth();
  if (which === "thisMonth") return { start: ymd(new Date(y, m, 1)), end: ymd(new Date(y, m + 1, 0)) };
  if (which === "previousMonth") return { start: ymd(new Date(y, m - 1, 1)), end: ymd(new Date(y, m, 0)) };
  if (which === "nextMonth") return { start: ymd(new Date(y, m + 1, 1)), end: ymd(new Date(y, m + 2, 0)) };
  return { start: ymd(new Date(y, 0, 1)), end: ymd(new Date(y, 11, 31)) };
};
const yearsOfService = (start: string, at = now) => {
  const y = +start.slice(0, 4), mo = +start.slice(5, 7), d = +start.slice(8, 10);
  if (!y || !mo || !d) return null;
  return Math.max(0, at.getFullYear() - y - (at.getMonth() + 1 < mo || (at.getMonth() + 1 === mo && at.getDate() < d) ? 1 : 0));
};
const torontoToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const v = (t: string) => parts.find((p) => p.type === t)?.value || "";
  return `${v("year")}-${v("month")}-${v("day")}`;
};

export default function Dashboard({ onNavigate }: { onNavigate: (key: string) => void }) {
  const q = useAcct("/admin-dashboard");
  const data = q.rows as DashData | undefined;
  const { run } = useAcctAction();
  const [cfg, setCfg] = useState<Widgets>(DEFAULTS);
  const [draft, setDraft] = useState<Widgets>(DEFAULTS);
  const [customizing, setCustomizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [income, setIncome] = useState<Range>({ start: ymd(new Date(now.getFullYear(), 0, 1)), end: ymd(now) });

  useEffect(() => {
    if (data?.widgets) {
      const v = { ...DEFAULTS, ...data.widgets, visible: Array.isArray(data.widgets.visible) ? data.widgets.visible : DEFAULTS.visible };
      setCfg(v);
      setDraft(v);
    }
  }, [data?.widgets]);

  const range = (id: string) => (cfg[id] as Range) || { start: monthStart, end: monthEnd };
  const setRange = (id: string, patch: Partial<Range>) => setCfg((c) => ({ ...c, [id]: { ...range(id), ...patch } }));
  const inRange = (v: string | null, id: string) => {
    if (!v) return false;
    const d = v.slice(0, 10), r = range(id);
    return d >= (r.start || monthStart) && d <= (r.end || monthEnd);
  };
  const thisYear = String(now.getFullYear());
  const agents = data?.agents || [];
  const active = agents.filter((a) => !a.terminationDate);
  const birthdays = active.filter((a) => a.dob && inRange(`${thisYear}-${a.dob.slice(5, 10)}`, "birthdays")).sort((a, b) => a.dob!.slice(5).localeCompare(b.dob!.slice(5)));
  const anniversaries = active.filter((a) => a.startDate && inRange(`${thisYear}-${a.startDate.slice(5, 10)}`, "anniversaries")).sort((a, b) => a.startDate!.slice(5).localeCompare(b.startDate!.slice(5)));
  const licences = active.filter((a) => a.recoExpiry && inRange(a.recoExpiry, "licences")).sort((a, b) => a.recoExpiry!.localeCompare(b.recoExpiry!));
  const trades = data?.trades || [];
  const closings = trades.filter((t) => t.closeDate && inRange(t.closeDate, "closings")).sort((a, b) => a.closeDate!.localeCompare(b.closeDate!));
  const visible = cfg.visible;

  const topAgents = useMemo(() => {
    const r = range("topAgents"), basis = r.dateBasis || "FINALIZED";
    const stats = new Map<number, { id: number; name: string; units: number; volume: number; gci: number; listings: number; leaseListings: number; saleListings: number; combinedScore: number }>();
    const entry = (a: Agent) => stats.get(a.id) || { id: a.id, name: a.name, units: 0, volume: 0, gci: 0, listings: 0, leaseListings: 0, saleListings: 0, combinedScore: 0 };
    agents.forEach((a) => stats.set(a.id, entry(a)));
    trades.forEach((t) => {
      const date = (basis === "FINALIZED" ? t.finalizedDate || t.closedAt : t.closeDate) || "";
      if (!["CLOSED", "FINALIZED"].includes(t.status) || !date || date < r.start || date > r.end) return;
      const a = agents.find((x) => x.id === t.agentId);
      if (!a) return;
      const e = entry(a);
      e.units++;
      e.volume += Math.max(0, t.salePrice || 0);
      e.gci += Math.max(0, t.grossCommission || 0);
      stats.set(a.id, e);
    });
    (data?.listings || []).forEach((l) => {
      if (!l.startDate || l.startDate < r.start || l.startDate > r.end || ["REJECTED", "CANCELLED", "DELETED", "EXPIRED"].includes(l.status) || !l.agentId) return;
      const e = stats.get(l.agentId);
      if (!e) return;
      e.listings++;
      if (l.kind === "LEASE") e.leaseListings++; else e.saleListings++;
    });
    const all = [...stats.values()];
    const pct = (key: "units" | "volume" | "gci" | "listings") => {
      const sorted = [...all].sort((a, b) => b[key] - a[key]), n = sorted.length;
      return new Map(sorted.map((x, i) => [x.id, n <= 1 ? 100 : (100 * (n - i - 1)) / (n - 1)]));
    };
    const P = { units: pct("units"), volume: pct("volume"), gci: pct("gci"), listings: pct("listings") };
    all.forEach((x) => (x.combinedScore = Math.round((((P.units.get(x.id) || 0) + (P.volume.get(x.id) || 0) + (P.gci.get(x.id) || 0) + (P.listings.get(x.id) || 0)) / 4) * 100) / 100));
    const m = cfg.topMetric;
    return all
      .filter((x) => (m === "listings" ? x.listings > 0 : m === "combined" ? x.units > 0 || x.listings > 0 || x.volume > 0 || x.gci > 0 : x.units > 0 || x.volume > 0 || x.gci > 0))
      .sort((a, b) => (m === "units" ? b.units - a.units : m === "gci" ? b.gci - a.gci : m === "listings" ? b.listings - a.listings : m === "combined" ? b.combinedScore - a.combinedScore : b.volume - a.volume) || b.volume - a.volume || b.gci - a.gci || a.name.localeCompare(b.name))
      .slice(0, 5);
  }, [agents, trades, data?.listings, cfg]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveWidgets = async () => {
    setSaving(true);
    const saved = await run("/dashboard-widgets", { widgets: draft }, { success: "Dashboard settings saved." });
    setSaving(false);
    if (saved) {
      setCfg(draft);
      setCustomizing(false);
    }
  };

  const RangeControls = ({ id }: { id: string }) => (
    <>
      <div className="actions" style={{ marginBottom: 10, flexWrap: "wrap" }}>
        <button type="button" className="secondary" onClick={() => setRange(id, preset("thisMonth"))}>This Month</button>
        <button type="button" className="secondary" onClick={() => setRange(id, preset("previousMonth"))}>Previous Month</button>
        <button type="button" className="secondary" onClick={() => setRange(id, preset("nextMonth"))}>Next Month</button>
        <button type="button" className="secondary" onClick={() => setRange(id, preset("thisYear"))}>This Year</button>
      </div>
      <div className="formgrid" style={{ marginBottom: 12 }}>
        <label>From<input type="date" value={range(id).start || monthStart} onChange={(e) => setRange(id, { start: e.target.value })} /></label>
        <label>To<input type="date" value={range(id).end || monthEnd} onChange={(e) => setRange(id, { end: e.target.value })} /></label>
      </div>
    </>
  );

  // ---- Brokerage income (Super Admin) ----
  const between = (d: string | null, a: string, b: string) => Boolean(d && a && b && d >= a && d <= b);
  const tradeIncome = (a: string, b: string) => trades.filter((t) => t.netToOffice > 0 && between(t.closeDate || t.finalizedDate, a, b)).reduce((n, t) => n + t.netToOffice, 0);
  const general = (a: string, b: string) => (data?.generalIncome || []).filter((g) => between(g.date, a, b)).reduce((n, g) => n + g.amount, 0);
  const totalIncome = (a: string, b: string) => Math.round((tradeIncome(a, b) + general(a, b)) * 100) / 100;
  const receivedIncome = (a: string, b: string) =>
    Math.round((trades.reduce((n, t) => {
      if (!(t.received > 0) || !between(t.receivedDate, a, b) || !(t.netToOffice > 0)) return n;
      const ratio = t.grossCommission > 0 ? Math.min(1, t.received / t.grossCommission) : 1;
      return n + Math.round(t.netToOffice * ratio * 100) / 100;
    }, 0) + general(a, b)) * 100) / 100;
  const y = now.getFullYear(), m = now.getMonth();
  const lastStart = new Date(y, m - 1, 1), lastEnd = new Date(y, m, 0), thisStart = new Date(y, m, 1), thisEnd = new Date(y, m + 1, 0), nextStart = new Date(y, m + 1, 1), nextEnd = new Date(y, m + 2, 0);
  const yearStart = ymd(new Date(y, 0, 1));
  const total = totalIncome(income.start, income.end), received = receivedIncome(income.start, income.end), expected = Math.max(0, total - received);
  const IncomeCard = ({ label, value, sub }: { label: string; value: number; sub: string }) => (
    <div className="card" style={{ minWidth: 0 }}>
      <div className="muted">{label}</div>
      <div className="metric" style={{ fontSize: 24 }}>{fr(value)}</div>
      <div className="sub">{sub}</div>
    </div>
  );

  const today = torontoToday();
  const inProgress = agents.filter((a) => ["IN_PROGRESS", "ELIGIBLE"].includes(a.renewalStatus)).length;
  const eligible = agents.filter((a) => a.renewalStatus === "ELIGIBLE").length;
  const expired = agents.filter((a) => a.recoExpiry && a.recoExpiry < today && a.renewalStatus !== "ELIGIBLE").length;
  const statusCard = (title: string, count: number, text: string, border: string, bg: string, color: string) => (
    <div style={{ border: `1px solid ${border}`, background: bg, borderRadius: 12, padding: 16, color }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>{title}</div>
      <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.3 }}>{count}</div>
      <div style={{ fontSize: 12 }}>{text}</div>
    </div>
  );

  if (q.isLoading) return <PageHead title="Admin Dashboard" desc="Loading…" />;

  return (
    <>
      <PageHead title="Admin Dashboard" desc="People, licence deadlines, upcoming closings and brokerage bank balances.">
        <button
          className="secondary"
          disabled={!data?.canCustomize}
          title={data?.canCustomize ? "Configure the shared dashboard" : "Ask an administrator to configure your dashboard"}
          onClick={() => { setDraft(cfg); setCustomizing(true); }}
        >
          <LuSettings size={16} /> Customize Dashboard
        </button>
        <button className="primary" onClick={() => onNavigate("transactions")}><LuPlus size={17} /> New Transaction</button>
      </PageHead>

      {data?.isSuperAdmin && (
        <Panel title="Brokerage Income" hint="Trade Record brokerage share plus separately recorded general income, excluding HST. Each entry is counted once." right={<span className="pill">Super Admin</span>} style={{ marginBottom: 18, borderTop: "3px solid var(--gold, #9e8556)" }}>
          <div className="grid4">
            <IncomeCard label="Year to Date" value={totalIncome(yearStart, ymd(now))} sub="Trade and general income dated this year, before HST" />
            <IncomeCard label="Last Month" value={totalIncome(ymd(lastStart), ymd(lastEnd))} sub={`Trade and general income for ${lastStart.toLocaleDateString("en-CA", { month: "long" })}`} />
            <IncomeCard label="This Month" value={totalIncome(ymd(thisStart), ymd(thisEnd))} sub={`Trade and general income for ${now.toLocaleDateString("en-CA", { month: "long" })}`} />
            <IncomeCard label="Next Month" value={totalIncome(ymd(nextStart), ymd(nextEnd))} sub={`Expected trade and general income for ${nextStart.toLocaleDateString("en-CA", { month: "long" })}`} />
          </div>
          <div className="grid4" style={{ marginTop: 12 }}>
            <IncomeCard label="Income Received" value={received} sub="Recorded commission receipts, before HST" />
            <IncomeCard label="Expected Income" value={expected} sub="Unreceived brokerage share for selected dates" />
            <IncomeCard label="Total Net to Office" value={total} sub="After agent net payable, before HST" />
            <IncomeCard label="Still to Receive" value={expected} sub="Estimated outstanding brokerage share" />
          </div>
          <div style={{ marginTop: 16, padding: 14, border: "1px solid var(--border, #dbe2ec)", borderRadius: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Choose a date range</div>
            <div className="actions" style={{ marginBottom: 12, flexWrap: "wrap" }}>
              <button type="button" className="secondary" onClick={() => setIncome({ start: yearStart, end: ymd(now) })}>Year to Date</button>
              <button type="button" className="secondary" onClick={() => setIncome({ start: ymd(lastStart), end: ymd(lastEnd) })}>Last Month</button>
              <button type="button" className="secondary" onClick={() => setIncome({ start: ymd(thisStart), end: ymd(thisEnd) })}>This Month</button>
              <button type="button" className="secondary" onClick={() => setIncome({ start: ymd(nextStart), end: ymd(nextEnd) })}>Next Month</button>
            </div>
            <div className="formgrid">
              <label>From<input type="date" value={income.start} onChange={(e) => setIncome((r) => ({ ...r, start: e.target.value }))} /></label>
              <label>To<input type="date" value={income.end} onChange={(e) => setIncome((r) => ({ ...r, end: e.target.value }))} /></label>
            </div>
            <div className="notice" style={{ marginTop: 12 }}>Trade income uses each trade's net commission to the office before HST (AgentHub trade accounting). Paid agent charges are included as general income, with HST removed. Each entry is counted once.</div>
          </div>
        </Panel>
      )}

      {visible.includes("balances") && (
        <Panel title="Bank Account Balances">
          <CountNotice label="Active bank accounts" count={(data?.banks || []).length} />
          <div className="grid4">
            {(data?.banks || []).map((b) => <Stat key={b.id} title={b.name} value={fr(b.balance)} sub={String(b.accountCategory || "").replace(/_/g, " ")} />)}
          </div>
          {!(data?.banks || []).length && <p className="muted">No bank accounts have been added yet.</p>}
        </Panel>
      )}

      <div className="two">
        {visible.includes("birthdays") && (
          <Panel title="Agent Birthdays">
            <CountNotice label="Birthdays in selected period" count={birthdays.length} />
            <RangeControls id="birthdays" />
            {birthdays.length ? birthdays.map((a) => (
              <div className="settingsline" key={a.id}><span>{a.name}</span><b>{shortDate(`${thisYear}-${a.dob!.slice(5, 10)}`)}</b></div>
            )) : <p className="muted">No birthdays found in this date range.</p>}
          </Panel>
        )}
        {visible.includes("anniversaries") && (
          <Panel title="Agent Anniversaries">
            <CountNotice label="Anniversaries in selected period" count={anniversaries.length} />
            <RangeControls id="anniversaries" />
            {anniversaries.length ? anniversaries.map((a) => {
              const yrs = yearsOfService(a.startDate!);
              return (
                <div className="settingsline" key={a.id}>
                  <span>{a.name}<small className="block" style={{ display: "block", marginTop: 3, fontWeight: 600 }}>{yrs === null ? "Service years unavailable" : `${yrs} ${yrs === 1 ? "year" : "years"} of service`}</small></span>
                  <b>{shortDate(`${thisYear}-${a.startDate!.slice(5, 10)}`)}</b>
                </div>
              );
            }) : <p className="muted">No anniversaries found in this date range.</p>}
          </Panel>
        )}
        {visible.includes("licences") && (
          <Panel title="Licences Expiring">
            <CountNotice label="Licences expiring in selected period" count={licences.length} />
            <RangeControls id="licences" />
            {licences.length ? licences.map((a) => {
              const isExpired = a.recoExpiry! < today, isProgress = ["IN_PROGRESS", "ELIGIBLE"].includes(a.renewalStatus), isEligible = a.renewalStatus === "ELIGIBLE";
              const label = isEligible ? "ELIGIBLE TO TRADE" : isProgress ? "RENEWAL IN PROGRESS" : isExpired ? "EXPIRED" : "";
              const color = isEligible ? "#166534" : isProgress ? "#9a3412" : "#b91c1c";
              const style = isEligible ? { color, background: "#f0fdf4", borderLeft: "4px solid #16a34a", paddingLeft: 10, borderRadius: 6 }
                : isProgress ? { color, background: "#fff7ed", borderLeft: "4px solid #d97706", paddingLeft: 10, borderRadius: 6 }
                : isExpired ? { color, background: "#fef2f2", borderLeft: "4px solid #dc2626", paddingLeft: 10, borderRadius: 6 } : undefined;
              return (
                <div className="settingsline" key={a.id} style={style}>
                  <span>
                    {a.name}
                    {label && <small className="block" style={{ color, fontWeight: 800 }}>{label}</small>}
                    {isProgress && a.renewalAppliedDate && <small className="block">Applied: {shortDate(a.renewalAppliedDate)}</small>}
                    <small className="block">{a.recoNumber || "Licence number not entered"}</small>
                  </span>
                  <b style={label ? { color, fontWeight: 800 } : undefined}>{shortDate(a.recoExpiry)}</b>
                </div>
              );
            }) : <p className="muted">No licence expiries found in this date range.</p>}
          </Panel>
        )}
        {visible.includes("closings") && (
          <Panel title="Deals Closing">
            <CountNotice label="Closings in selected period" count={closings.length} />
            <RangeControls id="closings" />
            {closings.length ? closings.map((t) => (
              <button
                type="button" key={t.id} className="settingsline" title="Open this transaction" onClick={() => onNavigate("transactions")}
                style={{ width: "100%", textAlign: "left", border: 0, background: "transparent", cursor: "pointer", font: "inherit", color: "inherit" }}
              >
                <span><strong style={{ color: "var(--navy)", textDecoration: "underline" }}>{t.number || "Trade"} · {t.address || "Address not entered"}</strong></span>
                <b>{shortDate(t.closeDate)}</b>
              </button>
            )) : <p className="muted">No deals closing in this date range.</p>}
          </Panel>
        )}
        {visible.includes("topAgents") && (
          <Panel title="Top Agents">
            <CountNotice label="Agents shown in ranking" count={topAgents.length} />
            <div className="actions" style={{ marginBottom: 10, flexWrap: "wrap" }}>
              <button type="button" className="secondary" onClick={() => setRange("topAgents", preset("thisMonth"))}>This Month</button>
              <button type="button" className="secondary" onClick={() => setRange("topAgents", preset("previousMonth"))}>Previous Month</button>
              <button type="button" className="secondary" onClick={() => setRange("topAgents", preset("nextMonth"))}>Next Month</button>
              <button type="button" className="secondary" onClick={() => setRange("topAgents", preset("thisYear"))}>This Year</button>
            </div>
            <div className="formgrid">
              <label>From<input type="date" value={range("topAgents").start || monthStart} onChange={(e) => setRange("topAgents", { start: e.target.value })} /></label>
              <label>To<input type="date" value={range("topAgents").end || monthEnd} onChange={(e) => setRange("topAgents", { end: e.target.value })} /></label>
              <label>Rank by
                <select value={cfg.topMetric || "volume"} onChange={(e) => setCfg((c) => ({ ...c, topMetric: e.target.value }))}>
                  <option value="volume">Sales volume</option><option value="units">Completed units</option><option value="gci">Gross commission</option><option value="listings">Listings</option><option value="combined">Combined top producer</option>
                </select>
              </label>
              <label>Reporting date
                <select value={range("topAgents").dateBasis || "FINALIZED"} onChange={(e) => setRange("topAgents", { dateBasis: e.target.value })}>
                  <option value="CLOSING">Closing date</option><option value="FINALIZED">Finalization date</option>
                </select>
              </label>
            </div>
            {topAgents.length ? (
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th><th>Agent</th>
                      {cfg.topMetric === "listings" ? <><th>Lease Listings</th><th>Sale Listings</th><th>Total Listings</th></>
                        : cfg.topMetric === "combined" ? <><th>Units</th><th>Volume</th><th>GCI</th><th>Lease Listings</th><th>Sale Listings</th><th>Combined Score</th></>
                        : <><th>Units</th><th>Volume</th><th>GCI</th></>}
                    </tr>
                  </thead>
                  <tbody>
                    {topAgents.map((a, i) => (
                      <tr key={a.id}>
                        <td>{i + 1}</td><td>{a.name}</td>
                        {cfg.topMetric === "listings" ? <><td>{a.leaseListings}</td><td>{a.saleListings}</td><td>{a.listings}</td></>
                          : cfg.topMetric === "combined" ? <><td>{a.units}</td><td>{fr(a.volume)}</td><td>{fr(a.gci)}</td><td>{a.leaseListings}</td><td>{a.saleListings}</td><td>{a.combinedScore}</td></>
                          : <><td>{a.units}</td><td>{fr(a.volume)}</td><td>{fr(a.gci)}</td></>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">{cfg.topMetric === "listings" ? "No listings with a listing start date were found in this date range." : cfg.topMetric === "combined" ? "No production activity found in this date range." : "No completed transactions found in this date range."}</p>
            )}
          </Panel>
        )}
      </div>

      <Panel title="RECO Renewal Status" right={<span className="pill">Agent compliance</span>} style={{ marginBottom: 18 }}>
        <div className="grid4">
          {statusCard("Renewal in Progress", inProgress, "RECO renewal application being processed", "#d97706", "#fff7ed", "#9a3412")}
          {statusCard("Eligible to Trade", eligible, "Eligibility marked as confirmed", "#16a34a", "#f0fdf4", "#166534")}
          {statusCard("Expired — Not Confirmed Eligible", expired, "Expiry passed without confirmed eligibility", "#dc2626", "#fef2f2", "#991b1b")}
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>Green indicates eligible to trade has been manually confirmed. Amber indicates renewal is in progress. Red indicates the licence expiry date has passed and eligibility is not confirmed.</div>
      </Panel>

      <div className="two">
        <Panel title="Quick Actions">
          <div className="actions">
            <button onClick={() => onNavigate("transactions")}><LuPlus />New Transaction</button>
            <button onClick={() => onNavigate("payables")}><LuReceipt />Add Expense</button>
            <button onClick={() => onNavigate("banking")}><LuLandmark />Reconcile</button>
            <button onClick={() => onNavigate("staff-payroll")}><LuWallet />Run Payroll</button>
          </div>
        </Panel>
        <Panel title="Production Overview">
          <div className="grid4">
            <Stat title="Transactions" value={trades.length} sub="Recorded" />
            <Stat title="Active Agents" value={active.length} sub="Current agent roster" />
            <Stat title="Gross Commission" value={fr(trades.reduce((n, t) => n + (t.grossCommission || 0), 0))} sub="Recorded GCI" />
            <Stat title="Expenses" value={fr(data?.expensesTotal || 0)} sub="Recorded expenses" />
          </div>
        </Panel>
      </div>

      {customizing && (
        <Modal title="Customize Dashboard" onClose={() => setCustomizing(false)}>
          <form onSubmit={(e) => { e.preventDefault(); saveWidgets(); }}>
            <p>Choose which panels appear on the admin dashboard. Date ranges can be changed on the dashboard at any time.</p>
            <div className="formgrid">
              {WIDGETS.map((w) => (
                <label key={w.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={draft.visible.includes(w.id)} onChange={(e) => setDraft((d) => ({ ...d, visible: e.target.checked ? [...d.visible, w.id] : d.visible.filter((x) => x !== w.id) }))} />
                  {w.label}
                </label>
              ))}
            </div>
            <div className="modalactions">
              <button type="button" className="secondary" onClick={() => setCustomizing(false)}>Cancel</button>
              <button className="primary" disabled={saving}>{saving ? "Saving..." : "Save Dashboard Settings"}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
