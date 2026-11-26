/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from '../route';

const country = { id: 1, countryName: 'Canada', shortName: 'CA' };
const stateOn = { id: 1, name: 'Ontario' };
const stateBc = { id: 2, name: 'British Columbia' };
const stateAb = { id: 3, name: 'Alberta' };

const states = [
  stateOn, stateBc, stateAb,
  { id: 4, name: 'Quebec' }, { id: 5, name: 'Manitoba' }, { id: 6, name: 'Nova Scotia' },
  { id: 7, name: 'Saskatchewan' }, { id: 8, name: 'New Brunswick' },
];

const cities: Record<number, { id: number; name: string }> = {
  1: { id: 1, name: 'Toronto' }, 2: { id: 2, name: 'Mississauga' }, 3: { id: 3, name: 'Ottawa' },
  4: { id: 4, name: 'Vancouver' }, 5: { id: 5, name: 'Calgary' }, 6: { id: 6, name: 'Brampton' },
  7: { id: 7, name: 'Hamilton' }, 8: { id: 8, name: 'London' },
};

const ts = (d: number) => new Date(Date.UTC(2026, 0, 5 + d, 14, 30, 0)).toISOString();
const dt = (d: number) => ts(d).slice(0, 19).replace('T', ' ');

const branchSeed: [string, number, number, string, string, string, string, number, number][] = [
  ['Toronto Downtown', 1, 1, 'toronto@ans.demo', '416-555-0101', '100 King St W', 'M5X 1A9', 43.6487, -79.3817],
  ['Mississauga Central', 1, 2, 'mississauga@ans.demo', '905-555-0102', '55 City Centre Dr', 'L5B 1M2', 43.5933, -79.6417],
  ['Ottawa Capital', 1, 3, 'ottawa@ans.demo', '613-555-0103', '210 Elgin St', 'K2P 1L7', 45.4112, -75.6921],
  ['Brampton North', 1, 6, 'brampton@ans.demo', '905-555-0104', '8 Queen St E', 'L6V 1A2', 43.6875, -79.7595],
  ['Hamilton Waterfront', 1, 7, 'hamilton@ans.demo', '905-555-0105', '1 James St N', 'L8R 2K3', 43.2557, -79.8711],
  ['London Western', 1, 8, 'london@ans.demo', '519-555-0106', '300 Dundas St', 'N6B 1T6', 42.9849, -81.2453],
  ['Vancouver Pacific', 2, 4, 'vancouver@ans.demo', '604-555-0107', '777 Burrard St', 'V6Z 1X7', 49.2827, -123.1207],
  ['Calgary Prairie', 3, 5, 'calgary@ans.demo', '403-555-0108', '400 3rd Ave SW', 'T2P 4H2', 51.0447, -114.0719],
];

const branches = branchSeed.map((b, i) => {
  const state = b[1] === 1 ? stateOn : b[1] === 2 ? stateBc : stateAb;
  return {
    id: i + 1,
    uuid: `br-uuid-${i + 1}`,
    name: b[0],
    slug: b[0].toLowerCase().replace(/\s+/g, '-'),
    email: b[3],
    phone: b[4],
    address: b[5],
    postalCode: b[6],
    status: i === 7 ? 'inactive' : 'active',
    isDefault: i === 0 ? 'yes' : 'no',
    stateId: state.id,
    cityId: b[2],
    countryId: 1,
    city: cities[b[2]],
    state,
    country,
    createdAt: ts(i),
    clockInOutSettings: [{
      latitude: b[7], longitude: b[8], allowedDistance: 150,
      officeHoursWeekdayStart: '09:00', officeHoursWeekdayEnd: '17:30',
      officeHoursWeekendStart: '10:00', officeHoursWeekendEnd: '14:00',
    }],
    _count: { users: 0, tradeSheets: 6 + i * 3, campaigns: 2 + i, propertyListings: 5 + i * 2 },
  };
});

