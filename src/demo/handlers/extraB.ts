/* eslint-disable @typescript-eslint/no-explicit-any */
import { route } from '../route';

const ok = (message: string, data: any, extra: any = {}) => ({ status: true, message, data, ...extra });

// ---- Condition types (data.ConditionType: {id, condition}) ----
const conditionNames = [
  'Financing', 'Home Inspection', "Sale of Buyer's Property", 'Insurance', 'Lawyer Review',
  'Status Certificate Review', 'Satisfactory Appraisal', 'Environmental Assessment', 'Survey Review',
  'Water Quality Test', 'Septic System Inspection', 'Zoning Compliance', 'Title Search',
  'Review of Condominium Documents', 'Satisfactory Mortgage Approval', 'Fence Line Verification',
];
let conditions = conditionNames.map((condition, i) => ({
  id: i + 1, condition, createdAt: '2026-01-12T14:00:00.000Z', updatedAt: '2026-01-12T14:00:00.000Z',
}));
let nextCondId = conditions.length + 1;

// ---- Users ----
const users = [
  { id: 2, name: 'Ava Morgan', email: 'ava.morgan@ans.demo' },
  { id: 3, name: 'Olivia Hart', email: 'olivia.hart@ans.demo' },
  { id: 4, name: 'Marcus Bell', email: 'marcus.bell@ans.demo' },
  { id: 5, name: 'Priya Nair', email: 'priya.nair@ans.demo' },
];

const iso = (daysAgo: number, h: number, m: number) => {
  const d = new Date(Date.UTC(2026, 10, 26, h, m));
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString();
};

// ---- File activity (trade documents) ----
const faRows: [number, string, string, string, string | null][] = [
  [0, 'Agreement of Purchase and Sale.pdf', 'upload', 'success', null],
  [0, 'Form 801 - Offer Summary.pdf', 'upload', 'success', null],
  [1, 'Seller Property Information Statement.pdf', 'replace', 'success', null],
  [1, 'Home Inspection Report.pdf', 'upload', 'success', null],
  [1, 'Status Certificate.pdf', 'upload', 'error', 'File exceeds the 25 MB upload limit'],
  [2, 'Amendment to APS - Closing Date.pdf', 'upload', 'success', null],
  [2, 'Duplicate Deposit Receipt.pdf', 'delete', 'success', null],
  [3, 'Mortgage Pre-Approval Letter.pdf', 'upload', 'success', null],
  [3, 'Waiver of Condition - Financing.pdf', 'upload', 'success', null],
  [4, 'Buyer Representation Agreement.pdf', 'replace', 'success', null],
  [5, 'Notice of Fulfillment.pdf', 'upload', 'success', null],
  [6, 'Title Insurance Quote.pdf', 'delete', 'error', 'File not found in storage'],
  [7, 'Lawyer Review Letter.pdf', 'upload', 'success', null],
  [8, 'Commission Trust Agreement.pdf', 'upload', 'success', null],
  [9, 'Survey - 14 Maple Grove Cres.pdf', 'replace', 'success', null],
  [11, 'Direction re Funds.pdf', 'upload', 'success', null],
];
const fileActivity = faRows.map((r, i) => {
  const u = users[i % users.length];
  const ts = iso(r[0], 9 + (i % 8), (i * 7) % 60);
  const slug = r[1].replace(/[^A-Za-z0-9.]+/g, '_');
  const mls = `W${7100200 + i * 37}`;
  return {
    id: 1000 - i, userId: u.id, filePath: `uploads/trade-documents/${slug}`, uploadFileName: r[1],
    operation: r[2], relatedTable: 'trade_documents',
    oldFilePath: r[2] === 'replace' ? `uploads/trade-documents/old_${slug}` : null,
    newFilePath: r[2] === 'replace' ? `uploads/trade-documents/${slug}` : null,
    status: r[3], errorMessage: r[4], tradeId: 410 + i, propertyMlsNumber: mls,
    propertyListingTypeId: mls, createdAt: ts, updatedAt: ts,
    user: { name: u.name }, tradeSheet: { tradeSheetTypeId: `TS-2026-${String(120 + i).padStart(4, '0')}` },
  };
});

