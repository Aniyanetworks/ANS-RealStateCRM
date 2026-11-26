import { getEnvUrls } from '../../../utils/constant';
import { api } from '../apiSlice';

const templateBuilderApi = api.injectEndpoints({
    endpoints: (builder) => ({

        createTemplateBuilder: builder.mutation({
            query: (data) => ({
                url: `/superadmin/template-builder/create`,
                method: "POST",
                body: data,
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ["TemplateBuilderListTag"],
        }),

        updateTemplateBuilder: builder.mutation({
            query: ({ data, uuid }: { data: any; uuid: string }) => ({
                url: `/superadmin/template-builder/update?uuid=${uuid}`,
                method: "POST",
                body: data,
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ["TemplateBuilderListTag", "SingleTemplateBuilderTag"],
        }),

        getTemplateBuilderList: builder.query({
            query: ({ type, area }) => ({
                url: `/superadmin/template-builder/list`,
                method: "GET",
                params: { type, area }, // <- this is how you pass query params in RTK Query
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ["TemplateBuilderListTag"],
        }),        

        getSingleTemplateBuilder: builder.query({
            query: (uuid: string) => ({
                url: `/superadmin/template-builder/list?uuid=${uuid}`,
                method: "GET",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ["SingleTemplateBuilderTag"],
        }),

        deleteTemplateBuilder: builder.mutation({
            query: (uuid: string) => ({
                url: `/superadmin/template-builder/delete?uuid=${uuid}`,
                method: "DELETE",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ["TemplateBuilderListTag"],
        }),

        deleteMultipleTemplateBuilders: builder.mutation({
            query: (uuids: string[]) => ({
                url: `/superadmin/template-builder/delete-multiple`,
                method: "DELETE",
                body: { uuids },
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            invalidatesTags: ["TemplateBuilderListTag"],
        }),
    }),
});

export const {
    useCreateTemplateBuilderMutation,
    useUpdateTemplateBuilderMutation,
    useGetTemplateBuilderListQuery,
    useGetSingleTemplateBuilderQuery,
    useDeleteTemplateBuilderMutation,
    useDeleteMultipleTemplateBuildersMutation,
} = templateBuilderApi;