const roleSeed: [string, string, string | null][] = [
  ['Super Admin', 'yes', null], ['Branch Admin', 'yes', null], ['Accountant', 'no', 'Branch Admin'],
  ['Office Manager', 'no', 'Branch Admin'], ['Agent', 'yes', null], ['Compliance Officer', 'no', 'Agent'],
  ['Receptionist', 'no', 'Office Manager'], ['Marketing Lead', 'no', 'Agent'],
];
const roles = roleSeed.map((r, i) => ({
  id: i + 1, uuid: `role-uuid-${i + 1}`, name: r[0], slug: r[0].toLowerCase().replace(/\s+/g, '-'),
  isDefault: r[1], importRoleName: r[2], status: 'active', permissions: [] as any[], createdAt: ts(i),
})).reverse();
const roleById = (id: number) => roles.find((r) => r.id === id)!;

const people: [string, string, string, number, number, string][] = [
  ['Ava', 'Morgan', 'superAdmin', 1, 1, 'admin@ans.demo'],
  ['Liam', 'Chen', 'admin', 2, 1, 'liam.chen@ans.demo'],
  ['Sophia', 'Patel', 'admin', 2, 2, 'sophia.patel@ans.demo'],
  ['Noah', 'Tremblay', 'accountant', 3, 1, 'noah.tremblay@ans.demo'],
  ['Emma', 'Singh', 'agent', 5, 1, 'emma.singh@ans.demo'],
  ['Oliver', 'MacDonald', 'agent', 5, 3, 'oliver.macdonald@ans.demo'],
  ['Isabella', 'Rossi', 'agent', 5, 2, 'isabella.rossi@ans.demo'],
  ['Lucas', 'Nguyen', 'agent', 5, 4, 'lucas.nguyen@ans.demo'],
  ['Mia', 'Fraser', 'agent', 5, 5, 'mia.fraser@ans.demo'],
  ['Ethan', 'Dubois', 'staff', 4, 6, 'ethan.dubois@ans.demo'],
  ['Charlotte', 'Wong', 'staff', 7, 7, 'charlotte.wong@ans.demo'],
  ['Jacob', 'Campbell', 'agent', 5, 8, 'jacob.campbell@ans.demo'],
];

const users = people.map((p, i) => {
  const branch = branches[p[4] - 1];
  const id = i + 1;
  return {
    id, uuid: `user-uuid-${id}`,
    userTypeUId: `ANS-${1000 + id}`,
    firstName: p[0], lastName: p[1], name: `${p[0]} ${p[1]}`, email: p[5],
    phoneNumber: `416-555-${2000 + id}`,
    userType: p[2], roleId: p[3], branchId: branch.id,
    isActive: i === 10 ? 'no' : 'yes', status: i === 10 ? 'inactive' : 'active',
    smsOtpEnabled: i % 3 === 0, createdAt: ts(i), updatedAt: ts(i),
    userRole: roleById(p[3]),
    branch: {
      id: branch.id, uuid: branch.uuid, name: branch.name, slug: branch.slug, email: branch.email, phone: branch.phone,
      address: branch.address, postalCode: branch.postalCode, status: branch.status,
      city: branch.city, state: branch.state, country: branch.country,
    },
    agentAccount: p[2] === 'agent' ? [{ id, userId: id, agentId: id, status: 'active', licenseNumber: `ON-${300000 + id}` }] : [],
    clientAccount: [] as any[],
  };
});
branches.forEach((b) => { b._count.users = users.filter((u) => u.branchId === b.id).length; });

const clientNames = [
  ['Daniel', 'Roberts'], ['Priya', 'Sharma'], ['Marc', 'Lavoie'], ['Hannah', 'Kim'],
  ['Omar', 'Hassan'], ['Grace', 'Thompson'], ['Victor', 'Petrov'], ['Aisha', 'Khan'],
];
const clients = clientNames.map((c, i) => {
  const agent = users[4 + (i % 5)];
  const id = 100 + i;
  return {
    id, uuid: `client-uuid-${id}`, userTypeUId: `CL-${2000 + i}`,
    firstName: c[0], lastName: c[1], name: `${c[0]} ${c[1]}`,
    email: `${c[0].toLowerCase()}.${c[1].toLowerCase()}@ans.demo`,
    phoneNumber: `647-555-${3000 + i}`, userType: 'client', isActive: 'yes', status: 'active',
    createdAt: ts(20 + i), createdUser: { id: agent.id, firstName: agent.firstName, lastName: agent.lastName, email: agent.email },
    clientAccount: [{
      id: i + 1, clientId: id, agentId: agent.id, status: 'active', clientType: i % 2 ? 'seller' : 'buyer',
      clientAgent: { id: agent.id, uuid: agent.uuid, firstName: agent.firstName, lastName: agent.lastName, email: agent.email },
    }],
  };
});

