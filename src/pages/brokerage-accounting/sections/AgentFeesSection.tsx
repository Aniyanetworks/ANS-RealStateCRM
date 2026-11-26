// @ts-nocheck
import React, { useState } from "react";
import { Alert, Checkbox, DatePicker, Descriptions, Drawer, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tabs, Tag } from "antd";
import dayjs from "dayjs";
import { AcctTable, AgentSelect, BankSelect, FREQUENCY_OPTIONS, Stat, StatusTag, agentLabel, confirmWithReason, dateCol, fmtDate, money, moneyCol, useAcct, useAcctAction, ymd } from "../acctShared";

const TYPE_OPTS = [{ value: "AMOUNT", label: "$ Amount" }, { value: "PERCENT", label: "% of GCI" }];
const RENEWAL_OPTS = [{ value: "NOT_STARTED", label: "Not started" }, { value: "IN_PROGRESS", label: "Renewal in progress" }, { value: "ELIGIBLE", label: "Eligible to trade (confirmed)" }];
const toNum = (v) => (v === null || v === undefined || v === "" ? undefined : Number(v));

const FeeFields = ({ splitName = "Percent", nullable = false }) => {
  const hint = nullable ? "Blank = use plan" : undefined;
  const pair = (label, base) => (
    <Form.Item label={label} className="mb-2">
      <Space.Compact className="w-full">
        <Form.Item name={`${base}Type`} noStyle><Select style={{ width: 120 }} options={TYPE_OPTS} allowClear={nullable} placeholder={hint} /></Form.Item>
        <Form.Item name={`${base}Value`} noStyle><InputNumber min={0} step={0.01} style={{ width: "100%" }} placeholder={hint} /></Form.Item>
      </Space.Compact>
    </Form.Item>
  );
  return (
    <div className="grid md:grid-cols-2 gap-x-4">
      <Form.Item name={`commissionSplitBuySell${splitName}`} label="Agent split % — buy/sell" className="mb-2"><InputNumber min={0} max={100} step={0.5} className="w-full" placeholder={hint} /></Form.Item>
      <Form.Item name={`commissionSplitLease${splitName}`} label="Agent split % — lease" className="mb-2"><InputNumber min={0} max={100} step={0.5} className="w-full" placeholder={hint} /></Form.Item>
      {pair("Admin fee — residential buy/sell", "adminFeeBuySell")}
      {pair("Admin fee — residential lease", "adminFeeLease")}
      {pair("Admin fee — commercial buy/sell", "adminFeeCommercialBuySell")}
      {pair("Admin fee — commercial lease", "adminFeeCommercialLease")}
      {pair("Lead fee — buy/sell (brokerage leads)", "leadFeeBuySell")}
      {pair("Lead fee — lease (brokerage leads)", "leadFeeLease")}
    </div>
  );
};

const numericize = (obj) => {
  const out = { ...obj };
  Object.keys(out).forEach((k) => { if (/Value$|Percent$|Override$|deskFee|amount$/i.test(k) && out[k] !== null && out[k] !== undefined && out[k] !== "") out[k] = Number(out[k]); });
  return out;
};


