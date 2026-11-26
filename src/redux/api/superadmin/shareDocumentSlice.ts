import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

export const shareDocumentApi = api.injectEndpoints({
    endpoints: (builder) => ({
        shareDocument: builder.mutation({
            query: (data) => {
                return {
                    url: `/superadmin/save-share-document`,
                    method: "POST",
                    body: data,
                };
            },
        }),

        getShareDocument: builder.query({
            query: (uuid) => {
                return {
                    url: `/superadmin/get-share-document?uuid=${uuid}`,
                    method: "GET",
                };
            },
        }),

        sendMail: builder.mutation({
            query: (data) => {
                return {
                    url: `/superadmin/send-share-document-email`,
                    method: "POST",
                    body: data,
                    headers: {
                                authorization: `Bearer ${getEnvUrls().accessToken}`,
                              },
                };
            },
        }),
    }),
});


export const {
    useShareDocumentMutation,
    useGetShareDocumentQuery,
    useSendMailMutation
} = shareDocumentApi;
