/* eslint-disable @typescript-eslint/no-explicit-any */
import { calcCommission } from "./commission";
import { listingSellers } from "./TransactionEditor";

const esc = (v: unknown) => String(v ?? "—").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
const money = (n: unknown) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number(n || 0));
const day = (v?: string | null) => (v ? new Date(String(v).slice(0, 10) + "T12:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }) : "—");
const nm = (a: any) => [a?.firstName, a?.lastName].filter(Boolean).join(" ").trim();

export function printTradeRecord(t: any) {
  const p = t.properties?.[0] || {};
  const c = calcCommission(t);
  const saved = t.tradeTransaction?.[0];
  const sellers = (t.sellerInformations || []).length ? t.sellerInformations : listingSellers(t.propertyListing);
  const people = [...sellers.map((s: any) => `Seller: ${nm(s)}`), ...(t.buyerInformations || []).map((b: any) => `Buyer: ${nm(b)}`)].filter((x) => !/: $/.test(x));
  const ld = t.lawyerDetails?.[0];
  if (ld?.sellerLawyer) people.push(`Seller's lawyer: ${ld.sellerLawyer.name || nm(ld.sellerLawyer)}`);
  if (ld?.buyerLawyer) people.push(`Buyer's lawyer: ${ld.buyerLawyer.name || nm(ld.buyerLawyer)}`);
  const conditions = (t.conditions || []).map((x: any) => `${x.conditionType || "Condition"} — due ${day(x.dueDate)}${x.conditionMetDate ? `, met ${day(x.conditionMetDate)}` : ""}`);
  const rows: [string, unknown][] = [
    ["Trade #", t.tradeSheetTypeId],
    ["MLS #", p.mlsNumber],
    ["Property", p.propertyAddress || t.propertyListing?.propertyAddress],
    ["City / Province", [p.city?.name, p.state?.name].filter(Boolean).join(", ")],
    ["Offer / Firm / Close", `${day(p.offerDate)} / ${day(p.firmDate)} / ${day(p.closingDate)}`],
    ["Transaction", `${t.listType || "—"} · ${t.representationType === "multiple" ? "Multiple representation" : t.representation || "—"}`],
    ["Sale Value", money(Number(p.soldPrice) || Number(p.salesPrice))],
    ["People", people.map(esc).join("<br/>") || "—"],
    ["Conditions / Requirements", conditions.map(esc).join("<br/>") || "—"],
    ["Commission Receivable (incl. HST)", money(saved ? saved.baseOfficeCommissionTotal : c.baseTotal)],
    ["Net Agent Payable Before HST", money(c.agent)],
    ["Total Agent Cheque", money(saved ? saved.agentCommissionTotal : c.agentTotal)],
    ["Net to Office (incl. HST)", money(saved ? saved.netCommissionTotal : c.netTotal)],
    ["Status", `${t.status}${saved ? " · finalized " + day(saved.createdAt) : ""}`],
  ];
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Trade Record ${esc(t.tradeSheetTypeId)}</title>
<style>body{font-family:Arial,sans-serif;color:#14213d;margin:32px}h1{font-size:22px;margin:0 0 4px}p{color:#69758a;margin:0 0 18px;font-size:12px}
table{width:100%;border-collapse:collapse;font-size:13px}th{width:260px;text-align:left;background:#f5f6f9;color:#42506a}th,td{border:1px solid #dce2eb;padding:9px 11px;vertical-align:top}
.bar{margin-top:18px}@media print{.bar{display:none}}</style></head><body>
<h1>Trade Record</h1><p>Generated ${esc(new Date().toLocaleString("en-CA"))}</p>
<table>${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${k === "People" || k === "Conditions / Requirements" ? v : esc(v)}</td></tr>`).join("")}</table>
<div class="bar"><button onclick="window.print()">Print / Save as PDF</button></div></body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
