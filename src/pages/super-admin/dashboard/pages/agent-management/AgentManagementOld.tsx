// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useEffect, useRef, useState } from "react";
import type { TableColumnsType, TableProps } from "antd";
import ModalMain from "../../../../../components/ui/Modal";
import { Table, Modal, Button, Select } from "antd";
import { FaEye, FaFilePdf, FaRegEdit, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import TableLoader from "../../../../../components/loader/TableLoader";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import {
  useChangeAgentAccountStatusMutation,
  useChangeAgentAgreementStatusMutation,
  useCreateAgentMutation,
  useDeleteSingleAgentMutation,
  useDeleteMultipleAgentMutation,
  useGetAgentListDataQuery,
  useUpdateAgentMutation,
  useUploadAgreementAttachmentMutation,
  useRemoveAgentFileMutation,
} from "../../../../../redux/api/superadmin/agent/agentManagementSlice";

import ReactQuill from "react-quill-new";
import 'react-quill-new/dist/quill.snow.css';
import { NavLink } from "react-router-dom";
import { baseUrl } from "../../../../../utils/constant";
import { TiDocument } from "react-icons/ti";
import {
  useGetOptionalPlanListDataQuery,
  useGetPlanListDataQuery,
} from "../../../../../redux/api/superadmin/plan-management/planManagementSlice";
import { it } from "node:test";
import AgentDocument from "../../../../../components/dashboard/Agent/AgentDocument";
import { FaFileArrowUp } from "react-icons/fa6";
import SelectPlan from "../../../../../components/dashboard/Agent/SelectPlan";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface DataType {
  key?: React.Key;
  id: string;
  planId: number;
  firstName: string;
  lastName: string;
  precName: string;
  email: string;
  address: string;
  cellPhone: string;
  phoneServiceProvider: string;
  recoRegNumber: string;
  recoExpiryDate: string;
  sin: string;
  dob: string;
  emergencyContact: string;
  hstNo: string;
  precHstNo: string;
  expectedGross: number;
  remarks: string;
  status: string;
  agreementStatus: string;
  createdAt: any;
  uuid: string;
  special_note: string;
  fileUpload: string;
  user: { uuid: string };
}

const AgentManagement: React.FC = () => {
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { data, isLoading, refetch } = useGetAgentListDataQuery("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | null>(null);
  const [isModal2Visible, setIsModal2Visible] = useState(false);
  const [isModal3Visible, setIsModal3Visible] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const { data: planData } = useGetPlanListDataQuery("");
  const {
    register,
    formState: { errors },
    reset,
    getValues,
    setError,
    handleSubmit,
    setValue,
  } = useForm<DataType>();

  const [createAgent] = useCreateAgentMutation();
  const [updateAgent] = useUpdateAgentMutation();
  const [deleteAgent] = useDeleteSingleAgentMutation();
  const [uploadAgreement] = useUploadAgreementAttachmentMutation();
  const [agentAccount, setAgentAccount] = useState<any>(null);
  const [deleteMultipleAgent] = useDeleteMultipleAgentMutation();
  const [optionalPlans, setOptionalPlans] = useState<any>(null);
  const { data: optionalPlanData } = useGetOptionalPlanListDataQuery("");
  const [searchText, setSearchText] = useState("");

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();

    const inRecords = Object.values(record.user || {}).some((data) =>
      String(data).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const inRecords1 = record.plan?.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return inRecords || inRecords1 || inRecord;
  });

  const statusOptions = [
    { label: "Approved", value: "approved" },
    { label: "Pending", value: "pending" },
    { label: "Under Review", value: "underReview" },
    { label: "Draft", value: "draft" },
    { label: "Rejected", value: "rejected" },
    { label: "Closed", value: "closed" },
  ];

  useEffect(() => {
    if (data?.data?.userData) {
      const filteredData = data?.data?.userData;
      setTableData(filteredData);
    }
  }, [data]);

  const handleEdit = (record: any) => {
    setPlan(record?.plan);
    setSpecialNote(record?.special_note);
    setSelectedPlanId(record?.planId);

    let planArray = record.optionalPlanId
      ? record.optionalPlanId.split(",").map(Number)
      : [];

    // Filter the optional plans where the plan id is included in the planArray
    const filteredOptionalPlans =
      planArray && optionalPlanData?.data?.optionalPlans
        ? optionalPlanData?.data?.optionalPlans.filter((plan: any) =>
            planArray.includes(Number(plan.id))
          )
        : [];

    setOptionalPlans(filteredOptionalPlans);
    setSelectedUUID(record.user.uuid);
    setAgentAccount(record);
    console.log(record.recoExpiryDate);
    
    // Format the dates to YYYY-MM-DD
    const formattedRecoExpiryDate = record.recoExpiryDate
    ? record.recoExpiryDate.split('T')[0] // Extract the date part
    : '';
    const formattedDob = record.dob
      ? record.dob.split('T')[0] // Extract the date part
      : '';

    // Set form values correctly, including formatted date fields
    reset({
      ...record,
      planId: record.planId,
      optionalPlanId: planArray,
      recoExpiryDate: formattedRecoExpiryDate, // Use formatted date
      dob: formattedDob, // Use formatted date
    });

    setIsEditMode(true);
    showModal();
  };

  const confirmDelete = async () => {
    if (!selectedUUID) return;

    try {
      const response = await deleteAgent(selectedUUID).unwrap();
      toast.success(response?.message);
      setTableData(tableData.filter((item) => item.uuid !== selectedUUID));
    } catch (error) {
      toast.error("Delete failed. Something went wrong!");
      console.error("Delete error:", error);
    }
    setIsModalVisible(false);
    setSelectedUUID(null);
  };

  const cancelDelete = () => {
    setIsModalVisible(false);
    setSelectedUUID(null);
    setIsDeleteModalMultipleVisible(false);
  };

  const handleDelete = (uuid: string) => {
    console.log(uuid);

    setSelectedUUID(uuid);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedUUID(null);
    resetForm();
  };

  const resetForm = () => {
    reset({
      firstName: "",
      lastName: "",
      precName: "",
      email: "",
      special_note: "",
      address: "",
      cellPhone: "",
      phoneServiceProvider: "",
      recoRegNumber: "",
      recoExpiryDate: "",
      sin: "",
      dob: "",
      emergencyContact: "",
      hstNo: "",
      precHstNo: "",
      expectedGross: 0,
      status: "pending",
      agreementStatus: "pending",
    });
    setAgentAccount(null);
  };

  const showAgentDetailsModal = (record: any) => {
    // Format the dates to YYYY-MM-DD
    const formattedRecoExpiryDate = record.recoExpiryDate
    ? record.recoExpiryDate.split('T')[0]
    : '';
    const formattedDob = record.dob
      ? record.dob.split('T')[0]
      : '';

    reset({
      ...record,
      recoExpiryDate: formattedRecoExpiryDate,
      dob: formattedDob,
    });
    setPlan(record?.plan);
    let planArray = record.optionalPlanId
      ? record.optionalPlanId.split(",").map(Number)
      : [];
    // Filter the optional plans where the plan id is included in the planArray
    const filteredOptionalPlans =
      planArray && optionalPlanData?.data?.optionalPlans
        ? optionalPlanData?.data?.optionalPlans.filter((plan: any) =>
            planArray.includes(Number(plan.id))
          )
        : [];
    setOptionalPlans(filteredOptionalPlans);
    setAgentAccount(record);
    setSpecialNote(record?.special_note);
    setSelectedUUID(record.uuid);
    setIsModal2Visible(true);
  };

  const handleCancel2 = () => {
    setIsModal2Visible(false);
    setIsEditMode(false);
    resetForm();
  };

  const handleCancel3 = () => {
    setIsModal3Visible(false);
  };

  const handleDocumentSubmit = (record: any) => {
    setIsModal3Visible(true);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true); // Show delete confirmation modal
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const selectedData = selectedRowKeys.map((item) => item.uuid);
        const response = await deleteMultipleAgent(selectedData);
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
  const [fileData, setFileData] = useState({
    nationalIdentity: "",
    recoLicence: "",
    previousRegistration: "",
    agreementFile: "",
  });
  const showModal = () => setIsModalOpen(true);

  const onSubmit = async () => {
    setIsUploading(true);
    const data = getValues();

    if (data.password && data.confirmPassword) {
      if (data.password !== data.confirmPassword) {
        setError("confirmPassword", {
          type: "manual",
          message: "Passwords do not match",
        });
        setIsUploading(false);
        toast.error(`Password & Confirm Password doesn't match`);
        return;
      }
    }

    // Combine form data with file data
    data.nationalIdentity = fileData.nationalIdentity || "";
    data.recoLicence = fileData.recoLicence || "";
    data.previousRegistration = fileData.previousRegistration || "";
    data.agreementFile = fileData.agreementFile || "";

    if (isEditMode) {
      // Update logic here } else {
      try {
        if (!selectedUUID) {
          throw new Error("UUID is null");
        }
        const response = (await updateAgent({
          uuid: selectedUUID,
          data,
        })) as any;

        if (response?.error?.data?.status == false) {
          setIsUploading(false);
          response.error.data.errors
            ? response.error.data.errors.forEach((error: any) => {
                setError(error.path, {
                  type: "manual",
                  message: error.msg,
                });
              })
            : toast.error(`${response?.error.data?.message}`);
        } else if (response?.data?.status == true) {
          toast.success(`${response?.data?.message}`);
          setIsModalOpen(false);
          setIsUploading(false);
        } else {
          setIsUploading(false);
        }
      } catch (error) {
        console.error("Submission error:", error);
        setIsUploading(false);
      }
    } else {
      try {
        const response = (await createAgent(data)) as any;

        if (response?.error?.data?.status == false) {
          setIsUploading(false);
          response.error.data.errors
            ? response.error.data.errors.forEach((error: any) => {
                setError(error.path, {
                  type: "manual",
                  message: error.msg,
                });
              })
            : toast.error(`${response?.error.data?.message}`);
        } else if (response?.data?.status == true) {
          toast.success(`${response?.data?.message}`);
          setIsModalOpen(false);
          setIsUploading(false);
        } else {
          setIsUploading(false);
        }
      } catch (error) {
        console.error("Submission error:", error);
        setIsUploading(false);
      }
    }
  };

  const nationalIdentityRef = useRef<HTMLInputElement | null>(null);
  const recoLicenceRef = useRef<HTMLInputElement | null>(null);
  const previousRegistrationRef = useRef<HTMLInputElement | null>(null);
  const agreementFileRef = useRef<HTMLInputElement | null>(null);

  const handleUplaodFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      // Check file size (e.g., 5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        toast.error(`File size should not exceed 5MB`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;

        // Add file type information to the base64 string
        const fileExtension = file.name.split(".").pop()?.toLowerCase();
        const fileType = file.type;
        const metadata = {
          fileName: file.name,
          fileType: fileType,
          fileExtension: fileExtension,
        };

        // Combine metadata with base64 string
        const fileData = {
          data: base64String,
          metadata: metadata,
        };

        // Store in state
        setFileData((prev) => ({
          ...prev,
          [fieldName]: JSON.stringify(fileData),
        }));

        // Store in form
        setValue(fieldName, JSON.stringify(fileData));

        console.log(`${fieldName} uploaded:`, {
          fileName: file.name,
          fileType: fileType,
          fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const [changeAgentAccountStatus] = useChangeAgentAccountStatusMutation();
  const [changeAgentAgreementStatus] = useChangeAgentAgreementStatusMutation();
  const [removeAgentFile] = useRemoveAgentFileMutation();

  const handleChangeAccountStatus = async (newStatus: string, id: string) => {
    try {
      const response = await changeAgentAccountStatus({
        status: newStatus,
        id,
      }).unwrap();
      toast.success(`${response?.message}`);
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  const handleChangeAgreementStatus = async (newStatus: string, id: string) => {
    try {
      const response = await changeAgentAgreementStatus({
        status: newStatus,
        id,
      }).unwrap();
      toast.success(`${response?.message}`);
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  const [specialNote, setSpecialNote] = useState("");

  const handleChange = (value: any) => {
    setValue("special_note", value);
    setSpecialNote(value);
  };

  const handlePlanSelect = (planId: any) => {
    setValue("planId", planId);
    setSelectedPlanId(planId);
  };

  const handleRemoveFile = async (fieldName: string) => {
    let response = await removeAgentFile({fileName:fieldName,id:agentAccount?.id});
    if(response?.data?.status == true){
      // remove the file from the form agentAccount
      setAgentAccount((prev) => ({
        ...prev,
        [fieldName]: "",
      }));
      toast.success("File removed successfully");
    }
  };

  const [selectedOptionalPlans, setSelectedOptionalPlans] = useState([]);
  const handleOptionalPlanChange = (planId) => {
    setSelectedOptionalPlans((prevState) =>
      prevState.includes(planId)
        ? prevState.filter((id) => id !== planId)
        : [...prevState, planId]
    );
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: "#",
      key: "serial",
      dataIndex: "serial",
      width: 50,
      fixed: "left",
    },
    {
      title: "Brokerage Name",
      dataIndex: "brokerageData",
      key: "brokerageData",
      render: (brokerageData: any) => brokerageData?.brokerageName,
    },
    {
      title: "First Name",
      dataIndex: "firstName",
      key: "firstName",
    },
    {
      title: "Last Name",
      dataIndex: "lastName",
      key: "lastName",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Cell Phone",
      dataIndex: "cellPhone",
      key: "cellPhone",
    },
    {
      title: "Agent Plan",
      dataIndex: "plan",
      render: (plan: any) => plan?.name,
    },
    {
      title: "Account Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Select
          value={status}
          onChange={(newStatus) =>
            handleChangeAccountStatus(newStatus, record.id)
          }
          options={statusOptions}
          style={{ width: 150 }}
        />
      ),
    },
    {
      title: "Agreement Status",
      dataIndex: "agreementStatus",
      key: "agreementStatus",
      render: (agreementStatus, record) => (
        <Select
          value={agreementStatus}
          onChange={(newStatus) =>
            handleChangeAgreementStatus(newStatus, record.id)
          }
          options={statusOptions}
          style={{ width: 150 }}
        />
      ),
    },
    {
      title: "Actions",
      dataIndex: "id",
      key: "actions",
      render: (_, record) => (
        <div className="flex gap-5 items-center">
          <button
            className="text-[16px] hover:text-primaryPurple duration-100"
            onClick={() => showAgentDetailsModal(record)}
          >
            <FaEye />
          </button>
          <button
            onClick={() => handleEdit(record)}
            className="text-[16px] hover:text-primaryPurple duration-100"
          >
            <FaRegEdit />
          </button>
          <button
            onClick={() => handleDocumentSubmit(record)}
            className="text-[16px] hover:text-primaryPurple duration-100"
          >
            <FaFileArrowUp />
          </button>
          <button
            onClick={() => handleDelete(record.user.uuid)}
            className="hover:text-red-500 text-lg duration-100"
          >
            <MdDelete />
          </button>
        </div>
      ),
      fixed: "right",
    },
  ];

  const tableSourceData = filteredData?.map((item: any, index: number) => {
    return {
      ...item,
      serial: index + 1,
    };
  });

  return (
    <div className="pb-32">
      <div className="flex items-center justify-between gap-5 xl:gap-10  mb-5 p-1">
        <h1>Agent List</h1>
        <div >
          <input
            type="text"
            placeholder="Search from table..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="global-search "
          />
        </div>
        <div>
          <button onClick={showModal} className="primary-btn mx-3">
            Add New
          </button>
          <button
            onClick={handleDeleteMultipleClick}
            className="cancel-btn mx-3"
          >
            Delete All
          </button>
        </div>
      </div>
      <div>
        {isLoading ? (
          <TableLoader />
        ) : (
          <Table
            rowSelection={rowSelection}
            rowKey="user"
            scroll={{ x: "max-content" }}
            columns={columns}
            dataSource={tableSourceData}
            pagination={{ pageSize: 20 }}
          />
        )}
      </div>

      <ModalMain
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        handleOk={handleSubmit(onSubmit)}
        title={isEditMode ? "Edit Agent" : "Create Agent"}
        isLoading={isUploading}
        modalClass={"lg:!w-[65%] !z-[10000]"}
      >
        <form className="space-y-3">
          <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label>
                First Name<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                {...register("firstName", {
                  required: "First name is required",
                })}
              />
              {errors.firstName && (
                <span className="text-red-500">{errors.firstName.message}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label>
                Last Name<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                {...register("lastName", { required: "Last name is required" })}
              />
              {errors.lastName && (
                <span className="text-red-500">{errors.lastName.message}</span>
              )}
            </div>
            {/* PREC Name */}
            <div className="flex flex-col gap-2">
              <label>
                PREC Name (if any)
              </label>
              <input
                type="text"
                {...register("precName", { required: false })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label>
                Email<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Email is not valid",
                  },
                })}
              />
              {errors.email && (
                <span className="text-red-500">{errors.email.message}</span>
              )}
            </div>
            {/* Address */}
            <div>
              <label className="block mb-1">Address</label>
              <input
                type="text"
                {...register("address", { required: false })}
                className={`border p-2 w-full ${
                  errors.address ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.address && (
                <p className="text-red-500">Address is required</p>
              )}
            </div>

            {/* Cell Phone */}
            <div>
              <label className="block mb-1">Cell Phone</label>
              <input
                type="tel"
                {...register("cellPhone", { required: false })}
                className={`border p-2 w-full ${
                  errors.cellPhone ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.cellPhone && (
                <p className="text-red-500">Cell phone is required</p>
              )}
            </div>

            {/* Phone Service Provider */}
            <div>
              <label className="block mb-1">Phone Service Provider</label>
              <input
                type="text"
                {...register("phoneServiceProvider", { required: false })}
                className={`border p-2 w-full ${
                  errors.phoneServiceProvider
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors.phoneServiceProvider && (
                <p className="text-red-500">
                  Phone service provider is required
                </p>
              )}
            </div>

            {/* RECO Reg Number */}
            <div>
              <label className="block mb-1">RECO Reg Number</label>
              <input
                type="text"
                {...register("recoRegNumber", { required: false })}
                className={`border p-2 w-full ${
                  errors.recoRegNumber ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.recoRegNumber && (
                <p className="text-red-500">RECO reg number is required</p>
              )}
            </div>

            {/* RECO Expiry Date */}
            <div>
              <label className="block mb-1">RECO Expiry Date</label>
              <input
                type="date"
                {...register("recoExpiryDate", { required: false })}
                className={`border p-2 w-full border-gray-300 bg-gray-100`}
              />
            </div>

            {/* SIN */}
            <div>
              <label className="block mb-1">SIN</label>
              <input
                type="text"
                {...register("sin", { required: false })}
                className={`border p-2 w-full ${
                  errors.sin ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.sin && <p className="text-red-500">SIN is required</p>}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block mb-1">Date of Birth</label>
              <input
                type="date"
                {...register("dob", { required: false })}
                className={`border p-2 w-full ${
                  errors.dob ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.dob && (
                <p className="text-red-500">Date of birth is required</p>
              )}
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block mb-1">Emergency Contact</label>
              <input
                type="text"
                {...register("emergencyContact", { required: false })}
                className={`border p-2 w-full ${
                  errors.emergencyContact ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.emergencyContact && (
                <p className="text-red-500">Emergency contact is required</p>
              )}
            </div>

            {/* HST Number */}
            <div>
              <label className="block mb-1">HST Number</label>
              <input
                type="text"
                {...register("hstNo", { required: false })}
                className={`border p-2 w-full ${
                  errors.hstNo ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.hstNo && (
                <p className="text-red-500">HST number is required</p>
              )}
            </div>

            {/* PREC HST Number */}
            <div>
              <label className="block mb-1">PREC HST Number</label>
              <input
                type="text"
                {...register("precHstNo", { required: false })}
                className={`border p-2 w-full ${
                  errors.precHstNo ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>

            {/* Expected Gross */}
            <div>
              <label className="block mb-1">Expected Gross</label>
              <input
                type="number"
                {...register("expectedGross", { required: false })}
                className={`border p-2 w-full ${
                  errors.expectedGross ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.expectedGross && (
                <p className="text-red-500">Expected gross is required</p>
              )}
            </div>
            <div>
              <label className="block mb-1">Government Issued Id</label>
              <input
                type="file"
                accept="image/*,.pdf"
                ref={nationalIdentityRef}
                onChange={(e) => handleUplaodFile(e, "nationalIdentity")}
              />
              {agentAccount?.nationalIdentity && (
                <div className="flex items-center gap-2">
                  <NavLink
                    to={`${baseUrl + agentAccount?.nationalIdentity}`}
                    className="flex items-center mt-2 p-1 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors rounded-md"
                    target="_blank"
                  >
                    <span className="flex-1">Download Government ID</span>
                    <TiDocument />
                  </NavLink>
                  <span className="cursor-pointer hover:text-red-500" onClick={() => handleRemoveFile("nationalIdentity")}><FaTimes/></span>
                </div>

              )}
            </div>

            <div>
              <label className="block mb-1">RICO Licence</label>
              <input
                type="file"
                accept="image/*,.pdf"
                ref={recoLicenceRef}
                onChange={(e) => handleUplaodFile(e, "recoLicence")}
              />
              {agentAccount?.recoLicence && (
                <div className="flex items-center gap-2">
                  <NavLink
                    to={`${baseUrl + agentAccount?.recoLicence}`}
                      className="flex items-center mt-2 p-1 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors rounded-md"
                      target="_blank"
                    >
                      <span className="flex-1">Download RICO Licence</span>
                      <TiDocument />
                    </NavLink>
                  <span className="cursor-pointer hover:text-red-500" onClick={() => handleRemoveFile("recoLicence")}><FaTimes/></span>
                </div>
              )}
            </div>

            <div>
              <label className="block mb-1">
                Registration letter from previous Brokerage
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                ref={previousRegistrationRef}
                onChange={(e) => handleUplaodFile(e, "previousRegistration")}
              />
              {agentAccount?.previousRegistration && (
                <div className="flex items-center gap-2">
                  <NavLink
                    to={`${baseUrl + agentAccount?.previousRegistration}`}
                    className="flex items-center mt-2 p-1 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors rounded-md"
                    target="_blank"
                  >
                    <span className="flex-1">Download Registration Letter</span>
                    <TiDocument />
                  </NavLink>
                  <span className="cursor-pointer hover:text-red-500" onClick={() => handleRemoveFile("previousRegistration")}><FaTimes/></span>
                </div>
              )}
            </div>

            <div>
              <label className="block mb-1">Agreement File</label>
              <input
                type="file"
                accept="image/*,.pdf"
                ref={agreementFileRef}
                onChange={(e) => handleUplaodFile(e, "agreementFile")}
              />
              {agentAccount?.agreementFile && (
                <div className="flex items-center gap-2">
                  <NavLink
                    to={`${baseUrl + agentAccount?.agreementFile}`}
                    className="flex items-center mt-2 p-1 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors rounded-md"
                    target="_blank"
                  >
                    <span className="flex-1">Download Agreement File</span>
                    <TiDocument />
                  </NavLink>
                  <span className="cursor-pointer hover:text-red-500" onClick={() => handleRemoveFile("agreementFile")}><FaTimes/></span>
                </div>
              )}
            </div>          

            <div>
              <label htmlFor="new-pass">New Password</label>
              <input
                {...register("password", {
                  required: false,
                })}
                type="password"
              />
              {errors.password && (
                <p className="text-red-500">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirm-pass">Confirm Password</label>
              <input
                {...register("confirmPassword", {
                  required: false,
                })}
                type="password"
              />
              {errors.confirmPassword && (
                <p className="text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>Account Status:</label>
              <select
                {...register("status", { required: false })}
                defaultValue={"pending"}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {isEditMode && errors.status && (
                <span className="text-red-500">Status is required</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label>Agreement Status:</label>
              <select
                {...register("agreementStatus", { required: false })}
                defaultValue={"pending"}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {isEditMode && errors.status && (
                <span className="text-red-500">Status is required</span>
              )}
            </div>
          </div>
          <div>
            <label>Special Note:</label>
            <ReactQuill
              value={specialNote}
              onChange={handleChange}
              modules={{
                toolbar: [
                  [{ header: "1" }, { header: "2" }, { font: [] }],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["bold", "italic", "underline"],
                  [{ align: [] }],
                  ["link", "image"],
                  [{ color: [] }],
                ],
              }}
              theme="snow"
              placeholder="Write your special note here..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4 w-full p-5 border">
            {/* Select Plan */}
            <div>
              <label htmlFor="">Select Plan</label>
              {planData?.data?.plans.length === 0 ? (
                <p>No available plans.</p>
              ) : (
                <ul className="space-y-4">
                  {planData?.data?.plans.map((plan: any) => (
                    <li
                      key={plan.id}
                      className={`border border-gray-300 rounded-md p-4 ${
                        selectedPlanId === plan.id ? "bg-gray-200" : ""
                      }`}
                      onClick={() => handlePlanSelect(plan.id)} // Handle selection visually
                    >
                      <input
                        {...register("planId", { required: false })}
                        type="radio"
                        id={plan.id}
                        name="plan"
                        value={plan.id}
                        checked={selectedPlanId === plan.id}
                        onChange={() => handlePlanSelect(plan.id)} // Sync with form
                        className="mr-2"
                      />
                      <label
                        htmlFor={plan.id}
                        className="flex-grow cursor-pointer"
                      >
                        <h3 className="text-lg font-semibold">
                          {plan?.name} ({plan.type})
                        </h3>
                        <ul className="list-disc pl-5">
                          {plan.planItems.map((item: any, itemIndex: any) => (
                            <li key={itemIndex} className="mb-2">
                              <strong>{item?.name}</strong> - $ {item.value} -
                              Optional: {item.isOptional ? "Yes" : "No"}
                              <div className="ml-5">
                                <ul className="list-disc pl-5">
                                  {item.planSubItems.map(
                                    (subItem: any, subItemIndex: any) => (
                                      <li key={subItemIndex}>
                                        {subItem?.name} - $ {subItem.value}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <SelectPlan plans={planData?.data?.plans} selectedPlanId={selectedPlanId} onSelect={handlePlanSelect}/>

            {/* Select Addons Plan */}
            <div>
              <label htmlFor="">Select Addons Plan</label>
              <ul className="space-y-2">
                {optionalPlanData?.data?.optionalPlans.map((plan, index) => (
                  <li
                    key={index}
                    className="border border-gray-300 rounded-sm p-2 text-sm"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-sm">
                        {++index}. {plan?.name} - ${plan?.amount}
                      </p>
                      <div className="space-x-2 flex justify-between items-center">
                        {/* Checkbox for optional plans */}
                        <input
                          {...register("optionalPlanId", { required: false })}
                          type="checkbox"
                          id={`optionalPlan-${plan.id}`}
                          value={plan.id}
                          checked={optionalPlans?.some(
                            (optionalPlan: any) => optionalPlan.id === plan.id
                          )} // Check if the plan is selected
                          onChange={() => handleOptionalPlanChange(plan.id)} // Handle adding/removing optional plans
                          className="mr-2"
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </form>
      </ModalMain>

      <Modal
        title="Agent other documents"
        open={isModal3Visible}
        onCancel={handleCancel3}
        width={850}
      >
        <div>
          {/* pass the record here */}
          <AgentDocument agentAccount={agentAccount}/>
        </div>
      </Modal>



      <Modal
        title="Agent submit details"
        open={isModal2Visible}
        onCancel={handleCancel2}
        width={850}
        footer={[
          <Button key="cancel" onClick={handleCancel2}>
            Close
          </Button>,
        ]}
      >
        <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {/* First Name */}
          <div>
            <label className="block mb-1">First Name</label>
            <input
              type="text"
              {...register("firstName", { required: false })}
              readOnly
              className="border p-2 w-full border-gray-300 bg-gray-100"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block mb-1">Last Name</label>
            <input
              type="text"
              {...register("lastName", { required: false })}
              readOnly
              className="border p-2 w-full border-gray-300 bg-gray-100"
            />
          </div>

          {/* PREC Name */}
          <div>
            <label className="block mb-1">PREC Name (if any)</label>
            <input
              type="text"
              {...register("precName", { required: false })}
              readOnly
              className="border p-2 w-full border-gray-300 bg-gray-100"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              {...register("email", { required: false })}
              readOnly
              className="border p-2 w-full border-gray-300 bg-gray-100"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block mb-1">Address</label>
            <input
              type="text"
              {...register("address", { required: false })}
              readOnly
              className="border p-2 w-full border-gray-300 bg-gray-100"
            />
          </div>

          {/* Cell Phone */}
          <div>
            <label className="block mb-1">Cell Phone</label>
            <input
              type="text"
              {...register("cellPhone", { required: false })}
              readOnly
              className="border p-2 w-full border-gray-300 bg-gray-100"
            />
          </div>

          {/* Phone Service Provider */}
          <div>
            <label className="block mb-1">Phone Service Provider</label>
            <input
              type="text"
              {...register("phoneServiceProvider", { required: false })}
              readOnly
              className="border p-2 w-full border-gray-300 bg-gray-100"
            />
          </div>

          {/* RECO Reg Number */}
          <div>
            <label className="block mb-1">RECO Reg Number</label>
            <input
              type="text"
              {...register("recoRegNumber", { required: false })}
              readOnly
              className="border p-2 w-full border-gray-300 bg-gray-100"
            />
          </div>

          {/* RECO Expiry Date */}
          <div>
            <label className="block mb-1">RECO Expiry Date</label>
            <input
              type="date"
              {...register("recoExpiryDate", { required: false })}
              readOnly
              className="border p-2 w-full border-gray-300 bg-gray-100"
            />
          </div>

          {/* SIN */}
          <div>
            <label className="block mb-1">SIN</label>
            <input
              type="text"
              {...register("sin", { required: false })}
              readOnly
              className="border p-2 w-full border-gray-300 bg-gray-100"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block mb-1">Date of Birth</label>
            <input
              type="date"
              {...register("dob", { required: false })}
              readOnly
              className="border p-2 w-full border-gray-300 bg-gray-100"
            />
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="block mb-1">Emergency Contact</label>
            <input
              type="text"
              {...register("emergencyContact", { required: false })}
              readOnly
              className="border p-2 w-full border-gray-300 bg-gray-100"
            />
          </div>

          {/* HST Number */}
          <div>
            <label className="block mb-1">HST Number</label>
            <input
              type="text"
              {...register("hstNo", { required: false })}
              readOnly
              className="border p-2 w-full border-gray-300 bg-gray-100"
            />
          </div>

          {/* Expected Gross */}
          <div>
            <label className="block mb-1">Expected Gross</label>
            <input
              type="number"
              {...register("expectedGross", { required: false })}
              readOnly
              className="border p-2 w-full border-gray-300 bg-gray-100"
            />
          </div>

          <div>
            <label className="block mb-1">Status:</label>
            <select {...register("status", { required: true })} disabled>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <span className="text-red-500">Status is required</span>
            )}
          </div>

          <div className="flex flex-col">
            <label className="block mb-1">Agreement Status:</label>
            <select
              {...register("agreementStatus", { required: false })}
              defaultValue={"pending"}
              disabled
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {isEditMode && errors.status && (
              <span className="text-red-500">Status is required</span>
            )}
          </div>

          {agentAccount?.nationalIdentity && (
            <div className="flex flex-col">
              <label className="block mb-1">Government Issued ID</label>
              <NavLink
                to={`${baseUrl + agentAccount?.nationalIdentity}`}
                className="flex items-center p-1 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors rounded-md"
                target="_blank"
              >
                <span className="flex-1">Download</span>
                <TiDocument />
              </NavLink>
            </div>
          )}

          {agentAccount?.previousRegistration && (
            <div className="flex flex-col">
              <label className="block mb-1">
                Previous Brokerage Registration Letter
              </label>
              <NavLink
                to={`${baseUrl + agentAccount?.previousRegistration}`}
                className="flex items-center p-1 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors rounded-md"
                target="_blank"
              >
                <span className="flex-1">Download</span>
                <TiDocument />
              </NavLink>
            </div>
          )}

          {agentAccount?.recoLicence && (
            <div className="flex flex-col">
              <label className="block mb-1">RICO Licence</label>
              <NavLink
                to={`${baseUrl + agentAccount?.recoLicence}`}
                className="flex items-center p-1 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors rounded-md"
                target="_blank"
              >
                <span className="flex-1">Download</span>
                <TiDocument />
              </NavLink>
            </div>
          )}

          {agentAccount?.agreementStatus != "approved" &&
            agentAccount?.agreementFile == null && (
              <div className="flex flex-col">
                <label className="block mb-1">Agreement</label>
                <NavLink
                  to={`/dashboard/super-admin/agreement-preview/${agentAccount?.user?.uuid}`}
                  className="flex items-center p-1 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors rounded-md"
                  target="_blank"
                >
                  <span className="flex-1">View Agreement</span>
                </NavLink>
              </div>
            )}

          {agentAccount?.agreementStatus == "approved" && (
            <div className="flex flex-col">
              <label className="block mb-1">Agreement</label>
              <NavLink
                to={`${baseUrl + agentAccount?.agreementFile}`}
                className="flex items-center p-1 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors rounded-md"
                target="_blank"
              >
                <span className="flex-1">View Agreement</span>
              </NavLink>
            </div>
          )}
        </div>

        <div className="my-4">
          <label htmlFor="">Special Note:</label>
          <div
            className={`border rounded-md mb-3 p-4`}
            dangerouslySetInnerHTML={{ __html: specialNote }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 w-full p-5 border">
          <div>
            {plan ? (
              <div>
                <p className="font-bold mt-3">Selected Plans</p>
                <ul className="space-y-4">
                  <li
                    key={plan.id} // Assuming each plan has a unique ID
                    className={`border border-gray-300 rounded-md p-4 ${
                      plan.id ? "bg-gray-200" : ""
                    }`}
                  >
                    <label
                      htmlFor={plan.id}
                      className="flex-grow cursor-pointer"
                    >
                      <h3 className="text-sm font-semibold">
                        {plan?.name} ({plan.type})
                      </h3>
                      <ul className="list-disc pl-5">
                        {plan?.planItems?.map((item: any, itemIndex: any) => (
                          <li key={itemIndex} className="mb-2">
                            <strong>{item?.name}</strong> - $ {item.value}
                            <div className="ml-5">
                              <ul className="list-disc pl-5">
                                {item?.planSubItems?.map(
                                  (subItem: any, subItemIndex: any) => (
                                    <li key={subItemIndex}>
                                      {subItem?.name} - $ {subItem.value}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </label>
                  </li>
                </ul>
              </div>
            ) : (
              <p>No available plans.</p>
            )}
          </div>
          <div>
            <p className="font-bold mt-3">Selected Addons Plans</p>
            {optionalPlans && optionalPlans.length > 0 ? (
              <ul>
                {optionalPlans.map((plan: any, index: number) => (
                  <li key={plan.id}>
                    {index + 1}. {plan.name} - ${plan.amount}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No Addon Plan</p>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        title="Confirm Deletion"
        open={isModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={confirmDelete}
            style={{ marginLeft: "8px" }}
          >
            Confirm
          </Button>,
          <Button key="cancel" onClick={cancelDelete}>
            Cancel
          </Button>,
        ]}
      >
        <p>Are you sure you want to delete this item?</p>
      </Modal>

      {/* Delete Multiple Confirmation Modal */}
      <Modal
        title="Confirm Deletion"
        open={isDeleteMultipleModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button key="cancel" onClick={cancelDelete}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={handleDeleteConfirmMultiple}
          >
            Confirm
          </Button>,
        ]}
      >
        Are you sure you want to delete selected items?
      </Modal>
    </div>
  );
};

export default AgentManagement;