const stateOf = (id: number) => states.find((s) => s.id === id)!;
const brokerageSeed: [string, string, number, number, string, string][] = [
  ['ANS RealStateCRM Realty Inc., Brokerage', '100 King St W', 1, 1, 'M5X 1A9', '416-555-0201'],
  ['Maple Leaf Homes Brokerage', '55 City Centre Dr', 1, 2, 'L5B 1M2', '905-555-0202'],
  ['Lakeshore Realty Group', '1 James St N', 1, 7, 'L8R 2K3', '905-555-0203'],
  ['Capital City Properties', '210 Elgin St', 1, 3, 'K2P 1L7', '613-555-0204'],
  ['Northern Gate Realty', '8 Queen St E', 1, 6, 'L6V 1A2', '905-555-0205'],
  ['Pacific Rim Real Estate', '777 Burrard St', 2, 4, 'V6Z 1X7', '604-555-0206'],
  ['Prairie Sky Realty', '400 3rd Ave SW', 3, 5, 'T2P 4H2', '403-555-0207'],
  ['Forest City Brokers', '300 Dundas St', 1, 8, 'N6B 1T6', '519-555-0208'],
];
const brokerageData = brokerageSeed.map((b, i) => ({
  id: i + 1, uuid: `brk-uuid-${i + 1}`, brokerageName: b[0], address: b[1], streetAddress: `Suite ${100 + i * 10}`,
  postalZipCode: b[4], phoneNumber: b[5], countryId: 1, stateId: b[2], cityId: b[3],
  country, state: stateOf(b[2]), city: cities[b[3]], createdAt: ts(i),
  agentData: users.filter((u) => u.agentAccount.length && u.branchId === ((i % 8) + 1)).map((u) => ({
    id: u.id, uuid: u.uuid, firstName: u.firstName, lastName: u.lastName, email: u.email,
  })),
  buyerAgentDetails: [] as any[], sellerAgentDetails: [] as any[],
}));

const firmSeed: [string, string, number, number, string, string][] = [
  ['Hartwell & Associates LLP', '120 Adelaide St W', 1, 1, 'M5H 1T1', '416-555-0301'],
  ['Brampton Legal Group', '20 Main St N', 1, 6, 'L6V 1N8', '905-555-0302'],
  ['Sinclair Real Estate Law', '2 Robert Speck Pkwy', 1, 2, 'L4Z 1H8', '905-555-0303'],
  ['Rideau Law Office', '99 Bank St', 1, 3, 'K1P 6B9', '613-555-0304'],
  ['Granite Peak Lawyers', '50 Burlington Ave', 1, 7, 'L7S 1P1', '905-555-0305'],
  ['Westcoast Conveyancing LLP', '1055 W Georgia St', 2, 4, 'V6E 3P3', '604-555-0306'],
  ['Foothills Legal', '800 5th Ave SW', 3, 5, 'T2P 3T6', '403-555-0307'],
  ['Thames Valley Law', '250 Dundas St', 1, 8, 'N6A 1H3', '519-555-0308'],
];
const lawyerFirm = firmSeed.map((b, i) => ({
  id: i + 1, uuid: `firm-uuid-${i + 1}`, firmName: b[0], address: b[1], streetAddress: `Floor ${i + 2}`,
  postalZipCode: b[4], phoneNumber: b[5], email: `office${i + 1}@ans.demo`, countryId: 1, stateId: b[2], cityId: b[3],
  country, state: stateOf(b[2]), city: cities[b[3]], createdAt: ts(i),
  lawyerData: [
    { id: i * 2 + 1, uuid: `lw-uuid-${i * 2 + 1}`, firstName: ['Peter', 'Maria', 'Samuel', 'Nadia'][i % 4], lastName: ['Grant', 'Alvarez', 'Cohen', 'Ahmed'][i % 4], email: `lawyer${i * 2 + 1}@ans.demo` },
    { id: i * 2 + 2, uuid: `lw-uuid-${i * 2 + 2}`, firstName: ['Helen', 'Raj', 'Chloe', 'Tom'][i % 4], lastName: ['Wu', 'Kapoor', 'Martin', 'Bell'][i % 4], email: `lawyer${i * 2 + 2}@ans.demo` },
  ],
}));

