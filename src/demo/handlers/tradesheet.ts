/* eslint-disable @typescript-eslint/no-explicit-any */
// Stateful in-memory trade sheet store + wizard handlers (create/update steps, list, archive, notes, shared users,
// paperwork attachments, conditions) plus the dropdown data the wizard pages load (states/cities, brokerages,
// law firms/lawyers, upload file categories, leads).
import { route } from '../route';
import * as seed from '../seed';

const BASE = 'agent/trade-sheet-management';
const DAY = 86400000;
const now = () => new Date().toISOString();
const dayAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();
const dayAhead = (n: number) => new Date(Date.now() + n * DAY).toISOString();
const ymd = (n: number) => dayAgo(n).slice(0, 10);
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v ?? null));
const ok = (data: any, message = 'Data retrieved successfully') => ({ status: true, data, message });
const num = (v: any, d: any = null) => (v === '' || v == null || isNaN(Number(v)) ? d : Number(v));
const iso = (v: any) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(+d) ? null : d.toISOString();
};
const str = (v: any) => (v == null ? '' : String(v));
const fail = (status: number, message: string) => {
  const e: any = new Error(message);
  e.status = status;
  return e;
};
let seq = 1000;
const nextId = () => ++seq;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(++seq).toString(36)}`;

/* ------------------------------ geography ------------------------------ */
const STATES = [
  { id: 1, name: 'Ontario' }, { id: 2, name: 'British Columbia' }, { id: 3, name: 'Alberta' }, { id: 4, name: 'Quebec' },
  { id: 5, name: 'Manitoba' }, { id: 6, name: 'Nova Scotia' }, { id: 7, name: 'Saskatchewan' }, { id: 8, name: 'New Brunswick' },
];
const CITY_ROWS: [number, string, number][] = [
  [1, 'Toronto', 1], [2, 'Mississauga', 1], [3, 'Ottawa', 1], [6, 'Brampton', 1], [7, 'Hamilton', 1], [8, 'London', 1],
  [14, 'Oakville', 1], [15, 'Markham', 1], [16, 'Vaughan', 1], [4, 'Vancouver', 2], [5, 'Calgary', 3], [9, 'Montreal', 4],
  [10, 'Winnipeg', 5], [11, 'Halifax', 6], [12, 'Saskatoon', 7], [13, 'Moncton', 8],
];
const CITIES = CITY_ROWS.map(([id, name, stateId]) => ({ id, name, stateId }));
const stateObj = (id: any) => STATES.find((s) => s.id === Number(id)) || null;
const cityObj = (id: any) => {
  const c = CITIES.find((x) => x.id === Number(id));
  return c ? { id: c.id, name: c.name } : null;
};
const cityIdByName = (name: string) => CITIES.find((c) => c.name === name)?.id ?? 1;
const COUNTRY = { id: 39, countryName: 'Canada', shortName: 'CA' };

/* ------------------------------ agents / plans ------------------------------ */
const PLAN = {
  id: 1, name: 'Standard Plan',
  planItems: [{ id: 1, planSubItems: [] }, { id: 2, commissionOwner: 20, planSubItems: [{ id: 1, value: 499 }] }],
};
const agentAccount = (id: any) => {
  const a: any = (seed.agents as any[]).find((x) => String(x.id) === String(id));
  if (!a) return null;
  return {
    id: a.id, userId: a.user?.id, name: a.name, firstName: a.firstName, lastName: a.lastName, email: a.email,
    brokerageId: a.brokerageId, status: a.status, hstNo: '812345678', plan: PLAN, planId: 1,
  };
};

/* ------------------------------ brokerages ------------------------------ */
const BROKERAGE_SEED: [string, string, number, number, string, string][] = [
  ['ANS RealStateCRM Realty Inc., Brokerage', '100 King St W', 1, 1, 'M5X 1A9', '416-555-0201'],
  ['Maple Leaf Homes Brokerage', '55 City Centre Dr', 1, 2, 'L5B 1M2', '905-555-0202'],
  ['Lakeshore Realty Group', '1 James St N', 1, 7, 'L8R 2K3', '905-555-0203'],
  ['Capital City Properties', '210 Elgin St', 1, 3, 'K2P 1L7', '613-555-0204'],
  ['Northern Gate Realty', '8 Queen St E', 1, 6, 'L6V 1A2', '905-555-0205'],
  ['Pacific Rim Real Estate', '777 Burrard St', 2, 4, 'V6Z 1X7', '604-555-0206'],
  ['Prairie Sky Realty', '400 3rd Ave SW', 3, 5, 'T2P 4H2', '403-555-0207'],
  ['Forest City Brokers', '300 Dundas St', 1, 8, 'N6B 1T6', '519-555-0208'],
];
const mkBrokerage = (id: number, name: string, address: string, stateId: number, cityId: number, postal: string, phone: string, extra: any = {}) => ({
  id, uuid: `brk-uuid-${id}`, brokerageName: name, address, streetAddress: `Suite ${100 + id}`, streetAddressLine2: '',
  postalZipCode: postal, phoneNumber: phone, faxNumber: '', billingEmailAddress: `billing${id}@ans.demo`,
  countryId: 39, stateId, cityId, country: COUNTRY, state: stateObj(stateId), city: cityObj(cityId), createdAt: dayAgo(id),
  agentData: [] as any[], buyerAgentDetails: [] as any[], sellerAgentDetails: [] as any[], ...extra,
});
const brokerages: any[] = BROKERAGE_SEED.map((b, i) => mkBrokerage(i + 1, b[0], b[1], b[2], b[3], b[4], b[5]));
brokerages.push(
  mkBrokerage(24, 'ANS RealStateCRM Realty', '100 King St W', 1, 1, 'M5X 1A9', '416-555-0224', {
    agentData: (seed.agents as any[]).filter((a) => a.brokerageId === 24).map((a) => ({
      id: a.id, uuid: `agent-uuid-${a.id}`, firstName: a.firstName, lastName: a.lastName, email: a.email,
    })),
  }),
);
const brokerageObj = (id: any, f: any = {}) => {
  const b = brokerages.find((x) => String(x.id) === String(id));
  return clone({
    ...(b || { id: num(id), uuid: uid('brk') }),
    ...Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== '' && v !== null)),
  });
};

/* ------------------------------ law firms / lawyers ------------------------------ */
const FIRM_SEED: [string, string, number, number, string, string][] = [
  ['Hartwell & Associates LLP', '120 Adelaide St W', 1, 1, 'M5H 1T1', '416-555-0301'],
  ['Brampton Legal Group', '20 Main St N', 1, 6, 'L6V 1N8', '905-555-0302'],
  ['Sinclair Real Estate Law', '2 Robert Speck Pkwy', 1, 2, 'L4Z 1H8', '905-555-0303'],
  ['Rideau Law Office', '99 Bank St', 1, 3, 'K1P 6B9', '613-555-0304'],
  ['Granite Peak Lawyers', '50 Burlington Ave', 1, 7, 'L7S 1P1', '905-555-0305'],
  ['Westcoast Conveyancing LLP', '1055 W Georgia St', 2, 4, 'V6E 3P3', '604-555-0306'],
  ['Foothills Legal', '800 5th Ave SW', 3, 5, 'T2P 3T6', '403-555-0307'],
  ['Thames Valley Law', '250 Dundas St', 1, 8, 'N6A 1H3', '519-555-0308'],
];
const firms: any[] = FIRM_SEED.map((b, i) => ({
  id: i + 1, uuid: `firm-uuid-${i + 1}`, firmName: b[0], address: b[1], streetAddress: `Floor ${i + 2}`, streetAddressLine2: '',
  postalZipCode: b[4], phoneNumber: b[5], faxNumber: '', billingEmailAddress: `office${i + 1}@ans.demo`, email: `office${i + 1}@ans.demo`,
  countryId: 39, stateId: b[2], cityId: b[3], country: COUNTRY, state: stateObj(b[2]), city: cityObj(b[3]), createdAt: dayAgo(i),
}));
const LAWYER_NAMES = [['Peter', 'Grant'], ['Helen', 'Wu'], ['Maria', 'Alvarez'], ['Raj', 'Kapoor'], ['Samuel', 'Cohen'], ['Chloe', 'Martin'], ['Nadia', 'Ahmed'], ['Tom', 'Bell']];
const lawyers: any[] = [];
firms.forEach((f, i) => {
  [0, 1].forEach((k) => {
    const [fn, ln] = LAWYER_NAMES[(i + k * 3) % LAWYER_NAMES.length];
    lawyers.push({
      id: i * 2 + k + 1, uuid: `lw-uuid-${i * 2 + k + 1}`, firstName: fn, lastName: ln, name: `${fn} ${ln}`, email: `${fn}.${ln}@lawfirm.example`.toLowerCase(),
      phoneNumber: f.phoneNumber, cellPhoneNumber: '', faxNumber: '', address: f.address, streetAddress: f.streetAddress,
      postalZipCode: f.postalZipCode, countryId: 39, stateId: f.stateId, cityId: f.cityId, country: COUNTRY, state: f.state, city: f.city,
      firmId: f.id, lawyerFirmName: f.firmName,
    });
  });
});
const firmWithLawyers = (f: any) => ({ ...f, lawyerData: lawyers.filter((l) => l.firmId === f.id).map(({ id, uuid, firstName, lastName, email, name }) => ({ id, uuid, firstName, lastName, email, name })) });
const lawyerWithFirm = (l: any) => ({ ...l, firm: firms.find((f) => f.id === l.firmId) || null });
const lawyerObj = (p: string, b: any, lawyerId: any, firmId: any) => {
  const known = lawyers.find((l) => String(l.id) === String(lawyerId)) || null;
  const firm = firms.find((f) => String(f.id) === String(firmId)) || known && firms.find((f) => f.id === known.firmId) || null;
  const stateId = num(b[`${p}StateProvince`]) ?? firm?.stateId ?? null;
  const cityId = num(b[`${p}City`]) ?? firm?.cityId ?? null;
  const firmOut = {
    id: firm?.id ?? num(firmId) ?? nextId(), firmName: b[`${p}LawFirmName`] || firm?.firmName || '',
    address: b[`${p}Address`] || firm?.address || '', streetAddress: b[`${p}StreetAddress`] || firm?.streetAddress || '',
    streetAddressLine2: b[`${p}StreetAddressLine2`] || '', postalZipCode: b[`${p}PostalZipCode`] || firm?.postalZipCode || '',
    phoneNumber: b[`${p}PhoneNumber`] || firm?.phoneNumber || '', faxNumber: b[`${p}FaxNumber`] || firm?.faxNumber || '',
    countryId: 39, stateId, cityId, country: COUNTRY, state: stateObj(stateId), city: cityObj(cityId),
  };
  return {
    id: known?.id ?? num(lawyerId) ?? nextId(), firstName: b[`${p}FirstName`] || known?.firstName || '', lastName: b[`${p}LastName`] || known?.lastName || '',
    name: `${b[`${p}FirstName`] || ''} ${b[`${p}LastName`] || ''}`.trim(), email: b[`${p}Email`] || known?.email || '',
    phoneNumber: b[`${p}PhoneNumber`] || known?.phoneNumber || '', faxNumber: b[`${p}FaxNumber`] || '', address: firmOut.address,
    postalZipCode: firmOut.postalZipCode, countryId: 39, stateId, cityId, country: COUNTRY, state: stateObj(stateId), city: cityObj(cityId), firm: firmOut,
  };
};

/* ------------------------------ upload file categories ------------------------------ */
const mkFiles = (names: string[], start: number) => names.map((name, i) => ({
  id: start + i, name, status: 'active', listType: 'Both', required: 'no', description: name,
  sellerOrder: i + 1, buyerOrder: i + 1, tenantOrder: i + 1, landlordOrder: i + 1,
}));
const COOP_FILES = mkFiles(['Agreement of Purchase and Sale', 'Receipt of Funds', 'Buyer Representation Agreement', 'Notice of Fulfillment',
  'Mortgage Pre-Approval', 'Property Disclosure Statement', 'Waiver / Amendment', 'FINTRAC Identification'], 1);
const LISTING_FILES = mkFiles(['Listing Agreement', 'Seller Property Information Statement', 'Agreement of Purchase and Sale',
  'Notice of Fulfillment', 'Receipt of Funds', 'Commission Trust Agreement', 'FINTRAC Identification'], 21);
const ADDITIONAL_FILES = mkFiles(['Cover Letter', 'Supporting Document', 'Correspondence'], 41);
const fileNameById = (id: any) => [...COOP_FILES, ...LISTING_FILES, ...ADDITIONAL_FILES].find((f) => f.id === Number(id))?.name || `Document ${id}`;

/* ------------------------------ sheet store ------------------------------ */
type Rec = any;
const sheets: Rec[] = [];
const archivedSeedIds = new Set<number>();
const notes: any[] = [];


const STAGES = ['FINALIZED', 'DRAFT', 'PAID', 'CLOSED', 'FINALIZED', 'DRAFT', 'CLOSED', 'PAID', 'FINALIZED', 'CLOSED', 'DRAFT', 'PAID'];
const lawyerSample = (name: string) => ({
  id: nextId(), firstName: name.split(' ')[0], lastName: name.split(' ')[1], name, email: `${name.split(' ')[0].toLowerCase()}@lawfirm.example`,
  phoneNumber: '416-555-0142', faxNumber: '416-555-0143', address: '200 Bay St', postalZipCode: 'M5J 2J1', country: COUNTRY, city: { name: 'Toronto' },
  state: { name: 'Ontario' }, firm: { id: 1, firmName: 'Harbour & Pike LLP', address: '200 Bay St', streetAddress: 'Floor 2', postalZipCode: 'M5J 2J1', phoneNumber: '416-555-0142', faxNumber: '416-555-0143', countryId: 39, stateId: 1, cityId: 1, city: { name: 'Toronto' }, state: { name: 'Ontario' }, country: COUNTRY },
});

const normalizeSeed = (t: any, archived: boolean, idx: number) => {
  const s: any = clone(t);
  const p = s.properties?.[0] || {};
  const cityName = typeof p.city === 'string' ? p.city : p.city?.name || 'Toronto';
  const cityId = cityIdByName(cityName);
  const price = Number(p.salesPrice) || 500000;
  const base = Math.round(price * 0.025 * 100) / 100;
  s.properties = [{
    ...p, tradeSheetId: s.id, countryId: 39, stateId: 1, cityId, country: COUNTRY, state: stateObj(1), city: { id: cityId, name: cityName },
    postalCode: 'M5V 2T6', mlsNumber: `W${5400000 + s.id * 37}`, offerDate: dayAgo(60), acceptanceDate: dayAgo(55), firmDate: dayAgo(45),
    depositDate: dayAgo(50), conditional: 'no', continueShowings: 'no', updateMLSStatus: 'yes', listType: undefined,
  }];
  const [first, ...rest] = String(s.name || 'Agent').split(' ');
  const agentId = (s.userId || 10) - 9;
  const acct = agentAccount(agentId);
  s.listType = ['Residential', 'Residential', 'Commercial'][idx % 3];
  s.slug = String(s.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  s.firstName = first;
  s.lastName = rest.join(' ');
  s.email = acct?.email || `${first.toLowerCase()}@ans.demo`;
  s.multipleRepresentation = null;
  s.propertyListingId = null;
  s.seller_landlord_agent_id = s.representation === 'seller' ? agentId : null;
  s.buyer_tenant_agent_id = s.representation === 'buyer' ? agentId : null;
  s.approvedAt = s.status === 'approved' ? dayAgo(18) : null;
  s.fundsHold = 0;
  s.lead = null;
  s.deletedAt = null;
  s.updatedAt = s.createdAt;
  s.conditions = [
    { id: nextId(), tradeSheetId: s.id, conditionType: 'Financing', dueDate: ymd(30), conditionMetDate: ymd(28), completeStatus: 'yes' },
    { id: nextId(), tradeSheetId: s.id, conditionType: 'Home Inspection', dueDate: ymd(26), conditionMetDate: null, completeStatus: 'no' },
  ];
  s.sellerInformations = [{ id: nextId(), firstName: 'Walter', lastName: 'Bishop', email: 'walter.bishop@example.com', phone: '416-555-0188' }];
  s.buyerInformations = (s.buyerInformations || []).map((b: any) => ({ id: nextId(), email: '', phone: '', ...b }));
  const ad = s.agentDetails?.[0] || {};
  const acctEntry = { ...(acct || {}), hstNo: '812345678', plan: PLAN };
  s.agentDetails = [{
    ...ad, id: nextId(), tradeSheetId: s.id, sellerCommission: ad.sellerCommission ?? 2.5, buyerCommission: ad.buyerCommission ?? 2.5,
    sellerAgentAccount: acctEntry, buyerAgentAccount: acctEntry,
    sellerFirstName: first, sellerLastName: rest.join(' '), sellerEmail: s.email, buyerFirstName: first, buyerLastName: rest.join(' '), buyerEmail: s.email,
    intSellerAgentId: agentId, intBuyerAgentId: agentId, sellerBrokerageId: 24, buyerBrokerageId: (idx % 8) + 1,
    sellerBrokerage: brokerageObj(24), buyerBrokerage: brokerageObj((idx % 8) + 1),
  }];
  s.lawyerDetails = [{ id: nextId(), tradeSheetId: s.id, sellerLawyer: lawyerSample('Eleanor Pike'), buyerLawyer: lawyerSample('Martin Shaw') }];
  s.sharedUsers = (s.sharedUsers || []).map((u: any) => ({
    id: nextId(), tradeSheetId: s.id, sharedUserId: 10, firstName: String(u.name || '').split(' ')[0], lastName: String(u.name || '').split(' ')[1] || '',
    name: u.name, email: `${String(u.name || 'agent').split(' ')[0].toLowerCase()}@ans.demo`, commissionType: 'percentage', commission: 10,
    representationType: u.representationType, userType: 'Shared', status: 'approved',
  }));
  if (s.propertyListing) s.propertyListing = { ...s.propertyListing, id: s.id, uuid: `pl-${String(s.id).padStart(4, '0')}`, status: 'approved' };
  const stage = STAGES[idx];
  const finalized = !archived && idx < 12 && stage && stage !== 'DRAFT';
  s.tradeTransaction = finalized ? [{
    id: nextId(), uuid: `tx-demo-${String(s.id).padStart(4, '0')}`, createdAt: dayAgo(20), baseOfficeCommissionTotal: Math.round(base * 1.13 * 100) / 100,
    baseOfficeCommissionTax: Math.round(base * 0.13 * 100) / 100, agentCommissionTotal: Math.round(base * 0.8 * 100) / 100,
    netCommissionTotal: Math.round(base * 0.2 * 1.13 * 100) / 100, chequePosting: stage === 'PAID' || stage === 'CLOSED' ? [{ id: 1 }] : [],
  }] : [];
  s.paperWorkAttachmentFiles = [];
  s.paperWorkOtherAttachments = [];
  s.tradeSheetImportantFiles = [];
  s.activityLog = [];
  s.tradeCommissionInvoice = [];
  s.tradeCommissionInvoiceRecords = [];
  s.createdUser = { id: s.userId, firstName: first, lastName: rest.join(' '), email: s.email, agentAccount: acct ? [acct] : [] };
  s.createdBy = s.userId;
  return s;
};

(seed.tradeSheets as any[]).forEach((t, i) => sheets.push(normalizeSeed(t, false, i)));
(seed.archivedTradeSheets as any[]).forEach((t, i) => {
  const s = normalizeSeed(t, true, i + 12);
  archivedSeedIds.add(s.id);
  sheets.push(s);
});

const nextTypeId = () => {
  const year = new Date().getFullYear();
  const max = sheets.reduce((m, s) => Math.max(m, Number(String(s.tradeSheetTypeId || '').split('-').pop()) || 0), 0);
  return `TS-${year}-${String(max + 1).padStart(4, '0')}`;
};
let nextSheetId = 100;

const blankSheet = (uuid?: string): Rec => ({
  id: nextSheetId++, uuid: uuid || uid('ts'), serial: 0, tradeSheetTypeId: null, name: '', slug: '', firstName: '', lastName: '', email: '',
  userId: 10, createdBy: 10, branchId: 1, representation: null, representationType: 'single', multipleRepresentation: null, listType: 'Residential',
  status: 'draft', tradeStatus: 'pending', leadSource: 'myLead', leadId: null, lead: null, propertyListingId: null, propertyListing: null,
  seller_landlord_agent_id: null, buyer_tenant_agent_id: null, rejectReasonMain: null, rejectCount: 0, deletedAt: null, approvedAt: null, fundsHold: 0,
  createdAt: now(), updatedAt: now(), properties: [], conditions: [], sellerInformations: [], buyerInformations: [], agentDetails: [], lawyerDetails: [],
  sharedUsers: [], tradeTransaction: [], paperWorkAttachmentFiles: [], paperWorkOtherAttachments: [], tradeSheetImportantFiles: [], activityLog: [],
  tradeCommissionInvoice: [], tradeCommissionInvoiceRecords: [], createdUser: null,
});

const byUuid = (uuid: any) => sheets.find((s) => s.uuid === uuid);
const byId = (id: any) => sheets.find((s) => String(s.id) === String(id));
const isArchived = (s: Rec) => s.status === 'archive' || archivedSeedIds.has(s.id);
const live = (s: Rec) => !s.deletedAt;
const ensure = (uuid: any): Rec => {
  let s = byUuid(uuid);
  if (!s) {
    s = blankSheet(uuid || undefined);
    s.tradeSheetTypeId = nextTypeId();
    sheets.unshift(s);
  }
  return s;
};
const touch = (s: Rec, b: any) => {
  s.updatedAt = now();
  if (b?.status === 'draft') s.status = 'draft';
};

const listingFor = (id: any) => {
  const n = num(id);
  if (n == null) return null;
  const base: any = (seed.properties as any[])[(n - 1) % (seed.properties as any[]).length] || {};
  const addr = `${base.address}, ${base.city}, ON`;
  return {
    ...base, id: n, uuid: n > 100 ? `ml-demo-${String(n - 100).padStart(4, '0')}` : `pl-demo-${String(n).padStart(4, '0')}`,
    propertyAddress: addr, address: base.address, addressTwo: '', postalCode: 'M5V 2T6', countryId: 39, stateId: 1, cityId: cityIdByName(base.city),
    status: 'approved', listingStatus: 'listed', sharedUsers: [],
    sellersInfo: JSON.stringify({ sellersInfo: [{ firstName: 'Walter', lastName: 'Bishop', phoneNumber: '416-555-0188' }] }),
  };
};

const agentBlock = (s: Rec, b: any) => {
  const rep = String(s.representation || '');
  const reps = String(s.multipleRepresentation || '');
  const sellerSide = rep === 'seller' || rep === 'landlord' || s.representationType === 'multiple' || reps.includes('seller') || reps.includes('landlord');
  const buyerSide = rep === 'buyer' || rep === 'tenant' || s.representationType === 'multiple' || reps.includes('buyer') || reps.includes('tenant');
  const aId = b.agent_id;
  if (aId) {
    if (b.seller_landlord_agent_id) s.seller_landlord_agent_id = num(b.seller_landlord_agent_id);
    else if (sellerSide) s.seller_landlord_agent_id = num(aId);
    if (b.buyer_tenant_agent_id) s.buyer_tenant_agent_id = num(b.buyer_tenant_agent_id);
    else if (buyerSide) s.buyer_tenant_agent_id = num(aId);
  }
  const sellerAcct = agentAccount(s.seller_landlord_agent_id);
  const buyerAcct = agentAccount(s.buyer_tenant_agent_id);
  const prev = s.agentDetails?.[0] || {};
  const rec = {
    id: prev.id || nextId(), tradeSheetId: s.id, ...prev,
    sellerFirstName: sellerAcct?.firstName ?? prev.sellerFirstName ?? null, sellerLastName: sellerAcct?.lastName ?? prev.sellerLastName ?? null,
    sellerEmail: sellerAcct?.email ?? prev.sellerEmail ?? null, intSellerAgentId: sellerAcct?.id ?? prev.intSellerAgentId ?? null,
    sellerBrokerageId: sellerAcct ? sellerAcct.brokerageId : prev.sellerBrokerageId ?? null,
    buyerFirstName: buyerAcct?.firstName ?? prev.buyerFirstName ?? null, buyerLastName: buyerAcct?.lastName ?? prev.buyerLastName ?? null,
    buyerEmail: buyerAcct?.email ?? prev.buyerEmail ?? null, intBuyerAgentId: buyerAcct?.id ?? prev.intBuyerAgentId ?? null,
    buyerBrokerageId: buyerAcct ? buyerAcct.brokerageId : prev.buyerBrokerageId ?? null,
    sellerAgentAccount: sellerAcct ?? prev.sellerAgentAccount ?? null, buyerAgentAccount: buyerAcct ?? prev.buyerAgentAccount ?? null,
    sellerBrokerage: sellerAcct ? brokerageObj(sellerAcct.brokerageId) : prev.sellerBrokerage ?? null,
    buyerBrokerage: buyerAcct ? brokerageObj(buyerAcct.brokerageId) : prev.buyerBrokerage ?? null,
  };
  s.agentDetails = [rec];
};

/* ------------------------------ wizard step handlers ------------------------------ */
const saveBasicInfo = ({ query, body }: any) => {
  const b = body || {};
  const existing = byUuid(query.uuid);
  const s = existing || ensure(query.uuid || undefined);
  const creating = !existing;
  if (creating) {
    s.status = b.status === 'draft' ? 'draft' : 'draft';
    s.createdAt = now();
  }
  const agent: any = (seed.agents as any[]).find((a) => String(a.id) === String(b.agent_id));
  if (agent) {
    s.name = agent.name; s.firstName = agent.firstName; s.lastName = agent.lastName; s.email = agent.email; s.userId = agent.user?.id ?? s.userId; s.createdBy = s.userId;
  } else if (creating || !s.name) {
    s.firstName = b.firstName || s.firstName || 'Demo'; s.lastName = b.lastName || s.lastName || 'Agent';
    s.email = b.email || s.email || 'demo@ans.demo'; s.name = `${s.firstName} ${s.lastName}`.trim();
  }
  s.slug = String(s.name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (b.representation !== undefined) s.representation = b.representation || null;
  if (b.representationType) s.representationType = b.representationType;
  const multi = Array.isArray(b.multipleRepresentation) ? b.multipleRepresentation.join(',') : b.multipleRepresentation;
  s.multipleRepresentation = s.representationType === 'multiple' ? multi || s.multipleRepresentation || null : null;
  if (s.representationType === 'multiple') s.representation = null;
  if (b.listType) s.listType = b.listType;
  if (b.leadSource) s.leadSource = b.leadSource;
  s.leadId = num(b.leadId);
  if (b.branchId) s.branchId = num(b.branchId, s.branchId);
  if ('propertyListingId' in b) {
    s.propertyListingId = num(b.propertyListingId);
    s.propertyListing = listingFor(s.propertyListingId);
  }
  agentBlock(s, b);
  s.createdUser = { id: s.userId, firstName: s.firstName, lastName: s.lastName, email: s.email, agentAccount: [] };
  if (b.status === 'draft') s.status = 'draft';
  s.updatedAt = now();
  if (creating) {
    if (!s.tradeSheetTypeId) s.tradeSheetTypeId = nextTypeId();
    const i = sheets.indexOf(s);
    if (i > 0) { sheets.splice(i, 1); sheets.unshift(s); }
  }
  return {
    status: true,
    data: { agentBasicInfoData: clone(s) },
    message: creating ? 'Created Agent Basic Info Successfully.' : 'Updated Agent Basic Info Successfully.',
  };
};

const PROP_SKIP = new Set(['saveBtn', 'status', 'uuid', 'id', 'tradeSheetId', 'createdAt', 'updatedAt', 'city', 'state', 'country']);
const saveProperty = ({ query, body }: any) => {
  const b = body || {};
  const s = ensure(query.uuid);
  const prev = s.properties?.[0];
  const rec: any = prev ? { ...prev } : { id: nextId(), tradeSheetId: s.id, createdAt: now() };
  Object.entries(b).forEach(([k, v]) => { if (!PROP_SKIP.has(k)) rec[k] = v; });
  ['soldPrice', 'listingPrice', 'salesPrice'].forEach((k) => { rec[k] = String(num(b[k] ?? rec[k], 0)); });
  rec.depositAmount = num(b.depositAmount ?? rec.depositAmount);
  ['acceptanceDate', 'closingDate', 'offerDate', 'firmDate', 'depositDate', 'conditionExpiryDate'].forEach((k) => { rec[k] = iso(b[k] ?? rec[k]); });
  rec.countryId = 39;
  rec.stateId = num(b.stateId ?? rec.stateId);
  rec.cityId = num(b.cityId ?? rec.cityId);
  rec.country = COUNTRY;
  rec.state = stateObj(rec.stateId);
  rec.city = cityObj(rec.cityId);
  rec.updatedAt = now();
  s.properties = [rec];
  touch(s, b);
  return {
    status: true, data: { propertyDetailsData: clone(rec) },
    message: prev ? 'Updated Property Details Successfully.' : 'Created Property Details Successfully.',
  };
};

const savePeople = (key: 'sellers' | 'buyers', field: 'sellerInformations' | 'buyerInformations', out: string) => ({ query, body }: any) => {
  const b = body || {};
  const s = ensure(query.uuid);
  const list = Array.isArray(b[key]) ? b[key] : [];
  s[field] = list
    .filter((p: any) => p && (p.firstName || p.lastName))
    .map((p: any) => ({ id: nextId(), tradeSheetId: s.id, firstName: str(p.firstName), lastName: str(p.lastName), email: str(p.email), phone: str(p.phone) }));
  touch(s, b);
  return { status: true, data: { [out]: clone(s[field]) }, message: key === 'sellers' ? 'Seller Information saved successfully.' : 'Buyer Information saved successfully.' };
};

const saveAgentDetails = ({ query, body }: any) => {
  const b = body || {};
  const s = ensure(query.uuid);
  const prev = s.agentDetails?.[0];
  const side = (p: 'seller' | 'buyer') => {
    const internal = b[`${p}InternalAgent`];
    const acct: any = internal ? agentAccount(internal) : null;
    const first = b[`${p}FirstName`] ?? acct?.firstName ?? '';
    const last = b[`${p}LastName`] ?? acct?.lastName ?? '';
    const stateId = num(b[`${p}StateProvince`]);
    const cityId = num(b[`${p}City`]);
    const brokerageId = num(b[`${p}BrokerageId`]);
    const brokerage = brokerageObj(brokerageId, {
      brokerageName: b[`${p}BrokerageName`], address: b[`${p}BrokerageAddress`], streetAddress: b[`${p}StreetAddress`],
      streetAddressLine2: b[`${p}StreetAddressLine2`], postalZipCode: b[`${p}PostalZipCode`], phoneNumber: b[`${p}BrokeragePhoneNumber`],
      faxNumber: b[`${p}BrokerageFaxNumber`], billingEmailAddress: b[`${p}BrokerageBillingEmailAddress`], stateId, cityId,
    });
    brokerage.countryId = 39; brokerage.country = COUNTRY;
    if (stateId) brokerage.state = stateObj(stateId);
    if (cityId) brokerage.city = cityObj(cityId);
    const commission = num(b[`${p}Commission`], 0);
    return {
      [`${p}FirstName`]: first, [`${p}LastName`]: last, [`${p}Email`]: b[`${p}Email`] ?? acct?.email ?? '',
      [`int${p === 'seller' ? 'Seller' : 'Buyer'}AgentId`]: acct?.id ?? num(internal),
      [`${p}BrokerageId`]: brokerageId ?? brokerage.id ?? null, [`${p}Brokerage`]: brokerage,
      [`${p}AgentAccount`]: acct ?? (first || last ? { id: null, name: `${first} ${last}`.trim(), firstName: first, lastName: last, email: b[`${p}Email`] || '', plan: PLAN } : null),
      [`${p}CommissionType`]: b[`${p}CommissionType`] || 'percentage', [`${p}Commission`]: commission,
      [`${p}CommissionAmount`]: num(b[`${p}CommissionAmount`], 0),
      [`${p}CommercialCommission`]: Array.isArray(b[`${p}CommercialCommission`]) ? b[`${p}CommercialCommission`] : [],
    };
  };
  const rec = { ...(prev || {}), id: prev?.id || nextId(), tradeSheetId: s.id, ...side('seller'), ...side('buyer'), updatedAt: now() };
  s.agentDetails = [rec];
  touch(s, b);
  return { status: true, data: { agentDetailsData: clone(rec) }, message: prev ? 'Updated Agent Details Successfully.' : 'Created Agent Details Successfully.' };
};

const saveLawyerDetails = ({ query, body }: any) => {
  const b = body || {};
  const s = ensure(query.uuid);
  const prev = s.lawyerDetails?.[0];
  const sellerLawyer = lawyerObj('seller', b, b.sellerLawyerId, b.sellerLawFirmId);
  const buyerLawyer = lawyerObj('buyer', b, b.buyerLawyerId, b.buyerLawFirmId);
  const rec = {
    ...(prev || {}), id: prev?.id || nextId(), tradeSheetId: s.id, sellerLawyerId: sellerLawyer.id, buyerLawyerId: buyerLawyer.id,
    sellerLawyer, buyerLawyer, updatedAt: now(),
  };
  s.lawyerDetails = [rec];
  touch(s, b);
  return { status: true, data: { lawyerDetailsData: clone(rec) }, message: prev ? 'Updated Lawyer Details Successfully.' : 'Created Lawyer Details Successfully.' };
};

/* ------------------------------ list helpers ------------------------------ */
const closings = Array.from({ length: 8 }, (_, i) => {
  const cities = ['Toronto', 'Mississauga', 'Brampton', 'Oakville', 'Markham', 'Vaughan'];
  const streets = ['Maple Ave', 'Lakeshore Blvd', 'King St', 'Oak Lane', 'Bayview Dr', 'Queen St W', 'Yonge St', 'Dundas St'];
  const addr = `${200 + i * 9} ${streets[i % 8]}, ${cities[i % 6]}, ON`;
  const closeIn = i < 4 ? 2 + i * 5 : 35 + i * 6;
  return {
    id: 700 + i, uuid: `ts-close-${i + 1}`, tradeSheetTypeId: `TS-2026-${String(30 + i).padStart(4, '0')}`,
    status: ['approved', 'underReview', 'approved', 'closed'][i % 4], createdAt: dayAhead(-45 - i), createdBy: 10 + (i % 6), sharedUsers: [],
    buyerInformations: [], sellerInformations: [], lawyerDetails: null, propertyListing: null,
    properties: [{
      id: 700 + i, propertyAddress: addr, address: addr, city: cities[i % 6], state: 'ON', closingDate: dayAhead(closeIn), contractDate: dayAhead(-30 - i),
      salesPrice: String(720000 + i * 38000), soldPrice: String(725000 + i * 38000), listingPrice: String(735000 + i * 38000),
    }],
  };
});

const setArchive = (s: Rec) => { s.status = 'archive'; s.updatedAt = now(); };
const softDelete = (s: Rec) => { s.deletedAt = now(); };
const noteOwner = { id: 10, firstName: 'Olivia', lastName: 'Hart', name: 'Olivia Hart' };
const sharedFind = (id: any) => {
  for (const s of sheets) {
    const u = (s.sharedUsers || []).find((x: any) => String(x.id) === String(id));
    if (u) return { s, u };
  }
  return null;
};
const attFind = (kind: 'paperWorkAttachmentFiles' | 'paperWorkOtherAttachments', id: any) => {
  for (const s of sheets) {
    const a = (s[kind] || []).find((x: any) => String(x.id) === String(id));
    if (a) return { s, a };
  }
  return null;
};
const fileExt = (f: any) => {
  const n = String(f?.name || '');
  const m = n.match(/\.[a-z0-9]+$/i);
  return m ? m[0].toLowerCase() : '.pdf';
};
const safeName = (n: string) => String(n || 'document').toLowerCase().replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'document';
const pushSheetStatus = (s: Rec) => { if (s && ['approved', 'rejected', 'draft', 'pending'].includes(s.status)) s.status = 'underReview'; };

/* ------------------------------ routes ------------------------------ */
export const tradesheetRoutes = [
  // ----- wizard steps
  route('POST', `${BASE}/create-update-agent-basic-info`, saveBasicInfo),
  route('POST', `${BASE}/create-update-property-details`, saveProperty),
  route('POST', `${BASE}/create-update-seller-informations`, savePeople('sellers', 'sellerInformations', 'createdSellers')),
  route('POST', `${BASE}/create-update-buyer-informations`, savePeople('buyers', 'buyerInformations', 'createdBuyers')),
  route('POST', `${BASE}/create-update-agent-details`, saveAgentDetails),
  route('POST', `${BASE}/create-update-lawyer-details`, saveLawyerDetails),
  route('POST', `${BASE}/create-update-ext-agent`, ({ body }) => ({
    status: true, data: { id: nextId(), uuid: uid('ext'), ...(body || {}), createdAt: now() }, message: 'Agent created successfully.',
  })),
  route('GET', `${BASE}/get-my-leads`, () => ok({
    leads: [
      { id: 1, name: 'Hannah Moore', phone: '416-555-0111', campaign: { id: 1, name: 'Spring Open House' } },
      { id: 2, name: 'Peter Grant', phone: '416-555-0122', campaign: { id: 2, name: 'Condo Launch' } },
      { id: 3, name: 'Rosa Diaz', phone: '905-555-0133', campaign: { id: 1, name: 'Spring Open House' } },
    ],
  })),

  // ----- reads
  route('GET', `${BASE}/get-spacific-trade-sheet`, ({ query }) => {
    const s = byUuid(query.uuid) || blankSheet(query.uuid || 'new');
    return ok({ tradeSheetData: clone(s) });
  }),
  route('GET', `${BASE}/get-trade-sheet-list`, () => ok({ tradeSheetData: clone(sheets.filter((s) => live(s) && !isArchived(s))) })),
  route('GET', `${BASE}/get-archive-trade-sheet-list`, () => ok({ tradeSheetData: clone(sheets.filter((s) => live(s) && isArchived(s))) })),
  route('GET', `${BASE}/get-trade-sheet-list-based-on-closing`, () => {
    const horizon = Date.now() + 120 * DAY;
    const mine = sheets.filter((s) => live(s) && !isArchived(s) && s.id >= 100 && s.properties?.[0]?.closingDate
      && new Date(s.properties[0].closingDate).getTime() > Date.now() - DAY && new Date(s.properties[0].closingDate).getTime() < horizon);
    return ok({ tradeSheetData: [...clone(closings), ...clone(mine)] });
  }),

  // ----- status / archive / delete
  route('POST', `${BASE}/change-trade-sheet-status`, ({ query, body }) => {
    const s = byUuid(query.uuid);
    if (s && body?.status) { s.tradeStatus = body.status; s.closedAt = body.status === 'closed' ? now() : null; s.updatedAt = now(); }
    return ok({ updatedTradeSheet: clone(s || {}) }, 'Trade sheet status updated successfully.');
  }),
  route('POST', `${BASE}/change-trade-admin-status`, ({ query, body }) => {
    const s = byUuid(query.uuid);
    if (s && body?.status) {
      s.status = body.status;
      s.rejectReasonMain = body.status === 'rejected' ? body.rejectReasonMain || null : s.rejectReasonMain;
      if (body.status === 'rejected') s.rejectCount = (s.rejectCount || 0) + 1;
      if (body.status === 'approved') s.approvedAt = now();
      s.updatedAt = now();
    }
    return ok({ updatedTradeSheet: clone(s || {}) }, 'Trade sheet status updated successfully.');
  }),
  route('POST', `${BASE}/archive-specific-trade-sheet`, ({ body }) => {
    const s = byUuid(body?.uuid);
    if (s) setArchive(s);
    return { status: true, data: { status: 'archive' }, message: 'Trade sheet archived successfully.' };
  }),
  route('POST', `${BASE}/archive-multiple-trade-sheets`, ({ body }) => {
    (Array.isArray(body?.uuids) ? body.uuids : []).forEach((u: string) => { const s = byUuid(u); if (s) setArchive(s); });
    return { status: true, message: 'Trade sheets archived successfully.' };
  }),
  route('DELETE', `${BASE}/delete-spacific-trade-sheet`, ({ query }) => {
    const s = byUuid(query.uuid);
    if (s) softDelete(s);
    return { status: true, message: 'Trade sheet deleted successfully.' };
  }),
  route('DELETE', `${BASE}/delete-multiple-trade-sheet`, ({ body }) => {
    (Array.isArray(body?.uuids) ? body.uuids : []).forEach((u: string) => { const s = byUuid(u); if (s) softDelete(s); });
    return { status: true, message: 'Trade sheets deleted successfully.' };
  }),
  route('POST', `${BASE}/toggle-important-file`, ({ body }) => {
    const s = byUuid(body?.tradeSheetUuid);
    const fid = num(body?.uploadFileNameId);
    if (s && fid != null) {
      const list: any[] = s.tradeSheetImportantFiles || [];
      s.tradeSheetImportantFiles = list.some((f) => f.uploadFileNameId === fid) ? list.filter((f) => f.uploadFileNameId !== fid) : [...list, { uploadFileNameId: fid }];
    }
    return ok({ importantFileIds: (s?.tradeSheetImportantFiles || []).map((f: any) => f.uploadFileNameId) }, 'Important file updated.');
  }),

  // ----- conditions (property details step)
  route('GET', `${BASE}/get-tradesheet-conditional-detail`, ({ query }) => {
    const s = byId(query.tradeSheetId);
    return ok({ ConditionData: clone(s?.conditions || []) });
  }),
  route('POST', `${BASE}/create-update-tradesheet-conditional-detail`, ({ query, body }) => {
    const b = body || {};
    const s = byId(b.tradeSheetId);
    let rec: any;
    if (s) {
      const existing = query.id ? s.conditions.find((c: any) => String(c.id) === String(query.id)) : null;
      if (existing) {
        Object.assign(existing, { conditionType: b.conditionType, dueDate: iso(b.dueDate), conditionMetDate: iso(b.conditionMetDate), completeStatus: b.completeStatus || existing.completeStatus, updatedAt: now() });
        rec = existing;
      } else {
        rec = { id: nextId(), tradeSheetId: s.id, conditionType: b.conditionType, dueDate: iso(b.dueDate), conditionMetDate: iso(b.conditionMetDate), completeStatus: b.completeStatus || 'no', createdAt: now(), updatedAt: now() };
        s.conditions.unshift(rec);
      }
    }
    return ok({ ConditionData: clone(rec || {}) }, query.id ? 'Data updated successfully' : 'Data created successfully');
  }),
  route('POST', `${BASE}/update-condition-status`, ({ query, body }) => {
    for (const s of sheets) {
      const c = (s.conditions || []).find((x: any) => String(x.id) === String(query.id));
      if (c) { c.completeStatus = body?.completeStatus || c.completeStatus; c.conditionMetDate = c.completeStatus === 'yes' ? now() : null; return ok({ ConditionData: clone(c) }, 'Condition status updated successfully'); }
    }
    return ok({ ConditionData: {} }, 'Condition status updated successfully');
  }),
  route('DELETE', `${BASE}/delete-tradesheet-conditional-detail`, ({ query }) => {
    sheets.forEach((s) => { s.conditions = (s.conditions || []).filter((c: any) => String(c.id) !== String(query.id)); });
    return { status: true, message: 'Data deleted successfully' };
  }),

  // ----- notes
  route('GET', `${BASE}/get-tradesheet-notes`, ({ query }) => {
    const list = notes.filter((n) => String(n.tradeSheetId) === String(query.tradeSheetId));
    return ok({ NoteData: clone(list) });
  }),
  route('POST', `${BASE}/create-update-tradesheet-note`, ({ query, body }) => {
    const b = body || {};
    const existing = query.uuid && query.uuid !== 'null' && query.uuid !== 'undefined' ? notes.find((n) => n.uuid === query.uuid) : null;
    let rec: any;
    if (existing) {
      existing.note = b.note ?? existing.note;
      existing.updatedAt = now();
      rec = existing;
    } else {
      const u = uid('note');
      rec = { id: nextId(), uuid: u, slug: u, note: b.note || '', tradeSheetId: num(b.tradeSheetId), createdBy: 10, owner: noteOwner, createdAt: now(), updatedAt: now() };
      notes.push(rec);
    }
    return ok({ NoteData: clone(rec) }, existing ? 'Data updated successfully' : 'Data created successfully');
  }),
  route('DELETE', `${BASE}/delete-tradesheet-note`, ({ query }) => {
    const i = notes.findIndex((n) => n.uuid === query.uuid);
    if (i >= 0) notes.splice(i, 1);
    return { status: true, message: 'Data deleted successfully' };
  }),
  route('DELETE', `${BASE}/delete-multiple-tradesheet-notes`, ({ body }) => {
    const set = new Set(Array.isArray(body?.uuids) ? body.uuids : []);
    for (let i = notes.length - 1; i >= 0; i--) if (set.has(notes[i].uuid)) notes.splice(i, 1);
    return { status: true, message: 'Deleted successfully' };
  }),

  // ----- shared users
  route('POST', `${BASE}/shared-users/add`, ({ query, body }) => {
    const b = body || {};
    const s = ensure(query.uuid);
    const repType = b.representationType || s.representation;
    if (s.sharedUsers.some((u: any) => String(u.sharedUserId) === String(b.sharedUserId) && u.representationType === repType)) {
      throw fail(400, 'This user is already added as a shared user.');
    }
    const rec = {
      id: nextId(), tradeSheetId: s.id, sharedUserId: num(b.sharedUserId), firstName: str(b.firstName), lastName: str(b.lastName),
      name: `${str(b.firstName)} ${str(b.lastName)}`.trim(), email: str(b.email), commissionType: b.commissionType || 'percentage',
      commission: num(b.commission, 0), representationType: repType, userType: 'Shared', status: 'approved', createdAt: now(),
    };
    s.sharedUsers.push(rec);
    return { status: true, data: clone(rec), message: 'Shared user added successfully.' };
  }),
  route('DELETE', `${BASE}/shared-users/remove`, ({ query }) => {
    const f = sharedFind(query.id);
    if (f) f.s.sharedUsers = f.s.sharedUsers.filter((u: any) => u !== f.u);
    return { status: true, message: 'Shared user removed successfully.' };
  }),
  route('PUT', `${BASE}/shared-users/commission`, ({ query, body }) => {
    const f = sharedFind(query.id);
    if (f) {
      if (body?.commission !== undefined) f.u.commission = num(body.commission, 0);
      if (body?.commissionType) f.u.commissionType = body.commissionType;
    }
    return ok({ sharedUser: clone(f?.u || {}) }, 'Shared user commission updated successfully.');
  }),
  route('GET', `${BASE}/shared-users/by-representation`, ({ query }) => {
    const s = byUuid(query.uuid);
    const list = (s?.sharedUsers || []).filter((u: any) => !query.representationType || u.representationType === query.representationType);
    return ok({ sharedUsers: clone(list) });
  }),

  // ----- paperwork attachments
  route('POST', `${BASE}/upload-paper-work-file-attachment`, ({ query, body }) => {
    const s = byId(query.tradeSheetId);
    const file: any = body?.attachment;
    const fid = num(query.uploadFileNameId, 0);
    const fileName = `${safeName(file?.name || fileNameById(fid))}-${Math.floor(1000 + Math.random() * 9000)}${fileExt(file)}`;
    const rec = {
      id: nextId(), tradeSheetId: num(query.tradeSheetId), uploadFileNameId: fid, propertyListingAttachmentId: null,
      filePath: `TradeSheets/TradeId-${query.tradeSheetId}/paperwork-attachment/${fileName}`, status: 'underReview', rejectReason: null, rejectCount: 0,
      createdAt: now(), updatedAt: now(), uploadFileName: { id: fid, name: fileNameById(fid) },
    };
    if (s) { s.paperWorkAttachmentFiles.push(rec); pushSheetStatus(s); }
    return { status: true, data: { newFileAttachment: clone(rec) }, message: 'File attachment created successfully.' };
  }),
  route('POST', `${BASE}/resubmit-paper-work-file-attachment`, ({ query, body }) => {
    const f = attFind('paperWorkAttachmentFiles', query.id);
    const file: any = body?.attachment;
    if (f) {
      f.a.status = 'underReview'; f.a.updatedAt = now();
      if (file?.name) f.a.filePath = f.a.filePath.replace(/[^/\\]+$/, `${safeName(file.name)}-${Math.floor(1000 + Math.random() * 9000)}${fileExt(file)}`);
      pushSheetStatus(f.s);
    }
    return { status: true, data: { newFileAttachment: clone(f?.a || {}) }, message: 'File attachment resubmitted successfully.' };
  }),
  route('DELETE', `${BASE}/delete-paper-work-file-attachment`, ({ query }) => {
    const f = attFind('paperWorkAttachmentFiles', query.id);
    if (f) f.s.paperWorkAttachmentFiles = f.s.paperWorkAttachmentFiles.filter((a: any) => a !== f.a);
    return { status: true, data: { deletedFileAttachment: clone(f?.a || {}) }, message: 'File attachment deleted successfully.' };
  }),
  route('POST', `${BASE}/upload-other-document`, ({ query, body }) => {
    const s = byId(query.tradeSheetId);
    const file: any = body?.attachment;
    const name = `${safeName(body?.fileName || file?.name)}-${Math.floor(1000 + Math.random() * 9000)}${fileExt(file)}`;
    const rec = {
      id: nextId(), tradeSheetId: num(query.tradeSheetId), propertyListingOtherAttachmentId: null,
      filePath: `TradeSheets/TradeId-${query.tradeSheetId}/other-attachment/${name}`, status: 'underReview', rejectReason: null, rejectCount: 0,
      createdAt: now(), updatedAt: now(),
    };
    if (s) { s.paperWorkOtherAttachments.push(rec); pushSheetStatus(s); }
    return { status: true, data: { newOtherAttachment: clone(rec) }, message: 'Other document uploaded successfully.' };
  }),
  route('POST', `${BASE}/resubmit-other-document`, ({ query }) => {
    const f = attFind('paperWorkOtherAttachments', query.id);
    if (f) { f.a.status = 'underReview'; f.a.updatedAt = now(); pushSheetStatus(f.s); }
    return { status: true, data: { updatedOtherAttachment: clone(f?.a || {}) }, message: 'Other document resubmitted successfully.' };
  }),
  route('DELETE', `${BASE}/delete-other-attachment`, ({ query }) => {
    const f = attFind('paperWorkOtherAttachments', query.id);
    if (f) f.s.paperWorkOtherAttachments = f.s.paperWorkOtherAttachments.filter((a: any) => a !== f.a);
    return { status: true, data: { deletedFileAttachment: clone(f?.a || {}) }, message: 'Other document deleted successfully.' };
  }),
  route('POST', `${BASE}/change-change-trade-sheet-attachment-status`, ({ query, body }) => {
    const f = attFind('paperWorkAttachmentFiles', query.id);
    if (f && body?.status) {
      f.a.status = body.status;
      f.a.rejectReason = body.status === 'rejected' ? body.rejectReason || null : null;
      if (body.status === 'rejected') f.a.rejectCount = (f.a.rejectCount || 0) + 1;
      f.a.updatedAt = now();
    }
    return { status: true, data: { updatedPaperworkAttachmentFile: clone(f?.a || {}) }, message: 'Attachment status updated successfully.' };
  }),
  route('POST', `${BASE}/change-change-trade-sheet-other-attachment-status`, ({ query, body }) => {
    const f = attFind('paperWorkOtherAttachments', query.id);
    if (f && body?.status) {
      f.a.status = body.status;
      f.a.rejectReason = body.status === 'rejected' ? body.rejectReason || null : null;
      if (body.status === 'rejected') f.a.rejectCount = (f.a.rejectCount || 0) + 1;
      f.a.updatedAt = now();
    }
    return { status: true, data: { updatedPaperworkAttachmentFile: clone(f?.a || {}) }, message: 'Attachment status updated successfully.' };
  }),

  // ----- dropdown / lookup data used by the wizard pages
  route('GET', 'common/countries', () => ({ status: true, data: { countries: [COUNTRY, { id: 1, countryName: 'Canada', shortName: 'CA' }] }, message: 'Countries retrieved successfully' })),
  route('GET', 'common/states', () => ({ status: true, data: { states: STATES }, message: 'States retrieved successfully' })),
  route('GET', 'common/cities', ({ query }) => {
    const sid = num(query.state_id);
    const list = (sid == null ? CITIES : CITIES.filter((c) => c.stateId === sid)).map((c) => ({ id: c.id, name: c.name, stateId: c.stateId }));
    return { status: true, data: { cities: list }, message: 'Cities retrieved successfully' };
  }),
  route('GET', 'common/dynamic-upload-file-management/get-upload-file-categories', ({ query }) => {
    const listing = String(query.slug || '').includes('listing');
    return ok({
      uploadFileCategoryData: {
        id: listing ? 1 : 2, slug: query.slug || (listing ? 'listing-paperwork' : 'co-op-paperwork'), name: listing ? 'Listing Paperwork' : 'Co-op Paperwork',
        uploadFileNames: clone(listing ? LISTING_FILES : COOP_FILES),
      },
    });
  }),
  route('GET', 'common/dynamic-upload-file-management/get-additional-file-categories', ({ query }) => ok({
    uploadFileCategoryData: { id: 3, slug: query.slug || 'additional-paperwork', name: 'Additional Paperwork', uploadFileNames: clone(ADDITIONAL_FILES) },
  })),

  route('GET', 'superadmin/brokerage/list', () => ok({ brokerageData: clone(brokerages) })),
  route('POST', 'superadmin/brokerage/validate', () => ({ status: true, message: 'Phone number is available.' })),
  route('POST', 'superadmin/brokerage/create', ({ body }) => {
    const b = body || {};
    const rec = mkBrokerage(nextId(), str(b.brokerageName) || 'New Brokerage', str(b.address), num(b.stateId, 1), num(b.cityId, 1), str(b.postalZipCode), str(b.phoneNumber), {
      streetAddress: str(b.streetAddress), faxNumber: str(b.faxNumber), billingEmailAddress: str(b.billingEmailAddress),
    });
    brokerages.push(rec);
    return { status: true, data: { brokerageData: clone(rec) }, message: 'Brokerage created successfully.' };
  }),

  route('GET', 'superadmin/lawyer-firm/list', () => ok({ lawyerFirm: clone(firms.map(firmWithLawyers)) })),
  route('POST', 'superadmin/lawyer-firm/validate', () => ({ status: true, message: 'Phone number is available.' })),
  route('POST', 'superadmin/lawyer-firm/create', ({ body }) => {
    const b = body || {};
    const stateId = num(b.stateId, 1);
    const cityId = num(b.cityId, 1);
    const rec = {
      id: nextId(), uuid: uid('firm'), firmName: str(b.firmName) || 'New Law Firm', address: str(b.address), streetAddress: str(b.streetAddress), streetAddressLine2: '',
      postalZipCode: str(b.postalZipCode), phoneNumber: str(b.phoneNumber), faxNumber: str(b.faxNumber), billingEmailAddress: str(b.billingEmailAddress),
      email: str(b.billingEmailAddress), countryId: 39, stateId, cityId, country: COUNTRY, state: stateObj(stateId), city: cityObj(cityId), createdAt: now(),
    };
    firms.push(rec);
    return { status: true, data: { lawyerFirm: clone(rec) }, message: 'Law firm created successfully.' };
  }),
  route('GET', 'superadmin/lawyer/list', () => ok({ lawyerData: clone(lawyers.map(lawyerWithFirm)) })),
  route('POST', 'superadmin/lawyer/create', ({ body }) => {
    const b = body || {};
    const firm = firms.find((f) => String(f.id) === String(b.firmId));
    const rec = {
      id: nextId(), uuid: uid('lw'), firstName: str(b.firstName), lastName: str(b.lastName), name: `${str(b.firstName)} ${str(b.lastName)}`.trim(),
      email: str(b.email), phoneNumber: str(b.phoneNumber), cellPhoneNumber: str(b.cellPhoneNumber), faxNumber: str(b.faxNumber), address: str(b.address),
      streetAddress: str(b.streetAddress), postalZipCode: str(b.postalZipCode), countryId: 39, stateId: num(b.stateId), cityId: num(b.cityId),
      country: COUNTRY, state: stateObj(b.stateId), city: cityObj(b.cityId), firmId: firm?.id ?? num(b.firmId), lawyerFirmName: firm?.firmName || '',
    };
    lawyers.push(rec);
    return { status: true, data: { lawyerData: clone(rec) }, message: 'Lawyer created successfully.' };
  }),
] as ReturnType<typeof route>[];
