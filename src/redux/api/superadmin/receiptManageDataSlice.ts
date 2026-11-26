import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const receiptManageApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReceiptManage: builder.query({
      query: () => ({
        url: `/superadmin/receipt-manage/list`,
        method: "GET",
        // Never answer from the browser's HTTP cache: after a receipt is updated the list must be fresh.
        cache: "no-store",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getReceiptManageTag"],
    }),

    createUpdateReceiptManage: builder.mutation({
      query: ({ uuid, data }: { uuid: string; data: any; }) => {
        return {
          url: `/superadmin/receipt-manage/create-and-update?uuid=${uuid}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getReceiptManageTag"],
    }),

    uploadRefundReceiptAndMutualReleaseFileMange: builder.mutation({
      query: ({ uuid, data }: { uuid: string; data: any; }) => {
        return {
          url: `/superadmin/receipt-manage/upload-refund-receipt-and-mutual-release-file?uuid=${uuid}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getReceiptManageTag"],
    }),

    deleteReceiptManage: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/receipt-manage/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getReceiptManageTag"],
    }),

    deleteReceiptManageMultiple: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/receipt-manage/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body:{ uuids }
      }),
      invalidatesTags: ["getReceiptManageTag"],
    }),

    sendDepositReceiptInvoiceEmail: builder.mutation({
      query: ({ data }: { data: any; }) => {
        return {
          url: `/superadmin/receipt-manage/send-deposit-receipt-invoice-email`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getReceiptManageTag"],
    }),

  }),
});

export const {
  useGetReceiptManageQuery,
  useCreateUpdateReceiptManageMutation,
  useDeleteReceiptManageMutation,
  useDeleteReceiptManageMultipleMutation,
  useUploadRefundReceiptAndMutualReleaseFileMangeMutation,
  useSendDepositReceiptInvoiceEmailMutation
} = receiptManageApi;