const AgentDrawer = ({ agentId, onClose }) => {
  const { rows: d, isFetching } = useAcct(agentId ? `/agents/${agentId}` : null);
  const { rows: plans } = useAcct("/fee-plans");
  const { run, loading } = useAcctAction();
  const [form] = Form.useForm();
  const [ruleOpen, setRuleOpen] = useState(null);
  const [ruleForm] = Form.useForm();
  const [subOpen, setSubOpen] = useState(false);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [payCharge, setPayCharge] = useState(null);

  React.useEffect(() => {
    if (!d) return;
    const p = d.profile || {};
    form.setFieldsValue({
      ...numericize(p),
      startDate: p.startDate ? dayjs(p.startDate) : null,
      terminationDate: p.terminationDate ? dayjs(p.terminationDate) : null,
      recoRenewalAppliedDate: p.recoRenewalAppliedDate ? dayjs(p.recoRenewalAppliedDate) : null,
      recoRenewalStatus: p.recoRenewalStatus || "NOT_STARTED",
      accountNumber: p.accountNumber ? `••••${String(p.accountNumber).slice(-4)}` : "",
    });
  }, [d?.profile?.id, d?.agent?.id]);

  const saveProfile = async () => {
    const v = await form.validateFields();
    await run(`/agents/${agentId}/profile`, { ...v, startDate: ymd(v.startDate), terminationDate: ymd(v.terminationDate), recoRenewalAppliedDate: ymd(v.recoRenewalAppliedDate) });
  };
  const saveRule = async () => {
    const v = await ruleForm.validateFields();
    if (await run("/fee-rules", { ...v, uuid: ruleOpen?.uuid, agentAccountId: agentId, effectiveFrom: ymd(v.effectiveFrom), effectiveTo: ymd(v.effectiveTo) })) setRuleOpen(null);
  };
  const e = d?.effective;

  return (
    <Drawer title={d ? agentLabel(d.agent) : "Agent"} open={!!agentId} onClose={onClose} width={980} destroyOnClose>
      {isFetching && !d ? null : d && (
        <Tabs items={[
          {
            key: "profile", label: "Profile & fees",
            children: (
              <>
                {e && (
                  <Alert className="mb-3" type="info" showIcon message={`In force today: ${e.source}`} description={`Desk fee ${money(e.deskFee)} ${e.deskFeeFrequency.toLowerCase()} · split ${e.splitBuySell}% buy/sell, ${e.splitLease}% lease · admin buy/sell ${e.admin.BuySell.type === "PERCENT" ? `${e.admin.BuySell.value}%` : money(e.admin.BuySell.value)}`} />
                )}
                <Form form={form} layout="vertical">
                  <div className="grid md:grid-cols-3 gap-x-4">
                    <Form.Item name="agentNumber" label="Agent #"><Input /></Form.Item>
                    <Form.Item name="feePlanId" label="Fee plan"><Select allowClear options={(plans || []).filter((p) => p.active).map((p) => ({ value: p.id, label: p.name }))} /></Form.Item>
                    <Form.Item name="deskFeeOverride" label="Desk fee override"><InputNumber min={0} step={0.01} prefix="$" className="w-full" placeholder="Blank = use plan" /></Form.Item>
                    <Form.Item name="startDate" label="Start / anniversary date"><DatePicker className="w-full" /></Form.Item>
                    <Form.Item name="terminationDate" label="Termination date"><DatePicker className="w-full" /></Form.Item>
                    <div />
                    <Form.Item name="recoRenewalStatus" label="RECO renewal status"><Select options={RENEWAL_OPTS} /></Form.Item>
                    <Form.Item name="recoRenewalAppliedDate" label="Renewal applied"><DatePicker className="w-full" /></Form.Item>
                    <div className="text-xs text-gray-500 pt-8">RECO expiry: {fmtDate(d.agent.recoExpiryDate)}</div>
                  </div>
                  <div className="font-semibold mt-2 mb-1">Fee overrides</div>
                  <FeeFields splitName="Override" nullable />
                  <Form.Item name="feeNotes" label="Fee notes"><Input.TextArea rows={2} /></Form.Item>
                  <div className="font-semibold mt-2 mb-1">Direct deposit</div>
                  <div className="grid md:grid-cols-4 gap-x-4">
                    <Form.Item name="bankName" label="Bank"><Input /></Form.Item>
                    <Form.Item name="institutionNumber" label="Institution #" rules={[{ pattern: /^\d{3}$/, message: "3 digits" }]}><Input maxLength={3} /></Form.Item>
                    <Form.Item name="transitNumber" label="Transit #" rules={[{ pattern: /^\d{5}$/, message: "5 digits" }]}><Input maxLength={5} /></Form.Item>
                    <Form.Item name="accountNumber" label="Account #" extra="Shown masked; type a new number to replace."><Input /></Form.Item>
                  </div>
                </Form>
                <Space>
                  <button type="button" className="primary-btn" disabled={loading} onClick={saveProfile}>Save Profile</button>
                  <button type="button" className="primary-btn-ghost" disabled={loading} onClick={() => run(`/agents/${agentId}/sync-desk-fee`, { startDate: dayjs().startOf("month").format("YYYY-MM-DD") })}>Sync Desk Fee Subscription</button>
                </Space>
              </>
            ),
          },
          {
            key: "promotions", label: `Promotions (${d.rules.length})`,
            children: (
              <>
                <AcctTable
                  title="Promotion / special fee rules"
                  rows={d.rules}
                  rowKey="uuid"
                  extra={<button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => { setRuleOpen({}); ruleForm.setFieldsValue({ name: "Promotion / Special Fee Rule", effectiveFrom: dayjs(), isPromotion: true }); }}>Add Rule</button>}
                  columns={[
                    { title: "Name", dataIndex: "name", key: "n" }, dateCol("From", "effectiveFrom"), dateCol("To", "effectiveTo"),
                    { title: "Split buy/sell", dataIndex: "commissionSplitBuySellPercent", key: "s", render: (v) => (v != null ? `${v}%` : "—") },
                    moneyCol("Desk fee", "deskFee"),
                    { title: "", key: "actions", render: (_, r) => <Space><button type="button" className="primary-btn-ghost text-xs py-1 px-3" onClick={() => { setRuleOpen(r); ruleForm.setFieldsValue({ ...numericize(r), effectiveFrom: dayjs(r.effectiveFrom), effectiveTo: r.effectiveTo ? dayjs(r.effectiveTo) : null }); }}>Edit</button><Popconfirm title="Delete rule?" onConfirm={() => run(`/fee-rules/${r.uuid}`, undefined, { method: "DELETE" })}><button type="button" className="text-red-500 text-xs">Delete</button></Popconfirm></Space> },
                  ]}
                />
                <Modal title="Promotion / special fee rule" open={!!ruleOpen} onCancel={() => setRuleOpen(null)} onOk={saveRule} confirmLoading={loading} width={760} destroyOnClose>
                  <Form form={ruleForm} layout="vertical">
                    <div className="grid grid-cols-3 gap-x-4">
                      <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
                      <Form.Item name="effectiveFrom" label="Effective from" rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item>
                      <Form.Item name="effectiveTo" label="Effective to"><DatePicker className="w-full" /></Form.Item>
                      <Form.Item name="deskFee" label="Desk fee"><InputNumber min={0} step={0.01} prefix="$" className="w-full" placeholder="Blank = no change" /></Form.Item>
                    </div>
                    <FeeFields nullable />
                    <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
                  </Form>
                </Modal>
              </>
            ),
          },
          {
            key: "subscriptions", label: `Subscriptions (${d.subscriptions.length})`,
            children: (
              <>
                <AcctTable
                  title="Subscriptions"
                  rows={d.subscriptions}
                  rowKey="uuid"
                  extra={<button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => setSubOpen(true)}>Add Subscription</button>}
                  columns={[{ title: "Service", dataIndex: "name", key: "n" }, { title: "Type", dataIndex: "serviceType", key: "t" }, moneyCol("Amount", "amount"), { title: "Frequency", dataIndex: "frequency", key: "f" }, dateCol("Next charge", "nextChargeDate"), { title: "Active", dataIndex: "active", key: "a", render: (a) => (a ? "Yes" : "No") }, { title: "", key: "actions", render: (_, r) => <Popconfirm title="Delete subscription?" onConfirm={() => run(`/subscriptions/${r.uuid}`, undefined, { method: "DELETE" })}><button type="button" className="text-red-500 text-xs">Delete</button></Popconfirm> }]}
                />
                {subOpen && <SubscriptionModal agentId={agentId} onClose={() => setSubOpen(false)} />}
              </>
            ),
          },
          {
            key: "charges", label: `Charges (${d.charges.filter((c) => ["OPEN", "PARTIAL"].includes(c.status)).length} open)`,
            children: (
              <>
                <ChargesTable rows={d.charges.map((c) => ({ ...c, balance: Number(c.amount) - Number(c.amountPaid) }))} onPay={setPayCharge} extra={<button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => setChargeOpen(true)}>Add Charge</button>} />
                {chargeOpen && <ChargeModal agentId={agentId} onClose={() => setChargeOpen(false)} />}
                {payCharge && <ChargePaymentModal charge={payCharge} onClose={() => setPayCharge(null)} />}
              </>
            ),
          },
        ]} />
      )}
    </Drawer>
  );
};


