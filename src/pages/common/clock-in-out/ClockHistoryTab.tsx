// @ts-nocheck
import React, { useMemo, useState } from "react";
import { Table, Card, Select, Modal, Form, Input, DatePicker, Dropdown, Space, Button } from "antd";
import type { Dayjs } from "dayjs";
import { formatDate, parseISO } from "date-fns";
import dayjs from "dayjs";
import type { TableColumnsType, TableProps } from "antd";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "/logo.svg";
import {
  useGetClockHistoryQuery,
  useDeleteClockRecordMutation,
  useDeleteClockRecordsMultipleMutation,
  useUpdateClockOutTimeMutation,
  useForceClockOutMutation,
} from "../../../redux/api/common/clockInOutSlice";
import { HistoryOutlined, CalendarOutlined } from "@ant-design/icons";
import { BsThreeDotsVertical } from "react-icons/bs";
import { MdDelete } from "react-icons/md";
import { FaRegEdit, FaSignOutAlt } from "react-icons/fa";
import TableLoader from "../../../components/loader/TableLoader";

export interface ClockRecord {
  id: number;
  uuid: string;
  action: "clock_in" | "clock_out";
  latitude: string | null;
  longitude: string | null;
  address: string | null;
  distance: number | null;
  isWithinRange: boolean;
  notes: string | null;
  createdAt: string;
  branch?: { id: number; name: string } | null;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    name: string;
    email: string;
    branchId?: number | null;
    branch?: { id: number; name: string } | null;
  };
}

interface ClockHistoryTabProps {
  branchList: any[];
  filteredUserList: any[];
  isSuperAdmin: boolean;
  user: any;
}

const PRIVILEGED_ADMIN_EMAILS = ['admin@dvrealty.ca', 'nabaa@dvrealty.ca', 'superadmin@nomail.com'];

