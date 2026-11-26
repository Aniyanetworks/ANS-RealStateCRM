/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import type { TableColumnsType, TableProps } from "antd";
import { Table, Modal, Button, Dropdown, Space, Calendar, Segmented, Tag, Tooltip, Select } from "antd";
import { FaRegEdit, FaSearch, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { UnorderedListOutlined, CalendarOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";
import TableLoader from "../../../../../components/loader/TableLoader";
import ModalMain from "../../../../../components/ui/Modal";
import { Controller, useForm } from "react-hook-form";

// import momentTimezone from "moment-timezone";
import moment from "moment-timezone";

import {
  useDeleteCalendarEventMutation,
  useDeleteMultipleCalendarEventsMutation,
  useGetCalendarEventsQuery,
  useCreateCalendarEventMutation,
  useUpdateCalendarEventMutation,
} from "../../../../../redux/api/superadmin/calendar/calendarEventSlice";
import { useGetAgentListDataQuery } from "../../../../../redux/api/superadmin/agent/agentManagementSlice";
import { BsPeople, BsThreeDotsVertical } from "react-icons/bs";
import { Link } from "react-router-dom";
import { usePermissions } from "../../../../../utils/permissionUtils";

// "Our Agents" = agents under our own brokerage (ANS RealStateCRM Inc.,
// brokerageId 24) who aren't terminated — same rule as the Agent List page's
// "Our Agents" tab. Co-op/other-brokerage agents are excluded.
const OUR_BROKERAGE_ID = 24;

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];

interface CalendarEventViewer {
  viewer: { id: number; firstName?: string; lastName?: string; name?: string; email?: string };
}

interface CalendarEvent {
  id?: string;
  title: string;
  uuid?: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  status?: string;
  createdAt?: string;
  viewers?: CalendarEventViewer[];
  viewerUserIds?: number[];
}

const CalendarEventManagement = () => {
  // States
  const { hasPermissionForSlug } = usePermissions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalMultipleVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [tableData, setTableData] = useState<CalendarEvent[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");

  // RTK Query hooks
  const { data, isLoading, refetch } = useGetCalendarEventsQuery("");
  const [createCalendarEvent] = useCreateCalendarEventMutation();
  const [updateCalendarEvent] = useUpdateCalendarEventMutation();
  const [deleteCalendarEvent] = useDeleteCalendarEventMutation();
  const [deleteMultipleCalendarEvents] =
    useDeleteMultipleCalendarEventsMutation();
  const { data: agentsData } = useGetAgentListDataQuery();
  const agentOptions = (agentsData?.data?.userData || [])
    .filter((agentAccount: any) => {
      const brokerageId = agentAccount?.brokerageId;
      const isOurBrokerage = brokerageId === OUR_BROKERAGE_ID || brokerageId === String(OUR_BROKERAGE_ID);
      return isOurBrokerage && agentAccount?.status !== "closed" && agentAccount?.user?.id;
    })
    .map((agentAccount: any) => {
      const u = agentAccount.user;
      return {
        value: u.id,
        label: u.name || `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email,
      };
    });

  const {
    register,
    control,
    formState: { errors },
    reset,
    getValues,
    setError,
    handleSubmit,
  } = useForm<CalendarEvent>();

  useEffect(() => {
    if (data?.data?.calendarEvents) {
      setTableData(data.data.calendarEvents);
    }
  }, [data]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get("auth");

    if (authStatus === "success") {
      toast.success("Calendar connected successfully!");
    } else if (authStatus === "failed") {
      toast.error("Calendar connection failed");
    }
  }, []);

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();
    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return inRecord;
  });

  // Group events by their Toronto-local start date for the calendar view
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    (filteredData || []).forEach((record) => {
      if (!record.start) return;
      const dateKey = moment
        .tz(record.start, "YYYY-MM-DD HH:mm:ss", "UTC")
        .tz("America/Toronto")
        .format("YYYY-MM-DD");
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(record);
    });
    return map;
  }, [filteredData]);

  const dateCellRender = (value: any) => {
    const dateKey = value.format("YYYY-MM-DD");
    const dayEvents = eventsByDate[dateKey];
    if (!dayEvents?.length) return null;

    const visible = dayEvents;

    const formatTime = (text?: string) =>
      text
        ? moment.tz(text, "YYYY-MM-DD HH:mm:ss", "UTC").tz("America/Toronto").format("hh:mm A")
        : null;

    return (
      <div className="flex flex-col gap-1 overflow-hidden">
        {visible.map((event) => {
          const startTime = formatTime(event.start);
          const endTime = formatTime(event.end);

          return (
            <Tooltip
              key={event.id}
              color="#082624"
              rootClassName="event-tooltip-overlay"
              styles={{
                body: {
                  backgroundColor: "#082624",
                  padding: "10px 12px",
                  borderRadius: 8,
                  boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
                },
              }}
              title={
                <div style={{ minWidth: 200, maxWidth: 280 }}>
                  <div
                    style={{
                      color: "#ffffff",
                      fontWeight: 600,
                      fontSize: 13,
                      paddingBottom: 6,
                      marginBottom: 6,
                      borderBottom: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    {event.title || "Untitled"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {(startTime || endTime) && (
                      <div style={{ display: "flex", gap: 8, fontSize: 12, lineHeight: 1.5 }}>
                        <span style={{ color: "#9CA3AF", minWidth: 60, flexShrink: 0 }}>Time</span>
                        <span style={{ color: "#ffffff" }}>
                          {startTime}
                          {startTime && endTime ? " - " : ""}
                          {endTime}
                        </span>
                      </div>
                    )}
                    {event.location && (
                      <div style={{ display: "flex", gap: 8, fontSize: 12, lineHeight: 1.5 }}>
                        <span style={{ color: "#9CA3AF", minWidth: 60, flexShrink: 0 }}>Location</span>
                        <span style={{ color: "#ffffff" }}>{event.location}</span>
                      </div>
                    )}
                    {event.description && (
                      <div style={{ display: "flex", gap: 8, fontSize: 12, lineHeight: 1.5 }}>
                        <span style={{ color: "#9CA3AF", minWidth: 60, flexShrink: 0 }}>Details</span>
                        <span style={{ color: "#e5e7eb" }}>{event.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              }
            >
              <Tag
                color="#0b3b38"
                className="m-0 truncate cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(event);
                }}
              >
                {event.title || "Untitled"}
              </Tag>
            </Tooltip>
          );
        })}
      </div>
    );
  };

  // Form handlers
  const showModal = () => setIsModalOpen(true);

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedEventId("");
  };
  const startDate = moment().tz("America/Toronto").format("YYYY-MM-DDTHH:mm");
  const endDate = moment().tz("America/Toronto").format("YYYY-MM-DDTHH:mm");

  const resetForm = () => {
    reset({
      title: "",
      description: "",
      start: "",
      end: "",
      location: "",
      viewerUserIds: [],
    });
    setIsEditMode(false);
    setSelectedEventId("");
  };

  // Clicking a blank (event-less) date in the calendar view opens the create modal prefilled with that date
  const handleDateSelect = (date: any) => {
    const dateKey = date.format("YYYY-MM-DD");
    if (eventsByDate[dateKey]?.length) return;

    reset({
      title: "",
      description: "",
      start: `${dateKey}T09:00`,
      end: `${dateKey}T10:00`,
      location: "",
      viewerUserIds: [],
    });
    setIsEditMode(false);
    setSelectedEventId("");
    showModal();
  };

  console.log(data);

  const onSubmit = async () => {
    const data = getValues();

    setLoading(true);

    try {
      let response;
      if (isEditMode) {
        response = await updateCalendarEvent({
          eventId: selectedEventId,
          data: data,
        }).unwrap();
      } else {
        response = await createCalendarEvent(data).unwrap();
      }

      if (response.status) {
        toast.success(
          isEditMode
            ? "Event updated successfully!"
            : "Event created successfully!"
        );
        setIsModalOpen(false);
        resetForm();
        refetch();
      }
    } catch (error: any) {
      toast.error("Operation failed. Please try again!");
      if (error.data?.errors) {
        error.data.errors.forEach((error: any) => {
          setError(error.path, {
            type: "manual",
            message: error.msg,
          });
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: CalendarEvent) => {
    const formattedRecord = {
      ...record,
      start: record.start
        ? moment
          .utc(record.start) // Parse as UTC
          .tz("America/Toronto") // Convert to Toronto timezone
          .format("YYYY-MM-DDTHH:mm")
        : "",
      end: record.end
        ? moment
          .utc(record.end)
          .tz("America/Toronto")
          .format("YYYY-MM-DDTHH:mm") // Handle UTC end date
        : "",
      viewerUserIds: (record.viewers || []).map((v) => v.viewer?.id).filter(Boolean),
    };

    reset(formattedRecord as unknown as CalendarEvent);
    setIsEditMode(true);
    setSelectedEventId(record?.id ?? "");
    showModal();
  };

  const handleDelete = (record: CalendarEvent) => {
    setIsModalVisible(true);
    setSelectedEventId(record?.id ?? "");
  };

  const confirmDelete = async () => {
    if (!selectedEventId) return;

    try {
      const response = await deleteCalendarEvent(selectedEventId).unwrap();
      toast.success(response?.message);
      setTableData(tableData.filter((item) => item.id !== selectedEventId));
    } catch (error: any) {
      toast.error(error?.data?.message);
    }
    setIsModalVisible(false);
    setSelectedEventId("");
  };

  // Add row selection configuration
  const rowSelection: TableRowSelection<CalendarEvent> = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  // Add multiple delete handler
  const handleMultipleDelete = () => {
    if (selectedRowKeys.length === 0) {
      toast.error("Please select items to delete");
      return;
    }
    setIsDeleteModalMultipleVisible(true);
  };

  // Add confirm multiple delete function
  const confirmMultipleDelete = async () => {
    console.log(selectedRowKeys);
    try {
      const response = await deleteMultipleCalendarEvents(
        selectedRowKeys
      ).unwrap();
      if (response.status) {
        toast.success(response?.message || "Events deleted successfully!");
        setTableData(
          tableData.filter((item) => !selectedRowKeys.includes(item.id!))
        );
        setSelectedRowKeys([]);
      }
    } catch (error: any) {
      toast.error(error?.data?.message);
    }
    setIsDeleteModalMultipleVisible(false);
  };

  // Table configuration
  const columns: TableColumnsType<CalendarEvent> = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text,record) => (
        <span
          onClick={() => {
            handleEdit(record);
          }}
          className="hover:text-blue-600 cursor-pointer hover:underline"
        >
          {text || "N/A"}
        </span>
      )

    },
    {
      title: "Start Date",
      dataIndex: "start",
      key: "start",
      render: (text) =>
        moment
          .tz(text, "YYYY-MM-DD HH:mm:ss", "UTC")
          .tz("America/Toronto")
          .format("DD MMMM YYYY, hh:mm A"),
    },
    {
      title: "End Date",
      dataIndex: "end",
      key: "end",
      render: (text) =>
        moment
          .tz(text, "YYYY-MM-DD HH:mm:ss", "UTC")
          .tz("America/Toronto")
          .format("DD MMMM YYYY, hh:mm A"),
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      render: (location) => location || "-",
    },
    {
      title: "Total Attendees",
      dataIndex: "attendeeCount",
      key: "attendeeCount",
    },
    {
      title: "Link",
      dataIndex: "uuid",
      key: "uuid",
      render: (uuid) => (
        <button
          className={`${uuid ? "text-green-500" : "text-red-500"}`}
          onClick={() => {
            if (uuid) {
              navigator.clipboard.writeText(
                `${window.location.origin}/event-join/${uuid}`
              );
              toast.success("Link copied to clipboard!");
            }
          }}
        >
          Copy Link
        </button>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (_, record) => {
        const currentDate = new Date();
        const startDate = new Date(record.start);
        const endDate = new Date(record.end);

        let status = "";
        if (startDate > currentDate) {
          status = "Coming";
        } else if (startDate <= currentDate && endDate >= currentDate) {
          status = "Running";
        } else if (endDate < currentDate) {
          status = "Expired";
        }

        return (
          <span
            className={`${status === "Running" ? "text-green-500" : "text-red-500"
              }`}
          >
            {status ? status : "-"}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      dataIndex: "id",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "attendees",
                label: (
                  <Link
                    to={`/dashboard/super-admin/calendar-events/attendees/${record?.uuid}`}
                    className="flex items-center w-full gap-2"
                  >
                    <BsPeople />
                    Attendees
                  </Link>
                ),
              },
              hasPermissionForSlug("edit-calendar-events") && {
                key: "edit",
                label: (
                  <button
                    onClick={() => handleEdit(record)}
                    className="flex items-center w-full gap-2"
                  >
                    <FaRegEdit />
                    Edit
                  </button>
                ),
              },
              hasPermissionForSlug("delete-calendar-events") && {
                key: "delete",
                label: (
                  <button
                    onClick={() => handleDelete(record)}
                    className="flex items-center w-full gap-2"
                  >
                    <MdDelete />
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
      align: "center",
    },
  ];

  if (isLoading) return <TableLoader />;

  const tableSourceData = filteredData?.map(
    (item: CalendarEvent, index: number) => {
      return {
        ...item,
        serial: index + 1,
      };
    }
  );

  // =====================
  // const torontoDate = momentTimezone()
  //   .tz("America/Toronto")
  //   .format("YYYY-MM-DDTHH:mm");

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Calendar Events</h1>
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
          <Segmented
            className="brand-segmented flex-shrink-0"
            value={viewMode}
            onChange={(value) => setViewMode(value as "table" | "calendar")}
            options={[
              { label: "Table", value: "table", icon: <UnorderedListOutlined /> },
              { label: "Calendar", value: "calendar", icon: <CalendarOutlined /> },
            ]}
          />
          <style>{`
            .brand-segmented .ant-segmented-item-selected,
            .brand-segmented .ant-segmented-thumb {
              background-color: #082624 !important;
            }
            .brand-segmented .ant-segmented-item-selected {
              color: #fff !important;
            }
            .event-tooltip-overlay .ant-tooltip-inner {
              background-color: #082624 !important;
              color: #ffffff !important;
              display: block !important;
              -webkit-line-clamp: unset !important;
              overflow: visible !important;
              text-overflow: unset !important;
              max-width: 280px !important;
            }
            .event-tooltip-overlay .ant-tooltip-arrow::before {
              background-color: #082624 !important;
            }
          `}</style>
          {hasPermissionForSlug("create-calendar-events") && (
            <button onClick={showModal} className="primary-btn">Create Event</button>
          )}
          {selectedRowKeys.length > 0 && hasPermissionForSlug("delete-calendar-events") && (
            <button onClick={handleMultipleDelete} className="danger-btn">Delete Selected</button>
          )}
        </div>

        {viewMode === "table" ? (
          <div>
            <Table<CalendarEvent>
              rowSelection={rowSelection}
              rowKey="id"
              scroll={{ x: "max-content" }}
              columns={columns}
              dataSource={tableSourceData}
              pagination={{ pageSize: 20 }}
            />
          </div>
        ) : (
          <div className="p-4 events-calendar-wrap">
            <style>{`
              .events-calendar-wrap .ant-picker-calendar-date-content {
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
              }
            `}</style>
            <Calendar
              cellRender={(value, info) => info.type === "date" ? dateCellRender(value) : info.originNode}
              onSelect={handleDateSelect}
            />
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <ModalMain
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        handleOk={handleSubmit(onSubmit)}
        title={isEditMode ? "Edit Event" : "Create Event"}
        isLoading={loading}
        extraFooterBtn={
          isEditMode ? (
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setIsModalVisible(true);
              }}
              className="danger-btn"
            >
              Delete
            </button>
          ) : undefined
        }
      >
        <form className="space-y-4">
          {/* Title - Full Width */}
          <div className="flex flex-col gap-2">
            <label>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register("title", { required: "Title is required" })}
              type="text"
              className="border p-2 rounded w-full"
            />
            {errors.title && (
              <p className="text-red-500 text-sm">{errors.title.message}</p>
            )}
          </div>

          {/* Start and End DateTime Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label>
                Start Date<span className="text-red-500">*</span>
              </label>
              <input
                {...register("start", { required: "Start time is required" })}
                type="datetime-local"
                className="border p-2 rounded"
              />
              {errors.start && (
                <p className="text-red-500 text-sm">{errors.start.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>
                End Date<span className="text-red-500">*</span>
              </label>
              <input
                {...register("end", { required: "End time is required" })}
                type="datetime-local"
                className="border p-2 rounded"
              />
              {errors.end && (
                <p className="text-red-500 text-sm">{errors.end.message}</p>
              )}
            </div>
          </div>

          {/* Location and Status Row */}

          <div className="flex flex-col gap-2">
            <label>
              Location <span className="text-red-500">*</span>
            </label>
            <input
              {...register("location", { required: "Location is required" })}
              type="text"
              className="border p-2 rounded"
            />
            {errors.location && (
              <p className="text-red-500 text-sm">{errors.location.message}</p>
            )}
          </div>

          {/* Description - Full Width */}
          <div className="flex flex-col gap-2">
            <label>
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("description", {
                required: "Description is required",
              })}
              className="border p-2 rounded w-full"
              rows={3}
            />
            {errors.description && (
              <p className="text-red-500 text-sm">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Share with Agents - Full Width */}
          <div className="flex flex-col gap-2">
            <label>Share with Agents</label>
            <Controller
              name="viewerUserIds"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <Select
                  {...field}
                  mode="multiple"
                  allowClear
                  placeholder="Select agents who can view this event"
                  options={agentOptions}
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                />
              )}
            />
          </div>
        </form>
      </ModalMain>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Deletion"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="confirm" type="primary" danger onClick={confirmDelete}>
            Confirm
          </Button>,
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Cancel
          </Button>,
        ]}
      >
        <p>Are you sure you want to delete this event?</p>
      </Modal>

      {/* Add Multiple Delete Confirmation Modal */}
      <Modal
        title="Confirm Multiple Deletion"
        open={isDeleteModalMultipleVisible}
        onCancel={() => setIsDeleteModalMultipleVisible(false)}
        footer={[
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={confirmMultipleDelete}
          >
            Confirm
          </Button>,
          <Button
            key="cancel"
            onClick={() => setIsDeleteModalMultipleVisible(false)}
          >
            Cancel
          </Button>,
        ]}
      >
        <p>
          Are you sure you want to delete these {selectedRowKeys.length} events?
        </p>
      </Modal>
    </div>
  );
};

export default CalendarEventManagement;
