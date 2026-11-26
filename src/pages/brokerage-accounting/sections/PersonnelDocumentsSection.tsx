// @ts-nocheck
// Personnel documents: versioned agent / employee documents with expiry tracking.
import React, { useState } from "react";
import { Checkbox, DatePicker, Drawer, Form, Input, Modal, Select, Space, Tag, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { AcctTable, AgentSelect, EmployeeSelect, fmtDate, useAcct, useAcctAction, ymd } from "../acctShared";

const TYPE_LABELS = {
  RECO_LICENCE: "RECO licence",
  ERRORS_OMISSIONS_INSURANCE: "E&O insurance",
  CONTRACTOR_AGREEMENT: "Independent contractor agreement",
  EMPLOYMENT_AGREEMENT: "Employment agreement",
  HST_REGISTRATION: "HST registration",
  DIRECT_DEPOSIT_VOID_CHEQUE: "Direct deposit / void cheque",
  PHOTO_ID: "Photo ID",
  TD1_FORMS: "TD1 forms",
  INCORPORATION_DOCUMENTS: "Incorporation documents",
  OTHER: "Other",
};
const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));

const ExpiryTag = ({ date }) => {
  if (!date) return <span className="text-gray-400">No expiry</span>;
  const days = dayjs(String(date).slice(0, 10)).diff(dayjs().startOf("day"), "day");
  if (days < 0) return <Tag color="red">Expired {fmtDate(date)}</Tag>;
  if (days <= 30) return <Tag color="orange">Expires {fmtDate(date)} ({days}d)</Tag>;
  if (days <= 90) return <Tag color="gold">Expires {fmtDate(date)}</Tag>;
  return <Tag color="green">{fmtDate(date)}</Tag>;
};

const UploadModal = ({ base, onClose }) => {
  const [form] = Form.useForm();
  const { run, loading } = useAcctAction();
  const [file, setFile] = useState(null);
  const ownerType = Form.useWatch("ownerType", form);
  const isVersion = Boolean(base?.versionGroupId);

  const save = async () => {
    const v = await form.validateFields();
    if (!file) return;
    const fd = new FormData();
    const payload = { ...v, expiryDate: ymd(v.expiryDate), versionGroupId: base?.versionGroupId };
    Object.entries(payload).forEach(([k, val]) => val !== undefined && val !== null && val !== "" && fd.append(k, String(val)));
    fd.append("file", file);
    if (await run("/personnel-documents", fd)) onClose();
  };

  return (
    <Modal title={isVersion ? `Upload new version — ${base.title}` : "Upload personnel document"} open onCancel={onClose} onOk={save} okButtonProps={{ disabled: !file }} confirmLoading={loading} destroyOnClose>
      <Form form={form} layout="vertical" initialValues={{ ownerType: "AGENT", documentType: "RECO_LICENCE", expiryDate: base?.expiryDate ? dayjs(base.expiryDate) : null }}>
        {!isVersion && (
          <>
            <Form.Item name="ownerType" label="Belongs to" rules={[{ required: true }]}><Select options={[{ value: "AGENT", label: "Agent" }, { value: "EMPLOYEE", label: "Staff employee" }]} /></Form.Item>
            {ownerType === "EMPLOYEE" ? (
              <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}><EmployeeSelect /></Form.Item>
            ) : (
              <Form.Item name="agentAccountId" label="Agent" rules={[{ required: true }]}><AgentSelect /></Form.Item>
            )}
            <Form.Item name="documentType" label="Document type" rules={[{ required: true }]}><Select options={TYPE_OPTIONS} /></Form.Item>
            <Form.Item name="title" label="Title (optional)"><Input placeholder="Defaults to the document type" /></Form.Item>
          </>
        )}
        <Form.Item name="expiryDate" label="Expiry date"><DatePicker className="w-full" /></Form.Item>
        <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        <Upload maxCount={1} beforeUpload={(f) => { setFile(f); return false; }} onRemove={() => setFile(null)} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx">
          <button type="button" className="primary-btn-ghost text-xs py-1 px-3"><UploadOutlined /> Select file</button>
        </Upload>
        {isVersion && <p className="text-xs text-gray-500 mt-2">The previous version stays in the document history.</p>}
      </Form>
    </Modal>
  );
};

const HistoryDrawer = ({ groupId, onClose }) => {
  const { rows, isFetching } = useAcct(groupId ? `/personnel-documents/history/${groupId}` : null);
  return (
    <Drawer title="Document history" open={!!groupId} onClose={onClose} width={720} destroyOnClose>
      <AcctTable
        title="Versions"
        loading={isFetching}
        rows={rows}
        rowKey="uuid"
        pagination={false}
        columns={[
          { title: "Version", dataIndex: "versionNumber", key: "v", render: (v, r) => <span>v{v} {r.isCurrent && <Tag color="green">Current</Tag>}</span>, exportValue: (r) => r.versionNumber },
          { title: "File", key: "f", render: (_, r) => <a href={r.fileUrl} target="_blank" rel="noreferrer">{r.originalFilename || "Open"}</a>, exportValue: (r) => r.originalFilename },
          { title: "Expiry", dataIndex: "expiryDate", key: "e", render: fmtDate },
          { title: "Uploaded", dataIndex: "createdAt", key: "c", render: fmtDate },
          { title: "Notes", dataIndex: "notes", key: "n" },
        ]}
      />
    </Drawer>
  );
};

const EditModal = ({ doc, onClose }) => {
  const [form] = Form.useForm();
  const { run, loading } = useAcctAction();
  const save = async () => {
    const v = await form.validateFields();
    if (await run(`/personnel-documents/${doc.uuid}`, { ...v, expiryDate: ymd(v.expiryDate) || null }, { method: "PATCH" })) onClose();
  };
  return (
    <Modal title={`Edit — ${doc.title}`} open onCancel={onClose} onOk={save} confirmLoading={loading} destroyOnClose>
      <Form form={form} layout="vertical" initialValues={{ title: doc.title, notes: doc.notes, expiryDate: doc.expiryDate ? dayjs(doc.expiryDate) : null }}>
        <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="expiryDate" label="Expiry date"><DatePicker className="w-full" allowClear /></Form.Item>
        <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
      </Form>
    </Modal>
  );
};

const PersonnelDocumentsSection = () => {
  const [filters, setFilters] = useState({ ownerType: "ALL", documentType: "ALL", expiring: undefined, includeHistory: false, search: "" });
  const { rows, isFetching } = useAcct("/personnel-documents", {
    ownerType: filters.ownerType,
    documentType: filters.documentType,
    expiringWithinDays: filters.expiring,
    includeHistory: filters.includeHistory ? 1 : undefined,
    search: filters.search,
  });
  const { run } = useAcctAction();
  const [uploading, setUploading] = useState(null);
  const [historyGroup, setHistoryGroup] = useState(null);
  const [editing, setEditing] = useState(null);

  return (
    <>
      <Space className="mb-2" wrap>
        <Select value={filters.ownerType} onChange={(v) => setFilters({ ...filters, ownerType: v })} style={{ width: 150 }} options={[{ value: "ALL", label: "Agents & staff" }, { value: "AGENT", label: "Agents" }, { value: "EMPLOYEE", label: "Staff" }]} />
        <Select value={filters.documentType} onChange={(v) => setFilters({ ...filters, documentType: v })} style={{ width: 230 }} options={[{ value: "ALL", label: "All document types" }, ...TYPE_OPTIONS]} />
        <Select allowClear value={filters.expiring} onChange={(v) => setFilters({ ...filters, expiring: v })} placeholder="Any expiry" style={{ width: 190 }} options={[{ value: 0, label: "Expired" }, { value: 30, label: "Expiring within 30 days" }, { value: 90, label: "Expiring within 90 days" }]} />
        <Input.Search allowClear placeholder="Search title or file" onSearch={(v) => setFilters({ ...filters, search: v })} style={{ width: 220 }} />
        <Checkbox checked={filters.includeHistory} onChange={(e) => setFilters({ ...filters, includeHistory: e.target.checked })}>Include old versions &amp; archived</Checkbox>
      </Space>
      <AcctTable
        title="Personnel documents"
        loading={isFetching}
        rows={rows}
        rowKey="uuid"
        extra={<button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => setUploading({})}>Upload Document</button>}
        columns={[
          { title: "Owner", dataIndex: "ownerName", key: "o", render: (v, r) => <span>{v} <span className="text-xs text-gray-400">{r.ownerType === "AGENT" ? "Agent" : "Staff"}</span></span>, exportValue: (r) => r.ownerName },
          { title: "Type", dataIndex: "documentType", key: "t", render: (t) => TYPE_LABELS[t] || t, exportValue: (r) => TYPE_LABELS[r.documentType] || r.documentType },
          { title: "Title", dataIndex: "title", key: "ti", render: (v, r) => <a href={r.fileUrl} target="_blank" rel="noreferrer">{v}</a>, exportValue: (r) => r.title },
          { title: "Version", dataIndex: "versionNumber", key: "v", render: (v, r) => <span>v{v}{!r.isCurrent && <Tag className="ml-1">Old</Tag>}{r.archivedAt && <Tag className="ml-1" color="default">Archived</Tag>}</span>, exportValue: (r) => r.versionNumber },
          { title: "Expiry", dataIndex: "expiryDate", key: "e", render: (d) => <ExpiryTag date={d} />, exportValue: (r) => String(r.expiryDate || "").slice(0, 10) },
          { title: "Uploaded", dataIndex: "createdAt", key: "c", render: fmtDate },
          {
            title: "", key: "actions",
            render: (_, r) => (
              <Space size={4} wrap>
                {r.isCurrent && !r.archivedAt && <button type="button" className="primary-btn text-xs py-0.5 px-2" onClick={() => setUploading(r)}>New Version</button>}
                {r.isCurrent && <button type="button" className="primary-btn-ghost text-xs py-0.5 px-2" onClick={() => setEditing(r)}>Edit</button>}
                <button type="button" className="primary-btn-ghost text-xs py-0.5 px-2" onClick={() => setHistoryGroup(r.versionGroupId)}>History</button>
                {r.isCurrent && (r.archivedAt
                  ? <button type="button" className="text-xs text-blue-600" onClick={() => run(`/personnel-documents/${r.uuid}/archive`, { archive: false })}>Restore</button>
                  : <button type="button" className="text-xs text-red-500" onClick={() => Modal.confirm({ title: "Archive this document?", content: "It and its versions are hidden from the active list. Files are kept.", onOk: () => run(`/personnel-documents/${r.uuid}/archive`, { archive: true }) })}>Archive</button>)}
              </Space>
            ),
          },
        ]}
      />
      {uploading && <UploadModal base={uploading} onClose={() => setUploading(null)} />}
      {editing && <EditModal doc={editing} onClose={() => setEditing(null)} />}
      <HistoryDrawer groupId={historyGroup} onClose={() => setHistoryGroup(null)} />
    </>
  );
};

export default PersonnelDocumentsSection;