const addrs = [
  '45 Lakeshore Rd E, Mississauga, Ontario L5G 1E3', '12 Maple Ave, Toronto, Ontario M4C 1A1', '88 Rideau St Unit 1204, Ottawa, Ontario K1N 5X8',
  '301 Dundas St W, Toronto, Ontario M5T 1G5', '17 Bramalea Rd, Brampton, Ontario L6T 2W4', '640 King St W, Hamilton, Ontario L8P 1C1',
  '9 Oxford St, London, Ontario N6H 1S8', '1500 Yonge St, Toronto, Ontario M4T 1Z6', '73 Hurontario St, Mississauga, Ontario L5G 3H2',
  '24 Queen St S, Brampton, Ontario L6W 3K7',
];
const payers = ['Daniel Roberts', 'Priya Sharma', 'Marc Lavoie', 'Hannah Kim', 'Omar Hassan', 'Grace Thompson', 'Victor Petrov', 'Aisha Khan', 'Ben Carter', 'Lena Novak'];
const methods = ['certifiedCheque', 'bankDraft', 'wireTransfer', 'other'];
const receiptData = addrs.map((a, i) => ({
  id: i + 1, uuid: `rcpt-uuid-${i + 1}`, receiptId: `RCPT-2026-${String(i + 1).padStart(4, '0')}`,
  date: dt(i * 4), propertyAddress: a, propertyListingId: null, receivedFrom: payers[i],
  representation: ['buyer', 'salesRepresentative', 'tenant'][i % 3],
  paymentType: ['deposit', 'additionalDeposit', 'other'][i % 3], paymentMethod: methods[i % 4],
  bankDraftNumber: i % 4 === 1 ? `BD-${700100 + i}` : null,
  transactionType: i % 4 === 3 ? 'lease' : 'sale', amountReceived: 5000 + i * 2500,
  receivedBy: users[3 + (i % 3)].name, status: i === 8 ? 'refundProcess' : i === 9 ? 'refundCompleted' : 'active',
  signature: null, bankDraftImagePath: null, bankDraftImages: [] as any[],
  createdByName: users[1].name, updatedByName: users[1].name, createdAt: ts(i * 4), updatedAt: ts(i * 4),
}));

const pickupReceiptData = addrs.map((a, i) => ({
  id: i + 1, uuid: `pickup-uuid-${i + 1}`, receiptId: `PKUP-2026-${String(i + 1).padStart(4, '0')}`,
  date: dt(i * 3), propertyAddress: a, pickupBy: ['buyer', 'seller', 'agent', 'lawyer'][i % 4],
  pickupPerson: payers[(i + 3) % payers.length], reasonForPayment: i % 2 ? 'depositRefund' : 'balanceOfDepositRefundReturn',
  paymentMethod: methods[(i + 1) % 4], amountReceived: 2000 + i * 1500, handleBy: users[3 + (i % 3)].name,
  signature: null, createdAt: ts(i * 3), updatedAt: ts(i * 3),
})).reverse();

