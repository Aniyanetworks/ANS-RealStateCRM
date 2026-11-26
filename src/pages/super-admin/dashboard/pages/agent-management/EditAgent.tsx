// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import 'react-quill-new/dist/quill.snow.css';

import React, {
  useEffect,
  useState,
} from 'react';

import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import AgentForm from '../../../../../components/dashboard/Agent/AgentForm';
import ButtonLoader from '../../../../../components/loader/buttonLoader';
import TableLoader from '../../../../../components/loader/TableLoader';
import AgentSteps from '../../../../../components/Stepper/AgentSteps';
import {
  useGetSingleAgentDataQuery,
  useUpdateAgentMutation,
} from '../../../../../redux/api/superadmin/agent/agentManagementSlice';
import {
  useGetActiveBranchListDataQuery,
} from '../../../../../redux/api/superadmin/branch/Branchmanagementslice';
import {
  useGetOptionalPlanListDataQuery,
  useGetPlanListDataQuery,
} from '../../../../../redux/api/superadmin/plan-management/planManagementSlice';

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
  branchId?: number;
}

interface OptionalPlan {
  id: number;
  name: string;
  price: number;
}


const EditAgent: React.FC = () => {
  const { uuid } = useParams();
  const { data: agentData, isFetching } = useGetSingleAgentDataQuery(
    uuid || ""
  );
  const { data: planData } = useGetPlanListDataQuery("");
  const { data: optionalPlanData } = useGetOptionalPlanListDataQuery("");
  const [updateAgent] = useUpdateAgentMutation();
  
  const { data: activeBranches, isLoading: branchesLoading } =
    useGetActiveBranchListDataQuery("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [specialNote, setSpecialNote] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedOptionalPlans, setSelectedOptionalPlans] = useState<number[]>(
    []
  );
  const navigate = useNavigate();
  const {
    register,
    formState: { errors },
    reset,
    getValues,
    setError,
    handleSubmit,
    setValue,
    watch,
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
    if (agentData && agentData.data) {

      const agent = agentData.data.agentDetails.agentAccount[0];
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
          ? optionalPlanData?.data?.optionalPlans.filter((plan: OptionalPlan) =>
              planArray.includes(Number(plan.id))
            )
          : [];
      setSpecialNote(agent.special_note || "");
      setSelectedPlanId(agent.planId || null);
      setSelectedOptionalPlans(filteredOptionalPlans || []);
      
      if (agent.branchId) {
        setValue("branchId", agent.branchId);
      }
    }
  }, [agentData, reset, optionalPlanData?.data?.optionalPlans, setValue]);

  const onSubmit = async () => {
    setIsUpdating(true);
    const data = getValues();

    try {
      const response = (await updateAgent({ uuid, data })) as any;

      if (response?.error) {
        setIsUpdating(false);
        response.error.data.errors?.forEach((error: any) => {
          setError(error.path, { type: "manual", message: error.msg });
        });
        toast.error(response.error.data.message || "Error updating agent");
      } else {

        toast.success(response?.data?.message || "Agent updated successfully");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePlanSelect = (planId: number) => {
    setValue("planId", planId);
    setSelectedPlanId(planId);
  };

  const handleOptionalPlanChange = (planId: number) => {
    setSelectedOptionalPlans((prevState) =>
      prevState.includes(planId)
        ? prevState.filter((id) => id !== planId)
        : [...prevState, planId]
    );
  };

  if (isFetching) {
    return <TableLoader />;
  }

  return (
    <div className="pb-32">
      <h1>Edit Agent</h1>
      <AgentSteps active={1} uuid={uuid} />

      <form className="space-y-3 my-4" onSubmit={handleSubmit(onSubmit)}>
        <AgentForm
          statusOptions={statusOptions}
          specialNote={specialNote}
          handleChange={(value) => {
            setValue("special_note", value);
            setSpecialNote(value);
          }}
          register={register}
          errors={errors}
          isEditMode={!!uuid}
          setValue={setValue}
          watch={watch}
          profilePicture={agentData?.data?.agentDetails?.profilePicture}
          activeBranches={activeBranches}
          branchesLoading={branchesLoading}
        />
        
        <button
          type="submit"
          className="primary-btn mx-3"
          disabled={isUpdating}
        >
          {isUpdating ? <ButtonLoader /> : "Save & Next"}
        </button>
      </form>
    </div>
  );
};

export default EditAgent;

