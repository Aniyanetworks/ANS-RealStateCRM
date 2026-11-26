/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from '../route';

const img = (s: string) => `https://picsum.photos/seed/${s}/600/400`;
const iso = (n: number) => new Date(Date.now() + n * 86400000).toISOString();
const ok = (data: any) => ({ status: true, data, message: 'Data retrieved successfully' });

const branch = {
  id: 1, uuid: 'br-0001', name: 'ANS Toronto HQ', slug: 'ans-toronto-hq', address: '100 King St W', postalCode: 'M5X 1A9',
  phone: '4165550100', email: 'toronto@ans.demo', isDefault: 'yes', status: 'active',
};

// ---------- Trade products ----------
const PRODUCT_DEFS: [string, string, number, number, number, number, string][] = [
  ['Realtor Lockbox (Bluetooth)', 'Purchase', 89.5, 0, 60, 0, 'Bluetooth-enabled realtor lockbox with 4-digit backup code.'],
  ['Standard Combination Lockbox', 'Purchase', 39, 0, 120, 0, 'Durable zinc alloy combination lockbox for property showings.'],
  ['For Sale Sign (24x36)', 'Purchase', 45, 0, 80, 0, 'Double-sided coroplast For Sale sign with ANS branding.'],
  ['Open House Sign Kit', 'Purchase', 65, 0, 40, 0, 'Open house sign with A-frame stand and 4 directional arrows.'],
  ['Business Cards (500)', 'Purchase', 55, 0, 200, 0, 'Premium matte business cards, 500 per box.'],
  ['Sold Rider Banner', 'Purchase', 18.75, 0, 150, 0, 'Sold rider banner for existing sign posts.'],
  ['Feature Flyers (250)', 'Purchase', 72, 0, 90, 0, 'Full-colour glossy feature sheets, 250 per pack.'],
  ['Sign Post (Steel, 6ft)', 'Purchase', 95, 0, 30, 0, 'Powder-coated steel sign post with hanging arm.'],
  ['Portable Photo Backdrop', 'Borrow', 0, 10, 0, 6, 'Portable backdrop for listing and client photos. Return in 3 days.'],
  ['Open House Tent (10x10)', 'Borrow', 0, 25, 0, 4, 'Pop-up tent with ANS branding for community events.'],
  ['Digital Laser Measure', 'Borrow', 0, 8, 0, 8, 'Laser distance measure for floor plans.'],
  ['Spare Lockbox (Loaner)', 'Borrow', 0, 5, 0, 10, 'Loaner lockbox for short-term listings.'],
];

const tradeProducts = PRODUCT_DEFS.map((p, i) => ({
  id: i + 1, uuid: `prod-${String(i + 1).padStart(4, '0')}`, slug: `product-${i + 1}`,
  product_name: p[0], type: p[1], image: img(`ans-product-${i + 1}`), unit_price: p[2], borrow_unit_price: p[3],
  quantity: p[4], borrow_quantity: p[5], description: p[6], branchId: 1, createdAt: iso(-90 + i * 5),
  tradeFile: [{ id: i + 1, tradeProductId: i + 1, filePath: img(`ans-product-${i + 1}`), createdAt: iso(-90 + i * 5), updatedAt: iso(-90 + i * 5) }],
  branch, branchIds: [1],
}));

// ---------- Coupons ----------
const COUPONS: [string, string, number, string, string, number[]][] = [
  ['WELCOME10', 'Percentage', 10, 'Active', 'Global', []],
  ['NEWAGENT25', 'Fixed', 25, 'Active', 'Global', []],
  ['SIGNS15', 'Percentage', 15, 'Active', 'Product Based', [3, 4, 6]],
  ['LOCKBOX20', 'Fixed', 20, 'Active', 'Product Based', [1, 2]],
  ['SPRING5', 'Percentage', 5, 'Inactive', 'Global', []],
  ['CARDS10', 'Fixed', 10, 'Active', 'Product Based', [5, 7]],
  ['LOYAL30', 'Fixed', 30, 'Active', 'Global', []],
  ['HOLIDAY12', 'Percentage', 12, 'Inactive', 'Global', []],
  ['EVENT50', 'Fixed', 50, 'Active', 'Product Based', [10]],
  ['TEAM8', 'Percentage', 8, 'Active', 'Global', []],
];
const coupons = COUPONS.map((c, i) => ({
  id: i + 1, uuid: `coup-${String(i + 1).padStart(4, '0')}`, coupon_code: c[0], type: c[1], discount: c[2], status: c[3],
  discount_scope: c[4], products: c[5].map((n) => tradeProducts[n - 1].uuid), branchId: i % 3 === 0 ? null : 1,
  createdAt: iso(-60 + i * 4), branch: i % 3 === 0 ? null : branch,
}));

