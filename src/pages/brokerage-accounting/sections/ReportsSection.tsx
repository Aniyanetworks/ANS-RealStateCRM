// @ts-nocheck
// Reports: financial statements from the ledger plus operational reports, each exportable to CSV / PDF.
import React, { useMemo, useState } from "react";
import { Alert, DatePicker, Select, Space } from "antd";
import dayjs from "dayjs";
import { AcctTable, GlSelect, Stat, dateCol, money, moneyCol, useAcct, ymd } from "../acctShared";

const REPORTS = [
  { key: "pnl", label: "Profit & Loss", path: "/reports/profit-loss", range: true },
  { key: "bs", label: "Balance Sheet", path: "/reports/balance-sheet", asOf: true },
  { key: "tb", label: "Trial Balance", path: "/reports/trial-balance", asOf: true },
  { key: "gl", label: "General Ledger", path: "/reports/general-ledger", range: true },
  { key: "rev", label: "Revenue by Month", path: "/reports/revenue-by-month", year: true },
  { key: "exp", label: "Expense Summary", path: "/reports/expense-summary", range: true },
  { key: "sales", label: "Sales Volume", path: "/reports/sales-volume", range: true },
  { key: "payroll", label: "Payroll Register", path: "/reports/payroll-register", range: true },
  { key: "cheques", label: "Issued Commission Cheques", path: "/reports/issued-cheques", range: true },
  { key: "trustrec", label: "Trust Reconciliation", path: "/reports/trust-reconciliation", asOf: true },
  { key: "aging", label: "A/P Aging", path: "/bills/aging" },
];

const acctCols = [{ title: "Code", dataIndex: "code", key: "c" }, { title: "Account", dataIndex: "name", key: "n" }];

/** Flatten statement sections into one exportable table with heading and total rows. */
function statementRows(sections) {
  const out = [];
  for (const [title, rows, total] of sections) {
    out.push({ key: `h-${title}`, code: "", name: title.toUpperCase(), amount: null, heading: true });
    rows.forEach((r) => out.push({ key: `${title}-${r.id}`, code: r.code, name: r.name, amount: r.balance }));
    out.push({ key: `t-${title}`, code: "", name: `Total ${title}`, amount: total, total: true });
  }
  return out;
}

const statementColumns = [
  ...acctCols,
  { title: "Amount", dataIndex: "amount", key: "a", align: "right", render: (v, r) => (v === null ? "" : r.total ? <b>{money(v)}</b> : money(v)), exportValue: (r) => (r.amount === null ? "" : Number(r.amount).toFixed(2)) },
];

