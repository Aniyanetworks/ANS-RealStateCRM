/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from '../route';
import * as seed from '../seed';

const DAY = 86400000;
const day = (n: number) => new Date(Date.now() - n * DAY).toISOString();
const ymd = (n: number) => day(n).slice(0, 10);
const money = (n: number) => n.toFixed(2);
const r2 = (n: number) => Math.round(n * 100) / 100;
const mk = <T,>(n: number, f: (i: number) => T) => Array.from({ length: n }, (_, i) => f(i));
const HST = 0.13;

const STREETS = ['Maple Ave', 'Lakeshore Blvd', 'King St', 'Oak Lane', 'Bayview Dr', 'Queen St W', 'Dundas St E', 'Yonge St'];
const CITIES = ['Toronto', 'Mississauga', 'Brampton', 'Oakville', 'Markham', 'Vaughan', 'Burlington'];
const CLIENTS = ['Grace Thompson', 'Noah Fraser', 'Isabelle Roy', 'Arjun Mehta', 'Chloe Wilson', 'Liam Chen', 'Hannah Dubois', 'Samuel Okafor', 'Mia Rossi', 'Owen Campbell', 'Layla Haddad', 'Ryan Murphy', 'Zoe Patel', 'Ethan Walsh'];
const TRADE_STATUS = ['closed', 'closed', 'soldConditional', 'closed', 'pending', 'closed', 'dft', 'closed', 'closed', 'pending', 'closed', 'soldConditional', 'closed', 'closed'];
const REP = ['seller', 'buyer', 'seller', 'tenant', 'buyer', 'seller', 'landlord', 'buyer', 'seller', 'buyer', 'tenant', 'seller', 'buyer', 'seller'];

const trades = mk(14, (i) => {
  const price = 520000 + ((i * 83000) % 900000) - ((i * 83000) % 5000);
  const created = 12 + i * 21;
  const commission = r2(price * 0.025);
  const agentBase = r2(commission * 0.8);
  const netBase = r2(commission - agentBase);
  const agentTax = r2(agentBase * HST);
  const netTax = r2(netBase * HST);
  const agent = seed.agents[i % seed.agents.length];
  const address = `${100 + i * 17} ${STREETS[i % STREETS.length]}`;
  const city = CITIES[i % CITIES.length];
  const closing = ymd(created - 14);
  const property = {
    id: i + 1, propertyAddress: `${address}, ${city}, ON`, city, soldPrice: money(price), salesPrice: money(price - 5000),
    listingPrice: money(price + 10000), depositAmount: money(Math.round(price * 0.05)), closingDate: closing,
  };
  const sheet = {
    id: i + 1,
    uuid: `ts-demo-${String(i + 1).padStart(4, '0')}`,
    tradeSheetTypeId: `TS-2026-${String(i + 1).padStart(4, "0")}`,
    branchId: 1,
    name: CLIENTS[i],
    firstName: CLIENTS[i].split(' ')[0],
    lastName: CLIENTS[i].split(' ')[1],
    email: `${CLIENTS[i].split(' ')[0].toLowerCase()}@example.com`,
    representation: REP[i],
    representationType: 'single',
    multipleRepresentation: null,
    status: i % 7 === 4 ? 'draft' : i % 5 === 3 ? 'underReview' : 'approved',
    tradeStatus: TRADE_STATUS[i],
    seller_landlord_agent_id: agent.id,
    buyer_tenant_agent_id: null,
    seller_landlord_agent: { id: agent.id, user: { name: agent.name, firstName: agent.user.firstName, lastName: agent.user.lastName } },
    buyer_tenant_agent: null,
    sharedUsers: i % 3 === 0
      ? [{ sharedUserId: seed.agents[(i + 1) % seed.agents.length].id, sharedUser: { name: seed.agents[(i + 1) % seed.agents.length].name, firstName: seed.agents[(i + 1) % seed.agents.length].user.firstName, lastName: seed.agents[(i + 1) % seed.agents.length].user.lastName } }]
      : [],
    branch: { id: 1, name: 'ANS RealStateCRM - Toronto' },
    properties: [property],
    propertyListing: { id: i + 1, address: property.propertyAddress },
    createdAt: day(created),
  };
  const txn = {
    id: i + 1,
    uuid: `tx-demo-${String(i + 1).padStart(4, '0')}`,
    transactionId: `TRX-${100200 + i}`,
    tradeSheetId: sheet.id,
    bankAccountId: 1,
    description: null,
    closingDate: closing,
    listingPrice: money(price + 10000),
    salesPrice: money(price - 5000),
    soldPrice: money(price),
    commissionProperty: money(commission),
    commissionAgent: money(agentBase),
    commissionOwner: money(netBase),
    buySaleAdminFees: money(499),
    tax: money(r2(commission * HST)),
    baseOfficeCommissionListing: money(commission / 2),
    baseOfficeCommissionListingOther: '0.00',
    baseOfficeCommissionSelling: money(commission / 2),
    baseOfficeCommissionSellingOther: '0.00',
    baseOfficeCommissionTax: money(r2(commission * HST)),
    baseOfficeCommissionTotal: money(r2(commission * (1 + HST))),
    agentCommissionListing: money(agentBase / 2),
    agentCommissionListingOther: '0.00',
    agentCommissionSelling: money(agentBase / 2),
    agentCommissionSellingOther: '0.00',
    agentCommissionTax: money(agentTax),
    agentCommissionTotal: money(r2(agentBase + agentTax)),
    netCommissionListing: money(netBase / 2),
    netCommissionListingOther: '0.00',
    netCommissionSelling: money(netBase / 2),
    netCommissionSellingOther: '0.00',
    netCommissionTax: money(netTax),
    netCommissionTotal: money(r2(netBase + netTax)),
    baseOfficeCommissionStatus: 'completed',
    agentCommissionStatus: i % 4 === 0 ? 'pending' : 'completed',
    netCommissionStatus: i % 3 === 0 ? 'pending' : 'completed',
    status: i % 4 === 0 ? 'pending' : 'completed',
    createdAt: day(created),
    updatedAt: day(created),
    tradeSheet: sheet,
  };
  return { sheet, txn, price, commission, agentBase, netBase, agent };
});
const tradeData = trades.map((t) => t.txn);

