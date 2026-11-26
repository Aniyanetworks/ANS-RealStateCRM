import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";

const ClientprofileListingApi = api.injectEndpoints({
  endpoints: (builder) => ({   


    getClientProfileListing: builder.query({
      query: ({ uuid }: { uuid?: string }) => {
        if (!uuid) throw new Error("UUID is required");
        return {
          url: `/superadmin/client-profile-listing/list?userId=${uuid}`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["getClientProfileListingTag"],
    }),
    

    createUpdateClientProfileListing: builder.mutation({
      query: ({ uuid, data }: { uuid: string; data: any; }) => {
        return {
          url: `/superadmin/client-profile-listing/create-and-update?uuid=${uuid}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getClientProfileListingTag"],
    }),

    deleteClientProfileListing: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/client-profile-listing/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getClientProfileListingTag"],
    }),

    deleteClientProfileListingMultiple: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/client-profile-listing/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body:{ uuids }
      }),
      invalidatesTags: ["getClientProfileListingTag"],
    }),
  }),
});

export const {
  useGetClientProfileListingQuery,
  useCreateUpdateClientProfileListingMutation,
  useDeleteClientProfileListingMutation,
  useDeleteClientProfileListingMultipleMutation
} = ClientprofileListingApi;