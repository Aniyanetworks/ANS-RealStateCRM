// @ts-nocheck
import type { TableColumnsType } from "antd";
import { Table, Dropdown, Space, Tooltip } from "antd";
import { FaEye, FaRegEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";
import moment from "moment-timezone";
import { formatStringCamelCasecapitalize } from "../../../../../../utils/stringUtils";
import type { DataType } from "./types";
import { reasonLabel } from "./types";

interface ReceiptTableProps {
  columns: TableColumnsType<DataType>;
  dataSource: any[];
  rowSelection: any;
  isLoading: boolean;
}

const ReceiptTable = ({
  columns,
  dataSource,
  rowSelection,
  isLoading,
}: ReceiptTableProps) => {
  return (
    <Table
      rowSelection={rowSelection}
      rowKey="uuid"
      scroll={{ x: "max-content" }}
      columns={columns}
      dataSource={dataSource}
      pagination={{ pageSize: 20 }}
      loading={isLoading}
    />
  );
};

export const createTableColumns = (
  handleReceiptModal: (record: DataType) => void,
  handleEdit: (record: DataType) => void,
  handleDelete: (uuid: string) => void,
  hasPermissionForSlug: (slug: string) => boolean
): TableColumnsType<DataType> => {
  return [
    {
      title: "#",
      key: "serial",
      width: 80,
      dataIndex: "serial",
    },
    {
      title: "Receipt ID",
      dataIndex: "receiptId",
      key: "receiptId",
      sorter: (a, b) => a.receiptId.localeCompare(b.receiptId),
      ellipsis: true,
      render: (text: string, record: any) => (
        <Tooltip title={text}>
          <button
            onClick={() => handleReceiptModal(record)}
            className="hover:text-blue-600 cursor-pointer hover:underline"
          >
            {text?.length > 30 ? `${text?.slice(0, 30)}...` : text}
          </button>
        </Tooltip>
      ),
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
      title: "Pickup By",
      dataIndex: "pickupBy",
      key: "pickupBy",
      width: 180,
      render: (text, record) =>
        `${record?.pickupPerson} (${formatStringCamelCasecapitalize(text)})`,
    },
    {
      title: "Reason For Payment",
      dataIndex: "reasonForPayment",
      key: "reasonForPayment",
      render: (text) => reasonLabel(text),
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      width: 170,
      render: (text) => `${formatStringCamelCasecapitalize(text)}`,
    },
    {
      title: "Handle By",
      dataIndex: "handleBy",
      key: "handleBy",
      width: 140,
    },
    {
      title: "Actions",
      dataIndex: "uuid",
      key: "actions",
      render: (uuid, recoard) => (
        <Dropdown
          menu={{
            items: [
              hasPermissionForSlug("edit-cheque-pickup-receipt") && {
                key: "edit",
                label: (
                  <button
                    className="flex items-center gap-2 w-full"
                    onClick={() => handleEdit(recoard)}
                  >
                    <FaRegEdit />
                    Edit
                  </button>
                ),
              },
              {
                key: "view",
                label: (
                  <button
                    className="flex items-center gap-2 w-full"
                    onClick={() => handleReceiptModal(recoard)}
                  >
                    <FaEye />
                    View
                  </button>
                ),
              },
              hasPermissionForSlug("edit-cheque-pickup-receipt") && {
                key: "delete",
                label: (
                  <button
                    className="flex items-center gap-2 w-full"
                    onClick={() => handleDelete(uuid)}
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
      fixed: "right",
      width: 50,
      align: "center",
    },
  ];
};

export default ReceiptTable;