const CATEGORY_NAMES = ['Office Rent', 'Marketing & Advertising', 'Software Subscriptions', 'Insurance (E&O)', 'Utilities', 'Professional Fees', 'Training & Education', 'Travel & Vehicle'];
const expenseCategories = CATEGORY_NAMES.map((name, i) => ({
  id: i + 1, uuid: `exp-cat-${i + 1}`, slug: name.toLowerCase().replace(/[^a-z]+/g, '-'), name,
  status: i === 7 ? 'inactive' : 'active', createdAt: day(300 - i * 10), updatedAt: day(300 - i * 10),
}));

const EXPENSE_ITEMS: [string, number, number, boolean | string][] = [
  ['Downtown office rent', 0, 4800, 'monthly'], ['Facebook & Google ads', 1, 1250, false], ['CRM software licences', 2, 389, 'monthly'],
  ['E&O insurance premium', 3, 2150, 'yearly'], ['Hydro & internet', 4, 342.5, 'monthly'], ['Legal review - agent agreements', 5, 1800, false],
  ['RECO continuing education', 6, 675, false], ['Open house signage', 1, 520, false], ['Accounting & bookkeeping', 5, 950, 'monthly'],
  ['Brokerage conference travel', 7, 1480, false], ['MLS board dues', 2, 1120, 'yearly'], ['Staff training workshop', 6, 840, false],
  ['Photography - listing package', 1, 620, false], ['Office supplies', 4, 214.75, false],
];
const expenses = EXPENSE_ITEMS.map(([name, cat, amount, rec], i) => {
  const tax = r2(amount * HST);
  return {
    id: i + 1, expense_id: `EXP-${String(1001 + i)}`, invoice_number: `INV-E${String(2026100 + i)}`,
    expenseCategoryId: cat + 1, propertyListingId: null, branchId: 1, uuid: `exp-${i + 1}`, slug: `expense-${i + 1}`,
    name, description: i % 3 === 0 ? `${name} - ${CITIES[i % CITIES.length]} office` : null,
    amount: money(amount), tax: money(tax), total: money(amount + tax),
    transactionDate: day(8 + i * 19), status: 'active',
    expenseStatus: i === 6 ? 'pending' : i === 12 ? 'rejected' : 'approved',
    receiptPath: null, isRecurring: Boolean(rec), recurrenceType: rec || null,
    recurrenceInterval: rec ? 1 : null, recurrenceEndDate: null, createdAt: day(8 + i * 19), updatedAt: day(8 + i * 19),
    expenseCategory: expenseCategories[cat], propertyListing: null, branch: { id: 1, name: 'ANS RealStateCRM - Toronto' },
  };
});

