import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const dynamicUploadFileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUploadFileCategories: builder.query({
      query: ({ slug, representation }) => ({
        url: `/common/dynamic-upload-file-management/get-upload-file-categories?slug=${slug}&representation=${representation}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      providesTags: ["getUploadFileCategoriesTag"],
    }),
    
    getAdditionalFileCategories: builder.query({
      query: ({ slug, representation }) => ({
        url: `/common/dynamic-upload-file-management/get-additional-file-categories?slug=${slug}&representation=${representation}`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      })
  }),
  }),
});

export const {
    useGetUploadFileCategoriesQuery,
    useGetAdditionalFileCategoriesQuery,
} = dynamicUploadFileApi;
