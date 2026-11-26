// Brokerage accounting (merged from DV Accounting). Backend: /brokerage-accounting/*
// One generic query + mutation keeps the many accounting screens compact; every mutation
// refreshes all accounting queries because postings affect balances everywhere.
import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const BASE = "/brokerage-accounting";

type Params = Record<string, string | number | boolean | undefined | null>;

const toQuery = (params?: Params) => {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
};

const brokerageAccountingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    acctGet: builder.query({
      query: ({ path, params }: { path: string; params?: Params }) => ({
        url: `${BASE}${path}${toQuery(params)}`,
        method: "GET",
        headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
      }),
      providesTags: ["BrokerageAccountingTag"],
    }),
    acctMutate: builder.mutation({
      query: ({ path, method = "POST", body }: { path: string; method?: "POST" | "PATCH" | "DELETE"; body?: unknown }) => ({
        url: `${BASE}${path}`,
        method,
        body,
        headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
      }),
      invalidatesTags: ["BrokerageAccountingTag", "ClockHistoryTag"],
    }),
  }),
});

export const { useAcctGetQuery, useAcctMutateMutation, useLazyAcctGetQuery } = brokerageAccountingApi;
