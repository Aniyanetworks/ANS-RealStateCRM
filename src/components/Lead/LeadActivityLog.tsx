/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ClockCircleOutlined,
  EditOutlined,
  PlusCircleOutlined,
  SwapOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
} from "@ant-design/icons";
import {
  Empty,
  Modal,
  Pagination,
  Spin,
  Tag,
  Timeline,
  Typography,
} from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import React, { useState } from "react";
import { useGetLeadActivityLogsQuery } from "../../redux/api/superadmin/leadManagementSlice";

dayjs.extend(relativeTime);

const { Text: AntText } = Typography;

interface LeadActivityLogProps {
  leadUuid: string | null;
  visible: boolean;
  onClose: () => void;
  leadName?: string;
}

const LeadActivityLog: React.FC<LeadActivityLogProps> = ({
  leadUuid,
  visible,
  onClose,
  leadName,
}) => {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isFetching } = useGetLeadActivityLogsQuery(
    { leadUuid, page, limit },
    { skip: !visible || !leadUuid }
  );

  const getActionColor = (action: string) => {
    switch (action) {
      case "created":
        return "green";
      case "status_changed":
        return "blue";
      case "updated":
        return "orange";
      case "assigned":
        return "cyan";
      case "unassigned":
        return "red";
      case "validation_log_created":
        return "purple";
      default:
        return "default";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <PlusCircleOutlined />;
      case "status_changed":
        return <SwapOutlined />;
      case "updated":
        return <EditOutlined />;
      case "assigned":
        return <UserAddOutlined />;
      case "unassigned":
        return <UserDeleteOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const formatFieldName = (field: string) => {
    const fieldNames: { [key: string]: string } = {
      agentAssigned: "Agent",
      leadDate: "Lead Date",
      name: "Name",
      phone: "Phone",
      email: "Email",
      status: "Status",
      platform: "Platform",
      validationLog: "Validation Log",
    };
    return fieldNames[field] || field;
  };

  const renderActivityItem = (log: any) => {
    const {
      action,
      fieldName,
      oldValue,
      newValue,
      userName,
      createdAt,
    } = log;

    if (
      action === "status_changed" ||
      action === "assigned" ||
      action === "unassigned"
    ) {
      return (
        <Timeline.Item
          key={log.id}
          dot={getActionIcon(action)}
          color={getActionColor(action)}
        >
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Tag color={getActionColor(action)} style={{ fontSize: "11px" }}>
                {action.replace("_", " ").toUpperCase()}
              </Tag>
              <AntText
                strong
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "13px",
                }}
              >
                by {userName}
              </AntText>
              <AntText type="secondary" style={{ fontSize: 11 }}>
                {dayjs(createdAt).fromNow()}
              </AntText>
            </div>

            {fieldName && (
              <div style={{ marginTop: 8, fontSize: "12px" }}>
                <AntText strong style={{ fontSize: "12px" }}>
                  {formatFieldName(fieldName)}:{" "}
                </AntText>
                {oldValue && oldValue !== "null" && (
                  <>
                    <Tag color="red" style={{ fontSize: "11px" }}>
                      {oldValue}
                    </Tag>
                    <AntText style={{ fontSize: "12px" }}> → </AntText>
                  </>
                )}
                {newValue && newValue !== "null" ? (
                  <Tag color="green" style={{ fontSize: "11px" }}>
                    {newValue}
                  </Tag>
                ) : (
                  <Tag style={{ fontSize: "11px" }}>Not Set</Tag>
                )}
              </div>
            )}

            <AntText
              type="secondary"
              style={{ fontSize: 10, display: "block", marginTop: 4 }}
            >
              {dayjs(createdAt).format("MMM DD, YYYY HH:mm:ss")}
            </AntText>
          </div>
        </Timeline.Item>
      );
    }

    return (
      <Timeline.Item
        key={log.id}
        dot={getActionIcon(action)}
        color={getActionColor(action)}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: "12px" }}>
            <Tag
              color={getActionColor(action)}
              style={{ fontSize: "11px", marginRight: 8 }}
            >
              {action.replace("_", " ").toUpperCase()}
            </Tag>
            <AntText strong style={{ fontSize: "12px" }}>
              {userName}
            </AntText>
            <AntText type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
              {dayjs(createdAt).fromNow()}
            </AntText>
          </div>

          {fieldName && (newValue || oldValue) && (
            <div style={{ marginTop: 6, fontSize: "12px" }}>
              <AntText style={{ fontSize: "12px" }}>
                {formatFieldName(fieldName)}:{" "}
                <strong>{newValue || oldValue}</strong>
              </AntText>
            </div>
          )}

          <AntText
            type="secondary"
            style={{ fontSize: 10, display: "block", marginTop: 4 }}
          >
            {dayjs(createdAt).format("MMM DD, YYYY HH:mm:ss")}
          </AntText>
        </div>
      </Timeline.Item>
    );
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ClockCircleOutlined />
          <span>Lead Activity Log</span>
          {leadName && (
            <AntText
              type="secondary"
              style={{ fontSize: 14, fontWeight: "normal" }}
            >
              - {leadName}
            </AntText>
          )}
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
    >
      <Spin spinning={isLoading || isFetching}>
        {data?.data?.logs && data.data.logs.length > 0 ? (
          <>
            <Timeline mode="left" style={{ marginTop: 24 }}>
              {data.data.logs.map((log: any) => renderActivityItem(log))}
            </Timeline>

            {data.data.totalPages > 1 && (
              <div style={{ textAlign: "center", marginTop: 24 }}>
                <Pagination
                  current={page}
                  total={data.data.total}
                  pageSize={limit}
                  onChange={setPage}
                  showSizeChanger={false}
                  showTotal={(total) => `Total ${total} activities`}
                  size="small"
                />
              </div>
            )}
          </>
        ) : (
          <Empty
            description="No activity logs found"
            style={{ marginTop: 40 }}
          />
        )}
      </Spin>
    </Modal>
  );
};

export default LeadActivityLog;
