// @ts-nocheck
// Staff Payroll: employees, hours (manual + Time Clock import), payroll runs with CRA deductions,
// posting, CRA remittances, YTD opening balances, paystubs and a deductions calculator.
import React, { useState } from "react";
import { Alert, Checkbox, DatePicker, Descriptions, Drawer, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Tabs } from "antd";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { AcctTable, BankSelect, EmployeeSelect, StatusTag, dateCol, fmtDate, money, moneyCol, useAcct, useAcctAction, ymd } from "../acctShared";

const FREQS = [{ value: "WEEKLY", label: "Weekly" }, { value: "BIWEEKLY", label: "Bi-weekly" }, { value: "SEMI_MONTHLY", label: "Semi-monthly" }, { value: "MONTHLY", label: "Monthly" }];
const userName = (u) => u?.name || [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.email;

const Employees = () => {
  const { rows, isFetching } = useAcct("/employees");
  const { rows: users } = useAcct("/employees/linkable-users");
  const { run, loading } = useAcctAction();
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const payType = Form.useWatch("payType", form);
  const open = (e) => {
    setEditing(e || {});
    form.setFieldsValue(e ? { ...e, hourlyRate: e.hourlyRate && Number(e.hourlyRate), annualSalary: e.annualSalary && Number(e.annualSalary), overtimeRateMultiplier: Number(e.overtimeRateMultiplier), vacationPayRate: Number(e.vacationPayRate), additionalTax: Number(e.additionalTax), hireDate: e.hireDate ? dayjs(e.hireDate) : null, dateOfBirth: e.dateOfBirth ? dayjs(e.dateOfBirth) : null, sinNumber: "" } : { payType: "HOURLY", payFrequency: "BIWEEKLY", province: "ON", overtimeRateMultiplier: 1.5, vacationPayRate: 0.04, federalClaimCode: 1, ontarioClaimCode: 1, additionalTax: 0, active: true });
  };
  const save = async () => {
    const v = await form.validateFields();
    if (await run("/employees", { ...v, uuid: editing?.uuid, hireDate: ymd(v.hireDate), dateOfBirth: ymd(v.dateOfBirth), sinNumber: v.sinNumber || undefined })) setEditing(null);
  };
  return (
    <>
      <AcctTable
        title="Staff"
        loading={isFetching}
        rows={rows}
        rowKey="uuid"
        extra={<button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => open(null)}>Add Staff</button>}
        columns={[
          { title: "Name", dataIndex: "name", key: "n" },
          { title: "Emp #", dataIndex: "employeeNumber", key: "num" },
          { title: "Title", dataIndex: "jobTitle", key: "t" },
          { title: "Pay", key: "p", render: (_, e) => (e.payType === "HOURLY" ? `${money(e.hourlyRate)}/h` : `${money(e.annualSalary)}/yr`), exportValue: (e) => (e.payType === "HOURLY" ? e.hourlyRate : e.annualSalary) },
          { title: "Frequency", dataIndex: "payFrequency", key: "f" },
          { title: "Claim codes", key: "c", render: (_, e) => `Fed ${e.federalClaimCode} · ON ${e.ontarioClaimCode}` },
          { title: "Time Clock", key: "u", render: (_, e) => (e.userId ? "Linked" : "—") },
          { title: "SIN", key: "s", render: (_, e) => (e.hasSin ? `•••-•••-${e.sinLast3}` : "—"), exportValue: () => "" },
          { title: "Active", dataIndex: "active", key: "a", render: (a) => (a ? "Yes" : "No") },
          { title: "", key: "actions", render: (_, e) => <button type="button" className="primary-btn-ghost text-xs py-1 px-3" onClick={() => open(e)}>Edit</button> },
        ]}
      />
      <Modal title={editing?.uuid ? "Edit staff" : "Add staff"} open={!!editing} onCancel={() => setEditing(null)} onOk={save} confirmLoading={loading} width={760} destroyOnClose>
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-3 gap-x-4">
            <Form.Item name="name" label="Full name" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="employeeNumber" label="Employee #"><Input /></Form.Item>
            <Form.Item name="email" label="Email"><Input /></Form.Item>
            <Form.Item name="jobTitle" label="Job title"><Input /></Form.Item>
            <Form.Item name="department" label="Department"><Input /></Form.Item>
            <Form.Item name="userId" label="Link CRM user (Time Clock)"><Select allowClear showSearch optionFilterProp="label" options={(users || []).map((u) => ({ value: u.id, label: userName(u) }))} /></Form.Item>
            <Form.Item name="payType" label="Pay type" rules={[{ required: true }]}><Select options={[{ value: "HOURLY", label: "Hourly" }, { value: "SALARY", label: "Salary" }]} /></Form.Item>
            {payType === "HOURLY" ? (
              <Form.Item name="hourlyRate" label="Hourly rate" rules={[{ required: true }]}><InputNumber min={0} step={0.01} prefix="$" className="w-full" /></Form.Item>
            ) : (
              <Form.Item name="annualSalary" label="Annual salary" rules={[{ required: true }]}><InputNumber min={0} step={100} prefix="$" className="w-full" /></Form.Item>
            )}
            <Form.Item name="payFrequency" label="Pay frequency" rules={[{ required: true }]}><Select options={FREQS} /></Form.Item>
            <Form.Item name="overtimeRateMultiplier" label="Overtime multiplier"><InputNumber min={1} max={3} step={0.25} className="w-full" /></Form.Item>
            <Form.Item name="vacationPayRate" label="Vacation pay rate" extra="0.04 = 4%"><InputNumber min={0} max={0.2} step={0.01} className="w-full" /></Form.Item>
            <Form.Item name="province" label="Province"><Input maxLength={2} /></Form.Item>
            <Form.Item name="federalClaimCode" label="Federal claim code (TD1)"><InputNumber min={0} max={10} className="w-full" /></Form.Item>
            <Form.Item name="ontarioClaimCode" label="Ontario claim code (TD1ON)"><InputNumber min={0} max={10} className="w-full" /></Form.Item>
            <Form.Item name="additionalTax" label="Additional tax / period"><InputNumber min={0} step={1} prefix="$" className="w-full" /></Form.Item>
            <Form.Item name="hireDate" label="Hire date"><DatePicker className="w-full" /></Form.Item>
            <Form.Item name="dateOfBirth" label="Date of birth"><DatePicker className="w-full" /></Form.Item>
            <Form.Item name="sinNumber" label="SIN" extra={editing?.hasSin ? "On file — leave blank to keep" : undefined}><Input.Password autoComplete="off" /></Form.Item>
          </div>
          <Space>
            <Form.Item name="cppExempt" valuePropName="checked" className="mb-0"><Checkbox>CPP exempt</Checkbox></Form.Item>
            <Form.Item name="eiExempt" valuePropName="checked" className="mb-0"><Checkbox>EI exempt</Checkbox></Form.Item>
            <Form.Item name="active" valuePropName="checked" className="mb-0"><Checkbox>Active</Checkbox></Form.Item>
          </Space>
        </Form>
      </Modal>
    </>
  );
};

