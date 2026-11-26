// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom"; 
import { formatDateYYYYMMDD } from "../../../utils/formatDateUtils";
import { useCreateTradeTransactionMutation } from "../../../redux/api/accounting/tradeAccountingSlice";
import toast from "react-hot-toast";
import capitalizeFirstLetter from "../../../utils/capitalizeFirstLetter";

const CommissionSeller = ({ data }) => {
  const [tradesheetData, setTradeSheetData] = useState<any>([]);
  const [plan, setPlan] = useState<any>([]);
  const [showFirstModal, setShowFirstModal] = useState(false); 
  const [showSecondModal, setShowSecondModal] = useState(false); 
  const [showThirdModal, setShowThirdModal] = useState(false); 
  const navigate = useNavigate(); 
  const [createTradeTransaction] = useCreateTradeTransactionMutation();

  const [propertyCommission, setPropertyCommission] = useState(2.5); 
  const [commissionAgent, setCommissionAgent] = useState(0.0); 
  const [commissionBuyerAgent, setCommissionBuyerAgent] = useState(0.0); 
  const [commissionOwner, setCommissionOwner] = useState(0.0); 
  const [buySaleAdminFees, setBuySaleAdminFees] = useState(0.0); 
  const [isAgentHst, setIsAgentHst] = useState(false); 

  const {
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    console.log('propertyCommission',propertyCommission);
    setTradeSheetData(data?.data?.tradeSheetData);

    if (data?.data?.tradeSheetData?.representation == "seller") {
      setPlan(
        data?.data?.tradeSheetData?.agentDetails?.[0]?.sellerAgentAccount?.plan
      );

      setPropertyCommission(
        Number(data?.data?.tradeSheetData?.agentDetails?.[0]?.sellerCommission ?? 2.5) +
        Number(data?.data?.tradeSheetData?.agentDetails?.[0]?.buyerCommission ?? 2.5)
      );

      setCommissionAgent(
        data?.data?.tradeSheetData?.agentDetails?.[0]?.sellerCommission ?? 2.5
      );

      setCommissionBuyerAgent( data?.data?.tradeSheetData?.agentDetails?.[0]?.buyerCommission ?? 2.5 );
      // setCommissionAgent(
      //   tradesheetData?.agentDetails?.[0]?.sellerAgentAccount?.plan
      //     ?.planItems?.[1]?.commissionAgent || 0.0
      // );

      if(tradesheetData?.agentDetails?.[0]?.sellerAgentAccount?.hstNo)
      {
        setIsAgentHst(true);
      }

      setCommissionOwner(
        tradesheetData?.agentDetails?.[0]?.sellerAgentAccount?.plan
          ?.planItems?.[1]?.commissionOwner || 0.0
      );
      setBuySaleAdminFees(
        tradesheetData?.agentDetails?.[0]?.sellerAgentAccount?.plan
          ?.planItems?.[1]?.planSubItems?.[0]?.value || 0.0
      );
    }
    if (data?.data?.tradeSheetData?.representation == "buyer") {
      setPlan(
        data?.data?.tradeSheetData?.agentDetails?.[0]?.buyerAgentAccount?.plan
      );
      setPropertyCommission(
        data?.data?.tradeSheetData?.agentDetails?.[0]?.buyerCommission || 2.5
      );

      setCommissionAgent(
        tradesheetData?.agentDetails?.[0]?.buyerAgentAccount?.plan
          ?.planItems?.[1]?.commissionAgent || 0.0
      );
      setCommissionOwner(
        tradesheetData?.agentDetails?.[0]?.buyerAgentAccount?.plan
          ?.planItems?.[1]?.commissionOwner || 0.0
      );
      setBuySaleAdminFees(
        tradesheetData?.agentDetails?.[0]?.buyerAgentAccount?.plan
          ?.planItems?.[1]?.planSubItems?.[0]?.value || 0.0
      );
    }
  }, [
    data,
    propertyCommission,
    commissionAgent,
    commissionOwner,
    buySaleAdminFees,
  ]);

  const onSubmit = async (data: any) => {
    setShowFirstModal(true);
    return;
  };

  const handleFirstModalClose = () => setShowFirstModal(false);
  const handleSecondModalClose = () => setShowSecondModal(false);
  const handleThirdModalClose = () => setShowThirdModal(false);

  const handleFirstModalConfirm = () => {
    handleFirstModalClose();
    setShowSecondModal(true);
  };

  const handleSecondModalConfirm = () => {
    handleSecondModalClose();
    setShowThirdModal(true);
  };

  const handleThirdModalConfirm = async () => {
    handleThirdModalClose(false);
    try {
      // Assuming you have all the necessary data to create a TradeTransaction
      const tradeTransactionData = {
        tradeSheetId: tradesheetData?.id,

        closingDate: tradesheetData?.properties?.[0]?.closingDate,
        listingPrice: tradesheetData?.properties?.[0]?.listingPrice,
        salesPrice: tradesheetData?.properties?.[0]?.salesPrice,
        soldPrice: tradesheetData?.properties?.[0]?.soldPrice,

        commissionProperty: propertyCommission || 2.5,
        commissionAgent: commissionAgent,
        commissionOwner: commissionOwner,
        buySaleAdminFees: buySaleAdminFees,
        tax: 13.0,

        baseOfficeCommissionSelling: calculateBaseOfficeCommissionTotal || 0.0,
        baseOfficeCommissionTax: calculateBaseOfficeCommissionTax || 0.0,
        baseOfficeCommissionTotal: calculateBaseOfficeCommissionTotal || 0.0,

        agentCommissionSelling: calculateAgentCommissionTotal,
        agentCommissionTax: calculateAgentCommissionTax || 0.0,
        agentCommissionTotal: calculateAgentCommissionTotal || 0.0,

        netCommissionSelling: calculateNetOfficeCommissionTotal,
        netCommissionTax: calculateNetOfficeCommissionTax || 0.0,
        netCommissionTotal: calculateNetOfficeCommissionTotal || 0.0,
      };

      // Call the mutation to create the trade transaction
      const response = await createTradeTransaction(
        tradeTransactionData
      ).unwrap();

      toast.success("Trade transaction created successfully.");
      // Navigate to the accounting cheque posting page or handle further actions
      navigate(
        "/dashboard/accounting/account-cheque-posting/" +
          response?.data?.newTradeTransaction?.uuid
      );
    } catch (error) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  // Calculate Base Office Commission based on representation
  const calculateBaseOfficeCommission =
    tradesheetData?.representation === "buyer"
      ? (
          (tradesheetData?.properties?.[0]?.soldPrice * propertyCommission) /
          100
        ).toFixed(2)
      : (
          (tradesheetData?.properties?.[0]?.salesPrice * propertyCommission) /
          100
        ).toFixed(2);

  // Calculate Base Office Commission Tax
  const calculateBaseOfficeCommissionTax = (
    (calculateBaseOfficeCommission * 13) /
    100
  ).toFixed(2);

  // Calculate Total Base Office Commission
  const calculateBaseOfficeCommissionTotal = (
    Number(calculateBaseOfficeCommission) +
    Number(calculateBaseOfficeCommissionTax)
  ).toFixed(2);

  const calculateAgentCommission = (
    (calculateBaseOfficeCommission * commissionAgent) /
    100
  ).toFixed(2);

  const calculateAgentCommissionTax = (
    (calculateAgentCommission * (isAgentHst ? 13 : 0.0)) /
    100
  ).toFixed(2);

  const calculateAgentCommissionTotal = (
    Number(calculateAgentCommission) + Number(calculateAgentCommissionTax)
  ).toFixed(2);

  const calculateUnclaimedAgentCommissionTotal = (
    (calculateAgentCommission * (isAgentHst ?  0.0 : 13)) / 100
  ).toFixed(2);


  // Buyer Agent Commission
  const calculateAgentBuyerCommission = (
    (calculateBaseOfficeCommission * commissionBuyerAgent) / 100
  ).toFixed(2);

  // Buyer Agent Commission Tax (assuming 0% like the other one, change if needed)
  const calculateAgentBuyerCommissionTax = (
    (calculateAgentBuyerCommission * 0.0) / 100
  ).toFixed(2);

  // Buyer Agent Commission Total
  const calculateAgentBuyerCommissionTotal = (
    Number(calculateAgentBuyerCommission) + Number(calculateAgentBuyerCommissionTax)
  ).toFixed(2);



  const calculateNetOfficeCommission = (
    calculateBaseOfficeCommission - calculateAgentCommission -calculateAgentBuyerCommission
  ).toFixed(2);

  const calculateNetOfficeCommissionTax = (
    (calculateNetOfficeCommission * 13) /
    100
  ).toFixed(2);
  const calculateNetOfficeCommissionTotal = (
    Number(calculateNetOfficeCommission) +
    Number(calculateNetOfficeCommissionTax)
  ).toFixed(2);

  
  return (
        <div className=" relative h-full w-[100%] p-3 z-[999]  bg-white shadow-lg py-5 pl-5 relative transform translate-x-0 transition-transform duration-300">
          <div className="overflow-auto h-[70vh]">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* Tradesheet Section */}
              <div className=" rounded-md">
                
                <div className="rounded-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Seller Info Section */}
                    <div className="border rounded-lg shadow-lg bg-gray-50 hover:bg-gray-100 transition-colors p-4 rounded-md">
                      <h3 className=" text-lg mb-3">Seller Information</h3>
                      <div className="flex items-center text-xs gap-2">
                        <span>Seller Agent Name:</span>
                        <span className=" text-black">
                          {tradesheetData?.agentDetails?.[0]?.sellerFirstName +
                            " " +
                            tradesheetData?.agentDetails?.[0]?.sellerLastName ||
                            "N/A"}
                        </span>
                        (
                        {tradesheetData?.agentDetails?.[0]?.sellerEmail ||
                          "N/A"}
                        )
                      </div>

                      <div className="flex items-center text-xs gap-2">
                        <span>Is Internal Seller Agent:</span>
                        <span className=" text-black">
                          {tradesheetData?.agentDetails?.[0]?.intSellerAgentId
                            ? "Yes"
                            : "No"}
                        </span>
                      </div>

                      <div className="flex items-center text-xs gap-2">
                        <span>Seller Agent Brokerage name:</span>
                        <span className=" text-black">
                          {tradesheetData?.agentDetails?.[0]?.sellerBrokerage
                            ?.brokerageName || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center text-xs gap-2">
                        <span>Seller Commission (%):</span>
                        <span className=" text-black">
                          {tradesheetData?.agentDetails?.[0]
                            ?.sellerCommission || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Buyer Info Section */}
                    <div className="border rounded-lg shadow-lg bg-gray-50 hover:bg-gray-100 transition-colors p-4 rounded-md">
                      <h3 className=" text-lg mb-3">Buyer Information</h3>
                      <div className="flex items-center text-xs gap-2">
                        <span>Buyer Agent Name:</span>
                        <span className=" text-black">
                          {tradesheetData?.agentDetails?.[0]?.buyerFirstName +
                            " " +
                            tradesheetData?.agentDetails?.[0]?.buyerLastName ||
                            "N/A"}
                        </span>
                        (
                        {tradesheetData?.agentDetails?.[0]?.buyerEmail || "N/A"}
                        )
                      </div>

                      <div className="flex items-center text-xs gap-2">
                        <span>Is Internal Buyer Agent:</span>
                        <span className=" text-black">
                          {tradesheetData?.agentDetails?.[0]?.intBuyerAgentId
                            ? "Yes"
                            : "No"}
                        </span>
                      </div>

                      <div className="flex items-center text-xs gap-2">
                        <span>Buyer Agent Brokerage name:</span>
                        <span className=" text-black">
                          {tradesheetData?.agentDetails?.[0]?.buyerBrokerage
                            ?.brokerageName || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center text-xs gap-2">
                        <span>Buyer Commission (%):</span>
                        <span className=" text-black">
                          {tradesheetData?.agentDetails?.[0]?.buyerCommission ||
                            "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Agent Plans */}
                  <div className="mt-6">
                    {plan ? (
                      <div>
                        <p className="font-bold py-3 mb-5">Agent Plans</p>
                        <ul className="space-y-4">
                          <li
                            key={plan.id} // Assuming each plan has a unique ID
                            className={`border rounded-lg shadow-lg bg-gray-50 hover:bg-gray-100 transition-colors p-4 ${
                              plan.id ? "bg-gray-200" : ""
                            }`}
                          >
                            <label htmlFor={plan.id} className="flex-grow">
                              <h3 className="text-sm ">
                                {plan?.name} ({plan.type})
                              </h3>

                              <ul className="list-disc pl-5">
                                {plan?.planItems?.map((item, itemIndex) => {
                                  const isCommission =
                                    item.itemType === "Commission";
                                  const commissionDetails = isCommission
                                    ? `- (${item.commissionOwner} / ${item.commissionAgent})`
                                    : "";
                                  const valueText = isCommission
                                    ? commissionDetails
                                    : item.value > 0
                                    ? `- $${item.value}`
                                    : "";

                                  return (
                                    <li
                                      key={itemIndex}
                                      className="mb-2 text-sm"
                                    >
                                      <div>
                                        <span className="">{item.name}</span>{" "}
                                        {valueText}
                                      </div>
                                      {item.planSubItems &&
                                        item.planSubItems.length > 0 && (
                                          <ul className="list-inside pl-5 mt-2">
                                            {item.planSubItems.map(
                                              (subItem, subItemIndex) => (
                                                <li
                                                  key={subItemIndex}
                                                  className="text-xs"
                                                >
                                                  <span className="">
                                                    {subItem.name}
                                                  </span>{" "}
                                                  {subItem.value > 0 &&
                                                    `- $${subItem.value}`}
                                                </li>
                                              )
                                            )}
                                          </ul>
                                        )}
                                    </li>
                                  );
                                })}
                              </ul>
                            </label>
                          </li>
                        </ul>
                      </div>
                    ) : (
                      <p className="text-red-600 font-bold">
                        No available plans.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <h2 className="text-sm font-bold  text-gray-800">
                Commission Calculation Breakdown Seller:
              </h2>
              <div className="flex justify-between items-center border-b pb-4 text-xs">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="text-left">
                      <th className="px-4 py-2 border border-gray-300">
                        Expenses
                      </th>
                      <th className="px-4 py-2 border border-gray-300">
                        Listing
                      </th>
                      <th className="px-4 py-2 border border-gray-300">
                        L. Other
                      </th>
                      <th className="px-4 py-2 border border-gray-300">
                        Selling
                      </th>
                      <th className="px-4 py-2 border border-gray-300">
                        S. Other
                      </th>
                      <th className="px-4 py-2 border border-gray-300">Tax</th>
                      <th className="px-4 py-2 border border-gray-300">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 border border-gray-300">
                        Base Office Commission
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ 0.00
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ 0.00
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ {calculateBaseOfficeCommission}
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ 0.00
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ {calculateBaseOfficeCommissionTax} (13% Tax)
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ {calculateBaseOfficeCommissionTotal}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border border-gray-300">
                        Commission to cooperating Agent / Byer Agent
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ 0.00
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ 0.00
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ {calculateAgentCommission}
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ 0.00
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ {calculateAgentCommissionTax} (0% Tax)
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ {calculateAgentCommissionTotal}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border border-gray-300">
                        Commission to Seller Agent
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ 0.00
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ 0.00
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ {calculateAgentCommission}
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ 0.00
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ {calculateAgentCommissionTax} (0% Tax)
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ {calculateAgentCommissionTotal}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border border-gray-300">
                        Unclaimed Tax
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ 0.00
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ 0.00
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ 0.00
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ 0.00
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ {calculateUnclaimedAgentCommissionTotal} ({isAgentHst ? '0%' : '13%'} Tax)
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ {calculateUnclaimedAgentCommissionTotal}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border border-gray-300">
                        Net to Office
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ 0.00
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ 0.00
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ {calculateNetOfficeCommission}
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ 0.00
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ {calculateNetOfficeCommissionTax} (13% Tax)
                      </td>
                      <td className="px-4 py-2 border border-gray-300">
                        $ {calculateNetOfficeCommissionTotal}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              

              {/* Submit Button */}
              <div className="flex justify-end mt-4">
                {tradesheetData?.tradeTransaction?.[0]?.chequePosting?.length >
                0 ? (
                  <>
                    <p className="mt-2">
                      You already Cheque posted this tradesheet
                    </p>
                  </>
                ) : tradesheetData?.tradeTransaction?.length > 0 ? (
                  <>
                    <p className="mt-2">
                      You already finalized the trade, now you can go to Account
                      Cheque Position
                    </p>
                    <NavLink
                      to={`/dashboard/accounting/account-cheque-posting/${tradesheetData?.tradeTransaction?.[0]?.uuid}`}
                      className="ml-4 bg-[#0b3b38] text-white px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Cheque Posting
                    </NavLink>
                  </>
                ) : (
                  <button
                    type="submit"
                    className="bg-[#0b3b38] text-white px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Finalize
                  </button>
                )}

                <NavLink
                  to="/dashboard/accounting/trade-list"
                  className="ml-4 bg-[#0b3b38] text-white px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Go Back
                </NavLink>
              </div>
            </form>

            {/* Modal for received the funds yet */}
            {showFirstModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
                <div className="bg-white p-6 rounded-md shadow-lg max-w-sm mx-auto">
                  <h3 className="text-sm ">
                    Have you received the funds yet??
                  </h3>
                  <div className="mt-4 flex justify-center space-x-4">
                    <button
                      onClick={handleFirstModalConfirm}
                      className="bg-[#0b3b38] text-white px-4 py-2 rounded-md hover:bg-[#443451]"
                    >
                      Yes
                    </button>
                    <button
                      onClick={handleFirstModalClose}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal for received the funds yet */}
            {showSecondModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
                <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md mx-auto">
                  <div className="flex justify-between items-center border-b pb-4">
                    {/* Listing Price */}
                    <div className="flex flex-col items-center">
                      <p className="text-xs">Commissions</p>
                      <div className="text-xs">
                        ${calculateBaseOfficeCommissionTotal}
                      </div>
                    </div>

                    {/* Subtraction Sign */}
                    <div className="flex items-center justify-center text-xs">
                      -
                    </div>

                    {/* Funds Hold */}
                    <div className="flex flex-col items-center">
                      <p className="text-xs">Funds Hold</p>
                      <div className="text-xs text-gray-800">
                        ${tradesheetData?.fundsHold || 0}
                      </div>
                    </div>

                    {/* Equal Sign and A/R */}
                    <div className="flex items-center justify-center text-xs">
                      =
                    </div>

                    {/* A/R */}
                    <div className="flex flex-col items-center">
                      <p className="text-xs">A/R</p>
                      <div className="text-xs">
                        $
                        {calculateBaseOfficeCommissionTotal -
                          (tradesheetData?.fundsHold || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-center space-x-4">
                    <button
                      onClick={handleSecondModalConfirm}
                      className="bg-[#0b3b38] text-white px-4 py-2 rounded-md hover:bg-[#443451]"
                    >
                      Yes
                    </button>
                    <button
                      onClick={handleSecondModalClose}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal for Cash Receipt Confirmation */}
            {showThirdModal && (
              <div className="fixed inset-0 flex items-center justify-center bg-gray-600 bg-opacity-50">
                <div className="bg-white p-6 rounded-md shadow-lg max-w-sm mx-auto">
                  <h3 className="text-sm ">
                    Would you like to post a cash receipt?
                  </h3>
                  <div className="mt-4 flex justify-center space-x-4">
                    <button
                      onClick={handleThirdModalConfirm}
                      className="bg-[#0b3b38] text-white px-4 py-2 rounded-md hover:bg-[#443451]"
                    >
                      Yes
                    </button>
                    <button
                      onClick={handleThirdModalClose}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
  );
};

export default CommissionSeller;
