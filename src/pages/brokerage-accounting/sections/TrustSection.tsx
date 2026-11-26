// @ts-nocheck
// Trust Banking: Real Estate Trust & Commission Trust ledgers linked to Trade Sheets.
import React, { useState } from "react";
import { Alert, Card, Checkbox, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Tabs, Tag } from "antd";
import dayjs from "dayjs";
import { AcctTable, BankSelect, Stat, StatusTag, TradeSelect, confirmWithReason, dateCol, money, moneyCol, tradeLabel, useAcct, useAcctAction, ymd } from "../acctShared";

const PAYMENT_TYPES = ["CHEQUE", "BANK_DRAFT", "EFT", "WIRE", "CASH"].map((v) => ({ value: v, label: v.replace(/_/g, " ") }));

const ACTIONS = {
  deposit: { title: "Record deposit (Real Estate Trust)", path: "/trust/deposit", help: "Buyer deposit received and held in Real Estate Trust for the trade." },
  disbursement: { title: "Trust disbursement", path: "/trust/disbursement", help: "Pay money out of a trust account for a trade (e.g. to the seller's lawyer on closing)." },
  refund: { title: "DFT — refund deposit", path: "/trust/refund", help: "Deal fell through: refund the deposit. A signed mutual release / direction must be on file." },
  transfer: { title: "Commission transfer: Real Estate Trust → Commission Trust", path: "/trust/commission-transfer", help: "Seller/landlord side: release the brokerage commission from the deposit into Commission Trust. Commission income is recognised net of HST." },
  receipt: { title: "Commission receipt (A/R) into Commission Trust", path: "/trust/commission-receipt", help: "Commission cheque/EFT received from the other brokerage or lawyer for this trade." },
  coop: { title: "Pay cooperating brokerage", path: "/trust/coop-payment", help: "Pay the other brokerage its share from Commission Trust." },
  operating: { title: "Transfer brokerage share to operating", path: "/trust/transfer-to-operating", help: "Move ANS's earned share out of Commission Trust into the operating account." },
};

const TrustActionModal = ({ action, onClose }) => {
  const [form] = Form.useForm();
  const { run, loading } = useAcctAction();
  const cfg = ACTIONS[action];
  const amount = Form.useWatch("amount", form);
  if (!cfg) return null;

  const submit = async () => {
    const v = await form.validateFields();
    const body = { ...v, ledgerDate: ymd(v.ledgerDate) };
    if (await run(cfg.path, body)) {
      form.resetFields();
      onClose();
    }
  };
  const hstHelper = (
    <button type="button" className="text-xs text-blue-600" onClick={() => form.setFieldValue("hstAmount", Math.round(((Number(amount) || 0) - (Number(amount) || 0) / 1.13) * 100) / 100)}>
      Calculate 13% HST included in amount
    </button>
  );

  return (
    <Modal title={cfg.title} open onCancel={onClose} onOk={submit} okText="Post" confirmLoading={loading} destroyOnClose width={620}>
      <Alert className="mb-3" type="info" showIcon message={cfg.help} />
      <Form form={form} layout="vertical" initialValues={{ ledgerDate: dayjs(), paymentType: "CHEQUE" }}>
        {action === "transfer" && (
          <>
            <Form.Item name="retBankAccountId" label="From Real Estate Trust account" rules={[{ required: true }]}><BankSelect category="REAL_ESTATE_TRUST" /></Form.Item>
            <Form.Item name="ctBankAccountId" label="To Commission Trust account" rules={[{ required: true }]}><BankSelect category="COMMISSION_TRUST" /></Form.Item>
          </>
        )}
        {action === "operating" && (
          <>
            <Form.Item name="ctBankAccountId" label="From Commission Trust account" rules={[{ required: true }]}><BankSelect category="COMMISSION_TRUST" /></Form.Item>
            <Form.Item name="operatingBankAccountId" label="To operating account" rules={[{ required: true }]}><BankSelect category="OPERATING" /></Form.Item>
          </>
        )}
        {["deposit", "refund"].includes(action) && (
          <Form.Item name="bankAccountId" label="Real Estate Trust account" rules={[{ required: true }]}><BankSelect category="REAL_ESTATE_TRUST" /></Form.Item>
        )}
        {["receipt", "coop"].includes(action) && (
          <Form.Item name="bankAccountId" label="Commission Trust account" rules={[{ required: true }]}><BankSelect category="COMMISSION_TRUST" /></Form.Item>
        )}
        {action === "disbursement" && (
          <Form.Item name="bankAccountId" label="Trust account" rules={[{ required: true }]}><BankSelect category={["REAL_ESTATE_TRUST", "COMMISSION_TRUST"]} /></Form.Item>
        )}
        <Form.Item name="tradeSheetId" label="Trade" rules={[{ required: !["deposit", "disbursement", "operating"].includes(action), message: "Select the trade" }]}>
          <TradeSelect />
        </Form.Item>
        <Space size="large" wrap>
          <Form.Item name="ledgerDate" label="Date" rules={[{ required: true }]}><DatePicker /></Form.Item>
          <Form.Item name="amount" label={action === "refund" ? "Amount (blank = full balance)" : "Amount"} rules={[{ required: action !== "refund" }]}><InputNumber min={0.01} step={0.01} prefix="$" style={{ width: 180 }} /></Form.Item>
          {["transfer", "receipt"].includes(action) && (
            <Form.Item name="hstAmount" label="HST included" extra={hstHelper}><InputNumber min={0} step={0.01} prefix="$" style={{ width: 160 }} /></Form.Item>
          )}
        </Space>
        {["deposit", "receipt"].includes(action) && (
          <Form.Item name="receivedFrom" label="Received from" rules={[{ required: action === "deposit" }]}><Input /></Form.Item>
        )}
        {["disbursement", "refund", "coop"].includes(action) && (
          <Form.Item name="payeeName" label={action === "coop" ? "Cooperating brokerage" : "Payee"} rules={[{ required: action !== "refund" }]}><Input /></Form.Item>
        )}
        {!["transfer", "operating"].includes(action) && (
          <Form.Item name="paymentType" label="Payment type"><Select options={PAYMENT_TYPES} /></Form.Item>
        )}
        <Form.Item name="reference" label="Reference / cheque #"><Input /></Form.Item>
        {action === "refund" && (
          <>
            <Form.Item name="authorityReference" label="Release / direction reference"><Input placeholder="e.g. Mutual release signed 2026-10-12" /></Form.Item>
            <Form.Item name="releaseAuthorized" valuePropName="checked" rules={[{ validator: (_, v) => (v ? Promise.resolve() : Promise.reject(new Error("Required before refunding trust money"))) }]}>
              <Checkbox>A signed mutual release / written direction is on file</Checkbox>
            </Form.Item>
          </>
        )}
        {["deposit", "disbursement", "coop"].includes(action) && <Form.Item name="description" label="Description"><Input /></Form.Item>}
      </Form>
    </Modal>
  );
};