const bankAccounts = [
  ['Operating Account - RBC', 'Debit', 184230.55, 'yes'], ['Commission Trust Account', 'Credit', 96420.1, 'no'],
  ['Real Estate Trust Account', 'Credit', 215000, 'no'], ['TD Business Savings', 'Debit', 52310.25, 'no'],
  ['Payroll Account - BMO', 'Debit', 18750.4, 'no'], ['HST Reserve Account', 'Debit', 23880.9, 'no'],
].map(([name, type, bal, def], i) => ({
  id: i + 1, slug: `bank-${i + 1}`, uuid: `bank-demo-${i + 1}`, userId: 1, cardNumber: `4520000000${1000 + i}`,
  accountHolder: 'ANS RealStateCRM Inc.', name, description: `${name} (demo)`, type, balance: money(bal as number),
  isDefault: def, status: i === 4 ? 'inactive' : 'active', createdAt: day(400 - i * 5), updatedAt: day(30 + i),
}));

const chequePostings = trades.slice(0, 12).map((t, i) => ({
  id: i + 1, slug: `cheque-${i + 1}`, uuid: `chq-demo-${i + 1}`, transactionId: `CHQ-${50100 + i}`, tradeSheetId: t.sheet.id,
  bankAccountId: 1, tradeTransactionId: t.txn.id, brokerageId: null, description: null,
  chequeReceiptFrom: ['Seller lawyer', 'Buyer brokerage', 'Closing law firm'][i % 3],
  chequeType: i % 2 ? 'commission' : 'deposit', amount: t.txn.baseOfficeCommissionTotal, dateOfReceipt: ymd(10 + i * 21),
  status: t.txn.netCommissionStatus === 'pending' ? 'pending' : 'completed', createdAt: day(10 + i * 21), updatedAt: day(10 + i * 21),
  tradeTransaction: t.txn,
}));

const tradeAgentCommission = trades.slice(0, 10).map((t, i) => {
  const gross = r2(t.agentBase * (1 + HST));
  const ded = r2(150 + (i % 4) * 75);
  return {
    id: i + 1, slug: `tac-${i + 1}`, uuid: `tac-demo-${i + 1}`, transactionId: `TAC-${70100 + i}`, tradeSheetId: t.sheet.id,
    bankAccountId: 1, tradeTransactionId: t.txn.id, chequePostingId: i + 1, agentAccountId: t.agent.id,
    agentCommissionTax: t.txn.agentCommissionTax, agentCommissionTotal: money(gross),
    totalDeduction: money(ded), commissionTotalAfterDeduction: money(gross - ded),
    status: i % 3 === 0 ? 'pending' : 'completed',
    acknowledgementStatus: ['accepted', 'pending', 'accepted', 'rejected', 'accepted'][i % 5],
    acknowledgementEmailSend: 'yes', rejectReasons: i % 5 === 3 ? 'Deduction amount does not match my fee plan.' : null,
    createdAt: day(10 + i * 21), updatedAt: day(10 + i * 21),
    tradeSheet: t.sheet, agentAccount: { id: t.agent.id, name: t.agent.name, email: t.agent.email, agentAccountId: `UID${String(t.agent.id).padStart(5, '0')}` },
  };
});
const sumBy = (rows: any[], status: string, key: string) => r2(rows.filter((r) => r.status === status).reduce((n, r) => n + Number(r[key]), 0));

const orderData = mk(8, (i) => {
  const total = 120 + i * 85;
  const tax = r2(total * HST / (1 + HST));
  return {
    id: i + 1, uuid: `ord-demo-${i + 1}`, invoice_number: `ORD-${30001 + i}`, agentId: seed.agents[i % seed.agents.length].user.id,
    issued_date: day(15 + i * 30), status: i === 5 ? 'pending' : 'paid', type: 'sale', total_amount: total, discount: 0, tax,
    payment_method: i % 2 ? 'card' : 'etransfer', createdAt: day(15 + i * 30), updatedAt: day(15 + i * 30),
    agent: { id: seed.agents[i % seed.agents.length].user.id, name: seed.agents[i % seed.agents.length].name, email: seed.agents[i % seed.agents.length].email, phoneNumber: seed.agents[i % seed.agents.length].phoneNumber },
    invoiceItems: [{ id: i + 1, quantity: 1, price: total - tax, tradeProduct: { id: i + 1, name: ['Yard sign kit', 'Open house flyers', 'Lockbox', 'Business cards'][i % 4] } }],
  };
});

