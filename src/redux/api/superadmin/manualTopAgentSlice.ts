/* eslint-disable @typescript-eslint/no-explicit-any */
import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const manualTopAgentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getManualTopAgentList: builder.query({
      query: () => ({
        url: `/superadmin/manual-top-agent/list`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getManualTopAgentTag"],
    }),

    createManualTopAgent: builder.mutation({
      query: (data: { category: string; agentId: number | string; value: string }) => ({
        url: `/superadmin/manual-top-agent/create`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getManualTopAgentTag"],
    }),

    updateManualTopAgent: builder.mutation({
      query: ({ uuid, ...data }: { uuid: string; category: string; agentId: number | string; value: string }) => ({
        url: `/superadmin/manual-top-agent/update?uuid=${uuid}`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getManualTopAgentTag"],
    }),

    deleteManualTopAgent: builder.mutation({
      query: (uuid: string) => ({
        url: `/superadmin/manual-top-agent/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getManualTopAgentTag"],
    }),
  }),
});

export const {
  useGetManualTopAgentListQuery,
  useCreateManualTopAgentMutation,
  useUpdateManualTopAgentMutation,
  useDeleteManualTopAgentMutation,
} = manualTopAgentApi;
