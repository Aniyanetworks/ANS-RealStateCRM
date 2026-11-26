import { getEnvUrls } from '../../../../utils/constant';
import { api } from '../../apiSlice';

export const knowledgeBaseApi = api.injectEndpoints({
    endpoints: (builder) => ({

        getKnowledgeBase: builder.query({
            query: () => ({
                url: 'superadmin/knowledge-base/list',
                method: 'GET',
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ["GetKnowledgeBaseListTag"],
        }),

        getKnowledgeBaseDetail: builder.query({
            query: (id) => ({
                url: `superadmin/knowledge-base/get-single?id=${id}`,
                method: 'GET',
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ["GetKnowledgeBaseDetailTag"],
        }),

        createOrUpdateKnowledgeBase: builder.mutation({
            query: (knowledgeBase) => ({
                url: 'superadmin/knowledge-base/create',
                method: 'POST',
                body: knowledgeBase,
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ["GetKnowledgeBaseListTag"],
        }),

        deleteMultipleKnowledgeBase: builder.mutation({
            query: (ids) => ({
                url: `superadmin/knowledge-base/delete`,
                method: 'DELETE',
                body: ids ,
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ["GetKnowledgeBaseListTag"],
        }),

        changeKnowledgeBaseStatus: builder.mutation({
            query: ({ uuid, status }) => ({
                url: `superadmin/knowledge-base/change-status/${uuid}`,
                method: 'POST',
                body: { status },
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ["GetKnowledgeBaseListTag"],
        }),

    }),
});

export const {
    useGetKnowledgeBaseQuery,
    useGetKnowledgeBaseDetailQuery,
    useCreateOrUpdateKnowledgeBaseMutation,
    useDeleteMultipleKnowledgeBaseMutation,
    useChangeKnowledgeBaseStatusMutation,
} = knowledgeBaseApi;