const SubscriptionModal = ({ agentId, onClose }) => {
  const [form] = Form.useForm();
  const { run, loading } = useAcctAction();
  const { rows: items } = useAcct("/chargeable-items");
  const save = async () => {
    const v = await form.validateFields();
    if (await run("/subscriptions", { ...v, agentAccountId: agentId || v.agentAccountId, startDate: ymd(v.startDate), endDate: ymd(v.endDate), nextChargeDate: ymd(v.nextChargeDate || v.startDate) })) onClose();
  };
  return (
    <Modal title="Add subscription" open onCancel={onClose} onOk={save} confirmLoading={loading} destroyOnClose>
      <Form form={form} layout="vertical" initialValues={{ frequency: "MONTHLY", startDate: dayjs(), hstApplicable: true }}>
        {!agentId && <Form.Item name="agentAccountId" label="Agent" rules={[{ required: true }]}><AgentSelect /></Form.Item>}
        <Form.Item name="chargeableItemId" label="From catalogue (optional)">
          <Select allowClear options={(items || []).filter((i) => i.active).map((i) => ({ value: i.id, label: `${i.itemCode} · ${i.name}` }))} onChange={(id) => { const it = (items || []).find((i) => i.id === id); if (it) form.setFieldsValue({ name: it.name, amount: Number(it.defaultAmount) }); }} />
        </Form.Item>
        <Form.Item name="name" label="Service name" rules={[{ required: true }]}><Input /></Form.Item>
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item name="amount" label="Amount (pre-tax)" rules={[{ required: true }]}><InputNumber min={0.01} step={0.01} prefix="$" className="w-full" /></Form.Item>
          <Form.Item name="frequency" label="Frequency" rules={[{ required: true }]}><Select options={FREQUENCY_OPTIONS} /></Form.Item>
          <Form.Item name="startDate" label="Start date" rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item>
          <Form.Item name="endDate" label="End date"><DatePicker className="w-full" /></Form.Item>
        </div>
        <Form.Item name="hstApplicable" valuePropName="checked"><Checkbox>Charge HST</Checkbox></Form.Item>
        <Form.Item name="notes" label="Notes"><Input /></Form.Item>
      </Form>
    </Modal>
  );
};

