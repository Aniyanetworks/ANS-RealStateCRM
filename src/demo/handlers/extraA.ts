/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from '../route';
import * as seed from '../seed';

const DAY = 86400000;
const day = (n: number) => new Date(Date.now() - n * DAY).toISOString();
const ymd = (n: number) => day(n).slice(0, 10);
const r2 = (n: number) => Math.round(n * 100) / 100;
const HST = 0.13;
const ok = (data: any, extra: any = {}) => ({ status: true, data, ...extra });

const STAGES = ['FINALIZED', 'DRAFT', 'PAID', 'CLOSED', 'FINALIZED', 'DRAFT', 'CLOSED', 'PAID', 'FINALIZED', 'CLOSED', 'DRAFT', 'PAID'] as const;
const nameOf = (p: any) => [p?.firstName, p?.lastName].filter(Boolean).join(' ');

const txRows = (seed.tradeSheets as any[]).slice(0, 12).map((t: any, i: number) => {
  const stage = STAGES[i];
  const p = t.properties[0];
  const price = Number(p.salesPrice) || 500000;
  const commission = r2(price * 0.025);
  const total = r2(commission * (1 + HST));
  const finalized = stage !== 'DRAFT';
  const paid = stage === 'PAID' || stage === 'CLOSED';
  const people = 1 + (t.sharedUsers?.length || 0);
  const multiple = i % 6 === 5;
  return {
    id: t.id,
    uuid: t.uuid,
    number: t.tradeSheetTypeId,
    stage,
    sheetStatus: t.status,
    tradeStatus: t.tradeStatus,
    entryDate: ymd(10 + i * 14),
    closingDate: ymd(i * 10 - 35),
    property: p.propertyAddress,
    client: nameOf(t.buyerInformations?.[0]) || t.name,
    representation: t.representation,
    representationType: multiple ? 'multiple' : 'single',
    multipleRepresentation: multiple ? 'seller,buyer' : null,
    listType: ['Sale', 'Sale', 'Lease'][i % 3],
    agent: t.name,
    sharedAgents: (t.sharedUsers || []).map((u: any) => u.name),
    salePrice: price,
    commissionReceivable: finalized ? total : null,
    agentPayable: finalized ? r2(commission * 0.8) : null,
    otherBrokeragePayable: i % 4 === 1 || i % 4 === 3 ? r2(commission * 0.5) : 0,
    transaction: finalized ? { uuid: `tx-demo-${String(t.id).padStart(4, '0')}`, chequePosted: paid } : null,
    trust: {
      realEstate: stage === 'CLOSED' ? 0 : Number(p.depositAmount) || 10000,
      commission: finalized && stage !== 'CLOSED' ? total : 0,
      commissionReceived: paid ? total : 0,
    },
    payroll: finalized ? { count: people, paid: paid ? people : 0, posted: stage === 'FINALIZED' ? 0 : people } : { count: 0, paid: 0, posted: 0 },
  };
});

const lawyer = (name: string) => ({
  name, email: `${name.split(' ')[0].toLowerCase()}@lawfirm.example`, phoneNumber: '416-555-0142', streetAddress: '200 Bay St',
  postalZipCode: 'M5J 2J1', city: { name: 'Toronto' }, state: { name: 'Ontario' }, lawyerFirmName: 'Harbour & Pike LLP',
});

const detailedTrade = (uuid: string) => {
  const t: any = (seed.tradeSheets as any[]).find((x) => x.uuid === uuid) || seed.tradeSheets[0];
  const row = txRows.find((r) => r.uuid === t.uuid);
  const p = t.properties[0];
  const base = r2((Number(p.salesPrice) || 500000) * 0.025);
  const saved = row?.transaction
    ? [{
        uuid: row.transaction.uuid, createdAt: day(20), baseOfficeCommissionTotal: r2(base * (1 + HST)), baseOfficeCommissionTax: r2(base * HST),
        agentCommissionTotal: r2(base * 0.8), netCommissionTotal: r2(base * 0.2 * (1 + HST)),
        chequePosting: row.transaction.chequePosted ? [{ id: 1 }] : [],
      }]
    : [];
  const plan = { planItems: [{}, { commissionOwner: 20, planSubItems: [{ value: 499 }] }] };
  return {
    ...t,
    approvedAt: day(18),
    fundsHold: 0,
    lead: null,
    conditions: [
      { id: 1, conditionType: 'Financing', dueDate: ymd(30), conditionMetDate: ymd(28), completeStatus: 'completed' },
      { id: 2, conditionType: 'Home Inspection', dueDate: ymd(26), conditionMetDate: null, completeStatus: 'pending' },
    ],
    sellerInformations: [{ firstName: 'Walter', lastName: 'Bishop', email: 'walter.bishop@example.com', phone: '416-555-0188' }],
    agentDetails: [{
      sellerCommission: 2.5, buyerCommission: 2.5,
      sellerAgentAccount: { hstNo: '812345678', plan },
      buyerAgentAccount: { hstNo: '812345678', plan },
    }],
    lawyerDetails: [{ sellerLawyer: lawyer('Eleanor Pike'), buyerLawyer: lawyer('Martin Shaw') }],
    tradeTransaction: saved,
    files: [],
    properties: [{ ...p, offerDate: ymd(60), firmDate: ymd(45), closingDate: ymd(15), mlsNumber: `W${5400000 + t.id * 37}`, city: { name: p.city }, postalCode: 'M5V 2T6' }],
  };
};