const ReportBody = ({ report, data, loading, period }) => {
  if (!data) return null;
  switch (report.key) {
    case "pnl":
      return (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <Stat label="Revenue" value={money(data.totalIncome)} />
            <Stat label="Gross profit" value={money(data.grossProfit)} />
            <Stat label="Expenses" value={money(data.totalExpenses)} />
            <Stat label="Net income" value={money(data.netIncome)} />
          </div>
          <AcctTable title="Profit & Loss" subtitle={period} loading={loading} rowKey="key" pagination={false} columns={statementColumns}
            rows={[...statementRows([["Revenue", data.income, data.totalIncome], ["Cost of sales", data.costOfSales, data.totalCostOfSales], ["Expenses", data.expenses, data.totalExpenses]]), { key: "net", code: "", name: "NET INCOME", amount: data.netIncome, total: true }]}
            rowClassName={(r) => (r.heading ? "bg-gray-50 font-semibold" : "")} />
        </>
      );
    case "bs":
      return (
        <>
          {data.outOfBalance !== 0 && <Alert className="mb-3" type="warning" showIcon message={`Assets − liabilities − equity = ${money(data.outOfBalance)}. Check opening balances.`} />}
          <AcctTable title="Balance Sheet" subtitle={period} loading={loading} rowKey="key" pagination={false} columns={statementColumns}
            rows={statementRows([["Assets", data.assets, data.totalAssets], ["Liabilities", data.liabilities, data.totalLiabilities], ["Equity", [...data.equity, { id: "ce", code: "", name: "Current earnings", balance: data.currentEarnings }], data.totalEquity]])}
            rowClassName={(r) => (r.heading ? "bg-gray-50 font-semibold" : "")} />
        </>
      );
    case "tb":
      return (
        <AcctTable title="Trial Balance" subtitle={period} loading={loading} pagination={false}
          rows={[...data.rows, { id: "total", code: "", name: "TOTAL", debitBalance: data.totals.debit, creditBalance: data.totals.credit }]}
          columns={[...acctCols, { title: "Type", dataIndex: "accountType", key: "t" }, moneyCol("Debit", "debitBalance"), moneyCol("Credit", "creditBalance")]} />
      );
    case "gl":
      return (
        <AcctTable title="General Ledger" subtitle={period} loading={loading} rowKey="key" pagination={{ pageSize: 100 }}
          rows={data.accounts.flatMap((a) => [
            { key: `o-${a.account.id}`, date: "", entryNumber: "", memo: `${a.account.code} ${a.account.name} — opening`, debit: null, credit: null, balance: a.openingBalance, heading: true },
            ...a.lines.map((l, i) => ({ key: `${a.account.id}-${i}`, ...l })),
            { key: `c-${a.account.id}`, date: "", entryNumber: "", memo: `Closing balance`, debit: null, credit: null, balance: a.closingBalance, heading: true },
          ])}
          rowClassName={(r) => (r.heading ? "bg-gray-50 font-semibold" : "")}
          columns={[dateCol("Date", "date"), { title: "Entry", dataIndex: "entryNumber", key: "e" }, { title: "Source", dataIndex: "source", key: "s" }, { title: "Description", dataIndex: "memo", key: "m" }, moneyCol("Debit", "debit", { render: (v) => (v ? money(v) : "") }), moneyCol("Credit", "credit", { render: (v) => (v ? money(v) : "") }), moneyCol("Balance", "balance")]} />
      );
    case "rev":
      return <AcctTable title="Revenue by Month" subtitle={period} loading={loading} rowKey="month" pagination={false} rows={data} columns={[{ title: "Month", dataIndex: "month", key: "m" }, moneyCol("Revenue", "revenue"), moneyCol("Expenses", "expenses"), moneyCol("Net", "net")]} />;
    case "exp":
      return (
        <>
          <AcctTable title="Expenses by category" subtitle={period} loading={loading} rowKey="category" pagination={false} rows={data.categories} columns={[{ title: "Category", dataIndex: "category", key: "c" }, { title: "Bills", dataIndex: "count", key: "n" }, moneyCol("Amount", "amount"), moneyCol("HST", "hst"), moneyCol("Total", "total")]} />
          <div className="mt-4" />
          <AcctTable title="Expense detail" subtitle={period} rowKey="billNumber" rows={data.bills} columns={[{ title: "Bill #", dataIndex: "billNumber", key: "b" }, dateCol("Date", "date"), { title: "Vendor", dataIndex: "vendor", key: "v" }, { title: "Category", dataIndex: "category", key: "c" }, { title: "Description", dataIndex: "description", key: "d" }, moneyCol("Amount", "amount"), moneyCol("HST", "hst"), moneyCol("Total", "total"), { title: "Status", dataIndex: "status", key: "s" }, { title: "Payment", dataIndex: "paymentStatus", key: "p" }]} />
        </>
      );
    case "sales":
      return (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3"><Stat label="Sales volume" value={money(data.totalVolume)} /><Stat label="Agent commission" value={money(data.totalCommission)} /></div>
          <AcctTable title="Sales Volume" subtitle={period} loading={loading} rowKey={(r, i) => `${r.tradeNumber}-${i}`} rows={data.rows} columns={[{ title: "Trade #", dataIndex: "tradeNumber", key: "t" }, dateCol("Closing", "closingDate"), { title: "Address", dataIndex: "address", key: "a" }, { title: "Listing agent", dataIndex: "listingAgent", key: "la" }, { title: "Selling agent", dataIndex: "sellingAgent", key: "sa" }, moneyCol("Sale price", "salePrice"), moneyCol("Agent commission", "agentCommission")]} />
        </>
      );
    case "payroll":
      return (
        <AcctTable title="Payroll Register" subtitle={period} loading={loading} rowKey={(r, i) => `${r.runNumber}-${i}`}
          rows={[...data.rows, { runNumber: "TOTAL", employee: "", ...data.totals }]}
          columns={[{ title: "Run", dataIndex: "runNumber", key: "r" }, dateCol("Pay date", "payDate"), { title: "Employee", dataIndex: "employee", key: "e" }, { title: "Hours", dataIndex: "hours", key: "h" }, moneyCol("Gross", "grossPay"), moneyCol("Income tax", "incomeTax"), moneyCol("CPP", "cpp"), moneyCol("EI", "ei"), moneyCol("Net", "netPay"), moneyCol("Employer cost", "employerCost")]} />
      );
    case "cheques":
      return (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3"><Stat label="Net cheques" value={money(data.totalNet)} /><Stat label="Fees deducted" value={money(data.totalFees)} /></div>
          <AcctTable title="Issued Commission Cheques" subtitle={period} loading={loading} rowKey={(r, i) => i} rows={data.rows} columns={[dateCol("Date", "date"), { title: "Agent", dataIndex: "agent", key: "a" }, { title: "Trade #", dataIndex: "tradeNumber", key: "t" }, { title: "Bank", dataIndex: "bank", key: "b" }, moneyCol("Agent commission", "agentCommission"), moneyCol("Fees deducted", "feesDeducted"), moneyCol("Net cheque", "netCheque"), { title: "Ledger", dataIndex: "postedToLedger", key: "p", render: (v) => (v ? "Posted" : "Not posted"), exportValue: (r) => (r.postedToLedger ? "Posted" : "Not posted") }]} />
        </>
      );
    case "trustrec":
      return <AcctTable title="Trust Reconciliation" subtitle={period} loading={loading} rowKey="bank" pagination={false} rows={data.rows} columns={[{ title: "Bank account", dataIndex: "bank", key: "b" }, { title: "Type", dataIndex: "accountCategory", key: "t" }, moneyCol("Book balance", "bookBalance"), dateCol("Last reconciled", "lastReconciled"), moneyCol("Statement", "statementBalance"), moneyCol("Difference", "difference"), { title: "Status", dataIndex: "status", key: "s" }]} />;
    case "aging":
      return <AcctTable title="A/P Aging" subtitle={period} loading={loading} rowKey="uuid" rows={data.rows} columns={[{ title: "Bill #", dataIndex: "billNumber", key: "n" }, { title: "Vendor", dataIndex: "vendor", key: "v" }, dateCol("Due", "dueDate"), { title: "Days past due", dataIndex: "daysPastDue", key: "d" }, moneyCol("Balance due", "balanceDue")]} />;
    default:
      return null;
  }
};

