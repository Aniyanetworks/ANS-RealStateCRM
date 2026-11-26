import { api } from "../apiSlice";

const countryStateCityApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCountries: builder.query({
      query: () => ({
        url: `common/countries`,
        method: "GET",
      }),
    }),
    getStates: builder.query({
      query: (countryId) => ({
        url: `common/states?country_id=${countryId}`,
        method: "GET",
      }),
    }),
    getCities: builder.query({
      query: (stateId) => ({
        url: `common/cities?state_id=${stateId}`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useGetCountriesQuery,
  useGetStatesQuery,
  useGetCitiesQuery,
} = countryStateCityApi;