/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from '../route';

const DAY = 86400000;
const ago = (days: number, hour?: number, min = 0) => {
  const d = new Date(Date.now() - days * DAY);
  if (hour !== undefined) d.setHours(hour, min, 0, 0);
  return d.toISOString();
};
const mk = <T,>(n: number, f: (i: number) => T): T[] => Array.from({ length: n }, (_, i) => f(i));
const uuid = (p: string, i: number) => `${p}-0000-4000-8000-${String(i + 1).padStart(12, '0')}`;
const NAMES = ['Olivia Hart', 'Marcus Bell', 'Priya Nair', 'Daniel Cruz', 'Sofia Lang', 'Ethan Park', 'Amara Khan', 'Lucas Reid'];
const slugEmail = (n: string) => `${n.toLowerCase().replace(/[^a-z]+/g, '.')}@ans.demo`;
const CITIES = ['Toronto', 'Mississauga', 'Brampton', 'Oakville', 'Markham', 'Vaughan'];
const BRANCHES = [
  { id: 1, name: 'Toronto', uuid: uuid('branch', 0) },
  { id: 2, name: 'Mississauga', uuid: uuid('branch', 1) },
  { id: 3, name: 'Oakville', uuid: uuid('branch', 2) },
];
const person = (i: number) => {
  const name = NAMES[i % NAMES.length];
  const [firstName, lastName] = name.split(' ');
  return { id: 10 + (i % NAMES.length), firstName, lastName, name, email: slugEmail(name) };
};
const strip = (s: string) => s.replace(/<[^>]*>/g, '');

const notifMsgs: [string, string][] = [
  ['New trade sheet submitted for 128 Maple Ave, Toronto', '/dashboard/super-admin/trade-sheets'],
  ['A new support request was assigned to you', '/dashboard/super-admin/support-request'],
  ['Announcement published: Q4 brokerage meeting', '#'],
  ['Commission invoice for 55 King St W is ready for review', '/dashboard/super-admin/invoices'],
  ['New lead assigned: Priya Nair', '/dashboard/super-admin/leads'],
  ['Agent onboarding approved for Marcus Bell', '/dashboard/super-admin/agents'],
  ['Listing at 210 Lakeshore Blvd moved to pending', '/dashboard/super-admin/property-listing'],
  ['Calendar note shared with you by Ava Morgan', '#'],
  ['Trade sheet closed: 14 Bayview Dr, Markham', '/dashboard/super-admin/trade-sheets'],
  ['Knowledge base article updated: Referral Forms', '#'],
];
const notifications = notifMsgs.map(([message, url], i) => ({
  id: 500 - i,
  notifiableId: 1,
  type: 'general',
  data: JSON.stringify({ message, url }),
  readAt: null,
  createdAt: ago(i * 0.4, 9, 10 + i),
  updatedAt: ago(i * 0.4, 9, 10 + i),
  notifiableUser: { id: 1, firstName: 'Ava', lastName: 'Morgan', name: 'Ava Morgan', email: 'admin@ans.demo' },
}));

