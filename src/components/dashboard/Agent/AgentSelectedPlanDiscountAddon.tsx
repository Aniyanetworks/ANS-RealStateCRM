// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import { Tag } from 'antd';
import toast from 'react-hot-toast';
import { FaTimes } from 'react-icons/fa';

import sortArrow from '../../../assets/table-head-arrow.svg';
import uploadIcon from '../../../assets/upload2.svg';
import {
  useGetAgentOtherDocumentsQuery,
  useRemoveAgentFileMutation,
  useRemoveOtherFileMutation,
  useUploadAgentAttachmentMutation,
} from '../../../redux/api/superadmin/agent/agentManagementSlice';
import { baseUrl } from '../../../utils/constant';
import ButtonLoader from '../../loader/buttonLoader';
import { useGetOptionalPlanListDataQuery } from '../../../redux/api/superadmin/plan-management/planManagementSlice';
import SelectedPlansDisplay from './SelectedPlan';
import SelectedAddonsPlans from './SelectedAddonPlan';
import TableLoader from '../../loader/TableLoader';
import SelectedDiscount from './SelectedDiscount';

type FileKeys =
  | "nationalIdentity"
  | "recoLicence"
  | "agreementFile"
  | "previousRegistration"
  | "others";

type AgentDocumentProps = {
  agentAccount?: any;
  mode?: string;
};

const AgentSelectedPlanDiscountAddon: React.FC<AgentDocumentProps> = ({
  agentAccount,
  mode,
}) => {
  const [otherDocumentName, setOtherDocumentName] = useState("");
  const [isUploadingOther, setIsUploadingOther] = useState(false);
  const [isUploading, setIsUploading] = useState<
    Record<FileKeys, boolean> | any
  >({});
  const [agentAccountInfo, setAgentAccount] = useState<any>(null);
  const [agentAccountInfoForFile, setAgentAccountForFile] = useState<any>(null);

  const { data: agentOtherDocuments, refetch: refetchOtherDocuments } =
    useGetAgentOtherDocumentsQuery(agentAccount?.id);

  const [uploadAgentAttachment] = useUploadAgentAttachmentMutation();
  const [removeAgentFile] = useRemoveAgentFileMutation();
  const [removeOtherFile] = useRemoveOtherFileMutation();

  const fileRefs: Record<FileKeys, React.RefObject<HTMLInputElement>> = {
    nationalIdentity: useRef<HTMLInputElement>(null),
    recoLicence: useRef<HTMLInputElement>(null),
    agreementFile: useRef<HTMLInputElement>(null),
    previousRegistration: useRef<HTMLInputElement>(null),
    others: useRef<HTMLInputElement>(null),
  };

  const fileFields: { key: FileKeys; label: string }[] = [
    { label: "Government Issued ID", key: "nationalIdentity" },
    {
      label: "Previous Brokerage Registration Letter",
      key: "previousRegistration",
    },
    { label: "RECO Licence", key: "recoLicence" },
    { label: "Agreement File", key: "agreementFile" },
  ];

    const { data: optionalPlanData,isFetching } = useGetOptionalPlanListDataQuery("");
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optionalPlans, setOptionalPlans] = useState<OptionalPlan[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  useEffect(() => {
    if (agentAccount) {
      setAgentAccount(agentAccount);
      setPlan(agentAccount?.plan);

      const planArray = agentAccount.optionalPlanId
      ? agentAccount.optionalPlanId.split(",").map(Number)
      : [];
      const filteredOptionalPlans =
      planArray && optionalPlanData?.data?.optionalPlans
        ? optionalPlanData?.data?.optionalPlans.filter((plan: OptionalPlan) =>
            planArray.includes(Number(plan.id))
          )
        : [];
    setOptionalPlans(filteredOptionalPlans);
    }
  }, [agentAccount,optionalPlans,plan,setAgentAccount,setPlan,setOptionalPlans,agentOtherDocuments]);



  const handleDocumentPreview = (document: any) => {
    setSelectedDocument(document);
    setLoading(true);
    setError(null);
  };

  const handleDocumentDownload = async (filePath: string) => {
    try {
      const response = await fetch(`${baseUrl}${filePath}`);
      if (!response.ok) throw new Error("Failed to fetch document");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filePath.split("/").pop() || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the document:", error);
      toast.error("Failed to download document");
    }
  };
  if (isFetching) return <div><TableLoader/></div>;
  return (
    <div className="grid grid-cols-2 gap-4 w-full p-5 border">
    <SelectedPlansDisplay plan={plan as any} />
    <SelectedDiscount agentAccount={agentAccount} />
    <SelectedAddonsPlans
      optionalPlans={optionalPlans as OptionalPlan[]}
    />
  </div>
  );
};

export default AgentSelectedPlanDiscountAddon;
