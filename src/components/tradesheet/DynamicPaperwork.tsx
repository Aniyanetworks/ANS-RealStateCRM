// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useParams, useNavigate, NavLink } from "react-router-dom";
import {
  useDeleteOtherAttachmentMutation,
  useDeletePaperWorkFileAttachmentMutation,
  useGetSpacificTradeSheetListDataQuery,
  useUploadOtherDocumentMutation,
  useUploadPaperWorkFileAttachmentMutation,
} from "../../redux/api/agent/trade-sheet/tradeSheetSlice";
import { useGetUploadFileCategoriesQuery } from "../../redux/api/common/dynamicUploadFileSlice";
import { useEffect, useRef, useState } from "react";
import sortArrow from "./../../assets/table-head-arrow.svg";

import uploadIcon from "./../../assets/upload2.svg";
import crossIcon from "./../../assets/cross.svg";
import toast from "react-hot-toast";
import { getFileUrl } from "../../utils/constant";
import TableLoader from "../loader/TableLoader";

import ButtonLoader from "../loader/buttonLoader";
import { usePdfSizeGuard } from "../../hooks/usePdfSizeGuard";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// type of file
type FileType = {
  id: number;
  name: string;
  status: string;
};

type UploadFileType = {
  id: number;
  uploadFileNameId: number;
  status: string;
};

