// @ts-nocheck
// Agent Rankings: top producers by units, volume, GCI or listings over a date range (by closing date).
import React, { useState } from "react";
import { DatePicker, Segmented, Space, Tag } from "antd";
import dayjs from "dayjs";
import { AcctTable, Stat, money, moneyCol, useAcct, ymd } from "../acctShared";

const RankingsSection = () => {
  const [range, setRange] = useState([dayjs().startOf("year"), dayjs()]);
  const [rankBy, setRankBy] = useState("VOLUME");
  const { rows, isFetching } = useAcct("/agent-rankings", { from: ymd(range[0]), to: ymd(range[1]), rankBy });
  return (
    <div className="space-y-3">
      <Space wrap>
        <DatePicker.RangePicker value={range} onChange={(v) => v && setRange(v)} />
        <Segmented value={rankBy} onChange={setRankBy} options={[{ label: "Sales volume", value: "VOLUME" }, { label: "Completed units", value: "UNITS" }, { label: "Gross commission", value: "GCI" }, { label: "Listings", value: "LISTINGS" }]} />
      </Space>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Completed units" value={rows?.totals?.units ?? "—"} sub="Agent transaction credits (by closing date)" />
        <Stat label="Sales volume" value={money(rows?.totals?.volume)} />
        <Stat label="Gross commission" value={money(rows?.totals?.gci)} sub="Agent commission credited" />
      </div>
      <AcctTable
        title="Top producers"
        loading={isFetching}
        rows={rows?.rows}
        rowKey="agentAccountId"
        subtitle={`${ymd(range[0])} to ${ymd(range[1])} · ranked by ${rankBy.toLowerCase()}`}
        columns={[
          { title: "Rank", dataIndex: "rank", key: "r", render: (v) => <span><b>{v}</b>{v === 1 && <Tag className="ml-2" color="gold">Top Producer</Tag>}</span>, exportValue: (r) => r.rank },
          { title: "Agent", dataIndex: "name", key: "n" },
          { title: "Agent #", dataIndex: "agentNumber", key: "a" },
          { title: "Units", dataIndex: "units", key: "u" },
          moneyCol("Volume", "volume"),
          moneyCol("GCI", "gci"),
          { title: "Trades", dataIndex: "tradeCount", key: "t" },
          { title: "Listings", dataIndex: "listings", key: "l" },
        ]}
      />
    </div>
  );
};

export default RankingsSection;
