// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Card, Checkbox, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tabs } from "antd";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { AcctTable, BankSelect, GlSelect, StatusTag, Stat, confirmWithReason, dateCol, fmtDate, money, moneyCol, useAcct, useAcctAction, ymd } from "../acctShared";

const CATEGORIES = [
  { value: "OPERATING", label: "Operating" },
  { value: "REAL_ESTATE_TRUST", label: "Real Estate Trust" },
  { value: "COMMISSION_TRUST", label: "Commission Trust" },
  { value: "OTHER", label: "Other" },
];

const BankAccounts = () => {
  const { rows, isFetching } = useAcct("/bank-accounts");
  const { run, loading } = useAcctAction();
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const open = (b) => {
    setEditing(b || {});
    form.setFieldsValue(b ? { ...b, openingBalance: Number(b.openingBalance || 0) } : { accountCategory: "OPERATING", openingBalance: 0 });
  };
  const save = async () => {
    const v = await form.validateFields();
    if (await run("/bank-accounts", { ...v, id: editing?.id })) setEditing(null);
  };

  return (
    <>
      <Alert
        className="mb-3"
        type="info"
        showIcon
        message="Set each account's category so trust postings go to the right ledger. Opening balance is the bank balance on the day you start using this module; book balance adds every posted entry."
      />
      <AcctTable
        title="Bank accounts"
        loading={isFetching}
        rows={rows}
        extra={<button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => open(null)}>Add Bank Account</button>}
        columns={[
          { title: "Name", dataIndex: "name", key: "name" },
          { title: "Category", dataIndex: "accountCategory", key: "cat", render: (c) => (c ? c.replace(/_/g, " ") : <span className="text-orange-500">Not set</span>) },
          { title: "Institution", dataIndex: "institution", key: "inst", render: (v, r) => [v, r.accountNumberLast4 && `••${r.accountNumberLast4}`].filter(Boolean).join(" ") || "—" },
          moneyCol("Opening", "openingBalance"),
          moneyCol("Book balance", "bookBalance"),
          { title: "Status", dataIndex: "status", key: "status" },
          { title: "", key: "actions", render: (_, r) => <button type="button" className="primary-btn-ghost text-xs py-1 px-3" onClick={() => open(r)}>Edit</button> },
        ]}
      />
      <Modal title={editing?.id ? "Edit bank account" : "Add bank account"} open={!!editing} onCancel={() => setEditing(null)} onOk={save} confirmLoading={loading} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Account name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="accountCategory" label="Category" rules={[{ required: true }]}><Select options={CATEGORIES} /></Form.Item>
          <Form.Item name="institution" label="Institution"><Input placeholder="e.g. TD Canada Trust" /></Form.Item>
          <Form.Item name="accountNumberLast4" label="Account number (last 4)" rules={[{ pattern: /^\d{4}$/, message: "4 digits" }]}><Input maxLength={4} /></Form.Item>
          <Form.Item name="openingBalance" label="Opening balance"><InputNumber className="w-full" prefix="$" step={0.01} /></Form.Item>
          <Form.Item name="glAccountId" label="GL cash account (optional — defaults by category)"><GlSelect types={["ASSET"]} allowClear /></Form.Item>
          <Form.Item name="status" label="Status" initialValue="active"><Select options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const Register = () => {
  const [bankId, setBankId] = useState();
  const [range, setRange] = useState([dayjs().startOf("month"), dayjs()]);
  const { rows, isFetching } = useAcct(bankId ? `/bank-accounts/${bankId}/register` : null, { from: ymd(range[0]), to: ymd(range[1]) });
  return (
    <div className="space-y-3">
      <Space wrap>
        <BankSelect value={bankId} onChange={setBankId} style={{ minWidth: 280 }} />
        <DatePicker.RangePicker value={range} onChange={(v) => v && setRange(v)} />
      </Space>
      {rows && (
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Opening balance" value={money(rows.openingBalance)} />
          <Stat label="Book balance" value={money(rows.bookBalance)} sub={`as of ${ymd(range[1])}`} />
          <Stat label="Entries" value={rows.rows.length} />
        </div>
      )}
      <AcctTable
        title={`Bank register${rows?.bank ? ` — ${rows.bank.name}` : ""}`}
        loading={isFetching}
        rows={rows?.rows}
        columns={[dateCol("Date", "date"), { title: "Entry", dataIndex: "entryNumber", key: "e" }, { title: "Source", dataIndex: "source", key: "s" }, { title: "Description", dataIndex: "memo", key: "m" }, moneyCol("Deposit", "deposit"), moneyCol("Withdrawal", "withdrawal"), moneyCol("Balance", "balance")]}
      />
    </div>
  );
};

const Reconcile = () => {
  const [bankId, setBankId] = useState();
  const [periodEnd, setPeriodEnd] = useState(dayjs().subtract(1, "month").endOf("month"));
  const { rows: ws, isFetching } = useAcct(bankId ? "/reconciliations/worksheet" : null, { bankAccountId: bankId, periodEnd: ymd(periodEnd) });
  const { rows: history } = useAcct("/reconciliations");
  const { run, loading } = useAcctAction();
  const [cleared, setCleared] = useState<number[]>([]);
  const [statement, setStatement] = useState<number | null>(null);

  useEffect(() => {
    setCleared(ws?.reconciliation?.clearedLineIds || []);
    setStatement(ws?.reconciliation ? Number(ws.reconciliation.statementBalance) : null);
  }, [ws?.reconciliation?.id, bankId, ymd(periodEnd)]);

  const clearedTotal = useMemo(() => (ws?.lines || []).filter((l) => cleared.includes(l.id)).reduce((n, l) => n + l.amount, 0), [ws, cleared]);
  const clearedBalance = Math.round(((ws?.openingClearedBalance || 0) + clearedTotal) * 100) / 100;
  const difference = statement == null ? null : Math.round((statement - clearedBalance) * 100) / 100;
  const done = ws?.reconciliation?.status === "RECONCILED";

  const save = (finalize) => run("/reconciliations", { bankAccountId: bankId, periodEnd: ymd(periodEnd), statementBalance: statement, clearedLineIds: cleared, finalize });

  return (
    <div className="space-y-3">
      <Space wrap>
        <BankSelect value={bankId} onChange={setBankId} style={{ minWidth: 280 }} />
        <DatePicker value={periodEnd} onChange={(v) => v && setPeriodEnd(v)} placeholder="Statement date" />
        <InputNumber value={statement} onChange={setStatement} prefix="$" step={0.01} placeholder="Statement ending balance" style={{ width: 220 }} disabled={done} />
      </Space>
      {ws && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Stat label="Book balance" value={money(ws.bookBalance)} sub={`at ${ws.periodEnd}`} />
            <Stat label="Previously cleared" value={money(ws.openingClearedBalance)} />
            <Stat label="Cleared this period" value={money(clearedTotal)} />
            <Stat label="Cleared balance" value={money(clearedBalance)} />
            <Stat label="Difference" value={difference == null ? "—" : <span className={difference === 0 ? "text-green-600" : "text-red-600"}>{money(difference)}</span>} />
          </div>
          {done && <Alert type="success" showIcon message={`Reconciled ${fmtDate(ws.reconciliation.reconciledAt)}.`} />}
          <Table
            size="small"
            rowKey="id"
            loading={isFetching}
            dataSource={ws.lines}
            pagination={false}
            scroll={{ y: 420 }}
            columns={[
              { title: <Checkbox disabled={done} checked={ws.lines.length > 0 && cleared.length === ws.lines.length} onChange={(e) => setCleared(e.target.checked ? ws.lines.map((l) => l.id) : [])} />, key: "c", width: 40, render: (_, l) => <Checkbox disabled={done} checked={cleared.includes(l.id)} onChange={(e) => setCleared(e.target.checked ? [...cleared, l.id] : cleared.filter((x) => x !== l.id))} /> },
              { title: "Date", dataIndex: "date", key: "d", render: fmtDate },
              { title: "Entry", dataIndex: "entryNumber", key: "e" },
              { title: "Description", dataIndex: "memo", key: "m" },
              { title: "Amount", dataIndex: "amount", key: "a", align: "right", render: (v) => <span className={v < 0 ? "text-red-600" : ""}>{money(v)}</span> },
            ]}
          />
          {!done && (
            <Space>
              <button type="button" className="primary-btn-ghost" disabled={loading || statement == null} onClick={() => save(false)}>Save Draft</button>
              <button type="button" className="primary-btn" disabled={loading || difference !== 0} onClick={() => save(true)}>Complete Reconciliation</button>
            </Space>
          )}
        </>
      )}
      <AcctTable
        title="Reconciliation history"
        rows={history}
        columns={[{ title: "Bank", key: "b", render: (_, r) => r.bankAccount?.name, exportValue: (r) => r.bankAccount?.name }, dateCol("Statement date", "periodEnd"), moneyCol("Statement", "statementBalance"), moneyCol("Book", "bookBalance"), moneyCol("Difference", "difference"), { title: "Status", dataIndex: "status", key: "s", render: (s) => <StatusTag status={s} /> }]}
      />
    </div>
  );
};

