import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";

export const calendarEventApi = api.injectEndpoints({
  endpoints: (builder) => ({

    getCalendarEvents: builder.query({
      query: () => ({
        url: "/superadmin/calendar-events",
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["CalendarEvents"],
    }),

    getSingleCalendarEvent: builder.query({
      query: (uuid) => ({
        url: `/common/calendar-events/single-event?uuid=${uuid}`,
        method: "GET",
      }),
    }),

    createCalendarEvent: builder.mutation({
      query: ( data ) => ({
        url: `/superadmin/calendar-events/create`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["CalendarEvents"],
    }),
    
    updateCalendarEvent: builder.mutation({
      query: ({ eventId, data }) => ({
        url: `/superadmin/calendar-events/update?eventId=${eventId}`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["CalendarEvents"],
    }),

    joinCalendarEvent: builder.mutation({
      query: ({ data, uuid }) => ({
        url: `/common/calendar-events/join-event?uuid=${uuid}`,
        method: "POST",
        body: data,
      }),
    }),

    deleteCalendarEvent: builder.mutation({
      query: (eventId) => ({
        url: `/superadmin/calendar-events/delete?eventId=${eventId}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["CalendarEvents"],
    }),

    deleteMultipleCalendarEvents: builder.mutation({
      query: (eventIds) => ({
        url: "/superadmin/calendar-events/bulk-delete",
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body: { eventIds },
      }),
      invalidatesTags: ["CalendarEvents"],
    }),

    getEventAttendees: builder.query({
      query: (uuid) => ({
        url: `/superadmin/calendar-events/attendees?uuid=${uuid}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),
  }),
});

export const {
  useGetCalendarEventsQuery,
  useGetSingleCalendarEventQuery,
  useCreateCalendarEventMutation,
  useUpdateCalendarEventMutation,
  useJoinCalendarEventMutation,
  useDeleteCalendarEventMutation,
  useDeleteMultipleCalendarEventsMutation,
  useGetEventAttendeesQuery
} = calendarEventApi;