const BA_BANKS = [
  { id: 1, name: 'Operating Account - RBC', accountCategory: 'OPERATING', openingBalance: 150000, bookBalance: 184230.55, status: 'active' },
  { id: 2, name: 'Real Estate Trust Account', accountCategory: 'REAL_ESTATE_TRUST', openingBalance: 0, bookBalance: 215000, status: 'active' },
  { id: 3, name: 'Commission Trust Account', accountCategory: 'COMMISSION_TRUST', openingBalance: 0, bookBalance: 96420.1, status: 'active' },
  { id: 4, name: 'Payroll Account - BMO', accountCategory: 'PAYROLL', openingBalance: 20000, bookBalance: 18750.4, status: 'active' },
];
const GL: [string, string, string][] = [
  ['10100', 'Operating Bank', 'ASSET'], ['10200', 'Real Estate Trust Bank', 'ASSET'], ['10300', 'Commission Trust Bank', 'ASSET'],
  ['12000', 'Accounts Receivable', 'ASSET'], ['23000', 'HST Collected', 'LIABILITY'], ['23001', 'HST Input Tax Credits', 'LIABILITY'],
  ['24000', 'Trust Liabilities', 'LIABILITY'], ['30000', 'Retained Earnings', 'EQUITY'], ['40000', 'Commission Income', 'INCOME'],
  ['40100', 'Agent Fee Income', 'INCOME'], ['50000', 'Agent Commission Payouts', 'COST_OF_SALES'], ['60100', 'Rent', 'EXPENSE'],
  ['60200', 'Marketing & Advertising', 'EXPENSE'], ['60300', 'Software & Subscriptions', 'EXPENSE'], ['60400', 'Insurance', 'EXPENSE'],
  ['60500', 'Utilities', 'EXPENSE'], ['60600', 'Professional Fees', 'EXPENSE'],
];
const glAccounts = GL.map(([code, name, accountType], i) => ({ id: i + 1, code, name, accountType, active: true }));

const baAgents = seed.agents.map((a, i) => ({
  id: a.id, name: a.name, displayName: a.name, agentNumber: `A${String(1001 + i)}`, email: a.email, active: a.status !== 'closed',
  dob: a.dob, startDate: `20${18 + (i % 6)}-0${(i % 9) + 1}-15`, terminationDate: a.status === 'closed' ? ymd(60) : null,
  recoExpiry: ymd(-30 - i * 40), recoNumber: `RECO-${400100 + i}`, renewalStatus: i % 3 === 0 ? 'APPLIED' : 'PENDING',
  renewalAppliedDate: i % 3 === 0 ? ymd(20) : null, tradeCount: trades.filter((t) => t.agent.id === a.id).length,
}));
const baTrades = trades.map((t, i) => ({
  id: t.sheet.id, uuid: t.sheet.uuid, number: t.sheet.tradeSheetTypeId, address: t.sheet.properties[0].propertyAddress,
  agentId: t.agent.id, closeDate: t.sheet.properties[0].closingDate.slice(0, 10), finalizedDate: ymd(8 + i * 21), closedAt: ymd(8 + i * 21),
  status: t.sheet.tradeStatus === 'closed' ? 'FINALIZED' : t.sheet.tradeStatus === 'dft' ? 'DFT' : 'PENDING',
  salePrice: t.price, grossCommission: t.commission, netToOffice: r2(t.netBase), received: i % 3 === 0 ? 0 : r2(t.commission * (1 + HST)),
  receivedDate: i % 3 === 0 ? null : ymd(6 + i * 21),
}));
const baListings = mk(16, (i) => ({
  id: i + 1, agentId: seed.agents[i % seed.agents.length].id, startDate: ymd(5 + i * 12), status: i === 9 ? 'EXPIRED' : 'ACTIVE', kind: i % 4 === 3 ? 'LEASE' : 'SALE',
}));

