// @ts-nocheck
import React, { useMemo, useState } from "react";
import { Alert, Checkbox, DatePicker, Descriptions, Form, Input, InputNumber, Modal, Select, Space, Table, Tabs, Tag } from "antd";
import dayjs from "dayjs";
import { NavLink } from "react-router-dom";
import { AcctTable, BankSelect, StatusTag, dateCol, fmtDate, money, moneyCol, useAcct, useAcctAction, ymd } from "../acctShared";

const DEAL_TYPES = [{ value: "BUY_SELL", label: "Residential buy/sell" }, { value: "LEASE", label: "Residential lease" }, { value: "COMMERCIAL_BUY_SELL", label: "Commercial buy/sell" }, { value: "COMMERCIAL_LEASE", label: "Commercial lease" }];

const PostModal = ({ commission, onClose }) => {
  const { rows: charges } = useAcct("/charges", { agentAccountId: commission.agentAccountId, status: "OUTSTANDING" });
  const { run, loading } = useAcctAction();
  const [postingDate, setPostingDate] = useState(dayjs());
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [gross, setGross] = useState(commission.grossCommission || commission.agentCommissionTotal || 0);
  const [dealType, setDealType] = useState("BUY_SELL");
  const [lead, setLead] = useState(false);
  const totalSelected = Object.values(selected).reduce((n, v) => n + (Number(v) || 0), 0);
  const overLimit = totalSelected > commission.totalDeduction + 0.005;

  const post = async () => {
    const chargeDeductions = Object.entries(selected).filter(([, v]) => Number(v) > 0).map(([uuid, amount]) => ({ uuid, amount }));
    if (await run(`/commission-payroll/${commission.id}/post`, { postingDate: ymd(postingDate), chargeDeductions, grossCommission: gross, dealType, isBrokerageLead: lead })) onClose();
  };

  return (
    <Modal title={`Post commission — ${commission.agentName}`} open onCancel={onClose} onOk={post} okText="Post to Ledger" okButtonProps={{ disabled: overLimit }} confirmLoading={loading} width={760} destroyOnClose>
      <Descriptions size="small" column={2} bordered className="mb-3">
        <Descriptions.Item label="Trade">{commission.trade?.number || "—"} {commission.trade?.address ? `· ${commission.trade.address}` : ""}</Descriptions.Item>
        <Descriptions.Item label="Paid from">{commission.bankAccount?.name || "—"}</Descriptions.Item>
        <Descriptions.Item label="Agent commission">{money(commission.agentCommissionTotal)}</Descriptions.Item>
        <Descriptions.Item label="Cheque amount paid">{money(commission.amountPaid)}</Descriptions.Item>
        <Descriptions.Item label="Withheld on cheque">{money(commission.totalDeduction)}</Descriptions.Item>
        <Descriptions.Item label="Commission received in trust">{money(commission.commissionReceivedInTrust)}</Descriptions.Item>
      </Descriptions>
      {commission.commissionReceivedInTrust <= 0 && (
        <Alert className="mb-3" type="warning" showIcon message="No commission receipt is recorded in Commission Trust for this trade. Record it under Trust Banking before posting." />
      )}
      <Space className="mb-3" wrap>
        <span>Posting date</span>
        <DatePicker value={postingDate} onChange={(v) => v && setPostingDate(v)} />
        <span>GCI for fee breakdown</span>
        <InputNumber value={gross} onChange={setGross} min={0} step={0.01} prefix="$" />
        <Select value={dealType} onChange={setDealType} options={DEAL_TYPES} style={{ width: 190 }} />
        <Checkbox checked={lead} onChange={(e) => setLead(e.target.checked)}>Brokerage lead</Checkbox>
      </Space>
      <div className="font-semibold mb-1">Deduct open agent charges (up to {money(commission.totalDeduction)} withheld)</div>
      <Table
        size="small"
        rowKey="uuid"
        pagination={false}
        dataSource={charges || []}
        columns={[
          { title: "", key: "c", width: 40, render: (_, c) => <Checkbox checked={selected[c.uuid] > 0} onChange={(e) => setSelected({ ...selected, [c.uuid]: e.target.checked ? c.balance : 0 })} /> },
          { title: "Date", dataIndex: "chargeDate", key: "d", render: fmtDate },
          { title: "Description", dataIndex: "description", key: "desc" },
          { title: "Balance", dataIndex: "balance", key: "b", align: "right", render: money },
          { title: "Deduct", key: "amt", render: (_, c) => <InputNumber min={0} max={c.balance} step={0.01} value={selected[c.uuid] || 0} onChange={(v) => setSelected({ ...selected, [c.uuid]: v || 0 })} /> },
        ]}
      />
      <div className={`mt-2 text-right ${overLimit ? "text-red-600" : ""}`}>Charges deducted: <b>{money(totalSelected)}</b>{overLimit ? " — exceeds the amount withheld on the cheque" : ""}</div>
      <p className="text-xs text-gray-500 mt-2">Ledger: Dr Agent&apos;s Commission (payout + deductions) · Cr paying bank (payout) · Cr A/R agents (deductions).</p>
    </Modal>
  );
};

