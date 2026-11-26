// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useParams, useNavigate, NavLink, Link } from "react-router-dom";
import { Tabs } from "antd";
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

const PaperworkAdditional = ({ uuid }) => {
  const navigate = useNavigate();
  const [btnLoading, setBtnLoading] = useState<string | null>(null);
  // const { uuid } = useParams<{ uuid?: string }>();
  const [otherDocumentName, setOtherDocumentName] = useState("");
  const [isUploading, setIsUploading] = useState<number | null>(null);
  const [isUploadingOther, setIsUploadingOther] = useState<boolean>(false);
  const [isRemoving, setIsRemoving] = useState<{
    tradeSheetId: number;
    fileId: number;
  } | null>(null);
  const [isDeletingOther, setIsDeletingOther] = useState<number | null>(null);
  const [fetchLoading, setFetchLoading] = useState<boolean>(false);
  const [activeRepresentation, setActiveRepresentation] = useState<string | null>(
    null
  );
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
  // Determine representation info, including support for multiple representation trades
  const tradeSheetData = spacificTradeSheetLisData?.data?.tradeSheetData;
  const multipleRepString = tradeSheetData?.multipleRepresentation || "";
  const multipleRepsArray = multipleRepString
    ? multipleRepString.split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];
  const firstMultipleRep = multipleRepsArray[0];

  useEffect(() => {
    if (
      tradeSheetData?.representationType === "multiple" &&
      multipleRepsArray.length &&
      !activeRepresentation
    ) {
      setActiveRepresentation(firstMultipleRep);
    }
  }, [tradeSheetData?.representationType, multipleRepsArray.join(","), activeRepresentation, firstMultipleRep]);

  const representationForCategory =
    tradeSheetData?.representationType === "multiple"
      ? activeRepresentation || firstMultipleRep || tradeSheetData?.representation
      : tradeSheetData?.representation;

  const uploadFileCategory =
    representationForCategory === "landlord" || representationForCategory === "seller"
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
    representation: representationForCategory, // Use normalized representation for both single and multiple types
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

  const handleUploadFile = async (e: any, uploadFileNameId: number) => {
    const rawFile = e.target.files[0];
    if (!rawFile) return;

    let file = await guardFile(rawFile);
    if (!file) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setIsUploading(uploadFileNameId);
    const formData = new FormData();
    formData.append("attachment", file);

    try {
      const response = await uploadPaperWorkFileAttachment({
        data: formData,
        tradeSheetId: spacificTradeSheetLisData.data.tradeSheetData.id,
        uploadFileNameId,
      }).unwrap();

      if (response.status && !isLoading) {
        refetch();

        trdaeSheetRefetch();
        toast.success(response.message);
        setIsUploading(null);
      } else {
        toast.error(response.message);
        setIsUploading(null);
      }
    } catch (error: any) {
      // setIsUploading(null);
      setIsUploading(null);
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }

    if (file) {
      file = null;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveUploadedFile = async (fileId: number, id: number) => {
    setIsRemoving({ tradeSheetId: fileId, fileId: id });
    try {
      const response = await deletePaperWorkFileAttachment(id).unwrap();

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

  // upload others documents
  const handleOtherDocumentUpload = async (e) => {
    const rawFile = e.target.files[0];
    if (!rawFile) return;

    const file = await guardFile(rawFile);
    if (!file) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setIsUploadingOther(true);

    const formData = new FormData();
    formData.append("attachment", file);
    formData.append("fileName", otherDocumentName);

    try {
      const response = await uploadOtherDocument({
        data: formData,
        tradeSheetId: spacificTradeSheetLisData.data.tradeSheetData.id,
      }).unwrap();

      setOtherDocumentName("");

      toast.success(response?.message);
      setIsUploadingOther(false);
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
      setIsUploadingOther(false);
    }
    // setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // delete other file
  const handleRemoveOtherFile = async (id) => {
    setIsDeletingOther(id);
    try {
      const response = await deleteOtherAttachment(id).unwrap();
      toast.success(response?.message);
      setIsDeletingOther(null);
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
      setIsDeletingOther(null);
    }
  };

  return (
    <div className="">
      <div className="flex justify-between items-center">
        <div>
          <h2>Additional Uploaded Attachments</h2>
          <p>This are all attachments</p>
        </div>
        <div>
          <input type="text" placeholder="Search" />
        </div>
      </div>

      {tradeSheetData?.representationType === "multiple" &&
        multipleRepsArray.length > 0 && (
          <div className="mt-4">
            <Tabs
              type="card"
              activeKey={activeRepresentation || firstMultipleRep}
              onChange={(key) => setActiveRepresentation(key)}
              items={multipleRepsArray.map((rep) => ({
                key: rep,
                label: rep.charAt(0).toUpperCase() + rep.slice(1),
              }))}
            />
          </div>
        )}

      <div className="flex mt-5 bg-[#f4f1ec] px-2 py-2 items-center justify-between">
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
            <div className="flex px-2 border-b border-[#f4f1ec] hover:bg-[#f8f8f8e3] py-2 items-center justify-between">
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
                      <div className="flex items-center">
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

                        {/* {isRemoving?.tradeSheetId == document.id &&
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
                        )} */}
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
                        onChange={(e) => handleUploadFile(e, document.id)}
                        type="file"
                        className="hidden"
                        id={document.name}
                        ref={fileInputRef}
                      />

                      {isUploading == document.id ? (
                        <ButtonLoader />
                      ) : (
                        <img src={uploadIcon} alt="" className="-mb-2" />
                      )}
                    </label>
                  </div>
                ) : document.paperType == "multipleUpload" ? (
                  <div>
                    <label htmlFor={document.name} className=" cursor-pointer">
                      <input
                        onChange={(e) => handleUploadFile(e, document.id)}
                        type="file"
                        className="hidden"
                        id={document.name}
                        ref={fileInputRef}
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
                      className="ml-20 py-2 border-b border-[#f4f1ec] "
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
                        {/* {isRemoving?.tradeSheetId == document.id &&
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
                        )} */}
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
                className="ml-20 py-2 border-b border-[#f4f1ec] "
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

                  {/* <button
                    onClick={() => handleRemoveOtherFile(file.id)}
                    className="text-white px-3 rounded-md"
                  >
                    {isDeletingOther == file.id ? (
                      <ButtonLoader />
                    ) : (
                      <img src={crossIcon} alt="" />
                    )}
                  </button> */}
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {pdfSizeReductionModal}
    </div>
  );
};

export default PaperworkAdditional;