const VENDORS = ['Bell Canada', 'Toronto Hydro', 'Google Workspace', 'Facebook Ads', 'Cunningham Insurance Brokers', 'Staples Business', 'Smith & Lee LLP', 'RECO'];
const baVendors = VENDORS.map((name, i) => ({ id: i + 1, name, active: true, email: `ap@${name.toLowerCase().replace(/[^a-z]/g, '')}.ca`, phone: `41655500${10 + i}` }));
const baBills = mk(12, (i) => {
  const amount = [342.5, 1250, 389, 2150, 214.75, 950, 4800, 675, 1480, 620, 840, 520][i];
  const hst = r2(amount * HST), total = r2(amount + hst);
  const paid = i % 3 !== 1;
  const v = baVendors[i % baVendors.length];
  return {
    uuid: `bill-demo-${i + 1}`, billNumber: `BILL-${2001 + i}`, vendorId: v.id, vendor: { id: v.id, name: v.name }, invoiceNumber: `${v.name.slice(0, 3).toUpperCase()}-${88000 + i}`,
    billDate: ymd(6 + i * 14), dueDate: ymd(-8 + i * 14 - 14), glAccountId: 12 + (i % 5), glAccount: { code: GL[11 + (i % 5)][0], name: GL[11 + (i % 5)][1] },
    branchId: 1, description: `${v.name} - monthly invoice`, amount, hstRate: 13, hstAmount: hst, total, amountPaid: paid ? total : 0,
    approvalStatus: 'APPROVED', status: 'POSTED', paymentStatus: paid ? 'PAID' : 'UNPAID', postedAt: ymd(5 + i * 14), attachmentUrl: null, attachmentName: null,
    payments: paid ? [{ uuid: `pay-demo-${i + 1}`, paymentDate: ymd(2 + i * 14), amount: total, method: 'EFT', bankAccountId: 1, chequeNumber: null, reference: `EFT-${5000 + i}`, payeeName: v.name, voidedAt: null }] : [],
    balanceDue: paid ? 0 : total, recurringTemplateId: null,
  };
});
const totalIncome = r2(trades.filter((t) => t.sheet.tradeStatus === 'closed').reduce((n, t) => n + t.commission, 0));
const totalExp = r2(expenses.filter((e) => e.expenseStatus === 'approved').reduce((n, e) => n + Number(e.amount), 0));
const totalCos = r2(trades.filter((t) => t.sheet.tradeStatus === 'closed').reduce((n, t) => n + t.agentBase, 0));
const hstCollected = r2(totalIncome * HST);
const hstItcs = r2(totalExp * HST);

const baTrustTx = trades.slice(0, 10).map((t, i) => ({
  uuid: `trust-demo-${i + 1}`, ledgerDate: ymd(9 + i * 21), bankAccountId: i % 3 === 0 ? 3 : 2, bankAccount: { name: i % 3 === 0 ? 'Commission Trust Account' : 'Real Estate Trust Account' },
  direction: i % 3 === 2 ? 'DISBURSEMENT' : 'RECEIPT', amount: i % 3 === 0 ? r2(t.commission * (1 + HST)) : Math.round(t.price * 0.05),
  clientName: t.sheet.name, payeeName: null, reference: `TR-${9000 + i}`, description: i % 3 === 0 ? 'Commission receipt' : 'Buyer deposit',
  kind: i % 3 === 0 ? 'COMMISSION_RECEIPT' : 'DEPOSIT', matter: null, tradeSheet: { tradeSheetTypeId: t.sheet.tradeSheetTypeId },
}));
const trustLiab = {
  summary: [{ trustAccountType: 'REAL_ESTATE_TRUST', balance: 215000 }, { trustAccountType: 'COMMISSION_TRUST', balance: 96420.1 }],
  matters: trades.slice(0, 6).map((t, i) => ({ trustAccountType: i % 2 ? 'COMMISSION_TRUST' : 'REAL_ESTATE_TRUST', balance: i % 2 ? r2(t.commission * (1 + HST)) : Math.round(t.price * 0.05), matter: null, trade: { name: t.sheet.name, tradeSheetTypeId: t.sheet.tradeSheetTypeId } })),
};
const reconciliations = BA_BANKS.slice(1, 3).flatMap((b, bi) => mk(4, (i) => ({
  id: bi * 10 + i + 1, bankAccountId: b.id, bankAccount: { name: b.name }, periodEnd: ymd(10 + i * 30), statementBalance: b.bookBalance - i * 1200, bookBalance: b.bookBalance - i * 1200, clearedBalance: b.bookBalance - i * 1200, difference: 0, status: 'COMPLETED',
})));
const journals = mk(15, (i) => ({
  id: i + 1, uuid: `je-demo-${i + 1}`, entryNumber: `JE-${1001 + i}`, entryDate: ymd(3 + i * 9), memo: i % 2 ? 'Commission income posted' : 'Operating expense posted',
  source: i % 2 ? 'TRADE' : 'BILL', manual: false, lines: [],
}));

