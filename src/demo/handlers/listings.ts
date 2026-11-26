/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from '../route';
import * as seed from '../seed';

/* ------------------------------------------------------------------ */
/* Stateful in-memory Property Listing store (regular + mere listings) */
/* ------------------------------------------------------------------ */

const DAY = 86400000;
const day = (n: number) => new Date(Date.now() - n * DAY).toISOString();
const now = () => new Date().toISOString();
const ok = (data: any, message = 'Data retrieved successfully') => ({ status: true, data, message });
const fail = (message: string) => ({ status: false, message });
const clean = (v: any) => (v === undefined || v === null || v === 'undefined' || v === 'null' ? null : v);
const num = (v: any) => {
  const n = Number(clean(v));
  return Number.isFinite(n) && clean(v) !== null && v !== '' ? n : null;
};

const ST_REGULAR = ['listed', 'New', 'Price Change', 'Extended', 'DFT', 'Exclusive', 'listed', 'Sold', 'Terminated', 'Suspended', 'Expired', 'listed', 'New', 'Sold', 'Price Change', 'listed', 'Extended', 'Expired', 'Exclusive', 'listed', 'Sold', 'New', 'Terminated', 'listed'];
const ST_MERE = ['listed', 'listed', 'sold', 'listed', 'expired', 'listed', 'terminated', 'listed', 'leased', 'listed', 'suspended', 'listed'];
const ADMIN_STATUS = ['approved', 'approved', 'underReview', 'approved', 'draft', 'approved', 'rejected', 'approved', 'pendingMls', 'approved'];
const PROP_TYPES = ['Detached', 'Semi Detached', 'Condo Apt', 'Freehold Townhome', 'Condo Townhome', 'Residential Freehold'];

const DEMO_USER = { id: 1, firstName: 'Ava', lastName: 'Morgan', name: 'Ava Morgan', email: 'superadmin@ans.demo', profilePicture: null };
const AGENT_USERS: any[] = (seed.agents as any[]).map((a) => ({
  id: a.user?.id ?? a.id, firstName: a.user?.firstName, lastName: a.user?.lastName, name: a.name,
  email: a.email || `${String(a.user?.firstName || 'agent').toLowerCase()}@ans.demo`, profilePicture: null,
}));
const ALL_USERS = [DEMO_USER, ...AGENT_USERS];
const userById = (id: any) => ALL_USERS.find((u) => String(u.id) === String(id)) || DEMO_USER;
const pubUser = (u: any) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, name: u.name, email: u.email, profilePicture: null });

/* ---- reference data (countries / states / cities / branches) ---- */
const COUNTRY = { id: 1, countryName: 'Canada', shortName: 'CA', name: 'Canada' };
const STATES: any[] = [
  { id: 1, name: 'Ontario' }, { id: 2, name: 'British Columbia' }, { id: 3, name: 'Alberta' }, { id: 4, name: 'Quebec' },
  { id: 5, name: 'Manitoba' }, { id: 6, name: 'Nova Scotia' }, { id: 7, name: 'Saskatchewan' }, { id: 8, name: 'New Brunswick' },
];
const CITIES: any[] = [
  { id: 1, name: 'Toronto', stateId: 1 }, { id: 2, name: 'Mississauga', stateId: 1 }, { id: 3, name: 'Ottawa', stateId: 1 },
  { id: 4, name: 'Vancouver', stateId: 2 }, { id: 5, name: 'Calgary', stateId: 3 }, { id: 6, name: 'Brampton', stateId: 1 },
  { id: 7, name: 'Hamilton', stateId: 1 }, { id: 8, name: 'London', stateId: 1 }, { id: 9, name: 'Montreal', stateId: 4 },
  { id: 10, name: 'Winnipeg', stateId: 5 }, { id: 11, name: 'Halifax', stateId: 6 }, { id: 12, name: 'Saskatoon', stateId: 7 },
  { id: 13, name: 'Fredericton', stateId: 8 }, { id: 14, name: 'Oakville', stateId: 1 }, { id: 15, name: 'Markham', stateId: 1 },
];
const cityByName = (n: string) => CITIES.find((c) => c.name === n) || CITIES[0];
const BRANCH = { id: 1, uuid: 'br-uuid-1', name: 'ANS RealStateCRM - Toronto', slug: 'toronto-downtown' };

