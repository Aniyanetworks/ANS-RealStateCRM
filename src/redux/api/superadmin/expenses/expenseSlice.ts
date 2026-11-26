import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";

const expenseCategoryApi = api.injectEndpoints({
    endpoints: (builder) => ({
        createExpense: builder.mutation({
            query: (data) => ({
                url: '/superadmin/expense/create',
                method: 'POST',
                body: data,
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ['ExpenseListTag'],
        }),

        updateExpense: builder.mutation({
            query: ({ data, uuid }: { data: any; uuid: string }) => ({
                url: `/superadmin/expense/update?uuid=${uuid}`,
                method: 'POST',
                body: data,
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ['ExpenseListTag', 'SingleExpenseTag'],
        }),

        getExpenseList: builder.query({
            query: () => ({
                url: '/superadmin/expense/get',
                method: 'GET',
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ['ExpenseListTag'],
        }),

        deleteExpense: builder.mutation({
            query: (uuid: string) => ({
                url: `/superadmin/expense/delete?uuid=${uuid}`,
                method: 'DELETE',
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ['ExpenseListTag'],
        }),

        deleteMultipleExpenses: builder.mutation({
            query: (uuids: string[]) => ({
                url: '/superadmin/expense/delete-multiple',
                method: 'DELETE',
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
                body: { uuids },
            }),
            invalidatesTags: ['ExpenseListTag'],
        }),

        changeExpenseStatus: builder.mutation({
            query: ({ expenseStatus, id }: { expenseStatus: any; id?: string }) => {
                const queryParams = new URLSearchParams();
                if (id) queryParams.append("id", id);
                if (expenseStatus) queryParams.append("expenseStatus", expenseStatus);

                return {
                    url: `/superadmin/expense/change-expense-status?${queryParams.toString()}`,
                    method: "POST",
                    headers: {
                        authorization: `Bearer ${getEnvUrls().accessToken}`,
                    },
                };
            },
            invalidatesTags: [
                "ExpenseListTag", 
                "SingleExpenseTag"
            ],
        }),
    }),
});

export const {
    useCreateExpenseMutation,
    useUpdateExpenseMutation,
    useGetExpenseListQuery,
    useDeleteExpenseMutation,
    useDeleteMultipleExpensesMutation,
    useChangeExpenseStatusMutation
} = expenseCategoryApi;
