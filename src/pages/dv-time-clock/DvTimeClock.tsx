// ANS Time Clock — React rebuild of the dvclock app inside ANS RealStateCRM (separate from Clock In/Out).
// Layout and styling follow the original: hero, section navigation, panels; management and employee consoles.
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTcGetQuery } from "../../redux/api/common/dvTimeClockSlice";
import { Me, TimeClockContext, TimeClockCtx, canFor, useTcAction } from "./TimeClockContext";
import type { Branch, Member, Settings } from "./tcUtils";
import { createPortal } from "react-dom";
import "./dvTimeClock.css";
import { TcDialogHost } from "./tcDialog";
import {
  ManagerDashboard, EmployeeDashboard, ClockSection, AttendanceSection, SchedulingSection, EmployeesSection, BranchesSection,
  ApprovalsSection, MessagesSection, AvailabilitySection, PayrollSection, AuditSection, AppointmentsSection, SettingsSection,
  AccountSection, AccessSection, MySchedule, MyAttendanceReport, MyRequests, OpenShifts, ManagementShiftTasks, EmployeeShiftTasks, ProfileSection,
} from "./sections";

const MN: [string, string][] = [
  ["dashboard", "Dashboard"], ["clock", "Clock In / Out"], ["attendance", "Attendance & Reports"], ["scheduling", "Scheduling"], ["employees", "Employees"],
  ["branches", "Branches & GPS"], ["requests", "Approvals"], ["messages", "Messages"], ["availability", "Availability Requests"], ["payroll", "Payroll"],
  ["audit", "Audit Log"], ["appointments", "Appointments Calendar"], ["settings", "General Settings"], ["account", "Calendar Settings"],
];
const EN: [string, string][] = [
  ["dashboard", "Dashboard"], ["clock", "Clock In / Out"], ["schedule", "My Schedule"], ["attendanceReport", "My Attendance Report"], ["requests", "My Requests"],
  ["messages", "Messages"], ["availability", "Availability"], ["appointments", "Appointments Calendar"], ["profile", "My Profile"], ["account", "Calendar Settings"],
];
// Sections a management account needs a permission for (as in the original).
const REQUIRED: Record<string, string> = {
  clock: "clock.use", attendance: "attendance.view", scheduling: "shifts.view", employees: "employees.view", branches: "branches.manage",
  requests: "approvals.manage", availability: "availability.manage", payroll: "payroll.view", access: "management.manage",
};

type Counts = { unreadMessages: number; newResponses: number; pendingRequests: number };

