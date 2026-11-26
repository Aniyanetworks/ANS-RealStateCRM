/* eslint-disable @typescript-eslint/no-explicit-any */
const NAMES = ['Olivia Hart', 'Marcus Bell', 'Priya Nair', 'Daniel Cruz', 'Sofia Lang', 'Ethan Park', 'Amara Khan', 'Lucas Reid'];
const CITIES = ['Toronto', 'Mississauga', 'Brampton', 'Oakville', 'Markham'];
const STREETS = ['Maple Ave', 'Lakeshore Blvd', 'King St', 'Oak Lane', 'Bayview Dr', 'Queen St W'];
const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

const mk = <T,>(n: number, f: (i: number) => T) => Array.from({ length: n }, (_, i) => f(i));

export const properties = mk(30, (i) => ({
  id: i + 1,
  address: `${100 + i * 7} ${STREETS[i % 6]}`,
  propertyAddress: `${100 + i * 7} ${STREETS[i % 6]}, ${CITIES[i % 5]}, ON`,
  uuid: `pl-${String(i + 1).padStart(4, '0')}`,
  city: CITIES[i % 5],
  state: 'ON',
  listingPrice: String(450000 + ((i * 61) % 30) * 40000),
  salesPrice: String(440000 + ((i * 61) % 30) * 40000),
  soldPrice: String(445000 + ((i * 61) % 30) * 40000),
  closingDate: day((i * 9) % 200),
  contractDate: day((i * 9) % 200 + 20),
  createdAt: day(i * 4),
  status: ['active', 'pending', 'sold'][i % 3],
}));

const BUYERS = ['Hannah Moore', 'Peter Grant', 'Rosa Diaz', 'Tom Ellis', 'Grace Liu', 'Sam Ortiz'];
const tradeSheet = (i: number) => {
  const p = properties[i % properties.length];
  const addr = `${p.address}, ${p.city}, ON`;
  const [bf, bl] = BUYERS[i % 6].split(' ');
  const [sf, sl] = BUYERS[(i + 3) % 6].split(' ');
  const seller = i % 3 !== 0;
  return {
    id: i + 1,
    uuid: `ts-${String(i + 1).padStart(4, '0')}`,
    serial: i + 1,
    tradeSheetTypeId: `TS-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
    name: NAMES[i % NAMES.length],
    userId: (i % NAMES.length) + 10,
    branchId: 1,
    representation: seller ? 'seller' : 'buyer',
    representationType: 'single',
    listType: ['A', 'B', 'C'][i % 3],
    status: i % 4 === 0 ? 'underReview' : i % 7 === 0 ? 'draft' : 'approved',
    tradeStatus: ['pending', 'closed', 'soldConditional', 'closed'][i % 4],
    leadSource: ['Website', 'Referral', 'Open House', 'Zillow'][i % 4],
    createdAt: day(i * 6),
    properties: [{ ...p, propertyAddress: addr, depositAmount: String(10000 + (i % 5) * 5000) }],
    propertyListing: {
      propertyAddress: addr,
      sellersInfo: JSON.stringify({ sellersInfo: [{ firstName: sf, lastName: sl }] }),
    },
    buyerInformations: [{ firstName: bf, lastName: bl }],
    sharedUsers: i % 3 === 0 ? [{ name: NAMES[(i + 2) % NAMES.length], representationType: seller ? 'seller' : 'buyer' }] : [],
    agentDetails: [{ buyerCommissionType: 'percentage', sellerCommissionType: 'percentage', buyerCommission: 2 + (i % 3) * 0.25, sellerCommission: 2 + ((i + 1) % 3) * 0.25 }],
    lawyerDetails: [],
  };
};

export const tradeSheets = mk(24, tradeSheet);
export const archivedTradeSheets = mk(12, (i) => ({ ...tradeSheet(i + 40), status: 'closed' }));

export const agents = mk(NAMES.length, (i) => {
  const mine = tradeSheets.filter((_, t) => t % NAMES.length === i);
  return {
    id: i + 1,
    name: NAMES[i],
    status: i === 5 ? 'closed' : 'approved',
    brokerageId: i === 7 ? 99 : 24,
    dob: `199${i}-${String(((new Date().getMonth() + [0, 0, 1, -1, 0, 2, -2, 0][i] + 12) % 12) + 1).padStart(2, '0')}-${String(4 + i * 3).padStart(2, '0')}`,
    email: `${NAMES[i].split(' ')[0].toLowerCase()}@ans.demo`,
    phoneNumber: `416555${String(1000 + i)}`,
    isActive: 'yes',
    user: {
      id: i + 10, userTypeUId: `UID${String(i + 1).padStart(5, '0')}`, profilePicture: null,
      firstName: NAMES[i].split(' ')[0], lastName: NAMES[i].split(' ')[1],
      unitsSalesTradeSheets: mine,
      tradeSheetsCreated: mine,
      userInTradeSheetSharedUser: [],
      propertyListings: properties.filter((_, p) => p % NAMES.length === i),
    },
    tradeAgentCommission: mine.map((t) => ({
      agentCommissionTotal: String(Math.round(Number(t.properties[0].soldPrice) * 0.0125)),
      createdAt: t.createdAt,
      tradeSheet: { id: t.id, tradeSheetTypeId: t.tradeSheetTypeId },
    })),
  };
});

export const announcements = [
  { id: 1, title: 'Q4 Sales Kick-off', description: 'All-hands meeting Friday 10am at the downtown office.', image: '', status: 'published', date: day(2), created_at: day(2), createdAt: day(2) },
  { id: 2, title: 'New commission tiers', description: 'Updated tiers take effect Jan 1.', image: '', status: 'published', date: day(6), created_at: day(6), createdAt: day(6) },
  { id: 3, title: 'Market update', description: 'Average days on market dropped to 21 across the GTA.', image: '', status: 'published', date: day(9), created_at: day(9), createdAt: day(9) },
];

export const calendarEvents = mk(10, (i) => {
  const start = new Date(Date.now() + (i - 2) * 86400000 + (9 + i) * 3600000).toISOString();
  return { id: i + 1, title: ['Showing', 'Open House', 'Client Meeting', 'Inspection', 'Closing'][i % 5] + ' – ' + STREETS[i % 6], start, end: start, allDay: false };
});