const ReportsSection = () => {
  const [key, setKey] = useState("pnl");
  const report = REPORTS.find((r) => r.key === key);
  const [range, setRange] = useState([dayjs().startOf("year"), dayjs()]);
  const [asOf, setAsOf] = useState(dayjs());
  const [year, setYear] = useState(dayjs().year());
  const [glAccountId, setGlAccountId] = useState();
  const params = useMemo(() => {
    if (report.range) return { from: ymd(range[0]), to: ymd(range[1]), ...(key === "gl" && glAccountId ? { glAccountId } : {}) };
    if (report.asOf) return { to: ymd(asOf) };
    if (report.year) return { year };
    return {};
  }, [key, range, asOf, year, glAccountId]);
  const { rows, isFetching } = useAcct(report.path, params);
  const period = report.range ? `${ymd(range[0])} to ${ymd(range[1])}` : report.asOf ? `As of ${ymd(asOf)}` : report.year ? `Year ${year}` : undefined;

  return (
    <div className="space-y-3">
      <Space wrap>
        <Select value={key} onChange={setKey} style={{ width: 260 }} options={REPORTS.map((r) => ({ value: r.key, label: r.label }))} />
        {report.range && <DatePicker.RangePicker value={range} onChange={(v) => v && setRange(v)} />}
        {report.asOf && <DatePicker value={asOf} onChange={(v) => v && setAsOf(v)} />}
        {report.year && <Select value={year} onChange={setYear} options={[-2, -1, 0].map((d) => ({ value: dayjs().year() + d, label: dayjs().year() + d }))} />}
        {key === "gl" && <GlSelect value={glAccountId} onChange={setGlAccountId} allowClear placeholder="All accounts with activity" style={{ width: 300 }} />}
      </Space>
      <ReportBody report={report} data={rows} loading={isFetching} period={period} />
    </div>
  );
};

export default ReportsSection;
