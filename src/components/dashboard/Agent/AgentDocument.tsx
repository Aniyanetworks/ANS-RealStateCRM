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
import { getFileUrl } from '../../../utils/constant';
import ButtonLoader from '../../loader/buttonLoader';
import moment from 'moment';

import logo from "/logo.svg";
import { AlignLeftOutlined } from "@ant-design/icons";
import { useAppSelector } from '../../../redux/hooks';
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
  const { user } = useAppSelector((state) => state.user);
  const [otherDocumentName, setOtherDocumentName] = useState("");
  const [isUploadingOther, setIsUploadingOther] = useState(false);
  const [isUploading, setIsUploading] = useState<
    Record<FileKeys, boolean> | any
  >({});
  const [agentAccountInfo, setAgentAccount] = useState<any>(null);

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

  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agentAccount) {
      setAgentAccount(agentAccount);
      refetchOtherDocuments();
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
        setAgentAccount(response.agentAccount);
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

  const handleDocumentPreview = (document: any) => {
    setSelectedDocument(document);
    setError(null);
  };

  const handleDocumentDownload = async (filePath: string): Promise<void> => {
    try {
      const response = await fetch(getFileUrl(filePath));
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

  const getDaysUntilExpiry = (expiryDateString?: string): number | null => {
    if (!expiryDateString) return null;
    const expiryDate = moment.utc(expiryDateString).startOf('day');
    const today = moment.utc().startOf('day');
    const diffDays = expiryDate.diff(today, 'days');
    return diffDays;
  };

  return (
    <div className="flex h-[calc(100vh-7rem)]">
      <div className={`w-[400px] bg-white p-4 rounded-l-lg shadow-sm overflow-y-auto ${previewCollapsed ? 'hidden' : 'block'}`}>
        <p className="text-lg font-semibold mb-4">Document List</p>


        {fileFields.map((file, index) => (
          <div
            key={file.key}
            className="mt-2 flex flex-col px-4 py-2 border-b border-gray-200"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-0 justify-between  w-full">
             <div className='flex  w-full justify-between'>
             <p className="text-gray-800 font-medium flex items-center gap-2">
               <svg
                                    width="20px"
                                    height="20px"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M3 8.2C3 7.07989 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H9.67452C10.1637 5 10.4083 5 10.6385 5.05526C10.8425 5.10425 11.0376 5.18506 11.2166 5.29472C11.4184 5.4184 11.5914 5.59135 11.9373 5.93726L12.0627 6.06274C12.4086 6.40865 12.5816 6.5816 12.7834 6.70528C12.9624 6.81494 13.1575 6.89575 13.3615 6.94474C13.5917 7 13.8363 7 14.3255 7H17.8C18.9201 7 19.4802 7 19.908 7.21799C20.2843 7.40973 20.5903 7.71569 20.782 8.09202C21 8.51984 21 9.0799 21 10.2V15.8C21 16.9201 21 17.4802 20.782 17.908C20.5903 18.2843 20.2843 18.5903 19.908 18.782C19.4802 19 18.9201 19 17.8 19H6.2C5.07989 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2Z"
                                      stroke="#000000"
                                      stroke-width="2"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                    />
                                  </svg> {file.label}
              </p>
                {mode !== "view" && (
                  (file.key !== "agreementFile" || (file.key === "agreementFile" && (user.userType === "superAdmin" || user.userType === "admin"))) && (
                    <label htmlFor={`upload-${file.key}`} className="cursor-pointer ml-2 flex items-center gap-2 text-blue-500 hover:text-blue-600">
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
                        <>
                          <img src={uploadIcon} alt="Upload" className="w-4 h-4" />
                        </>
                      )}
                    </label>
                  )
                )}
             </div>
              </div>
            </div>

            <div className="ml-[30px] mt-2">
              {file.key === "agreementFile" ? (
                <div className="space-y-0 ">
                  {agentOtherDocuments?.data?.agentOtherDocuments
                    ?.filter((doc: any) => doc.type === "agreementFile")
                    .map((doc: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 py-1 hover:bg-gray-50 rounded"
                      >
                        <div className='flex flex-col gap-1'>
                          <span
                            className="text-blue-500 hover:underline cursor-pointer flex-grow"
                            onClick={() => handleDocumentPreview({
                              filePath: doc.filePath,
                              name: doc.name
                            })}
                          >                          
                            • {doc.name}
                          </span>
                          <span className='text-red-500 text-xs'>
                            {doc.agentAccount.agrementExpiryDate && doc.status === "active" 
                              ? (() => {
                                  const days = getDaysUntilExpiry(doc.agentAccount.agrementExpiryDate);
                                  if (days > 0) return `** It will expire in ${days} days`;
                                  if (days === 0) return `** Expires today`;
                                  if (days < 0) return `** Expired ${Math.abs(days)} days ago`;
                                  return '';
                                })()
                              : ''}
                          </span>
                        </div>
                        {doc.status === "active" && (
                          <Tag color="blue" className="min-w-[60px] text-center">
                            {doc.status}
                          </Tag>
                        )}
                        {doc.status === "expired" && (
                          <Tag color="red" className="min-w-[60px] text-center">
                            {doc.status}
                          </Tag>
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
                agentAccountInfo?.[file.key] && (
                  <div className="flex items-center gap-4  hover:bg-gray-50 rounded">
                    <span
                      className="text-blue-500 hover:underline cursor-pointer flex-grow"
                      onClick={() => handleDocumentPreview({
                        filePath: agentAccountInfo[file.key],
                        name: file.label
                      })}
                    >
                      • {file.label}
                    </span>
                    {mode !== "view" && (
                      <span
                        className="cursor-pointer hover:text-red-500"
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemoveFile(file.key);
                        }}
                      >
                        <FaTimes />
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        ))}

        <div className="mt-4 px-4">
          <div className="flex items-center  mb-3 gap-2">
            <svg
                                    width="20px"
                                    height="20px"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M3 8.2C3 7.07989 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H9.67452C10.1637 5 10.4083 5 10.6385 5.05526C10.8425 5.10425 11.0376 5.18506 11.2166 5.29472C11.4184 5.4184 11.5914 5.59135 11.9373 5.93726L12.0627 6.06274C12.4086 6.40865 12.5816 6.5816 12.7834 6.70528C12.9624 6.81494 13.1575 6.89575 13.3615 6.94474C13.5917 7 13.8363 7 14.3255 7H17.8C18.9201 7 19.4802 7 19.908 7.21799C20.2843 7.40973 20.5903 7.71569 20.782 8.09202C21 8.51984 21 9.0799 21 10.2V15.8C21 16.9201 21 17.4802 20.782 17.908C20.5903 18.2843 20.2843 18.5903 19.908 18.782C19.4802 19 18.9201 19 17.8 19H6.2C5.07989 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2Z"
                                      stroke="#000000"
                                      stroke-width="2"
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                    />
                                  </svg> <p className="text-gray-800 font-medium"> Other Documents</p>
          </div>
          
          {mode !== "view" && (
            <div className="ml-[30px]  mb-2 flex items-center gap-3">
              <input
                type="text"
                placeholder="Document Name"
                value={otherDocumentName}
                onChange={(e) => setOtherDocumentName(e.target.value)}
                className="flex-grow border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {otherDocumentName && (
                <label htmlFor="upload-others" className="cursor-pointer flex items-center gap-2 text-blue-500 hover:text-blue-600">
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
                    <>
                      <img src={uploadIcon} alt="Upload" className="w-4 h-4" />
                    </>
                  )}
                </label>
              )}
            </div>
          )}

          <div className="ml-[30px] ">
            {agentOtherDocuments?.data?.agentOtherDocuments
              ?.filter((doc: any) => doc.type === "otherDocument")
              .map((doc: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-4   hover:bg-gray-50 rounded"
                >
                  <span
                    className="text-blue-500 hover:underline cursor-pointer flex-grow"
                    onClick={() => handleDocumentPreview({
                      filePath: doc.filePath,
                      name: doc.name
                    })}
                  >
                    • {doc.name}
                  </span>
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

          <div className="mt-4 flex justify-center">
            <button 
              onClick={(e) => {
                e.preventDefault();
                setPreviewCollapsed(!previewCollapsed);
              }}
              className="p-2 border-2 border-gray-300 hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 hover:border-gray-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-r-lg shadow-sm p-4">
        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <h3 className="font-medium flex items-center gap-2">
            <button  onClick={(e) => {
                e.preventDefault();
                setPreviewCollapsed(!previewCollapsed);
              }}>
              <AlignLeftOutlined></AlignLeftOutlined>
            </button>
            {selectedDocument ? selectedDocument.name : "Document Preview"}
          </h3>
          {selectedDocument && (
            <button
              onClick={() => handleDocumentDownload(selectedDocument.filePath)}
              className="px-4 py-2 bg-[#0f766e] text-white rounded hover:bg-[#0d6b64]"
            >
              Download
            </button>
          )}
        </div>

        {selectedDocument ? (
          <div className="h-[calc(100vh-12rem)]">
            {error && <p className="text-red-500">{error}</p>}
            <iframe
              src={getFileUrl(selectedDocument.filePath)}
              className="w-full h-full rounded-lg"
              title="Document Preview"
              onLoad={() => {}}
              onError={() => setError("Failed to load document")}
            />
          </div>
        ) : (
          <div className="h-[calc(80vh-14rem)] flex flex-col mt-[200px] items-center gap-2  ">
                <img src={logo} alt="" className={`w-[70px]`} />
                <h2
                  className={` tracking-widest text-[18px] 2xl:[20px] text-center playfair-display-sc-bold text-[#0f766e]`}
                >
                  ANS REALSTATECRM
                </h2>
              </div>
        )}
      </div>
    </div>
  );
};

export default AgentDocument;
