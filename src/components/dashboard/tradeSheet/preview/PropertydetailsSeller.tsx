// @ts-nocheck
import moment from "moment";
import React from "react";
import capitalizeFirstLetter from "../../../../utils/capitalizeFirstLetter";
import { formatNumberWithCommasAndDecimals } from "../../../../utils/formatNumberWithCommasAndDecimals";

type PropertyDetailsProps = {
  showPriceTypeUnit?: boolean;
  propertyDetails?: {
    mlsNumber: string; updateMLSStatus: string; propertyAddress: string;
    firmDate: string; soldPrice: string; closingDate: string;
    depositAmount: string; depositDate: string; conditional: string;
    continueShowings: string; listingPrice?: string; salesPrice?: string;
    offerDate?: string; acceptanceDate?: string;
    listingPriceType?: string; listingPriceUnit?: string;
    salesPriceType?: string; salesPriceUnit?: string;
  };
  conditions?: Array<{
    id: number; conditionType: string; dueDate: string;
    conditionMetDate: string | null; completeStatus: string | null;
  }>;
};

const formatPriceDisplay = (price, priceUnit?, priceType?, showPriceTypeUnit?) => {
  if (!price) return "N/A";
  const formattedPrice = formatNumberWithCommasAndDecimals(price);
  if (!showPriceTypeUnit) return `$${formattedPrice}`;
  const unitLabel = priceUnit === "perSquareFoot" ? "Per Square Foot" : priceUnit === "monthlyRent" ? "Monthly Rent" : "";
  const typeLabel = priceType === "net" ? "Net Price" : priceType === "gross" ? "Gross Price" : "";
  if (unitLabel && typeLabel) return `$${formattedPrice} ${unitLabel} (${typeLabel})`;
  if (unitLabel) return `$${formattedPrice} ${unitLabel}`;
  if (typeLabel) return `$${formattedPrice} (${typeLabel})`;
  return `$${formattedPrice}`;
};

const formatDate = (isoDate: any) =>
  isoDate ? moment.utc(isoDate).format("YYYY-MM-DD") : "";

const SectionHeader = ({ title }: { title: string }) => (
  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2.5">
    <span className="inline-block w-1 h-4 bg-[#9F8667] rounded-sm flex-shrink-0" />
    <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">{title}</span>
  </div>
);

const L = ({ children }) => (
  <td className="px-3 py-2 w-1/4 text-[11px] font-semibold text-gray-600 bg-gray-100 border-b border-gray-200">{children}</td>
);
const V = ({ children }) => (
  <td className="px-3 py-2 w-1/4 text-[11px] text-gray-800 bg-white border-b border-gray-100">{children}</td>
);

const PropertydetailsSeller: React.FC<PropertyDetailsProps> = ({
  showPriceTypeUnit = false,
  propertyDetails,
  conditions = [],
}) => (
  <div className="mt-4">
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <SectionHeader title="Property Details" />
      <table className="w-full text-xs border-collapse table-fixed">
        <tbody>
          <tr>
            <L>MLS</L><V>{propertyDetails?.mlsNumber || "N/A"}</V>
            <L>Property Address</L><V>{propertyDetails?.propertyAddress || "N/A"}</V>
          </tr>
          <tr>
            <L>Listing Price</L>
            <V>{formatPriceDisplay(propertyDetails?.listingPrice, propertyDetails?.listingPriceUnit, propertyDetails?.listingPriceType, showPriceTypeUnit)}</V>
            <L>Sales Price</L>
            <V>{formatPriceDisplay(propertyDetails?.salesPrice, propertyDetails?.listingPriceUnit ?? propertyDetails?.salesPriceUnit, propertyDetails?.listingPriceType ?? propertyDetails?.salesPriceType, showPriceTypeUnit)}</V>
          </tr>
          <tr>
            <L>Continue Showings</L><V>{capitalizeFirstLetter(propertyDetails?.continueShowings) || "N/A"}</V>
            <L>Offer Date</L><V>{formatDate(propertyDetails?.offerDate) || "N/A"}</V>
          </tr>
          <tr>
            <L>Acceptance Date</L><V>{formatDate(propertyDetails?.acceptanceDate) || "N/A"}</V>
            <L>Closing Date</L><V>{formatDate(propertyDetails?.closingDate) || "N/A"}</V>
          </tr>
          <tr>
            <L>Firm Date</L><V>{formatDate(propertyDetails?.firmDate) || "N/A"}</V>
            <L>Deposit Amount</L><V>${formatNumberWithCommasAndDecimals(propertyDetails?.depositAmount) || "N/A"}</V>
          </tr>
          <tr>
            <L>Deposit Date</L><V>{formatDate(propertyDetails?.depositDate) || "N/A"}</V>
            <L>Update MLS Status</L><V>{capitalizeFirstLetter(propertyDetails?.updateMLSStatus) || "N/A"}</V>
          </tr>
          <tr>
            <L>Conditional</L><V>{capitalizeFirstLetter(propertyDetails?.conditional) || "N/A"}</V>
            <td className="px-3 py-2 w-1/4 bg-gray-50 border-b border-gray-100" /><td className="px-3 py-2 w-1/4 border-b border-gray-100" />
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
              {["Condition Type","Due Date","Condition Met Date","Status"].map((h) => (
                <th key={h} className="px-3 py-2 text-[10px] font-semibold text-[#9F8667] bg-[#9F8667]/5 text-left border-b border-gray-200">{h}</th>
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

export default PropertydetailsSeller;