export default function DvTimeClock() {
  const meQ = useTcGetQuery({ path: "/me" });
  const membersQ = useTcGetQuery({ path: "/members" }, { skip: !meQ.data, pollingInterval: 30000 });
  const branchesQ = useTcGetQuery({ path: "/branches" }, { skip: !meQ.data });
  const settingsQ = useTcGetQuery({ path: "/settings" }, { skip: !meQ.data });
  const act = useTcAction();

  const [acting, setActing] = useState<{ me: Me; mode: "employee" | "management" } | null>(null);
  const realMe = meQ.data as Me | undefined;
  const me = acting?.me || realMe;
  const isEmployeeView = Boolean(me && !["superadmin", "admin", "management"].includes(me.role));

  const sectionKey = `dv-timeclock-section-${me?.userId || "user"}`;
  const [section, setSection] = useState<string>("dashboard");
  useEffect(() => {
    if (!me) return;
    const allowed = (isEmployeeView ? EN : MN).map((x) => x[0]).concat(["openshifts", "tasks", "access"]);
    let saved = "dashboard";
    try { saved = sessionStorage.getItem(sectionKey) || "dashboard"; } catch { /* storage unavailable */ }
    setSection(allowed.includes(saved) ? saved : "dashboard");
  }, [me?.userId, isEmployeeView]); // eslint-disable-line react-hooks/exhaustive-deps

  const countsQ = useTcGetQuery(
    { path: "/counts", params: { userId: me?.userId, asEmployee: isEmployeeView ? 1 : undefined } },
    { skip: !me, pollingInterval: 30000 }
  );
  const counts = (countsQ.data || { unreadMessages: 0, newResponses: 0, pendingRequests: 0 }) as Counts;

  // toast + modal (same look as the original)
  const [toastText, setToastText] = useState<string | null>(null);
  const toastTimer = useRef<number>();
  const toast = useCallback((msg: string) => {
    setToastText(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastText(null), 2800);
  }, []);
  const [modal, setModal] = useState<{ title: string; body: ReactNode; extraClass?: string } | null>(null);
  const openModal = useCallback((title: string, body: ReactNode, extraClass?: string) => setModal({ title, body, extraClass }), []);
  const closeModal = useCallback(() => setModal(null), []);

  const go = useCallback((x: string) => {
    if (me && !isEmployeeView && REQUIRED[x] && !canFor(me, REQUIRED[x])) {
      toast(x === "clock" ? "Your management account does not have clock-in access." : "Your management account does not have permission for this section.");
      x = "dashboard";
    }
    setSection(x);
    try { sessionStorage.setItem(sectionKey, x); } catch { /* storage unavailable */ }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [me, isEmployeeView, sectionKey, toast]);

  const startImpersonation = useCallback(async (target: Me, asManagement: boolean) => {
    try {
      await act("/impersonation", "POST", { targetUserId: target.userId, action: "start" });
    } catch (e) {
      return toast(`Audit setup/permission required: ${(e as Error).message}`);
    }
    setActing(asManagement ? { me: target, mode: "management" } : { me: { ...target, role: "employee", permissions: {}, isManager: false }, mode: "employee" });
    setSection("dashboard");
    toast(asManagement ? `Management console opened for ${target.fullName || "this account"}.` : "Employee console opened. Actions are subject to authorization.");
  }, [act, toast]);

  const endImpersonation = useCallback(async () => {
    if (!acting) return;
    try { await act("/impersonation", "POST", { targetUserId: acting.me.userId, action: "end" }); } catch (e) { toast(`Could not write end audit event: ${(e as Error).message}`); }
    setActing(null);
    setSection("dashboard");
    toast("Returned to management console.");
  }, [acting, act, toast]);

  const ctx: TimeClockCtx | null = useMemo(() => {
    if (!realMe || !me) return null;
    return {
      realMe, me, acting: acting?.mode || null, isEmployeeView, section, go, toast, openModal, closeModal, startImpersonation, endImpersonation,
      members: (membersQ.data || []) as Member[],
      branches: (branchesQ.data || []) as Branch[],
      settings: (settingsQ.data || { payPeriodType: "biweekly", anchorDate: "2026-01-05", optionalHolidays: [] }) as Settings,
    };
  }, [realMe, me, acting, isEmployeeView, section, go, toast, openModal, closeModal, startImpersonation, endImpersonation, membersQ.data, branchesQ.data, settingsQ.data]);

  if (meQ.isLoading) return <div className="dvtc"><main className="wrap"><div className="panel">Loading ANS Time Clock…</div></main></div>;
  if (meQ.error || !ctx || !me) {
    const err = meQ.error as { data?: { message?: string; setupRequired?: boolean } } | undefined;
    return (
      <div className="dvtc">
        <main className="wrap">
          <div className="panel">
            <h2>ANS Time Clock</h2>
            <p className="notice">{err?.data?.message || "ANS Time Clock is unavailable right now."}</p>
          </div>
        </main>
      </div>
    );
  }

  // Navigation (the original's final buildNav): employees get Open Shifts + Shift Tasks (Availability lives in My Requests).
  let items = (isEmployeeView ? EN : MN).slice();
  if (isEmployeeView) {
    items = items.filter((x) => x[0] !== "availability");
    items.splice(3, 0, ["openshifts", "Open Shifts"]);
  }
  items.push(["tasks", "Shift Tasks"]);
  if (!isEmployeeView && canFor(me, "management.manage")) items.push(["access", "Management Access"]);
  const badge = (key: string) => (key === "messages" ? counts.unreadMessages : key === "requests" ? (isEmployeeView ? counts.newResponses : counts.pendingRequests) : 0);

  const sectionView = () => {
    if (isEmployeeView) {
      switch (section) {
        case "clock": return <ClockSection />;
        case "schedule": return <MySchedule />;
        case "openshifts": return <OpenShifts />;
        case "attendanceReport": return <MyAttendanceReport />;
        case "requests": return <MyRequests />;
        case "messages": return <MessagesSection management={false} />;
        case "appointments": return <AppointmentsSection />;
        case "profile": return <ProfileSection />;
        case "account": return <AccountSection />;
        case "tasks": return <EmployeeShiftTasks />;
        default: return <EmployeeDashboard />;
      }
    }
    switch (section) {
      case "clock": return <ClockSection />;
      case "attendance": return <AttendanceSection />;
      case "scheduling": return <SchedulingSection />;
      case "employees": return <EmployeesSection />;
      case "branches": return <BranchesSection />;
      case "requests": return <ApprovalsSection />;
      case "messages": return <MessagesSection management />;
      case "availability": return <AvailabilitySection />;
      case "payroll": return <PayrollSection />;
      case "audit": return <AuditSection />;
      case "appointments": return <AppointmentsSection />;
      case "settings": return <SettingsSection />;
      case "account": return <AccountSection />;
      case "access": return <AccessSection />;
      case "tasks": return <ManagementShiftTasks />;
      default: return <ManagerDashboard />;
    }
  };

  return (
    <TimeClockContext.Provider value={ctx}>
      <div className="dvtc">
        {acting?.mode === "employee" && (
          <div className="notice" style={{ margin: 0, borderRadius: 0, textAlign: "center" }}>
            <b>Viewing employee:</b> {me.fullName} · ID {me.employeeCode || "—"} · Manager remains authenticated.{" "}
            <button className="ghost" onClick={endImpersonation}>Return to management</button>
          </div>
        )}
        {acting?.mode === "management" && (
          <div className="notice" style={{ margin: 0, borderRadius: 0, textAlign: "center" }}>
            <b>Viewing management account:</b> {me.fullName} · {me.role} · Manager remains authenticated.{" "}
            <button className="ghost" onClick={endImpersonation}>Return to my management account</button>
          </div>
        )}
        <main className="wrap">
          <div className="hero">
            <h1>{isEmployeeView ? "Employee Console" : "Management Console"}</h1>
            <p>Welcome, {me.fullName}</p>
          </div>
          <div id="nav" className="nav">
            {items.map(([key, label]) => (
              <button key={key} className={section === key ? "active" : ""} onClick={() => go(key)}>
                {label}
                {badge(key) > 0 && <span className="nav-badge">{badge(key)}</span>}
              </button>
            ))}
          </div>
          <div id="content">{sectionView()}</div>
        </main>
        {/* Rendered at <body> level (own .dvtc scope) so the app sidebar/header can never cover it */}
        {modal && createPortal(
          <div className="dvtc" style={{ height: 0, background: "transparent" }}>
          <div className="modal" style={{ zIndex: 3000 }} onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
            <div className={`modalbox ${modal.extraClass || ""}`}>
              <div className="modalhead">
                <h2>{modal.title}</h2>
                <button className="ghost" aria-label="Close details" onClick={closeModal}>✕</button>
              </div>
              {modal.body}
            </div>
          </div>
          </div>,
          document.body,
        )}
        <TcDialogHost />
        {toastText && <div className="toast">{toastText}</div>}
      </div>
    </TimeClockContext.Provider>
  );
}
