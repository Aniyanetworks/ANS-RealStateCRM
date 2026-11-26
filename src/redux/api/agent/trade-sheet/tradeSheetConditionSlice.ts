/* eslint-disable @typescript-eslint/no-explicit-any */
import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";
import { ConditionResponse, CreateUpdateConditionRequest } from "../../../../types/condition";

const tradeSheetConditionApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getConditionalDetails: builder.query<ConditionResponse, { tradeSheetId: number }>({
            query: ({ tradeSheetId }) => ({
                url: `/agent/trade-sheet-management/get-tradesheet-conditional-detail?tradeSheetId=${tradeSheetId}`,
                method: "GET",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ["Condition"],
        }),
        createUpdateCondition: builder.mutation<ConditionResponse, CreateUpdateConditionRequest & { id?: string }>({
            query: ({ id, ...data }) => ({
                url: `/agent/trade-sheet-management/create-update-tradesheet-conditional-detail${id ? `?id=${id}` : ""}`,
                method: "POST",
                body: data,
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ["Condition"],
        }),
        updateConditionStatus: builder.mutation<ConditionResponse, { id: string; completeStatus: 'yes' | 'no'; conditionMetDate?: string }>({
            query: ({ id, ...data }) => ({
                url: `/agent/trade-sheet-management/update-condition-status?id=${id}`,
                method: "POST",
                body: data,
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ["Condition"],
        }),
        deleteCondition: builder.mutation<void, string>({
            query: (id) => ({
                url: `/agent/trade-sheet-management/delete-tradesheet-conditional-detail?id=${id}`,
                method: "DELETE",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ["Condition"],
        }),
    }),
});

export const {
    useGetConditionalDetailsQuery,
    useCreateUpdateConditionMutation,
    useUpdateConditionStatusMutation,
    useDeleteConditionMutation,
} = tradeSheetConditionApi;