/* ---- upload file names (paperwork) ---- */
const FILE_NAMES: [string, string, string, string, string][] = [
  // name, representation, paperType, listType, showOnPropertyListing
  ['Listing Agreement (Form 200)', 'seller,landlord', 'singleUpload', 'Both', 'Yes'],
  ['Seller Property Information Statement', 'seller,landlord', 'singleUpload', 'Residential', 'Yes'],
  ['MLS Data Information Form', 'seller,landlord', 'singleUpload', 'Both', 'Yes'],
  ['Schedule A to Listing Agreement', 'seller,landlord', 'multipleUpload', 'Both', 'Yes'],
  ['RECO Information Guide', 'seller,landlord', 'singleUpload', 'Both', 'Yes'],
  ['Commercial Listing Addendum', 'seller,landlord', 'singleUpload', 'Commercial', 'Yes'],
  ['Seller Photo ID', 'seller,landlord', 'singleUpload', 'Both', 'Yes'],
  ['Confirmation of Co-operation (Form 320)', 'buyer,tenant', 'singleUpload', 'Both', 'Yes'],
  ['Buyer Representation Agreement', 'buyer,tenant', 'singleUpload', 'Both', 'Yes'],
  ['Agreement of Purchase and Sale', 'seller,buyer,landlord,tenant', 'singleUpload', 'Both', 'No'],
  ['Deposit Receipt', 'buyer,seller', 'multipleUpload', 'Both', 'No'],
];
const UPLOAD_FILE_NAMES = FILE_NAMES.map((f, i) => ({
  id: i + 1, uploadFileCategoryId: i < 7 ? 1 : 2, uuid: `pl-fname-${String(i + 1).padStart(4, '0')}`, slug: `pl-file-name-${i + 1}`,
  name: f[0], representation: f[1], paperType: f[2], required: 'yes', hasAdditionalFile: 'yes',
  showOnPropertyListing: f[4], propertyListingRequired: i < 3 ? 'Yes' : 'No', listType: f[3], status: 'active',
  createdAt: day(200 - i), updatedAt: day(20), sellerOrder: i + 1, buyerOrder: i + 1, tenantOrder: i + 1, landlordOrder: i + 1,
}));
const fileNameById = (id: any) => UPLOAD_FILE_NAMES.find((f) => String(f.id) === String(id)) || null;

/* ---- records ---- */
let listings: any[] = [];
let notes: any[] = [];
let activitySeq = 1;
let attachSeq = 500;
let noteSeq = 1000;
let idSeq = 1000;
const counters = { regular: 99, mere_listing: 99 };

const logActivity = (rec: any, text: string) => {
  rec.activityLog = rec.activityLog || [];
  rec.activityLog.push({
    id: activitySeq++, uuid: `act-${activitySeq}`, propertyListingId: rec.id, userId: DEMO_USER.id, userName: DEMO_USER.name,
    activityArea: 'property-listing', action: 'update', tableName: 'propertyListing', historyText: text, createdAt: now(),
  });
};

const withLocation = (rec: any) => {
  const city = CITIES.find((c) => c.id === Number(rec.cityId));
  const state = STATES.find((s) => s.id === Number(rec.stateId));
  rec.country = rec.countryId ? COUNTRY : null;
  rec.state = state || null;
  rec.city = city ? { id: city.id, name: city.name } : null;
  return rec;
};

const makeSeed = (i: number, kind: 'regular' | 'mere_listing', n0: number) => {
  const base: any = (seed.properties as any[])[(i + n0) % seed.properties.length];
  const creator = AGENT_USERS[i % AGENT_USERS.length];
  const shared = i % 3 === 0 ? [AGENT_USERS[(i + 1) % AGENT_USERS.length]] : [];
  const rent = i % 5 === 4;
  const statuses = kind === 'regular' ? ST_REGULAR : ST_MERE;
  const adminStatus = ADMIN_STATUS[i % ADMIN_STATUS.length];
  const city = cityByName(base.city);
  const id = n0 + i + 1;
  const commercial = i % 7 === 3;
  const rec: any = {
    ...base,
    id,
    uuid: `${kind === 'regular' ? 'pl' : 'ml'}-demo-${String(i + 1).padStart(4, '0')}`,
    slug: `listing-${id}`,
    propertyListingTypeId: `${kind === 'regular' ? 'PL' : 'ML'}-2026-${String(i + 1).padStart(4, '0')}`,
    listingType: kind,
    mlsNumber: i % 7 === 6 ? null : `W${5500000 + (n0 + i) * 53}`,
    propertyListingType: rent ? 'For rent' : 'For sale',
    listType: commercial ? 'Commercial' : 'Residential',
    propertyType: commercial ? 'Office' : PROP_TYPES[i % PROP_TYPES.length],
    otherPropertyType: null,
    listingStatus: statuses[i % statuses.length],
    status: adminStatus,
    rejectReason: adminStatus === 'rejected' ? 'Missing signed listing agreement.' : null,
    rejectCount: adminStatus === 'rejected' ? 1 : 0,
    listingPrice: String(rent ? 2400 + (i % 6) * 250 : Number(base.listingPrice) || 600000),
    askingPrice: String(rent ? 2400 + (i % 6) * 250 : Number(base.listingPrice) || 600000),
    contractDate: day(10 + i * 5),
    offerDate: null,
    listingDate: day(10 + i * 5),
    expiryDate: day(i * 11 - 90),
    conditionExpiryDate: null,
    countryId: 1,
    stateId: city.stateId,
    cityId: city.id,
    postalCode: 'M5V 2T6',
    address: base.address,
    addressTwo: '',
    lockbox: i % 2 ? 'LB-' + (4000 + i) : '',
    createdBy: creator.id,
    createdUser: pubUser(creator),
    branchId: 1,
    branch: BRANCH,
    sharedUsers: shared.map((u, k) => ({
      id: id * 10 + k, propertyListingId: id, sharedUserId: u.id, userId: u.id, firstName: u.firstName, lastName: u.lastName,
      name: u.name, email: u.email, userType: 'Shared', commissionType: 'percentage', commission: null, userPercentage: null, status: 'approved',
    })),
    propertyListingAttachment: [],
    propertyListingOtherAttachment: [],
    attachments: [],
    paperworkAttachments: [],
    listingAttachments: [],
    tradeSheet: [],
    tradeCommissionInvoiceRecords: [],
    activityLog: [],
    sellersInfo: JSON.stringify({
      sellersInfo: [{ firstName: 'Walter', lastName: 'Bishop', email: `walter${i + 1}@example.com`, phoneNumber: '416-555-0142' }],
    }),
    firstPicturePath: null, listingAgreementPath: null, mlsDataSheetPath: null, recoGuidePath: null,
    createdAt: day(12 + i * 5),
    updatedAt: day(2 + i),
  };
  withLocation(rec);
  if (i % 4 === 0) {
    notes.push({
      id: id * 10, uuid: `note-demo-${id}`, createdBy: creator.id, note: 'Seller requested weekend showings only.',
      createdAt: day(3 + i), propertyListingId: id, owner: pubUser(creator),
    });
  }
  if (i % 3 === 0) {
    rec.propertyListingAttachment.push({
      id: id * 10 + 1, propertyListingId: id, uploadFileNameId: 1, filePath: `uploads/property-listing/listing-agreement-${id}.pdf`,
      status: adminStatus === 'rejected' ? 'rejected' : 'approved', rejectReason: adminStatus === 'rejected' ? 'Signature missing.' : null,
      rejectCount: 0, createdAt: day(8 + i), updatedAt: day(8 + i), uploadFileName: fileNameById(1),
    });
  }
  rec.activityLog.push({
    id: activitySeq++, propertyListingId: id, userId: creator.id, userName: creator.name, action: 'create', tableName: 'propertyListing',
    historyText: `Create a new property listing ${base.propertyAddress}`, createdAt: rec.createdAt,
  });
  return rec;
};

listings = [
  ...Array.from({ length: 24 }, (_, i) => makeSeed(i, 'regular', 0)),
  ...Array.from({ length: 12 }, (_, i) => makeSeed(i, 'mere_listing', 100)),
];

const find = (uuid: any) => listings.find((l) => l.uuid === uuid);
const findById = (id: any) => listings.find((l) => String(l.id) === String(id));
const noteWithRef = (n: any) => n;
const syncAttachmentAliases = (rec: any) => {
  rec.attachments = rec.propertyListingAttachment;
  rec.paperworkAttachments = rec.propertyListingAttachment;
  rec.listingAttachments = rec.propertyListingAttachment;
};

