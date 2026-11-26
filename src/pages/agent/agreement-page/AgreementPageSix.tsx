// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../redux/hooks";
import { getFileUrl } from "../../../utils/constant";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { 
  useGetOptionalPlanListDataQuery,
 } from "../../../redux/api/superadmin/plan-management/planManagementSlice";
import { useChangeAgreementStepMutation, useGetSingleAgentDataQuery } from "../../../redux/api/superadmin/agent/agentManagementSlice";
import SelectedDiscount from "../../../components/dashboard/Agent/SelectedDiscount";
import SelectedPlansDisplay from "../../../components/dashboard/Agent/SelectedPlan";
import SelectedAddonsPlans from "../../../components/dashboard/Agent/SelectedAddonPlan";

const AgreementPageSix = () => {

  const { user } = useAppSelector((state) => state.user);
  const navigate = useNavigate();
  const { data: optionalPlanData } = useGetOptionalPlanListDataQuery("");
  const [agent, setAgent] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [optionalPlans, setOptionalPlans] = useState<any[]>([]);
  const [changeAgreementStep] = useChangeAgreementStepMutation();

  const { data: agentData } = useGetSingleAgentDataQuery(user.uuid);

  useEffect(() => {
    if (agentData?.data?.agentDetails?.agentAccount?.length > 0) {
      let agentAc = agentData.data.agentDetails.agentAccount[0];
      const agentPlan = agentAc.plan;
      setPlan(agentPlan || null);
      setAgent(agentAc)
      const planArray = agentAc.optionalPlanId ? agentAc.optionalPlanId.split(",").map(Number) : [];
      const filteredOptionalPlans = optionalPlanData?.data?.optionalPlans
        ? optionalPlanData.data.optionalPlans.filter((plan: any) => planArray.includes(Number(plan.id)))
        : [];
      setOptionalPlans(filteredOptionalPlans);
    } else {
      setPlan(null);
    }

  }, [agentData, optionalPlanData]);

  const handleChangeStep = async () => {
    const res = await changeAgreementStep( {       
      step: 7,
      id: user.agentAccount[0].id,
    });
    if(res){
      toast.success("Agreement save successfully!");
      navigate('/agent/agent-agreeement-page-seven', { replace: true });
    }

  }

  return (
    <div className="max-w-[850px] mx-auto p-8 bg-white">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 border border-gray-300">
          <img
            src="/logo.svg"
            alt="ANS RealStateCRM Inc. Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold">ANS REALSTATECRM INC.</h1>
          <h2 className="text-lg">INDEPENDENT CONTRACTOR&apos;S AGREEMENT</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full p-5 border">
        <SelectedPlansDisplay plan={plan as any} />
        <SelectedDiscount agentAccount={agent} />
        <SelectedAddonsPlans optionalPlans={optionalPlans as OptionalPlan[]} />
      </div>
      <div className="p-5 my-4 border">
        <label className="block text-md font-bold mb-1">Special Note :</label>
        <p dangerouslySetInnerHTML={{ __html: agent?.special_note }}></p>
      </div>

      <div className="flex justify-between items-center mt-12">
        <p className="text-sm">Page 6 of 7</p>
        <div className="flex gap-4">
          <div className="border border-black rounded-md w-16 h-12 flex items-center justify-center">
            <img src={getFileUrl(user?.initial)} alt="" />
          </div>
          <div className="border border-black rounded-md w-16 h-12 flex items-center justify-center">
            {agent?.agreementStatus === "approved" && (
              <img src={getFileUrl(agent?.approvedUser?.signature)} alt="" />
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-5">
        <button onClick={handleChangeStep} className="primary-btn">
          Save & Finish
        </button>
      </div>
    </div>
  );
}

export default AgreementPageSix;

