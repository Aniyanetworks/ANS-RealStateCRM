// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any

import { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from "react-hook-form";
import { useState, useMemo, useEffect, useRef } from "react";
import Select from "react-select";
import ModalMain from "../../../../../../components/ui/Modal";
import type { DataType, ImageItem } from "../types";
import SignatureSection from "./SignatureSection";
import BankReceiptImages from "./BankReceiptImages";

interface ReceiptFormProps {
  isOpen: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  register: UseFormRegister<DataType>;
  setValue: UseFormSetValue<DataType>;
  watch: UseFormWatch<DataType>;
  errors: FieldErrors<DataType>;
  torontoDate: string;
  propertyListingOptions: Array<{
    value: string | number;
    propertyAddress: string;
    label: string;
    listingStatus?: string;
    status?: string;
    tradeSheets?: Array<{
      id: number;
      tradeStatus?: string;
    }>;
  }>;
  selectedPropertyListingId: string | number;
  onPropertyListingChange: (selectedOption: any) => void;
  paymentMethodChange: string;
  // Signature props
  signatureRef: React.RefObject<any>;
  uploadSignatureImage: string;
  setUploadSignatureImage: (value: string) => void;
  onSignatureChange: (file: File) => Promise<void>;
  onSignatureRemove: () => void;
  onClearSignature: () => void;
  onSaveSignature: () => void;
  // Bank receipt images props
  uploadBankReceiptImages: ImageItem[];
  onBankReceiptImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBankReceiptImageRemove: (index: number) => void;
  auditInfo?: { createdByName?: string; updatedByName?: string; createdAt?: string; updatedAt?: string } | null;
}

const ReceiptForm = ({
  isOpen,
  isLoading,
  onCancel,
  onSubmit,
  register,
  setValue,
  watch,
  errors,
  torontoDate,
  propertyListingOptions,
  selectedPropertyListingId,
  onPropertyListingChange,
  paymentMethodChange,
  signatureRef,
  uploadSignatureImage,
  setUploadSignatureImage,
  onSignatureChange,
  onSignatureRemove,
  onClearSignature,
  onSaveSignature,
  uploadBankReceiptImages,
  onBankReceiptImageChange,
  onBankReceiptImageRemove,
  auditInfo,
}: ReceiptFormProps) => {
  const [expiredListing, setExpiredListing] = useState(false);
  const [furtherListing, setFurtherListing] = useState(false);
  const filterMountedRef = useRef(false);

  // Filter property listing options based on checkbox selections
  const filteredPropertyListingOptions = useMemo(() => {
    if (expiredListing) {
      // Show only expired listings. listingStatus is free-text (not an enum) and
      // shows up in mixed casing depending on how it was set (e.g. MLS sync vs.
      // manual selection), so compare it case-insensitively; option.status is a
      // Prisma enum and is always consistently lowercase, so it's compared as-is.
      return propertyListingOptions.filter(
        (option: any) =>
          String(option.listingStatus || "").toLowerCase() === "expired" ||
          option.status === "expired"
      );
    } else if (furtherListing) {
      // Show all except closed, expired, and draft
      // Also include property listings with trade sheets that have tradeStatus === "closed"
      return propertyListingOptions.filter(
        (option: any) => {
          // Check if property has a closed trade sheet
          const hasClosedTradeSheet = option.tradeSheets?.some(
            (tradeSheet: any) => tradeSheet.tradeStatus === "closed"
          );

          // Include if:
          // 1. Has closed trade sheet, OR
          // 2. Property status is not closed, expired, or draft
          if (hasClosedTradeSheet) {
            return true;
          }

          const listingStatus = String(option.listingStatus || "").toLowerCase();
          return (
            listingStatus !== "closed" &&
            listingStatus !== "expired" &&
            listingStatus !== "draft" &&
            option.status !== "closed" &&
            option.status !== "expired" &&
            option.status !== "draft"
          );
        }
      );
    } else {
      // Default behavior - show only approved listings with specific listingStatus values.
      // listingStatus casing is inconsistent across the app (MLS-synced values like "New"/
      // "Leased" vs. manually-selected lowercase values like "exclusive"), so compare
      // case-insensitively instead of matching one exact casing.
      const includedStatuses = ["new", "price change", "listed", "leased", "extended", "dft", "exclusive"];
      return propertyListingOptions.filter(
        (option: any) =>
          includedStatuses.includes(String(option.listingStatus || "").toLowerCase()) &&
          option.status === "approved"
      );
    }
  }, [propertyListingOptions, expiredListing, furtherListing]);

  // Clear selection only when the user actively changes the filter checkboxes
  // (skip on first render so pre-filled edit values are not wiped)
  useEffect(() => {
    if (!filterMountedRef.current) {
      filterMountedRef.current = true;
      return;
    }
    if (selectedPropertyListingId) {
      const isSelectedInFiltered = filteredPropertyListingOptions.some(
        (option: any) => option.value == selectedPropertyListingId
      );
      if (!isSelectedInFiltered) {
        onPropertyListingChange(null);
        setValue("propertyListingId", "");
      }
    }
  }, [expiredListing, furtherListing]); // only run when user toggles checkboxes

  // Reset checkboxes and filter-mounted flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      setExpiredListing(false);
      setFurtherListing(false);
      filterMountedRef.current = false;
    }
  }, [isOpen]);

  return (
    <ModalMain
      handleCancel={onCancel}
      isModalOpen={isOpen}
      handleOk={onSubmit}
      title="Create Receipt"
      isLoading={isLoading}
      modalClass={"lg:!w-[70%] !z-[10000]"}
    >
      <form className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {/* Date */}
          <div className="flex flex-col gap-2">
            <label>
              Date <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              {...register("date", {
                required: "Date and time are required ",
              })}
              type="datetime-local"
              className="!w-44"
              defaultValue={torontoDate}
            />
            {errors.date && (
              <p className="text-red-500 text-sm">{errors.date.message}</p>
            )}
          </div>

          {/* Property Address */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <label>
                Property Address <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={expiredListing}
                    onChange={(e) => {
                      setExpiredListing(e.target.checked);
                      if (e.target.checked) {
                        setFurtherListing(false);
                      }
                    }}
                    className="cursor-pointer"
                  />
                  <span className="text-sm">Expired Listing</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={furtherListing}
                    onChange={(e) => {
                      setFurtherListing(e.target.checked);
                      if (e.target.checked) {
                        setExpiredListing(false);
                      }
                    }}
                    className="cursor-pointer"
                  />
                  <span className="text-sm">Further Deposit</span>
                </label>
              </div>
            </div>
            <Select
              {...register("propertyListingId", { required: true })}
              options={filteredPropertyListingOptions}
              classNamePrefix="select"
              className={`react-select ${
                errors.propertyListingId ? "border-red-500" : ""
              }`}
              onChange={(selectedOption) =>
                onPropertyListingChange(selectedOption)
              }
              value={
                filteredPropertyListingOptions.find(
                  (option: any) => option.value == selectedPropertyListingId
                ) ||
                propertyListingOptions.find(
                  (option: any) => option.value == selectedPropertyListingId
                ) ||
                null
              }
              isClearable
            />
            {errors.propertyListingId && (
              <p className="text-red-500 text-sm">
                Property Address is required
              </p>
            )}
          </div>

          {/* Received From */}
          <div className="flex flex-col gap-2">
            <label>
              Received From <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              {...register("receivedFrom", {
                required: "Received From  is required",
              })}
              type="text"
              placeholder="Enter Received From"
              className=""
            />
            {errors.receivedFrom && (
              <p className="text-red-500 text-sm">
                {errors.receivedFrom.message}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="flex flex-col gap-2">
            <label>
              Payment Method <span className="text-red-500 ml-1">*</span>
            </label>
            <div>
              <label>
                <input
                  type="radio"
                  {...register("paymentMethod", {
                    required: "Payment Method is required",
                  })}
                  value="certifiedCheque"
                />{" "}
                Certified Cheque
              </label>
              <label>
                <input
                  type="radio"
                  {...register("paymentMethod")}
                  value="bankDraft"
                />{" "}
                Bank Draft
              </label>
              <label>
                <input
                  type="radio"
                  {...register("paymentMethod")}
                  value="wireTransfer"
                />{" "}
                Wire Transfer
              </label>
              <label>
                <input
                  type="radio"
                  {...register("paymentMethod")}
                  value="other"
                />{" "}
                Other
              </label>
              {errors.paymentMethod && (
                <p className="text-red-500 text-sm">
                  {errors.paymentMethod.message}
                </p>
              )}
            </div>

            {paymentMethodChange === "bankDraft" && (
              <div className="">
                <label>Bank Draft Number</label>
                <input
                  type="text"
                  {...register("bankDraftNumber")}
                  placeholder="Enter Bank Draft Number"
                />
              </div>
            )}
          </div>

          {/* Type of Payment */}
          <div className="flex flex-col gap-2">
            <label>
              Type of Payment <span className="text-red-500 ml-1">*</span>
            </label>
            <div>
              <label>
                <input
                  type="radio"
                  {...register("paymentType", {
                    required: "Type of Payment is required",
                  })}
                  value="deposit"
                />{" "}
                Deposit
              </label>
              <label>
                <input
                  type="radio"
                  {...register("paymentType")}
                  value="additionalDeposit"
                />{" "}
                Additional Deposit
              </label>
              <label>
                <input
                  type="radio"
                  {...register("paymentType")}
                  value="other"
                />{" "}
                Other
              </label>
              {errors.paymentType && (
                <p className="text-red-500 text-sm">
                  {errors.paymentType.message}
                </p>
              )}
            </div>
          </div>

          {/* Representation */}
          <div className="flex flex-col gap-2">
            <div>
              <label>
                <input
                  type="radio"
                  {...register("representation", {
                    required: "Representative From is required",
                  })}
                  value="salesRepresentative"
                />{" "}
                Sales Representative
              </label>
              <label>
                <input
                  type="radio"
                  {...register("representation")}
                  value="buyer"
                />{" "}
                Buyer
              </label>
              <label>
                <input
                  type="radio"
                  {...register("representation")}
                  value="tenant"
                />{" "}
                Tenant
              </label>

              {errors.representation && (
                <p className="text-red-500 text-sm">
                  {errors.representation.message}
                </p>
              )}
            </div>
          </div>

          {/* Transaction Type */}
          <div className="flex flex-col gap-2">
            <label>
              Transaction Type <span className="text-red-500 ml-1">*</span>
            </label>
            <div>
              <label>
                <input
                  type="radio"
                  {...register("transactionType", {
                    required: "Transaction Type is required",
                  })}
                  value="sale"
                />{" "}
                Sale
              </label>
              <label>
                <input
                  type="radio"
                  {...register("transactionType")}
                  value="lease"
                />{" "}
                Lease
              </label>
              {errors.transactionType && (
                <p className="text-red-500 text-sm">
                  {errors.transactionType.message}
                </p>
              )}
            </div>
          </div>

          {/* Amount Received */}
          <div className="flex flex-col gap-2">
            <label>
              Amount Received <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              {...register("amountReceived", {
                required: "Amount received is required",
              })}
              type="number"
              placeholder="Enter Amount Received"
              className=""
            />
            {errors.amountReceived && (
              <p className="text-red-500 text-sm">
                {errors.amountReceived.message}
              </p>
            )}
          </div>

          {/* Received by */}
          <div className="flex flex-col gap-2">
            <label>
              Received by <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              {...register("receivedBy", {
                required: "Received by is required",
              })}
              type="text"
              placeholder="Enter Received By"
              className=""
            />
            {errors.receivedBy && (
              <p className="text-red-500 text-sm">
                {errors.receivedBy.message}
              </p>
            )}
          </div>

          {/* Signature Section */}
          <SignatureSection
            signatureRef={signatureRef}
            uploadSignatureImage={uploadSignatureImage}
            setUploadSignatureImage={setUploadSignatureImage}
            setValue={setValue}
            register={register}
            errors={errors}
            onSignatureChange={onSignatureChange}
            onSignatureRemove={onSignatureRemove}
            onClearSignature={onClearSignature}
            onSaveSignature={onSaveSignature}
          />

          {/* Bank Receipt Images */}
          <BankReceiptImages
            uploadBankReceiptImages={uploadBankReceiptImages}
            onImageChange={onBankReceiptImageChange}
            onImageRemove={onBankReceiptImageRemove}
          />
        </div>

        {/* Audit trail — only shown when editing an existing record */}
        {auditInfo && (auditInfo.createdByName || auditInfo.updatedByName) && (
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-x-6 gap-y-1">
            {auditInfo.createdByName && (
              <p className="text-xs text-gray-500">
                <span className="font-medium text-gray-600">Created by:</span>{" "}
                {auditInfo.createdByName}
                {auditInfo.createdAt && (
                  <span className="ml-1 text-gray-400">
                    ({new Intl.DateTimeFormat("en-CA", {
                      year: "numeric", month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit", timeZone: "America/Toronto",
                    }).format(new Date(auditInfo.createdAt))})
                  </span>
                )}
              </p>
            )}
            {auditInfo.updatedByName && (
              <p className="text-xs text-gray-500">
                <span className="font-medium text-gray-600">Last updated by:</span>{" "}
                {auditInfo.updatedByName}
                {auditInfo.updatedAt && (
                  <span className="ml-1 text-gray-400">
                    ({new Intl.DateTimeFormat("en-CA", {
                      year: "numeric", month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit", timeZone: "America/Toronto",
                    }).format(new Date(auditInfo.updatedAt))})
                  </span>
                )}
              </p>
            )}
          </div>
        )}
      </form>
    </ModalMain>
  );
};

export default ReceiptForm;