const FILE_KEYS: Record<string, string> = {
  firstPicture: 'firstPicturePath', listingAgreement: 'listingAgreementPath', mlsDataSheet: 'mlsDataSheetPath', recoGuide: 'recoGuidePath',
};
const FIELDS = [
  'mlsNumber', 'propertyListingType', 'countryId', 'stateId', 'cityId', 'postalCode', 'address', 'addressTwo', 'propertyAddress',
  'lockbox', 'contractDate', 'expiryDate', 'offerDate', 'conditionExpiryDate', 'listType', 'propertyType', 'otherPropertyType',
  'listingStatus', 'listingPrice', 'askingPrice', 'salesPrice', 'typeOfProperty',
];
const NUMERIC = ['countryId', 'stateId', 'cityId'];

const applyBody = (rec: any, body: any) => {
  const b = body || {};
  for (const k of FIELDS) {
    if (b[k] === undefined) continue;
    let v = clean(b[k]);
    if (v === '' && k !== 'addressTwo' && k !== 'lockbox') v = null;
    if (NUMERIC.includes(k)) v = num(v);
    if (k === 'listingPrice' || k === 'askingPrice') v = v === null ? v : String(v);
    rec[k] = v;
  }
  if (b.listingPrice !== undefined && b.askingPrice === undefined) rec.askingPrice = rec.listingPrice;
  if (clean(b.sellersInfo)) {
    rec.sellersInfo = typeof b.sellersInfo === 'string' ? b.sellersInfo : JSON.stringify(b.sellersInfo);
  }
  if (clean(b.status) && typeof b.status === 'string' && b.status !== 'undefined') rec.status = b.status;
  if (clean(b.branchId) !== null && b.branchId !== '') {
    rec.branchId = num(b.branchId) ?? rec.branchId;
    rec.branch = rec.branchId === 1 ? BRANCH : { ...BRANCH, id: rec.branchId, name: `Branch ${rec.branchId}`, uuid: `br-uuid-${rec.branchId}` };
  }
  for (const f of Object.keys(FILE_KEYS)) {
    const file = b[f];
    if (file && typeof file === 'object' && (file as any).name) rec[FILE_KEYS[f]] = `uploads/property-listing/${(file as any).name}`;
  }
  const agent = num(b.agentId);
  if (agent !== null) {
    rec.createdBy = agent;
    rec.createdUser = pubUser(userById(agent));
  }
  if (typeof b.sharedAgent === 'string' && b.sharedAgent) {
    try {
      const arr = JSON.parse(b.sharedAgent);
      if (Array.isArray(arr)) {
        rec.sharedUsers = arr.map((a: any, k: number) => {
          const uid = a.userId ?? a.value ?? a.id;
          const u = userById(uid);
          const first = a.firstName ?? u.firstName;
          const last = a.lastName ?? u.lastName;
          return {
            id: ++idSeq, propertyListingId: rec.id, sharedUserId: uid, userId: uid, firstName: first, lastName: last,
            name: `${first ?? ''} ${last ?? ''}`.trim(), email: a.email ?? u.email, userType: 'Shared', commissionType: 'percentage',
            commission: null, userPercentage: null, status: 'approved', _k: k,
          };
        });
      }
    } catch { /* ignore bad JSON */ }
  }
  if (!rec.propertyAddress) {
    const city = CITIES.find((c) => c.id === rec.cityId)?.name;
    const st = STATES.find((s) => s.id === rec.stateId)?.name;
    rec.propertyAddress = [rec.address, rec.addressTwo, city, st, rec.postalCode].filter(Boolean).join(', ');
  }
  withLocation(rec);
  rec.updatedAt = now();
};

