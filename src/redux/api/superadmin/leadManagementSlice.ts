import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const leadManagementApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Campaign Endpoints
    getCampaigns: builder.query({
      query: (branchId) => {
        // Build URL with optional branchId query parameter
        const url =
          branchId && branchId !== "all"
            ? `/superadmin/leads/campaigns/list?branchId=${branchId}`
            : `/superadmin/leads/campaigns/list`;

        return {
          url,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["Campaigns"],
    }),
    createCampaign: builder.mutation({
      query: (data) => ({
        url: `/superadmin/leads/campaigns/create`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Campaigns"],
    }),
    analyzeCampaignMerge: builder.mutation({
      query: (data) => ({
        url: `/superadmin/analyze-merge`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),
    mergeCampaigns: builder.mutation({
      query: (data) => ({
        url: `/superadmin/campaigns/merge`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Campaigns"],
    }),
    updateCampaign: builder.mutation({
      query: ({ uuid, data }) => ({
        url: `/superadmin/leads/campaigns/update/${uuid}`,
        method: "PUT",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Campaigns"],
    }),
    deleteCampaign: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/leads/campaigns/delete/${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Campaigns"],
    }),
    deleteMultipleCampaigns: builder.mutation({
      query: (data) => ({
        url: `/superadmin/leads/campaigns/delete-multiple`,
        method: "DELETE",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Campaigns"],
    }),

    // Lead Endpoints
    getLeadsByCampaign: builder.query({
      query: (campaignUuid) => ({
        url: `/superadmin/leads/list/${campaignUuid}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: (campaignUuid) => [
        { type: "Leads", id: campaignUuid },
        "Leads",
      ],
    }),
    getAllLeads: builder.query({
      query: () => ({
        url: `/superadmin/allLeads`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      // providesTags: (campaignUuid) => [
      //   { type: 'Leads', id: campaignUuid },
      //   'Leads'
      // ],
    }),
    // Lead Endpoints
    getLeadsByAgent: builder.query({
      query: (agentId) => ({
        url: `/superadmin/leads/list-agent/${agentId}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["Leads"],
    }),
    importLeads: builder.mutation({
      query: (formData) => {
        return {
          url: `/superadmin/leads/import`,
          method: "POST",
          body: formData,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["Leads", "Campaigns"], // Invalidate leads and campaigns as total leads might change
    }),
    exportLeads: builder.query({
      query: (campaignUuid) => ({
        url: `/superadmin/leads/export/${campaignUuid}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        responseType: "blob", // To handle file download
      }),
      // invalidatesTags: ["Leads", "Campaigns"], // Invalidate leads and campaigns as total leads might change
    }),
    updateLead: builder.mutation({
      query: ({ uuid, data }) => ({
        url: `/superadmin/leads/update/${uuid}`,
        method: "PUT",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Leads"],
    }),
    changeLeadStatus: builder.mutation({
      query: ({ uuid, data }) => ({
        url: `/superadmin/leads/change-status/${uuid}`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Leads"],
    }),
    deleteLead: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/leads/delete/${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Leads", "Campaigns"], // Invalidate leads and campaigns as total leads might change
    }),
    deleteMultipleLeads: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/leads/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body: { uuids },
      }),
      invalidatesTags: ["Leads", "Campaigns"], // Invalidate leads and campaigns as total leads might change
    }),
    createLead: builder.mutation({
      query: ({ campaignUuid, data }) => ({
        url: `/superadmin/leads/create/${campaignUuid}`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Leads", "Campaigns"], // Invalidate leads and campaigns as total leads might change
    }),
    assignMultipleLeadsToAgent: builder.mutation({
      query: ({ uuids, agentId }) => ({
        url: `/superadmin/leads/assign-multiple`,
        method: "POST",
        body: { uuids, agentId },
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Leads", "Campaigns"],
    }),
    changeMultipleLeadsStatus: builder.mutation({
      query: ({ uuids, status }) => ({
        url: `/superadmin/leads/change-status-multiple`,
        method: "POST",
        body: { uuids, status },
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Leads", "Campaigns"],
    }),

    // Validation Log Endpoints
    createValidationLogsFromLeads: builder.mutation({
      query: ({ uuids }) => ({
        url: `/superadmin/leads/create-validation-logs`,
        method: "POST",
        body: { uuids },
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["ValidationLogs"],
    }),
    getValidationLogs: builder.query({
      query: (campaignUuid?: string) => ({
        url: `/superadmin/validation-logs/list${
          campaignUuid ? `?campaignUuid=${campaignUuid}` : ""
        }`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["ValidationLogs"],
    }),
    getValidationLogSummary: builder.query({
      query: (phone: string) => ({
        url: `/superadmin/validation-logs/summary/${phone}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: (phone) => [{ type: "ValidationLogs", id: phone }],
    }),
    deleteValidationLog: builder.mutation({
      query: (id) => ({
        url: `/superadmin/validation-logs/delete/${id}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["ValidationLogs"],
    }),
    deleteMultipleValidationLogs: builder.mutation({
      query: (ids) => ({
        url: `/superadmin/validation-logs/delete-multiple`,
        method: "POST",
        body: { ids },
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["ValidationLogs"],
    }),
    getLeadActivityLogs: builder.query({
      query: ({ leadUuid, page = 1, limit = 50 }) => ({
        url: `/superadmin/leads/${leadUuid}/activity-logs?page=${page}&limit=${limit}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["LeadActivityLog", "Leads"],
    }),

    getRecentActivity: builder.query({
      query: (limit = 10) => ({
        url: `/superadmin/leads/activity/recent?limit=${limit}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["LeadActivityLog", "Leads"],
    }),

    moveLeadsToCampaign: builder.mutation({
      query: (body: { leadUuids: string[]; targetCampaignUuid: string }) => ({
        url: '/superadmin/leads/move-to-campaign',
        method: 'POST',
        body,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["Leads", "Campaigns"],
    }),
    getAgentLeadStatistics: builder.query({
      query: ({ status, startDate, endDate }: { status?: string; startDate?: string; endDate?: string } = {}) => {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        const qs = params.toString();
        return {
          url: `/superadmin/leads/agent-statistics${qs ? `?${qs}` : ''}`,
          method: 'GET',
          headers: { authorization: `Bearer ${getEnvUrls().accessToken}` },
        };
      },
      providesTags: ['Leads'],
    }),
  }),
});

export const {
  useGetCampaignsQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useDeleteCampaignMutation,
  useDeleteMultipleCampaignsMutation,
  useGetLeadsByCampaignQuery,
  useGetLeadsByAgentQuery,
  useImportLeadsMutation,
  useExportLeadsQuery,
  useUpdateLeadMutation,
  useChangeLeadStatusMutation,
  useDeleteLeadMutation,
  useDeleteMultipleLeadsMutation,
  useCreateLeadMutation,
  useAssignMultipleLeadsToAgentMutation,
  useChangeMultipleLeadsStatusMutation,
  useGetAllLeadsQuery,
  useMergeCampaignsMutation,
  useAnalyzeCampaignMergeMutation,
  useCreateValidationLogsFromLeadsMutation,
  useGetValidationLogsQuery,
  useMoveLeadsToCampaignMutation,
  useDeleteValidationLogMutation,
  useDeleteMultipleValidationLogsMutation,
  useGetValidationLogSummaryQuery,
  useGetLeadActivityLogsQuery,
  useGetRecentActivityQuery,
  useGetAgentLeadStatisticsQuery,
} = leadManagementApi;
