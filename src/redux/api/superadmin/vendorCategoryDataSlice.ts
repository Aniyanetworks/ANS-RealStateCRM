import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const vendorCategoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVendorCategory: builder.query({
      query: () => ({
        url: `/superadmin/vendor-category/list`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getVendorCategoryTag"],
    }),

    createVendorCategory: builder.mutation({
      query: (data: { name: string }) => ({
        url: `/superadmin/vendor-category/create`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getVendorCategoryTag"],
    }),

    updateVendorCategory: builder.mutation({
      query: ({ id, name }: { id: number; name: string }) => ({
        url: `/superadmin/vendor-category/update?id=${id}`,
        method: "POST",
        body: { name },
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getVendorCategoryTag"],
    }),

    deleteMultipleVendorCategory: builder.mutation({
      query: (ids: number[]) => ({
        url: `/superadmin/vendor-category/delete-multiple`,
        method: "DELETE",
        body: { ids },
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getVendorCategoryTag"],
    }),
  }),
});

export const {
  useGetVendorCategoryQuery,
  useCreateVendorCategoryMutation,
  useUpdateVendorCategoryMutation,
  useDeleteMultipleVendorCategoryMutation,
} = vendorCategoryApi;
