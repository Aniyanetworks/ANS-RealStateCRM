/* eslint-disable @typescript-eslint/no-explicit-any */
import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";

const tradeSheetApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createUpdateAgentBasicInfo: builder.mutation({
      query: ({ data, uuid }: { data: any; uuid?: string }) => {
        const queryParams = new URLSearchParams();
        if (uuid) queryParams.append("uuid", uuid);

        return {
          url: `/agent/trade-sheet-management/create-update-agent-basic-info?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: [
        "getTradeSheetListDataTag",
        "getSpacificTradeSheetListDataTag",
      ],
    }),

    createUpdatePropertyDetails: builder.mutation({
      query: ({ data, uuid }: { data: any; uuid?: string }) => {
        const queryParams = new URLSearchParams();
        if (uuid) queryParams.append("uuid", uuid);

        return {
          url: `/agent/trade-sheet-management/create-update-property-details?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: [ "getTradeSheetListDataTag","getSpacificTradeSheetListDataTag","getPropertyListingTag"],
    }),

    createUpdateSellerInformations: builder.mutation({
      query: ({ data, uuid }: { data: any; uuid?: string }) => {
        const queryParams = new URLSearchParams();
        if (uuid) queryParams.append("uuid", uuid);

        return {
          url: `/agent/trade-sheet-management/create-update-seller-informations?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getSpacificTradeSheetListDataTag"],
    }),

    createUpdateBuyerInformations: builder.mutation({
      query: ({ data, uuid }: { data: any; uuid?: string }) => {
        const queryParams = new URLSearchParams();
        if (uuid) queryParams.append("uuid", uuid);

        return {
          url: `/agent/trade-sheet-management/create-update-buyer-informations?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getSpacificTradeSheetListDataTag"],
    }),

    createUpdateAgentDetails: builder.mutation({
      query: ({ data, uuid }: { data: any; uuid?: string }) => {
        const queryParams = new URLSearchParams();
        if (uuid) queryParams.append("uuid", uuid);

        return {
          url: `/agent/trade-sheet-management/create-update-agent-details?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getSpacificTradeSheetListDataTag","getBrokerageDataTag"],
    }),

    createUpdateExtAgent: builder.mutation({
      query: ({ data, uuid }: { data: any; uuid?: string }) => {
        const queryParams = new URLSearchParams();
        if (uuid) queryParams.append("uuid", uuid);

        return {
          url: `/agent/trade-sheet-management/create-update-ext-agent?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["ExternalAgentListTag"],
    }),

    createUpdateLawyerDetails: builder.mutation({
      query: ({ data, uuid }: { data: any; uuid?: string }) => {
        const queryParams = new URLSearchParams();
        if (uuid) queryParams.append("uuid", uuid);

        return {
          url: `/agent/trade-sheet-management/create-update-lawyer-details?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getSpacificTradeSheetListDataTag","getLawyerDataTag"],
    }),

    getAgentLeadsForTradeSheet: builder.query({
      query: (agentId?: number | string) => ({
        url: agentId
          ? `/agent/trade-sheet-management/get-my-leads?agentId=${agentId}`
          : `/agent/trade-sheet-management/get-my-leads`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),

    getTradeSheetListData: builder.query({
      query: () => ({
        url: `/agent/trade-sheet-management/get-trade-sheet-list`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getTradeSheetListDataTag"],
    }),

    getTradeSheetListBasedonClosing: builder.query({
      query: () => ({
        url: `/agent/trade-sheet-management/get-trade-sheet-list-based-on-closing`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),

    getArchiveTradeSheetListData: builder.query({
      query: () => ({
        url: `/agent/trade-sheet-management/get-archive-trade-sheet-list`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getTradeSheetListDataTag"],
    }),

    getSpacificTradeSheetListData: builder.query({
      query: (uuid) => ({
        url: `/agent/trade-sheet-management/get-spacific-trade-sheet?uuid=${uuid}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getSpacificTradeSheetListDataTag"],
    }),

    changeTradeSheetStatus: builder.mutation({
      query: ({ data, uuid }: { data: any; uuid?: string }) => {
        const queryParams = new URLSearchParams();
        if (uuid) queryParams.append("uuid", uuid);
        
        return {
          url: `/agent/trade-sheet-management/change-trade-sheet-status?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getTradeSheetListDataTag", "getSpacificTradeSheetListDataTag","getArchiveTradeSheetListDataTag","getAgentReportDataTag"],
    }),

    changeTradeAdminStatus: builder.mutation({
      query: ({ data, uuid }: { data: any; uuid?: string }) => {
        const queryParams = new URLSearchParams();
        if (uuid) queryParams.append("uuid", uuid);
        
        return {
          url: `/agent/trade-sheet-management/change-trade-admin-status?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getTradeSheetListDataTag", "getSpacificTradeSheetListDataTag","getArchiveTradeSheetListDataTag"],
    }),
    

    toggleImportantFile: builder.mutation({
      query: (data: { tradeSheetUuid: string; uploadFileNameId: number }) => ({
        url: `/agent/trade-sheet-management/toggle-important-file`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getSpacificTradeSheetListDataTag"],
    }),

    deleteSpacificTradeSheet: builder.mutation({
      query: (uuid) => ({
        url: `/agent/trade-sheet-management/delete-spacific-trade-sheet?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getTradeSheetListDataTag","getArchiveTradeSheetListDataTag"],
    }),
    deleteTradeSheetMultiple: builder.mutation({
      query: (uuids) => ({
        url: `/agent/trade-sheet-management/delete-multiple-trade-sheet`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body:{ uuids }
      }),
      invalidatesTags: ["getTradeSheetListDataTag","getArchiveTradeSheetListDataTag"],
    }),

    archiveSpecificTradeSheet: builder.mutation({
      query: (uuid) => ({
        url: `/agent/trade-sheet-management/archive-specific-trade-sheet`,
        method: "POST",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body: { uuid }
      }),
      invalidatesTags: ["getTradeSheetListDataTag","getArchiveTradeSheetListDataTag"],
    }),
    
    archiveMultipleTradeSheets: builder.mutation({
      query: (uuids) => ({
        url: `/agent/trade-sheet-management/archive-multiple-trade-sheets`,
        method: "POST",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body: { uuids }
      }),
      invalidatesTags: ["getTradeSheetListDataTag","getArchiveTradeSheetListDataTag"],
    }),
    

    uploadPaperWorkFileAttachment: builder.mutation({
      query: ({
        data,
        tradeSheetId,
        uploadFileNameId,
      }: {
        data: any;
        tradeSheetId?: any;
        uploadFileNameId?: any;
      }) => {
        const queryParams = new URLSearchParams();
        if (tradeSheetId) queryParams.append("tradeSheetId", tradeSheetId);
        if (uploadFileNameId)
          queryParams.append("uploadFileNameId", uploadFileNameId);

        return {
          url: `/agent/trade-sheet-management/upload-paper-work-file-attachment?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: [
        "getTradeSheetListDataTag",
        "getSpacificTradeSheetListDataTag","getUploadFileCategoriesTag",
        "FileActivityListTag"
      ],
    }),

    resubmitPaperWorkFileAttachment: builder.mutation({
      query: ({
        data,
        id
      }: {
        data: any;
        id?: any;
      }) => {
        const queryParams = new URLSearchParams();
        if (id) queryParams.append("id", id);

        return {
          url: `/agent/trade-sheet-management/resubmit-paper-work-file-attachment?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: [
        "getTradeSheetListDataTag",
        "getSpacificTradeSheetListDataTag","getUploadFileCategoriesTag"
      ],
    }),
    resubmitPaperWorkOtherFileAttachment: builder.mutation({
      query: ({
        data,
        id
      }: {
        data: any;
        id?: any;
      }) => {
        const queryParams = new URLSearchParams();
        if (id) queryParams.append("id", id);

        return {
          url: `/agent/trade-sheet-management/resubmit-other-document?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: [
        "getTradeSheetListDataTag",
        "getSpacificTradeSheetListDataTag","getUploadFileCategoriesTag"
      ],
    }),

    deletePaperWorkFileAttachment: builder.mutation({
      query: (id) => ({
        url: `/agent/trade-sheet-management/delete-paper-work-file-attachment?id=${id}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getTradeSheetListDataTag","getSpacificTradeSheetListDataTag","getUploadFileCategoriesTag"],
    }),

    uploadOtherDocument: builder.mutation({
      query: ({
        data,
        tradeSheetId,
        
      }: {
        data: any;
        tradeSheetId?: any;
      }) => {
        const queryParams = new URLSearchParams();
        if (tradeSheetId) queryParams.append("tradeSheetId", tradeSheetId);
    
        return {
          url: `/agent/trade-sheet-management/upload-other-document?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: [
        "getTradeSheetListDataTag",
        "getSpacificTradeSheetListDataTag",
        "FileActivityListTag"
      ],
    }),

    deleteOtherAttachment: builder.mutation({
      query: (id) => ({
        url: `/agent/trade-sheet-management/delete-other-attachment?id=${id}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getTradeSheetListDataTag","getSpacificTradeSheetListDataTag"],
    }),

    changeTradeSheetAttachmentStatus: builder.mutation({
      query: ({ data, id }: { data: any; id?: any }) => {
        const queryParams = new URLSearchParams();
        if (id) queryParams.append("id", id);
        
        return {
          url: `/agent/trade-sheet-management/change-change-trade-sheet-attachment-status?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getTradeSheetListDataTag", "getSpacificTradeSheetListDataTag","getAgentReportDataTag"],
    }),
    changeTradeSheetAttachmentOtherStatus: builder.mutation({
      query: ({ data, id }: { data: any; id?: any }) => {
        const queryParams = new URLSearchParams();
        if (id) queryParams.append("id", id);
        
        return {
          url: `/agent/trade-sheet-management/change-change-trade-sheet-other-attachment-status?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getTradeSheetListDataTag", "getSpacificTradeSheetListDataTag","getAgentReportDataTag"],
    }),
    
    getTradeSheetNote: builder.query({
      query: ({ tradeSheetId }) => {
        if (!tradeSheetId) throw new Error("tradeSheetId is required");
        return {
          url: `/agent/trade-sheet-management/get-tradesheet-notes?tradeSheetId=${tradeSheetId}`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["getTradeSheetNoteTag"],
    }),

    createUpdateTradeSheetNote: builder.mutation({
      query: ({ uuid, data }) => {
        return {
          url: `/agent/trade-sheet-management/create-update-tradesheet-note?uuid=${uuid ?? 'null'}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getTradeSheetNoteTag"],
    }),

    deleteTradeSheetNote: builder.mutation({
      query: (uuid) => ({
        url: `/agent/trade-sheet-management/delete-tradesheet-note?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getTradeSheetNoteTag"],
    }),

    deleteMultipleTradeSheetNote: builder.mutation({
      query: (uuids) => ({
        url: `/agent/trade-sheet-management/delete-multiple-tradesheet-notes`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body: { uuids },
      }),
      invalidatesTags: ["getTradeSheetNoteTag"],
    }),
    addSharedUser: builder.mutation({
      query: ({ uuid, data }: { uuid: string; data: any }) => ({
        url: `/agent/trade-sheet-management/shared-users/add?uuid=${uuid}`,
        method: "POST",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getSharedUsersTag"],
    }),

    removeSharedUser: builder.mutation({
      query: (id: number) => ({
        url: `/agent/trade-sheet-management/shared-users/remove?id=${id}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getSharedUsersTag"],
    }),

    updateSharedUserCommission: builder.mutation({
      query: ({ id, data }: { id: number; data: any }) => ({
        url: `/agent/trade-sheet-management/shared-users/commission?id=${id}`,
        method: "PUT",
        body: data,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getSharedUsersTag"],
    }),

    getSharedUsersByRepresentation: builder.query({
      query: ({ uuid, representationType }: { uuid: string; representationType: string }) => ({
        url: `/agent/trade-sheet-management/shared-users/by-representation?uuid=${uuid}&representationType=${representationType}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getSharedUsersTag"],
    }),
  }),
});

export const {
  useGetAgentLeadsForTradeSheetQuery,
  useGetTradeSheetListDataQuery,
  useGetTradeSheetListBasedonClosingQuery,
  useGetArchiveTradeSheetListDataQuery,
  useGetSpacificTradeSheetListDataQuery,
  useLazyGetSpacificTradeSheetListDataQuery,
  useChangeTradeSheetStatusMutation,
  useChangeTradeAdminStatusMutation,
  useToggleImportantFileMutation,
  useCreateUpdateAgentBasicInfoMutation,
  useCreateUpdatePropertyDetailsMutation,
  useCreateUpdateSellerInformationsMutation,
  useCreateUpdateBuyerInformationsMutation,
  useCreateUpdateAgentDetailsMutation,
  useCreateUpdateExtAgentMutation,
  useCreateUpdateLawyerDetailsMutation,
  useDeleteSpacificTradeSheetMutation,
  useDeleteTradeSheetMultipleMutation,
  useArchiveSpecificTradeSheetMutation,
  useArchiveMultipleTradeSheetsMutation,
  useUploadPaperWorkFileAttachmentMutation,
  useResubmitPaperWorkFileAttachmentMutation,
  useResubmitPaperWorkOtherFileAttachmentMutation,
  useDeletePaperWorkFileAttachmentMutation,
  useUploadOtherDocumentMutation,
  useDeleteOtherAttachmentMutation,
  useChangeTradeSheetAttachmentStatusMutation,
  useChangeTradeSheetAttachmentOtherStatusMutation,
  useGetTradeSheetNoteQuery,
  useCreateUpdateTradeSheetNoteMutation,
  useDeleteTradeSheetNoteMutation,
  useDeleteMultipleTradeSheetNoteMutation,
  useAddSharedUserMutation,
  useRemoveSharedUserMutation,
  useUpdateSharedUserCommissionMutation,
  useGetSharedUsersByRepresentationQuery,
} = tradeSheetApi;
