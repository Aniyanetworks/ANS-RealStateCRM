import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";

const productDataApi = api.injectEndpoints({
  endpoints: (builder) => ({   


    getOrder: builder.query({
      query: (params:string) => {

        return {
          url: `/superadmin/order-management/list?order_type=${params}`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["getOrderTag"],
    }),
    getBorrowOrder: builder.query({
      query: () => {
        return {
          url: `/superadmin/order-management/borrow-list`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["getOrderTag"],
    }),
    

    createUpdateOrder: builder.mutation({
      query: ({ uuid, data }: { uuid: string; data: any; }) => {
        return {
          url: `/superadmin/order-management/create-and-update?uuid=${uuid}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getOrderTag"],
    }),

    // Add this mutation to your productDataApi
updateOrder: builder.mutation({
  query: ({ uuid, data }: { uuid: string; data: any }) => {
    return {
      url: `/superadmin/order-management/update-order?uuid=${uuid}`,
      method: "PUT",
      body: data,
      headers: {
        authorization: `Bearer ${getEnvUrls().accessToken}`,
      },
    };
  },
  invalidatesTags: ["getOrderTag"],
}),

    deleteOrder: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/order-management/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getOrderTag"],
    }),

    deleteOrderMultiple: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/order-management/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body:{ uuids }
      }),
      invalidatesTags: ["getOrderTag"],
    }),

    changeOrderItemStatus: builder.mutation({
      query: (data:any) => {                
          return {
              url: `/superadmin/order-management/change-order-item-status`,
              method: "POST",
              body: data,
              headers: {
                  authorization: `Bearer ${getEnvUrls().accessToken}`,
              },
          };
      },
      invalidatesTags: [ "getOrderTag","getTradeProductTag"],
  }),

    changeOrderPaymentStatus: builder.mutation({
      query: (data:any) => {                
          return {
              url: `/superadmin/order-management/change-order-payment-status`,
              method: "POST",
              body: data,
              headers: {
                  authorization: `Bearer ${getEnvUrls().accessToken}`,
              },
          };
      },
      invalidatesTags: [ "getOrderTag","getTradeProductTag"],
  }),

  // Add this to your orderDataSlice
  agreeToTerms: builder.mutation({
    query: (data) => ({
      url: `/superadmin/order-management/agree-terms`,
      method: 'POST',
      body: data,
      headers: {
        authorization: `Bearer ${getEnvUrls().accessToken}`,
      },
      invalidatesTags: [ "getOrderTag","getTradeProductTag"],
    }),
  }),

  }),
});

export const {
  useGetOrderQuery,
  useGetBorrowOrderQuery,
  useCreateUpdateOrderMutation,
  useUpdateOrderMutation,
  useChangeOrderItemStatusMutation,
  useDeleteOrderMutation,
  useDeleteOrderMultipleMutation,
  useChangeOrderPaymentStatusMutation,
  useAgreeToTermsMutation
} = productDataApi;