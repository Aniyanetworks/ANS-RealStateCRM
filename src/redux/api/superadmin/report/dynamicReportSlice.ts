// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { getEnvUrls } from '../../../../utils/constant';
import { api } from '../../apiSlice';

const dynamicReportApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getDynamicTradesheetReport: builder.query({
            query: (params: any) => {
                const queryParams = new URLSearchParams();
                if (params.branchIds) queryParams.append("branchIds", params.branchIds);
                if (params.tradeStatus) queryParams.append("tradeStatus", params.tradeStatus);
                if (params.adminStatus) queryParams.append("adminStatus", params.adminStatus);
                if (params.representation) queryParams.append("representation", params.representation);
                if (params.agentIds) queryParams.append("agentIds", params.agentIds);
                if (params.createdStartDate) queryParams.append("createdStartDate", params.createdStartDate);
                if (params.createdEndDate) queryParams.append("createdEndDate", params.createdEndDate);
                if (params.closingStartDate) queryParams.append("closingStartDate", params.closingStartDate);
                if (params.closingEndDate) queryParams.append("closingEndDate", params.closingEndDate);

                return {
                    url: `/superadmin/dynamic-reports/tradesheet?${queryParams.toString()}`,
                    method: "GET",
                    headers: {
                        authorization: `Bearer ${getEnvUrls().accessToken}`,
                    },
                };
            },
            providesTags: ["DynamicTradesheetReportTag"],
        }),
        getDynamicExpenseReport: builder.query({
            query: (params: any) => {
                const queryParams = new URLSearchParams();
                if (params.branchIds) queryParams.append("branchIds", params.branchIds);
                if (params.expenseStatus) queryParams.append("expenseStatus", params.expenseStatus);
                if (params.recurrenceType) queryParams.append("recurrenceType", params.recurrenceType);
                if (params.isRecurring) queryParams.append("isRecurring", params.isRecurring);
                if (params.startDate) queryParams.append("startDate", params.startDate);
                if (params.endDate) queryParams.append("endDate", params.endDate);

                return {
                    url: `/superadmin/dynamic-reports/expense?${queryParams.toString()}`,
                    method: "GET",
                    headers: {
                        authorization: `Bearer ${getEnvUrls().accessToken}`,
                    },
                };
            },
            providesTags: ["DynamicExpenseReportTag"],
        }),
        getDynamicBranchReport: builder.query({
            query: (params: any) => {
                const queryParams = new URLSearchParams();
                if (params.branchIds) queryParams.append("branchIds", params.branchIds);
                if (params.branchStatus) queryParams.append("branchStatus", params.branchStatus);
                if (params.branchLocation) queryParams.append("branchLocation", params.branchLocation);
                if (params.agentStatus) queryParams.append("agentStatus", params.agentStatus);
                if (params.brokerageName) queryParams.append("brokerageName", params.brokerageName);
                if (params.tradeStatus) queryParams.append("tradeStatus", params.tradeStatus);
                if (params.adminStatus) queryParams.append("adminStatus", params.adminStatus);
                if (params.representation) queryParams.append("representation", params.representation);
                if (params.expenseStatus) queryParams.append("expenseStatus", params.expenseStatus);
                if (params.isRecurring) queryParams.append("isRecurring", params.isRecurring);
                if (params.recurrenceType) queryParams.append("recurrenceType", params.recurrenceType);
                if (params.closingStartDate) queryParams.append("closingStartDate", params.closingStartDate);
                if (params.closingEndDate) queryParams.append("closingEndDate", params.closingEndDate);
                if (params.tradeCreatedStartDate) queryParams.append("tradeCreatedStartDate", params.tradeCreatedStartDate);
                if (params.tradeCreatedEndDate) queryParams.append("tradeCreatedEndDate", params.tradeCreatedEndDate);
                if (params.branchCreatedStartDate) queryParams.append("branchCreatedStartDate", params.branchCreatedStartDate);
                if (params.branchCreatedEndDate) queryParams.append("branchCreatedEndDate", params.branchCreatedEndDate);

                return {
                    url: `/superadmin/dynamic-reports/branch?${queryParams.toString()}`,
                    method: "GET",
                    headers: {
                        authorization: `Bearer ${getEnvUrls().accessToken}`,
                    },
                };
            },
            providesTags: ["DynamicBranchReportTag"],
        }),
        getDynamicAgentReport: builder.query({
            query: (params: any) => {
                const queryParams = new URLSearchParams();
                if (params.branchIds) queryParams.append("branchIds", params.branchIds);
                if (params.brokerageIds) queryParams.append("brokerageIds", params.brokerageIds);
                if (params.accountStatus) queryParams.append("accountStatus", params.accountStatus);
                if (params.tradeStatus) queryParams.append("tradeStatus", params.tradeStatus);
                if (params.adminStatus) queryParams.append("adminStatus", params.adminStatus);
                if (params.agentType) queryParams.append("agentType", params.agentType);
                if (params.createdStartDate) queryParams.append("createdStartDate", params.createdStartDate);
                if (params.createdEndDate) queryParams.append("createdEndDate", params.createdEndDate);

                return {
                    url: `/superadmin/dynamic-reports/agent?${queryParams.toString()}`,
                    method: "GET",
                    headers: {
                        authorization: `Bearer ${getEnvUrls().accessToken}`,
                    },
                };
            },
            providesTags: ["DynamicAgentReportTag"],
        }),
        getDynamicUserReport: builder.query({
            query: (params: any) => {
                const queryParams = new URLSearchParams();
                if (params.branchIds) queryParams.append("branchIds", params.branchIds);
                if (params.roleIds) queryParams.append("roleIds", params.roleIds);
                if (params.status) queryParams.append("status", params.status);
                if (params.isActive !== undefined) queryParams.append("isActive", params.isActive);
                if (params.userType) queryParams.append("userType", params.userType);
                if (params.createdStartDate) queryParams.append("createdStartDate", params.createdStartDate);
                if (params.createdEndDate) queryParams.append("createdEndDate", params.createdEndDate);

                return {
                    url: `/superadmin/dynamic-reports/user?${queryParams.toString()}`,
                    method: "GET",
                    headers: {
                        authorization: `Bearer ${getEnvUrls().accessToken}`,
                    },
                };
            },
            providesTags: ["DynamicUserReportTag"],
        }),
    }),
});

export const {
    useGetDynamicTradesheetReportQuery,
    useGetDynamicExpenseReportQuery,
    useGetDynamicBranchReportQuery,
    useGetDynamicAgentReportQuery,
    useGetDynamicUserReportQuery,
} = dynamicReportApi;
