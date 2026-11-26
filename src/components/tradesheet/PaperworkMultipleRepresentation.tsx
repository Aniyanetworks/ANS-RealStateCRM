// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useParams } from "react-router-dom";
import { useGetSpacificTradeSheetListDataQuery } from "../../redux/api/agent/trade-sheet/tradeSheetSlice";
import { useEffect, useState } from "react";
import TableLoader from "../loader/TableLoader";
import { Tabs } from "antd";
import DynamicPaperwork from "./DynamicPaperwork";
import { formatStringCamelCasecapitalize } from "../../utils/stringUtils";
import { useAppSelector } from "../../redux/hooks";

const PaperworkMultipleRepresentation = () => {
  const { uuid } = useParams<{ uuid?: string }>();
  const [missingFiles, setMissingFiles] = useState<object[]>([]);
  const [multipleRepresentation, setMultipleRepresentation] = useState<string[]>([]);
  const [representation, setRepresentation] = useState<string | null>(null);
  
  const { user } = useAppSelector((state) => state.user);

  const { data: spacificTradeSheetLisData, isLoading } =
    useGetSpacificTradeSheetListDataQuery(uuid);

  useEffect(() => {
    if (spacificTradeSheetLisData?.data?.tradeSheetData?.multipleRepresentation) {
      const multipleRepresentationArray =
        spacificTradeSheetLisData.data.tradeSheetData.multipleRepresentation.split(",");
      
      const agentRepresentations = filterAgentRepresentations(
        multipleRepresentationArray, 
        user, 
        spacificTradeSheetLisData.data.tradeSheetData
      );
      
      setMultipleRepresentation(agentRepresentations);
      setRepresentation(agentRepresentations[0] || null);
    }
  }, [spacificTradeSheetLisData, user]);

  const filterAgentRepresentations = (representations, user, record) => {
    if (user?.userType !== "agent") {
      return representations;
    }

    const currentAgentId = user.agentAccount[0]?.id;
    if (!currentAgentId) return [];

    const agentRepresentations = [];

    if (record.seller_landlord_agent_id && 
        currentAgentId == record.seller_landlord_agent_id) {
      if (representations.includes("seller")) {
        agentRepresentations.push("seller");
      }
      if (representations.includes("landlord")) {
        agentRepresentations.push("landlord");
      }
    }

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

  if (user?.userType === "agent" && multipleRepresentation.length === 0) {
    return <div>No representations found for your account.</div>;
  }

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