const Journals = () => {
  const [range, setRange] = useState([dayjs().startOf("month"), dayjs()]);
  const [source, setSource] = useState("ALL");
  const [search, setSearch] = useState("");
  const { rows, isFetching } = useAcct("/journals", { from: ymd(range[0]), to: ymd(range[1]), source, search });
  const { run, loading } = useAcctAction();
  const [open, setOpen] = useState(false);
  const [entry, setEntry] = useState({ entryDate: dayjs(), memo: "", lines: [{ glAccountId: undefined, debit: 0, credit: 0 }, { glAccountId: undefined, debit: 0, credit: 0 }] });
  const totals = entry.lines.reduce((t, l) => ({ d: t.d + Number(l.debit || 0), c: t.c + Number(l.credit || 0) }), { d: 0, c: 0 });
  const balanced = Math.round(totals.d * 100) === Math.round(totals.c * 100) && totals.d > 0;
  const setLine = (i, patch) => setEntry({ ...entry, lines: entry.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) });

  const save = async () => {
    if (await run("/journals", { entryDate: ymd(entry.entryDate), memo: entry.memo, lines: entry.lines })) {
      setOpen(false);
      setEntry({ entryDate: dayjs(), memo: "", lines: [{ debit: 0, credit: 0 }, { debit: 0, credit: 0 }] });
    }
  };

  return (
    <div className="space-y-3">
      <Space wrap>
        <DatePicker.RangePicker value={range} onChange={(v) => v && setRange(v)} />
        <Select value={source} onChange={setSource} style={{ width: 180 }} options={["ALL", "MANUAL", "TRUST", "BILL", "BILL_PAYMENT", "PAYROLL", "REMITTANCE", "COMMISSION", "AGENT_CHARGE", "AGENT_PAYMENT", "REVERSAL"].map((s) => ({ value: s, label: s === "ALL" ? "All sources" : s.replace(/_/g, " ") }))} />
        <Input.Search allowClear placeholder="Search memo / entry #" onSearch={setSearch} style={{ width: 240 }} />
      </Space>
      <AcctTable
        title="General ledger journals"
        loading={isFetching}
        rows={rows}
        extra={<button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => setOpen(true)}>Add Manual Journal</button>}
        expandable={{
          expandedRowRender: (r) => (
            <Table size="small" rowKey="id" pagination={false} dataSource={r.lines} columns={[
              { title: "Account", key: "a", render: (_, l) => `${l.glAccount?.code} · ${l.glAccount?.name}` },
              { title: "Description", dataIndex: "description", key: "d" },
              { title: "Debit", dataIndex: "debit", key: "dr", align: "right", render: (v) => (Number(v) ? money(v) : "") },
              { title: "Credit", dataIndex: "credit", key: "cr", align: "right", render: (v) => (Number(v) ? money(v) : "") },
            ]} />
          ),
        }}
        columns={[
          dateCol("Date", "entryDate"),
          { title: "Entry", dataIndex: "entryNumber", key: "n" },
          { title: "Source", dataIndex: "source", key: "s" },
          { title: "Memo", dataIndex: "memo", key: "m" },
          moneyCol("Debits", "totalDebit"),
          moneyCol("Credits", "totalCredit"),
          { title: "Status", dataIndex: "status", key: "st", render: (s) => <StatusTag status={s} /> },
          {
            title: "", key: "actions",
            render: (_, r) => r.source === "MANUAL" && r.status === "POSTED" && (
              <button type="button" className="danger-btn text-xs py-1 px-3" onClick={() => confirmWithReason(`Void journal ${r.entryNumber}?`, (reason) => run(`/journals/${r.uuid}/void`, { reason }))}>Void</button>
            ),
          },
        ]}
      />
      <Modal title="Add manual journal entry" open={open} onCancel={() => setOpen(false)} width={860} onOk={save} okText="Post Journal" okButtonProps={{ disabled: !balanced || !entry.memo.trim() }} confirmLoading={loading}>
        <Space className="mb-3" wrap>
          <DatePicker value={entry.entryDate} onChange={(v) => setEntry({ ...entry, entryDate: v })} />
          <Input style={{ width: 460 }} placeholder="Reason for this journal adjustment (required)" value={entry.memo} onChange={(e) => setEntry({ ...entry, memo: e.target.value })} />
        </Space>
        {entry.lines.map((l, i) => (
          <div key={i} className="flex gap-2 mb-2 items-center">
            <GlSelect value={l.glAccountId} onChange={(v) => setLine(i, { glAccountId: v })} style={{ width: 300 }} />
            <Input placeholder="Description" value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} style={{ width: 200 }} />
            <InputNumber min={0} step={0.01} placeholder="Debit" value={l.debit} onChange={(v) => setLine(i, { debit: v || 0, credit: v ? 0 : l.credit })} style={{ width: 120 }} />
            <InputNumber min={0} step={0.01} placeholder="Credit" value={l.credit} onChange={(v) => setLine(i, { credit: v || 0, debit: v ? 0 : l.debit })} style={{ width: 120 }} />
            {entry.lines.length > 2 && <button type="button" className="text-red-500 text-xs" onClick={() => setEntry({ ...entry, lines: entry.lines.filter((_, j) => j !== i) })}>Remove</button>}
          </div>
        ))}
        <div className="flex justify-between items-center mt-2">
          <button type="button" className="primary-btn-ghost text-xs py-1 px-3" onClick={() => setEntry({ ...entry, lines: [...entry.lines, { debit: 0, credit: 0 }] })}>Add line</button>
          <span className={balanced ? "text-green-600" : "text-red-600"}>Debits {money(totals.d)} · Credits {money(totals.c)} {balanced ? "· Balanced" : "· Out of balance"}</span>
        </div>
      </Modal>
    </div>
  );
};

