// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useEffect, useState, useRef } from "react";
import TradeSheetSteps from "../../../../../../components/Stepper/TradeSheetSteps";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { useGetUploadFileCategoriesQuery } from "../../../../../../redux/api/common/dynamicUploadFileSlice";
import {
  useDeletePaperWorkFileAttachmentMutation,
  useGetSpacificTradeSheetListDataQuery,
  useUploadPaperWorkFileAttachmentMutation,
  useUploadOtherDocumentMutation,
  useDeleteOtherAttachmentMutation,
} from "../../../../../../redux/api/agent/trade-sheet/tradeSheetSlice";
import toast from "react-hot-toast";
import { getFileUrl } from "../../../../../../utils/constant";
import uploadImg from "./../../../../../../assets/upload.svg";
import crossIcon from "./../../../../../../assets/cross.svg";
import TableLoader from "../../../../../../components/loader/TableLoader";
import ButtonLoader from "../../../../../../components/loader/buttonLoader";

const TradeSheetPaperworkAttachmentUpload: React.FC = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(null);
  const [isDeleting, setIsDelating] = useState(null);
  const [uploadedOtherDocuments, setUploadedOtherDocuments] = useState([]);
  const [otherDocumentName, setOtherDocumentName] = useState(""); // State for other document name
  const [isOtherDocumentUploaderEnabled, setIsOtherDocumentUploaderEnabled] = useState(false); // State for enabling uploader
  const fileInputRef = useRef(null);

  const { uuid } = useParams<{ uuid?: string }>();
  const { data: spacificTradeSheetLisData, isLoading} = useGetSpacificTradeSheetListDataQuery(uuid);

  const uploadFileCategory =
    spacificTradeSheetLisData?.data?.tradeSheetData?.representation ===
      "landlord" ||
    spacificTradeSheetLisData?.data?.tradeSheetData?.representation === "seller"
      ? "listing-paperwork"
      : "co-op-paperwork";

  const uploadedFiles =
    spacificTradeSheetLisData?.data?.tradeSheetData?.paperWorkAttachmentFiles;

  useEffect(() => {
    if (spacificTradeSheetLisData?.data?.tradeSheetData?.paperWorkOtherAttachments) {
      setUploadedOtherDocuments(spacificTradeSheetLisData.data.tradeSheetData.paperWorkOtherAttachments);
    }
  }, [spacificTradeSheetLisData]);

  const { data} = useGetUploadFileCategoriesQuery({
    slug: uploadFileCategory, // Ensure uploadFileCategory is available and valid
    representation: spacificTradeSheetLisData?.data?.tradeSheetData?.representation, // Safely access the representation
  });

  const [uploadPaperWorkFileAttachment] = useUploadPaperWorkFileAttachmentMutation();
  const [deletePaperWorkFileAttachment] = useDeletePaperWorkFileAttachmentMutation();
  const [uploadOtherDocument] = useUploadOtherDocumentMutation();
  const [deleteOtherAttachment] = useDeleteOtherAttachmentMutation();

  const handleRemoveUploadedFile = async (id) => {
    setIsDelating(id);
    try {
      const response = await deletePaperWorkFileAttachment(id).unwrap();
      toast.success(response?.message);
      if (response && !isLoading) {
        setIsDelating(null);
      }
    } catch (error: any) {
      if (response) {
        setIsDelating(null);
      }
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  const handleUplaodFile = async (e, uploadFileNameId) => {
    setIsUploading(uploadFileNameId);
    const formData = new FormData();
    formData.append("attachment", e.target.files[0]);

    try {
      const response = await uploadPaperWorkFileAttachment({
        data: formData,
        tradeSheetId: spacificTradeSheetLisData.data.tradeSheetData.id,
        uploadFileNameId,
      }).unwrap();
      if (response && !isLoading) {
        setIsUploading(null);
      }
      toast.success(response?.message);
    } catch (error: any) {
      setIsUploading(null);
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOtherDocumentUpload = async (e) => {
    setIsUploading('otherFile');

    const formData = new FormData();
    formData.append("attachment", e.target.files[0]);
    formData.append("fileName", otherDocumentName);

    try {
      const response = await uploadOtherDocument({
        data: formData,
        tradeSheetId: spacificTradeSheetLisData.data.tradeSheetData.id,
   
      }).unwrap();

      setOtherDocumentName(""); // Clear the input
      setIsOtherDocumentUploaderEnabled(false); // Disable the uploader

      toast.success(response?.message);
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveOtherFile = async (id) => {
    setIsDelating('otherFile');
    try {
      const response = await deleteOtherAttachment(id).unwrap();
      toast.success(response?.message);
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
    setIsDelating(false);
  };

  const cancelSubmit = () => {
    setBtnLoading('cancel');
    toast.error("You are canceling the creation of the trade sheet!");
    navigate(
      `/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list`,
      { replace: true }
    );
  };

  const [btnLoading, setBtnLoading] = useState<string | null>(null);

  // Handle the loading states for each button
  const handleButtonClick = (action: string) => {
    setBtnLoading(action);
  };

  return (
    <div>
      {/* <h2 className="uppercase text-center bg-[#c9c1c13d] py-5">Trade Sheet</h2> */}
      <TradeSheetSteps active={7} uuid={uuid} />

      {!data ? (
        <TableLoader />
      ) : (
        <div className="max-w-full mt-8 border border-gray-300/30 rounded-md ">
          <div className="px-8 py-6 ">
            <h3>Attachment Upload</h3>
            <div className="grid grid-cols-1 mt-5 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
              {data?.data?.uploadFileCategoryData?.uploadFileNames
                .filter((file) => file.status === "active")
                .map((file) => (
                  <div
                    key={file.id}
                    className="flex rounded-md border p-5 flex-col"
                  >
                    <div>
                      <p className="mb-2">
                        {file.name}
                        {file.required === "yes" && (
                          <span className="text-red-500">*</span>
                        )}
                        {file.paperType === "singleUpload" ? (
                          <span className="text-gray-500">
                            (Only one file allowed)
                          </span>
                        ) : (
                          <span className="text-gray-500">
                            (Multiple files allowed)
                          </span>
                        )}
                      </p>

                      <label
                        className={`flex justify-center items-center py-2 border border-dashed border-gray-400 rounded-md gap-2 hover:border-blue-500 w-[300px] ${
                          file.paperType === "singleUpload" &&
                          uploadedFiles?.some(
                            (upload) => upload.uploadFileNameId === file.id
                          )
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                        }`}
                        htmlFor={file.name}
                      >
                        <input
                          ref={fileInputRef} // Reference to the file input
                          type="file"
                          className="hidden"
                          id={file.name}
                          name={file.name}
                          required={file.required === "yes"}
                          onChange={(e) => handleUplaodFile(e, file.id)}
                          disabled={
                            file.paperType === "singleUpload" &&
                            uploadedFiles?.some(
                              (upload) => upload.uploadFileNameId === file.id
                            )
                          } // Disable after file is uploaded
                        />
                        {isUploading === file.id ? (
                          <ButtonLoader />
                        ) : (
                          <>
                            <img src={uploadImg} alt="" />
                            <span>Upload files</span>
                          </>
                        )}
                      </label>
                    </div>

                    {/* Display uploaded files */}
                    <div className="mt-2">
                      {uploadedFiles
                        ?.filter(
                          (upload) => upload.uploadFileNameId === file.id
                        )
                        .map((uploadedFile, index) => (
                          <div
                            key={uploadedFile.id}
                            className="p-2 flex items-center gap-2"
                          >
                            <NavLink
                              to={getFileUrl(uploadedFile.filePath)}
                              className="text-blue-600"
                              target="_blank"
                            >
                              <span>{index + 1}. </span>
                              {/* <span>
                                {uploadedFile.filePath
                                  .replace(
                                    "public/uploads/tradesheet-paperwork/",
                                    ""
                                  )
                                  .split("\\")
                                  .pop()}{" "}
                              </span> */}
                              <span>
                                {uploadedFile.filePath
                                  .split(/[/\\]/) // Split by both forward slashes (/) and backslashes (\)
                                  .pop()}{" "}
                                {/* Get the last part of the split path */}
                              </span>
                            </NavLink>
                            <button
                              onClick={() =>
                                handleRemoveUploadedFile(
                                  uploadedFile.id,
                                  file.id
                                )
                              } // Pass file.id to enable re-uploading
                              className="text-white px-3 rounded-md"
                            >
                              {isDeleting === uploadedFile.id ? (
                                <ButtonLoader />
                              ) : (
                                <img src={crossIcon} alt="" />
                              )}
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}

              {/* Other Document Section */}
              {/* Other Document Section */}
              <div className="flex rounded-md border p-5 flex-col">
                <div>
                  <p className="mb-2">Other Document</p>
                  <input
                    ref={fileInputRef} // Reference to the file input
                    type="text"
                    value={otherDocumentName}
                    onChange={(e) => {
                      setOtherDocumentName(e.target.value);
                      setIsOtherDocumentUploaderEnabled(e.target.value !== "");
                    }}
                    placeholder="Enter file name"
                    className="p-2 border border-gray-400 rounded-md w-[300px]"
                  />
                  <label
                    className={`flex justify-center items-center py-2 border border-dashed border-gray-400 rounded-md gap-2 hover:border-blue-500 w-[300px] mt-3 ${
                      isOtherDocumentUploaderEnabled
                        ? "cursor-pointer"
                        : "cursor-not-allowed opacity-50"
                    }`}
                    htmlFor="other_document"
                  >
                    <input
                      type="file"
                      className="hidden"
                      id="other_document"
                      name="other_document"
                      onChange={handleOtherDocumentUpload}
                      disabled={!isOtherDocumentUploaderEnabled}
                    />
                    {isUploading == "otherFile" && <ButtonLoader />}
                    {isOtherDocumentUploaderEnabled ? (
                      <>
                        <img src={uploadImg} alt="" />
                        <span>Upload files</span>
                      </>
                    ) : (
                      <span className="text-gray-400">
                        Upload Other Document
                      </span>
                    )}
                  </label>
                </div>

                {/* Display other uploaded documents */}
                <div className="mt-2">
                  {uploadedOtherDocuments.map((otherDocument, index) => (
                    <div
                      key={otherDocument.id}
                      className="p-2 flex items-center gap-2"
                    >
                      <NavLink
                        to={getFileUrl(otherDocument.filePath)}
                        className="text-blue-600"
                        target="_blank"
                      >
                        <span>{index + 1}. </span>
                        {/* <span>
                          {otherDocument.filePath
                            .replace(
                              "public/uploads/tradesheet-other-documents/",
                              ""
                            )
                            .split("\\")
                            .pop()}{" "}
                        </span> */}
                        <span>
                          {otherDocument.filePath
                            .split(/[/\\]/) // Split by both forward slashes (/) and backslashes (\)
                            .pop()}{" "}
                          {/* Get the last part of the split path */}
                        </span>
                      </NavLink>
                      <button
                        onClick={() => handleRemoveOtherFile(otherDocument.id)}
                        className="text-white px-3 rounded-md"
                      >
                        {isDeleting === "otherFile" ? (
                          <ButtonLoader />
                        ) : (
                          <img src={crossIcon} alt="" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
                    .some((file) => {
                      return !uploadedFiles?.some(
                        (upload) => upload.uploadFileNameId === file.id
                      );
                    });

                if (missingRequiredFiles) {
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
            <button
              type="button"
              onClick={cancelSubmit}
              className="primary-btn flex-1 mx-2 my-2"
            >
              {btnLoading === "cancel" ? <ButtonLoader /> : "Cancel"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeSheetPaperworkAttachmentUpload;