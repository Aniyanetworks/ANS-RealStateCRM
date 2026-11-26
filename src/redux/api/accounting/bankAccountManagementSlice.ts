import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const bankAccountApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Create an accounting bank account
    createAccountingBankAccount: builder.mutation({
      query: (data) => ({
        url: "/accounting/bank-accounts-management/create",
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["BankAccountListTag","SingleBankAccountTag"],
    }),

    // Update an accounting bank account
    updateAccountingBankAccount: builder.mutation({
      query: ({ data, uuid }: { data: any; uuid: string }) => ({
        url: `/accounting/bank-accounts-management/update?uuid=${uuid}`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["BankAccountListTag", "SingleBankAccountTag"],
    }),

    // Get list of all accounting bank accounts
    getAccountingBankAccounts: builder.query({
      query: () => ({
        url: "/accounting/bank-accounts-management/get",
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["BankAccountListTag"],
    }),

    // Get a specific accounting bank account
    getSpecificAccountingBankAccount: builder.query({
      query: (uuid: string) => ({
        url: `/accounting/bank-accounts-management/get-spacific?uuid=${uuid}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: [
        "SingleBankAccountTag",
        "TradeTransactionListTag",
        "ChequePostingListTag",
        "SingleTradeTransactionTag",
        "getSpacificTradeSheetListDataTag",
        "getTradeSheetListDataTag",
        "getAgentListDataTag",
        "getSingleAgentDataTag",
        "BankAccountListTag",
      ],
    }),

    // Delete an accounting bank account
    deleteAccountingBankAccount: builder.mutation({
      query: (uuid: string) => ({
        url: `/accounting/bank-accounts-management/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["BankAccountListTag"],
    }),

    // Delete multiple accounting bank accounts
    deleteMultipleAccountingBankAccounts: builder.mutation({
      query: (uuids: string[]) => ({
        url: "/accounting/bank-accounts-management/delete-multiple",
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body: { uuids },
      }),
      invalidatesTags: ["BankAccountListTag"],
    }),
  }),
});

export const {
  useCreateAccountingBankAccountMutation,
  useUpdateAccountingBankAccountMutation,
  useGetAccountingBankAccountsQuery,
  useGetSpecificAccountingBankAccountQuery,
  useDeleteAccountingBankAccountMutation,
  useDeleteMultipleAccountingBankAccountsMutation,
} = bankAccountApi;
