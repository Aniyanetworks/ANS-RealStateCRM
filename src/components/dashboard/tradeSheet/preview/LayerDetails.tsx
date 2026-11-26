import React from "react";

type LayerDetailsProps = {
  lawyerDetails?: {
    sellerLawyer: {
      firstName: string; lastName: string; faxNumber: string; address: string;
      country: { countryName: string }; city: { name: string }; state: { name: string };
      firm: { firmName: string; faxNumber: string; phoneNumber: string; address: string;
        country: { countryName: string }; city: { name: string }; state: { name: string };
      };
      postalZipCode: string; phoneNumber: string; email: string;
    };
    buyerLawyer: {
      firstName: string; lastName: string; faxNumber: string; address: string;
      country: { countryName: string }; city: { name: string }; state: { name: string };
      firm: { firmName: string; faxNumber: string; phoneNumber: string; address: string;
        country: { countryName: string }; city: { name: string }; state: { name: string };
      };
      postalZipCode: string; phoneNumber: string; email: string;
    };
  };
};

const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2.5">
    <span className="inline-block w-1 h-4 bg-[#0f766e] rounded-sm flex-shrink-0" />
    <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">{title}</span>
  </div>
);

const LayerDetails: React.FC<LayerDetailsProps> = ({ lawyerDetails }) => {
  const sl = lawyerDetails?.sellerLawyer;
  const bl = lawyerDetails?.buyerLawyer;

  const rows: [string, string | undefined, string | undefined][] = [
    ["Law Firm",       sl?.firm?.firmName,                                                                      bl?.firm?.firmName],
    ["Name",           sl?.firstName || sl?.lastName ? `${sl?.firstName ?? ""} ${sl?.lastName ?? ""}`.trim() : undefined,
                       bl?.firstName || bl?.lastName ? `${bl?.firstName ?? ""} ${bl?.lastName ?? ""}`.trim() : undefined],
    ["Address",        sl?.firm?.address,                                                                       bl?.firm?.address],
    ["City",           sl?.city?.name,                                                                          bl?.city?.name],
    ["State / Province", sl?.state?.name,                                                                       bl?.state?.name],
    ["Postal / Zip",   sl?.postalZipCode,                                                                       bl?.postalZipCode],
    ["Phone",          sl?.phoneNumber || sl?.firm?.phoneNumber,                                                bl?.phoneNumber || bl?.firm?.phoneNumber],
    ["Fax",            sl?.firm?.faxNumber || sl?.faxNumber,                                                    bl?.firm?.faxNumber || bl?.faxNumber],
    ["Email",          sl?.email,                                                                               bl?.email],
  ];

  return (
    <div className="mt-4 rounded-lg border border-gray-200 overflow-hidden">
      <SectionHeader title="Lawyer Details" />
      <table className="w-full text-xs border-collapse table-fixed">
        <thead>
          <tr>
            <th className="px-3 py-2 w-[20%] text-[11px] font-semibold text-gray-600 bg-gray-100 text-left border-b border-gray-200" />
            <th className="px-3 py-2 text-[10px] font-semibold text-[#0f766e] bg-[#0f766e]/5 text-left border-b border-gray-200">Seller's Lawyer</th>
            <th className="px-3 py-2 text-[10px] font-semibold text-[#0f766e] bg-[#0f766e]/5 text-left border-b border-gray-200">Buyer's Lawyer</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, selVal, buyVal]) => (
            <tr key={label} className="border-b border-gray-100 last:border-0">
              <td className="px-3 py-2 w-[20%] text-[11px] font-semibold text-gray-600 bg-gray-100">{label}</td>
              <td className="px-3 py-2 text-[11px] text-gray-800 bg-white">{selVal || "N/A"}</td>
              <td className="px-3 py-2 text-[11px] text-gray-800 bg-white">{buyVal || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LayerDetails;
