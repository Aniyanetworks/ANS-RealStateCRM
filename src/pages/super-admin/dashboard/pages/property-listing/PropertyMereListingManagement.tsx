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
import { FaChevronDown, FaComment, FaEye, FaFileAlt, FaRegEdit, FaSearch, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import toast from "react-hot-toast";
import TableLoader from "../../../../../components/loader/TableLoader";
import {
  useChangePropertyListingStatusMutation,
  useCreateUpdatePropertyListingMutation,
  useDeletePropertyListingMutation,
  useDeletePropertyListingMultipleMutation,
  useGetPropertyListingQuery,
  useChangeListingStatusMutation,
} from "../../../../../redux/api/superadmin/propertyListingDataSlice";
import { useAppSelector } from "../../../../../redux/hooks";
import { Link, NavLink, useParams } from "react-router-dom";
import { serialize } from "v8";
import { BsThreeDotsVertical } from "react-icons/bs";
import moment from 'moment';
import { usePermissions } from "../../../../../utils/permissionUtils";
import PropertyListingPaperworkFileManager from "./PropertyListingPaperworkFileManager";
import ViewPropertyListing from "./ViewPropertyListing";
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
  const { filter } = useParams('filter');
  const { hasPermissionForSlug } = usePermissions();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const { user } = useAppSelector((state) => state.user);
  const { data, isLoading, refetch } = useGetPropertyListingQuery({
    userId: user?.id || "",
    listingType: "mere_listing"
  }, {
    skip: !user?.id,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | "null">("null");
  const [isUploading, setIsUploading] = useState(false);
  const [isModalFileManagerVisible, setIsModalFileManagerVisible] = useState(false);
  const [isModalPropertyListPreviewVisible, setIsModalPropertyListPreviewVisible] = useState(false);
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
  const [listingFilter, setListingFilter] = useState<'current' | 'previous' | 'all'>('current');

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



  const formatDate = (isoDate: any) => {
    if (isoDate) {
      return moment.utc(isoDate).format('YYYY-MM-DD');
    } else {
      return '';
    }
  };

  useEffect(() => {
    if (data?.data?.propertyListingData) {
      setTableData(data.data.propertyListingData);
    }
    setSearchText(localStorage.getItem('searchTextPropertyList') || '')
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

  const [changeListingStatus] =
    useChangeListingStatusMutation();

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
    const formattedRecord = {
      ...record,
      contractDate: formatDate(record.contractDate),
      expiryDate: formatDate(record.expiryDate),
      offerDate: formatDate(record.offerDate),
    };

    reset(formattedRecord);
    setIsEditMode(true);
    setSelectedUUID(record.uuid);
    showModal();
  };

  const confirmDelete = async () => {
    if (!selectedUUID) return;
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
        setSelectedUUID("null");
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
    let requestData = {
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
    let requestData = {
      status: changeStatus || newStatus,
      rejectReason: rejectReason,
    };

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
    setIsDeleteModalMultipleVisible(true);
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteMultiplePropertyListing(selectedRowKeys);
        setIsDeleteModalMultipleVisible(false);
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
            textDecoration: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
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
            color: record.status === "rejected" ? "red" : "inherit",
          }}
          className={record.status === "rejected" ? "blinking" : ""}
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
      dataIndex: "name",
      key: "name",
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
            { value: "New", text: "New" },
            { value: "sold", text: "Sold" },
            { value: "leased", text: "Leased" },
            { value: "terminated", text: "Terminated" },
            { value: "suspended", text: "Suspended" },
            { value: "extended", text: "Extended" },
            { value: "expired", text: "Expired" },
            { value: "dft", text: "DFT" },
            { value: "exclusive", text: "Exclusive" }
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
            { text: "Rejected", value: "rejected" },
            { text: "Pending MLS", value: "pendingMls" },
          ],
          onFilter: (value, record) => record.status === value,
          render: (status, record) => {
            const val = record?.status ?? status;
            const statusLabelMap: Record<string, string> = {
              approved: "Approved",
              underReview: "Under Review",
              draft: "Draft",
              rejected: "Rejected",
              pendingMls: "Pending MLS",
            };
            const statusColorMap: Record<string, string> = {
              approved: "#34C759",
              underReview: "#1890ff",
              draft: "#8C8C8C",
              rejected: "#FF3B30",
              pendingMls: "#FF9500",
            };
            const color = statusColorMap[val] ?? "#8C8C8C";
            const label = statusLabelMap[val] ?? val;
            const badgeStyle: React.CSSProperties = {
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "2px 8px", borderRadius: 4,
              backgroundColor: color + "22", color, fontWeight: 600, fontSize: 11,
              userSelect: "none",
              cursor: user.userType === "agent" ? "default" : "pointer",
            };
            if (user.userType === "agent") {
              return <span style={badgeStyle}>{label}</span>;
            }
            return (
              <Dropdown
                trigger={["click"]}
                menu={{
                  items: statusOptions.map((opt) => ({
                    key: opt.value,
                    label: (
                      <span style={{ color: statusColorMap[opt.value] ?? "#8C8C8C", fontWeight: 600 }}>
                        {opt.label}
                      </span>
                    ),
                    onClick: () => handleChangeStatus(opt.value, record.uuid),
                  })),
                }}
              >
                <span style={badgeStyle}>
                  {label}
                  <FaChevronDown style={{ fontSize: 9 }} />
                </span>
              </Dropdown>
            );
          },
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
                      localStorage.setItem("listingId", recoard?.id || ""),
                        setIsModalFileManagerVisible(true);
                      setSelectedUuid(recoard.uuid);
                      setSelectedListingId(recoard?.id || "");
                    }}
                    className=" flex items-center gap-2"
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
      case 'current':
        return filteredData.filter(item => item.listingStatus === 'listed');
      case 'previous':
        return filteredData.filter(item => item.listingStatus !== 'listed');
      case 'all':
      default:
        return filteredData;
    }
  };

  const filterProps = filter ? getFilteredData().filter((item) => item.listingStatus === filter) : getFilteredData();

  const tableSourceData = filterProps?.map((item: any, index: number) => {
    return {
      ...item,
      serial: index + 1,
    };
  });
  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Mere Listings</h1>
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setListingFilter(tab.id as 'current' | 'previous' | 'all')}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                  listingFilter === tab.id ? "bg-[#0f766e] text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="relative flex-shrink-0" style={{ width: 170 }}>
            <FaSearch className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: 10, left: 8 }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); localStorage.setItem("searchTextPropertyList", e.target.value); }}
              style={{ paddingLeft: 26, paddingRight: searchText ? 22 : 8, paddingTop: 4, paddingBottom: 4, width: "100%" }}
            />
            {searchText && (
              <button type="button" onClick={() => { setSearchText(""); localStorage.removeItem("searchTextPropertyList"); }} className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" style={{ right: 6 }}>
                <FaTimes />
              </button>
            )}
          </div>
          {hasPermissionForSlug("create-property-listing") && (
            <Link to="/dashboard/super-admin/create-update-property-mere-listing" className="primary-btn">Add New</Link>
          )}
          {hasPermissionForSlug("delete-property-listing") && (
            <button onClick={handleDeleteMultipleClick} className="cancel-btn">Delete Selected</button>
          )}
        </div>

        <div>
          {isLoading ? (
            <TableLoader />
          ) : (
            <Table
              scroll={{ x: "max-content" }}
              rowSelection={rowSelection}
              columns={columns}
              dataSource={tableSourceData}
              rowKey="uuid"
              onChange={handleChange}
              pagination={{ pageSize: 20, current: currentPage }}
              rowClassName={(record) =>
                record.id == selectedListingId ? "bg-gray-200 border-2 border-gray-200" : ""
              }
            />
          )}
        </div>
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
                className={`${user.userType === "agent"
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
              backgroundColor: "#072f2d",
              borderColor: "#072f2d",
              color: "#fff",
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
          rows={4}
          placeholder="Enter reject reason here"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>

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
    </div>
  );
};

export default PropertyListingManagement;
