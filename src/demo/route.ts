/* eslint-disable @typescript-eslint/no-explicit-any */
export type Ctx = { params: Record<string, string>; query: Record<string, string>; body: any; path: string };
export type Handler = (ctx: Ctx) => any | Promise<any>;
export type Route = { method: string; pattern: RegExp; handler: Handler };

export const route = (method: string, pattern: string, handler: Handler): Route => ({
  method, pattern: new RegExp(`^${pattern}$`), handler,
});
