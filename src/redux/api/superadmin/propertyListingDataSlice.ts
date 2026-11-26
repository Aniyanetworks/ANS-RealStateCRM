/* eslint-disable @typescript-eslint/no-explicit-any */
import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

export type PropertyListingQueryArg = {
  userId?: string;
  listingType?: string;
};

const propertyListingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPropertyListing: builder.query({
      query: ({ userId, listingType }: PropertyListingQueryArg = {}) => {
        const params = [];
        if (userId) params.push(`userId=${userId}`);
        if (listingType) params.push(`listingType=${listingType}`);
        const queryString = params.length ? `?${params.join('&')}` : '';
        return {
          url: `/superadmin/property-listing/list${queryString}`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["getPropertyListingTag"],
    }),

    getSpacificPropertyListing: builder.query({
      query: (uuid) => ({
        url: `/superadmin/property-listing/get-spacific-property-listing?uuid=${uuid}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getPropertyListingTag"],
    }),

    createUpdatePropertyListing: builder.mutation({
      query: ({ uuid, data }: { uuid: string; data: any; }) => {
        return {
          url: `/superadmin/property-listing/create-and-update?uuid=${uuid}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getPropertyListingTag", "getSpacificTradeSheetListDataTag"],
    }),

    syncMlsNumber: builder.mutation({
      query: ({ uuid, mlsNumber }: { uuid: string; mlsNumber: string; }) => {
        return {
          url: `/superadmin/property-listing/sync-mls?uuid=${uuid}`,
          method: "POST",
          body: { mlsNumber },
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getPropertyListingTag", "getSpacificTradeSheetListDataTag"],
    }),

    syncPropertyFromRealtor: builder.mutation({
      query: ({ uuid, realtorData }: { uuid: string; realtorData: any; }) => {
        return {
          url: `/superadmin/property-listing/sync-from-realtor?uuid=${uuid}`,
          method: "POST",
          body: realtorData,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getPropertyListingTag", "getSpacificTradeSheetListDataTag"],
    }),

    createUpdateFullPropertyListingData: builder.mutation({
      query: ({ uuid, data }: { uuid: string; data: any; }) => {
        return {
          url: `/superadmin/property-listing/create-and-update-full?uuid=${uuid}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getPropertyListingTag", "getSpacificTradeSheetListDataTag"],
    }),


    getPropertyListingListBasedOnExpiry: builder.query({
      query: () => ({
        url: `/superadmin/property-listing/get-trade-property-listing-based-on-expiry`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      // providesTags: ["getPropertyListingListDataTag"], // optional tagging
    }),


    createUpdateFullPropertyListingDataOnTradesheet: builder.mutation({
      query: ({ data }: { data: any; }) => {
        return {
          url: `/superadmin/property-listing/create-and-update-full-on-tradesheet`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getPropertyListingTag", "getSpacificTradeSheetListDataTag"],
    }),


    deletePropertyListing: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/property-listing/delete?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getPropertyListingTag", "getSpacificTradeSheetListDataTag"],
    }),

    deletePropertyListingMultiple: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/property-listing/delete-multiple`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body: { uuids }
      }),
      invalidatesTags: ["getPropertyListingTag", "getSpacificTradeSheetListDataTag"],
    }),

    changePropertyListingStatus: builder.mutation({
      query: ({ data, uuid }: { data: any; uuid?: string }) => {
        const queryParams = new URLSearchParams();
        if (uuid) queryParams.append("uuid", uuid);

        // Sending the rejectReason along with status and uuid in the request body as a JSON object
        return {
          url: `/superadmin/property-listing/change-property-listing-status?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getPropertyListingTag", "getSpacificTradeSheetListDataTag"],
    }),

    changeListingStatus: builder.mutation({
      query: ({ data, uuid }: { data: any; uuid?: string }) => {
        const queryParams = new URLSearchParams();
        if (uuid) queryParams.append("uuid", uuid);

        // Sending the rejectReason along with status and uuid in the request body as a JSON object
        return {
          url: `/superadmin/property-listing/change-listing-status?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getPropertyListingTag", "getSpacificTradeSheetListDataTag"],
    }),

    uploadPaperWorkFileAttachmentProperty: builder.mutation({
      query: ({
        data,
        propertyListingId,
        uploadFileNameId,
      }: {
        data: any;
        propertyListingId?: any;
        uploadFileNameId?: any;
      }) => {
        const queryParams = new URLSearchParams();
        if (propertyListingId) queryParams.append("propertyListingId", propertyListingId);
        if (uploadFileNameId)
          queryParams.append("uploadFileNameId", uploadFileNameId);

        return {
          url: `/superadmin/property-listing/upload-paper-work-file-attachment?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: [
        "getPropertyListingTag", "getSpacificTradeSheetListDataTag"
      ],
    }),

    deletePaperWorkFileAttachmentProperty: builder.mutation({
      query: (id) => ({
        url: `/superadmin/property-listing/delete-paper-work-file-attachment?id=${id}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getPropertyListingTag", "getSpacificTradeSheetListDataTag"], // Use invalidatesTags for cache invalidation
    }),


    uploadPaperWorkOtherFileAttachmentProperty: builder.mutation({
      query: ({
        data,
        propertyListingId,
        uploadFileNameId,
      }: {
        data: any;
        propertyListingId?: any;
        uploadFileNameId?: any;
      }) => {
        const queryParams = new URLSearchParams();
        if (propertyListingId) queryParams.append("propertyListingId", propertyListingId);
        if (uploadFileNameId)
          queryParams.append("uploadFileNameId", uploadFileNameId);

        return {
          url: `/superadmin/property-listing/upload-paper-work-other-file-attachment?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: [
        "getPropertyListingTag", "getSpacificTradeSheetListDataTag"
      ],
    }),

    deletePaperWorkOtherFileAttachmentProperty: builder.mutation({
      query: (id) => ({
        url: `/superadmin/property-listing/delete-paper-work-other-file-attachment?id=${id}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getPropertyListingTag", "getSpacificTradeSheetListDataTag"], // Use invalidatesTags for cache invalidation
    }),

    changePropertyListingAttachmentStatus: builder.mutation({
      query: ({ data, id }: { data: any; id?: any }) => {
        const queryParams = new URLSearchParams();
        if (id) queryParams.append("id", id);

        // Sending the rejectReason along with status and uuid in the request body as a JSON object
        return {
          url: `/superadmin/property-listing/change-property-listing-attachment-status?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getPropertyListingTag", "getSpacificTradeSheetListDataTag"],
    }),

    changePropertyListingOtherAttachmentStatus: builder.mutation({
      query: ({ data, id }: { data: any; id?: any }) => {
        const queryParams = new URLSearchParams();
        if (id) queryParams.append("id", id);

        return {
          url: `/superadmin/property-listing/change-property-listing-other-attachment-status?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getPropertyListingTag", "getSpacificTradeSheetListDataTag"],
    }),

    resubmitPropertyAttachment: builder.mutation({
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
          url: `/superadmin/property-listing/resubmit-property-file-attachment?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: [
        "getPropertyListingTag",
        "getSpacificTradeSheetListDataTag"
      ],
    }),

    // --- Property Listing Note Endpoints ---
    getPropertyListingNote: builder.query({
      query: ({ propertyListingId }) => {
        if (!propertyListingId) throw new Error("propertyListingId is required");
        return {
          url: `/superadmin/property-listing/get-property-listing-notes?propertyListingId=${propertyListingId}`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["getPropertyListingNoteTag"],
    }),

    createUpdatePropertyListingNote: builder.mutation({
      query: ({ uuid, data }) => {
        return {
          url: `/superadmin/property-listing/create-update-property-listing-note?uuid=${uuid ?? 'null'}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["getPropertyListingNoteTag"],
    }),

    deletePropertyListingNote: builder.mutation({
      query: (uuid) => ({
        url: `/superadmin/property-listing/delete-property-listing-note?uuid=${uuid}`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["getPropertyListingNoteTag"],
    }),

    deleteMultiplePropertyListingNote: builder.mutation({
      query: (uuids) => ({
        url: `/superadmin/property-listing/delete-multiple-property-listing-notes`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
        body: { uuids },
      }),
      invalidatesTags: ["getPropertyListingNoteTag"],
    }),

  }),
});

export const {
  useGetPropertyListingQuery,
  useCreateUpdatePropertyListingMutation,
  useSyncMlsNumberMutation,
  useSyncPropertyFromRealtorMutation,
  useCreateUpdateFullPropertyListingDataMutation,
  useDeletePropertyListingMutation,
  useDeletePropertyListingMultipleMutation,
  useChangePropertyListingStatusMutation,
  useChangeListingStatusMutation,
  useGetSpacificPropertyListingQuery,
  useCreateUpdateFullPropertyListingDataOnTradesheetMutation,
  useUploadPaperWorkFileAttachmentPropertyMutation,
  useDeletePaperWorkFileAttachmentPropertyMutation,
  useUploadPaperWorkOtherFileAttachmentPropertyMutation,
  useDeletePaperWorkOtherFileAttachmentPropertyMutation,
  useChangePropertyListingAttachmentStatusMutation,
  useChangePropertyListingOtherAttachmentStatusMutation,
  useResubmitPropertyAttachmentMutation,
  useGetPropertyListingNoteQuery,
  useCreateUpdatePropertyListingNoteMutation,
  useDeletePropertyListingNoteMutation,
  useDeleteMultiplePropertyListingNoteMutation,
  useGetPropertyListingListBasedOnExpiryQuery
} = propertyListingApi;