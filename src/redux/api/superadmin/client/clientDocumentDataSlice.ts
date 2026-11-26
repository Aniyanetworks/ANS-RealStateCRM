import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";

const ClientDocumentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getClientDocument: builder.query({
      query: ({ uuid }: { uuid?: string }) => {
        if (!uuid) throw new Error("UUID is required");
        return {
          url: `/superadmin/client-document/list?userId=${uuid}`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["getClientDocumentTag"],
    }),

    getClientDocumentName: builder.query({
      query: () => ({
        url: `/superadmin/client-document/document-list`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getClientDocumentTag"],
    }),
    

    createUpdateClientDocument: builder.mutation({
      query: ({ uuid, data }: { uuid: string; data: any; }) => {
        return {
          url: `/superadmin/client-document/create-and-update?uuid=${uuid}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getClientDocumentTag"],
    }),

    deleteClientDocument: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/client-document/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getClientDocumentTag"],
    }),

    deleteClientDocumentMultiple: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/client-document/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body:{ uuids }
      }),
      invalidatesTags: ["getClientDocumentTag"],
    }),
  }),
});

export const {
  useGetClientDocumentQuery,
  useGetClientDocumentNameQuery,
  useCreateUpdateClientDocumentMutation,
  useDeleteClientDocumentMutation,
  useDeleteClientDocumentMultipleMutation
} = ClientDocumentApi;