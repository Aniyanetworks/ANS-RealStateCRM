/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any

import { useEffect, useState } from "react";
import type { TableColumnsType, TableProps } from "antd";
import ModalMain from "../../../../../components/ui/Modal";
import { useForm } from "react-hook-form";
import { Table, Modal, Button, Input, Dropdown, Space, Tabs } from "antd";
import { format } from "date-fns";
import {
  FaComment,
  FaEye,
  FaFileAlt,
  FaRegEdit,
  FaTimes,
} from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import toast from "react-hot-toast";
import TableLoader from "../../../../../components/loader/TableLoader";
import {
  useChangePropertyListingStatusMutation,
  useCreateUpdatePropertyListingMutation,
  useSyncMlsNumberMutation,
  useDeletePropertyListingMutation,
  useDeletePropertyListingMultipleMutation,
  useGetPropertyListingQuery,
  useChangeListingStatusMutation,
  useSyncPropertyFromRealtorMutation,
} from "../../../../../redux/api/superadmin/propertyListingDataSlice";
import { Select } from "antd";
import { useAppSelector } from "../../../../../redux/hooks";
import { Link, NavLink, useParams } from "react-router-dom";
import { serialize } from "v8";
import { BsThreeDotsVertical } from "react-icons/bs";
import moment from "moment";
import { usePermissions } from "../../../../../utils/permissionUtils";
import PropertyListingPaperworkFileManager from "./PropertyListingPaperworkFileManager";
import ViewPropertyListing from "./ViewPropertyListing";
import { useGetRealtorPropertiesQuery } from "../../../../../redux/api/realtor/realtorPropertySlice";
import { SyncOutlined } from "@ant-design/icons";
type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface DataType {
  mlsNumber: string;
  propertyAddress: string;
  soldPrice: number;
  acceptanceDate: string;
  closingDate: string;
  conditional: string;
  firmDate: string;
  continueShowings: string;
  depositAmount: number;
  depositDate: string;
  updateMLSStatus: string;
  uuid: string;
  status: string;
}

type TabType = {
  id: string;
  name: string;
};

const tabs: TabType[] = [
  {
    id: "current",
    name: "Current Listings",
  },
  {
    id: "previous",
    name: "Previous Listings",
  },
  {
    id: "all",
    name: "All Listings",
  },
];

