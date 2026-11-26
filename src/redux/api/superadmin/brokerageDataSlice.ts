import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const brokerageDataApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createBrokerageData: builder.mutation({
      query: (data) => {
        return {
          url: `/superadmin/brokerage/create`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getBrokerageDataTag","getSpacificTradeSheetListDataTag"],
    }),

    validateBrokerageData: builder.mutation({
      query: (data) => {
        return {
          url: `/superadmin/brokerage/validate`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getBrokerageDataTag","getSpacificTradeSheetListDataTag"],
    }),

    getBrokerageData: builder.query({
      query: () => ({
        url: `/superadmin/brokerage/list`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getBrokerageDataTag"],
    }),

    updateBrokerageData: builder.mutation({
      query: ({ uuid, data }: { uuid: string; data: any; }) => {
        return {
          url: `/superadmin/brokerage/update?uuid=${uuid}`,
          method: "POST",
          body: data,          
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getBrokerageDataTag"],
    }),

    deleteBrokerageData: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/brokerage/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getBrokerageDataTag"],
    }),
    
    deleteBrokerageDataMultiple: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/brokerage/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body:{ uuids }
      }),
      invalidatesTags: ["getBrokerageDataTag"],
    }),

    

  }),
});

export const {
  useCreateBrokerageDataMutation,
  useValidateBrokerageDataMutation,
  useGetBrokerageDataQuery,
  useUpdateBrokerageDataMutation,
  useDeleteBrokerageDataMutation,
  useDeleteBrokerageDataMultipleMutation,
  
} = brokerageDataApi;