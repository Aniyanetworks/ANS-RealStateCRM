// @ts-nocheck
// Tax Slips: upload T4/T4A/T5018 PDFs per agent or employee and release them to the recipient.
import React, { useState } from "react";
import { Form, InputNumber, Modal, Popconfirm, Select, Space, Upload, Input } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { AcctTable, AgentSelect, EmployeeSelect, StatusTag, fmtDate, useAcct, useAcctAction } from "../acctShared";

const SLIP_TYPES = ["T4", "T4A", "T4A_NR", "T5018", "OTHER"].map((t) => ({ value: t, label: t.replace("_", "-") }));

const TaxSlipsSection = () => {
  const [taxYear, setTaxYear] = useState(dayjs().year() - 1);
  const [slipType, setSlipType] = useState("ALL");
  const { rows, isFetching } = useAcct("/tax-slips", { taxYear, slipType });
  const { run, loading } = useAcctAction();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [form] = Form.useForm();
  const recipientType = Form.useWatch("recipientType", form);

  const upload = async () => {
    const v = await form.validateFields();
    if (!file) return;
    const fd = new FormData();
    Object.entries(v).forEach(([k, val]) => val !== undefined && val !== null && fd.append(k, String(val)));
    fd.append("file", file);
    if (await run("/tax-slips", fd)) { setOpen(false); setFile(null); form.resetFields(); }
  };

  return (
    <>
      <Space className="mb-2" wrap>
        <InputNumber value={taxYear} onChange={setTaxYear} min={2000} max={2100} />
        <Select value={slipType} onChange={setSlipType} style={{ width: 160 }} options={[{ value: "ALL", label: "All slip types" }, ...SLIP_TYPES]} />
      </Space>
      <AcctTable
        title={`Tax slips ${taxYear}`}
        loading={isFetching}
        rows={rows}
        rowKey="uuid"
        extra={<button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => setOpen(true)}>Upload Slip</button>}
        columns={[
          { title: "Recipient", dataIndex: "recipientName", key: "r" },
          { title: "Type", dataIndex: "recipientType", key: "rt" },
          { title: "Slip", dataIndex: "slipType", key: "s" },
          { title: "Year", dataIndex: "taxYear", key: "y" },
          { title: "File", key: "f", render: (_, r) => (r.fileUrl ? <a href={r.fileUrl} target="_blank" rel="noreferrer">{r.originalFilename}</a> : "—"), exportValue: (r) => r.originalFilename },
          { title: "Status", dataIndex: "status", key: "st", render: (s) => <StatusTag status={s} /> },
          { title: "Released", dataIndex: "releasedAt", key: "ra", render: fmtDate },
          {
            title: "", key: "actions",
            render: (_, r) => (
              <Space size={4}>
                {r.status === "DRAFT" ? (
                  <button type="button" className="primary-btn text-xs py-0.5 px-2" onClick={() => run(`/tax-slips/${r.uuid}/release`, { release: true })}>Release</button>
                ) : (
                  <button type="button" className="cancel-btn text-xs py-0.5 px-2" onClick={() => run(`/tax-slips/${r.uuid}/release`, { release: false })}>Withdraw</button>
                )}
                {r.status === "DRAFT" && <Popconfirm title="Delete slip?" onConfirm={() => run(`/tax-slips/${r.uuid}`, undefined, { method: "DELETE" })}><button type="button" className="text-red-500 text-xs">Delete</button></Popconfirm>}
              </Space>
            ),
          },
        ]}
      />
      <Modal title="Upload tax slip" open={open} onCancel={() => setOpen(false)} onOk={upload} okButtonProps={{ disabled: !file }} confirmLoading={loading} destroyOnClose>
        <Form form={form} layout="vertical" initialValues={{ taxYear, slipType: "T4A", recipientType: "AGENT" }}>
          <div className="grid grid-cols-3 gap-x-4">
            <Form.Item name="taxYear" label="Tax year" rules={[{ required: true }]}><InputNumber min={2000} max={2100} className="w-full" /></Form.Item>
            <Form.Item name="slipType" label="Slip type" rules={[{ required: true }]}><Select options={SLIP_TYPES} /></Form.Item>
            <Form.Item name="recipientType" label="Recipient" rules={[{ required: true }]}><Select options={[{ value: "AGENT", label: "Agent" }, { value: "EMPLOYEE", label: "Employee" }]} /></Form.Item>
          </div>
          {recipientType === "EMPLOYEE" ? (
            <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}><EmployeeSelect /></Form.Item>
          ) : (
            <Form.Item name="agentAccountId" label="Agent" rules={[{ required: true }]}><AgentSelect /></Form.Item>
          )}
          <Form.Item name="recipientName" label="Name on slip (optional)"><Input /></Form.Item>
          <Upload accept="application/pdf" maxCount={1} beforeUpload={(f) => { setFile(f); return false; }} onRemove={() => setFile(null)}>
            <button type="button" className="primary-btn-ghost text-xs py-1 px-3"><UploadOutlined /> Select PDF</button>
          </Upload>
        </Form>
        <p className="text-xs text-gray-500 mt-2">Slips are saved as drafts. Agents see released slips under My Accounting.</p>
      </Modal>
    </>
  );
};

export default TaxSlipsSection;
