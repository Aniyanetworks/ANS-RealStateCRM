/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck

import { useEffect, useState } from "react";
import type { TableProps } from "antd";
import ModalMain from "../../../../../components/ui/Modal";
import { useForm } from "react-hook-form";
import { Table, Modal, Button, Input } from "antd";
import { FaSearch, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import TableLoader from "../../../../../components/loader/TableLoader";
import {
  useChangePropertyListingStatusMutation,
  useCreateUpdatePropertyListingMutation,
  useDeletePropertyListingMutation,
  useDeletePropertyListingMultipleMutation,
  useGetPropertyListingQuery,
} from "../../../../../redux/api/superadmin/propertyListingDataSlice";
import { useAppSelector } from "../../../../../redux/hooks";
import { Link, useParams } from "react-router-dom";
import { usePermissions } from "../../../../../utils/permissionUtils";
import PropertyListingPaperworkFileManager from "./PropertyListingPaperworkFileManager";
import ViewPropertyListing from "./ViewPropertyListing";
import { useGetRealtorPropertiesQuery } from "../../../../../redux/api/realtor/realtorPropertySlice";
import { SyncOutlined } from "@ant-design/icons";
import { tabs } from "./utils/propertyListingConstants";
import { getPropertyListingColumns } from "./components/PropertyListingTableColumns";
import { SyncMLSModal } from "./components/SyncMLSModal";
import { SyncDataModal } from "./components/SyncDataModal";
import { DifferenceLogModal } from "./components/DifferenceLogModal";
import { usePropertyListingSync } from "./hooks/usePropertyListingSync";
import { usePropertyMatching } from "./hooks/usePropertyMatching";
import { comparePropertyData } from "./utils/propertyComparisonUtils";

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

const PropertyListingManagement = () => {
  const { filter } = useParams("filter");
  const { hasPermissionForSlug } = usePermissions();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const { user } = useAppSelector((state) => state.user);

  const { data, isLoading, refetch } = useGetPropertyListingQuery(
    {
      userId: user?.id || "",
      listingType: "regular",
    },
    {
      skip: !user?.id,
    }
  );

  // Modal states
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
  const [searchText, setSearchText] = useState("");
  const [listingFilter, setListingFilter] = useState<
    "current" | "previous" | "all"
  >("current");

  // Sync states
  const [isSyncModalVisible, setIsSyncModalVisible] = useState(false);
  const [matchedPairs, setMatchedPairs] = useState<any[]>([]);
  const [selectedPairsToSync, setSelectedPairsToSync] = useState<string[]>([]);
  const [isSyncDataModalVisible, setIsSyncDataModalVisible] = useState(false);
  const [matchedDataPairs, setMatchedDataPairs] = useState<any[]>([]);
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

  // Mutations
  const [createUpdatePropertyListing] =
    useCreateUpdatePropertyListingMutation();
  const [changePropertyListingStatus] =
    useChangePropertyListingStatusMutation();
  const [deletePropertyListing] = useDeletePropertyListingMutation();
  const [deleteMultiplePropertyListing] =
    useDeletePropertyListingMultipleMutation();

  // Custom hooks
  const { handleSyncMLS, handleSyncUpdatedData, isSyncing, isSyncingData } =
    usePropertyListingSync(refetch);
  const { findAndMatchProperties, findAndMatchPropertiesForDataSync } =
    usePropertyMatching(realtorData, tableData);

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

  useEffect(() => {
    if (data?.data?.propertyListingData) {
      setTableData(data.data.propertyListingData);
    }
    setSearchText(localStorage.getItem("searchTextPropertyList") || "");
  }, [data, searchText]);

  const {
    register,
    formState: { errors },
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
          const newSelectedRowKeys = changeableRowKeys.filter(
            (_, index) => index % 2 === 0
          );
          setSelectedRowKeys(newSelectedRowKeys);
        },
      },
      {
        key: "even",
        text: "Select Even Row",
        onSelect: (changeableRowKeys) => {
          const newSelectedRowKeys = changeableRowKeys.filter(
            (_, index) => index % 2 !== 0
          );
          setSelectedRowKeys(newSelectedRowKeys);
        },
      },
    ],
  };

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
    const formData = getValues();

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
        data: formData,
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

    if (newStatus === "rejected") {
      setIsRejectModalVisible(true);
    } else {
      changeStatusApi(newStatus, uuid);
    }
  };

  const changeStatusApi = async (newStatus: string, uuid: string) => {
    const requestData = {
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

  const handleRejectReasonView = (reason: any) => {
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
        if (response.data.status === true) {
          setSelectedRowKeys([]);
          toast.success("Deleted successfully!");
        } else {
          toast.error("Failed to delete. Please try again.");
        }
      } catch {
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

  const handleChange: TableProps<DataType>["onChange"] = (pagination) => {
    const page = pagination?.current || 1;
    localStorage.setItem("listingCurentPage", String(page));
    setCurrentPage(page);
  };

  const columns = getPropertyListingColumns({
    user,
    hasPermissionForSlug,
    setIsModalPropertyListPreviewVisible,
    setSelectedUuid,
    setSelectedListingId,
    handleChangeStatus,
    handleDelete,
    handleRejectReasonView,
    setIsModalFileManagerVisible,
  });

  const getFilteredData = () => {
    if (!filteredData) return [];

    switch (listingFilter) {
      case "current":
        return filteredData.filter(
          (item) =>
            item.listingStatus === "New" ||    
            item.listingStatus === "Price Change" ||      
            item.listingStatus === "listed" ||
            item.listingStatus === "Extended" ||
            item.listingStatus == "DFT" ||
            item.listingStatus == "Exclusive"
        );
      case "previous":
        return filteredData.filter(
          (item) =>
            item.listingStatus == "Sold" ||
            item.listingStatus == "Terminated" ||
            item.listingStatus == "Suspended" ||
            item.listingStatus == "Expired" 
        );
      case "all":
      default:
        return filteredData;
    }
  };

  console.log(getFilteredData());

  const filterProps = filter
    ? getFilteredData().filter((item) => item.listingStatus === filter)
    : getFilteredData();

  const tableSourceData = filterProps?.map((item: any, index: number) => ({
    ...item,
    serial: index + 1,
  }));

  // Sync handlers
  const handleFindAndMatchProperties = () => {
    const result = findAndMatchProperties();
    const { pairs, propertiesWithoutMLSCount } = result;

    if (pairs.length === 0) {
      if (propertiesWithoutMLSCount > 0 && realtorData?.data) {
        toast(
          `No matching Realtor properties found. Found ${propertiesWithoutMLSCount} properties without MLS and ${realtorData.data.length} Realtor properties. Check console for details.`
        );
      }
      return;
    }

    setMatchedPairs(pairs);
    setIsSyncModalVisible(true);
    toast.success(`Found ${pairs.length} matched pair(s)`);
  };

  const handleFindAndMatchPropertiesForDataSync = () => {
    const result = findAndMatchPropertiesForDataSync();
    const { pairs, propertiesWithMLSCount } = result;

    if (pairs.length === 0) {
      if (propertiesWithMLSCount > 0 && realtorData?.data) {
        toast(
          `No matching Realtor properties found. Found ${propertiesWithMLSCount} properties with MLS numbers and ${realtorData.data.length} Realtor properties. Check console for details.`
        );
      }
      return;
    }

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

  const handleViewDifferenceLog = (pair: any) => {
    const differences = comparePropertyData(
      pair.propertyListing,
      pair.realtorProperty.fullRealtorData,
      tableData
    );
    setDifferenceLog(differences);
    setSelectedPairForLog(pair);
    setIsDifferenceLogModalVisible(true);
  };

  const handleSyncMLSComplete = () => {
    setIsSyncModalVisible(false);
    setSelectedPairsToSync([]);
    setMatchedPairs([]);
  };

  const handleSyncDataComplete = () => {
    setIsSyncDataModalVisible(false);
    setSelectedDataPairsToSync([]);
    setMatchedDataPairs([]);
  };

  const handleSyncMLSClick = () => {
    if (isLoadingRealtor) {
      toast.error("Please wait while realtor properties are being loaded...");
      return;
    }
    handleFindAndMatchProperties();
  };

  const handleSyncPropertyDataClick = () => {
    if (isLoadingRealtor) {
      toast.error("Please wait while realtor properties are being loaded...");
      return;
    }
    handleFindAndMatchPropertiesForDataSync();
  };

  const currentCount = filteredData?.filter(
    (item) => ["New","Price Change","listed","Extended","DFT","Exclusive"].includes(item.listingStatus)
  ).length ?? 0;
  const previousCount = filteredData?.filter(
    (item) => ["Sold","Terminated","Suspended","Expired"].includes(item.listingStatus)
  ).length ?? 0;
  const allCount = filteredData?.length ?? 0;

  const tabList = [
    { key: "current", label: "Current Listings", count: currentCount },
    { key: "previous", label: "Previous Listings", count: previousCount },
    { key: "all", label: "All Listings", count: allCount },
  ];

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">

          {/* Title */}
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">
            Property Listing
            <span className="ml-1 text-gray-400 font-normal text-[11px]">({allCount})</span>
          </h1>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

          {/* Tabs */}
          <div className="flex items-center gap-1">
            {tabList.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setListingFilter(tab.key as "current" | "previous" | "all")}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                  listingFilter === tab.key
                    ? "bg-[#9F8667] text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                  listingFilter === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <div className="relative flex-shrink-0" style={{ width: 170 }}>
            <FaSearch
              className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              style={{ fontSize: 10, left: 8 }}
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                localStorage.setItem("searchTextPropertyList", e.target.value);
              }}
              style={{ paddingLeft: 26, paddingRight: searchText ? 22 : 8, paddingTop: 4, paddingBottom: 4, width: "100%" }}
            />
            {searchText && (
              <button
                type="button"
                onClick={() => { setSearchText(""); localStorage.removeItem("searchTextPropertyList"); }}
                className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                style={{ right: 6 }}
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasPermissionForSlug("create-property-listing") && (
              <>
                <Link to="/dashboard/super-admin/create-update-property-listing" className="primary-btn">
                  Add New
                </Link>
                <button onClick={handleSyncMLSClick} className="primary-btn flex items-center gap-1" disabled={isLoadingRealtor}>
                  <SyncOutlined /> Sync MLS
                </button>
                <button onClick={handleSyncPropertyDataClick} className="primary-btn flex items-center gap-1" disabled={isLoadingRealtor}>
                  <SyncOutlined /> Sync Property Data
                </button>
              </>
            )}
            {hasPermissionForSlug("delete-property-listing") && (
              <button onClick={handleDeleteMultipleClick} className="cancel-btn">
                Delete Selected
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div>
          {isLoading ? (
            <TableLoader />
          ) : (
            <Table
              size="small"
              scroll={{ x: "max-content" }}
              rowSelection={rowSelection}
              columns={columns}
              dataSource={tableSourceData}
              rowKey="uuid"
              onChange={handleChange}
              pagination={{ pageSize: 20, current: Number(currentPage) }}
              rowClassName={(record) =>
                record.id === selectedListingId ? "bg-gray-200 border-2 border-gray-200" : ""
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
              />
              {errors.closingDate && (
                <p className="text-red-500 text-sm">
                  {errors.closingDate.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>Offer Date (If any):</label>
              <input {...register("offerDate")} type="date" />
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
        title="Add Incomplete Reasons"
        visible={isRejectModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={() => changeStatusApi(changeStatus, changeUuid || "")}
            style={{
              marginLeft: "8px",
              backgroundColor: "#0B1D3D",
              borderColor: "#0B1D3D",
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
        width={1400}
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
          <ViewPropertyListing key={selectedUuid} uuid={selectedUuid} />
        </div>
      </Modal>

      <SyncMLSModal
        isVisible={isSyncModalVisible}
        isLoading={isLoadingRealtor}
        matchedPairs={matchedPairs}
        selectedPairsToSync={selectedPairsToSync}
        onCancel={handleSyncMLSComplete}
        onSelectAll={() => {
          setSelectedPairsToSync(matchedPairs.map((pair: any) => pair.pairId));
        }}
        onSync={() =>
          handleSyncMLS(
            selectedPairsToSync,
            matchedPairs,
            handleSyncMLSComplete
          )
        }
        onSelectionChange={(selectedKeys) => {
          setSelectedPairsToSync(selectedKeys as string[]);
        }}
        isSyncing={isSyncing}
      />

      <SyncDataModal
        isVisible={isSyncDataModalVisible}
        isLoading={isLoadingRealtor}
        matchedDataPairs={matchedDataPairs}
        selectedDataPairsToSync={selectedDataPairsToSync}
        onCancel={handleSyncDataComplete}
        onSelectAll={() => {
          const pairsWithDifferences = matchedDataPairs.filter(
            (pair: any) => pair.hasDifferences
          );
          setSelectedDataPairsToSync(
            pairsWithDifferences.map((pair: any) => pair.pairId)
          );
        }}
        onSync={() =>
          handleSyncUpdatedData(
            selectedDataPairsToSync,
            matchedDataPairs,
            handleSyncDataComplete
          )
        }
        onSelectionChange={(selectedKeys) => {
          setSelectedDataPairsToSync(selectedKeys as string[]);
        }}
        isSyncing={isSyncingData}
        onViewDifferenceLog={handleViewDifferenceLog}
      />

      <DifferenceLogModal
        isVisible={isDifferenceLogModalVisible}
        selectedPair={selectedPairForLog}
        differenceLog={differenceLog}
        onClose={() => {
          setIsDifferenceLogModalVisible(false);
          setSelectedPairForLog(null);
          setDifferenceLog([]);
        }}
      />
    </div>
  );
};

export default PropertyListingManagement;
