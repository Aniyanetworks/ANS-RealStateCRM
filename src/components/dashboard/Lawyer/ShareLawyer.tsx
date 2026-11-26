import React from "react";

interface ShareLawyerProps {
  register: any;
  errors: any;
  watch: (field: string) => any;
  states: { data: { states: { id: string; name: string }[] } };
  cities: { data: { cities: { id: string; name: string }[] } };
}

const ShareLawyer: React.FC<ShareLawyerProps> = ({ register, errors, watch, states, cities }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
      <div className="flex flex-col gap-2">
        <label>
          First Name <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          {...register("firstName", {
            required: "Lawyer name is required",
          })}
          type="text"
          placeholder="Enter Lawyer Name"
          className=""
        />
        {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName.message as string}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label>
          Last Name <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          {...register("lastName", {
            required: "Lawyer name is required",
          })}
          type="text"
          placeholder="Enter Lawyer Name"
          className=""
        />
        {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName.message as string}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label>
          Lawyer Firm Name <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          {...register("lawyerFirmName", {
            required: "Lawyer firm name is required",
          })}
          type="text"
          placeholder="Enter Lawyer Firm Name"
          className=""
        />
        {errors.lawyerFirmName && <p className="text-red-500 text-sm">{errors.lawyerFirmName.message as string}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label>
          Address <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          {...register("address", { required: "Address is required" })}
          type="text"
          placeholder="Enter Address"
          className=""
        />
        {errors.address && <p className="text-red-500 text-sm">{errors.address.message as string}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label>Unit/Suite/Apt Number</label>
        <input
          {...register("streetAddress", { required: false })}
          type="text"
          placeholder="Enter Unit/Suite/Apt Number"
          className=""
        />
        {errors.streetAddress && <p className="text-red-500 text-sm">{errors.streetAddress.message as string}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label>
          Province <span className="text-red-500 ml-1">*</span>
        </label>
        <select
          {...register("stateId", { required: "Province is required" })}
          disabled={!watch("countryId")}
        >
          <option value="">Select Province</option>
          {states?.data?.states?.map((state) => (
            <option key={state.id} value={state.id}>
              {state.name}
            </option>
          ))}
        </select>
        {errors.stateId && <p className="text-red-500 text-sm">{errors.stateId.message as string}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label>
          City <span className="text-red-500 ml-1">*</span>
        </label>
        <select
          {...register("cityId", { required: "City is required" })}
          disabled={!watch("stateId")}
        >
          <option value="">Select City</option>
          {cities?.data?.cities?.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        {errors.cityId && <p className="text-red-500 text-sm">{errors.cityId.message as string}</p>}
      </div>

      {[
        { name: "postalZipCode", label: "Postal Code", required: "Postal code is required" },
        { name: "email", label: "Email", required: "Email is required" },
        { name: "phoneNumber", label: "Phone Number", required: "Phone number is required" },
        { name: "cellPhoneNumber", label: "Cell Phone Number", required: false },
        { name: "faxNumber", label: "Fax Number", required: false },
      ].map((field) => (
        <div key={field.name} className="flex flex-col gap-2">
          <label>
            {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            {...register(field.name, field.required ? { required: field.required } : {})}
            type="text"
            placeholder={`Enter ${field.label}`}
            className=""
          />
          {errors[field.name] && (
            <p className="text-red-500 text-sm">{errors[field.name].message as string}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ShareLawyer;