const PropertyListingManagement = () => {
  const { filter } = useParams("filter");
  const { hasPermissionForSlug } = usePermissions();
  const [tableData, setTableData] = useState<DataType[]>([]);
  // Add user.id as a query param to force refetch when user changes
  const { user } = useAppSelector((state) => state.user);
  /* const { data, isLoading, refetch } = useGetPropertyListingQuery(user?.id || "", {
    skip: !user?.id,
  }); */
  const { data, isLoading, refetch } = useGetPropertyListingQuery(
    {
      userId: user?.id || "",
      listingType: "regular",
    },
    {
      skip: !user?.id,
    }
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | "null">("null");
  const [isUploading, setIsUploading] = useState(false);
  const [isModalFileManagerVisible, setIsModalFileManagerVisible] =
    useState(false);
  const [
    isModalPropertyListPreviewVisible,
    setIsModalPropertyListPreviewVisible,
  ] = useState(false);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [isRejectReasonViewModalVisible, setIsRejectReasonViewModalVisible] =
    useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [changeStatus, setChangeStatus] = useState("");
  const [changeUuid, setChangeUuid] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [deleteMultiplePropertyListing] =
    useDeletePropertyListingMultipleMutation();
  const [searchText, setSearchText] = useState("");
  const [listingFilter, setListingFilter] = useState<
    "current" | "previous" | "all"
  >("current");
  const [isSyncModalVisible, setIsSyncModalVisible] = useState(false);
  const [matchedPairs, setMatchedPairs] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedPairsToSync, setSelectedPairsToSync] = useState<string[]>([]);

  // State for sync updated data functionality
  const [isSyncDataModalVisible, setIsSyncDataModalVisible] = useState(false);
  const [matchedDataPairs, setMatchedDataPairs] = useState<any[]>([]);
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [selectedDataPairsToSync, setSelectedDataPairsToSync] = useState<
    string[]
  >([]);
  const [isDifferenceLogModalVisible, setIsDifferenceLogModalVisible] =
    useState(false);
  const [selectedPairForLog, setSelectedPairForLog] = useState<any>(null);
  const [differenceLog, setDifferenceLog] = useState<any[]>([]);

  // Realtor properties query
  const { data: realtorData, isLoading: isLoadingRealtor } =
    useGetRealtorPropertiesQuery();
  const [updatePropertyListing] = useCreateUpdatePropertyListingMutation();
  const [syncMlsNumber] = useSyncMlsNumberMutation();
  const [syncPropertyFromRealtor] = useSyncPropertyFromRealtorMutation();

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();

    const inProperties = Object.values(record.createdUser || {}).some((data) =>
      String(data).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return inProperties || inRecord;
  });

  const statusOptions = [
    {
      label: "Approved",
      value: "approved",
    },
    {
      label: "Under Review",
      value: "underReview",
    },
    {
      label: "Draft",
      value: "draft",
    },
    {
      label: "Rejected",
      value: "rejected",
    },
    {
      label: "Pending MLS",
      value: "pendingMls",
    },
  ];

  const listingStatusOptions = [
    {
      label: "Listed",
      value: "listed",
    },
    {
      label: "Sold Conditional",
      value: "soldConditional",
    },
    {
      label: "Leased",
      value: "leased",
    },
    {
      label: "Terminated",
      value: "terminated",
    },
    {
      label: "Suspended",
      value: "suspended",
    },
    {
      label: "Extended",
      value: "extended",
    },
    {
      label: "Expired",
      value: "expired",
    },
    {
      label: "DFT",
      value: "dft",
    },
    {
      label: "Closed",
      value: "closed",
    },
    {
      label: "Exclusive",
      value: "exclusive",
    },
  ];

  // const formatDate = (isoDate: any) => {
  //   if(isoDate)
  //   {
  //     return format(new Date(isoDate), "yyyy-MM-dd");
  //   }
  //   else
  //   {
  //     return "";
  //   }

  // };

  const formatDate = (isoDate: any) => {
    if (isoDate) {
      return moment.utc(isoDate).format("YYYY-MM-DD");
    } else {
      return "";
    }
  };

  useEffect(() => {
    if (data?.data?.propertyListingData) {
      setTableData(data.data.propertyListingData);
    }
    setSearchText(localStorage.getItem("searchTextPropertyList") || "");
  }, [data, searchText]);

  const {
    register,
    formState: { errors },
    reset,
    getValues,
    setValue,
    setError,
    handleSubmit,
  } = useForm<DataType>({});

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

  const [createUpdatePropertyListing] =
    useCreateUpdatePropertyListingMutation();
  const [changePropertyListingStatus] =
    useChangePropertyListingStatusMutation();
  const [deletePropertyListing] = useDeletePropertyListingMutation();

  const [changeListingStatus] = useChangeListingStatusMutation();

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedUUID("null");
  };

  const resetForm = () => {
    setValue("mlsNumber", "");
    setValue("propertyAddress", "");
    setValue("askingPrice", parseInt(""));
    setValue("contractDate", "");
    setValue("expiryDate", "");
    setValue("offerDate", "");
    setValue("typeOfProperty", "");
    setIsEditMode(false);
    setSelectedUUID("null");
  };

  const handleEdit = (record: DataType) => {
    // Create a new object with formatted date fields
    const formattedRecord = {
      ...record,
      contractDate: formatDate(record.contractDate),
      expiryDate: formatDate(record.expiryDate),
      offerDate: formatDate(record.offerDate),
    };

    // Reset the form with the formatted record
    reset(formattedRecord);
    setIsEditMode(true);
    setSelectedUUID(record.uuid);
    showModal();
  };

  const confirmDelete = async () => {
    if (!selectedUUID) return; // Add check to avoid undefined
    try {
      const response = await deletePropertyListing(selectedUUID).unwrap();
      toast.success(response?.message);
      setTableData(tableData.filter((item): any => item.uuid !== selectedUUID));
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

    setIsRejectModalVisible(false);
    setIsRejectReasonViewModalVisible(false);
    setRejectReason("");
    setChangeStatus("");
    setChangeUuid(null);

    setIsDeleteModalMultipleVisible(false);
  };

  const handleDelete = (uuid: string) => {
    setSelectedUUID(uuid);
    setIsModalVisible(true);
  };

  const onSubmit = async () => {
    setIsUploading(true);
    const data = getValues();

    const handleResponse = (response: any) => {
      if (response?.error?.data?.status === false) {
        if (response.error.data.errors) {
          response.error.data.errors.forEach((error: any) => {
            setError(error.path, {
              type: "manual",
              message: error.msg,
            });
          });
        } else {
          toast.error(response.error.data.message);
        }
      } else if (response?.data?.status === true) {
        toast.success(response.data.message);
        setIsModalOpen(false);
        resetForm();
      }
    };

    try {
      const response = await createUpdatePropertyListing({
        uuid: selectedUUID,
        data,
      });

      handleResponse(response);
    } catch (error: any) {
      toast.error("Update failed. Something went wrong!");
      console.error("Error:", error);
    } finally {
      setIsUploading(false);
      if (isEditMode) {
        setIsEditMode(false);
        setSelectedUUID("null"); // Use null instead of 'null'
      }
    }
  };

  const handleChangeStatus = async (newStatus: string, uuid: string) => {
    setChangeStatus(newStatus);
    setChangeUuid(uuid);

    if (newStatus == "rejected") {
      setIsRejectModalVisible(true);
    } else {
      changeStatusApi(newStatus, uuid);
    }
  };

  const handleChangeListingStatus = async (newStatus: string, uuid: string) => {
    const requestData = {
      status: newStatus,
    };
    try {
      const response = await changeListingStatus({
        data: requestData,
        uuid: uuid,
      }).unwrap();
      toast.success(`${response?.message}`);

      cancelDelete();
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  const changeStatusApi = async (newStatus: string, uuid: string) => {
    const requestData = {
      status: changeStatus || newStatus,
      rejectReason: rejectReason,
    };
    console.log("requestData", requestData);

    try {
      const response = await changePropertyListingStatus({
        data: requestData,
        uuid: changeUuid || uuid,
      }).unwrap();
      toast.success(`${response?.message}`);

      cancelDelete();
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  const handleRejectReasonChange = (e) => {
    setRejectReason(e.target.value);
  };

  const handleRejectReasonView = (reason) => {
    setRejectReason(reason);
    setIsRejectReasonViewModalVisible(true);
  };

  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true); // Show delete confirmation modal
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteMultiplePropertyListing(selectedRowKeys);
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

  const [currentPage, setCurrentPage] = useState(
    localStorage.getItem("listingCurentPage") || 1
  );
  const [selectedListingId, setSelectedListingId] = useState(
    localStorage.getItem("listingId") || ""
  );

  const handleChange: OnChange = (pagination, filters, sorter) => {
    localStorage.setItem("listingCurentPage", pagination?.current || 1);
    setCurrentPage(pagination?.current || 1);
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: "#",
      key: "serial",
      width: 50,
      dataIndex: "serial",
      fixed: "left",
    },
    {
      title: "Property Record",
      dataIndex: "propertyListingTypeId",
      key: "propertyListingTypeId",
      render: (propertyListingTypeId, record) => (
        <button
          onClick={() => {
            localStorage.setItem("listingId", record?.id || "");
            setIsModalPropertyListPreviewVisible(true);
            setSelectedUuid(record.uuid);
            setSelectedListingId(record?.id || "");
          }}
          style={{
            cursor: "pointer",
            border: "none",
            background: "none",
            padding: 0,
            font: "inherit",
          }}
          className="hover:text-blue-600 cursor-pointer hover:underline"
        >
          {propertyListingTypeId || "N/A"}
        </button>
      ),
    },
    {
      title: "MLS Number",
      dataIndex: "mlsNumber",
      key: "mlsNumber",
      render: (mlsNumber, record) => (
        <button
          onClick={() => {
            localStorage.setItem("listingId", record?.id || "");
            setIsModalPropertyListPreviewVisible(true);
            setSelectedUuid(record.uuid);
            setSelectedListingId(record?.id || "");
          }}
          style={{
            cursor: "pointer",
            border: "none",
            background: "none",
            padding: 0,
            color: "inherit",
            font: "inherit",
            textDecoration: "none", // No underline by default
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.textDecoration = "underline")
          }
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          {mlsNumber || "N/A"}
        </button>
      ),
    },
    {
      title: "Property Address",
      dataIndex: "propertyAddress",
      key: "propertyAddress",
      render: (propertyAddress, record) => (
        <button
          onClick={() => {
            localStorage.setItem("listingId", record?.id || "");
            setIsModalPropertyListPreviewVisible(true);
            setSelectedUuid(record.uuid);
            setSelectedListingId(record?.id || "");
          }}
          style={{
            color: record.status === "rejected" ? "red" : "inherit", // Apply red color if status is 'rejected'
          }}
          className={record.status === "rejected" ? "blinking" : ""} // Apply blinking class if status is 'rejected'
        >
          {propertyAddress || "N/A"}
        </button>
      ),

      width: 240,
    },
    {
      title: "Listing Agent",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (text, record) => {
        return record?.createdUser
          ? `${record.createdUser.firstName} ${record.createdUser.lastName}`
          : "Unknown";
      },
    },
    {
      title: "Shared Agent",
      dataIndex: "name", // Keep dataIndex as is, unless you want to map it differently
      key: "name", // Keep key as is
      render: (text, record) => {
        const multipleUserArray = record?.sharedUsers;
        return multipleUserArray?.map((rep: string, index: number) => (
          <span key={index}>
            {rep["name"]}
            {index < multipleUserArray.length - 1 ? ", " : ""}
          </span>
        ));
      },
    },
    {
      title: "Listing Type",
      dataIndex: "propertyListingType",
      key: "propertyListingType",
      filters: [
        { text: "For sale", value: "For sale" },
        { text: "FOr rent", value: "FOr rent" },
      ],
      onFilter: (value, record) => record.propertyListingType === value,
      render: (propertyType: any) => (
        <span>{propertyType ? propertyType.charAt(0).toUpperCase() + propertyType.slice(1) : "N/A"}</span>
      ),
    },
    {
      title: "Property Type",
      dataIndex: "propertyType",
      key: "propertyType",
      filters: [
        { text: "Detached", value: "Detached" },
        { text: "Semi Detached", value: "Semi Detached" },
        { text: "Freehold Townhome", value: "Freehold Townhome" },
        { text: "Condo Apt", value: "Condo Apt" },
        { text: "Condo Townhome", value: "Condo Townhome" },
        { text: "Other", value: "Other" },
      ],
      onFilter: (value, record) => record.propertyType === value,
      render: (propertyType: any) => (
        <span>{propertyType ? propertyType.charAt(0).toUpperCase() + propertyType.slice(1) : "N/A"}</span>
      ),
    },
    {
      title: "Listing Status",
      dataIndex: "listingStatus",
      key: "listingStatus",
      filters: [
        { value: "listed", text: "Listed" },
        { value: "sold", text: "Sold" },
        { value: "leased", text: "Leased" },
        { value: "terminated", text: "Terminated" },
        { value: "suspended", text: "Suspended" },
        { value: "extended", text: "Extended" },
        { value: "expired", text: "Expired" },
        { value: "dft", text: "DFT" },
        { value: "exclusive", text: "Exclusive" },
      ],
      onFilter: (value, record) => record.listingStatus === value,
      render: (listingStatus: any) => (
        <span>{listingStatus ? listingStatus.charAt(0).toUpperCase() + listingStatus.slice(1) : "N/A"}</span>
      ),
    },

    {
      title: "Admin Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Approved", value: "approved" },
        { text: "Under Review", value: "underReview" },
        { text: "Draft", value: "draft" },
        { text: "Incomplete", value: "rejected" },
        { text: "Pending MLS", value: "pendingMls" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status, record) => (
        <Select
          value={status}
          onChange={(newStatus) => handleChangeStatus(newStatus, record.uuid)}
          options={statusOptions}
          style={{
            width: 150,
            color: status === "rejected" ? "red" : "inherit",
          }}
          disabled={user.userType === "agent"}
        />
      ),
    },
    {
      title: "Actions",
      dataIndex: "uuid",
      key: "actions",
      fixed: "right",
      render: (uuid, recoard) => (
        <Dropdown
          menu={{
            items: [
              (recoard.createdBy == user.id ||
                user.userType === "superAdmin" ||
                recoard.status === "rejected" ||
                recoard.status === "draft") &&
                hasPermissionForSlug("edit-property-listing") && {
                  key: "edit",
                  label: (
                    <Link
                      onClick={() => {
                        localStorage.setItem("listingId", recoard?.id || "");
                        setSelectedListingId(recoard?.id || "");
                      }}
                      to={`/dashboard/super-admin/create-update-property-listing/${recoard.uuid}`}
                      className="flex gap-2 items-center"
                    >
                      <FaRegEdit />
                      Edit
                    </Link>
                  ),
                },
              {
                key: "view",
                label: (
                  <button
                    onClick={() => {
                      localStorage.setItem("listingId", recoard?.id || "");
                      setIsModalPropertyListPreviewVisible(true);
                      setSelectedUuid(recoard.uuid);
                      setSelectedListingId(recoard?.id || "");
                    }}
                    to={`/dashboard/super-admin/view-property-listing/${recoard.uuid}`}
                    className="flex gap-2 items-center"
                  >
                    <FaEye />
                    View
                  </button>
                ),
              },
              {
                key: "fileManager",
                label: (
                  <button
                    onClick={() => {
                      localStorage.setItem("listingId", recoard?.id || "");
                      setIsModalFileManagerVisible(true);
                      setSelectedUuid(recoard.uuid);
                      setSelectedListingId(recoard?.id || "");
                    }}
                    className=" flex items-center gap-2" // Added margin left for spacing
                  >
                    <FaFileAlt /> File Manager
                  </button>
                ),
              },
              recoard.status === "rejected" && {
                key: "rejectReason",
                label: (
                  <button
                    onClick={() => {
                      localStorage.setItem("listingId", recoard?.id || "");
                      setSelectedListingId(recoard?.id || "");
                      handleRejectReasonView(recoard?.rejectReason);
                    }}
                    className="flex gap-2 items-center"
                  >
                    <FaComment className="text-red-500" />
                    Reject Reason
                  </button>
                ),
              },
              ((user.userType === "agent" && recoard.status === "draft") ||
                user.userType === "superAdmin" ||
                user.userType === "admin") &&
                hasPermissionForSlug("delete-property-listing") && {
                  key: "delete",
                  label: (
                    <button
                      onClick={() => handleDelete(uuid)}
                      className="flex gap-2 items-center"
                    >
                      <MdDelete size={17} />
                      Delete
                    </button>
                  ),
                },
            ],
          }}
        >
          <a onClick={(e) => e.preventDefault()}>
            <Space>
              <BsThreeDotsVertical />
            </Space>
          </a>
        </Dropdown>
      ),
      align: "center",
    },
  ];

  const showModal = () => setIsModalOpen(true);

  const getFilteredData = () => {
    if (!filteredData) return [];

    switch (listingFilter) {
      case "current":
        return filteredData.filter((item) => item.listingStatus === "listed");
      case "previous":
        return filteredData.filter((item) => item.listingStatus !== "listed");
      case "all":
      default:
        return filteredData;
    }
  };

  const filterProps = filter
    ? getFilteredData().filter((item) => item.listingStatus === filter)
    : getFilteredData();

  // serial number in the table
  const tableSourceData = filterProps?.map((item: any, index: number) => {
    return {
      ...item,
      serial: index + 1,
    };
  });

  // Helper function to normalize address for comparison
  const normalizeAddress = (addressParts: string[]): string => {
    return addressParts
      .filter(Boolean)
      .map((part) =>
        part
          ?.toLowerCase()
          .trim()
          .replace(/[^\w\s]/g, "")
      )
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Helper function to calculate similarity between two strings (Levenshtein distance based)
  const calculateSimilarity = (str1: string, str2: string): number => {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 100;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 100;

    // Check if shorter string is contained in longer string
    if (longer.includes(shorter)) {
      return (shorter.length / longer.length) * 100;
    }

    // Calculate Levenshtein distance
    const distance = levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return ((maxLength - distance) / maxLength) * 100;
  };

  // Levenshtein distance calculation
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  // Helper function to extract address parts from property address string
  const extractAddressParts = (propertyAddress: string) => {
    if (!propertyAddress) return { streetNumber: "", streetName: "", city: "" };

    // Get the first part before comma (street address)
    const firstPart =
      propertyAddress.split(",")[0]?.trim() || propertyAddress.trim();

    // Try to extract street number and name
    // Pattern: number followed by street name (e.g., "1517 Evans Milton")
    const streetMatch = firstPart.match(/^(\d+)\s+(.+)$/);
    const streetNumber = streetMatch ? streetMatch[1] : "";
    const streetName = streetMatch ? streetMatch[2].trim() : firstPart;

    return {
      streetNumber: streetNumber,
      streetName: streetName,
      city: "",
    };
  };

  // Function to find property listings with null/empty MLS and match with Realtor properties
  const findAndMatchProperties = () => {
    if (!realtorData?.data || !tableData) {
      toast.error("Unable to fetch data for matching");
      return;
    }

    // Step 1: Find property listings where MLS is null or empty
    const propertiesWithoutMLS = tableData.filter((listing: any) => {
      const mls = listing.mlsNumber;
      // Handle various null/empty cases: null, undefined, empty string, or string "null"
      if (!mls) return true;
      const trimmedMls = String(mls).trim().toLowerCase();
      return trimmedMls === "" || trimmedMls === "null";
    });

    if (propertiesWithoutMLS.length === 0) {
      toast.success("All property listings already have MLS numbers!");
      return;
    }

    // Step 2: Match with Realtor properties using address parts
    const pairs: any[] = [];

    propertiesWithoutMLS.forEach((property: any) => {
      if (!property.propertyAddress) return;

      // Extract address parts from property listing
      const propertyAddressParts = extractAddressParts(
        property.propertyAddress
      );

      // Build property street address for matching
      const propertyStreetParts = [
        propertyAddressParts.streetNumber,
        propertyAddressParts.streetName,
      ].filter(Boolean);

      if (propertyStreetParts.length === 0) return;

      // Match only using street number and street name (ignore city)
      const normalizedPropertyStreet = normalizeAddress(propertyStreetParts);

      if (!normalizedPropertyStreet) return;

      // Find potential matching Realtor properties using similarity matching
      const potentialMatches: any[] = [];

      realtorData.data.forEach((realtorProperty: any) => {
        // Get Realtor street parts - handle both separate fields and combined
        let realtorStreetParts: string[] = [];

        // Case 1: StreetNumber and StreetName are separate fields
        if (realtorProperty.StreetNumber && realtorProperty.StreetName) {
          realtorStreetParts = [
            String(realtorProperty.StreetNumber).trim(),
            String(realtorProperty.StreetName).trim(),
          ];
        }
        // Case 2: Only StreetName exists (might contain full address like "1517 Evans Milton")
        else if (realtorProperty.StreetName) {
          const extracted = extractAddressParts(realtorProperty.StreetName);
          if (extracted.streetNumber && extracted.streetName) {
            realtorStreetParts = [extracted.streetNumber, extracted.streetName];
          } else {
            // If extraction failed, use StreetName as-is
            realtorStreetParts = [realtorProperty.StreetName];
          }
        }
        // Case 3: Only StreetNumber exists (unlikely but handle it)
        else if (realtorProperty.StreetNumber) {
          realtorStreetParts = [String(realtorProperty.StreetNumber).trim()];
        }

        if (realtorStreetParts.length === 0) return;

        const normalizedRealtorStreet = normalizeAddress(realtorStreetParts);

        // Calculate similarity score
        const similarity = calculateSimilarity(
          normalizedPropertyStreet,
          normalizedRealtorStreet
        );

        // Consider matches with 50% or higher similarity, or exact matches
        // Lower threshold to catch more potential matches
        const isExactMatch =
          normalizedRealtorStreet === normalizedPropertyStreet;
        const isPotentialMatch = similarity >= 50;

        if (isExactMatch || isPotentialMatch) {
          potentialMatches.push({
            ...realtorProperty,
            similarity: isExactMatch ? 100 : similarity,
            isExactMatch: isExactMatch,
            normalizedAddress: normalizedRealtorStreet,
            realtorStreetParts: realtorStreetParts,
          });
        }
      });

      // Sort by similarity (exact matches first, then by similarity score)
      potentialMatches.sort((a, b) => {
        if (a.isExactMatch && !b.isExactMatch) return -1;
        if (!a.isExactMatch && b.isExactMatch) return 1;
        return b.similarity - a.similarity;
      });

      // Show all potential matches (lower threshold to catch more matches)
      // User can review and select the correct ones
      const matchingRealtorProperties = potentialMatches.filter(
        (m) => m.isExactMatch || m.similarity >= 50
      );

      // Create pairs for each match
      matchingRealtorProperties.forEach((realtorProperty: any) => {
        const mlsNumber =
          realtorProperty.ListingKey ||
          realtorProperty.MlsNumber ||
          realtorProperty.MLSNumber ||
          realtorProperty.mlsNumber ||
          "";

        pairs.push({
          pairId: `${property.uuid}_${realtorProperty.ListingKey}`,
          propertyListing: {
            uuid: property.uuid,
            propertyAddress: property.propertyAddress,
            currentMLS: property.mlsNumber || "N/A",
            id: property.id,
          },
          realtorProperty: {
            ListingKey: realtorProperty.ListingKey,
            mlsNumber: mlsNumber,
            propertyAddress: [
              realtorProperty.StreetNumber,
              realtorProperty.StreetName,
              realtorProperty.City,
            ]
              .filter(Boolean)
              .join(" "),
            ListPrice: realtorProperty.ListPrice,
            PropertyType: realtorProperty.PropertyType,
            MlsStatus: realtorProperty.MlsStatus,
          },
          similarity: realtorProperty.similarity || 100,
          isExactMatch: realtorProperty.isExactMatch !== false,
        });
      });
    });

    if (pairs.length === 0) {
      // Try to find potential matches with lower threshold
      const allPotentialPairs: any[] = [];

      propertiesWithoutMLS.forEach((property: any) => {
        if (!property.propertyAddress) return;

        const propertyAddressParts = extractAddressParts(
          property.propertyAddress
        );
        const propertyStreetParts = [
          propertyAddressParts.streetNumber,
          propertyAddressParts.streetName,
        ].filter(Boolean);

        if (propertyStreetParts.length === 0) return;

        const normalizedPropertyStreet = normalizeAddress(propertyStreetParts);
        if (!normalizedPropertyStreet) return;

        realtorData.data.forEach((realtorProperty: any) => {
          let realtorStreetParts: string[] = [];

          if (realtorProperty.StreetNumber && realtorProperty.StreetName) {
            realtorStreetParts = [
              String(realtorProperty.StreetNumber).trim(),
              String(realtorProperty.StreetName).trim(),
            ];
          } else if (realtorProperty.StreetName) {
            const extracted = extractAddressParts(realtorProperty.StreetName);
            if (extracted.streetNumber && extracted.streetName) {
              realtorStreetParts = [
                extracted.streetNumber,
                extracted.streetName,
              ];
            } else {
              realtorStreetParts = [realtorProperty.StreetName];
            }
          }

          if (realtorStreetParts.length === 0) return;

          const normalizedRealtorStreet = normalizeAddress(realtorStreetParts);
          const similarity = calculateSimilarity(
            normalizedPropertyStreet,
            normalizedRealtorStreet
          );

          // Show all potential matches with 30%+ similarity for user review
          if (similarity >= 30) {
            const mlsNumber =
              realtorProperty.ListingKey ||
              realtorProperty.MlsNumber ||
              realtorProperty.MLSNumber ||
              realtorProperty.mlsNumber ||
              "";

            allPotentialPairs.push({
              pairId: `${property.uuid}_${realtorProperty.ListingKey}`,
              propertyListing: {
                uuid: property.uuid,
                propertyAddress: property.propertyAddress,
                currentMLS: property.mlsNumber || "N/A",
                id: property.id,
              },
              realtorProperty: {
                ListingKey: realtorProperty.ListingKey,
                mlsNumber: mlsNumber,
                propertyAddress: [
                  realtorProperty.StreetNumber,
                  realtorProperty.StreetName,
                  realtorProperty.City,
                ]
                  .filter(Boolean)
                  .join(" "),
                ListPrice: realtorProperty.ListPrice,
                PropertyType: realtorProperty.PropertyType,
                MlsStatus: realtorProperty.MlsStatus,
              },
              similarity: similarity,
              isExactMatch: similarity === 100,
            });
          }
        });
      });

      // Sort by similarity
      allPotentialPairs.sort((a, b) => b.similarity - a.similarity);

      if (allPotentialPairs.length > 0) {
        setMatchedPairs(allPotentialPairs);
        setIsSyncModalVisible(true);
        toast.success(
          `Found ${allPotentialPairs.length} potential match(es) (30%+ similarity). Please review and select the correct matches.`
        );
        return;
      }

      // Add comprehensive debug info
      const debugInfo: any = {
        propertiesWithoutMLS: propertiesWithoutMLS.length,
        realtorProperties: realtorData.data.length,
        propertyDetails: propertiesWithoutMLS.map((prop: any) => ({
          address: prop.propertyAddress,
          extracted: extractAddressParts(prop.propertyAddress),
          normalized: normalizeAddress([
            extractAddressParts(prop.propertyAddress).streetNumber,
            extractAddressParts(prop.propertyAddress).streetName,
          ]),
        })),
        realtorDetails: realtorData.data.slice(0, 5).map((realtor: any) => {
          const realtorStreetParts =
            realtor.StreetNumber && realtor.StreetName
              ? [
                  String(realtor.StreetNumber).trim(),
                  String(realtor.StreetName).trim(),
                ]
              : realtor.StreetName
              ? [realtor.StreetName]
              : [];
          return {
            StreetNumber: realtor.StreetNumber,
            StreetName: realtor.StreetName,
            streetParts: realtorStreetParts,
            normalized: normalizeAddress(realtorStreetParts),
            similarity: propertiesWithoutMLS[0]
              ? calculateSimilarity(
                  normalizeAddress([
                    extractAddressParts(propertiesWithoutMLS[0].propertyAddress)
                      .streetNumber,
                    extractAddressParts(propertiesWithoutMLS[0].propertyAddress)
                      .streetName,
                  ]),
                  normalizeAddress(realtorStreetParts)
                )
              : 0,
          };
        }),
      };

      console.log("Matching Debug Info:", debugInfo);

      toast(
        `No matching Realtor properties found. Found ${propertiesWithoutMLS.length} properties without MLS and ${realtorData.data.length} Realtor properties. Check console for details.`
      );
      return;
    }

    setMatchedPairs(pairs);
    setIsSyncModalVisible(true);
    toast.success(`Found ${pairs.length} matched pair(s)`);
  };

  // Function to sync MLS numbers from IDX to property listings
  const handleSyncMLS = async () => {
    if (selectedPairsToSync.length === 0) {
      toast.error("Please select at least one pair to sync");
      return;
    }

    setIsSyncing(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const pairId of selectedPairsToSync) {
        const pair = matchedPairs.find((p) => p.pairId === pairId);
        if (!pair) continue;

        const mlsNumber = pair.realtorProperty.mlsNumber;
        if (!mlsNumber) {
          console.warn(`Skipping pair with no MLS number:`, pair);
          errorCount++;
          continue;
        }

        try {
          // Update property listing with MLS number using dedicated sync endpoint
          const response = await syncMlsNumber({
            uuid: pair.propertyListing.uuid,
            mlsNumber: mlsNumber,
          }).unwrap();

          if (response?.status === true) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error: any) {
          console.error(`Error syncing MLS for pair ${pairId}:`, error);
          errorCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(`Successfully synced ${successCount} MLS number(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to sync ${errorCount} MLS number(s)`);
      }

      // Refresh data and close modal
      await refetch();
      setIsSyncModalVisible(false);
      setSelectedPairsToSync([]);
      setMatchedPairs([]);
    } catch (error) {
      toast.error("An error occurred during sync");
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Function to compare property listing data with IDX Property data
  const comparePropertyData = (propertyListing: any, realtorProperty: any) => {
    const differences: any[] = [];

    // Field mapping between property listing and IDX Property
    // Note: Property listing uses 'listingPrice' and 'address' in the database
    const fieldMappings = [
      {
        propertyField: "listingPrice", // Backend uses listingPrice, not askingPrice
        realtorField: "ListPrice",
        label: "Listing Price / List Price",
        format: (val: any) =>
          val ? `$${Number(val).toLocaleString()}` : "N/A",
      },
      {
        propertyField: "address", // Backend uses address, not propertyAddress
        realtorField: "propertyAddress",
        label: "Property Address",
        format: (val: any) => val || "N/A",
      },
      {
        propertyField: "propertyType",
        realtorField: "PropertyType",
        label: "Property Type",
        format: (val: any) => val || "N/A",
      },
      {
        propertyField: "listingStatus",
        realtorField: "MlsStatus",
        label: "Listing Status / MLS Status",
        format: (val: any) => val || "N/A",
      },
      {
        propertyField: "bedrooms",
        realtorField: "BedroomsTotal",
        label: "Bedrooms",
        format: (val: any) => val || "N/A",
      },
      {
        propertyField: "bathrooms",
        realtorField: "BathroomsTotalInteger",
        label: "Bathrooms",
        format: (val: any) => val || "N/A",
      },
      {
        propertyField: "squareFeet",
        realtorField: "LivingArea",
        label: "Square Feet / Living Area",
        format: (val: any) =>
          val ? `${Number(val).toLocaleString()} sq ft` : "N/A",
      },
      {
        propertyField: "lotSize",
        realtorField: "LotSizeSquareFeet",
        label: "Lot Size",
        format: (val: any) =>
          val ? `${Number(val).toLocaleString()} sq ft` : "N/A",
      },
      {
        propertyField: "yearBuilt",
        realtorField: "YearBuilt",
        label: "Year Built",
        format: (val: any) => val || "N/A",
      },
      {
        propertyField: "mlsNumber",
        realtorField: "mlsNumber",
        label: "MLS Number",
        format: (val: any) => val || "N/A",
      },
    ];

    // Get full property listing data from tableData
    const fullPropertyListing = tableData.find(
      (p: any) => p.uuid === propertyListing.uuid
    );

    fieldMappings.forEach((mapping) => {
      // Try multiple possible field names for property listing
      let propertyValue = fullPropertyListing?.[mapping.propertyField];

      // Fallback for listingPrice (might be stored as askingPrice in frontend)
      if (mapping.propertyField === "listingPrice" && !propertyValue) {
        propertyValue = fullPropertyListing?.askingPrice;
      }

      // Fallback for address (might be stored as propertyAddress in frontend)
      if (mapping.propertyField === "address" && !propertyValue) {
        propertyValue = fullPropertyListing?.propertyAddress;
      }

      let realtorValue = realtorProperty[mapping.realtorField];

      // Handle propertyAddress specially for realtor
      if (mapping.realtorField === "propertyAddress") {
        realtorValue = [
          realtorProperty.StreetNumber,
          realtorProperty.StreetName,
          realtorProperty.City,
        ]
          .filter(Boolean)
          .join(" ");
      }

      // Handle MLS number for realtor
      if (mapping.realtorField === "mlsNumber") {
        realtorValue =
          realtorProperty.ListingKey ||
          realtorProperty.MlsNumber ||
          realtorProperty.MLSNumber ||
          realtorProperty.mlsNumber ||
          null;
      }

      // Normalize values for comparison
      const normalizedPropertyValue =
        propertyValue !== null && propertyValue !== undefined
          ? String(propertyValue).trim().toLowerCase()
          : "";
      const normalizedRealtorValue =
        realtorValue !== null && realtorValue !== undefined
          ? String(realtorValue).trim().toLowerCase()
          : "";

      // Check if values are different
      if (normalizedPropertyValue !== normalizedRealtorValue) {
        differences.push({
          field: mapping.label,
          propertyValue: mapping.format(propertyValue),
          realtorValue: mapping.format(realtorValue),
          propertyRawValue: propertyValue,
          realtorRawValue: realtorValue,
        });
      }
    });

    return differences;
  };

  // Function to view difference log for a specific property pair
  const handleViewDifferenceLog = (pair: any) => {
    const differences = comparePropertyData(
      pair.propertyListing,
      pair.realtorProperty.fullRealtorData
    );
    setDifferenceLog(differences);
    setSelectedPairForLog(pair);
    setIsDifferenceLogModalVisible(true);
  };

  // Function to find property listings with MLS numbers and match with Realtor properties for data sync
  const findAndMatchPropertiesForDataSync = () => {
    if (!realtorData?.data || !tableData) {
      toast.error("Unable to fetch data for matching");
      return;
    }

    // Step 1: Find property listings that have MLS numbers
    const propertiesWithMLS = tableData.filter((listing: any) => {
      const mls = listing.mlsNumber;
      if (!mls) return false;
      const trimmedMls = String(mls).trim().toLowerCase();
      return trimmedMls !== "" && trimmedMls !== "null";
    });

    if (propertiesWithMLS.length === 0) {
      toast.error("No property listings with MLS numbers found!");
      return;
    }

    // Step 2: Match with Realtor properties using MLS number
    const pairs: any[] = [];

    propertiesWithMLS.forEach((property: any) => {
      const propertyMLS = String(property.mlsNumber).trim();

      // Find matching IDX Property by MLS number
      const matchingRealtorProperty = realtorData.data.find(
        (realtorProperty: any) => {
          const realtorMLS =
            realtorProperty.ListingKey ||
            realtorProperty.MlsNumber ||
            realtorProperty.MLSNumber ||
            realtorProperty.mlsNumber ||
            "";
          return String(realtorMLS).trim() === propertyMLS;
        }
      );

      if (matchingRealtorProperty) {
        // Calculate differences for this pair
        const differences = comparePropertyData(
          property,
          matchingRealtorProperty
        );

        pairs.push({
          pairId: `${property.uuid}_${matchingRealtorProperty.ListingKey}`,
          propertyListing: {
            uuid: property.uuid,
            propertyAddress: property.propertyAddress,
            mlsNumber: property.mlsNumber,
            id: property.id,
            fullData: property, // Store full property data for comparison
          },
          realtorProperty: {
            ListingKey: matchingRealtorProperty.ListingKey,
            mlsNumber:
              matchingRealtorProperty.ListingKey ||
              matchingRealtorProperty.MlsNumber ||
              matchingRealtorProperty.MLSNumber ||
              matchingRealtorProperty.mlsNumber ||
              "",
            propertyAddress: [
              matchingRealtorProperty.StreetNumber,
              matchingRealtorProperty.StreetName,
              matchingRealtorProperty.City,
            ]
              .filter(Boolean)
              .join(" "),
            ListPrice: matchingRealtorProperty.ListPrice,
            PropertyType: matchingRealtorProperty.PropertyType,
            MlsStatus: matchingRealtorProperty.MlsStatus,
            // Include all IDX Property data for syncing
            fullRealtorData: matchingRealtorProperty,
          },
          differencesCount: differences.length,
          hasDifferences: differences.length > 0,
        });
      }
    });

    if (pairs.length === 0) {
      toast.error(
        "No matching Realtor properties found for the MLS numbers in your listings."
      );
      return;
    }

    // Filter to show only properties with differences
    const pairsWithDifferences = pairs.filter(
      (pair: any) => pair.hasDifferences
    );

    if (pairsWithDifferences.length === 0) {
      toast.success(
        "All matched properties are already in sync! No differences found."
      );
      return;
    }

    setMatchedDataPairs(pairsWithDifferences);
    setIsSyncDataModalVisible(true);
    toast.success(
      `Found ${pairsWithDifferences.length} property listing(s) with differences ready for sync`
    );
  };

  // Function to map IDX Property data to property listing format expected by backend
  const mapRealtorDataToPropertyListing = (realtorProperty: any) => {
    const mappedData: any = {};

    // Map MLS Number
    if (
      realtorProperty.ListingKey ||
      realtorProperty.MlsNumber ||
      realtorProperty.MLSNumber ||
      realtorProperty.mlsNumber
    ) {
      mappedData.mlsNumber =
        realtorProperty.ListingKey ||
        realtorProperty.MlsNumber ||
        realtorProperty.MLSNumber ||
        realtorProperty.mlsNumber ||
        null;
    }

    // Map Listing Price (ListPrice -> listingPrice)
    if (
      realtorProperty.ListPrice !== undefined &&
      realtorProperty.ListPrice !== null
    ) {
      mappedData.listingPrice = parseFloat(realtorProperty.ListPrice);
    }

    // Map Property Type
    if (
      realtorProperty.PropertyType !== undefined &&
      realtorProperty.PropertyType !== null
    ) {
      mappedData.propertyType = realtorProperty.PropertyType || null;
    }

    // Map Listing Status (MlsStatus -> listingStatus)
    if (
      realtorProperty.MlsStatus !== undefined &&
      realtorProperty.MlsStatus !== null
    ) {
      mappedData.listingStatus = realtorProperty.MlsStatus || null;
    }

    // Map Address (combine StreetNumber, StreetName, City -> address)
    const addressParts = [
      realtorProperty.StreetNumber,
      realtorProperty.StreetName,
      realtorProperty.City,
    ].filter(Boolean);

    if (addressParts.length > 0) {
      mappedData.address = addressParts.join(" ").trim() || null;
    }

    // Map Expiry Date if available (ExpirationDate or similar field)
    if (realtorProperty.ExpirationDate) {
      mappedData.expiryDate = realtorProperty.ExpirationDate;
    } else if (realtorProperty.ExpiryDate) {
      mappedData.expiryDate = realtorProperty.ExpiryDate;
    }

    // Map additional fields that might be available
    if (
      realtorProperty.BedroomsTotal !== undefined &&
      realtorProperty.BedroomsTotal !== null
    ) {
      mappedData.bedrooms = parseInt(realtorProperty.BedroomsTotal) || null;
    }

    if (
      realtorProperty.BathroomsTotalInteger !== undefined &&
      realtorProperty.BathroomsTotalInteger !== null
    ) {
      mappedData.bathrooms =
        parseInt(realtorProperty.BathroomsTotalInteger) || null;
    }

    if (
      realtorProperty.LivingArea !== undefined &&
      realtorProperty.LivingArea !== null
    ) {
      mappedData.squareFeet = parseFloat(realtorProperty.LivingArea) || null;
    }

    if (
      realtorProperty.LotSizeSquareFeet !== undefined &&
      realtorProperty.LotSizeSquareFeet !== null
    ) {
      mappedData.lotSize =
        parseFloat(realtorProperty.LotSizeSquareFeet) || null;
    }

    if (
      realtorProperty.YearBuilt !== undefined &&
      realtorProperty.YearBuilt !== null
    ) {
      mappedData.yearBuilt = parseInt(realtorProperty.YearBuilt) || null;
    }

    return mappedData;
  };

  // Function to sync updated data from IDX to property listings
  const handleSyncUpdatedData = async () => {
    if (selectedDataPairsToSync.length === 0) {
      toast.error("Please select at least one pair to sync");
      return;
    }

    setIsSyncingData(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const pairId of selectedDataPairsToSync) {
        const pair = matchedDataPairs.find((p) => p.pairId === pairId);
        if (!pair) continue;

        try {
          // Map IDX Property data to property listing format
          const mappedData = mapRealtorDataToPropertyListing(
            pair.realtorProperty.fullRealtorData
          );

          console.log(
            "Syncing data for property:",
            pair.propertyListing.propertyAddress
          );
          console.log("Mapped data:", mappedData);

          // Sync updated data from IDX Property to property listing
          const response = await syncPropertyFromRealtor({
            uuid: pair.propertyListing.uuid,
            realtorData: mappedData, // Send mapped data instead of full realtor object
          }).unwrap();

          if (response?.status === true) {
            successCount++;
            console.log(
              `Successfully synced property ${pair.propertyListing.propertyAddress}`
            );
          } else {
            errorCount++;
            console.error(`Failed to sync data for pair ${pairId}:`, response);
          }
        } catch (error: any) {
          console.error(`Error syncing data for pair ${pairId}:`, error);
          const errorMessage =
            error?.data?.message || error?.message || "Unknown error";
          toast.error(
            `Error syncing ${pair.propertyListing.propertyAddress}: ${errorMessage}`
          );
          errorCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(
          `Successfully synced updated data for ${successCount} property listing(s)`
        );
      }
      if (errorCount > 0) {
        toast.error(`Failed to sync ${errorCount} property listing(s)`);
      }

      // Refresh data and close modal
      await refetch();
      setIsSyncDataModalVisible(false);
      setSelectedDataPairsToSync([]);
      setMatchedDataPairs([]);
    } catch (error) {
      toast.error("An error occurred during data sync");
      console.error("Data sync error:", error);
    } finally {
      setIsSyncingData(false);
    }
  };

  return (
    <div className="pb-32">
      <div className="flex items-center justify-between gap-5 xl:gap-10 mb-5 p-1">
        <h1>Property Listing</h1>
        {/* <div className="flex items-center gap-4"> */}
        <div className="w-1/3 relative">
          <input
            type="text"
            placeholder="Search from table..."
            value={searchText}
            onChange={(e) => {
              const newValue = e.target.value;
              setSearchText(newValue);
              localStorage.setItem("searchTextPropertyList", newValue);
            }}
            className="global-search w-full pl-10"
          />
          <button
            type="button"
            onClick={() => {
              setSearchText("");
              localStorage.removeItem("searchTextPropertyList");
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
          >
            <FaTimes />
          </button>
        </div>

        {/* </div> */}
        <div className="flex gap-2">
          {/* <Select
            value={listingFilter}
            onChange={(value) => setListingFilter(value)}
            style={{ width: 180 }}
            options={[
              { value: 'current', label: 'Current Listing' },
              { value: 'previous', label: 'Previous Listing' },
              { value: 'all', label: 'All Listings' },
            ]}
          /> */}
          {/* <div> */}
          {hasPermissionForSlug("create-property-listing") && (
            <>
              <Link
                to="/dashboard/super-admin/create-update-property-listing"
                className="primary-btn mx-3"
              >
                Add New
              </Link>
              <button
                onClick={findAndMatchProperties}
                className="primary-btn mx-3 flex items-center gap-2"
                disabled={isLoadingRealtor}
              >
                <SyncOutlined />
                Sync MLS
              </button>
              <button
                onClick={findAndMatchPropertiesForDataSync}
                className="primary-btn mx-3 flex items-center gap-2"
                disabled={isLoadingRealtor}
              >
                <SyncOutlined />
                Sync Property Data
              </button>
            </>
          )}

          {hasPermissionForSlug("delete-property-listing") && (
            <button
              onClick={handleDeleteMultipleClick}
              className="cancel-btn mx-3"
            >
              Delete Selected
            </button>
          )}
          {/* </div> */}
        </div>
      </div>

      <Tabs
        defaultActiveKey="current"
        type="card"
        items={tabs.map((tab) => {
          return {
            label: <span>{tab.name}</span>,
            key: tab.id,
          };
        })}
        onChange={(key) => {
          setListingFilter(key as "current" | "previous" | "all");
        }}
      />

      <div>
        {isLoading ? (
          <TableLoader />
        ) : (
          <Table
            scroll={{ x: "max-content" }}
            rowSelection={rowSelection}
            columns={columns}
            dataSource={tableSourceData}
            // pagination={{ pageSize: 20 }}
            rowKey="uuid"
            onChange={handleChange}
            pagination={{ pageSize: 20, current: currentPage }}
            rowClassName={(record) =>
              record.id == selectedListingId
                ? "bg-gray-200 border-2 border-gray-200" // more prominent highlight
                : ""
            }
          />
        )}
      </div>

      <ModalMain
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        handleOk={handleSubmit(onSubmit)}
        title="Create Property Listing"
        isLoading={isUploading}
        modalClass={"lg:!w-[60%] !z-[10000]"}
      >
        <form className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label>MLS Number</label>
              <input
                readOnly={user.userType === "agent"}
                {...register("mlsNumber")}
                type="text"
                placeholder="Enter MLS Number"
                className={`${
                  user.userType === "agent"
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              />

              {errors.mlsNumber && (
                <p className="text-red-500 text-sm">
                  {errors.mlsNumber.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>
                Property Address <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("propertyAddress", {
                  required: "Property address is required",
                })}
                type="text"
                placeholder="Enter Property Address"
                className=""
              />
              {errors.propertyAddress && (
                <p className="text-red-500 text-sm">
                  {errors.propertyAddress.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>
                Asking Price<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("askingPrice", {
                  required: "Sold price is required",
                })}
                type="number"
                placeholder="Enter Asking Price"
                className=""
              />
              {errors.askingPrice && (
                <p className="text-red-500 text-sm">
                  {errors.askingPrice.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>
                Contract Date <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("contractDate", {
                  required: "Contract Date is required",
                })}
                type="date"
                className=""
              />
              {errors.contractDate && (
                <p className="text-red-500 text-sm">
                  {errors.contractDate.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>
                Expiry Date <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("expiryDate", {
                  required: "Expiry Date date is required",
                })}
                type="date"
                className=""
              />
              {errors.closingDate && (
                <p className="text-red-500 text-sm">
                  {errors.closingDate.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>Offer Date (If any):</label>
              <input {...register("offerDate")} type="date" className="" />
              {errors.offerDate && (
                <p className="text-red-500 text-sm">
                  {errors.offerDate.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>Type of Property</label>
              <select {...register("typeOfProperty")}>
                <option value="">Select</option>
                <option value="Monthly Condo Fees">Monthly Condo Fees</option>
                <option value="Management Company">Management Company</option>
              </select>
              {errors.typeOfProperty && (
                <p className="text-red-500 text-sm">
                  {errors.typeOfProperty.message}
                </p>
              )}
            </div>
          </div>
        </form>
      </ModalMain>

      <Modal
        title="Confirm Deletion"
        visible={isModalVisible}
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

      {/* Reject Modal */}
      <Modal
        title="Add Reject Reasons"
        visible={isRejectModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={() => changeStatusApi(changeStatus, changeUuid)}
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

      {/* Popup File manager */}
      <Modal
        title="File Manager"
        open={isModalFileManagerVisible}
        onCancel={() => setIsModalFileManagerVisible(false)}
        width={1250}
        footer={[
          <Button
            key="cancel"
            onClick={() => setIsModalFileManagerVisible(false)}
          >
            Close
          </Button>,
        ]}
      >
        <div>
          <PropertyListingPaperworkFileManager uuid={selectedUuid} />
        </div>
      </Modal>

      {/* Property Preview */}
      <Modal
        title="Property Preview"
        open={isModalPropertyListPreviewVisible}
        onCancel={() => setIsModalPropertyListPreviewVisible(false)}
        width={1200}
        footer={[
          <Button
            key="cancel"
            onClick={() => setIsModalPropertyListPreviewVisible(false)}
          >
            Close
          </Button>,
        ]}
      >
        <div>
          <ViewPropertyListing uuid={selectedUuid} />
        </div>
      </Modal>

      {/* Sync MLS Modal */}
      <Modal
        title="Sync MLS Numbers from IDX"
        open={isSyncModalVisible}
        onCancel={() => {
          setIsSyncModalVisible(false);
          setSelectedPairsToSync([]);
          setMatchedPairs([]);
        }}
        width={1200}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsSyncModalVisible(false);
              setSelectedPairsToSync([]);
              setMatchedPairs([]);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="selectAll"
            onClick={() => {
              setSelectedPairsToSync(
                matchedPairs.map((pair: any) => pair.pairId)
              );
            }}
          >
            Select All
          </Button>,
          <Button
            key="sync"
            type="primary"
            onClick={handleSyncMLS}
            loading={isSyncing}
            disabled={selectedPairsToSync.length === 0 || isSyncing}
          >
            Sync Selected ({selectedPairsToSync.length})
          </Button>,
        ]}
      >
        {isLoadingRealtor ? (
          <TableLoader />
        ) : matchedPairs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No matched pairs found.</p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            <Table
              rowSelection={{
                type: "checkbox",
                selectedRowKeys: selectedPairsToSync,
                onChange: (selectedKeys) => {
                  setSelectedPairsToSync(selectedKeys as string[]);
                },
              }}
              columns={[
                {
                  title: "Property Listing Address",
                  key: "propertyAddress",
                  width: 250,
                  render: (_, record: any) => (
                    <div>
                      <div className="font-semibold text-sm">
                        Property Listing:
                      </div>
                      <div className="text-xs text-gray-600">
                        {record.propertyListing.propertyAddress}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Current MLS: {record.propertyListing.currentMLS}
                      </div>
                    </div>
                  ),
                },
                {
                  title: "IDX Property",
                  key: "realtorProperty",
                  width: 250,
                  render: (_, record: any) => (
                    <div>
                      <div className="font-semibold text-sm">IDX Property:</div>
                      <div className="text-xs text-gray-600">
                        {record.realtorProperty.propertyAddress}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        MLS: {record.realtorProperty.mlsNumber}
                      </div>
                    </div>
                  ),
                },
                {
                  title: "Realtor MLS Number",
                  dataIndex: ["realtorProperty", "mlsNumber"],
                  key: "mlsNumber",
                  width: 150,
                  render: (mlsNumber: string) => (
                    <span className="font-semibold text-blue-600">
                      {mlsNumber || "N/A"}
                    </span>
                  ),
                },
                {
                  title: "List Price",
                  dataIndex: ["realtorProperty", "ListPrice"],
                  key: "listPrice",
                  width: 120,
                  render: (price: number) => (
                    <span>${price?.toLocaleString() || "N/A"}</span>
                  ),
                },
                {
                  title: "Property Type",
                  dataIndex: ["realtorProperty", "PropertyType"],
                  key: "propertyType",
                  width: 150,
                },
                {
                  title: "MLS Status",
                  dataIndex: ["realtorProperty", "MlsStatus"],
                  key: "mlsStatus",
                  width: 120,
                },
                {
                  title: "Match Score",
                  dataIndex: "similarity",
                  key: "similarity",
                  width: 100,
                  render: (similarity: number, record: any) => (
                    <span
                      className={
                        record.isExactMatch
                          ? "text-green-600 font-semibold"
                          : "text-orange-600"
                      }
                    >
                      {record.isExactMatch
                        ? "Exact"
                        : `${Math.round(similarity)}%`}
                    </span>
                  ),
                },
              ]}
              dataSource={matchedPairs}
              rowKey="pairId"
              pagination={{ pageSize: 20 }}
            />
          </div>
        )}
      </Modal>

      {/* Sync Updated Data Modal */}
      <Modal
        title="Sync Updated Data from IDX"
        open={isSyncDataModalVisible}
        onCancel={() => {
          setIsSyncDataModalVisible(false);
          setSelectedDataPairsToSync([]);
          setMatchedDataPairs([]);
        }}
        width={1200}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsSyncDataModalVisible(false);
              setSelectedDataPairsToSync([]);
              setMatchedDataPairs([]);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="selectAll"
            onClick={() => {
              // Only select properties with differences
              const pairsWithDifferences = matchedDataPairs.filter(
                (pair: any) => pair.hasDifferences
              );
              setSelectedDataPairsToSync(
                pairsWithDifferences.map((pair: any) => pair.pairId)
              );
            }}
          >
            Select All
          </Button>,
          <Button
            key="sync"
            type="primary"
            onClick={handleSyncUpdatedData}
            loading={isSyncingData}
            disabled={selectedDataPairsToSync.length === 0 || isSyncingData}
          >
            Sync Selected ({selectedDataPairsToSync.length})
          </Button>,
        ]}
      >
        {isLoadingRealtor ? (
          <TableLoader />
        ) : matchedDataPairs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">
              No properties with differences found.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              All matched properties are already in sync.
            </p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <strong>
                  Showing {matchedDataPairs.length} property listing(s) with
                  differences.
                </strong>{" "}
                Only properties that have mismatched data are displayed.
              </p>
            </div>
            <Table
              rowSelection={{
                type: "checkbox",
                selectedRowKeys: selectedDataPairsToSync,
                onChange: (selectedKeys) => {
                  setSelectedDataPairsToSync(selectedKeys as string[]);
                },
              }}
              columns={[
                {
                  title: "Property Listing",
                  key: "propertyListing",
                  width: 250,
                  render: (_, record: any) => (
                    <div>
                      <div className="font-semibold text-sm">
                        Property Listing:
                      </div>
                      <div className="text-xs text-gray-600">
                        {record.propertyListing.propertyAddress}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        MLS: {record.propertyListing.mlsNumber}
                      </div>
                    </div>
                  ),
                },
                {
                  title: "IDX Property",
                  key: "realtorProperty",
                  width: 250,
                  render: (_, record: any) => (
                    <div>
                      <div className="font-semibold text-sm">IDX Property:</div>
                      <div className="text-xs text-gray-600">
                        {record.realtorProperty.propertyAddress}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        MLS: {record.realtorProperty.mlsNumber}
                      </div>
                    </div>
                  ),
                },
                {
                  title: "List Price",
                  dataIndex: ["realtorProperty", "ListPrice"],
                  key: "listPrice",
                  width: 120,
                  render: (price: number) => (
                    <span>${price?.toLocaleString() || "N/A"}</span>
                  ),
                },
                {
                  title: "Property Type",
                  dataIndex: ["realtorProperty", "PropertyType"],
                  key: "propertyType",
                  width: 150,
                },
                {
                  title: "MLS Status",
                  dataIndex: ["realtorProperty", "MlsStatus"],
                  key: "mlsStatus",
                  width: 120,
                },
                {
                  title: "Differences",
                  key: "differences",
                  width: 120,
                  render: (_, record: any) => (
                    <div className="flex flex-col gap-1">
                      {record.hasDifferences ? (
                        <>
                          <span className="text-orange-600 font-semibold text-xs">
                            {record.differencesCount} difference(s)
                          </span>
                          <Button
                            type="link"
                            size="small"
                            onClick={() => handleViewDifferenceLog(record)}
                            className="p-0 h-auto text-blue-600"
                          >
                            View Log
                          </Button>
                        </>
                      ) : (
                        <span className="text-green-600 font-semibold text-xs">
                          No differences
                        </span>
                      )}
                    </div>
                  ),
                },
              ]}
              dataSource={matchedDataPairs}
              rowKey="pairId"
              pagination={{ pageSize: 20 }}
            />
          </div>
        )}
      </Modal>

      {/* Difference Log Modal */}
      <Modal
        title={`Data Differences Log - ${
          selectedPairForLog?.propertyListing?.propertyAddress || "Property"
        }`}
        open={isDifferenceLogModalVisible}
        onCancel={() => {
          setIsDifferenceLogModalVisible(false);
          setSelectedPairForLog(null);
          setDifferenceLog([]);
        }}
        width={900}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsDifferenceLogModalVisible(false);
              setSelectedPairForLog(null);
              setDifferenceLog([]);
            }}
          >
            Close
          </Button>,
        ]}
      >
        {differenceLog.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-green-600 font-semibold">
              No differences found. All data matches!
            </p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                <strong>{differenceLog.length}</strong> field(s) have different
                values between Property Listing and IDX Property.
              </p>
            </div>
            <Table
              columns={[
                {
                  title: "Field",
                  dataIndex: "field",
                  key: "field",
                  width: 200,
                  render: (field: string) => (
                    <span className="font-semibold text-gray-700">{field}</span>
                  ),
                },
                {
                  title: "Current Value (Property Listing)",
                  dataIndex: "propertyValue",
                  key: "propertyValue",
                  width: 250,
                  render: (value: string) => (
                    <span className="text-red-600 bg-red-50 px-2 py-1 rounded">
                      {value}
                    </span>
                  ),
                },
                {
                  title: "New Value (IDX Property)",
                  dataIndex: "realtorValue",
                  key: "realtorValue",
                  width: 250,
                  render: (value: string) => (
                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded">
                      {value}
                    </span>
                  ),
                },
              ]}
              dataSource={differenceLog}
              rowKey="field"
              pagination={false}
              size="small"
            />
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> When you sync, the Property Listing will
                be updated with the IDX Property values shown above.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PropertyListingManagement;
