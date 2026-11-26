import React from 'react';
import { NavLink } from 'react-router-dom';


interface AgentDetailsFormProps {
  register: any;
  agentAccount: any;
  statusOptions: { value: string; label: string }[];
  errors: any;
  isEditMode: boolean;
  baseUrl: string;
  specialNote: string;
}

const AgentDetailsForm: React.FC<AgentDetailsFormProps> = ({
  register,
  agentAccount,
  statusOptions,
  errors,
  isEditMode,
  specialNote,
}) => {
  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {/* Brokerage Name */}
        <div>
          <label className="block mb-1">Brokerage Name</label>
          <input
            type="text"
            {...register("brokerageName", { required: false })}
            readOnly
            className="border p-2 w-full border-gray-300 bg-gray-100"
          />
        </div>
        <div>
          <label className="block mb-1">First Name</label>
          <input
            type="text"
            {...register("firstName", { required: false })}
            readOnly
            className="border p-2 w-full border-gray-300 bg-gray-100"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block mb-1">Last Name</label>
          <input
            type="text"
            {...register("lastName", { required: false })}
            readOnly
            className="border p-2 w-full border-gray-300 bg-gray-100"
          />
        </div>

        {/* PREC Name */}
        <div>
          <label className="block mb-1">PREC Name (if any)</label>
          <input
            type="text"
            {...register("precName", { required: false })}
            readOnly
            className="border p-2 w-full border-gray-300 bg-gray-100"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block mb-1">Email</label>
          <input
            type="email"
            {...register("email", { required: false })}
            readOnly
            className="border p-2 w-full border-gray-300 bg-gray-100"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block mb-1">Address</label>
          <input
            type="text"
            {...register("address", { required: false })}
            readOnly
            className="border p-2 w-full border-gray-300 bg-gray-100"
          />
        </div>

        {/* Cell Phone */}
        <div>
          <label className="block mb-1">Cell Phone</label>
          <input
            type="text"
            {...register("cellPhone", { required: false })}
            readOnly
            className="border p-2 w-full border-gray-300 bg-gray-100"
          />
        </div>

        {/* RECO Reg Number */}
        <div>
          <label className="block mb-1">RECO Reg Number</label>
          <input
            type="text"
            {...register("recoRegNumber", { required: false })}
            readOnly
            className="border p-2 w-full border-gray-300 bg-gray-100"
          />
        </div>

        {/* RECO Expiry Date */}
        <div>
          <label className="block mb-1">RECO Expiry Date</label>
          <input
            type="date"
            {...register("recoExpiryDate", { required: false })}
            readOnly
            className="border p-2 w-full border-gray-300 bg-gray-100"
          />
        </div>

        {/* Phone Service Provider */}
        <div>
          <label className="block mb-1">TRREB Member ID</label>
          <input
            type="text"
            {...register("trrebMemberId", { required: false })}
            readOnly
            className="border p-2 w-full border-gray-300 bg-gray-100"
          />
        </div>

        {/* SIN */}
        <div>
          <label className="block mb-1">SIN</label>
          <input
            type="text"
            {...register("sin", { required: false })}
            readOnly
            className="border p-2 w-full border-gray-300 bg-gray-100"
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block mb-1">Date of Birth</label>
          <input
            type="date"
            {...register("dob", { required: false })}
            readOnly
            className="border p-2 w-full border-gray-300 bg-gray-100"
          />
        </div>

        {/* Emergency Contact */}
        <div>
          <label className="block mb-1">Emergency Name</label>
          <input
            type="text"
            {...register("emergencyUser", { required: false })}
            readOnly
            className="border p-2 w-full border-gray-300 bg-gray-100"
          />
        </div>
        <div>
          <label className="block mb-1">Emergency Contact</label>
          <input
            type="text"
            {...register("emergencyContact", { required: false })}
            readOnly
            className="border p-2 w-full border-gray-300 bg-gray-100"
          />
        </div>

        {/* HST Number */}
        <div>
          <label className="block mb-1">HST Number</label>
          <input
            type="text"
            {...register("hstNo", { required: false })}
            readOnly
            className="border p-2 w-full border-gray-300 bg-gray-100"
          />
        </div>

        {/* PREC HST Number */}
        <div>
          <label className="block mb-1">PREC HST Number</label>
          <input
            type="text"
            {...register("precHstNo", { required: false })}
            readOnly
            className="border p-2 w-full border-gray-300 bg-gray-100"
          />
        </div>

        {/* Expected Gross */}
        <div>
          <label className="block mb-1">Expected Gross</label>
          <input
            type="number"
            {...register("expectedGross", { required: false })}
            readOnly
            className="border p-2 w-full border-gray-300 bg-gray-100"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block mb-1">Status:</label>
          <select {...register("status", { required: true })} disabled>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.status && (
            <span className="text-red-500">Status is required</span>
          )}
        </div>

        {/* Agreement Status */}
        <div className="flex flex-col">
          <label className="block mb-1">Agreement Status:</label>
          <select
            {...register("agreementStatus", { required: false })}
            defaultValue={"pending"}
            disabled
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {isEditMode && errors.status && (
            <span className="text-red-500">Status is required</span>
          )}
        </div>
        
         {/* Agreement Expiry Date */}
         <div>
          <label className="block mb-1">Agreement Expiry Date</label>
          <input
            type="date"
            {...register("agrementExpiryDate", { required: false })}
            readOnly
            className="border p-2 w-full border-gray-300 bg-gray-100"
          />
        </div>

        {/* Agreement */}
        {agentAccount?.agreementStatus !== "approved" && !agentAccount?.agreementFile && (
          <div className="flex flex-col">
            <label className="block mb-1">Agreement</label>
            <NavLink
              to={`/dashboard/super-admin/agreement-preview/${agentAccount?.user?.uuid}`}
              className="flex items-center p-1 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors rounded-md"
              target="_blank"
            >
              <span className="flex-1">On Board Agreement</span>
            </NavLink>
          </div>
        )}
      </div>

     

      {/* Special Note */}
      <div className="my-4">
        <label htmlFor="">Special Note:</label>
        <div
          className={`border rounded-md mb-3 p-4`}
          dangerouslySetInnerHTML={{ __html: specialNote }}
        />
      </div>
    </div>

  );
};

export default AgentDetailsForm;