// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useEffect, useState } from "react";

const LawyerDetailsTab = ({ data }) => {
  const [lawyerDetails, setLawyerDetails] = useState<any>([]);

  useEffect(() => {
    if (data?.data?.tradeSheetData?.lawyerDetails) {
      setLawyerDetails(data.data.tradeSheetData.lawyerDetails);
    }
  }, [data]);

  return (
    <div className="relative h-full w-full p-3 z-[999] bg-white shadow-lg py-5 pl-5 transform translate-x-0 transition-transform duration-300">
      <div className="overflow-auto h-[70vh]">
        <div className="rounded-md p-4 ">
          {lawyerDetails.length > 0 ? (
            lawyerDetails.map((lawyerDetail, index) => (
              <div key={index} className="mb-6 pb-6">
                {/* Seller Lawyer Details */}
                {lawyerDetail.sellerLawyer ? (
                  <div className="mb-4">
                    <h3 className="font-semibold text-xl text-gray-900 mb-2">
                      Seller Lawyer
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">Name:</span>
                        <span>{lawyerDetail.sellerLawyer?.name || "N/A"}</span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">
                          Email:
                        </span>
                        <span>{lawyerDetail.sellerLawyer?.email || "N/A"}</span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">
                          Phone:
                        </span>
                        <span>
                          {lawyerDetail.sellerLawyer?.phoneNumber || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">Firm:</span>
                        <span>
                          {lawyerDetail.sellerLawyer?.lawyerFirmName || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">
                          Street Address:
                        </span>
                        <span>
                          {lawyerDetail.sellerLawyer?.streetAddress || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">
                          Address Line 2:
                        </span>
                        <span>
                          {lawyerDetail.sellerLawyer?.streetAddressLine2 ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">City:</span>
                        <span>
                          {lawyerDetail.sellerLawyer?.city?.name || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">
                          State:
                        </span>
                        <span>
                          {lawyerDetail.sellerLawyer?.state?.name || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">
                          Country:
                        </span>
                        <span>
                          {lawyerDetail.sellerLawyer?.country?.countryName ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">
                          Postal/Zip Code:
                        </span>
                        <span>
                          {lawyerDetail.sellerLawyer?.postalZipCode || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">
                          Fax Number:
                        </span>
                        <span>
                          {lawyerDetail.sellerLawyer?.faxNumber || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>No Seller Lawyer details available.</p>
                )}

                {/* Buyer Lawyer Details */}
                {lawyerDetail.buyerLawyer ? (
                  <div>
                    <h3 className="font-semibold text-xl text-gray-900 mb-2">
                      Buyer Lawyer
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">Name:</span>
                        <span>{lawyerDetail.buyerLawyer?.name || "N/A"}</span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">
                          Email:
                        </span>
                        <span>{lawyerDetail.buyerLawyer?.email || "N/A"}</span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">
                          Phone:
                        </span>
                        <span>
                          {lawyerDetail.buyerLawyer?.phoneNumber || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">Firm:</span>
                        <span>
                          {lawyerDetail.buyerLawyer?.lawyerFirmName || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">
                          Street Address:
                        </span>
                        <span>
                          {lawyerDetail.buyerLawyer?.streetAddress || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">
                          Address Line 2:
                        </span>
                        <span>
                          {lawyerDetail.buyerLawyer?.streetAddressLine2 ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">City:</span>
                        <span>
                          {lawyerDetail.buyerLawyer?.city?.name || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">
                          State:
                        </span>
                        <span>
                          {lawyerDetail.buyerLawyer?.state?.name || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">
                          Country:
                        </span>
                        <span>
                          {lawyerDetail.buyerLawyer?.country?.countryName ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">
                          Postal/Zip Code:
                        </span>
                        <span>
                          {lawyerDetail.buyerLawyer?.postalZipCode || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">
                          Fax Number:
                        </span>
                        <span>
                          {lawyerDetail.buyerLawyer?.faxNumber || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>No Buyer Lawyer details available.</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-700">No lawyer details available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LawyerDetailsTab;
