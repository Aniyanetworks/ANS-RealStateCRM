/* eslint-disable @typescript-eslint/no-explicit-any */
import * as seed from './seed';

import { route, type Route } from './route';
import { demoUserByEmail } from './demoUsers';
export type { Ctx, Handler } from './route';



const periodRange = (q: Record<string, string>): [Date, Date] | null => {
  const now = new Date();
  const som = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
  const eom = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  switch (q.filterMonth) {
    case 'current': return [som(now), eom(now)];
    case 'previous': { const p = new Date(now.getFullYear(), now.getMonth() - 1, 1); return [som(p), eom(p)]; }
    case 'lastYear': return [new Date(now.getFullYear(), 0, 1), new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)];
    case 'custom': return q.startDate && q.endDate ? [new Date(q.startDate), new Date(`${q.endDate}T23:59:59.999`)] : null;
    default: return null;
  }
};

const filterAgentsByPeriod = (q: Record<string, string>) => {
  const range = periodRange(q);
  if (!range) return seed.agents;
  const inRange = (v: any) => {
    if (!v) return false;
    const t = new Date(v).getTime();
    return t >= range[0].getTime() && t <= range[1].getTime();
  };
  return seed.agents.map((a: any) => {
    const sheets = a.user.unitsSalesTradeSheets.filter((s: any) => inRange(s.properties?.[0]?.closingDate));
    return {
      ...a,
      tradeAgentCommission: a.tradeAgentCommission.filter((c: any) => inRange(c.createdAt)),
      user: {
        ...a.user,
        unitsSalesTradeSheets: sheets,
        tradeSheetsCreated: sheets,
        propertyListings: a.user.propertyListings.filter((p: any) => inRange(p.contractDate || p.createdAt)),
      },
    };
  });
};

export const demoRoutes: Route[] = [
  route('POST', 'auth/login', ({ body }) => ({ status: true, message: 'Login Successful', token: 'demo-token', data: { user: demoUserByEmail(body?.email) }, requiresOtp: false })),
  route('POST', 'auth/logout', () => ({ status: true })),
  route('GET', 'superadmin/agent-reports/top-agent-list', ({ query }) => ({ status: true, data: { userData: filterAgentsByPeriod(query) } })),
  route('GET', 'superadmin/agent-management/list', () => ({ status: true, data: { userData: seed.agents } })),
  route('GET', 'superadmin/manual-top-agent/list', () => ({ status: true, data: { manualTopAgentData: [] } })),
  route('GET', 'agent/approved-agents', () => ({ status: true, data: { agents: seed.agents.slice(0, 3) } })),
  route('GET', 'agent/trade-sheet-management/get-trade-sheet-list', () => ({ status: true, data: { tradeSheetData: seed.tradeSheets } })),
  route('GET', 'agent/trade-sheet-management/get-archive-trade-sheet-list', () => ({ status: true, data: { tradeSheetData: seed.archivedTradeSheets } })),
  route('GET', 'superadmin/announcements', () => ({ status: true, data: { announcements: seed.announcements } })),
  route('GET', 'superadmin/calendar-events', () => ({ status: true, data: { calendarEvents: seed.calendarEvents } })),
];

import { coreRoutes } from './handlers/core';
import { marketRoutes } from './handlers/market';
import { miscRoutes } from './handlers/misc';
import { financeRoutes } from './handlers/finance';
import { timeclockRoutes } from './handlers/timeclock';
import { extraARoutes } from './handlers/extraA';
import { extraBRoutes } from './handlers/extraB';
import { tradesheetRoutes } from './handlers/tradesheet';
import { listingsRoutes } from './handlers/listings';
import { crudRoutes } from './handlers/crud';
demoRoutes.push(...extraARoutes, ...coreRoutes, ...marketRoutes, ...miscRoutes, ...financeRoutes, ...timeclockRoutes, ...extraBRoutes);
// Stateful create/edit/delete handlers go first so they win over the static list handlers above.
demoRoutes.unshift(...crudRoutes, ...tradesheetRoutes, ...listingsRoutes);
