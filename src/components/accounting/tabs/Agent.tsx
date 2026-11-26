// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useEffect, useState } from "react";
import { formatNumberWithCommasAndDecimals } from "../../../utils/formatNumberWithCommasAndDecimals";

const AgentTab = ({ data }) => {
  const [agentDetails, setAgentDetails] = useState<any>([]);

  useEffect(() => {
    if (data?.data?.tradeSheetData?.agentDetails) {
      setAgentDetails(data.data.tradeSheetData.agentDetails);
    }
  }, [data]);

  return (
    <div className="relative h-full w-full p-3 z-[999] bg-white shadow-lg py-5 pl-5 transform translate-x-0 transition-transform duration-300">
      <div className="overflow-auto h-[70vh]">
        <div className="rounded-md p-4">
          {agentDetails.length > 0 ? (
            agentDetails.map((agent, index) => (
              <div key={index} className="mb-6 pb-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-xl text-gray-900 mb-2">Seller Agent</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">Name:</span>
                      <span>{`${agent.sellerFirstName} ${agent.sellerLastName}`}</span>
                    </div>
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">Email:</span>
                      <span>{agent.sellerEmail}</span>
                    </div>
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">Commission:</span>
                      <span>{`${formatNumberWithCommasAndDecimals(agent.sellerCommission)}%`}</span>
                    </div>
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">Brokerage:</span>
                      <span>{agent.sellerBrokerage?.brokerageName}</span>
                    </div>
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">Brokerage Phone:</span>
                      <span>{agent.sellerBrokerage?.phoneNumber}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-xl text-gray-900 mb-2">Buyer Agent</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">Name:</span>
                      <span>{`${agent.buyerFirstName} ${agent.buyerLastName}`}</span>
                    </div>
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">Email:</span>
                      <span>{agent.buyerEmail}</span>
                    </div>
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">Commission:</span>
                      <span>{`${formatNumberWithCommasAndDecimals(agent.buyerCommission)}%`}</span>
                    </div>
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">Brokerage:</span>
                      <span>{agent.buyerBrokerage?.brokerageName}</span>
                    </div>
                    <div className="flex flex-col text-sm gap-1">
                      <span className="font-medium text-gray-700">Brokerage Phone:</span>
                      <span>{agent.buyerBrokerage?.phoneNumber}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-700">No agent details available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentTab;
