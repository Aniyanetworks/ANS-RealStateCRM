/* eslint-disable @typescript-eslint/no-explicit-any */
// Stateful in-memory collections so add / edit / delete show up in the list pages.
// Collections are lazily initialised from the existing static demo handlers (called once),
// so the lists keep showing the same records and then reflect changes.
import { route } from '../route';
import * as seed from '../seed';
import { coreRoutes } from './core';
import { miscRoutes } from './misc';
import { financeRoutes } from './finance';

// ---------------------------------------------------------------- helpers
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const lazy = <T,>(f: () => T) => {
  let v: T | undefined;
  let done = false;
  return () => {
    if (!done) { v = f(); done = true; }
    return v as T;
  };
};
const now = () => new Date().toISOString();
let seq = 9000;
const nextId = () => ++seq;
const mkUuid = (p: string) => `${p}-${Date.now().toString(36)}-${nextId()}`;
const num = (v: any) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
const pad = (n: number, w = 4) => String(n).padStart(w, '0');
const noId = (v: any) => v == null || v === '' || v === 'undefined' || v === 'null';
const matches = (r: any, v: any) => !noId(v) && (String(r.uuid) === String(v) || String(r.id) === String(v));
const find = (arr: any[], v: any) => arr.find((r) => matches(r, v));
const clean = (b: any) => {
  const o: any = {};
  for (const [k, v] of Object.entries(b || {})) {
    o[k] = typeof File !== 'undefined' && v instanceof File ? v.name : v;
  }
  return o;
};
const parseMaybe = (v: any) => {
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return v; }
};
const asList = (v: any): any[] => {
  const p = parseMaybe(v);
  if (Array.isArray(p)) return p;
  if (p == null || p === '') return [];
  return String(p).split(',').map((s) => s.trim()).filter(Boolean);
};
const idsFrom = (body: any, query: any = {}): string[] => {
  const b = parseMaybe(body);
  let out: any[] = [];
  if (Array.isArray(b)) out = b;
  else if (b) out = b.uuids || b.ids || b.eventIds || b.id || [];
  if (!Array.isArray(out)) out = [out];
  if (query.uuid) out.push(query.uuid);
  return out.map((x) => (x && typeof x === 'object' ? x.uuid ?? x.id : x)).filter((x) => !noId(x)).map(String);
};
const removeMany = (arr: any[], ids: string[]) => {
  let n = 0;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (ids.some((id) => matches(arr[i], id))) { arr.splice(i, 1); n++; }
  }
  return n;
};
const fromRoutes = (routes: any[], path: string, pick: (d: any) => any, query: Record<string, string> = {}): any[] => {
  try {
    const r = routes.find((x) => x.method === 'GET' && x.pattern.test(path));
    if (!r) return [];
    const res = r.handler({ params: {}, query: { limit: '100000', ...query }, body: {}, path });
    const v = pick(res);
    return Array.isArray(v) ? clone(v) : [];
  } catch {
    return [];
  }
};
const me = () => {
  try {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    if (u && u.id) return u;
  } catch { /* ignore */ }
  return { id: 1, firstName: 'Ava', lastName: 'Morgan', name: 'Ava Morgan', email: 'superadmin@ans.demo', userType: 'superAdmin' };
};
const meName = () => { const u = me(); return u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim(); };
const ok = (message: string, data?: any) => (data === undefined ? { status: true, message } : { status: true, message, data });
const nf = (what: string) => ({ status: false, message: `${what} not found` });

// ---------------------------------------------------------------- shared stores
const rolesS = lazy(() => fromRoutes(coreRoutes, 'superadmin/role-management/get', (d) => d.data.roles));
const branchesS = lazy(() => fromRoutes(coreRoutes, 'superadmin/branch-management/get-branch-list', (d) => d.data.branchData));
const usersS = lazy(() => fromRoutes(coreRoutes, 'superadmin/user-management/get-user-list', (d) => d.data.userData));
const clientsS = lazy(() => {
  const list = fromRoutes(coreRoutes, 'superadmin/user-management/get-client-list', (d) => d.data.userData);
  list.forEach((c) => { if (!c.clientType) c.clientType = c.clientAccount?.[0]?.clientType || 'buyer'; });
  return list;
});
const brokeragesS = lazy(() => {
  const list = fromRoutes(coreRoutes, 'superadmin/brokerage/list', (d) => d.data.brokerageData);
  if (!list.some((b: any) => String(b.id) === '24')) {
    list.push({
      id: 24, uuid: 'brk-uuid-24', brokerageName: 'ANS RealStateCRM Realty', address: '100 King St W', streetAddress: '100 King St W',
      streetAddressLine2: '', postalCode: 'M5X 1A9', phone: '416-555-0224', email: 'info@ans.demo', status: 'active',
      countryId: 1, stateId: 1, cityId: 1,
      country: { id: 1, name: 'Canada' }, state: { id: 1, name: 'Ontario' }, city: { id: 1, name: 'Toronto' },
      agentData: (seed.agents as any[]).filter((x: any) => x.brokerageId === 24).map((x: any) => ({
        id: x.id, uuid: 'agent-uuid-' + x.id, firstName: x.firstName, lastName: x.lastName, email: x.email,
      })),
      buyerAgentDetails: [], sellerAgentDetails: [], createdAt: new Date().toISOString(),
    });
  }
  // link demo trade sheets to brokerages so the (T:n) counts and the details table are populated
  list.forEach((b: any, bi: number) => {
    b.buyerAgentDetails = [];
    b.sellerAgentDetails = [];
    (seed.tradeSheets as any[]).forEach((t: any, i: number) => {
      const mine = String(b.id) === '24' || i % 8 === (Number(b.id) - 1) % 8;
      if (!mine) return;
      const [first, ...rest] = String(t.name || 'Agent').split(' ');
      const item: any = {
        id: 1000 + bi * 100 + i,
        tradeSheet: { id: t.id, uuid: t.uuid, tradeSheetTypeId: t.tradeSheetTypeId, status: t.status, tradeStatus: t.tradeStatus, representation: t.representation, representationType: t.representationType, properties: t.properties, createdAt: t.createdAt },
      };
      if (t.representation === 'buyer') { item.buyerFirstName = first; item.buyerLastName = rest.join(' ') || '-'; b.buyerAgentDetails.push(item); }
      else { item.sellerFirstName = first; item.sellerLastName = rest.join(' ') || '-'; b.sellerAgentDetails.push(item); }
    });
  });
  return list;
});
const firmsS = lazy(() => fromRoutes(coreRoutes, 'superadmin/lawyer-firm/list', (d) => d.data.lawyerFirm));
const receiptsS = lazy(() => fromRoutes(coreRoutes, 'superadmin/receipt-manage/list', (d) => d.data.receiptData));
const pickupsS = lazy(() => fromRoutes(coreRoutes, 'superadmin/pickup-receipt-manage/list', (d) => d.data.receiptData));
const plansS = lazy(() => fromRoutes(coreRoutes, 'superadmin/plan-management/list', (d) => d.data.plans));
const optPlansS = lazy(() => fromRoutes(coreRoutes, 'superadmin/plan-management/optional-plan/list', (d) => d.data.optionalPlans));
const statesS = lazy(() => fromRoutes(coreRoutes, 'common/states', (d) => d.data.states));

const roleOf = (id: any) => rolesS().find((r) => String(r.id) === String(id));
const branchOf = (id: any) => branchesS().find((b) => String(b.id) === String(id));
const branchSummary = (b: any) => b && ({
  id: b.id, uuid: b.uuid, name: b.name, slug: b.slug, email: b.email, phone: b.phone, address: b.address,
  postalCode: b.postalCode, status: b.status, city: b.city, state: b.state, country: b.country,
});
const COUNTRY = { id: 1, countryName: 'Canada', shortName: 'CA' };
const cityOf = (id: any) => {
  const all = [...branchesS(), ...brokeragesS(), ...firmsS()];
  const hit = all.find((r) => String(r.cityId) === String(id) && r.city);
  return hit?.city || (num(id) ? { id: num(id), name: `City ${id}` } : null);
};
const stateOf = (id: any) => statesS().find((s) => String(s.id) === String(id)) || (num(id) ? { id: num(id), name: `Province ${id}` } : null);
const userTypeFromRole = (role: any) => {
  const n = String(role?.name || '').toLowerCase();
  if (n === 'super admin') return 'superAdmin';
  if (n === 'branch admin') return 'admin';
  if (n === 'accountant') return 'accountant';
  if (n === 'agent') return 'agent';
  return 'staff';
};
const toBool = (v: any) => v === true || v === 'true' || v === 'yes' || v === 1 || v === '1';
const yn = (v: any) => (toBool(v) ? 'yes' : 'no');

