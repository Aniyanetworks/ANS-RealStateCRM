// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, {
  useEffect,
  useState,
} from 'react';

import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  NavLink,
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  useGetAccountingBankAccountsQuery,
} from '../../../redux/api/accounting/bankAccountManagementSlice';
import {
  useCreateChequePostingMutation,
  useGetSpecificTradeAgentCommissionQuery,
  useGetSpecificTradeTransactionQuery,
  useTransferCommissionAgentMutation,
} from '../../../redux/api/accounting/tradeAccountingSlice';
import { formatToTwoDecimalPlaces } from '../../../utils/format';
import { formatDateYYYYMMDD } from '../../../utils/formatDateUtils';
import capitalizeFirstLetter from '../../../utils/capitalizeFirstLetter';
import ButtonLoader from '../../../components/loader/buttonLoader';

const AgentChequeCalculation = () => {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid?: string }>(); // uuid is optional
  const { agentAccountId } = useParams<{ agentAccountId?: string }>(); // uuid is optional
  const { data:tradeAgentCommissionResponse, isLoading:isLoadingtradeAgentCommissionData } = useGetSpecificTradeAgentCommissionQuery({uuid,agentAccountId});
  const { data:bankAccountList, isLoading:bankAccountIsLoading, refetch:bankAccountRefetch} = useGetAccountingBankAccountsQuery(""); // Use the bank account data query
  const [bankAccounts, setBankAccounts] = useState<DataType[]>([]);
  const { register, handleSubmit, setValue, formState: { errors }, watch,getValues } = useForm();
  const [tradeAgentCommissionData, setTradeAgentCommissionData] = useState("");
  const [tradeAgentData, setTradeAgentData] = useState([]);
  const [transferCommissionAgent] = useTransferCommissionAgentMutation();
  const [totalAgentCommission, setTotalAgentCommission] = useState(0.00);
  const [selectedFees, setSelectedFees] = useState<{[key: string]: boolean}>({});
  const [finalAmount, setFinalAmount] = useState(0);
  const [tradesheetData, setTradeSheetData] = useState<any>([]);
  const [btnLoading, setBtnLoading] = useState<boolean>(false);

  // Define allowed items array at component level
  const allowedItems = [
    "Yearly Desk Fee",
    "Commission Split",
    "Buy/Sale Admin Fees",
    "Authentisign"
  ];

  useEffect(() => {
    setBankAccounts(bankAccountList?.data?.accounts); // Ensure correct data mapping
    setTradeAgentCommissionData(tradeAgentCommissionResponse?.data?.tradeAgentCommission)
    setTradeSheetData(tradeAgentCommissionResponse?.data?.tradeAgentCommission?.tradeSheet)
    setTradeAgentData(tradeAgentCommissionResponse?.data?.agentDetails)
    setValue(
      'chequeReceiptFrom',
      tradeAgentCommissionData?.tradeSheet?.agentDetails?.[0]?.buyerBrokerage?.brokerageName || ''
    );
    setValue('brokerageId',tradeAgentCommissionData?.tradeSheet?.agentDetails?.[0]?.buyerBrokerageId);
    setValue('intSellerAgentId',tradeAgentCommissionData?.tradeSheet?.agentDetails?.[0]?.intSellerAgentId);
    setValue('amount',finalAmount.toFixed(2) ||0.00);
    setValue('dateOfReceipt',formatDateYYYYMMDD(tradeAgentCommissionData?.closingDate));
    setValue('bankAccountId',3);
    setValue('tradeSheetId',tradeAgentCommissionData?.tradeSheetId);
    setValue('tradeTransactionId',tradeAgentCommissionData?.id);
    setValue('uuid',tradeAgentCommissionResponse?.data?.tradeAgentCommission?.uuid);

    setTotalAgentCommission((parseFloat(tradeAgentCommissionData?.agentCommissionTotal)).toFixed(2));
    
    console.log('tradeAgentCommissionData?.baseOfficeCommissionTotal',tradeAgentCommissionData)
  }, [bankAccountList,tradeAgentCommissionResponse,tradeAgentCommissionData, setTotalAgentCommission,tradeAgentData,finalAmount]);

  useEffect(() => {
    let total = parseFloat(totalAgentCommission);
    
    // Loop through all plan items and their subitems
    tradeAgentData?.plan?.planItems?.forEach(item => {
      // Check main item
      if (selectedFees[item.name]) {
        const discountItem = tradeAgentData?.discount?.discountItems?.find(
          d => d.discountItem === item.name
        );
        const discountPercentage = discountItem?.discountValue || 0;
        const discountedAmount = (item.value * (100 - discountPercentage)) / 100;
        total -= discountedAmount;
      }

      // Check subitems
      item.planSubItems?.forEach(subItem => {
        if (selectedFees[subItem.name]) {
          const subItemDiscountItem = tradeAgentData?.discount?.discountItems?.find(
            d => d.discountItem === subItem.name
          );
          const subItemDiscountPercentage = subItemDiscountItem?.discountValue || 0;
          const subItemDiscountedAmount = (subItem.value * (100 - subItemDiscountPercentage)) / 100;
          total -= subItemDiscountedAmount;
        }
      });
    });

    // Add cheque processing fee if applicable
    if (watch("chequeType") === "cheque") {
      total -= 25;
    }

    setFinalAmount(total);
  }, [selectedFees, totalAgentCommission, tradeAgentData, watch("chequeType")]);

  useEffect(() => {
    // Transform deductions array into selectedFees object format
    if (tradeAgentCommissionResponse?.data?.tradeAgentCommission?.invoiceDetails?.deductions) {
      const selectedFeesObj = tradeAgentCommissionResponse.data.tradeAgentCommission.invoiceDetails.deductions.reduce((acc, deduction) => {
        // Set true for each deducted item
        acc[deduction.itemName] = true;
        return acc;
      }, {});
      
      setSelectedFees(selectedFeesObj);
    }
  }, [tradeAgentCommissionResponse]);

  // const [bankAccounts] = useState([
  //   { label: "Bank A - 1234", value: "bank_a" },
  //   { label: "Bank B - 5678", value: "bank_b" },
  //   { label: "Bank C - 9012", value: "bank_c" },
  // ]);

  const [chequeReceiptsFrom] = useState([
    { label: "Customer A", value: "customer_a" },
    { label: "Customer B", value: "customer_b" },
    { label: "Customer C", value: "customer_c" },
  ]);

  const [chequeTypes] = useState([
    { label: "EFT", value: "eft" },
    { label: "Cheque", value: "cheque" },
  ]);

  const onSubmit = async (data: any) => {
    setBtnLoading(true);
    try {
      // Prepare deductions data in a clean format for invoice
      const deductionsData = tradeAgentData?.plan?.planItems
        ?.filter(item => 
          (selectedFees[item.name] && allowedItems.includes(item.name)) || 
          item.planSubItems?.some(subItem => selectedFees[subItem.name] && allowedItems.includes(subItem.name))
        )
        .flatMap(item => {
          const deductions = [];

          // Add main item if selected
          if (selectedFees[item.name] && allowedItems.includes(item.name)) {
            const discountItem = tradeAgentData?.discount?.discountItems?.find(
              d => d.discountItem === item.name
            );
            const discountPercentage = discountItem?.discountValue || 0;
            const originalAmount = item.value;
            const discountedAmount = (originalAmount * (100 - discountPercentage)) / 100;

            deductions.push({
              itemName: item.name,
              originalAmount: originalAmount,
              discountPercentage: discountPercentage,
              discountedAmount: discountedAmount,
              finalAmount: discountedAmount
            });
          }

          // Add subitems if selected
          item.planSubItems?.forEach(subItem => {
            if (selectedFees[subItem.name] && allowedItems.includes(subItem.name)) {
              const subItemDiscountItem = tradeAgentData?.discount?.discountItems?.find(
                d => d.discountItem === subItem.name
              );
              const subItemDiscountPercentage = subItemDiscountItem?.discountValue || 0;
              const subItemOriginalAmount = subItem.value;
              const subItemDiscountedAmount = (subItemOriginalAmount * (100 - subItemDiscountPercentage)) / 100;

              deductions.push({
                itemName: subItem.name,
                originalAmount: subItemOriginalAmount,
                discountPercentage: subItemDiscountPercentage,
                discountedAmount: subItemDiscountedAmount,
                finalAmount: subItemDiscountedAmount
              });
            }
          });

          return deductions;
        });

      // Prepare the final payload
      const payload = {
        ...data,
        invoiceDetails: {
          totalCommission: parseFloat(totalAgentCommission),
          deductions: deductionsData,
          chequeProcessingFee: data.chequeType === 'cheque' ? 25 : 0,
          finalAmount: finalAmount,
          paymentDetails: {
            chequeType: data.chequeType,
            dateOfReceipt: data.dateOfReceipt,
            bankAccountId: data.bankAccountId
          }
        }
      };
      console.log('payload',payload)

      const response = await transferCommissionAgent(payload).unwrap();
      setBtnLoading(false);
      if(getValues('acknowledgementEmail')=='yes')
      {
        toast.success("Acknowledgement email end successfully.");
      }
      else
      {
        toast.success("Agent Commission Transfer successfully.");
      }
     
      navigate('/dashboard/accounting/issue-agent-cheque');
    } catch (error) {
      // toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  return (
    <div className="max-w-full mt-8 p-8 border border-gray-300 rounded-md shadow-md">
      <div className=" rounded-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Tradesheet Info */}
          <div className="flex items-center text-xs gap-2">
            <span className="font-medium">Tradesheet:</span>
            <span className="font-semibold text-black">
              {tradesheetData?.tradeSheetTypeId}
            </span>
          </div>

          <div className="flex items-center text-xs gap-2">
            <span className="font-medium">Representation Type:</span>
            <span className="font-semibold text-black">
              {capitalizeFirstLetter(tradesheetData?.representationType)}
            </span>
          </div>

          <div className="flex items-center text-xs gap-2">
            <span className="font-medium">Representation:</span>
            <span className="font-semibold text-black">
              {capitalizeFirstLetter(tradesheetData?.representation)}
            </span>
          </div>

          <div className="flex items-center text-xs gap-2">
            <span className="font-medium">Property Address:</span>
            <span className="font-semibold text-black">
              {capitalizeFirstLetter(tradesheetData?.properties?.[0]?.propertyAddress)}
            </span>
          </div>

          {/* Prices based on representation */}
          {tradesheetData?.representation == "buyer" ? (
            <div className="flex items-center text-xs gap-2">
              <span className="font-medium">Sold Price:</span>
              <span className="font-semibold text-black">
                ${tradesheetData?.properties?.[0]?.soldPrice}
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center text-xs gap-2">
                <span className="font-medium">Listing Price:</span>
                <span className="font-semibold text-black">
                  ${tradesheetData?.properties?.[0]?.listingPrice}
                </span>
              </div>
              <div className="flex items-center text-xs gap-2">
                <span className="font-medium">Sales Price:</span>
                <span className="font-semibold text-black">
                  ${tradesheetData?.properties?.[0]?.salesPrice}
                </span>
              </div>
            </>
          )}

          <div className="flex items-center text-xs gap-2">
            <span className="font-medium">Closing Date:</span>
            <span className="font-semibold text-black">
              {tradesheetData?.properties?.[0]?.closingDate
                ? formatDateYYYYMMDD(tradesheetData?.properties?.[0]?.closingDate)
                : ""}
            </span>
          </div>


        </div>

        <div className="p-6 rounded-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Seller Info Section */}
            <div className="border rounded-lg shadow-lg bg-gray-50 hover:bg-gray-100 transition-colors p-4 rounded-md">
              <h3 className="font-semibold text-lg mb-3">Seller Information</h3>
              <div className="flex items-center text-xs gap-2">
                <span className="font-medium">Seller Agent Name:</span>
                <span className="font-semibold text-black">
                  {tradesheetData?.agentDetails?.[0]?.sellerFirstName +
                    " " +
                    tradesheetData?.agentDetails?.[0]?.sellerLastName || "N/A"}
                </span>
                ({tradesheetData?.agentDetails?.[0]?.sellerEmail || "N/A"})
              </div>

              <div className="flex items-center text-xs gap-2">
                <span className="font-medium">Is Internal Seller Agent:</span>
                <span className="font-semibold text-black">
                  {tradesheetData?.agentDetails?.[0]?.intSellerAgentId ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex items-center text-xs gap-2">
                <span className="font-medium">Seller Agent Brokerage name:</span>
                <span className="font-semibold text-black">
                  {tradesheetData?.agentDetails?.[0]?.sellerBrokerage?.brokerageName ||
                    "N/A"}
                </span>
              </div>

              <div className="flex items-center text-xs gap-2">
                <span className="font-medium">Seller Commission (%):</span>
                <span className="font-semibold text-black">
                  {tradesheetData?.agentDetails?.[0]?.sellerCommission || "N/A"}
                </span>
              </div>
            </div>

            {/* Buyer Info Section */}
            <div className="border rounded-lg shadow-lg bg-gray-50 hover:bg-gray-100 transition-colors p-4 rounded-md">
              <h3 className="font-semibold text-lg mb-3">Buyer Information</h3>
              <div className="flex items-center text-xs gap-2">
                <span className="font-medium">Buyer Agent Name:</span>
                <span className="font-semibold text-black">
                  {tradesheetData?.agentDetails?.[0]?.buyerFirstName +
                    " " +
                    tradesheetData?.agentDetails?.[0]?.buyerLastName || "N/A"}
                </span>
                ({tradesheetData?.agentDetails?.[0]?.buyerEmail || "N/A"})
              </div>

              <div className="flex items-center text-xs gap-2">
                <span className="font-medium">Is Internal Buyer Agent:</span>
                <span className="font-semibold text-black">
                  {tradesheetData?.agentDetails?.[0]?.intBuyerAgentId ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex items-center text-xs gap-2">
                <span className="font-medium">Buyer Agent Brokerage name:</span>
                <span className="font-semibold text-black">
                  {tradesheetData?.agentDetails?.[0]?.buyerBrokerage?.brokerageName ||
                    "N/A"}
                </span>
              </div>

              <div className="flex items-center text-xs gap-2">
                <span className="font-medium">Buyer Commission (%):</span>
                <span className="font-semibold text-black">
                  {tradesheetData?.agentDetails?.[0]?.buyerCommission || "N/A"}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-800">
        Agent Comission Transfer
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Cheque Type */}
        <div>
          <label htmlFor="chequeType" className="font-semibold text-gray-700">
            Cheque Type:
          </label>
          <select
            {...register("chequeType", {
              required: tradeAgentCommissionData?.acknowledgementStatus === "accepted" ? "Cheque Type is required" : false
            })}

            className="w-full mt-2 p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select</option>
            {chequeTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.chequeType && (
            <p className="text-red-500 text-sm">{errors.chequeType.message}</p>
          )}
        </div>

        {/* Amount */}
        <div className="space-y-4">
          <div className="border border-gray-300 rounded-md p-4">
            <h3 className="font-semibold text-lg mb-4">
              Agent Commission Breakdown
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Commission:</span>
                <span className="font-medium">${totalAgentCommission}</span>
              </div>

              {tradeAgentData?.plan?.planItems?.flatMap((item) => {
                // Define allowed items
                const allowedItems = [
                  "Yearly Desk Fee",
                  "Commission Split",
                  "Buy/Sale Admin Fees",
                  "Lease Admin Fees",
                  "Transection Cap Fee",
                  "Authentisign",
                  "DVREALTY Email",
                  "500 Business Cards",
                  "1 ANS Lock Box"
                ];

                const allItems = [];

                // Add main item only if it's in the allowed list
                if (allowedItems.includes(item.name)) {
                  const discountItem = tradeAgentData?.discount?.discountItems?.find(
                    (d) => d.discountItem === item.name
                  );
                  const discountPercentage = discountItem?.discountValue || 0;
                  const originalAmount = item.value;
                  const discountedAmount = (originalAmount * (100 - discountPercentage)) / 100;

                  allItems.push(
                    <div key={item.id} className="flex justify-between items-center py-2">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedFees[item.name] || false}
                          onChange={(e) => {
                            setSelectedFees(prev => ({
                              ...prev,
                              [item.name]: e.target.checked
                            }));
                          }}
                          className="form-checkbox h-4 w-4 text-blue-600"
                        />
                        <div>
                          <span className="text-gray-700 font-medium">{item.name}</span>
                          <span className="text-gray-600 ml-2">${originalAmount.toFixed(2)}</span>
                          {discountPercentage > 0 && (
                            <div className="text-sm text-gray-500 mt-0.5">
                              Discount: {discountPercentage}% 
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {discountPercentage > 0 ? (
                          <div>
                            <span className="text-gray-400 line-through mr-2">
                              -${originalAmount.toFixed(2)}
                            </span>
                            <span className="text-gray-700 font-medium">
                              -${discountedAmount.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-700 font-medium">
                            -${originalAmount.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                // Add Buy/Sale Admin Fees from subitems if present
                if (item.planSubItems?.length > 0) {
                  item.planSubItems.forEach((subItem) => {
                    if (allowedItems.includes(subItem.name)) {
                      const subItemDiscountItem = tradeAgentData?.discount?.discountItems?.find(
                        (d) => d.discountItem === subItem.name
                      );
                      const subItemDiscountPercentage = subItemDiscountItem?.discountValue || 0;
                      const subItemOriginalAmount = subItem.value;
                      const subItemDiscountedAmount = (subItemOriginalAmount * (100 - subItemDiscountPercentage)) / 100;

                      allItems.push(
                        <div key={`${item.id}-${subItem.id}`} className="flex justify-between items-center py-2">
                          <div className="flex items-center gap-4">
                            <input
                              type="checkbox"
                              checked={selectedFees[subItem.name] || false}
                              onChange={(e) => {
                                setSelectedFees(prev => ({
                                  ...prev,
                                  [subItem.name]: e.target.checked
                                }));
                              }}
                              className="form-checkbox h-4 w-4 text-blue-600"
                            />
                            <div>
                              <span className="text-gray-700 font-medium">{subItem.name}</span>
                              <span className="text-gray-600 ml-2">${subItemOriginalAmount.toFixed(2)}</span>
                              {subItemDiscountPercentage > 0 && (
                                <div className="text-sm text-gray-500 mt-0.5">
                                  Discount: {subItemDiscountPercentage}% 
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {subItemDiscountPercentage > 0 ? (
                              <div>
                                <span className="text-gray-400 line-through mr-2">
                                  -${subItemOriginalAmount.toFixed(2)}
                                </span>
                                <span className="text-gray-700 font-medium">
                                  -${subItemDiscountedAmount.toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-700 font-medium">
                                -${subItemOriginalAmount.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                  });
                }

                return allItems;
              })}

              {/* Show cheque fee if cheque type is selected */}
              {watch("chequeType") === "cheque" && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Cheque Processing Fee:</span>
                  <span className="font-medium">-$25.00</span>
                </div>
              )}

              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Final Amount:</span>
                  <span className="font-semibold text-lg">
                    ${finalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="amount" className="font-semibold text-gray-700">
            Amount:
          </label>
          <div class="flex items-center border border-gray-300 rounded-md w-full mt-2">
            <span class="px-2">$</span>
            <input
              disabled
              type="number"
              step="0.01"
              {...register("amount", {
                required: "Amount is required",
                min: 1,
              })}
              class="w-full p-2 border-none outline-none"
            />
          </div>

          {errors.amount && (
            <p className="text-red-500 text-sm">{errors.amount.message}</p>
          )}
        </div>

        {/* Date of Receipt */}
        <div>
          <label
            htmlFor="dateOfReceipt"
            className="font-semibold text-gray-700"
          >
            Date of Receipt:
          </label>
          <input
            type="date"
            {...register("dateOfReceipt", {
              required: tradeAgentCommissionData?.acknowledgementStatus === "accepted" ? "Date of Receipt is required" : false
            })}
            className="w-full mt-2 p-2 border border-gray-300 rounded-md"
          />
          {errors.dateOfReceipt && (
            <p className="text-red-500 text-sm">
              {errors.dateOfReceipt.message}
            </p>
          )}
        </div>

        {/* Bank Account */}
        <div>
          <label htmlFor="bankAccount" className="font-semibold text-gray-700">
            Transfer From:
          </label>
          <select
            disabled
            {...register("bankAccountId", {
              required: "Bank Account is required",
            })}
            className="w-full mt-2 p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select</option>
            {bankAccounts?.map((option) => (
              <option key={option?.id} value={option?.id}>
                {option?.name}
              </option>
            ))}
          </select>
          {errors.bankAccountId && (
            <p className="text-red-500 text-sm">
              {errors.bankAccountId.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center text-xs gap-2">
            <span className="font-medium">Acknowledgement Status:</span>
            <span className="font-semibold text-black">
              {capitalizeFirstLetter(tradeAgentCommissionData?.acknowledgementStatus) || 'N/A'}
            </span>
          </div>
          {(tradeAgentCommissionData?.acknowledgementStatus == 'pending' || tradeAgentCommissionData?.acknowledgementStatus == 'rejected') && (
            <div className="flex items-center text-xs gap-2">
              <span className="font-medium">Rejection Reason:</span>
              <span className="font-semibold text-black">
                {tradeAgentCommissionData?.rejectReasons || 'N/A'}
              </span>
            </div>
          )}
        </div>


        {/* Submit Button */}
        <div className="flex justify-end mt-4">
          {tradeAgentCommissionData?.acknowledgementStatus !== "accepted" && (
            <button
              onClick={() => {
                setValue('acknowledgementEmail', 'yes');
                onSubmit();
              }}
              className="bg-[#0f766e] text-white px-6 py-2 mr-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {btnLoading ? <ButtonLoader /> : 'Click here to send an acknowledgement email to the agent'}
            </button>
          )}

          {tradeAgentCommissionData && tradeAgentCommissionData.status === "completed" ? (
            // <p className='mt-2 font-bold text-red-600'>You have already transferred this commission</p>
            <p className='mt-2 font-bold text-red-600'>Transfer successful</p>
          ) : (tradeAgentCommissionData?.acknowledgementStatus === "accepted" && (
            <button
              type="submit"
              className="bg-[#0f766e] text-white px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {btnLoading ? <ButtonLoader /> : 'Transfer Amount'}
            </button>
          ))}


          <NavLink
            to="/dashboard/accounting/issue-agent-cheque"
            className="ml-4 bg-[#0f766e] text-white px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Go Back
          </NavLink>
        </div>
      </form>
    </div>
  );
};

export default AgentChequeCalculation;
