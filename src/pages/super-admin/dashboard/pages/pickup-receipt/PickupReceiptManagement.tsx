// @ts-nocheck // eslint-disable @typescript-eslint/no-explicit-any
import { useEffect, useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import type { TableProps } from "antd";
import { useForm } from "react-hook-form";
import { Table } from "antd";
import toast from "react-hot-toast";
import TableLoader from "../../../../../components/loader/TableLoader";
import { useAppSelector } from "../../../../../redux/hooks";

import {
  useCreateUpdatePickupReceiptManageMutation,
  useDeletePickupReceiptManageMutation,
  useDeletePickupReceiptMultipleMutation,
  useGetPickupReceiptManageQuery,
  useSendPickupReceiptInvoiceEmailMutation,
} from "../../../../../redux/api/superadmin/pickupReceiptManageDataSlice";
import moment from "moment-timezone";
import { useGetTradeSheetListDataQuery } from "../../../../../redux/api/agent/trade-sheet/tradeSheetSlice";
import { usePermissions } from "../../../../../utils/permissionUtils";
import ReceiptViewModal from "./Components/ReceiptViewModal";
import ReceiptCreateEditModal from "./Components/ReceiptCreateEditModal";
import DeleteConfirmModals from "./Components/DeleteConfirmModals";
import ReceiptTable, { createTableColumns } from "./Components/ReceiptTable";
import { generatePDFFromElement } from "./Components/utils";
import type { DataType } from "./Components/types";
type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];

