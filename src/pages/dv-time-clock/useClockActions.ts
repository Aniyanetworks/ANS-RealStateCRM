// Clock in / clock out as the dvclock app does it: GPS geofence check against the clock-in branch
// (today's shift branch, else the primary branch, else the Main Branch; a branch without GPS in the
// Clock In/Out settings allows clock-in from anywhere, as on the Clock In/Out page), late clock-in reason after the
// 10-minute grace, payable hours capped to the scheduled shift, and a management approval request for
// extra minutes after a late clock-out. Offsite clock-in uses an approved one-time request.
import { useCallback } from "react";
import { useLazyTcGetQuery } from "../../redux/api/common/dvTimeClockSlice";
import { useTcAction, useTimeClock } from "./TimeClockContext";
import { Attendance, Branch, Shift, distanceMeters, getPosition, todayKey } from "./tcUtils";
import { tcPrompt } from "./tcDialog";

export function useClockActions() {
  const { me, branches, members, toast } = useTimeClock();
  const [fetchTc] = useLazyTcGetQuery();
  const act = useTcAction();

  const get = useCallback(async <T,>(path: string, params?: Record<string, string | number>) => (await fetchTc({ path, params }, false).unwrap()) as T, [fetchTc]);

  const hasOpenAttendance = useCallback(async (userId: number) => {
    const rows = await get<Attendance[]>("/attendance", { userId, open: 1, limit: 1 });
    return (rows || []).length > 0;
  }, [get]);

  /** Branch for today's clock-in: the branch picked on the page, else today's shift branch, else primary branch, else the Main Branch. */
  const getClockBranch = useCallback(async (pickedBranchId?: number | null): Promise<{ branch?: Branch; shift?: Shift | null; error?: string }> => {
    const today = new Date().toLocaleDateString("en-CA");
    const todayShifts = (await get<Shift[]>("/shifts", { userId: me.userId, from: today, to: today, notStatus: "cancelled" })) || [];
    const profile = members.find((m) => m.userId === me.userId);
    const branchId = pickedBranchId || todayShifts.find((s) => s.branchId)?.branchId || profile?.branchId || me.branchId || branches.find((b) => b.isDefault)?.id;
    if (!branchId) return { error: "No branch is assigned to your profile or today’s shift. Please contact management." };
    const branch = branches.find((b) => b.id === branchId);
    if (!branch) return { error: "Your assigned branch could not be found. Please contact management." };
    return { branch, shift: todayShifts.find((s) => s.branchId === branch.id) || null };
  }, [get, me, members, branches]);

  const verifyClockInLocation = useCallback(async (pickedBranchId?: number | null) => {
    const target = await getClockBranch(pickedBranchId);
    if (target.error || !target.branch) throw new Error(target.error);
    if (target.branch.latitude == null || target.branch.longitude == null) {
      // No GPS set for this branch: clock in from anywhere; the location is recorded when available.
      const pos = await getPosition().catch(() => null);
      return { branch: target.branch, shift: target.shift, lat: pos?.coords.latitude ?? null, lon: pos?.coords.longitude ?? null, distance: null, radius: null, gps: false };
    }
    let pos: GeolocationPosition;
    try {
      pos = await getPosition();
    } catch (e) {
      const code = (e as GeolocationPositionError)?.code;
      let msg = "Unable to get your location.";
      if (code === 1) msg = "Location permission is denied. Please enable Location Services for this site and try again.";
      if (code === 2) msg = "Your location could not be determined. Please move to an area with GPS coverage and try again.";
      if (code === 3) msg = "GPS location request timed out. Please try again.";
      throw new Error(msg);
    }
    const lat = pos.coords.latitude, lon = pos.coords.longitude;
    const distance = Math.round(distanceMeters(lat, lon, Number(target.branch.latitude), Number(target.branch.longitude)));
    const radius = Math.max(1, Number(target.branch.radiusMeters || 150));
    if (distance > radius) throw new Error(`You are outside the ${target.branch.name} clock-in area. Distance: ${distance} m. Allowed radius: ${radius} m.`);
    return { branch: target.branch, shift: target.shift, lat, lon, distance, radius, gps: true };
  }, [getClockBranch]);

  const requestLateClockInReason = async (shift: Shift | null | undefined, now: Date) => {
    if (!shift?.shiftDate || !shift?.startTime) return null;
    const [y, m, d] = shift.shiftDate.split("-").map(Number), [hh, mm] = shift.startTime.slice(0, 5).split(":").map(Number);
    const lateMinutes = Math.max(0, Math.floor((+now - +new Date(y, m - 1, d, hh, mm, 0, 0)) / 60000));
    if (lateMinutes <= 10) return null;
    const reason = await tcPrompt(`You are ${lateMinutes} minutes late. Please enter a reason for arriving late.`, { title: "Late clock-in", placeholder: "Reason", multiline: true, required: true, confirmText: "Clock In" });
    if (reason === null) throw new Error("Clock-in cancelled.");
    if (!reason.trim()) throw new Error("A reason is required when you are more than 10 minutes late.");
    return reason.trim();
  };

  /** GPS-verified clock in. Returns true when recorded. */
  const clockIn = useCallback(async (pickedBranchId?: number | null) => {
    try {
      if (await hasOpenAttendance(me.userId)) {
        toast("You already have an active clock-in. Please clock out before starting another shift.");
        return false;
      }
      const g = await verifyClockInLocation(pickedBranchId);
      const reason = await requestLateClockInReason(g.shift, new Date());
      await act("/attendance/clock-in", "POST", { userId: me.userId, shiftUuid: g.shift?.uuid || null, branchId: g.branch.id, clockInReason: reason, lat: g.lat, lng: g.lon, gpsVerified: g.gps });
      toast(g.gps ? `Clock-in verified at ${g.branch.name}. Actual clock-in time recorded.` : `Clocked in (${g.branch.name}). Actual clock-in time recorded.`);
      return true;
    } catch (e) {
      const msg = (e as Error).message;
      if (msg !== "Clock-in cancelled.") toast(msg || "Unable to verify your location.");
      return false;
    }
  }, [act, hasOpenAttendance, me.userId, toast, verifyClockInLocation]);

  /** Clock out: payable time is capped to the scheduled shift; >10 min late needs a reason and approval. */
  const clockOut = useCallback(async (a: Attendance) => {
    const actualOut = new Date(), actualIn = new Date(a.clockIn);
    let shift: Shift | null = null, scheduledEnd: Date | null = null;
    let baseHours = Math.max(0, (+actualOut - +actualIn) / 3600000), lateMinutes = 0, lateReason = "";
    if (a.shiftUuid) {
      const rows = (await get<Shift[]>("/shifts", { uuids: a.shiftUuid })) || [];
      shift = rows[0] || null;
      if (shift) {
        const scheduledStart = new Date(`${shift.shiftDate}T${shift.startTime}`);
        scheduledEnd = new Date(`${shift.shiftDate}T${shift.endTime}`);
        if (scheduledEnd <= scheduledStart) scheduledEnd.setDate(scheduledEnd.getDate() + 1);
        const payableStart = actualIn > scheduledStart ? actualIn : scheduledStart;
        const endDelta = (+actualOut - +scheduledEnd) / 60000;
        if (endDelta > 10) {
          lateMinutes = Math.max(0, Math.floor(endDelta) - 10);
          lateReason = (await tcPrompt("You are more than 10 minutes past your scheduled end time. Please explain why you stayed late.", { title: "Late clock-out", placeholder: "Reason", multiline: true, required: true, confirmText: "Clock Out" })) || "";
          if (!lateReason.trim()) {
            toast("A reason is required to clock out more than 10 minutes late.");
            return false;
          }
        }
        const cappedEnd = lateMinutes ? scheduledEnd : actualOut < scheduledEnd ? actualOut : scheduledEnd;
        baseHours = Math.max(0, (+cappedEnd - +payableStart) / 3600000);
      }
    }
    const lateRequest = lateMinutes > 0 && scheduledEnd
      ? {
          subject: `Late clock-out: ${lateMinutes} extra minutes`,
          requestedDate: shift?.shiftDate || actualOut.toISOString().slice(0, 10),
          details: JSON.stringify({ kind: "Late Clock-out Approval", attendance_id: a.uuid, extra_minutes: lateMinutes, reason: lateReason.trim(), base_payable_hours: Number(baseHours.toFixed(4)), actual_clock_out: actualOut.toISOString(), scheduled_end: scheduledEnd.toISOString() }),
        }
      : null;
    try {
      await act(`/attendance/${a.uuid}/clock-out`, "POST", { clockOut: actualOut.toISOString(), payableHours: Number(baseHours.toFixed(4)), lateClockoutReason: lateReason.trim() || null, lateExtraMinutes: lateMinutes, lateRequest });
    } catch (e) {
      toast((e as Error).message);
      return false;
    }
    toast(lateMinutes > 0 ? `Clock-out recorded. Extra ${lateMinutes} minutes are pending management approval.` : "Clock-out recorded. Scheduled hours counted; grace time is not added.");
    return true;
  }, [act, get, toast]);

  /** Clock in with an approved offsite request (location recorded when available, not verified). */
  const clockInOffsite = useCallback(async (requestUuid: string) => {
    try {
      if (await hasOpenAttendance(me.userId)) {
        toast("You already have an active clock-in. Please clock out before starting another shift.");
        return false;
      }
    } catch (e) {
      toast((e as Error).message || "Could not verify your current clock-in status.");
      return false;
    }
    let coords: { lat: number | null; lng: number | null } = { lat: null, lng: null };
    try {
      const pos = await getPosition();
      coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      /* location is optional for an approved offsite clock-in */
    }
    try {
      await act("/attendance/clock-in", "POST", { userId: me.userId, offsiteRequestUuid: requestUuid, lat: coords.lat, lng: coords.lng });
      toast("Offsite clock-in recorded.");
      return true;
    } catch (e) {
      toast((e as Error).message);
      return false;
    }
  }, [act, hasOpenAttendance, me.userId, toast]);

  return { clockIn, clockOut, clockInOffsite, getClockBranch, hasOpenAttendance, today: todayKey };
}
