// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useEffect, useState } from "react";

const BrokarageTab = ({ data }) => {
  const [brokerageDetails, setBrokerageDetails] = useState<any>([]);

  useEffect(() => {
    if (data?.data?.tradeSheetData?.agentDetails) {
      const brokerages = data.data.tradeSheetData.agentDetails.map(agent => ({
        sellerBrokerage: agent.sellerBrokerage,
        buyerBrokerage: agent.buyerBrokerage
      }));
      setBrokerageDetails(brokerages);
    }
  }, [data]);

  return (
    <div className="relative h-full w-full p-3 z-[999] bg-white shadow-lg py-5 pl-5 transform translate-x-0 transition-transform duration-300">
      <div className="overflow-auto h-[70vh]">
        <div className="rounded-md p-4">
          {brokerageDetails.length > 0 ? (
            brokerageDetails.map((brokerage, index) => (
              <div key={index} className="mb-6 pb-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-xl text-gray-900 mb-2">Seller Brokerage</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">Brokerage Name:</span>
                      <span>{brokerage.sellerBrokerage?.brokerageName}</span>
                    </div>
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">Phone Number:</span>
                      <span>{brokerage.sellerBrokerage?.phoneNumber}</span>
                    </div>
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">Address:</span>
                      <span>{brokerage.sellerBrokerage?.address}</span>
                    </div>
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">City:</span>
                      <span>{brokerage.sellerBrokerage?.city?.name}</span>
                    </div>
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">State:</span>
                      <span>{brokerage.sellerBrokerage?.state?.name}</span>
                    </div>
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">Country:</span>
                      <span>{brokerage.sellerBrokerage?.country?.countryName}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-xl text-gray-900 mb-2">Buyer Brokerage</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">Brokerage Name:</span>
                      <span>{brokerage.buyerBrokerage?.brokerageName}</span>
                    </div>
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">Phone Number:</span>
                      <span>{brokerage.buyerBrokerage?.phoneNumber}</span>
                    </div>
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">Address:</span>
                      <span>{brokerage.buyerBrokerage?.address}</span>
                    </div>
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">City:</span>
                      <span>{brokerage.buyerBrokerage?.city?.name}</span>
                    </div>
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">State:</span>
                      <span>{brokerage.buyerBrokerage?.state?.name}</span>
                    </div>
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">Country:</span>
                      <span>{brokerage.buyerBrokerage?.country?.countryName}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-700">No brokerage details available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrokarageTab;