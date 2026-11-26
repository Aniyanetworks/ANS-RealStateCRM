// @ts-nocheck
// Expenses & A/P: bills (approve → post → pay), vendors, recurring bills, A/P aging.
import React, { useState } from "react";
import { Alert, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tabs, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { AcctTable, AgentSelect, BankSelect, FREQUENCY_OPTIONS, GlSelect, Stat, StatusTag, VendorSelect, confirmWithReason, dateCol, money, moneyCol, useAcct, useAcctAction, ymd } from "../acctShared";

const METHODS = [
  { value: "CHEQUE", label: "Cheque" },
  { value: "EFT", label: "EFT" },
  { value: "CREDIT_CARD", label: "Credit card" },
  { value: "CASH", label: "Cash" },
  { value: "PAID_BY_EMPLOYEE", label: "Paid personally by employee (reimburse)" },
];

const BillModal = ({ bill, onClose }) => {
  const [form] = Form.useForm();
  const { run, loading } = useAcctAction();
  const [file, setFile] = useState(null);
  const taxInclusive = Form.useWatch("taxInclusive", form);
  const posted = bill?.status === "POSTED";
  const { rows: settings } = useAcct("/settings");

  const save = async () => {
    const v = await form.validateFields();
    const fd = new FormData();
    const payload = { ...v, uuid: bill?.uuid, billDate: ymd(v.billDate), dueDate: ymd(v.dueDate) };
    Object.entries(payload).forEach(([k, val]) => val !== undefined && val !== null && fd.append(k, String(val)));
    if (file) fd.append("file", file);
    if (await run("/bills", fd)) onClose();
  };

  return (
    <Modal title={bill?.uuid ? `Edit bill ${bill.billNumber}` : "Enter vendor bill"} open onCancel={onClose} onOk={save} confirmLoading={loading} width={680} destroyOnClose>
      {posted && <Alert className="mb-3" type="warning" showIcon message="This bill is posted: amounts and accounts are locked. Void and re-enter to change them." />}
      <Form
        form={form}
        layout="vertical"
        initialValues={bill?.uuid ? { ...bill, billDate: dayjs(bill.billDate), dueDate: bill.dueDate ? dayjs(bill.dueDate) : null, amount: Number(bill.amount), hstRate: Number(bill.hstRate), hstAmount: Number(bill.hstAmount), taxInclusive: false } : { billDate: dayjs(), hstRate: Number(settings?.hstRate ?? 13), taxInclusive: false }}
      >
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item name="vendorId" label="Vendor" rules={[{ required: true }]}><VendorSelect disabled={posted} /></Form.Item>
          <Form.Item name="invoiceNumber" label="Vendor invoice #"><Input /></Form.Item>
          <Form.Item name="billDate" label="Invoice date" rules={[{ required: true }]}><DatePicker className="w-full" disabled={posted} /></Form.Item>
          <Form.Item name="dueDate" label="Due date"><DatePicker className="w-full" /></Form.Item>
          <Form.Item name="glAccountId" label="Expense account (category)" rules={[{ required: true }]} className="col-span-2"><GlSelect types={["EXPENSE", "ASSET"]} disabled={posted} /></Form.Item>
        </div>
        {!posted && (
          <>
            <Form.Item name="taxInclusive" label="Amount entered" valuePropName="checked"><Switch checkedChildren="Tax-inclusive total" unCheckedChildren="Pre-tax amount" /></Form.Item>
            <div className="grid grid-cols-3 gap-x-4">
              {taxInclusive ? (
                <Form.Item name="total" label="Invoice total (incl. HST)" rules={[{ required: true }]}><InputNumber min={0.01} step={0.01} prefix="$" className="w-full" /></Form.Item>
              ) : (
                <Form.Item name="amount" label="Amount (pre-tax)" rules={[{ required: true }]}><InputNumber min={0.01} step={0.01} prefix="$" className="w-full" /></Form.Item>
              )}
              <Form.Item name="hstRate" label="HST rate %"><InputNumber min={0} max={30} step={0.5} className="w-full" /></Form.Item>
              {!taxInclusive && <Form.Item name="hstAmount" label="HST amount (blank = rate × amount)"><InputNumber min={0} step={0.01} prefix="$" className="w-full" /></Form.Item>}
            </div>
            <Form.Item name="rechargeAgentId" label="Recover this cost from an agent (optional)" extra="On posting, an expense-recovery charge is added to the agent's account."><AgentSelect allowClear /></Form.Item>
          </>
        )}
        <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
        <Upload beforeUpload={(f) => { setFile(f); return false; }} maxCount={1} onRemove={() => setFile(null)} accept=".pdf,.png,.jpg,.jpeg">
          <button type="button" className="primary-btn-ghost text-xs py-1 px-3"><UploadOutlined /> {bill?.attachmentName ? "Replace invoice file" : "Attach invoice"}</button>
        </Upload>
        {bill?.attachmentUrl && <a className="text-xs" href={bill.attachmentUrl} target="_blank" rel="noreferrer">Current: {bill.attachmentName}</a>}
      </Form>
    </Modal>
  );
};

const PayModal = ({ bill, onClose }) => {
  const [form] = Form.useForm();
  const { run, loading } = useAcctAction();
  const method = Form.useWatch("method", form);
  const due = Number(bill.total) - Number(bill.amountPaid);
  const save = async () => {
    const v = await form.validateFields();
    if (await run(`/bills/${bill.uuid}/pay`, { ...v, paymentDate: ymd(v.paymentDate) })) onClose();
  };
  return (
    <Modal title={`Pay ${bill.vendor?.name} — ${bill.billNumber}`} open onCancel={onClose} onOk={save} confirmLoading={loading} destroyOnClose>
      <p className="mb-3">Balance due: <b>{money(due)}</b></p>
      <Form form={form} layout="vertical" initialValues={{ paymentDate: dayjs(), amount: due, method: "CHEQUE" }}>
        <Form.Item name="paymentDate" label="Payment date" rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item>
        <Form.Item name="amount" label="Amount" rules={[{ required: true }]}><InputNumber min={0.01} max={due} step={0.01} prefix="$" className="w-full" /></Form.Item>
        <Form.Item name="method" label="Method" rules={[{ required: true }]}><Select options={METHODS} /></Form.Item>
        {method === "PAID_BY_EMPLOYEE" ? (
          <Form.Item name="payeeName" label="Employee who paid" rules={[{ required: true }]}><Input /></Form.Item>
        ) : (
          <Form.Item name="bankAccountId" label="Paid from" rules={[{ required: true }]}><BankSelect category={["OPERATING", "OTHER"]} /></Form.Item>
        )}
        {method === "CHEQUE" && <Form.Item name="chequeNumber" label="Cheque #" rules={[{ required: true }]}><Input /></Form.Item>}
        <Form.Item name="reference" label="Reference"><Input /></Form.Item>
      </Form>
    </Modal>
  );
};

const Bills = () => {
  const [filters, setFilters] = useState({ status: "ALL", paymentStatus: "ALL", approvalStatus: "ALL", search: "" });
  const [range, setRange] = useState([dayjs().startOf("year"), dayjs()]);
  const { rows, isFetching } = useAcct("/bills", { ...filters, from: ymd(range[0]), to: ymd(range[1]) });
  const { run } = useAcctAction();
  const [editing, setEditing] = useState(null);
  const [paying, setPaying] = useState(null);

  return (
    <div className="space-y-3">
      <Space wrap>
        <DatePicker.RangePicker value={range} onChange={(v) => v && setRange(v)} />
        <Select value={filters.approvalStatus} onChange={(v) => setFilters({ ...filters, approvalStatus: v })} style={{ width: 160 }} options={["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => ({ value: s, label: s === "ALL" ? "Any approval" : s }))} />
        <Select value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })} style={{ width: 140 }} options={["ALL", "DRAFT", "POSTED", "VOID"].map((s) => ({ value: s, label: s === "ALL" ? "Any status" : s }))} />
        <Select value={filters.paymentStatus} onChange={(v) => setFilters({ ...filters, paymentStatus: v })} style={{ width: 150 }} options={["ALL", "UNPAID", "PARTIAL", "PAID"].map((s) => ({ value: s, label: s === "ALL" ? "Any payment" : s }))} />
        <Input.Search allowClear placeholder="Vendor, invoice #, description" onSearch={(v) => setFilters({ ...filters, search: v })} style={{ width: 260 }} />
      </Space>
      <AcctTable
        title="Vendor bills"
        loading={isFetching}
        rows={rows}
        rowKey="uuid"
        extra={<button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => setEditing({})}>Enter Bill</button>}
        expandable={{
          rowExpandable: (r) => r.payments?.length > 0,
          expandedRowRender: (r) => (
            <Table size="small" rowKey="uuid" pagination={false} dataSource={r.payments} columns={[
              dateCol("Paid", "paymentDate"), { title: "Method", dataIndex: "method", key: "m" }, { title: "Cheque / Ref", key: "r", render: (_, p) => p.chequeNumber || p.reference || p.payeeName }, moneyCol("Amount", "amount"),
              { title: "", key: "v", render: (_, p) => (p.voidedAt ? <StatusTag status="VOID" /> : <Popconfirm title="Void this payment?" onConfirm={() => run(`/bill-payments/${p.uuid}/void`)}><button type="button" className="text-red-500 text-xs">Void</button></Popconfirm>) },
            ]} />
          ),
        }}
        columns={[
          { title: "Bill #", dataIndex: "billNumber", key: "n" },
          dateCol("Date", "billDate"),
          { title: "Vendor", key: "v", render: (_, r) => r.vendor?.name, exportValue: (r) => r.vendor?.name },
          { title: "Invoice #", dataIndex: "invoiceNumber", key: "i" },
          { title: "Category", key: "g", render: (_, r) => (r.glAccount ? `${r.glAccount.code} ${r.glAccount.name}` : ""), exportValue: (r) => r.glAccount?.name },
          moneyCol("Amount", "amount"),
          moneyCol("HST", "hstAmount"),
          moneyCol("Total", "total"),
          moneyCol("Due", "balanceDue"),
          { title: "Approval", dataIndex: "approvalStatus", key: "a", render: (s) => <StatusTag status={s} /> },
          { title: "Status", dataIndex: "status", key: "s", render: (s) => <StatusTag status={s} /> },
          { title: "Payment", dataIndex: "paymentStatus", key: "p", render: (s) => <StatusTag status={s} /> },
          {
            title: "", key: "actions",
            render: (_, r) => (
              <Space size={4} wrap>
                {r.status !== "VOID" && <button type="button" className="primary-btn-ghost text-xs py-0.5 px-2" onClick={() => setEditing(r)}>Edit</button>}
                {r.status === "DRAFT" && r.approvalStatus !== "APPROVED" && <button type="button" className="primary-btn text-xs py-0.5 px-2" onClick={() => run(`/bills/${r.uuid}/approve`, { decision: "APPROVED" })}>Approve</button>}
                {r.status === "DRAFT" && r.approvalStatus === "PENDING" && <button type="button" className="cancel-btn text-xs py-0.5 px-2" onClick={() => run(`/bills/${r.uuid}/approve`, { decision: "REJECTED" })}>Reject</button>}
                {r.status === "DRAFT" && r.approvalStatus === "APPROVED" && <button type="button" className="primary-btn text-xs py-0.5 px-2" onClick={() => run(`/bills/${r.uuid}/post`)}>Post</button>}
                {r.status === "POSTED" && r.paymentStatus !== "PAID" && <button type="button" className="primary-btn text-xs py-0.5 px-2" onClick={() => setPaying(r)}>Pay</button>}
                {r.status === "POSTED" && <button type="button" className="danger-btn text-xs py-0.5 px-2" onClick={() => confirmWithReason(`Void bill ${r.billNumber}?`, (reason) => run(`/bills/${r.uuid}/void`, { reason }))}>Void</button>}
                {r.status === "DRAFT" && <Popconfirm title="Delete this draft bill?" onConfirm={() => run(`/bills/${r.uuid}`, undefined, { method: "DELETE" })}><button type="button" className="text-red-500 text-xs">Delete</button></Popconfirm>}
                {r.attachmentUrl && <a className="text-xs" href={r.attachmentUrl} target="_blank" rel="noreferrer">Invoice</a>}
              </Space>
            ),
          },
        ]}
      />
      {editing && <BillModal bill={editing} onClose={() => setEditing(null)} />}
      {paying && <PayModal bill={paying} onClose={() => setPaying(null)} />}
    </div>
  );
};

const Vendors = () => {
  const { rows, isFetching } = useAcct("/vendors");
  const { run, loading } = useAcctAction();
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const open = (v) => { setEditing(v || {}); form.setFieldsValue(v || { active: true }); };
  const save = async () => { const v = await form.validateFields(); if (await run("/vendors", { ...v, id: editing?.id })) setEditing(null); };
  return (
    <>
      <AcctTable
        title="Vendors"
        loading={isFetching}
        rows={rows}
        extra={<button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => open(null)}>Add Vendor</button>}
        columns={[
          { title: "Name", dataIndex: "name", key: "n" },
          { title: "Contact", dataIndex: "contactName", key: "c" },
          { title: "Email", dataIndex: "email", key: "e" },
          { title: "Phone", dataIndex: "phone", key: "p" },
          { title: "HST #", dataIndex: "hstNumber", key: "h" },
          { title: "Bills", key: "b", render: (_, r) => r._count?.bills || 0 },
          { title: "Status", dataIndex: "active", key: "a", render: (a) => (a ? "Active" : "Inactive") },
          {
            title: "", key: "actions",
            render: (_, r) => (
              <Space>
                <button type="button" className="primary-btn-ghost text-xs py-1 px-3" onClick={() => open(r)}>Edit</button>
                {!r._count?.bills && <Popconfirm title="Delete vendor?" onConfirm={() => run(`/vendors/${r.id}`, undefined, { method: "DELETE" })}><button type="button" className="text-red-500 text-xs">Delete</button></Popconfirm>}
              </Space>
            ),
          },
        ]}
      />
      <Modal title={editing?.id ? "Edit vendor" : "Add vendor"} open={!!editing} onCancel={() => setEditing(null)} onOk={save} confirmLoading={loading} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Vendor name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="contactName" label="Contact name"><Input /></Form.Item>
          <Form.Item name="email" label="Email"><Input /></Form.Item>
          <Form.Item name="phone" label="Phone"><Input /></Form.Item>
          <Form.Item name="address" label="Address"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="hstNumber" label="HST number"><Input /></Form.Item>
          <Form.Item name="defaultGlAccountId" label="Default expense account"><GlSelect types={["EXPENSE"]} allowClear /></Form.Item>
          <Form.Item name="active" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const Recurring = () => {
  const { rows, isFetching } = useAcct("/recurring-bills");
  const { run, loading } = useAcctAction();
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const open = (r) => {
    setEditing(r || {});
    form.setFieldsValue(r ? { ...r, invoiceTotal: Number(r.invoiceTotal), hstRate: Number(r.hstRate), startDate: dayjs(r.startDate), nextInvoiceDate: dayjs(r.nextInvoiceDate) } : { frequency: "MONTHLY", hstRate: 13, startDate: dayjs(), nextInvoiceDate: dayjs(), dueDays: 0, active: true });
  };
  const save = async () => {
    const v = await form.validateFields();
    if (await run("/recurring-bills", { ...v, uuid: editing?.uuid, startDate: ymd(v.startDate), nextInvoiceDate: ymd(v.nextInvoiceDate) })) setEditing(null);
  };
  return (
    <>
      <Alert className="mb-3" type="info" showIcon message="Generating creates draft bills for every due period. They still need approval and posting — nothing is paid automatically." />
      <AcctTable
        title="Recurring bills"
        loading={isFetching}
        rows={rows}
        rowKey="uuid"
        extra={
          <>
            <button type="button" className="primary-btn-ghost text-xs py-1 px-3" disabled={loading} onClick={() => run("/recurring-bills/generate")}>Generate Due Bills</button>
            <button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => open(null)}>Add Recurring Bill</button>
          </>
        }
        columns={[
          { title: "Vendor", key: "v", render: (_, r) => r.vendor?.name, exportValue: (r) => r.vendor?.name },
          { title: "Description", dataIndex: "description", key: "d" },
          moneyCol("Total (incl. HST)", "invoiceTotal"),
          { title: "Frequency", dataIndex: "frequency", key: "f" },
          dateCol("Next invoice", "nextInvoiceDate"),
          { title: "Active", dataIndex: "active", key: "a", render: (a) => (a ? "Yes" : "No") },
          { title: "", key: "actions", render: (_, r) => <Space><button type="button" className="primary-btn-ghost text-xs py-1 px-3" onClick={() => open(r)}>Edit</button><Popconfirm title="Delete template?" onConfirm={() => run(`/recurring-bills/${r.uuid}`, undefined, { method: "DELETE" })}><button type="button" className="text-red-500 text-xs">Delete</button></Popconfirm></Space> },
        ]}
      />
      <Modal title={editing?.uuid ? "Edit recurring bill" : "Add recurring bill"} open={!!editing} onCancel={() => setEditing(null)} onOk={save} confirmLoading={loading} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="vendorId" label="Vendor" rules={[{ required: true }]}><VendorSelect /></Form.Item>
          <Form.Item name="glAccountId" label="Expense account" rules={[{ required: true }]}><GlSelect types={["EXPENSE"]} /></Form.Item>
          <Form.Item name="description" label="Description"><Input /></Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="invoiceTotal" label="Invoice total (incl. HST)" rules={[{ required: true }]}><InputNumber min={0.01} step={0.01} prefix="$" className="w-full" /></Form.Item>
            <Form.Item name="hstRate" label="HST rate %"><InputNumber min={0} max={30} className="w-full" /></Form.Item>
            <Form.Item name="frequency" label="Frequency" rules={[{ required: true }]}><Select options={FREQUENCY_OPTIONS} /></Form.Item>
            <Form.Item name="dueDays" label="Due in (days)"><InputNumber min={0} className="w-full" /></Form.Item>
            <Form.Item name="startDate" label="Start date"><DatePicker className="w-full" /></Form.Item>
            <Form.Item name="nextInvoiceDate" label="Next invoice date" rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item>
          </div>
          <Form.Item name="active" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const Aging = () => {
  const { rows, isFetching } = useAcct("/bills/aging");
  const b = rows?.buckets || {};
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Current" value={money(b.current)} />
        <Stat label="1–30 days" value={money(b.d1_30)} />
        <Stat label="31–60 days" value={money(b.d31_60)} />
        <Stat label="61–90 days" value={money(b.d61_90)} />
        <Stat label="90+ days" value={money(b.d90_plus)} />
      </div>
      <AcctTable title="A/P aging" loading={isFetching} rows={rows?.rows} rowKey="uuid" columns={[{ title: "Bill #", dataIndex: "billNumber", key: "n" }, { title: "Vendor", dataIndex: "vendor", key: "v" }, { title: "Invoice #", dataIndex: "invoiceNumber", key: "i" }, dateCol("Due", "dueDate"), { title: "Days past due", dataIndex: "daysPastDue", key: "d" }, moneyCol("Balance due", "balanceDue")]} />
    </div>
  );
};

const PayablesSection = () => (
  <Tabs items={[
    { key: "bills", label: "Bills", children: <Bills /> },
    { key: "vendors", label: "Vendors", children: <Vendors /> },
    { key: "recurring", label: "Recurring Bills", children: <Recurring /> },
    { key: "aging", label: "A/P Aging", children: <Aging /> },
  ]} />
);

export default PayablesSection;
