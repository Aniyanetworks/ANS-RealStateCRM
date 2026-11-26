import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";

const planManagementApi = api.injectEndpoints({
    endpoints: (builder) => ({
        createPlan: builder.mutation({
            query: ( data ) => {
                return {
                    url: `/superadmin/plan-management/create`,
                    method: "POST",
                    body: data,
                    headers: {
                        authorization: `Bearer ${getEnvUrls().accessToken}`,
                    },
                };
            },
            invalidatesTags: [
                "getPlanListDataTag",
                "getSinglePlanDataTag",
            ],
        }),

        updatePlan: builder.mutation({
            query: ({ data, uuid }: { data: any; uuid?: string }) => {
                const queryParams = new URLSearchParams();
                if (uuid) queryParams.append("uuid", uuid);
                return {
                    url: `/superadmin/plan-management/update?${queryParams.toString()}`,
                    method: "POST",
                    body: data,
                    headers: {
                        authorization: `Bearer ${getEnvUrls().accessToken}`,
                    },
                };
            },
            invalidatesTags: [
                "getPlanListDataTag",
                "getSinglePlanDataTag",
            ],
        }),

        getPlanListData: builder.query({
            query: () => ({
                url: `/superadmin/plan-management/list`,
                method: "GET",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ["getPlanListDataTag"],
        }),

        getSinglePlanData: builder.query({
            query: (uuid) => ({
                url: `/superadmin/plan-management/get-single-plan?uuid=${uuid}`,
                method: "GET",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },

            }),

            providesTags: ["getSinglePlanDataTag"],
        }),

        deleteSinglePlan: builder.mutation({
            query: (id) => ({
                url: `/superadmin/plan-management/delete?id=${id}`,
                method: "DELETE",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ["getPlanListDataTag"],
        }),


        createOptionalPlan:  builder.mutation({
            query: ( data ) => {
                return {
                    url: `/superadmin/plan-management/optional-plan/create`,
                    method: "POST",
                    body: data,
                    headers: {
                        authorization: `Bearer ${getEnvUrls().accessToken}`,
                    },
                };
            },
            invalidatesTags: [
                "getOptionalPlanListDataTag",
                "getSingleOptionalPlanDataTag",
            ],
        }),

        updateOptionalPlan: builder.mutation({
            query: ({ data, uuid }: { data: any; uuid?: string }) => {
                const queryParams = new URLSearchParams();
                if (uuid) queryParams.append("uuid", uuid);
                return {
                    url: `/superadmin/plan-management/optional-plan/update?${queryParams.toString()}`,
                    method: "POST",
                    body: data,
                    headers: {
                        authorization: `Bearer ${getEnvUrls().accessToken}`,
                    },
                };
            },
            invalidatesTags: [
                "getOptionalPlanListDataTag",
                "getSingleOptionalPlanDataTag",
            ],
        }),

        getOptionalPlanListData: builder.query({
            query: () => ({
                url: `/superadmin/plan-management/optional-plan/list`,
                method: "GET",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ["getOptionalPlanListDataTag"],
        }),


        getSingleOptionalPlanData: builder.query({
            query: (uuid) => ({
                url: `/superadmin/plan-management/get-single-optional-plan?uuid=${uuid}`,
                method: "GET",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },

            }),

            providesTags: ["getSingleOptionalPlanDataTag"],
        }),

        deleteSingleOptionalPlan: builder.mutation({
            query: (uuid) => ({
                url: `/superadmin/plan-management/optional-plan/delete?uuid=${uuid}`,
                method: "DELETE",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ["getOptionalPlanListDataTag"],
        }),

    }),
});

export const {
    useCreatePlanMutation,
    useUpdatePlanMutation,
    useGetPlanListDataQuery,
    useGetSinglePlanDataQuery,
    useDeleteSinglePlanMutation,
    useCreateOptionalPlanMutation,
    useUpdateOptionalPlanMutation,
    useGetSingleOptionalPlanDataQuery,
    useDeleteSingleOptionalPlanMutation,
    useGetOptionalPlanListDataQuery
} = planManagementApi;
