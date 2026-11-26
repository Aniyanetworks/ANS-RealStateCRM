// ANS Time Clock (rebuild of the dvclock app). Backend: /dv-time-clock/*
// Same pattern as brokerage accounting: one generic query + one generic mutation; every mutation
// refreshes the time clock queries (clock-ins, approvals and schedules affect each other).
import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const BASE = "/dv-time-clock";

type Params = Record<string, string | number | boolean | undefined | null>;

const toQuery = (params?: Params) => {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
};

type ApiEnvelope<T> = { status: boolean; message: string; data: T };

const dvTimeClockApi = api.injectEndpoints({
  endpoints: (builder) => ({
    tcGet: builder.query({
      query: ({ path, params }: { path: string; params?: Params }) => ({
        url: `${BASE}${path}${toQuery(params)}`,
        method: "GET",
        headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transformResponse: (r: ApiEnvelope<any>) => r?.data,
      providesTags: ["DvTimeClockTag"],
    }),
    tcMutate: builder.mutation({
      query: ({ path, method = "POST", body }: { path: string; method?: "POST" | "PATCH" | "PUT" | "DELETE"; body?: unknown }) => ({
        url: `${BASE}${path}`,
        method,
        body,
        headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
      }),
      invalidatesTags: ["DvTimeClockTag"],
    }),
  }),
});

export const { useTcGetQuery, useLazyTcGetQuery, useTcMutateMutation } = dvTimeClockApi;
