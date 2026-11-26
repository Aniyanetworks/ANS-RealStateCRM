// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useEffect, useState } from "react";
import type { TableColumnsType, TableProps } from "antd";

import { BsThreeDotsVertical } from "react-icons/bs";
import { Table, Modal, Button, Input, Dropdown, Space } from "antd";
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
import { useAcknowledgementListQuery } from "../../../redux/api/accounting/tradeAccountingSlice";
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
  uuid: string;
}

type OnChange = NonNullable<TableProps<DataType>["onChange"]>;
type Filters = Parameters<OnChange>[1];

type GetSingle<T> = T extends (infer U)[] ? U : never;
type Sorts = GetSingle<Parameters<OnChange>[2]>;

const AcknowledgementlList = () => {
  const { user } = useAppSelector((state) => state.user);
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);
  const { data, isLoading, refetch } = useAcknowledgementListQuery("");
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

  const [filteredInfo, setFilteredInfo] = useState<Filters>({});
  const [sortedInfo, setSortedInfo] = useState<Sorts>({});

  const { hasPermissionForSlug } = usePermissions();

  const statusOptions = [
    {
      label: "Pending",
      value: "pending",
    },
    {
      label: "Rejected",
      value: "rejected",
    },
    {
      label: "Accepted",
      value: "accepted",
    }
  ];

  useEffect(() => {
    setTableData(data?.data?.tradeAgentCommission);
  }, [data, tableData]);

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


  const handleRejectReasonView = (reason) => {
    setRejectReason(reason);
    setIsRejectReasonViewModalVisible(true);
  };

  const handleDelete = (uuid: string) => {
    setDeleteUuid(uuid);
    setIsModalVisible(true);
  };

  const handleChange: OnChange = (pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter as Sorts);
  };


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
    setDeleteUuid(null);

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
    setIsDeleteModalMultipleVisible(true);
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await archiveMultipleTradeSheets(selectedRowKeys);
        setIsDeleteModalMultipleVisible(false);
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
      dataIndex: "tradeSheetTypeId",
      key: "tradeSheetTypeId",
      render: (text, record) => {
        return  record?.tradeSheet?.properties[0]?.propertyAddress || "N/A";
      },
    },

    {
      title: "Gross Commission",
      dataIndex: "tradeSheetTypeId",
      key: "tradeSheetTypeId",
      render: (text, record) => {
        return "$ " + formatNumberWithCommasAndDecimals(record?.agentCommissionTotal) || "N/A";
      },
    },

    {
      title: "Net Commission",
      dataIndex: "tradeSheetTypeId",
      key: "tradeSheetTypeId",
      render: (text, record) => {
        return  "$ " + formatNumberWithCommasAndDecimals(record?.commissionTotalAfterDeduction) || "N/A";
      },
    },

    {
      title: "Deduction",
      dataIndex: "tradeSheetTypeId",
      key: "tradeSheetTypeId",
      render: (text, record) => {
        return  "$ " + formatNumberWithCommasAndDecimals(record?.totalDeduction) || "N/A";
      },
    },



    {
      title: "Status",
      dataIndex: "status",
      key: `status`,
      render: (status, record) => {
        const labelMap: Record<string, string> = {
          approved: "Approved", underReview: "Under Review",
          draft: "Draft", rejected: "Rejected", closed: "Closed",
        };
        const val = record?.acknowledgementStatus ?? status;
        const label = labelMap[val] ?? val ?? "—";
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
    {
      title: "Actions",
      dataIndex: "uuid",
      key: "actions",
      render: (uuid, record) => (
        <>
          <Dropdown
            menu={{
              items: [
                {
                  key: "view",
                  label: (
                    <Link
                      className="flex items-center gap-2"
                      to={`/dashboard/accounting/agent-cheque-acknowledgement/${uuid}/${record?.agentAccountId}`}
                    >
                      <FaEye /> View
                    </Link>
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
        </>
      ),
      fixed: "right",
      width: 20,
      align: "center",
    },
  ];

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

  const tableSourceData = filteredData?.map((item: any, index: number) => {
    return {
      ...item,
      serial: index + 1,
    };
  });


  return (
    <div className="pb-32">
      <div className="flex flex-col xl:flex-row items-center justify-between gap-5 xl:gap-2  mb-5 p-1">
        <h1>Acknowledgement List</h1>
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
            <AiFillWarning className="text-2xl mr-2" />
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
        <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-md">
          <div className="flex items-center">
            <AiFillWarning className="text-2xl mr-2" />
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

export default AcknowledgementlList;
