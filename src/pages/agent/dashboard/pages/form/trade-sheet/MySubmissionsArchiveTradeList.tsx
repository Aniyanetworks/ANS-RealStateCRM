// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useEffect, useState } from "react";
import type { TableColumnsType, TableProps } from "antd";
import { Table, Modal, Button, Input } from "antd";
import {
  FaEye,
  FaRegEdit,
  FaFileAlt,
  FaFileUpload,
  FaComment,
} from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import {
  useChangeTradeSheetStatusMutation,
  useDeleteSpacificTradeSheetMutation,
  useDeleteTradeSheetMultipleMutation,
  useGetTradeSheetListDataQuery,
  useArchiveSpecificTradeSheetMutation,
  useArchiveMultipleTradeSheetsMutation,
  useGetArchiveTradeSheetListDataQuery,
  useChangeTradeAdminStatusMutation,
} from "../../../../../../redux/api/agent/trade-sheet/tradeSheetSlice";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import TableLoader from "../../../../../../components/loader/TableLoader";
import { Select } from "antd";
import { formatDate, parseISO } from "date-fns";
import { useAppSelector } from "../../../../../../redux/hooks";
import BorderBadge from "../../../../../../components/Utils/BorderBadge";
import { AiFillWarning } from "react-icons/ai";

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

const MySubmissionsArchiveTradeList = () => {
  const { user } = useAppSelector((state) => state.user);
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);
  const { data, isLoading, refetch } = useGetArchiveTradeSheetListDataQuery("");
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
      label: "Incomplete",
      value: "rejected",
    },
    {
      label: "Closed",
      value: "closed",
    },
  ];

  useEffect(() => {
    setTableData(data?.data?.tradeSheetData);
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

  const handleRejectReasonChange = (e) => {
    setRejectReason(e.target.value);
  };

  const handleRejectReasonView = (reason) => {
    setRejectReason(reason);
    setIsRejectReasonViewModalVisible(true);
  };

  const handleDelete = (uuid: string) => {
    setDeleteUuid(uuid);
    setIsModalVisible(true);
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
      render: (tradeSheetTypeId, record) => (
        <span
          style={{
            color:
              record.status === "rejected"
                ? "red"
                : record.status === "underReview"
                ? "#f59e0b"
                : "inherit",
          }}
          className={
            record.status === "rejected"
              ? ""
              : record.status === "underReview"
              ? ""
              : ""
          }
        >
          {tradeSheetTypeId || "N/A"}
        </span>
      ),
      fixed: "left",
      width: 130,
    },
    {
      title: "Property Address",
      dataIndex: "tradeSheetTypeId",
      key: "tradeSheetTypeId",
      render: (text, record): any =>
        record?.properties[0]?.propertyAddress || "N/A",
    },
    ...(user.userType !== "agent"
      ? [
          {
            title: "Agent Name",
            dataIndex: "name",
            key: "name",
          },
        ]
      : []),
    {
      title: "Representation",
      dataIndex: "representation",
      key: `representation`,
      render: (representation: any) => (
        <BorderBadge
          value={representation}
          colorMap={(value: string) => ({
            borderColor: value === "yes" ? "#34C759" : "#FF0000",
          })}
        />
      ),
      sorter: (a, b): any => a.representation - b.representation,
      width: 150,
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

  return (
    <div className="pb-32">
      <div className="flex flex-col xl:flex-row items-center justify-between gap-5 xl:gap-2  mb-5 p-1">
        <h1>Archive Tradesheet List</h1>
        <div className="w-1/2">
          <input
            type="text"
            placeholder="Search from table..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="global-search "
          />
        </div>

        <div className="flex   justify-between items-center">
          <div className="flex items-center">
            <Link
              to="/dashboard/agent/pages/form/trade-sheet/agent-basic-info"
              className="primary-btn mx-3"
            >
              Go Back Tradesheet
            </Link>
          </div>
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
            dataSource={filteredData}
            pagination={{ pageSize: 20 }}
            rowKey="uuid"
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

export default MySubmissionsArchiveTradeList;
