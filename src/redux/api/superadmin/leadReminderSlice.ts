import { api } from '../apiSlice';

export const leadReminderApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLeadReminders: builder.query({
      query: ({ agentId, leadId, ...params }) => ({
        url: `/super-admin/lead-reminders`,
        params: { agentId, leadId, ...params },
      }),
      providesTags: ['LeadReminders'],
    }),
    createLeadReminder: builder.mutation({
      query: (body) => ({
        url: `/super-admin/lead-reminders`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['LeadReminders'],
    }),
    updateLeadReminder: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/super-admin/lead-reminders/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['LeadReminders'],
    }),
    deleteLeadReminder: builder.mutation({
      query: (id) => ({
        url: `/super-admin/lead-reminders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LeadReminders'],
    }),
  }),
});

export const {
  useGetLeadRemindersQuery,
  useCreateLeadReminderMutation,
  useUpdateLeadReminderMutation,
  useDeleteLeadReminderMutation,
} = leadReminderApi; 