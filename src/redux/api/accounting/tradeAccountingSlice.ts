import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const tradeAccountingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Create a trade transaction
    createTradeTransaction: builder.mutation({
      query: (data) => ({
        url: '/accounting/trade-accounting/transactions/create', // Adjust the route as per your API structure
        method: 'POST',
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ['TradeTransactionListTag','ChequePostingListTag','SingleTradeTransactionTag','getSpacificTradeSheetListDataTag','getTradeSheetListDataTag','getAgentListDataTag','getSingleAgentDataTag','BankAccountListTag'],
    }),

    // Create a cheque posting
    createChequePosting: builder.mutation({
      query: (data) => ({
        url: '/accounting/trade-accounting/cheque-postings/create', // Adjust the route as per your API structure
        method: 'POST',
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ['TradeTransactionListTag','ChequePostingListTag','SingleTradeTransactionTag','getSpacificTradeSheetListDataTag','getTradeSheetListDataTag','getAgentListDataTag','getSingleAgentDataTag','BankAccountListTag'],
    }),

    transferCommissionAgent: builder.mutation({
      query: (data) => ({
        url: '/accounting/trade-accounting/transfer-commission-agent/create', // Adjust the route as per your API structure
        method: 'POST',
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ['TradeTransactionListTag','ChequePostingListTag','SingleTradeTransactionTag','getSpacificTradeSheetListDataTag','getTradeSheetListDataTag','getAgentListDataTag','getSingleAgentDataTag','BankAccountListTag'],
    }),

    // // Get list of all trade transactions
    // getTradeTransactions: builder.query({
    //   query: () => ({
    //     url: '/trade-accounting/transactions/get', // Adjust the route as per your API structure
    //     method: 'GET',
    //     headers: {
    //       authorization: `Bearer ${getEnvUrls().accessToken}`,
    //     },
    //   }),
    //   providesTags: ['TradeTransactionListTag'],
    // }),

    // // Get a specific trade transaction
    getSpecificTradeTransaction: builder.query({
      query: (uuid) => ({
        url: `/accounting/trade-accounting/transactions/get-specific-trade-transaction?uuid=${uuid}`, // Adjust the route as per your API structure
        method: 'GET',
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ['SingleTradeTransactionTag'],
    }),


    getSpecificTradeAgentCommission: builder.query({
      query: ({ uuid, agentAccountId }) => ({
        url: `/accounting/trade-accounting/transactions/get-specific-trade-agent-commission?uuid=${uuid}&agentAccountId=${agentAccountId}`, // Correct query string format
        method: 'GET',
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ['SingleTradeTransactionTag'],
    }),

    // // Get list of all cheque postings
    getChequePostings: builder.query({
      query: () => ({
        url: '/accounting/trade-accounting/transactions/get-all-cheque-postings', // Adjust the route as per your API structure
        method: 'GET',
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ['ChequePostingListTag'],
    }),

    // // Get a specific cheque posting
    // getSpecificChequePosting: builder.query({
    //   query: (uuid) => ({
    //     url: `/trade-accounting/cheque-postings/get-specific?uuid=${uuid}`, // Adjust the route as per your API structure
    //     method: 'GET',
    //     headers: {
    //       authorization: `Bearer ${getEnvUrls().accessToken}`,
    //     },
    //   }),
    //   providesTags: ['SingleChequePostingTag'],
    // }),

    // Create a cheque posting
    transferCommissionCheque: builder.mutation({
      query: (data) => ({
        url: '/accounting/trade-accounting/transfer-commission-cheque/create', // Adjust the route as per your API structure
        method: 'POST',
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ['TradeTransactionListTag','ChequePostingListTag','SingleTradeTransactionTag','getSpacificTradeSheetListDataTag','getTradeSheetListDataTag','getAgentListDataTag','getSingleAgentDataTag','BankAccountListTag'],
    }),

    
    createAgentAcknowledgement: builder.mutation({
      query: (data) => ({
        url: '/accounting/trade-accounting/transfer-commission-agent/store-agent-acknowledgement', // Adjust the route as per your API structure
        method: 'POST',
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ['TradeTransactionListTag','ChequePostingListTag','SingleTradeTransactionTag','getSpacificTradeSheetListDataTag','getTradeSheetListDataTag','getAgentListDataTag','getSingleAgentDataTag','BankAccountListTag'],
    }),

    acknowledgementList: builder.query({
      query: () => ({
        url: '/accounting/trade-accounting/transfer-commission-agent/acknowledgement-list', // Adjust the route as per your API structure
        method: 'GET',
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ['ChequePostingListTag'],
    }),

    agentCommissionTransferHistoryList: builder.query({
      query: () => ({
        url: '/accounting/trade-accounting/transfer-commission-agent/agent-commission-transfer-history-list', // Adjust the route as per your API structure
        method: 'GET',
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ['ChequePostingListTag'],
    }),

    sendBuyerCommissionInvoice: builder.mutation({
      query: ({ data }: { data: any; }) => {
        return {
          url: `/accounting/trade-accounting/send-buyer-commission-invoice`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
    }),

    buyerCommissionInvoiceUpload: builder.mutation({
      query: ({ data }: { data: any; }) => {
        return {
          url: `/accounting/trade-accounting/buyer-commission-invoice-upload`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
    }),

  }),
});

export const {
  useCreateAgentAcknowledgementMutation,
  useCreateTradeTransactionMutation,
  useCreateChequePostingMutation,
  // useGetTradeTransactionsQuery,
  useGetSpecificTradeTransactionQuery,
  useGetChequePostingsQuery,
  useTransferCommissionChequeMutation,
  useGetSpecificTradeAgentCommissionQuery,
  useTransferCommissionAgentMutation,
  useAcknowledgementListQuery,
  useAgentCommissionTransferHistoryListQuery,
  useSendBuyerCommissionInvoiceMutation,
  useBuyerCommissionInvoiceUploadMutation
  // useGetSpecificChequePostingQuery,
  
} = tradeAccountingApi;