const ok = (data: any, extra: any = {}) => ({ status: true, data, ...extra });
const BA = 'brokerage-accounting';

export const financeRoutes = [
  route('GET', 'superadmin/expense-category/get', () => ({ status: true, data: { categories: expenseCategories }, message: 'Expense categories retrieved successfully' })),
  route('GET', 'superadmin/expense/get', () => ({ status: true, data: { expenses }, message: 'Expenses retrieved successfully' })),

  route('GET', 'accounting/bank-accounts-management/get', () => ({ status: true, data: { accounts: bankAccounts }, message: 'Accounting bank accounts retrieved successfully' })),
  route('GET', 'accounting/trade-accounting/transactions/get-all-cheque-postings', () => ({ status: true, data: { chequePostings }, message: 'Cheque Postings retrieved successfully' })),
  route('GET', 'accounting/trade-accounting/transfer-commission-agent/acknowledgement-list', () => ({ status: true, data: { tradeAgentCommission }, message: 'Acknowledgement retrieved successfully' })),
  route('GET', 'accounting/trade-accounting/transfer-commission-agent/agent-commission-transfer-history-list', () => ({
    status: true,
    data: {
      tradeAgentCommission,
      tradeCommissionBalance: money(sumBy(tradeAgentCommission, 'pending', 'commissionTotalAfterDeduction')),
      tradeAgentCommissionTransferComplete: sumBy(tradeAgentCommission, 'completed', 'commissionTotalAfterDeduction'),
      tradeAgentCommissionTransferPending: sumBy(tradeAgentCommission, 'pending', 'commissionTotalAfterDeduction'),
      tradeAgentCommissionDeduction: sumBy(tradeAgentCommission, 'completed', 'totalDeduction'),
      tradeAgentGrossCommission: sumBy(tradeAgentCommission, 'completed', 'agentCommissionTotal'),
    },
    message: 'Acknowledgement retrieved successfully',
  })),

  route('GET', 'superadmin/agent-reports/list', () => ({ status: true, data: { userData: seed.agents }, message: 'Agents report retrieved successfully.' })),
  route('GET', 'superadmin/trade-reports/list', () => ({ status: true, data: { tradeData }, message: 'Agents report retrieved successfully.' })),
  route('GET', 'superadmin/balance-sheet-reports/balance-sheet', () => ({ status: true, data: { tradeData }, message: 'Agents report retrieved successfully.' })),
  route('GET', 'superadmin/dynamic-reports/tradesheet', ({ query }) => {
    let list = trades.map((t) => t.sheet);
    if (query.tradeStatus) { const s = query.tradeStatus.split(','); list = list.filter((x) => s.includes(x.tradeStatus)); }
    if (query.adminStatus) { const s = query.adminStatus.split(','); list = list.filter((x) => s.includes(x.status)); }
    if (query.representation) { const s = query.representation.split(','); list = list.filter((x) => s.includes(x.representation)); }
    const first = (x: any) => x.properties[0];
    const summary = {
      total: list.length,
      closed: list.filter((x) => x.tradeStatus === 'closed').length,
      draft: list.filter((x) => x.status === 'draft').length,
      pending: list.filter((x) => x.tradeStatus === 'pending').length,
      totalSelling: r2(list.reduce((n, x) => n + Number(first(x).soldPrice) + Number(first(x).salesPrice), 0)),
      totalDepositAmount: r2(list.reduce((n, x) => n + Number(first(x).depositAmount), 0)),
    };
    return { status: true, data: { tradesheets: list, summary }, message: 'Tradesheet report retrieved successfully.' };
  }),
  route('GET', 'superadmin/order-management/list', () => ({ status: true, data: { OrderData: orderData }, message: 'Orders retrieved successfully' })),

  route('GET', `${BA}/transactions`, () => ok(baTrustTx)),
  route('GET', `${BA}/settings`, () => ok({ companyName: 'ANS RealStateCRM Inc.', hstNumber: '123456789 RT0001', province: 'ON', hstRate: 13, fiscalYearStart: '01-01', configured: true })),
  route('GET', `${BA}/admin-dashboard`, () => ok({
    canCustomize: true, isSuperAdmin: true, widgets: null, agents: baAgents, banks: BA_BANKS.map((b) => ({ id: b.id, name: b.name, accountCategory: b.accountCategory, balance: b.bookBalance })),
    trades: baTrades, listings: baListings, generalIncome: mk(6, (i) => ({ id: i + 1, date: ymd(10 + i * 30), amount: 1500 + i * 240 })), expensesTotal: totalExp,
  })),
  route('GET', `${BA}/bank-accounts`, () => ok(BA_BANKS)),
  route('GET', `${BA}/bank-accounts/(?<id>[^/]+)/register`, ({ params }) => {
    const bank = BA_BANKS.find((b) => String(b.id) === params.id) || BA_BANKS[0];
    let bal = bank.openingBalance;
    const rows = baTrustTx.filter((t) => t.bankAccountId === bank.id || bank.id === 1).slice(0, 8).reverse().map((t, i) => {
      const dep = t.direction === 'RECEIPT' ? t.amount : 0, wd = t.direction === 'RECEIPT' ? 0 : t.amount;
      bal = r2(bal + dep - wd);
      return { id: i + 1, date: t.ledgerDate.slice(0, 10), entryNumber: `JE-${2001 + i}`, source: t.kind, memo: t.description, deposit: dep, withdrawal: wd, balance: bal };
    });
    return ok({ bank: { id: bank.id, name: bank.name }, openingBalance: bank.openingBalance, bookBalance: bank.bookBalance, rows });
  }),
  route('GET', `${BA}/gl-accounts`, () => ok(glAccounts)),
  route('GET', `${BA}/agents`, () => ok(baAgents)),
  route('GET', `${BA}/vendors`, () => ok(baVendors)),
  route('GET', `${BA}/employees`, () => ok(mk(4, (i) => ({ id: i + 1, name: ['Dana Whitfield', 'Marc Tremblay', 'Priyanka Shah', 'Kevin Liu'][i], email: `staff${i + 1}@ans.demo`, active: true })))),
  route('GET', `${BA}/ap-branches`, () => ok([{ id: 1, name: 'ANS RealStateCRM - Toronto' }])),
  route('GET', `${BA}/bills`, () => ok(baBills)),
  route('GET', `${BA}/recurring-bills`, () => ok([
    { id: 1, uuid: 'rec-demo-1', vendorId: 1, vendor: { name: 'Bell Canada' }, description: 'Office internet', glAccountId: 16, invoiceTotal: 342.5, hstRate: 13, frequency: 'MONTHLY', startDate: ymd(200), nextInvoiceDate: ymd(-5), dueDays: 15, active: true },
    { id: 2, uuid: 'rec-demo-2', vendorId: 3, vendor: { name: 'Google Workspace' }, description: 'Workspace licences', glAccountId: 14, invoiceTotal: 389, hstRate: 13, frequency: 'MONTHLY', startDate: ymd(300), nextInvoiceDate: ymd(-12), dueDays: 10, active: true },
  ])),
  route('GET', `${BA}/trust/trades`, ({ query }) => {
    const q = (query.q || '').toLowerCase();
    return ok(trades.map((t) => t.sheet).filter((s) => !q || `${s.tradeSheetTypeId} ${s.name} ${s.properties[0].propertyAddress}`.toLowerCase().includes(q)));
  }),
  route('GET', `${BA}/trust/transactions`, () => ok(baTrustTx)),
  route('GET', `${BA}/trust/liabilities`, () => ok(trustLiab)),
  route('GET', `${BA}/reconciliations`, () => ok(reconciliations)),
  route('GET', `${BA}/journals`, () => ok(journals)),
  route('GET', `${BA}/month-end`, ({ query }) => {
    const month = query.month || ymd(0).slice(0, 7);
    return ok({
      periodEnd: `${month}-28`, record: null, history: [],
      reconciliations: BA_BANKS.map((b) => ({ bank: { id: b.id, name: b.name, accountCategory: b.accountCategory }, reconciliation: { status: 'COMPLETED', statementBalance: b.bookBalance, bookBalance: b.bookBalance, periodEnd: `${month}-28` } })),
    });
  }),
  route('GET', `${BA}/hst-periods`, () => ok({
    history: mk(4, (i) => ({ uuid: `hst-demo-${i + 1}`, periodStart: ymd(30 * (i + 2)), periodEnd: ymd(30 * (i + 1) + 1), frequency: 'MONTHLY', hstCollected: r2(hstCollected / 10 + i * 410), itcs: r2(hstItcs / 10 + i * 90), adjustments: 0, netHst: r2(hstCollected / 10 - hstItcs / 10 + i * 320), status: i === 0 ? 'DRAFT' : i === 1 ? 'FILED' : 'PAID', reviewedAt: i ? ymd(30 * i) : null, filedAt: i ? ymd(30 * i - 3) : null, paidAt: i > 1 ? ymd(30 * i - 6) : null })),
  })),
  route('GET', `${BA}/hst-preview`, () => ok({ hstCollected: r2(hstCollected / 10), itcs: r2(hstItcs / 10) })),
  route('GET', `${BA}/tax-slips`, () => ok(baAgents.slice(0, 6).map((a, i) => ({ uuid: `slip-demo-${i + 1}`, recipientName: a.name, status: i % 2 ? 'SENT' : 'UPLOADED', fileUrl: null, originalFilename: `T4A-${a.name.replace(/ /g, '_')}.pdf`, fileSizeBytes: 48000 + i * 1200, agentAccount: { email: a.email }, employee: null })))),
  route('GET', `${BA}/reports/summary`, () => ok({ postedLines: 284, transactions: 96 })),
  route('GET', `${BA}/reports/profit-loss`, () => ok({
    totalIncome, totalCostOfSales: totalCos, totalExpenses: totalExp,
    income: [{ code: '40000', name: 'Commission Income', accountType: 'INCOME', balance: totalIncome }],
    costOfSales: [{ code: '50000', name: 'Agent Commission Payouts', accountType: 'COST_OF_SALES', balance: totalCos }],
    expenses: CATEGORY_NAMES.slice(0, 5).map((n, i) => ({ code: String(60100 + i * 100), name: n, accountType: 'EXPENSE', balance: r2(totalExp / 5) })),
  })),
  route('GET', `${BA}/reports/balance-sheet`, () => ok({
    assets: [{ code: '10100', name: 'Operating Bank', accountType: 'ASSET', balance: 184230.55 }, { code: '10300', name: 'Commission Trust Bank', accountType: 'ASSET', balance: 96420.1 }],
    liabilities: [{ code: '23000', name: 'HST Collected', accountType: 'LIABILITY', balance: hstCollected }, { code: '24000', name: 'Trust Liabilities', accountType: 'LIABILITY', balance: 96420.1 }],
    equity: [{ code: '30000', name: 'Retained Earnings', accountType: 'EQUITY', balance: 120000 }], currentEarnings: r2(totalIncome - totalCos - totalExp),
  })),
  route('GET', `${BA}/reports/trial-balance`, () => ok({ rows: glAccounts.slice(0, 10).map((a, i) => ({ code: a.code, name: a.name, accountType: a.accountType, debit: 12000 + i * 900, credit: 12000 + i * 900, debitBalance: 0, creditBalance: 0 })) })),
  route('GET', `${BA}/reports/revenue-by-month`, () => ok(mk(12, (i) => ({ month: `${new Date().getFullYear()}-${String(i + 1).padStart(2, '0')}`, revenue: 9000 + ((i * 7300) % 21000) })))),
  route('GET', `${BA}/reports/expense-summary`, () => ok({ bills: baBills.map((b) => ({ date: b.billDate, vendor: b.vendor.name, category: b.glAccount?.name, description: b.description, amount: b.amount, hst: b.hstAmount, status: b.paymentStatus })) })),
  route('GET', `${BA}/reports/trust-reconciliation`, () => ok({ rows: BA_BANKS.slice(1, 3).map((b) => ({ bank: b.name, accountCategory: b.accountCategory, lastReconciled: ymd(10), statementBalance: b.bookBalance, bookBalance: b.bookBalance, difference: 0, status: 'COMPLETED' })) })),
] as ReturnType<typeof route>[];