const Ledger = () => {
  const [type, setType] = useState("ALL");
  const [range, setRange] = useState([dayjs().subtract(3, "month").startOf("month"), dayjs()]);
  const [status, setStatus] = useState("POSTED");
  const { rows, isFetching } = useAcct("/trust/transactions", { trustAccountType: type, from: ymd(range[0]), to: ymd(range[1]), status });
  const { run } = useAcctAction();
  return (
    <div className="space-y-3">
      <Space wrap>
        <Select value={type} onChange={setType} style={{ width: 210 }} options={[{ value: "ALL", label: "All trust accounts" }, { value: "REAL_ESTATE_TRUST", label: "Real Estate Trust" }, { value: "COMMISSION_TRUST", label: "Commission Trust" }]} />
        <DatePicker.RangePicker value={range} onChange={(v) => v && setRange(v)} />
        <Select value={status} onChange={setStatus} style={{ width: 130 }} options={[{ value: "POSTED", label: "Posted" }, { value: "VOID", label: "Voided" }, { value: "ALL", label: "All" }]} />
      </Space>
      <AcctTable
        title="Trust ledger"
        loading={isFetching}
        rows={rows}
        columns={[
          dateCol("Date", "ledgerDate"),
          { title: "Account", key: "b", render: (_, r) => r.bankAccount?.name, exportValue: (r) => r.bankAccount?.name },
          { title: "Direction", dataIndex: "direction", key: "d", render: (d) => <Tag color={d === "DEPOSIT" ? "green" : "orange"}>{d}</Tag> },
          { title: "Kind", dataIndex: "kind", key: "k", render: (k) => k.replace(/_/g, " ") },
          { title: "Trade / Matter", key: "m", render: (_, r) => r.tradeSheet?.tradeSheetTypeId || r.matter || "—", exportValue: (r) => r.tradeSheet?.tradeSheetTypeId || r.matter },
          { title: "Client / Payee", key: "p", render: (_, r) => r.clientName || r.payeeName || "—", exportValue: (r) => r.clientName || r.payeeName },
          { title: "Reference", dataIndex: "reference", key: "r" },
          moneyCol("Amount", "amount"),
          { title: "Status", dataIndex: "status", key: "s", render: (s) => <StatusTag status={s} /> },
          {
            title: "", key: "actions",
            render: (_, r) => r.status === "POSTED" && (
              <button type="button" className="danger-btn text-xs py-1 px-3" onClick={() => confirmWithReason("Void this trust transaction? Its journal is reversed (and its paired transfer leg, if any).", (reason) => run(`/trust/transactions/${r.uuid}/void`, { reason }))}>Void</button>
            ),
          },
        ]}
      />
    </div>
  );
};

