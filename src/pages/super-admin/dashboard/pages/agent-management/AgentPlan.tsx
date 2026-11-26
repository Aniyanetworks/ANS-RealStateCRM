// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  useUpdateAgentMutation,
  useGetSingleAgentDataQuery,
} from "../../../../../redux/api/superadmin/agent/agentManagementSlice";

import "react-quill-new/dist/quill.snow.css";
import SelectPlan from "../../../../../components/dashboard/Agent/SelectPlan";
import AddonsPlanSelector from "../../../../../components/dashboard/Agent/SelectAddonPlan";
import AgentForm from "../../../../../components/dashboard/Agent/AgentForm";
import {
  useGetOptionalPlanListDataQuery,
  useGetPlanListDataQuery,
} from "../../../../../redux/api/superadmin/plan-management/planManagementSlice";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import ButtonLoader from "./../../../../../components/loader/buttonLoader";
import AgentSteps from "../../../../../components/Stepper/AgentSteps";
import TableLoader from "../../../../../components/loader/TableLoader";
import { useGetDiscountListDataQuery } from "../../../../../redux/api/superadmin/discount-management/discountManagementSlice";
import SelectDiscount from "../plan-management/SelectDiscount";

interface DataType {
  key?: React.Key;
  id?: string;
  planId?: number;
  firstName: string;
  lastName: string;
  precName: string;
  email: string;
  address: string;
  cellPhone: string;
  phoneServiceProvider: string;
  recoRegNumber: string;
  recoExpiryDate: string;
  sin: string;
  dob: string;
  emergencyContact: string;
  hstNo: string;
  precHstNo: string;
  expectedGross: number;
  remarks: string;
  status: string;
  agreementStatus: string;
  createdAt?: string;
  uuid?: string;
  special_note: string;
  fileUpload?: string;
  user?: { uuid: string };
  nationalIdentity?: string;
  recoLicence?: string;
  previousRegistration?: string;
  agreementFile?: string;
  password?: string;
  confirmPassword?: string;
}

