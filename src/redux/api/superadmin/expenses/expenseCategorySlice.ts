import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";

const expenseCategoryApi = api.injectEndpoints({
    endpoints: (builder) => ({
        createExpenseCategory: builder.mutation({
            query: (data) => ({
                url: '/superadmin/expense-category/create',
                method: 'POST',
                body: data,
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ['ExpenseCategoryListTag'],
        }),

        updateExpenseCategory: builder.mutation({
            query: ({ data, uuid }: { data: any; uuid: string }) => ({
                url: `/superadmin/expense-category/update?uuid=${uuid}`,
                method: 'POST',
                body: data,
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ['ExpenseCategoryListTag', 'SingleExpenseCategoryTag'],
        }),

        getExpenseCategoryList: builder.query({
            query: () => ({
                url: '/superadmin/expense-category/get',
                method: 'GET',
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ['ExpenseCategoryListTag'],
        }),

        getSingleExpenseCategory: builder.query({
            query: (uuid: string) => ({
                url: `/superadmin/expense-category/get-specific?uuid=${uuid}`,
                method: 'GET',
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ['SingleExpenseCategoryTag'],
        }),

        deleteExpenseCategory: builder.mutation({
            query: (uuid: string) => ({
                url: `/superadmin/expense-category/delete?uuid=${uuid}`,
                method: 'DELETE',
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ['ExpenseCategoryListTag'],
        }),

        deleteMultipleExpenseCategories: builder.mutation({
            query: (uuids: string[]) => ({
                url: '/superadmin/expense-category/delete-multiple',
                method: 'DELETE',
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
                body: { uuids },
            }),
            invalidatesTags: ['ExpenseCategoryListTag'],
        }),
    }),
});

export const {
    useCreateExpenseCategoryMutation,
    useUpdateExpenseCategoryMutation,
    useGetExpenseCategoryListQuery,
    useGetSingleExpenseCategoryQuery,
    useDeleteExpenseCategoryMutation,
    useDeleteMultipleExpenseCategoriesMutation,
} = expenseCategoryApi;
