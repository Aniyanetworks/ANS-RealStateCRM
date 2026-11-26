import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";

export const calendarNoteApi = api.injectEndpoints({
  endpoints: (builder) => ({

    getCalendarNotes: builder.query({
      query: () => ({
        url: "/superadmin/calendar-notes",
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["CalendarNotes"],
    }),

    createUpdateCalendarNote: builder.mutation({
      query: ({ uuid, data }) => ({
        url: `/superadmin/calendar-notes/create-update?uuid=${uuid ?? "null"}`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["CalendarNotes"],
    }),

    deleteCalendarNote: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/calendar-notes/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["CalendarNotes"],
    }),

    deleteMultipleCalendarNotes: builder.mutation({
      query: (uuids) => ({
        url: "/superadmin/calendar-notes/delete-multiple",
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body: { uuids },
      }),
      invalidatesTags: ["CalendarNotes"],
    }),

    getBranchAdminsForCalendarNotes: builder.query({
      query: () => ({
        url: "/superadmin/calendar-notes/branch-admins",
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),

  }),
});

export const {
  useGetCalendarNotesQuery,
  useCreateUpdateCalendarNoteMutation,
  useDeleteCalendarNoteMutation,
  useDeleteMultipleCalendarNotesMutation,
  useGetBranchAdminsForCalendarNotesQuery,
} = calendarNoteApi;
