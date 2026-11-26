import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const lawyerFirmDataApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createLawyerFirmData: builder.mutation({
      query: (data) => {

        return {
          url: `/superadmin/lawyer-firm/create`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getLawyerFirmDataTag","getSpacificTradeSheetListDataTag"],
    }),

    validateLawyerFirmData: builder.mutation({
      query: (data) => {

        return {
          url: `/superadmin/lawyer-firm/validate`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getLawyerFirmDataTag","getSpacificTradeSheetListDataTag"],
    }),

    getLawyerFirmData: builder.query({
      query: () => ({
        url: `/superadmin/lawyer-firm/list`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getLawyerFirmDataTag"],
    }),

    updateLawyerFirmData: builder.mutation({
      query: ({ uuid, data }: { uuid: string; data: any; }) => {
        return {
          url: `/superadmin/lawyer-firm/update?uuid=${uuid}`,
          method: "POST",
          body: data,          
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getLawyerFirmDataTag"],
    }),

    deleteLawyerFirmData: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/lawyer-firm/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getLawyerFirmDataTag"],
    }),
    deleteLawyerFirmDataMultiple: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/lawyer-firm/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body:{ uuids }
      }),
      invalidatesTags: ["getLawyerFirmDataTag"],
    }),
  }),
});

export const {
  useCreateLawyerFirmDataMutation,
  useValidateLawyerFirmDataMutation,
  useGetLawyerFirmDataQuery,
  useUpdateLawyerFirmDataMutation,
  useDeleteLawyerFirmDataMutation,
  useDeleteLawyerFirmDataMultipleMutation
} = lawyerFirmDataApi;