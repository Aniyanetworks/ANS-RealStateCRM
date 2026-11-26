import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const tradeAccountingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createTradeTransaction: builder.mutation({
      query: (data) => ({
        url: '/accounting/trade-accounting/transactions/create',
        method: 'POST',
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ['TradeTransactionListTag','ChequePostingListTag','SingleTradeTransactionTag','getSpacificTradeSheetListDataTag','getTradeSheetListDataTag','getAgentListDataTag','getSingleAgentDataTag','BankAccountListTag'],
    }),

    createChequePosting: builder.mutation({
      query: (data) => ({
        url: '/accounting/trade-accounting/cheque-postings/create',
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
        url: '/accounting/trade-accounting/transfer-commission-agent/create',
        method: 'POST',
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ['TradeTransactionListTag','ChequePostingListTag','SingleTradeTransactionTag','getSpacificTradeSheetListDataTag','getTradeSheetListDataTag','getAgentListDataTag','getSingleAgentDataTag','BankAccountListTag'],
    }),


    getSpecificTradeTransaction: builder.query({
      query: (uuid) => ({
        url: `/accounting/trade-accounting/transactions/get-specific-trade-transaction?uuid=${uuid}`,
        method: 'GET',
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ['SingleTradeTransactionTag'],
    }),


    getSpecificTradeAgentCommission: builder.query({
      query: ({ uuid, agentAccountId }) => ({
        url: `/accounting/trade-accounting/transactions/get-specific-trade-agent-commission?uuid=${uuid}&agentAccountId=${agentAccountId}`,
        method: 'GET',
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ['SingleTradeTransactionTag'],
    }),

    getChequePostings: builder.query({
      query: () => ({
        url: '/accounting/trade-accounting/transactions/get-all-cheque-postings',
        method: 'GET',
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ['ChequePostingListTag'],
    }),


    transferCommissionCheque: builder.mutation({
      query: (data) => ({
        url: '/accounting/trade-accounting/transfer-commission-cheque/create',
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
        url: '/accounting/trade-accounting/transfer-commission-agent/store-agent-acknowledgement',
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
        url: '/accounting/trade-accounting/transfer-commission-agent/acknowledgement-list',
        method: 'GET',
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ['ChequePostingListTag'],
    }),

    agentCommissionTransferHistoryList: builder.query({
      query: () => ({
        url: '/accounting/trade-accounting/transfer-commission-agent/agent-commission-transfer-history-list',
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
  useGetSpecificTradeTransactionQuery,
  useGetChequePostingsQuery,
  useTransferCommissionChequeMutation,
  useGetSpecificTradeAgentCommissionQuery,
  useTransferCommissionAgentMutation,
  useAcknowledgementListQuery,
  useAgentCommissionTransferHistoryListQuery,
  useSendBuyerCommissionInvoiceMutation,
  useBuyerCommissionInvoiceUploadMutation
  
} = tradeAccountingApi;
