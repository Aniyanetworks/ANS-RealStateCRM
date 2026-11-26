/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import type { TableColumnsType } from "antd";
import { Dropdown, Space } from "antd";
import { Link } from "react-router-dom";
import { FaChevronDown, FaComment, FaEye, FaFileAlt, FaRegEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";
import { statusOptions } from "../utils/propertyListingConstants";

interface ColumnProps {
  user: any;
  hasPermissionForSlug: (slug: string) => boolean;
  setIsModalPropertyListPreviewVisible: (visible: boolean) => void;
  setSelectedUuid: (uuid: string | null) => void;
  setSelectedListingId: (id: string) => void;
  handleChangeStatus: (newStatus: string, uuid: string) => void;
  handleDelete: (uuid: string) => void;
  handleRejectReasonView: (reason: any) => void;
  setIsModalFileManagerVisible: (visible: boolean) => void;
}

export const getPropertyListingColumns = ({
  user,
  hasPermissionForSlug,
  setIsModalPropertyListPreviewVisible,
  setSelectedUuid,
  setSelectedListingId,
  handleChangeStatus,
  handleDelete,
  handleRejectReasonView,
  setIsModalFileManagerVisible,
}: ColumnProps): TableColumnsType<any> => [
  {
    title: "Property Record",
    dataIndex: "propertyListingTypeId",
    key: "propertyListingTypeId",
    render: (propertyListingTypeId, record) => (
      <button
        onClick={() => {
          localStorage.setItem("listingId", record?.id || "");
          setIsModalPropertyListPreviewVisible(true);
          setSelectedUuid(record.uuid);
          setSelectedListingId(record?.id || "");
        }}
        style={{
          cursor: "pointer",
          border: "none",
          background: "none",
          padding: 0,
          font: "inherit",
        }}
        className="hover:text-blue-600 cursor-pointer hover:underline"
      >
        {propertyListingTypeId || "N/A"}
      </button>
    ),
  },
  {
    title: "MLS Number",
    dataIndex: "mlsNumber",
    key: "mlsNumber",
    render: (mlsNumber, record) => (
      <button
        onClick={() => {
          localStorage.setItem("listingId", record?.id || "");
          setIsModalPropertyListPreviewVisible(true);
          setSelectedUuid(record.uuid);
          setSelectedListingId(record?.id || "");
        }}
        style={{
          cursor: "pointer",
          border: "none",
          background: "none",
          padding: 0,
          color: "inherit",
          font: "inherit",
          textDecoration: "none",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.textDecoration = "underline")
        }
        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
      >
        {mlsNumber || "N/A"}
      </button>
    ),
  },
  {
    title: "Property Address",
    dataIndex: "propertyAddress",
    key: "propertyAddress",
    render: (propertyAddress, record) => (
      <button
        onClick={() => {
          localStorage.setItem("listingId", record?.id || "");
          setIsModalPropertyListPreviewVisible(true);
          setSelectedUuid(record.uuid);
          setSelectedListingId(record?.id || "");
        }}
        style={{
          color: record.status === "rejected" ? "red" : "inherit",
        }}
        className={record.status === "rejected" ? "blinking" : ""}
      >
        {propertyAddress || "N/A"}
      </button>
    ),
    width: 240,
  },
  {
    title: "Listing Agent",
    dataIndex: "createdBy",
    key: "createdBy",
    render: (_text, record) => {
      return record?.createdUser
        ? `${record.createdUser.firstName} ${record.createdUser.lastName}`
        : "Unknown";
    },
  },
  {
    title: "Shared Agent",
    dataIndex: "name",
    key: "name",
    render: (_text, record) => {
      const multipleUserArray = record?.sharedUsers;
      return multipleUserArray?.map((rep: any, index: number) => (
        <span key={index}>
          {rep?.name || rep}
          {index < multipleUserArray.length - 1 ? ", " : ""}
        </span>
      ));
    },
  },
  {
    title: "Listing Type",
    dataIndex: "propertyListingType",
    key: "propertyListingType",
    filters: [
      { text: "For sale", value: "For sale" },
      { text: "FOr rent", value: "FOr rent" },
    ],
    onFilter: (value, record) => record.propertyListingType === value,
    render: (propertyType: any) => (
      <span>{propertyType ? propertyType.charAt(0).toUpperCase() + propertyType.slice(1) : "N/A"}</span>
    ),
  },
  {
    title: "Property Type..",
    dataIndex: "propertyType",
    key: "propertyType",
    filters: [
      { text: "Detached", value: "Detached" },
      { text: "Semi Detached", value: "Semi Detached" },
      { text: "Freehold Townhome", value: "Freehold Townhome" },
      { text: "Condo Apt", value: "Condo Apt" },
      { text: "Condo Townhome", value: "Condo Townhome" },
      { text: "Residential Freehold", value: "Residential Freehold" },
      { text: "Other", value: "Other" },
    ],
    onFilter: (value, record) => record.propertyType === value,
    render: (propertyType: any) => (
      <span>{propertyType ? propertyType.charAt(0).toUpperCase() + propertyType.slice(1) : "N/A"}</span>
    ),
  },
  {
    title: "Listing Status",
    dataIndex: "listingStatus",
    key: "listingStatus",
    filters: [
      { value: "New", text: "New" },
      { value: "sold", text: "Sold" },
      { value: "Price Change", text: "Price Change" },
      { value: "leased", text: "Leased" },
      { value: "terminated", text: "Terminated" },
      { value: "suspended", text: "Suspended" },
      { value: "extended", text: "Extended" },
      { value: "expired", text: "Expired" },
      { value: "dft", text: "DFT" },
      { value: "exclusive", text: "Exclusive" },
    ],
    onFilter: (value, record) => record.listingStatus === value,
    render: (listingStatus: any) => (
      <span>{listingStatus ? listingStatus.charAt(0).toUpperCase() + listingStatus.slice(1) : "N/A"}</span>
    ),
  },
  {
    title: "Admin Status",
    dataIndex: "status",
    key: "status",
    filters: [
      { text: "Approved", value: "approved" },
      { text: "Under Review", value: "underReview" },
      { text: "Draft", value: "draft" },
      { text: "Incomplete", value: "rejected" },
      { text: "Pending MLS", value: "pendingMls" },
    ],
    onFilter: (value, record) => record.status === value,
    render: (status, record) => {
      const labelMap: Record<string, string> = {
        approved: "Approved",
        underReview: "Under Review",
        draft: "Draft",
        rejected: "Incomplete",
        pendingMls: "Pending MLS",
      };
      const label = labelMap[status] ?? status ?? "—";
      const badgeStyle: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        minWidth: 108,
        padding: "2px 8px",
        borderRadius: 4,
        border: "1px solid #e8e8e8",
        color: "#595959",
        fontSize: 11,
        lineHeight: 1.5,
        cursor: "pointer",
        whiteSpace: "nowrap",
      };
      if (user.userType === "agent") {
        return <span style={{ ...badgeStyle, cursor: "default" }}>{label}</span>;
      }
      return (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: statusOptions.map((opt: any) => ({
              key: opt.value,
              label: <span style={{ fontSize: 11, color: "#595959" }}>{opt.label}</span>,
              onClick: () => handleChangeStatus(opt.value, record.uuid),
            })),
          }}
        >
          <span style={badgeStyle}>
            <span>{label}</span>
            <FaChevronDown style={{ fontSize: 8, opacity: 0.45 }} />
          </span>
        </Dropdown>
      );
    },
  },
  {
    title: "Actions",
    dataIndex: "uuid",
    key: "actions",
    fixed: "right",
    render: (uuid, recoard) => {
      const menuItems: Array<{ key: string; label: React.ReactNode }> = [];

      if (
        (recoard.createdBy == user.id ||
          user.userType === "superAdmin" ||
          recoard.status === "rejected" ||
          recoard.status === "draft") &&
        hasPermissionForSlug("edit-property-listing")
      ) {
        menuItems.push({
          key: "edit",
          label: (
            <Link
              onClick={() => {
                localStorage.setItem("listingId", recoard?.id || "");
                setSelectedListingId(recoard?.id || "");
              }}
              to={`/dashboard/super-admin/create-update-property-listing/${recoard.uuid}`}
              className="flex gap-2 items-center"
            >
              <FaRegEdit />
              Edit
            </Link>
          ),
        });
      }

      menuItems.push({
        key: "view",
        label: (
          <button
            onClick={() => {
              localStorage.setItem("listingId", recoard?.id || "");
              setIsModalPropertyListPreviewVisible(true);
              setSelectedUuid(recoard.uuid);
              setSelectedListingId(recoard?.id || "");
            }}
            className="flex gap-2 items-center"
          >
            <FaEye />
            View
          </button>
        ),
      });

      menuItems.push({
        key: "fileManager",
        label: (
          <button
            onClick={() => {
              localStorage.setItem("listingId", recoard?.id || "");
              setIsModalFileManagerVisible(true);
              setSelectedUuid(recoard.uuid);
              setSelectedListingId(recoard?.id || "");
            }}
            className=" flex items-center gap-2"
          >
            <FaFileAlt /> File Manager
          </button>
        ),
      });

      if (recoard.status === "rejected") {
        menuItems.push({
          key: "rejectReason",
          label: (
            <button
              onClick={() => {
                localStorage.setItem("listingId", recoard?.id || "");
                setSelectedListingId(recoard?.id || "");
                handleRejectReasonView(recoard?.rejectReason);
              }}
              className="flex gap-2 items-center"
            >
              <FaComment className="text-red-500" />
              Reject Reason
            </button>
          ),
        });
      }

      if (
        ((user.userType === "agent" && recoard.status === "draft") ||
          user.userType === "superAdmin" ||
          user.userType === "admin") &&
        hasPermissionForSlug("delete-property-listing")
      ) {
        menuItems.push({
          key: "delete",
          label: (
            <button
              onClick={() => handleDelete(uuid)}
              className="flex gap-2 items-center"
            >
              <MdDelete size={17} />
              Delete
            </button>
          ),
        });
      }

      return (
        <Dropdown
          menu={{
            items: menuItems,
          }}
        >
          <a onClick={(e) => e.preventDefault()}>
            <Space>
              <BsThreeDotsVertical />
            </Space>
          </a>
        </Dropdown>
      );
    },
    align: "center",
  },
];
