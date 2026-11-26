// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any

import type { TableColumnsType, TableProps } from "antd";
import { Table } from "antd";
import moment from "moment-timezone";
import { formatStringCamelCasecapitalize } from "../../../../../../utils/stringUtils";
import { formatNumberWithCommasAndDecimals } from "../../../../../../utils/formatNumberWithCommasAndDecimals";
import type { DataType } from "../../types";
import ReceiptActions from "./ReceiptActions";
import TableLoader from "../../../../../../components/loader/TableLoader";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];

interface ReceiptTableProps {
  data: DataType[];
  isLoading: boolean;
  selectedRowKeys: React.Key[];
  onSelectChange: (newSelectedRowKeys: React.Key[]) => void;
  onEdit: (record: DataType) => void;
  onView: (record: DataType) => void;
  onRefund: (record: DataType) => void;
  onDelete: (uuid: string) => void;
  hasPermissionForSlug: (slug: string) => boolean;
}

const ReceiptTable = ({
  data,
  isLoading,
  selectedRowKeys,
  onSelectChange,
  onEdit,
  onView,
  onRefund,
  onDelete,
  hasPermissionForSlug,
}: ReceiptTableProps) => {
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
          onSelectChange(newSelectedRowKeys);
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
          onSelectChange(newSelectedRowKeys);
        },
      },
    ],
  };

  // serial number in the table
  const tableSourceData = data?.map((item: any, index: number) => {
    return {
      ...item,
      serial: index + 1,
    };
  });

  const columns: TableColumnsType<DataType> = [
    {
      title: "Receipt ID",
      dataIndex: "receiptId",
      key: "receiptId",
      width: 130,
      fixed: "left",
      render: (text, record) => {
        // Check if the status is either 'refundProcess' or 'refundCompleted'
        if (
          record.status === "refundProcess" ||
          record.status === "refundCompleted"
        ) {
          let statusText = "";

          // Assign custom text based on the status
          if (record.status === "refundProcess") {
            statusText = "Refund Process";
          } else if (record.status === "refundCompleted") {
            statusText = "Refund Completed";
          }

          // Return receiptId with the custom status text
          return `${record.receiptId} (${statusText})`;
        }

        // Return just the receiptId if no matching status
        return (
          <span
            onClick={() => onView(record)}
            className="hover:text-blue-600 cursor-pointer hover:underline"
          >
            {record.receiptId}
          </span>
        );
      },
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (text) =>
        moment
          .tz(text, "YYYY-MM-DD HH:mm:ss", "UTC")
          .tz("America/Toronto")
          .format("DD MMMM YYYY, hh:mm A"),
    },
    {
      title: "Property Address",
      dataIndex: "propertyAddress",
      key: "propertyAddress",
    },
    {
      title: "Received from",
      dataIndex: "receivedFrom",
      key: "receivedFrom",
      width: 250,
      render: (text, record) =>
        `${text} (${formatStringCamelCasecapitalize(record?.representation)})`,
    },
    {
      title: "Type",
      dataIndex: "paymentType",
      key: "paymentType",
      render: (text) => formatStringCamelCasecapitalize(text),
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (text) => formatStringCamelCasecapitalize(text),
    },
    {
      title: "Transaction Type",
      dataIndex: "transactionType",
      key: "transactionType",
      render: (text) => formatStringCamelCasecapitalize(text),
    },
    {
      title: "Amount Received",
      dataIndex: "amountReceived",
      key: "amountReceived",
      render: (value) => `$ ${formatNumberWithCommasAndDecimals(value)}`,
    },
    {
      title: "Received By",
      dataIndex: "receivedBy",
      key: "receivedBy",
    },
    {
      title: "Actions",
      dataIndex: "uuid",
      key: "actions",
      render: (uuid, record) => (
        <ReceiptActions
          record={record}
          onEdit={onEdit}
          onView={onView}
          onRefund={onRefund}
          onDelete={onDelete}
          hasPermissionForSlug={hasPermissionForSlug}
        />
      ),
      fixed: "right",
      width: 50,
      align: "center",
    },
  ];

  if (isLoading) {
    return <TableLoader />;
  }

  return (
    <Table
      rowSelection={rowSelection}
      rowKey="uuid"
      scroll={{ x: "max-content" }}
      columns={columns}
      dataSource={tableSourceData}
      pagination={{ pageSize: 20 }}
    />
  );
};

export default ReceiptTable;

