// @ts-nocheck
// HST / Tax: filing periods computed from the ledger, working papers, filing and payment.
import React, { useState } from "react";
import { Alert, DatePicker, Form, Input, InputNumber, Modal, Popconfirm, Select, Space } from "antd";
import dayjs from "dayjs";
import { AcctTable, BankSelect, StatusTag, dateCol, money, moneyCol, useAcct, useAcctAction, ymd } from "../acctShared";

const HstSection = () => {
  const [year, setYear] = useState(dayjs().year());
  const { rows, isFetching } = useAcct("/hst-periods", { year });
  const { run, loading } = useAcctAction();
  const [saving, setSaving] = useState(null);
  const [filing, setFiling] = useState(null);
  const [paying, setPaying] = useState(null);
  const [form] = Form.useForm();

  return (
    <div className="space-y-3">
      <Alert
        type="info"
        showIcon
        message={`HST is computed from the ledger: collected = HST Collected (23000) on commissions and agent charges; ITCs = HST Input Tax Credit (23001) on posted bills. Filing frequency: ${rows?.frequency || "—"}${rows?.hstNumber ? ` · HST # ${rows.hstNumber}` : ""} (change in Settings).`}
      />
      <Space>
        <Select value={year} onChange={setYear} options={[-2, -1, 0, 1].map((d) => ({ value: dayjs().year() + d, label: dayjs().year() + d }))} />
      </Space>
      <AcctTable
        title={`HST periods ${year}`}
        loading={isFetching}
        rows={rows?.periods}
        rowKey={(r) => r.periodStart}
        pagination={false}
        columns={[
          dateCol("Period start", "periodStart"),
          dateCol("Period end", "periodEnd"),
          moneyCol("HST collected", "hstCollected"),
          moneyCol("ITCs", "itcs"),
          { title: "Adjustments", key: "adj", align: "right", render: (_, r) => money(r.saved?.adjustments || 0) },
          { title: "Net HST", key: "net", align: "right", render: (_, r) => <b className={(r.saved?.netHst ?? r.netHst) < 0 ? "text-green-600" : ""}>{money(r.saved?.netHst ?? r.netHst)}</b>, exportValue: (r) => r.saved?.netHst ?? r.netHst },
          { title: "Status", key: "s", render: (_, r) => <StatusTag status={r.saved?.status || "NOT SAVED"} />, exportValue: (r) => r.saved?.status || "" },
          {
            title: "", key: "actions",
            render: (_, r) => (
              <Space size={4}>
                {(!r.saved || r.saved.status === "OPEN") && <button type="button" className="primary-btn-ghost text-xs py-0.5 px-2" onClick={() => { setSaving(r); form.setFieldsValue({ adjustments: Number(r.saved?.adjustments || 0), notes: r.saved?.notes }); }}>{r.saved ? "Refresh" : "Save working paper"}</button>}
                {r.saved?.status === "OPEN" && <button type="button" className="primary-btn text-xs py-0.5 px-2" onClick={() => setFiling(r.saved)}>Mark Filed</button>}
                {r.saved?.status === "FILED" && <button type="button" className="primary-btn text-xs py-0.5 px-2" onClick={() => setPaying(r.saved)}>{Number(r.saved.netHst) >= 0 ? "Record Payment" : "Record Refund"}</button>}
                {r.saved && r.saved.status !== "OPEN" && <Popconfirm title="Reopen this period? Any payment journal is reversed." onConfirm={() => run(`/hst-periods/${r.saved.uuid}/reopen`)}><button type="button" className="text-red-500 text-xs">Reopen</button></Popconfirm>}
              </Space>
            ),
          },
        ]}
      />
      <Modal title="HST working paper" open={!!saving} onCancel={() => setSaving(null)} onOk={async () => { const v = await form.validateFields(); if (await run("/hst-periods", { periodStart: saving.periodStart, periodEnd: saving.periodEnd, ...v })) setSaving(null); }} confirmLoading={loading} destroyOnClose>
        <p>Collected {money(saving?.hstCollected)} − ITCs {money(saving?.itcs)} = {money(saving?.netHst)}</p>
        <Form form={form} layout="vertical">
          <Form.Item name="adjustments" label="Adjustments (+ owing / − credit)"><InputNumber step={0.01} prefix="$" className="w-full" /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
      <Modal title="Mark HST return filed" open={!!filing} onCancel={() => setFiling(null)} onOk={async () => { const v = await form.validateFields(); if (await run(`/hst-periods/${filing.uuid}/file`, { filedAt: ymd(v.filedAt), reference: v.reference })) setFiling(null); }} confirmLoading={loading} destroyOnClose>
        <Form form={form} layout="vertical" initialValues={{ filedAt: dayjs() }}>
          <Form.Item name="filedAt" label="Filed on" rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item>
          <Form.Item name="reference" label="CRA confirmation #"><Input /></Form.Item>
        </Form>
      </Modal>
      <Modal title={`${Number(paying?.netHst) >= 0 ? "Pay" : "Receive refund"} ${money(Math.abs(Number(paying?.netHst || 0)))}`} open={!!paying} onCancel={() => setPaying(null)} onOk={async () => { const v = await form.validateFields(); if (await run(`/hst-periods/${paying.uuid}/pay`, { bankAccountId: v.bankAccountId, paidAt: ymd(v.paidAt) })) setPaying(null); }} confirmLoading={loading} destroyOnClose>
        <Form form={form} layout="vertical" initialValues={{ paidAt: dayjs() }}>
          <Form.Item name="paidAt" label="Date" rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item>
          <Form.Item name="bankAccountId" label="Bank account" rules={[{ required: true }]}><BankSelect category={["OPERATING", "OTHER"]} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HstSection;
