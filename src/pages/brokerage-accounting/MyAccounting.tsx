// @ts-nocheck
// Agent self-service (merged from ANS Accounting): my brokerage charges, payments and released tax slips.
import React from "react";
import { Card, Empty, Table } from "antd";
import { AcctTable, Stat, StatusTag, dateCol, fmtDate, money, moneyCol, useAcct, useAcctAction } from "./acctShared";
import { useLazyAcctGetQuery } from "../../redux/api/accounting/brokerageAccountingSlice";
import toast from "react-hot-toast";

const MyAccounting = () => {
  const { rows: d, isFetching } = useAcct("/my-account");
  const [fetchFile] = useLazyAcctGetQuery();

  const openSlip = async (uuid) => {
    try {
      const res = await fetchFile({ path: `/tax-slips/${uuid}/file` }).unwrap();
      if (res?.data?.url) window.open(res.data.url, "_blank", "noopener");
    } catch (e) {
      toast.error(e?.data?.message || "Could not open the tax slip.");
    }
  };

  if (!isFetching && !d?.agent) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">My Accounting</h1>
        <Empty description="No agent account is linked to your login." />
      </div>
    );
  }

  return (
    <div className="p-1 pb-24 space-y-4">
      <h1 className="text-2xl font-bold">My Accounting</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="Balance owing to brokerage" value={money(d?.balance)} sub="Desk fees, services and other charges" />
        <Stat label="Open charges" value={(d?.charges || []).filter((c) => ["OPEN", "PARTIAL"].includes(c.status)).length} />
        <Stat label="Tax slips available" value={(d?.taxSlips || []).length} />
      </div>
      <AcctTable
        title="My charges"
        loading={isFetching}
        rows={(d?.charges || []).map((c) => ({ ...c, balance: Number(c.amount) - Number(c.amountPaid) }))}
        rowKey="uuid"
        expandable={{
          rowExpandable: (r) => r.payments?.length > 0,
          expandedRowRender: (r) => <Table size="small" rowKey={(p, i) => i} pagination={false} dataSource={r.payments} columns={[dateCol("Paid", "paymentDate"), { title: "Method", dataIndex: "method", key: "m", render: (m) => m.replace(/_/g, " ") }, { title: "Reference", dataIndex: "reference", key: "r" }, moneyCol("Amount", "amount")]} />,
        }}
        columns={[dateCol("Date", "chargeDate"), { title: "Description", dataIndex: "description", key: "d" }, moneyCol("Amount", "amount"), moneyCol("Balance", "balance"), { title: "Status", dataIndex: "status", key: "s", render: (s) => <StatusTag status={s} /> }]}
      />
      <Card size="small" title="My tax slips">
        {(d?.taxSlips || []).length ? (
          <div className="divide-y">
            {d.taxSlips.map((s) => (
              <div key={s.uuid} className="flex justify-between py-2">
                <span>{s.taxYear} {s.slipType.replace("_", "-")} <span className="text-xs text-gray-500">released {fmtDate(s.releasedAt)}</span></span>
                <button type="button" className="primary-btn-ghost text-xs py-1 px-3" onClick={() => openSlip(s.uuid)}>Open</button>
              </div>
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No tax slips released yet." />
        )}
      </Card>
    </div>
  );
};

export default MyAccounting;
