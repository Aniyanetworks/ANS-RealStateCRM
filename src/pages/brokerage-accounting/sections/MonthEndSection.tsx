// @ts-nocheck
// Compliance & Month End: seven review attestations + bank reconciliations, then close (locks postings).
import React, { useState } from "react";
import { Alert, Checkbox, DatePicker, Input, Modal, Space, Tag } from "antd";
import dayjs from "dayjs";
import { AcctTable, StatusTag, dateCol, fmtDate, useAcct, useAcctAction } from "../acctShared";

const ITEMS = [
  ["trustReconciled", "Real Estate Trust reconciliation"],
  ["commissionTrustReconciled", "Commission Trust reconciliation"],
  ["operatingReconciled", "Operating reconciliation"],
  ["trustLiabilityAgrees", "Trust liability agrees to bank"],
  ["hstReviewed", "HST review"],
  ["payrollReviewed", "Payroll / CRA remittance review"],
  ["pnlReviewed", "P&L review"],
];

const MonthEndSection = () => {
  const [month, setMonth] = useState(dayjs().subtract(1, "month"));
  const ym = month.format("YYYY-MM");
  const { rows: d, isFetching } = useAcct("/month-end", { month: ym });
  const { run, loading } = useAcctAction();
  const rec = d?.record;
  const closed = Boolean(rec?.closedAt);
  const allDone = ITEMS.every(([k]) => rec?.[k]);
  const recsDone = (d?.reconciliations || []).every((r) => r.reconciliation?.status === "RECONCILED");

  return (
    <div className="space-y-4">
      <Space>
        <span>Accounting month</span>
        <DatePicker picker="month" value={month} onChange={(v) => v && setMonth(v)} />
        {closed ? <Tag color="green">Closed {fmtDate(rec.closedAt)}</Tag> : <Tag color="gold">Open</Tag>}
      </Space>
      {closed && <Alert type="success" showIcon message={`Month ending ${d?.periodEnd} is closed. Postings dated on or before it are locked; corrections post as reversing entries in the next open period.`} />}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg bg-white">
          <div className="font-semibold mb-2">Review attestations</div>
          {ITEMS.map(([key, label]) => (
            <div key={key} className="py-1">
              <Checkbox checked={!!rec?.[key]} disabled={closed || loading || isFetching} onChange={(e) => run("/month-end/item", { month: ym, item: key, value: e.target.checked }, { silent: true })}>{label}</Checkbox>
            </div>
          ))}
        </div>
        <div className="p-4 border rounded-lg bg-white">
          <div className="font-semibold mb-2">Bank reconciliations for {d?.periodEnd}</div>
          {(d?.reconciliations || []).map(({ bank, reconciliation }) => (
            <div key={bank.id} className="flex justify-between py-1">
              <span>{bank.name} <span className="text-xs text-gray-500">{bank.accountCategory?.replace(/_/g, " ")}</span></span>
              <StatusTag status={reconciliation?.status || "MISSING"} />
            </div>
          ))}
          {!d?.reconciliations?.length && <p className="text-gray-500 text-sm">No categorized bank accounts.</p>}
          <p className="text-xs text-gray-500 mt-2">Complete reconciliations under Banking → Reconciliation with this month&apos;s statement date.</p>
        </div>
      </div>

      <Space>
        {!closed && (
          <button
            type="button"
            className="primary-btn"
            disabled={!allDone || !recsDone || loading}
            onClick={() => Modal.confirm({ title: `Close ${month.format("MMMM YYYY")}?`, content: "Postings dated in this month or earlier will be locked.", onOk: () => run("/month-end/close", { month: ym }) })}
          >
            Close Month
          </button>
        )}
        {closed && <button type="button" className="danger-btn" disabled={loading} onClick={() => Modal.confirm({ title: "Reopen this month?", content: "Only a Super Admin can reopen. Months must be reopened newest first.", onOk: () => run("/month-end/reopen", { month: ym }) })}>Reopen Month</button>}
        {!closed && (!allDone || !recsDone) && <span className="text-sm text-gray-500">Complete all seven attestations and every bank reconciliation to close.</span>}
      </Space>

      <AcctTable
        title="Month-end history"
        rows={d?.history}
        columns={[
          dateCol("Period end", "periodEnd"),
          { title: "Reviewed", key: "r", render: (_, r) => `${ITEMS.filter(([k]) => r[k]).length}/7`, exportValue: (r) => ITEMS.filter(([k]) => r[k]).length },
          { title: "Status", key: "s", render: (_, r) => <StatusTag status={r.closedAt ? "CLOSED" : "OPEN"} />, exportValue: (r) => (r.closedAt ? "CLOSED" : "OPEN") },
          dateCol("Closed at", "closedAt"),
        ]}
      />
    </div>
  );
};

export default MonthEndSection;
