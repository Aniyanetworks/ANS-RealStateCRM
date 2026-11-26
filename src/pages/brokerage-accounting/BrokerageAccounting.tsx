// Brokerage Accounting — laid out like the original DV Accounting back office (bodv): its sidebar,
// page headings, panels and styling, inside AgentHub. The section is kept in the URL
// (/dashboard/brokerage-accounting/:section). Screens are being rebuilt in the bodv look one at a time;
// the rest still use the AgentHub components inside a bodv panel until they are rebuilt.
import { ComponentType, ReactNode, Suspense, lazy, useState } from "react";
import {
  LuLayoutDashboard, LuLandmark, LuReceipt, LuTrophy, LuWallet, LuDollarSign, LuIdCard, LuPercent, LuFileText, LuChartBar, LuClipboardCheck, LuSettings, LuScissors,
} from "./bodv/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";
import { useAcctGetQuery } from "../../redux/api/accounting/brokerageAccountingSlice";
import "./bodv.css";
import "./bodvLayout.css";

type SectionProps = { onNavigate: (key: string) => void };
type Tab = { key: string; label: string; component: ComponentType<SectionProps> };
type Section = { key: string; label: string; icon: ReactNode; desc?: string; component?: ComponentType<SectionProps>; tabs?: Tab[]; rebuilt?: boolean };

const legacy = (loader: () => Promise<{ default: ComponentType<SectionProps> }>) => lazy(loader);

// Same order and names as the original sidebar (Data Migration is not included: it only imported old Supabase data).
const SECTIONS: Section[] = [
  { key: "dashboard", label: "Dashboard", icon: <LuLayoutDashboard size={18} />, component: lazy(() => import("./bodv/Dashboard")), rebuilt: true },
  { key: "banking", label: "Banking & Reconciliation", icon: <LuLandmark size={18} />, component: lazy(() => import("./bodv/Banking")), rebuilt: true },
  { key: "payables", label: "Expenses & A/P", icon: <LuReceipt size={18} />, desc: "Vendor invoices, approvals, payments and recurring expenses.", component: lazy(() => import("./bodv/Payables")), rebuilt: true },
  { key: "rankings", label: "Agent Rankings", icon: <LuTrophy size={18} />, component: lazy(() => import("./bodv/Rankings")), rebuilt: true },
  {
    key: "agent-fees", label: "Agent Fees & Plans", icon: <LuDollarSign size={18} />, desc: "Fee plans, agent fee rules, charges and billing.",
    tabs: [
      { key: "fees", label: "Agent Fees & Plans", component: legacy(() => import("./sections/AgentFeesSection")) },
      { key: "documents", label: "Personnel Documents", component: legacy(() => import("./sections/PersonnelDocumentsSection")) },
    ],
  },
  { key: "commission-payroll", label: "Commission Payroll", icon: <LuWallet size={18} />, desc: "Agent commission payouts and corrections.", component: legacy(() => import("./sections/CommissionPayrollSection")) },
  { key: "staff-payroll", label: "Staff Payroll", icon: <LuIdCard size={18} />, desc: "Employees, hours, payroll runs and remittances.", component: legacy(() => import("./sections/StaffPayrollSection")) },
  { key: "hst", label: "HST / Tax", icon: <LuPercent size={18} />, component: lazy(() => import("./bodv/Hst")), rebuilt: true },
  { key: "tax-slips", label: "Tax Slips", icon: <LuFileText size={18} />, component: lazy(() => import("./bodv/TaxSlips")), rebuilt: true },
  { key: "reports", label: "Reports", icon: <LuChartBar size={18} />, component: lazy(() => import("./bodv/Reports")), rebuilt: true },
  { key: "month-end", label: "Compliance & Month End", icon: <LuClipboardCheck size={18} />, component: lazy(() => import("./bodv/MonthEnd")), rebuilt: true },
  {
    key: "settings", label: "Settings", icon: <LuSettings size={18} />, desc: "Company, accounting settings and activity log.",
    tabs: [
      { key: "general", label: "Settings", component: legacy(() => import("./sections/SettingsSection")) },
      { key: "audit", label: "Audit & Activity Log", component: legacy(() => import("./sections/AuditLogSection")) },
      { key: "banking-setup", label: "Bank Accounts & Chart of Accounts", component: legacy(() => import("./sections/BankingSection")) },
    ],
  },
  { key: "pdf-splitter", label: "PDF File Splitter", icon: <LuScissors size={18} />, component: lazy(() => import("./bodv/PdfSplitter")), rebuilt: true },
];

// Old section links keep working.
const ALIASES: Record<string, [string, string?]> = {
  trust: ["banking"], "audit-log": ["settings", "audit"], "personnel-documents": ["agent-fees", "documents"],
};

const Loading = () => <p className="muted" style={{ padding: 24 }}>Loading…</p>;

const BrokerageAccounting = () => {
  const { section = "dashboard" } = useParams();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.user);
  const allowed = user?.roleId == 1 || user?.userType === "superAdmin" || user?.userType === "accountant";
  const [alias, aliasTab] = ALIASES[section] || [section];
  const current = SECTIONS.find((s) => s.key === alias) || SECTIONS[0];
  const [tabKey, setTabKey] = useState<string | undefined>(aliasTab);
  const tab = current.tabs ? current.tabs.find((t) => t.key === tabKey) || current.tabs[0] : null;
  const go = (key: string) => {
    const [k, t] = ALIASES[key] || [key];
    setTabKey(t);
    navigate(`/dashboard/brokerage-accounting/${k}`);
  };
  const { error: setupError } = useAcctGetQuery({ path: "/settings" }, { skip: !allowed });
  const setup = setupError as { status?: number; data?: { message?: string } } | undefined;

  if (!allowed) {
    return (
      <div className="dvac">
        <div className="content">
          <div className="pagehead"><div><h1>Brokerage Accounting</h1><p>Accounting access is limited to Super Admin and Accountant users.</p></div></div>
        </div>
      </div>
    );
  }

  const Component = (tab?.component || current.component) as ComponentType<SectionProps>;
  return (
    <div className="dvac">
      <div className="app">
        <aside className="sidebar">
          <nav>
            {SECTIONS.map((s) => (
              <button key={s.key} className={s.key === current.key ? "nav active" : "nav"} onClick={() => go(s.key)}>
                {s.icon}<span>{s.label}</span>
              </button>
            ))}
          </nav>
        </aside>
        <main>
          <div className="content">
            {setup && (
              <div className="notice" style={{ marginTop: 0, marginBottom: 16 }}>
                {setup.status === 503 ? "Accounting is not set up yet. " : "Accounting could not be loaded. "}
                {setup.data?.message || "Check that the API is running and up to date."}
              </div>
            )}
            {current.rebuilt ? (
              <Suspense fallback={<Loading />}><Component onNavigate={go} /></Suspense>
            ) : (
              <>
                <div className="pagehead"><div><h1>{current.label}</h1>{current.desc && <p>{current.desc}</p>}</div></div>
                {current.tabs && (
                  <div className="tabs bodv-tabs">
                    {current.tabs.map((t) => (
                      <button key={t.key} className={t.key === tab?.key ? "primary" : "secondary"} onClick={() => setTabKey(t.key)}>{t.label}</button>
                    ))}
                  </div>
                )}
                <div className="legacy-panel">
                  <Suspense fallback={<Loading />}><Component onNavigate={go} /></Suspense>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default BrokerageAccounting;