// ---------------------------------------------------------------- 1. users + clients
const SKIP_USER_KEYS = ['password', 'confirmPassword', 'image', 'agentId', 'userRole', 'branch'];
const attachClient = (c: any, agentIdRaw: any) => {
  if (noId(agentIdRaw)) return;
  const aid = num(agentIdRaw);
  const ag = agentsS().find((a) => a.user?.id === aid || a.id === aid || a.agentAccountId === agentIdRaw)
    || null;
  const u = ag ? ag.user : usersS().find((x) => x.id === aid);
  if (!u) return;
  const name = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
  c.createdUser = { id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email };
  c.clientAccount = [{
    id: c.clientAccount?.[0]?.id || nextId(), clientId: c.id, agentId: u.id, status: 'active', clientType: c.clientType || 'buyer',
    clientAgent: { id: u.id, name, uuid: u.uuid, firstName: u.firstName, lastName: u.lastName, email: u.email },
  }];
};
const saveUser = (uuid: any, body0: any) => {
  const body = clean(body0);
  const isClient = body.userType === 'client';
  const store = isClient ? clientsS() : usersS();
  const ex = noId(uuid) ? null : (find(usersS(), uuid) || find(clientsS(), uuid));
  const target = ex || null;
  const rec: any = target || {};
  const isNew = !target;
  Object.keys(body).forEach((k) => { if (!SKIP_USER_KEYS.includes(k)) rec[k] = body[k]; });
  if (isNew) {
    rec.id = nextId();
    rec.uuid = mkUuid(isClient ? 'client' : 'user');
    rec.userTypeUId = isClient ? `CL-${2000 + rec.id}` : `ANS-${1000 + rec.id}`;
    rec.createdAt = now();
    rec.isActive = 'yes';
    rec.status = 'active';
    rec.smsOtpEnabled = false;
    rec.agentAccount = [];
    rec.clientAccount = rec.clientAccount || [];
  }
  rec.firstName = body.firstName ?? rec.firstName ?? '';
  rec.lastName = body.lastName ?? rec.lastName ?? '';
  rec.name = `${rec.firstName} ${rec.lastName}`.trim();
  rec.updatedAt = now();
  if (isClient || rec.userType === 'client') {
    rec.userType = 'client';
    rec.clientType = body.clientType ?? rec.clientType ?? 'buyer';
    attachClient(rec, body.agentId ?? rec.clientAccount?.[0]?.agentId);
    if (rec.clientAccount?.[0]) rec.clientAccount[0].clientType = rec.clientType;
  } else {
    if (body.roleId !== undefined || isNew) {
      rec.roleId = num(body.roleId) ?? rec.roleId ?? null;
      const role = roleOf(rec.roleId);
      rec.userRole = role || rec.userRole || null;
      rec.userType = body.userType && body.userType !== 'undefined' ? body.userType : userTypeFromRole(role);
    }
    if (body.branchId !== undefined || isNew) {
      rec.branchId = num(body.branchId);
      rec.branch = branchSummary(branchOf(rec.branchId)) || null;
    }
  }
  if (isNew) store.unshift(rec);
  return { rec, isNew };
};
const findAnyUser = (id: any) => find(usersS(), id) || find(clientsS(), id);

// ---------------------------------------------------------------- 2. agents
const agentsS = lazy(() => {
  const list: any[] = clone(seed.agents as any[]);
  const brs = branchesS();
  list.forEach((a, i) => {
    a.uuid = a.uuid || `agent-uuid-${a.id}`;
    a.userId = a.user.id;
    a.name = a.name || `${a.firstName} ${a.lastName}`;
    a.user.uuid = `agent-user-uuid-${a.user.id}`;
    a.user.name = a.user.name || a.name;
    a.user.email = a.user.email || a.email;
    a.branchId = a.branchId_ ?? (i % 3) + 1;
    a.branch = branchSummary(brs.find((b) => b.id === a.branchId) || brs[0]);
    a.planId = a.planId ?? (i % 5) + 2;
    a.plan = clone(plansS().find((p) => p.id === a.planId) || null);
    a.agreementStatus = a.agreementStatus || 'approved';
    a.special_note = a.special_note || '';
    a.optionalPlanId = a.optionalPlanId || '';
    a.show_website = a.show_website ?? true;
    a.createdAt = a.createdAt || new Date(Date.now() - (i + 1) * 20 * 86400000).toISOString();
    a.recoExpiryDate = a.recoExpiryDate || new Date(Date.now() + (200 + i * 15) * 86400000).toISOString();
    a.agrementExpiryDate = a.agrementExpiryDate || null;
    a.isActive = a.isActive || 'yes';
  });
  return list;
});
const agentOtherDocsS: any[] = [];
const findAgent = (v: any) => agentsS().find((a) => matches(a, v) || String(a.user?.uuid) === String(v) || (!noId(v) && String(a.userId) === String(v)));
const agentRow = (a: any) => ({ ...a, isActive: typeof a.isActive === 'boolean' ? (a.isActive ? 'yes' : 'no') : a.isActive });
const agentDetails = (a: any) => ({
  ...a.user, uuid: a.user.uuid, email: a.email, firstName: a.firstName, lastName: a.lastName, name: a.name,
  agentAccount: [agentRow(a)],
});
const SKIP_AGENT = ['optionalPlans', 'password', 'confirmPassword', 'user', 'plan', 'branch', 'brokerageData', 'id', 'uuid', 'tradeAgentCommission'];
const saveAgent = (uuid: any, body0: any, forceStatus?: string) => {
  const body = clean(body0);
  let a = noId(uuid) ? null : findAgent(uuid);
  const isNew = !a;
  if (!a) {
    const id = nextId();
    const uid = nextId();
    a = {
      id, uuid: mkUuid('agent'), agentAccountId: `AG-${pad(id)}`, status: 'pending', agreementStatus: 'pending', isActive: 'yes',
      show_website: true, createdAt: now(), brokerageId: 24, tradeAgentCommission: [],
      user: { id: uid, uuid: mkUuid('agent-user'), userTypeUId: `UID${pad(uid, 5)}`, profilePicture: null, userType: 'agent', unitsSalesTradeSheets: [], tradeSheetsCreated: [], userInTradeSheetSharedUser: [], propertyListings: [] },
    };
    a.userId = uid;
  }
  Object.keys(body).forEach((k) => { if (!SKIP_AGENT.includes(k)) a[k] = body[k]; });
  a.firstName = body.firstName ?? a.firstName ?? '';
  a.lastName = body.lastName ?? a.lastName ?? '';
  a.name = `${a.firstName} ${a.lastName}`.trim();
  if (forceStatus) a.status = forceStatus;
  ['planId', 'discountId', 'branchId', 'brokerageId'].forEach((k) => { if (body[k] !== undefined) a[k] = num(body[k]); });
  if (body.expectedGross !== undefined) a.expectedGross = num(body.expectedGross) ?? 0;
  if (body.optionalPlans !== undefined) a.optionalPlanId = asList(body.optionalPlans).join(',');
  if (body.branchId !== undefined || isNew) { a.branch = branchSummary(branchOf(a.branchId)) || null; }
  if (body.planId !== undefined) a.plan = clone(plansS().find((p) => String(p.id) === String(a.planId)) || null);
  if (body.brokerageId !== undefined || isNew) {
    const bk = brokeragesS().find((b) => String(b.id) === String(a.brokerageId));
    a.brokerageData = bk ? { id: bk.id, brokerageName: bk.brokerageName } : (a.brokerageData || { id: 1, brokerageName: 'ANS RealStateCRM Realty' });
  }
  if (body.isActive !== undefined) a.isActive = yn(body.isActive);
  a.cellPhone = a.cellPhone || a.phoneNumber || '';
  a.phoneNumber = a.phoneNumber || String(a.cellPhone || '').replace(/\D/g, '');
  a.updatedAt = now();
  Object.assign(a.user, { firstName: a.firstName, lastName: a.lastName, name: a.name, email: a.email });
  if (isNew) {
    agentsS().unshift(a);
    const role = rolesS().find((r) => r.name === 'Agent');
    usersS().unshift({
      id: a.user.id, uuid: a.user.uuid, userTypeUId: a.user.userTypeUId, firstName: a.firstName, lastName: a.lastName, name: a.name,
      email: a.email, phoneNumber: a.phoneNumber, userType: 'agent', roleId: role?.id ?? 5, branchId: a.branchId ?? null,
      isActive: 'yes', status: 'active', smsOtpEnabled: false, createdAt: a.createdAt, updatedAt: a.createdAt,
      userRole: role || null, branch: a.branch || null, clientAccount: [],
      agentAccount: [{ id: a.id, userId: a.user.id, agentId: a.id, status: a.status, licenseNumber: a.recoRegNumber || '' }],
    });
  } else {
    const u = usersS().find((x) => x.id === a.user.id);
    if (u) Object.assign(u, { firstName: a.firstName, lastName: a.lastName, name: a.name, email: a.email });
  }
  return a;
};
const deleteAgents = (ids: string[]) => {
  const list = agentsS();
  const hit = list.filter((a) => ids.some((id) => matches(a, id) || String(a.user.uuid) === id));
  hit.forEach((a) => {
    list.splice(list.indexOf(a), 1);
    const i = usersS().findIndex((u) => u.id === a.user.id);
    if (i >= 0) usersS().splice(i, 1);
  });
  return hit.length;
};

