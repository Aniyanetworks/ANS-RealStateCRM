// @ts-nocheck
import React from "react";
import { formatNumberWithCommasAndDecimals } from "../../../../utils/formatNumberWithCommasAndDecimals";

type AgentDetailsProps = {
  agentDetails?: any;
  sharedUsers?: Array<{
    id: string; name: string; firstName: string; lastName: string;
    email: string; commissionType: string; commission: number;
    representationType?: string;
  }>;
};

const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2.5">
    <span className="inline-block w-1 h-4 bg-[#0f766e] rounded-sm flex-shrink-0" />
    <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">{title}</span>
  </div>
);

const AgentDetails: React.FC<AgentDetailsProps> = ({ agentDetails, sharedUsers }) => {
  const rep = JSON.parse(localStorage.getItem("tradeSheetRepresentationData") || '""');

  const getLabels = () => {
    if (rep === "landlord" || rep === "tenant" || rep === "tenant,landlord" || rep === "landlord,tenant")
      return { first: "Landlord", second: "Tenant" };
    return { first: "Seller", second: "Buyer" };
  };
  const { first, second } = getLabels();

  const formatRepType = (type?: string) => {
    if (!type) return "N/A";
    const t = type.toLowerCase();
    if (t === "buyer")  return first === "Seller" ? "Buyer"    : "Tenant";
    if (t === "seller") return first === "Seller" ? "Seller"   : "Landlord";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const fmtCurrency = (v: number | string) => {
    const n = typeof v === "string" ? parseFloat(v) : v;
    return isNaN(n) ? "$0.00" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
  };
  const fmtPct  = (v: number | string) => { const n = parseFloat(String(v)); return isNaN(n) ? "0.00%" : `${n.toFixed(2)}%`; };
  const calcAmt = (rent: any, comm: any, type: string) => {
    const r = parseFloat(String(rent || 0)) || 0;
    const c = parseFloat(String(comm || 0)) || 0;
    return type === "percentage" ? (r * c) / 100 : c;
  };
  const hasCom  = (data?: any[]) => data?.some((i) => parseFloat(String(i.yearlyRent || 0)) > 0 || parseFloat(String(i.commission || 0)) > 0);

  const selType = agentDetails?.sellerCommissionType || "percentage";
  const buyType = agentDetails?.buyerCommissionType  || "percentage";
  const selCom  = agentDetails?.sellerCommercialCommission || [];
  const buyCom  = agentDetails?.buyerCommercialCommission  || [];
  const showCom = hasCom(selCom) || hasCom(buyCom);

  const selName = agentDetails?.sellerAgentAccount?.name ||
    `${agentDetails?.sellerAgentAccount?.firstName ?? ""} ${agentDetails?.sellerAgentAccount?.lastName ?? ""}`.trim() || "N/A";
  const buyName = agentDetails?.buyerAgentAccount?.name ||
    `${agentDetails?.buyerAgentAccount?.firstName ?? ""} ${agentDetails?.buyerAgentAccount?.lastName ?? ""}`.trim() || "N/A";

  const rows: [string, any, any][] = [
    ["Name",                selName,                                                       buyName],
    ["Email",               agentDetails?.sellerEmail,                                     agentDetails?.buyerEmail],
    ["Brokerage Name",      agentDetails?.sellerBrokerage?.brokerageName,                  agentDetails?.buyerBrokerage?.brokerageName],
    ["Brokerage Address",   agentDetails?.sellerBrokerage?.address,                        agentDetails?.buyerBrokerage?.address],
    ["Street Address",      agentDetails?.sellerBrokerage?.streetAddress,                  agentDetails?.buyerBrokerage?.streetAddress],
    ["City",                agentDetails?.sellerBrokerage?.city?.name,                     agentDetails?.buyerBrokerage?.city?.name],
    ["State / Province",    agentDetails?.sellerBrokerage?.state?.name,                    agentDetails?.buyerBrokerage?.state?.name],
    ["Postal / Zip",        agentDetails?.sellerBrokerage?.postalZipCode,                  agentDetails?.buyerBrokerage?.postalZipCode],
    ["Phone",               agentDetails?.sellerBrokerage?.phoneNumber,                    agentDetails?.buyerBrokerage?.phoneNumber],
    ["Fax",                 agentDetails?.sellerBrokerage?.faxNumber,                      agentDetails?.buyerBrokerage?.faxNumber],
    ["Billing Email",       agentDetails?.sellerBrokerage?.billingEmailAddress,             agentDetails?.buyerBrokerage?.billingEmailAddress],
    ["Agent Commission",
      selType === "percentage" ? `${agentDetails?.sellerCommission || 0}%` : `$${formatNumberWithCommasAndDecimals(agentDetails?.sellerCommissionAmount) || "0"}`,
      buyType === "percentage" ? `${agentDetails?.buyerCommission  || 0}%` : `$${formatNumberWithCommasAndDecimals(agentDetails?.buyerCommissionAmount)  || "0"}`,
    ],
  ];

  return (
    <div className="mt-4">
      {/* Main agent details */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <SectionHeader title="Agent Details" />
        <table className="w-full text-xs border-collapse table-fixed">
          <thead>
            <tr>
              <th className="px-3 py-2 w-[20%] text-[11px] font-semibold text-gray-600 bg-gray-100 text-left border-b border-gray-200">Detail</th>
              <th className="px-3 py-2 text-[10px] font-semibold text-[#0f766e] bg-[#0f766e]/5 text-left border-b border-gray-200">{first}'s Agent</th>
              <th className="px-3 py-2 text-[10px] font-semibold text-[#0f766e] bg-[#0f766e]/5 text-left border-b border-gray-200">{second}'s Agent</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, sVal, bVal]) => (
              <tr key={label} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-2 w-[20%] text-[11px] font-semibold text-gray-600 bg-gray-100">{label}</td>
                <td className="px-3 py-2 text-[11px] text-gray-800 bg-white">{sVal || "N/A"}</td>
                <td className="px-3 py-2 text-[11px] text-gray-800 bg-white">{bVal || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Commercial commission */}
      {showCom && (
        <div className="mt-4 rounded-lg border border-gray-200 overflow-hidden">
          <SectionHeader title="Commercial Commission Structure" />
          <div className="flex gap-0 divide-x divide-gray-200">
            {[
              { label: `${first}'s Agent`, data: selCom, type: selType, has: hasCom(selCom) },
              { label: `${second}'s Agent`, data: buyCom, type: buyType, has: hasCom(buyCom) },
            ].filter((s) => s.has).map((side) => (
              <div key={side.label} className="flex-1">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-[#0f766e] bg-[#0f766e]/5 border-b border-gray-200">{side.label}</div>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      {["Year","Yearly Rent",`Commission ${side.type === "percentage" ? "(%)" : "($)"}`, "Amount"].map((h) => (
                        <th key={h} className="px-3 py-1.5 text-[10px] font-medium text-gray-400 uppercase bg-gray-50/60 text-left border-b border-gray-100">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {side.data.map((item: any, i: number) => {
                      const amt = calcAmt(item.yearlyRent, item.commission, side.type);
                      return (
                        <tr key={i} className="border-b border-gray-100 last:border-0">
                          <td className="px-3 py-1.5 text-[11px] text-gray-700">{item.year || i + 1}</td>
                          <td className="px-3 py-1.5 text-[11px] text-gray-700">{fmtCurrency(item.yearlyRent || 0)}</td>
                          <td className="px-3 py-1.5 text-[11px] text-gray-700">{side.type === "percentage" ? fmtPct(item.commission || 0) : fmtCurrency(item.commission || 0)}</td>
                          <td className="px-3 py-1.5 text-[11px] text-gray-700">{fmtCurrency(amt)}</td>
                        </tr>
                      );
                    })}
                    {(() => {
                      const totalRent = side.data.reduce((s: number, i: any) => s + (parseFloat(String(i.yearlyRent || 0)) || 0), 0);
                      const totalAmt  = side.data.reduce((s: number, i: any) => s + calcAmt(i.yearlyRent, i.commission, side.type), 0);
                      const weightedPct = totalRent > 0 ? (totalAmt / totalRent) * 100 : 0;
                      return (
                        <tr className="bg-gray-50 font-semibold border-t border-gray-200">
                          <td className="px-3 py-1.5 text-[11px] text-gray-600">Total</td>
                          <td className="px-3 py-1.5 text-[11px] text-gray-600">{fmtCurrency(totalRent)}</td>
                          <td className="px-3 py-1.5 text-[11px] text-gray-600">
                            {side.type === "percentage" ? fmtPct(weightedPct) : fmtCurrency(side.data.reduce((s: number, i: any) => s + (parseFloat(String(i.commission || 0)) || 0), 0))}
                          </td>
                          <td className="px-3 py-1.5 text-[11px] text-gray-600">{fmtCurrency(totalAmt)}</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared agents */}
      {sharedUsers && sharedUsers.length > 0 && (
        <div className="mt-4 rounded-lg border border-gray-200 overflow-hidden">
          <SectionHeader title="Shared Agent Details" />
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {["Agent","Email","Commission"].map((h) => (
                  <th key={h} className="px-3 py-2 text-[10px] font-semibold text-[#0f766e] bg-[#0f766e]/5 text-left border-b border-gray-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sharedUsers.map((u: any) => (
                <tr key={u.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-2 text-[11px] text-gray-800">
                    {u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "N/A"}
                    <span className="ml-1 text-gray-400">({formatRepType(u.representationType)})</span>
                  </td>
                  <td className="px-3 py-2 text-[11px] text-gray-800">{u.email || "N/A"}</td>
                  <td className="px-3 py-2 text-[11px] text-gray-800">
                    {u.commissionType === "percentage" ? `${u.commission || 0}%` : `$${formatNumberWithCommasAndDecimals(u.commission) || "0"}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AgentDetails;
