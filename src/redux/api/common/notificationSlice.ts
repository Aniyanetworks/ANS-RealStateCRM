import { api } from "../apiSlice";
import { getEnvUrls } from "../../../utils/constant";

const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: () => ({
        url: `/common/notifications/list`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["GetNotificationTag"],
    }),

    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/common/notifications/delete?id=${id}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["GetNotificationTag"],
    }),

    deleteMultipleNotifications: builder.mutation({
      query: (ids) => ({
        url: `/common/notifications/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body: { ids }, 
      }),
      invalidatesTags: ["GetNotificationTag"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useDeleteNotificationMutation,
  useDeleteMultipleNotificationsMutation,
} = notificationApi;