// ---------------------------------------------------------------- 3 (branches)
const saveBranch = (uuid: any, body0: any) => {
  const body = clean(body0);
  const ex = noId(uuid) ? null : find(branchesS(), uuid);
  const b: any = ex || {
    id: nextId(), uuid: mkUuid('branch'), status: 'active', isDefault: 'no', createdAt: now(),
    clockInOutSettings: [], _count: { users: 0, tradeSheets: 0, campaigns: 0, propertyListings: 0 },
  };
  Object.keys(body).forEach((k) => { if (!['city', 'state', 'country', 'clockInOutSettings', '_count'].includes(k)) b[k] = body[k]; });
  b.name = body.name ?? b.name ?? 'New Branch';
  b.slug = String(b.name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  ['stateId', 'cityId', 'countryId'].forEach((k) => { if (body[k] !== undefined) b[k] = num(body[k]); });
  b.countryId = b.countryId ?? 1;
  b.country = COUNTRY;
  b.state = stateOf(b.stateId) || b.state || null;
  b.city = cityOf(b.cityId) || b.city || null;
  const lat = num(body.latitude), lng = num(body.longitude);
  const cs = b.clockInOutSettings?.[0] || {};
  b.clockInOutSettings = [{
    ...cs,
    latitude: lat ?? cs.latitude ?? 43.65, longitude: lng ?? cs.longitude ?? -79.38,
    allowedDistance: num(body.allowedDistance) ?? cs.allowedDistance ?? 150,
    officeHoursWeekdayStart: body.officeHoursWeekdayStart ?? cs.officeHoursWeekdayStart ?? '09:00',
    officeHoursWeekdayEnd: body.officeHoursWeekdayEnd ?? cs.officeHoursWeekdayEnd ?? '17:30',
    officeHoursWeekendStart: body.officeHoursWeekendStart ?? cs.officeHoursWeekendStart ?? '10:00',
    officeHoursWeekendEnd: body.officeHoursWeekendEnd ?? cs.officeHoursWeekendEnd ?? '14:00',
  }];
  if (b.isDefault === 'yes' || b.isDefault === true || b.isDefault === 'true') {
    b.isDefault = 'yes';
    branchesS().forEach((o) => { if (o !== b) o.isDefault = 'no'; });
  } else b.isDefault = 'no';
  b.updatedAt = now();
  if (!ex) branchesS().push(b);
  // keep denormalised branch copies on users fresh
  usersS().forEach((u) => { if (u.branchId === b.id) u.branch = branchSummary(b); });
  b._count.users = usersS().filter((u) => u.branchId === b.id).length;
  return { b, isNew: !ex };
};

// ---------------------------------------------------------------- 5. announcements
const annS = lazy(() => (seed.announcements as any[]).map((a, i) => ({
  ...clone(a), uuid: a.uuid || `ann-uuid-${a.id}`, status: a.status === 'published' ? 'publish' : a.status,
  date: a.date, createdAt: a.createdAt, updatedAt: a.createdAt, _i: i,
})));
const logsS = lazy(() => fromRoutes(miscRoutes, 'superadmin/announcement-logs', (d) => d.data.logs));
const saveAnn = (uuid: any, body0: any) => {
  const body = clean(body0);
  const ex = noId(uuid) ? null : find(annS(), uuid);
  const a: any = ex || { id: nextId(), uuid: mkUuid('ann'), createdAt: now() };
  Object.keys(body).forEach((k) => { a[k] = body[k]; });
  a.title = body.title ?? a.title ?? 'Untitled';
  a.description = body.description ?? a.description ?? '';
  a.status = body.status ?? a.status ?? 'publish';
  a.date = body.date ?? a.date ?? now();
  a.created_at = a.createdAt;
  a.updatedAt = now();
  if (!ex) annS().unshift(a);
  return a;
};

// ---------------------------------------------------------------- 6. calendar
const eventsS = lazy(() => {
  const list = clone(seed.calendarEvents as any[]);
  list.forEach((e) => { e.uuid = e.uuid || `evt-uuid-${e.id}`; e.attendeeCount = e.attendeeCount ?? 0; e.viewers = e.viewers || []; });
  return list;
});
const attendeesS: Record<string, any[]> = {};
const saveEvent = (id: any, body0: any) => {
  const body = clean(body0);
  const ex = noId(id) ? null : find(eventsS(), id);
  const e: any = ex || { id: nextId(), uuid: mkUuid('evt'), attendeeCount: 0, createdAt: now(), allDay: false };
  Object.keys(body).forEach((k) => { e[k] = body[k]; });
  e.title = body.title ?? e.title ?? 'Untitled';
  e.start = body.start ? new Date(body.start).toISOString() : e.start || now();
  e.end = body.end ? new Date(body.end).toISOString() : e.end || e.start;
  e.location = body.location ?? e.location ?? '';
  e.viewerUserIds = asList(body.viewerUserIds).map(Number);
  e.updatedAt = now();
  if (!ex) eventsS().push(e);
  return e;
};
const notesS = lazy(() => fromRoutes(miscRoutes, 'superadmin/calendar-notes', (d) => d.data.calendarNotes));
const saveNote = (uuid: any, body0: any) => {
  const body = clean(body0);
  const ex = noId(uuid) ? null : find(notesS(), uuid);
  const n: any = ex || { id: nextId(), uuid: mkUuid('note'), createdAt: now() };
  const owner = me();
  if (!ex) {
    n.createdBy = owner.id;
    n.owner = { id: owner.id, firstName: owner.firstName, lastName: owner.lastName, name: meName(), email: owner.email };
  }
  n.note = body.note ?? n.note ?? '';
  n.date = body.date ? new Date(body.date).toISOString() : n.date || now();
  if (body.viewerUserIds !== undefined || body.viewers !== undefined) {
    const ids = asList(body.viewerUserIds ?? body.viewers).map((x: any) => Number(x?.id ?? x));
    const admins = fromRoutes(miscRoutes, 'superadmin/calendar-notes/branch-admins', (d) => d.data.branchAdmins);
    n.viewers = ids.map((uid: number) => {
      const u = admins.find((x) => x.id === uid) || usersS().find((x) => x.id === uid) || { id: uid, name: `User ${uid}` };
      return { id: nextId(), noteId: n.id, userId: uid, viewer: { id: u.id, firstName: u.firstName, lastName: u.lastName, name: u.name, email: u.email } };
    });
  } else n.viewers = n.viewers || [];
  n.updatedAt = now();
  if (!ex) notesS().unshift(n);
  return n;
};

// ---------------------------------------------------------------- 7. expenses
const expCatS = lazy(() => fromRoutes(financeRoutes, 'superadmin/expense-category/get', (d) => d.data.categories));
const expS = lazy(() => fromRoutes(financeRoutes, 'superadmin/expense/get', (d) => d.data.expenses));
const saveExpense = (uuid: any, body0: any) => {
  const body = clean(body0);
  const ex = noId(uuid) ? null : find(expS(), uuid);
  const id = ex?.id ?? nextId();
  const e: any = ex || {
    id, uuid: mkUuid('exp'), slug: `expense-${id}`, expense_id: `EXP-${1001 + expS().length}`,
    invoice_number: `INV-E${2026100 + expS().length}`, status: 'active', expenseStatus: 'pending', createdAt: now(), propertyListing: null,
  };
  ['receipt'].forEach((k) => delete body[k]);
  Object.keys(body).forEach((k) => { e[k] = body[k]; });
  const amount = num(body.amount) ?? Number(e.amount) ?? 0;
  const tax = num(body.tax) ?? Number(e.tax) ?? 0;
  e.amount = amount.toFixed(2); e.tax = tax.toFixed(2); e.total = (amount + tax).toFixed(2);
  e.expenseCategoryId = num(body.expenseCategoryId) ?? e.expenseCategoryId ?? null;
  e.expenseCategory = expCatS().find((c) => c.id === e.expenseCategoryId) || e.expenseCategory || null;
  e.branchId = num(body.branchId) ?? e.branchId ?? null;
  const br = branchOf(e.branchId);
  e.branch = br ? { id: br.id, name: br.name } : e.branch || null;
  e.isRecurring = body.isRecurring !== undefined ? toBool(body.isRecurring) : !!e.isRecurring;
  e.transactionDate = body.transactionDate ? new Date(body.transactionDate).toISOString() : e.transactionDate || now();
  e.receiptPath = body.receiptPath ?? body.existingReceiptPath ?? e.receiptPath ?? null;
  e.updatedAt = now();
  if (!ex) expS().unshift(e);
  return e;
};

// ---------------------------------------------------------------- 8. vendors
const vCatS = lazy(() => fromRoutes(miscRoutes, 'superadmin/vendor-category/list', (d) => d.data.VendorCategory));
const companiesS = lazy(() => fromRoutes(miscRoutes, 'superadmin/company-list/list', (d) => d.data.companies));
const vendorsS = lazy(() => {
  const list = fromRoutes(miscRoutes, 'superadmin/vendor-list/list', (d) => d.data.vendors);
  const cs = companiesS();
  list.forEach((v) => { v.company = cs.find((c) => c.id === v.companyId) || v.company; });
  return list;
});
const saveCompany = (body0: any, id?: any) => {
  const body = clean(body0);
  const ex = noId(id ?? body.id) ? null : find(companiesS(), id ?? body.id);
  const c: any = ex || { id: nextId(), socialUrls: [], createdAt: now() };
  Object.keys(body).forEach((k) => { if (k !== 'socialUrls') c[k] = body[k]; });
  c.category = body.category !== undefined ? asList(body.category) : c.category || [];
  if (body.socialUrls !== undefined) {
    c.socialUrls = asList(body.socialUrls).map((s: any, i: number) => (typeof s === 'object'
      ? { id: nextId(), companyId: c.id, ...s } : { id: nextId() + i, platform: 'Link', handle: s, fullUrl: s, companyId: c.id }));
  }
  c.updatedAt = now();
  if (!ex) companiesS().unshift(c);
  vendorsS().forEach((v) => { if (v.companyId === c.id) { v.company = c; v.category = c.category; } });
  return c;
};
const saveVendor = (body0: any, id?: any) => {
  const body = clean(body0);
  const ex = noId(id ?? body.id) ? null : find(vendorsS(), id ?? body.id);
  const v: any = ex || { id: nextId(), status: 'active', createdAt: now() };
  Object.keys(body).forEach((k) => { if (k !== 'company') v[k] = body[k]; });
  v.companyId = num(body.companyId) ?? v.companyId ?? null;
  v.company = companiesS().find((c) => c.id === v.companyId) || v.company || null;
  v.category = body.category !== undefined ? asList(body.category) : v.category || v.company?.category || [];
  v.updatedAt = now();
  if (!ex) vendorsS().unshift(v);
  return v;
};

// ---------------------------------------------------------------- 9. brokerage / firms / lawyers / receipts
const lawyersS = lazy(() => {
  const out: any[] = [];
  firmsS().forEach((f) => (f.lawyerData || []).forEach((l: any) => out.push({
    ...l, lawyerFirmId: f.id, phoneNumber: l.phoneNumber || f.phoneNumber, createdAt: f.createdAt,
    lawyerFirm: { id: f.id, uuid: f.uuid, firmName: f.firmName },
  })));
  return out;
});
const withGeo = (rec: any, body: any) => {
  ['countryId', 'stateId', 'cityId'].forEach((k) => { if (body[k] !== undefined) rec[k] = num(body[k]); });
  rec.countryId = rec.countryId ?? 1;
  rec.country = COUNTRY;
  rec.state = stateOf(rec.stateId) || rec.state || null;
  rec.city = cityOf(rec.cityId) || rec.city || null;
};
const saveBrokerage = (uuid: any, body0: any) => {
  const body = clean(body0);
  const ex = noId(uuid) ? null : find(brokeragesS(), uuid);
  const r: any = ex || { id: nextId(), uuid: mkUuid('brk'), createdAt: now(), agentData: [], buyerAgentDetails: [], sellerAgentDetails: [] };
  Object.keys(body).forEach((k) => { if (!['country', 'state', 'city'].includes(k)) r[k] = body[k]; });
  withGeo(r, body);
  r.updatedAt = now();
  if (!ex) brokeragesS().push(r);
  return r;
};
const saveFirm = (uuid: any, body0: any) => {
  const body = clean(body0);
  const ex = noId(uuid) ? null : find(firmsS(), uuid);
  const r: any = ex || { id: nextId(), uuid: mkUuid('firm'), createdAt: now(), lawyerData: [] };
  Object.keys(body).forEach((k) => { if (!['country', 'state', 'city', 'lawyerData'].includes(k)) r[k] = body[k]; });
  withGeo(r, body);
  r.updatedAt = now();
  if (!ex) firmsS().push(r);
  return r;
};
const saveLawyer = (uuid: any, body0: any) => {
  const body = clean(body0);
  const ex = noId(uuid) ? null : find(lawyersS(), uuid);
  const l: any = ex || { id: nextId(), uuid: mkUuid('lw'), createdAt: now() };
  Object.keys(body).forEach((k) => { if (k !== 'lawyerFirm') l[k] = body[k]; });
  l.lawyerFirmId = num(body.lawyerFirmId) ?? l.lawyerFirmId ?? null;
  const f = firmsS().find((x) => x.id === l.lawyerFirmId);
  l.lawyerFirm = f ? { id: f.id, uuid: f.uuid, firmName: f.firmName } : l.lawyerFirm || null;
  if (!ex) lawyersS().push(l);
  // mirror into firm.lawyerData
  firmsS().forEach((fm) => { fm.lawyerData = (fm.lawyerData || []).filter((x: any) => x.id !== l.id); });
  if (f) f.lawyerData.push({ id: l.id, uuid: l.uuid, firstName: l.firstName, lastName: l.lastName, email: l.email });
  return l;
};
const saveReceipt = (store: any[], prefix: string, uuid: any, body0: any) => {
  const body = clean(body0);
  const ex = noId(uuid) ? null : find(store, uuid);
  const n = store.length + 1;
  const r: any = ex || {
    id: nextId(), uuid: mkUuid(prefix === 'RCPT' ? 'rcpt' : 'pickup'), receiptId: `${prefix}-${new Date().getFullYear()}-${pad(n)}`,
    status: 'active', signature: null, bankDraftImages: [], createdAt: now(), createdByName: meName(),
  };
  ['signature', 'bankDraftImage'].forEach((k) => { if (body[k] === undefined) delete body[k]; });
  Object.keys(body).forEach((k) => { r[k] = body[k]; });
  r.amountReceived = num(body.amountReceived) ?? r.amountReceived ?? 0;
  r.date = body.date || r.date || now();
  r.updatedByName = meName();
  r.updatedAt = now();
  if (!ex) store.unshift(r);
  return r;
};

// ---------------------------------------------------------------- 10. plans
const discountsS = lazy(() => ['Early Bird Discount', 'Referral Discount', 'Loyalty Discount'].map((name, i) => ({
  id: i + 1, uuid: `discount-uuid-${i + 1}`, slug: name.toLowerCase().replace(/\s+/g, '-'), name, createdAt: now(), updatedAt: now(),
  discountItems: [{
    id: i + 1, discountId: i + 1, name: 'Commission discount', discountItem: 'Commission', discountType: i === 0 ? 'MONTHLY' : 'YEARLY',
    duration: 3 + i * 3, startDate: null, endDate: null, discountMethod: 'PERCENTAGE', discountValue: 5 + i * 2.5, isOptional: false,
  }],
})));
const mapItems = (items: any, fallbackPrefix: number) => asList(items).filter((x: any) => x && typeof x === 'object').map((it: any, i: number) => ({
  ...it, id: String(it.id ?? fallbackPrefix + i + nextId()), value: it.value ?? 0, isOptional: !!it.isOptional,
  planSubItems: asList(it.planSubItems).filter((s: any) => s && typeof s === 'object'),
}));
const savePlan = (uuid: any, body0: any) => {
  const body = clean(body0);
  const ex = noId(uuid) ? null : find(plansS(), uuid);
  const p: any = ex || { id: nextId(), uuid: mkUuid('plan'), planItems: [], createdAt: now() };
  Object.keys(body).forEach((k) => { if (k !== 'planItems') p[k] = body[k]; });
  p.name = body.name ?? p.name ?? 'New Plan';
  p.type = body.type ?? p.type ?? 'monthly';
  if (body.planItems !== undefined) p.planItems = mapItems(body.planItems, 1000);
  p.updatedAt = now();
  if (!ex) plansS().unshift(p);
  agentsS().forEach((a) => { if (a.planId === p.id) a.plan = clone(p); });
  return p;
};
const saveOptional = (uuid: any, body0: any) => {
  const body = clean(body0);
  const ex = noId(uuid) ? null : find(optPlansS(), uuid);
  const p: any = ex || { id: nextId(), uuid: mkUuid('optplan'), createdAt: now() };
  Object.keys(body).forEach((k) => { p[k] = body[k]; });
  p.name = body.name ?? body.optionalPlanName ?? p.name ?? 'Optional Plan';
  p.optionalPlanName = p.name;
  p.slug = String(p.name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  p.amount = num(body.amount) ?? p.amount ?? 0;
  if (!ex) optPlansS().push(p);
  return p;
};
const saveDiscount = (uuid: any, body0: any) => {
  const body = clean(body0);
  const ex = noId(uuid) ? null : find(discountsS(), uuid);
  const d: any = ex || { id: nextId(), uuid: mkUuid('discount'), discountItems: [], createdAt: now() };
  Object.keys(body).forEach((k) => { if (k !== 'discountItems') d[k] = body[k]; });
  d.name = body.name ?? d.name ?? 'Discount';
  if (body.discountItems !== undefined) {
    d.discountItems = asList(body.discountItems).filter((x: any) => x && typeof x === 'object')
      .map((it: any) => ({ ...it, id: it.id ?? nextId(), discountId: d.id, discountValue: num(it.discountValue) ?? 0 }));
  }
  d.updatedAt = now();
  if (!ex) discountsS().unshift(d);
  agentsS().forEach((a) => { if (a.discountId === d.id) a.discount = clone(d); });
  return d;
};

// ---------------------------------------------------------------- 11. support, KB, templates, campaigns, roles
const supportBase = { support: lazy(() => fromRoutes(miscRoutes, 'common/support-requests/list', (d) => d.data, { type: 'support' })), graphic: lazy(() => fromRoutes(miscRoutes, 'common/support-requests/list', (d) => d.data, { type: 'graphic' })) };
const supportTeamS = lazy(() => {
  try {
    const r: any = miscRoutes.find((x: any) => x.pattern.test('superadmin/support-team/list'));
    return clone(r.handler({ params: {}, query: {}, body: {}, path: '' }).data as any[]);
  } catch { return []; }
});
const allSupport = lazy(() => {
  const s = supportBase.support().map((x) => ({ ...x, _kind: 'support' }));
  const g = supportBase.graphic().map((x) => ({ ...x, _kind: 'graphic' }));
  return [...s, ...g];
});
const commentsS: any[] = [];
const saveSupport = (uuid: any, body0: any, kind?: string) => {
  const body = clean(body0);
  const ex = noId(uuid) ? null : find(allSupport(), uuid);
  const u = me();
  const k = ex?._kind || kind || 'support';
  const n = allSupport().filter((x) => x._kind === k).length + 1;
  const r: any = ex || {
    id: (k === 'graphic' ? 300 : 100) + nextId(), uuid: mkUuid(k === 'graphic' ? 'art' : 'sup'), _kind: k,
    suportID: `${k === 'graphic' ? 'ART' : 'SUP'}-${1000 + n + 10}`, userId: u.id,
    user: { id: u.id, name: meName(), firstName: u.firstName, lastName: u.lastName, email: u.email, userType: u.userType || 'agent' },
    team: null, files: [], artWorkRequestFile: [], artworkRequirement: null, assignments: [], createdAt: now(),
  };
  ['attachments', 'removedFileIds', 'teamId', 'teamMemberId'].forEach((x) => delete body[x]);
  Object.keys(body).forEach((x) => { if (body[x] !== undefined && body[x] !== '') r[x] = body[x]; });
  r.title = body.title ?? r.title ?? 'Untitled';
  r.status = body.status || r.status || 'open';
  r.priority = body.priority || r.priority || 'Medium';
  r.type = body.type || r.type || 'Other';
  r.updatedAt = now();
  const tm = noId(body0?.teamMemberId) ? null : supportTeamS().find((m: any) => String(m.id) === String(body0.teamMemberId));
  if (tm) r.assignments = [{ id: nextId(), supportRequestId: r.id, teamMemberId: tm.id, note: null, teamMember: tm, createdAt: now() }];
  if (!ex) allSupport().unshift(r);
  return r;
};
const strip = (r: any) => { const { _kind, ...rest } = r; return rest; };

const kbS = lazy(() => fromRoutes(miscRoutes, 'superadmin/knowledge-base/list', (d) => d.data));
const tplS = lazy(() => fromRoutes(miscRoutes, 'superadmin/template-builder/list', (d) => d.data.templateBuilders));
const campS = lazy(() => fromRoutes(miscRoutes, 'superadmin/leads/campaigns/list', (d) => d.data.campaigns));
const genericSave = (store: any[], prefix: string, uuid: any, body0: any, extra?: (r: any, b: any) => void) => {
  const body = clean(body0);
  const ex = noId(uuid) ? null : find(store, uuid);
  const r: any = ex || { id: nextId(), uuid: mkUuid(prefix), createdAt: now() };
  Object.keys(body).forEach((k) => { r[k] = body[k]; });
  r.updatedAt = now();
  if (extra) extra(r, body);
  if (!ex) store.unshift(r);
  return r;
};
const saveRole = (uuid: any, body0: any) => {
  const body = clean(body0);
  const ex = noId(uuid) ? null : find(rolesS(), uuid);
  const r: any = ex || { id: nextId(), uuid: mkUuid('role'), isDefault: 'no', status: 'active', permissions: [], createdAt: now() };
  Object.keys(body).forEach((k) => { r[k] = body[k]; });
  r.name = body.name ?? r.name ?? 'New Role';
  r.slug = String(r.name).toLowerCase().replace(/\s+/g, '-');
  if (body.permissions !== undefined) r.permissions = asList(body.permissions);
  if (!ex) rolesS().unshift(r);
  usersS().forEach((u) => { if (u.roleId === r.id) u.userRole = r; });
  return r;
};

// ================================================================ routes
export const crudRoutes = [
  // ---- users
  route('GET', 'superadmin/user-management/get-user-list', () => ok('Users retrieved successfully', { userData: usersS() })),
  route('GET', 'superadmin/user-management/get-client-list', () => ok('Clients retrieved successfully', { userData: clientsS() })),
  route('GET', 'superadmin/user-management/get-spacific-user', ({ query }) => {
    if (noId(query.uuid)) return ok('ok', { userData: undefined });
    const u = findAnyUser(query.uuid);
    if (!u) return nf('User');
    return ok('User retrieved successfully', { userData: { address: '', postalCode: '', countryId: 1, ...u } });
  }),
  route('POST', 'superadmin/user-management/create-update-user', ({ query, body }) => {
    const { rec, isNew } = saveUser(query.uuid, body);
    return ok(isNew ? 'User created successfully' : 'User updated successfully', { userData: rec });
  }),
  route('POST', 'superadmin/user-management/lead-to-client', ({ query, body }) => {
    const { rec } = saveUser(query.uuid, { ...clean(body), userType: 'client' });
    return ok('Lead converted to client', { userData: rec });
  }),
  route('POST', 'superadmin/user-management/send-reg-invitation', () => ok('Invitation sent successfully')),
  route('DELETE', 'superadmin/user-management/delete-spacific-user', ({ query }) => {
    const n = removeMany(usersS(), [query.uuid]) + removeMany(clientsS(), [query.uuid]);
    return n ? ok('User deleted successfully') : nf('User');
  }),
  route('DELETE', 'superadmin/user-management/delete-multiple-user', ({ body, query }) => {
    const ids = idsFrom(body, query);
    removeMany(usersS(), ids); removeMany(clientsS(), ids);
    return ok('Users deleted successfully');
  }),
  route('POST', 'auth/toggle-status', ({ body }) => {
    const u = findAnyUser(body?.userId);
    if (!u) return nf('User');
    const active = toBool(body?.isActive);
    u.isActive = active ? 'yes' : 'no'; u.status = active ? 'active' : 'inactive';
    return ok(`User ${active ? 'activated' : 'deactivated'} successfully`);
  }),
  route('POST', 'auth/sms-otp/toggle', ({ body }) => {
    const u = findAnyUser(body?.userId);
    if (!u) return nf('User');
    u.smsOtpEnabled = toBool(body?.enabled);
    return ok(`SMS OTP ${u.smsOtpEnabled ? 'enabled' : 'disabled'} successfully`);
  }),

  // ---- agents
  route('GET', 'superadmin/agent-management/list', () => ok('Agents retrieved successfully', { userData: agentsS().map(agentRow) })),
  route('GET', 'agent/approved-agents', () => ok('Approved agents retrieved successfully', { agents: agentsS().filter((a) => a.status === 'approved').map(agentRow) })),
  route('GET', 'superadmin/agent-management/get-single-agent', ({ query }) => {
    const a = findAgent(query.uuid);
    return a ? ok('Agent details retrieved successfully.', { agentDetails: agentDetails(a) }) : nf('Agent');
  }),
  route('POST', 'superadmin/agent-management/create', ({ body }) => {
    const a = saveAgent(null, body);
    return ok('Agent created successfully.', { agentData: agentDetails(a) });
  }),
  route('POST', 'superadmin/agent-management/invite-agent', ({ body }) => {
    const a = saveAgent(null, body, 'pending');
    return ok('Agent Invitation Successfully.', { agentData: { userData: a.user, agentAccount: agentRow(a), ...agentDetails(a) } });
  }),
  route('POST', 'superadmin/agent-management/update', ({ query, body }) => {
    const a = saveAgent(query.uuid, body);
    return ok('Agent updated successfully.', { agentData: agentDetails(a) });
  }),
  route('DELETE', 'superadmin/agent-management/delete', ({ query }) => (deleteAgents([query.uuid]) ? ok('Agent deleted successfully.') : nf('Agent'))),
  route('DELETE', 'superadmin/agent-management/delete-multiple', ({ body }) => { deleteAgents(idsFrom(body)); return ok('Agents deleted successfully.'); }),
  route('POST', 'superadmin/agent-management/change-agent-account-status', ({ query }) => {
    const a = findAgent(query.id);
    if (!a) return nf('Agent');
    a.status = query.status || a.status;
    const u = usersS().find((x) => x.id === a.user.id);
    if (u?.agentAccount?.[0]) u.agentAccount[0].status = a.status;
    return ok('Agent account status updated successfully.');
  }),
  route('POST', 'superadmin/agent-management/change-agent-agreement-status', ({ body }) => {
    const a = findAgent(body?.id ?? body?.agentId ?? body?.uuid);
    if (!a) return nf('Agent');
    const st = body?.agreementStatus ?? body?.status;
    if (st) a.agreementStatus = st;
    return ok('Agreement status updated successfully.');
  }),
  route('POST', 'agent/change-agreement-step', ({ query }) => {
    const a = findAgent(query.id);
    if (a) a.agreementStep = query.step;
    return ok('Agreement step updated successfully.');
  }),
  route('POST', 'superadmin/agent-management/toggle-status', ({ body }) => {
    const a = findAgent(body?.agentId);
    if (!a) return nf('Agent');
    a.isActive = toBool(body?.isActive) ? 'yes' : 'no';
    return ok(`Agent ${a.isActive === 'yes' ? 'activated' : 'deactivated'} successfully`);
  }),
  route('POST', 'superadmin/agent-management/toggle-show-website', ({ body }) => {
    const a = findAgent(body?.agentId);
    if (!a) return nf('Agent');
    a.show_website = toBool(body?.showWebsite);
    return ok('Website visibility updated successfully');
  }),
  route('POST', 'agent/submit-agent-info', ({ body }) => ok('Agent info submitted successfully', { agentData: agentDetails(saveAgent(body?.uuid ?? body?.id, body)) })),
  route('POST', 'agent/upload-agent-attachment', ({ query, body }) => {
    const a = findAgent(query.agent_id);
    if (!a) return nf('Agent');
    const type = query.type || 'otherDocument';
    const b = clean(body);
    if (type === 'otherDocument') {
      agentOtherDocsS.push({
        id: nextId(), type, name: b.fileName || b.otherDocument || 'Document', filePath: b.otherDocument || '', status: 'active',
        agentAccountId: a.id, agentAccount: { id: a.id, agrementExpiryDate: a.agrementExpiryDate }, createdAt: now(),
      });
    } else {
      a[type] = b[type] || `${type}.pdf`;
      if (type === 'agreementFile') {
        agentOtherDocsS.push({
          id: nextId(), type, name: b[type] || 'Agreement', filePath: b[type] || '', status: 'active',
          agentAccountId: a.id, agentAccount: { id: a.id, agrementExpiryDate: a.agrementExpiryDate }, createdAt: now(),
        });
      }
    }
    return ok('File uploaded successfully', { newFileAttachment: agentRow(a) });
  }),
  route('POST', 'superadmin/agent-management/remove-agent-file', ({ query }) => {
    const a = findAgent(query.id);
    if (a && query.fileName) a[query.fileName] = null;
    return { status: true, message: 'File removed successfully', newFileAttachment: true, agentAccount: a ? agentRow(a) : {} };
  }),
  route('POST', 'superadmin/agent-management/remove-other-file', ({ query }) => {
    const i = agentOtherDocsS.findIndex((d) => String(d.id) === String(query.id));
    if (i >= 0) agentOtherDocsS.splice(i, 1);
    return ok('File removed successfully');
  }),
  route('GET', 'superadmin/agent-management/agent-other-documents', ({ query }) =>
    ok('Documents retrieved successfully', { agentOtherDocuments: agentOtherDocsS.filter((d) => String(d.agentAccountId) === String(query.agentId)) })),

  // ---- branches
  route('GET', 'superadmin/branch-management/get-branch-list', () => {
    branchesS().forEach((b) => { b._count.users = usersS().filter((u) => u.branchId === b.id).length; });
    return ok('Branches fetched successfully', { branchData: branchesS() });
  }),
  route('GET', 'superadmin/branch-management/get-specific-branch', ({ query }) => {
    const b = find(branchesS(), query.uuid);
    return b ? ok('Branch fetched successfully', { branchData: b }) : nf('Branch');
  }),
  route('POST', 'superadmin/branch-management/create-update-branch', ({ query, body }) => {
    const { b, isNew } = saveBranch(query.uuid, body);
    return ok(isNew ? 'Branch created successfully' : 'Branch updated successfully', { branchData: b });
  }),
  route('DELETE', 'superadmin/branch-management/delete-specific-branch', ({ query }) => {
    const b = find(branchesS(), query.uuid);
    if (!b) return nf('Branch');
    if (b.isDefault === 'yes') return { status: false, message: 'Cannot delete default branch. Please set another branch as default first.' };
    removeMany(branchesS(), [query.uuid]);
    return ok('Branch deleted successfully');
  }),
  route('DELETE', 'superadmin/branch-management/delete-multiple-branch', ({ body }) => {
    const ids = idsFrom(body).filter((id) => find(branchesS(), id)?.isDefault !== 'yes');
    const n = removeMany(branchesS(), ids);
    return ok(`${n} branch(es) deleted successfully`, { deletedCount: n });
  }),

  // ---- announcements
  route('GET', 'superadmin/announcements', ({ query }) => {
    let list = annS();
    if (query.status === 'published') list = list.filter((a) => a.status === 'publish' && new Date(a.date).getTime() <= Date.now() + 86400000);
    return ok('Announcements retrieved successfully', { announcements: list });
  }),
  route('GET', 'superadmin/announcements/get', ({ query }) => {
    const a = find(annS(), query.uuid);
    return a ? ok('ok', { announcement: a }) : nf('Announcement');
  }),
  route('POST', 'superadmin/announcements/create', ({ body }) => ok('Announcement created successfully', { announcement: saveAnn(null, body) })),
  route('POST', 'superadmin/announcements/update', ({ query, body }) => ok('Announcement updated successfully', { announcement: saveAnn(query.uuid, body) })),
  route('DELETE', 'superadmin/announcements/delete', ({ query }) => (removeMany(annS(), [query.uuid]) ? ok('Announcement deleted successfully') : nf('Announcement'))),
  route('DELETE', 'superadmin/announcements/delete-multiple', ({ body }) => { removeMany(annS(), idsFrom(body)); return ok('Announcements deleted successfully'); }),
  route('POST', 'superadmin/announcements/send-notifications', ({ body }) => {
    const b = clean(body);
    const ann = saveAnn(null, { title: b.title || 'Instant Notification', description: b.description || '', status: 'publish', date: now() });
    const recipients = asList(b.selectedAgents).length || 1;
    const types: string[] = [];
    if (toBool(b.sendEmail)) types.push('email');
    if (toBool(b.sendSms)) types.push('sms');
    if (!types.length) types.push('email');
    types.forEach((t) => logsS().unshift({
      id: nextId(), uuid: mkUuid('log'), announcementId: ann.id, notificationType: t, status: 'success', title: ann.title,
      message: t === 'sms' ? b.smsBody || ann.description : b.emailBody || ann.description, recipientCount: recipients,
      totalRecipients: recipients, successCount: recipients, failedCount: 0, createdAt: now(), updatedAt: now(),
      announcement: { id: ann.id, title: ann.title, uuid: ann.uuid },
    }));
    return ok('Notifications sent successfully', { announcement: ann });
  }),
  route('GET', 'superadmin/announcement-logs', ({ query }) => {
    const limit = parseInt(query.limit || '', 10) || 50;
    const page = parseInt(query.page || '', 10) || 1;
    const logs = logsS().filter((l) => (!query.status || l.status === query.status) && (!query.notificationType || l.notificationType === query.notificationType));
    return ok('Notification logs retrieved successfully', {
      logs: logs.slice((page - 1) * limit, page * limit),
      pagination: { currentPage: page, totalPages: Math.max(1, Math.ceil(logs.length / limit)), totalItems: logs.length, itemsPerPage: limit },
    });
  }),
  route('DELETE', 'superadmin/announcement-logs/delete-multiple', ({ body }) => { removeMany(logsS(), idsFrom(body)); return ok('Logs deleted successfully'); }),

  // ---- calendar events + notes
  route('GET', 'superadmin/calendar-events', () => ok('Calendar events retrieved successfully', { calendarEvents: eventsS() })),
  route('GET', 'common/calendar-events/single-event', ({ query }) => {
    const e = find(eventsS(), query.uuid);
    return e ? ok('ok', { calendarEvent: e }) : nf('Event');
  }),
  route('POST', 'superadmin/calendar-events/create', ({ body }) => ok('Event created successfully', { calendarEvent: saveEvent(null, body) })),
  route('POST', 'superadmin/calendar-events/update', ({ query, body }) => ok('Event updated successfully', { calendarEvent: saveEvent(query.eventId, body) })),
  route('DELETE', 'superadmin/calendar-events/delete', ({ query }) => (removeMany(eventsS(), [query.eventId]) ? ok('Event deleted successfully') : nf('Event'))),
  route('DELETE', 'superadmin/calendar-events/bulk-delete', ({ body }) => { removeMany(eventsS(), idsFrom(body)); return ok('Events deleted successfully'); }),
  route('GET', 'superadmin/calendar-events/attendees', ({ query }) => {
    const e = find(eventsS(), query.uuid);
    return ok('Attendees retrieved successfully', { attendees: e ? attendeesS[e.uuid] || [] : [] });
  }),
  route('POST', 'common/calendar-events/join-event', ({ query, body }) => {
    const e = find(eventsS(), query.uuid);
    if (!e) return nf('Event');
    const b = clean(body);
    const u = me();
    const list = (attendeesS[e.uuid] = attendeesS[e.uuid] || []);
    list.push({
      id: nextId(), name: b.name || meName(), email: b.email || u.email, phone: b.phone || b.phoneNumber || '', createdAt: now(), calendarEventId: e.id,
    });
    e.attendeeCount = list.length;
    return ok('Registered successfully', { attendeeCount: e.attendeeCount, eventAttendee: list[list.length - 1] });
  }),
  route('GET', 'superadmin/calendar-notes', () => ok('Calendar notes retrieved successfully', { calendarNotes: notesS() })),
  route('POST', 'superadmin/calendar-notes/create-update', ({ query, body }) => {
    const n = saveNote(query.uuid, body);
    return ok('Calendar note saved successfully', { calendarNote: n });
  }),
  route('DELETE', 'superadmin/calendar-notes/delete', ({ query }) => (removeMany(notesS(), [query.uuid]) ? ok('Calendar note deleted successfully') : nf('Note'))),
  route('DELETE', 'superadmin/calendar-notes/delete-multiple', ({ body }) => { removeMany(notesS(), idsFrom(body)); return ok('Calendar notes deleted successfully'); }),

  // ---- expenses
  route('GET', 'superadmin/expense-category/get', () => ok('Expense categories retrieved successfully', { categories: expCatS() })),
  route('GET', 'superadmin/expense-category/get-specific', ({ query }) => {
    const c = find(expCatS(), query.uuid);
    return c ? ok('ok', { category: c }) : nf('Category');
  }),
  route('POST', 'superadmin/expense-category/create', ({ body }) => ok('Expense category created successfully', { category: genericSave(expCatS(), 'exp-cat', null, body, (r, b) => { r.slug = String(b.name || r.name || '').toLowerCase().replace(/[^a-z]+/g, '-'); r.status = b.status || r.status || 'active'; }) })),
  route('POST', 'superadmin/expense-category/update', ({ query, body }) => ok('Expense category updated successfully', { category: genericSave(expCatS(), 'exp-cat', query.uuid, body, (r) => { r.slug = String(r.name || '').toLowerCase().replace(/[^a-z]+/g, '-'); expS().forEach((e) => { if (e.expenseCategoryId === r.id) e.expenseCategory = r; }); }) })),
  route('DELETE', 'superadmin/expense-category/delete', ({ query }) => (removeMany(expCatS(), [query.uuid]) ? ok('Expense category deleted successfully') : nf('Category'))),
  route('DELETE', 'superadmin/expense-category/delete-multiple', ({ body }) => { removeMany(expCatS(), idsFrom(body)); return ok('Expense categories deleted successfully'); }),
  route('GET', 'superadmin/expense/get', () => ok('Expenses retrieved successfully', { expenses: expS() })),
  route('GET', 'superadmin/expense/get-specific', ({ query }) => {
    const e = find(expS(), query.uuid);
    return e ? ok('ok', { expense: e }) : nf('Expense');
  }),
  route('POST', 'superadmin/expense/create', ({ body }) => ok('Expense created successfully', { expense: saveExpense(null, body) })),
  route('POST', 'superadmin/expense/update', ({ query, body }) => ok('Expense updated successfully', { expense: saveExpense(query.uuid, body) })),
  route('DELETE', 'superadmin/expense/delete', ({ query }) => (removeMany(expS(), [query.uuid]) ? ok('Expense deleted successfully') : nf('Expense'))),
  route('DELETE', 'superadmin/expense/delete-multiple', ({ body }) => { removeMany(expS(), idsFrom(body)); return ok('Expenses deleted successfully'); }),
  route('POST', 'superadmin/expense/change-expense-status', ({ query }) => {
    const e = find(expS(), query.id);
    if (!e) return nf('Expense');
    e.expenseStatus = query.expenseStatus || e.expenseStatus;
    return ok('Expense status updated successfully', { expenseStatus: e.expenseStatus });
  }),

  // ---- vendors / companies / categories
  route('GET', 'superadmin/vendor-category/list', () => ok('Vendor categories retrieved successfully', { VendorCategory: vCatS() })),
  route('POST', 'superadmin/vendor-category/create', ({ body }) => ok('Vendor category created successfully', { data: genericSave(vCatS(), 'vcat', null, body) })),
  route('POST', 'superadmin/vendor-category/update', ({ query, body }) => ok('Vendor category updated successfully', { announcement: genericSave(vCatS(), 'vcat', query.id, body) })),
  route('DELETE', 'superadmin/vendor-category/delete-multiple', ({ body }) => { removeMany(vCatS(), idsFrom(body)); return ok('Vendor categories deleted successfully'); }),
  route('GET', 'superadmin/company-list/list', () => ok('Companies retrieved successfully', { companies: companiesS() })),
  route('GET', 'superadmin/company-list/(?<id>\\d+)', ({ params }) => { const c = find(companiesS(), params.id); return c ? ok('ok', { company: c }) : nf('Company'); }),
  route('POST', 'superadmin/company-list/create', ({ body }) => ok('Company created successfully', { data: saveCompany(body) })),
  route('POST', 'superadmin/company-list/update', ({ body }) => ok('Company updated successfully', { company: saveCompany(body) })),
  route('DELETE', 'superadmin/company-list/delete-multiple', ({ body }) => { const ids = idsFrom(body); removeMany(companiesS(), ids); removeMany(vendorsS().filter((v) => ids.includes(String(v.companyId))), []); return ok('Companies deleted successfully'); }),
  route('DELETE', 'superadmin/company-list/(?<id>\\d+)', ({ params }) => (removeMany(companiesS(), [params.id]) ? ok('Company deleted successfully') : nf('Company'))),
  route('GET', 'superadmin/vendor-list/list', () => ok('Vendors retrieved successfully', { vendors: vendorsS() })),
  route('GET', 'superadmin/vendor-list/by-status', ({ query }) => ok('Vendors retrieved successfully', { vendors: vendorsS().filter((v) => !query.status || v.status === query.status) })),
  route('GET', 'superadmin/vendor-list/(?<id>\\d+)', ({ params }) => { const v = find(vendorsS(), params.id); return v ? ok('ok', { vendor: v }) : nf('Vendor'); }),
  route('POST', 'superadmin/vendor-list/create', ({ body }) => ok('Vendor created successfully', { data: saveVendor(body) })),
  route('POST', 'superadmin/vendor-list/update', ({ body }) => ok('Vendor updated successfully', { vendor: saveVendor(body) })),
  route('POST', 'superadmin/vendor-list/change-vendor-status', ({ body }) => {
    const v = find(vendorsS(), body?.id);
    if (!v) return nf('Vendor');
    v.status = body?.status ?? v.status;
    return ok('Vendor status updated successfully', { vendor: v });
  }),
  route('POST', 'superadmin/vendor-list/share-vendor', () => ok('Vendor shared successfully')),
  route('DELETE', 'superadmin/vendor-list/delete-multiple', ({ body }) => { removeMany(vendorsS(), idsFrom(body)); return ok('Vendors deleted successfully'); }),
  route('DELETE', 'superadmin/vendor-list/(?<id>\\d+)', ({ params }) => (removeMany(vendorsS(), [params.id]) ? ok('Vendor deleted successfully') : nf('Vendor'))),

  // ---- brokerages / firms / lawyers
  route('GET', 'superadmin/brokerage/list', () => ok('Data retrieved successfully', { brokerageData: brokeragesS() })),
  route('POST', 'superadmin/brokerage/create', ({ body }) => ok('Brokerage created successfully', { brokerageData: saveBrokerage(null, body) })),
  route('POST', 'superadmin/brokerage/update', ({ query, body }) => ok('Brokerage updated successfully', { brokerageData: saveBrokerage(query.uuid, body) })),
  route('DELETE', 'superadmin/brokerage/delete', ({ query }) => (removeMany(brokeragesS(), [query.uuid]) ? ok('Brokerage deleted successfully') : nf('Brokerage'))),
  route('DELETE', 'superadmin/brokerage/delete-multiple', ({ body }) => { removeMany(brokeragesS(), idsFrom(body)); return ok('Brokerages deleted successfully'); }),
  route('GET', 'superadmin/lawyer-firm/list', () => ok('Data retrieved successfully', { lawyerFirm: firmsS() })),
  route('POST', 'superadmin/lawyer-firm/create', ({ body }) => ok('Lawyer firm created successfully', { lawyerFirm: saveFirm(null, body) })),
  route('POST', 'superadmin/lawyer-firm/update', ({ query, body }) => ok('Lawyer firm updated successfully', { lawyerFirm: saveFirm(query.uuid, body) })),
  route('DELETE', 'superadmin/lawyer-firm/delete', ({ query }) => { removeMany(lawyersS().filter((l) => String(firmsS().find((f) => matches(f, query.uuid))?.id) === String(l.lawyerFirmId)), []); return removeMany(firmsS(), [query.uuid]) ? ok('Lawyer firm deleted successfully') : nf('Lawyer firm'); }),
  route('DELETE', 'superadmin/lawyer-firm/delete-multiple', ({ body }) => { removeMany(firmsS(), idsFrom(body)); return ok('Lawyer firms deleted successfully'); }),
  route('GET', 'superadmin/lawyer/list', () => ok('Data retrieved successfully', { lawyerData: lawyersS() })),
  route('POST', 'superadmin/lawyer/create', ({ body }) => ok('Lawyer created successfully', { lawyerData: saveLawyer(null, body) })),
  route('POST', 'superadmin/lawyer/update', ({ query, body }) => ok('Lawyer updated successfully', { lawyerData: saveLawyer(query.uuid, body) })),
  route('DELETE', 'superadmin/lawyer/delete', ({ query }) => {
    const l = find(lawyersS(), query.uuid);
    if (!l) return nf('Lawyer');
    firmsS().forEach((f) => { f.lawyerData = (f.lawyerData || []).filter((x: any) => x.id !== l.id); });
    removeMany(lawyersS(), [query.uuid]);
    return ok('Lawyer deleted successfully');
  }),
  route('DELETE', 'superadmin/lawyer/delete-multiple', ({ body }) => {
    const ids = idsFrom(body);
    firmsS().forEach((f) => { f.lawyerData = (f.lawyerData || []).filter((x: any) => !ids.some((id) => matches(x, id))); });
    removeMany(lawyersS(), ids);
    return ok('Lawyers deleted successfully');
  }),
  route('POST', 'superadmin/lawyer/send-details-email', () => ok('Email sent successfully')),

  // ---- receipts
  route('GET', 'superadmin/receipt-manage/list', () => ok('Data retrieved successfully', { receiptData: receiptsS() })),
  route('POST', 'superadmin/receipt-manage/create-and-update', ({ query, body }) => ok('Receipt saved successfully', { receiptData: saveReceipt(receiptsS(), 'RCPT', query.uuid, body) })),
  route('POST', 'superadmin/receipt-manage/upload-refund-receipt-and-mutual-release-file', ({ query, body }) => {
    const r = find(receiptsS(), query.uuid);
    if (r) { Object.assign(r, clean(body)); r.updatedAt = now(); }
    return ok('File uploaded successfully', { receiptData: r });
  }),
  route('POST', 'superadmin/receipt-manage/send-deposit-receipt-invoice-email', () => ok('Email sent successfully')),
  route('DELETE', 'superadmin/receipt-manage/delete', ({ query }) => (removeMany(receiptsS(), [query.uuid]) ? ok('Receipt deleted successfully') : nf('Receipt'))),
  route('DELETE', 'superadmin/receipt-manage/delete-multiple', ({ body }) => { removeMany(receiptsS(), idsFrom(body)); return ok('Receipts deleted successfully'); }),
  route('GET', 'superadmin/pickup-receipt-manage/list', () => ok('Data retrieved successfully', { receiptData: pickupsS() })),
  route('POST', 'superadmin/pickup-receipt-manage/create-and-update', ({ query, body }) => ok('Pickup receipt saved successfully', { receiptData: saveReceipt(pickupsS(), 'PKUP', query.uuid, body) })),
  route('POST', 'superadmin/pickup-receipt-manage/send-pickup-receipt-invoice-email', () => ok('Email sent successfully')),
  route('DELETE', 'superadmin/pickup-receipt-manage/delete', ({ query }) => (removeMany(pickupsS(), [query.uuid]) ? ok('Pickup receipt deleted successfully') : nf('Receipt'))),
  route('DELETE', 'superadmin/pickup-receipt-manage/delete-multiple', ({ body }) => { removeMany(pickupsS(), idsFrom(body)); return ok('Pickup receipts deleted successfully'); }),

  // ---- plans / optional plans / discounts
  route('GET', 'superadmin/plan-management/list', () => ok('Plans Get Successfully.', { plans: plansS() })),
  route('GET', 'superadmin/plan-management/get-single-plan', ({ query }) => { const p = find(plansS(), query.uuid); return p ? ok('ok', { singlePlan: p }) : nf('Plan'); }),
  route('POST', 'superadmin/plan-management/create', ({ body }) => ok('Plan created successfully', { newPlan: savePlan(null, body) })),
  route('POST', 'superadmin/plan-management/update', ({ query, body }) => ok('Plan updated successfully', { updatedPlan: savePlan(query.uuid ?? query.id, body) })),
  route('DELETE', 'superadmin/plan-management/delete', ({ query }) => (removeMany(plansS(), [query.id ?? query.uuid]) ? ok('Plan deleted successfully') : nf('Plan'))),
  route('GET', 'superadmin/plan-management/optional-plan/list', () => ok('Optional plans retrieved successfully', { optionalPlans: optPlansS() })),
  route('GET', 'superadmin/plan-management/get-single-optional-plan', ({ query }) => { const p = find(optPlansS(), query.uuid); return p ? ok('ok', { singlePlan: p }) : nf('Optional plan'); }),
  route('POST', 'superadmin/plan-management/optional-plan/create', ({ body }) => ok('Optional plan created successfully', { optionalPlan: saveOptional(null, body) })),
  route('POST', 'superadmin/plan-management/optional-plan/update', ({ query, body }) => ok('Optional plan updated successfully', { optionalPlan: saveOptional(query.uuid ?? query.id, body) })),
  route('DELETE', 'superadmin/plan-management/optional-plan/delete', ({ query }) => (removeMany(optPlansS(), [query.uuid]) ? ok('Optional plan deleted successfully') : nf('Optional plan'))),
  route('GET', 'superadmin/discount-management/list', () => ok('Discounts retrieved successfully', { discounts: discountsS() })),
  route('GET', 'superadmin/discount-management/get-single-discount', ({ query }) => { const d = find(discountsS(), query.uuid); return d ? ok('ok', { singleDiscount: d }) : nf('Discount'); }),
  route('POST', 'superadmin/discount-management/create', ({ body }) => ok('Discount created successfully', { newDiscount: saveDiscount(null, body) })),
  route('POST', 'superadmin/discount-management/update', ({ query, body }) => ok('Discount updated successfully', { updatedDiscount: saveDiscount(query.uuid ?? query.id, body) })),
  route('DELETE', 'superadmin/discount-management/delete', ({ query }) => (removeMany(discountsS(), [query.id ?? query.uuid]) ? ok('Discount deleted successfully') : nf('Discount'))),

  // ---- support requests (support + graphic)
  route('GET', 'common/support-requests/list', ({ query }) => {
    const k = query.type === 'graphic' ? 'graphic' : 'support';
    return { status: true, data: allSupport().filter((r) => r._kind === k).map(strip) };
  }),
  route('GET', 'common/support-requests/get-single', ({ query }) => { const r = find(allSupport(), query.uuid); return r ? { status: true, data: strip(r) } : nf('Support request'); }),
  route('POST', 'common/support-requests/create', ({ body }) => {
    const b = clean(body);
    const kind = b.type && /graphic|art/i.test(String(b.requestType || b.kind || '')) ? 'graphic' : 'support';
    return ok('Support request created successfully', strip(saveSupport(null, body, kind)));
  }),
  route('POST', 'common/support-requests/update', ({ query, body }) => ok('Support request updated successfully', strip(saveSupport(query.uuid, body)))),
  route('DELETE', 'common/support-requests/delete', ({ query }) => (removeMany(allSupport(), [query.uuid]) ? ok('Support request deleted successfully') : nf('Support request'))),
  route('POST', 'common/support-requests/assign-member', ({ body }) => {
    const r = find(allSupport(), body?.supportRequestId);
    if (!r) return nf('Support request');
    const m = supportTeamS().find((x: any) => String(x.id) === String(body?.teamMemberId));
    if (!m) return nf('Team member');
    r.assignments = [{ id: nextId(), supportRequestId: r.id, teamMemberId: m.id, note: null, teamMember: m, createdAt: now() }];
    if (r.status === 'open') r.status = 'inProgress';
    r.updatedAt = now();
    return ok('Support request assigned successfully');
  }),
  route('POST', 'common/support-requests/change-suport-status', ({ query, body }) => {
    const r = find(allSupport(), query.uuid);
    if (!r) return nf('Support request');
    r.status = body?.status ?? r.status;
    r.updatedAt = now();
    return ok('Status updated successfully');
  }),
  route('GET', 'common/support-requests/comment-list', ({ query }) => ok('Comments retrieved successfully', {
    clientSupportRequestData: commentsS.filter((c) => String(c.supportRequestId) === String(query.supportRequestId)),
  })),
  route('POST', 'common/support-requests/comment-create', ({ query, body }) => {
    const b = clean(body);
    if (!noId(query.id)) {
      const c = commentsS.find((x) => String(x.id) === String(query.id));
      if (c) { c.comment = b.comment; c.updatedAt = now(); return ok('Comment updated successfully', { clientSupportRequestData: c }); }
    }
    const u = me();
    const c = {
      id: nextId(), comment: b.comment || '', supportRequestId: num(b.supportRequestId) ?? b.supportRequestId, createdAt: now(), updatedAt: now(),
      commentCreatedBy: { id: u.id, name: meName(), firstName: u.firstName, lastName: u.lastName, email: u.email, profilePicture: null },
    };
    commentsS.push(c);
    return ok('Comment added successfully', { clientSupportRequestData: c });
  }),
  route('DELETE', 'common/support-requests/comment-delete', ({ query }) => { removeMany(commentsS, [query.id]); return ok('Comment deleted successfully'); }),

  // ---- knowledge base
  route('GET', 'superadmin/knowledge-base/list', ({ query }) => ({
    status: true, message: 'Knowledge Base fetched successfully',
    data: kbS().filter((k) => (!query.type || k.type === query.type) && (!query.status || k.status === query.status)),
  })),
  route('GET', 'superadmin/knowledge-base/get-single', ({ query }) => { const k = find(kbS(), query.id); return k ? { status: true, data: k } : nf('Item'); }),
  route('POST', 'superadmin/knowledge-base/create', ({ body }) => {
    const b = clean(body);
    const ex = !noId(b.uuid) ? find(kbS(), b.uuid) : !noId(b.id) ? find(kbS(), b.id) : null;
    const r = genericSave(kbS(), 'kb', ex?.uuid, b, (x, bb) => { x.status = bb.status || x.status || 'active'; if (bb.file) x.url = bb.file; });
    return ok(ex ? 'Knowledge base updated successfully' : 'Knowledge base created successfully', r);
  }),
  route('DELETE', 'superadmin/knowledge-base/delete', ({ body }) => { removeMany(kbS(), idsFrom(body)); return ok('Knowledge base deleted successfully'); }),
  route('POST', 'superadmin/knowledge-base/change-status/(?<uuid>[^/]+)', ({ params, body }) => {
    const k = find(kbS(), params.uuid);
    if (!k) return nf('Item');
    k.status = body?.status ?? k.status;
    return ok('Status updated successfully', { status: k.status });
  }),

  // ---- template builder
  route('GET', 'superadmin/template-builder/list', ({ query }) => ok('Templates retrieved successfully', {
    templateBuilders: tplS().filter((t) => (!query.type || t.type === query.type) && (!query.area || t.area === query.area) && (noId(query.uuid) || t.uuid === query.uuid)),
  })),
  route('POST', 'superadmin/template-builder/create', ({ body }) => ok('Template created successfully', { templateBuilder: genericSave(tplS(), 'tpl', null, body) })),
  route('POST', 'superadmin/template-builder/update', ({ query, body }) => ok('Template updated successfully', { templateBuilder: genericSave(tplS(), 'tpl', query.uuid, body) })),
  route('DELETE', 'superadmin/template-builder/delete', ({ query }) => (removeMany(tplS(), [query.uuid]) ? ok('Template deleted successfully') : nf('Template'))),
  route('DELETE', 'superadmin/template-builder/delete-multiple', ({ body }) => { removeMany(tplS(), idsFrom(body)); return ok('Templates deleted successfully'); }),

  // ---- lead campaigns
  route('GET', 'superadmin/leads/campaigns/list', ({ query }) => {
    const b = parseInt(query.branchId || '', 10);
    return { status: true, data: { campaigns: Number.isNaN(b) ? campS() : campS().filter((c) => c.branchId === b) } };
  }),
  route('POST', 'superadmin/leads/campaigns/create', ({ body }) => ok('Campaign created successfully', { campaign: genericSave(campS(), 'camp', null, body, campaignExtra) })),
  route('PUT', 'superadmin/leads/campaigns/update/(?<uuid>[^/]+)', ({ params, body }) => ok('Campaign updated successfully', { campaign: genericSave(campS(), 'camp', params.uuid, body, campaignExtra) })),
  route('DELETE', 'superadmin/leads/campaigns/delete/(?<uuid>[^/]+)', ({ params }) => (removeMany(campS(), [params.uuid]) ? ok('Campaign deleted successfully') : nf('Campaign'))),
  route('DELETE', 'superadmin/leads/campaigns/delete-multiple', ({ body }) => { removeMany(campS(), idsFrom(body)); return ok('Campaigns deleted successfully'); }),

  // ---- roles
  route('GET', 'superadmin/role-management/get', () => ok('Roles retrieved successfully', { roles: rolesS() })),
  route('GET', 'superadmin/role-management/get-spacific', ({ query }) => { const r = find(rolesS(), query.uuid); return r ? ok('ok', { role: r }) : nf('Role'); }),
  route('POST', 'superadmin/role-management/create', ({ body }) => ok('Role created successfully', { role: saveRole(null, body) })),
  route('POST', 'superadmin/role-management/update', ({ query, body }) => ok('Role updated successfully', { role: saveRole(query.uuid, body) })),
  route('DELETE', 'superadmin/role-management/delete', ({ query }) => (removeMany(rolesS(), [query.uuid]) ? ok('Role deleted successfully') : nf('Role'))),
  route('DELETE', 'superadmin/role-management/delete-multiple', ({ body }) => { removeMany(rolesS(), idsFrom(body)); return ok('Roles deleted successfully'); }),
];

function campaignExtra(r: any, b: any) {
  r.slug = String(r.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  r.status = b.status || r.status || 'active';
  r.typeOfCampaign = b.typeOfCampaign ?? r.typeOfCampaign ?? '';
  r.branchId = noId(b.branchId) ? (b.branchId === undefined ? r.branchId ?? null : null) : num(b.branchId);
  const br = branchOf(r.branchId);
  r.branch = br ? { id: br.id, name: br.name, uuid: br.uuid } : null;
  r._count = r._count || { leads: 0 };
}