const TimeEntries = () => {
  const [range, setRange] = useState([dayjs().subtract(14, "day"), dayjs()]);
  const [employeeId, setEmployeeId] = useState();
  const { rows, isFetching } = useAcct("/time-entries", { from: ymd(range[0]), to: ymd(range[1]), employeeId });
  const { run, loading } = useAcctAction();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const save = async () => { const v = await form.validateFields(); if (await run("/time-entries", { ...v, workDate: ymd(v.workDate) })) { setOpen(false); form.resetFields(); } };
  return (
    <>
      <Space className="mb-2" wrap>
        <DatePicker.RangePicker value={range} onChange={(v) => v && setRange(v)} />
        <EmployeeSelect value={employeeId} onChange={setEmployeeId} allowClear style={{ width: 220 }} />
      </Space>
      <AcctTable
        title="Hours"
        loading={isFetching}
        rows={rows}
        rowKey="uuid"
        extra={
          <>
            <button type="button" className="primary-btn-ghost text-xs py-1 px-3" disabled={loading} onClick={() => run("/time-entries/import-time-clock", { from: ymd(range[0]), to: ymd(range[1]) })}>Import from Time Clock</button>
            <button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => setOpen(true)}>Log Hours</button>
          </>
        }
        columns={[
          dateCol("Date", "workDate"),
          { title: "Employee", key: "e", render: (_, r) => r.employee?.name, exportValue: (r) => r.employee?.name },
          { title: "Hours", dataIndex: "hours", key: "h", render: (v) => Number(v).toFixed(2) },
          { title: "Overtime", dataIndex: "overtimeHours", key: "o", render: (v) => Number(v).toFixed(2) },
          { title: "Source", dataIndex: "source", key: "s" },
          { title: "Notes", dataIndex: "notes", key: "n" },
          { title: "Paid", key: "p", render: (_, r) => (r.payrollRunId ? "In posted run" : "—") },
          { title: "", key: "actions", render: (_, r) => !r.payrollRunId && <Popconfirm title="Delete entry?" onConfirm={() => run(`/time-entries/${r.uuid}`, undefined, { method: "DELETE" })}><button type="button" className="text-red-500 text-xs">Delete</button></Popconfirm> },
        ]}
      />
      <Modal title="Log hours" open={open} onCancel={() => setOpen(false)} onOk={save} confirmLoading={loading} destroyOnClose>
        <Form form={form} layout="vertical" initialValues={{ workDate: dayjs(), overtimeHours: 0 }}>
          <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}><EmployeeSelect /></Form.Item>
          <Form.Item name="workDate" label="Work date" rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item>
          <Form.Item name="hours" label="Regular hours" rules={[{ required: true }]}><InputNumber min={0} max={24} step={0.25} className="w-full" /></Form.Item>
          <Form.Item name="overtimeHours" label="Overtime hours"><InputNumber min={0} max={24} step={0.25} className="w-full" /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

