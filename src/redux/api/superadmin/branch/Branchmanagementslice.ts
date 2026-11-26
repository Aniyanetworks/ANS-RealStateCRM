/* eslint-disable @typescript-eslint/no-explicit-any */
import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";

const branchManageApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createUpdateBranch: builder.mutation({
      query: ({ data, uuid }: { data: any; uuid?: string }) => {
        const queryParams = new URLSearchParams();
        if (uuid) queryParams.append("uuid", uuid);
        return {
          url: `/superadmin/branch-management/create-update-branch?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getBranchListDataTag", "getSpecificBranchDataTag"],
    }),

    getBranchListData: builder.query({
      query: () => ({
        url: `/superadmin/branch-management/get-branch-list`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getBranchListDataTag"],
    }),

    getActiveBranchListData: builder.query({
      query: () => ({
        url: `/superadmin/branch-management/get-branch-list`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),

    getSpecificBranchData: builder.query({
      query: (uuid) => ({
        url: `/superadmin/branch-management/get-specific-branch?uuid=${uuid}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getSpecificBranchDataTag"],
    }),

    deleteSpecificBranch: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/branch-management/delete-specific-branch?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getBranchListDataTag"],
    }),

    deleteMultipleBranch: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/branch-management/delete-multiple-branch`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body: { uuids },
      }),
      invalidatesTags: ["getBranchListDataTag"],
    }),
  }),
});

export const {
  useCreateUpdateBranchMutation,
  useGetBranchListDataQuery,
  useGetSpecificBranchDataQuery,
  useDeleteSpecificBranchMutation,
  useDeleteMultipleBranchMutation,
  useGetActiveBranchListDataQuery,
} = branchManageApi;