const ChartOfAccounts = () => {
  const { rows, isFetching } = useAcct("/gl-accounts");
  const { run, loading } = useAcctAction();
  const [editing, setEditing] = useState(null);
  const [type, setType] = useState("ALL");
  const [form] = Form.useForm();
  const open = (a) => { setEditing(a || {}); form.setFieldsValue(a || { accountType: "EXPENSE", active: true }); };
  const save = async () => { const v = await form.validateFields(); if (await run("/gl-accounts", { ...v, id: editing?.id })) setEditing(null); };
  return (
    <>
      <Space className="mb-2" wrap>
        <Select value={type} onChange={setType} style={{ width: 160 }} options={["ALL", "ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"].map((t) => ({ value: t, label: t === "ALL" ? "All types" : t }))} />
      </Space>
      <AcctTable
        title="Chart of accounts"
        loading={isFetching}
        rows={(rows || []).filter((a) => type === "ALL" || a.accountType === type)}
        pagination={{ pageSize: 50 }}
        extra={
          <>
            <button type="button" className="primary-btn-ghost text-xs py-1 px-3" disabled={loading} onClick={() => run("/gl-accounts/import-default")}>Import ANS chart</button>
            <button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => open(null)}>Add Account</button>
          </>
        }
        columns={[
          { title: "Code", dataIndex: "code", key: "c" },
          { title: "Name", dataIndex: "name", key: "n" },
          { title: "Type", dataIndex: "accountType", key: "t" },
          { title: "Sub-type", dataIndex: "subType", key: "st", render: (v) => (v ? v.replace(/_/g, " ") : "") },
          moneyCol("Balance", "balance"),
          { title: "Active", dataIndex: "active", key: "a", render: (v) => (v ? "Yes" : "No") },
          { title: "", key: "actions", render: (_, r) => <button type="button" className="primary-btn-ghost text-xs py-1 px-3" onClick={() => open(r)}>Edit</button> },
        ]}
      />
      <Modal title={editing?.id ? "Edit account" : "Add account"} open={!!editing} onCancel={() => setEditing(null)} onOk={save} confirmLoading={loading} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Account code" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label="Account name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="accountType" label="Account type" rules={[{ required: true }]}><Select options={["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"].map((t) => ({ value: t, label: t }))} /></Form.Item>
          <Form.Item name="subType" label="Sub-type"><Select allowClear options={["BANK", "TRUST_ASSET", "TRUST_LIABILITY", "COST_OF_SALES"].map((t) => ({ value: t, label: t.replace(/_/g, " ") }))} /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="active" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const BankingSection = () => (
  <Tabs
    items={[
      { key: "accounts", label: "Bank Accounts", children: <BankAccounts /> },
      { key: "register", label: "Register", children: <Register /> },
      { key: "reconcile", label: "Reconciliation", children: <Reconcile /> },
      { key: "journals", label: "Journal Entries", children: <Journals /> },
      { key: "coa", label: "Chart of Accounts", children: <ChartOfAccounts /> },
    ]}
  />
);

export default BankingSection;
