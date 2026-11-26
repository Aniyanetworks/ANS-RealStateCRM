import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { apiUrl } from "../../utils/constant";
import { clearUser } from "../slices/userSlice";
import { demoBaseQuery } from "../../demo/demoBaseQuery";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: apiUrl,
  credentials: "include",
});

const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const result: any = await demoBaseQuery(args as any, api as any, extraOptions as any);
  void rawBaseQuery;

  if (result.error?.status === 401) {
    api.dispatch(clearUser());
    window.location.href = "/login";
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    "getTradeSheetListDataTag",
    "getArchiveTradeSheetListDataTag",
    "getSpacificTradeSheetListDataTag",
    "getFileUploadNameTag",
    "getBrokerageDataTag",
    "getLawyerDataTag",
    "getUserListDataTag",
    "getPropertyListingTag",
    "getAgentListDataTag",
    "getSingleAgentDataTag",
    "getSpacificUserDataTag",
    "getReceiptManageTag",
    "getPlanListDataTag",
    "getSinglePlanDataTag",
    "getPickupReceiptManageTag",
    "getUploadFileCategoriesTag",
    "AnnouncementListTag",
    "SingleAnnouncementTag",
    "ExternalAgentListTag",
    "getOptionalPlanListDataTag",
    "getSingleOptionalPlanDataTag",
    "getClientPropertyListingTag",
    "getClientProfileListingTag",
    "getClientDocumentTag",
    "CalendarEvents",
    "getClientNoteTag",
    "getTradeProductTag",
    "getOrderTag",
    "getCouponTag",
    "getClientPropertyNoteTag",
    "RoleListTag",
    "SingleRoleTag",
    "PermissionListTag",
    "BankAccountListTag",
    "SingleBankAccountTag",
    "GetSupportRequestListTag",
    "GetSupportRequestDetailTag",
    "GetNotificationTag",
    "GetArtWorkListTag",
    "GetArtWorkDetailTag",
    "TradeTransactionListTag",
    "SingleTradeTransactionTag",
    "ChequePostingListTag",
    "GetSupportCommentListTag",
    "AgentOtherDocumentTag",
    "getAgentReportDataTag",
    "getDiscountListDataTag",
    "getSingleDiscountDataTag",
    "getTradeReportDataTag",
    "ExpenseCategoryListTag",
    "SingleExpenseCategoryTag",
    "ExpenseListTag",
    "SingleExpenseTag",
    "TemplateBuilderListTag",
    "SingleTemplateBuilderTag",
    "Leads",
    "Campaigns",
    "getLeadNoteTag",
    "getLawyerFirmDataTag",
    "RealtorProperty",
    "LeadReminders",
    "getTradeSheetNoteTag",
    "getPropertyListingNoteTag",
    "FileActivityListTag",
    "FileManagerNodesTag",
    "FileManagerSharedTag",
    "FileManagerActivityListTag",
    "Condition",
    "getConditionTypeTag",
    "GetKnowledgeBaseListTag",
    "GetKnowledgeBaseDetailTag",
    "getSharedUsersTag",
    "Vendor",
    "Company",
    "getVendorCategoryTag",
    "ValidationLogs",
    "getBranchListDataTag",
    "getSpecificBranchDataTag",
    "LeadActivityLog",
    "getInventoryTag",
    "getInventoryTransactionTag",
    "ClockStatusTag",
    "ClockHistoryTag",
    "ClockScheduleTag",
    "ApiTokenListTag",
    "CalendarNotes",
    "getManualTopAgentTag",
    "BrokerageAccountingTag",
    "DvTimeClockTag",
  ],
  endpoints: (builder) => ({
    updateProduct: builder.mutation({
      query: (data) => ({
        url: "",
        method: "POST",
        body: data,
        headers: {
          authorization: "",
        },
      }),
    }),
  }),
});

export const { useUpdateProductMutation } = api;
export const resetApiState = api.util.resetApiState;
