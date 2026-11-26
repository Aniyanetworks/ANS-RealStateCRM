// @ts-nocheck
// Accounting audit log: every posting, approval, void and settings change in brokerage accounting
// (and, optionally, time clock activity).
import React, { useState } from "react";
import { Segmented } from "antd";
import dayjs from "dayjs";
import AuditLogView from "../../common/AuditLogView";
import { useAcct, ymd } from "../acctShared";

const AuditLogSection = () => {
  const [area, setArea] = useState("accounting");
  const [filters, setFilters] = useState({ range: [dayjs().subtract(30, "day"), dayjs()], action: "ALL", subArea: "ALL", search: "" });
  const { rows, isFetching } = useAcct("/audit-log", {
    area,
    from: ymd(filters.range?.[0]),
    to: ymd(filters.range?.[1]),
    action: filters.action,
    subArea: filters.subArea,
    search: filters.search,
  });
  return (
    <div className="space-y-3">
      <Segmented value={area} onChange={(v) => setArea(v)} options={[{ label: "Accounting", value: "accounting" }, { label: "Time Clock", value: "time-clock" }, { label: "All", value: "ALL" }]} />
      <AuditLogView title="Accounting audit log" rows={rows?.rows || []} actions={rows?.actions || []} subAreas={rows?.subAreas || []} loading={isFetching} filters={filters} setFilters={setFilters} />
    </div>
  );
};

export default AuditLogSection;
