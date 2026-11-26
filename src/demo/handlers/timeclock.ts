/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from '../route';

const ok = (message: string, data: any) => ({ status: true, message, data });
const pad = (n: number) => String(n).padStart(2, '0');
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const at = (d: Date, h: number, m = 0) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0).toISOString();

const PERMISSION_GROUPS: [string, string][] = [
  ['Dashboard', 'dashboard.view'], ['Attendance: view', 'attendance.view'], ['Attendance: add/manual hours', 'attendance.edit'],
  ['Attendance: edit clock in/out', 'attendance.edit_clock_times'], ['Attendance: delete', 'attendance.delete'],
  ['Scheduling: view', 'shifts.view'], ['Scheduling: create', 'shifts.create'], ['Scheduling: edit', 'shifts.edit'], ['Scheduling: assign', 'shifts.assign'], ['Scheduling: delete', 'shifts.delete'],
  ['Employees: view', 'employees.view'], ['Employees: manage', 'employees.manage'], ['Impersonate employee (full console)', 'employee.impersonate'], ['Branches: manage', 'branches.manage'], ['Shift approvals', 'approvals.manage'],
  ['Messages: view all', 'messages.view_all'], ['Messages: delete', 'messages.delete'], ['Employee Requests: edit', 'requests.edit'], ['Employee Requests: delete', 'requests.delete'],
  ['Availability: manage', 'availability.manage'], ['Payroll: view', 'payroll.view'], ['Employee compensation: view pay rates and salaries', 'payroll.view_salary'],
  ['Offsite clock-in approvals', 'offsite.approve'], ['Clock in / out access', 'clock.use'], ['Management access', 'management.manage'],
];

const branches = [
  { id: 1, name: 'Toronto', address: '120 King St W, Toronto, ON', latitude: 43.6487, longitude: -79.3817, radiusMeters: 150, active: true, isDefault: true },
  { id: 2, name: 'Mississauga', address: '100 City Centre Dr, Mississauga, ON', latitude: 43.5936, longitude: -79.6413, radiusMeters: 120, active: true, isDefault: false },
  { id: 3, name: 'Oakville', address: '240 Lakeshore Rd E, Oakville, ON', latitude: 43.4475, longitude: -79.6677, radiusMeters: 100, active: true, isDefault: false },
];

const me = {
  userId: 1, fullName: 'Ava Morgan', email: 'admin@ans.demo', phone: '416-555-0100', userType: 'superAdmin', role: 'superadmin', active: true, permissions: {},
  isEmployee: false, employeeCode: 'UID00001', username: null, branchId: 1, branchIds: [1, 2, 3],
  payType: 'yearly', hourlyRate: null, monthlySalary: null, yearlySalary: 120000, createdAt: '2025-01-06T14:00:00.000Z',
  isManager: true, permissionGroups: PERMISSION_GROUPS,
};

const EMP = ['Olivia Hart', 'Marcus Bell', 'Priya Nair', 'Daniel Cruz', 'Sofia Lang', 'Ethan Park', 'Amara Khan', 'Lucas Reid'];
const employees = EMP.map((name, i) => ({
  userId: i + 2, fullName: name, email: `${name.toLowerCase().replace(' ', '.')}@ans.demo`, phone: `416-555-01${pad(i + 10)}`, userType: 'agent', role: 'employee',
  active: true, permissions: {}, isEmployee: true, employeeCode: `UID${String(i + 2).padStart(5, '0')}`, username: name.split(' ')[0].toLowerCase(),
  branchId: (i % 3) + 1, branchIds: [(i % 3) + 1], payType: 'hourly', hourlyRate: 22 + (i % 4) * 2, monthlySalary: null, yearlySalary: null, createdAt: '2025-03-03T14:00:00.000Z',
}));
const members = [me, ...employees].map(({ isManager, permissionGroups, ...m }: any) => m);

