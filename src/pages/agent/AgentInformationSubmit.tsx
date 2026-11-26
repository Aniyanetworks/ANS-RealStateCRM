// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useEffect, useRef, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  useGetSingleAgentDataQuery,
  useSubmitAgentInfoMutation,

} from "../../redux/api/superadmin/agent/agentManagementSlice";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { setUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import SignatureCanvas from 'react-signature-canvas';
import {
  useGetOptionalPlanListDataQuery,
  useGetPlanListDataQuery
} from "../../redux/api/superadmin/plan-management/planManagementSlice";
import AgentDocument from "../../components/dashboard/Agent/AgentDocument";
import SelectPlan from "../../components/dashboard/Agent/SelectPlan";
import AddonsPlanSelector from "../../components/dashboard/Agent/SelectAddonPlan";
import { formatPhoneNumber } from "../../utils/format";
import { baseUrl, getFileUrl } from "../../utils/constant";
import { Plan } from "../super-admin/dashboard/pages/plan-management/types";
import SelectedDiscount from "../../components/dashboard/Agent/SelectedDiscount";
import AgentSelectedPlanDiscountAddon from "../../components/dashboard/Agent/AgentSelectedPlanDiscountAddon";
import { Select } from "antd";

interface AgentAccount {
  id: number;
  planId: number;
  plan: Plan;
  key?: React.Key;
  uuid: string;
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
  designation: string;
  remarks: string;
  status: string;
  agreementStatus: string;
  createdAt: string;
  special_note: string;
  fileUpload: string;
  user: { uuid: string };
  optionalPlanId: string;
}

const AgentInformationSubmit = () => {

  const { user } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const [submitAgentInfo] = useSubmitAgentInfoMutation();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
    getValues,
    setError,
  } = useForm();

  const [agentAccount, setAgentAccount] = useState<AgentAccount | null>(null);

  const { data: agentData, refetch } = useGetSingleAgentDataQuery(user.uuid);
  const { data: planData } = useGetPlanListDataQuery("");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const { data: optionalPlanData } = useGetOptionalPlanListDataQuery('');
  const signatureRef = useRef({});
  const [uploadSignatureImage, setUploadSignatureImage] = useState("");
  const [cellPhone, setCellPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const agreementRoutes = useMemo(() => ({
    '1': '/agent/agent-agreeement-page-one',
    '2': '/agent/agent-agreeement-page-two',
    '3': '/agent/agent-agreeement-page-three',
    '4': '/agent/agent-agreeement-page-four',
    '5': '/agent/agent-agreeement-page-five',
    '6': '/agent/agent-agreeement-page-six',
    '7': '/agent/agent-agreeement-page-seven',
  }), []);

  useEffect(() => {
    if (agentData?.data?.agentDetails?.agentAccount?.length > 0) {
      const agentAc = agentData.data.agentDetails.agentAccount[0];
      reset(agentAc);
      const formattedDob = agentAc.dob ? new Date(agentAc.dob).toISOString().split('T')[0] : '';
      const formattedRecoExpiryDate = agentAc.recoExpiryDate ? new Date(agentAc.recoExpiryDate).toISOString().split('T')[0] : '';
      setValue("dob", formattedDob);
      setValue("recoExpiryDate", formattedRecoExpiryDate);
      setAgentAccount(agentAc);
      setCellPhone(agentAc.cellPhone);
      setEmergencyContact(agentAc.emergencyContact);
      setSelectedPlanId(agentAc.planId);
      setSelectedOptionalPlans(agentAc?.optionalPlanId?.split(',').map((id: string) => parseInt(id, 10)) || []);
    }

  }, [agentData, reset, setValue, agreementRoutes, user]);


  const onSubmit = async () => {

    const data = getValues();

    try {
      const response = await submitAgentInfo(data).unwrap();
      if (response.status == true) {
        dispatch(setUser(response.data.updatedUser));

        setAgentAccount(response.data.updatedUser.agentAccount);
        toast.success("Agent account created successfully!");
        await refetch();
      } else {
        toast.error(response.message || "Failed to create agent account.");
      }
    } catch (error) {
      toast.error("An error occurred while creating the account.");
      console.error("Error creating agent account:", error);
    }
  };

  const handlePlanSelect = (planId: number) => {
    setValue("planId", planId)
    setSelectedPlanId(planId);
  };

  const [selectedOptionalPlans, setSelectedOptionalPlans] = useState<number[]>([]);
  const handleOptionalPlanChange = (planId: number) => {
    setSelectedOptionalPlans(prevState =>
      prevState.includes(planId)
        ? prevState.filter(id => id !== planId)
        : [...prevState, planId]
    );
  };

  const [uploadInitialImage, setUploadInitialImage] = useState<string | null>('');

  const initialRef = useRef<SignatureCanvas | null>(null);

  const handleChangeSignatureImage = (e: React.ChangeEvent<HTMLInputElement>, type: 'signature' | 'initial') => {
    const file = e.target.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'signature') {
          setUploadSignatureImage(base64String);
          setValue('signature', base64String)
        } else {
          setUploadInitialImage(base64String);
          setValue('initial', base64String)
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const clear = (type: 'signature' | 'initial') => {
    if (type === 'signature' && signatureRef.current) {
      (signatureRef.current as SignatureCanvas).clear();
    } else if (type === 'initial' && initialRef.current) {
      (initialRef.current as SignatureCanvas).clear();
    }
  };

  const save = (type: 'signature' | 'initial') => {
    let dataUrl = '';
    if (type === 'signature' && signatureRef.current) {
      dataUrl = (signatureRef.current as SignatureCanvas).getTrimmedCanvas().toDataURL("image/png");
      setUploadSignatureImage(dataUrl);
      setValue('signature', dataUrl)
    } else if (type === 'initial' && initialRef.current) {
      dataUrl = (initialRef.current as SignatureCanvas).getTrimmedCanvas().toDataURL("image/png");
      setUploadInitialImage(dataUrl);
      setValue('initial', dataUrl)
    }
  };

  const handleRemoveImage = (type: 'signature' | 'initial') => {
    if (type === 'signature') {
      setUploadSignatureImage('');
      setValue('signature', '');
    } else {
      setUploadInitialImage('');
      setValue('initial', '');
    }
  };

  const handleChangeCellPhone = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setError('cellPhone', { type: 'manual', message: '' });
    const cellPhone = e.target.value;
    const value = formatPhoneNumber(cellPhone);
    setCellPhone(value);
  };
  const handleChangeEmergencyContact = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setError('emergencyContact', { type: 'manual', message: '' });
    const emergencyContact = e.target.value;
    const value = formatPhoneNumber(emergencyContact);
    setEmergencyContact(value);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Agent Account Details</h1>
      {agentAccount?.status === "underReview" ? (
        <div>
          <h1>
            Thank you for submitting all information . Please wait for admin
            approval.
          </h1>
        </div>
      ) : (
        <div className="max-w-full mt-4 p-8 border bg-white rounded-md border-2">
          {agentAccount?.status === "pending" &&
            agentAccount?.agreementStatus === "pending" && (
              <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("firstName", {
                          required: "First name is required",
                        })}
                        className={`border p-2 w-full ${
                          errors.firstName
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.firstName && (
                        <p className="text-red-500">First name is required</p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("lastName", {
                          required: "Last name is required",
                        })}
                        className={`border p-2 w-full ${
                          errors.lastName ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.lastName && (
                        <p className="text-red-500">Last name is required</p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1">
                        Email <span className="text-red-500">*</span>
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
                        className={`border p-2 w-full ${
                          errors.email ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.email && (
                        <p className="text-red-500">Email is required</p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("address", {
                          required: "Address is required",
                        })}
                        className={`border p-2 w-full ${
                          errors.address ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.address && (
                        <p className="text-red-500">Address is required</p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1">
                        Cell Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("cellPhone", {
                          required: "Cell phone is required",
                        })}
                        onChange={handleChangeCellPhone}
                        value={cellPhone}
                        className={`border p-2 w-full ${
                          errors.cellPhone
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.cellPhone && (
                        <p className="text-red-500">
                          {errors.cellPhone.message as string}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1">PREC Name (if any)</label>
                      <input
                        type="text"
                        {...register("precName", { required: false })}
                        className={`border p-2 w-full ${
                          errors.precName ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                    </div>


                    <div>
                      <label className="block mb-1">
                        RECO Reg Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("recoRegNumber", {
                          required: "Reco reg number is required",
                        })}
                        className={`border p-2 w-full ${
                          errors.recoRegNumber
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.recoRegNumber && (
                        <p className="text-red-500">
                          RECO reg number is required
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1">RECO Expiry Date</label>
                      <input
                        type="date"
                        {...register("recoExpiryDate")}
                        className={`border p-2 w-full border-gray-300 bg-gray-100`}
                      />
                    </div>

                    <div>
                      <label>TRREB Member ID</label>
                      <input
                        type="text"
                        {...register("trrebMemberId")}
                        className={`border p-2 w-full ${
                          errors.trrebMemberId
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.trrebMemberId && (
                        <p className="text-red-500">
                          TRREB member id is required
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1">
                        SIN <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("sin", { required: "SIN is required" })}
                        className={`border p-2 w-full ${
                          errors.sin ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.sin && (
                        <p className="text-red-500">SIN is required</p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        {...register("dob", {
                          required: "Date of birth is required",
                        })}
                        className={`border p-2 w-full ${
                          errors.dob ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.dob && (
                        <p className="text-red-500">
                          Date of birth is required
                        </p>
                      )}
                    </div>

                    <div>
                      <label>Emergency Contact</label>
                      <div className="flex">
                        <input
                          type="text"
                          {...register("emergencyUser")}
                          placeholder="Name"
                          className={`border p-2 w-1/2 ${
                            errors.emergencyUser
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        <input
                          type="text"
                          {...register("emergencyContact")}
                          onChange={handleChangeEmergencyContact}
                          placeholder="Number"
                          value={emergencyContact}
                          className={`border p-2 w-1/2 ${
                            errors.emergencyContact
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1">
                        HST Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("hstNo", {
                          required: "HST number is required",
                        })}
                        className={`border p-2 w-full ${
                          errors.hstNo ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.hstNo && (
                        <p className="text-red-500">HST number is required</p>
                      )}
                    </div>

                    <div>
                      <label>PREC HST Number</label>
                      <input
                        type="text"
                        {...register("precHstNo")}
                        className={`border p-2 w-full ${
                          errors.precHstNo
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block mb-1">
                        Expected Gross <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        {...register("expectedGross", {
                          required: "Expected gross is required",
                        })}
                        className={`border p-2 w-full ${
                          errors.expectedGross
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.expectedGross && (
                        <p className="text-red-500">
                          Expected gross is required
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block mb-1">
                        Designation <span className="text-red-500">*</span>
                      </label>
                     <select
                        {...register("designation", {
                          required: "Designation is required",
                        })}
                        className="border p-2 rounded w-full"
                      >
                        <option value="">Select Designation</option>
                        <option value="Sales Representative">Sales Representative</option>
                        <option value="Broker">Broker</option>
                        <option value="Broker of Record">Broker of Record</option>
                        <option value="Branch Manager">Branch Manager</option>
                      </select>

                      {errors.desegnation && (
                        <p className="text-red-500">Designation is required</p>
                      )}
                    </div>
                  </div>
                  <div className="p-5 my-4 border">
                    <label className="block text-md font-bold mb-1">
                      Special Note :
                    </label>
                    <p
                      dangerouslySetInnerHTML={{
                        __html: agentAccount?.special_note,
                      }}
                    ></p>
                  </div>


                    <AgentSelectedPlanDiscountAddon agentAccount={agentAccount} />
                    <div>
                  </div>

                  <div className="my-10">
                    <AgentDocument agentAccount={agentAccount} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full p-5">
                    <div>
                      <div className="flex flex-col gap-2 my-3">
                        <label>Signature Draw</label>
                        <div className="border border-gray-400 rounded p-2 w-full max-w-[300px] h-[40vh] sm:h-[200px]">
                          <SignatureCanvas
                            ref={
                              signatureRef as React.RefObject<SignatureCanvas>
                            }
                            penColor="black"
                            canvasProps={{
                              width: 300,
                              height: 200,
                              className:
                                "w-full max-w-[300px] h-[40vh] sm:h-[200px]",
                            }}
                          />
                        </div>
                        <div className="flex gap-5 mt-2">
                          <button
                            type="button"
                            onClick={() => clear("signature")}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 w-full sm:w-auto"
                          >
                            Clear
                          </button>
                          <button
                            type="button"
                            className="primary-btn px-4 py-2 rounded w-full sm:w-auto"
                            onClick={() => save("signature")}
                          >
                            Save Signature
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage("signature")}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 w-full sm:w-auto"
                          >
                            ✖ Reset
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2">Signature Upload</p>
                        <label className="flex justify-center items-center py-2 border border-dashed border-gray-400 rounded-md gap-2 hover:border-blue-500 cursor-pointer w-[300px]">
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) =>
                              handleChangeSignatureImage(e, "signature")
                            }
                            accept="image/*"
                          />
                          <span>Upload files</span>
                        </label>

                        {uploadSignatureImage ? (
                          <div className="mt-4">
                            <img
                              src={uploadSignatureImage}
                              alt="Signature Upload"
                              className="w-[300px]"
                            />
                          </div>
                        ) : user.signature ? (
                          <div className="mt-4">
                            <img
                              src={getFileUrl(user.signature)}
                              alt="Signature Upload"
                              className="w-[300px]"
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-col gap-2 my-3">
                        <label>Initial Draw</label>
                        <div className="border border-gray-400 rounded p-2 w-full max-w-[300px] h-[40vh] sm:h-[200px]">
                          <SignatureCanvas
                            ref={initialRef}
                            penColor="black"
                            canvasProps={{
                              width: 300,
                              height: 200,
                              className:
                                "w-full max-w-[300px] h-[40vh] sm:h-[200px]",
                            }}
                          />
                        </div>
                        <div className="flex gap-5 mt-2">
                          <button
                            type="button"
                            onClick={() => clear("initial")}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                          >
                            Clear
                          </button>
                          <button
                            type="button"
                            className="primary-btn"
                            onClick={() => save("initial")}
                          >
                            Save Initial
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage("initial")}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 w-full sm:w-auto"
                          >
                            ✖ Reset
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2">Initial Upload</p>
                        <label className="flex justify-center items-center py-2 border border-dashed border-gray-400 rounded-md gap-2 hover:border-blue-500 cursor-pointer w-[300px]">
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) =>
                              handleChangeSignatureImage(e, "initial")
                            }
                            accept="image/*"
                          />
                          <span>Upload files</span>
                        </label>
                        {uploadInitialImage ? (
                          <div className="mt-4">
                            <img
                              src={uploadInitialImage}
                              alt="Initial Upload"
                              className="w-[300px]"
                            />
                          </div>
                        ) : user.initial ? (
                          <div className="mt-4">
                            <img
                              src={getFileUrl(user.initial)}
                              alt="Initial Upload"
                              className="w-[300px]"
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="primary-btn">
                    Save
                  </button>
                </div>
              </form>
            )}

          {agentAccount?.status === "approved" &&(
              <div className="mt-4">
                <h4>
                  Congratulation! Your  account details are approved. Please logout
                  and login again to access your full dashboard.
                </h4>
              </div>
            )}

          {agentAccount?.status === "approved" &&
            agentAccount?.agreementStatus === "underReview" && (
              <div className="mt-4">
                <h4>
                  Your Agreement is under review. Please wait until approved.
                </h4>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default AgentInformationSubmit;