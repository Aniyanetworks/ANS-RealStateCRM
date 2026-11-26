import { api } from "./apiSlice";

const pageApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createPage: builder.mutation({
      query: (data) => ({
        url: `/super_admin/pages/create`,
        method: "POST",
        body: data,
      }),
    }),

    getPagesData: builder.query({
      query: (page) => ({
        url: `/super_admin/pages/${page}`,
        method: "GET",
      }),
    }),
  }),
});

export const { useGetPagesDataQuery, useCreatePageMutation } = pageApi;