const ST_REGULAR = ['listed', 'New', 'Price Change', 'Extended', 'DFT', 'Exclusive', 'listed', 'Sold', 'Terminated', 'Suspended', 'Expired', 'listed', 'New', 'Sold', 'Price Change', 'listed', 'Extended', 'Expired', 'Exclusive', 'listed', 'Sold', 'New', 'Terminated', 'listed'];
const ST_MERE = ['listed', 'listed', 'sold', 'listed', 'expired', 'listed', 'terminated', 'listed', 'leased', 'listed', 'suspended', 'listed'];
const ADMIN_STATUS = ['approved', 'approved', 'underReview', 'approved', 'draft', 'approved', 'rejected', 'approved', 'pendingMls', 'approved'];
const PROP_TYPES = ['Detached', 'Semi Detached', 'Condo Apt', 'Freehold Townhome', 'Condo Townhome', 'Residential Freehold'];
const USERS = (seed.agents as any[]).map((a) => ({
  id: a.user?.id ?? a.id, firstName: a.user?.firstName, lastName: a.user?.lastName, name: a.name,
  email: a.user?.email || a.email || `${String(a.user?.firstName || 'agent').toLowerCase()}@ans.demo`,
}));

const listing = (i: number, kind: 'regular' | 'mere_listing', n0: number) => {
  const base: any = (seed.properties as any[])[(i + n0) % seed.properties.length];
  const creator = USERS[i % USERS.length];
  const shared = i % 3 === 0 ? [USERS[(i + 1) % USERS.length]] : [];
  const rent = i % 5 === 4;
  const statuses = kind === 'regular' ? ST_REGULAR : ST_MERE;
  const adminStatus = ADMIN_STATUS[i % ADMIN_STATUS.length];
  return {
    ...base,
    id: n0 + i + 1,
    uuid: `${kind === 'regular' ? 'pl' : 'ml'}-demo-${String(i + 1).padStart(4, '0')}`,
    propertyListingTypeId: `${kind === 'regular' ? 'PL' : 'ML'}-2026-${String(i + 1).padStart(4, '0')}`,
    listingType: kind,
    mlsNumber: i % 7 === 6 ? null : `W${5500000 + (n0 + i) * 53}`,
    propertyListingType: rent ? 'For rent' : 'For sale',
    propertyType: PROP_TYPES[i % PROP_TYPES.length],
    listingStatus: statuses[i % statuses.length],
    status: adminStatus,
    rejectReason: adminStatus === 'rejected' ? 'Missing signed listing agreement.' : null,
    listingPrice: String(rent ? 2400 + (i % 6) * 250 : Number(base.listingPrice) || 600000),
    listingDate: day(10 + i * 5),
    expiryDate: day(i * 11 - 90),
    createdBy: creator.id,
    createdUser: creator,
    branchId: 1,
    branch: { id: 1, name: 'ANS RealStateCRM - Toronto' },
    sharedUsers: shared.map((u) => ({ ...u, sharedUserId: u.id })),
    attachments: [],
    paperworkAttachments: [],
    listingAttachments: [],
    notes: i % 4 === 0 ? [{ id: i + 1, note: 'Seller requested weekend showings only.', createdAt: day(3 + i) }] : [],
    tradeSheet: [],
    sellersInfo: JSON.stringify({ sellersInfo: [{ firstName: 'Walter', lastName: 'Bishop' }] }),
    createdAt: day(12 + i * 5),
    updatedAt: day(2 + i),
  };
};
const regularListings = Array.from({ length: 24 }, (_, i) => listing(i, 'regular', 0));
const mereListings = Array.from({ length: 12 }, (_, i) => listing(i, 'mere_listing', 100));

export const extraARoutes = [
  route('GET', 'brokerage-accounting/transactions', () => ok(txRows)),
  route('GET', 'brokerage-accounting/trust/trades/(?<id>\\d+)', ({ params }) => {
    const row = txRows.find((r) => String(r.id) === params.id) || txRows[0];
    const rec = row.trust.commissionReceived;
    return ok({
      realEstateTrustBalance: row.trust.realEstate,
      commissionTrustBalance: row.trust.commission,
      commissionReceived: rec,
      transactions: [
        { uuid: `trust-${row.uuid}-1`, ledgerDate: row.entryDate, bankAccount: { name: 'Real Estate Trust Account' }, kind: 'DEPOSIT', direction: 'RECEIPT', clientName: row.client, reference: `DEP-${4000 + row.id}`, amount: Math.round(row.salePrice * 0.05), status: 'POSTED' },
        ...(rec ? [{ uuid: `trust-${row.uuid}-2`, ledgerDate: row.closingDate, bankAccount: { name: 'Commission Trust Account' }, kind: 'COMMISSION_RECEIPT', direction: 'RECEIPT', clientName: 'Closing lawyer', reference: `CR-${7000 + row.id}`, amount: rec, status: 'POSTED' }] : []),
      ],
    });
  }),
  route('GET', 'agent/trade-sheet-management/get-spacific-trade-sheet', ({ query }) => ({
    status: true, data: { tradeSheetData: detailedTrade(query.uuid) }, message: 'Trade sheet retrieved successfully',
  })),

  route('GET', 'superadmin/property-listing/list', ({ query }) => {
    const rows = query.listingType === 'mere_listing' ? mereListings : query.listingType === 'regular' ? regularListings : [...regularListings, ...mereListings];
    return { status: true, data: { propertyListingData: rows }, message: 'Property listing retrieved successfully' };
  }),
] as ReturnType<typeof route>[];
