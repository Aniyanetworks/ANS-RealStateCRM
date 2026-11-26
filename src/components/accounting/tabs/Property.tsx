// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useEffect, useState } from "react";
import { formatDateYYYYMMDD } from "../../../utils/formatDateUtils";
import capitalizeFirstLetter from "../../../utils/capitalizeFirstLetter";
import { formatNumberWithCommasAndDecimals } from "../../../utils/formatNumberWithCommasAndDecimals";

const CommissionTab = ({ data }) => {
  const [properties, setProperties] = useState<any>([]);

  useEffect(() => {
    console.log("Received data:", data);
    if (data?.data?.tradeSheetData?.properties) {
      setProperties(data.data.tradeSheetData.properties);
    }
  }, [data]);

  return (
    <div className="relative h-full w-full p-3 z-[999] bg-white shadow-lg py-5 pl-5 transform translate-x-0 transition-transform duration-300">
      <div className="overflow-auto h-[70vh]">
        <div className="rounded-md p-4 ">
          {properties.length > 0 ? (
            properties.map((property, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-4  pb-4">

                {/* PROPERTY ADDRESS & MLS */}
                <div className="flex flex-col text-sm gap-1">
                  <span className="font-semibold">Property Address:</span>
                  <span className="text-gray-700">{capitalizeFirstLetter(property.propertyAddress)}</span>
                </div>

                <div className="flex flex-col text-sm gap-1">
                  <span className="font-semibold">MLS Number:</span>
                  <span className="text-gray-700">{property.mlsNumber}</span>
                </div>

                {/* LISTING, SALES & SOLD PRICE */}
                <div className="flex flex-col text-sm gap-1">
                  <span className="font-semibold">Listing Price:</span>
                  <span className="text-gray-700">${formatNumberWithCommasAndDecimals(property.listingPrice)}</span>
                </div>

                <div className="flex flex-col text-sm gap-1">
                  <span className="font-semibold">Sales Price:</span>
                  <span className="text-gray-700">${formatNumberWithCommasAndDecimals(property.salesPrice)}</span>
                </div>

                <div className="flex flex-col text-sm gap-1">
                  <span className="font-semibold">Sold Price:</span>
                  <span className="text-gray-700">${formatNumberWithCommasAndDecimals(property.soldPrice)}</span>
                </div>

                {/* DATES */}
                <div className="flex flex-col text-sm gap-1">
                  <span className="font-semibold">Offer Date:</span>
                  <span className="text-gray-700">{property.offerDate ? formatDateYYYYMMDD(property.offerDate) : "N/A"}</span>
                </div>

                <div className="flex flex-col text-sm gap-1">
                  <span className="font-semibold">Acceptance Date:</span>
                  <span className="text-gray-700">{property.acceptanceDate ? formatDateYYYYMMDD(property.acceptanceDate) : "N/A"}</span>
                </div>

                <div className="flex flex-col text-sm gap-1">
                  <span className="font-semibold">Closing Date:</span>
                  <span className="text-gray-700">{property.closingDate ? formatDateYYYYMMDD(property.closingDate) : "N/A"}</span>
                </div>

                {/* CONDITIONAL STATUS */}
                <div className="flex flex-col text-sm gap-1">
                  <span className="font-semibold">Conditional:</span>
                  <span className="text-gray-700">{capitalizeFirstLetter(property.conditional)}</span>
                </div>

                {property.conditional === "yes" && (
                  <div className="flex flex-col text-sm gap-1">
                    <span className="font-semibold">Condition Option:</span>
                    <span className="text-gray-700">{capitalizeFirstLetter(property.conditionalOption)}</span>
                  </div>
                )}

                {/* DEPOSIT DETAILS */}
                <div className="flex flex-col text-sm gap-1">
                  <span className="font-semibold">Deposit Amount:</span>
                  <span className="text-gray-700">${formatNumberWithCommasAndDecimals(property.depositAmount)}</span>
                </div>

                <div className="flex flex-col text-sm gap-1">
                  <span className="font-semibold">Deposit Date:</span>
                  <span className="text-gray-700">{property.depositDate ? formatDateYYYYMMDD(property.depositDate) : "N/A"}</span>
                </div>

                {/* POSTAL CODE */}
                <div className="flex flex-col text-sm gap-1">
                  <span className="font-semibold">Postal Code:</span>
                  <span className="text-gray-700">{property.postalCode}</span>
                </div>

              </div>
            ))
          ) : (
            <p className="text-gray-700">No property details available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommissionTab;
