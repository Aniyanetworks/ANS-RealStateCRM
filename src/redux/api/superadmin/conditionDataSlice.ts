import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const conditionTypeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getConditionType: builder.query({
      query: () => ({
        url: `/superadmin/condition-type/list`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getConditionTypeTag"],
    }),

    createConditionType: builder.mutation({
      query: (data: { condition: string }) => ({
        url: `/superadmin/condition-type/create`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getConditionTypeTag"],
    }),

    updateConditionType: builder.mutation({
      query: ({ id, condition }: { id: number; condition: string }) => ({
        url: `/superadmin/condition-type/update?id=${id}`,
        method: "POST",
        body: { condition },
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getConditionTypeTag"],
    }),

    deleteMultipleConditionType: builder.mutation({
      query: (ids: number[]) => ({
        url: `/superadmin/condition-type/delete-multiple`,
        method: "DELETE",
        body: { ids },
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getConditionTypeTag"],
    }),
  }),
});

export const {
  useGetConditionTypeQuery,
  useCreateConditionTypeMutation,
  useUpdateConditionTypeMutation,
  useDeleteMultipleConditionTypeMutation,
} = conditionTypeApi;
