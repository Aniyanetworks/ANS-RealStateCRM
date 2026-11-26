// @ts-nocheck
import React, { useState, useMemo } from "react";
import {
  Card,
  Button,
  Calendar,
  Select,
  Modal,
  Form,
  Checkbox,
  DatePicker,
  TimePicker,
} from "antd";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import {
  useGetRoutineListQuery,
  useCreateRoutineMutation,
  useUpdateRoutineMutation,
  useDeleteRoutineMutation,
  useDeleteRoutinesMultipleMutation,
  useGetShiftListQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
  useDeleteShiftsMultipleMutation,
} from "../../../redux/api/common/clockInOutSlice";
import { CalendarOutlined } from "@ant-design/icons";
import { MdDelete } from "react-icons/md";
import TableLoader from "../../../components/loader/TableLoader";

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PRIVILEGED_ADMIN_EMAILS = new Set([
  "admin@dvrealty.ca",
  "nabaa@dvrealty.ca",
  "superadmin@nomail.com",
]);

const formatTime12h = (hhmm: string | null | undefined): string => {
  if (!hhmm || !String(hhmm).trim()) return "";
  const d = dayjs(`2000-01-01 ${String(hhmm).trim()}`, "YYYY-MM-DD HH:mm", true);
  if (!d.isValid()) return String(hhmm);
  return d.format("h:mm A");
};

const getShiftDurationHours = (
  startTime: string | null | undefined,
  endTime: string | null | undefined
): string => {
  if (!startTime || !endTime) return "";
  const start = dayjs(`2000-01-01 ${String(startTime).trim()}`, "YYYY-MM-DD HH:mm", true);
  const end = dayjs(`2000-01-01 ${String(endTime).trim()}`, "YYYY-MM-DD HH:mm", true);
  if (!start.isValid() || !end.isValid()) return "";
  const hours = end.diff(start, "minute") / 60;
  if (hours <= 0) return "";
  if (Number.isInteger(hours)) return `${hours}h`;
  return `${hours.toFixed(1)}h`;
};

const escapeHtml = (value: string | number | null | undefined): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

