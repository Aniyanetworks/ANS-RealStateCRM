import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const lawyerDataApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createLawyerData: builder.mutation({
      query: (data) => {

        return {
          url: `/superadmin/lawyer/create`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getLawyerDataTag","getSpacificTradeSheetListDataTag"],
    }),

    getLawyerData: builder.query({
      query: () => ({
        url: `/superadmin/lawyer/list`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getLawyerDataTag"],
    }),

    updateLawyerData: builder.mutation({
      query: ({ uuid, data }: { uuid: string; data: any; }) => {
        return {
          url: `/superadmin/lawyer/update?uuid=${uuid}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getLawyerDataTag"],
    }),

    deleteLawyerData: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/lawyer/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getLawyerDataTag"],
    }),
    deleteLawyerDataMultiple: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/lawyer/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body:{ uuids }
      }),
      invalidatesTags: ["getLawyerDataTag"],
    }),

    sendLawyerPDFEmail: builder.mutation({
      query: (data:any) => {
        return {
          url: `/superadmin/lawyer/send-details-email`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      }
    }),
  }),
});

export const {
  useCreateLawyerDataMutation,
  useGetLawyerDataQuery,
  useUpdateLawyerDataMutation,
  useDeleteLawyerDataMutation,
  useDeleteLawyerDataMultipleMutation,
  useSendLawyerPDFEmailMutation
} = lawyerDataApi;