function printPaystub(data) {
  const { run, line, ytd } = data;
  const row = (label, cur, y) => `<tr><td>${label}</td><td style="text-align:right">${money(cur)}</td><td style="text-align:right">${money(y)}</td></tr>`;
  const w = window.open("", "_blank");
  if (!w) return toast.error("Allow pop-ups to print paystubs.");
  w.document.write(`<!doctype html><html><head><title>Paystub ${line.employee.name}</title><style>body{font-family:Arial;font-size:12px;padding:24px;color:#172238}h2{margin:0;color:#0f2141}table{width:100%;border-collapse:collapse;margin-top:12px}td,th{padding:6px;border-bottom:1px solid #ddd;text-align:left}.muted{color:#68758a}</style></head><body>
    <h2>DREAM VALLEY REALTY</h2><div class="muted">Statement of earnings and deductions</div>
    <p><b>${line.employee.name}</b>${line.employee.employeeNumber ? ` · #${line.employee.employeeNumber}` : ""}<br/>Pay period ${fmtDate(run.periodStart)} – ${fmtDate(run.periodEnd)} · Pay date ${fmtDate(run.payDate)} · Run ${run.runNumber}</p>
    <table><thead><tr><th>Earnings</th><th style="text-align:right">Current</th><th style="text-align:right">YTD</th></tr></thead><tbody>
    <tr><td>Regular hours ${Number(line.regularHours).toFixed(2)} · Overtime ${Number(line.overtimeHours).toFixed(2)}</td><td></td><td></td></tr>
    ${Number(line.vacationPay) ? row("Vacation pay", line.vacationPay, "") : ""}
    ${row("Gross pay", line.grossPay, ytd.grossPay)}</tbody></table>
    <table><thead><tr><th>Deductions</th><th style="text-align:right">Current</th><th style="text-align:right">YTD</th></tr></thead><tbody>
    ${row("Income tax", line.incomeTax, ytd.incomeTax)}${row("Canada Pension Plan (CPP)", line.cpp, ytd.cpp)}${row("CPP2", line.cpp2, ytd.cpp2)}${row("Employment Insurance", line.ei, ytd.ei)}
    </tbody></table>
    <table><tbody>${row("<b>Net pay</b>", line.netPay, ytd.netPay)}</tbody></table>
    <script>window.print()</script></body></html>`);
  w.document.close();
}

const RunDrawer = ({ uuid, onClose }) => {
  const { rows: run, isFetching } = useAcct(uuid ? `/payroll-runs/${uuid}` : null);
  const { run: act, loading } = useAcctAction();
  const [bankId, setBankId] = useState();
  return (
    <Drawer title={run ? `Payroll ${run.runNumber}` : "Payroll run"} open={!!uuid} onClose={onClose} width={1000} destroyOnClose>
      {run && (
        <>
          <Descriptions size="small" bordered column={3} className="mb-3">
            <Descriptions.Item label="Period">{fmtDate(run.periodStart)} – {fmtDate(run.periodEnd)}</Descriptions.Item>
            <Descriptions.Item label="Pay date">{fmtDate(run.payDate)}</Descriptions.Item>
            <Descriptions.Item label="Status"><StatusTag status={run.status} /></Descriptions.Item>
            <Descriptions.Item label="Gross">{money(run.grossPay)}</Descriptions.Item>
            <Descriptions.Item label="Deductions">{money(Number(run.incomeTax) + Number(run.cpp) + Number(run.cpp2) + Number(run.ei))}</Descriptions.Item>
            <Descriptions.Item label="Net pay">{money(run.totalNetPay)}</Descriptions.Item>
            <Descriptions.Item label="Employer CPP/EI">{money(Number(run.employerCpp) + Number(run.employerCpp2) + Number(run.employerEi))}</Descriptions.Item>
          </Descriptions>
          <AcctTable
            title="Payroll lines"
            loading={isFetching}
            rows={run.lines}
            pagination={false}
            columns={[
              { title: "Employee", key: "e", render: (_, l) => l.employee?.name, exportValue: (l) => l.employee?.name },
              { title: "Hours", key: "h", render: (_, l) => `${Number(l.regularHours).toFixed(2)} + ${Number(l.overtimeHours).toFixed(2)} OT` },
              moneyCol("Gross", "grossPay"), moneyCol("Tax", "incomeTax"), moneyCol("CPP", "cpp"), moneyCol("CPP2", "cpp2"), moneyCol("EI", "ei"), moneyCol("Net", "netPay"),
              { title: "", key: "actions", render: (_, l) => <PaystubButton runUuid={run.uuid} employeeId={l.employeeId} /> },
            ]}
          />
          <div className="flex flex-wrap gap-2 mt-3 items-center">
            {run.status === "DRAFT" && <button type="button" className="primary-btn" disabled={loading} onClick={() => act(`/payroll-runs/${run.uuid}/approve`)}>Approve</button>}
            {run.status === "APPROVED" && (
              <>
                <BankSelect category={["OPERATING", "OTHER"]} value={bankId ?? run.bankAccountId} onChange={setBankId} style={{ width: 260 }} placeholder="Pay net from" />
                <button type="button" className="primary-btn" disabled={loading || !(bankId ?? run.bankAccountId)} onClick={() => act(`/payroll-runs/${run.uuid}/post`, { bankAccountId: bankId ?? run.bankAccountId })}>Post to Ledger</button>
              </>
            )}
            <Popconfirm title={run.status === "POSTED" ? "Reverse and delete this posted run?" : "Delete this run?"} onConfirm={async () => { if (await act(`/payroll-runs/${run.uuid}`, undefined, { method: "DELETE" })) onClose(); }}>
              <button type="button" className="danger-btn">{run.status === "POSTED" ? "Reverse Run" : "Delete Run"}</button>
            </Popconfirm>
          </div>
        </>
      )}
    </Drawer>
  );
};

const PaystubButton = ({ runUuid, employeeId }) => {
  const [load, setLoad] = useState(false);
  const { rows } = useAcct(load ? `/payroll-runs/${runUuid}/paystub/${employeeId}` : null);
  React.useEffect(() => { if (load && rows) { printPaystub(rows); setLoad(false); } }, [load, rows]);
  return <button type="button" className="primary-btn-ghost text-xs py-0.5 px-2" onClick={() => setLoad(true)}>Paystub</button>;
};

const Runs = () => {
  const { rows, isFetching } = useAcct("/payroll-runs");
  const { run, loading } = useAcctAction();
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [form] = Form.useForm();
  const create = async () => {
    const v = await form.validateFields();
    const res = await run("/payroll-runs", { periodStart: ymd(v.period[0]), periodEnd: ymd(v.period[1]), payDate: ymd(v.payDate), bankAccountId: v.bankAccountId });
    if (res) { setOpen(false); setViewing(res.uuid); }
  };
  return (
    <>
      <AcctTable
        title="Payroll runs"
        loading={isFetching}
        rows={rows}
        rowKey="uuid"
        extra={<button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => setOpen(true)}>New Payroll Run</button>}
        columns={[
          { title: "Run", dataIndex: "runNumber", key: "n" },
          { title: "Period", key: "p", render: (_, r) => `${fmtDate(r.periodStart)} – ${fmtDate(r.periodEnd)}`, exportValue: (r) => `${String(r.periodStart).slice(0, 10)} – ${String(r.periodEnd).slice(0, 10)}` },
          dateCol("Pay date", "payDate"),
          { title: "Staff", key: "c", render: (_, r) => r._count?.lines },
          moneyCol("Gross", "grossPay"), moneyCol("Net", "totalNetPay"),
          { title: "Status", dataIndex: "status", key: "s", render: (s) => <StatusTag status={s} /> },
          { title: "", key: "actions", render: (_, r) => <button type="button" className="primary-btn-ghost text-xs py-1 px-3" onClick={() => setViewing(r.uuid)}>Open</button> },
        ]}
      />
      <Modal title="New payroll run" open={open} onCancel={() => setOpen(false)} onOk={create} okText="Calculate" confirmLoading={loading} destroyOnClose>
        <Alert className="mb-3" type="info" showIcon message="Hourly staff are paid from logged hours in the period (import Time Clock hours first). Salaried staff are paid salary ÷ pay periods. Deductions use the CRA formulas with year-to-date maximums." />
        <Form form={form} layout="vertical" initialValues={{ period: [dayjs().subtract(13, "day"), dayjs()], payDate: dayjs().add(3, "day") }}>
          <Form.Item name="period" label="Pay period" rules={[{ required: true }]}><DatePicker.RangePicker className="w-full" /></Form.Item>
          <Form.Item name="payDate" label="Pay date" rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item>
          <Form.Item name="bankAccountId" label="Pay from (can be set when posting)"><BankSelect category={["OPERATING", "OTHER"]} allowClear /></Form.Item>
        </Form>
      </Modal>
      <RunDrawer uuid={viewing} onClose={() => setViewing(null)} />
    </>
  );
};

const Remittances = () => {
  const { rows, isFetching } = useAcct("/remittances");
  const { run, loading } = useAcctAction();
  const [paying, setPaying] = useState(null);
  const [form] = Form.useForm();
  const pay = async () => { const v = await form.validateFields(); if (await run(`/remittances/${paying.uuid}/pay`, { ...v, paidAt: ymd(v.paidAt) })) setPaying(null); };
  return (
    <>
      <AcctTable
        title="CRA source deduction remittances"
        loading={isFetching}
        rows={rows}
        rowKey="uuid"
        columns={[
          { title: "Payroll run", key: "r", render: (_, r) => r.payrollRun?.runNumber, exportValue: (r) => r.payrollRun?.runNumber },
          { title: "Pay date", key: "p", render: (_, r) => fmtDate(r.payrollRun?.payDate) },
          moneyCol("Amount due", "amountDue"),
          dateCol("Due date", "dueDate"),
          { title: "Status", dataIndex: "status", key: "s", render: (s, r) => <StatusTag status={s === "UNPAID" && dayjs(r.dueDate).isBefore(dayjs(), "day") ? "OVERDUE" : s} /> },
          dateCol("Paid", "paidAt"),
          { title: "", key: "actions", render: (_, r) => (r.status === "UNPAID" ? <button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => { setPaying(r); form.setFieldsValue({ paidAt: dayjs() }); }}>Record Payment</button> : <Popconfirm title="Reverse this payment?" onConfirm={() => run(`/remittances/${r.uuid}/unpay`)}><button type="button" className="text-red-500 text-xs">Reverse</button></Popconfirm>) },
        ]}
      />
      <Modal title={`Pay CRA — ${money(paying?.amountDue)}`} open={!!paying} onCancel={() => setPaying(null)} onOk={pay} confirmLoading={loading} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="paidAt" label="Payment date" rules={[{ required: true }]}><DatePicker className="w-full" /></Form.Item>
          <Form.Item name="bankAccountId" label="Paid from" rules={[{ required: true }]}><BankSelect category={["OPERATING", "OTHER"]} /></Form.Item>
          <Form.Item name="reference" label="CRA confirmation #"><Input /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const YtdOpenings = () => {
  const { rows, isFetching } = useAcct("/ytd-openings");
  const { run, loading } = useAcctAction();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const save = async () => { const v = await form.validateFields(); if (await run("/ytd-openings", v)) { setOpen(false); form.resetFields(); } };
  const num = (name, label) => <Form.Item name={name} label={label}><InputNumber min={0} step={0.01} prefix="$" className="w-full" /></Form.Item>;
  return (
    <>
      <Alert className="mb-3" type="info" showIcon message="Enter amounts already paid this year before using this module, so CPP/EI maximums and cumulative tax are correct." />
      <AcctTable
        title="YTD opening balances"
        loading={isFetching}
        rows={rows}
        extra={<button type="button" className="primary-btn text-xs py-1 px-3" onClick={() => setOpen(true)}>Add Opening Balance</button>}
        columns={[{ title: "Employee", key: "e", render: (_, r) => r.employee?.name, exportValue: (r) => r.employee?.name }, { title: "Year", dataIndex: "taxYear", key: "y" }, moneyCol("Gross", "priorGrossPay"), moneyCol("Tax", "priorIncomeTax"), moneyCol("CPP", "priorCpp"), moneyCol("CPP2", "priorCpp2"), moneyCol("EI", "priorEi"), { title: "Periods", dataIndex: "priorPayPeriods", key: "p" }, { title: "", key: "actions", render: (_, r) => <Popconfirm title="Delete?" onConfirm={() => run(`/ytd-openings/${r.id}`, undefined, { method: "DELETE" })}><button type="button" className="text-red-500 text-xs">Delete</button></Popconfirm> }]}
      />
      <Modal title="YTD opening balance" open={open} onCancel={() => setOpen(false)} onOk={save} confirmLoading={loading} width={720} destroyOnClose>
        <Form form={form} layout="vertical" initialValues={{ taxYear: dayjs().year(), priorPayPeriods: 0 }}>
          <div className="grid grid-cols-3 gap-x-4">
            <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}><EmployeeSelect /></Form.Item>
            <Form.Item name="taxYear" label="Tax year" rules={[{ required: true }]}><InputNumber min={2000} max={2100} className="w-full" /></Form.Item>
            <Form.Item name="priorPayPeriods" label="Pay periods completed"><InputNumber min={0} max={53} className="w-full" /></Form.Item>
            {num("priorGrossPay", "Gross pay")}{num("priorIncomeTax", "Income tax")}{num("priorCpp", "Employee CPP")}
            {num("priorCpp2", "Employee CPP2")}{num("priorEi", "Employee EI")}{num("priorNetPay", "Net pay")}
            {num("priorEmployerCpp", "Employer CPP")}{num("priorEmployerCpp2", "Employer CPP2")}{num("priorEmployerEi", "Employer EI")}
          </div>
          <Form.Item name="sourceReference" label="Source (e.g. previous payroll provider)"><Input /></Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const Calculator = () => {
  const [form] = Form.useForm();
  const { run, loading } = useAcctAction();
  const [r, setR] = useState(null);
  const calc = async () => { const v = await form.validateFields(); setR(await run("/payroll-calculator", v, { silent: true })); };
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Form form={form} layout="vertical" initialValues={{ payFrequency: "BIWEEKLY", federalClaimCode: 1, ontarioClaimCode: 1, payPeriodsCompleted: 0 }}>
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item name="gross" label="Gross pay this period" rules={[{ required: true }]}><InputNumber min={0.01} step={0.01} prefix="$" className="w-full" /></Form.Item>
          <Form.Item name="payFrequency" label="Pay frequency"><Select options={FREQS} /></Form.Item>
          <Form.Item name="ytdGross" label="YTD gross (before)"><InputNumber min={0} prefix="$" className="w-full" /></Form.Item>
          <Form.Item name="payPeriodsCompleted" label="Periods completed"><InputNumber min={0} className="w-full" /></Form.Item>
          <Form.Item name="ytdCpp" label="YTD CPP"><InputNumber min={0} prefix="$" className="w-full" /></Form.Item>
          <Form.Item name="ytdEi" label="YTD EI"><InputNumber min={0} prefix="$" className="w-full" /></Form.Item>
          <Form.Item name="ytdTax" label="YTD tax"><InputNumber min={0} prefix="$" className="w-full" /></Form.Item>
          <Form.Item name="additionalTax" label="Additional tax"><InputNumber min={0} prefix="$" className="w-full" /></Form.Item>
          <Form.Item name="federalClaimCode" label="Federal claim code"><InputNumber min={0} max={10} className="w-full" /></Form.Item>
          <Form.Item name="ontarioClaimCode" label="Ontario claim code"><InputNumber min={0} max={10} className="w-full" /></Form.Item>
        </div>
        <button type="button" className="primary-btn" onClick={calc} disabled={loading}>Calculate</button>
      </Form>
      {r && (
        <Descriptions bordered size="small" column={1} title="Deductions">
          <Descriptions.Item label="Gross">{money(r.grossPay)}</Descriptions.Item>
          <Descriptions.Item label="Income tax">{money(r.incomeTax)}</Descriptions.Item>
          <Descriptions.Item label="CPP">{money(r.cpp)}</Descriptions.Item>
          <Descriptions.Item label="CPP2">{money(r.cpp2)}</Descriptions.Item>
          <Descriptions.Item label="EI">{money(r.ei)}</Descriptions.Item>
          <Descriptions.Item label="Net pay"><b>{money(r.netPay)}</b></Descriptions.Item>
          <Descriptions.Item label="Employer CPP / EI">{money(r.employerCpp)} / {money(r.employerEi)}</Descriptions.Item>
          <Descriptions.Item label="Annualized taxable income">{money(r.annualTaxableIncome)}</Descriptions.Item>
        </Descriptions>
      )}
    </div>
  );
};

const StaffPayrollSection = () => (
  <Tabs items={[
    { key: "staff", label: "Staff", children: <Employees /> },
    { key: "hours", label: "Hours", children: <TimeEntries /> },
    { key: "runs", label: "Payroll Runs", children: <Runs /> },
    { key: "remit", label: "CRA Remittances", children: <Remittances /> },
    { key: "ytd", label: "YTD Openings", children: <YtdOpenings /> },
    { key: "calc", label: "Calculator", children: <Calculator /> },
  ]} />
);

export default StaffPayrollSection;