const Controls = () => {
  const { rows, isFetching } = useAcct("/trust/liabilities");
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        {(rows?.summary || []).map((s) => (
          <Card key={s.trustAccountType} size="small" title={s.trustAccountType === "REAL_ESTATE_TRUST" ? "Real Estate Trust" : "Commission Trust"} loading={isFetching}>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Bank balance" value={money(s.bankBalance)} />
              <Stat label="Client liability" value={money(s.clientLiability)} />
              <Stat label="Difference" value={<span className={s.difference === 0 ? "text-green-600" : "text-red-600"}>{money(s.difference)}</span>} />
            </div>
            {s.difference !== 0 && <Alert className="mt-2" type="warning" showIcon message="Bank balance must equal client liability. Check unposted items or opening balances." />}
          </Card>
        ))}
      </div>
      <AcctTable
        title="Outstanding client / matter liability"
        loading={isFetching}
        rows={rows?.matters}
        rowKey={(r) => `${r.trustAccountType}-${r.tradeSheetId || r.matter}`}
        columns={[
          { title: "Trust", dataIndex: "trustAccountType", key: "t", render: (t) => t.replace(/_/g, " ") },
          { title: "Trade / Matter", key: "m", render: (_, r) => r.trade?.tradeSheetTypeId || r.matter, exportValue: (r) => r.trade?.tradeSheetTypeId || r.matter },
          { title: "Client", key: "c", render: (_, r) => r.trade?.name || "—", exportValue: (r) => r.trade?.name },
          moneyCol("Deposits", "deposits"),
          moneyCol("Disbursements", "disbursements"),
          moneyCol("Balance held", "balance"),
        ]}
      />
    </div>
  );
};

const TradeLookup = () => {
  const [tradeId, setTradeId] = useState();
  const { rows, isFetching } = useAcct(tradeId ? `/trust/trades/${tradeId}` : null);
  return (
    <div className="space-y-3">
      <TradeSelect value={tradeId} onChange={setTradeId} style={{ width: 460 }} />
      {rows && (
        <>
          <div className="font-medium">{tradeLabel(rows.trade)}</div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Held in Real Estate Trust" value={money(rows.realEstateTrustBalance)} />
            <Stat label="Held in Commission Trust" value={money(rows.commissionTrustBalance)} />
            <Stat label="Commission received" value={money(rows.commissionReceived)} sub="Required before paying the agent" />
          </div>
          <AcctTable
            title="Trade trust activity"
            loading={isFetching}
            rows={rows.transactions}
            columns={[dateCol("Date", "ledgerDate"), { title: "Account", key: "b", render: (_, r) => r.bankAccount?.name }, { title: "Direction", dataIndex: "direction", key: "d" }, { title: "Kind", dataIndex: "kind", key: "k" }, { title: "Client / Payee", key: "p", render: (_, r) => r.clientName || r.payeeName }, moneyCol("Amount", "amount"), { title: "Status", dataIndex: "status", key: "s", render: (s) => <StatusTag status={s} /> }]}
          />
        </>
      )}
    </div>
  );
};

const TrustSection = () => {
  const [action, setAction] = useState(null);
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-3">
        <button type="button" className="primary-btn" onClick={() => setAction("deposit")}>Record Deposit</button>
        <button type="button" className="primary-btn-ghost" onClick={() => setAction("transfer")}>Commission RET → CT</button>
        <button type="button" className="primary-btn-ghost" onClick={() => setAction("receipt")}>Commission Receipt</button>
        <button type="button" className="primary-btn-ghost" onClick={() => setAction("coop")}>Pay Co-op Brokerage</button>
        <button type="button" className="primary-btn-ghost" onClick={() => setAction("operating")}>Transfer to Operating</button>
        <button type="button" className="primary-btn-ghost" onClick={() => setAction("disbursement")}>Disbursement</button>
        <button type="button" className="danger-btn" onClick={() => setAction("refund")}>DFT Refund</button>
      </div>
      <Tabs
        items={[
          { key: "ledger", label: "Trust Ledger", children: <Ledger /> },
          { key: "controls", label: "Trust Controls", children: <Controls /> },
          { key: "trade", label: "Trade Lookup", children: <TradeLookup /> },
        ]}
      />
      {action && <TrustActionModal action={action} onClose={() => setAction(null)} />}
    </>
  );
};

export default TrustSection;
