// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useParams } from "react-router-dom";
import logo from "/logo.png";
import { useGetUploadFileCategoriesQuery } from "../../../../../../redux/api/common/dynamicUploadFileSlice";
import {
  useChangeTradeSheetAttachmentStatusMutation,
  useChangeTradeSheetAttachmentOtherStatusMutation,
  useGetSpacificTradeSheetListDataQuery,
  useResubmitPaperWorkFileAttachmentMutation,
  useResubmitPaperWorkOtherFileAttachmentMutation,
  useToggleImportantFileMutation,
} from "../../../../../../redux/api/agent/trade-sheet/tradeSheetSlice";
import toast from "react-hot-toast";
import { FaComment } from "react-icons/fa";
import { getFileUrl, getPdfProxyUrl } from "../../../../../../utils/constant";
import { Select } from "antd";
import rightArrow from "./../../../../../../assets/right-arrow.svg";
import TableLoader from "../../../../../../components/loader/TableLoader";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Worker is copied to public/ by the Vite plugin in vite.config.ts.
// Stable path (no hash) avoids MIME-type / module-worker fetch issues in production.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
import { Tooltip } from "antd";
import { AlignLeftOutlined } from "@ant-design/icons";
import { Button, Input, Modal } from "antd"; // Import Modal here
import ButtonLoader from "../../../../../../components/loader/buttonLoader";
import { useAppSelector } from "../../../../../../redux/hooks";
import { formatStringCamelCasecapitalize } from "../../../../../../utils/stringUtils";
import { usePdfSizeGuard } from "../../../../../../hooks/usePdfSizeGuard";

