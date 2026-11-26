/* eslint-disable @typescript-eslint/no-explicit-any */
export type Ctx = { params: Record<string, string>; query: Record<string, string>; body: any; path: string };
export type Handler = (ctx: Ctx) => any | Promise<any>;
type Route = { method: string; pattern: RegExp; handler: Handler };

const demoUser = {
  id: 1, email: 'admin@ans.demo', firstName: 'Ava', lastName: 'Morgan', userType: 'superAdmin', roleId: 1,
  isActive: 'yes', phoneNumber: null, smsOtpEnabled: false, agentAccount: [], userRole: { id: 1, name: 'Super Admin', permissions: [] }, branch: null,
};

const route = (method: string, pattern: string, handler: Handler): Route => ({
  method, pattern: new RegExp(`^${pattern}$`), handler,
});

export const demoRoutes: Route[] = [
  route('POST', 'auth/login', () => ({ status: true, message: 'Login Successful', token: 'demo-token', data: { user: demoUser }, requiresOtp: false })),
  route('POST', 'auth/logout', () => ({ status: true })),
];
