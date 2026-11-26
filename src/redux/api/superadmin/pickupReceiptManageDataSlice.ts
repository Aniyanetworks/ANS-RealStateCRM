import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const pickupReceiptManageApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPickupReceiptManage: builder.query({
      query: () => ({
        url: `/superadmin/pickup-receipt-manage/list`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getPickupReceiptManageTag"],
    }),

    createUpdatePickupReceiptManage: builder.mutation({
      query: ({ uuid, data }: { uuid: string; data: any; }) => {
        return {
          url: `/superadmin/pickup-receipt-manage/create-and-update?uuid=${uuid}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getPickupReceiptManageTag"],
    }),

    deletePickupReceiptManage: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/pickup-receipt-manage/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getPickupReceiptManageTag"],
    }),
    deletePickupReceiptMultiple: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/pickup-receipt-manage/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body:{ uuids }
      }),
      invalidatesTags: ["getPickupReceiptManageTag"],
    }),

    sendPickupReceiptInvoiceEmail: builder.mutation({
      query: ({ data }: { data: any; }) => {
        return {
          url: `/superadmin/pickup-receipt-manage/send-pickup-receipt-invoice-email`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getPickupReceiptManageTag"],
    }),

  }),
});

export const {
  useGetPickupReceiptManageQuery,
  useCreateUpdatePickupReceiptManageMutation,
  useDeletePickupReceiptManageMutation,
  useDeletePickupReceiptMultipleMutation,
  useSendPickupReceiptInvoiceEmailMutation
} = pickupReceiptManageApi;