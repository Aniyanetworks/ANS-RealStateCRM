/* eslint-disable @typescript-eslint/no-explicit-any */
import * as seed from './seed';

import { route, type Route } from './route';
export type { Ctx, Handler } from './route';

const demoUser = {
  id: 1, email: 'admin@ans.demo', firstName: 'Ava', lastName: 'Morgan', userType: 'superAdmin', roleId: 1,
  isActive: 'yes', phoneNumber: null, smsOtpEnabled: false, agentAccount: [], userRole: { id: 1, name: 'Super Admin', permissions: [] }, branch: null,
};


export const demoRoutes: Route[] = [
  route('POST', 'auth/login', () => ({ status: true, message: 'Login Successful', token: 'demo-token', data: { user: demoUser }, requiresOtp: false })),
  route('POST', 'auth/logout', () => ({ status: true })),
  route('GET', 'superadmin/agent-reports/top-agent-list', () => ({ status: true, data: { userData: seed.agents } })),
  route('GET', 'superadmin/agent-management/list', () => ({ status: true, data: { userData: seed.agents } })),
  route('GET', 'superadmin/manual-top-agent/list', () => ({ status: true, data: { manualTopAgentData: [] } })),
  route('GET', 'agent/approved-agents', () => ({ status: true, data: { agents: seed.agents.slice(0, 3) } })),
  route('GET', 'agent/trade-sheet-management/get-trade-sheet-list', () => ({ status: true, data: { tradeSheetData: seed.tradeSheets } })),
  route('GET', 'agent/trade-sheet-management/get-archive-trade-sheet-list', () => ({ status: true, data: { tradeSheetData: seed.archivedTradeSheets } })),
  route('GET', 'superadmin/announcements', () => ({ status: true, data: { announcements: seed.announcements } })),
  route('GET', 'superadmin/calendar-events', () => ({ status: true, data: { calendarEvents: seed.calendarEvents } })),
];

// Module route groups (each file under ./handlers adds demo data for one area).
import { coreRoutes } from './handlers/core';
import { marketRoutes } from './handlers/market';
import { miscRoutes } from './handlers/misc';
import { financeRoutes } from './handlers/finance';
import { timeclockRoutes } from './handlers/timeclock';
import { extraARoutes } from './handlers/extraA';
import { extraBRoutes } from './handlers/extraB';
demoRoutes.push(...extraARoutes, ...coreRoutes, ...marketRoutes, ...miscRoutes, ...financeRoutes, ...timeclockRoutes, ...extraBRoutes);
