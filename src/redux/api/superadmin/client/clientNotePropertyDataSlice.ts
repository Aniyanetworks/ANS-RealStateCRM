import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";

const ClientPropertyNoteApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getClientPropertyNote: builder.query({
      query: ({ property }: { property?: string }) => {
        if (!property) throw new Error("Property is required");
        return {
          url: `/superadmin/client-property-note/list?clientPropertyId=${property}`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["getClientPropertyNoteTag"],
    }),
    

    createUpdateClientPropertyNote: builder.mutation({
      query: ({ uuid, data }: { uuid: string; data: any; }) => {
        return {
          url: `/superadmin/client-property-note/create-and-update?uuid=${uuid}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getClientPropertyNoteTag"],
    }),

    deleteClientPropertyNote: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/client-property-note/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getClientPropertyNoteTag"],
    }),

    deleteClientPropertyNoteMultiple: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/client-property-note/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body:{ uuids }
      }),
      invalidatesTags: ["getClientPropertyNoteTag"],
    }),
  }),
});

export const {
  useGetClientPropertyNoteQuery,
  useCreateUpdateClientPropertyNoteMutation,
  useDeleteClientPropertyNoteMutation,
  useDeleteClientPropertyNoteMultipleMutation
} = ClientPropertyNoteApi;