// @ts-nocheck
// Shared helpers & pickers for Brokerage Accounting screens (merged from ANS Accounting).
import React, { useState } from "react";
import { Select, Table, Tag, Space, Modal, Input } from "antd";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAcctGetQuery, useAcctMutateMutation } from "../../redux/api/accounting/brokerageAccountingSlice";

export const money = (n: any) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number(n) || 0);
export const fmtDate = (d: any) => (d ? dayjs(String(d).slice(0, 10)).format("MMM D, YYYY") : "—");
export const ymd = (d: any) => (d ? dayjs(d).format("YYYY-MM-DD") : undefined);
export const today = () => dayjs().format("YYYY-MM-DD");
export const agentLabel = (a: any) => a?.displayName || a?.name || [a?.firstName, a?.lastName].filter(Boolean).join(" ") || a?.email || "—";
export const apiError = (e: any, fb = "Something went wrong.") => e?.data?.message || e?.message || fb;

const STATUS_COLORS: Record<string, string> = {
  POSTED: "green", PAID: "green", APPROVED: "green", RECONCILED: "green", RELEASED: "green", ELIGIBLE: "green", completed: "green",
  DRAFT: "default", OPEN: "gold", PENDING: "gold", PARTIAL: "blue", UNPAID: "orange", FILED: "blue", IN_PROGRESS: "gold", pending: "gold",
  VOID: "red", REJECTED: "red", REVERSED: "red", OVERDUE: "red", MISSING: "red", CLOSED: "green", NOT_STARTED: "default",
};
export const StatusTag = ({ status }: { status?: string }) => <Tag color={STATUS_COLORS[status || ""] || "default"}>{String(status || "—").replace(/_/g, " ")}</Tag>;

// Show each distinct load error once (the page banner already covers "not set up" 503s).
const shownErrors = new Map<string, number>();
function reportLoadError(error: any) {
  if (!error || error.status === 503 || error.status === 401) return;
  const msg = apiError(error, "Could not load accounting data.");
  const last = shownErrors.get(msg) || 0;
  if (Date.now() - last < 10000) return;
  shownErrors.set(msg, Date.now());
  toast.error(msg);
}

/** Data hook: returns the `data` payload of a GET. Load errors are surfaced as a toast. */
export function useAcct(path: string | null, params?: any, opts: any = {}) {
  const q = useAcctGetQuery({ path: path || "", params }, { skip: !path || opts.skip, refetchOnMountOrArgChange: true });
  React.useEffect(() => {
    if (q.isError) reportLoadError(q.error);
  }, [q.isError, q.error]);
  return { ...q, rows: q.data?.data };
}

/** Mutation helper with toast messages and an optional confirm-on-warning retry. */
export function useAcctAction() {
  const [mutate, state] = useAcctMutateMutation();
  const run = async (path: string, body?: any, { method = "POST", success, silent = false }: any = {}) => {
    try {
      const res = await mutate({ path, method, body }).unwrap();
      if (!silent) toast.success(success || res?.message || "Saved.");
      return res?.data ?? true;
    } catch (e) {
      toast.error(apiError(e));
      return null;
    }
  };
  return { run, loading: state.isLoading };
}

/** Ask for a reason, then run (used for voids). */
export function confirmWithReason(title: string, onOk: (reason: string) => any) {
  let reason = "";
  Modal.confirm({
    title,
    content: <Input.TextArea rows={3} placeholder="Reason (required)" onChange={(e) => (reason = e.target.value)} />,
    okText: "Confirm",
    okButtonProps: { danger: true },
    onOk: async () => {
      if (!reason.trim()) {
        toast.error("A reason is required.");
        throw new Error("reason required");
      }
      await onOk(reason.trim());
    },
  });
}

// ---------- Export ----------

const cellText = (col: any, row: any) => {
  const v = col.exportValue ? col.exportValue(row) : col.dataIndex ? row[col.dataIndex] : "";
  return v === null || v === undefined ? "" : String(v);
};

