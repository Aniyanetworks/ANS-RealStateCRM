/* eslint-disable @typescript-eslint/no-explicit-any */
// Browser-side stand-in for the Express API. Every RTK Query call is answered here
// (from Supabase or static demo data) so the app needs no backend server.
import type { BaseQueryFn, FetchArgs } from '@reduxjs/toolkit/query';
import { demoRoutes, Handler } from './routes';

const normalize = (url: string) =>
  url.replace(/^https?:\/\/[^/]+/, '').replace(/^\/?api\/v1/, '').replace(/^\/+/, '').split('?')[0];

export const demoBaseQuery: BaseQueryFn<string | FetchArgs, unknown, { status: number; data: any }> = async (args) => {
  const req = typeof args === 'string' ? { url: args } : args;
  const method = (req.method || 'GET').toUpperCase();
  const path = normalize(req.url);
  const query = Object.fromEntries(new URLSearchParams(req.url.split('?')[1] || ''));
  if (req.params) Object.assign(query, req.params);

  let body: any = req.body;
  if (body instanceof FormData) body = Object.fromEntries(body.entries());

  for (const r of demoRoutes) {
    if (r.method !== method) continue;
    const m = path.match(r.pattern);
    if (!m) continue;
    try {
      const data = await (r.handler as Handler)({ params: m.groups || {}, query, body, path });
      return { data };
    } catch (e: any) {
      return { error: { status: e.status || 400, data: { status: false, message: e.message || 'Request failed' } } };
    }
  }
  console.warn(`[demo-api] unhandled ${method} /${path}`);
  return { data: { status: true, message: 'demo', data: [] } };
};
