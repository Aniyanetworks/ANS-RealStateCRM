/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React from "react";
import { Popover, Table } from "antd";
import type { TableColumnsType, TableRowSelection } from "antd";
import moment from "moment-timezone";
import TableLoader from "../../loader/TableLoader";

interface NotificationLog {
  id: number;
  uuid: string;
  title: string;
  notificationType: "EMAIL" | "SMS" | "BOTH";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "PARTIALLY_FAILED";
  targetAgents: string[];
  customEmails: string[];
  customPhones: string[];
  emailsSent: number;
  emailsFailed: number;
  smsSent: number;
  smsFailed: number;
  totalRecipients: number;
  sentAt: string;
  completedAt?: string;
  errorMessage?: string;
}

interface NotificationLogsProps {
  filteredLogs: any[];
  isLoading: boolean;
  rowSelection?: TableRowSelection<any>;
}

const NotificationLogs: React.FC<NotificationLogsProps> = ({ 
  filteredLogs, 
  isLoading,
  rowSelection 
}) => {
  

  const columns: TableColumnsType<NotificationLog> = [
    {
      title: "#",
      key: "serial",
      width: 60,
      render: (_, __, index) => index + 1,
      fixed: "left",
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 200,
      render: (text) => <span className="font-medium">{text || "N/A"}</span>,
    },
    {
      title: "Type",
      dataIndex: "notificationType",
      key: "notificationType",
      width: 100,
      render: (type) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          type === 'EMAIL' ? 'bg-blue-100 text-blue-800' :
          type === 'SMS' ? 'bg-green-100 text-green-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {type}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
          status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
          status === 'PENDING' ? 'bg-orange-100 text-orange-800' :
          status === 'FAILED' ? 'bg-red-100 text-red-800' :
          'bg-volcano-100 text-volcano-800'
        }`}>
          {status.replace('_', ' ')}
        </span>
      ),
    },
    {
      title: "Target Agents",
      dataIndex: "targetAgents",
      key: "targetAgents",
      width: 150,
      render: (agents: string[]) => (
        <div>
          {agents && agents.length > 0 ? (
            <Popover
              content={
                <div className="w-64">
                  <div className="font-semibold mb-2">Target Agents ({agents.length})</div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {agents.map((agent, index) => (
                      <div key={index} className="text-sm p-1 hover:bg-gray-50 rounded">
                        {agent}
                      </div>
                    ))}
                  </div>
                </div>
              }
              placement="topLeft"
              trigger="hover"
            >
              <span className="text-sm cursor-help hover:text-blue-600">
                {agents.length} agents
              </span>
            </Popover>
          ) : (
            <span className="text-gray-500 text-sm">No agents</span>
          )}
        </div>
      ),
    },
    {
      title: "Custom Emails",
      dataIndex: "customEmails",
      key: "customEmails",
      width: 120,
      render: (emails: string[]) => (
        <span className="text-sm">{emails?.length || 0}</span>
      ),
    },
    {
      title: "Custom Phones",
      dataIndex: "customPhones",
      key: "customPhones",
      width: 120,
      render: (phones: string[]) => (
        <span className="text-sm">{phones?.length || 0}</span>
      ),
    },
    {
      title: "Emails Sent/Failed",
      key: "emailStats",
      width: 140,
      render: (record: NotificationLog) => (
        <div className="text-sm">
          <span className="text-green-600">{record.emailsSent}</span>/
          <span className="text-red-600">{record.emailsFailed}</span>
        </div>
      ),
    },
    {
      title: "SMS Sent/Failed",
      key: "smsStats",
      width: 140,
      render: (record: NotificationLog) => (
        <div className="text-sm">
          <span className="text-green-600">{record.smsSent}</span>/
          <span className="text-red-600">{record.smsFailed}</span>
        </div>
      ),
    },
    {
      title: "Sent At",
      dataIndex: "sentAt",
      key: "sentAt",
      width: 150,
      render: (date) => {
        if (!date) return "N/A";
        return moment.utc(date).format("DD MMM YYYY HH:mm");
      },
    },
    {
      title: "Completed At",
      dataIndex: "completedAt",
      key: "completedAt",
      width: 150,
      render: (date) => {
        if (!date) return "N/A";
        return moment.utc(date).format("DD MMM YYYY HH:mm");
      },
    },
  ];

  // serial number in the table
  const tableSourceData = filteredLogs?.map((item: any, index: number) => {
    return {
      ...item,
      serial: index + 1,
    };
  });

  return (
   <div>
      {isLoading ? (
        <TableLoader />
      ) : (
        <Table
          rowSelection={rowSelection} // Pass the rowSelection prop
          rowKey="uuid"
          columns={columns}
          dataSource={tableSourceData}
          scroll={{ x: "max-content" }}
          pagination={{ pageSize: 10 }}
        />
      )}
    </div>
  );
};

export default NotificationLogs;