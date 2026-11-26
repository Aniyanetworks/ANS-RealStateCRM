// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any

import "react-quill-new/dist/quill.snow.css";

import { useEffect, useRef, useState } from "react";

import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import momentTimezone from "moment-timezone";
import moment from "moment-timezone";

import { useGetPropertyListingQuery } from "../../../../../redux/api/superadmin/propertyListingDataSlice";
import {
  useCreateUpdateReceiptManageMutation,
  useDeleteReceiptManageMultipleMutation,
  useDeleteReceiptManageMutation,
  useGetReceiptManageQuery,
} from "../../../../../redux/api/superadmin/receiptManageDataSlice";
import { useAppSelector } from "../../../../../redux/hooks";
import { convertUrlToBase64 } from "../../../../../utils/convertUrlToBase64";
import { usePermissions } from "../../../../../utils/permissionUtils";
import ReceiptModal from "./ReceiptModal";
import RefundSection from "./RefundSection";
import type { DataType, ImageItem } from "./types";
import ReceiptHeader from "./components/ReceiptHeader";
import ReceiptTable from "./components/ReceiptTable";
import ReceiptForm from "./components/ReceiptForm";
import DeleteModals from "./components/DeleteModals";

const ReceiptManagement = () => {
  const { user } = useAppSelector((state: { user: { signature?: string; firstName?: string; lastName?: string } }) => state.user);
  const { hasPermissionForSlug } = usePermissions();

  // Modal Open Close Variable
  const [isReceiptCreateModalOpen, setIsReceiptCreateModalOpen] =
    useState(false);
  const [, setIsEditMode] = useState(false);
  const [auditInfo, setAuditInfo] = useState<{ createdByName?: string; updatedByName?: string; createdAt?: string; updatedAt?: string } | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptModalData, setReceiptModalData] = useState([]);
  const [isRefundModal, setIsRefundModal] = useState<boolean>(false);
  const [isModalDeleteVisible, setIsModalDeleteVisible] = useState(false);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);

  // Set Data Variable
  const signatureRef = useRef({});
  // Tracks whether an existing receipt is currently loaded for editing, so the
  // async "autofill my own profile signature" effect below can't race ahead of
  // handleEditReceiptMode and stomp the receipt's own saved signature.
  const isEditingReceiptRef = useRef(false);
  // Signature the receipt was loaded with (edit mode), so an unchanged signature isn't re-uploaded on save.
  const originalSignatureRef = useRef<string>("");
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedPropertyListingId, setSelectedPropertyListingId] = useState<
    string | number
  >("");
  const [selectedUUID, setSelectedUUID] = useState<string | "null">("null");
  const [uploadBankReceiptImages, setUploadBankReceiptImages] = useState<
    ImageItem[]
  >([]);
  const [uploadSignatureImage, setUploadSignatureImage] = useState("");
  const [, setUploadRefundReceipt] = useState("");

  // Api hook
  const { data, isLoading, refetch } = useGetReceiptManageQuery("");
  const { data: propertyListingData } = useGetPropertyListingQuery("");

  const [deleteReceiptManage] = useDeleteReceiptManageMutation();
  const [createUpdateReceiptManage, { isLoading: isLoadingCreate }] =
    useCreateUpdateReceiptManageMutation();
  const [deleteMultipleReceiptManage] =
    useDeleteReceiptManageMultipleMutation();

  const {
    register,
    reset,
    formState: { errors },
    getValues,
    setError,
    handleSubmit,
    setValue,
    watch,
    trigger,
  } = useForm<DataType>({});

  //Other Variable
  const propertyListingOptions =
    propertyListingData?.data?.propertyListingData
      ?.map((item) => {
        const addressParts = [
          item.address,
          item.addressTwo,
          item.city?.name,
          item.state?.name,
          item.postalCode,
        ].filter(Boolean);
        const cleanAddress = addressParts.length > 0 ? addressParts.join(", ") : (item.propertyAddress ?? "");
        return {
          value: item.id,
          propertyAddress: cleanAddress,
          label: cleanAddress,
          listingStatus: item.listingStatus,
          status: item.status,
          tradeSheets: item.tradeSheet || [],
        };
      }) || [];
  const paymentMethodChange = watch("paymentMethod");
  const torontoDate = momentTimezone()
    .tz("America/Toronto")
    .format("YYYY-MM-DDTHH:mm");

  const [searchText, setSearchText] = useState("");

  // Pre-fills the Signature Upload field with the logged-in user's own saved
  // profile signature, for the "Create New Receipt" flow. Guarded so it can
  // never overwrite an existing receipt's own signature loaded for editing.
  const autofillOwnSignature = () => {
    if (!user?.signature) return;
    convertUrlToBase64(user.signature)
      .then((base64String) => {
        if (isEditingReceiptRef.current) return; // an existing receipt's own signature is loaded; don't overwrite it
        setUploadSignatureImage(base64String);
        setValue("signatureIamge", base64String);
      })
      .catch((error) => {
        console.error("Error converting image to base64:", error);
      });
  };

  useEffect(() => {
    autofillOwnSignature();

    if (data?.data?.receiptData) {
      setTableData(data.data.receiptData);
    }
    if (user?.firstName && user?.lastName) {
      setValue("receivedBy", user.firstName + " " + user.lastName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Add cleanup effect for object URLs
  useEffect(() => {
    return () => {
      uploadBankReceiptImages.forEach((image) => {
        if (!image.isExisting && image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function related code added
  const showModalReceiptCreate = () => setIsReceiptCreateModalOpen(true);

  const handleCreateNewReceiptModal = () => {
    isEditingReceiptRef.current = false;
    setSelectedPropertyListingId("");
    // Start from a clean signature field, then refill from the profile
    // signature — covers reopening "Add New" after a Cancel, where the
    // [data]-effect (tied to receipt list refetches, not modal opens) won't
    // have re-run to refill it on its own.
    setUploadSignatureImage("");
    setValue("signatureIamge", "");
    autofillOwnSignature();
    showModalReceiptCreate();
  };

  // The receipt shown in the preview/refund modals, re-read from the latest list so updates appear right away.
  const liveReceiptModalData =
    tableData.find((r: any) => r?.uuid && r.uuid === (receiptModalData as any)?.uuid) || receiptModalData;

  const handleReceiptModal = (record: DataType) => {
    setReceiptModalData(record);
    setIsReceiptModalOpen(true);
  };

  const handleRefundModal = (record: DataType) => {
    setReceiptModalData(record);
    setIsRefundModal(true);
  };

  const resetForm = () => {
    originalSignatureRef.current = "";
    setValue("date", torontoDate);
    setValue("propertyListingId", "");
    setValue("propertyAddress", "");
    setValue("receivedFrom", "");
    setValue("representation", "");
    setValue("paymentType", "");
    setValue("paymentMethod", "");
    setValue("bankDraftNumber", "");
    setValue("transactionType", "");
    setValue("amountReceived", "");
    setValue("receivedBy", "");
    setValue("signatureIamge", "");
    setValue("bankDraftImage", "");
    setValue("refundReceiptAndMutualReleaseFile", "");

    setUploadBankReceiptImages([]);
    setUploadSignatureImage("");
    setSelectedUUID("null");

    // First, clean up any object URLs
    uploadBankReceiptImages.forEach((image) => {
      if (!image.isExisting && image.preview) {
        URL.revokeObjectURL(image.preview);
      }
    });

    // Clear signature pad if exists
    if (signatureRef.current) {
      signatureRef.current.clear();
    }

    clearSignature();
    setAuditInfo(null);
    setIsReceiptCreateModalOpen(false);
    setIsEditMode(false);
    isEditingReceiptRef.current = false;
  };

  const handleCancel = () => {
    setIsReceiptModalOpen(false);
    setIsRefundModal(false);
    setIsModalDeleteVisible(false);
    setIsDeleteModalMultipleVisible(false);
    setSelectedUUID("null");
  };

  const handleResponseError = (response: { error?: { data?: { status?: boolean; errors?: Array<{ path: string; msg: string }>; message?: string } }; data?: { status?: boolean } }) => {
    if (response?.error?.data?.status === false) {
      if (response.error.data.errors) {
        response.error.data.errors.forEach((error: { path: string; msg: string }) => {
          setError(error.path, {
            type: "manual",
            message: error.msg,
          });
        });
      } else {
        toast.error(response.error.data.message);
      }
    } else if (response?.data?.status === true) {
      setIsReceiptCreateModalOpen(false);
      resetForm();
    }
  };

  // Create and Edit receipt
  const onSubmit = async () => {
    try {
      const data = getValues();
      const formData = new FormData();

      // Send only the fields the API saves. The edit form is loaded with the whole receipt record, which includes
      // base64 copies of the bank receipt files (bankDraftImagePath) and signature; posting those exceeds the
      // upload field limit ("Field value too long") and re-saves file contents.
      const RECEIPT_FIELDS = [
        "date", "propertyAddress", "propertyListingId", "receivedFrom", "representation", "paymentType",
        "paymentMethod", "bankDraftNumber", "transactionType", "amountReceived", "receivedBy",
      ];
      for (const key of RECEIPT_FIELDS) {
        if (data[key] !== undefined && data[key] !== null) formData.append(key, data[key]);
      }
      // Signature: only when it was drawn/uploaded in this form (an unchanged signature is kept by the API).
      if (data.signatureIamge && data.signatureIamge !== originalSignatureRef.current) {
        formData.append("signatureIamge", data.signatureIamge);
      }

      // Handle images
      if (selectedUUID === "null") {
        // For new creation
        uploadBankReceiptImages
          .filter((item) => item.file)
          .forEach((item) => {
            if (item.file) {
              formData.append("bankDraftImage", item.file);
            }
          });
      } else {
        // For updates
        // Add existing image paths
        const existingPaths = uploadBankReceiptImages
          .filter((item) => item.isExisting)
          .map((item) => item.path);
        formData.append("existingImages", JSON.stringify(existingPaths));

        // Add new files
        uploadBankReceiptImages
          .filter((item) => !item.isExisting && item.file)
          .forEach((item) => {
            if (item.file) {
              formData.append("bankDraftImage", item.file);
            }
          });
      }

      console.log("Submitting form data:", {
        uuid: selectedUUID,
        existingImages: uploadBankReceiptImages.filter((img) => img.isExisting)
          .length,
        newImages: uploadBankReceiptImages.filter((img) => !img.isExisting)
          .length,
      });

      const response = await createUpdateReceiptManage({
        uuid: selectedUUID,
        data: formData,
      });

      if (response.data.status) {
        handleResponseError(response);
        toast.success(response.data.message);
        resetForm();
        refetch();
      } else {
        handleResponseError(response);
        toast.error(response.data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  // Edit method
  const handleEditReceiptMode = (record: DataType) => {
    isEditingReceiptRef.current = true;
    try {
      // Format date for the form
      const formattedRecord = {
        ...record,
        date: moment
          .utc(record.date)
          .tz("America/Toronto")
          .format("YYYY-MM-DDTHH:mm"),
        // Ensure numeric values are properly formatted
        propertyListingId: record.propertyListingId?.toString(),
        amountReceived: record.amountReceived?.toString(),
      };

      // Set property listing ID
      setSelectedPropertyListingId(formattedRecord?.propertyListingId || "");

      // Handle existing bank draft images: keep each file's stored location (path) for saving and show its
      // displayable copy (src). Older API responses only have bankDraftImagePath (display copies).
      try {
        const existingItems: { path: string; src: string | null }[] = Array.isArray(record.bankDraftImages)
          ? record.bankDraftImages
          : (record.bankDraftImagePath ? JSON.parse(record.bankDraftImagePath) : []).map((p: string) => ({ path: p, src: p }));
        const existingImages = existingItems.map((item) => ({
          preview: item.src || "",
          isExisting: true,
          path: item.path,
        }));
        setUploadBankReceiptImages(existingImages);
      } catch (error) {
        console.error("Error parsing bankDraftImagePath:", error);
        setUploadBankReceiptImages([]);
      }

      // Handle signature image (remember the loaded one so an unchanged signature isn't re-uploaded on save)
      originalSignatureRef.current = record.signature || "";
      if (record.signature) {
        setUploadSignatureImage(record.signature);
        setValue("signatureIamge", record.signature);
      } else {
        setUploadSignatureImage("");
        setValue("signatureIamge", "");
      }

      // Handle refund receipt and mutual release files if they exist
      if (record.refundReceiptAndMutualReleaseFile) {
        setUploadRefundReceipt(record.refundReceiptAndMutualReleaseFile);
        setValue(
          "refundReceiptAndMutualReleaseFile",
          record.refundReceiptAndMutualReleaseFile
        );
      }

      // Reset form with formatted record data
      reset(formattedRecord);

      // Set all form values explicitly to ensure they're properly set
      setValue("date", formattedRecord.date);
      setValue("propertyListingId", formattedRecord.propertyListingId);
      setValue("propertyAddress", formattedRecord.propertyAddress);
      setValue("receivedFrom", formattedRecord.receivedFrom);
      setValue("representation", formattedRecord.representation);
      setValue("paymentType", formattedRecord.paymentType);
      setValue("paymentMethod", formattedRecord.paymentMethod);
      setValue("bankDraftNumber", formattedRecord.bankDraftNumber || "");
      setValue("transactionType", formattedRecord.transactionType);
      setValue("amountReceived", formattedRecord.amountReceived);
      setValue("receivedBy", formattedRecord.receivedBy);
      setValue("status", formattedRecord.status || "approved");

      // Set email related fields if they exist
      if (formattedRecord.recipients) {
        setValue("recipients", formattedRecord.recipients);
      }
      if (formattedRecord.subject) {
        setValue("subject", formattedRecord.subject);
      }
      if (formattedRecord.data) {
        setValue("data", formattedRecord.data);
      }

      // Log the values being set for debugging
      console.log("Setting form values:", formattedRecord);

      // Set audit info for display
      setAuditInfo({
        createdByName: record.createdByName || undefined,
        updatedByName: record.updatedByName || undefined,
        createdAt: record.createdAt || undefined,
        updatedAt: record.updatedAt || undefined,
      });

      // Set edit mode and show modal
      setIsEditMode(true);
      setSelectedUUID(record.uuid);
      showModalReceiptCreate();

      // Trigger form validation
      trigger();
    } catch (error) {
      console.error("Error in handleEditReceiptMode:", error);
      toast.error("Error loading receipt data");
    }
  };

  const handlePropertyListingChange = (selectedOption: { value: string | number; propertyAddress: string; tradeSheets?: any[] } | null) => {
    if (selectedOption) {
      setSelectedPropertyListingId(selectedOption?.value);
      setValue("propertyAddress", selectedOption?.propertyAddress, { shouldValidate: true });
      setValue("propertyListingId", selectedOption?.value, { shouldValidate: true });
    } else {
      setSelectedPropertyListingId("");
      setValue("propertyAddress", "", { shouldValidate: true });
      setValue("propertyListingId", "", { shouldValidate: true });
    }
  };

  const compressImage = (file: File, maxDimension = 1200, quality = 0.8): Promise<File> =>
    new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            const compressed = blob
              ? new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" })
              : file;
            resolve(compressed);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
      img.src = objectUrl;
    });

  // Bank receipt image
  const handleChangeBankReceiptImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files) return;

    const compressed = await Promise.all(Array.from(files).map((f) => compressImage(f)));
    const newImageItems = compressed.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isExisting: false,
    }));

    setUploadBankReceiptImages((prev) => [...prev, ...newImageItems]);
  };

  const handleRemoveBankReceiptImage = (index: number) => {
    setUploadBankReceiptImages((prev) => {
      const newImages = [...prev];
      const removedImage = newImages[index];

      // Clean up URL object if it's a new image
      if (!removedImage.isExisting && removedImage.preview) {
        URL.revokeObjectURL(removedImage.preview);
      }

      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Signature Script
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleChangeSignatureImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleSignatureFileChange(file);
    }
  };

  const handleSignatureFileChange = async (file: File) => {
    try {
      const base64 = await convertFileToBase64(file);
      setUploadSignatureImage(base64);
      setValue("signatureIamge", base64);
      toast.success("Signature uploaded successfully");
    } catch (error) {
      console.error("Error converting signature to base64:", error);
      toast.error("Error processing signature image");
    }
  };

  const handleRemoveSignatureImage = () => {
    setUploadSignatureImage("");
    setValue("signatureIamge", "");
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setUploadSignatureImage("");
      setValue("signatureIamge", "");
    }
  };

  const saveSignature = () => {
    if (signatureRef.current.isEmpty()) {
      toast.error("Please provide a signature");
      return;
    }

    const signatureImage = signatureRef.current
      .getTrimmedCanvas()
      .toDataURL("image/png");

    setUploadSignatureImage(signatureImage);
    setValue("signatureIamge", signatureImage);
    toast.success("Signature saved successfully");
  };

  // Single delete code
  const confirmDelete = async () => {
    if (!selectedUUID) return;
    try {
      const response = await deleteReceiptManage(selectedUUID).unwrap();
      toast.success(response?.message);
      setTableData(
        tableData.filter((item) => item.uuid !== selectedUUID)
      );
    } catch (error) {
      toast.error("Delete failed. Something went wrong!");
      console.error("Delete error:", error);
    }
    setIsModalDeleteVisible(false);
    setSelectedUUID("null");
  };

  const handleDelete = (uuid: string) => {
    setSelectedUUID(uuid);
    setIsModalDeleteVisible(true);
  };

  // Multiple delete code
  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true);
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteMultipleReceiptManage(selectedRowKeys);
        setIsDeleteModalMultipleVisible(false);
        await refetch();
        if (response.data.status == true) {
          setSelectedRowKeys([]);
          toast.success("Deleted successfully!");
        } else {
          toast.error("Failed to delete. Please try again.");
        }
      } catch {
        setIsDeleteModalMultipleVisible(false);
      }
    } else {
      toast.error("Please Select Items.");
    }
  };

  // Table Related Code
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();

    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return inRecord;
  });

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <ReceiptHeader
        searchText={searchText}
        onSearchChange={setSearchText}
        onCreateNew={handleCreateNewReceiptModal}
        onDeleteMultiple={handleDeleteMultipleClick}
        hasPermissionForSlug={hasPermissionForSlug}
      />

      <ReceiptTable
        data={filteredData || []}
        isLoading={isLoading}
        selectedRowKeys={selectedRowKeys}
        onSelectChange={onSelectChange}
        onEdit={handleEditReceiptMode}
        onView={handleReceiptModal}
        onRefund={handleRefundModal}
        onDelete={handleDelete}
        hasPermissionForSlug={hasPermissionForSlug}
      />

      {/* Create Receipt Modal */}
      <ReceiptForm
        isOpen={isReceiptCreateModalOpen}
        isLoading={isLoadingCreate}
        onCancel={resetForm}
        onSubmit={handleSubmit(onSubmit)}
        register={register}
        setValue={setValue}
        watch={watch}
        errors={errors}
        torontoDate={torontoDate}
        propertyListingOptions={propertyListingOptions}
        selectedPropertyListingId={selectedPropertyListingId}
        onPropertyListingChange={handlePropertyListingChange}
        paymentMethodChange={paymentMethodChange}
        signatureRef={signatureRef}
        uploadSignatureImage={uploadSignatureImage}
        setUploadSignatureImage={setUploadSignatureImage}
        onSignatureChange={handleSignatureFileChange}
        onSignatureRemove={handleRemoveSignatureImage}
        onClearSignature={clearSignature}
        onSaveSignature={saveSignature}
        uploadBankReceiptImages={uploadBankReceiptImages}
        onBankReceiptImageChange={handleChangeBankReceiptImage}
        onBankReceiptImageRemove={handleRemoveBankReceiptImage}
        auditInfo={auditInfo}
      />

      {/* View Receipt Modal: always the latest copy of the receipt from the reloaded list, and remounted
          when the receipt changes, so an update shows immediately (no page refresh needed). */}
      {isReceiptModalOpen && (
        <ReceiptModal
          key={`${liveReceiptModalData?.uuid || "receipt"}-${liveReceiptModalData?.updatedAt || ""}`}
          isReceiptModalOpen={isReceiptModalOpen}
          handleCancel={handleCancel}
          receiptModalData={liveReceiptModalData}
        />
      )}

      {/* View Refund Modal */}
      {isRefundModal && (
        <RefundSection
          receiptModalData={liveReceiptModalData}
          handleCancel={handleCancel}
        />
      )}

      {/* Delete Modals */}
      <DeleteModals
        isModalDeleteVisible={isModalDeleteVisible}
        isDeleteMultipleModalVisible={isDeleteMultipleModalVisible}
        onCancel={handleCancel}
        onConfirmDelete={confirmDelete}
        onConfirmDeleteMultiple={handleDeleteConfirmMultiple}
      />
      </div>
    </div>
  );
};

export default ReceiptManagement;