const mkItem = (id: number, name: string, value: number, itemType = 'Fee', co = 0, ca = 0, subs: { name: string; value: number }[] = []) => ({
  id: String(id), name, value, isOptional: false, commissionOwner: co, commissionAgent: ca, itemType, planSubItems: subs,
});
const plans = [
  { id: 6, uuid: 'plan-uuid-6', name: 'Team Lead', type: 'monthly', planItems: [mkItem(11, 'Commission Split', 0, 'Commission', 15, 85), mkItem(12, 'Monthly Desk Fee', 399), mkItem(13, 'E&O Insurance', 55, 'Fee', 0, 0, [{ name: 'Annual premium', value: 660 }])] },
  { id: 5, uuid: 'plan-uuid-5', name: 'Elite Agent', type: 'monthly', planItems: [mkItem(9, 'Commission Split', 0, 'Commission', 10, 90), mkItem(10, 'Monthly Desk Fee', 299)] },
  { id: 4, uuid: 'plan-uuid-4', name: 'Cap Plan', type: 'annual', planItems: [mkItem(7, 'Commission Split', 0, 'Commission', 20, 80), mkItem(8, 'Annual Cap', 18000, 'Fee', 0, 0, [{ name: 'Brokerage share after cap', value: 0 }])] },
  { id: 3, uuid: 'plan-uuid-3', name: 'Starter', type: 'monthly', planItems: [mkItem(5, 'Commission Split', 0, 'Commission', 30, 70), mkItem(6, 'Transaction Fee', 99)] },
  { id: 2, uuid: 'plan-uuid-2', name: 'Standard', type: 'monthly', planItems: [mkItem(3, 'Commission Split', 0, 'Commission', 25, 75), mkItem(4, 'Monthly Desk Fee', 199)] },
  { id: 1, uuid: 'plan-uuid-1', name: 'Part-Time', type: 'annual', planItems: [mkItem(1, 'Commission Split', 0, 'Commission', 35, 65), mkItem(2, 'Annual Membership', 750)] },
];

const optionalSeed: [string, number][] = [
  ['Errors & Omissions Top-Up', 25], ['Marketing Package', 120], ['Lockbox Rental', 15], ['Professional Photography', 180],
  ['CRM Premium Add-on', 49], ['Virtual Staging', 95], ['Signage Package', 75], ['Social Media Boost', 60],
];
const optionalPlans = optionalSeed.map((o, i) => ({
  id: i + 1, uuid: `optplan-uuid-${i + 1}`, name: o[0], slug: o[0].toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  optionalPlanName: o[0], amount: o[1], createdAt: ts(i),
}));

export const coreRoutes = [
  route('GET', 'superadmin/user-management/get-spacific-user', ({ query }) => {
    const u = users.find((x) => x.uuid === query.uuid) || users[0];
    return { status: true, message: 'ok', data: { userData: { address: '120 King St W, Toronto, ON', postalCode: 'M5H 1J9', countryId: 1, stateId: 1, cityId: 1, ...u } } };
  }),
  route('GET', 'superadmin/user-management/get-user-list', () => ({ status: true, data: { userData: users }, message: 'Users retrieved successfully' })),
  route('GET', 'superadmin/user-management/get-client-list', () => ({ status: true, data: { userData: clients }, message: 'Clients retrieved successfully' })),
  route('GET', 'superadmin/role-management/get', () => ({ status: true, data: { roles }, message: 'Roles retrieved successfully' })),
  route('GET', 'superadmin/branch-management/get-branch-list', () => ({ status: true, message: 'Branches fetched successfully', data: { branchData: branches } })),
  route('GET', 'superadmin/brokerage/list', () => ({ status: true, data: { brokerageData }, message: 'Data retrieved successfully' })),
  route('GET', 'superadmin/lawyer-firm/list', () => ({ status: true, data: { lawyerFirm }, message: 'Data retrieved successfully' })),
  route('GET', 'superadmin/receipt-manage/list', () => ({ status: true, data: { receiptData }, message: 'Data retrieved successfully' })),
  route('GET', 'superadmin/pickup-receipt-manage/list', () => ({ status: true, data: { receiptData: pickupReceiptData }, message: 'Data retrieved successfully' })),
  route('GET', 'superadmin/plan-management/list', () => ({ status: true, data: { plans }, message: 'Plans Get Successfully.' })),
  route('GET', 'superadmin/plan-management/optional-plan/list', () => ({ status: true, data: { optionalPlans }, message: 'Optional plans retrieved successfully' })),
  route('GET', 'common/states', () => ({ status: true, data: { states }, message: 'States retrieved successfully' })),
];
