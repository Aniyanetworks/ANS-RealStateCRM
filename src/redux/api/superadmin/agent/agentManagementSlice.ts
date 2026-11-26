/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";

const agentManagementApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createAgent: builder.mutation({
      query: (data) => {
        return {
          url: `/superadmin/agent-management/create`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: [
        "getAgentListDataTag",
        "getSingleAgentDataTag",
        "getUserListDataTag",
        "getSpacificUserDataTag",
        "getAgentOtherDocumentsTag",
        "getBrokerageDataTag",
      ],
    }),

    inviteAgent: builder.mutation({
      query: (data) => {
        return {
          url: `/superadmin/agent-management/invite-agent`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: [
        "getAgentListDataTag",
        "getSingleAgentDataTag",
        "getUserListDataTag",
        "getSpacificUserDataTag",
        "getBrokerageDataTag",
      ],
    }),

    updateAgent: builder.mutation({
      query: ({ data, uuid }: { data: any; uuid?: string }) => {
        const queryParams = new URLSearchParams();
        if (uuid) queryParams.append("uuid", uuid);
        return {
          url: `/superadmin/agent-management/update?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: [
        "getAgentListDataTag",
        "getSingleAgentDataTag",
        "getUserListDataTag",
        "getSpacificUserDataTag",
        "getAgentOtherDocumentsTag",
        "getBrokerageDataTag",
      ],
    }),

    getAgentListData: builder.query({
      query: () => ({
        url: `/superadmin/agent-management/list`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getAgentListDataTag"],
    }),
    getAgentReportData: builder.query({
      query: (params?: { branchIds?: string[] | string }) => {
        const queryParams = new URLSearchParams();
        if (params?.branchIds) {
          const branchIdsStr = Array.isArray(params.branchIds)
            ? params.branchIds.join(",")
            : params.branchIds;
          if (branchIdsStr) queryParams.append("branchIds", branchIdsStr);
        }
        const query = queryParams.toString();
        return {
          url: `/superadmin/agent-reports/list${query ? `?${query}` : ""}`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["getAgentReportDataTag", "getAgentListDataTag"],
    }),
    getTopAgentReportData: builder.query({
      query: (params = "All Time") => {
        const queryParams = new URLSearchParams();

        if (typeof params === "object" && params !== null) {
          const { filterMonth, startDate, endDate, branchIds } = params;

          if (filterMonth === "custom" && startDate && endDate) {
            queryParams.append("filterMonth", "custom");
            queryParams.append("startDate", startDate);
            queryParams.append("endDate", endDate);
          } else if (filterMonth) {
            queryParams.append("filterMonth", filterMonth);
          } else {
            queryParams.append("filterMonth", "All Time");
          }

          if (branchIds && (Array.isArray(branchIds) ? branchIds.length > 0 : branchIds)) {
            const branchIdsStr = Array.isArray(branchIds) ? branchIds.join(",") : branchIds;
            queryParams.append("branchIds", branchIdsStr);
          }
        } else {
          queryParams.append("filterMonth", params || "All Time");
        }

        return {
          url: `/superadmin/agent-reports/top-agent-list?${queryParams.toString()}`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["getAgentReportDataTag", "getTradeSheetListDataTag"],
    }),

    getAgentDetailsData: builder.query({
      query: (agentId) => ({
        url: `/superadmin/agent-reports/details?agentId=${agentId}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getAgentReportDataTag", "getAgentListDataTag"],
    }),

    getSingleAgentData: builder.query({
      query: (uuid) => ({
        url: `/superadmin/agent-management/get-single-agent?uuid=${uuid}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),

      providesTags: ["getSingleAgentDataTag"],
    }),

    deleteSingleAgent: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/agent-management/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: [
        "getAgentListDataTag",
        "getSingleAgentDataTag",
        "getUserListDataTag",
        "getSpacificUserDataTag",
      ],
    }),

    deleteMultipleAgent: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/agent-management/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body: { uuids },
      }),
      invalidatesTags: ["getAgentListDataTag"],
    }),

    getAgentByToken: builder.query({
      query: (token) => ({
        url: `/superadmin/agent-management/get-agent-by-token?token=${token}`,
        method: "GET",
      }),
    }),

    createPassword: builder.mutation({
      query: ({ data, token }: { data: any; token?: string }) => {
        return {
          url: `/auth/agent/create-password?token=${token}`,
          method: "POST",
          body: data,
        };
      },
    }),

    submitAgentInfo: builder.mutation({
      query: (data) => {
        return {
          url: `/agent/submit-agent-info`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: [
        "getAgentListDataTag",
        "getSingleAgentDataTag",
        "getUserListDataTag",
        "getSpacificUserDataTag",
        "getBrokerageDataTag",
      ],
    }),

    uploadAgentAttachment: builder.mutation({
      query: ({
        data,
        agent_id,
        type,
      }: {
        data: any;
        agent_id?: any;
        type?: any;
      }) => {
        const queryParams = new URLSearchParams();
        if (agent_id) queryParams.append("agent_id", agent_id);
        if (type) queryParams.append("type", type);
        return {
          url: `/agent/upload-agent-attachment?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: [
        "getAgentListDataTag",
        "AgentOtherDocumentTag",
        "getSingleAgentDataTag",
      ],
    }),

    getAgentOtherDocuments: builder.query({
      query: (agentId) => ({
        url: `/superadmin/agent-management/agent-other-documents?agentId=${agentId}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),

    changeAgentAccountStatus: builder.mutation({
      query: ({ status, id }: { status: any; id?: string }) => {
        const queryParams = new URLSearchParams();
        if (id) queryParams.append("id", id);
        if (status) queryParams.append("status", status);

        return {
          url: `/superadmin/agent-management/change-agent-account-status?${queryParams.toString()}`,
          method: "POST",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getAgentListDataTag", "getSingleAgentDataTag"],
    }),

    changeAgentAgreementStatus: builder.mutation({
      query: (data: any) => {
        return {
          url: `/superadmin/agent-management/change-agent-agreement-status`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getAgentListDataTag", "getSingleAgentDataTag"],
    }),

    removeAgentFile: builder.mutation({
      query: ({ fileName, id }: { fileName: any; id: any }) => {
        return {
          url: `/superadmin/agent-management/remove-agent-file?fileName=${fileName}&id=${id}`,
          method: "POST",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getAgentListDataTag", "getSingleAgentDataTag"],
    }),

    removeOtherFile: builder.mutation({
      query: (id) => {
        return {
          url: `/superadmin/agent-management/remove-other-file?id=${id}`,
          method: "POST",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getAgentOtherDocumentsTag", "getAgentListDataTag"],
    }),

    changeAgreementStep: builder.mutation({
      query: ({ step, id }: { step: any; id?: string }) => {
        const queryParams = new URLSearchParams();
        if (id) queryParams.append("id", id);
        if (step) queryParams.append("step", step);

        return {
          url: `/agent/change-agreement-step?${queryParams.toString()}`,
          method: "POST",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getAgentListDataTag", "getSingleAgentDataTag"],
    }),

    toggleAgentStatus: builder.mutation({
      query: (body: { agentId: string; isActive: boolean }) => ({
        url: '/superadmin/agent-management/toggle-status',
        method: 'POST',
        body,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getAgentListDataTag", "getSingleAgentDataTag"],
    }),
    toggleAgentShowWebsite: builder.mutation({
      query: (body: { agentId: string; showWebsite: boolean }) => ({
        url: '/superadmin/agent-management/toggle-show-website',
        method: 'POST',
        body,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getAgentListDataTag", "getSingleAgentDataTag"],
    }),

    getSharedChildren: builder.query<
      { status: boolean; data: FileNode[] },
      { parentId: number }
    >({
      query: ({ parentId }) => ({
        url: `/common/file-manager/shared-children?parentId=${parentId}`,
        method: "GET",
      }),
      providesTags: ["FileManagerNodesTag"],
    }),
  }),
});

export const {
  useCreateAgentMutation,
  useInviteAgentMutation,
  useUpdateAgentMutation,
  useGetAgentListDataQuery,
  useGetSharedChildrenQuery,
  useGetAgentReportDataQuery,
  useGetTopAgentReportDataQuery,
  useGetAgentDetailsDataQuery,
  useGetSingleAgentDataQuery,
  useDeleteSingleAgentMutation,
  useDeleteMultipleAgentMutation,
  useCreatePasswordMutation,
  useSubmitAgentInfoMutation,
  useGetAgentByTokenQuery,
  useChangeAgentAccountStatusMutation,
  useChangeAgentAgreementStatusMutation,
  useChangeAgreementStepMutation,
  useRemoveAgentFileMutation,
  useUploadAgentAttachmentMutation,
  useGetAgentOtherDocumentsQuery,
  useRemoveOtherFileMutation,
  useToggleAgentStatusMutation,
  useToggleAgentShowWebsiteMutation,
} = agentManagementApi;