const logTitles = ['Q4 Brokerage Meeting', 'New Commission Structure', 'Holiday Office Hours', 'Compliance Reminder: RECO Renewal', 'Spring Open House Event', 'CRM Training Webinar', 'Referral Program Update', 'Market Report: GTA November'];
const announcementLogs = logTitles.map((title, i) => {
  const type = ['EMAIL', 'SMS', 'BOTH'][i % 3];
  const agents = mk(4 + (i % 4), (k) => NAMES[k % NAMES.length]);
  const total = agents.length + 2;
  const status = ['COMPLETED', 'COMPLETED', 'PARTIALLY_FAILED', 'COMPLETED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'COMPLETED'][i];
  return {
    id: i + 1,
    uuid: uuid('nlog', i),
    announcementId: i + 1,
    notificationType: type,
    title,
    emailBody: `<p>${title} - details inside.</p>`,
    smsBody: type === 'EMAIL' ? null : `ANS: ${title}`,
    targetAgents: agents,
    customEmails: ['broker@ans.demo', 'office@ans.demo'].slice(0, i % 3),
    customPhones: i % 2 ? ['416-555-0142'] : [],
    totalRecipients: total,
    emailsSent: type === 'SMS' ? 0 : total - (status === 'PARTIALLY_FAILED' ? 1 : 0),
    emailsFailed: status === 'PARTIALLY_FAILED' ? 1 : 0,
    smsSent: type === 'EMAIL' ? 0 : total,
    smsFailed: status === 'FAILED' ? total : 0,
    status,
    sentAt: ago(i * 6 + 1, 10),
    completedAt: status === 'IN_PROGRESS' ? null : ago(i * 6 + 1, 10, 5),
    createdAt: ago(i * 6 + 1, 10),
    announcement: { id: i + 1, title, uuid: uuid('ann', i) },
  };
});

const noteTexts = ['Broker open house at 128 Maple Ave', 'Submit RECO renewal paperwork', 'Team lunch - Mississauga office', 'Quarterly commission review', 'Photographer booked for 55 King St W', 'Mortgage broker call at 2 PM', 'Office closed - statutory holiday', 'Agent training: new CRM features', 'Closing day: 14 Bayview Dr', 'Staff meeting - Oakville branch'];
const owner1 = { id: 1, firstName: 'Ava', lastName: 'Morgan', name: 'Ava Morgan', email: 'admin@ans.demo' };
const calendarNotes = noteTexts.map((note, i) => ({
  id: i + 1,
  uuid: uuid('note', i),
  note,
  date: ago(-(i * 3 - 6)).slice(0, 10) + 'T00:00:00.000Z',
  createdBy: i % 4 === 3 ? 2 : 1,
  owner: i % 4 === 3 ? { id: 2, firstName: 'Noah', lastName: 'Walsh', name: 'Noah Walsh', email: 'noah.walsh@ans.demo' } : owner1,
  viewers: i % 3 === 0 ? [{ id: i + 1, noteId: i + 1, userId: 2, viewer: { id: 2, firstName: 'Noah', lastName: 'Walsh', name: 'Noah Walsh', email: 'noah.walsh@ans.demo' } }] : [],
  createdAt: ago(10 + i),
  updatedAt: ago(10 + i),
}));
const branchAdmins = [
  { id: 2, firstName: 'Noah', lastName: 'Walsh', name: 'Noah Walsh', email: 'noah.walsh@ans.demo', branchId: 1, roleId: 1 },
  { id: 3, firstName: 'Grace', lastName: 'Liu', name: 'Grace Liu', email: 'grace.liu@ans.demo', branchId: 2, roleId: 1 },
  { id: 4, firstName: 'Omar', lastName: 'Siddiqui', name: 'Omar Siddiqui', email: 'omar.siddiqui@ans.demo', branchId: 3, roleId: 1 },
];

const campaignDefs: [string, string, string][] = [
  ['Facebook Buyers - Mississauga', 'active', 'Facebook'],
  ['Google Ads - Toronto Condos', 'active', 'Google'],
  ['Seller Leads - Oakville', 'active', 'Facebook'],
  ['Open House Sign-ins Fall 2026', 'completed', 'Event'],
  ['Pre-Construction Launch - Vaughan', 'active', 'Google'],
  ['Instagram Luxury Homes', 'inactive', 'Instagram'],
  ['Referral Partners Q3', 'completed', 'Referral'],
  ['First-Time Buyer Webinar', 'active', 'Webinar'],
  ['Investor Leads - Brampton', 'active', 'Facebook'],
  ['Past Client Re-engagement', 'inactive', 'Email'],
];
const campaigns = campaignDefs.map(([name, status, typeOfCampaign], i) => ({
  id: i + 1,
  uuid: uuid('camp', i),
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  name,
  status,
  typeOfCampaign,
  branchId: i % 4 === 3 ? null : BRANCHES[i % 3].id,
  branch: i % 4 === 3 ? null : BRANCHES[i % 3],
  createdAt: ago(i * 11 + 3, 11),
  updatedAt: ago(i * 11 + 3, 11),
  _count: { leads: 6 + ((i * 5) % 9) },
}));
const leadStatuses = ['New', 'No Response', 'Responded', 'Qualified', 'Not Qualified', 'Active', 'Lost', 'Closed'];
const PROPS = ['Detached', 'Condo', 'Townhouse', 'Semi-Detached'];
const BUDGETS = ['$600k - $800k', '$800k - $1M', '$450k - $600k', '$1M - $1.5M'];
const LEAD_NAMES = ['Nadia Rahman', 'Tom Whitfield', 'Elena Petrova', 'Jason Cho', 'Hannah Singh', 'Mike Dubois', 'Aisha Mohammed', 'Chris Tremblay', 'Laura Fernandes', 'Kevin Okafor', 'Sara Bianchi', 'David Wong'];
const allLeads = mk(40, (i) => {
  const camp = campaigns[i % campaigns.length];
  const hasAgent = i % 3 !== 0;
  const ag = person(i);
  const name = LEAD_NAMES[i % LEAD_NAMES.length];
  return {
    id: 200 - i,
    uuid: uuid('lead', i),
    campaignId: camp.id,
    typeOfCampaign: camp.typeOfCampaign,
    leadDate: ago(i * 2 + 1, 9).slice(0, 10) + 'T00:00:00.000Z',
    platform: camp.typeOfCampaign,
    propertyType: PROPS[i % 4],
    budget: BUDGETS[i % 4],
    timeRange: ['0-3 months', '3-6 months', '6-12 months'][i % 3],
    prefContact: ['Phone', 'Email', 'Text'][i % 3],
    name,
    phone: `416-555-${String(1000 + i * 17).slice(-4)}`,
    email: slugEmail(name),
    prefLocation: CITIES[i % CITIES.length],
    form: 'Website Form',
    status: leadStatuses[i % leadStatuses.length],
    agentAssigned: hasAgent ? ag.id : null,
    agent: hasAgent ? { id: ag.id, user: { id: ag.id, name: ag.name } } : null,
    createdAt: ago(i * 2 + 1, 9),
    updatedAt: ago(i * 2, 9),
    campaign: { id: camp.id, uuid: camp.uuid, slug: camp.slug, name: camp.name, status: camp.status, typeOfCampaign: camp.typeOfCampaign },
  };
});

const supportTeam = [
  { id: 21, firstName: 'Jordan', lastName: 'Ellis', name: 'Jordan Ellis', email: 'jordan.ellis@ans.demo', roleId: 5, userType: 'support' },
  { id: 22, firstName: 'Mia', lastName: 'Tanaka', name: 'Mia Tanaka', email: 'mia.tanaka@ans.demo', roleId: 5, userType: 'support' },
  { id: 23, firstName: 'Carlos', lastName: 'Mendez', name: 'Carlos Mendez', email: 'carlos.mendez@ans.demo', roleId: 5, userType: 'support' },
  { id: 24, firstName: 'Rhea', lastName: 'Kapoor', name: 'Rhea Kapoor', email: 'rhea.kapoor@ans.demo', roleId: 6, userType: 'support' },
];
const supportDefs: [string, string, string, string, string][] = [
  ['Cannot upload APS to trade sheet', 'Bug Fix', 'High', 'open', 'The upload spinner never finishes when attaching the Agreement of Purchase and Sale.'],
  ['Add commission split calculator', 'New Feature', 'Medium', 'inProgress', 'Would like a split calculator on the trade sheet form.'],
  ['Update email signature template', 'Improvement', 'Low', 'completed', 'Please refresh the signature block with the new brokerage logo.'],
  ['Listing photos not showing', 'Bug Fix', 'High', 'inProgress', 'Photos for 210 Lakeshore Blvd show broken thumbnails.'],
  ['Export leads to CSV', 'New Feature', 'Medium', 'open', 'Need an export button on the lead list for my campaigns.'],
  ['Change password email not received', 'Bug Fix', 'Medium', 'closed', 'Reset email never arrives in my inbox.'],
  ['Add Oakville office to dropdown', 'Improvement', 'Low', 'completed', 'Branch dropdown is missing the Oakville office.'],
  ['Calendar events show wrong timezone', 'Bug Fix', 'High', 'open', 'Events display one hour early since the time change.'],
  ['Request for training session', 'Other', 'Low', 'open', 'Can we schedule a CRM walkthrough for new agents?'],
  ['Invoice PDF missing HST number', 'Bug Fix', 'High', 'inProgress', 'Generated commission invoice does not include our HST registration.'],
];
const deletedSupport = new Set<string>();
const supportRequests = (kind: string) => supportDefs.map(([title, type, priority, status, description], i) => {
  const ag = person(i);
  const member = supportTeam[i % 3];
  const assigned = status !== 'open' || i % 2 === 0;
  return {
    id: (kind === 'graphic' ? 300 : 100) + i,
    uuid: uuid(kind === 'graphic' ? 'art' : 'sup', i),
    suportID: `${kind === 'graphic' ? 'ART' : 'SUP'}-${String(1001 + i)}`,
    title: kind === 'graphic' ? ['Open house flyer', 'Just Sold postcard', 'Social media banner', 'Business card refresh', 'Listing brochure', 'Email header', 'Yard sign design', 'Video thumbnail', 'Agent bio graphic', 'Holiday card'][i] : title,
    description: `<p>${description}</p>`,
    type,
    priority,
    status,
    userId: ag.id,
    user: { id: ag.id, name: ag.name, firstName: ag.firstName, lastName: ag.lastName, email: ag.email, userType: 'agent' },
    team: null,
    files: [],
    artWorkRequestFile: [],
    artworkRequirement: null,
    assignments: assigned ? [{ id: i + 1, supportRequestId: 100 + i, teamMemberId: member.id, note: null, teamMember: member, createdAt: ago(i + 1) }] : [],
    createdAt: ago(i * 2 + 1, 13, 20),
    updatedAt: ago(i * 2, 13, 20),
  };
});

const vendorCategories = ['Home Inspection', 'Mortgage Broker', 'Real Estate Lawyer', 'Photography', 'Staging', 'Moving Company', 'Cleaning Services', 'Contractor', 'Insurance', 'Appraisal'].map((name, i) => ({ id: i + 1, name, createdAt: ago(100 - i), updatedAt: ago(100 - i) }));
const companyDefs: [string, string, string, string[], string, string][] = [
  ['Northshore Home Inspections', 'northshoreinspect.demo', '416-555-0111', ['Home Inspection'], 'coupon', 'ANS10'],
  ['Maple Mortgage Group', 'maplemortgage.demo', '905-555-0122', ['Mortgage Broker'], 'none', ''],
  ['Harbour Law Professional Corp', 'harbourlaw.demo', '416-555-0133', ['Real Estate Lawyer'], 'url', 'https://harbourlaw.demo/ans'],
  ['BrightFrame Photography', 'brightframe.demo', '647-555-0144', ['Photography'], 'coupon', 'LISTING15'],
  ['Stage & Style Co.', 'stageandstyle.demo', '905-555-0155', ['Staging'], 'none', ''],
  ['SwiftMove GTA', 'swiftmovegta.demo', '416-555-0166', ['Moving Company'], 'url', 'https://swiftmovegta.demo/ans-agents'],
  ['SparkClean Services', 'sparkclean.demo', '905-555-0177', ['Cleaning Services'], 'none', ''],
  ['Ironwood Renovations', 'ironwoodreno.demo', '647-555-0188', ['Contractor'], 'coupon', 'ANSREFER'],
  ['Lakeview Insurance Brokers', 'lakeviewins.demo', '905-555-0199', ['Insurance'], 'none', ''],
  ['Precision Appraisals Ontario', 'precisionappraisal.demo', '416-555-0210', ['Appraisal'], 'none', ''],
];
const companies = companyDefs.map(([companyName, site, companyPhoneNumber, category, discountType, discount], i) => ({
  id: i + 1,
  companyName,
  companyWebsite: `https://${site}`,
  companyPhoneNumber,
  companyEmail: `info@${site.replace('.demo', '')}.ans.demo`,
  category,
  discountType,
  discount,
  socialUrls: [
    { id: i * 2 + 1, platform: 'Instagram', handle: `@${site.split('.')[0]}`, fullUrl: `https://instagram.com/${site.split('.')[0]}`, companyId: i + 1, createdAt: ago(80), updatedAt: ago(80) },
    { id: i * 2 + 2, platform: 'Facebook', handle: site.split('.')[0], fullUrl: `https://facebook.com/${site.split('.')[0]}`, companyId: i + 1, createdAt: ago(80), updatedAt: ago(80) },
  ],
  createdAt: ago(90 - i * 3),
  updatedAt: ago(40 - i),
}));
const vendors = companies.slice(0, 8).map((c, i) => {
  const p = person(i + 2);
  return {
    id: i + 1,
    companyId: c.id,
    category: c.category,
    contactPerson: p.name,
    contactPersonPhoneNumber: `416-555-${String(2000 + i * 31).slice(-4)}`,
    email: p.email,
    status: ['active', 'active', 'pending', 'active', 'inactive', 'active', 'active', 'pending'][i],
    createdAt: ago(60 - i * 4),
    updatedAt: ago(30 - i),
    company: c,
  };
});

const templateDefs: [string, string, string][] = [
  ['Trade Sheet Share - Standard', 'Documents for {{property_address}}', '<p>Hi {{recipient_name}},</p><p>Please find attached the documents for {{property_address}}.</p><p>Regards,<br/>ANS RealStateCRM</p>'],
  ['Trade Sheet Share - Lawyer Package', 'Closing package: {{property_address}}', '<p>Dear Counsel,</p><p>Attached is the closing package for {{property_address}}. Closing date: {{closing_date}}.</p>'],
  ['Trade Sheet Share - Mortgage Broker', 'Deal summary for {{property_address}}', '<p>Hello,</p><p>Please see the accepted offer and deposit receipt for {{property_address}}.</p>'],
  ['Conditions Removal Notice', 'Conditions removed: {{property_address}}', '<p>All conditions have been waived on {{property_address}}. Congratulations!</p>'],
  ['Seller Package', 'Seller documents - {{property_address}}', '<p>Hi {{recipient_name}}, here is your seller package including the signed listing agreement.</p>'],
  ['Pre-Closing Checklist', 'Pre-closing checklist for {{property_address}}', '<p>Reminder: final walkthrough, utilities transfer, and insurance binder are due before closing.</p>'],
];
const templateBuilders = templateDefs.map(([name, subject, content], i) => ({
  id: i + 1,
  uuid: uuid('tpl', i),
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  createdBy: 1,
  name,
  subject,
  content,
  type: 'email',
  area: 'tradesheet_share_document',
  status: i === 5 ? 'inactive' : 'active',
  createdAt: ago(60 - i * 7),
  updatedAt: ago(20 - i),
  createdUser: owner1,
}));

const kbDefs: [string, string, string, string][] = [
  ['Buyer Representation Agreement (Form 300)', 'document', 'https://ans.demo/docs/form-300.pdf', 'Standard OREA buyer representation agreement.'],
  ['Listing Agreement (Form 200)', 'document', 'https://ans.demo/docs/form-200.pdf', 'Seller listing agreement for exclusive listings.'],
  ['Agreement of Purchase and Sale (Form 100)', 'document', 'https://ans.demo/docs/form-100.pdf', 'The standard APS for resale properties.'],
  ['Referral Fee Agreement', 'document', 'https://ans.demo/docs/referral.pdf', 'Use when referring a client to another brokerage.'],
  ['Getting Started with the CRM', 'tutorial', 'https://video.ans.demo/crm-getting-started', 'Walkthrough of the agent dashboard and navigation.'],
  ['Creating a Trade Sheet', 'tutorial', 'https://video.ans.demo/trade-sheet', 'Step by step guide to submit a trade sheet.'],
  ['Managing Leads and Campaigns', 'tutorial', 'https://video.ans.demo/leads', 'How to follow up and update lead statuses.'],
  ['New Agent Orientation', 'training', 'https://calendly.demo/ans/orientation', 'Book your orientation session with the broker of record.'],
  ['Compliance and Trust Accounting', 'training', 'https://calendly.demo/ans/compliance', 'Annual compliance training appointment.'],
  ['Marketing Support Consultation', 'training', 'https://calendly.demo/ans/marketing', 'Schedule time with the marketing team.'],
];
const knowledgeBase = kbDefs.map(([title, type, url, description], i) => ({
  id: kbDefs.length - i,
  uuid: uuid('kb', i),
  title,
  description: `<p>${description}</p>`,
  type,
  url,
  status: i === 9 ? 'inactive' : 'active',
  createdAt: ago(i * 9 + 2),
  updatedAt: ago(i * 9 + 1),
}));

const fnode = (id: number, name: string, parentId: number | null, isFolder: boolean, extra: any = {}) => ({
  id, ownerId: 1, name, parentId, isFolder, permissions: [], s3Key: isFolder ? null : `demo/${id}-${name}`,
  size: isFolder ? null : extra.size ?? 250000, mimeType: isFolder ? null : extra.mimeType ?? 'application/pdf',
  createdAt: ago(40 - id), updatedAt: ago(10 - (id % 8)),
});
const PDF = 'application/pdf';
const fileNodes = [
  fnode(1, 'Listing Documents', null, true),
  fnode(2, 'Trade Sheets 2026', null, true),
  fnode(3, 'Marketing Assets', null, true),
  fnode(4, 'Brokerage Policies.pdf', null, false, { size: 842000 }),
  fnode(5, 'Commission Schedule.xlsx', null, false, { size: 56000, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
  fnode(6, '128 Maple Ave - Listing Agreement.pdf', 1, false, { size: 310000 }),
  fnode(7, '55 King St W - MLS Sheet.pdf', 1, false, { size: 198000 }),
  fnode(8, 'Seller Disclosures', 1, true),
  fnode(9, 'Q3 Closed Deals', 2, true),
  fnode(10, '14 Bayview Dr - APS.pdf', 2, false, { size: 455000 }),
  fnode(11, 'Open House Flyer.png', 3, false, { size: 1250000, mimeType: 'image/png' }),
  fnode(12, 'Brand Guidelines.pdf', 3, false, { size: 2100000, mimeType: PDF }),
  fnode(13, 'Property Disclosure.pdf', 8, false, { size: 140000 }),
];
const sharedNodes = [
  { ...fnode(101, 'Training Materials', null, true), ownerId: 2, permissions: ['view', 'download'] },
  { ...fnode(102, 'Agent Handbook 2026.pdf', null, false, { size: 980000 }), ownerId: 2, permissions: ['view', 'download'] },
  { ...fnode(103, 'Office Lease Summary.pdf', null, false, { size: 220000 }), ownerId: 3, permissions: ['view'] },
  { ...fnode(104, 'Branch Marketing Plan', null, true), ownerId: 3, permissions: ['view'] },
];

const clockUsers = [2, 3, 4, 5, 6, 7].map((k) => {
  const p = person(k);
  return { ...p, branchId: BRANCHES[k % 3].id, branch: { id: BRANCHES[k % 3].id, name: BRANCHES[k % 3].name } };
});
const clockRecords: any[] = [];
let cid = 1;
for (let d = 0; d < 6; d++) {
  clockUsers.forEach((u, ui) => {
    if (d === 0 && ui >= 3) return;
    const inH = 8 + (ui % 3);
    const inMin = (ui * 7 + d * 3) % 40;
    const mk1 = (action: 'clock_in' | 'clock_out', hour: number, min: number) => ({
      id: cid, uuid: uuid('clk', cid++), userId: u.id, branchId: u.branchId, action,
      latitude: String(43.6487 + ui * 0.001), longitude: String(-79.3817 - ui * 0.001),
      address: `${100 + ui * 20} King St W, ${CITIES[ui % CITIES.length]}, ON`,
      distance: 12 + ui * 9, isWithinRange: true, notes: ['Property showing', 'Client meeting', 'Open house', 'Office day', null][ui % 5], shiftId: null,
      lateMinutes: null, lateReason: null, payableHours: null, lateExtraMinutes: null, lateExtraApproved: false, offsiteRequestId: null,
      createdAt: ago(d, hour, min), updatedAt: ago(d, hour, min),
      user: { id: u.id, firstName: u.firstName, lastName: u.lastName, name: u.name, email: u.email, branchId: u.branchId, branch: u.branch },
      branch: u.branch,
    });
    clockRecords.push(mk1('clock_in', inH, inMin));
    if (d > 0) clockRecords.push(mk1('clock_out', inH + 8, inMin + 5 > 59 ? 0 : inMin + 5));
  });
}
clockRecords.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
const myLastRecord = {
  ...clockRecords.find((r) => r.action === 'clock_out'),
  userId: 1, user: owner1,
};

export const miscRoutes = [
  route('GET', 'common/notifications/list', () => ({ status: true, data: { data_list: notifications } })),

  route('GET', 'superadmin/announcement-logs', ({ query }) => {
    const limit = parseInt(query.limit || '', 10) || 50;
    const page = parseInt(query.page || '', 10) || 1;
    const logs = announcementLogs.filter((l) => (!query.status || l.status === query.status) && (!query.notificationType || l.notificationType === query.notificationType));
    return {
      status: true,
      data: { logs: logs.slice((page - 1) * limit, page * limit), pagination: { currentPage: page, totalPages: Math.max(1, Math.ceil(logs.length / limit)), totalItems: logs.length, itemsPerPage: limit } },
      message: 'Notification logs retrieved successfully',
    };
  }),

  route('GET', 'superadmin/calendar-notes', () => ({ status: true, data: { calendarNotes }, message: 'Calendar notes retrieved successfully' })),
  route('GET', 'superadmin/calendar-notes/branch-admins', () => ({ status: true, data: { branchAdmins }, message: 'Admins retrieved successfully' })),

  route('GET', 'superadmin/leads/campaigns/list', ({ query }) => {
    const b = parseInt(query.branchId || '', 10);
    return { status: true, data: { campaigns: Number.isNaN(b) ? campaigns : campaigns.filter((c) => c.branchId === b) } };
  }),
  route('GET', 'superadmin/allLeads', () => ({ status: true, data: { leads: allLeads, total: allLeads.length } })),
  route('GET', 'superadmin/leads/list/(?<campaignUuid>[^/]+)', ({ params }) => {
    const campaign = campaigns.find((c) => c.uuid === params.campaignUuid) || campaigns[0];
    const leads = allLeads.filter((l) => l.campaignId === campaign.id);
    return { status: true, data: { leads: leads.length ? leads : allLeads.slice(0, 8).map((l) => ({ ...l, campaignId: campaign.id })), campaign } };
  }),

  route('GET', 'common/support-requests/list', ({ query }) => ({
    status: true,
    data: supportRequests(query.type === 'graphic' ? 'graphic' : 'support').filter((r: any) => !deletedSupport.has(r.uuid)),
  })),
  route('DELETE', 'common/support-requests/delete', ({ query }) => {
    if (query.uuid) deletedSupport.add(query.uuid);
    return { status: true, message: 'Deleted' };
  }),
  route('GET', 'superadmin/support-team/list', () => ({ status: true, message: 'Support team list fetched successfully', data: supportTeam })),

  route('GET', 'superadmin/vendor-category/list', () => ({ status: true, data: { VendorCategory: vendorCategories } })),
  route('GET', 'superadmin/company-list/list', () => ({ status: true, data: { companies } })),
  route('GET', 'superadmin/vendor-list/list', () => ({ status: true, data: { vendors } })),

  route('GET', 'superadmin/template-builder/list', ({ query }) => {
    const list = templateBuilders.filter((t) => (!query.type || t.type === query.type) && (!query.area || t.area === query.area) && (!query.uuid || t.uuid === query.uuid));
    return { status: true, data: { templateBuilders: list } };
  }),

  route('GET', 'superadmin/knowledge-base/list', ({ query }) => ({
    status: true,
    message: 'Knowledge Base fetched successfully',
    data: knowledgeBase.filter((k) => (!query.type || k.type === query.type) && (!query.status || k.status === query.status)),
  })),

  route('GET', 'common/file-manager/list', ({ query }) => {
    const pid = query.parentId ? Number(query.parentId) : null;
    const nodes = fileNodes.filter((n) => n.parentId === pid).sort((a, b) => Number(b.isFolder) - Number(a.isFolder) || a.name.localeCompare(b.name));
    return { status: true, data: nodes };
  }),
  route('GET', 'common/file-manager/list-all', () => ({ status: true, data: fileNodes.filter((n) => n.isFolder).sort((a, b) => a.name.localeCompare(b.name)) })),
  route('GET', 'common/file-manager/shared-with-me', () => ({ status: true, data: sharedNodes })),

  route('GET', 'common/clock-in-out/status', () => ({
    status: true,
    message: 'Clock status retrieved successfully.',
    data: {
      isClockedIn: false,
      lastRecord: myLastRecord,
      requiredLocation: '120 King St W, Toronto, ON',
      allowedDistance: 150,
      latitude: 43.6487,
      longitude: -79.3817,
      remoteClockInOutEnabled: true,
    },
  })),
  route('GET', 'common/clock-in-out/active-users', () => ({
    status: true,
    message: 'Active clock users retrieved successfully.',
    data: clockRecords.filter((r) => r.action === 'clock_in' && new Date(r.createdAt).getTime() > Date.now() - 18 * 3600000 && !clockRecords.some((o) => o.userId === r.userId && o.action === 'clock_out' && o.createdAt > r.createdAt)).map((r) => ({
      userId: r.userId, name: r.user.name, email: r.user.email, branchId: r.branchId, branch: r.branch,
      clockInTime: r.createdAt, address: r.address, recordUuid: r.uuid,
    })),
  })),
  route('GET', 'common/clock-in-out/history', ({ query }) => {
    const page = parseInt(query.page || '', 10) || 1;
    const limit = parseInt(query.limit || '', 10) || 50;
    let recs = clockRecords;
    if (query.filterUserId) recs = recs.filter((r) => String(r.userId) === query.filterUserId);
    if (query.filterBranchId) recs = recs.filter((r) => String(r.branchId) === query.filterBranchId);
    if (query.startDate) recs = recs.filter((r) => r.createdAt.slice(0, 10) >= query.startDate);
    if (query.endDate) recs = recs.filter((r) => r.createdAt.slice(0, 10) <= query.endDate);
    return {
      status: true,
      message: 'Clock history retrieved successfully.',
      data: {
        records: recs.slice((page - 1) * limit, page * limit),
        pagination: { page, limit, total: recs.length, totalPages: Math.max(1, Math.ceil(recs.length / limit)) },
        isSuperAdmin: true,
      },
    };
  }),
] as ReturnType<typeof route>[];

void strip;
