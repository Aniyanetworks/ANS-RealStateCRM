// Agent Rankings & Top Producers — the original ANS Accounting screen, using ANS RealStateCRM agents, approved trade sheets
// (with their trade accounting) and property listings.
import { useMemo, useState } from "react";
import { useAcct } from "../acctShared";
import { LuDownload, LuRefreshCw, LuTrophy } from "./icons";
import { PageHead, Stat, fr, ymd } from "./ui";

type Agent = { id: number; name: string; agentNumber: string; tradeCount: number };
type Trade = { id: number; agentId: number | null; status: string; closeDate: string | null; finalizedDate: string | null; closedAt: string | null; salePrice: number; grossCommission: number };
type Listing = { agentId: number | null; startDate: string | null; status: string; kind: "LEASE" | "SALE" };
type Row = Agent & { units: number; volume: number; gci: number; listingCount: number; leaseListingCount: number; saleListingCount: number; combinedScore: number; rank: number };

const now = new Date();

export default function Rankings() {
  const q = useAcct("/admin-dashboard");
  const data = (q.rows || {}) as { agents?: Agent[]; trades?: Trade[]; listings?: Listing[] };
  const [period, setPeriod] = useState("MONTH");
  const [from, setFrom] = useState(ymd(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(ymd(now));
  const [metric, setMetric] = useState("UNITS");
  const [basis, setBasis] = useState("FINALIZED");
  const [search, setSearch] = useState("");

  const pickPeriod = (p: string) => {
    setPeriod(p);
    const y = now.getFullYear(), m = now.getMonth();
    let start = new Date(y, m, 1);
    if (p === "QUARTER") start = new Date(y, Math.floor(m / 3) * 3, 1);
    else if (p === "HALF") start = new Date(y, m < 6 ? 0 : 6, 1);
    else if (p === "YEAR") start = new Date(y, 0, 1);
    else if (p === "CUSTOM") return;
    setFrom(ymd(start));
    setTo(ymd(now));
  };

  const ranked = useMemo<Row[]>(() => {
    if (!from || !to || from > to) return [];
    const rows = new Map<number, Row>();
    (data.agents || []).forEach((a) => rows.set(a.id, { ...a, units: 0, volume: 0, gci: 0, listingCount: 0, leaseListingCount: 0, saleListingCount: 0, combinedScore: 0, rank: 0 }));
    (data.trades || []).forEach((t) => {
      if (!["CLOSED", "FINALIZED"].includes(t.status)) return;
      const d = (basis === "FINALIZED" ? t.finalizedDate || t.closedAt : t.closeDate) || "";
      if (!d || d < from || d > to || !t.agentId) return;
      const r = rows.get(t.agentId);
      if (!r) return;
      r.units += 1;
      r.volume += Math.max(0, t.salePrice || 0);
      r.gci += t.grossCommission || 0;
    });
    (data.listings || []).forEach((l) => {
      if (!l.startDate || l.startDate < from || l.startDate > to || ["REJECTED", "CANCELLED", "DELETED", "EXPIRED"].includes(l.status) || !l.agentId) return;
      const r = rows.get(l.agentId);
      if (!r) return;
      r.listingCount++;
      if (l.kind === "LEASE") r.leaseListingCount++; else r.saleListingCount++;
    });
    const all = [...rows.values()];
    const pct = (key: "units" | "volume" | "gci" | "listingCount") => {
      const s = [...all].sort((a, b) => b[key] - a[key]), n = s.length;
      return new Map(s.map((x, i) => [x.id, n <= 1 ? 100 : (100 * (n - i - 1)) / (n - 1)]));
    };
    const P = { u: pct("units"), v: pct("volume"), g: pct("gci"), l: pct("listingCount") };
    all.forEach((x) => (x.combinedScore = Math.round((((P.u.get(x.id) || 0) + (P.v.get(x.id) || 0) + (P.g.get(x.id) || 0) + (P.l.get(x.id) || 0)) / 4) * 100) / 100));
    return all
      .sort((a, b) => (metric === "LISTINGS" ? b.listingCount - a.listingCount : metric === "COMBINED" ? b.combinedScore - a.combinedScore : metric === "VOLUME" ? b.volume - a.volume : metric === "GCI" ? b.gci - a.gci : b.units - a.units) || b.volume - a.volume || b.gci - a.gci || a.name.localeCompare(b.name))
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [data, from, to, metric, basis]);

  const term = search.trim().toLowerCase();
  const shown = ranked.filter((r) => !term || r.name.toLowerCase().includes(term) || String(r.agentNumber).toLowerCase().includes(term));
  const exportCsv = () => {
    const csv = [["Rank", "Agent", "Agent Number", "Completed Units", "Sales Volume", "Gross Commission", "Lease Listings", "Sale Listings", "Total Listings"], ...shown.map((r) => [r.rank, r.name, r.agentNumber, r.units, r.volume.toFixed(2), r.gci.toFixed(2), r.leaseListingCount, r.saleListingCount, r.listingCount])]
      .map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-rankings-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHead title="Agent Rankings & Top Producers" desc="Rank agents by completed transactions or listings started during the selected reporting period, using listing start date for listing rankings.">
        <button className="secondary" type="button" onClick={() => q.refetch()}><LuRefreshCw size={16} /> Refresh</button>
      </PageHead>
      <section className="panel">
        <div className="formgrid">
          <label>Reporting period
            <select value={period} onChange={(e) => pickPeriod(e.target.value)}>
              <option value="MONTH">Monthly</option><option value="QUARTER">Quarterly</option><option value="HALF">Half-yearly</option><option value="YEAR">Yearly</option><option value="CUSTOM">Custom date range</option>
            </select>
          </label>
          <label>Rank by
            <select value={metric} onChange={(e) => setMetric(e.target.value)}>
              <option value="UNITS">Completed units</option><option value="VOLUME">Sales volume</option><option value="GCI">Gross commission</option><option value="LISTINGS">Listing count (listing start date)</option><option value="COMBINED">Combined top producer</option>
            </select>
          </label>
          <label>Reporting date
            <select value={basis} onChange={(e) => setBasis(e.target.value)}>
              <option value="CLOSING">Closing date</option><option value="FINALIZED">Finalization date</option>
            </select>
          </label>
          <label>From date<input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPeriod("CUSTOM"); }} /></label>
          <label>To date<input type="date" value={to} min={from || undefined} max={ymd(now)} onChange={(e) => { setTo(e.target.value); setPeriod("CUSTOM"); }} /></label>
          <label style={{ gridColumn: "1 / -1" }}>Search agent<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Agent name or agent number" /></label>
        </div>
        <div className="muted" style={{ marginTop: 10 }}>
          Includes closed and finalized transactions dated by {basis === "FINALIZED" ? "finalization date" : "actual closing date"} inside the selected range. Transactions without the selected date or an agent assignment are excluded. Use Reporting date to switch between closing-date and finalization-date results. Summary totals remain based on the full reporting period when you search for an agent.
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button className="primary" type="button" onClick={exportCsv} disabled={!shown.length}><LuDownload size={16} /> Export Ranking CSV</button>
        </div>
      </section>
      <div className="grid3">
        <Stat title="Completed Units" value={ranked.reduce((n, r) => n + r.units, 0)} sub="Agent transaction credits in reporting period" />
        <Stat title="Sales Volume" value={fr(ranked.reduce((n, r) => n + r.volume, 0))} sub="Completed transactions" />
        <Stat title="Gross Commission" value={fr(ranked.reduce((n, r) => n + r.gci, 0))} sub="Agent commission credited in reporting period" />
      </div>
      <section className="panel">
        <div className="paneltitle">
          <div>
            <h2>Top Producers</h2>
            <p className="panelhint">{from || "—"} to {to || "—"} · ranked by {metric === "LISTINGS" ? "listings started" : metric === "UNITS" ? "completed units" : metric === "VOLUME" ? "sales volume" : metric === "COMBINED" ? "combined score" : "gross commission"}</p>
          </div>
          <span className="pill">{shown.length} agents{term ? " matched" : ""}</span>
        </div>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Rank</th><th>Agent</th><th>Agent #</th><th>Completed Units</th><th>Sales Volume</th><th>Gross Commission</th><th>Trades</th><th>Lease Listings</th><th>Sale Listings</th><th>Total Listings</th></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.rank}</strong>{r.rank === 1 && <span className="pill" style={{ marginLeft: 6 }}>Top Producer</span>}</td>
                  <td>{r.name}</td>
                  <td>{r.agentNumber || "—"}</td>
                  <td>{r.units}</td>
                  <td>{fr(r.volume)}</td>
                  <td>{fr(r.gci)}</td>
                  <td>{r.tradeCount}</td>
                  <td>{r.leaseListingCount}</td>
                  <td>{r.saleListingCount}</td>
                  <td>{r.listingCount}</td>
                </tr>
              ))}
              {!shown.length && (
                <tr><td colSpan={10}><div className="empty small"><LuTrophy /><h3>No completed transactions found</h3><p>Try another date range, or verify that transactions have a closing date, an eligible status, and an agent assignment.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
