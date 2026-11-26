// @ts-nocheck
import { useMemo, useState } from "react";
import { DatePicker, Select, Tag } from "antd";
import dayjs from "dayjs";
import { useGetAgentLeadStatisticsQuery } from "../../../../../redux/api/superadmin/leadManagementSlice";

const { RangePicker } = DatePicker;

const ALL_STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "New", label: "New" },
  { value: "Attempted Contact", label: "Attempted Contact" },
  { value: "Connected", label: "Connected" },
  { value: "Qualified", label: "Qualified" },
  { value: "Active Search", label: "Active Search" },
  { value: "Offer Submitted", label: "Offer Submitted" },
  { value: "Appointment Scheduled", label: "Appointment Scheduled" },
  { value: "Active Listing", label: "Active Listing" },
  { value: "Under Contract / Conditional", label: "Under Contract / Conditional" },
  { value: "Closed", label: "Closed" },
  { value: "Lost / Inactive", label: "Lost / Inactive" },
  { value: "Not Qualified", label: "Not Qualified" },
];

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

const RANK_STYLES = [
  { border: "#D4A843", bar: "#D4A843", badge: "#FFFBEB", badgeText: "#92400E", label: "🥇" },
  { border: "#9CA3AF", bar: "#9CA3AF", badge: "#F9FAFB", badgeText: "#4B5563", label: "🥈" },
  { border: "#0f766e", bar: "#0f766e", badge: "#fffbeb", badgeText: "#7D6247", label: "🥉" },
];
const DEFAULT_RANK = { border: "#CBD5E1", bar: "#082624", badge: "#F8FAFC", badgeText: "#64748B" };

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
}

const LeadStatistics = () => {
  const now = dayjs();
  const [status, setStatus] = useState("all");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    now.startOf("month"),
    now.endOf("month"),
  ]);

  const queryParams = useMemo(() => ({
    status: status === "all" ? undefined : status,
    startDate: dateRange[0]?.format("YYYY-MM-DD"),
    endDate: dateRange[1]?.format("YYYY-MM-DD"),
  }), [status, dateRange]);

  const { data, isLoading } = useGetAgentLeadStatisticsQuery(queryParams);
  const statistics = data?.data?.statistics || [];
  const maxLeads = statistics.length > 0 ? statistics[0].totalLeads : 1;

  return (
    <div className="p-3">
      <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-gray-100">
        <span className="text-xs text-gray-500 font-medium">Status:</span>
        <Select
          value={status}
          onChange={setStatus}
          options={ALL_STATUS_OPTIONS}
          style={{ width: 170 }}
          size="small"
        />
        <span className="text-xs text-gray-500 font-medium">Date:</span>
        <RangePicker
          size="small"
          value={dateRange}
          onChange={(dates) => {
            if (dates?.[0] && dates?.[1]) setDateRange([dates[0], dates[1]]);
          }}
          format="MMM D, YYYY"
          allowClear={false}
        />
        <span className="text-xs text-gray-400 ml-auto">
          {statistics.length} agent{statistics.length !== 1 ? "s" : ""}
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10 text-gray-400 text-xs">Loading…</div>
      ) : statistics.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-gray-400">
          <span className="text-3xl mb-2">📊</span>
          <p className="text-xs">No data for the selected filters</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {statistics.map((agent, index) => {
            const rs = index < 3 ? RANK_STYLES[index] : DEFAULT_RANK;
            const barPct = Math.max(6, Math.round((agent.totalLeads / maxLeads) * 100));
            const statusKeys = Object.keys(agent.statusBreakdown);

            return (
              <div
                key={agent.agentId}
                className="bg-white rounded-md flex overflow-hidden"
                style={{ border: "1px solid #f0ede8", borderLeft: `3px solid ${rs.border}` }}
              >
                <div
                  className="flex items-center justify-center flex-shrink-0 w-9"
                  style={{ backgroundColor: rs.badge }}
                >
                  {index < 3 ? (
                    <span className="text-base leading-none">{rs.label}</span>
                  ) : (
                    <span className="text-[10px] font-bold" style={{ color: rs.badgeText }}>
                      #{index + 1}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0 px-3 py-2">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0"
                      style={{ fontSize: 9, fontWeight: 700, backgroundColor: rs.border }}
                    >
                      {getInitials(agent.agentName)}
                    </div>
                    <span className="text-xs font-semibold text-[#082624] truncate">
                      {agent.agentName}
                    </span>
                  </div>

                  <div className="bg-gray-100 rounded-full mb-1.5" style={{ height: 4, maxWidth: "70%" }}>
                    <div
                      className="rounded-full transition-all duration-700"
                      style={{ width: `${barPct}%`, height: 4, backgroundColor: rs.bar }}
                    />
                  </div>

                  {statusKeys.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {statusKeys.map((s) => (
                        <Tag
                          key={s}
                          color={STATUS_TAG_COLOR[s] || "default"}
                          style={{ fontSize: 10, lineHeight: "16px", margin: 0, padding: "0 5px" }}
                        >
                          {s}: {agent.statusBreakdown[s]}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className="flex flex-col items-center justify-center flex-shrink-0 px-3"
                  style={{ borderLeft: "1px solid #f0ede8", minWidth: 56 }}
                >
                  <span className="text-lg font-bold leading-none" style={{ color: rs.border }}>
                    {agent.totalLeads}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5">
                    {agent.totalLeads === 1 ? "lead" : "leads"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LeadStatistics;