const TradeSheetPaperworkFileManager: React.FC = ({ uuid, resetTrigger }) => {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<number | string>>(new Set());
  const { user } = useAppSelector((state: any) => state.user);
  const fileInputRef = useRef(null);
  const { guardFile, modal: pdfSizeReductionModal } = usePdfSizeGuard(MAX_FILE_SIZE);
  const [sidebarWidth, setSidebarWidth] = useState<number>(310);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  // const { uuid } = useParams<{ uuid?: string }>();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState(false);
  const [paperworkDocuments, setPaperworkDocuments] = useState<any[]>([]);
const [fetchLoading, setFetchLoading] = useState<boolean>(false);
  const { data: spacificTradeSheetLisData, isLoading } =
    useGetSpacificTradeSheetListDataQuery(uuid);

  const isSuperAdmin = user?.userType === "superAdmin";
  const uploadedFiles =
    spacificTradeSheetLisData?.data?.tradeSheetData?.paperWorkAttachmentFiles;
  const uploadedFilesOther =
    spacificTradeSheetLisData?.data?.tradeSheetData?.paperWorkOtherAttachments;
  const importantFileIds: number[] =
    spacificTradeSheetLisData?.data?.tradeSheetData?.tradeSheetImportantFiles?.map(
      (f: any) => f.uploadFileNameId
    ) ?? [];

  const [toggleImportantFile] = useToggleImportantFileMutation();
  const [togglingImportant, setTogglingImportant] = useState<number | null>(null);

  const handleToggleImportant = async (uploadFileNameId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTogglingImportant(uploadFileNameId);
    try {
      await toggleImportantFile({ tradeSheetUuid: uuid, uploadFileNameId }).unwrap();
    } catch {
      // silent
    }
    setTogglingImportant(null);
  };

  const uploadFileCategory =
    spacificTradeSheetLisData?.data?.tradeSheetData?.representation ===
      "landlord" ||
      spacificTradeSheetLisData?.data?.tradeSheetData?.representation === "seller"
      ? "listing-paperwork"
      : "co-op-paperwork";
  const { data } = useGetUploadFileCategoriesQuery({
    slug: uploadFileCategory, // Ensure uploadFileCategory is available and valid
    representation:
      spacificTradeSheetLisData?.data?.tradeSheetData?.representation, // Safely access the representation
  });


  const representation = spacificTradeSheetLisData?.data?.tradeSheetData?.representation;

  useEffect(() => {
  if (!isLoading && data) { // Changed from !spacificTradeSheetLisData to !isLoading
    setFetchLoading(true);
    const tradesheetListType = spacificTradeSheetLisData?.data?.tradeSheetData?.properties?.[0]?.listType || 
                                spacificTradeSheetLisData?.data?.tradeSheetData?.listType;

    const activeDocuments = data?.data?.uploadFileCategoryData?.uploadFileNames?.filter(
      (file: any) => {
        // Filter by status
        if (file.status !== "active") {
          return false;
        }
        
        // Filter by listType if tradesheet has a listType
        if (tradesheetListType) {
          const fileListType = file.listType;
          
          // If tradesheet is "Both", show all documents
          if (tradesheetListType === "Both") {
            return true;
          }
          
          // If tradesheet is "Commercial", show documents with "Commercial" or "Both"
          if (tradesheetListType === "Commercial") {
            return fileListType === "Commercial" || fileListType === "Both";
          }
          
          // If tradesheet is "Residential", show documents with "Residential" or "Both"
          if (tradesheetListType === "Residential") {
            return fileListType === "Residential" || fileListType === "Both";
          }
          
          // If tradesheet listType doesn't match any known value, show documents with matching listType or "Both"
          return fileListType === tradesheetListType || fileListType === "Both";
        }
        
        // If no listType on tradesheet, show all active documents
        return true;
      }
    );

    const documents = activeDocuments
      ?.map((file: any) => {
        const fileData = uploadedFiles?.filter(
          (upload: any) => upload.uploadFileNameId === file.id
        );

        // ✅ pick the correct order field based on representation
        let sortOrder = 9999;
        switch (representation) {
          case "seller":
            sortOrder = file.sellerOrder || 9999;
            break;
          case "buyer":
            sortOrder = file.buyerOrder || 9999;
            break;
          case "tenant":
            sortOrder = file.tenantOrder || 9999;
            break;
          case "landlord":
            sortOrder = file.landlordOrder || 9999;
            break;
          default:
            sortOrder = 9999;
        }

        return {
          ...file,
          fileData,
          sortOrder,
        };
      })
      ?.sort((a, b) => a.sortOrder - b.sortOrder);

    setPaperworkDocuments(documents || []);
    setFetchLoading(false);
  }
}, [data, uploadedFiles, representation, isLoading, spacificTradeSheetLisData]); 

  const [pdfToView, setPdfToView] = useState<object>({});
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  const [pdfNumPages, setPdfNumPages] = useState<number>(0);
  const [pdfCurrentPage, setPdfCurrentPage] = useState<number>(1);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [resubmitPaperWorkFileAttachment] =
    useResubmitPaperWorkFileAttachmentMutation();
  const [resubmitPaperWorkFileOtherAttachment] =
    useResubmitPaperWorkOtherFileAttachmentMutation();


  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const [selectedStatus, setSelectedStatus] = useState("");
  const [changeFileId, setChangeFileId] = useState<string | null>(null);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [isRejectReasonViewModalVisible, setIsRejectReasonViewModalVisible] =
    useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [changeFileType, setChangeFileType] = useState<string | null>(null);

  const statusOptions = [
    { value: "approved", label: "Approved" },
    { value: "underReview", label: "Under Review" },
    { value: "rejected", label: "Rejected" },
  ];

  // State to manage the selected status value
  // const [selectedStatus, setSelectedStatus] = useState(pdfToView.status || 'underReview');
  // Define a function to determine the color based on the status
  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "green";
      case "Under Review":
        return "#9F8667";
      case "Rejected":
        return "red";
      default:
        return "gray";
    }
  };

  const toggleCategory = (id: number | string) => {
  const newCollapsed = new Set(collapsedCategories);
  if (newCollapsed.has(id)) {
    newCollapsed.delete(id);
  } else {
    newCollapsed.add(id);
  }
  setCollapsedCategories(newCollapsed);
};

  const [changeTradeSheetAttachmentStatus] =
    useChangeTradeSheetAttachmentStatusMutation();

  const [changeTradeSheetAttachmentOtherStatus] =
    useChangeTradeSheetAttachmentOtherStatusMutation();
  // Handle the status change when the user selects a new value
  const handleStatusChange = (value, id, type) => {
  setSelectedStatus(value);
  setChangeFileId(id);

  if (value === "rejected") {
    setIsRejectModalVisible(true);
    // Store the type in state so we know which API to call later
    setChangeFileType(type);
  } else {
    if (type === 'regular') {
      changeStatusApi(value, id);
    } else {
      changeOtherStatusApi(value, id);
    }
  }
};

  const changeStatusApi = async (newStatus: string, id: number) => {
    const requestData = {
      status: newStatus,
      rejectReason: rejectReason,
    };

    try {
      const response = await changeTradeSheetAttachmentStatus({
        data: requestData,
        id: id,
      }).unwrap();

      setPdfToView((prevState) => ({
        ...prevState,
        status: response?.data?.updatedPaperworkAttachmentFile?.status || null,
        rejectReason:
          response?.data?.updatedPaperworkAttachmentFile?.rejectReason || null,
      }));

      toast.success(`${response?.message}`);

      cancelDelete();
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  const changeOtherStatusApi = async (newStatus: string, id: number) => {
    const requestData = {
      status: newStatus,
      rejectReason: rejectReason,
    };

    try {
      const response = await changeTradeSheetAttachmentOtherStatus({
        data: requestData,
        id: id,
      }).unwrap();

      setPdfToView((prevState) => ({
        ...prevState,
        status:
          response?.data?.updatedPaperworkAttachmentFile?.status || null,
        rejectReason:
          response?.data?.updatedPaperworkAttachmentFile?.rejectReason ||
          null,
      }));

      toast.success(`${response?.message}`);

      cancelDelete();
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  const cancelDelete = () => {
    setIsRejectModalVisible(false);
    setIsRejectReasonViewModalVisible(false);
    setRejectReason("");
    setChangeFileId(null);
  };

  const handleRejectReasonView = (reason) => {
    setRejectReason(reason);
    setIsRejectReasonViewModalVisible(true);
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (pdfToView?.status) {
      setSelectedStatus(pdfToView?.status);
    }

    // Add event listener on component mount
    window.addEventListener("resize", handleResize);

    // Remove event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [pdfToView]);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseMove = (e) => {
    if (isResizing) {
      // Calculate the new width in pixels
      const newWidth = Math.max(300, Math.min(e.clientX, 500)); // Min 200px, Max 500px
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  const clearLoadingState = () => {
    setLoading(false);
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }
  };

  const handleViewClick = (file: object) => {
    console.log(file);
    
    // Clear any existing timeout
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
    }
    
    setLoading(true);
    setPdfToView(file);
    setPdfCurrentPage(1);
    setPdfNumPages(0);
    setPdfData(null);
    setError(null);

    if (file?.filePath?.endsWith(".pdf")) {
      // Fetch PDF via JSON proxy (base64) — IDM and similar extensions never intercept JSON
      fetch(getPdfProxyUrl(file.filePath))
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(({ status, data: base64 }) => {
          if (!status || !base64) throw new Error("Invalid proxy response");
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          setPdfData(bytes.buffer);
          setLoading(false);
        })
        .catch((err) => {
          setError("Failed to load PDF");
          console.error("[PDF fetch]", err);
          setLoading(false);
        });
    } else {
      // Non-PDF: let the img onLoad handle loading state
      const timeout = setTimeout(() => {
        setLoading(false);
        setLoadingTimeout(null);
      }, 3000);
      setLoadingTimeout(timeout);
    }
  };

  const handleDownload = async () => {
    const pdfUrl = getFileUrl(pdfToView.filePath);

    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("Failed to fetch PDF file");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link to download the file
      const link = document.createElement("a");
      link.href = url;
      link.download = pdfToView.filePath;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Release the URL object
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the PDF:", error);
    }
  };
  // Calculate slice size dynamically based on sidebar width
  const sliceSize = Math.floor((sidebarWidth - 300) / 15) + (sidebarWidth > 310 ? 35 : 28);

  const handlePaperWorkFileResubmit = async (
        e: React.ChangeEvent<HTMLInputElement>,
        id
      ) => {
        const rawFile = e.target.files?.[0];
        if (!rawFile) return;

        const file = await guardFile(rawFile);
        if (!file) {
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        }

        // Determine file type based on current pdfToView
        const isOtherDocument = !pdfToView?.uploadFileName?.name;

        setIsUploading(isOtherDocument ? "paperWorkOtherFile" : "paperWorkFile");

        const formData = new FormData();
        formData.append("attachment", file);

        try {
          const response = await (isOtherDocument 
            ? resubmitPaperWorkFileOtherAttachment({
                data: formData,
                id: id,
              }).unwrap()
            : resubmitPaperWorkFileAttachment({
                data: formData,
                id: id,
              }).unwrap()
          );

          // Update state based on file type
          const updatedFile = isOtherDocument 
            ? response?.data?.updatedOtherAttachment 
            : response?.data?.newFileAttachment;

          setPdfToView(updatedFile);
          setPdfToView((prevState) => ({
            ...prevState,
            status: updatedFile?.status || null,
          }));

          toast.success(response?.message);
        } catch (error: any) {
          toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
        }
        setIsUploading(false);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };

  // Add this with your existing state variables
const [isEditModalVisible, setIsEditModalVisible] = useState(false);
const [editingFile, setEditingFile] = useState<any>(null);

  // Add this function with your existing functions
const handleEditClick = (file: any) => {
  setEditingFile(file);
  setIsEditModalVisible(true);
};

  // Reset pdfToView when resetTrigger or uuid changes (i.e., when modal is closed or tradesheet changes)
  useEffect(() => {
    setPdfToView({});
  }, [resetTrigger, uuid]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [loadingTimeout]);

  return (
    <div className=" relative">
      <div>
        <div className="flex h-[calc(100vh-7rem)]">
          {/* Resizer */}

          <div
            style={{ width: `${sidebarWidth}px` }}
            className={`    absolute lg:relative   rounded-l-lg bg-white h-[calc(100vh-7rem)] overflow-y-auto overflow-x-hidden  py-5 ${collapsed
              ? collapsed && windowWidth < 1024
                ? "block"
                : "hidden"
              : !collapsed && windowWidth < 1024
                ? "hidden"
                : "block"
              }`}
          >
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`absolute top-2 w-[30px] right-0 lg:hidden ${!collapsed && "hidden"
                }`}
            >
              <svg
                fill="#000"
                height="15px"
                width="15px"
                version="1.1"
                id="Layer_1"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                viewBox="0 0 330 330"
                xml:space="preserve"
              >
                <path
                  id="XMLID_92_"
                  d="M111.213,165.004L250.607,25.607c5.858-5.858,5.858-15.355,0-21.213c-5.858-5.858-15.355-5.858-21.213,0.001
	l-150,150.004C76.58,157.211,75,161.026,75,165.004c0,3.979,1.581,7.794,4.394,10.607l150,149.996
	C232.322,328.536,236.161,330,240,330s7.678-1.464,10.607-4.394c5.858-5.858,5.858-15.355,0-21.213L111.213,165.004z"
                />
              </svg>
            </button>
            {paperworkDocuments?.map(
              (file: any, index: number) => (
                <div key={index} className=" ">
                  <div>
                    {uploadedFiles?.filter(
                      (upload: any) => upload.uploadFileNameId === file.id
                    ).length == 1 ? (
                      uploadedFiles
                        ?.filter(
                          (upload: any) => upload.uploadFileNameId === file.id
                        )
                        ?.map((uploadFile: any, i: number) => (
                          <ul
                            key={i}
                            onClick={() => [
                              setCategoryId(file.id),
                              handleViewClick(uploadFile),
                            ]}
                            className={`relative flex px-5 text-[#243451] py-2 hover:bg-[#F6F4F0] ${uploadFile.filePath == pdfToView.filePath &&
                              "bg-[#F6F4F0]"
                              } items-center cursor-pointer gap-3`}
                          >
                            <Tooltip
                              placement="right"
                              color="#fff"
                              title={file.name}
                            >
                              <div className="flex gap-2 items-center">
                                {uploadFile.filePath == pdfToView.filePath ? (
                                  <svg
                                    width="15px"
                                    height="15px"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M0 1H6L9 4H16V14H0V1Z"
                                      fill="#9F8667"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    width="15px"
                                    height="15px"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M0 1H6L9 4H16V14H0V1Z"
                                      fill="#000000"
                                    />
                                  </svg>
                                )}

                                <p
                                  style={{
                                    color:
                                      uploadFile.status === "rejected"
                                        ? "red"
                                        : uploadFile.status === "underReview"
                                          ? "#eb9715"
                                          : "green",
                                  }}
                                >
                                  {file.name.length > sliceSize
                                    ? file.name.slice(0, sliceSize) + "..."
                                    : file.name}
                                </p>
                                {isSuperAdmin && file.required !== "yes" ? (
                                  <button
                                    title={importantFileIds.includes(file.id) ? "Unmark Important" : "Mark Important"}
                                    onClick={(e) => handleToggleImportant(file.id, e)}
                                    disabled={togglingImportant === file.id}
                                    style={{ marginLeft: 2, opacity: importantFileIds.includes(file.id) ? 1 : 0.35, flexShrink: 0 }}
                                    className="hover:opacity-100 transition-opacity"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={importantFileIds.includes(file.id) ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="2" width="13" height="13">
                                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                  </button>
                                ) : importantFileIds.includes(file.id) ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f59e0b" width="13" height="13" style={{ flexShrink: 0, marginLeft: 2 }}>
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                  </svg>
                                ) : null}
                              </div>
                            </Tooltip>
                            {uploadFile.filePath === pdfToView.filePath && (
                              <div className="absolute right-[-8px] top-1/2 transform -translate-y-1/2">
                                <span className="bg-[#fff] h-4 w-4 rotate-45 transform block"></span>
                              </div>
                            )}
                          </ul>
                        ))
                    ) : (
                      <div className="px-5 py-2 hover:bg-[#F6F4F0] text-[#243451]">
                        <div>
                          <div
                           onClick={() => toggleCategory(file.id)}
                            className="relative flex cursor-pointer justify-between items-center"
                          >
                            <Tooltip
                              placement="right"
                              title={file.name}
                              color="#fff"
                            >
                              <div className="flex items-center gap-2">
                                {uploadedFiles?.filter(
                                  (upload: any) =>
                                    upload.uploadFileNameId === file.id
                                ).length == 0 ? (
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
                                  </svg>
                                ) : (
                                  <svg
                                    width="15px"
                                    height="15px"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M0 1H6L9 4H16V14H0V1Z"
                                      fill="#000000"
                                    />
                                  </svg>
                                )}
                                <p>
                                  {file.name.length > sliceSize
                                    ? file.name.slice(0, sliceSize) + "..."
                                    : file.name}
                                </p>
                                {isSuperAdmin && file.required !== "yes" ? (
                                  <button
                                    title={importantFileIds.includes(file.id) ? "Unmark Important" : "Mark Important"}
                                    onClick={(e) => handleToggleImportant(file.id, e)}
                                    disabled={togglingImportant === file.id}
                                    style={{ marginLeft: 2, opacity: importantFileIds.includes(file.id) ? 1 : 0.35, flexShrink: 0 }}
                                    className="hover:opacity-100 transition-opacity"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={importantFileIds.includes(file.id) ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="2" width="13" height="13">
                                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                  </button>
                                ) : importantFileIds.includes(file.id) ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f59e0b" width="13" height="13" style={{ flexShrink: 0, marginLeft: 2 }}>
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                  </svg>
                                ) : null}
                              </div>
                            </Tooltip>

                           {uploadedFiles?.filter(
                              (upload: any) => upload.uploadFileNameId === file.id
                            ).length == 0 ? (
                              ""
                            ) : (
                              <img 
                                src={rightArrow} 
                                alt="" 
                                className={`transition-transform duration-200 ${
                                  collapsedCategories.has(file.id) ? "" : "rotate-90"
                                }`}
                              />
                            )}
                          </div>
                          <div
                           /*  className={`space-y-3  ml-6 transition-all duration-500 ease-in-out overflow-hidden ${categoryId == file.id
                              ? "max-h-[1000px]  opacity-100"
                              : "max-h-0 opacity-0"
                              }`} */
                              className={`space-y-3 ml-6 transition-all duration-500 ease-in-out overflow-hidden ${
  !collapsedCategories.has(file.id) ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
}`}
                          >
                            {uploadedFiles
                              ?.filter(
                                (upload: any) =>
                                  upload.uploadFileNameId === file.id
                              )
                              ?.map((uploadFile: any) => (
                                <div>
                                  <ul className="flex  cursor-pointer mt-2">
                                    <Tooltip
                                      placement="right"
                                      color="#fff"
                                      title={uploadFile.uploadFileName?.name}
                                    >
                                      <p
                                        style={{
                                          color:
                                            uploadFile.status === "rejected"
                                              ? "red"
                                              : uploadFile.status ===
                                                "underReview"
                                                ? "#eb9715"
                                                : "green", // Apply color based on status
                                        }}
                                        className={
                                          uploadFile.status === "rejected" ||
                                            uploadFile.status === "pending"
                                            ? ""
                                            : ""
                                        } // Apply blinking class if status is 'rejected' or 'underReview'
                                        onClick={() =>
                                          handleViewClick(uploadFile)
                                        }
                                      >
                                        {uploadFile.uploadFileName?.name.length > sliceSize ?   uploadFile.uploadFileName?.name.slice(0,sliceSize)  + "..." : uploadFile.uploadFileName?.name}
                                      </p>
                                    </Tooltip>
                                  </ul>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            <div>
              {uploadedFilesOther?.length === 1 ? (
                uploadedFilesOther?.map((uploadFile: any, i: number) => (
                  <ul
                    key={i}
                    onClick={() => [
                      setCategoryId("someId"), // Use the appropriate category ID if needed
                      handleViewClick(uploadFile),
                    ]}
                    className={`flex px-5 text-[#243451] py-2 hover:bg-[#F6F4F0] ${uploadFile.filePath === pdfToView.filePath &&
                      "bg-[#F6F4F0]"
                      } items-center cursor-pointer gap-3`}
                  >
                    <Tooltip placement="right" color="#fff" title="Others">
                      <div className="flex items-center gap-2">
                        <svg
                          width="15px"
                          height="15px"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M0 1H6L9 4H16V14H0V1Z" fill="#000000" />
                        </svg>{" "}
                        <p>Others Document</p>
                      </div>
                    </Tooltip>
                  </ul>
                ))
              ) : (
                <div className={`px-5 py-2 hover:bg-[#F6F4F0] text-[#243451]`}>
                  <div>
                    <div
                     onClick={() => toggleCategory("other")}
                      className="flex cursor-pointer justify-between items-center"
                    >
                      <Tooltip placement="right" title="Others" color="#fff">
                        <div className="flex items-center gap-2">
                          {uploadedFilesOther?.length != 0 ? (
                         <svg
                                    width="15px"
                                    height="15px"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M0 1H6L9 4H16V14H0V1Z"
                                      fill="#000000"
                                    />
                                  </svg> ) : (
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
                                  </svg>)}
                                  
                          <p>Others Document</p>
                        </div>
                      </Tooltip>
                      {uploadedFilesOther?.length === 0 ? (
                          ""
                        ) : (
                          <img 
                          src={rightArrow} 
                          alt="" 
                          className={`transition-transform duration-200 ${
                            collapsedCategories.has("other") ? "" : "rotate-90"
                          }`}
                        />
                        )}
                    </div>
                    <div
                      // className={`space-y-3 ml-10 transition-all duration-500 ease-in-out overflow-hidden max-h-[1000px] opacity-100`}
                      // className={`space-y-3 ml-10 transition-all duration-500 ease-in-out overflow-hidden  ${categoryId === "someId"
                      //   ? "max-h-[1000px] opacity-100"
                      //   : "max-h-0 opacity-0"
                      //   }`}
                      // Replace the categoryId check with collapsedCategories check
className={`space-y-3 ml-10 transition-all duration-500 ease-in-out overflow-hidden ${
  !collapsedCategories.has("other") ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
}`}
                    >
                      {uploadedFilesOther?.map((uploadFile: any) => (
                        <div>
                          {console.log(uploadFile)}
                          <ul className="flex  cursor-pointer mt-2">
                            <Tooltip
                              placement="right"
                              color="#fff"
                              title={uploadFile.filePath?.split(/[/\\]/).pop()}
                            >
                              <p
                                className="w-[200px] truncate"
                                style={{
                                    color:
                                      uploadFile.status === "rejected"
                                        ? "red"
                                        : uploadFile.status === "underReview"
                                          ? "#eb9715"
                                          : "green", // Apply color based on status
                                  }}
                                onClick={() => handleViewClick(uploadFile)}
                              >
                                {uploadFile.filePath?.split(/[/\\]/).pop()}
                              </p>
                            </Tooltip>
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div
            className="w-[4px] bg-gray-200 cursor-ew-resize"
            onMouseDown={handleMouseDown}
          ></div>
          <div className="w-full bg-white rounded-r-lg shadow-md p-3 md:p-4">
            <div className="flex flex-wrap justify-between pb-3 items-start gap-2 border-b mb-2">
              <h3 className="font-medium flex items-center gap-2 text-[#243451] min-w-0 flex-1 text-sm md:text-base">
                <div onClick={() => setCollapsed(!collapsed)} className="flex-shrink-0 cursor-pointer">
                  <AlignLeftOutlined />
                </div>
                <span className="truncate">
                  {Object.keys(pdfToView).length > 0
                    ? pdfToView?.uploadFileName?.name
                    : "Paperwork"}
                  {!pdfToView?.uploadFileName?.name
                    ? pdfToView?.filePath?.split(/[/\\]/).pop()
                    : ""}
                </span>
              </h3>
              <div className="flex items-center flex-shrink-0 gap-1">
                {selectedStatus &&
                  // pdfToView?.uploadFileName?.name &&
                  user?.userType === "superAdmin" && (
                    <div>
                      <Select
                        id="status-select" // Added id for accessibility
                        value={selectedStatus}
                        /* onChange={
                          (value) => handleStatusChange(value, pdfToView?.id) 
                          
                          // Ensure this updates the selected status
                        } */

                        onChange={
                          (value) => handleStatusChange(value, pdfToView?.id, (pdfToView?.uploadFileName?.name ? 'regular' : 'other')) // Ensure this updates the selected status
                        }
                        style={{
                          width: 150,
                          marginLeft: "10px",
                        }}
                        dropdownRender={(menu) => <div>{menu}</div>}
                      >
                        {statusOptions?.map((option) => (
                          <Select.Option key={option.value} value={option.value}>
                            <span
                              style={{ color: getStatusColor(option.value) }}
                            >
                              {option.label}
                            </span>
                          </Select.Option>
                        ))}
                      </Select>
                    </div>
                  )}
                {Object.keys(pdfToView).length > 0 && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditClick(pdfToView)}
                      className="primary-btn text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDownload}
                      className="primary-btn text-xs md:text-sm px-2 md:px-3 py-1 md:py-1.5"
                    >
                      Download
                    </button>
                  </div>
                )}
                {/* <Link
                  to="/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list"
                  className="primary-btn mx-3 w-[100px]"
                >
                  Go Back
                </Link> */}
              </div>
            </div>
            <div className="flex justify-between items-center mb-2">
              {/* React Select dropdown for status */}
              <div>
                {pdfToView.status === "rejected" &&
                  pdfToView?.uploadFileName?.name && (
                    <button
                      onClick={() =>
                        handleRejectReasonView(pdfToView?.rejectReason)
                      }
                      className=" flex  border-gray-300 hover:border-red rounded-lg p-2 hover:bg-red-500 hover:text-white transition duration-200  "
                    >
                      
                      {/* Reject Reason icon with red color */}
                      <span className="flex gap-3 text-sm font-medium">
                       <p>View Reject Reason</p><FaComment className="text-red-500 mr-2" /> 
                      </span>
                      {/* Text next to the icon */}
                    </button>
                  )}
              </div>

              <div className="flex">
               {/*  {pdfToView.status === "rejected" &&
                  pdfToView?.uploadFileName?.name && (
                    <div className="w-[200px]">
                      <p className="mb-2">Resubmit File</p>
                      <label className="flex justify-center items-center py-[6px] border border-dashed border-gray-400 rounded-md gap-2 hover:border-blue-500 cursor-pointer w-full">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(event) =>
                            handlePaperWorkFileResubmit(event, pdfToView?.id)
                          }
                          accept="application/pdf" // Restrict to PDF file types
                        />
                        {isUploading == "paperWorkFile" && <ButtonLoader />}
                        <span>Upload files</span>
                      </label>
                    </div>
                  )} */}
                {selectedStatus &&
                  pdfToView?.uploadFileName?.name &&
                  user?.userType !== "superAdmin" && (
                    <div>
                      <label
                        htmlFor="status-select"
                        className="block mb-2 text-sm font-medium text-gray-700"
                      >
                        {selectedStatus ? `Status: ` : "Change Status"}

                        <span>{formatStringCamelCasecapitalize(selectedStatus)}</span>
                      </label>
                    </div>
                  )}
              </div>
            </div>

            {Object.keys(pdfToView).length > 0 ? (
              <div ref={viewerContainerRef} className="w-full h-[calc(100vh-17rem)] overflow-y-auto overflow-x-hidden">
                {error && <p className="text-red-500">{error}</p>}

                {loading && (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                  </div>
                )}

                {/* PDF Viewer */}
                {!loading && pdfToView.filePath.endsWith(".pdf") ? (
                  <div className="flex flex-col items-center w-full">
                    {pdfData ? (
                      <>
                        <Document
                          file={pdfData}
                          onLoadSuccess={({ numPages }) => setPdfNumPages(numPages)}
                          onLoadError={(err) => {
                            setError("Failed to render PDF");
                            console.error("[react-pdf]", err);
                          }}
                          loading={
                            <div className="flex justify-center items-center py-10">
                              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
                            </div>
                          }
                        >
                          {windowWidth >= 1024
                            ? Array.from({ length: pdfNumPages }, (_, i) => (
                                <Page
                                  key={i + 1}
                                  pageNumber={i + 1}
                                  width={viewerContainerRef.current?.clientWidth ? viewerContainerRef.current.clientWidth - 16 : undefined}
                                  renderTextLayer={false}
                                  renderAnnotationLayer={false}
                                  className="mb-2"
                                />
                              ))
                            : <Page
                                pageNumber={pdfCurrentPage}
                                width={viewerContainerRef.current?.clientWidth ? viewerContainerRef.current.clientWidth - 16 : undefined}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                              />
                          }
                        </Document>

                        {/* Pagination — mobile/tablet only */}
                        {windowWidth < 1024 && pdfNumPages > 1 && (
                          <div className="sticky bottom-0 w-full flex items-center justify-center gap-3 py-2 mt-2 bg-white border-t border-gray-200 shadow-sm z-10">
                            <button
                              onClick={() => setPdfCurrentPage((p) => Math.max(p - 1, 1))}
                              disabled={pdfCurrentPage <= 1}
                              className="px-3 py-1.5 rounded-md bg-[#243451] text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1a2638] transition-colors"
                            >
                              ← Prev
                            </button>
                            <span className="text-sm text-gray-600 font-medium min-w-[90px] text-center">
                              Page {pdfCurrentPage} of {pdfNumPages}
                            </span>
                            <button
                              onClick={() => setPdfCurrentPage((p) => Math.min(p + 1, pdfNumPages))}
                              disabled={pdfCurrentPage >= pdfNumPages}
                              className="px-3 py-1.5 rounded-md bg-[#243451] text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1a2638] transition-colors"
                            >
                              Next →
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex justify-center items-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
                      </div>
                    )}
                  </div>
                ) : (
                  !loading && (
                    // Image Viewer
                    <div className="w-full flex justify-center">
                      <img
                        src={getFileUrl(pdfToView.filePath)}
                        alt="Preview"
                        className="max-w-full h-auto"
                        style={{ display: "block" }}
                        onLoad={() => clearLoadingState()}
                        onError={() => {
                          setError("Failed to load image");
                          clearLoadingState();
                        }}
                      />
                    </div>
                  )
                )}
              </div>

            ) : (
              <div className="h-[calc(100vh-14rem)] flex flex-col justify-center items-center gap-2  ">
                <img src={logo} alt="" className={`w-[70px]`} />
                <h2
                  className={` tracking-widest text-[18px] 2xl:[20px] text-center playfair-display-sc-bold text-[#9F8667]`}
                >
                  DREAM VALLEY REALTY
                </h2>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Reasons */}
      <Modal
        title="Add Reject Reasons"
        visible={isRejectModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button
            key="confirm"
            type="primary"
            danger
            // onClick={() => changeStatusApi(selectedStatus, changeFileId)}
            onClick={() => {
              if (changeFileType === 'regular') {
                changeStatusApi(selectedStatus, changeFileId);
              } else {
                changeOtherStatusApi(selectedStatus, changeFileId);
              }
            }}
            style={{
              marginLeft: "8px",
              backgroundColor: "#0B1D3D", // Custom background color
              borderColor: "#0B1D3D", // Custom border color
              color: "#fff", // Text color to ensure contrast
            }}
          >
            Save
          </Button>,
          <Button key="cancel" onClick={cancelDelete}>
            Cancel
          </Button>,
        ]}
      >
        <Input.TextArea
          rows={4} // You can adjust the number of rows
          placeholder="Enter reject reason here"
          value={rejectReason} // Assuming you have a state for the reason
          onChange={(e) => setRejectReason(e.target.value)} // Assuming you have a setRejectReason function
        />
      </Modal>

      {/* Reject Reasons View Modal */}
      <Modal
        title="Reject Reasons View"
        visible={isRejectReasonViewModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button key="cancel" onClick={cancelDelete}>
            Cancel
          </Button>,
        ]}
      >
        <div>{rejectReason}</div>
      </Modal>

<Modal
  title="Edit File"
  visible={isEditModalVisible}
  onCancel={() => setIsEditModalVisible(false)}
  footer={[
    <Button key="cancel" onClick={() => setIsEditModalVisible(false)}>
      Cancel
    </Button>,
  ]}
>
  <div className="text-center">
    <label className="flex flex-col items-center justify-center py-4 border-2 border-dashed border-gray-400 rounded-md gap-2 hover:border-blue-500 cursor-pointer w-full">
      <input
        type="file"
        className="hidden"
        onChange={(event) => {
          if (editingFile?.id) {
            handlePaperWorkFileResubmit(event, editingFile.id); // Same function handles both
            setIsEditModalVisible(false);
          }
        }}
        accept="application/pdf,image/*,.doc,.docx"
      />
      <span className="text-lg font-medium">Click to upload new file</span>
      <span className="text-sm text-gray-500">PDF, Images, Word documents</span>
    </label>
  </div>
</Modal>

{pdfSizeReductionModal}
    </div>
  );
};

export default TradeSheetPaperworkFileManager;
