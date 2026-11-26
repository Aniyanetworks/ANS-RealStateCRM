// @ts-nocheck
import moment from "moment-timezone";
import { formatStringCamelCasecapitalize } from "../../../../../../utils/stringUtils";
import logo from "/logo.svg";
import type { DataType } from "./types";
import { reasonLabel } from "./types";

interface ReceiptDisplayProps {
  receiptData: DataType;
  isLoading?: boolean;
}

const ReceiptSkeleton = () => {
  return (
    <div className="space-y-1 pt-4" id="printSection">
      <div className="flex flex-col items-center gap-2">
        <div className="w-[50px] h-[50px] bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="text-center">
        <div className="h-6 w-64 bg-gray-200 rounded mx-auto animate-pulse"></div>
      </div>
      
      <div className="space-y-3 p-5">
        <div className="flex gap-1">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="flex gap-1">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="flex gap-1">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="flex gap-1">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="flex gap-1">
          <div className="h-4 w-36 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="flex gap-1">
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="flex items-start gap-1">
          <div className="flex w-1/2 gap-1">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>

          <div className="flex w-1/2 gap-1">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-[70px] h-[70px] bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReceiptDisplay = ({ receiptData, isLoading = false }: ReceiptDisplayProps) => {
  if (
    isLoading || 
    !receiptData || 
    Object.keys(receiptData).length === 0 ||
    (!receiptData.receiptId && !receiptData.uuid)
  ) {
    return <ReceiptSkeleton />;
  }

  return (
    <div className="space-y-1 pt-4" id="printSection">
      <div className="flex flex-col items-center gap-2">
        <img src={logo} alt="" className="w-[50px]" />
        <h2 className="tracking-widest text-base playfair-display-sc-bold text-[#0f766e]">
          ANS REALSTATECRM
        </h2>
      </div>

      <div className="text-center">
        <h2 className="font-semibold text-[#0b3b38] text-xl">
          Cheque Pickup Receipt
        </h2>
      </div>
      
      <div className="space-y-3 p-5">
        <div className="flex gap-1">
          <label className="font-bold">Receipt No:</label>
          <p>{receiptData.receiptId || "N/A"}</p>
        </div>
        
        <div className="flex gap-1">
          <label className="font-bold">Date:</label>
          <p>
            {receiptData.date
              ? moment
                  .utc(receiptData.date)
                  .tz("America/Toronto")
                  .format("DD MMMM YYYY, hh:mm A")
              : "N/A"}
          </p>
        </div>

        <div className="flex gap-1">
          <label className="font-bold">Property Address:</label>
          <p>{receiptData.propertyAddress || "N/A"}</p>
        </div>

        <div className="flex gap-1">
          <label className="font-bold">Pickup By:</label>
          <p>
            {receiptData.pickupPerson ? (
              <>
                {receiptData.pickupPerson}
                {receiptData.pickupBy && (
                  <span>
                    {" "}({formatStringCamelCasecapitalize(receiptData.pickupBy)})
                  </span>
                )}
              </>
            ) : (
              "N/A"
            )}
          </p>
        </div>

        <div className="flex gap-1">
          <label className="font-bold">Reason For Payment:</label>
          <p>
            {reasonLabel(receiptData.reasonForPayment)}
          </p>
        </div>

        <div className="flex gap-1">
          <label className="font-bold">Payment Method:</label>
          <div>
            <p>
              <input
                type="checkbox"
                checked={receiptData.paymentMethod === "cheque"}
                readOnly
                hidden
              />{" "}
              Cheque
            </p>
          </div>
        </div>

        <div className="flex items-start gap-1">
          <div className="flex w-1/2 gap-1">
            <label className="font-bold">Handle By:</label>
            <p>{receiptData.handleBy || "N/A"}</p>
          </div>

          <div className="flex w-1/2 gap-1">
            <label className="font-bold w-[100px]">Receivers ID:</label>
            {receiptData?.receiversId ? (
              <img
                className="max-w-[70px]"
                src={receiptData.receiversId}
                alt=""
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <p className="text-sm">No image available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptDisplay;