const ChargeModal = ({ agentId, onClose }) => {
  const [form] = Form.useForm();
  const { run, loading } = useAcctAction();
  const { rows: items } = useAcct("/chargeable-items");
  const save = async () => {
    const v = await form.validateFields();
    if (await run("/charges", { ...v, agentAccountId: agentId || v.agentAccountId, chargeDate: ymd(v.chargeDate), dueDate: ymd(v.dueDate) })) onClose();
  };
  return (
    <Modal title="Add one-time charge" open onCancel={onClose} onOk={save} confirmLoading={loading} destroyOnClose>
      <Form form={form} layout="vertical" initialValues={{ chargeDate: dayjs(), hstApplicable: true }}>
        {!agentId && <Form.Item name="agentAccountId" label="Agent" rules={[{ required: true }]}><AgentSelect /></Form.Item>}
        <Form.Item label="From catalogue (optional)">
          <Select allowClear options={(items || []).filter((i) => i.active).map((i) => ({ value: i.id, label: `${i.itemCode} · ${i.name}` }))} onChange={(id) => { const it = (items || []).find((i) => i.id === id); if (it) form.setFieldsValue({ description: it.name, amount: Number(it.defaultAmount), hstApplicable: Number(it.defaultTaxRate) > 0 }); }} />
        </Form.Item>
        <Form.Item name="description" label="Description" rules={[{ required: true }]}><Input /></Form.Item>
        <div className="grid grid-cols-3 gap-x-4">
          <Form.Item name="amount" label="Amount (pre-tax)" rules={[{ required: true }]}><InputNumber min={0.01} step={0.01} prefix="$" className="w-full" /></Form.Item>
          <Form.Item name="chargeDate" label="Charge date" rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item>
          <Form.Item name="dueDate" label="Due date"><DatePicker className="w-full" /></Form.Item>
        </div>
        <Form.Item name="hstApplicable" valuePropName="checked"><Checkbox>Charge HST</Checkbox></Form.Item>
      </Form>
    </Modal>
  );
};

const ChargePaymentModal = ({ charge, onClose }) => {
  const [form] = Form.useForm();
  const { run, loading } = useAcctAction();
  const balance = Number(charge.amount) - Number(charge.amountPaid);
  const save = async () => {
    const v = await form.validateFields();
    if (await run(`/charges/${charge.uuid}/payments`, { ...v, paymentDate: ymd(v.paymentDate) })) onClose();
  };
  return (
    <Modal title={`Record payment — ${charge.description}`} open onCancel={onClose} onOk={save} confirmLoading={loading} destroyOnClose>
      <p className="mb-2">Balance: <b>{money(balance)}</b></p>
      <Form form={form} layout="vertical" initialValues={{ paymentDate: dayjs(), amount: balance, method: "E_TRANSFER" }}>
        <Form.Item name="paymentDate" label="Payment date" rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item>
        <Form.Item name="amount" label="Amount" rules={[{ required: true }]}><InputNumber min={0.01} max={balance} step={0.01} prefix="$" className="w-full" /></Form.Item>
        <Form.Item name="method" label="Method" rules={[{ required: true }]}><Select options={["CASH", "CHEQUE", "EFT", "E_TRANSFER"].map((m) => ({ value: m, label: m.replace(/_/g, "-") }))} /></Form.Item>
        <Form.Item name="bankAccountId" label="Deposited to" rules={[{ required: true }]}><BankSelect category={["OPERATING", "OTHER"]} /></Form.Item>
        <Form.Item name="reference" label="Reference"><Input /></Form.Item>
        <Form.Item name="notes" label="Notes"><Input /></Form.Item>
      </Form>
      <p className="text-xs text-gray-500">To deduct a charge from a commission cheque, use Commission Payroll → Post to ledger.</p>
    </Modal>
  );
};

