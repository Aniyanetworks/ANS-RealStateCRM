import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getApprovedAgets: builder.query({
      query: () => ({
        url: `agent/approved-agents`,
        method: "GET",
        headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),
    
  }),
});

export const {
    useGetApprovedAgetsQuery,
} = dashboardApi;