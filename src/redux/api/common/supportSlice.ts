import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

export const supportApi = api.injectEndpoints({
  endpoints: (builder) => ({

    getSupportRequests: builder.query({
      query: (type) => ({
        url: `common/support-requests/list?type=${type}`,
        method: 'GET',
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["GetSupportRequestListTag"],
    }),
    
    getSupportRequestDetail: builder.query({
      query: (id) => ({
        url: `common/support-requests/get-single?uuid=${id}`,
        method: 'GET',
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["GetSupportRequestDetailTag"],
    }),    

    createSupportRequest: builder.mutation({
      query: (request) => ({
        url: 'common/support-requests/create',
        method: 'POST',
        body: request,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["GetSupportRequestListTag"],
    }),

    uploadArtWorkFile: builder.mutation({
      query: (request) => ({
        url: 'common/support-requests/upload-artwork',
        method: 'POST',
        body: request,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["GetSupportRequestListTag"],
    }),

    getArtWorkFiles: builder.query({
      query: (id) => ({
        url: `common/support-requests/get-art-work-files?supportRequestId=${id}`,
        method: 'GET',
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["GetSupportRequestDetailTag"],
    }),

    updateSupportRequest: builder.mutation({
      query: ({ uuid, request }) => ({
        
        url: `common/support-requests/update?uuid=${uuid}`,
        method: 'POST',
        body: request,
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["GetSupportRequestListTag"],
    }),

    deleteSupportRequest: builder.mutation({
      query: (uuid) => ({
        url: `common/support-requests/delete?uuid=${uuid}`,
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["GetSupportRequestListTag"],
    }),
    deleteArtWorkFile: builder.mutation({
      query: (uuid) => ({
        url: `common/support-requests/delete-art-work-file?uuid=${uuid}`,
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["GetSupportRequestListTag"],
    }),

    assignSupportRequest: builder.mutation({
      query: ({supportRequestId, teamMemberId}) => ({
        url: 'common/support-requests/assign-member',
        method: 'POST',
        body: {supportRequestId, teamMemberId},
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
    }),

    getSupportComments: builder.query({
      query: ({ supportRequestId }: { supportRequestId?: string }) => {
        if (!supportRequestId) throw new Error("supportRequestId is required");
        return {
          url: `common/support-requests/comment-list?supportRequestId=${supportRequestId}`,
          method: "GET",
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      providesTags: ["GetSupportCommentListTag"],
    }),
    deleteSupportComment: builder.mutation({
      query: (id) => ({
        url: `common/support-requests/comment-delete?id=${id}`,
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      invalidatesTags: ["GetSupportCommentListTag"],
    }),
    createUpdateSupportComment: builder.mutation({
      query: ({ data, id }: { data: any; id?: any }) => {
        const queryParams = new URLSearchParams();
        if (id) queryParams.append("id", id);
        return {
          url: `common/support-requests/comment-create?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: [
        "GetSupportCommentListTag"
      ],
    }),
    changeSuportStatus: builder.mutation({
      query: ({ data, uuid }: { data: any; uuid?: string }) => {
        const queryParams = new URLSearchParams();
        if (uuid) queryParams.append("uuid", uuid);
        return {
          url: `common/support-requests/change-suport-status?${queryParams.toString()}`,
          method: "POST",
          body: data,
          headers: {
            authorization: `Bearer ${getEnvUrls().accessToken}`,
          },
        };
      },
      invalidatesTags: ["GetSupportCommentListTag"],
    }),
  }),
});

export const { 
  useGetSupportRequestsQuery,
  useGetSupportRequestDetailQuery,
  useCreateSupportRequestMutation,
  useUploadArtWorkFileMutation,
  useGetArtWorkFilesQuery,
  useUpdateSupportRequestMutation,
  useDeleteSupportRequestMutation,
  useDeleteArtWorkFileMutation,
  useAssignSupportRequestMutation,
  useChangeSuportStatusMutation,

  useGetSupportCommentsQuery,
  useCreateUpdateSupportCommentMutation,
  useDeleteSupportCommentMutation,
} = supportApi; 