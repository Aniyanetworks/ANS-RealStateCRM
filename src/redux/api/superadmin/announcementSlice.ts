import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";


const announcementsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        createAnnouncement: builder.mutation({
            query: (data) => ({
                url: `/superadmin/announcements/create`,
                method: "POST",
                body: data,
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ["AnnouncementListTag"],
        }),

        updateAnnouncement: builder.mutation({
            query: ({ data, uuid }: { data: any; uuid: string }) => ({
                url: `/superadmin/announcements/update?uuid=${uuid}`,
                method: "POST",
                body: data,
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ["AnnouncementListTag", "SingleAnnouncementTag"],
        }),

        getPublishedAnnouncementsList: builder.query({
            query: () => ({
                url: `/superadmin/announcements?status=published`,
                method: "GET",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ["AnnouncementListTag"],
        }),
        getNotificationLogList: builder.query({
            query: () => ({
                url: `/superadmin/announcement-logs`,
                method: "GET",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ["AnnouncementListTag"],
        }),

        getAnnouncementsList: builder.query({
            query: (status) => ({
                url: status ? `/superadmin/announcements?status=${status}` : '/superadmin/announcements',
                method: "GET",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ["AnnouncementListTag"],
        }),

        getSingleAnnouncement: builder.query({
            query: (uuid: string) => ({
                url: `/superadmin/announcements/get?uuid=${uuid}`,
                method: "GET",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ["SingleAnnouncementTag"],
        }),

        deleteAnnouncement: builder.mutation({
            query: (uuid: string) => ({
                url: `/superadmin/announcements/delete?uuid=${uuid}`,
                method: "DELETE",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ["AnnouncementListTag"],
        }),
        deleteAnnouncementMultiple: builder.mutation({
            query: (uuids) => ({
                url: `/superadmin/announcements/delete-multiple`,
                method: "DELETE",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
                body: { uuids },
            }),
            invalidatesTags: ["AnnouncementListTag"],
        }),
        sendAnnouncementNotifications: builder.mutation({
            query: ({  data }: {data: any }) => ({
                url: `/superadmin/announcements/send-notifications`,
                method: "POST",
                body: data,
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ["AnnouncementListTag"],
        }),
        deleteNotificationLogsMultiple: builder.mutation({
            query: (uuids: React.Key[]) => ({
                url: '/superadmin/announcement-logs/delete-multiple',
                method: 'DELETE',
                body: { uuids },
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ['AnnouncementListTag'],
        }),
    }),
});

export const {
    useCreateAnnouncementMutation,
    useUpdateAnnouncementMutation,
    useGetAnnouncementsListQuery,
    useGetNotificationLogListQuery,
    useGetPublishedAnnouncementsListQuery,
    useGetSingleAnnouncementQuery,
    useDeleteAnnouncementMutation,
    useDeleteAnnouncementMultipleMutation,
    useDeleteNotificationLogsMultipleMutation,
    useSendAnnouncementNotificationsMutation
} = announcementsApi;
