// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useEffect, useState } from "react";
import { formatDateYYYYMMDD } from "../../../utils/formatDateUtils";
import capitalizeFirstLetter from "../../../utils/capitalizeFirstLetter";
import { formatNumberWithCommasAndDecimals } from "../../../utils/formatNumberWithCommasAndDecimals";

const CommissionTab = ({ data }) => {
  const [tradesheetData, setTradeSheetData] = useState<any>([]);
  useEffect(() => {
    setTradeSheetData(data?.data?.tradeSheetData);
  }, [
    data
  ]);

  return (
        <div className=" relative h-full w-[100%] p-3 z-[999]  bg-white shadow-lg py-5 pl-5 relative transform translate-x-0 transition-transform duration-300">
          <div className="overflow-auto h-[70vh]">

              {/* Tradesheet Section */}
              <div className="rounded-md p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Tradesheet Info */}
                  <div className="flex flex-col text-sm gap-1">
                    <span className="font-semibold">Tradesheet:</span>
                    <span className="text-gray-700">
                      {tradesheetData?.tradeSheetTypeId}
                    </span>
                  </div>

                  <div className="flex flex-col text-sm gap-1">
                    <span className="font-semibold">Representation Type:</span>
                    <span className="text-gray-700">
                      {capitalizeFirstLetter(tradesheetData?.representationType)}
                    </span>
                  </div>

                  <div className="flex flex-col text-sm gap-1">
                    <span className="font-semibold">Representation:</span>
                    <span className="text-gray-700">
                      {capitalizeFirstLetter(tradesheetData?.representation)}
                    </span>
                  </div>

                  <div className="flex flex-col text-sm gap-1">
                    <span className="font-semibold">Property Address:</span>
                    <span className="text-gray-700">
                      {capitalizeFirstLetter(tradesheetData?.properties?.[0]?.propertyAddress)}
                    </span>
                  </div>

                  {/* Prices based on representation */}
                  {tradesheetData?.representation === "buyer" ? (
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-semibold">Sold Price:</span>
                      <span className="text-gray-700">
                        ${formatNumberWithCommasAndDecimals(tradesheetData?.properties?.[0]?.soldPrice)}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-semibold">Listing Price:</span>
                        <span className="text-gray-700">
                          ${formatNumberWithCommasAndDecimals(tradesheetData?.properties?.[0]?.listingPrice)}
                        </span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-semibold">Sales Price:</span>
                        <span className="text-gray-700">
                          ${formatNumberWithCommasAndDecimals(tradesheetData?.properties?.[0]?.salesPrice)}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex flex-col text-sm gap-1">
                    <span className="font-semibold">Trade Status:</span>
                    <span className="text-gray-700">
                      {capitalizeFirstLetter(tradesheetData?.tradeStatus)}
                    </span>
                  </div>
                  <div className="flex flex-col text-sm gap-1">
                    <span className="font-semibold">Closing Date:</span>
                    <span className="text-gray-700">
                      {tradesheetData?.properties?.[0]?.closingDate
                        ? formatDateYYYYMMDD(tradesheetData?.properties?.[0]?.closingDate)
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
          </div>
        </div>
  );
};

export default CommissionTab;