const settings = {
  payPeriodType: 'biweekly', anchorDate: '2026-01-05',
  optionalHolidays: [
    { name: 'Civic Holiday', date: '2026-08-03' }, { name: 'Remembrance Day', date: '2026-11-11' },
  ],
  updatedAt: '2026-01-05T15:00:00.000Z',
};

function buildAttendance() {
  const rows: any[] = [];
  const now = new Date();
  let seq = 0;
  for (let back = 14; back >= 0; back--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    employees.forEach((e, i) => {
      seq++;
      if ((back === 9 && i === 3) || (back === 4 && i === 6) || (back === 11 && i === 1)) return;
      const late = (back + i) % 7 === 0;
      const inMin = late ? 25 + (i % 3) * 10 : (i * 3) % 10;
      const outH = 17 + (i % 2);
      const outMin = (i * 7) % 30;
      const clockIn = at(d, 9, inMin);
      const isToday = back === 0;
      if (isToday) {
        if (i > 1) return;
        const t = new Date(now.getTime() - (2 + i) * 3600000);
        rows.push(mk(`att-${seq}`, e, t.toISOString(), null, late, 0));
        return;
      }
      const clockOut = at(d, outH, outMin);
      const hrs = (+new Date(clockOut) - +new Date(clockIn)) / 3600000;
      rows.push(mk(`att-${seq}`, e, clockIn, clockOut, late, Math.round((hrs - 0.5) * 100) / 100));
    });
  }
  function mk(uuid: string, e: any, clockIn: string, clockOut: string | null, late: boolean, payable: number) {
    return {
      uuid, userId: e.userId, shiftUuid: null, branchId: e.branchId, clockIn, clockOut,
      clockInReason: late ? 'Traffic on the 401' : null, clockInLat: 43.65, clockInLng: -79.38, clockInGpsVerified: true, notes: null,
      payableHours: clockOut ? payable : null, lateClockoutReason: null, lateExtraMinutes: null, lateExtraApproved: false,
      address: branches[e.branchId - 1].address, createdAt: clockIn,
    };
  }
  return rows;
}

function buildShifts() {
  const rows: any[] = [];
  const now = new Date();
  let seq = 0;
  for (let off = -14; off <= 14; off++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + off);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    employees.forEach((e) => {
      seq++;
      rows.push({ uuid: `shift-${seq}`, id: seq, branchId: e.branchId, userId: e.userId, shiftDate: dateKey(d), startTime: '09:00', endTime: '17:30', totalHours: 8.5, name: 'Front desk', notes: null, status: 'assigned', createdAt: at(d, 8) });
    });
    if (off >= 0 && off % 3 === 0) {
      seq++;
      rows.push({ uuid: `shift-${seq}`, id: seq, branchId: 1, userId: null, shiftDate: dateKey(d), startTime: '12:00', endTime: '18:00', totalHours: 6, name: 'Open house cover', notes: 'Open shift', status: 'open', createdAt: at(d, 8) });
    }
  }
  return rows;
}

const attendance = buildAttendance();
const shifts = buildShifts();

