// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any

import { Dropdown, Space } from "antd";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaCreativeCommonsNc, FaEye, FaRegEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import type { DataType } from "../types";

interface ReceiptActionsProps {
  record: DataType;
  onEdit: (record: DataType) => void;
  onView: (record: DataType) => void;
  onRefund: (record: DataType) => void;
  onDelete: (uuid: string) => void;
  hasPermissionForSlug: (slug: string) => boolean;
}

const ReceiptActions = ({
  record,
  onEdit,
  onView,
  onRefund,
  onDelete,
  hasPermissionForSlug,
}: ReceiptActionsProps) => {
  return (
    <Dropdown
      menu={{
        items: [
          hasPermissionForSlug("edit-deposit-receipt") && {
            key: "edit",
            label: (
              <button
                className="flex items-center gap-2 w-full"
                onClick={() => onEdit(record)}
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
                onClick={() => onView(record)}
              >
                <FaEye />
                View
              </button>
            ),
          },
          {
            key: "refund",
            label: (
              <button
                className="flex items-center gap-2 w-full"
                onClick={() => onRefund(record)}
              >
                <FaCreativeCommonsNc />
                Refund
              </button>
            ),
          },
          hasPermissionForSlug("delete-deposit-receipt") && {
            key: "delete",
            label: (
              <button
                className="flex items-center gap-2 w-full"
                onClick={() => onDelete(record.uuid)}
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
  );
};

export default ReceiptActions;