export function exportCsv(filename: string, columns: any[], rows: any[]) {
  const cols = columns.filter((c) => c.title && c.key !== "actions");
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = [cols.map((c) => esc(String(c.title))).join(","), ...rows.map((r) => cols.map((c) => esc(cellText(c, r))).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPdf(title: string, columns: any[], rows: any[], subtitle?: string) {
  const cols = columns.filter((c) => c.title && c.key !== "actions");
  const doc = new jsPDF({ orientation: cols.length > 6 ? "landscape" : "portrait", unit: "mm", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 33, 65);
  doc.text("ANS REALSTATECRM", 12, 14);
  doc.setFontSize(11);
  doc.text(title, doc.internal.pageSize.getWidth() - 12, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(90, 100, 115);
  doc.text(subtitle || `Generated ${new Date().toLocaleString("en-CA")}`, 12, 19);
  autoTable(doc, {
    startY: 24,
    head: [cols.map((c) => String(c.title))],
    body: rows.map((r) => cols.map((c) => cellText(c, r))),
    styles: { fontSize: 7.5 },
    headStyles: { fillColor: [15, 33, 65] },
  });
  doc.save(`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
}

/** antd Table with CSV / PDF export. Columns may define exportValue(row) for formatted output. */
export const AcctTable = ({ title, columns, rows, loading, rowKey = "id", extra, pagination = { pageSize: 25 }, subtitle, ...rest }: any) => (
  <div>
    <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
      <div className="font-semibold">{title}</div>
      <Space wrap>
        {extra}
        <button type="button" className="primary-btn-ghost text-xs py-1 px-3" disabled={!rows?.length} onClick={() => exportCsv(String(title || "export").toLowerCase().replace(/\s+/g, "-"), columns, rows || [])}>
          CSV
        </button>
        <button type="button" className="primary-btn-ghost text-xs py-1 px-3" disabled={!rows?.length} onClick={() => exportPdf(String(title || "Report"), columns, rows || [], subtitle)}>
          PDF
        </button>
      </Space>
    </div>
    <Table size="small" rowKey={rowKey} loading={loading} columns={columns} dataSource={rows || []} scroll={{ x: true }} pagination={pagination} {...rest} />
  </div>
);

export const moneyCol = (title: string, dataIndex: string, extra: any = {}) => ({
  title, dataIndex, key: dataIndex, align: "right", render: (v: any) => money(v), exportValue: (r: any) => Number(r[dataIndex] || 0).toFixed(2), ...extra,
});
export const dateCol = (title: string, dataIndex: string) => ({ title, dataIndex, key: dataIndex, render: fmtDate, exportValue: (r: any) => String(r[dataIndex] || "").slice(0, 10) });

export const Stat = ({ label, value, sub }: any) => (
  <div className="p-4 rounded-lg border border-gray-200 bg-white">
    <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
    <div className="text-xl font-semibold mt-1">{value}</div>
    {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
  </div>
);

// ---------- Pickers ----------

export const BankSelect = ({ category, value, onChange, placeholder = "Select bank account", ...rest }: any) => {
  const { rows } = useAcct("/bank-accounts");
  const opts = (rows || []).filter((b: any) => !category || (Array.isArray(category) ? category.includes(b.accountCategory) : b.accountCategory === category));
  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      showSearch
      optionFilterProp="label"
      options={opts.map((b: any) => ({ value: b.id, label: `${b.name}${b.accountCategory ? ` · ${b.accountCategory.replace(/_/g, " ")}` : ""}` }))}
      {...rest}
    />
  );
};

export const GlSelect = ({ types, value, onChange, placeholder = "Select account", ...rest }: any) => {
  const { rows } = useAcct("/gl-accounts");
  const opts = (rows || []).filter((a: any) => a.active && (!types || types.includes(a.accountType)));
  return <Select value={value} onChange={onChange} placeholder={placeholder} showSearch optionFilterProp="label" options={opts.map((a: any) => ({ value: a.id, label: `${a.code} · ${a.name}` }))} {...rest} />;
};

export const AgentSelect = ({ value, onChange, placeholder = "Select agent", ...rest }: any) => {
  const { rows } = useAcct("/agents");
  return <Select value={value} onChange={onChange} placeholder={placeholder} showSearch optionFilterProp="label" options={(rows || []).map((a: any) => ({ value: a.id, label: agentLabel(a) }))} {...rest} />;
};

export const VendorSelect = ({ value, onChange, ...rest }: any) => {
  const { rows } = useAcct("/vendors");
  return <Select value={value} onChange={onChange} placeholder="Select vendor" showSearch optionFilterProp="label" options={(rows || []).filter((v: any) => v.active).map((v: any) => ({ value: v.id, label: v.name }))} {...rest} />;
};

export const EmployeeSelect = ({ value, onChange, ...rest }: any) => {
  const { rows } = useAcct("/employees");
  return <Select value={value} onChange={onChange} placeholder="Select employee" showSearch optionFilterProp="label" options={(rows || []).map((e: any) => ({ value: e.id, label: e.name }))} {...rest} />;
};

export const tradeLabel = (t: any) =>
  [t?.tradeSheetTypeId || `Trade #${t?.id}`, t?.properties?.[0]?.propertyAddress, t?.name || [t?.firstName, t?.lastName].filter(Boolean).join(" ")].filter(Boolean).join(" · ");

/** Searchable trade sheet picker (by trade number, client or address). */
export const TradeSelect = ({ value, onChange, ...rest }: any) => {
  const [q, setQ] = useState("");
  const { rows, isFetching } = useAcct("/trust/trades", { q });
  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder="Search trade number, client or address"
      showSearch
      filterOption={false}
      onSearch={setQ}
      loading={isFetching}
      allowClear
      options={(rows || []).map((t: any) => ({ value: t.id, label: tradeLabel(t) }))}
      {...rest}
    />
  );
};

export const FREQUENCY_OPTIONS = ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"].map((f) => ({ value: f, label: f.charAt(0) + f.slice(1).toLowerCase() }));