// ---------- Users ----------
const USERS = [
  { id: 11, firstName: 'Olivia', lastName: 'Hart', name: 'Olivia Hart', email: 'olivia@ans.demo', phoneNumber: '4165551001' },
  { id: 12, firstName: 'Marcus', lastName: 'Bell', name: 'Marcus Bell', email: 'marcus@ans.demo', phoneNumber: '4165551002' },
  { id: 13, firstName: 'Priya', lastName: 'Nair', name: 'Priya Nair', email: 'priya@ans.demo', phoneNumber: '4165551003' },
  { id: 14, firstName: 'Daniel', lastName: 'Cruz', name: 'Daniel Cruz', email: 'daniel@ans.demo', phoneNumber: '4165551004' },
  { id: 15, firstName: 'Sofia', lastName: 'Lang', name: 'Sofia Lang', email: 'sofia@ans.demo', phoneNumber: '4165551005' },
  { id: 16, firstName: 'Ethan', lastName: 'Park', name: 'Ethan Park', email: 'ethan@ans.demo', phoneNumber: '4165551006' },
];
const pubUser = (u: any) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, name: u.name, email: u.email });

// ---------- Inventory ----------
const INV: [string, number, string][] = [
  ['Realtor Lockbox (Bluetooth)', 48, 'Bluetooth lockboxes in stock'],
  ['Standard Combination Lockbox', 95, 'Combination lockboxes'],
  ['For Sale Sign (24x36)', 62, 'Coroplast For Sale signs'],
  ['Open House Sign Kit', 25, 'Open house A-frame kits'],
  ['Sign Post (Steel, 6ft)', 18, 'Steel sign posts'],
  ['Sold Rider Banner', 110, 'Sold rider banners'],
  ['Portable Photo Backdrop', 5, 'Loaner photo backdrops'],
  ['Open House Tent (10x10)', 3, 'Branded pop-up tents'],
  ['Digital Laser Measure', 7, 'Laser measures'],
  ['Feature Flyers (250)', 70, 'Flyer packs'],
];
const baseInventory = INV.map((p, i) => ({
  id: i + 1, uuid: `inv-${String(i + 1).padStart(4, '0')}`, slug: `inventory-${i + 1}`, productName: p[0], quantity: p[1],
  description: p[2], image: img(`ans-inventory-${i + 1}`), branchId: 1, createdAt: iso(-120 + i * 6), updatedAt: iso(-5 - i), branch,
}));
const transactions = Array.from({ length: 14 }, (_, i) => {
  const inv = baseInventory[i % baseInventory.length];
  return {
    id: i + 1, uuid: `invtx-${String(i + 1).padStart(4, '0')}`, slug: `invtx-${i + 1}`, inventoryId: inv.id, userId: USERS[i % 6].id,
    transactionType: i % 3 === 2 ? 'return' : 'give', quantity: (i % 4) + 1,
    notes: i % 3 === 2 ? 'Returned in good condition' : 'Issued to agent for listing', createdAt: iso(-i * 3 - 1), updatedAt: iso(-i * 3 - 1),
    user: pubUser(USERS[i % 6]),
  };
}).sort((a, b) => b.id - a.id);
const inventory = baseInventory.map((inv) => ({
  ...inv, transactions: transactions.filter((t) => t.inventoryId === inv.id).map((t) => ({ ...t })),
})).reverse();
const transactionData = transactions.map((t) => ({ ...t, inventory: baseInventory[t.inventoryId - 1] }));

