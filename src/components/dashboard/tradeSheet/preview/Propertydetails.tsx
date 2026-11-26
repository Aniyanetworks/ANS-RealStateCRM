// @ts-nocheck
import moment from "moment";
import React from "react";
import capitalizeFirstLetter from "../../../../utils/capitalizeFirstLetter";
import { formatNumberWithCommasAndDecimals } from "../../../../utils/formatNumberWithCommasAndDecimals";

type PropertyDetailsProps = {
  propertyDetails?: {
    mlsNumber: string;
    updateMLSStatus: string;
    propertyAddress: string;
    firmDate: string;
    soldPrice: string;
    closingDate: string;
    depositAmount: string;
    depositDate: string;
    conditional: string;
    continueShowings: string;
    offerDate?: string;
    acceptanceDate?: string;
  };
  conditions?: Array<{
    id: number;
    conditionType: string;
    dueDate: string;
    conditionMetDate: string | null;
    completeStatus: string | null;
  }>;
};

export const formatDate = (isoDate: any) =>
  isoDate ? moment.utc(isoDate).format("YYYY-MM-DD") : "";

const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2.5">
    <span className="inline-block w-1 h-4 bg-[#0f766e] rounded-sm flex-shrink-0" />
    <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">{title}</span>
  </div>
);

const LabelCell = ({ children }: { children: React.ReactNode }) => (
  <td className="px-3 py-2 w-1/4 text-[11px] font-semibold text-gray-600 bg-gray-100 border-b border-gray-200">{children}</td>
);
const ValueCell = ({ children }: { children: React.ReactNode }) => (
  <td className="px-3 py-2 w-1/4 text-[11px] text-gray-800 bg-white border-b border-gray-100">{children}</td>
);

const Propertydetails: React.FC<PropertyDetailsProps> = ({ propertyDetails, conditions = [] }) => (
  <div className="mt-4">
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <SectionHeader title="Property Details" />
      <table className="w-full text-xs border-collapse table-fixed">
        <tbody>
          <tr>
            <LabelCell>MLS</LabelCell>
            <ValueCell>{propertyDetails?.mlsNumber || "N/A"}</ValueCell>
            <LabelCell>Property Address</LabelCell>
            <ValueCell>{propertyDetails?.propertyAddress || "N/A"}</ValueCell>
          </tr>
          <tr>
            <LabelCell>Sold Price</LabelCell>
            <ValueCell>${formatNumberWithCommasAndDecimals(propertyDetails?.soldPrice) || "N/A"}</ValueCell>
            <LabelCell>Offer Date</LabelCell>
            <ValueCell>{formatDate(propertyDetails?.offerDate) || "N/A"}</ValueCell>
          </tr>
          <tr>
            <LabelCell>Acceptance Date</LabelCell>
            <ValueCell>{formatDate(propertyDetails?.acceptanceDate) || "N/A"}</ValueCell>
            <LabelCell>Closing Date</LabelCell>
            <ValueCell>{formatDate(propertyDetails?.closingDate) || "N/A"}</ValueCell>
          </tr>
          <tr>
            <LabelCell>Deposit Amount</LabelCell>
            <ValueCell>${formatNumberWithCommasAndDecimals(propertyDetails?.depositAmount) || "N/A"}</ValueCell>
            <LabelCell>Deposit Date</LabelCell>
            <ValueCell>{formatDate(propertyDetails?.depositDate) || "N/A"}</ValueCell>
          </tr>
          <tr>
            <LabelCell>Update MLS Status</LabelCell>
            <ValueCell>{capitalizeFirstLetter(propertyDetails?.updateMLSStatus) || "N/A"}</ValueCell>
            <LabelCell>Firm Date</LabelCell>
            <ValueCell>{formatDate(propertyDetails?.firmDate) || "N/A"}</ValueCell>
          </tr>
          <tr>
            <LabelCell>Conditional</LabelCell>
            <ValueCell>{capitalizeFirstLetter(propertyDetails?.conditional) || "N/A"}</ValueCell>
            <td className="px-3 py-2 w-1/4 bg-gray-50 border-b border-gray-100" />
            <td className="px-3 py-2 w-1/4 border-b border-gray-100" />
          </tr>
        </tbody>
      </table>
    </div>

    {conditions.length > 0 && (
      <div className="mt-4 rounded-lg border border-gray-200 overflow-hidden">
        <SectionHeader title="Conditions" />
        <table className="w-full text-xs border-collapse table-fixed">
          <thead>
            <tr>
              {["Condition Type", "Due Date", "Condition Met Date", "Status"].map((h) => (
                <th key={h} className="px-3 py-2 text-[10px] font-semibold text-[#0f766e] bg-[#0f766e]/5 text-left border-b border-gray-200">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {conditions.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                <td className="px-3 py-2 text-[11px] text-gray-700">{c.conditionType || "N/A"}</td>
                <td className="px-3 py-2 text-[11px] text-gray-700">{formatDate(c.dueDate) || "N/A"}</td>
                <td className="px-3 py-2 text-[11px] text-gray-700">{formatDate(c.conditionMetDate) || "N/A"}</td>
                <td className="px-3 py-2 text-[11px] text-gray-700">{c.completeStatus ? capitalizeFirstLetter(c.completeStatus) : "Pending"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default Propertydetails;
