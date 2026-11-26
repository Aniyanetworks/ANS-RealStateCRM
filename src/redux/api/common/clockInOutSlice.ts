import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const clockInOutApi = api.injectEndpoints({
  endpoints: (builder) => ({
    clockIn: builder.mutation({
      query: (data: {
        latitude?: number | null;
        longitude?: number | null;
        address?: string;
        notes?: string;
        branchId?: number;
        remoteLocation?: boolean;
        remoteAddress?: string;
      }) => {
        return {
          url: `/common/clock-in-out/clock-in`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["ClockStatusTag", "ClockHistoryTag"],
    }),

    clockOut: builder.mutation({
      query: (data: {
        latitude?: number | null;
        longitude?: number | null;
        address?: string;
        notes?: string;
        branchId?: number;
        remoteLocation?: boolean;
        remoteAddress?: string;
      }) => {
        return {
          url: `/common/clock-in-out/clock-out`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["ClockStatusTag", "ClockHistoryTag"],
    }),

    getClockStatus: builder.query({
      query: (branchId?: number | null) => {
        const url =
          branchId != null
            ? `/common/clock-in-out/status?branchId=${branchId}`
            : `/common/clock-in-out/status`;
        return {
          url,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["ClockStatusTag"],
    }),

    getClockHistory: builder.query({
      query: (params?: {
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
        filterUserId?: number;
        filterBranchId?: number;
      }) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.limit) queryParams.append("limit", params.limit.toString());
        if (params?.startDate) queryParams.append("startDate", params.startDate);
        if (params?.endDate) queryParams.append("endDate", params.endDate);
        if (params?.filterUserId != null) {
          queryParams.append("filterUserId", params.filterUserId.toString());
        }
        if (params?.filterBranchId != null) {
          queryParams.append("filterBranchId", params.filterBranchId.toString());
        }

        return {
          url: `/common/clock-in-out/history?${queryParams.toString()}`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["ClockHistoryTag"],
    }),

    updateClockInOutSettings: builder.mutation({
      query: (data: {
        address: string;
        latitude: number;
        longitude: number;
        allowedDistance?: number;
        branchId?: number | null;
      }) => {
        return {
          url: `/common/clock-in-out/update-settings`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["ClockStatusTag"],
    }),

    toggleRemoteClockInOut: builder.mutation({
      query: (data: { enabled: boolean }) => {
        return {
          url: `/common/clock-in-out/toggle-remote`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["ClockStatusTag"],
    }),

    deleteClockRecord: builder.mutation({
      query: (uuid: string) => {
        return {
          url: `/common/clock-in-out/history/${uuid}`,
          method: "DELETE",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["ClockStatusTag", "ClockHistoryTag"],
    }),

    deleteClockRecordsMultiple: builder.mutation({
      query: (uuids: string[]) => ({
        url: `/common/clock-in-out/history/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body: { uuids },
      }),
      invalidatesTags: ["ClockStatusTag", "ClockHistoryTag"],
    }),

    updateClockOutTime: builder.mutation({
      query: (args: { uuid: string; body: Record<string, string | null> }) => {
        const { uuid, body } = args;
        return {
          url: `/common/clock-in-out/history/${uuid}`,
          method: "PATCH",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
            "Content-Type": "application/json",
          },
          body,
        };
      },
      invalidatesTags: ["ClockStatusTag", "ClockHistoryTag"],
    }),

    getRoutineList: builder.query({
      query: (params?: { page?: number; limit?: number; branchId?: number; userId?: number; dayOfWeek?: number }) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.limit) queryParams.append("limit", params.limit.toString());
        if (params?.branchId) queryParams.append("branchId", params.branchId.toString());
        if (params?.userId) queryParams.append("userId", params.userId.toString());
        if (params?.dayOfWeek != null) queryParams.append("dayOfWeek", params.dayOfWeek.toString());
        return {
          url: `/common/clock-in-out/routine/list?${queryParams.toString()}`,
          method: "GET",
          headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
        };
      },
      providesTags: ["ClockScheduleTag"],
    }),

    createRoutine: builder.mutation({
      query: (data: {
        userId?: number | null;
        userIds?: number[];
        branchId: number;
        dayOfWeeks: number[];
        startTime?: string | null;
        endTime?: string | null;
      }) => ({
        url: `/common/clock-in-out/routine/create`,
        method: "POST",
        headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
        body: data,
      }),
      invalidatesTags: ["ClockScheduleTag"],
    }),

    updateRoutine: builder.mutation({
      query: (data: {
        uuid: string;
        userId?: number | null;
        branchId?: number | null;
        dayOfWeek?: number;
        startTime?: string | null;
        endTime?: string | null;
      }) => ({
        url: `/common/clock-in-out/routine/update`,
        method: "POST",
        headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
        body: data,
      }),
      invalidatesTags: ["ClockScheduleTag"],
    }),

    deleteRoutine: builder.mutation({
      query: (uuid: string) => ({
        url: `/common/clock-in-out/routine/delete?uuid=${encodeURIComponent(uuid)}`,
        method: "DELETE",
        headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
      }),
      invalidatesTags: ["ClockScheduleTag"],
    }),

    deleteRoutinesMultiple: builder.mutation({
      query: (uuids: string[]) => ({
        url: `/common/clock-in-out/routine/delete-multiple`,
        method: "DELETE",
        headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
        body: { uuids },
      }),
      invalidatesTags: ["ClockScheduleTag"],
    }),

    // Single-date shifts (true calendar schedules)
    getShiftList: builder.query({
      query: (params?: {
        page?: number;
        limit?: number;
        branchId?: number;
        userId?: number;
        startDate?: string;
        endDate?: string;
      }) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.limit) queryParams.append("limit", params.limit.toString());
        if (params?.branchId) queryParams.append("branchId", params.branchId.toString());
        if (params?.userId) queryParams.append("userId", params.userId.toString());
        if (params?.startDate) queryParams.append("startDate", params.startDate);
        if (params?.endDate) queryParams.append("endDate", params.endDate);
        return {
          url: `/common/clock-in-out/shift/list?${queryParams.toString()}`,
          method: "GET",
          headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
        };
      },
      providesTags: ["ClockScheduleTag"],
    }),

    createShift: builder.mutation({
      query: (data: {
        userId?: number | null;
        userIds?: number[];
        branchId: number;
        date: string; // YYYY-MM-DD
        startTime?: string | null;
        endTime?: string | null;
      }) => ({
        url: `/common/clock-in-out/shift/create`,
        method: "POST",
        headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
        body: data,
      }),
      invalidatesTags: ["ClockScheduleTag"],
    }),

    updateShift: builder.mutation({
      query: (data: {
        uuid: string;
        userId?: number | null;
        userIds?: number[];
        branchId?: number | null;
        date?: string;
        startTime?: string | null;
        endTime?: string | null;
      }) => ({
        url: `/common/clock-in-out/shift/update`,
        method: "POST",
        headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
        body: data,
      }),
      invalidatesTags: ["ClockScheduleTag"],
    }),

    deleteShift: builder.mutation({
      query: (uuid: string) => ({
        url: `/common/clock-in-out/shift/delete?uuid=${encodeURIComponent(uuid)}`,
        method: "DELETE",
        headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
      }),
      invalidatesTags: ["ClockScheduleTag"],
    }),

    deleteShiftsMultiple: builder.mutation({
      query: (uuids: string[]) => ({
        url: `/common/clock-in-out/shift/delete-multiple`,
        method: "DELETE",
        headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
        body: { uuids },
      }),
      invalidatesTags: ["ClockScheduleTag"],
    }),

    getActiveClockUsers: builder.query({
      query: () => ({
        url: `/common/clock-in-out/active-users`,
        method: "GET",
        headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
      }),
      providesTags: ["ClockStatusTag", "ClockHistoryTag"],
    }),

    forceClockOut: builder.mutation({
      query: (data: { userId: number; notes?: string }) => ({
        url: `/common/clock-in-out/force-clock-out`,
        method: "POST",
        body: data,
        headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
      }),
      invalidatesTags: ["ClockStatusTag", "ClockHistoryTag"],
    }),
  }),
});

export const {
  useClockInMutation,
  useClockOutMutation,
  useGetClockStatusQuery,
  useGetClockHistoryQuery,
  useUpdateClockInOutSettingsMutation,
  useToggleRemoteClockInOutMutation,
  useDeleteClockRecordMutation,
  useDeleteClockRecordsMultipleMutation,
  useUpdateClockOutTimeMutation,
  useGetRoutineListQuery,
  useCreateRoutineMutation,
  useUpdateRoutineMutation,
  useDeleteRoutineMutation,
  useDeleteRoutinesMultipleMutation,
  useGetShiftListQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
  useDeleteShiftsMultipleMutation,
  useGetActiveClockUsersQuery,
  useForceClockOutMutation,
} = clockInOutApi;
