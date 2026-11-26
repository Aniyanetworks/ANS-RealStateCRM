/* eslint-disable @typescript-eslint/no-explicit-any */
import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";

const userManageApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createUpdateUser: builder.mutation({
      query: ({ data, uuid }: { data: any; uuid?: string }) => {
        const queryParams = new URLSearchParams();
        if (uuid) queryParams.append("uuid", uuid);
        return {
          url: `/superadmin/user-management/create-update-user?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getUserListDataTag", "getSpacificUserDataTag"],
    }),
    leadToClient: builder.mutation({
      query: ({ data, uuid }: { data: any; uuid?: string }) => {
        const queryParams = new URLSearchParams();
        if (uuid) queryParams.append("uuid", uuid);
        return {
          url: `/superadmin/user-management/lead-to-client?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getUserListDataTag", "getSpacificUserDataTag"],
    }),
    sendInvitation: builder.mutation({
      query: ({ data }: { data: any }) => {
        return {
          url: `/superadmin/user-management/send-reg-invitation`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getUserListDataTag"],
    }),

    getUserListData: builder.query({
      query: () => ({
        url: `/superadmin/user-management/get-user-list`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getUserListDataTag"],
    }),
    getClientListData: builder.query({
      query: () => ({
        url: `/superadmin/user-management/get-client-list`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getUserListDataTag"],
    }),

    getSpacificUserData: builder.query({
      query: (uuid) => ({
        url: `/superadmin/user-management/get-spacific-user?uuid=${uuid}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),

      providesTags: ["getSpacificUserDataTag"],
    }),

    deleteSpacificUser: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/user-management/delete-spacific-user?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getUserListDataTag"], // Use invalidatesTags for cache invalidation
    }),
    deleteMultipleUser: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/user-management/delete-multiple-user`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body: { uuids },
      }),
      invalidatesTags: ["getUserListDataTag"], // Use invalidatesTags for cache invalidation
    }),
  }),
});

export const {
  useCreateUpdateUserMutation,
  useLeadToClientMutation,
  useGetUserListDataQuery,
  useGetClientListDataQuery,
  useGetSpacificUserDataQuery,
  useDeleteSpacificUserMutation,
  useDeleteMultipleUserMutation,
  useSendInvitationMutation,
} = userManageApi;
