import React from "react";

type AgentBasicInfoProps = {
  basicInfo?: {
    firstName: string;
    lastName: string;
    representation: string;
    representationType: string;
    multipleRepresentation: string;
    agentDetails: any;
    leadSource?: string;
    lead?: { id: number; name?: string; phone?: string; campaign?: { name?: string } } | null;
  };
};

const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2.5">
    <span className="inline-block w-1 h-4 bg-[#0f766e] rounded-sm flex-shrink-0" />
    <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">{title}</span>
  </div>
);

const AgentBasicInfo: React.FC<AgentBasicInfoProps> = ({ basicInfo }) => {
  const getAgentLabels = () => {
    let firstAgent = "Seller";
    let secondAgent = "Buyer";
    const rep = basicInfo?.representationType !== "single"
      ? basicInfo?.multipleRepresentation
      : basicInfo?.representation;
    if (rep === "landlord" || rep === "tenant" || rep === "tenant,landlord" || rep === "landlord,tenant") {
      firstAgent = "Landlord"; secondAgent = "Tenant";
    }
    return { firstAgent, secondAgent };
  };

  const { firstAgent, secondAgent } = getAgentLabels();
  const hasSellerAgent = basicInfo?.agentDetails?.[0]?.sellerAgentAccount?.name;
  const hasBuyerAgent  = basicInfo?.agentDetails?.[0]?.buyerAgentAccount?.name;

  const leadSourceLabel =
    basicInfo?.leadSource === "dvrLead"
      ? "DVR Lead"
      : basicInfo?.leadSource === "myLead"
      ? "Non DVR Lead"
      : null;

  const leadName = basicInfo?.lead
    ? `${basicInfo.lead.name || "Unknown"}${basicInfo.lead.campaign?.name ? ` — ${basicInfo.lead.campaign.name}` : ""}${basicInfo.lead.phone ? ` (${basicInfo.lead.phone})` : ""}`
    : null;

  return (
    <div className="mt-4 rounded-lg border border-gray-200 overflow-hidden">
      <SectionHeader title="Agent Basic Info" />
      <table className="w-full text-xs border-collapse table-fixed">
        <tbody>
          {hasSellerAgent && (
            <tr className="border-b border-gray-100">
              <td className="px-3 py-2 w-1/4 text-[11px] font-semibold text-gray-600 bg-gray-100">Name</td>
              <td className="px-3 py-2 w-1/4 text-[11px] text-gray-800">{basicInfo?.agentDetails[0]?.sellerAgentAccount?.name}</td>
              <td className="px-3 py-2 w-1/4 text-[11px] font-semibold text-gray-600 bg-gray-100">Representation</td>
              <td className="px-3 py-2 w-1/4 text-[11px] text-gray-800">{firstAgent}</td>
            </tr>
          )}
          {hasBuyerAgent && (
            <tr className="border-b border-gray-100">
              <td className="px-3 py-2 w-1/4 text-[11px] font-semibold text-gray-600 bg-gray-100">Name</td>
              <td className="px-3 py-2 w-1/4 text-[11px] text-gray-800">{basicInfo?.agentDetails[0]?.buyerAgentAccount?.name}</td>
              <td className="px-3 py-2 w-1/4 text-[11px] font-semibold text-gray-600 bg-gray-100">Representation</td>
              <td className="px-3 py-2 w-1/4 text-[11px] text-gray-800">{secondAgent}</td>
            </tr>
          )}
          {leadSourceLabel && (
            <tr className="border-b border-gray-100">
              <td className="px-3 py-2 w-1/4 text-[11px] font-semibold text-gray-600 bg-gray-100">Lead Source</td>
              <td className="px-3 py-2 w-1/4 text-[11px] text-gray-800">{leadSourceLabel}</td>
              {basicInfo?.leadSource === "dvrLead" && leadName ? (
                <>
                  <td className="px-3 py-2 w-1/4 text-[11px] font-semibold text-gray-600 bg-gray-100">Lead</td>
                  <td className="px-3 py-2 w-1/4 text-[11px] text-gray-800">{leadName}</td>
                </>
              ) : (
                <>
                  <td className="px-3 py-2 w-1/4 bg-gray-50" />
                  <td className="px-3 py-2 w-1/4" />
                </>
              )}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AgentBasicInfo;
