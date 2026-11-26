import { api } from "../apiSlice";

interface LeadReminder {
  id: string;
  leadId: number;
  agentId: number;
  type: 'sms' | 'email';
  message: string;
  scheduledTime: string;
  sentStatus: 'pending' | 'sent' | 'failed';
  createdAt: string;
  updatedAt: string;
}

interface LeadReminderResponse {
  status: boolean;
  data: LeadReminder[];
  message: string;
}

export const agentLeadReminderApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLeadReminders: builder.query<LeadReminderResponse, { leadId: string }>({
      query: ({ leadId, ...params }) => ({
        url: `/agent/lead-reminders`,
        params: { leadId, ...params },
      }),
      providesTags: ['LeadReminders'],
    }),
    createLeadReminder: builder.mutation({
      query: (body) => ({
        url: `/agent/lead-reminders`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['LeadReminders'],
    }),
    updateLeadReminder: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/agent/lead-reminders/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['LeadReminders'],
    }),
    deleteLeadReminder: builder.mutation({
      query: (id) => ({
        url: `/agent/lead-reminders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LeadReminders'],
    }),
  }),
});

export const {
  useGetLeadRemindersQuery: useGetAgentLeadRemindersQuery,
  useCreateLeadReminderMutation: useCreateAgentLeadReminderMutation,
  useUpdateLeadReminderMutation: useUpdateAgentLeadReminderMutation,
  useDeleteLeadReminderMutation: useDeleteAgentLeadReminderMutation,
} = agentLeadReminderApi; 