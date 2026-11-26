import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";

const ClientNoteApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getClientNote: builder.query({
      query: ({ uuid }: { uuid?: string }) => {
        if (!uuid) throw new Error("UUID is required");
        return {
          url: `/superadmin/client-note/list?userId=${uuid}`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["getClientNoteTag"],
    }),
    

    createUpdateClientNote: builder.mutation({
      query: ({ uuid, data }: { uuid: string; data: any; }) => {
        return {
          url: `/superadmin/client-note/create-and-update?uuid=${uuid}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getClientNoteTag"],
    }),

    deleteClientNote: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/client-note/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getClientNoteTag"],
    }),

    deleteClientNoteMultiple: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/client-note/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body:{ uuids }
      }),
      invalidatesTags: ["getClientNoteTag"],
    }),
  }),
});

export const {
  useGetClientNoteQuery,
  useCreateUpdateClientNoteMutation,
  useDeleteClientNoteMutation,
  useDeleteClientNoteMultipleMutation
} = ClientNoteApi;