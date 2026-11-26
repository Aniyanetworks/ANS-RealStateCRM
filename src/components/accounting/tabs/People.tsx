// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useEffect, useState } from "react";

const PeopleTab = ({ data }) => {
  const [peopleData, setPeopleData] = useState<any>({
    agents: [],
    sharedUsers: [],
    lawyers: [],
    sellerInfo: [],
    buyerInfo: [],
  });
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    if (data?.data?.tradeSheetData) {
      const tradeSheetData = data.data.tradeSheetData;

      // Extract agents
      const agents = tradeSheetData.agentDetails || [];

      // Extract shared users
      const sharedUsers = tradeSheetData.sharedUsers || [];

      // Extract lawyers
      const lawyers = tradeSheetData.lawyerDetails || [];

      // Extract seller and buyer information
      const sellerInfo = tradeSheetData.sellerInformations || [];
      const buyerInfo = tradeSheetData.buyerInformations || [];

      setPeopleData({
        agents,
        sharedUsers,
        lawyers,
        sellerInfo,
        buyerInfo,
      });
    }
  }, [data]);

  // Combine all users into a single list
  const allUsers = [
    ...peopleData.agents.map((agent) => ({
      type: "Agent",
      name: `${agent.sellerFirstName} ${agent.sellerLastName}`,
      email: agent.sellerEmail,
      details: agent,
    })),
    ...peopleData.sharedUsers.map((user) => ({
      type: "Shared User",
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      details: user,
    })),
    ...peopleData.lawyers.map((lawyer) => ({
      type: "Lawyer",
      name: `${lawyer.sellerLawyer?.firstName} ${lawyer.sellerLawyer?.lastName}`,
      email: lawyer.sellerLawyer?.email,
      details: lawyer,
    })),
    ...peopleData.sellerInfo.map((seller) => ({
      type: "Seller",
      name: `${seller.firstName} ${seller.lastName}`,
      email: "",
      details: seller,
    })),
    ...peopleData.buyerInfo.map((buyer) => ({
      type: "Buyer",
      name: `${buyer.firstName} ${buyer.lastName}`,
      email: "",
      details: buyer,
    })),
  ];

  return (
    <div className="relative h-full w-full p-3 z-[999] bg-white shadow-lg py-5 pl-5 transform translate-x-0 transition-transform duration-300">
      <div className="overflow-auto h-[70vh]">
        <div className="rounded-md p-4">
          

          {/* User Details Tab */}
          {selectedUser && (
            <div>
              <h3 className="font-semibold text-xl text-gray-900 mb-4">
                {selectedUser.name} Details
              </h3>
              <div className="p-4 border rounded-lg shadow-sm">
                {/* Display user details based on type */}
                {selectedUser.type === "Agent" && (
                  <>
                    <h4 className="font-semibold text-lg text-gray-800 mb-2">Agent Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">Name:</span>
                        <span>{`${selectedUser.details.sellerFirstName} ${selectedUser.details.sellerLastName}`}</span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">Email:</span>
                        <span>{selectedUser.details.sellerEmail}</span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">Commission:</span>
                        <span>{`${selectedUser.details.sellerCommission}%`}</span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">Brokerage:</span>
                        <span>{selectedUser.details.sellerBrokerage?.brokerageName}</span>
                      </div>
                    </div>
                  </>
                )}

                {selectedUser.type === "Shared User" && (
                  <>
                    <h4 className="font-semibold text-lg text-gray-800 mb-2">Shared User Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">Name:</span>
                        <span>{`${selectedUser.details.firstName} ${selectedUser.details.lastName}`}</span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">Email:</span>
                        <span>{selectedUser.details.email}</span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">User Type:</span>
                        <span>{selectedUser.details.userType}</span>
                      </div>
                    </div>
                  </>
                )}

                {selectedUser.type === "Lawyer" && (
                  <>
                    <h4 className="font-semibold text-lg text-gray-800 mb-2">Lawyer Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">Name:</span>
                        <span>{`${selectedUser.details.sellerLawyer?.firstName} ${selectedUser.details.sellerLawyer?.lastName}`}</span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">Firm:</span>
                        <span>{selectedUser.details.sellerLawyer?.lawyerFirmName}</span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">Email:</span>
                        <span>{selectedUser.details.sellerLawyer?.email}</span>
                      </div>
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">Phone:</span>
                        <span>{selectedUser.details.sellerLawyer?.phoneNumber}</span>
                      </div>
                    </div>
                  </>
                )}

                {selectedUser.type === "Seller" && (
                  <>
                    <h4 className="font-semibold text-lg text-gray-800 mb-2">Seller Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">Name:</span>
                        <span>{`${selectedUser.details.firstName} ${selectedUser.details.lastName}`}</span>
                      </div>
                    </div>
                  </>
                )}

                {selectedUser.type === "Buyer" && (
                  <>
                    <h4 className="font-semibold text-lg text-gray-800 mb-2">Buyer Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col text-sm gap-1">
                        <span className="font-medium text-gray-700">Name:</span>
                        <span>{`${selectedUser.details.firstName} ${selectedUser.details.lastName}`}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}


          {/* User Table */}
          <div className="mb-8">
            <h3 className="font-semibold text-xl text-gray-900 mb-4">People</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allUsers.map((user, index) => (
                  <tr
                    key={index}
                    onClick={() => setSelectedUser(user)}
                    className={`cursor-pointer hover:bg-gray-50 ${
                      selectedUser?.name === user.name ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeopleTab;