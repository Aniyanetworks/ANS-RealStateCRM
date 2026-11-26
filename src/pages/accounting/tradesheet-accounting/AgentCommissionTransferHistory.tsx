// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useEffect, useState } from "react";
import type { TableColumnsType, TableProps } from "antd";

import { BsThreeDotsVertical } from "react-icons/bs";
import { Table, Modal, Button, Input, Dropdown, Space } from "antd"; // Import Modal here
import {
  FaChevronDown,
  FaEye,
  FaRegEdit,
  FaFileAlt,
  FaFileUpload,
  FaComment,
} from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import {
  useChangeTradeSheetStatusMutation,
  useGetTradeSheetListDataQuery,
  useArchiveSpecificTradeSheetMutation,
  useArchiveMultipleTradeSheetsMutation,
  useChangeTradeAdminStatusMutation,
} from "../../../redux/api/agent/trade-sheet/tradeSheetSlice";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import TableLoader from "../../../components/loader/TableLoader";
import { formatDate, parseISO } from "date-fns";
import { useAppSelector } from "../../../redux/hooks";
import { AiFillWarning } from "react-icons/ai";
import { FaShare } from "react-icons/fa6";
import { usePermissions } from "../../../utils/permissionUtils";
import { useAcknowledgementListQuery, useAgentCommissionTransferHistoryListQuery } from "../../../redux/api/accounting/tradeAccountingSlice";
import { formatNumberWithCommasAndDecimals } from "../../../utils/formatNumberWithCommasAndDecimals";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface DataType {
  key?: React.Key;
  name: any;
  email: any;
  status: any;
  role: any;
  representation: any;
  createdAt: any;
  uuid: string; // Ensure uuid is included in DataType
}

type OnChange = NonNullable<TableProps<DataType>["onChange"]>;
type Filters = Parameters<OnChange>[1];

type GetSingle<T> = T extends (infer U)[] ? U : never;
type Sorts = GetSingle<Parameters<OnChange>[2]>;

const AgentCommissionTransferHistory = () => {
  const { user } = useAppSelector((state) => state.user);
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [allData, setAllData] = useState<DataType[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);
  const { data, isLoading, refetch } = useAgentCommissionTransferHistoryListQuery("");
  const [archiveSpecificTradeSheet] = useArchiveSpecificTradeSheetMutation();

  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [isRejectReasonViewModalVisible, setIsRejectReasonViewModalVisible] =
    useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [changeStatus, setChangeStatus] = useState("");
  const [changeUuid, setChangeUuid] = useState<string | null>(null);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [archiveMultipleTradeSheets] = useArchiveMultipleTradeSheetsMutation();

  // filter
  const [filteredInfo, setFilteredInfo] = useState<Filters>({});
  const [sortedInfo, setSortedInfo] = useState<Sorts>({});

  const { hasPermissionForSlug } = usePermissions();

  const statusOptions = [
    {
      label: "Pending",
      value: "pending",
    },
    {
      label: "Completed",
      value: "completed",
    }
  ];

  useEffect(() => {
    // refetch()
    // user?.userType
    setTableData(data?.data?.tradeAgentCommission);
    setAllData(data?.data)
  }, [data, tableData]);

  //Change Item Status
  const [changeTradeAdminStatus] = useChangeTradeAdminStatusMutation();
  const handleChangeStatus = async (newStatus: string, uuid: string) => {
    setChangeStatus(newStatus);
    setChangeUuid(uuid);

    if (newStatus == "rejected") {
      setIsRejectModalVisible(true);
    } else {
      changeStatusApi(newStatus, uuid);
    }
  };

  const changeStatusApi = async (newStatus: string, uuid: string) => {
    let requestData = {
      status: changeStatus || newStatus,
      rejectReason: rejectReason,
    };
    try {
      const response = await changeTradeAdminStatus({
        data: requestData,
        uuid: changeUuid || uuid,
      }).unwrap();
      toast.success(`${response?.message}`);

      cancelDelete();
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  // const handleRejectReasonChange = (e) => {
  //   setRejectReason(e.target.value);
  // };

  const handleRejectReasonView = (reason) => {
    setRejectReason(reason);
    setIsRejectReasonViewModalVisible(true);
  };

  const handleDelete = (uuid: string) => {
    setDeleteUuid(uuid);
    setIsModalVisible(true);
  };

  const handleChange: OnChange = (pagination, filters, sorter) => {
    console.log(pagination);
    setFilteredInfo(filters);
    setSortedInfo(sorter as Sorts);
  };

  // const clearFilters = () => {
  //   setFilteredInfo({});
  // };

  const confirmDelete = async () => {
    try {
      const response = await archiveSpecificTradeSheet(deleteUuid).unwrap();
      toast.success(`${response?.message}`);
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
    setIsModalVisible(false);
    setDeleteUuid(null);
  };

  const cancelDelete = () => {
    setIsModalVisible(false);
    setDeleteUuid(null); // Reset deleteUuid

    setIsRejectModalVisible(false);
    setIsRejectReasonViewModalVisible(false);
    setRejectReason("");
    setChangeStatus("");
    setChangeUuid(null);
    setIsDeleteModalMultipleVisible(false);
  };

  if (isLoading) {
    <TableLoader />;
  }
  const [searchText, setSearchText] = useState("");

  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true); // Show delete confirmation modal
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await archiveMultipleTradeSheets(selectedRowKeys);
        setIsDeleteModalMultipleVisible(false);
        // Ensure the refetch waits for the data to be refreshed
        await refetch();
        if (response.data.status == true) {
          setSelectedRowKeys([]);
          toast.success(`${response?.message}`);
        } else {
          toast.error("Failed to delete announcement. Please try again.");
        }
      } catch (error) {
        setIsDeleteModalMultipleVisible(false);
        toast.error("Failed to delete announcement. Please try again.");
      }
    } else {
      toast.error("Please Select Items.");
    }
  };

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();
    // if (!searchTerm) return true;
    const inProperties = record.properties?.some((property) =>
      Object.values(property).some((value) =>
        String(value).toLowerCase().includes(searchTerm)
      )
    );
    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return inProperties || inRecord;
  });

  const columns: TableColumnsType<DataType> = [
    {
      title: "Trade Record",
      dataIndex: "tradeSheetTypeId",
      key: "tradeSheetTypeId",
    
      render: (tradeSheetTypeId, record) => {
        return (
          <span
          >
              {record?.tradeSheet?.tradeSheetTypeId || "N/A"}
          </span>
        );
      },
      fixed: "left",
      width: 130,
    
      sorter: (a, b) => a.record?.tradeSheet?.tradeSheetTypeId.localeCompare(b.record?.tradeSheet?.tradeSheetTypeId),
      sortOrder: sortedInfo.columnKey === "tradeSheetTypeId" ? sortedInfo.order : null,
      ellipsis: true,
    },
    
    {
      title: "Property Address",
      dataIndex: "tradeSheetTypeId", // Keep dataIndex as is, unless you want to map it differently
      key: "tradeSheetTypeId", // Keep key as is
      render: (text, record) => {
        // Check condition and return the correct value
        return  record?.tradeSheet?.properties[0]?.propertyAddress || "N/A";
      },
    },

    {
        title: "Gross Commission",
        dataIndex: "tradeSheetTypeId", // Keep dataIndex as is, unless you want to map it differently
        key: "tradeSheetTypeId", // Keep key as is
        render: (text, record) => {
          // Check condition and return the correct value
          return "$ " + formatNumberWithCommasAndDecimals(record?.agentCommissionTotal) || "N/A";
        },
      },

      {
        title: "Net Commission",
        dataIndex: "tradeSheetTypeId", // Keep dataIndex as is, unless you want to map it differently
        key: "tradeSheetTypeId", // Keep key as is
        render: (text, record) => {
          // Check condition and return the correct value
          return  "$ " + formatNumberWithCommasAndDecimals(record?.commissionTotalAfterDeduction) || "N/A";
        },
      },

      {
        title: "Deduction",
        dataIndex: "tradeSheetTypeId", // Keep dataIndex as is, unless you want to map it differently
        key: "tradeSheetTypeId", // Keep key as is
        render: (text, record) => {
          // Check condition and return the correct value
          return  "$ " + formatNumberWithCommasAndDecimals(record?.totalDeduction) || "N/A";
        },
      },
    // ...(user.userType !== "agent"
    //   ? [
    //       {
    //         title: "Agent Name",
    //         dataIndex: "name",
    //         key: "name",

    //         sorter: (a, b) => a.name.localeCompare(b.name),
    //         sortOrder:
    //           sortedInfo.columnKey === "name" ? sortedInfo.order : null,
    //         ellipsis: true,
    //       },
    //     ]
    //   : []),
    // // { title: "Email", dataIndex: "email", key: "email" },
    // {
    //   title: "Shared Agent",
    //   dataIndex: "name", // Keep dataIndex as is, unless you want to map it differently
    //   key: "name", // Keep key as is
    //   render: (text, record) => {
    //     const multipleUserArray = record?.sharedUsers;
    //     return multipleUserArray?.map((rep: string, index: number) => (
    //       <span key={index}>
    //         {rep["name"]}
    //         {index < multipleUserArray.length - 1 ? ", " : ""}
    //       </span>
    //     ));
    //   },
    // },
    // {
    //   title: "Representation",
    //   dataIndex: "representation",
    //   key: "representation",
    //   render: (representation: any, record: any) => {
    //     if (record.representationType === "single") {
    //       return (
    //         <BorderBadge
    //           value={representation}
    //           colorMap={(value: string) => ({
    //             borderColor: value === "yes" ? "#34C759" : "#FF0000",
    //           })}
    //         />
    //       );
    //     } else {
    //       const multipleRepresentationArray =
    //         record.multipleRepresentation?.split(",");
    //       return multipleRepresentationArray?.map(
    //         (rep: string, index: number) => (
    //           <BorderBadge
    //             key={index}
    //             value={rep}
    //             colorMap={(value: string) => ({
    //               borderColor: value === "yes" ? "#34C759" : "#FF0000",
    //             })}
    //           />
    //         )
    //       );
    //     }
    //   },

    //   width: 150,
    //   filters: [
    //     { text: "Seller", value: "seller" },
    //     { text: "Buyer", value: "buyer" },
    //     { text: "Tenant", value: "tenant" },
    //   ],
    //   filteredValue: filteredInfo?.representation
    //     ? filteredInfo?.representation
    //     : filteredInfo?.multipleRepresentation || null,
    //   onFilter: (value, record) =>
    //     record?.representation
    //       ? record?.representation.includes(value as string)
    //       : record?.multipleRepresentation?.includes(value as string),

    //   ellipsis: true,
    // },
    {
      title: "Transfer Status",
      dataIndex: "status",
      key: `status`,
      render: (status, record) => {
        const labelMap: Record<string, string> = {
          approved: "Approved", underReview: "Under Review",
          draft: "Draft", rejected: "Rejected", closed: "Closed",
        };
        const label = labelMap[status] ?? status ?? "—";
        const badgeStyle: React.CSSProperties = {
          display: "inline-flex", alignItems: "center", justifyContent: "space-between",
          gap: 6, minWidth: 108, padding: "2px 8px", borderRadius: 4,
          border: "1px solid #e8e8e8", color: "#595959", fontSize: 11,
          lineHeight: 1.5, whiteSpace: "nowrap",
        };
        if (user.userType === "agent") return <span style={badgeStyle}>{label}</span>;
        return (
          <Dropdown trigger={["click"]} menu={{ items: statusOptions.map((opt) => ({
            key: opt.value,
            label: <span style={{ fontSize: 11, color: "#595959" }}>{opt.label}</span>,
            onClick: () => handleChangeStatus(opt.value, record.uuid),
          })) }}>
            <span style={{ ...badgeStyle, cursor: "pointer", userSelect: "none" }}>
              <span>{label}</span>
              <FaChevronDown style={{ fontSize: 8, opacity: 0.45, flexShrink: 0 }} />
            </span>
          </Dropdown>
        );
      },

      width: 180,
      filters: [
        { text: "Approved", value: "approved" },
        { text: "Draft", value: "draft" },
        {
          text: "Under Review",
          value: "underReview",
        },
        { text: "Rejected", value: "rejected" },
        { text: "Closed", value: "closed" },
      ],
      filteredValue: filteredInfo.status || null,
      onFilter: (value, record) => record.status.includes(value as string),
      sorter: (a, b) => a.status.length - b.status.length,
      sortOrder: sortedInfo.columnKey === "status" ? sortedInfo.order : null,
      ellipsis: true,
    },
    {
      title: "Submitted at",
      dataIndex: "createdAt",
      key: `createdAt`,
      render: (createdAt) => {
        if (!createdAt) {
          return "No date";
        }
        const date = parseISO(createdAt);
        return formatDate(date, "dd MMMM yyyy, hh:mm a");
      },
      width: 230,
    },
    // {
    //   title: "Actions",
    //   dataIndex: "uuid",
    //   key: "actions",
    //   render: (uuid, record) => (
    //     <>
    //       <Dropdown
    //         menu={{
    //           items: [
    //             // view tradesher
    //             {
    //               key: "view",
    //               label: (
    //                 <Link
    //                   className="flex items-center gap-2"
    //                   to={`/dashboard/accounting/agent-cheque-acknowledgement/${uuid}/${record?.agentAccountId}`}
    //                 >
    //                   <FaEye /> View
    //                 </Link>
    //               ),
    //             },
    //             // ((user.userType === "agent" &&
    //             //   (record.status === "draft" ||
    //             //     record.status === "rejected")) ||
    //             //   user.userType === "superAdmin" ||
    //             //   user.userType === "admin") &&
    //             //   hasPermissionForSlug("edit-tradesheet") && {
    //             //     key: "edit",
    //             //     label: (
    //             //       <Link
    //             //         className="flex items-center gap-2"
    //             //         to={`/dashboard/agent/pages/form/trade-sheet/agent-basic-info/${uuid}`}
    //             //       >
    //             //         <FaRegEdit /> Edit
    //             //       </Link>
    //             //     ),
    //             //   },
    //             // //view rejecction cause
    //             // record.status === "rejected" && {
    //             //   key: "Rejected",
    //             //   label: (
    //             //     <button
    //             //       onClick={() =>
    //             //         handleRejectReasonView(record?.rejectReason)
    //             //       }
    //             //       className="text-[16px] flex gap-2 items-center hover:text-primaryPurple duration-100 "
    //             //     >
    //             //       <FaComment className="text-red-500" /> Rejected
    //             //     </button>
    //             //   ),
    //             // },

    //             // // view tradesher
    //             // {
    //             //   key: "view",
    //             //   label: (
    //             //     <Link
    //             //       className="flex items-center gap-2"
    //             //       to={`/dashboard/agent/pages/form/trade-sheet/preview-page/${uuid}`}
    //             //     >
    //             //       <FaEye /> View
    //             //     </Link>
    //             //   ),
    //             // },

    //             // //file manager for single representation

    //             // record.representationType === "single" && {
    //             //   key: "fileManager",
    //             //   label: (
    //             //     <Link
    //             //       to={`/dashboard/agent/pages/form/trade-sheet/paperwork-file-manager/${uuid}`}
    //             //       className=" flex items-center gap-2" // Added margin left for spacing
    //             //     >
    //             //       <FaFileAlt /> File Manager
    //             //     </Link>
    //             //   ),
    //             // },

    //             // // file manager `for multiple representation
    //             // record.representationType === "multiple" && {
    //             //   key: "fileManager-multiple",
    //             //   label: (
    //             //     <Link
    //             //       to={`/dashboard/agent/pages/form/trade-sheet/paperwork-file-manager-multiple-representation/${uuid}`}
    //             //       className=" flex items-center gap-2" // Added margin left for spacing
    //             //     >
    //             //       <FaFileAlt /> File Manager
    //             //     </Link>
    //             //   ),
    //             // },
    //             // //additional document
    //             // record.status === "approved" &&
    //             //   record.representationType == "single" && {
    //             //     key: "additionalDocument",
    //             //     label: (
    //             //       <Link
    //             //         title="Additional Document"
    //             //         to={`/dashboard/agent/pages/form/trade-sheet/additional-document/${uuid}`}
    //             //         className=" flex items-center gap-2"
    //             //       >
    //             //         <FaFileUpload /> Additional Document
    //             //       </Link>
    //             //     ),
    //             //   },
    //             // {
    //             //   key: "share",
    //             //   label: (
    //             //     <Link
    //             //       to={`/dashboard/super-admin/share-trade-sheet-document/${uuid}`}
    //             //       className=" flex items-center gap-2"
    //             //     >
    //             //       <FaShare /> Share Document
    //             //     </Link>
    //             //   ),
    //             // },

    //             // //delete tradesheet
    //             // ((user.userType === "agent" && record.status === "draft") ||
    //             //   user.userType === "superAdmin" ||
    //             //   user.userType === "admin") &&
    //             //   hasPermissionForSlug("delete-tradesheet") && {
    //             //     key: "delete",
    //             //     label: (
    //             //       <button
    //             //         onClick={() => handleDelete(uuid)}
    //             //         className=" flex items-center gap-2"
    //             //       >
    //             //         <MdDelete /> Delete
    //             //       </button>
    //             //     ),
    //             //   },
    //           ],
    //         }}
    //       >
    //         <a onClick={(e) => e.preventDefault()}>
    //           <Space>
    //             <BsThreeDotsVertical />
    //           </Space>
    //         </a>
    //       </Dropdown>
    //     </>
    //   ),
    //   fixed: "right",
    //   width: 20,
    //   align: "center",
    // },
  ];

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

  //add index for serial number
  const tableSourceData = filteredData?.map((item: any, index: number) => {
    return {
      ...item,
      serial: index + 1,
    };
  });

  console.log(tableSourceData);

  return (
    <div className="pb-32">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 my-3">
        {/* Total Trades */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-sky-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Gross Commission</span>
            <span className="text-lg font-semibold text-sky-600">$ {formatNumberWithCommasAndDecimals(allData?.tradeAgentGrossCommission)}</span>
          </div>
        </div>

        {/* Base Office Commission */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Pending Net Commission</span>
            <span className="text-lg font-semibold text-green-600">$ {formatNumberWithCommasAndDecimals(allData?.tradeAgentCommissionTransferPending)}</span>
          </div>
        </div>

        {/* Net Commission */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Net Commission</span>
            <span className="text-lg font-semibold text-blue-600">$ {formatNumberWithCommasAndDecimals(allData?.tradeAgentCommissionTransferComplete)}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Deduction</span>
            <span className="text-lg font-semibold text-red-600">$ {formatNumberWithCommasAndDecimals(allData?.tradeAgentCommissionDeduction)}</span>
          </div>
        </div>
        {/* Commission to Agent */}
        {/* <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Total Completed Tradesheet Commission</span>
            <span className="text-lg font-semibold text-yellow-600">${formatNumberWithCommasAndDecimals(commissionToAgent())}</span>
          </div>
        </div> */}
      </div>
      <div className="flex flex-col xl:flex-row items-center justify-between gap-5 xl:gap-2  mb-5 p-1">
        <h1>Agent Commission Transfer History</h1>
        <div className="w-full lg:w-1/3">
          <input
            type="text"
            placeholder="Search from table..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="global-search w-full "
          />
        </div>

        <div className="flex   justify-between items-center">
          {/* <div className="flex items-center">
            {hasPermissionForSlug("create-tradesheet") && (
              <Link
                to="/dashboard/agent/pages/form/trade-sheet/agent-basic-info"
                className="primary-btn mx-3"
              >
                Create
              </Link>
            )}
            {hasPermissionForSlug("delete-tradesheet") && (
              <button
                onClick={handleDeleteMultipleClick}
                className="cancel-btn mx-3"
              >
                Delete Selected
              </button>
            )}
            {user.userType === "superAdmin" &&
              hasPermissionForSlug("delete-tradesheet") && (
                <Link
                  to="/dashboard/agent/pages/form/trade-sheet/my-submission-archive-trade-list"
                  className="primary-btn mx-3"
                >
                  Archive
                </Link>
              )}
          </div> */}
        </div>
      </div>

      <div className="  ">
        {isLoading ? (
          <TableLoader />
        ) : (
          <Table
            scroll={{ x: "max-content" }}
            rowSelection={rowSelection}
            columns={columns}
            dataSource={tableSourceData}
            pagination={{ pageSize: 20 }}
            rowKey="uuid"
            onChange={handleChange}
          />
        )}
      </div>
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
        <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-md">
          <div className="flex items-center">
            <AiFillWarning className="text-2xl mr-2" /> {/* Warning icon */}
            <p className="font-semibold text-sm">
              Are you sure you want to delete this item?
            </p>
          </div>
          <p className="mt-2 text-sm">
            <span className="font-semibold">Warning:</span> If you delete this
            Item, it will be archived, and all previously uploaded files in this
            section will also be archived. Please make sure to backup the
            uploaded tradesheet file in this before proceeding.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Deleting this document will archive it and cannot be undone. Proceed
            with caution.
          </p>
          <p className="mt-2 text-sm text-blue-500">
            If you wish to restore this document, please contact the
            administrator.
          </p>
        </div>
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
              backgroundColor: "#072f2d", // Custom background color
              borderColor: "#072f2d", // Custom border color
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
        <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-md">
          <div className="flex items-center">
            <AiFillWarning className="text-2xl mr-2" /> {/* Warning icon */}
            <p className="font-semibold text-sm">
              Are you sure you want to delete this item?
            </p>
          </div>
          <p className="mt-2 text-sm">
            <span className="font-semibold">Warning:</span> If you delete this
            Item, it will be archived, and all previously uploaded files in this
            section will also be archived. Please make sure to backup the
            uploaded tradesheet file in this before proceeding.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Deleting this document will archive it and cannot be undone. Proceed
            with caution.
          </p>
          <p className="mt-2 text-sm text-blue-500">
            If you wish to restore this document, please contact the
            administrator.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default AgentCommissionTransferHistory;
