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
  useCreateAgentAcknowledgementMutation,
  useCreateChequePostingMutation,
  useGetSpecificTradeAgentCommissionQuery,
  useGetSpecificTradeTransactionQuery,
  useTransferCommissionAgentMutation,
} from '../../../redux/api/accounting/tradeAccountingSlice';
import { formatToTwoDecimalPlaces } from '../../../utils/format';
import { formatDateYYYYMMDD } from '../../../utils/formatDateUtils';
import capitalizeFirstLetter from '../../../utils/capitalizeFirstLetter';

const AgentChequeAcknowledgement = () => {
  const navigate = useNavigate();
  const { uuid, agentAccountId } = useParams<{ uuid?: string; agentAccountId?: string }>();
  const { data: tradeAgentCommissionResponse, isLoading: isLoadingtradeAgentCommissionData } = useGetSpecificTradeAgentCommissionQuery({ uuid, agentAccountId });
  const { data: bankAccountList, isLoading: bankAccountIsLoading, refetch: bankAccountRefetch } = useGetAccountingBankAccountsQuery("");
  const [bankAccounts, setBankAccounts] = useState<DataType[]>([]);
  const { register, handleSubmit, setValue, formState: { errors }, watch } = useForm();
  const [tradeAgentCommissionData, setTradeAgentCommissionData] = useState("");
  const [tradeAgentData, setTradeAgentData] = useState([]);
  const [createAgentAcknowledgement] = useCreateAgentAcknowledgementMutation();
  const [totalAgentCommission, setTotalAgentCommission] = useState(0.00);
  const [selectedFees, setSelectedFees] = useState<{[key: string]: boolean}>({});
  const [finalAmount, setFinalAmount] = useState(0);
  const [invoiceData, setInvoiceData] = useState(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [tradesheetData, setTradeSheetData] = useState<any>([]);

  useEffect(() => {
    setBankAccounts(bankAccountList?.data?.accounts);
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
    
  }, [bankAccountList,tradeAgentCommissionResponse,tradeAgentCommissionData, setTotalAgentCommission,tradeAgentData,finalAmount]);

  useEffect(() => {
    let total = parseFloat(totalAgentCommission);
    
    tradeAgentData?.plan?.planItems?.forEach(item => {
      if (selectedFees[item.name]) {
        const discountItem = tradeAgentData?.discount?.discountItems?.find(
          d => d.discountItem === item.name
        );
        const discountPercentage = discountItem?.discountValue || 0;
        const discountedAmount = (item.value * (100 - discountPercentage)) / 100;
        total -= discountedAmount;
      }

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

    if (watch("chequeType") === "cheque") {
      total -= 25;
    }

    setFinalAmount(total);
  }, [selectedFees, totalAgentCommission, tradeAgentData, watch("chequeType")]);

  useEffect(() => {
    if (tradeAgentCommissionResponse?.data?.tradeAgentCommission?.invoiceDetails) {
      const { invoiceDetails } = tradeAgentCommissionResponse.data.tradeAgentCommission;
      setInvoiceData(invoiceDetails);
      
      setValue('chequeType', invoiceDetails.paymentDetails.chequeType);
      setValue('dateOfReceipt', invoiceDetails.paymentDetails.dateOfReceipt);
      setValue('bankAccountId', invoiceDetails.paymentDetails.bankAccountId);
      setValue('amount', invoiceDetails.finalAmount);
    }
  }, [tradeAgentCommissionResponse]);


  const [chequeReceiptsFrom] = useState([
    { label: "Customer A", value: "customer_a" },
    { label: "Customer B", value: "customer_b" },
    { label: "Customer C", value: "customer_c" },
  ]);

  const [chequeTypes] = useState([
    { label: "EFT", value: "eft" },
    { label: "Cheque", value: "cheque" },
  ]);

  const allowedItems = [
    "Yearly Desk Fee",
    "Commission Split",
    "Buy/Sale Admin Fees",
    "Authentisign"
  ];


  const onSubmit = async (data: any) => {
    try {
      const payload = {
        uuid,
        agentAccountId,
        acknowledgementStatus: showRejectForm ? 'rejected' : 'accepted',
        ...(showRejectForm && { rejectReasons: data.rejectionReason }),
      };
      setShowRejectForm(false)

      const response = await createAgentAcknowledgement(payload).unwrap();
      toast.success("Submited successfully.");
    } catch (error) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-full mt-8 p-8 border border-gray-300 rounded-md shadow-md">
      <div className="flex justify-end">
        <NavLink
          to="/dashboard/accounting/acknowledgement-list"
          className="bg-[#0f766e] text-white px-6 py-2 rounded-md hover:bg-[#1a2639] transition-colors"
        >
          Go Back
        </NavLink>
      </div>
      <div className=" rounded-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

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
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Agent Commission Invoice</h2>

      <div className="space-y-6">
        <div className="flex justify-between items-center text-lg font-medium border-b pb-2">
          <span>Total Commission:</span>
          <span>${invoiceData?.totalCommission.toFixed(2)}</span>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-gray-700">Deductions:</h3>
          {invoiceData?.deductions.map((deduction, index) => (
            deduction.originalAmount > 0 && (
              <div key={index} className="flex justify-between items-center py-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">{deduction.itemName}</span>
                  {deduction.discountPercentage > 0 && (
                    <span className="text-sm text-gray-500">
                      ({deduction.discountPercentage}% discount)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {deduction.discountPercentage > 0 ? (
                    <>
                      <span className="text-gray-400 line-through">
                        -${deduction.originalAmount.toFixed(2)}
                      </span>
                      <span className="text-gray-800 font-medium">
                        -${deduction.finalAmount.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-800">
                      -${deduction.originalAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )
          ))}
        </div>

        {invoiceData?.chequeProcessingFee > 0 && (
          <div className="flex justify-between items-center text-gray-600 py-1">
            <span>Cheque Processing Fee</span>
            <span>-${invoiceData.chequeProcessingFee.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between items-center text-lg font-semibold border-t pt-4">
          <span>Final Amount:</span>
          <span>${invoiceData?.finalAmount.toFixed(2)}</span>
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

        {showRejectForm && (
          <div className="border-t pt-4 space-y-4">
            <h3 className="font-medium text-gray-700">Rejection Reason</h3>
            <div className="space-y-2">
              <textarea
                {...register('rejectionReason')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Please provide a reason for rejection..."
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4 mt-6">
          {!showRejectForm ? (
            <>
             {(tradeAgentCommissionData?.acknowledgementStatus === 'pending' || tradeAgentCommissionData?.acknowledgementStatus === 'rejected')   && (
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Accept Acknowledgement
              </button>
               )}

              {(tradeAgentCommissionData?.acknowledgementStatus === 'accepted') && (
                <button
                onClick={() => event?.preventDefault()}
                  className="bg-gray-600 text-white px-6 py-2 rounded-md cursor-not-allowed opacity-50"
                >
                 Acknowledged
                </button>

              )}

              {(tradeAgentCommissionData?.acknowledgementStatus == 'pending' || (tradeAgentCommissionData?.acknowledgementStatus != 'rejected' && tradeAgentCommissionData?.acknowledgementStatus != 'accepted'))  && (
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="submit"
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Submit Rejection
              </button>
              <button
                type="button"
                onClick={() => setShowRejectForm(false)}
                className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
          <NavLink
            to="/dashboard/accounting/acknowledgement-list"
            className="bg-[#0f766e] text-white px-6 py-2 rounded-md hover:bg-[#1a2639] transition-colors"
          >
            Go Back
          </NavLink>
        </div>
      </div>
    </form>
  );
};

export default AgentChequeAcknowledgement;
