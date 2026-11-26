// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { getEnvUrls } from "../../../../utils/constant";
import { api } from "../../apiSlice";

const reportManagementApi = api.injectEndpoints({
    endpoints: (builder) => ({
        
        getTradeReportData: builder.query({
            query: () => ({
                url: `/superadmin/trade-reports/list`,
                method: "GET",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ["getTradeReportDataTag"],
        }),
        getBalanceSheetData: builder.query({
            query: () => ({
                url: `/superadmin/balance-sheet-reports/balance-sheet`,
                method: "GET",
                headers: {
                    authorization: `Bearer ${getEnvUrls().accessToken}`,
                },
            }),
            providesTags: ["getTradeReportDataTag"],
        }),
    }),
});

export const {
    useGetTradeReportDataQuery,
    useGetBalanceSheetDataQuery,
} = reportManagementApi;
