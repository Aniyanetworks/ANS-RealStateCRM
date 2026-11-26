// @ts-nocheck
// Accounting settings: company / HST details and system GL account mapping.
import React, { useEffect } from "react";
import { Alert, Card, Form, Input, InputNumber, Select } from "antd";
import { useAcct, useAcctAction } from "../acctShared";

const SYSTEM_ROLES = [
  ["operatingCash", "Operating cash", "10001"],
  ["trustCashRet", "Real Estate Trust cash", "10002"],
  ["trustCashCommission", "Commission Trust cash", "10004"],
  ["arAgents", "A/R — agents", "12100"],
  ["apSuppliers", "A/P — suppliers", "21000"],
  ["trustLiability", "Liability for trust funds held", "21300"],
  ["commissionPayable", "Commission payable", "21500"],
  ["accruedExpenses", "Accrued expenses (employee reimbursements)", "22000"],
  ["hstCollected", "HST collected", "23000"],
  ["hstItc", "HST input tax credits", "23001"],
  ["fitWithheld", "Income tax withheld", "24000"],
  ["eiWithheld", "EI withheld", "24001"],
  ["cppWithheld", "CPP withheld", "24002"],
  ["suspense", "Suspense", "29000"],
  ["commissionIncome", "Commission income", "40100"],
  ["otherIncome", "Other income (agent fees)", "43100"],
  ["deskFeeIncome", "Desk fee income", "45100"],
  ["agentCommission", "Agent's commission expense", "50100"],
  ["coopCommission", "Commission to other brokers", "51100"],
  ["salaries", "Salaries", "70102"],
  ["payrollTaxExpense", "Payroll expense (employer CPP/EI)", "70104"],
];

const SettingsSection = () => {
  const { rows } = useAcct("/settings");
  const { run, loading } = useAcctAction();
  const [form] = Form.useForm();
  useEffect(() => {
    if (rows) form.setFieldsValue({ ...rows, hstRate: Number(rows.hstRate), glMap: rows.glMap || {} });
  }, [rows?.id, rows?.updatedAt]);
  const save = async () => {
    const v = await form.validateFields();
    const glMap = Object.fromEntries(Object.entries(v.glMap || {}).filter(([, code]) => code && String(code).trim()));
    await run("/settings", { ...v, glMap });
  };
  return (
    <Form form={form} layout="vertical">
      <div className="grid md:grid-cols-2 gap-4">
        <Card size="small" title="Brokerage">
          <Form.Item name="companyName" label="Company name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="legalName" label="Legal name"><Input /></Form.Item>
          <Form.Item name="hstNumber" label="HST / business number"><Input /></Form.Item>
          <div className="grid grid-cols-3 gap-x-4">
            <Form.Item name="hstRate" label="HST rate %"><InputNumber min={0} max={30} step={0.5} className="w-full" /></Form.Item>
            <Form.Item name="hstFilingFrequency" label="HST filing"><Select options={["MONTHLY", "QUARTERLY", "ANNUAL"].map((f) => ({ value: f, label: f.charAt(0) + f.slice(1).toLowerCase() }))} /></Form.Item>
            <Form.Item name="fiscalYearStart" label="Fiscal year start (MM-DD)"><Input placeholder="01-01" /></Form.Item>
          </div>
          <p className="text-xs text-gray-500">{rows?.glAccountCount ?? 0} general ledger accounts configured.</p>
        </Card>
        <Card size="small" title="System account mapping">
          <Alert className="mb-2" type="info" showIcon message="Automatic postings use these GL codes. Leave blank to use the Dream Valley default shown." />
          <div className="grid grid-cols-2 gap-x-3">
            {SYSTEM_ROLES.map(([key, label, def]) => (
              <Form.Item key={key} name={["glMap", key]} label={label} className="mb-2"><Input placeholder={def} /></Form.Item>
            ))}
          </div>
        </Card>
      </div>
      <button type="button" className="primary-btn mt-3" disabled={loading} onClick={save}>Save Settings</button>
    </Form>
  );
};

export default SettingsSection;
