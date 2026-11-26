// @ts-nocheck
// Accounting dashboard: bank balances, people (birthdays, anniversaries, licences), closings,
// documents expiring and production. Widgets can be shown/hidden per user ("Customize").
import React, { useState } from "react";
import { Card, Checkbox, DatePicker, Empty, Popover, Segmented, Tag } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useAppSelector } from "../../../redux/hooks";
import { useAcct, money, fmtDate, Stat } from "../acctShared";

const PRESETS = {
  month: () => [dayjs().startOf("month"), dayjs().endOf("month")],
  prev: () => [dayjs().subtract(1, "month").startOf("month"), dayjs().subtract(1, "month").endOf("month")],
  next: () => [dayjs().add(1, "month").startOf("month"), dayjs().add(1, "month").endOf("month")],
  year: () => [dayjs().startOf("year"), dayjs().endOf("year")],
};

const WIDGETS = [
  ["production", "Production overview"],
  ["balances", "Bank account balances"],
  ["birthdays", "Agent birthdays"],
  ["anniversaries", "Agent anniversaries"],
  ["licences", "Licences expiring"],
  ["reco", "RECO renewal status"],
  ["closings", "Deals closing"],
  ["documents", "Documents expiring"],
];
const ALL_ON = Object.fromEntries(WIDGETS.map(([k]) => [k, true]));

/** Widget visibility, remembered per user in this browser. */
function useWidgetPrefs() {
  const { user } = useAppSelector((state) => state.user);
  const key = `brokerage-accounting-dashboard:${user?.id || "anon"}`;
  const [prefs, setPrefs] = useState(() => {
    try {
      return { ...ALL_ON, ...JSON.parse(localStorage.getItem(key) || "{}") };
    } catch {
      return ALL_ON;
    }
  });
  const update = (next) => {
    setPrefs(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* storage unavailable: keep the choice for this session only */
    }
  };
  return [prefs, update];
}

const List = ({ items, render, empty }) => (items?.length ? <div className="divide-y">{items.map(render)}</div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={empty} />);

const RENEWAL_COLOR = { ELIGIBLE: "green", IN_PROGRESS: "gold", NOT_STARTED: "default" };

