import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const fileActivityApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getFileActivityLogs: builder.query({
            query: () => ({
                url: `/file-activity`,
                method: "GET",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ["FileActivityListTag"],
        }),
        getFileManagerActivityLogs: builder.query({
            query: () => ({
                url: `/file-manager-activity-logs`,
                method: "GET",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ["FileManagerActivityListTag"],
        }),
    }),
});

export const {
    useGetFileActivityLogsQuery,
    useGetFileManagerActivityLogsQuery,
} = fileActivityApi; 