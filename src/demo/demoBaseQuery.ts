/* eslint-disable @typescript-eslint/no-explicit-any */
import type { BaseQueryFn, FetchArgs } from '@reduxjs/toolkit/query';
import { demoRoutes, Handler } from './routes';

const normalize = (url: string) =>
  url.replace(/^https?:\/\/[^/]+/, '').replace(/^\/?api\/v1/, '').replace(/^\/+/, '').split('?')[0];

const copyOf = (v: any) => {
  try {
    return structuredClone(v);
  } catch {
    return v === undefined ? v : JSON.parse(JSON.stringify(v));
  }
};

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
      // Hand the store a copy: Redux freezes what it receives, and a frozen object returned straight from
      // a handler's in-memory data would break every later edit of that data.
      return { data: copyOf(data) };
    } catch (e: any) {
      return { error: { status: e.status || 400, data: { status: false, message: e.message || 'Request failed' } } };
    }
  }
  console.warn(`[demo-api] unhandled ${method} /${path}`);
  if (method !== 'GET') return { data: { status: true, message: 'Saved (demo)', data: {} } };
  return { data: { status: true, message: 'demo', data: [] } };
};
