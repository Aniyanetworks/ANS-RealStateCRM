// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useGetAccountingBankAccountsQuery } from "../../../redux/api/accounting/bankAccountManagementSlice";
import { useCreateChequePostingMutation, useGetSpecificTradeTransactionQuery } from "../../../redux/api/accounting/tradeAccountingSlice";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { formatDateYYYYMMDD } from "../../../utils/formatDateUtils";
import {  Modal, Button } from "antd";
import toast from "react-hot-toast";
import CommissionTrustChequePopup from "./CommissionTrustChequePopup";
import pdfFile from '../../../assets/cheque/REAL-ESTATE-TRUST-ACCOUNT.pdf';

const AccountChequePosting = () => {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid?: string }>(); // uuid is optional
  const { data:tradeTransactionResponse, isLoading:isLoadingTradeTransactionData } = useGetSpecificTradeTransactionQuery(uuid);
  const { data:bankAccountList, isLoading:bankAccountIsLoading, refetch:bankAccountRefetch} = useGetAccountingBankAccountsQuery(""); // Use the bank account data query
  const [bankAccounts, setBankAccounts] = useState<DataType[]>([]);
  const { register, handleSubmit, setValue, formState: { errors },watch } = useForm();
  const [tradeTransactionData, setTradeTransactionData] = useState("");
  const [createChequePosting] = useCreateChequePostingMutation();
  const [isModalChequeVisible, setIsModalChequeVisible] = useState(false);

  useEffect(() => {
    setBankAccounts(bankAccountList?.data?.accounts); // Ensure correct data mapping
    setTradeTransactionData(tradeTransactionResponse?.data?.tradeTransaction)
    setValue(
      'chequeReceiptFrom',
      tradeTransactionData?.tradeSheet?.agentDetails?.[0]?.buyerBrokerage?.brokerageName || ''
    );
    setValue('brokerageId',tradeTransactionData?.tradeSheet?.agentDetails?.[0]?.buyerBrokerageId);
    setValue('intSellerAgentId',tradeTransactionData?.tradeSheet?.agentDetails?.[0]?.intSellerAgentId);
    setValue('amount',tradeTransactionData?.baseOfficeCommissionSelling ||0.00);
    setValue('dateOfReceipt',formatDateYYYYMMDD(tradeTransactionData?.closingDate));
    setValue('bankAccountId',1);
    setValue('tradeSheetId',tradeTransactionData?.tradeSheetId);
    setValue('tradeTransactionId',tradeTransactionData?.id);

    console.log('tradeTransactionData?.baseOfficeCommissionTotal',tradeTransactionData)
  }, [bankAccountList,tradeTransactionResponse,tradeTransactionData]);

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

  const chequeType = watch("chequeType");

  const onSubmit = async (data: any) => {
    try {
      const response = await createChequePosting(data).unwrap();
      toast.success("Cheque Posting successfully.");

      if(data.chequeType == 'cheque')
      {
        setIsModalChequeVisible(true)
      }
      else
      {
        navigate('/dashboard/accounting/trade-list');
      }


    } catch (error) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  return (
    <div className="max-w-full mt-8 p-8 border border-gray-300 rounded-md shadow-md">
      <h2 className="text-xl font-semibold text-gray-800">Cheque Posting</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Cheque Receipt From */}
        {/* <div>
          <label
            htmlFor="chequeReceiptFrom"
            className="font-semibold text-gray-700"
          >
            Cheque Receipt From:
          </label>
          <select
            {...register("chequeReceiptFrom", {
              required: "Cheque Receipt From is required",
            })}
            className="w-full mt-2 p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select</option>
            {chequeReceiptsFrom.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.chequeReceiptFrom && (
            <p className="text-red-500 text-sm">
              {errors.chequeReceiptFrom.message}
            </p>
          )}
        </div> */}

        <div>
          <label htmlFor="amount" className="font-semibold text-gray-700">
            Cheque Receipt From:
          </label>
          <input
            type="text"
            {...register("chequeReceiptFrom")}
            className="w-full mt-2 p-2 border border-gray-300 rounded-md"
          />
          {errors.chequeReceiptFrom && (
            <p className="text-red-500 text-sm">
              {errors.chequeReceiptFrom.message}
            </p>
          )}
        </div>

        {/* Cheque Type */}
        <div>
          <label htmlFor="chequeType" className="font-semibold text-gray-700">
            Cheque Type:
          </label>
          <select
            {...register("chequeType", { required: "Cheque Type is required" })}
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

        {/* Conditionally rendered Cheque Number input */}
        {chequeType === "cheque" && (
          <div className="mt-4">
            <label htmlFor="chequeNumber" className="font-semibold text-gray-700">
              Cheque Number:
            </label>
            <input
              type="text"
              {...register("chequeNumber", { required: "Cheque Number is required" })}
              className="w-full mt-2 p-2 border border-gray-300 rounded-md"
            />
            {errors.chequeNumber && (
              <p className="text-red-500 text-sm">{errors.chequeNumber.message}</p>
            )}
          </div>
        )}

        {/* Amount */}
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
              required: "Date of Receipt is required",
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
            Bank Account:
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

        {/* Submit Button */}
        <div className="flex justify-end mt-4">
          <button
            type="submit"
            className="bg-[#0b3b38] text-white px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Submit
          </button>

          <NavLink
            to="/dashboard/accounting/trade-list"
            className="ml-4 bg-[#0b3b38] text-white px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Go Back
          </NavLink>
        </div>
      </form>

      <Modal
        title="ANS REALSTATECRM INC REAL ESTATE TRUST ACCOUNT"
        open={isModalChequeVisible}
        onCancel={() => {setIsModalChequeVisible(false)}}
        width={900}
        footer={[
          <Button
            key="cancel"
            onClick={() => {setIsModalChequeVisible(false)}}
          >
            Close
          </Button>,
        ]}
      >
        <div>
            <CommissionTrustChequePopup documentPath={pdfFile} />
        </div>

      </Modal>
    </div>
  );
};

export default AccountChequePosting;
