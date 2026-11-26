// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import logo from "/logo.svg";
import {
  useGetSpacificPropertyListingQuery,
  useChangePropertyListingAttachmentStatusMutation,
  useChangePropertyListingOtherAttachmentStatusMutation,
  useResubmitPropertyAttachmentMutation,
} from "../../../../../redux/api/superadmin/propertyListingDataSlice";

import { getFileUrl, getPdfProxyUrl } from "../../../../../utils/constant";

import rightArrow from "./../../../../../assets/right-arrow.svg";
import TableLoader from "../../../../../components/loader/TableLoader";
import { useEffect, useState, useRef } from "react";
import { Select, Tooltip, Modal, Button, Input } from "antd";
import { AlignLeftOutlined } from "@ant-design/icons";
import { useAppSelector } from "../../../../../redux/hooks";
import { useGetUploadFileCategoriesQuery } from "../../../../../redux/api/common/dynamicUploadFileSlice";
import { FaComment } from "react-icons/fa";
import toast from "react-hot-toast";
import ButtonLoader from "../../../../../components/loader/buttonLoader";
import { formatStringCamelCasecapitalize } from "../../../../../utils/stringUtils";
import { usePdfSizeGuard } from "../../../../../hooks/usePdfSizeGuard";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const PropertyListingPaperworkFileManager: React.FC = ({ uuid, showHeader = true }) => {
  const { user } = useAppSelector((state: any) => state.user);
  const [sidebarWidth, setSidebarWidth] = useState<number>(310);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  // const { uuid } = useParams<{ uuid?: string }>();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const { guardFile, modal: pdfSizeReductionModal } = usePdfSizeGuard(MAX_FILE_SIZE);

  const { data: spacificPropertyListingData, isLoading } =
    useGetSpacificPropertyListingQuery(uuid);

  const propertyListingData =
    spacificPropertyListingData?.data?.propertyListingData;

  const [resubmitPaperWorkFileAttachment] =
    useResubmitPropertyAttachmentMutation();

  const uploadedFiles =
    spacificPropertyListingData?.data?.propertyListingData
      ?.propertyListingAttachment;
  const uploadedFilesOther =
    spacificPropertyListingData?.data?.propertyListingData
      ?.propertyListingOtherAttachment;
  const uploadFileCategory =
    spacificPropertyListingData?.data?.propertyListingData?.representation ===
      "landlord" ||
    spacificPropertyListingData?.data?.propertyListingData?.representation ===
      "seller"
      ? "listing-paperwork"
      : "co-op-paperwork";
  const { data } = useGetUploadFileCategoriesQuery({
    slug: uploadFileCategory, // Ensure uploadFileCategory is available and valid
    representation: "seller",
  });

  const [pdfToView, setPdfToView] = useState<object>({});
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Direct S3 links can 404/CORS-fail in the browser (private bucket, and some
  // keys — e.g. containing "(" ")" from uploaded filenames — don't round-trip
  // cleanly through a raw <img>/<iframe> src). Fetch the PDF through the
  // backend proxy (same approach already used for Tradesheet PDFs) and view
  // it as a blob URL instead of linking to S3 directly.
  useEffect(() => {
    const filePath = (pdfToView as any)?.filePath;
    if (!filePath || filePath.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      setPdfBlobUrl("");
      return;
    }

    let objectUrl = "";
    let cancelled = false;

    fetch(getPdfProxyUrl(filePath))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(({ status, data: base64, contentType }) => {
        if (cancelled) return;
        if (!status || !base64) throw new Error("Invalid proxy response");
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: contentType || "application/pdf" });
        objectUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(objectUrl);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[PDF proxy fetch]", err);
        setError("Failed to load PDF");
        setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(pdfToView as any)?.filePath]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const fileInputRef = useRef(null);

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

  const statusOptions = [
    { value: "approved", label: "Approved" },
    { value: "underReview", label: "Under Review" },
    { value: "rejected", label: "Rejected" },
  ];

  const cancelDelete = () => {
    setIsRejectModalVisible(false);
    setIsRejectReasonViewModalVisible(false);
    setRejectReason("");
    setChangeFileId(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "green";
      case "Under Review":
        return "#0f766e";
      case "Rejected":
        return "red";
      default:
        return "gray";
    }
  };

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

    setIsUploading("paperWorkFile");

    const formData = new FormData();
    formData.append("attachment", file);

    try {
      const response = await resubmitPaperWorkFileAttachment({
        data: formData,
        id: id,
      }).unwrap();

      console.log("response?.data?.receiptData?.", response?.data);

      setPdfToView(response?.data?.newFileAttachment);
      setPdfToView((prevState) => ({
        ...prevState,
        status: response?.data?.newFileAttachment?.status || null,
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

  const [changePropertyListingAttachmentStatus] =
    useChangePropertyListingAttachmentStatusMutation();
  const [changePropertyListingOtherAttachmentStatus] =
    useChangePropertyListingOtherAttachmentStatusMutation();

  const handleStatusChange = (value, id) => {
    setSelectedStatus(value); // Update the local state
    setChangeFileId(id);

    console.log("selectedStatus", value);

    if (value == "rejected") {
      setIsRejectModalVisible(true);
    } else {
      changeStatusApi(value, id);
    }
  };

  const changeStatusApi = async (newStatus: string, id: number) => {
    const requestData = {
      status: newStatus,
      rejectReason: rejectReason,
    };

    try {
      // "Other Document" uploads live in a separate table (propertyListingOtherAttachment)
      // with their own ids, so they need their own status-change endpoint — the
      // regular one 404s when given an "other document" id.
      const mutate = pdfToView?.isOtherDocument
        ? changePropertyListingOtherAttachmentStatus
        : changePropertyListingAttachmentStatus;

      const response = await mutate({
        data: requestData,
        id: id,
      }).unwrap();

      const updatedFile =
        response?.data?.updatedPaperworkAttachmentFile ||
        response?.data?.updatedOtherAttachmentFile;

      setPdfToView((prevState) => ({
        ...prevState,
        status: updatedFile?.status || null,
        rejectReason: updatedFile?.rejectReason || null,
      }));

      toast.success(`${response?.message}`);

      cancelDelete();
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
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

  const handleViewClick = (file: object, isOtherDocument: boolean = false) => {
    console.log(file);
    setPdfToView({ ...file, isOtherDocument });
    setLoading(true);
    setError(null);
  };

  if (isLoading) return <TableLoader />;

  const getDownloadFileName = () => {
    const raw = pdfToView?.filePath?.split(/[/\\]/).pop() || "document";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  };

  const handleDownload = async () => {
    const isImage = pdfToView?.filePath?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i);

    try {
      // Non-PDF files (images) and PDFs already fetched via the proxy use what's
      // already on hand; only fetch directly for images, since S3 links for
      // those haven't shown the same loading failures PDFs did.
      const blobUrl = isImage
        ? URL.createObjectURL(await (await fetch(getFileUrl(pdfToView.filePath))).blob())
        : pdfBlobUrl;

      if (!blobUrl) throw new Error("File not ready yet");

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = getDownloadFileName();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (isImage) window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading the file:", error);
      toast.error("Failed to download file");
    }
  };
  // Calculate slice size dynamically based on sidebar width
  const sliceSize = Math.floor((sidebarWidth - 300) / 15) + 20;

  return (
    <div className=" relative">
      {showHeader && propertyListingData && (
        <h2 className="border-t border-gray-400 bg-[#0b3b38] text-white border-x text-center text-sm font-bold py-1 uppercase mb-3">
          {propertyListingData?.propertyListingTypeId} - {propertyListingData?.propertyAddress}
        </h2>
      )}
      <div>
        <div className="flex h-[calc(100vh-7rem)]">
          {/* Resizer */}

          <div
            style={{ width: `${sidebarWidth}px` }}
            className={`    absolute lg:relative   rounded-l-lg bg-white h-[calc(100vh-7rem)] overflow-y-auto overflow-x-hidden  py-5 ${
              collapsed
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
              className={`absolute top-2 w-[30px] right-0 lg:hidden ${
                !collapsed && "hidden"
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
            {data?.data?.uploadFileCategoryData?.uploadFileNames
              .filter(
                (file: FileType) => {
                  // Filter by status and showOnPropertyListing
                  if (file.status !== "active" || file.showOnPropertyListing !== "Yes") {
                    return false;
                  }
                  
                  // Filter by listType if property listing has a listType
                  const propertyListingListType = spacificPropertyListingData?.data?.propertyListingData?.listType;
                  if (propertyListingListType) {
                    const fileListType = file.listType;
                    
                    // If property listing is "Both", show all documents
                    if (propertyListingListType === "Both") {
                      return true;
                    }
                    
                    // If property listing is "Commercial", show documents with "Commercial" or "Both"
                    if (propertyListingListType === "Commercial") {
                      return fileListType === "Commercial" || fileListType === "Both";
                    }
                    
                    // If property listing is "Residential", show documents with "Residential" or "Both"
                    if (propertyListingListType === "Residential") {
                      return fileListType === "Residential" || fileListType === "Both";
                    }
                    
                    // If property listing listType doesn't match any known value, show documents with matching listType or "Both"
                    return fileListType === propertyListingListType || fileListType === "Both";
                  }
                  
                  // If no listType on property listing, show all active documents
                  return true;
                }
              )
              .map((file: any, index: number) => (
                <div key={index} className=" ">
                  <div>
                    {uploadedFiles?.filter(
                      (upload: any) => upload.uploadFileNameId === file.id
                    ).length == 1 ? (
                      uploadedFiles
                        ?.filter(
                          (upload: any) => upload.uploadFileNameId === file.id
                        )
                        .map((uploadFile: any, i: number) => (
                          <ul
                            key={i}
                            onClick={() => [
                              setCategoryId(file.id),
                              handleViewClick(uploadFile),
                            ]}
                            className={`relative flex px-5 text-[#0b3b38] py-2 hover:bg-[#f0f7f6] ${
                              uploadFile.filePath == pdfToView.filePath &&
                              "bg-[#f0f7f6]"
                            } items-center   cursor-pointer gap-3`}
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
                                      fill="#0f766e"
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
                                        ? "#f59e0b"
                                        : "green", // Apply color based on status
                                  }}
                                  className={
                                    uploadFile.status === "rejected" ||
                                    uploadFile.status === "pending"
                                      ? ""
                                      : ""
                                  } // Apply blinking class if status is 'rejected' or 'underReview'
                                >
                                  {file.name.length > 20
                                    ? file.name.slice(0, 18) + "..." // Truncate filename if it's too long
                                    : file.name}
                                </p>
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
                      <div
                        className={`px-5 py-2 hover:bg-[#f0f7f6]   text-[#0b3b38]  `}
                      >
                        <div>
                          <div
                            onClick={() =>
                              setCategoryId(
                                categoryId == file.id ? null : file.id
                              )
                            }
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
                              </div>
                            </Tooltip>

                            {uploadedFiles?.filter(
                              (upload: any) =>
                                upload.uploadFileNameId === file.id
                            ).length == 0 ? (
                              ""
                            ) : (
                              <img src={rightArrow} alt="" />
                            )}
                          </div>
                          <div
                            className={`space-y-3  ml-6 transition-all duration-500 ease-in-out overflow-hidden ${
                              categoryId == file.id
                                ? "max-h-[1000px]  opacity-100"
                                : "max-h-0 opacity-0"
                            }`}
                          >
                            {uploadedFiles
                              ?.filter(
                                (upload: any) =>
                                  upload.uploadFileNameId === file.id
                              )
                              .map((uploadFile: any) => (
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
                                              ? "#f59e0b"
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
                                        {uploadFile.uploadFileName?.name.slice(
                                          0,
                                          sliceSize
                                        )}
                                        ...
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
              ))}

            <div>
              {uploadedFilesOther?.length === 1 ? (
                uploadedFilesOther?.map((uploadFile: any, i: number) => (
                  <ul
                    key={i}
                    onClick={() => [
                      setCategoryId("someId"), // Use the appropriate category ID if needed
                      handleViewClick(uploadFile, true),
                    ]}
                    className={`flex px-5 text-[#0b3b38] py-2 hover:bg-[#f0f7f6] ${
                      uploadFile.filePath === pdfToView.filePath &&
                      "bg-[#f0f7f6]"
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
                <div className={`px-5 py-2 hover:bg-[#f0f7f6] text-[#0b3b38]`}>
                  <div>
                    <div
                      onClick={
                        () =>
                          setCategoryId(
                            categoryId === "someId" ? null : "someId"
                          ) // Use the appropriate category ID if needed
                      }
                      className="flex cursor-pointer justify-between items-center"
                    >
                      <Tooltip placement="right" title="Others" color="#fff">
                        <div className="flex items-center gap-2">
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
                          <p>Others Document</p>
                        </div>
                      </Tooltip>
                      {uploadedFilesOther?.length === 0 ? (
                        ""
                      ) : (
                        <img src={rightArrow} alt="" />
                      )}
                    </div>
                    <div
                      className={`space-y-3 ml-10 transition-all duration-500 ease-in-out overflow-hidden ${
                        categoryId === "someId"
                          ? "max-h-[1000px] opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      {uploadedFilesOther?.map((uploadFile: any) => (
                        <div>
                          {console.log(uploadFile)}
                          <ul className="flex  cursor-pointer mt-2">
                            <Tooltip
                              placement="right"
                              color="#fff"
                              title={uploadFile.uploadFileName?.name}
                            >
                              <p
                                className="w-[100px] truncate"
                                onClick={() => handleViewClick(uploadFile, true)}
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
          <div className=" w-full   bg-white rounded-r-lg shadow-md p-4">
            <div className="flex justify-between pb-4 items-center border-b mb-2">
              <h3 className=" font-medium flex items-center gap-2 text-[#0b3b38]">
                <div onClick={() => setCollapsed(!collapsed)}>
                  <AlignLeftOutlined></AlignLeftOutlined>
                </div>
                {Object.keys(pdfToView).length > 0
                  ? pdfToView?.uploadFileName?.name
                  : "Paperwork"}
                {!pdfToView?.uploadFileName?.name
                  ? pdfToView?.filePath
                      ?.split(/[/\\]/) // Split by both forward slashes (/) and backslashes (\)
                      .pop()
                  : ""}{" "}
              </h3>
              <div className="flex items-center">
                {selectedStatus &&
                  /* pdfToView?.uploadFileName?.name && */
                  user?.userType === "superAdmin" && (
                    <div>
                      {/* <label
                        htmlFor="status-select"
                        className="block mb-2 text-sm block font-medium text-gray-700 ml-3"
                      >
                        {selectedStatus ? "Change Status" : "Change Status"}:{" "}
                      </label> */}
                      <Select
                        id="status-select" // Added id for accessibility
                        value={selectedStatus}
                        onChange={
                          (value) => handleStatusChange(value, pdfToView?.id) // Ensure this updates the selected status
                        }
                        style={{
                          width: 120,
                          marginLeft: "10px",
                        }}
                        dropdownRender={(menu) => <div>{menu}</div>}
                      >
                        {statusOptions.map((option) => (
                          <Option key={option.value} value={option.value}>
                            <span
                              style={{ color: getStatusColor(option.value) }}
                            >
                              {option.label}
                            </span>
                          </Option>
                        ))}
                      </Select>
                    </div>
                  )}
                {Object.keys(pdfToView).length > 0 && (
                  <button onClick={handleDownload} className="primary-btn ml-2">
                    Download
                  </button>
                )}
                {/* <Link
                  to="/dashboard/super-admin/property-listing"
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
                      <FaComment className="text-red-500 mr-2" />{" "}
                      {/* Reject Reason icon with red color */}
                      <span className="text-sm font-medium">
                        View Reject Reason
                      </span>{" "}
                      {/* Text next to the icon */}
                    </button>
                  )}
              </div>

              <div className="flex">
                {pdfToView.status === "rejected" &&
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
                  )}
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
              <div className="pdf-viewer ">
                {error && <p className="text-red-500">{error}</p>}
                 {pdfToView.filePath?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img src={getFileUrl(pdfToView.filePath)} className="w-full h-[calc(100vh-15rem)]" alt="" />
                ): !pdfBlobUrl ? (
                  <div className="w-full h-[calc(100vh-15rem)] flex items-center justify-center">
                    {!error && <TableLoader />}
                  </div>
                ) : <iframe
                  src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="overflow-auto w-full h-[calc(100vh-15rem)]"
                  title="PDF Preview"
                  onLoad={() => setLoading(false)}
                  onError={() => setError("Failed to load PDF")}
                 /*  style={{
                    width: "100%", // Full width for PDF view
                    // Full viewport height for PDF view
                    border: "none", // Remove border to make it seamless
                    overflow: "hidden", // Prevent iframe internal scrolling
                    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
                    borderRadius: "8px", // Rounded corners for a polished look
                  }} */
                />}

                
              </div>
            ) : (
              <div className="h-[calc(100vh-14rem)] flex flex-col justify-center items-center gap-2  ">
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
            onClick={() => changeStatusApi(selectedStatus, changeFileId)}
            style={{
              marginLeft: "8px",
              backgroundColor: "#072f2d", // Custom background color
              borderColor: "#072f2d", // Custom border color
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

      {pdfSizeReductionModal}
    </div>
  );
};

export default PropertyListingPaperworkFileManager;