const ChargesTable = ({ rows, onPay, extra, showAgent = false, loading = false }) => {
  const { run } = useAcctAction();
  return (
    <AcctTable
      title="Agent charges"
      loading={loading}
      rows={rows}
      rowKey="uuid"
      extra={extra}
      expandable={{
        rowExpandable: (r) => r.payments?.length > 0,
        expandedRowRender: (r) => <Table size="small" rowKey="uuid" pagination={false} dataSource={r.payments} columns={[dateCol("Paid", "paymentDate"), { title: "Method", dataIndex: "method", key: "m" }, { title: "Reference", dataIndex: "reference", key: "r" }, moneyCol("Amount", "amount")]} />,
      }}
      columns={[
        ...(showAgent ? [{ title: "Agent", dataIndex: "agentName", key: "a" }] : []),
        dateCol("Date", "chargeDate"),
        { title: "Type", dataIndex: "chargeType", key: "t", render: (t) => t.replace(/_/g, " ") },
        { title: "Description", dataIndex: "description", key: "d" },
        moneyCol("Base", "baseAmount"),
        moneyCol("HST", "hstAmount"),
        moneyCol("Total", "amount"),
        moneyCol("Balance", "balance"),
        { title: "Status", dataIndex: "status", key: "s", render: (s) => <StatusTag status={s} /> },
        {
          title: "", key: "actions",
          render: (_, r) => (
            <Space size={4}>
              {["OPEN", "PARTIAL"].includes(r.status) && <button type="button" className="primary-btn text-xs py-0.5 px-2" onClick={() => onPay(r)}>Record Payment</button>}
              {r.status === "OPEN" && Number(r.amountPaid) === 0 && <button type="button" className="danger-btn text-xs py-0.5 px-2" onClick={() => confirmWithReason("Void this charge?", (reason) => run(`/charges/${r.uuid}/void`, { reason }))}>Void</button>}
            </Space>
          ),
        },
      ]}
    />
  );
};


const Agents = () => {
  const [includeInactive, setIncludeInactive] = useState(false);
  const [search, setSearch] = useState("");
  const { rows, isFetching } = useAcct("/agents", { includeInactive: includeInactive ? 1 : undefined });
  const [agentId, setAgentId] = useState(null);
  const filtered = (rows || []).filter((a) => !search || agentLabel(a).toLowerCase().includes(search.toLowerCase()) || String(a.profile?.agentNumber || "").includes(search));
  return (
    <>
      <Space className="mb-2" wrap>
        <Input.Search allowClear placeholder="Search agent name or #" onChange={(e) => setSearch(e.target.value)} style={{ width: 260 }} />
        <Checkbox checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)}>Include inactive</Checkbox>
      </Space>
      <AcctTable
        title="Agents"
        loading={isFetching}
        rows={filtered}
        columns={[
          { title: "Agent", key: "n", render: (_, a) => agentLabel(a), exportValue: (a) => agentLabel(a) },
          { title: "Agent #", key: "num", render: (_, a) => a.profile?.agentNumber || "—", exportValue: (a) => a.profile?.agentNumber },
          { title: "Fee plan", key: "p", render: (_, a) => a.profile?.feePlan?.name || <span className="text-orange-500">No plan</span>, exportValue: (a) => a.profile?.feePlan?.name },
          { title: "RECO", key: "r", render: (_, a) => <StatusTag status={a.profile?.recoRenewalStatus || "NOT_STARTED"} />, exportValue: (a) => a.profile?.recoRenewalStatus },
          dateCol("RECO expiry", "recoExpiryDate"),
          moneyCol("Open balance", "openBalance"),
          { title: "", key: "actions", render: (_, a) => <button type="button" className="primary-btn-ghost text-xs py-1 px-3" onClick={() => setAgentId(a.id)}>Open</button> },
        ]}
      />
      <AgentDrawer agentId={agentId} onClose={() => setAgentId(null)} />
    </>
  );
};

