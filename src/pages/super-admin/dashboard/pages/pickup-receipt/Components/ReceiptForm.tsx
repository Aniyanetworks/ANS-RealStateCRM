// @ts-nocheck
import Select from "react-select";
import moment from "moment-timezone";
import type { DataType } from "./types";
import { REASON_OPTIONS } from "./types";

interface ReceiptFormProps {
  register: any;
  errors: any;
  propertyListingOptions: any[];
  selectedPropertyListingId: React.Key;
  handlePropertyListingChange: (selectedOption: any) => void;
  uploadReceiverIdImage: string;
  handleUploadReceiverIdImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveReceiverIdImage: () => void;
}

const ReceiptForm = ({
  register,
  errors,
  propertyListingOptions,
  selectedPropertyListingId,
  handlePropertyListingChange,
  uploadReceiverIdImage,
  handleUploadReceiverIdImage,
  handleRemoveReceiverIdImage,
}: ReceiptFormProps) => {
  const torontoDate = moment()
    .tz("America/Toronto")
    .format("YYYY-MM-DDTHH:mm");

  return (
    <form className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {/* Date */}
        <div className="flex flex-col gap-2">
          <label>Date</label>
          <input
            {...register("date", {
              required: "Date and time are required",
            })}
            type="datetime-local"
            className=""
            defaultValue={torontoDate}
          />
          {errors.date && (
            <p className="text-red-500 text-sm">{errors.date.message}</p>
          )}
        </div>

        {/* Property Address */}
        <div className="flex flex-col gap-2">
          <label>
            Property Address <span className="text-red-500 ml-1">*</span>
          </label>
          <Select
            {...register("propertyAddress", { required: true })}
            options={propertyListingOptions}
            classNamePrefix="select"
            className={`react-select ${
              errors.propertyListingId ? "border-red-500" : ""
            }`}
            onChange={(selectedOption) =>
              handlePropertyListingChange(selectedOption)
            }
            value={propertyListingOptions.find(
              (option: any) => option.value === selectedPropertyListingId
            )}
            isClearable
          />
          {errors.propertyAddress && (
            <p className="text-red-500 text-sm">
              Property Address is required
            </p>
          )}
        </div>

        {/* Received From */}
        <div className="flex flex-col gap-2">
          <label>
            Pickup By <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            {...register("pickupPerson", {
              required: "Pickup Person  is required",
            })}
            type="text"
            placeholder="Enter Pickup Person"
            className=""
          />
          {errors.pickupPerson && (
            <p className="text-red-500 text-sm">
              {errors.pickupPerson.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {/* Optional: a DFT refunds the whole deposit (Deposit Refund); otherwise the balance is returned. */}
          <label>
            Reason For Payment <span className="text-gray-400 text-xs ml-1">(optional)</span>
          </label>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {REASON_OPTIONS.map((o) => (
              <label key={o.value} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" {...register("reasonForPayment")} value={o.value} />
                {o.label}
              </label>
            ))}
          </div>
          {errors.reasonForPayment && (
            <p className="text-red-500 text-sm">
              {errors.reasonForPayment.message}
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
                value="cheque"
              />{" "}
              Cheque
            </label>
          </div>
          {errors.paymentMethod && (
            <p className="text-red-500 text-sm">
              {errors.paymentMethod.message}
            </p>
          )}
        </div>

        {/* Representation */}
        <div className="flex flex-col gap-2">
          <div>
            <label>
              <input
                type="radio"
                {...register("pickupBy", {
                  required: "Pickup By  is required",
                })}
                value="salesRepresentative"
              />{" "}
              Sales Representative
            </label>
            <label>
              <input
                type="radio"
                {...register("pickupBy")}
                value="seller"
              />{" "}
              Seller
            </label>
            <label>
              <input
                type="radio"
                {...register("pickupBy")}
                value="landlord"
              />{" "}
              Landlord
            </label>
          </div>
          {errors.pickupBy && (
            <p className="text-red-500 text-sm">{errors.pickupBy.message}</p>
          )}
        </div>

        {/* Received by */}
        <div className="flex flex-col gap-2">
          <label>
            Handed By <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            {...register("handleBy", {
              required: "Handed By is required",
            })}
            type="text"
            placeholder="Enter Handle By"
            className=""
          />
          {errors.handleBy && (
            <p className="text-red-500 text-sm">{errors.handleBy.message}</p>
          )}
        </div>

        <div>
          <p className="mb-2">Receiver's ID or Business Card</p>
          <label className="flex justify-center items-center py-2 border border-dashed border-gray-400 rounded-md gap-2 hover:border-blue-500 cursor-pointer w-[300px]">
            <input
              type="file"
              className="hidden"
              onChange={handleUploadReceiverIdImage}
              accept="image/*"
            />
            <span>Upload files</span>
          </label>

          {uploadReceiverIdImage && (
            <div className="mt-4">
              <div className="flex items-center">
                <img
                  src={uploadReceiverIdImage}
                  alt="Upload preview"
                  className=" max-h-40 object-cover"
                />
                <button
                  onClick={handleRemoveReceiverIdImage}
                  className="ml-2 text-red-500"
                >
                  ✖ Remove
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default ReceiptForm;

