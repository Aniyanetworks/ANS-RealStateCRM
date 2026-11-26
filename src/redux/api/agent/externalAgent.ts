import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";


const externalAgentsApi = api.injectEndpoints({
    endpoints: (builder) => ({

        getExternalAgentList: builder.query({
            query: () => ({
                url: `/agent/external-agents`,
                method: "GET",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ["ExternalAgentListTag"],
        }),

        updateExternalAgent: builder.mutation({
            query: ({ data, uuid }: { data: any; uuid?: string }) => {
                const queryParams = new URLSearchParams();
                if (uuid) queryParams.append("uuid", uuid);
                return {
                    url: `/superadmin/agent-management/update-external-agent?${queryParams.toString()}`,
                    method: "POST",
                    body: data,
                    headers: {
                        authorization: `Bearer ${getEnvUrls().accessToken}`,
                    },
                };
            },
            invalidatesTags: [
                "ExternalAgentListTag", 
            ],
        }),


        deleteExternalAgent: builder.mutation({
            query: (uuid) => ({
                url: `/superadmin/agent-management/delete-external-agent?uuid=${uuid}`,
                method: "DELETE",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: [
               "ExternalAgentListTag", 
            ],
        }),
        
        deleteMultipleExternalAgent: builder.mutation({
            query: (uuids) => ({
                url: `/superadmin/agent-management/delete-multiple-external-agent`,
                method: "DELETE",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
                body:{ uuids }
            }),
            invalidatesTags: ["ExternalAgentListTag"],
        }),
    }),
});

export const {
    useGetExternalAgentListQuery,
    useUpdateExternalAgentMutation,
    useDeleteExternalAgentMutation,
    useDeleteMultipleExternalAgentMutation
} = externalAgentsApi;
