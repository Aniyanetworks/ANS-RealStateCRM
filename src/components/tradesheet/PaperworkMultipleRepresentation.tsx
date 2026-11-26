// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useParams } from "react-router-dom";
import { useGetSpacificTradeSheetListDataQuery } from "../../redux/api/agent/trade-sheet/tradeSheetSlice";
import { useEffect, useState } from "react";
import TableLoader from "../loader/TableLoader";
import { Tabs } from "antd";
import DynamicPaperwork from "./DynamicPaperwork";
import { formatStringCamelCasecapitalize } from "../../utils/stringUtils";
import { useAppSelector } from "../../redux/hooks"; // Adjust import path as needed

const PaperworkMultipleRepresentation = () => {
  const { uuid } = useParams<{ uuid?: string }>();
  const [missingFiles, setMissingFiles] = useState<object[]>([]);
  const [multipleRepresentation, setMultipleRepresentation] = useState<string[]>([]);
  const [representation, setRepresentation] = useState<string | null>(null);
  
  // Get user from Redux store
  const { user } = useAppSelector((state) => state.user);

  // Fetch data using a query hook
  const { data: spacificTradeSheetLisData, isLoading } =
    useGetSpacificTradeSheetListDataQuery(uuid);

  useEffect(() => {
    if (spacificTradeSheetLisData?.data?.tradeSheetData?.multipleRepresentation) {
      const multipleRepresentationArray =
        spacificTradeSheetLisData.data.tradeSheetData.multipleRepresentation.split(",");
      
      // Filter representations based on agent's role
      const agentRepresentations = filterAgentRepresentations(
        multipleRepresentationArray, 
        user, 
        spacificTradeSheetLisData.data.tradeSheetData
      );
      
      setMultipleRepresentation(agentRepresentations);
      setRepresentation(agentRepresentations[0] || null);
    }
  }, [spacificTradeSheetLisData, user]); // Added user as dependency

  // Function to filter representations for the current agent
  const filterAgentRepresentations = (representations, user, record) => {
    // If user is not an agent, return all representations
    if (user?.userType !== "agent") {
      return representations;
    }

    const currentAgentId = user.agentAccount[0]?.id;
    if (!currentAgentId) return [];

    const agentRepresentations = [];

    // Check if agent is seller/landlord agent
    if (record.seller_landlord_agent_id && 
        currentAgentId == record.seller_landlord_agent_id) {
      if (representations.includes("seller")) {
        agentRepresentations.push("seller");
      }
      if (representations.includes("landlord")) {
        agentRepresentations.push("landlord");
      }
    }

    // Check if agent is buyer/tenant agent
    if (record.buyer_tenant_agent_id && 
        currentAgentId == record.buyer_tenant_agent_id) {
      if (representations.includes("buyer")) {
        agentRepresentations.push("buyer");
      }
      if (representations.includes("tenant")) {
        agentRepresentations.push("tenant");
      }
    }

    return agentRepresentations;
  };

  if (isLoading) {
    return <TableLoader />;
  }

  // Don't show anything if no representations for the agent
  if (user?.userType === "agent" && multipleRepresentation.length === 0) {
    return <div>No representations found for your account.</div>;
  }

  // For non-agents, show all representations
  const displayRepresentations = user?.userType === "agent" 
    ? multipleRepresentation 
    : (spacificTradeSheetLisData?.data?.tradeSheetData?.multipleRepresentation?.split(",") || []);

  if (displayRepresentations.length === 0) {
    return <div>No representations found.</div>;
  }

  return (
    <div className="">
      <div>
        <Tabs
          defaultActiveKey={representation || displayRepresentations[0]}
          type="card"
          items={displayRepresentations.map((tab) => {
            return {
              label: formatStringCamelCasecapitalize(tab),
              key: tab,
            };
          })}
          onChange={(key) => {
            setRepresentation(key);
          }}
        />
      </div>
      <div>
        <DynamicPaperwork
          dynamicRepresentation={representation}
          missingFiles={missingFiles}
          setMissingFiles={setMissingFiles}
        />
      </div>
    </div>
  );
};

export default PaperworkMultipleRepresentation;