const CommissionPayroll = () => {
  const [correcting, setCorrecting] = useState(null);
  const [status, setStatus] = useState("ALL");
  const [posted, setPosted] = useState("ALL");
  const { rows, isFetching } = useAcct("/commission-payroll", { status });
  const { run } = useAcctAction();
  const [posting, setPosting] = useState(null);
  const [breakdown, setBreakdown] = useState(null);

  const filtered = useMemo(() => (rows || []).filter((r) => posted === "ALL" || (posted === "POSTED" ? r.posting : !r.posting)), [rows, posted]);

  const showBreakdown = async (r) => {
    const res = await run("/fee-calculator", { agentAccountId: r.agentAccountId, grossCommission: r.grossCommission || r.agentCommissionTotal, dealType: "BUY_SELL" }, { silent: true });
    if (res) setBreakdown({ ...res, agentName: r.agentName });
  };

  return (
    <>
      <Alert
        className="mb-3"
        type="info"
        showIcon
        message="Agents are paid from the existing Issue Agent Cheque screen. Once a cheque is issued (status completed), post it here to record it in the general ledger and apply any agent charges that were withheld."
        action={<NavLink to="/dashboard/accounting/issue-agent-cheque" className="primary-btn-ghost text-xs py-1 px-3">Issue Agent Cheque</NavLink>}
      />
      <Space className="mb-2" wrap>
        <Select value={status} onChange={setStatus} style={{ width: 170 }} options={[{ value: "ALL", label: "All commissions" }, { value: "pending", label: "Pending payment" }, { value: "completed", label: "Paid (completed)" }]} />
        <Select value={posted} onChange={setPosted} style={{ width: 170 }} options={[{ value: "ALL", label: "Any ledger status" }, { value: "UNPOSTED", label: "Not posted" }, { value: "POSTED", label: "Posted to ledger" }]} />
      </Space>
      <AcctTable
        title="Commission payroll"
        loading={isFetching}
        rows={filtered}
        columns={[
          { title: "Agent", dataIndex: "agentName", key: "a" },
          { title: "Trade", key: "t", render: (_, r) => r.trade?.number || "—", exportValue: (r) => r.trade?.number },
          { title: "Closing", key: "c", render: (_, r) => fmtDate(r.trade?.closingDate), exportValue: (r) => r.trade?.closingDate },
          moneyCol("Agent commission", "agentCommissionTotal"),
          moneyCol("Withheld", "totalDeduction"),
          moneyCol("Paid", "amountPaid"),
          moneyCol("Received in trust", "commissionReceivedInTrust"),
          moneyCol("Agent open charges", "outstandingCharges"),
          { title: "Payment", dataIndex: "status", key: "s", render: (s) => <StatusTag status={s} /> },
          { title: "Ledger", key: "l", render: (_, r) => (r.posting ? <Tag color="green">Posted {fmtDate(r.posting.postingDate)}</Tag> : <Tag>Not posted</Tag>), exportValue: (r) => (r.posting ? "Posted" : "Not posted") },
          {
            title: "", key: "actions",
            render: (_, r) => (
              <Space size={4}>
                <button type="button" className="primary-btn-ghost text-xs py-0.5 px-2" onClick={() => showBreakdown(r)}>Fees</button>
                {r.status === "completed" && !r.posting && <button type="button" className="primary-btn text-xs py-0.5 px-2" onClick={() => setPosting(r)}>Post to Ledger</button>}
                {r.posting && <button type="button" className="primary-btn-ghost text-xs py-0.5 px-2" onClick={() => setCorrecting(r)}>Correct</button>}
                {r.posting && <button type="button" className="danger-btn text-xs py-0.5 px-2" onClick={() => Modal.confirm({ title: "Reverse this ledger posting?", content: "The journal is reversed and any deducted charges are reopened. The cheque itself is not affected.", onOk: () => run(`/commission-payroll/${r.id}/unpost`) })}>Unpost</button>}
              </Space>
            ),
          },
        ]}
      />
      {posting && <PostModal commission={posting} onClose={() => setPosting(null)} />}
      {correcting && <CorrectionModal commission={correcting} onClose={() => setCorrecting(null)} />}
      <Modal title={`Fee breakdown — ${breakdown?.agentName || ""}`} open={!!breakdown} onCancel={() => setBreakdown(null)} footer={null}>
        {breakdown && (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Fee source">{breakdown.feeSource}</Descriptions.Item>
            <Descriptions.Item label="Gross commission">{money(breakdown.grossCommission)}</Descriptions.Item>
            <Descriptions.Item label={`Agent share (${breakdown.splitPercent}%)`}>{money(breakdown.agentShare)}</Descriptions.Item>
            <Descriptions.Item label="Deal fee">{money(breakdown.dealFee)}</Descriptions.Item>
            <Descriptions.Item label="Admin fee">{money(breakdown.adminFee)}</Descriptions.Item>
            <Descriptions.Item label="Net agent commission"><b>{money(breakdown.netAgentCommission)}</b></Descriptions.Item>
            <Descriptions.Item label="Outstanding charges">{money(breakdown.outstandingCharges)}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};

const CorrectionModal = ({ commission, onClose }) => {
  const [form] = Form.useForm();
  const { run, loading } = useAcctAction();
  const { rows: earlier } = useAcct("/commission-corrections", { tradeAgentCommissionId: commission.id });
  const last = (earlier || [])[0];
  const baseGross = last ? Number(last.correctedGrossCommission) : Number(commission.posting.grossCommission);
  const baseAgent = last ? Number(last.correctedAgentShare) : Number(commission.posting.agentPayout) + Number(commission.posting.chargesDeducted);
  const gross = Form.useWatch("correctedGrossCommission", form) ?? baseGross;
  const agent = Form.useWatch("correctedAgentShare", form) ?? baseAgent;
  const fee = Form.useWatch("feeAdjustment", form) || 0;
  const dGross = Math.round((gross - baseGross) * 100) / 100;
  const dAgent = Math.round((agent - baseAgent) * 100) / 100;
  const r2 = (n) => Math.round(n * 100) / 100;

  React.useEffect(() => {
    form.setFieldsValue({ correctedGrossCommission: baseGross, correctedAgentShare: baseAgent, correctedBrokerageShare: r2(baseGross - baseAgent) });
  }, [baseGross, baseAgent]);

  const save = async () => {
    const v = await form.validateFields();
    if (await run(`/commission-payroll/${commission.id}/correct`, { ...v, correctionDate: ymd(v.correctionDate) })) onClose();
  };

  return (
    <Modal title={`Correct commission — ${commission.agentName}`} open onCancel={onClose} onOk={save} okText="Post Correction" confirmLoading={loading} width={680} destroyOnClose>
      <Alert className="mb-3" type="info" showIcon message={`Current (${last ? "after last correction" : "as posted"}): gross ${money(baseGross)} · agent share ${money(baseAgent)}`} />
      <Form
        form={form}
        layout="vertical"
        initialValues={{ correctionDate: dayjs(), feeAdjustment: 0 }}
        onValuesChange={(changed, all) => {
          if ("correctedGrossCommission" in changed || "correctedAgentShare" in changed) form.setFieldValue("correctedBrokerageShare", r2((all.correctedGrossCommission || 0) - (all.correctedAgentShare || 0)));
        }}
      >
        <div className="grid grid-cols-3 gap-x-4">
          <Form.Item name="correctedGrossCommission" label="Corrected gross" rules={[{ required: true }]}><InputNumber min={0} step={0.01} prefix="$" className="w-full" /></Form.Item>
          <Form.Item name="correctedAgentShare" label="Corrected agent share" rules={[{ required: true }]}><InputNumber min={0} step={0.01} prefix="$" className="w-full" /></Form.Item>
          <Form.Item name="correctedBrokerageShare" label="Brokerage share"><InputNumber disabled prefix="$" className="w-full" /></Form.Item>
          <Form.Item name="feeAdjustment" label="Fee adjustment" extra="+ charge agent · − refund agent"><InputNumber step={0.01} prefix="$" className="w-full" /></Form.Item>
          <Form.Item name="correctionDate" label="Correction date" rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item>
        </div>
        <Form.Item name="reason" label="Reason" rules={[{ required: true, message: "A reason is required" }]}><Input /></Form.Item>
        <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
      </Form>
      <div className="text-sm space-y-1 bg-gray-50 rounded p-3">
        <div>Gross change: <b>{money(dGross)}</b> {dGross !== 0 && <span className="text-gray-500">(adjusts commission income and A/R)</span>}</div>
        <div>
          Agent share change: <b>{money(dAgent)}</b>{" "}
          {dAgent > 0 ? <span className="text-gray-500">— owed to the agent (pay it from the Corrections tab)</span> : dAgent < 0 ? <span className="text-gray-500">— overpaid; added as an agent charge to recover</span> : null}
        </div>
        {fee !== 0 && <div>Fee adjustment: <b>{money(fee)}</b> {fee > 0 ? "— charged to the agent" : "— credited to the agent"}</div>}
      </div>
    </Modal>
  );
};

const Corrections = () => {
  const { rows, isFetching } = useAcct("/commission-corrections");
  const { run, loading } = useAcctAction();
  const [paying, setPaying] = useState(null);
  const [form] = Form.useForm();
  const pay = async () => {
    const v = await form.validateFields();
    if (await run(`/commission-corrections/${paying.uuid}/pay`, { ...v, paidAt: ymd(v.paidAt) })) setPaying(null);
  };
  return (
    <>
      <AcctTable
        title="Commission corrections"
        loading={isFetching}
        rows={rows}
        rowKey="uuid"
        columns={[
          dateCol("Date", "correctionDate"),
          { title: "Commission #", dataIndex: "tradeAgentCommissionId", key: "c" },
          moneyCol("Gross before", "originalGrossCommission"),
          moneyCol("Gross after", "correctedGrossCommission"),
          moneyCol("Agent before", "originalAgentShare"),
          moneyCol("Agent after", "correctedAgentShare"),
          moneyCol("Fee adj.", "feeAdjustment"),
          moneyCol("Owed to agent", "payableToAgent"),
          { title: "Reason", dataIndex: "reason", key: "r" },
          {
            title: "", key: "actions",
            render: (_, r) => (Number(r.payableToAgent) > 0 ? (r.paidAt ? <Tag color="green">Paid {fmtDate(r.paidAt)}</Tag> : <button type="button" className="primary-btn text-xs py-0.5 px-2" onClick={() => { setPaying(r); form.setFieldsValue({ paidAt: dayjs() }); }}>Pay Agent</button>) : null),
          },
        ]}
      />
      <Modal title={`Pay correction — ${money(paying?.payableToAgent)}`} open={!!paying} onCancel={() => setPaying(null)} onOk={pay} confirmLoading={loading} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="paidAt" label="Payment date" rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item>
          <Form.Item name="bankAccountId" label="Paid from" rules={[{ required: true }]}><BankSelect /></Form.Item>
          <Form.Item name="reference" label="Cheque / EFT reference"><Input /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const CommissionPayrollSection = () => (
  <Tabs
    items={[
      { key: "payroll", label: "Commissions", children: <CommissionPayroll /> },
      { key: "corrections", label: "Corrections", children: <Corrections /> },
    ]}
  />
);

export default CommissionPayrollSection;