const requests = [
  { uuid: 'req-1', userId: 4, requestType: 'time_off', subject: 'Day off request', details: { reason: 'Family event' }, requestedDate: dateKey(new Date(Date.now() + 6 * 86400000)), status: 'pending', managementNote: null, reviewedById: null, reviewedAt: null, employeeSeenAt: null, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { uuid: 'req-2', userId: 7, requestType: 'correction', subject: 'Missed clock-out', details: { reason: 'Forgot to clock out' }, requestedDate: dateKey(new Date(Date.now() - 4 * 86400000)), status: 'approved', managementNote: 'Approved', reviewedById: 1, reviewedAt: new Date(Date.now() - 3 * 86400000).toISOString(), employeeSeenAt: null, createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
];

const appointments = [
  { uuid: 'apt-1', title: 'Team meeting', startAt: at(new Date(Date.now() + 86400000), 10), endAt: at(new Date(Date.now() + 86400000), 11), calendarOwnerId: 1, branchId: 1, location: 'Toronto office', notes: null, eventType: 'appointment', createdById: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const num = (v: any) => (v === undefined || v === null || v === '' ? null : Number(v));

export const timeclockRoutes = [
  route('GET', 'dv-time-clock/me', () => ok('Account loaded.', me)),
  route('GET', 'dv-time-clock/members', () => ok('People loaded.', members)),
  route('GET', 'dv-time-clock/branches', () => ok('Branches loaded.', branches)),
  route('GET', 'dv-time-clock/settings', () => ok('Settings loaded.', settings)),
  route('GET', 'dv-time-clock/counts', ({ query }) => {
    if (query.asEmployee === '1') {
      return ok('Counts loaded.', { unreadMessages: 0, newResponses: 1, pendingRequests: 0, pendingEmployeeRequests: 0, missedClockouts: 0 });
    }
    const open = attendance.filter((a) => !a.clockOut).length;
    return ok('Counts loaded.', {
      unreadMessages: 0, newResponses: 0, pendingRequests: requests.filter((r) => r.status === 'pending').length, pendingEmployeeRequests: 1,
      pendingShiftRequests: 0, missedClockouts: 0, attendanceRecords: attendance.length, openShifts: shifts.filter((s) => s.status === 'open').length, clockedIn: open,
    });
  }),
  route('GET', 'dv-time-clock/attendance', ({ query }) => {
    let rows = attendance.slice();
    if (query.userId) rows = rows.filter((r) => r.userId === Number(query.userId));
    if (query.open === '1') rows = rows.filter((r) => !r.clockOut);
    const t = (s?: string) => (s ? +new Date(s) : NaN);
    const from = t(query.from), to = t(query.to), before = t(query.before);
    if (!Number.isNaN(from)) rows = rows.filter((r) => +new Date(r.clockIn) >= from);
    if (!Number.isNaN(to)) rows = rows.filter((r) => +new Date(r.clockIn) <= to);
    if (!Number.isNaN(before)) rows = rows.filter((r) => +new Date(r.clockIn) < before);
    const dir = query.order === 'asc' ? 1 : -1;
    rows.sort((a, b) => dir * (+new Date(a.clockIn) - +new Date(b.clockIn)));
    const lim = num(query.limit);
    if (lim) rows = rows.slice(0, Math.min(5000, lim));
    return ok('Attendance loaded.', rows);
  }),
  route('GET', 'dv-time-clock/shifts', ({ query }) => {
    let rows = shifts.slice();
    if (query.userId) rows = rows.filter((s) => s.userId === Number(query.userId));
    if (query.status) rows = rows.filter((s) => s.status === query.status);
    if (query.from) rows = rows.filter((s) => s.shiftDate >= query.from.slice(0, 10));
    if (query.to) rows = rows.filter((s) => s.shiftDate <= query.to.slice(0, 10));
    return ok('Shifts loaded.', rows);
  }),
  route('GET', 'dv-time-clock/shift-requests', () => ok('Shift requests loaded.', [])),
  route('GET', 'dv-time-clock/requests', ({ query }) => ok('Requests loaded.', query.mine === '1' ? requests.filter((r) => r.userId === Number(query.userId)) : requests)),
  route('GET', 'dv-time-clock/offsite', () => ok('Offsite requests loaded.', [])),
  route('GET', 'dv-time-clock/availability', () => ok('Availability loaded.', [])),
  route('GET', 'dv-time-clock/tasks', () => ok('Shift tasks loaded.', [])),
  route('GET', 'dv-time-clock/task-completions', () => ok('Completions loaded.', [])),
  route('GET', 'dv-time-clock/handover-notes', () => ok('Handover notes loaded.', [])),
  route('GET', 'dv-time-clock/messages', () => ok('Messages loaded.', [])),
  route('GET', 'dv-time-clock/appointments', () => ok('Appointments loaded.', appointments)),
  route('GET', 'dv-time-clock/audit', () => ok('Audit log loaded.', [])),
] as ReturnType<typeof route>[];
