
export type Holiday = { name: string; start_date?: string; end_date?: string; date?: string };
export type Settings = { payPeriodType: string; anchorDate: string; optionalHolidays: Holiday[] };
export type Member = {
  userId: number; fullName: string; email: string; phone: string | null; role: string; active: boolean; permissions: Record<string, boolean>;
  isEmployee: boolean; employeeCode: string | null; username: string | null; branchId: number | null; branchIds: number[];
  payType?: string; hourlyRate?: number | null; monthlySalary?: number | null; yearlySalary?: number | null;
};
export type Branch = { id: number; name: string; address: string | null; latitude: number | null; longitude: number | null; radiusMeters: number; active: boolean; isDefault?: boolean };
export type Shift = { uuid: string; branchId: number | null; userId: number | null; shiftDate: string; startTime: string; endTime: string; totalHours: number; name: string | null; notes: string | null; status: string };
export type Attendance = {
  uuid: string; userId: number; shiftUuid: string | null; branchId: number | null; clockIn: string; clockOut: string | null; clockInReason: string | null;
  clockInLat: number | null; clockInLng: number | null; clockInGpsVerified: boolean; notes: string | null; payableHours: number | null;
  lateClockoutReason: string | null; lateExtraMinutes: number | null; lateExtraApproved: boolean; createdAt: string; address?: string | null;
};
export type TcRequest = { uuid: string; userId: number; requestType: string; subject: string; details: unknown; requestedDate: string | null; status: string; managementNote: string | null; reviewedAt: string | null; employeeSeenAt: string | null; createdAt: string };

export const MANAGEMENT_ROLES = ["superadmin", "admin", "management"];

export const money = (n: unknown) => Number(n || 0).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
export const fmtDate = (d?: string | null) => (d ? new Date(d + "T12:00:00").toLocaleDateString("en-CA", { weekday: "short", year: "numeric", month: "short", day: "numeric" }) : "");
export const todayKey = () => new Date().toISOString().slice(0, 10);
export const thisMonth = () => new Date().toISOString().slice(0, 7);

export function shiftHours(a?: string | null, b?: string | null) {
  if (!a || !b) return 0;
  const [ah, am] = a.split(":").map(Number), [bh, bm] = b.split(":").map(Number);
  const x = ah * 60 + am;
  let y = bh * 60 + bm;
  if (y < x) y += 1440;
  return (y - x) / 60;
}
export const monthShift = (x: string) => new Date(x + "-01T12:00:00");
export const monthName = (x: string) => monthShift(x).toLocaleDateString("en-CA", { month: "long", year: "numeric" });
export const addMonths = (x: string, n: number) => {
  const d = monthShift(x);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 7);
};
export const lastDayOfMonth = (x: string) => {
  const d = monthShift(x);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
};
export function fmtDuration(ms: number) {
  const mins = Math.max(0, Math.floor(ms / 60000));
  return Math.floor(mins / 60) + "h " + String(mins % 60).padStart(2, "0") + "m";
}
export function rowHours(r: Pick<Attendance, "clockIn" | "clockOut">, now = new Date()) {
  const a = new Date(r.clockIn), b = r.clockOut ? new Date(r.clockOut) : now;
  return Number.isFinite(+a) && Number.isFinite(+b) ? Math.max(0, (+b - +a) / 3600000) : 0;
}
export function attendanceReportHours(a: Attendance) {
  if (!a.clockIn || !a.clockOut) return 0;
  const actual = Math.max(0, (+new Date(a.clockOut) - +new Date(a.clockIn)) / 3600000);
  return a.payableHours != null ? Math.max(0, Number(a.payableHours) || 0) : actual;
}
export function localDateKey(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
export const localInputDateTime = (d: string | Date) => {
  const x = new Date(d);
  return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export const fmtTime = (v?: string | null) => (v ? new Date(v).toLocaleString("en-CA") : "—");

export function periodBounds(dateStr: string | null, cfg: Pick<Settings, "payPeriodType" | "anchorDate">) {
  const d = new Date((dateStr || todayKey()) + "T12:00:00"), type = cfg.payPeriodType || "biweekly";
  let start: Date, end: Date;
  if (type === "weekly" || type === "biweekly") {
    const anchor = new Date((cfg.anchorDate || "2026-01-05") + "T12:00:00"), span = type === "weekly" ? 7 : 14;
    const n = Math.floor(Math.floor((+d - +anchor) / 86400000) / span);
    start = new Date(anchor);
    start.setDate(start.getDate() + n * span);
    end = new Date(start);
    end.setDate(end.getDate() + span - 1);
  } else if (type === "semi-monthly") {
    start = new Date(d.getFullYear(), d.getMonth(), d.getDate() <= 15 ? 1 : 16, 12);
    end = new Date(d.getFullYear(), d.getMonth(), d.getDate() <= 15 ? 15 : new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(), 12);
  } else {
    start = new Date(d.getFullYear(), d.getMonth(), 1, 12);
    end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12);
  }
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function dateForPeriod(period: string, anchor?: string) {
  const d = new Date((anchor || todayKey()) + "T12:00:00");
  let start = new Date(d), end = new Date(d);
  if (period === "Weekly") {
    start.setDate(d.getDate() - d.getDay() + 1);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
  } else if (period === "Bi-Weekly") {
    start.setDate(d.getDate() - Math.floor((d.getDate() - 1) / 14) * 14);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    end = new Date(start);
    end.setDate(start.getDate() + 13);
  } else if (period === "Semi-Monthly") {
    if (d.getDate() <= 15) { start.setDate(1); end.setDate(15); } else { start.setDate(16); end = new Date(d.getFullYear(), d.getMonth() + 1, 0); }
  } else if (period === "Monthly") {
    start.setDate(1);
    end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  } else if (period === "Yearly") {
    start = new Date(d.getFullYear(), 0, 1);
    end = new Date(d.getFullYear(), 11, 31);
  }
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

export function salaryGrossForPeriod(e: Pick<Member, "payType" | "hourlyRate" | "monthlySalary" | "yearlySalary">, from: string, to: string, hours: number) {
  if (e.payType === "hourly") return hours * Number(e.hourlyRate || 0);
  if (!from || !to || to < from) return 0;
  if (e.payType === "yearly") {
    const a = new Date(from + "T12:00:00"), b = new Date(to + "T12:00:00"), days = (+b - +a) / 86400000 + 1, year = a.getFullYear();
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return (Number(e.yearlySalary || 0) * days) / (leap ? 366 : 365);
  }
  if (e.payType === "monthly") {
    const cur = new Date(from + "T12:00:00"), last = new Date(to + "T12:00:00");
    let gross = 0;
    while (cur <= last) {
      const daysInMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
      const days = Math.min(daysInMonth - cur.getDate() + 1, Math.floor((+last - +new Date(cur.getFullYear(), cur.getMonth(), 1, 12)) / 86400000) + 1);
      gross += (Number(e.monthlySalary || 0) * days) / daysInMonth;
      cur.setDate(cur.getDate() + days);
    }
    return gross;
  }
  return 0;
}

function easterSunday(y: number) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const hh = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - hh - k) % 7, m = Math.floor((a + 11 * hh + 22 * l) / 451);
  const mo = Math.floor((hh + l - 7 * m + 114) / 31);
  return new Date(y, mo - 1, ((hh + l - 7 * m + 114) % 31) + 1, 12);
}
const nthWeekday = (y: number, m: number, w: number, n: number) => {
  const d = new Date(y, m, 1, 12);
  return new Date(y, m, 1 + ((w - d.getDay() + 7) % 7) + (n - 1) * 7, 12);
};
const keyOf = (d: Date) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
export function builtinHolidayName(key: string) {
  const y = +key.slice(0, 4), e = easterSunday(y), items: [Date, string][] = [];
  const add = (d: Date, n: string) => items.push([d, n]);
  add(new Date(y, 0, 1, 12), "New Year’s Day");
  add(nthWeekday(y, 1, 1, 3), "Family Day");
  e.setDate(e.getDate() - 2);
  add(e, "Good Friday");
  add(new Date(y, 4, 24 - ((new Date(y, 4, 24, 12).getDay() + 6) % 7), 12), "Victoria Day");
  add(nthWeekday(y, 7, 1, 1), "Civic Holiday");
  add(new Date(y, 6, 1, 12), "Canada Day");
  add(nthWeekday(y, 8, 1, 1), "Labour Day");
  add(nthWeekday(y, 9, 1, 2), "Thanksgiving");
  add(new Date(y, 11, 25, 12), "Christmas Day");
  add(new Date(y, 11, 26, 12), "Boxing Day");
  for (const [d, n] of items) {
    if (keyOf(d) === key) return n;
    const wd = d.getDay();
    if (wd === 0 || wd === 6) {
      const o = new Date(d);
      o.setDate(o.getDate() + (wd === 6 ? 2 : 1));
      if (keyOf(o) === key) return n + " (observed)";
    }
  }
  return null;
}
export function holidayName(key: string, optional: Holiday[] = []) {
  const found = optional.find((h) => {
    const start = h.start_date || h.date, end = h.end_date || h.date || start;
    return !!start && key >= start && key <= (end as string);
  });
  return found?.name || builtinHolidayName(key);
}

export const shiftMinutes = (t?: string | null) => {
  const a = String(t || "00:00").split(":").map(Number);
  return (a[0] || 0) * 60 + (a[1] || 0);
};
type ShiftLike = { uuid?: string; userId: number | null; shiftDate: string; startTime: string; endTime: string; totalHours?: number };
export function shiftConflictWarnings(proposed: ShiftLike[], existing: ShiftLike[], excludeUuid: string | null = null) {
  const candidates = proposed.filter((x) => x.userId);
  const warnings: string[] = [];
  const span = (s: ShiftLike) => {
    const a = shiftMinutes(s.startTime);
    const b = shiftMinutes(s.endTime);
    return [a, b + (b <= a ? 1440 : 0)];
  };
  candidates.forEach((x, i) => {
    const [a0, a1] = span(x);
    const same = existing.filter((y) => y.uuid !== excludeUuid && y.userId === x.userId && y.shiftDate === x.shiftDate);
    for (const y of same) {
      const [b0, b1] = span(y);
      if (a0 < b1 && b0 < a1) warnings.push(`Overlapping shift on ${x.shiftDate}: ${x.startTime}–${x.endTime} overlaps ${y.startTime}–${y.endTime}.`);
      if (a0 === b0 && a1 === b1) warnings.push(`Duplicate shift on ${x.shiftDate} (${x.startTime}–${x.endTime}).`);
    }
    for (let j = 0; j < i; j++) {
      const z = candidates[j];
      if (z.userId !== x.userId || z.shiftDate !== x.shiftDate) continue;
      const [z0, z1] = span(z);
      if (a0 < z1 && z0 < a1) warnings.push(`The new shifts overlap on ${x.shiftDate}.`);
      if (a0 === z0 && a1 === z1) warnings.push(`The new shifts contain a duplicate time block on ${x.shiftDate}.`);
    }
    const batch = candidates.filter((z) => z.userId === x.userId && z.shiftDate === x.shiftDate).reduce((n, z) => n + Number(z.totalHours || 0), 0);
    const hours = same.reduce((n, y) => n + Number(y.totalHours || 0), 0) + batch;
    if (hours > 12) warnings.push(`This creates ${hours.toFixed(2)} scheduled hours for one employee on ${x.shiftDate} (over 12 hours).`);
  });
  return [...new Set(warnings)];
}
export function overlaps(candidate: ShiftLike, others: ShiftLike[], excludeUuid?: string) {
  const mins = shiftMinutes;
  let cs = mins(candidate.startTime), ce = mins(candidate.endTime);
  if (ce <= cs) ce += 1440;
  return others.some((x) => {
    if (x.uuid === excludeUuid) return false;
    let xs = mins(x.startTime), xe = mins(x.endTime);
    if (xe <= xs) xe += 1440;
    return cs < xe && xs < ce;
  });
}

export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000, toRad = (x: number) => (x * Math.PI) / 180, dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
export function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("This device/browser does not support GPS location."));
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  });
}

export function requestPayload(details: unknown): Record<string, unknown> {
  if (details && typeof details === "object") return details as Record<string, unknown>;
  try {
    const v = JSON.parse(String(details || "{}"));
    return v && typeof v === "object" ? v : { text: String(details) };
  } catch {
    return details ? { text: String(details) } : {};
  }
}

export function downloadText(filename: string, text: string, type = "text/csv") {
  const blob = new Blob([text], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
