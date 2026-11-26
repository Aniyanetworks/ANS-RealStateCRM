import { useEffect, useState } from "react";
import { useTcGetQuery } from "../../../redux/api/common/dvTimeClockSlice";
import { useTcAction, useTimeClock } from "../TimeClockContext";
import { useClockActions } from "../useClockActions";
import type { Attendance, Branch } from "../tcUtils";
import { LiveTimer } from "./Dashboard";

type Offsite = { uuid: string; reason: string; status: string; usedAt: string | null };

function OffsiteRequestForm({ onDone }: { onDone: () => void }) {
  const { me, toast, closeModal } = useTimeClock();
  const act = useTcAction();
  const [reason, setReason] = useState("");
  const submit = async () => {
    if (!reason.trim()) return toast("Please enter a reason.");
    try {
      await act("/offsite", "POST", { userId: me.userId, reason: reason.trim() });
      closeModal();
      toast("Offsite request sent to management.");
      onDone();
    } catch (e) {
      toast((e as Error).message);
    }
  };
  return (
    <>
      <p className="notice">Explain why you need to clock in outside your assigned branch. Management approval is required.</p>
      <div className="field"><label>Reason</label><textarea rows={4} required value={reason} onChange={(e) => setReason(e.target.value)} /></div>
      <button onClick={submit}>Submit Request</button>
    </>
  );
}

export function ClockSection() {
  const { me, branches, openModal } = useTimeClock();
  const { clockIn, clockOut, clockInOffsite, getClockBranch } = useClockActions();
  const openQ = useTcGetQuery({ path: "/attendance", params: { userId: me.userId, open: 1, limit: 1 } }, { pollingInterval: 30000 });
  const offQ = useTcGetQuery({ path: "/offsite", params: { userId: me.userId, mine: 1 } }, { pollingInterval: 30000 });
  const [branchInfo, setBranchInfo] = useState<{ branch?: Branch; error?: string } | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    getClockBranch(picked).then(setBranchInfo).catch(() => setBranchInfo({ error: "unavailable" }));
  }, [getClockBranch, picked]);

  const active = ((openQ.data || []) as Attendance[])[0];
  const requests = (offQ.data || []) as Offsite[];
  const approved = requests.find((r) => r.status === "approved" && !r.usedAt);
  const branchOk = branchInfo && !branchInfo.error && branchInfo.branch;
  const run = async (fn: () => Promise<boolean>) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };
  const loading = openQ.isLoading;
  const activeBranch = active ? branches.find((b) => b.id === active.branchId) : null;
  const gpsText = (b?: Branch | null) =>
    !b ? "" : b.latitude != null ? `GPS check within ${Number(b.radiusMeters || 100)} m of the branch` : "No GPS set for this branch: clock-in is allowed from any location";
  return (
    <>
      <div className="clock-layout" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.35fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        <div className="panel" style={{ textAlign: "center", padding: "28px 22px" }}>
          <span
            className={`pill ${active ? "green" : ""}`}
            style={{ fontSize: 12, padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: 7 }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: loading ? "#94a3b8" : active ? "#027a48" : "#94a3b8" }} />
            {loading ? "Checking status…" : active ? "Clocked In" : "Clocked Out"}
          </span>
          <div style={{ fontSize: 42, fontWeight: 800, color: "var(--navy)", margin: "16px 0 4px", fontVariantNumeric: "tabular-nums" }}>
            {active ? <LiveTimer start={active.clockIn} /> : "0h 00m"}
          </div>
          <p className="muted" style={{ margin: "0 0 20px" }}>
            {active
              ? `Since ${new Date(active.clockIn).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · ${activeBranch?.name || (active.address?.startsWith("Remote") ? "Remote / offsite" : "Branch not set")}`
              : "Not clocked in"}
          </p>
          {active ? (
            <button className="danger" disabled={busy} onClick={() => run(() => clockOut(active))} style={{ minWidth: 220, padding: "14px 22px", fontSize: 15 }}>
              {busy ? "Clocking out…" : "Clock Out"}
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <button disabled={busy || loading || !branchOk} onClick={() => run(() => clockIn(branchInfo?.branch?.id))} style={{ minWidth: 220, padding: "14px 22px", fontSize: 15 }}>
                {busy ? "Clocking in…" : branchInfo?.branch?.latitude != null ? "Clock In (GPS)" : "Clock In"}
              </button>
              {approved ? (
                <button className="secondary" disabled={busy} onClick={() => run(() => clockInOffsite(approved.uuid))}>Clock In Offsite (Approved)</button>
              ) : (
                <button className="ghost" onClick={() => openModal("Request Offsite Clock-in", <OffsiteRequestForm onDone={() => offQ.refetch()} />)}>Request Offsite Clock-in</button>
              )}
            </div>
          )}
        </div>

        <div className="panel">
          <h3 style={{ margin: "0 0 12px" }}>Clock-in branch</h3>
          {active ? (
            <div className="notice" style={{ margin: 0 }}><b>{activeBranch?.name || "—"}</b><br /><span className="muted">{gpsText(activeBranch) || "Clocked in remotely / offsite"}</span></div>
          ) : (
            <>
              <div className="field">
                <label>Branch</label>
                <select value={picked ?? branchInfo?.branch?.id ?? ""} onChange={(e) => setPicked(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">Select branch</option>
                  {branches.filter((b) => b.active).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              {branchOk ? (
                <div className="notice" style={{ margin: 0 }}><span className="muted">{gpsText(branchInfo.branch)}</span></div>
              ) : (
                <div className="notice" style={{ margin: 0 }}>{branchInfo?.error && branchInfo.error !== "unavailable" ? branchInfo.error.replace(" Please contact management.", " Select a branch above.") : "Select the branch you are working from."}</div>
              )}
            </>
          )}
          <p className="muted" style={{ margin: "14px 0 0", fontSize: 12, lineHeight: 1.5 }}>
            For scheduled shifts, early arrival is recorded but payable time starts at the scheduled start. Clock-outs up to 10 minutes late count scheduled hours only; beyond that, give a reason and extra time is paid after management approval.
          </p>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3 style={{ margin: "0 0 4px" }}>Offsite Requests</h3>
        <p className="muted" style={{ margin: "0 0 12px" }}>Requests to clock in away from your branch. An approved request can be used once.</p>
        {requests.length ? (
          <div className="open-list">
            {requests.map((r) => (
              <div className="open-item" key={r.uuid}>
                <span>{r.reason || "Offsite request"}</span>
                <span className={`pill ${r.status === "approved" ? "green" : "gold"}`}>{r.usedAt ? "used" : r.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ margin: 0 }}>No offsite requests yet.</p>
        )}
      </div>
    </>
  );
}
