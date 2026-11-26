// @ts-nocheck
import { useMemo, useState } from "react";
import { DatePicker, Tag } from "antd";
import dayjs from "dayjs";
import { useGetAgentLeadStatisticsQuery } from "../../../../../redux/api/superadmin/leadManagementSlice";

const { RangePicker } = DatePicker;

const STATUS_TAG_COLOR: Record<string, string> = {
  New: "blue",
  "Attempted Contact": "gold",
  Connected: "cyan",
  Qualified: "green",
  "Active Search": "geekblue",
  "Offer Submitted": "purple",
  "Appointment Scheduled": "lime",
  "Active Listing": "orange",
  "Under Contract / Conditional": "magenta",
  Closed: "success",
  "Lost / Inactive": "default",
  "Not Qualified": "red",
};

// Bar fill per status — project palette variants
const STATUS_BAR_COLOR: Record<string, string> = {
  New: "#3B82F6",
  "Attempted Contact": "#D97706",
  Connected: "#06B6D4",
  Qualified: "#16A34A",
  "Active Search": "#4F46E5",
  "Offer Submitted": "#7C3AED",
  "Appointment Scheduled": "#65A30D",
  "Active Listing": "#EA580C",
  "Under Contract / Conditional": "#DB2777",
  Closed: "#059669",
  "Lost / Inactive": "#6B7280",
  "Not Qualified": "#DC2626",
};

const SUMMARY_STATUSES = ["Qualified", "Active Search", "Closed", "Lost / Inactive"];

const AgentLeadStatistics = () => {
  const now = dayjs();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    now.startOf("month"),
    now.endOf("month"),
  ]);

  // Fetch all statuses at once (no status filter)
  const queryParams = useMemo(() => ({
    status: undefined,
    startDate: dateRange[0]?.format("YYYY-MM-DD"),
    endDate: dateRange[1]?.format("YYYY-MM-DD"),
  }), [dateRange]);

  const { data, isLoading } = useGetAgentLeadStatisticsQuery(queryParams);

  // For an agent, statistics[0] is always their own data
  const agentData = data?.data?.statistics?.[0];
  const statusBreakdown: Record<string, number> = agentData?.statusBreakdown || {};
  const totalLeads = agentData?.totalLeads || 0;

  // Sort statuses by count desc
  const sortedStatuses = Object.entries(statusBreakdown).sort((a, b) => b[1] - a[1]);
  const maxCount = sortedStatuses.length > 0 ? sortedStatuses[0][1] : 1;

  return (
    <div className="p-3">
      {/* Header + date filter */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-gray-100">
        <div>
          <p className="text-sm font-semibold text-[#082624]">My Lead Statistics</p>
          <p className="text-xs text-gray-400">Your personal lead performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Date Range:</span>
          <RangePicker
            size="small"
            value={dateRange}
            onChange={(dates) => {
              if (dates?.[0] && dates?.[1]) setDateRange([dates[0], dates[1]]);
            }}
            format="MMM D, YYYY"
            allowClear={false}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10 text-gray-400 text-xs">Loading…</div>
      ) : !agentData ? (
        <div className="flex flex-col items-center py-10 text-gray-400">
          <span className="text-3xl mb-2">📊</span>
          <p className="text-xs">No lead data for the selected period</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-5 gap-1.5">
            {/* Total */}
            <div className="bg-white rounded-md border border-gray-100 shadow-sm px-2.5 py-1.5 flex items-center gap-2" style={{ borderLeft: "3px solid #082624" }}>
              <span className="text-xl font-bold text-[#082624] leading-none">{totalLeads}</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide leading-tight">Total Leads</span>
            </div>

            {/* Key statuses */}
            {SUMMARY_STATUSES.map((s) => {
              const count = statusBreakdown[s] || 0;
              const barColor = STATUS_BAR_COLOR[s] || "#0f766e";
              return (
                <div
                  key={s}
                  className="bg-white rounded-md border border-gray-100 shadow-sm px-2.5 py-1.5 flex items-center gap-2"
                  style={{ borderLeft: `3px solid ${barColor}` }}
                >
                  <span className="text-xl font-bold leading-none" style={{ color: barColor }}>{count}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide leading-tight truncate">{s}</span>
                </div>
              );
            })}
          </div>

          {/* Status breakdown bars */}
          {sortedStatuses.length > 0 && (
            <div className="bg-white rounded-md border border-gray-100 shadow-sm px-3 py-2">
              <p className="text-[10px] font-semibold text-[#082624] mb-2 uppercase tracking-wide">Status Breakdown</p>
              <div className="space-y-1.5">
                {sortedStatuses.map(([s, count]) => {
                  const barPct = Math.max(4, Math.round((count / maxCount) * 100));
                  const barColor = STATUS_BAR_COLOR[s] || "#0f766e";
                  const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
                  return (
                    <div key={s} className="flex items-center gap-3">
                      {/* Status label */}
                      <div className="flex-shrink-0" style={{ width: 180 }}>
                        <Tag
                          color={STATUS_TAG_COLOR[s] || "default"}
                          style={{ fontSize: 10, lineHeight: "16px", margin: 0, padding: "0 6px" }}
                        >
                          {s}
                        </Tag>
                      </div>
                      {/* Bar */}
                      <div className="flex-1 bg-gray-100 rounded-full" style={{ height: 5 }}>
                        <div
                          className="rounded-full transition-all duration-700"
                          style={{ width: `${barPct}%`, height: 5, backgroundColor: barColor }}
                        />
                      </div>
                      {/* Count + % */}
                      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ width: 56, textAlign: "right" }}>
                        <span className="text-xs font-bold text-[#082624]">{count}</span>
                        <span className="text-[10px] text-gray-400">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentLeadStatistics;