interface ScheduleTabProps {
  branchList: any[];
  filteredUserList: any[];
  user: any;
  isSuperAdmin: boolean;
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({
  branchList,
  filteredUserList,
  user,
  isSuperAdmin,
}) => {
  const [scheduleMode, setScheduleMode] = useState<"weekly" | "date" | "month">("date");
  const [scheduleDateRange, setScheduleDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [dateFilterExpanded, setDateFilterExpanded] = useState(false);
  const [scheduleMonthStart, setScheduleMonthStart] = useState<dayjs.Dayjs>(() =>
    dayjs().startOf("month")
  );
  const [scheduleWeekStart, setScheduleWeekStart] = useState<dayjs.Dayjs>(() => {
    const today = dayjs();
    const day = today.day();
    const mondayOffset = (day + 6) % 7;
    return today.subtract(mondayOffset, "day").startOf("day");
  });
  const [routinePage, setRoutinePage] = useState(1);
  const [routineBranchId, setRoutineBranchId] = useState<number | undefined>(undefined);
  const [routineUserId, setRoutineUserId] = useState<number | undefined>(undefined);
  const [routineDayOfWeek, setRoutineDayOfWeek] = useState<number | undefined>(undefined);
  const [routineModalOpen, setRoutineModalOpen] = useState(false);
  const [routineEditingRecord, setRoutineEditingRecord] = useState<any>(null);
  const [routineForm] = Form.useForm();
  const [selectedRoutineRowKeys, setSelectedRoutineRowKeys] = useState<React.Key[]>([]);
  const [selectedShiftRowKeys, setSelectedShiftRowKeys] = useState<React.Key[]>([]);
  const [selectedShiftUuids, setSelectedShiftUuids] = useState<string[]>([]);
  const [draggingShiftUuid, setDraggingShiftUuid] = useState<string | null>(null);
  const [isRoutineDeleteMultipleModalVisible, setIsRoutineDeleteMultipleModalVisible] =
    useState(false);
  const [isRoutineDeleteModalVisible, setIsRoutineDeleteModalVisible] = useState(false);
  const [routineDeleteUuid, setRoutineDeleteUuid] = useState<string | null>(null);
  const [isShiftDeleteMultipleModalVisible, setIsShiftDeleteMultipleModalVisible] = useState(false);
  const [isShiftDeleteModalVisible, setIsShiftDeleteModalVisible] = useState(false);
  const [shiftDeleteUuid, setShiftDeleteUuid] = useState<string | null>(null);
  const [isShiftModalVisible, setIsShiftModalVisible] = useState(false);
  const [shiftEditingRecord, setShiftEditingRecord] = useState<any | null>(null);
  const [shiftForm] = Form.useForm();
  const [isShiftSaveLoading, setIsShiftSaveLoading] = useState(false);

  const normalizedUserEmail = String(user?.email ?? "").trim().toLowerCase();
  const canManageSchedules = isSuperAdmin && PRIVILEGED_ADMIN_EMAILS.has(normalizedUserEmail);

  const getBranchColor = (branchId: any) => {
    const palette = [
      "#2563eb",
      "#027a48",
      "#dc6803",
      "#a855f7",
      "#b42318",
      "#0891b2",
      "#db2777",
      "#65a30d",
    ];
    const id = Number(branchId);
    if (!Number.isFinite(id)) return "#6b7280";
    const idx = Math.abs(id) % palette.length;
    return palette[idx];
  };

  const scheduleStartDateStr =
    scheduleMode === "month"
      ? scheduleMonthStart.startOf("month").format("YYYY-MM-DD")
      : scheduleDateRange?.[0]?.format("YYYY-MM-DD") ?? scheduleWeekStart.format("YYYY-MM-DD");
  const scheduleEndDateStr =
    scheduleMode === "month"
      ? scheduleMonthStart.endOf("month").format("YYYY-MM-DD")
      : scheduleDateRange?.[1]?.format("YYYY-MM-DD") ??
        scheduleWeekStart.add(6, "day").format("YYYY-MM-DD");

  const { data: routineData } = useGetRoutineListQuery({
    page: routinePage,
    limit: 50,
    branchId: routineBranchId,
    userId: routineUserId,
    dayOfWeek: routineDayOfWeek,
  });
  const routineList = routineData?.data?.records ?? [];
  const routineIsSuperAdmin = routineData?.data?.isSuperAdmin ?? isSuperAdmin;

  const { data: shiftData, isLoading: isShiftLoading } = useGetShiftListQuery(
    {
      page: 1,
      limit: 500,
      branchId: routineBranchId,
      userId: routineUserId,
      startDate: scheduleStartDateStr,
      endDate: scheduleEndDateStr,
    },
    { refetchOnMountOrArgChange: true }
  );
  const shiftList = shiftData?.data?.records ?? [];

  const shiftByUuid = useMemo(() => {
    const map = new Map<string, any>();
    (shiftList ?? []).forEach((s: any) => {
      if (s?.uuid) map.set(s.uuid, s);
    });
    return map;
  }, [shiftList]);

  const displayName = (a: any) =>
    a?.name ||
    `${a?.firstName ?? ""} ${a?.lastName ?? ""}`.trim() ||
    a?.email ||
    "Unnamed user";

  const monthShiftsByDateGrouped = useMemo(() => {
    const byDate: Record<
      string,
      Array<{
        slotKey: string;
        branchId: number | null;
        branchName: string | null;
        startTime?: string | null;
        endTime?: string | null;
        timeLabel: string;
        uuids: string[];
        users: { uuid: string; userId: number | null; userName: string }[];
      }>
    > = {};
    (shiftList ?? []).forEach((s: any) => {
      if (!s?.date) return;
      const dateStr = dayjs(s.date).format("YYYY-MM-DD");
      const branchId = s.branchId ?? s.branch?.id ?? null;
      const branchName = s.branch?.name ?? null;
      const assignees = s.assignees ?? (s.user ? [s.user] : []);
      const users = assignees.map((a: any) => ({
        uuid: s.uuid,
        userId: a?.id ?? a?.userId ?? null,
        userName: a ? displayName(a) : "Unassigned",
      }));
      if (users.length === 0) users.push({ uuid: s.uuid, userId: null, userName: "Unassigned" });
      const timeLabel =
        s.startTime && s.endTime
          ? `${formatTime12h(s.startTime)} - ${formatTime12h(s.endTime)}`
          : formatTime12h(s.startTime) || formatTime12h(s.endTime) || "All day";
      if (!byDate[dateStr]) byDate[dateStr] = [];
      byDate[dateStr].push({
        slotKey: `${dateStr}_${branchId ?? ""}_${s.startTime ?? ""}_${s.endTime ?? ""}_${s.uuid}`,
        branchId,
        branchName,
        startTime: s.startTime,
        endTime: s.endTime,
        timeLabel,
        uuids: [s.uuid],
        users,
      });
    });
    Object.keys(byDate).forEach((d) => {
      byDate[d].sort((a, b) => {
        const bn = String(a.branchName ?? "").localeCompare(String(b.branchName ?? ""));
        if (bn !== 0) return bn;
        return (a.timeLabel || "").localeCompare(b.timeLabel || "");
      });
    });
    return byDate;
  }, [shiftList]);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const [createRoutineApi, { isLoading: isCreateRoutineLoading }] = useCreateRoutineMutation();
  const [updateRoutineApi, { isLoading: isUpdateRoutineLoading }] = useUpdateRoutineMutation();
  const [deleteRoutineApi, { isLoading: isDeleteRoutineLoading }] = useDeleteRoutineMutation();
  const [deleteRoutinesMultipleApi, { isLoading: isDeleteRoutinesMultipleLoading }] =
    useDeleteRoutinesMultipleMutation();
  const [createShiftApi] = useCreateShiftMutation();
  const [updateShiftApi] = useUpdateShiftMutation();
  const [deleteShiftApi, { isLoading: isDeleteShiftLoading }] = useDeleteShiftMutation();
  const [deleteShiftsMultipleApi, { isLoading: isDeleteShiftsMultipleLoading }] =
    useDeleteShiftsMultipleMutation();

  const scheduleGridData = useMemo(() => {
    if (!routineList || routineList.length === 0) return [];
    const byUser: Record<
      string,
      {
        userId: number | string;
        name: string;
        branchName: string | null;
        branchId: number | null;
        days: Record<
          number,
          {
            uuid: string;
            dayOfWeek: number;
            branchId: number | null;
            branchName: string | null;
            startTime?: string | null;
            endTime?: string | null;
          }
        >;
      }
    > = {};
    routineList.forEach((r: any) => {
      const userId = r.user?.id ?? r.userId ?? null;
      const branchId = r.branchId ?? r.branch?.id ?? null;
      const branchName = r.branch?.name ?? null;
      const key = userId != null ? String(userId) : `unassigned-${branchId}`;
      const name =
        userId != null
          ? (r.user?.name ||
              `${r.user?.firstName || ""} ${r.user?.lastName || ""}`.trim() ||
              r.user?.email ||
              "Unnamed user")
          : "Unassigned";
      if (!byUser[key]) {
        byUser[key] = { userId: userId ?? key, name, branchName, branchId, days: {} };
      }
      const day = r.dayOfWeek;
      if (!day) return;
      byUser[key].days[day] = {
        uuid: r.uuid,
        dayOfWeek: day,
        branchId,
        branchName,
        startTime: r.startTime,
        endTime: r.endTime,
      };
    });
    return Object.values(byUser);
  }, [routineList]);

  const shiftGridData = useMemo(() => {
    if (!shiftList || shiftList.length === 0) return [];
    const start = scheduleWeekStart.startOf("day");
    const byUser: any = {};
    shiftList.forEach((s: any) => {
      const assignees = s.assignees ?? (s.user ? [s.user] : []);
      const toProcess = assignees.length > 0 ? assignees : [{ id: null, name: "Unassigned" }];
      if (!s.date) return;
      const dateObj = dayjs(s.date);
      const diff = dateObj.startOf("day").diff(start, "day");
      const dayIndex = diff + 1;
      if (dayIndex < 1 || dayIndex > 7) return;
      const branchName = s.branch?.name ?? null;
      const branchId = s.branchId ?? s.branch?.id ?? null;
      const slot = {
        uuid: s.uuid,
        date: dateObj.format("YYYY-MM-DD"),
        branchId,
        branchName,
        startTime: s.startTime,
        endTime: s.endTime,
      };
      toProcess.forEach((a: any) => {
        const userId = a?.id ?? a?.userId ?? null;
        const key = userId != null ? String(userId) : `unassigned-${branchId ?? "x"}`;
        const name = a ? displayName(a) : "Unassigned";
        if (!byUser[key]) {
          byUser[key] = { userId: userId ?? key, name, branchName, branchId, days: {} };
        }
        byUser[key].days[dayIndex] = slot;
      });
    });
    return Object.values(byUser);
  }, [shiftList, scheduleWeekStart]);

  const shiftDataByDayGrouped = useMemo(() => {
    const start = scheduleWeekStart.startOf("day");
    const byDay: Record<
      number,
      Array<{
        slotKey: string;
        branchId: number | null;
        branchName: string | null;
        startTime?: string | null;
        endTime?: string | null;
        timeLabel: string;
        uuids: string[];
        users: { uuid: string; userId: number | null; userName: string }[];
      }>
    > = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
    (shiftList ?? []).forEach((s: any) => {
      if (!s?.date) return;
      const dateObj = dayjs(s.date);
      const diff = dateObj.startOf("day").diff(start, "day");
      const dayIndex = diff + 1;
      if (dayIndex < 1 || dayIndex > 7) return;
      const dateStr = dateObj.format("YYYY-MM-DD");
      const branchId = s.branchId ?? s.branch?.id ?? null;
      const branchName = s.branch?.name ?? null;
      const assignees = s.assignees ?? (s.user ? [s.user] : []);
      const users = assignees.map((a: any) => ({
        uuid: s.uuid,
        userId: a?.id ?? a?.userId ?? null,
        userName: a ? displayName(a) : "Unassigned",
      }));
      if (users.length === 0) users.push({ uuid: s.uuid, userId: null, userName: "Unassigned" });
      const timeLabel =
        s.startTime && s.endTime
          ? `${formatTime12h(s.startTime)} - ${formatTime12h(s.endTime)}`
          : formatTime12h(s.startTime) || formatTime12h(s.endTime) || "All day";
      byDay[dayIndex].push({
        slotKey: `${dateStr}_${branchId ?? ""}_${s.startTime ?? ""}_${s.endTime ?? ""}_${s.uuid}`,
        branchId,
        branchName,
        startTime: s.startTime,
        endTime: s.endTime,
        timeLabel,
        uuids: [s.uuid],
        users,
      });
    });
    [1, 2, 3, 4, 5].forEach((d) => {
      byDay[d].sort((a, b) => {
        const bn = String(a.branchName ?? "").localeCompare(String(b.branchName ?? ""));
        if (bn !== 0) return bn;
        return (a.timeLabel || "").localeCompare(b.timeLabel || "");
      });
    });
    return byDay;
  }, [shiftList, scheduleWeekStart]);

  const openRoutineAddModal = () => {
    setRoutineEditingRecord(null);
    routineForm.resetFields();
    if (user?.branchId != null && !isSuperAdmin) {
      routineForm.setFieldsValue({ branchId: user.branchId });
    }
    setRoutineModalOpen(true);
  };

  const openRoutineAddForUserDay = (
    userId: number,
    branchId: number | null | undefined,
    dayOfWeek: number
  ) => {
    setRoutineEditingRecord(null);
    routineForm.resetFields();
    const effectiveBranchId =
      routineIsSuperAdmin ? branchId ?? user?.branchId ?? undefined : user?.branchId ?? branchId ?? undefined;
    routineForm.setFieldsValue({
      userId,
      branchId: effectiveBranchId,
      dayOfWeeks: [dayOfWeek],
    });
    setRoutineModalOpen(true);
  };

  const openRoutineEditModal = (record: any) => {
    setRoutineEditingRecord(record);
    routineForm.setFieldsValue({
      userId: record.userId,
      branchId: record.branchId ?? undefined,
      dayOfWeek: record.dayOfWeek,
      startTime: record.startTime ? dayjs(`2000-01-01 ${record.startTime}`, "YYYY-MM-DD HH:mm") : null,
      endTime: record.endTime ? dayjs(`2000-01-01 ${record.endTime}`, "YYYY-MM-DD HH:mm") : null,
    });
    setRoutineModalOpen(true);
  };

  const closeRoutineModal = () => {
    setRoutineModalOpen(false);
    setRoutineEditingRecord(null);
    routineForm.resetFields();
  };

  const handleRoutineSave = async () => {
    try {
      const values = await routineForm.validateFields();
      const startTime = values.startTime ? dayjs(values.startTime).format("HH:mm") : null;
      const endTime = values.endTime ? dayjs(values.endTime).format("HH:mm") : null;
      if (routineEditingRecord) {
        const singleUserId = Array.isArray(values.userId) ? values.userId[0] ?? null : values.userId ?? null;
        await updateRoutineApi({
          uuid: routineEditingRecord.uuid,
          userId: singleUserId,
          branchId: values.branchId ?? null,
          dayOfWeek: values.dayOfWeek,
          startTime,
          endTime,
        }).unwrap();
        toast.success("Schedule updated successfully.");
      } else {
        const dayOfWeeks = Array.isArray(values.dayOfWeeks) ? values.dayOfWeeks : [values.dayOfWeeks];
        if (dayOfWeeks.length === 0) {
          toast.error("Please select at least one day.");
          return;
        }
        const rawUserIds = values.userId;
        const userIds = Array.isArray(rawUserIds)
          ? (rawUserIds ?? []).filter((id: any) => id != null && id !== "")
          : rawUserIds != null && rawUserIds !== ""
          ? [rawUserIds]
          : [];
        const payload: any = {
          branchId: values.branchId,
          dayOfWeeks,
          startTime,
          endTime,
        };
        if (userIds.length > 1) payload.userIds = userIds;
        else if (userIds.length === 1) payload.userId = userIds[0];
        else payload.userId = null;
        await createRoutineApi(payload).unwrap();
        toast.success("Schedule created successfully.");
      }
      closeRoutineModal();
    } catch (err: any) {
      if (err?.data?.message) toast.error(err.data.message);
      else toast.error("Failed to save schedule.");
    }
  };

  const openRoutineDeleteConfirm = (uuid: string) => {
    setRoutineDeleteUuid(uuid);
    setIsRoutineDeleteModalVisible(true);
  };

  const handleRoutineDeleteMultipleClick = () => {
    if (selectedRoutineRowKeys.length === 0) {
      toast.error("Please select schedules to delete.");
      return;
    }
    setIsRoutineDeleteMultipleModalVisible(true);
  };

  const confirmRoutineDeleteMultiple = async () => {
    if (selectedRoutineRowKeys.length === 0) return;
    try {
      const selectedKeys = new Set(selectedRoutineRowKeys.map((k) => String(k)));
      const uuids: string[] = [];
      scheduleGridData.forEach((row: { userId: number | string; days?: Record<number, { uuid: string }> }) => {
        if (selectedKeys.has(String(row.userId)) && row.days) {
          Object.values(row.days).forEach((slot) => slot?.uuid && uuids.push(slot.uuid));
        }
      });
      if (uuids.length === 0) {
        toast.error("No schedules to delete for selected employees.");
        return;
      }
      await deleteRoutinesMultipleApi(uuids).unwrap();
      toast.success("Schedules deleted successfully.");
      setIsRoutineDeleteMultipleModalVisible(false);
      setSelectedRoutineRowKeys([]);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete schedules.");
    }
  };

  const cancelRoutineDeleteMultiple = () => setIsRoutineDeleteMultipleModalVisible(false);

  const toggleRoutineSelection = (userId: number | string) => {
    setSelectedRoutineRowKeys((prev) =>
      prev.includes(userId) ? prev.filter((k) => k !== userId) : [...prev, userId]
    );
  };

  const toggleShiftUuidSelection = (uuid: string) => {
    setSelectedShiftUuids((prev) =>
      prev.includes(uuid) ? prev.filter((u) => u !== uuid) : [...prev, uuid]
    );
  };

  const toggleShiftGroupSelection = (uuids: string[]) => {
    if (uuids.length === 0) return;
    const allSelected = uuids.every((id) => selectedShiftUuids.includes(id));
    setSelectedShiftUuids((prev) =>
      allSelected ? prev.filter((u) => !uuids.includes(u)) : [...new Set([...prev, ...uuids])]
    );
  };

  const handleMonthDragStart = (event: any) => {
    const uuid = event?.active?.id ? String(event.active.id) : null;
    if (!uuid) return;
    setDraggingShiftUuid(uuid);
  };

  const handleMonthDragEnd = async (event: any) => {
    setDraggingShiftUuid(null);
    if (!canManageSchedules) return;

    const activeUuid = event?.active?.id ? String(event.active.id) : null;
    const overId = event?.over?.id ? String(event.over.id) : null;
    if (!activeUuid || !overId) return;

    const targetDate = overId;
    const shift = shiftByUuid.get(activeUuid);
    if (!shift) return;

    const currentDate = shift?.date ? dayjs(shift.date).format("YYYY-MM-DD") : null;
    if (currentDate === targetDate) return;

    const branchId = shift.branchId ?? shift.branch?.id;
    if (branchId == null) {
      toast.error("Missing branch for this shift.");
      return;
    }

    try {
      await updateShiftApi({
        uuid: activeUuid,
        branchId,
        date: targetDate,
        startTime: shift.startTime ?? null,
        endTime: shift.endTime ?? null,
      }).unwrap();
      toast.success("Shift moved.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to move shift.");
    }
  };

  const DraggableShiftChip = ({
    uuid,
    uuids = [],
    color,
    initials,
    branchName,
    label,
    title,
    onOpen,
    selected,
    onToggleSelect,
  }: any) => {
    const ids = uuids.length > 0 ? uuids : [uuid];
    const isSelected = !!selected;
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: uuid,
    });
    const style = transform
      ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
      : undefined;

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={[
          "group w-full cursor-grab active:cursor-grabbing rounded-md px-1 py-0.5 text-[10px] font-medium text-gray-900",
          "flex items-center gap-1.5 border-2 transition-[border-color] touch-none select-none",
          isDragging ? "opacity-40 ring-2 ring-dashed ring-indigo-300" : "",
          isSelected
            ? "border-dotted border-indigo-400"
            : "border-transparent hover:border-dotted hover:border-indigo-300",
        ].join(" ")}
        title="Drag to move shift"
      >
        <input
          type="checkbox"
          checked={!!isSelected}
          onChange={() => onToggleSelect?.(ids)}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={
            isSelected
              ? "h-3.5 w-3.5 transition-all opacity-100 cursor-pointer"
              : "h-3.5 w-0 transition-all opacity-0 group-hover:opacity-100 group-hover:w-3.5 overflow-hidden cursor-pointer"
          }
          title="Select shift"
        />
        <span
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold text-white shrink-0 ring-2 ring-white/50 shadow-sm pointer-events-none"
          style={{ backgroundColor: color }}
        >
          {isSelected ? "✓" : initials}
        </span>
        <button
          type="button"
          className="min-w-0 flex-1 text-left cursor-grab active:cursor-grabbing"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(e);
          }}
          title={[branchName, label, title].filter(Boolean).join(" · ")}
        >
          {branchName && (
            <div className="truncate text-[9px] font-semibold text-gray-700">{branchName}</div>
          )}
          <div className="truncate">{label}</div>
          {title && (
            <div className="text-[9px] text-gray-500 truncate">
              {title}
            </div>
          )}
        </button>
      </div>
    );
  };

  const DroppableDay = ({ dateStr, children }: any) => {
    const { setNodeRef, isOver } = useDroppable({ id: dateStr });
    return (
      <div
        ref={setNodeRef}
        className={[
          "rounded-lg transition-all duration-150",
          isOver
            ? "ring-2 ring-indigo-500 ring-offset-2 bg-indigo-50/80 shadow-inner"
            : "",
        ].join(" ")}
      >
        {children}
      </div>
    );
  };

  const draggingShiftForOverlay = useMemo(() => {
    if (!draggingShiftUuid) return null;
    const shift = shiftByUuid.get(draggingShiftUuid);
    if (!shift) return null;
    const color = getBranchColor(shift.branchId ?? shift.branch?.id);
    const assignees = shift.assignees ?? [];
    const label =
      assignees.length > 1
        ? `${assignees.length} employees`
        : assignees.length === 1
          ? displayName(assignees[0])
          : "Unassigned";
    const timeLabel =
      shift.startTime && shift.endTime
        ? `${formatTime12h(shift.startTime)} – ${formatTime12h(shift.endTime)}`
        : "";
    const duration = getShiftDurationHours(shift.startTime, shift.endTime);
    const branchName = shift.branch?.name ?? null;
    return { color, label, timeLabel, duration, branchName };
  }, [draggingShiftUuid, shiftByUuid]);

  const handleShiftDeleteMultipleClick = () => {
    const count =
      scheduleMode === "month" || scheduleMode === "date"
        ? selectedShiftUuids.length
        : selectedShiftRowKeys.length;
    if (count === 0) {
      toast.error("Please select shifts to delete.");
      return;
    }
    setIsShiftDeleteMultipleModalVisible(true);
  };

  const confirmShiftDeleteMultiple = async () => {
    const count =
      scheduleMode === "month" || scheduleMode === "date"
        ? selectedShiftUuids.length
        : selectedShiftRowKeys.length;
    if (count === 0) return;
    try {
      const uuids: string[] = [];

      if (scheduleMode === "month" || scheduleMode === "date") {
        uuids.push(...selectedShiftUuids);
      } else {
        const selectedUserIds = selectedShiftRowKeys.map((k) => Number(k));
        const gridData = shiftGridData;
        gridData.forEach((row: { userId: number; days?: Record<number, { uuid: string }> }) => {
          if (selectedUserIds.includes(row.userId) && row.days) {
            Object.values(row.days).forEach((slot) => slot?.uuid && uuids.push(slot.uuid));
          }
        });
      }

      if (uuids.length === 0) {
        toast.error("No shifts to delete for selection.");
        return;
      }
      await deleteShiftsMultipleApi(uuids).unwrap();
      toast.success("Shifts deleted successfully.");
      setIsShiftDeleteMultipleModalVisible(false);
      setSelectedShiftRowKeys([]);
      setSelectedShiftUuids([]);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete shifts.");
    }
  };

  const cancelShiftDeleteMultiple = () => setIsShiftDeleteMultipleModalVisible(false);

  const toggleShiftSelection = (userId: number) => {
    setSelectedShiftRowKeys((prev) =>
      prev.includes(userId) ? prev.filter((k) => k !== userId) : [...prev, userId]
    );
  };

  const defaultShiftStartTime = dayjs("2000-01-01 10:00", "YYYY-MM-DD HH:mm");
  const defaultShiftEndTime = dayjs("2000-01-01 18:00", "YYYY-MM-DD HH:mm");

  const openShiftCreateModal = (userId: number, branchId: number, dateStr: string) => {
    setShiftEditingRecord({
      uuid: null,
      userId,
      branchId,
      date: dateStr,
      fromCell: true,
    });
    shiftForm.setFieldsValue({
      userId,
      branchId: branchId ?? undefined,
      date: dateStr ? dayjs(dateStr) : undefined,
      startTime: defaultShiftStartTime,
      endTime: defaultShiftEndTime,
      copyToMultipleDates: false,
      multipleDates: [],
    });
    setIsShiftModalVisible(true);
  };

  const openShiftEditModal = (
    slot: {
      uuid: string;
      date: string;
      startTime?: string | null;
      endTime?: string | null;
      branchId?: number | null;
    },
    row: { userId?: number | null; userIds?: number[]; branchId?: number | null }
  ) => {
    const assigneeIds = row.userIds ?? (row.userId != null ? [row.userId] : []);
    setShiftEditingRecord({
      uuid: slot.uuid,
      userId: row.userId ?? null,
      branchId: slot.branchId ?? row.branchId,
      date: slot.date,
      fromCell: true,
    });
    shiftForm.setFieldsValue({
      userId: assigneeIds,
      branchId: slot.branchId ?? row.branchId ?? undefined,
      date: slot.date ? dayjs(slot.date) : undefined,
      startTime: slot.startTime ? dayjs(`2000-01-01 ${slot.startTime}`, "YYYY-MM-DD HH:mm") : null,
      endTime: slot.endTime ? dayjs(`2000-01-01 ${slot.endTime}`, "YYYY-MM-DD HH:mm") : null,
    });
    setIsShiftModalVisible(true);
  };

  const openShiftAddFromButton = () => {
    setShiftEditingRecord({ fromButton: true });
    const monday = scheduleWeekStart.format("YYYY-MM-DD");
    shiftForm.setFieldsValue({
      userId: undefined,
      branchId: routineBranchId ?? user?.branchId ?? undefined,
      date: monday ? dayjs(monday) : undefined,
      startTime: defaultShiftStartTime,
      endTime: defaultShiftEndTime,
      copyToMultipleDates: false,
      multipleDates: [],
    });
    setIsShiftModalVisible(true);
  };

  const openShiftCreateFromCalendar = (dateStr: string) => {
    if (!canManageSchedules) return;
    setShiftEditingRecord({ fromCalendar: true, uuid: null, date: dateStr });
    shiftForm.setFieldsValue({
      userId: undefined,
      branchId: routineBranchId ?? user?.branchId ?? undefined,
      date: dateStr ? dayjs(dateStr) : undefined,
      startTime: defaultShiftStartTime,
      endTime: defaultShiftEndTime,
      copyToMultipleDates: false,
      multipleDates: [],
    });
    setIsShiftModalVisible(true);
  };

  const handleShiftModalCancel = () => {
    setIsShiftModalVisible(false);
    setShiftEditingRecord(null);
    shiftForm.resetFields();
  };

  const openShiftDeleteConfirm = (uuid: string) => {
    setShiftDeleteUuid(uuid);
    setIsShiftDeleteModalVisible(true);
  };

  const handleShiftModalOk = async () => {
    if (!shiftEditingRecord) return;
    try {
      const values = await shiftForm.validateFields();
      const startTime = values.startTime ? dayjs(values.startTime).format("HH:mm") : null;
      const endTime = values.endTime ? dayjs(values.endTime).format("HH:mm") : null;
      const isEdit = !!shiftEditingRecord.uuid;
      if (isEdit) {
        const rawUserId = values.userId ?? shiftEditingRecord.userId;
        const userIds = Array.isArray(rawUserId)
          ? rawUserId
          : rawUserId != null
          ? [rawUserId]
          : [];
        const branchId = values.branchId ?? shiftEditingRecord.branchId;
        const dateStr = values.date ? dayjs(values.date).format("YYYY-MM-DD") : shiftEditingRecord.date;
        if (!branchId || !dateStr) {
          toast.error("Please fill in branch and date.");
          return;
        }
        await updateShiftApi({
          uuid: shiftEditingRecord.uuid,
          userIds: userIds,
          branchId,
          date: dateStr,
          startTime,
          endTime,
        }).unwrap();
        toast.success("Shift updated.");
      } else {
        const rawUserId = values.userId;
        const userIds = Array.isArray(rawUserId)
          ? rawUserId
          : rawUserId != null
          ? [rawUserId]
          : [];
        const branchId = values.branchId ?? user?.branchId;
        if (!branchId) {
          toast.error("Please select branch.");
          return;
        }
        const copyToMultiple = !!values.copyToMultipleDates;
        if (copyToMultiple) {
          const rawMultipleDates = Array.isArray(values.multipleDates)
            ? values.multipleDates
            : values.multipleDates
            ? [values.multipleDates]
            : [];
          const multipleDates = rawMultipleDates.filter(Boolean) as dayjs.Dayjs[];
          if (multipleDates.length === 0) {
            toast.error("Please select one or more dates.");
            return;
          }
          const dates = Array.from(
            new Set(multipleDates.map((d: dayjs.Dayjs) => dayjs(d).startOf("day").format("YYYY-MM-DD")))
          ).sort();
          if (dates.length > 31) {
            toast.error("Please select at most 31 dates.");
            return;
          }
          setIsShiftSaveLoading(true);
          let created = 0;
          for (const dateStr of dates) {
            try {
              await createShiftApi({
                userIds: userIds,
                branchId,
                date: dateStr,
                startTime,
                endTime,
              }).unwrap();
              created++;
            } catch {
              toast.error(`Failed to create shift for ${dateStr}.`);
            }
          }
          toast.success(`Shift created for ${created} day(s).`);
        } else {
          const dateStr = values.date ? dayjs(values.date).format("YYYY-MM-DD") : null;
          if (!dateStr) {
            toast.error("Please select a date.");
            return;
          }
          await createShiftApi({
            userIds: userIds,
            branchId,
            date: dateStr,
            startTime,
            endTime,
          }).unwrap();
          toast.success("Shift saved.");
        }
      }
      setIsShiftModalVisible(false);
      setShiftEditingRecord(null);
      shiftForm.resetFields();
    } catch (err: any) {
      if (err?.errorFields) return;
      toast.error(
        err?.data?.message ||
          (shiftEditingRecord?.uuid ? "Failed to update shift." : "Failed to save shift.")
      );
    } finally {
      setIsShiftSaveLoading(false);
    }
  };

  const handlePrintSchedule = () => {
    try {
      const printedAt = dayjs().format("DD MMM YYYY, h:mm A");

      const headerTitle =
        scheduleMode === "weekly"
          ? "Schedule (By Branch)"
          : scheduleMode === "month"
            ? "Schedule (By Month)"
            : "Schedule (By Week)";

      let rangeText = "";
      if (scheduleMode === "month") {
        rangeText = scheduleMonthStart.format("MMMM YYYY");
      } else {
        const start = scheduleDateRange?.[0] ?? scheduleWeekStart;
        const end = scheduleDateRange?.[1] ?? scheduleWeekStart.add(6, "day");
        rangeText = `${start.format("DD MMM YYYY")} - ${end.format("DD MMM YYYY")}`;
      }

      let printContentHtml = "";

      if (scheduleMode === "weekly") {
        let rowsHtml = "";
        scheduleGridData.forEach((row: any) => {
          DAY_NAMES.slice(1).forEach((dayName, index) => {
            const dayIndex = index + 1;
            const slot = row.days?.[dayIndex];
            if (!slot) return;
            const timeLabel =
              slot.startTime && slot.endTime
                ? `${formatTime12h(slot.startTime)} - ${formatTime12h(slot.endTime)}`
                : formatTime12h(slot.startTime) || formatTime12h(slot.endTime) || "All day";

            rowsHtml += `
              <tr>
                <td>${escapeHtml(row.name)}</td>
                <td>${escapeHtml(dayName)}</td>
                <td>${escapeHtml(slot.branchName || row.branchName || "-")}</td>
                <td>${escapeHtml(timeLabel)}</td>
                <td>${escapeHtml(getShiftDurationHours(slot.startTime, slot.endTime) || "-")}</td>
              </tr>
            `;
          });
        });
        if (!rowsHtml) {
          toast.error("No schedule data to print for current filters.");
          return;
        }
        printContentHtml = `
          <table>
            <thead><tr><th>Employee</th><th>Day</th><th>Branch</th><th>Time</th><th>Duration</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        `;
      } else {
        const dayHeaders = DAY_NAMES.slice(1)
          .map((name) => `<div class="cal-head">${escapeHtml(name)}</div>`)
          .join("");

        const buildDayCell = (dateObj: dayjs.Dayjs, groups: any[]) => {
          const shiftsHtml =
            groups.length === 0
              ? `<div class="empty">No shifts</div>`
              : groups
                  .map((grp: any) => {
                    const users = (grp.users || []).map((u: any) => u.userName).join(", ");
                    const duration = getShiftDurationHours(grp.startTime, grp.endTime);
                    return `
                      <div class="shift-chip">
                        ${grp.branchName ? `<div class="branch">${escapeHtml(grp.branchName)}</div>` : ""}
                        <div>${escapeHtml(users || "Unassigned")}</div>
                        <div class="meta-line">${escapeHtml(grp.timeLabel || "-")}${duration ? ` · ${escapeHtml(duration)}` : ""}</div>
                      </div>
                    `;
                  })
                  .join("");

          return `
            <div class="cal-cell">
              <div class="date-badge">${escapeHtml(dateObj.format("DD"))}</div>
              <div class="shift-wrap">${shiftsHtml}</div>
            </div>
          `;
        };

        let calendarCellsHtml = "";
        if (scheduleMode === "date") {
          [1, 2, 3, 4, 5, 6, 7].forEach((dayIndex) => {
            const dateObj = scheduleWeekStart.add(dayIndex - 1, "day");
            const groups = shiftDataByDayGrouped[dayIndex] ?? [];
            calendarCellsHtml += buildDayCell(dateObj, groups);
          });
        } else {
          const monthStart = scheduleMonthStart.startOf("month");
          const monthEnd = scheduleMonthStart.endOf("month");
          const startOffset = (monthStart.day() + 6) % 7;
          const gridStart = monthStart.subtract(startOffset, "day");
          for (let i = 0; i < 42; i++) {
            const dateObj = gridStart.add(i, "day");
            const dateKey = dateObj.format("YYYY-MM-DD");
            const groups = monthShiftsByDateGrouped[dateKey] ?? [];
            const inMonth = dateObj.isSame(monthStart, "month") && !dateObj.isAfter(monthEnd, "day");
            calendarCellsHtml += `
              <div class="${inMonth ? "" : "faded"}">
                ${buildDayCell(dateObj, groups)}
              </div>
            `;
          }
        }

        printContentHtml = `
          <div class="cal-grid">
            ${dayHeaders}
            ${calendarCellsHtml}
          </div>
        `;
      }

      if (!printContentHtml) {
        toast.error("No schedule data to print for current filters.");
        return;
      }

      const printWindow = window.open("", "_blank", "width=1200,height=800");
      if (!printWindow) {
        toast.error("Unable to open print window. Please allow pop-ups.");
        return;
      }

      const html = `
        <!doctype html>
        <html>
          <head>
            <title>${escapeHtml(headerTitle)}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
              .meta { margin-bottom: 16px; }
              .meta h1 { margin: 0 0 6px 0; font-size: 20px; }
              .meta p { margin: 2px 0; color: #4b5563; font-size: 13px; }
              table { width: 100%; border-collapse: collapse; margin-top: 12px; }
              th, td { border: 1px solid #e5e7eb; padding: 8px 10px; font-size: 12px; vertical-align: top; }
              th { background: #f3f4f6; text-align: left; }
              .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 10px; }
              .cal-head { font-size: 11px; font-weight: 700; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px; text-align: center; }
              .cal-cell { min-height: 140px; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px; background: #fff; }
              .date-badge { display: inline-flex; min-width: 26px; height: 22px; border-radius: 6px; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; background: #eef2ff; color: #3730a3; margin-bottom: 6px; }
              .shift-wrap { display: flex; flex-direction: column; gap: 4px; }
              .shift-chip { border-left: 3px solid #4f46e5; background: #eef2ff; border-radius: 6px; padding: 5px 6px; font-size: 10px; line-height: 1.3; }
              .shift-chip .branch { font-weight: 700; color: #374151; margin-bottom: 2px; }
              .shift-chip .meta-line { color: #4b5563; }
              .empty { font-size: 10px; color: #9ca3af; }
              .faded .cal-cell { background: #f9fafb; opacity: 0.7; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="meta">
              <h1>${escapeHtml(headerTitle)}</h1>
              <p><strong>Range:</strong> ${escapeHtml(rangeText)}</p>
              <p><strong>Printed At:</strong> ${escapeHtml(printedAt)}</p>
            </div>
            ${printContentHtml}
          </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 150);
    } catch (error) {
      console.error(error);
      toast.error("Failed to prepare print view.");
    }
  };

  return (
    <>
      <Card
        title={
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span>
              <CalendarOutlined className="mr-2" /> Schedule
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 mr-2">
                <Button
                  size="small"
                  type={scheduleMode === "date" ? "primary" : "default"}
                  onClick={() => setScheduleMode("date")}
                >
                  By Week
                </Button>
                <Button
                  size="small"
                  type={scheduleMode === "month" ? "primary" : "default"}
                  onClick={() => setScheduleMode("month")}
                >
                  By Month
                </Button>
                <Button
                  size="small"
                  type={scheduleMode === "weekly" ? "primary" : "default"}
                  onClick={() => setScheduleMode("weekly")}
                >
                  By Branch
                </Button>
              </div>
              {scheduleMode === "weekly" && (
                <Select
                  style={{ width: 140 }}
                  placeholder="Day"
                  value={routineDayOfWeek != null ? routineDayOfWeek : "all"}
                  onChange={(v) => {
                    if (v === "all" || v == null) setRoutineDayOfWeek(undefined);
                    else setRoutineDayOfWeek(Number(v));
                  }}
                  options={[
                    { value: "all", label: "All days" },
                    ...DAY_NAMES.slice(1).map((name, i) => ({ value: i + 1, label: name })),
                  ]}
                />
              )}
              {routineIsSuperAdmin && (
                <Select
                  style={{ width: 200 }}
                  placeholder="Filter by branch"
                  value={routineBranchId != null ? routineBranchId.toString() : "all"}
                  onChange={(v) => setRoutineBranchId(v === "all" ? undefined : parseInt(v, 10))}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
                  }
                  options={[
                    { value: "all", label: "All Branches" },
                    ...(branchList?.map((b: any) => ({
                      value: (b.id ?? b.branchId).toString(),
                      label: b.name ?? b.branchName ?? `Branch ${b.id ?? b.branchId}`,
                    })) ?? []),
                  ]}
                />
              )}
              <Select
                style={{ width: 220 }}
                placeholder="Filter by user"
                value={routineUserId != null ? routineUserId.toString() : "all"}
                onChange={(v) => setRoutineUserId(v === "all" ? undefined : parseInt(v, 10))}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
                }
                options={[
                  { value: "all", label: "All Employees" },
                  ...(filteredUserList?.map((userItem: any) => {
                    const uid = userItem.user?.id || userItem.id;
                    const userName =
                      userItem.user?.name ||
                      `${userItem.user?.firstName || ""} ${userItem.user?.lastName || ""}`.trim() ||
                      userItem.name ||
                      `${userItem.firstName || ""} ${userItem.lastName || ""}`.trim() ||
                      userItem.user?.email ||
                      userItem.email ||
                      "N/A";
                    return { value: uid.toString(), label: userName };
                  }) ?? []),
                ]}
              />
              <button type="button" className="cancel-btn" onClick={handlePrintSchedule}>
                Print Schedule
              </button>
              {canManageSchedules && (
                <>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={
                      scheduleMode === "date" || scheduleMode === "month"
                        ? openShiftAddFromButton
                        : openRoutineAddModal
                    }
                  >
                    Add Schedule
                  </button>
                  {scheduleMode === "weekly" && (
                    <button
                      type="button"
                      className="danger-btn flex items-center gap-2"
                      onClick={handleRoutineDeleteMultipleClick}
                      disabled={selectedRoutineRowKeys.length === 0}
                    >
                      <MdDelete />
                      <span>
                        Delete Selected{" "}
                        {selectedRoutineRowKeys.length > 0 ? `(${selectedRoutineRowKeys.length})` : ""}
                      </span>
                    </button>
                  )}
                  {(scheduleMode === "date" || scheduleMode === "month") && (
                    <button
                      type="button"
                      className="danger-btn flex items-center gap-2"
                      onClick={handleShiftDeleteMultipleClick}
                      disabled={
                        (scheduleMode === "month" || scheduleMode === "date"
                          ? selectedShiftUuids.length
                          : selectedShiftRowKeys.length) === 0
                      }
                    >
                      <MdDelete />
                      <span>
                        Delete Selected{" "}
                        {(scheduleMode === "month" || scheduleMode === "date"
                          ? selectedShiftUuids.length
                          : selectedShiftRowKeys.length) > 0
                          ? `(${
                              scheduleMode === "month" || scheduleMode === "date"
                                ? selectedShiftUuids.length
                                : selectedShiftRowKeys.length
                            })`
                          : ""}
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        }
      >
        {scheduleMode === "date" && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <Button
                size="small"
                onClick={() => {
                  setScheduleWeekStart((d) => d.subtract(7, "day"));
                  setScheduleDateRange(null);
                }}
              >
                {"<"}
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setScheduleWeekStart((d) => d.add(7, "day"));
                  setScheduleDateRange(null);
                }}
              >
                {">"}
              </Button>
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {scheduleWeekStart.format("DD MMM YYYY")} -{" "}
                {scheduleWeekStart.add(6, "day").format("DD MMM YYYY")}
              </span>
              <Button
                type="text"
                size="small"
                icon={<CalendarOutlined />}
                onClick={() => setDateFilterExpanded((v) => !v)}
                className={dateFilterExpanded ? "text-blue-600" : ""}
                title={dateFilterExpanded ? "Hide date filter" : "Show date filter"}
              />
              {dateFilterExpanded && (
                <DatePicker.RangePicker
                  size="small"
                  value={scheduleDateRange ?? [scheduleWeekStart, scheduleWeekStart.add(6, "day")]}
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      setScheduleDateRange([dates[0], dates[1]]);
                      setScheduleWeekStart(dates[0].startOf("day"));
                    } else {
                      setScheduleDateRange(null);
                    }
                  }}
                />
              )}
            </div>
            <span className="text-xs text-gray-500">
              Each day shows shifts with branch and all employees. Click a shift to edit, or &quot;+ Add shift&quot; to create. Select shifts to delete.
            </span>
          </div>
        )}
        {scheduleMode === "month" && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <Button size="small" onClick={() => setScheduleMonthStart((d) => d.subtract(1, "month"))}>
                {"<"}
              </Button>
              <Button size="small" onClick={() => setScheduleMonthStart((d) => d.add(1, "month"))}>
                {">"}
              </Button>
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {scheduleMonthStart.format("MMMM YYYY")}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              Full month view. Click a day to add a shift, or click a shift to edit; drag to move.
            </span>
          </div>
        )}
        {scheduleMode === "weekly" ? (
          routineList.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-sm">
              No weekly schedules found for the selected filters.
            </div>
          ) : (
            <div className="mt-4 overflow-auto">
              <div className="min-w-[900px] rounded border border-gray-200 bg-white">
                <div className="grid grid-cols-6 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
                  <div className="text-left flex items-center gap-2">
                    {canManageSchedules && (
                      <span className="text-[10px] font-normal text-gray-500">Select Employees</span>
                    )}
                    <span>Members</span>
                  </div>
                  {DAY_NAMES.slice(1).map((name) => (
                    <div key={name} className="text-center">
                      {name}
                    </div>
                  ))}
                </div>
                {scheduleGridData.map((row: any) => {
                  const initials =
                    row.name
                      ?.split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n: string) => n[0]?.toUpperCase())
                      .join("") || "?";
                  return (
                    <div
                      key={row.userId}
                      className="grid grid-cols-6 items-stretch border-b border-gray-100 px-4 py-3 last:border-b-0"
                    >
                      <div className="flex items-center gap-3 pr-2">
                        {canManageSchedules && (
                          <Checkbox
                            checked={selectedRoutineRowKeys.includes(row.userId)}
                            onChange={() => toggleRoutineSelection(row.userId)}
                          />
                        )}
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-800">{row.name}</div>
                          {row.branchName && (
                            <div className="text-xs text-gray-500">{row.branchName}</div>
                          )}
                        </div>
                      </div>
                      {DAY_NAMES.slice(1).map((_, index) => {
                        const dayIndex = index + 1;
                        const slot = row.days?.[dayIndex];
                        const timeLabel =
                          slot?.startTime && slot?.endTime
                            ? `${formatTime12h(slot.startTime)} - ${formatTime12h(slot.endTime)}`
                            : formatTime12h(slot?.startTime) ||
                              formatTime12h(slot?.endTime) ||
                              "All day";
                        const handleCellClick = () => {
                          if (!canManageSchedules) return;
                          if (slot) {
                            openRoutineEditModal({
                              uuid: slot.uuid,
                              userId: row.userId,
                              branchId: slot.branchId ?? row.branchId ?? null,
                              dayOfWeek: slot.dayOfWeek,
                              startTime: slot.startTime,
                              endTime: slot.endTime,
                            });
                          } else {
                            openRoutineAddForUserDay(row.userId, row.branchId ?? null, dayIndex);
                          }
                        };
                        return (
                          <div key={dayIndex} className="px-2">
                            <button
                              type="button"
                              onClick={handleCellClick}
                              className="flex h-12 w-full items-stretch rounded border border-transparent bg-transparent p-0 text-left hover:border-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
                            >
                              {slot ? (
                                <div className="relative flex w-full flex-col justify-center rounded bg-indigo-500 px-2 text-[11px] font-medium text-white shadow-sm">
                                  <span>{slot.branchName ? `${slot.branchName}` : "Shift"}</span>
                                  <span className="text-[10px] opacity-90">{timeLabel}</span>
                                  {canManageSchedules && (
                                    <button
                                      type="button"
                                      className="absolute right-1 top-1 text-[10px] text-white/80 hover:text-white"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openRoutineDeleteConfirm(slot.uuid);
                                      }}
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="flex w-full items-center justify-center rounded border border-dashed border-gray-200 bg-gray-50 text-[10px] text-gray-400">
                                  {canManageSchedules ? "+ Add" : ""}
                                </div>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : scheduleMode === "date" ? (
          isShiftLoading ? (
            <TableLoader />
          ) : (
            <div className="mt-4 overflow-auto">
              <DndContext
                sensors={dndSensors}
                onDragStart={handleMonthDragStart}
                onDragEnd={handleMonthDragEnd}
              >
                <div className="min-w-[900px] rounded border border-gray-200 bg-white">
                  <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 px-2 py-2 text-xs font-semibold text-gray-600">
                    {DAY_NAMES.slice(1).map((name, idx) => (
                      <div key={name} className="text-center">
                        <div>{name}</div>
                        <div className="text-[10px] text-gray-500">
                          {scheduleWeekStart.add(idx, "day").format("DD MMM")}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-px bg-gray-200 p-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((dayIndex) => {
                      const dateStr = scheduleWeekStart.add(dayIndex - 1, "day").format("YYYY-MM-DD");
                      const dayDate = scheduleWeekStart.add(dayIndex - 1, "day");
                      const isToday = dayjs().isSame(dayDate, "day");
                      const groups = shiftDataByDayGrouped[dayIndex] ?? [];
                      return (
                        <DroppableDay key={dayIndex} dateStr={dateStr}>
                          <div
                            className={[
                              "group min-h-[140px] rounded-md border border-transparent p-1 transition bg-white",
                              "hover:border-indigo-200 hover:bg-indigo-50/20",
                            ].join(" ")}
                            role={canManageSchedules ? "button" : undefined}
                            tabIndex={canManageSchedules ? 0 : -1}
                            onClick={() => openShiftCreateFromCalendar(dateStr)}
                            onKeyDown={(e) => {
                              if (!canManageSchedules) return;
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                openShiftCreateFromCalendar(dateStr);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div
                                className={[
                                  "h-7 min-w-7 px-2 rounded-md text-[11px] font-semibold flex items-center justify-center",
                                  isToday
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "bg-gray-100 text-gray-700",
                                ].join(" ")}
                              >
                                {dayDate.format("DD")}
                              </div>
                              {canManageSchedules && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openShiftCreateFromCalendar(dateStr);
                                  }}
                                  className={[
                                    "text-[10px] font-medium rounded-md px-2 py-1",
                                    "text-indigo-600 bg-indigo-50 hover:bg-indigo-100",
                                    isToday ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                                    "transition",
                                  ].join(" ")}
                                  title="Add shift"
                                >
                                  + Add
                                </button>
                              )}
                            </div>
                            <div className="mt-1 space-y-1 max-h-[180px] overflow-y-auto">
                              {groups.length === 0 ? (
                                <div className="text-[10px] text-gray-300">
                                  {canManageSchedules ? "No shifts" : ""}
                                </div>
                              ) : (
                                groups.map((grp) => {
                                  const color = getBranchColor(grp.branchId);
                                  const userLabel = grp.users.map((u) => u.userName || "?").join(", ");
                                  const initials =
                                    grp.users.length > 1
                                      ? `${grp.users.length}`
                                      : String(grp.users[0]?.userName || "?")
                                          .split(/\s+/)
                                          .filter(Boolean)
                                          .slice(0, 2)
                                          .map((n: string) => n[0]?.toUpperCase())
                                          .join("") || "?";
                                  const firstShift = grp.users[0];
                                  const firstUuid = grp.uuids[0];
                                  return (
                                    <div
                                      key={grp.slotKey}
                                      style={{
                                        borderLeft: `3px solid ${color}`,
                                        background: `${color}12`,
                                      }}
                                    >
                                      <DraggableShiftChip
                                        uuid={firstUuid}
                                        uuids={grp.uuids}
                                        color={color}
                                        initials={initials}
                                        selected={grp.uuids.some((id) => selectedShiftUuids.includes(id))}
                                        onToggleSelect={toggleShiftGroupSelection}
                                        branchName={grp.branchName}
                                        label={userLabel || "—"}
                                        title={[
                                          grp.timeLabel,
                                          getShiftDurationHours(grp.startTime, grp.endTime),
                                        ]
                                          .filter(Boolean)
                                          .join(" · ")}
                                        onOpen={(e: any) => {
                                          if (e?.stopPropagation) e.stopPropagation();
                                          if (!canManageSchedules || !firstShift) return;
                                          openShiftEditModal(
                                            {
                                              uuid: firstShift.uuid,
                                              date: dateStr,
                                              branchId: grp.branchId,
                                              startTime: grp.startTime,
                                              endTime: grp.endTime,
                                            },
                                            {
                                              userId: firstShift.userId,
                                              userIds: grp.users.map((u: any) => u.userId).filter((id: any) => id != null),
                                              branchId: grp.branchId,
                                            }
                                          );
                                        }}
                                      />
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </DroppableDay>
                      );
                    })}
                  </div>
                </div>
                <DragOverlay dropAnimation={null}>
                  {draggingShiftForOverlay ? (
                    <div
                      className="flex min-w-[180px] max-w-[220px] cursor-grabbing flex-col gap-0.5 rounded-lg border-2 border-indigo-300 bg-white px-3 py-2 shadow-xl ring-2 ring-indigo-200"
                      style={{ borderLeftWidth: "4px", borderLeftColor: draggingShiftForOverlay.color }}
                    >
                      {draggingShiftForOverlay.branchName && (
                        <div className="text-[10px] font-semibold text-gray-600">
                          {draggingShiftForOverlay.branchName}
                        </div>
                      )}
                      <div className="text-xs font-medium text-gray-900">{draggingShiftForOverlay.label}</div>
                      {(draggingShiftForOverlay.timeLabel || draggingShiftForOverlay.duration) && (
                        <div className="text-[10px] text-gray-500">
                          {[draggingShiftForOverlay.timeLabel, draggingShiftForOverlay.duration]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      )}
                      <div className="mt-1 text-[9px] font-medium text-indigo-600">Drop on a day to move</div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
              {shiftList.length === 0 && (
                <div className="py-8 text-center text-gray-500 text-sm">
                  No shifts in this week. Click &quot;+ Add&quot; in a day to create one.
                </div>
              )}
            </div>
          )
        ) : isShiftLoading ? (
          <TableLoader />
        ) : (
          <div className="mt-4 rounded border border-gray-200 bg-white p-2">
            {shiftList.length === 0 && (
              <div className="py-2 text-center text-gray-500 text-sm">
                No shifts in this month for the selected filters.
              </div>
            )}
            <DndContext
              sensors={dndSensors}
              onDragStart={handleMonthDragStart}
              onDragEnd={handleMonthDragEnd}
            >
              <Calendar
                fullscreen={false}
                value={scheduleMonthStart}
                headerRender={() => null}
                onPanelChange={(val) => {
                  if (!val) return;
                  setScheduleMonthStart(dayjs(val).startOf("month"));
                }}
                fullCellRender={(value) => {
                const dateStr = dayjs(value).format("YYYY-MM-DD");
                const groups = monthShiftsByDateGrouped[dateStr] ?? [];
                const isToday = dayjs().isSame(value, "day");
                const isCurrentMonth = dayjs(value).month() === scheduleMonthStart.month();
                const dayNumber = dayjs(value).format("DD");

                return (
                  <DroppableDay dateStr={dateStr}>
                    <div
                      className={[
                        "group h-full w-full rounded-md border border-transparent p-1 transition",
                        isCurrentMonth ? "bg-white" : "bg-gray-50/50 opacity-70",
                        "hover:border-indigo-200 hover:bg-indigo-50/20",
                      ].join(" ")}
                      role={canManageSchedules ? "button" : undefined}
                      tabIndex={canManageSchedules ? 0 : -1}
                      onClick={() => openShiftCreateFromCalendar(dateStr)}
                      onKeyDown={(e) => {
                        if (!canManageSchedules) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openShiftCreateFromCalendar(dateStr);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={[
                            "h-7 min-w-7 px-2 rounded-md text-[11px] font-semibold flex items-center justify-center",
                            isToday
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-gray-100 text-gray-700",
                          ].join(" ")}
                        >
                          {dayNumber}
                        </div>

                        {canManageSchedules && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openShiftCreateFromCalendar(dateStr);
                            }}
                            className={[
                              "text-[10px] font-medium rounded-md px-2 py-1",
                              "text-indigo-600 bg-indigo-50 hover:bg-indigo-100",
                              isToday ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                              "transition",
                            ].join(" ")}
                            title="Add shift"
                          >
                            + Add
                          </button>
                        )}
                      </div>

                      <div className="mt-1 space-y-1 max-h-[180px] overflow-y-auto">
                        {groups.length === 0 ? (
                          <div className="text-[10px] text-gray-300">
                            {canManageSchedules ? "No shifts" : ""}
                          </div>
                        ) : (
                          <>
                            {groups.map((grp) => {
                              const color = getBranchColor(grp.branchId);
                              const userLabel = grp.users.map((u) => u.userName || "?").join(", ");
                              const initials =
                                grp.users.length > 1
                                  ? `${grp.users.length}`
                                  : String(grp.users[0]?.userName || "?")
                                      .split(/\s+/)
                                      .filter(Boolean)
                                      .slice(0, 2)
                                      .map((n: string) => n[0]?.toUpperCase())
                                      .join("") || "?";
                              const firstShift = grp.users[0];
                              const firstUuid = grp.uuids[0];

                              return (
                                <div
                                  key={grp.slotKey}
                                  style={{
                                    borderLeft: `3px solid ${color}`,
                                    background: `${color}12`,
                                  }}
                                >
                                  <DraggableShiftChip
                                    uuid={firstUuid}
                                    uuids={grp.uuids}
                                    color={color}
                                    initials={initials}
                                    selected={grp.uuids.some((id) => selectedShiftUuids.includes(id))}
                                    onToggleSelect={toggleShiftGroupSelection}
                                    branchName={grp.branchName}
                                    label={userLabel || "—"}
                                    title={[
                                      grp.timeLabel,
                                      getShiftDurationHours(grp.startTime, grp.endTime),
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")}
                                    onOpen={(e: any) => {
                                      if (e?.stopPropagation) e.stopPropagation();
                                      if (!canManageSchedules || !firstShift) return;
                                      openShiftEditModal(
                                        {
                                          uuid: firstShift.uuid,
                                          date: dateStr,
                                          branchId: grp.branchId,
                                          startTime: grp.startTime,
                                          endTime: grp.endTime,
                                        },
                                        {
                                          userId: firstShift.userId,
                                          userIds: grp.users.map((u: any) => u.userId).filter((id: any) => id != null),
                                          branchId: grp.branchId,
                                        }
                                      );
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  </DroppableDay>
                );
              }}
              />

              <DragOverlay dropAnimation={null}>
                {draggingShiftForOverlay ? (
                  <div
                    className="flex min-w-[180px] max-w-[220px] cursor-grabbing flex-col gap-0.5 rounded-lg border-2 border-indigo-300 bg-white px-3 py-2 shadow-xl ring-2 ring-indigo-200"
                    style={{ borderLeftWidth: "4px", borderLeftColor: draggingShiftForOverlay.color }}
                  >
                    {draggingShiftForOverlay.branchName && (
                      <div className="text-[10px] font-semibold text-gray-600">
                        {draggingShiftForOverlay.branchName}
                      </div>
                    )}
                    <div className="text-xs font-medium text-gray-900">{draggingShiftForOverlay.label}</div>
                    {(draggingShiftForOverlay.timeLabel || draggingShiftForOverlay.duration) && (
                      <div className="text-[10px] text-gray-500">
                        {[draggingShiftForOverlay.timeLabel, draggingShiftForOverlay.duration]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    )}
                    <div className="mt-1 text-[9px] font-medium text-indigo-600">Drop on a day to move</div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
      </Card>

      <Modal
        title="Confirm Deletion"
        open={isRoutineDeleteMultipleModalVisible}
        onCancel={cancelRoutineDeleteMultiple}
        footer={[
          <button key="cancel" className="cancel-btn mx-2" onClick={cancelRoutineDeleteMultiple}>
            Cancel
          </button>,
          <button
            key="confirm"
            className="danger-btn mx-2"
            onClick={confirmRoutineDeleteMultiple}
            disabled={isDeleteRoutinesMultipleLoading}
          >
            {isDeleteRoutinesMultipleLoading ? "Deleting..." : "Delete"}
          </button>,
        ]}
      >
        <p>
          Are you sure you want to delete all schedules for {selectedRoutineRowKeys.length} selected
          user{selectedRoutineRowKeys.length !== 1 ? "s" : ""}?
        </p>
      </Modal>

      <Modal
        title="Confirm Deletion"
        open={isRoutineDeleteModalVisible}
        onCancel={() => {
          setIsRoutineDeleteModalVisible(false);
          setRoutineDeleteUuid(null);
        }}
        footer={[
          <button
            key="cancel"
            className="cancel-btn mx-2"
            onClick={() => {
              setIsRoutineDeleteModalVisible(false);
              setRoutineDeleteUuid(null);
            }}
          >
            Cancel
          </button>,
          <button
            key="confirm"
            className="danger-btn mx-2"
            disabled={isDeleteRoutineLoading}
            onClick={async () => {
              if (!routineDeleteUuid) return;
              try {
                await deleteRoutineApi(routineDeleteUuid).unwrap();
                toast.success("Schedule deleted.");
                setIsRoutineDeleteModalVisible(false);
                setRoutineDeleteUuid(null);
              } catch (err: any) {
                toast.error(err?.data?.message || "Failed to delete schedule.");
              }
            }}
          >
            {isDeleteRoutineLoading ? "Deleting..." : "Delete"}
          </button>,
        ]}
      >
        <p>Are you sure you want to delete this schedule?</p>
      </Modal>

      <Modal
        title="Confirm Deletion"
        open={isShiftDeleteMultipleModalVisible}
        onCancel={cancelShiftDeleteMultiple}
        footer={[
          <button key="cancel" className="cancel-btn mx-2" onClick={cancelShiftDeleteMultiple}>
            Cancel
          </button>,
          <button
            key="confirm"
            className="danger-btn mx-2"
            onClick={confirmShiftDeleteMultiple}
            disabled={isDeleteShiftsMultipleLoading}
          >
            {isDeleteShiftsMultipleLoading ? "Deleting..." : "Delete"}
          </button>,
        ]}
      >
        <p>
          {scheduleMode === "month" || scheduleMode === "date"
            ? `Are you sure you want to delete ${selectedShiftUuids.length} selected shift${
                selectedShiftUuids.length !== 1 ? "s" : ""
              }?`
            : `Are you sure you want to delete all shifts for ${selectedShiftRowKeys.length} selected user${
                selectedShiftRowKeys.length !== 1 ? "s" : ""
              }?`}
        </p>
      </Modal>

      <Modal
        title="Confirm Deletion"
        open={isShiftDeleteModalVisible}
        onCancel={() => {
          setIsShiftDeleteModalVisible(false);
          setShiftDeleteUuid(null);
        }}
        footer={[
          <button
            key="cancel"
            className="cancel-btn mx-2"
            onClick={() => {
              setIsShiftDeleteModalVisible(false);
              setShiftDeleteUuid(null);
            }}
          >
            Cancel
          </button>,
          <button
            key="confirm"
            className="danger-btn mx-2"
            disabled={isDeleteShiftLoading}
            onClick={async () => {
              if (!shiftDeleteUuid) return;
              try {
                await deleteShiftApi(shiftDeleteUuid).unwrap();
                toast.success("Shift deleted.");
                setIsShiftDeleteModalVisible(false);
                setShiftDeleteUuid(null);
              } catch (err: any) {
                toast.error(err?.data?.message || "Failed to delete shift.");
              }
            }}
          >
            {isDeleteShiftLoading ? "Deleting..." : "Delete"}
          </button>,
        ]}
      >
        <p>Are you sure you want to delete this shift?</p>
      </Modal>

      <Modal
        title={routineEditingRecord ? "Edit Schedule" : "Add Schedule"}
        open={routineModalOpen}
        onOk={handleRoutineSave}
        onCancel={closeRoutineModal}
        confirmLoading={isCreateRoutineLoading || isUpdateRoutineLoading}
        okText="Save"
        cancelText="Cancel"
        destroyOnClose
      >
        <Form form={routineForm} layout="vertical" className="mt-4">
          <Form.Item name="userId" label="Assignee (optional, multiple allowed)">
            <Select
              mode="multiple"
              allowClear
              placeholder="Select one or more employees (optional)"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
              }
              options={
                filteredUserList?.map((userItem: any) => {
                  const uid = userItem.user?.id || userItem.id;
                  const userName =
                    userItem.user?.name ||
                    `${userItem.user?.firstName || ""} ${userItem.user?.lastName || ""}`.trim() ||
                    userItem.name ||
                    `${userItem.firstName || ""} ${userItem.lastName || ""}`.trim() ||
                    userItem.email ||
                    "N/A";
                  return { value: uid, label: userName };
                }) ?? []
              }
            />
          </Form.Item>
          <Form.Item
            name="branchId"
            label="Branch"
            rules={[{ required: true, message: "Please select branch." }]}
          >
            <Select
              placeholder="Select branch"
              allowClear={false}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
              }
              options={
                routineIsSuperAdmin
                  ? (branchList?.map((b: any) => ({
                      value: b.id ?? b.branchId,
                      label: b.name ?? b.branchName ?? `Branch ${b.id ?? b.branchId}`,
                    })) ?? [])
                  : (user?.branchId != null
                      ? (branchList ?? [])
                          .filter((b: any) => (b.id ?? b.branchId) === user.branchId)
                          .map((b: any) => ({
                              value: b.id ?? b.branchId,
                              label: b.name ?? b.branchName ?? `Branch ${b.id ?? b.branchId}`,
                            }))
                      : [])
              }
            />
          </Form.Item>
          {routineEditingRecord ? (
            <Form.Item
              name="dayOfWeek"
              label="Day of week"
              rules={[{ required: true, message: "Please select day." }]}
            >
              <Select
                placeholder="Select day"
                options={DAY_NAMES.slice(1).map((name, i) => ({ value: i + 1, label: name }))}
              />
            </Form.Item>
          ) : (
            <Form.Item
              name="dayOfWeeks"
              label="Days"
              rules={[{ required: true, message: "Please select at least one day." }]}
            >
              <Select
                mode="multiple"
                placeholder="Select days (e.g. Mon–Fri)"
                options={DAY_NAMES.slice(1).map((name, i) => ({ value: i + 1, label: name }))}
              />
            </Form.Item>
          )}
          <Form.Item name="startTime" label="Start Time">
            <TimePicker format="h:mm A" use12Hours style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="endTime" label="End Time">
            <TimePicker format="h:mm A" use12Hours style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={shiftEditingRecord?.uuid ? "Edit shift" : "Add shift"}
        open={isShiftModalVisible}
        onCancel={handleShiftModalCancel}
        footer={[
          <button key="cancel" className="cancel-btn mx-2" onClick={handleShiftModalCancel}>
            Cancel
          </button>,
          shiftEditingRecord?.uuid && (
            <button
              key="delete"
              type="button"
              className="danger-btn mx-2"
              disabled={isDeleteShiftLoading}
              onClick={() => {
                if (!shiftEditingRecord?.uuid) return;
                setShiftDeleteUuid(shiftEditingRecord.uuid);
                setIsShiftModalVisible(false);
                setShiftEditingRecord(null);
                setIsShiftDeleteModalVisible(true);
              }}
            >
              Delete
            </button>
          ),
          <button
            key="save"
            className="primary-btn mx-2"
            onClick={handleShiftModalOk}
            disabled={isShiftSaveLoading}
          >
            {isShiftSaveLoading ? "Saving..." : "Save"}
          </button>,
        ]}
        destroyOnClose
      >
        <Form form={shiftForm} layout="vertical" className="mt-4">
          <Form.Item name="userId" label="Employees">
            <Select
              mode="multiple"
              allowClear
              placeholder="Select one or more employees (optional)"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
              }
              options={
                filteredUserList?.map((userItem: any) => {
                  const uid = userItem.user?.id || userItem.id;
                  const userName =
                    userItem.user?.name ||
                    `${userItem.user?.firstName || ""} ${userItem.user?.lastName || ""}`.trim() ||
                    userItem.name ||
                    `${userItem.firstName || ""} ${userItem.lastName || ""}`.trim() ||
                    userItem.user?.email ||
                    userItem.email ||
                    "N/A";
                  return { value: uid, label: userName };
                }) ?? []
              }
            />
          </Form.Item>
          {routineIsSuperAdmin && (
            <Form.Item name="branchId" label="Branch" rules={[{ required: true, message: "Select branch" }]}>
              <Select
                placeholder="Select branch"
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
                }
                options={
                  branchList?.map((b: any) => ({
                    value: b.id ?? b.branchId,
                    label: b.name ?? b.branchName ?? `Branch ${b.id ?? b.branchId}`,
                  })) ?? []
                }
              />
            </Form.Item>
          )}
          {!shiftEditingRecord?.uuid && (
            <Form.Item name="copyToMultipleDates" valuePropName="checked">
              <Checkbox>Copy to multiple dates</Checkbox>
            </Form.Item>
          )}
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.copyToMultipleDates !== curr.copyToMultipleDates}
          >
            {({ getFieldValue }) =>
              getFieldValue("copyToMultipleDates") && !shiftEditingRecord?.uuid ? (
                <Form.Item
                  name="multipleDates"
                  label="Dates"
                  rules={[
                    {
                      validator: (_, value) => {
                        if (!getFieldValue("copyToMultipleDates")) return Promise.resolve();
                        const list = Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
                        if (list.length === 0) return Promise.reject(new Error("Select one or more dates"));
                        if (list.length > 31) return Promise.reject(new Error("Select at most 31 dates"));
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <DatePicker multiple style={{ width: "100%" }} />
                </Form.Item>
              ) : (
                <Form.Item
                  name="date"
                  label="Date"
                  rules={[
                    {
                      required: !getFieldValue("copyToMultipleDates"),
                      message: "Select date",
                    },
                  ]}
                >
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
              )
            }
          </Form.Item>
          <Form.Item name="startTime" label="Start time">
            <TimePicker format="h:mm A" use12Hours style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="endTime" label="End time">
            <TimePicker format="h:mm A" use12Hours style={{ width: "100%" }} />
          </Form.Item>
        </Form>
        {!shiftEditingRecord?.uuid && (
          <p className="text-xs text-gray-500 mt-2">
            Check &quot;Copy to multiple dates&quot; and select individual dates to create the same
            shift for each selected day (max 31 dates).
          </p>
        )}
      </Modal>
    </>
  );
};

export default ScheduleTab;