// ---------- Orders (invoices) ----------
const orders = Array.from({ length: 12 }, (_, i) => {
  const type = i % 4 === 3 ? 'borrow' : 'purchase';
  const pool = tradeProducts.filter((p) => p.type === (type === 'borrow' ? 'Borrow' : 'Purchase'));
  const items = [0, 1].slice(0, (i % 2) + 1).map((k, idx) => {
    const tp = pool[(i + k) % pool.length];
    const qty = ((i + idx) % 3) + 1;
    const unit = type === 'borrow' ? tp.borrow_unit_price : tp.unit_price;
    return {
      id: i * 3 + idx + 1, invoiceId: i + 1, tradeProductId: tp.id, due_date: type === 'borrow' ? iso(-i + 5) : null,
      pickup_date: iso(-i * 2), returned_date: type === 'borrow' && i % 2 === 0 ? iso(-i + 1) : null, quantity: qty,
      unit_price: unit, total_price: Math.round(unit * qty * 100) / 100, order_item_status: type === 'borrow' ? 'Borrow' : 'Purchase',
      createdAt: iso(-i * 2), tradeProduct: tp,
    };
  });
  const sub = items.reduce((s, it) => s + it.total_price, 0);
  const tax = Math.round(sub * 0.13 * 100) / 100;
  const u = USERS[i % 6];
  return {
    id: i + 1, uuid: `ord-${String(i + 1).padStart(4, '0')}`, invoice_number: `INV-${2026}${String(1001 + i)}`,
    squareTransactionId: null, agentId: u.id, issued_date: iso(-i * 2), status: ['Paid', 'Pending', 'Due'][i % 3], type,
    comment: null, total_amount: Math.round((sub + tax) * 100) / 100, discount: i % 4 === 0 ? 10 : 0, tax,
    online_transection_charge: Math.round(sub * 0.029 * 100) / 100, payment_method: ['Credit Card', 'Interac', 'Cheque'][i % 3],
    signature: null, attatchment: null, agreement_status: null, agreedAt: null, createdAt: iso(-i * 2), updatedAt: iso(-i * 2),
    agent: { ...pubUser(u), phoneNumber: u.phoneNumber, userType: 'agent' }, invoiceItems: items,
  };
});

// ---------- Realtor (MLS-style) properties ----------
const CITIES = ['Toronto', 'Mississauga', 'Brampton', 'Oakville', 'Markham', 'Vaughan'];
const STREETS = ['Maple Ave', 'Lakeshore Blvd', 'King St', 'Oak Lane', 'Bayview Dr', 'Queen St W', 'Yonge St', 'Dundas St'];
const PTYPES = ['Residential Freehold', 'Residential Condo & Other', 'Residential Freehold', 'Commercial'];
const realtorProps = Array.from({ length: 14 }, (_, i) => {
  const u = USERS[i % 6];
  const active = i % 4 !== 3;
  const price = 549000 + ((i * 37) % 20) * 45000;
  return {
    ListingKey: `C${5600100 + i * 17}`, ContractStatus: active ? 'Available' : 'Unavailable', ListPrice: price,
    MlsStatus: active ? (i % 5 === 0 ? 'New' : 'Active') : 'Sold', ListAgentKey: `AG${3000 + i}`, ListOfficeKey: 'OF1042',
    ListAgentFullName: u.name, ListAgentDirectPhone: u.phoneNumber, PropertyType: PTYPES[i % 4],
    StreetNumber: String(120 + i * 11), StreetName: STREETS[i % 8], City: CITIES[i % 6],
    StandardStatus: active ? 'Active' : 'Closed', OriginatingSystemName: 'Toronto Regional Real Estate Board',
    OriginalListPrice: price + 20000, OriginalListPriceUnit: 'CAD', PercentListPrice: active ? null : '97.5', PreviousListPrice: i % 2 ? price + 10000 : null,
    RoomsTotal: 6 + (i % 5), RoomsAboveGrade: 5 + (i % 3), RoomsBelowGrade: i % 3, ExpirationDate: iso(10 + i * 9),
  };
});

// ---------- Upload file names ----------
const CATS = [
  { id: 1, uuid: 'cat-0001', slug: 'listing-docs', name: 'Listing Documents', status: 'active' },
  { id: 2, uuid: 'cat-0002', slug: 'buyer-docs', name: 'Buyer Documents', status: 'active' },
  { id: 3, uuid: 'cat-0003', slug: 'compliance', name: 'Compliance', status: 'active' },
];
const FILES: [string, string, number, string, string, string][] = [
  ['Agreement of Purchase and Sale', 'Seller', 0, 'singleUpload', 'yes', 'Sales'],
  ['Listing Agreement (Form 200)', 'Seller', 0, 'singleUpload', 'yes', 'Sales'],
  ['Seller Property Information Sheet', 'Seller', 0, 'singleUpload', 'no', 'Sales'],
  ['Buyer Representation Agreement', 'Buyer', 1, 'singleUpload', 'yes', 'Sales'],
  ['Confirmation of Co-operation (Form 320)', 'Buyer', 1, 'multipleUpload', 'yes', 'Sales'],
  ['Pre-Approval Letter', 'Buyer', 1, 'singleUpload', 'no', 'Sales'],
  ['Tenant Application (Form 410)', 'Tenant', 1, 'singleUpload', 'yes', 'Lease'],
  ['Lease Agreement (Form 400)', 'Landlord', 0, 'singleUpload', 'yes', 'Lease'],
  ['Credit Report', 'Tenant', 1, 'singleUpload', 'no', 'Lease'],
  ['FINTRAC Identification Record', 'Seller', 2, 'singleUpload', 'yes', 'Sales'],
  ['RECO Disclosure Form', 'Buyer', 2, 'singleUpload', 'yes', 'Sales'],
  ['Deposit Receipt', 'Buyer', 2, 'multipleUpload', 'no', 'Sales'],
];
const uploadFileNames = FILES.map((f, i) => ({
  id: i + 1, uploadFileCategoryId: CATS[f[2]].id, uuid: `fname-${String(i + 1).padStart(4, '0')}`, slug: `file-name-${i + 1}`, name: f[0],
  representation: f[1], paperType: f[3], required: 'yes', hasAdditionalFile: f[4], showOnPropertyListing: i % 3 === 0 ? 'Yes' : 'No',
  propertyListingRequired: i % 4 === 0 ? 'Yes' : 'No', listType: f[5], status: 'active', createdAt: iso(-200 + i * 7), updatedAt: iso(-20),
  sellerOrder: i + 1, buyerOrder: i + 1, tenantOrder: i + 1, landlordOrder: i + 1, uploadFileCategory: CATS[f[2]],
}));