const createOrUpdate = (uuidQ: any, body: any, forcedType?: 'regular' | 'mere_listing') => {
  const uuid = clean(uuidQ);
  const existing = uuid ? find(uuid) : null;
  if (existing) {
    applyBody(existing, body);
    logActivity(existing, `Updated property listing ${existing.propertyAddress || ''}`);
    return { rec: existing, created: false };
  }
  const kind: 'regular' | 'mere_listing' =
    forcedType || (clean(body?.listingType) === 'mere_listing' ? 'mere_listing' : 'regular');
  counters[kind] += 1;
  const id = ++idSeq;
  const creatorId = num(body?.agentId) ?? DEMO_USER.id;
  const rec: any = {
    id, uuid: `${kind === 'regular' ? 'pl' : 'ml'}-new-${id}`, slug: `listing-${id}`,
    propertyListingTypeId: `${kind === 'regular' ? 'PL' : 'ML'}-2026-${String(counters[kind]).padStart(4, '0')}`,
    listingType: kind, mlsNumber: null, propertyListingType: 'For sale', listType: 'Residential', propertyType: null, otherPropertyType: null,
    listingStatus: 'listed', status: 'approved', rejectReason: null, rejectCount: 0, listingPrice: null, askingPrice: null,
    contractDate: null, offerDate: null, expiryDate: null, conditionExpiryDate: null, listingDate: now(),
    countryId: 1, stateId: null, cityId: null, postalCode: null, address: null, addressTwo: '', propertyAddress: null, lockbox: '',
    createdBy: creatorId, createdUser: pubUser(userById(creatorId)), branchId: 1, branch: BRANCH, sharedUsers: [],
    propertyListingAttachment: [], propertyListingOtherAttachment: [], attachments: [], paperworkAttachments: [], listingAttachments: [],
    tradeSheet: [], tradeCommissionInvoiceRecords: [], activityLog: [], sellersInfo: null,
    firstPicturePath: null, listingAgreementPath: null, mlsDataSheetPath: null, recoGuidePath: null,
    createdAt: now(), updatedAt: now(),
  };
  applyBody(rec, body);
  logActivity(rec, `Create a new property listing ${rec.propertyAddress || ''}`);
  listings.unshift(rec);
  return { rec, created: true };
};

/* ---- presentation helpers ---- */
const detail = (rec: any) => {
  syncAttachmentAliases(rec);
  rec.notes = notes.filter((n) => n.propertyListingId === rec.id);
  return rec;
};
const listRow = (rec: any) => detail(rec);

/* find an attachment (regular or other) by id across all records */
const findAttachment = (id: any, other: boolean) => {
  for (const l of listings) {
    const arr: any[] = other ? l.propertyListingOtherAttachment : l.propertyListingAttachment;
    const idx = arr.findIndex((a) => String(a.id) === String(id));
    if (idx >= 0) return { l, arr, idx, a: arr[idx] };
  }
  return null;
};

const uploadedName = (file: any, fallback: string) => (file && typeof file === 'object' && file.name ? String(file.name) : fallback);

const uploadHandler = (other: boolean) => ({ query, body }: any) => {
  const rec = findById(query.propertyListingId);
  if (!rec) return fail('property Listing is required and not found.');
  if (rec.status === 'approved') {
    rec.status = 'underReview';
    logActivity(rec, 'Changed property listing status from approved to underReview');
  }
  const fn = other ? null : fileNameById(query.uploadFileNameId);
  const name = uploadedName(body?.attachment, `${other ? clean(body?.fileName) || 'other-document' : fn?.name || 'document'}.pdf`);
  const att: any = {
    id: ++attachSeq, propertyListingId: rec.id, uploadFileNameId: other ? num(query.uploadFileNameId) : fn?.id ?? num(query.uploadFileNameId),
    filePath: `uploads/property-listing/${rec.id}/${name.replace(/\s+/g, '-')}`, status: 'underReview', rejectReason: null, rejectCount: 0,
    createdAt: now(), updatedAt: now(), uploadFileName: other ? { id: null, name: clean(body?.fileName) || name } : fn,
    fileName: other ? clean(body?.fileName) || name : undefined, isOtherDocument: other || undefined,
  };
  (other ? rec.propertyListingOtherAttachment : rec.propertyListingAttachment).push(att);
  syncAttachmentAliases(rec);
  logActivity(rec, `Uploaded file ${name}`);
  return ok({ newFileAttachment: att }, 'File attachment created successfully.');
};

const deleteAttachmentHandler = (other: boolean) => ({ query }: any) => {
  const f = findAttachment(query.id, other);
  if (!f) return fail('File not found.');
  f.arr.splice(f.idx, 1);
  syncAttachmentAliases(f.l);
  logActivity(f.l, 'Deleted file attachment');
  return ok({ deletedFileAttachment: f.a }, 'File deleted successfully.');
};

const attachmentStatusHandler = (other: boolean) => ({ query, body }: any) => {
  const f = findAttachment(query.id, other);
  if (!f || !clean(body?.status)) return fail('Id and status are required.');
  f.a.status = body.status;
  if (body.status === 'rejected') f.a.rejectCount = (f.a.rejectCount || 0) + 1;
  if (clean(body?.rejectReason)) f.a.rejectReason = body.rejectReason;
  f.a.updatedAt = now();
  return ok(other ? { updatedOtherAttachmentFile: f.a } : { updatedPaperworkAttachmentFile: f.a }, 'Status updated successfully.');
};