const AgentPlan: React.FC = () => {
  const [selectedDiscountId, setSelectedDiscountId] = useState<number | null>(
    null
  );
  const { data: planData } = useGetPlanListDataQuery("");
  const { data: optionalPlanData } = useGetOptionalPlanListDataQuery("");
  const [updateAgent] = useUpdateAgentMutation();
  const [isUploading, setIsUploading] = useState(false);
  const [specialNote, setSpecialNote] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState(Number);
  const [selectedOptionalPlans, setSelectedOptionalPlans] = useState<number[]>(
    []
  );
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid?: string }>();
  const { data: agentData, isFetching } = useGetSingleAgentDataQuery(
    uuid || ""
  );
  const { data: discountData, isFetching: isFetchingDiscountData } =
    useGetDiscountListDataQuery("");
  const {
    register,
    formState: { errors },
    reset,
    getValues,
    setError,
    handleSubmit,
    setValue,
  } = useForm<DataType>();

  const statusOptions = [
    { label: "Approved", value: "approved" },
    { label: "Pending", value: "pending" },
    { label: "Under Review", value: "underReview" },
    { label: "Draft", value: "draft" },
    { label: "Rejected", value: "rejected" },
    { label: "Closed", value: "closed" },
  ];

  useEffect(() => {
    if (
      agentData &&
      agentData.data &&
      agentData?.data?.agentDetails?.agentAccount
    ) {

      const agent = agentData?.data?.agentDetails?.agentAccount[0];
      const formattedRecoExpiryDate = agent.recoExpiryDate
        ? agent.recoExpiryDate.split("T")[0]
        : "";
      const formattedDob = agent.dob ? agent.dob.split("T")[0] : "";
      reset({
        ...agent,
        recoExpiryDate: formattedRecoExpiryDate,
        dob: formattedDob,
      });

      const planArray = agent.optionalPlanId
        ? agent.optionalPlanId.split(",").map(Number)
        : [];
      const filteredOptionalPlans =
        planArray && optionalPlanData?.data?.optionalPlans
          ? optionalPlanData?.data?.optionalPlans.filter((plan: any) =>
              planArray.includes(Number(plan.id))
            )
          : [];
      setSpecialNote(agent.special_note || "");
      setSelectedPlanId(agent.planId || null);
      setSelectedDiscountId(agent.discountId || null);
      setSelectedOptionalPlans(
        agentData?.data?.agentDetails?.agentAccount?.[0]?.optionalPlanId
          ?.split(",")
          .map((id: string) => parseInt(id, 10)) || []
      );
    }
  }, [agentData, reset, optionalPlanData?.data?.optionalPlans]);

  const resetForm = () => {
    reset({
      firstName: "",
      lastName: "",
      precName: "",
      email: "",
      special_note: "",
      address: "",
      cellPhone: "",
      phoneServiceProvider: "",
      recoRegNumber: "",
      recoExpiryDate: "",
      sin: "",
      dob: "",
      emergencyContact: "",
      hstNo: "",
      precHstNo: "",
      expectedGross: 0,
      status: "pending",
      agreementStatus: "pending",
    });
    setSpecialNote("");
    setSelectedOptionalPlans([]);
  };

  const onSubmit = async () => {
    setIsUploading(true);
    const formData = getValues();

    if (formData.password && formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setError("confirmPassword", {
          type: "manual",
          message: "Passwords do not match",
        });
        setIsUploading(false);
        toast.error("Password & Confirm Password do not match");
        return;
      }
    }

    const submissionData = {
      ...formData,
      optionalPlans: selectedOptionalPlans,
    };

    if (uuid) {
      try {
        const response = (await updateAgent({
          uuid: uuid,
          data: submissionData,
        })) as any;

        if (response?.error?.data?.status == false) {
          setIsUploading(false);
          if (response.error.data.errors) {
            response.error.data.errors.forEach((error: any) => {
              setError(error.path, {
                type: "manual",
                message: error.msg,
              });
            });
          } else {
            toast.error(`${response?.error.data?.message}`);
          }
        } else if (response?.data?.status == true) {
          toast.success(`${response?.data?.message}`);
          navigate(
            `/dashboard/super-admin/agent-file-upload/${response?.data?.data?.agentData?.uuid}`,
            { replace: true }
          );
          setIsUploading(false);
          resetForm();
        } else {
          setIsUploading(false);
        }
      } catch (error) {
        console.error("Submission error:", error);
        setIsUploading(false);
      }
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
    setSelectedOptionalPlans((prevState) =>
      prevState.includes(planId)
        ? prevState.filter((id) => id !== planId)
        : [...prevState, planId]
    );
  };

  if (isFetching && isFetchingDiscountData) {
    return <TableLoader />;
  }

  return (
    <div>
      <h1>Create New Agent</h1>
      <AgentSteps active={2} uuid={uuid} />

      <form className="space-y-3 my-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="hidden">
          <AgentForm
            statusOptions={statusOptions}
            specialNote={specialNote}
            handleChange={(value) => {
              setValue("special_note", value);
              setSpecialNote(value);
            }}
            register={register}
            errors={errors}
            isEditMode={false}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 w-full p-5 border bg-white p-4 rounded-md">
          <SelectPlan
            plans={planData?.data?.plans || []}
            onSelect={handlePlanSelect}
            selectedPlanId={selectedPlanId}
          />
          <AddonsPlanSelector
            optionalPlanData={optionalPlanData || []}
            handleOptionalPlanChange={handleOptionalPlanChange}
            optionalPlans={selectedOptionalPlans}
            register={register}
          />
          <SelectDiscount
            discounts={discountData?.data?.discounts || []}
            onSelect={handleDiscountSelect}
            selectedDiscountId={selectedDiscountId}
          />

          <div></div>
        </div>
        <button
          onClick={() => onSubmit()}
          className="primary-btn mx-3"
          disabled={isUploading}
        >
          {isUploading ? <ButtonLoader /> : "Save & Next"}
        </button>
      </form>
    </div>
  );
};

export default AgentPlan;
