import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import AgentDocument from "../../../../../components/dashboard/Agent/AgentDocument";
import { useGetSingleAgentDataQuery } from "../../../../../redux/api/superadmin/agent/agentManagementSlice";
import TableLoader from "../../../../../components/loader/TableLoader";
import toast from "react-hot-toast";
import AgentSteps from "../../../../../components/Stepper/AgentSteps";


const AgentFileUpload: React.FC = () => {
    const { uuid } = useParams<{ uuid: string }>();

    const { data, isLoading } = useGetSingleAgentDataQuery(uuid || "");
    const navigate = useNavigate();
    const agentAccount = data?.data?.agentDetails?.agentAccount?.[0];
    const handleSaveAndNext = () => {
        toast.success("Agent Account Create Success");
        navigate("/dashboard/super-admin/agent-management");
    };
    return (
        <div>
            <AgentSteps active={3} uuid={uuid} />
            <div className="bg-white p-4 rounded-md my-4">
                <div>
                    {isLoading && <TableLoader />}
                    {!isLoading && agentAccount ? (
                        <AgentDocument agentAccount={agentAccount} />
                    ) : (
                        <AgentDocument agentAccount={agentAccount } />
                    )}
                </div>
                <div className="mt-4">
                    <button
                        type="button"
                        className="primary-btn mx-3"
                        onClick={handleSaveAndNext}
                    >
                        Save & Finish
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AgentFileUpload;