const categoryHandler = ({ query }: any) => {
  const rep = String(query.representation || '').toLowerCase();
  const rows = UPLOAD_FILE_NAMES.filter((f) => !rep || f.representation.toLowerCase().includes(rep));
  return ok({ uploadFileCategoryData: { uploadFileNames: rows } });
};

const P = 'superadmin/property-listing';

export const listingsRoutes = [
  /* ---------- list / read ---------- */
  route('GET', `${P}/list`, ({ query }) => {
    const t = clean(query.listingType);
    const rows = (t ? listings.filter((l) => l.listingType === t) : listings).map(listRow);
    return ok({ propertyListingData: rows });
  }),
  route('GET', `${P}/get-spacific-property-listing`, ({ query }) => {
    const rec = find(query.uuid);
    if (!rec) return fail(clean(query.uuid) ? 'Property Listing not found.' : 'Uuid not found.');
    return ok({ propertyListingData: detail(rec) });
  }),

  /* ---------- create / update ---------- */
  route('POST', `${P}/create-and-update-full`, ({ query, body }) => {
    const { rec, created } = createOrUpdate(query.uuid, body);
    return ok({ propertyListingData: detail(rec) }, created ? 'Property listing created successfully' : 'Property listing updated successfully');
  }),
  route('POST', `${P}/create-and-update`, ({ query, body }) => {
    const { rec, created } = createOrUpdate(query.uuid, body);
    return ok({ propertyListingData: detail(rec) }, created ? 'Property listing created successfully' : 'Property listing updated successfully');
  }),
  route('POST', `${P}/create-and-update-full-on-tradesheet`, ({ body }) => {
    const { rec, created } = createOrUpdate(clean(body?.uuid), body);
    return ok({ propertyListingData: detail(rec) }, created ? 'Property listing created successfully' : 'Property listing updated successfully');
  }),
  route('POST', `${P}/sync-mls`, ({ query, body }) => {
    const rec = find(query.uuid);
    if (!rec) return fail('Property listing not found');
    rec.mlsNumber = clean(body?.mlsNumber) ?? rec.mlsNumber;
    logActivity(rec, `Synced MLS number ${rec.mlsNumber}`);
    return ok({ propertyListing: detail(rec), propertyListingData: detail(rec) }, 'MLS number synced successfully');
  }),
  route('POST', `${P}/sync-from-realtor`, ({ query, body }) => {
    const rec = find(query.uuid);
    if (!rec) return fail('Property listing not found');
    if (clean(body?.mlsNumber)) rec.mlsNumber = body.mlsNumber;
    logActivity(rec, 'Synced property data from Realtor');
    return ok({ propertyListing: detail(rec), propertyListingData: detail(rec) }, 'Property data synced successfully from Realtor');
  }),

  /* ---------- delete ---------- */
  route('DELETE', `${P}/delete`, ({ query }) => {
    listings = listings.filter((l) => l.uuid !== query.uuid);
    return { status: true, message: 'Property Listing Data deleted successfully' };
  }),
  route('DELETE', `${P}/delete-multiple`, ({ body }) => {
    const uuids: any[] = Array.isArray(body?.uuids) ? body.uuids : [];
    if (!uuids.length) return fail('Invalid UUID list provided');
    listings = listings.filter((l) => !uuids.includes(l.uuid));
    return { status: true, message: 'Deleted successfully' };
  }),

  /* ---------- status ---------- */
  route('POST', `${P}/change-property-listing-status`, ({ query, body }) => {
    const rec = find(query.uuid);
    if (!rec || !clean(body?.status)) return fail(rec ? 'Uuid and status are required.' : 'Property Listing not found.');
    const old = rec.status;
    if (body.status === 'rejected') rec.rejectCount = (rec.rejectCount || 0) + 1;
    rec.status = body.status;
    if (clean(body?.rejectReason)) rec.rejectReason = body.rejectReason;
    rec.updatedAt = now();
    if (old !== body.status) logActivity(rec, `Changed property listing status from ${old} to ${body.status}`);
    return ok({ updatedpropertyListing: detail(rec) }, 'Property Listing status updated successfully.');
  }),
  route('POST', `${P}/change-listing-status`, ({ query, body }) => {
    const rec = find(query.uuid);
    if (!rec || !clean(body?.status)) return fail(rec ? 'Uuid and status are required.' : 'Property Listing not found.');
    const old = rec.listingStatus;
    rec.listingStatus = body.status;
    rec.updatedAt = now();
    if (old !== body.status) logActivity(rec, `Changed property listing status from ${old} to ${body.status}`);
    return ok({ updatedpropertyListing: detail(rec) }, 'Property Listing status updated successfully.');
  }),

  /* ---------- attachments ---------- */
  route('POST', `${P}/upload-paper-work-file-attachment`, uploadHandler(false)),
  route('POST', `${P}/upload-paper-work-other-file-attachment`, uploadHandler(true)),
  route('DELETE', `${P}/delete-paper-work-file-attachment`, deleteAttachmentHandler(false)),
  route('DELETE', `${P}/delete-paper-work-other-file-attachment`, deleteAttachmentHandler(true)),
  route('POST', `${P}/change-property-listing-attachment-status`, attachmentStatusHandler(false)),
  route('POST', `${P}/change-property-listing-other-attachment-status`, attachmentStatusHandler(true)),
  route('POST', `${P}/resubmit-property-file-attachment`, ({ query, body }) => {
    const f = findAttachment(query.id, false) || findAttachment(query.id, true);
    if (!f) return fail('Previous File path is required and not found.');
    const name = uploadedName(body?.attachment, 'resubmitted-document.pdf');
    f.a.filePath = `uploads/property-listing/${f.l.id}/${name.replace(/\s+/g, '-')}`;
    f.a.status = 'underReview';
    f.a.rejectReason = null;
    f.a.updatedAt = now();
    syncAttachmentAliases(f.l);
    return ok({ newFileAttachment: f.a }, 'Property listing attachment resubmit successfully.');
  }),

  /* ---------- notes ---------- */
  route('GET', `${P}/get-property-listing-notes`, ({ query }) => {
    const rows = notes
      .filter((n) => String(n.propertyListingId) === String(query.propertyListingId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return ok({ NoteData: rows.map(noteWithRef) });
  }),
  route('POST', `${P}/create-update-property-listing-note`, ({ query, body }) => {
    const uuid = clean(query.uuid);
    const existing = uuid ? notes.find((n) => n.uuid === uuid) : null;
    if (existing) {
      if (body?.note !== undefined) existing.note = body.note;
      return ok({ NoteData: existing }, 'Note updated successfully');
    }
    const n = {
      id: ++noteSeq, uuid: `note-new-${noteSeq}`, createdBy: DEMO_USER.id, note: body?.note ?? '', createdAt: now(),
      propertyListingId: num(body?.propertyListingId), owner: pubUser(DEMO_USER),
    };
    notes.unshift(n);
    return ok({ NoteData: n }, 'Note created successfully');
  }),
  route('DELETE', `${P}/delete-property-listing-note`, ({ query }) => {
    notes = notes.filter((n) => n.uuid !== query.uuid);
    return { status: true, message: 'Note deleted successfully' };
  }),
  route('DELETE', `${P}/delete-multiple-property-listing-notes`, ({ body }) => {
    const uuids: any[] = Array.isArray(body?.uuids) ? body.uuids : [];
    notes = notes.filter((n) => !uuids.includes(n.uuid));
    return { status: true, message: 'Notes deleted successfully' };
  }),

  /* ---------- dropdown / option data ---------- */
  route('GET', 'common/countries', () => ok({ countries: [COUNTRY] }, 'Countries retrieved successfully')),
  route('GET', 'common/states', () => ok({ states: STATES }, 'States retrieved successfully')),
  route('GET', 'common/cities', ({ query }) => {
    const sid = num(query.state_id);
    const rows = (sid ? CITIES.filter((c) => c.stateId === sid) : CITIES).map((c) => ({ id: c.id, name: c.name, stateId: c.stateId }));
    return ok({ cities: rows.length ? rows : CITIES.map((c) => ({ id: c.id, name: c.name, stateId: c.stateId })) }, 'Cities retrieved successfully');
  }),
  route('GET', 'common/dynamic-upload-file-management/get-upload-file-categories', categoryHandler),
  route('GET', 'common/dynamic-upload-file-management/get-additional-file-categories', categoryHandler),
] as ReturnType<typeof route>[];
