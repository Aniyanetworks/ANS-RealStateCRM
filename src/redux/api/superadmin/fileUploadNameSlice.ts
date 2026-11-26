import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const fileUploadNameApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createFileUploadName: builder.mutation({
      query: (data) => {
        return {
          url: `/superadmin/dynamic-file-name/create`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getFileUploadNameTag"],
    }),

    getFileUploadName: builder.query({
      query: () => ({
        url: `/superadmin/dynamic-file-name/list`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getFileUploadNameTag"],
    }),

    getFileUploadCategories: builder.query({
      query: () => ({
        url: `/superadmin/dynamic-file-name/categories`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),

    updateFileUploadName: builder.mutation({
      query: ({ uuid, data }: { uuid: string; data: any }) => {
        return {
          url: `/superadmin/dynamic-file-name/update?uuid=${uuid}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getFileUploadNameTag"],
    }),

    updateOrderFileUploadName: builder.mutation({
      query: (data) => {
        return {
          url: `/superadmin/dynamic-file-name/update-order`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getFileUploadNameTag"],
    }),

    deleteFileUploadName: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/dynamic-file-name/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getFileUploadNameTag"],
    }),
    deleteFileUploadNameMultiple: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/dynamic-file-name/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body: { uuids },
      }),
      invalidatesTags: ["getFileUploadNameTag"],
    }),
  }),
});

export const {
  useCreateFileUploadNameMutation,
  useGetFileUploadNameQuery,
  useGetFileUploadCategoriesQuery,
  useUpdateFileUploadNameMutation,
  useDeleteFileUploadNameMutation,
  useDeleteFileUploadNameMultipleMutation,
  useUpdateOrderFileUploadNameMutation,
} = fileUploadNameApi;
