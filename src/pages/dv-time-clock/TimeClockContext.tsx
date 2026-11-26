import { createContext, ReactNode, useCallback, useContext } from "react";
import { useTcMutateMutation } from "../../redux/api/common/dvTimeClockSlice";
import type { Branch, Member, Settings } from "./tcUtils";

export type Me = Member & { isManager: boolean; permissionGroups?: [string, string][] };

export type TimeClockCtx = {
  realMe: Me;
  me: Me;
  acting: "employee" | "management" | null;
  isEmployeeView: boolean;
  section: string;
  go: (s: string) => void;
  toast: (msg: string) => void;
  openModal: (title: string, body: ReactNode, extraClass?: string) => void;
  closeModal: () => void;
  startImpersonation: (target: Me, asManagement: boolean) => void;
  endImpersonation: () => void;
  members: Member[];
  branches: Branch[];
  settings: Settings;
};

export const TimeClockContext = createContext<TimeClockCtx | null>(null);

export function useTimeClock() {
  const ctx = useContext(TimeClockContext);
  if (!ctx) throw new Error("useTimeClock must be used inside the ANS Time Clock page");
  return ctx;
}

const OPT_IN = ["messages.delete", "messages.view_all", "employee.impersonate", "payroll.view_salary", "requests.edit", "requests.delete"];

export function canFor(me: Pick<Me, "role" | "permissions"> | null, permission: string) {
  if (!me) return false;
  if (me.role === "superadmin") return true;
  const perms = me.permissions || {};
  if (Object.prototype.hasOwnProperty.call(perms, permission)) return perms[permission] === true;
  if (OPT_IN.includes(permission)) return false;
  return me.role === "admin" || me.role === "management";
}

export function useCan() {
  const { me } = useTimeClock();
  return useCallback((p: string) => canFor(me, p), [me]);
}

export function useTcAction() {
  const [mutate] = useTcMutateMutation();
  return useCallback(
    async <T = unknown,>(path: string, method: "POST" | "PATCH" | "PUT" | "DELETE" = "POST", body?: unknown): Promise<T> => {
      try {
        const res = await mutate({ path, method, body }).unwrap();
        return (res as { data: T })?.data;
      } catch (e) {
        const err = e as { data?: { message?: string }; message?: string };
        throw new Error(err?.data?.message || err?.message || "Request failed.");
      }
    },
    [mutate]
  );
}

export const nameOf = (members: Member[], id?: number | null) => members.find((m) => m.userId === id)?.fullName || (id ? `User #${id}` : "—");
export const branchName = (branches: Branch[], id?: number | null) => branches.find((b) => b.id === id)?.name || "Not assigned";
