/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React, { useEffect, useState, useMemo } from "react";
import type { TableColumnsType, TableProps } from "antd";
import {
  Button,
  Dropdown,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import toast from "react-hot-toast";
import { BsThreeDotsVertical } from "react-icons/bs";
import { MdDelete } from "react-icons/md";
import { FaSearch, FaTimes } from "react-icons/fa";
import { NavLink, useSearchParams } from "react-router-dom";

import TableLoader from "../../../../../components/loader/TableLoader";
import {
  useGetValidationLogsQuery,
  useDeleteValidationLogMutation,
  useDeleteMultipleValidationLogsMutation,
  useGetCampaignsQuery,
} from "../../../../../redux/api/superadmin/leadManagementSlice";

const { Option } = Select;

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];

interface ValidationLog {
  id: number;
  key?: React.Key;
  name?: string | null;
  phone?: string | null;
  sms_send?: boolean | null;
  call_logs?: Array<Record<string, any>> | null;
  call_summary?: string | null;
  status?: string | null;
  campaignId?: number | null;
  campaign?: {
    id: number;
    uuid: string;
    name: string;
    typeOfCampaign?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

const ValidationLogsList = () => {
  const [tableData, setTableData] = useState<ValidationLog[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleteModalMultipleVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchParams] = useSearchParams();
  const campaignUuidFromUrl = searchParams.get("campaignUuid");

  const [isCallLogsModalVisible, setIsCallLogsModalVisible] = useState(false);
  const [isCallSummaryModalVisible, setIsCallSummaryModalVisible] =
    useState(false);
  const [selectedCallLogs, setSelectedCallLogs] = useState<Array<
    Record<string, any>
  > | null>(null);
  const [selectedCallSummary, setSelectedCallSummary] = useState<string | null>(
    null
  );
  const [selectedCampaignUuid, setSelectedCampaignUuid] = useState<
    string | null
  >(campaignUuidFromUrl);
  const [selectedLogName, setSelectedLogName] = useState<string>("");

  const { data, isLoading, refetch } = useGetValidationLogsQuery(
    selectedCampaignUuid || undefined
  );
  const { data: campaignsData } = useGetCampaignsQuery();
  const [deleteValidationLog] = useDeleteValidationLogMutation();
  const [deleteMultipleValidationLogs] =
    useDeleteMultipleValidationLogsMutation();

  useEffect(() => {
    if (campaignUuidFromUrl) {
      setSelectedCampaignUuid(campaignUuidFromUrl);
    }
  }, [campaignUuidFromUrl]);

  useEffect(() => {
    if (data?.data?.validationLogs) {
      const logsWithKeys = data.data.validationLogs.map(
        (log: ValidationLog) => ({
          ...log,
          key: log.id,
        })
      );
      setTableData(logsWithKeys);
    }
  }, [data]);

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<ValidationLog> = {
    selectedRowKeys,
    onChange: onSelectChange,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  const handleDelete = (id: number) => {
    setSelectedId(id);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedId) return;

    try {
      const response = await deleteValidationLog(selectedId).unwrap();
      if (response.status) {
        toast.success(
          response.message || "Validation log deleted successfully"
        );
        refetch();
      } else {
        toast.error(response.message || "Failed to delete validation log");
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete validation log");
      console.error("Delete error:", error);
    } finally {
      setIsDeleteModalVisible(false);
      setSelectedId(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalVisible(false);
    setSelectedId(null);
    setIsDeleteModalMultipleVisible(false);
  };

  const handleDeleteMultipleClick = () => {
    if (selectedRowKeys.length === 0) {
      toast.error("Please select validation logs to delete.");
      return;
    }
    setIsDeleteModalMultipleVisible(true);
  };

  const handleDeleteConfirmMultiple = async () => {
    try {
      const response = await deleteMultipleValidationLogs(
        selectedRowKeys
      ).unwrap();
      if (response.status) {
        toast.success(
          response.message ||
            `Successfully deleted ${selectedRowKeys.length} validation log(s)`
        );
        refetch();
        setSelectedRowKeys([]);
      } else {
        toast.error(response.message || "Failed to delete validation logs");
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete validation logs");
      console.error("Delete multiple error:", error);
    } finally {
      setIsDeleteModalMultipleVisible(false);
    }
  };

  const handleViewCallLogs = (
    logs: Array<Record<string, any>> | null,
    name: string
  ) => {
    setSelectedCallLogs(logs);
    setSelectedLogName(name);
    setIsCallLogsModalVisible(true);
  };

  const handleViewCallSummary = (summary: string | null, name: string) => {
    setSelectedCallSummary(summary);
    setSelectedLogName(name);
    setIsCallSummaryModalVisible(true);
  };

  const filteredData = useMemo(() => {
    if (!tableData) return [];

    return tableData.filter((record) => {
      const searchTerm = searchText.toLowerCase();
      if (!searchTerm) return true;

      return (
        record.name?.toLowerCase().includes(searchTerm) ||
        record.phone?.toLowerCase().includes(searchTerm) ||
        record.status?.toLowerCase().includes(searchTerm) ||
        record.campaign?.name?.toLowerCase().includes(searchTerm) ||
        record.call_summary?.toLowerCase().includes(searchTerm) ||
        String(record.id).includes(searchTerm)
      );
    });
  }, [tableData, searchText]);

  const columns: TableColumnsType<ValidationLog> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search Name"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              Search
            </Button>
            <Button
              onClick={() => clearFilters && clearFilters()}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) =>
        record.name?.toLowerCase().includes(String(value).toLowerCase()),
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search Phone"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              Search
            </Button>
            <Button
              onClick={() => clearFilters && clearFilters()}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) =>
        record.phone?.toLowerCase().includes(String(value).toLowerCase()),
      sorter: (a, b) => (a.phone || "").localeCompare(b.phone || ""),
    },
    {
      title: "SMS Sent",
      dataIndex: "sms_send",
      key: "sms_send",
      render: (text: boolean | null) => (
        <Tag color={text ? "green" : "default"}>{text ? "Yes" : "No"}</Tag>
      ),
      filters: [
        { text: "Yes", value: true },
        { text: "No", value: false },
      ],
      onFilter: (value, record) => record.sms_send === value,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search Status"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              Search
            </Button>
            <Button
              onClick={() => clearFilters && clearFilters()}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) =>
        record.status?.toLowerCase().includes(String(value).toLowerCase()),
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
    },
    {
      title: "Campaign",
      dataIndex: "campaign",
      key: "campaign",
      render: (campaign: ValidationLog["campaign"]) => {
        return campaign?.name || "-";
      },
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => {
        const campaigns = campaignsData?.data?.campaigns || [];
        return (
          <div style={{ padding: 8 }}>
            <Select
              style={{ width: 200, marginBottom: 8, display: "block" }}
              placeholder="Select Campaign"
              value={selectedKeys[0]}
              onChange={(value) => setSelectedKeys(value ? [value] : [])}
              allowClear
            >
              {campaigns.map((campaign: any) => (
                <Option key={campaign.uuid} value={campaign.name}>
                  {campaign.name}
                </Option>
              ))}
            </Select>
            <Space>
              <Button
                type="primary"
                onClick={() => confirm()}
                size="small"
                style={{ width: 90 }}
              >
                Search
              </Button>
              <Button
                onClick={() => clearFilters && clearFilters()}
                size="small"
                style={{ width: 90 }}
              >
                Reset
              </Button>
            </Space>
          </div>
        );
      },
      onFilter: (value, record) => record.campaign?.name === value,
      sorter: (a, b) =>
        (a.campaign?.name || "").localeCompare(b.campaign?.name || ""),
    },
    {
      title: "SMS Logs",
      dataIndex: "call_logs",
      key: "call_logs",
      render: (
        text: Array<Record<string, any>> | null,
        record: ValidationLog
      ) => {
        if (!text || !Array.isArray(text) || text.length === 0) return "-";
        return (
          <Button
            type="link"
            onClick={() => handleViewCallLogs(text, record.name || "Unknown")}
          >
            View ({text.length} log{text.length > 1 ? "s" : ""})
          </Button>
        );
      },
    },
    {
      title: "Summary",
      dataIndex: "call_summary",
      key: "call_summary",
      render: (text: string | null, record: ValidationLog) => {
        if (!text) return "-";
        return (
          <div className="flex items-center gap-2">
            <span>
              {text.length > 50 ? text.substring(0, 50) + "..." : text}
            </span>
            <Button
              type="link"
              size="small"
              onClick={() =>
                handleViewCallSummary(text, record.name || "Unknown")
              }
            >
              View Full
            </Button>
          </div>
        );
      },
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search Call Summary"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              Search
            </Button>
            <Button
              onClick={() => clearFilters && clearFilters()}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) =>
        record.call_summary
          ?.toLowerCase()
          .includes(String(value).toLowerCase()),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: ValidationLog) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "delete",
                label: (
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="flex items-center gap-2 w-full"
                  >
                    <MdDelete /> Delete
                  </button>
                ),
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button icon={<BsThreeDotsVertical />} />
        </Dropdown>
      ),
      fixed: "right",
      width: 50,
      align: "center",
    },
  ];

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">
            Validation Logs
          </h1>
          <div className="flex-1" />
          <div className="relative flex-shrink-0" style={{ width: 170 }}>
            <FaSearch className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: 10, left: 8 }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ paddingLeft: 26, paddingRight: searchText ? 22 : 8, paddingTop: 4, paddingBottom: 4, width: "100%" }}
            />
            {searchText && (
              <button type="button" onClick={() => setSearchText("")} className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" style={{ right: 6 }}>
                <FaTimes />
              </button>
            )}
          </div>
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {selectedRowKeys.length > 0 && (
              <button onClick={handleDeleteMultipleClick} className="cancel-btn">
                Delete Selected ({selectedRowKeys.length})
              </button>
            )}
            <NavLink to="/dashboard/super-admin/leads" className="primary-btn">
              Go Back
            </NavLink>
          </div>
        </div>

      {isLoading ? (
        <TableLoader />
      ) : (
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 20 }}
          scroll={{ x: "max-content" }}
        />
      )}

      <Modal
        title="Confirm Delete"
        open={isDeleteModalVisible}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this validation log?</p>
      </Modal>

      <Modal
        title="Confirm Delete Selected"
        open={isDeleteModalMultipleVisible}
        onOk={handleDeleteConfirmMultiple}
        onCancel={cancelDelete}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to delete the selected {selectedRowKeys.length}{" "}
          validation log(s)?
        </p>
      </Modal>

      <Modal
        title={`SMS Logs - ${selectedLogName}`}
        open={isCallLogsModalVisible}
        onCancel={() => setIsCallLogsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsCallLogsModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        <div className="max-h-[500px] overflow-y-auto">
          {selectedCallLogs && selectedCallLogs.length > 0 ? (
            <div className="space-y-3">
              {selectedCallLogs.map((log, index) => {
                if (!log.role && log.message) {
                  return (
                    <div
                      key={index}
                      className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Tag color="blue">Initial SMS</Tag>
                      </div>
                      <p className="text-gray-800">{log.message}</p>
                    </div>
                  );
                }

                const isCustomer = log.role === "customer";
                const bgColor = isCustomer ? "bg-gray-50" : "bg-green-50";
                const borderColor = isCustomer
                  ? "border-gray-200"
                  : "border-green-200";
                const tagColor = isCustomer ? "default" : "green";

                return (
                  <div
                    key={index}
                    className={`p-3 ${bgColor} rounded-lg border ${borderColor}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Tag color={tagColor}>
                        {isCustomer ? "Customer" : "AI"}
                      </Tag>
                    </div>
                    <p className="text-gray-800">
                      {log.message || "(No message)"}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No call logs available
            </p>
          )}
        </div>
      </Modal>

      <Modal
        title={`Call Summary - ${selectedLogName}`}
        open={isCallSummaryModalVisible}
        onCancel={() => setIsCallSummaryModalVisible(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setIsCallSummaryModalVisible(false)}
          >
            Close
          </Button>,
        ]}
        width={700}
      >
        <div className="py-4">
          {selectedCallSummary ? (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-800 whitespace-pre-wrap">
                {selectedCallSummary}
              </p>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No summary available
            </p>
          )}
        </div>
      </Modal>
    </div>
    </div>
  );
};

export default ValidationLogsList;