// ---------- Expiring listings / closing trade sheets ----------
const expiring = Array.from({ length: 4 }, (_, i) => ({
  id: 900 + i, uuid: `pl-exp-${i + 1}`, propertyListingTypeId: `PL-26${String(210 + i)}`,
  address: `${40 + i * 13} ${STREETS[(i + 2) % 8]}, ${CITIES[i % 6]}, ON`, city: CITIES[i % 6], state: 'ON',
  listingPrice: String(699000 + i * 85000), status: 'active', expiryDate: iso(i === 0 ? 1 : i === 1 ? 3 : i === 2 ? 5 : 7),
  createdAt: iso(-80 + i), branchId: 1, branch, createdBy: USERS[i].id, createdUser: pubUser(USERS[i]), sharedUsers: [],
  propertyListingAttachment: [], propertyListingOtherAttachment: [], notes: [], activityLog: [],
}));
const closings = Array.from({ length: 8 }, (_, i) => {
  const addr = `${200 + i * 9} ${STREETS[i % 8]}, ${CITIES[i % 6]}, ON`;
  const closeIn = i < 4 ? 2 + i * 5 : 35 + i * 6;
  return {
    id: 700 + i, uuid: `ts-close-${i + 1}`, tradeSheetTypeId: `TS-2026-${String(30 + i).padStart(4, "0")}`, status: ['approved', 'underReview', 'approved', 'closed'][i % 4],
    createdAt: iso(-45 - i), createdBy: USERS[i % 6].id, sharedUsers: [], buyerInformations: [], sellerInformations: [], lawyerDetails: null,
    propertyListing: null,
    properties: [{
      id: 700 + i, propertyAddress: addr, address: addr, city: CITIES[i % 6], state: 'ON', closingDate: iso(closeIn), contractDate: iso(-30 - i),
      salesPrice: String(720000 + i * 38000), soldPrice: String(725000 + i * 38000), listingPrice: String(735000 + i * 38000),
    }],
  };
});

export const marketRoutes = [
  route('GET', 'superadmin/trade-products/list', () => ok({ TradeProductsData: tradeProducts })),
  route('GET', 'superadmin/coupons/list', () => ok({ CouponData: coupons })),
  route('GET', 'superadmin/inventory/list', () => ok({ InventoryData: inventory })),
  route('GET', 'superadmin/inventory/transactions/list', () => ok({ TransactionData: transactionData })),
  route('GET', 'superadmin/order-management/list', ({ query }) => {
    const t = String(query?.order_type || '').toLowerCase();
    const list = t === 'borrow' || t === 'purchase' ? orders.filter((o) => o.type === t) : orders;
    return ok({ OrderData: list });
  }),
  route('GET', 'superadmin/realtor-property/list', () => ({ status: true, data: realtorProps, message: 'Realtor properties fetched successfully' })),
  route('GET', 'superadmin/dynamic-file-name/list', () => ok({ uploadFileNames })),
  route('GET', 'superadmin/property-listing/get-trade-property-listing-based-on-expiry', () => ok({ propertyListingData: expiring })),
  route('GET', 'agent/trade-sheet-management/get-trade-sheet-list-based-on-closing', () => ok({ tradeSheetData: closings })),
] as ReturnType<typeof route>[];
