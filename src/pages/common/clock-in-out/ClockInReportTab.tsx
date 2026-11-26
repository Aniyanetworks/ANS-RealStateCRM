// @ts-nocheck
import React, { useState, useMemo, useCallback } from "react";
import { Card, Select, DatePicker } from "antd";
import { format, parseISO } from "date-fns";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "/logo.svg";
import { useGetClockHistoryQuery } from "../../../redux/api/common/clockInOutSlice";
import { BarChartOutlined } from "@ant-design/icons";

interface ClockInReportTabProps {
  branchList: any[];
  filteredUserList: any[];
  isSuperAdmin: boolean;
}

function formatHoursMinutes(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDurationFromMinutes(totalMinutes: number): string {
  const safeMinutes = Math.max(0, Math.floor(totalMinutes || 0));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDecimalHoursFromHours(totalHours: number): string {
  const safe = Number.isFinite(totalHours) ? Math.max(0, totalHours) : 0;
  return `${safe.toFixed(1)}h`;
}

type ClockRecordLike = {
  action: string;
  createdAt: string;
  distance?: number | null;
  user?: {
    id?: number;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
};

const ClockInReportTab: React.FC<ClockInReportTabProps> = ({
  branchList,
  filteredUserList,
  isSuperAdmin,
}) => {
  const [reportDateRange, setReportDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [reportBranchId, setReportBranchId] = useState<number | undefined>(undefined);
  const [reportUserId, setReportUserId] = useState<number | undefined>(undefined);

  const reportStartDate = reportDateRange?.[0]?.format("YYYY-MM-DD");
  const reportEndDate = reportDateRange?.[1]?.format("YYYY-MM-DD");

  const { data: reportHistoryData } = useGetClockHistoryQuery(
    {
      page: 1,
      limit: 500,
      filterUserId: reportUserId,
      filterBranchId: reportBranchId,
      startDate: reportStartDate ?? undefined,
      endDate: reportEndDate ?? undefined,
    },
    { skip: !reportStartDate || !reportEndDate }
  );

  const { chartData, totalHours } = useMemo(() => {
    const records = reportHistoryData?.data?.records || [];
    const empty = { chartData: [] as { date: string; dateLabel: string; hours: number }[], totalHours: 0 };
    if (records.length === 0) return empty;
    const sorted = [...records].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const hoursByDate: Record<string, number> = {};
    const clockInByUser: Record<number, any> = {};
    for (const record of sorted) {
      const userId = record.user?.id ?? 0;
      const dateKey = format(parseISO(record.createdAt), "yyyy-MM-dd");
      if (record.action === "clock_in") {
        clockInByUser[userId] = record;
      } else if (record.action === "clock_out") {
        const clockIn = clockInByUser[userId];
        if (clockIn) {
          const outTime = new Date(record.createdAt).getTime();
          const inTime = new Date(clockIn.createdAt).getTime();
          const durationMs = outTime - inTime;
          const durationMinutes = Math.floor(durationMs / (1000 * 60));
          const hours = durationMinutes / 60;
          hoursByDate[dateKey] = (hoursByDate[dateKey] || 0) + hours;
          delete clockInByUser[userId];
        }
      }
    }
    const totalHours = Object.values(hoursByDate).reduce((sum, h) => sum + h, 0);
    const chartData = Object.entries(hoursByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, hours]) => ({
        date,
        dateLabel: format(parseISO(date + "T12:00:00"), "dd MMM"),
        hours,
      }));
    return { chartData, totalHours };
  }, [reportHistoryData?.data?.records]);

  const totalDuration =
    totalHours > 0 ? `${formatHoursMinutes(totalHours)} (${formatDecimalHoursFromHours(totalHours)})` : null;

  const handleDownloadReport = useCallback(() => {
    try {
      if (!reportStartDate || !reportEndDate) {
        toast.error("Please select a date range.");
        return;
      }

      const tableData = reportHistoryData?.data?.records ?? [];
      const records = [...tableData].sort((a: ClockRecordLike, b: ClockRecordLike) => {
        const timeDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (timeDiff !== 0) return timeDiff;
        if (a.action === b.action) return 0;
        return a.action === "clock_in" ? -1 : 1;
      });

      const latestClockInByUser: Record<number, ClockRecordLike | null> = {};
      const sessions: Array<{
        userName: string;
        dateLabel: string;
        clockIn: string;
        clockOut: string;
        durationMinutes: number;
        averageDistanceText: string;
      }> = [];

      records.forEach((record: ClockRecordLike) => {
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
        reportDateRange?.[0] && reportDateRange?.[1]
          ? `${reportDateRange[0].format("MMMM D, YYYY")} - ${reportDateRange[1].format("MMMM D, YYYY")}`
          : `${reportStartDate} - ${reportEndDate}`;

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

      const fileRange = `${reportDateRange?.[0]?.format("YYYYMMDD") ?? reportStartDate}-${reportDateRange?.[1]?.format("YYYYMMDD") ?? reportEndDate}`;
      doc.save(`clock-history-timesheet-${fileRange}.pdf`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate report.");
    }
  }, [reportStartDate, reportEndDate, reportDateRange, reportHistoryData?.data?.records]);

  return (
    <Card
      className="mb-0"
      title={
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span>
            <BarChartOutlined className="mr-2" />
            Clock-In Report
          </span>
          <button
            type="button"
            className="primary-btn flex items-center gap-2"
            onClick={handleDownloadReport}
            disabled={!reportStartDate || !reportEndDate}
          >
            Download Report
          </button>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-600">Date range:</span>
        <DatePicker.RangePicker
          value={reportDateRange}
          onChange={(dates) => setReportDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
          allowClear
          format="DD MMM YYYY"
          className="w-full sm:w-auto"
          style={{ fontWeight: 400 }}
        />
        {isSuperAdmin && (
          <>
            <Select
              style={{ width: 200 }}
              placeholder="Filter by branch"
              value={reportBranchId != null ? reportBranchId.toString() : "all"}
              onChange={(v) => setReportBranchId(v === "all" ? undefined : parseInt(v, 10))}
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
            <Select
              style={{ width: 250 }}
              placeholder="Filter by user"
              value={reportUserId != null ? reportUserId.toString() : "all"}
              onChange={(v) => setReportUserId(v === "all" ? undefined : parseInt(v, 10))}
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
        {reportStartDate && reportEndDate && totalDuration && (
          <div className="ml-auto flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5">
            <span className="text-sm font-medium text-gray-700">Total Duration:</span>
            <span className="text-sm font-semibold text-gray-900">{totalDuration}</span>
          </div>
        )}
      </div>
      {reportStartDate && reportEndDate ? (
        chartData.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No clock sessions in this date range.
          </div>
        ) : (
          (() => {
            const maxHours = Math.max(...chartData.map((d) => d.hours), 1);
            return (
              <div className="mt-4" style={{ minHeight: 280 }}>
                <div className="text-xs text-gray-500 mb-2">Hours per day</div>
                <div className="flex flex-col gap-3">
                  {chartData.map((d) => (
                    <div key={d.date} className="flex items-center gap-3">
                      <span className="w-14 text-sm text-gray-600 shrink-0">{d.dateLabel}</span>
                      <div className="flex-1 h-8 bg-gray-100 rounded overflow-hidden flex items-center">
                        <div
                          className="h-full bg-green-500 rounded min-w-[4px] transition-all"
                          style={{ width: `${(d.hours / maxHours) * 100}%` }}
                          title={formatHoursMinutes(d.hours)}
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700 shrink-0">
                          {formatHoursMinutes(d.hours)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()
        )
      ) : (
        <div className="py-8 text-center text-gray-500">
          Select a date range to view the report.
        </div>
      )}
    </Card>
  );
};

export default ClockInReportTab;