const DynamicPaperwork = ({
  dynamicRepresentation,
  missingFiles,
  setMissingFiles,
}) => {
  const navigate = useNavigate();
  const [btnLoading, setBtnLoading] = useState<string | null>(null);
  const { uuid } = useParams<{ uuid?: string }>();
  const [otherDocumentName, setOtherDocumentName] = useState("");
  const [isUploading, setIsUploading] = useState<number | null>(null);
  const [isUploadingOther, setIsUploadingOther] = useState<boolean>(false);
  const [isRemoving, setIsRemoving] = useState<{
    tradeSheetId: number;
    fileId: number;
  } | null>(null);
  const [isDeletingOther, setIsDeletingOther] = useState<number | null>(null);
  const [fetchLoading, setFetchLoading] = useState<boolean>(false);

  // Add confirmation states
  const [showUploadConfirm, setShowUploadConfirm] = useState<{show: boolean; uploadFileNameId: number | null; file: File | null}>({
    show: false,
    uploadFileNameId: null,
    file: null
  });
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<{show: boolean; tradeSheetId: number | null; fileId: number | null}>({
    show: false,
    tradeSheetId: null,
    fileId: null
  });
  const [showOtherUploadConfirm, setShowOtherUploadConfirm] = useState<{show: boolean; file: File | null}>({
    show: false,
    file: null
  });
  const [showOtherRemoveConfirm, setShowOtherRemoveConfirm] = useState<{show: boolean; fileId: number | null}>({
    show: false,
    fileId: null
  });

  const { guardFile, modal: pdfSizeReductionModal } = usePdfSizeGuard(MAX_FILE_SIZE);

  const [uploadPaperWorkFileAttachment] =
    useUploadPaperWorkFileAttachmentMutation();

  const [uploadOtherDocument] = useUploadOtherDocumentMutation();

  const [deletePaperWorkFileAttachment] =
    useDeletePaperWorkFileAttachmentMutation();
  const [deleteOtherAttachment] = useDeleteOtherAttachmentMutation();

  const {
    data: spacificTradeSheetLisData,
    isLoading,
    refetch,
  } = useGetSpacificTradeSheetListDataQuery(uuid);
  const [paperworkDocuments, setPaperworkDocuments] = useState<object[]>([]);
  const uploadFileCategory =
    dynamicRepresentation === "landlord" || dynamicRepresentation === "seller"
      ? "listing-paperwork"
      : "co-op-paperwork";
  const fileInputRef: any = useRef(null);
  const uploadedFiles =
    spacificTradeSheetLisData?.data?.tradeSheetData?.paperWorkAttachmentFiles;

  const {
    data,
    isLoading: tradeSheetLoading,
    refetch: trdaeSheetRefetch,
  } = useGetUploadFileCategoriesQuery({
    slug: uploadFileCategory, // Ensure uploadFileCategory is available and valid
    representation: dynamicRepresentation, // Safely access the representation
  });

  useEffect(() => {
    if (!tradeSheetLoading && data) {
      setFetchLoading(true);
      const tradesheetListType = spacificTradeSheetLisData?.data?.tradeSheetData?.properties?.[0]?.listType || 
                                  spacificTradeSheetLisData?.data?.tradeSheetData?.listType;
      
      const activeDocuments =
        data?.data?.uploadFileCategoryData?.uploadFileNames?.filter(
          (file: FileType) => {
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

      const documents = activeDocuments?.map((file: FileType) => {
        const fileData = uploadedFiles?.filter(
          (upload: UploadFileType) => upload.uploadFileNameId === file.id
        );

        return {
          ...file,
          fileData: fileData,
        };
      });
      setPaperworkDocuments(documents);
      setFetchLoading(false);
    }
  }, [data, spacificTradeSheetLisData]);

  if (isLoading || tradeSheetLoading || fetchLoading) {
    return <TableLoader />;
  }

  // Modified handleUploadFile to show confirmation
  const handleUploadFile = async (e: any, uploadFileNameId: number) => {
    const rawFile = e.target.files[0];
    if (!rawFile) return;

    const file = await guardFile(rawFile);
    if (!file) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Show confirmation modal instead of immediate upload
    setShowUploadConfirm({
      show: true,
      uploadFileNameId,
      file
    });
  };

  // New function to handle confirmed upload
  const handleConfirmedUpload = async () => {
    if (!showUploadConfirm.uploadFileNameId || !showUploadConfirm.file) return;

    setIsUploading(showUploadConfirm.uploadFileNameId);
    const formData = new FormData();
    formData.append("attachment", showUploadConfirm.file);

    try {
      const response = await uploadPaperWorkFileAttachment({
        data: formData,
        tradeSheetId: spacificTradeSheetLisData.data.tradeSheetData.id,
        uploadFileNameId: showUploadConfirm.uploadFileNameId,
      }).unwrap();

      if (response.status && !isLoading) {
        refetch();
        trdaeSheetRefetch();
        toast.success(response.message);
        setIsUploading(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        toast.error(response.message);
        setIsUploading(null);
      }
    } catch (error: any) {
      setIsUploading(null);
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }

    // Close confirmation modal
    setShowUploadConfirm({ show: false, uploadFileNameId: null, file: null });
  };

  // Modified handleRemoveUploadedFile to show confirmation
  const handleRemoveUploadedFile = async (fileId: number, id: number) => {
    // Show confirmation modal instead of immediate removal
    setShowRemoveConfirm({
      show: true,
      tradeSheetId: fileId,
      fileId: id
    });
  };

  // New function to handle confirmed removal
  const handleConfirmedRemove = async () => {
    if (!showRemoveConfirm.tradeSheetId || !showRemoveConfirm.fileId) return;

    setIsRemoving({ tradeSheetId: showRemoveConfirm.tradeSheetId, fileId: showRemoveConfirm.fileId });
    try {
      const response = await deletePaperWorkFileAttachment(showRemoveConfirm.fileId).unwrap();

      if (response && !isLoading) {
        toast.success(response?.message);
        refetch();
        trdaeSheetRefetch();
        setIsRemoving(null);
      }
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
      setIsRemoving(null);
    }

    // Close confirmation modal
    setShowRemoveConfirm({ show: false, tradeSheetId: null, fileId: null });
  };

  const cancelSubmit = () => {
    setBtnLoading("cancel");
    toast.error("You are canceling the creation of the trade sheet!");
    navigate(
      `/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list`,
      { replace: true }
    );
  };

  // Handle the loading states for each button
  const handleButtonClick = (action: string) => {
    setBtnLoading(action);
  };

  // Modified upload others documents to show confirmation
  const handleOtherDocumentUpload = async (e) => {
    const rawFile = e.target.files[0];
    if (!rawFile || !otherDocumentName) return;

    const file = await guardFile(rawFile);
    if (!file) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Show confirmation modal instead of immediate upload
    setShowOtherUploadConfirm({
      show: true,
      file
    });
  };

  // New function to handle confirmed other document upload
  const handleConfirmedOtherUpload = async () => {
    if (!showOtherUploadConfirm.file || !otherDocumentName) return;

    setIsUploadingOther(true);
    const formData = new FormData();
    formData.append("attachment", showOtherUploadConfirm.file);
    formData.append("fileName", otherDocumentName);

    try {
      const response = await uploadOtherDocument({
        data: formData,
        tradeSheetId: spacificTradeSheetLisData.data.tradeSheetData.id,
      }).unwrap();

      setOtherDocumentName("");
      toast.success(response?.message);
      setIsUploadingOther(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
      setIsUploadingOther(false);
    }

    // Close confirmation modal
    setShowOtherUploadConfirm({ show: false, file: null });
  };

  // Modified delete other file to show confirmation
  const handleRemoveOtherFile = async (id) => {
    // Show confirmation modal instead of immediate removal
    setShowOtherRemoveConfirm({
      show: true,
      fileId: id
    });
  };

  // New function to handle confirmed other file removal
  const handleConfirmedOtherRemove = async () => {
    if (!showOtherRemoveConfirm.fileId) return;

    setIsDeletingOther(showOtherRemoveConfirm.fileId);
    try {
      const response = await deleteOtherAttachment(showOtherRemoveConfirm.fileId).unwrap();
      toast.success(response?.message);
      setIsDeletingOther(null);
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
      setIsDeletingOther(null);
    }

    // Close confirmation modal
    setShowOtherRemoveConfirm({ show: false, fileId: null });
  };

  const isMissing = (document: any) => {
    return missingFiles.some((file: any) => file.id === document.id);
  };

  console.log(paperworkDocuments);

  return (
    <div className="">
      <div className="flex justify-between items-center">
        <div>
          <h2>Uploaded Attachments</h2>
          <p>This are all attachments</p>
        </div>
        <div>
          <input type="text" placeholder="Search" />
        </div>
      </div>
      <div className="flex mt-5 bg-[#eaf4f2] px-2 py-2 items-center justify-between">
        <div className="w-[80px] ">
          <p>SN</p>
        </div>
        <div className="w-full">
          <p>Uploaded Attachments List</p>
        </div>
        <div>
          <img src={sortArrow} alt="" />
        </div>
      </div>

      <div className="">
        {paperworkDocuments?.map((document: any, index: number) => (
          <div key={index}>
            <div
              className={`flex px-2 border-b  border-[#eaf4f2] hover:bg-[#f8f8f8e3] py-2 items-center justify-between ${
                isMissing(document) && "border border-red-500"
              }`}
            >
              <div className="w-[80px] ">
                <p>{index + 1}</p>
              </div>
              <div className="w-full flex gap-1 items-center">
                <p>
                  {document.name.slice(0, 70)}
                  {document.name.length > 70 ? "  ..." : ""}
                </p>
                <p className="text-red-500">
                  {document.required === "yes" ? "*" : ""}
                </p>
                <p className=" text-gray-400">
                  {document.paperType == "singleUpload"
                    ? " (Only one file allowed)"
                    : " (Multiple files allowed)"}
                </p>

                {document.fileData?.length == 1
                  ? document.fileData.map((file: any, i: number) => (
                      <div key={i} className="flex items-center">
                        <p>
                          {" "}
                          <a
                            key={i}
                            href={getFileUrl(file.filePath)}
                            target="_blank"
                            className=" text-blue-500"
                          >
                            {"  "}
                            {file.filePath.split(/[/\\]/).pop()}
                          </a>
                        </p>

                        {isRemoving?.tradeSheetId == document.id &&
                        isRemoving?.fileId == file.id ? (
                          <ButtonLoader />
                        ) : (
                          <button
                            onClick={() =>
                              handleRemoveUploadedFile(document.id, file.id)
                            } // Pass file.id to enable re-uploading
                            className="text-white px-3 rounded-md"
                          >
                            <img src={crossIcon} alt="" />
                          </button>
                        )}
                      </div>
                    ))
                  : ""}
              </div>
              <div className="flex items-center gap-2">
                {document.paperType == "singleUpload" &&
                document.fileData.length == 0 ? (
                  <div>
                    <label htmlFor={document.name} className=" cursor-pointer">
                      <input
                        ref={fileInputRef}
                        onChange={(e) => handleUploadFile(e, document.id)}
                        type="file"
                        className="hidden"
                        id={document.name}
                      />

                      {isUploading == document.id ? (
                        <div className="-mb-2">
                          <ButtonLoader />
                        </div>
                      ) : (
                        <img src={uploadIcon} alt="" className="-mb-2" />
                      )}
                    </label>
                  </div>
                ) : document.paperType == "multipleUpload" ? (
                  <div>
                    <label htmlFor={document.name} className=" cursor-pointer">
                      <input
                        ref={fileInputRef}
                        onChange={(e) => handleUploadFile(e, document.id)}
                        type="file"
                        className="hidden"
                        id={document.name}
                      />
                      {isUploading == document.id ? (
                        <ButtonLoader />
                      ) : (
                        <img src={uploadIcon} alt="" className="-mb-2" />
                      )}
                    </label>
                  </div>
                ) : (
                  ""
                )}

                {/* {document.paperType !== "singleUpload" &&
                  document.fileData.length > 1 && (
                    <button className="text-primary">
                      <img src={downArrow} alt="" />
                    </button>
                  )} */}
              </div>
            </div>
            <div>
              {document.fileData.length > 1 && (
                <div>
                  {document.fileData.map((file: any, i: number) => (
                    <div
                      key={i}
                      className="ml-20 py-2 border-b border-[#eaf4f2] "
                    >
                      <p className="flex items-center">
                        <a
                          key={i}
                          href={getFileUrl(file.filePath)}
                          target="_blank"
                          className=" text-blue-500"
                        >
                          {"  "}
                          {file.filePath.split(/[/\\]/).pop()}
                        </a>
                        {isRemoving?.tradeSheetId == document.id &&
                        isRemoving?.fileId == file.id ? (
                          <ButtonLoader />
                        ) : (
                          <button
                            onClick={() =>
                              handleRemoveUploadedFile(document.id, file.id)
                            } // Pass file.id to enable re-uploading
                            className="text-white px-3 rounded-md"
                          >
                            <img src={crossIcon} alt="" />
                          </button>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* other files  */}
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-3">
            <p className="w-[80px] ">*</p>
            <p className=" ml-4 text-nowrap">Upload other documents</p>
            <input
              type="text"
              name=""
              id=""
              className="min-w-[300px]"
              placeholder="File name"
              value={otherDocumentName}
              onChange={(e) => {
                setOtherDocumentName(e.target.value);
              }}
            />
          </div>
          <div className={`${otherDocumentName ? "block" : "hidden "}`}>
            <label htmlFor="upload-others" className=" cursor-pointer">
              <input
                ref={fileInputRef}
                onChange={handleOtherDocumentUpload}
                type="file"
                className="hidden"
                id="upload-others"
              />

              {isUploadingOther ? (
                <ButtonLoader />
              ) : (
                <img src={uploadIcon} alt="" className="-mb-2" />
              )}
            </label>
          </div>
        </div>

        {/* all files others  */}
        <div>
          {spacificTradeSheetLisData?.data?.tradeSheetData?.paperWorkOtherAttachments?.map(
            (file: any, index: number) => (
              <div
                key={index}
                className="ml-20 py-2 border-b border-[#eaf4f2] "
              >
                <p className="flex items-center">
                  <a
                    key={index}
                    href={getFileUrl(file.filePath)}
                    target="_blank"
                    className=" text-blue-500"
                  >
                    {"  "}
                    {file.filePath.split(/[/\\]/).pop()}
                  </a>

                  <button
                    onClick={() => handleRemoveOtherFile(file.id)}
                    className="text-white px-3 rounded-md"
                  >
                    {isDeletingOther == file.id ? (
                      <ButtonLoader />
                    ) : (
                      <img src={crossIcon} alt="" />
                    )}
                  </button>
                </p>
              </div>
            )
          )}
        </div>
        <div className="flex justify-between my-5 mx-5">
          <button
            className="primary-btn flex-1 mx-2 my-2"
            onClick={() => {
              handleButtonClick("save-next");

              // Check if all required files are uploaded
              const missingRequiredFiles =
                data?.data?.uploadFileCategoryData?.uploadFileNames
                  .filter((file) => file.required === "yes")
                  .filter((file) => {
                    return !uploadedFiles?.some(
                      (upload) => upload.uploadFileNameId === file.id
                    );
                  });
              setMissingFiles(missingRequiredFiles);

              if (missingRequiredFiles.length > 0) {
                toast.error(
                  `Please fill in all required fields before proceeding.`
                );
                setBtnLoading(null); // Reset the loading state if validation fails
                return; // Stop the navigation if any required file is missing
              }

              // Proceed with navigation if all required files are uploaded
              navigate(
                `/dashboard/agent/pages/form/trade-sheet/preview-page/${uuid}`
              );
            }}
          >
            {btnLoading === "save-next" ? <ButtonLoader /> : "Save and Next"}
          </button>

          <button
            type="button"
            onClick={() => {
              handleButtonClick("save-exit");
              navigate(
                `/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list`
              );
            }}
            className="primary-btn flex-1 mx-2 my-2"
          >
            {btnLoading === "save-exit" ? <ButtonLoader /> : "Save and Exit"}
          </button>
          <button
            type="button"
            onClick={() => {
              handleButtonClick("save-draft");
              navigate(
                `/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list`
              );
            }}
            className="primary-btn flex-1 mx-2 my-2"
          >
            {btnLoading === "save-draft" ? <ButtonLoader /> : "Save as Draft"}
          </button>
          {(dynamicRepresentation === 'tenant' || dynamicRepresentation === "landlord") ? (
              <NavLink
                to={`/dashboard/agent/pages/form/trade-sheet/agent-details/${uuid}`}
                className="primary-btn flex-1 mx-2 my-2 text-center"
              >
                Go Back 
              </NavLink>
            ): <NavLink
            to={`/dashboard/agent/pages/form/trade-sheet/lawyer-details/${uuid}`}
            className="primary-btn flex-1 mx-2 my-2 text-center"
          >
            Go Back 
          </NavLink>}
          
          <button
            type="button"
            onClick={cancelSubmit}
            className="primary-btn flex-1 mx-2 my-2"
          >
            {btnLoading === "cancel" ? <ButtonLoader /> : "Cancel"}
          </button>
        </div>
      </div>

      {/* Upload Confirmation Modal */}
      {showUploadConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold">Confirm Upload</h3>
            <p className="py-6">Are you sure you want to upload "{showUploadConfirm.file?.name}"?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowUploadConfirm({ show: false, uploadFileNameId: null, file: null })}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedUpload}
                className="px-4 py-2 bg-[#0f766e] text-white rounded btn-sm"
              >
                Confirm Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold">Confirm Removal</h3>
            <p className="py-6">Are you sure you want to remove this file?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRemoveConfirm({ show: false, tradeSheetId: null, fileId: null })}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedRemove}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other Document Upload Confirmation Modal */}
      {showOtherUploadConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold">Confirm Upload</h3>
            <p className="py-6">Are you sure you want to upload "{showOtherUploadConfirm.file?.name}" as "{otherDocumentName}"?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowOtherUploadConfirm({ show: false, file: null })}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedOtherUpload}
                className="px-4 py-2 bg-[#0f766e] text-white rounded "
              >
                Confirm Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other File Remove Confirmation Modal */}
      {showOtherRemoveConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold">Confirm Removal</h3>
            <p className="py-6">Are you sure you want to remove this file?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowOtherRemoveConfirm({ show: false, fileId: null })}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedOtherRemove}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}

      {pdfSizeReductionModal}
    </div>
  );
};

export default DynamicPaperwork;