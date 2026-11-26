/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { Modal, Button, Calendar, Tag, Tooltip, Select } from "antd";
import { FaSearch, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import TableLoader from "../../../../../components/loader/TableLoader";
import ModalMain from "../../../../../components/ui/Modal";
import { Controller, useForm } from "react-hook-form";
import moment from "moment-timezone";
import { useAppSelector } from "../../../../../redux/hooks";

import {
  useGetCalendarNotesQuery,
  useCreateUpdateCalendarNoteMutation,
  useDeleteCalendarNoteMutation,
  useGetBranchAdminsForCalendarNotesQuery,
} from "../../../../../redux/api/superadmin/calendar/calendarNoteSlice";

interface CalendarNoteViewer {
  viewer: { id: number; firstName?: string; lastName?: string; name?: string; email?: string };
}

interface CalendarNote {
  id?: string;
  uuid?: string;
  note: string;
  date: string;
  owner?: { id?: number; firstName?: string; lastName?: string };
  createdAt?: string;
  viewers?: CalendarNoteViewer[];
  viewerUserIds?: number[];
}

const CalendarNoteManagement = () => {
  const { user } = useAppSelector((state: any) => state.user);
  const isAdminRole = user?.userType === "superAdmin";
  const isOwnNote = (note: CalendarNote) => note?.owner?.id === user?.id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedNoteUuid, setSelectedNoteUuid] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  const { data, isLoading, refetch } = useGetCalendarNotesQuery("");
  const [createUpdateCalendarNote] = useCreateUpdateCalendarNoteMutation();
  const [deleteCalendarNote] = useDeleteCalendarNoteMutation();
  const { data: branchAdminsData } = useGetBranchAdminsForCalendarNotesQuery(undefined, {
    skip: !isAdminRole,
  });
  const branchAdminOptions = (branchAdminsData?.data?.branchAdmins || []).map((admin: any) => ({
    value: admin.id,
    label: admin.name || `${admin.firstName ?? ""} ${admin.lastName ?? ""}`.trim() || admin.email,
  }));

  const {
    register,
    control,
    formState: { errors },
    reset,
    getValues,
    setError,
    handleSubmit,
  } = useForm<CalendarNote>();

  const tableData: CalendarNote[] = data?.data?.calendarNotes || [];

  const filteredData = tableData.filter((record) =>
    String(record.note).toLowerCase().includes(searchText.toLowerCase())
  );

  const notesByDate = useMemo(() => {
    const map: Record<string, CalendarNote[]> = {};
    filteredData.forEach((note) => {
      if (!note.date) return;
      const dateKey = moment.utc(note.date).format("YYYY-MM-DD");
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(note);
    });
    return map;
  }, [filteredData]);

  const showModal = () => setIsModalOpen(true);

  const resetForm = () => {
    reset({ note: "", date: "", viewerUserIds: [] });
    setIsEditMode(false);
    setSelectedNoteUuid("");
  };

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
  };

  const onSubmit = async () => {
    const formValues = getValues();
    setLoading(true);
    try {
      const response = await createUpdateCalendarNote({
        uuid: isEditMode ? selectedNoteUuid : null,
        data: formValues,
      }).unwrap();

      if (response.status) {
        toast.success(isEditMode ? "Note updated successfully!" : "Note created successfully!");
        setIsModalOpen(false);
        resetForm();
        refetch();
      }
    } catch (error: any) {
      toast.error("Operation failed. Please try again!");
      if (error.data?.errors) {
        error.data.errors.forEach((err: any) => {
          setError(err.path, { type: "manual", message: err.msg });
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: CalendarNote) => {
    if (!isOwnNote(record)) return;
    reset({
      note: record.note,
      date: record.date ? moment.utc(record.date).format("YYYY-MM-DD") : "",
      viewerUserIds: (record.viewers || []).map((v) => v.viewer?.id).filter(Boolean),
    });
    setIsEditMode(true);
    setSelectedNoteUuid(record?.uuid ?? "");
    showModal();
  };

  const handleDeleteClick = () => {
    setIsModalOpen(false);
    setIsModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedNoteUuid) return;
    try {
      const response = await deleteCalendarNote(selectedNoteUuid).unwrap();
      toast.success(response?.message);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message);
    }
    setIsModalVisible(false);
    resetForm();
  };

  const handleDateSelect = (date: any) => {
    if (!isAdminRole) return;
    const dateKey = date.format("YYYY-MM-DD");
    if (notesByDate[dateKey]?.length) return;

    reset({ note: "", date: dateKey, viewerUserIds: [] });
    setIsEditMode(false);
    setSelectedNoteUuid("");
    showModal();
  };

  const dateCellRender = (value: any) => {
    const dateKey = value.format("YYYY-MM-DD");
    const dayNotes = notesByDate[dateKey];
    if (!dayNotes?.length) return null;

    return (
      <div className="flex flex-col gap-1 overflow-hidden">
        {dayNotes.map((note) => (
          <Tooltip
            key={note.uuid}
            color="#0f766e"
            rootClassName="note-tooltip-overlay"
            styles={{
              body: {
                backgroundColor: "#0f766e",
                padding: "10px 12px",
                borderRadius: 8,
                boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
              },
            }}
            title={
              <div style={{ minWidth: 200, maxWidth: 280, color: "#ffffff", fontSize: 12, lineHeight: 1.5 }}>
                {note.note}
              </div>
            }
          >
            <Tag
              color="#0f766e"
              className="m-0 truncate cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(note);
              }}
            >
              {note.note}
            </Tag>
          </Tooltip>
        ))}
      </div>
    );
  };

  if (isLoading) return <TableLoader />;

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Calendar Notes</h1>
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
          {isAdminRole && (
            <button onClick={() => { resetForm(); showModal(); }} className="primary-btn">Create Note</button>
          )}
        </div>

        <div className="p-4 note-calendar-wrap">
          <style>{`
            .note-calendar-wrap .ant-picker-calendar-date-content {
              height: auto !important;
              max-height: none !important;
              overflow: visible !important;
            }
            .note-tooltip-overlay .ant-tooltip-inner {
              background-color: #0f766e !important;
              color: #ffffff !important;
              display: block !important;
              -webkit-line-clamp: unset !important;
              overflow: visible !important;
              text-overflow: unset !important;
              max-width: 280px !important;
            }
            .note-tooltip-overlay .ant-tooltip-arrow::before {
              background-color: #0f766e !important;
            }
          `}</style>
          <Calendar
            cellRender={(value, info) => (info.type === "date" ? dateCellRender(value) : info.originNode)}
            onSelect={handleDateSelect}
          />
        </div>
      </div>

      <ModalMain
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        handleOk={handleSubmit(onSubmit)}
        title={isEditMode ? "Edit Note" : "Create Note"}
        isLoading={loading}
        extraFooterBtn={
          isEditMode ? (
            <button type="button" onClick={handleDeleteClick} className="danger-btn">
              Delete
            </button>
          ) : undefined
        }
      >
        <form className="space-y-4">
          <div className="flex flex-col gap-2">
            <label>
              Date <span className="text-red-500">*</span>
            </label>
            <input
              {...register("date", { required: "Date is required" })}
              type="date"
              className="border p-2 rounded w-full"
            />
            {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label>
              Note <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("note", { required: "Note is required" })}
              className="border p-2 rounded w-full"
              rows={4}
            />
            {errors.note && <p className="text-red-500 text-sm">{errors.note.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label>Share with Admins</label>
            <Controller
              name="viewerUserIds"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <Select
                  {...field}
                  mode="multiple"
                  allowClear
                  placeholder="Select admins who can view this note"
                  options={branchAdminOptions}
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                />
              )}
            />
          </div>
        </form>
      </ModalMain>

      <Modal
        title="Confirm Deletion"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="confirm" type="primary" danger onClick={confirmDelete}>Confirm</Button>,
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>Cancel</Button>,
        ]}
      >
        <p>Are you sure you want to delete this note?</p>
      </Modal>
    </div>
  );
};

export default CalendarNoteManagement;
