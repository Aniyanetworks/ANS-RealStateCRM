/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import sortArrow from "../../../assets/table-head-arrow.svg";
import uploadIcon from "../../../assets/upload2.svg";
import toast from "react-hot-toast";
import ButtonLoader from "../../loader/buttonLoader";
import {
  useGetAgentOtherDocumentsQuery,
  useRemoveAgentFileMutation,
  useRemoveOtherFileMutation,
  useUploadAgentAttachmentMutation,
} from "../../../redux/api/superadmin/agent/agentManagementSlice";
import { NavLink } from "react-router-dom";
import { baseUrl } from "../../../utils/constant";
import { FaTimes } from "react-icons/fa";
import { Tag } from "antd";

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

const AgentDocument: React.FC<AgentDocumentProps> = ({
  agentAccount,
  mode,
}) => {
  const [otherDocumentName, setOtherDocumentName] = useState("");
  const [isUploadingOther, setIsUploadingOther] = useState(false);
  const [isUploading, setIsUploading] = useState<
    Record<FileKeys, boolean> | any
  >({});
  const [agentAccountInfo, setAgentAccount] = useState<any>(null);

  // Fetch and manage other documents
  const { data: agentOtherDocuments, refetch: refetchOtherDocuments } =
    useGetAgentOtherDocumentsQuery(agentAccount?.id);

  const [uploadAgentAttachment] = useUploadAgentAttachmentMutation();
  const [removeAgentFile] = useRemoveAgentFileMutation();
  const [removeOtherFile] = useRemoveOtherFileMutation();

  // Refs for file inputs
  const fileRefs: Record<FileKeys, React.RefObject<HTMLInputElement>> = {
    nationalIdentity: useRef<HTMLInputElement>(null),
    recoLicence: useRef<HTMLInputElement>(null),
    agreementFile: useRef<HTMLInputElement>(null),
    previousRegistration: useRef<HTMLInputElement>(null),
    others: useRef<HTMLInputElement>(null),
  };

  // File fields
  const fileFields: { key: FileKeys; label: string }[] = [
    { label: "Government Issued ID", key: "nationalIdentity" },
    {
      label: "Previous Brokerage Registration Letter",
      key: "previousRegistration",
    },
    { label: "RECO Licence", key: "recoLicence" },
    { label: "Agreement File", key: "agreementFile" },
  ];

  // Sync agentAccount prop to state
  useEffect(() => {
    if (agentAccount) {
      setAgentAccount(agentAccount);
    }
  }, [agentAccount]);

  const handleAgentFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast.error("No file selected!");
      return;
    }

    const formData = new FormData();
    formData.append(fieldName, file);

    setIsUploading({ ...isUploading, [fieldName]: true });
    try {
      const response = await uploadAgentAttachment({
        data: formData,
        agent_id: agentAccount?.id,
        type: fieldName,
      }).unwrap();

      if (response?.data?.newFileAttachment) {
        setAgentAccount(response.data.newFileAttachment);
        toast.success(response.message || "File uploaded successfully");

        // Refetch other documents after a successful upload
        refetchOtherDocuments();
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Something went wrong!");
    } finally {
      setIsUploading({ ...isUploading, [fieldName]: false });
    }
  };

  const handleRemoveFile = async (fieldName: string) => {
    try {
      const response = await removeAgentFile({
        fileName: fieldName,
        id: agentAccount?.id,
      }).unwrap();

      if (response?.newFileAttachment) {
        setAgentAccount(response.newFileAttachment);
        toast.success("File removed successfully");
      } else {
        toast.error("Failed to remove the file. Please try again!");
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Something went wrong!");
    }
  };

  const handleOtherDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || !e.target.files[0]) return;
    setIsUploadingOther(true);

    const formData = new FormData();
    formData.append("otherDocument", e.target.files[0]);
    formData.append("fileName", otherDocumentName);

    try {
      const response = await uploadAgentAttachment({
        data: formData,
        agent_id: agentAccount.id,
        type: "otherDocument",
      }).unwrap();
      console.log(response);
      if (response) {
        toast.success("Other document uploaded successfully");
        setOtherDocumentName("");
        refetchOtherDocuments();
      }
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    } finally {
      setIsUploadingOther(false);
    }
  };

  const handleRemoveOtherFile = async (id: string) => {
    try {
      const response = await removeOtherFile(id).unwrap();

      if (response) {
        refetchOtherDocuments();
        toast.success("File removed successfully");
      } else {
        toast.error("Failed to remove the file. Please try again!");
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Something went wrong!");
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <p className="pt-3 pl-2 text-lg font-semibold">
        These are all attachments
      </p>

      {/* Table Header */}
      <div className="flex mt-5 bg-gray-100 px-4 py-3 items-center justify-between rounded-t-lg">
        <div className="w-[80px] font-medium text-gray-700">
          <p>SN</p>
        </div>
        <div className="w-full font-medium text-gray-700">
          <p>Uploaded Attachments List</p>
        </div>
        <div>
          <img src={sortArrow} alt="Sort" className="w-4 h-4" />
        </div>
      </div>

      {/* File Upload Fields */}
      {fileFields.map((file, index) => (
        <div
          key={file.key}
          className="mt-2 flex justify-between items-center px-4 py-2 border-b border-gray-200"
        >
          <div className="flex items-center gap-3">
            <p className="w-[80px] text-gray-600">{index + 1}.</p>
            <p className="text-gray-800">{file.label}</p>
            {agentAccountInfo?.[file.key] &&
              (file.key == "agreementFile" ? (
                <div className="">
                  {/* Agreement Files */}
                  {agentOtherDocuments?.data?.agentOtherDocuments
                    ?.filter((doc: any) => doc.type === "agreementFile")
                    .map((doc: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 mt-2 border-b py-2"
                      >
                        <a
                          href={baseUrl + doc.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {doc.name}
                        </a>
                        {doc.status === "active" && (
                          <Tag color="blue">{doc.status}</Tag>
                        )}
                        {doc.status === "expired" && (
                          <Tag color="red">{doc.status}</Tag>
                        )}
                        {mode !== "view" && (
                          <span
                            className="cursor-pointer hover:text-red-500"
                            onClick={() => handleRemoveOtherFile(doc.id)}
                          >
                            <FaTimes />
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <NavLink
                    to={`${baseUrl + agentAccountInfo[file.key]}`}
                    className="text-blue-500 hover:underline"
                    target="_blank"
                  >
                    Download
                  </NavLink>
                  {mode !== "view" && (
                    <span
                      className="cursor-pointer hover:text-red-500"
                      onClick={() => handleRemoveFile(file.key)}
                    >
                      <FaTimes />
                    </span>
                  )}
                </div>
              ))}
          </div>
          {mode !== "view" && (
            <label htmlFor={`upload-${file.key}`} className="cursor-pointer">
              <input
                ref={fileRefs[file.key]}
                onChange={(e) => handleAgentFileUpload(e, file.key)}
                type="file"
                className="hidden"
                id={`upload-${file.key}`}
              />
              {isUploading[file.key] ? (
                <ButtonLoader />
              ) : (
                <img src={uploadIcon} alt="Upload" className="w-5 h-5" />
              )}
            </label>
          )}
        </div>
      ))}

      {/* Other Documents */}
      <div className="mt-4 px-4">
        <div className="flex items-center gap-3">
          <p className="w-[80px] text-gray-600">5.</p>
          <p className="text-gray-800">Other Document</p>
          {mode !== "view" && (
            <input
              type="text"
              placeholder="Other Document Name"
              value={otherDocumentName}
              onChange={(e) => setOtherDocumentName(e.target.value)}
              className="min-w-[300px] border p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          {otherDocumentName && (
            <label htmlFor="upload-others" className="cursor-pointer">
              <input
                ref={fileRefs.others}
                onChange={handleOtherDocumentUpload}
                type="file"
                className="hidden"
                id="upload-others"
              />
              {isUploadingOther ? (
                <ButtonLoader />
              ) : (
                <img src={uploadIcon} alt="Upload" className="w-5 h-5" />
              )}
            </label>
          )}
        </div>
        {agentOtherDocuments?.data?.agentOtherDocuments
          ?.filter((doc: any) => doc.type === "otherDocument")
          .map((doc: any, index: number) => (
            <div
              key={index}
              className="flex items-center gap-4 mt-2 border-b py-2"
            >
              <a
                href={baseUrl + doc.filePath}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {doc.name}
              </a>
              {mode !== "view" && (
                <span
                  className="cursor-pointer hover:text-red-500"
                  onClick={() => handleRemoveOtherFile(doc.id)}
                >
                  <FaTimes />
                </span>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default AgentDocument;