const FeePlans = () => {
  const { rows, isFetching } = useAcct("/fee-plans");
  const { run, loading } = useAcctAction();
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const open = (p) => {
    setEditing(p || {});
    form.setFieldsValue(p ? numericize(p) : { deskFee: 0, deskFeeFrequency: "MONTHLY", commissionSplitBuySellPercent: 100, commissionSplitLeasePercent: 100, adminFeeBuySellType: "AMOUNT", adminFeeLeaseType: "AMOUNT", adminFeeCommercialBuySellType: "AMOUNT", adminFeeCommercialLeaseType: "AMOUNT", leadFeeBuySellType: "PERCENT", leadFeeLeaseType: "PERCENT", active: true });
  };
  const save = async () => { const v = await form.validateFields(); if (await run("/fee-plans", { ...v, id: editing?.id })) setEditing(null); };
  const feeText = (t, v) => (t === "PERCENT" ? `${Number(v)}%` : money(v));
  return (
    <>
      <AcctTable
        title="Fee plans"
        loading={isFetching}
        rows={rows}
        extra={<button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => open(null)}>Add Plan</button>}
        columns={[
          { title: "Plan", dataIndex: "name", key: "n" },
          { title: "Desk fee", key: "d", render: (_, p) => `${money(p.deskFee)} ${p.deskFeeFrequency.toLowerCase()}` },
          { title: "Split buy/sell", dataIndex: "commissionSplitBuySellPercent", key: "s", render: (v) => `${Number(v)}%` },
          { title: "Split lease", dataIndex: "commissionSplitLeasePercent", key: "l", render: (v) => `${Number(v)}%` },
          { title: "Admin fee b/s", key: "a", render: (_, p) => feeText(p.adminFeeBuySellType, p.adminFeeBuySellValue) },
          { title: "Lead fee b/s", key: "lf", render: (_, p) => feeText(p.leadFeeBuySellType, p.leadFeeBuySellValue) },
          { title: "Agents", key: "c", render: (_, p) => p._count?.agents || 0 },
          { title: "Active", dataIndex: "active", key: "ac", render: (a) => (a ? "Yes" : "No") },
          { title: "", key: "actions", render: (_, p) => <Space><button type="button" className="primary-btn-ghost text-xs py-1 px-3" onClick={() => open(p)}>Edit</button>{!p._count?.agents && <Popconfirm title="Delete plan?" onConfirm={() => run(`/fee-plans/${p.id}`, undefined, { method: "DELETE" })}><button type="button" className="text-red-500 text-xs">Delete</button></Popconfirm>}</Space> },
        ]}
      />
      <Modal title={editing?.id ? "Edit fee plan" : "Add fee plan"} open={!!editing} onCancel={() => setEditing(null)} onOk={save} confirmLoading={loading} width={760} destroyOnClose>
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-3 gap-x-4">
            <Form.Item name="name" label="Plan name" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="deskFee" label="Desk fee"><InputNumber min={0} step={0.01} prefix="$" className="w-full" /></Form.Item>
            <Form.Item name="deskFeeFrequency" label="Desk fee frequency"><Select options={FREQUENCY_OPTIONS} /></Form.Item>
          </div>
          <FeeFields />
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="active" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const RecurringFees = () => {
  const { rows, isFetching } = useAcct("/recurring-fees");
  const { run, loading } = useAcctAction();
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const appliesTo = Form.useWatch("appliesTo", form);
  const frequency = Form.useWatch("frequency", form);
  const open = (r) => {
    setEditing(r || {});
    form.setFieldsValue(r ? { ...r, amount: Number(r.amount), startDate: dayjs(r.startDate), endDate: r.endDate ? dayjs(r.endDate) : null, nextRunDate: dayjs(r.nextRunDate) } : { appliesTo: "ALL_AGENTS", frequency: "MONTHLY", hstApplicable: true, startDate: dayjs().startOf("month"), active: true });
  };
  const save = async () => {
    const v = await form.validateFields();
    if (await run("/recurring-fees", { ...v, uuid: editing?.uuid, startDate: ymd(v.startDate), endDate: ymd(v.endDate), nextRunDate: ymd(v.nextRunDate) })) setEditing(null);
  };
  return (
    <>
      <AcctTable
        title="Recurring fees (many agents)"
        loading={isFetching}
        rows={rows}
        rowKey="uuid"
        extra={<button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => open(null)}>Add Recurring Fee</button>}
        columns={[
          { title: "Name", dataIndex: "name", key: "n" },
          { title: "Applies to", dataIndex: "appliesTo", key: "a", render: (a) => a.replace(/_/g, " ") },
          moneyCol("Amount", "amount"),
          { title: "HST", dataIndex: "hstApplicable", key: "h", render: (h) => (h ? "Yes" : "No") },
          { title: "Frequency", dataIndex: "frequency", key: "f" },
          dateCol("Next run", "nextRunDate"),
          { title: "Active", dataIndex: "active", key: "ac", render: (a) => (a ? "Yes" : "No") },
          { title: "", key: "actions", render: (_, r) => <Space><button type="button" className="primary-btn-ghost text-xs py-1 px-3" onClick={() => open(r)}>Edit</button><Popconfirm title="Delete?" onConfirm={() => run(`/recurring-fees/${r.uuid}`, undefined, { method: "DELETE" })}><button type="button" className="text-red-500 text-xs">Delete</button></Popconfirm></Space> },
        ]}
      />
      <Modal title={editing?.uuid ? "Edit recurring fee" : "Add recurring fee"} open={!!editing} onCancel={() => setEditing(null)} onOk={save} confirmLoading={loading} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input placeholder="e.g. Technology fee" /></Form.Item>
          <Form.Item name="appliesTo" label="Applies to" rules={[{ required: true }]}><Select options={[{ value: "ALL_AGENTS", label: "All active agents" }, { value: "BRANCH", label: "Agents in a branch" }, { value: "AGENT", label: "One agent" }]} /></Form.Item>
          {appliesTo === "AGENT" && <Form.Item name="agentAccountId" label="Agent" rules={[{ required: true }]}><AgentSelect /></Form.Item>}
          {appliesTo === "BRANCH" && <Form.Item name="branchId" label="Branch ID" rules={[{ required: true }]}><InputNumber min={1} className="w-full" /></Form.Item>}
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="amount" label="Amount (pre-tax)" rules={[{ required: true }]}><InputNumber min={0.01} step={0.01} prefix="$" className="w-full" /></Form.Item>
            <Form.Item name="frequency" label="Frequency" rules={[{ required: true }]}><Select options={[...FREQUENCY_OPTIONS, { value: "CUSTOM", label: "Every N days" }]} /></Form.Item>
            {frequency === "CUSTOM" && <Form.Item name="intervalDays" label="Interval (days)"><InputNumber min={1} className="w-full" /></Form.Item>}
            <Form.Item name="startDate" label="Start date" rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item>
            <Form.Item name="endDate" label="End date"><DatePicker className="w-full" /></Form.Item>
            <Form.Item name="nextRunDate" label="Next run (blank = start)"><DatePicker className="w-full" /></Form.Item>
          </div>
          <Form.Item name="description" label="Description"><Input /></Form.Item>
          <Form.Item name="hstApplicable" valuePropName="checked"><Checkbox>Charge HST</Checkbox></Form.Item>
          <Form.Item name="active" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const Subscriptions = () => {
  const { rows, isFetching } = useAcct("/subscriptions");
  const { run } = useAcctAction();
  const [open, setOpen] = useState(false);
  return (
    <>
      <AcctTable
        title="Agent subscriptions"
        loading={isFetching}
        rows={rows}
        rowKey="uuid"
        extra={<button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => setOpen(true)}>Add Subscription</button>}
        columns={[{ title: "Agent", dataIndex: "agentName", key: "a" }, { title: "Service", dataIndex: "name", key: "n" }, { title: "Type", dataIndex: "serviceType", key: "t" }, moneyCol("Amount", "amount"), { title: "Frequency", dataIndex: "frequency", key: "f" }, dateCol("Next charge", "nextChargeDate"), { title: "Active", dataIndex: "active", key: "ac", render: (a) => (a ? "Yes" : "No") }, { title: "", key: "actions", render: (_, r) => <Popconfirm title="Delete?" onConfirm={() => run(`/subscriptions/${r.uuid}`, undefined, { method: "DELETE" })}><button type="button" className="text-red-500 text-xs">Delete</button></Popconfirm> }]}
      />
      {open && <SubscriptionModal onClose={() => setOpen(false)} />}
    </>
  );
};

const ChargeableItems = () => {
  const { rows, isFetching } = useAcct("/chargeable-items");
  const { run, loading } = useAcctAction();
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const open = (i) => { setEditing(i || {}); form.setFieldsValue(i ? { ...i, defaultAmount: Number(i.defaultAmount), defaultTaxRate: Number(i.defaultTaxRate) } : { defaultTaxRate: 13, active: true }); };
  const save = async () => { const v = await form.validateFields(); if (await run("/chargeable-items", { ...v, id: editing?.id })) setEditing(null); };
  return (
    <>
      <AcctTable title="Chargeable items" loading={isFetching} rows={rows} extra={<button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => open(null)}>Add Item</button>}
        columns={[{ title: "Code", dataIndex: "itemCode", key: "c" }, { title: "Name", dataIndex: "name", key: "n" }, moneyCol("Default amount", "defaultAmount"), { title: "Tax %", dataIndex: "defaultTaxRate", key: "t", render: (v) => `${Number(v)}%` }, { title: "Active", dataIndex: "active", key: "a", render: (a) => (a ? "Yes" : "No") }, { title: "", key: "actions", render: (_, r) => <button type="button" className="primary-btn-ghost text-xs py-1 px-3" onClick={() => open(r)}>Edit</button> }]} />
      <Modal title={editing?.id ? "Edit item" : "Add item"} open={!!editing} onCancel={() => setEditing(null)} onOk={save} confirmLoading={loading} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="itemCode" label="Item code" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description"><Input /></Form.Item>
          <Form.Item name="defaultAmount" label="Default amount"><InputNumber min={0} step={0.01} prefix="$" className="w-full" /></Form.Item>
          <Form.Item name="defaultTaxRate" label="Default tax %"><InputNumber min={0} max={30} className="w-full" /></Form.Item>
          <Form.Item name="active" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const Charges = () => {
  const [status, setStatus] = useState("OUTSTANDING");
  const { rows, isFetching } = useAcct("/charges", { status });
  const [paying, setPaying] = useState(null);
  const [adding, setAdding] = useState(false);
  const outstanding = (rows || []).filter((r) => ["OPEN", "PARTIAL"].includes(r.status)).reduce((n, r) => n + r.balance, 0);
  return (
    <>
      <Space className="mb-2" wrap>
        <Select value={status} onChange={setStatus} style={{ width: 180 }} options={[{ value: "OUTSTANDING", label: "Outstanding" }, { value: "PAID", label: "Paid" }, { value: "VOID", label: "Void" }, { value: "ALL", label: "All" }]} />
        <Tag color="orange">Outstanding total {money(outstanding)}</Tag>
      </Space>
      <ChargesTable rows={rows} loading={isFetching} showAgent onPay={setPaying} extra={<button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => setAdding(true)}>Add Charge</button>} />
      {paying && <ChargePaymentModal charge={paying} onClose={() => setPaying(null)} />}
      {adding && <ChargeModal onClose={() => setAdding(false)} />}
    </>
  );
};

const FeeCalculator = () => {
  const [form] = Form.useForm();
  const { run, loading } = useAcctAction();
  const [result, setResult] = useState(null);
  const calc = async () => {
    const v = await form.validateFields();
    setResult(await run("/fee-calculator", { ...v, asOf: ymd(v.asOf) }, { silent: true }));
  };
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Form form={form} layout="vertical" initialValues={{ dealType: "BUY_SELL", asOf: dayjs(), isBrokerageLead: false }}>
        <Form.Item name="agentAccountId" label="Agent" rules={[{ required: true }]}><AgentSelect /></Form.Item>
        <Form.Item name="grossCommission" label="ANS gross commission (GCI) for the agent's side" rules={[{ required: true }]}><InputNumber min={0} step={0.01} prefix="$" className="w-full" /></Form.Item>
        <Form.Item name="dealType" label="Deal type"><Select options={[{ value: "BUY_SELL", label: "Residential buy/sell" }, { value: "LEASE", label: "Residential lease" }, { value: "COMMERCIAL_BUY_SELL", label: "Commercial buy/sell" }, { value: "COMMERCIAL_LEASE", label: "Commercial lease" }]} /></Form.Item>
        <Form.Item name="asOf" label="As of (closing / firm date)"><DatePicker className="w-full" /></Form.Item>
        <Form.Item name="isBrokerageLead" valuePropName="checked"><Checkbox>Brokerage lead (lead fee applies)</Checkbox></Form.Item>
        <button type="button" className="primary-btn" onClick={calc} disabled={loading}>Calculate</button>
      </Form>
      {result && (
        <Descriptions bordered size="small" column={1} title={`Breakdown · ${result.feeSource}`}>
          <Descriptions.Item label="Gross commission">{money(result.grossCommission)}</Descriptions.Item>
          <Descriptions.Item label={`Agent share (${result.splitPercent}%)`}>{money(result.agentShare)}</Descriptions.Item>
          <Descriptions.Item label={`Deal fee to brokerage (${result.dealFeePercent}%)`}>{money(result.dealFee)}</Descriptions.Item>
          <Descriptions.Item label="Admin fee">{money(result.adminFee)}</Descriptions.Item>
          <Descriptions.Item label="Lead fee">{money(result.leadFee)}</Descriptions.Item>
          <Descriptions.Item label="Net agent commission"><b>{money(result.netAgentCommission)}</b></Descriptions.Item>
          <Descriptions.Item label="Brokerage revenue">{money(result.brokerageRevenue)}</Descriptions.Item>
          <Descriptions.Item label="Outstanding agent charges">{money(result.outstandingCharges)}</Descriptions.Item>
        </Descriptions>
      )}
    </div>
  );
};

const AgentFeesSection = () => {
  const { run, loading } = useAcctAction();
  return (
    <>
      <div className="flex justify-end mb-2">
        <button type="button" className="primary-btn" disabled={loading} onClick={() => Modal.confirm({ title: "Run recurring billing now?", content: "Creates charges for every subscription and recurring fee due up to today (missed periods are caught up; nothing is billed twice).", onOk: () => run("/billing/run", { runDate: dayjs().format("YYYY-MM-DD") }) })}>
          Run Recurring Billing
        </button>
      </div>
      <Tabs items={[
        { key: "agents", label: "Agents", children: <Agents /> },
        { key: "plans", label: "Fee Plans", children: <FeePlans /> },
        { key: "recurring", label: "Recurring Fees", children: <RecurringFees /> },
        { key: "subs", label: "Subscriptions", children: <Subscriptions /> },
        { key: "items", label: "Chargeable Items", children: <ChargeableItems /> },
        { key: "charges", label: "Agent Charges", children: <Charges /> },
        { key: "calc", label: "Fee Calculator", children: <FeeCalculator /> },
      ]} />
    </>
  );
};

export default AgentFeesSection;
