/* eslint-disable @typescript-eslint/no-explicit-any */
import { useGetApprovedAgetsQuery } from "../../redux/api/dashboard/dashboardSlice";
import TableLoader from "../loader/TableLoader";
import AgentCard from "./AgentCard";

const NewAgent = () => {
  const { data, isLoading } = useGetApprovedAgetsQuery("");

  const recentAgents = data?.data?.agents?.slice(0, 4) || [];

  if (!isLoading && recentAgents.length === 0) {
    return null;
  }

  return (
    <div>
      {isLoading ? (
        <TableLoader />
      ) : (
        <div>
          {recentAgents.map((agent: any) => (
            <AgentCard key={agent.id} agentData={agent} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NewAgent;
