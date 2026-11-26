
import { getEnvUrls } from '../../../../utils/constant';
import { api } from '../../apiSlice';

export const artWorkApi = api.injectEndpoints({
    endpoints: (builder) => ({

        getArtWorks: builder.query({
            query: () => ({
                url: 'superadmin/art-work/list',
                method: 'GET',
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ["GetArtWorkListTag"],
        }),

        getArtWorkDetail: builder.query({
            query: (id) => ({
                url: `superadmin/art-work/get-single?id=${id}`,
                method: 'GET',
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ["GetArtWorkDetailTag"],
        }),

        createArtWork: builder.mutation({
            query: (artwork) => ({
                url: 'superadmin/art-work/create',
                method: 'POST',
                body: artwork,
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ["GetArtWorkListTag"],
        }),

        updateArtWork: builder.mutation({
            query: ({ id, artwork }) => ({
                url: `superadmin/art-work/update?id=${id}`,
                method: 'POST',
                body: artwork,
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ["GetArtWorkListTag"],
        }),

        deleteArtWork: builder.mutation({
            query: (id) => ({
                url: `superadmin/art-work/delete?id=${id}`,
                method: 'DELETE',
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ["GetArtWorkListTag"],
        }),

        // get all support team
        getSupportTeam: builder.query({
            query: (type) => ({
                url: `superadmin/support-team/list?type=${type}`,
                method: 'GET',
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
        }),
    }),
});

export const {
    useGetArtWorksQuery,
    useGetArtWorkDetailQuery,
    useCreateArtWorkMutation,
    useUpdateArtWorkMutation,
    useDeleteArtWorkMutation,
    useGetSupportTeamQuery,
} = artWorkApi;
