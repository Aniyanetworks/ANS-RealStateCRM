import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";

const ClientpropertyListingApi = api.injectEndpoints({
  endpoints: (builder) => ({

    getClientPropertyListing: builder.query({
      query: ({ uuid }: { uuid?: string }) => {
        if (!uuid) throw new Error("UUID is required");
        return {
          url: `/superadmin/client-property-listing/list?userId=${uuid}`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["getClientPropertyListingTag"],
    }),

    createUpdateClientPropertyListing: builder.mutation({
      query: ({ uuid, data }: { uuid: string; data: any; }) => {
        return {
          url: `/superadmin/client-property-listing/create-and-update?uuid=${uuid}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getClientPropertyListingTag"],
    }),
    createUpdateClientPropertyVisitingDate: builder.mutation({
      query: ({ uuid, data }: { uuid: string; data: any; }) => {
        return {
          url: `/superadmin/client-property-listing/create-and-update-visiting?uuid=${uuid}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getClientPropertyListingTag"],
    }),

    deleteClientPropertyListing: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/client-property-listing/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getClientPropertyListingTag"],
    }),

    deleteClientPropertyListingMultiple: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/client-property-listing/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body:{ uuids }
      }),
      invalidatesTags: ["getClientPropertyListingTag"],
    }),
  }),
});

export const {
  useGetClientPropertyListingQuery,
  useCreateUpdateClientPropertyListingMutation,
  useCreateUpdateClientPropertyVisitingDateMutation,
  useDeleteClientPropertyListingMutation,
  useDeleteClientPropertyListingMultipleMutation
} = ClientpropertyListingApi;