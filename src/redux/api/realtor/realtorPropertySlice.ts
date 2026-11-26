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
        // Transform the response to match our expected format
        // If backend already returns { data: [...] }, use it directly
        if (response?.data && Array.isArray(response.data)) {
          return response;
        }
        // If backend returns OData format { value: [...] }, transform it
        return {
          data: response.value || response.data || [],
        };
      },
      providesTags: ["RealtorProperty"],
    }),
  }),
});

export const { useGetRealtorPropertiesQuery } = realtorPropertyApi;

