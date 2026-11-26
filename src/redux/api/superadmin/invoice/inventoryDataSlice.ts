import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";

const inventoryDataApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getInventory: builder.query({
      query: () => {
        return {
          url: `/superadmin/inventory/list`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["getInventoryTag"],
    }),

    createUpdateInventory: builder.mutation({
      query: ({ uuid, data }: { uuid: string; data: any }) => {
        return {
          url: `/superadmin/inventory/create-and-update?uuid=${uuid}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getInventoryTag"],
    }),

    deleteInventory: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/inventory/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getInventoryTag"],
    }),

    deleteInventoryMultiple: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/inventory/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body: { uuids },
      }),
      invalidatesTags: ["getInventoryTag"],
    }),

    getInventoryTransactions: builder.query({
      query: () => {
        return {
          url: `/superadmin/inventory/transactions/list`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["getInventoryTransactionTag"],
    }),

    createInventoryTransaction: builder.mutation({
      query: (data: any) => {
        return {
          url: `/superadmin/inventory/transactions/create`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getInventoryTransactionTag", "getInventoryTag"],
    }),
  }),
});

export const {
  useGetInventoryQuery,
  useCreateUpdateInventoryMutation,
  useDeleteInventoryMutation,
  useDeleteInventoryMultipleMutation,
  useGetInventoryTransactionsQuery,
  useCreateInventoryTransactionMutation,
} = inventoryDataApi;