const DashboardSection = ({ onNavigate }) => {
  const [prefs, setPrefs] = useWidgetPrefs();
  const show = (k) => prefs[k] !== false;
  const [preset, setPreset] = useState("month");
  const [range, setRange] = useState(PRESETS.month());
  const { rows: d, isFetching } = useAcct("/dashboard", { from: range[0].format("YYYY-MM-DD"), to: range[1].format("YYYY-MM-DD") });

  const customize = (
    <div className="space-y-1 w-56">
      {WIDGETS.map(([k, label]) => (
        <div key={k}><Checkbox checked={show(k)} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })}>{label}</Checkbox></div>
      ))}
      <button type="button" className="text-xs text-blue-600 mt-1" onClick={() => setPrefs(ALL_ON)}>Show all</button>
    </div>
  );

  const cards = [
    show("balances") && (
      <Card key="balances" size="small" title="Bank account balances" loading={isFetching}>
        <List
          items={d?.bankBalances}
          empty="No bank accounts"
          render={(b) => (
            <div key={b.id} className="flex justify-between py-2">
              <div>
                <div className="font-medium">{b.name}</div>
                <div className="text-xs text-gray-500">{(b.accountCategory || "Uncategorized").replace(/_/g, " ")}</div>
              </div>
              <div className={`font-semibold ${b.bookBalance < 0 ? "text-red-600" : ""}`}>{money(b.bookBalance)}</div>
            </div>
          )}
        />
        <p className="text-[11px] text-gray-400 mt-2">Book balance = opening balance + posted ledger activity.</p>
      </Card>
    ),
    show("birthdays") && (
      <Card key="birthdays" size="small" title={`Agent birthdays (${d?.birthdays?.length || 0})`} loading={isFetching}>
        <List items={d?.birthdays} empty="No birthdays" render={(a) => <div key={a.id} className="flex justify-between py-2"><span>{a.name}</span><span className="text-gray-500">{fmtDate(a.date)}</span></div>} />
      </Card>
    ),
    show("anniversaries") && (
      <Card key="anniversaries" size="small" title={`Agent anniversaries (${d?.anniversaries?.length || 0})`} loading={isFetching}>
        <List items={d?.anniversaries} empty="No anniversaries" render={(a) => <div key={a.id} className="flex justify-between py-2"><span>{a.name} <span className="text-xs text-gray-500">· {a.years} year{a.years === 1 ? "" : "s"}</span></span><span className="text-gray-500">{fmtDate(a.date)}</span></div>} />
      </Card>
    ),
    show("licences") && (
      <Card key="licences" size="small" title={`Licences expiring (${d?.licences?.length || 0})`} loading={isFetching}>
        <List
          items={d?.licences}
          empty="No licences expiring"
          render={(l) => (
            <div key={l.id} className="py-2">
              <div className="flex justify-between"><span className="font-medium">{l.name}</span><span className="text-gray-500">{fmtDate(l.expiry)}</span></div>
              <div className="text-xs text-gray-500 flex gap-2 items-center">
                <Tag color={RENEWAL_COLOR[l.renewalStatus]}>{l.renewalStatus.replace(/_/g, " ")}</Tag>
                {l.recoNumber && <span>RECO {l.recoNumber}</span>}
                {l.appliedDate && <span>Applied {fmtDate(l.appliedDate)}</span>}
              </div>
            </div>
          )}
        />
      </Card>
    ),
    show("reco") && (
      <Card key="reco" size="small" title="RECO renewal status" loading={isFetching}>
        <div className="space-y-2">
          <div className="flex justify-between"><Tag color="gold">RENEWAL IN PROGRESS</Tag><b>{d?.recoStatus?.inProgress ?? 0}</b></div>
          <div className="flex justify-between"><Tag color="green">ELIGIBLE TO TRADE</Tag><b>{d?.recoStatus?.eligible ?? 0}</b></div>
          <div className="flex justify-between"><Tag color="red">EXPIRED — NOT CONFIRMED</Tag><b>{d?.recoStatus?.expired ?? 0}</b></div>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">Set each agent&apos;s renewal status under Agent Fees &amp; Plans → Agents.</p>
      </Card>
    ),
    show("closings") && (
      <Card key="closings" size="small" title={`Deals closing (${d?.closings?.length || 0})`} loading={isFetching}>
        <List
          items={d?.closings}
          empty="No closings"
          render={(c, i) => (
            <div key={i} className="py-2">
              <div className="flex justify-between"><span className="font-medium">{c.tradeNumber || "Trade"} · {c.address || "—"}</span><span className="text-gray-500">{fmtDate(c.date)}</span></div>
              <div className="text-xs text-gray-500">{c.client} {c.price ? `· ${money(c.price)}` : ""}</div>
            </div>
          )}
        />
      </Card>
    ),
    show("documents") && (
      <Card key="documents" size="small" title={`Documents expiring (${d?.expiringDocuments?.length || 0})`} loading={isFetching} extra={<button type="button" className="text-xs text-blue-600" onClick={() => onNavigate("personnel-documents")}>Open</button>}>
        <List
          items={d?.expiringDocuments}
          empty="No documents expiring"
          render={(doc) => (
            <div key={doc.uuid} className="flex justify-between py-2">
              <div>
                <div className="font-medium">{doc.owner}</div>
                <div className="text-xs text-gray-500">{doc.title}</div>
              </div>
              <Tag color={doc.expired ? "red" : "orange"}>{doc.expired ? "Expired" : "Expires"} {fmtDate(doc.expiry)}</Tag>
            </div>
          )}
        />
      </Card>
    ),
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Segmented
          value={preset}
          onChange={(v) => { setPreset(v); if (PRESETS[v]) setRange(PRESETS[v]()); }}
          options={[{ label: "This Month", value: "month" }, { label: "Previous Month", value: "prev" }, { label: "Next Month", value: "next" }, { label: "This Year", value: "year" }, { label: "Custom", value: "custom" }]}
        />
        {preset === "custom" && <DatePicker.RangePicker value={range} onChange={(v) => v && setRange(v)} />}
        <Popover content={customize} title="Show on dashboard" trigger="click" placement="bottomLeft">
          <button type="button" className="primary-btn-ghost flex items-center gap-1"><SettingOutlined /> Customize</button>
        </Popover>
        <div className="flex-1" />
        <button type="button" className="primary-btn" onClick={() => onNavigate("trust")}>Record Trust Deposit</button>
        <button type="button" className="primary-btn-ghost" onClick={() => onNavigate("payables")}>Add Expense</button>
        <button type="button" className="primary-btn-ghost" onClick={() => onNavigate("banking")}>Reconcile</button>
        <button type="button" className="primary-btn-ghost" onClick={() => onNavigate("staff-payroll")}>Run Payroll</button>
      </div>

      {show("production") && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Active agents" value={d?.production?.activeAgents ?? "—"} />
          <Stat label="Closings" value={d?.production?.closings ?? "—"} sub="In selected period" />
          <Stat label="Revenue" value={money(d?.production?.revenue)} sub="Posted to ledger" />
          <Stat label="Expenses" value={money(d?.production?.expenses)} sub="Posted to ledger" />
          <Stat label="Net income" value={money(d?.production?.netIncome)} />
        </div>
      )}

      {(d?.alerts?.pendingBills > 0 || d?.alerts?.openAgentCharges > 0) && (
        <div className="flex flex-wrap gap-3">
          {d.alerts.pendingBills > 0 && <Tag color="gold" className="cursor-pointer" onClick={() => onNavigate("payables")}>{d.alerts.pendingBills} bill(s) awaiting approval</Tag>}
          {d.alerts.openAgentCharges > 0 && <Tag color="orange" className="cursor-pointer" onClick={() => onNavigate("agent-fees")}>{d.alerts.openAgentCharges} open agent charge(s) · {money(d.alerts.openAgentChargeBalance)}</Tag>}
        </div>
      )}

      {cards.length ? <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{cards}</div> : <Empty description="All widgets are hidden. Use Customize to show them." />}
    </div>
  );
};

export default DashboardSection;
