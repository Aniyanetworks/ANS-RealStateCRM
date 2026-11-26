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
  useCreateAgentMutation,
  useGetSingleAgentDataQuery,
  useUpdateAgentMutation,
} from '../../../../../redux/api/superadmin/agent/agentManagementSlice';
import {
  useGetActiveBranchListDataQuery,
} from '../../../../../redux/api/superadmin/branch/Branchmanagementslice';
import { useAppSelector } from '../../../../../redux/hooks';

// Type definitions
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
  nationalIdentity?: string;
  recoLicence?: string;
  previousRegistration?: string;
  agreementFile?: string;
  password?: string;
  confirmPassword?: string;
  branchId?: number;
}

const CreateNewAgent: React.FC = () => {
  const { user } = useAppSelector((state) => state.user);
  const [isUploading, setIsUploading] = useState(false);
  const [specialNote, setSpecialNote] = useState("");
  const [selectedOptionalPlans, setSelectedOptionalPlans] = useState<number[]>(
    []
  );
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid?: string }>();
  const { data: agentData, isFetching } = useGetSingleAgentDataQuery(
    uuid || ""
  );
  const [createAgent] = useCreateAgentMutation();
  const [updateAgent] = useUpdateAgentMutation();
  
  // Fetch active branches
  const { data: activeBranches, isLoading: branchesLoading } =
    useGetActiveBranchListDataQuery("");

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
    if (
      agentData &&
      agentData.data &&
      agentData?.data?.agentDetails?.agentAccount
    ) {
      const agent = agentData?.data?.agentDetails?.agentAccount[0];
      const formattedRecoExpiryDate = agent.recoExpiryDate
        ? agent.recoExpiryDate.split("T")[0]
        : "";
      const formattedAgrementExpiryDate = agent.agrementExpiryDate
        ? agent.agrementExpiryDate.split("T")[0]
        : "";
      const formattedDob = agent.dob ? agent.dob.split("T")[0] : "";
      reset({
        ...agent,
        recoExpiryDate: formattedRecoExpiryDate,
        agrementExpiryDate: formattedAgrementExpiryDate,
        dob: formattedDob,
      });

      setSpecialNote(agent.special_note || "");
      
      // Set branchId if exists
      if (agent.branchId) {
        setValue("branchId", agent.branchId);
      }
    }
  }, [agentData, reset, setValue]);

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
      agrementExpiryDate:""
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

    // Combine form data with file data
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
          console.log(response?.data?.data?.agentData?.uuid);
          navigate(
            `/dashboard/super-admin/agent-plan/${response?.data?.data?.agentData?.uuid}`,
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
    } else {
      try {
        if(user.userType === "superAdmin" || user.userType === "admin"){
          submissionData.status = "approved";
          submissionData.agreementStatus =  "approved";
        } 

        console.log("Submission Data:", submissionData);

        const response = (await createAgent(submissionData)) as any;

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
            `/dashboard/super-admin/agent-plan/${response?.data?.data?.agentData?.uuid}`,
            { replace: true }
          );
          setIsUploading(false);
        } else {
          setIsUploading(false);
        }
      } catch (error) {
        console.error("Submission error:", error);
        setIsUploading(false);
      }
    }
  };

  if (isFetching) {
    return <TableLoader />;
  }

  return (
    <div>
      <h1>Create New Agent</h1>
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
          disabled={isUploading}
        >
          {isUploading ? <ButtonLoader /> : "Save & Next"}
        </button>
      </form>
    </div>
  );
};

export default CreateNewAgent;
