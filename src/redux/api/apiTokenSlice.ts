import { api } from "./apiSlice";
import { getEnvUrls } from "../../utils/constant";

const apiTokenApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listApiTokens: builder.query({
      query: () => ({
        url: `/auth/api-tokens`,
        method: "GET",
        headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
      }),
      providesTags: ["ApiTokenListTag"],
    }),
    createApiToken: builder.mutation({
      query: (data: { name: string }) => ({
        url: `/auth/api-tokens`,
        method: "POST",
        body: data,
        headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
      }),
      invalidatesTags: ["ApiTokenListTag"],
    }),
    deleteApiToken: builder.mutation({
      query: (id: number) => ({
        url: `/auth/api-tokens/${id}`,
        method: "DELETE",
        headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
      }),
      invalidatesTags: ["ApiTokenListTag"],
    }),
  }),
});

export const {
  useListApiTokensQuery,
  useCreateApiTokenMutation,
  useDeleteApiTokenMutation,
} = apiTokenApi;
