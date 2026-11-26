// @ts-nocheck
import React from "react";
import { DatePicker, Input, Select, Space, Table, Tag } from "antd";
import dayjs from "dayjs";

const ACTION_COLORS = { create: "green", post: "green", approved: "green", pay: "blue", reconcile: "blue", close: "purple", update: "gold", void: "red", delete: "red", rejected: "red", reopen: "orange" };

const fmtValue = (v) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

const ChangeDetail = ({ oldData, newData }) => {
  const oldObj = oldData && typeof oldData === "object" ? oldData : {};
  const newObj = newData && typeof newData === "object" ? newData : {};
  const keys = [...new Set([...Object.keys(oldObj), ...Object.keys(newObj)])].filter((k) => !["id", "uuid", "createdAt", "updatedAt"].includes(k));
  const changed = keys.filter((k) => JSON.stringify(oldObj[k]) !== JSON.stringify(newObj[k]));
  const show = oldData ? changed : keys;
  if (!show.length) return <span className="text-gray-400 text-xs">No field-level details recorded.</span>;
  return (
    <table className="text-xs w-full">
      <thead><tr className="text-gray-500"><th className="text-left pr-4">Field</th>{oldData && <th className="text-left pr-4">Before</th>}<th className="text-left">After</th></tr></thead>
      <tbody>
        {show.map((k) => (
          <tr key={k} className="align-top">
            <td className="pr-4 font-medium">{k}</td>
            {oldData && <td className="pr-4 text-red-600 break-all">{fmtValue(oldObj[k])}</td>}
            <td className="text-green-700 break-all">{fmtValue(newObj[k])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const csvEscape = (v) => (/[",\n]/.test(String(v ?? "")) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ""));

const AuditLogView = ({ rows = [], actions = [], subAreas = [], loading, filters, setFilters, title = "Audit log" }) => {
  const exportCsv = () => {
    const header = ["When", "User", "Area", "Action", "Record", "Description"];
    const lines = rows.map((r) => [dayjs(r.createdAt).format("YYYY-MM-DD HH:mm"), r.userName, r.subArea || r.area || r.activitySubArea, r.action, r.tableName, r.historyText].map(csvEscape).join(","));
    const url = URL.createObjectURL(new Blob(["﻿" + [header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <Space wrap>
        <DatePicker.RangePicker value={filters.range} onChange={(v) => setFilters({ ...filters, range: v })} allowClear />
        <Select value={filters.action || "ALL"} onChange={(v) => setFilters({ ...filters, action: v })} style={{ width: 170 }} options={[{ value: "ALL", label: "All actions" }, ...actions.map((a) => ({ value: a, label: a }))]} />
        {subAreas.length > 0 && <Select value={filters.subArea || "ALL"} onChange={(v) => setFilters({ ...filters, subArea: v })} style={{ width: 170 }} options={[{ value: "ALL", label: "All areas" }, ...subAreas.map((a) => ({ value: a, label: a }))]} />}
        <Input.Search allowClear placeholder="Search user or description" onSearch={(v) => setFilters({ ...filters, search: v })} style={{ width: 260 }} />
        <button type="button" className="primary-btn-ghost text-xs py-1 px-3" disabled={!rows.length} onClick={exportCsv}>CSV</button>
      </Space>
      <Table
        size="small"
        rowKey="id"
        loading={loading}
        dataSource={rows}
        scroll={{ x: true }}
        pagination={{ pageSize: 50 }}
        expandable={{ rowExpandable: (r) => Boolean(r.oldData || r.newData), expandedRowRender: (r) => <ChangeDetail oldData={r.oldData} newData={r.newData} /> }}
        columns={[
          { title: "When", dataIndex: "createdAt", key: "w", width: 150, render: (d) => dayjs(d).format("MMM D, YYYY h:mm A") },
          { title: "User", dataIndex: "userName", key: "u", render: (v) => v || "System" },
          { title: "Area", key: "a", render: (_, r) => r.subArea || r.activitySubArea || r.area || r.activityArea || "—" },
          { title: "Action", dataIndex: "action", key: "ac", render: (a) => <Tag color={ACTION_COLORS[a] || "default"}>{a || "—"}</Tag> },
          { title: "Description", dataIndex: "historyText", key: "h" },
        ]}
      />
    </div>
  );
};

export default AuditLogView;