const PickupReceiptManagement = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [isEditMode, setIsEditMode] = useState(false);
  const [tableData, setTableData] = useState<DataType[]>([]);
  const { data, isLoading, refetch } = useGetPickupReceiptManageQuery("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptModalData, setReceiptModalData] = useState<DataType>({} as DataType);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | "null">("null");
  const { user } = useAppSelector((state: any) => state.user);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [uploadReceiverIdImage, setUploadReceiverIdImage] = useState("");
  const [activeTab, setActiveTab] = useState("pickup"); // Active tab state
  const [isEmailSend, setIsEmailSend] = useState<boolean>(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [deleteMultiplePickupReceipt] =
    useDeletePickupReceiptMultipleMutation();
  const { data: tradeListData } = useGetTradeSheetListDataQuery("");
  const [selectedPropertyListingId, setSelectedPropertyListingId] = useState<
    React.Key
  >("");
  const {
    register,
    reset,
    formState: { errors },
    getValues,
    setError,
    handleSubmit,
    setValue,
    trigger,
  } = useForm<DataType>({});

  const [searchText, setSearchText] = useState("");

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();

    /* const inProperties = Object.values(record.createdUser || {}).some((data) =>
      String(data).toLowerCase().includes(searchTerm.toLowerCase())
  ); */

    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return /* inProperties || */ inRecord;
  });

  const handleChange = (value: any) => {
    setValue("data", value);
  };

  useEffect(() => {
    if (data?.data?.receiptData) {
      setTableData(data.data.receiptData);
    }
    setValue("handleBy", user.firstName + " " + user.lastName);
  }, [data]);

  const torontoDate = moment()
    .tz("America/Toronto")
    .format("YYYY-MM-DDTHH:mm");
  const resetForm = () => {
    // reset();
    setValue("date", torontoDate);
    setValue("propertyAddress", "");
    setValue("pickupPerson", "");
    setValue("pickupBy", "");
    setValue("reasonForPayment", "");
    setValue("paymentMethod", "");
    setValue("handleBy", "");
    setValue("receiversId", "");
    setValue("setUploadReceiverIdImage", "");
    setValue("activeTab", "pickup");
    setValue("recipients", "");
    setValue("subject", "");
    setValue("data", "");
    setValue("receiversIdImage", "");
    setValue("attachments", "");
    setUploadReceiverIdImage("");
    setIsEditMode("");

    setIsModalOpen(false);
    setIsReceiptModalOpen(false);
    setSelectedUUID("null");
  };

  const showModal = () => setIsModalOpen(true);
  const handleReceiptModal = (record: DataType) => {
    setReceiptModalData(record);
    setIsReceiptModalOpen(true);
    setActiveTab("pickup");
  };

  const handleCancel = () => {
    resetForm();
  };

  const [createUpdatePickupReceiptManage, { isLoading: isLoadingCreate }] =
    useCreateUpdatePickupReceiptManageMutation();
  const [deletePickupReceiptManage] = useDeletePickupReceiptManageMutation();

  const propertyListingOptions =
    tradeListData?.data?.tradeSheetData
      .filter((item: any) => item.status === "approved") // Filter for 'approved' status
      .map((item: any) => ({
        value: item.id,
        propertyAddress: `${
          item?.properties[0]?.propertyAddress || "No address available"
        }`,
        label: `${item.tradeSheetTypeId} - ${
          item?.properties[0]?.propertyAddress || "No address available"
        }`, // Handle missing address
      })) || [];

  const handlePropertyListingChange = (selectedOption: any) => {
    console.log("selectedOption", selectedOption);
    if (selectedOption) {
      setSelectedPropertyListingId(selectedOption?.value);
      setValue("propertyAddress", selectedOption?.propertyAddress);
      setValue("tradeSheetId", selectedOption?.value);
      // setValue("receivedFrom", selectedOption?.value);
    }
  };

  // Create and update method
  const onSubmit = async () => {
    const data = getValues();
    const formData = new FormData();
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        formData.append(key, data[key]);
      }
    }
    const handleResponse = (response: any) => {
      if (response?.error?.data?.status === false) {
        response.error.data.errors
          ? response.error.data.errors.forEach((error: any) => {
              setError(error.path, {
                type: "manual",
                message: error.msg,
              });
            })
          : toast.error(response.error.data.message);
      } else if (response?.data?.status === true) {
        toast.success(response.data.message);
        setIsModalOpen(false);
        resetForm();
        refetch();
      }
    };

    try {
      const response = await createUpdatePickupReceiptManage({
        uuid: selectedUUID,
        data: formData,
      });

      handleResponse(response);
    } catch (error: any) {
      toast.error("Update failed. Something went wrong!");
      console.error("Error:", error);
    }
  };

  // Delete method
  const confirmDelete = async () => {
    if (!selectedUUID || selectedUUID === "null") return;
    try {
      const response = await deletePickupReceiptManage(selectedUUID).unwrap();
      toast.success(response?.message);
      await refetch();
    } catch (error) {
      toast.error("Delete failed. Something went wrong!");
      console.error("Delete error:", error);
    }
    setIsModalVisible(false);
    setSelectedUUID("null");
  };

  const cancelDelete = () => {
    setIsModalVisible(false);
    setSelectedUUID("null");
    setIsDeleteModalMultipleVisible(false);
  };

  const handleDelete = (uuid: string) => {
    setSelectedUUID(uuid);
    setIsModalVisible(true);
  };

  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true); // Show delete confirmation modal
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteMultiplePickupReceipt(selectedRowKeys);
        setIsDeleteModalMultipleVisible(false);
        // Ensure the refetch waits for the data to be refreshed
        await refetch();
        if (response.data.status == true) {
          setSelectedRowKeys([]);
          toast.success("Deleted successfully!");
        } else {
          toast.error("Failed to delete. Please try again.");
        }
      } catch (error) {
        setIsDeleteModalMultipleVisible(false);
        toast.error("Failed to delete. Please try again.");
      }
    } else {
      toast.error("Please Select Items.");
    }
  };

  // Edit method
  const handleEdit = (record: DataType) => {
    console.log("record", record);
    // Create a new object with formatted date fields
    const formattedRecord = {
      ...record,
      date: moment
        .utc(record.date) // Parse as UTC
        .tz("America/Toronto") // Convert to Toronto timezone
        .format("YYYY-MM-DDTHH:mm"),
    };

    setSelectedPropertyListingId(formattedRecord?.tradeSheetId);

    setUploadReceiverIdImage(record.receiversId);
    // Reset the form with the formatted record
    reset(formattedRecord);
    // Trigger validation to ensure the required validation works
    trigger();

    setIsEditMode(true);
    setSelectedUUID(record.uuid);
    showModal();
  };

  // Bank receipt image
  const handleUploadReceiverIdImage = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    setValue("receiversIdImage", file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setUploadReceiverIdImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveReceiverIdImage = () => {
    setUploadReceiverIdImage("");
  };

  // Send Email
  const [sendPickupReceiptInvoiceEmail] =
    useSendPickupReceiptInvoiceEmailMutation();
  
  const onSubmitEmail = async () => {
    setIsEmailSend(true);
    
    try {
      // Get all form values
      const formValues = getValues();
      
      // Validate required fields
      if (!formValues.recipients) {
        toast.error("Recipients email is required");
        setIsEmailSend(false);
        return;
      }
      
      if (!formValues.subject) {
        toast.error("Email subject is required");
        setIsEmailSend(false);
        return;
      }
      
      // Always generate PDF from receipt section (ensure it's generated fresh)
      // Wait a bit to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const printSection = document.getElementById("printSection");
      if (!printSection) {
        console.error("printSection element not found in DOM");
        toast.error("Receipt section not found. Please close and reopen the receipt view.");
        setIsEmailSend(false);
        return;
      }
      
      // Generate PDF attachment
      let pdfFile: File;
      try {
        console.log("Starting PDF generation...");
        pdfFile = await generatePDFFromElement(printSection as HTMLElement, setValue);
        console.log("PDF generated successfully:", pdfFile);
        
        // Wait a bit to ensure setValue has processed
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err: any) {
        console.error("PDF generation error details:", err);
        const errorMessage = err?.message || "Unknown error";
        toast.error(`Failed to generate PDF: ${errorMessage}. Please try again.`);
        setIsEmailSend(false);
        return;
      }
      
      // Verify PDF was generated
      if (!pdfFile || !(pdfFile instanceof File)) {
        console.error("PDF file is invalid:", pdfFile);
        toast.error("Failed to generate PDF attachment. Please try again.");
        setIsEmailSend(false);
        return;
      }
      
      // Verify PDF size is reasonable (should be > 0)
      if (pdfFile.size === 0) {
        console.error("PDF file is empty");
        toast.error("Generated PDF is empty. Please try again.");
        setIsEmailSend(false);
        return;
      }
      
      console.log("PDF verification passed. Size:", pdfFile.size, "bytes");
      
      // Get updated form values (including the PDF attachment)
      const updatedValues = getValues();
      
      // Prepare FormData
      const formDataEmail = new FormData();

      // Recipients: handle both string and array formats
      const recipientsValue = updatedValues.recipients || formValues.recipients;
      const recipientsArray = Array.isArray(recipientsValue)
        ? recipientsValue
        : String(recipientsValue).split(",").map((email: string) => email.trim()).filter(Boolean);
      
      if (recipientsArray.length === 0) {
        toast.error("Please provide at least one valid email address");
        setIsEmailSend(false);
        return;
      }
      
      formDataEmail.append("recipients", recipientsArray.join(","));

      // Subject
      const subject = updatedValues.subject || formValues.subject || "";
      formDataEmail.append("subject", subject);

      // Email body (data field) - ensure it's a string and properly formatted
      // ReactQuill stores HTML, so we need to get the current value
      const emailBody = updatedValues.data || formValues.data || "";
      // Remove any empty HTML tags or whitespace-only content
      const cleanEmailBody = String(emailBody).trim();
      // If email body is empty or just HTML tags, provide a default message
      if (!cleanEmailBody || cleanEmailBody === "<p><br></p>" || cleanEmailBody === "<p></p>") {
        formDataEmail.append("data", "<p>Please find the attached Cheque Pickup Receipt.</p>");
      } else {
        formDataEmail.append("data", cleanEmailBody);
      }

      // Append receipt data fields that might be needed by backend
      if (updatedValues.propertyAddress) {
        formDataEmail.append("propertyAddress", String(updatedValues.propertyAddress));
      }
      if (receiptModalData?.receiptId) {
        formDataEmail.append("receiptId", String(receiptModalData.receiptId));
      }
      if (receiptModalData?.uuid) {
        formDataEmail.append("uuid", String(receiptModalData.uuid));
      }

      // Append the PDF file
      formDataEmail.append("attachments", pdfFile, "Cheque-Pickup-Receipt.pdf");

      // Send email
      const response = await sendPickupReceiptInvoiceEmail({ data: formDataEmail }).unwrap();
      toast.success(response?.message || "Email sent successfully!");
      resetForm();
    } catch (error: any) {
      console.error("Email send error:", error);
      toast.error(error?.data?.message || error?.message || "Failed to send email. Please try again.");
    } finally {
      setIsEmailSend(false);
    }
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<DataType> = {
    selectedRowKeys,
    onChange: onSelectChange,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
      {
        key: "odd",
        text: "Select Odd Row",
        onSelect: (changeableRowKeys) => {
          let newSelectedRowKeys = [];
          newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
            if (index % 2 !== 0) {
              return false;
            }
            return true;
          });
          setSelectedRowKeys(newSelectedRowKeys);
        },
      },
      {
        key: "even",
        text: "Select Even Row",
        onSelect: (changeableRowKeys) => {
          let newSelectedRowKeys = [];
          newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
            if (index % 2 !== 0) {
              return true;
            }
            return false;
          });
          setSelectedRowKeys(newSelectedRowKeys);
        },
      },
    ],
  };

  // Table Column
  const columns = createTableColumns(
    handleReceiptModal,
    handleEdit,
    handleDelete,
    hasPermissionForSlug
  );


  const handleAddNew = () => {
    setSelectedPropertyListingId("");
    showModal();
  };

  // serial number in the table
  const tableSourceData = filteredData?.map((item: any, index: number) => {
    return {
      ...item,
      serial: index + 1,
    };
  });
  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Toolbar row */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Cheque Pickup Receipt List</h1>
          <div className="flex-1" />
          <div className="relative flex-shrink-0" style={{ width: 170 }}>
            <FaSearch className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: 10, left: 8 }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ paddingLeft: 26, paddingRight: 8, paddingTop: 4, paddingBottom: 4, width: "100%" }}
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0"
                style={{ right: 6 }}
              >
                <FaTimes style={{ fontSize: 10 }} />
              </button>
            )}
          </div>
          {hasPermissionForSlug("create-cheque-pickup-receipt") && (
            <button onClick={handleAddNew} className="primary-btn">
              Add New
            </button>
          )}
          {hasPermissionForSlug("delete-cheque-pickup-receipt") && (
            <button onClick={handleDeleteMultipleClick} className="cancel-btn">
              Delete
            </button>
          )}
        </div>

        <div>
          {isLoading ? (
            <TableLoader />
          ) : (
            <ReceiptTable
              columns={columns}
              dataSource={tableSourceData}
              rowSelection={rowSelection}
              isLoading={false}
            />
          )}
        </div>

      {/*  Receipt Download and view*/}
      <ReceiptViewModal
        isModalOpen={isReceiptModalOpen}
        handleCancel={handleCancel}
        receiptModalData={receiptModalData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDownloading={isDownloading}
        setIsDownloading={setIsDownloading}
        register={register}
        errors={errors}
        handleChange={handleChange}
        onSubmitEmail={onSubmitEmail}
        isEmailSend={isEmailSend}
        data={getValues("data") || ""}
        setValue={setValue}
      />

      {/* Receipt Create and edit */}
      <ReceiptCreateEditModal
        isModalOpen={isModalOpen}
        handleCancel={handleCancel}
        handleOk={handleSubmit(onSubmit)}
        isLoading={isLoadingCreate}
        register={register}
        errors={errors}
        propertyListingOptions={propertyListingOptions}
        selectedPropertyListingId={selectedPropertyListingId}
        handlePropertyListingChange={handlePropertyListingChange}
        uploadReceiverIdImage={uploadReceiverIdImage}
        handleUploadReceiverIdImage={handleUploadReceiverIdImage}
        handleRemoveReceiverIdImage={handleRemoveReceiverIdImage}
      />

      {/* Delete Modals */}
      <DeleteConfirmModals
        isModalVisible={isModalVisible}
        isDeleteMultipleModalVisible={isDeleteMultipleModalVisible}
        cancelDelete={cancelDelete}
        confirmDelete={confirmDelete}
        handleDeleteConfirmMultiple={handleDeleteConfirmMultiple}
      />
      </div>
    </div>
  );
};

export default PickupReceiptManagement;
