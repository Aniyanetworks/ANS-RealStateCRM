// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useInviteAgentMutation } from "../../../../../redux/api/superadmin/agent/agentManagementSlice";
import { 
  useGetOptionalPlanListDataQuery, 
  useGetPlanListDataQuery 
} from "../../../../../redux/api/superadmin/plan-management/planManagementSlice";
import { useGetDiscountListDataQuery } from "../../../../../redux/api/superadmin/discount-management/discountManagementSlice";
import toast from "react-hot-toast";
import ButtonLoader from "../../../../../components/loader/buttonLoader";
import SelectPlan from "../../../../../components/dashboard/Agent/SelectPlan";
import AddonsPlanSelector from "../../../../../components/dashboard/Agent/SelectAddonPlan";
import SelectDiscount from "../plan-management/SelectDiscount";
import uploadIcon from "../../../../../assets/upload.svg";

interface DataType {
  firstName: string;
  lastName: string;
  email: string;
  planId: number | null;
  optionalPlans: number[];
  discountId: number | null;
  agreementFile: File | null;
}




interface AgentInvitationProps {
  handleCancelAgentInvitation: () => void;
}

const AgentInvitation: React.FC<AgentInvitationProps> = ({
  handleCancelAgentInvitation,
}) => {
  const {
    register,
    formState: { errors },
    reset,
    setError,
    handleSubmit,
    setValue,
  } = useForm<DataType>();

  const [inviteAgent] = useInviteAgentMutation();
  const [isUploading, setIsUploading] = useState(false);
  
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedOptionalPlans, setSelectedOptionalPlans] = useState<number[]>([]);
  const [selectedDiscountId, setSelectedDiscountId] = useState<number | null>(null);

  const { data: planData } = useGetPlanListDataQuery("");
  const { data: optionalPlanData } = useGetOptionalPlanListDataQuery('');
  const { data: discountData } = useGetDiscountListDataQuery("");

  const [agreementFile, setAgreementFile] = useState<File | null>(null);
const [isFileUploading] = useState(false);

  const resetForm = () => {
  reset({
    firstName: "",
    lastName: "",
    email: "",
    planId: null,
    optionalPlans: [],
    discountId: null,
    agreementFile: null,
  });
  setSelectedPlanId(null);
  setSelectedOptionalPlans([]);
  setSelectedDiscountId(null);
  setAgreementFile(null);
};

const handleAgreementFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload PDF, JPEG or PNG files only');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }
    
    setAgreementFile(file);
    setValue("agreementFile", file);
    toast.success('Agreement file selected successfully');
  }
};

  const handlePlanSelect = (planId: number) => {
    setValue("planId", planId);
    setSelectedPlanId(planId);
  };

  const handleDiscountSelect = (discountId: number) => {
    setValue("discountId", discountId);
    setSelectedDiscountId(discountId);
  };

  const handleOptionalPlanChange = (planId: number) => {
    const updatedOptionalPlans = selectedOptionalPlans.includes(planId)
      ? selectedOptionalPlans.filter(id => id !== planId)
      : [...selectedOptionalPlans, planId];
    
    setSelectedOptionalPlans(updatedOptionalPlans);
    setValue("optionalPlans", updatedOptionalPlans);
  };

  const onSubmit = async (data: DataType) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("email", data.email);
      if (selectedPlanId) formData.append("planId", selectedPlanId.toString());
      if (selectedDiscountId) formData.append("discountId", selectedDiscountId.toString());
      if (selectedOptionalPlans.length > 0) {
        formData.append("optionalPlans", selectedOptionalPlans.join(","));
      }
      
      if (agreementFile) {
        formData.append("agreementFile", agreementFile);
      }


      const response = (await inviteAgent(formData)) as any;

      if (response?.error?.data?.status === false) {
        if (response.error.data.errors) {
          response.error.data.errors.forEach((error: any) => {
            setError(error.path, { type: "manual", message: error.msg });
          });
        } else {
          toast.error(`${response?.error.data?.message}`);
        }
      } else if (response?.data?.status === true) {
        toast.success(`${response?.data?.message}`);
        resetForm();
        handleCancelAgentInvitation();
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to invite agent");
    }
    setIsUploading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <label>
            First Name<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            {...register("firstName", { required: "First name is required" })}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.firstName && (
            <span className="text-red-500 text-sm">
              {errors.firstName.message as string}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label>
            Last Name<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            {...register("lastName", { required: "Last name is required" })}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.lastName && (
            <span className="text-red-500 text-sm">
              {errors.lastName.message as string}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label>
            Email<span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^\S+@\S+$/i,
                message: "Email is not valid",
              },
            })}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && (
            <span className="text-red-500 text-sm">
              {errors.email.message as string}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label>
            Agreement File <span className="text-gray-500 text-sm">(Optional)</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              onChange={handleAgreementFileUpload}
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              id="agreement-upload"
            />
            <label
              htmlFor="agreement-upload"
              className="cursor-pointer flex items-center gap-2 text-blue-500 hover:text-blue-600 border border-blue-500 rounded-md px-4 py-2 hover:bg-blue-50 transition-colors"
            >
              {isFileUploading ? (
                <ButtonLoader />
              ) : (
                <>
                  <img src={uploadIcon} alt="Upload" className="w-4 h-4" />
                  Upload Agreement
                </>
              )}
            </label>
            {agreementFile && (
              <span className="text-sm text-gray-600">
                {agreementFile.name}
              </span>
            )}
          </div>
        </div>
      </div>

      

      <div className="border border-gray-200 rounded-lg p-6 bg-white mb-6">
        <h3 className="text-lg font-semibold mb-4">Plan & Discount Selection</h3>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <SelectPlan
  plans={planData?.data?.plans?.slice().sort((a, b) => 
    a.name.localeCompare(b.name)
  ) || []}
  selectedPlanId={selectedPlanId}
  onSelect={handlePlanSelect}
/>
            {errors.planId && (
              <span className="text-red-500 text-sm mt-2">
                {errors.planId.message as string}
              </span>
            )}
          </div>

          <div className="col-span-1">
            <AddonsPlanSelector
              optionalPlanData={optionalPlanData}
              optionalPlans={selectedOptionalPlans}
              register={register}
              handleOptionalPlanChange={handleOptionalPlanChange}
            />
          </div>

          <div className="col-span-1">
            <SelectDiscount
              discounts={discountData?.data?.discounts || []}
              selectedDiscountId={selectedDiscountId}
              onSelect={handleDiscountSelect}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button 
          type="button" 
          onClick={handleCancelAgentInvitation}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          disabled={isUploading}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="primary-btn flex items-center justify-center min-w-[140px] px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isUploading}
        >
          {isUploading ? <ButtonLoader /> : "Invite Agent"}
        </button>
      </div>
    </form>
  );
};

export default AgentInvitation;