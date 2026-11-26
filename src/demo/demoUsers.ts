/* eslint-disable @typescript-eslint/no-explicit-any */
import { allPermissions } from './permissions';
// Showcase accounts: one per role, available from the "Log in as" buttons on the login page.
const branch = { id: 1, uuid: 'br-uuid-1', name: 'Toronto Downtown', slug: 'toronto-downtown' };

const base = {
  isActive: 'yes',
  status: 'approved',
  phoneNumber: null,
  smsOtpEnabled: false,
  profilePicture: null,
  branchId: 1,
  branch,
};

export type DemoRole = 'superAdmin' | 'admin' | 'agent' | 'client';

export const demoUsers: Record<DemoRole, any> = {
  superAdmin: {
    ...base, id: 1, email: 'superadmin@ans.demo', firstName: 'Ava', lastName: 'Morgan', name: 'Ava Morgan',
    userType: 'superAdmin', roleId: 1, userTypeUId: 'ANS-1001', agentAccount: [], clientAccount: [],
    userRole: { id: 1, name: 'Super Admin', permissions: [] },
  },
  admin: {
    ...base, id: 2, email: 'admin@ans.demo', firstName: 'Noah', lastName: 'Tremblay', name: 'Noah Tremblay',
    userType: 'admin', roleId: 2, userTypeUId: 'ANS-1002', agentAccount: [], clientAccount: [],
    userRole: { id: 2, name: 'Branch Admin', permissions: allPermissions },
  },
  agent: {
    ...base, id: 10, email: 'agent@ans.demo', firstName: 'Olivia', lastName: 'Hart', name: 'Olivia Hart',
    userType: 'agent', roleId: 3, userTypeUId: 'UID00001', clientAccount: [],
    userRole: { id: 3, name: 'Agent', permissions: [] },
    agentAccount: [{
      id: 1, status: 'approved', isActive: 'yes', brokerageId: 24, commissionRate: 60,
      plan: { id: 1, name: 'Standard Plan', planItems: [] }, discount: null,
    }],
  },
  client: {
    ...base, id: 99, email: 'client@ans.demo', firstName: 'Hannah', lastName: 'Moore', name: 'Hannah Moore',
    userType: 'client', roleId: 4, userTypeUId: 'CL-2001', agentAccount: [],
    userRole: { id: 4, name: 'Client', permissions: [] },
    clientAccount: [{ id: 1, clientAgent: { id: 10, name: 'Olivia Hart' } }],
  },
};

export const demoUserByEmail = (email?: string) =>
  Object.values(demoUsers).find((u: any) => u.email === String(email || '').toLowerCase()) || demoUsers.superAdmin;
