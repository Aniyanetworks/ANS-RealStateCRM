import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";

const productDataApi = api.injectEndpoints({
  endpoints: (builder) => ({   


    getTradeProduct: builder.query({
      query: () => {
        return {
          url: `/superadmin/trade-products/list`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["getTradeProductTag"],
    }),
    

    createUpdateTradeProduct: builder.mutation({
      query: ({ uuid, data }: { uuid: string; data: any; }) => {
        return {
          url: `/superadmin/trade-products/create-and-update?uuid=${uuid}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getTradeProductTag"],
    }),

    deleteTradeProduct: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/trade-products/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getTradeProductTag"],
    }),

    deleteTradeProductMultiple: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/trade-products/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body:{ uuids }
      }),
      invalidatesTags: ["getTradeProductTag"],
    }),
  }),
});

export const {
  useGetTradeProductQuery,
  useCreateUpdateTradeProductMutation,
  useDeleteTradeProductMutation,
  useDeleteTradeProductMultipleMutation
} = productDataApi;