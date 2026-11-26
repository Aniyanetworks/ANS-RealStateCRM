// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useParams, useNavigate, NavLink } from "react-router-dom";
import {
  useDeleteOtherAttachmentMutation,
  useUploadOtherDocumentMutation,
} from "../../redux/api/agent/trade-sheet/tradeSheetSlice";
import { useGetUploadFileCategoriesQuery } from "../../redux/api/common/dynamicUploadFileSlice";
import { useChangePropertyListingStatusMutation, useDeletePaperWorkFileAttachmentPropertyMutation, useDeletePaperWorkOtherFileAttachmentPropertyMutation, useGetSpacificPropertyListingQuery,useUploadPaperWorkFileAttachmentPropertyMutation, useUploadPaperWorkOtherFileAttachmentPropertyMutation } from "../../redux/api/superadmin/propertyListingDataSlice";
import { useEffect, useRef, useState } from "react";
import sortArrow from "./../../assets/table-head-arrow.svg";

import uploadIcon from "./../../assets/upload2.svg";
import crossIcon from "./../../assets/cross.svg";
import toast from "react-hot-toast";
import { getFileUrl } from "../../utils/constant";
import TableLoader from "../loader/TableLoader";

import ButtonLoader from "../loader/buttonLoader";
import { usePdfSizeGuard } from "../../hooks/usePdfSizeGuard";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

const PaperworkPropertyListing = () => {
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
  const [missingFiles, setMissingFiles] = useState<object[]>([]);

  const { guardFile, modal: pdfSizeReductionModal } = usePdfSizeGuard(MAX_FILE_SIZE);

    const [changePropertyListingStatus] =
      useChangePropertyListingStatusMutation();
  const [uploadPaperWorkFileAttachment] =
    useUploadPaperWorkFileAttachmentPropertyMutation();

  const [uploadOtherDocument] = useUploadPaperWorkOtherFileAttachmentPropertyMutation();

  const [deletePaperWorkFileAttachmentProperty] =
    useDeletePaperWorkFileAttachmentPropertyMutation();
  const [deleteOtherAttachment] = useDeletePaperWorkOtherFileAttachmentPropertyMutation();

  const {
    data: spacificPropertyListingData,
    isLoading,
    refetch,
  } = useGetSpacificPropertyListingQuery(uuid);
  const [paperworkDocuments, setPaperworkDocuments] = useState<object[]>([]);
  const uploadFileCategory =
    spacificPropertyListingData?.data?.propertyListingData?.representation ===
      "landlord" ||
    spacificPropertyListingData?.data?.propertyListingData?.representation === "seller"
      ? "listing-paperwork"
      : "co-op-paperwork";
  const fileInputRef: any = useRef(null);
  const uploadedFiles =
    spacificPropertyListingData?.data?.propertyListingData?.propertyListingAttachment;

  const {
    data,
    isLoading: tradeSheetLoading,
    refetch: trdaeSheetRefetch,
  } = useGetUploadFileCategoriesQuery({
    slug: uploadFileCategory,
    representation:'seller'
  });

  useEffect(() => {
    if (!tradeSheetLoading && data) {
      setFetchLoading(true);
      const propertyListingListType = spacificPropertyListingData?.data?.propertyListingData?.listType;
      
      const activeDocuments =
        data?.data?.uploadFileCategoryData?.uploadFileNames?.filter(
          (file: FileType) => {
            if (file.status !== "active" || file.showOnPropertyListing !== "Yes") {
              return false;
            }
            
            if (propertyListingListType) {
              const fileListType = file.listType;
              
              if (propertyListingListType === "Both") {
                return true;
              }
              
              if (propertyListingListType === "Commercial") {
                return fileListType === "Commercial" || fileListType === "Both";
              }
              
              if (propertyListingListType === "Residential") {
                return fileListType === "Residential" || fileListType === "Both";
              }
              
              return fileListType === propertyListingListType || fileListType === "Both";
            }
            
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
  }, [data, spacificPropertyListingData]);

  if (isLoading && tradeSheetLoading && fetchLoading && data) {
    return <TableLoader />;
  }

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

    setIsUploading(uploadFileNameId);
    const formData = new FormData();
    formData.append("attachment", file);

    try {
      const response = await uploadPaperWorkFileAttachment({
        data: formData,
        propertyListingId: spacificPropertyListingData.data.propertyListingData.id,
        uploadFileNameId,
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

    if (file) {
      file = null;
    }
  };

  const handleRemoveUploadedFile = async (fileId: number, id: number) => {
    setIsRemoving({ tradeSheetId: fileId, fileId: id });
    try {
      const response = await deletePaperWorkFileAttachmentProperty(id).unwrap();

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
      `/dashboard/super-admin/property-listing`,
      { replace: true }
    );
  };

  const handleButtonClick = async(action: string) => {
    setBtnLoading(action);

    if(action=='save-draft')
    {
      await changePropertyListingStatus({
        data: {
          status:'draft',
        },
        uuid: uuid,
      }).unwrap();
    }
    if (action === 'save-next') {
      await changePropertyListingStatus({
        data: {
          status: spacificPropertyListingData?.data?.propertyListingData?.status === 'draft'
            ? 'underReview'
            : spacificPropertyListingData?.data?.propertyListingData?.status || 'underReview',
        },
        uuid: uuid,
      }).unwrap();
    }
    

    if(action=='save-exit')
    {
      await changePropertyListingStatus({
        data: {
          status:spacificPropertyListingData?.data?.propertyListingData?.status || 'draft',
        },
        uuid: uuid,
      }).unwrap();
    }

  };

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
        propertyListingId: spacificPropertyListingData.data.propertyListingData.id,
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
  };

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

  const isMissing = (document: any) => {
    return missingFiles.some((file: any) => file.id === document.id);
  };

  return (
    <div className="">
      <div className="flex justify-between items-center">
        <div>
          <h2>Uploaded Attachments Property Listing</h2>
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
                  {document.propertyListingRequired === "Yes" ? "*" : ""}
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
                            }
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
                {document.paperType == "singleUpload"  ? (
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

              </div>
            </div>
            <div>
              {document?.fileData?.length > 1 && (
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
                            }
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

        <div>
          {spacificPropertyListingData?.data?.propertyListingData?.propertyListingOtherAttachment?.map(
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

              const missingRequiredFiles =
                data?.data?.uploadFileCategoryData?.uploadFileNames
                  .filter((file) => file.propertyListingRequired === "Yes")
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
                setBtnLoading(null);
                return;
              }

              navigate(
                `/dashboard/super-admin/property-listing`
              );
            }}
          >
            {btnLoading === "save-next" ? <ButtonLoader /> : "Save and Finish"}
          </button>

          <button
            type="button"
            onClick={() => {
              handleButtonClick("save-exit");
              navigate(
                `/dashboard/super-admin/property-listing`
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
                `/dashboard/super-admin/property-listing`
              );
            }}
            className="primary-btn flex-1 mx-2 my-2"
          >
            {btnLoading === "save-draft" ? <ButtonLoader /> : "Save as Draft"}
          </button>
          <NavLink
            to={`/dashboard/super-admin/create-update-property-listing/${uuid}`}
            className="primary-btn flex-1 mx-2 my-2 text-center"
          >
            Go Back
          </NavLink>
          <button
            type="button"
            onClick={cancelSubmit}
            className="primary-btn flex-1 mx-2 my-2"
          >
            {btnLoading === "cancel" ? <ButtonLoader /> : "Cancel"}
          </button>
        </div>
      </div>

      {pdfSizeReductionModal}
    </div>
  );
};

export default PaperworkPropertyListing;
