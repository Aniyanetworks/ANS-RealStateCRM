import React from "react";

type SellerAndBuyerInfoProps = {
  sellerInfo: { firstName: string; lastName: string }[];
  buyerInfo:  { firstName: string; lastName: string }[];
};

const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2.5">
    <span className="inline-block w-1 h-4 bg-[#9F8667] rounded-sm flex-shrink-0" />
    <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">{title}</span>
  </div>
);

const SellerAndBuyerInfo: React.FC<SellerAndBuyerInfoProps> = ({ sellerInfo, buyerInfo }) => {
  const rep = JSON.parse(localStorage.getItem("tradeSheetRepresentationData") || '""');

  const getLabels = () => {
    if (rep === "landlord" || rep === "tenant" || rep === "tenant,landlord" || rep === "landlord,tenant")
      return { first: "Landlord", second: "Tenant" };
    return { first: "Seller", second: "Buyer" };
  };

  const { first, second } = getLabels();
  const maxRows = Math.max(sellerInfo.length, buyerInfo.length);

  return (
    <div className="mt-4 rounded-lg border border-gray-200 overflow-hidden">
      <SectionHeader title={`${first} & ${second} Details`} />
      <table className="w-full text-xs border-collapse table-fixed">
        <thead>
          <tr>
            <th className="px-3 py-2 w-[20%] text-[11px] font-semibold text-gray-600 bg-gray-100 text-left border-b border-gray-200" />
            <th className="px-3 py-2 text-[10px] font-semibold text-[#9F8667] bg-[#9F8667]/5 text-left border-b border-gray-200">{first}</th>
            <th className="px-3 py-2 text-[10px] font-semibold text-[#9F8667] bg-[#9F8667]/5 text-left border-b border-gray-200">{second}</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxRows }).map((_, i) => (
            <tr key={i} className="border-b border-gray-100 last:border-0">
              <td className="px-3 py-2 w-[20%] text-[11px] font-semibold text-gray-600 bg-gray-100">Name</td>
              <td className="px-3 py-2 text-[11px] text-gray-800 bg-white">
                {sellerInfo[i] ? `${sellerInfo[i].firstName} ${sellerInfo[i].lastName}` : "N/A"}
              </td>
              <td className="px-3 py-2 text-[11px] text-gray-800 bg-white">
                {buyerInfo[i]  ? `${buyerInfo[i].firstName} ${buyerInfo[i].lastName}`   : "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SellerAndBuyerInfo;