// ---- File manager activity ----
const fmRows: [number, string, string, string, string | null, string | null, string | null][] = [
  [0, 'Listings 2026', 'create_folder', 'success', null, null, 'files/Listings 2026'],
  [0, '14 Maple Grove Cres - Disclosure.pdf', 'upload_file', 'success', 'files/Listings 2026/14 Maple Grove Cres - Disclosure.pdf', null, null],
  [1, 'Open House Flyer.pdf', 'upload_file', 'success', 'files/Marketing/Open House Flyer.pdf', null, null],
  [1, 'Buyer Intake Form.pdf', 'move_file', 'success', null, 'files/Inbox/Buyer Intake Form.pdf', 'files/Buyers/Buyer Intake Form.pdf'],
  [2, 'Old Brochure.pdf', 'delete_file', 'success', 'files/Marketing/Old Brochure.pdf', null, null],
  [2, 'Condo Status Cert - Unit 1204.pdf', 'download', 'success', 'files/Condos/Condo Status Cert - Unit 1204.pdf', null, null],
  [3, 'Closing Checklist.docx', 'rename', 'success', null, 'files/Templates/Closing List.docx', 'files/Templates/Closing Checklist.docx'],
  [3, 'Brokerage Policies.pdf', 'share_file', 'success', 'files/Compliance/Brokerage Policies.pdf', null, null],
  [4, 'Appraisal Report.pdf', 'upload_file', 'error', null, null, null],
  [4, 'Templates', 'create_folder', 'success', null, null, 'files/Templates'],
  [5, 'Mortgage Pre-Approval.pdf', 'replace_file', 'success', 'files/Buyers/Mortgage Pre-Approval.pdf', 'files/Buyers/Mortgage Pre-Approval.pdf', 'files/Buyers/Mortgage Pre-Approval.pdf'],
  [6, 'Lockbox Instructions.pdf', 'download', 'success', 'files/Listings 2026/Lockbox Instructions.pdf', null, null],
  [7, 'Staging Photos', 'move_file', 'success', null, 'files/Listings 2026/Staging Photos', 'files/Marketing/Staging Photos'],
  [8, 'Reco Update Notice.pdf', 'upload_file', 'success', 'files/Compliance/Reco Update Notice.pdf', null, null],
  [9, 'Draft Offer v2.pdf', 'delete_file', 'success', 'files/Drafts/Draft Offer v2.pdf', null, null],
  [10, 'Team Training Deck.pptx', 'upload_file', 'success', 'files/Training/Team Training Deck.pptx', null, null],
];
const fileManager = fmRows.map((r, i) => {
  const u = users[(i + 1) % users.length];
  const ts = iso(r[0], 8 + (i % 9), (i * 11) % 60);
  return {
    id: 500 - i, uuid: `fm-${String(i + 1).padStart(4, '0')}-ans-demo`, userId: u.id, filePath: r[4],
    uploadFileName: r[1], operation: r[2], relatedTable: 'file_manager', oldFilePath: r[5], newFilePath: r[6],
    status: r[3], errorMessage: r[3] === 'error' ? 'Unsupported file type' : null, createdAt: ts, updatedAt: ts,
    user: u,
  };
});
const count = (rows: any[], ...ops: string[]) => rows.filter((r) => ops.includes(r.operation)).length;

// ---- System logs (plain text lines: "[ts] level: message") ----
const logLines = (type: string) => {
  const lines: string[] = [];
  const base = Date.UTC(2026, 10, 26, 15, 30, 0);
  const msgs: [string, string][] = [
    ['info', 'Server started on port 5000 (ANS RealStateCRM API)'],
    ['info', 'POST /api/login 200 - ava.morgan@ans.demo'],
    ['info', 'GET /api/trade-sheets 200 42ms'],
    ['warn', 'Slow query detected: trade_sheet list took 1840ms'],
    ['info', 'POST /api/file-manager/upload 200 - Open House Flyer.pdf'],
    ['error', 'SMTP send failed for olivia.hart@ans.demo: connection timeout'],
    ['info', 'GET /api/dashboard/summary 200 87ms'],
    ['warn', 'JWT token expired for user marcus.bell@ans.demo'],
    ['info', 'Cron: commission reminder job completed (12 sent)'],
    ['error', 'Failed to generate PDF for trade sheet TS-2026-0124: template not found'],
    ['info', 'POST /api/calendar/event 201 - Showing: 14 Maple Grove Cres'],
    ['warn', 'Rate limit threshold reached for 203.0.113.24'],
    ['info', 'POST /api/login 200 - priya.nair@ans.demo'],
    ['info', 'MLS sync finished: 36 listings updated'],
    ['error', 'Prisma query failed: connection pool timeout after 10000ms'],
    ['info', 'GET /api/contacts 200 61ms'],
  ];
  for (let i = 0; i < 48; i++) {
    const [lvl, msg] = msgs[i % msgs.length];
    if (type === 'error' && lvl !== 'error') continue;
    const ts = new Date(base - (48 - i) * 97000).toISOString().replace('T', ' ').slice(0, 19);
    lines.push(`[${ts}] ${lvl}: ${msg}`);
  }
  return lines;
};

export const extraBRoutes = [
  route('GET', 'superadmin/condition-type/list', () => ok('Condition types fetched', { ConditionType: conditions })),
  route('POST', 'superadmin/condition-type/create', ({ body }) => {
    const c = { id: nextCondId++, condition: String(body?.condition ?? ''), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    conditions = [...conditions, c];
    return ok('Condition type created', c);
  }),
  route('POST', 'superadmin/condition-type/update', ({ query, body }) => {
    conditions = conditions.map((c) => (String(c.id) === query.id ? { ...c, condition: String(body?.condition ?? c.condition) } : c));
    return ok('Condition type updated', null);
  }),
  route('DELETE', 'superadmin/condition-type/delete-multiple', ({ body }) => {
    const ids: number[] = body?.ids ?? [];
    conditions = conditions.filter((c) => !ids.includes(c.id));
    return ok('Condition types deleted', null);
  }),
  route('GET', 'file-activity', () => ok('File activity logs fetched', fileActivity, {
    summary: { totalLogs: fileActivity.length, uploads: count(fileActivity, 'upload'), deletes: count(fileActivity, 'delete'), replaces: count(fileActivity, 'replace') },
  })),
  route('GET', 'file-manager-activity-logs', () => ok('File manager activity logs fetched', fileManager, {
    summary: {
      totalLogs: fileManager.length, uploads: count(fileManager, 'upload_file'), deletes: count(fileManager, 'delete_file'),
      replaces: count(fileManager, 'replace_file'), creates: count(fileManager, 'create_folder'),
      renames: count(fileManager, 'rename'), moves: count(fileManager, 'move_file'), downloads: count(fileManager, 'download'),
    },
  })),
  route('GET', 'system-logs', ({ query }) => {
    const n = Math.max(1, parseInt(query.lines || '200', 10) || 200);
    const lines = logLines(query.type || 'combined').slice(-n);
    return { status: true, logs: lines.join('\n'), total: lines.length };
  }),
  route('DELETE', 'system-logs', () => ({ status: true, message: 'Logs cleared' })),
];