const ClockHistoryTab: React.FC<ClockHistoryTabProps> = ({
  branchList,
  filteredUserList,
  isSuperAdmin,
  user,
}) => {
  const isPrivilegedAdmin = (user?.roleId == 1 || user?.userType === 'superAdmin') && PRIVILEGED_ADMIN_EMAILS.includes(user?.email);
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
  const [historyDateRange, setHistoryDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedDeleteUuid, setSelectedDeleteUuid] = useState<string | null>(null);
  const [isDeleteMultipleModalVisible, setIsDeleteMultipleModalVisible] = useState(false);
  const [isEditDurationModalVisible, setIsEditDurationModalVisible] = useState(false);
  const [editingSession, setEditingSession] = useState<ClockSessionRow | null>(null);
  const [editDurationForm] = Form.useForm();

  const historyStartDate = historyDateRange?.[0]?.format("YYYY-MM-DD");
  const historyEndDate = historyDateRange?.[1]?.format("YYYY-MM-DD");

  const { data: historyData, isLoading: isHistoryLoading } = useGetClockHistoryQuery({
    page: currentPage,
    limit: 50,
    filterUserId: selectedUserId,
    filterBranchId: selectedBranchId,
    startDate: historyStartDate ?? undefined,
    endDate: historyEndDate ?? undefined,
  });

  const [deleteClockRecord, { isLoading: isDeleteClockLoading }] = useDeleteClockRecordMutation();
  const [deleteClockRecordsMultiple, { isLoading: isDeleteMultipleLoading }] =
    useDeleteClockRecordsMultipleMutation();
  const [updateClockOutTime, { isLoading: isUpdateClockOutLoading }] = useUpdateClockOutTimeMutation();
  const [forceClockOut, { isLoading: isForceClockingOut }] = useForceClockOutMutation();
  const [isForceClockOutModalVisible, setIsForceClockOutModalVisible] = useState(false);
  const [forceClockOutTarget, setForceClockOutTarget] = useState<ClockSessionRow | null>(null);

  const tableData = useMemo(() => historyData?.data?.records || [], [historyData]);
  const isSuperAdminFromHistory = historyData?.data?.isSuperAdmin || false;

  type ClockSessionRow = {
    key: string;
    user: ClockRecord["user"];
    branch?: ClockRecord["branch"] | null;
    clockInRecord?: ClockRecord | null;
    clockOutRecord?: ClockRecord | null;
    clockInAt?: string | null;
    clockOutAt?: string | null;
    distanceAverage?: number | null;
    address?: string | null;
    notes?: string | null;
  };

  const sessionTableData: ClockSessionRow[] = useMemo(() => {
    const records = [...(tableData || [])].sort((a: ClockRecord, b: ClockRecord) => {
      const timeDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (timeDiff !== 0) return timeDiff;
      if (a.action === b.action) return 0;
      return a.action === "clock_in" ? -1 : 1;
    });

    const latestClockInByUser: Record<number, ClockRecord | null> = {};
    const sessions: ClockSessionRow[] = [];

    records.forEach((record: ClockRecord) => {
      const userId = record.user?.id;
      if (!userId) return;

      if (record.action === "clock_in") {
        latestClockInByUser[userId] = record;
        return;
      }

      if (record.action !== "clock_out") return;

      const clockInRecord = latestClockInByUser[userId];
      const clockOutRecord = record;

      const distanceValues = [clockInRecord?.distance, clockOutRecord?.distance].filter(
        (d): d is number => typeof d === "number" && Number.isFinite(d)
      );
      const distanceAverage =
        distanceValues.length > 0
          ? distanceValues.reduce((sum, d) => sum + d, 0) / distanceValues.length
          : null;

      const key = String(clockOutRecord.uuid || clockInRecord?.uuid || `${userId}-${clockOutRecord.createdAt}`);
      sessions.push({
        key,
        user: clockOutRecord.user,
        branch: clockOutRecord.branch ?? clockInRecord?.branch ?? null,
        clockInRecord: clockInRecord ?? null,
        clockOutRecord,
        clockInAt: clockInRecord?.createdAt ?? null,
        clockOutAt: clockOutRecord.createdAt ?? null,
        distanceAverage,
        address: clockOutRecord.address ?? clockInRecord?.address ?? null,
        notes: clockOutRecord.notes ?? clockInRecord?.notes ?? null,
      });

      latestClockInByUser[userId] = null;
    });

    Object.entries(latestClockInByUser).forEach(([userIdStr, clockInRecord]) => {
      if (!clockInRecord) return;
      const userId = Number(userIdStr);
      const key = String(clockInRecord.uuid || `${userId}-${clockInRecord.createdAt}`);
      sessions.push({
        key,
        user: clockInRecord.user,
        branch: clockInRecord.branch ?? null,
        clockInRecord,
        clockOutRecord: null,
        clockInAt: clockInRecord.createdAt ?? null,
        clockOutAt: null,
        distanceAverage:
          typeof clockInRecord.distance === "number" && Number.isFinite(clockInRecord.distance)
            ? clockInRecord.distance
            : null,
        address: clockInRecord.address ?? null,
        notes: clockInRecord.notes ?? null,
      });
    });

    sessions.sort((a, b) => {
      const aTime = new Date(a.clockOutAt || a.clockInAt || 0).getTime();
      const bTime = new Date(b.clockOutAt || b.clockInAt || 0).getTime();
      return bTime - aTime;
    });

    return sessions;
  }, [tableData]);

  const handleUserFilterChange = (value: string) => {
    if (value === "all") setSelectedUserId(undefined);
    else setSelectedUserId(parseInt(value));
    setCurrentPage(1);
  };

  const handleBranchFilterChange = (value: string) => {
    if (value === "all" || value === undefined || value === "") setSelectedBranchId(undefined);
    else setSelectedBranchId(parseInt(value, 10));
    setCurrentPage(1);
  };

  const handleHistoryDateRangeChange = (dates: null | [Dayjs | null, Dayjs | null]) => {
    if (dates && dates[0] && dates[1]) setHistoryDateRange([dates[0], dates[1]]);
    else setHistoryDateRange(null);
    setCurrentPage(1);
  };

  const handleTableChange = (page: number) => setCurrentPage(page);

  const handleDeleteClockRecord = (uuid: string) => {
    setSelectedDeleteUuid(uuid);
    setIsDeleteModalVisible(true);
  };

  const confirmDeleteClockRecord = async () => {
    if (!selectedDeleteUuid) return;
    try {
      const response = await deleteClockRecord(selectedDeleteUuid).unwrap();
      toast.success(response?.message || "Clock record deleted successfully.");
      setIsDeleteModalVisible(false);
      setSelectedDeleteUuid(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete clock record. Please try again.");
    }
  };

  const cancelDeleteClockRecord = () => {
    setIsDeleteModalVisible(false);
    setSelectedDeleteUuid(null);
  };

  const handleOpenEditDuration = (session: ClockSessionRow) => {
    setEditingSession(session);
    editDurationForm.setFieldsValue({
      clockInCreatedAt: session.clockInRecord?.createdAt ? dayjs(session.clockInRecord.createdAt) : null,
      clockOutCreatedAt: session.clockOutRecord?.createdAt ? dayjs(session.clockOutRecord.createdAt) : null,
      address: session.address ?? "",
      notes: session.notes ?? "",
      latitude: session.clockOutRecord?.latitude ?? session.clockInRecord?.latitude ?? "",
      longitude: session.clockOutRecord?.longitude ?? session.clockInRecord?.longitude ?? "",
    });
    setIsEditDurationModalVisible(true);
  };

  const handleSaveEditDuration = async () => {
    if (!editingSession) {
      toast.error("Invalid record.");
      return;
    }
    try {
      const values = await editDurationForm.validateFields();
      const sharedPayload = {
        address: values.address != null && values.address !== "" ? values.address : null,
        notes: values.notes != null && values.notes !== "" ? values.notes : null,
        latitude: values.latitude != null && values.latitude !== "" ? String(values.latitude) : null,
        longitude: values.longitude != null && values.longitude !== "" ? String(values.longitude) : null,
      };
      const promises: Promise<any>[] = [];
      if (editingSession.clockInRecord?.uuid && values.clockInCreatedAt) {
        const d = dayjs.isDayjs(values.clockInCreatedAt) ? values.clockInCreatedAt : dayjs(values.clockInCreatedAt);
        if (!d?.isValid()) { toast.error("Please select a valid clock-in date and time."); return; }
        promises.push(updateClockOutTime({ uuid: editingSession.clockInRecord.uuid, body: { createdAt: d.toISOString(), ...sharedPayload } }).unwrap());
      }
      if (editingSession.clockOutRecord?.uuid && values.clockOutCreatedAt) {
        const d = dayjs.isDayjs(values.clockOutCreatedAt) ? values.clockOutCreatedAt : dayjs(values.clockOutCreatedAt);
        if (!d?.isValid()) { toast.error("Please select a valid clock-out date and time."); return; }
        promises.push(updateClockOutTime({ uuid: editingSession.clockOutRecord.uuid, body: { createdAt: d.toISOString(), ...sharedPayload } }).unwrap());
      }
      await Promise.all(promises);
      toast.success("Clock record updated successfully.");
      setIsEditDurationModalVisible(false);
      setEditingSession(null);
      editDurationForm.resetFields();
    } catch (error: any) {
      if (error?.errorFields) return;
      toast.error(error?.data?.message || error?.data?.error || "Failed to update clock record.");
    }
  };

  const cancelEditDuration = () => {
    setIsEditDurationModalVisible(false);
    setEditingSession(null);
    editDurationForm.resetFields();
  };

  const handleDeleteMultipleClick = () => {
    if (selectedRowKeys.length === 0) {
      toast.error("Please select clock records to delete.");
      return;
    }
    setIsDeleteMultipleModalVisible(true);
  };

  const confirmDeleteMultiple = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      const sessionKeys = new Set(selectedRowKeys.map((k) => String(k)));
      const uuids = sessionTableData
        .filter((s) => sessionKeys.has(String(s.key)))
        .flatMap((s) => [s.clockInRecord?.uuid, s.clockOutRecord?.uuid])
        .filter(Boolean)
        .map((u) => String(u));
      const response = await deleteClockRecordsMultiple(uuids).unwrap();
      toast.success(response?.message || "Clock records deleted successfully.");
      setIsDeleteMultipleModalVisible(false);
      setSelectedRowKeys([]);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete clock records. Please try again.");
    }
  };

  const cancelDeleteMultiple = () => setIsDeleteMultipleModalVisible(false);

  const handleForceClockOutClick = (record: ClockSessionRow) => {
    setForceClockOutTarget(record);
    setIsForceClockOutModalVisible(true);
  };

  const confirmForceClockOut = async () => {
    if (!forceClockOutTarget?.user?.id) return;
    try {
      const response = await forceClockOut({ userId: forceClockOutTarget.user.id }).unwrap();
      if (response.status) {
        const name = forceClockOutTarget.user?.name || forceClockOutTarget.user?.email || "User";
        toast.success(`${name} has been clocked out successfully`);
      } else {
        toast.error(response.message || "Failed to clock out user");
      }
    } catch (error: any) {
      toast.error(error.data?.message || "Failed to clock out user");
    } finally {
      setIsForceClockOutModalVisible(false);
      setForceClockOutTarget(null);
    }
  };

  type TableRowSelection<T> = TableProps<T>["rowSelection"];
  const rowSelection: TableRowSelection<ClockSessionRow> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys || []),
  };

  const formatDurationFromMinutes = (totalMinutes: number): string => {
    const safeMinutes = Math.max(0, Math.floor(totalMinutes || 0));
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleDownloadHistoryReport = () => {
    try {
      const records = [...tableData].sort((a: ClockRecord, b: ClockRecord) => {
        const timeDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (timeDiff !== 0) return timeDiff;
        if (a.action === b.action) return 0;
        return a.action === "clock_in" ? -1 : 1;
      });

      const latestClockInByUser: Record<number, ClockRecord | null> = {};
      const sessions: Array<{
        userName: string;
        dateLabel: string;
        clockIn: string;
        clockOut: string;
        durationMinutes: number;
        averageDistanceText: string;
      }> = [];

      records.forEach((record: ClockRecord) => {
        const userId = record.user?.id;
        if (!userId) return;
        const userName =
          record.user?.name ||
          `${record.user?.firstName || ""} ${record.user?.lastName || ""}`.trim() ||
          record.user?.email ||
          "N/A";

        if (record.action === "clock_in") {
          latestClockInByUser[userId] = record;
          return;
        }

        const clockInRecord = latestClockInByUser[userId];
        if (!clockInRecord || record.action !== "clock_out") return;

        const inTime = dayjs(clockInRecord.createdAt);
        const outTime = dayjs(record.createdAt);
        const diffSeconds = Math.max(0, outTime.diff(inTime, "second"));
        const diffMinutes = Math.round(diffSeconds / 60);
        const distanceValues = [clockInRecord.distance, record.distance].filter(
          (d): d is number => typeof d === "number" && Number.isFinite(d)
        );
        const averageDistance =
          distanceValues.length > 0
            ? distanceValues.reduce((sum, d) => sum + d, 0) / distanceValues.length
            : null;
        sessions.push({
          userName,
          dateLabel: outTime.format("MMM D"),
          clockIn: inTime.format("h:mm A"),
          clockOut: outTime.format("h:mm A"),
          durationMinutes: diffMinutes,
          averageDistanceText: averageDistance != null ? `${Math.round(averageDistance)}m` : "N/A",
        });

        latestClockInByUser[userId] = null;
      });

      if (sessions.length === 0) {
        toast.error("No clock-in/out sessions found for the current filters.");
        return;
      }

      const groupedByUser: Record<string, typeof sessions> = {};
      sessions.forEach((s) => {
        if (!groupedByUser[s.userName]) groupedByUser[s.userName] = [];
        groupedByUser[s.userName].push(s);
      });

      const dateRangeText =
        historyDateRange?.[0] && historyDateRange?.[1]
          ? `${historyDateRange[0].format("MMMM D, YYYY")} - ${historyDateRange[1].format("MMMM D, YYYY")}`
          : "All dates";

      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const tableLeftX = 14;
      const tableRightX = pageWidth - 14;
      const logoWidth = 76;
      const logoHeight = 20;
      const logoX = tableRightX - logoWidth;
      const logoY = 12;
      doc.addImage(logo, "PNG", logoX, logoY, logoWidth, logoHeight);
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);
      doc.text("ANS RealStateCRM Inc.", tableRightX, 42, { align: "right" });
      doc.setFontSize(12);
      doc.setTextColor(20, 20, 20);
      doc.text(`Timesheets - ${dateRangeText}`, tableLeftX, 38);

      const bodyRows: any[] = [];
      let grandTotalMinutes = 0;

      Object.entries(groupedByUser).forEach(([userName, userSessions]) => {
        const userTotalMinutes = userSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
        grandTotalMinutes += userTotalMinutes;

        bodyRows.push([
          { content: String(userName).toUpperCase(), colSpan: 6, styles: { fontStyle: "bold" } },
        ]);

        userSessions.forEach((s) => {
          bodyRows.push([
            s.userName,
            s.dateLabel,
            s.clockIn,
            s.clockOut,
            formatDurationFromMinutes(s.durationMinutes),
            s.averageDistanceText,
          ]);
        });

        bodyRows.push([
          { content: "", colSpan: 4 },
          { content: formatDurationFromMinutes(userTotalMinutes), styles: { fontStyle: "bold" } },
          { content: "" },
        ]);
      });

      bodyRows.push([
        { content: "TOTAL", colSpan: 4, styles: { fontStyle: "bold" } },
        { content: formatDurationFromMinutes(grandTotalMinutes), styles: { fontStyle: "bold" } },
        { content: "" },
      ]);

      autoTable(doc, {
        startY: 58,
        head: [[
          "PREFERRED NAME",
          "DATE",
          "CLOCK IN TIME",
          "CLOCK OUT TIME",
          "SHIFT DURATION",
          "DIFFERENCE",
        ]],
        body: bodyRows,
        styles: { fontSize: 8, cellPadding: 4, textColor: [70, 85, 105], overflow: "linebreak" },
        headStyles: { fillColor: [229, 231, 235], textColor: [71, 85, 105], fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: 170 },
          1: { cellWidth: 95 },
          2: { cellWidth: 110 },
          3: { cellWidth: 110 },
          4: { cellWidth: 120 },
          5: { cellWidth: 120 },
        },
        margin: { left: tableLeftX, right: 14 },
        didDrawPage: () => {
          doc.setDrawColor(230, 230, 230);
          doc.line(tableLeftX, 48, tableRightX, 48);
        },
      });

      const fileRange =
        historyDateRange?.[0] && historyDateRange?.[1]
          ? `${historyDateRange[0].format("YYYYMMDD")}-${historyDateRange[1].format("YYYYMMDD")}`
          : dayjs().format("YYYYMMDD");
      doc.save(`clock-history-timesheet-${fileRange}.pdf`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate report.");
    }
  };

  const columns: TableColumnsType<ClockSessionRow> = [
    ...(isSuperAdminFromHistory
      ? [
          {
            title: "User",
            key: "user",
            width: 200,
            render: (_: any, record: ClockSessionRow) => {
              const userName =
                record.user?.name ||
                `${record.user?.firstName || ""} ${record.user?.lastName || ""}`.trim() ||
                record.user?.email ||
                "N/A";
              return <span>{userName}</span>;
            },
          },
        ]
      : []),
    {
      title: "Branch",
      key: "branch",
      width: 140,
      render: (_: unknown, record: ClockSessionRow) => (
        <span>{record.branch?.name ?? record.user?.branch?.name ?? "—"}</span>
      ),
    },
    {
      title: "Clock In",
      key: "clockInAt",
      width: 180,
      render: (_: unknown, record: ClockSessionRow) => (
        <span>
          {record.clockInAt ? formatDate(parseISO(record.clockInAt), "dd MMM yyyy, hh:mm a") : "—"}
        </span>
      ),
    },
    {
      title: "Clock Out",
      key: "clockOutAt",
      width: 180,
      render: (_: unknown, record: ClockSessionRow) => (
        <span>
          {record.clockOutAt ? formatDate(parseISO(record.clockOutAt), "dd MMM yyyy, hh:mm a") : "—"}
        </span>
      ),
    },
    {
      title: "Duration",
      key: "duration",
      width: 120,
      render: (_: any, record: ClockSessionRow) => {
        if (!record.clockInAt || !record.clockOutAt) return <span>-</span>;
        const inTime = parseISO(record.clockInAt);
        const outTime = parseISO(record.clockOutAt);
        const diffMs = Math.max(0, outTime.getTime() - inTime.getTime());
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) return <span>{hours}h {minutes}m</span>;
        return <span>{minutes}m</span>;
      },
    },
    {
      title: "Distance",
      key: "distance",
      width: 100,
      render: (_: unknown, record: ClockSessionRow) => (
        <span>
          {typeof record.distanceAverage === "number" && Number.isFinite(record.distanceAverage)
            ? `${Math.round(record.distanceAverage)}m`
            : "N/A"}
        </span>
      ),
    },
    {
      title: "Address",
      key: "address",
      render: (_: unknown, record: ClockSessionRow) => (
        <span className="truncate max-w-xs">{record.address || "N/A"}</span>
      ),
    },
    {
      title: "Notes",
      key: "notes",
      render: (_: unknown, record: ClockSessionRow) => (
        <span className="truncate max-w-xs">{record.notes || "-"}</span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      fixed: "right",
      align: "center",
      render: (_: unknown, record: ClockSessionRow) => (
        <Dropdown
          menu={{
            items: [
              ...(isSuperAdmin && !record.clockOutRecord
                ? [
                    {
                      key: "force-clock-out",
                      label: (
                        <button
                          type="button"
                          onClick={() => handleForceClockOutClick(record)}
                          className="flex items-center gap-2 w-full text-orange-600"
                        >
                          <FaSignOutAlt size={14} />
                          Force Clock Out
                        </button>
                      ),
                    },
                  ]
                : []),
              ...(isPrivilegedAdmin
                ? [
                    {
                      key: "updateDuration",
                      label: (
                        <button
                          type="button"
                          onClick={() => handleOpenEditDuration(record)}
                          className="flex items-center gap-2 w-full"
                          disabled={!record.clockOutRecord && !record.clockInRecord}
                        >
                          <FaRegEdit size={14} />
                          Edit
                        </button>
                      ),
                    },
                    {
                      key: "delete",
                      label: (
                        <button
                          type="button"
                          onClick={() => {
                            const uuids = [record.clockInRecord?.uuid, record.clockOutRecord?.uuid].filter(Boolean);
                            if (uuids.length > 1) {
                              setSelectedRowKeys([record.key]);
                              setIsDeleteMultipleModalVisible(true);
                              return;
                            }
                            if (uuids.length === 1) handleDeleteClockRecord(String(uuids[0]));
                          }}
                          className="flex items-center gap-2 w-full"
                        >
                          <MdDelete size={14} />
                          Delete
                        </button>
                      ),
                    },
                  ]
                : []),
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
    },
  ];

  return (
    <>
      <Card
        title={
          <div className="flex items-center justify-between">
            <span>
              <HistoryOutlined className="mr-2" />
              Clock History
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="small"
                type={isDateFilterOpen ? "" : "default"}
                icon={<CalendarOutlined />}
                onClick={() => setIsDateFilterOpen((v) => !v)}
              />
              {isDateFilterOpen && (
                <DatePicker.RangePicker
                  value={historyDateRange}
                  onChange={handleHistoryDateRangeChange}
                  allowClear
                  format="DD MMM YYYY"
                  className="w-full sm:w-auto"
                  style={{ fontWeight: 400 }}
                />
              )}
              {isSuperAdmin && (
                <>
                  <Select
                    style={{ width: 200 }}
                    placeholder="Filter by branch"
                    value={selectedBranchId != null && selectedBranchId !== undefined ? String(selectedBranchId) : "all"}
                    onChange={handleBranchFilterChange}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
                    }
                    options={[
                      { value: "all", label: "All Branches" },
                      ...(branchList?.map((b: any) => {
                        const id = b.id ?? b.branchId;
                        return { value: String(id), label: b.name ?? b.branchName ?? `Branch ${id}` };
                      }) ?? []),
                    ]}
                  />
                  <Select
                    style={{ width: 250 }}
                    placeholder="Filter by user"
                    value={selectedUserId ? selectedUserId.toString() : "all"}
                    onChange={handleUserFilterChange}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
                    }
                    options={[
                      { value: "all", label: "All Users" },
                      ...(filteredUserList?.map((userItem: any) => {
                        const userId = userItem.user?.id || userItem.id;
                        const userName =
                          userItem.user?.name ||
                          `${userItem.user?.firstName || ""} ${userItem.user?.lastName || ""}`.trim() ||
                          userItem.name ||
                          `${userItem.firstName || ""} ${userItem.lastName || ""}`.trim() ||
                          userItem.user?.email ||
                          userItem.email ||
                          "N/A";
                        return { value: userId.toString(), label: userName };
                      }) ?? []),
                    ]}
                  />
                </>
              )}
              <button
                type="button"
                className="primary-btn flex items-center gap-2"
                onClick={handleDownloadHistoryReport}
              >
                Download Report
              </button>
              <button
                type="button"
                className="danger-btn flex items-center gap-2"
                onClick={handleDeleteMultipleClick}
                disabled={selectedRowKeys.length === 0}
              >
                <MdDelete />
                <span>
                  Delete Selected {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ""}
                </span>
              </button>
            </div>
          </div>
        }
      >
        {isHistoryLoading ? (
          <TableLoader />
        ) : (
          <Table
            bordered
            size="middle"
            scroll={{ x: "max-content" }}
            rowSelection={rowSelection}
            columns={columns}
            dataSource={sessionTableData}
            pagination={{
              current: currentPage,
              pageSize: 50,
              total: historyData?.data?.pagination?.total || 0,
              showTotal: (total) => `Total ${total} records`,
              onChange: handleTableChange,
            }}
            rowKey="key"
          />
        )}
      </Card>

      <Modal
        title="Confirm Deletion"
        open={isDeleteModalVisible}
        onCancel={cancelDeleteClockRecord}
        footer={[
          <button key="cancel" className="cancel-btn mx-2" onClick={cancelDeleteClockRecord}>
            Cancel
          </button>,
          <button
            key="confirm"
            className="danger-btn mx-2"
            onClick={confirmDeleteClockRecord}
            disabled={isDeleteClockLoading}
          >
            {isDeleteClockLoading ? "Deleting..." : "Delete"}
          </button>,
        ]}
      >
        <p>Are you sure you want to delete this clock record?</p>
      </Modal>

      <Modal
        title="Edit Clock Session"
        open={isEditDurationModalVisible}
        onOk={handleSaveEditDuration}
        onCancel={cancelEditDuration}
        confirmLoading={isUpdateClockOutLoading}
        okText="Update"
        cancelText="Cancel"
        width={520}
      >
        <Form form={editDurationForm} layout="vertical" className="mt-4">
          {editingSession?.clockInRecord && (
            <Form.Item
              name="clockInCreatedAt"
              label="Clock-in date & time"
              rules={[{ required: true, message: "Please select clock-in date and time." }]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD h:mm A"
                use12Hours
                style={{ width: "100%" }}
                placeholder="Select clock-in date and time"
              />
            </Form.Item>
          )}
          {editingSession?.clockOutRecord && (
            <Form.Item
              name="clockOutCreatedAt"
              label="Clock-out date & time"
              rules={[{ required: true, message: "Please select clock-out date and time." }]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD h:mm A"
                use12Hours
                style={{ width: "100%" }}
                placeholder="Select clock-out date and time"
              />
            </Form.Item>
          )}
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} placeholder="Address" allowClear />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Notes" allowClear />
          </Form.Item>
          <Form.Item name="latitude" label="Latitude">
            <Input placeholder="Latitude" allowClear />
          </Form.Item>
          <Form.Item name="longitude" label="Longitude">
            <Input placeholder="Longitude" allowClear />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Confirm Deletion"
        open={isDeleteMultipleModalVisible}
        onCancel={cancelDeleteMultiple}
        footer={[
          <button key="cancel" className="cancel-btn mx-2" onClick={cancelDeleteMultiple}>
            Cancel
          </button>,
          <button
            key="confirm"
            className="danger-btn mx-2"
            onClick={confirmDeleteMultiple}
            disabled={isDeleteMultipleLoading}
          >
            {isDeleteMultipleLoading ? "Deleting..." : "Delete"}
          </button>,
        ]}
      >
        <p>
          Are you sure you want to delete {selectedRowKeys.length} selected clock record
          {selectedRowKeys.length !== 1 ? "s" : ""}?
        </p>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2 text-orange-600">
            <FaSignOutAlt />
            Force Clock Out
          </div>
        }
        open={isForceClockOutModalVisible}
        onCancel={() => { setIsForceClockOutModalVisible(false); setForceClockOutTarget(null); }}
        footer={[
          <button key="cancel" className="cancel-btn mx-2" onClick={() => { setIsForceClockOutModalVisible(false); setForceClockOutTarget(null); }}>
            Cancel
          </button>,
          <button
            key="confirm"
            className="danger-btn mx-2"
            onClick={confirmForceClockOut}
            disabled={isForceClockingOut}
          >
            {isForceClockingOut ? "Clocking Out..." : "Clock Out Now"}
          </button>,
        ]}
      >
        {forceClockOutTarget && (
          <div className="py-2">
            <p className="text-gray-700">
              Are you sure you want to force clock out{" "}
              <strong>{forceClockOutTarget.user?.name || forceClockOutTarget.user?.email || "this user"}</strong>?
            </p>
            <p className="text-orange-500 text-sm mt-2">
              ⚠ This will immediately end their active clock-in session.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ClockHistoryTab;
