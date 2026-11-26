/* eslint-disable @typescript-eslint/no-explicit-any */
import { getEnvUrls } from "../../../utils/constant";
import { api } from "../apiSlice";

const realtorPropertyApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getRealtorProperties: builder.query({
      query: () => ({
        url: `/superadmin/realtor-property/list`,
        method: "GET",
        headers: {
          authorization: `Bearer ${getEnvUrls().accessToken}`,
        },
      }),
      transformResponse: (response: any) => {
        if (response?.data && Array.isArray(response.data)) {
          return response;
        }
        return {
          data: response.value || response.data || [],
        };
      },
      providesTags: ["RealtorProperty"],
    }),
  }),
});

export const { useGetRealtorPropertiesQuery } = realtorPropertyApi;

