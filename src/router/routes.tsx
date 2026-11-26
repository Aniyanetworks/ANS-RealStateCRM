// @ts-nocheck
import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import App from '../App';
const CalendarList = lazy(() => import('../components/dashboard/Calendar/CalendarList'));
import RootLayout from '../layouts/RootLayout/RootLayout';
const BankAccountLog = lazy(() => import('../pages/accounting/accounting-bank-account/BankAccountLog'));
const BankAccountManagement = lazy(() => import('../pages/accounting/accounting-bank-account/BankAccountManagement'));
const AccountChequePosting = lazy(() => import('../pages/accounting/tradesheet-accounting/AccountChequePosting'));
const AcknowledgementlList = lazy(() => import('../pages/accounting/tradesheet-accounting/AcknowledgementlList'));
const AgentChequeAcknowledgement = lazy(() => import('../pages/accounting/tradesheet-accounting/AgentChequeAcknowledgement'));
const AgentChequeCalculation = lazy(() => import('../pages/accounting/tradesheet-accounting/AgentChequeCalculation'));
const AgentCommissionCheque = lazy(() => import('../pages/accounting/tradesheet-accounting/AgentCommissionCheque'));
const AgentCommissionTransferHistory = lazy(() => import('../pages/accounting/tradesheet-accounting/AgentCommissionTransferHistory'));
const BaseCommissionCheque = lazy(() => import('../pages/accounting/tradesheet-accounting/BaseCommissionCheque'));
const CommissionCheque = lazy(() => import('../pages/accounting/tradesheet-accounting/CommissionCheque'));
const FinalizeTrade = lazy(() => import('../pages/accounting/tradesheet-accounting/FinalizeTrade'));
const IssueAgentCheque = lazy(() => import('../pages/accounting/tradesheet-accounting/IssueAgentCheque'));
const TradeList = lazy(() => import('../pages/accounting/tradesheet-accounting/TradeList'));
const TradesheetInvoicing = lazy(() => import('../pages/accounting/tradesheet-accounting/TradesheetInvoicing'));
const AgentInformationSubmit = lazy(() => import('../pages/agent/AgentInformationSubmit'));
const AgreementPageFive = lazy(() => import('../pages/agent/agreement-page/AgreementPageFive'));
const AgreementPageFour = lazy(() => import('../pages/agent/agreement-page/AgreementPageFour'));
const AgreementPageOne = lazy(() => import('../pages/agent/agreement-page/AgreementPageOne'));
const AgreementPageSevent = lazy(() => import('../pages/agent/agreement-page/AgreementPageSeven'));
const AgreementPageSix = lazy(() => import('../pages/agent/agreement-page/AgreementPageSix'));
const AgreementPageThree = lazy(() => import('../pages/agent/agreement-page/AgreementPageThree'));
const AgreementPageTwo = lazy(() => import('../pages/agent/agreement-page/AgreementPageTwo'));
const AgreementPreview = lazy(() => import('../pages/agent/AgreementPreview'));
const CreatePassword = lazy(() => import('../pages/agent/CreatePassword'));
const ClientDocument = lazy(() => import('../pages/agent/dashboard/manage-clients/ClientDocument'));
const ClientManagement = lazy(() => import('../pages/agent/dashboard/manage-clients/ClientManagement'));
const ClientNote = lazy(() => import('../pages/agent/dashboard/manage-clients/ClientNote'));
const ClientProfile = lazy(() => import('../pages/agent/dashboard/manage-clients/ClientProfile'));
const ClientProperty = lazy(() => import('../pages/agent/dashboard/manage-clients/ClientProperty'));
const ClientPropertyNote = lazy(() => import('../pages/agent/dashboard/manage-clients/ClientPropertyNote'));
const CreateAndUpdateClient = lazy(() => import('../pages/agent/dashboard/manage-clients/CreateAndUpdateClient'));
const MySubmissionsArchiveTradeList = lazy(() => import('../pages/agent/dashboard/pages/form/trade-sheet/MySubmissionsArchiveTradeList'));
const MySubmissionsTradeList = lazy(() => import('../pages/agent/dashboard/pages/form/trade-sheet/MySubmissionsTradeList'));
const TradeSheetAdditionalDocumentUpload = lazy(() => import('../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetAdditionalDocumentUpload'));
const TradeSheetAgentBasicInfo = lazy(() => import('../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetAgentBasicInfo'));
const TradeSheetAgentDetails = lazy(() => import('../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetAgentDetails'));
const TradeSheetBuyerInformation = lazy(() => import('../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetBuyerInformation'));
const TradeSheetLawyerDetails = lazy(() => import('../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetLawyerDetails'));
const TradeSheetPaperworkAttachmentUpload = lazy(() => import('../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetPaperworkAttachmentUpload'));
const TradeSheetPaperworkAttachmentUploadMultipleRepresentation = lazy(() => import('../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetPaperworkAttachmentUploadMultipleRepresentation'));
const TradeSheetPaperworkFileManager = lazy(() => import('../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetPaperworkFileManager'));
const TradeSheetPaperworkFileManagerMultipleRepresentation = lazy(() => import('../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetPaperworkFileManagerMultipleRepresentation'));
const TradeSheetPreviewPage = lazy(() => import('../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetPreviewPage'));
const TradeSheetPreviewPageWithoutStep = lazy(() => import('../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetPreviewPageWithoutStep'));
const TradeSheetPropertyDetails = lazy(() => import('../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetPropertyDetails'));
const TradeSheetPropertyDetailsMultipleRepresentation = lazy(() => import('../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetPropertyDetailsMultipleRepresentation'));
const TradeSheetPropertyDetailsSeller = lazy(() => import('../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetPropertyDetailsSeller'));
const TradeSheetSellerInformation = lazy(() => import('../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetSellerInformation'));
const EventJoin = lazy(() => import('../pages/event/EventJoin'));
const EventJoinSuccess = lazy(() => import('../pages/event/EventJoinSuccess'));
const EexpenceList = lazy(() => import('../pages/expences/Eexpence'));
const EexpenceCategory = lazy(() => import('../pages/expences/EexpenceCategory'));
const FileManager = lazy(() => import('../pages/file-manager/FileManager'));
const ClockInOut = lazy(() => import('../pages/common/ClockInOut'));
const BrokerageAccounting = lazy(() => import('../pages/brokerage-accounting/BrokerageAccounting'));
const MyAccounting = lazy(() => import('../pages/brokerage-accounting/MyAccounting'));
const DvTimeClock = lazy(() => import('../pages/dv-time-clock/DvTimeClock'));
const TradeTransactions = lazy(() => import('../pages/trade-transactions/TradeTransactions'));
const Home = lazy(() => import('../pages/home/Home'));
const ChangePassword = lazy(() => import('../pages/login/ChangePassword'));
const ForgotPassword = lazy(() => import('../pages/login/ForgotPassword'));
import Login from '../pages/login/Login';
const FreeholdLease = lazy(() => import('../pages/MLSForm/FreeholdLease'));
const FreeholdSale = lazy(() => import('../pages/MLSForm/FreeholdSale'));
const PdfExtrack = lazy(() => import('../pages/MLSForm/PdfExtrack'));
const Profile = lazy(() => import('../pages/profile/Profile'));
const AgentReport = lazy(() => import('../pages/reports/AgentReport/AgentReport'));
const AgentReportDetails = lazy(() => import('../pages/reports/AgentReport/AgentReportDetails'));
const BalanceSheet = lazy(() => import('../pages/reports/BalanceSheet'));
const DynamicReport = lazy(() => import('../pages/reports/DynamicReport/DynamicReport'));
const HstDetails = lazy(() => import('../pages/reports/HstDetails'));
const HstSummery = lazy(() => import('../pages/reports/HstSummery'));
const ReportSummery = lazy(() => import('../pages/reports/ReportSummery'));
const TopReport = lazy(() => import('../pages/reports/TopReport/TopReport'));
const TradeReport = lazy(() => import('../pages/reports/TradeReport/TradeReport'));
const SharedDocument = lazy(() => import('../pages/share-documents/SharedDocument'));
const ShareTradeSheetDocument = lazy(() => import('../pages/share-documents/ShareTradeSheetDocument'));
const Signup = lazy(() => import('../pages/signup/Signup'));
const BorrowOrderHistory = lazy(() => import('../pages/super-admin/dashboard/invoice-management/BorrowOrderHistory'));
const BorrowProductList = lazy(() => import('../pages/super-admin/dashboard/invoice-management/BorrowProductList'));
const BorrowProducts = lazy(() => import('../pages/super-admin/dashboard/invoice-management/BorrowProducts'));
const DiscountCoupon = lazy(() => import('../pages/super-admin/dashboard/invoice-management/DiscountCoupon'));
const InvoiceProduct = lazy(() => import('../pages/super-admin/dashboard/invoice-management/InvoiceProduct'));
const InventoryList = lazy(() => import('../pages/super-admin/dashboard/invoice-management/InventoryList'));
const InventoryTransactions = lazy(() => import('../pages/super-admin/dashboard/invoice-management/InventoryTransactions'));
const OrderHistory = lazy(() => import('../pages/super-admin/dashboard/invoice-management/OrderHistory'));
const AgentFileUpload = lazy(() => import('../pages/super-admin/dashboard/pages/agent-management/AgentFileUpload'));
const AgentManagement = lazy(() => import('../pages/super-admin/dashboard/pages/agent-management/AgentManagement'));
const AgentPlan = lazy(() => import('../pages/super-admin/dashboard/pages/agent-management/AgentPlan'));
const CreateNewAgent = lazy(() => import('../pages/super-admin/dashboard/pages/agent-management/CreateNewAgent'));
const EditAgent = lazy(() => import('../pages/super-admin/dashboard/pages/agent-management/EditAgent'));
const ExternalAgentManagement = lazy(() => import('../pages/super-admin/dashboard/pages/agent-management/ExternalAgentManagement'));
const AnnouncementManagement = lazy(() => import('../pages/super-admin/dashboard/pages/announcement/AnnouncementManagement'));
const BranchList = lazy(() => import('../pages/super-admin/dashboard/pages/branch management/BranchList'));
const CreateAndUpdateBranch = lazy(() => import('../pages/super-admin/dashboard/pages/branch management/CreateAndUpdateBranch'));
const BrokerageManagement = lazy(() => import('../pages/super-admin/dashboard/pages/brokerage/BrokerageManagement'));
const Attendees = lazy(() => import('../pages/super-admin/dashboard/pages/calendar/Attendees'));
const CalendarEventManagement = lazy(() => import('../pages/super-admin/dashboard/pages/calendar/CalendarEventManagement'));
const CalendarNoteManagement = lazy(() => import('../pages/super-admin/dashboard/pages/calendar/CalendarNoteManagement'));
const ConditionManagement = lazy(() => import('../pages/super-admin/dashboard/pages/conditions/ConditionManagement'));
const FileActivity = lazy(() => import('../pages/super-admin/dashboard/pages/file-activity/FileActivity'));
const FileManagerActivity = lazy(() => import('../pages/super-admin/dashboard/pages/file-activity/FileManagerActivity'));
const SystemLog = lazy(() => import('../pages/super-admin/dashboard/pages/system-log/SystemLog'));
const KnowledgeBaseAgentView = lazy(() => import('../pages/super-admin/dashboard/pages/knowledge-base/KnowledgeBaseAgentView'));
const KnowledgeBaseList = lazy(() => import('../pages/super-admin/dashboard/pages/knowledge-base/KnowledgeBaseList'));
const LawyerFirmManagement = lazy(() => import('../pages/super-admin/dashboard/pages/lawyers/LawyerFirmManagement'));
const LawyersDataManagement = lazy(() => import('../pages/super-admin/dashboard/pages/lawyers/LawyerManagement'));
const LeadsManagementPage = lazy(() => import('../pages/super-admin/dashboard/pages/leads/AllLeads'));
const CampaignManagement = lazy(() => import('../pages/super-admin/dashboard/pages/leads/CampaignManagement'));
const LeadsListByAgent = lazy(() => import('../pages/super-admin/dashboard/pages/leads/LeadsListByAgent'));
const LeadsList = lazy(() => import('../pages/super-admin/dashboard/pages/leads/LeadsListByAgentCopy'));
const ValidationLogsList = lazy(() => import('../pages/super-admin/dashboard/pages/leads/ValidationLogsList'));
const FileUploadNames = lazy(() => import('../pages/super-admin/dashboard/pages/paperworks-document-names/PaperworksDocumentNames'));
const PickupReceiptManagement = lazy(() => import('../pages/super-admin/dashboard/pages/pickup-receipt/PickupReceiptManagement'));
const CreateCustomDiscount = lazy(() => import('../pages/super-admin/dashboard/pages/plan-management/CreateCustomDiscount'));
const CreateCustomPlan = lazy(() => import('../pages/super-admin/dashboard/pages/plan-management/CreateCustomPlan'));
const CreatePlan = lazy(() => import('../pages/super-admin/dashboard/pages/plan-management/CreatePlan'));
const DiscountManagement = lazy(() => import('../pages/super-admin/dashboard/pages/plan-management/DiscountManagement'));
const EditDiscount = lazy(() => import('../pages/super-admin/dashboard/pages/plan-management/EditDiscount'));
const EditPlan = lazy(() => import('../pages/super-admin/dashboard/pages/plan-management/EditPlan'));
const PlanManagement = lazy(() => import('../pages/super-admin/dashboard/pages/plan-management/PlanManagement'));
const CreateUpdatePropertyListing = lazy(() => import('../pages/super-admin/dashboard/pages/property-listing/CreateUpdatePropertyListing'));
const CreateUpdatePropertyMereListing = lazy(() => import('../pages/super-admin/dashboard/pages/property-listing/CreateUpdatePropertyMereListing'));
const PropertyListingManagement = lazy(() => import('../pages/super-admin/dashboard/pages/property-listing/PropertyListingManagement'));
const PropertyListingPaperworkAttachmentUpload = lazy(() => import('../pages/super-admin/dashboard/pages/property-listing/PropertyListingPaperworkAttachmentUpload'));
const PropertyListingPaperworkFileManager = lazy(() => import('../pages/super-admin/dashboard/pages/property-listing/PropertyListingPaperworkFileManager'));
const PropertyMereListingManagement = lazy(() => import('../pages/super-admin/dashboard/pages/property-listing/PropertyMereListingManagement'));
const RealtorPropertyListingManagement = lazy(() => import('../pages/super-admin/dashboard/pages/property-listing/RealtorPropertyListingManagement'));
const ViewPropertyListing = lazy(() => import('../pages/super-admin/dashboard/pages/property-listing/ViewPropertyListing'));
const ReceiptManagement = lazy(() => import('../pages/super-admin/dashboard/pages/receipt/ReceiptManagement'));
const PermissionManagement = lazy(() => import('../pages/super-admin/dashboard/pages/role-permission/PermissionManagement'));
const RoleManagement = lazy(() => import('../pages/super-admin/dashboard/pages/role-permission/RoleManagement'));
const ArtWorkRequest = lazy(() => import('../pages/super-admin/dashboard/pages/support/ArtWorkRequest'));
const ArtWorks = lazy(() => import('../pages/super-admin/dashboard/pages/support/ArtWorks'));
const SupportRequestDetail = lazy(() => import('../pages/super-admin/dashboard/pages/support/SupportRequestDetail'));
const SupportRequestList = lazy(() => import('../pages/super-admin/dashboard/pages/support/SupportRequestList'));
const TradeSheetShareDocumentTemplate = lazy(() => import('../pages/super-admin/dashboard/pages/template-builder/TradeSheetShareDocumentTemplate'));
const CreateAndUpdateUser = lazy(() => import('../pages/super-admin/dashboard/pages/user-management/CreateAndUpdateUser'));
const ResetPassword = lazy(() => import('../pages/super-admin/dashboard/pages/user-management/ResetPassword'));
const UserManagement = lazy(() => import('../pages/super-admin/dashboard/pages/user-management/UserManagement'));
const VendorCategoryManagement = lazy(() => import('../pages/super-admin/dashboard/pages/vendor-category/VendorCategoryManagement'));
const CompanyManagement = lazy(() => import('../pages/super-admin/dashboard/pages/vendor-list/CompanyManagement'));
const VendorManagement = lazy(() => import('../pages/super-admin/dashboard/pages/vendor-list/VendorManagement'));
import PermissonRoute from './PermissonRoute';
import PrivateRoute from './PrivateRoute';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "",
        element: (
          <PrivateRoute>
            <RootLayout />
          </PrivateRoute>
        ),
        children: [
          {
            path: "",
            element: <Home />,
          },

          {
            path: "dashboard/agent/pages/form",
            children: [
              {
                path: "trade-sheet",
                children: [
                  {
                    path: "my-submission-trade-list/:filter?",
                    element: (
                      <PermissonRoute
                        permission={["view-tradesheet"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <MySubmissionsTradeList />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "my-submission-archive-trade-list",
                    element: (
                      <PermissonRoute
                        permission={["view-tradesheet"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <MySubmissionsArchiveTradeList />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "agent-basic-info/:uuid?",
                    element: (
                      <PermissonRoute
                        permission={["create-tradesheet", "edit-tradesheet"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <TradeSheetAgentBasicInfo />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "property-details/:uuid",
                    element: (
                      <PermissonRoute
                        permission={["create-tradesheet", "edit-tradesheet"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <TradeSheetPropertyDetails />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "property-details-seller/:uuid",
                    element: (
                      <PermissonRoute
                        permission={["create-tradesheet", "edit-tradesheet"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <TradeSheetPropertyDetailsSeller />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "property-details-multiple-representation/:uuid",
                    element: (
                      <PermissonRoute
                        permission={["create-tradesheet", "edit-tradesheet"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <TradeSheetPropertyDetailsMultipleRepresentation />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "seller-information/:uuid",
                    element: (
                      <PermissonRoute
                        permission={["create-tradesheet", "edit-tradesheet"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <TradeSheetSellerInformation />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "buyer-information/:uuid",
                    element: (
                      <PermissonRoute
                        permission={["create-tradesheet", "edit-tradesheet"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <TradeSheetBuyerInformation />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "agent-details/:uuid",
                    element: (
                      <PermissonRoute
                        permission={["create-tradesheet", "edit-tradesheet"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <TradeSheetAgentDetails />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "lawyer-details/:uuid",
                    element: (
                      <PermissonRoute
                        permission={["create-tradesheet", "edit-tradesheet"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <TradeSheetLawyerDetails />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "paperwork-attachment-upload/:uuid",
                    element: (
                      <PermissonRoute
                        permission={["create-tradesheet", "edit-tradesheet"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <TradeSheetPaperworkAttachmentUpload />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "paperwork-attachment-upload-multiple-representation/:uuid",
                    element: (
                      <PermissonRoute
                        permission={["create-tradesheet", "edit-tradesheet"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <TradeSheetPaperworkAttachmentUploadMultipleRepresentation />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "preview-page/:uuid",
                    element: (
                      <PermissonRoute
                        permission={["create-tradesheet", "edit-tradesheet"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <TradeSheetPreviewPage />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "paperwork-file-manager/:uuid",
                    element: (
                      <PermissonRoute
                        permission={["view-tradesheet"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <TradeSheetPaperworkFileManager />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "paperwork-file-manager-multiple-representation/:uuid",
                    element: (
                      <PermissonRoute
                        permission={["view-tradesheet"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <TradeSheetPaperworkFileManagerMultipleRepresentation />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "separate-preview-page/:uuid",
                    element: (
                      <PermissonRoute
                        permission={["view-tradesheet"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <TradeSheetPreviewPageWithoutStep />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "additional-document/:uuid",
                    element: (
                      <PermissonRoute
                        permission={["view-tradesheet"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <TradeSheetAdditionalDocumentUpload />
                      </PermissonRoute>
                    ),
                  },
                ],
              },
            ],
          },

          {
            path: "dashboard",
            children: [
              {
                path: "clients",
                children: [
                  {
                    path: "client-list/:filter?",
                    element: (
                      <PermissonRoute
                        permission={[]}
                        userTypePermission={["superAdmin", "agent", "admin"]}
                      >
                        <ClientManagement />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "property-list/:uuid/:client?",
                    element: (
                      <PermissonRoute
                        permission={[]}
                        userTypePermission={["superAdmin", "agent", "client"]}
                      >
                        <ClientProperty />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "profile-list/:uuid/:client?",
                    element: <ClientProfile />,
                  },
                  {
                    path: "document-list/:uuid/:client?",
                    element: <ClientDocument />,
                  },
                  {
                    path: "create-update-client/:uuid?",
                    element: <CreateAndUpdateClient />,
                  },
                  {
                    path: "note-list/:uuid/:client?",
                    element: <ClientNote />,
                  },
                  {
                    path: "note-list/:uuid/:property/:mls?/:client?",
                    element: <ClientPropertyNote />,
                  },
                ],
              },
            ],
          },

          {
            path: "dashboard",
            children: [
              {
                path: "file-manager",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["superAdmin", "agent"]}
                  >
                    <FileManager />
                  </PermissonRoute>
                ),
              },
              {
                path: "clock-in-out",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["superAdmin", "agent", "admin", "accountant", "support"]}
                  >
                    <ClockInOut />
                  </PermissonRoute>
                ),
              },
              {
                path: "dv-time-clock",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["superAdmin", "admin", "accountant", "agent", "support", "itSupport", "graphicDesigner", "other"]}
                  >
                    <DvTimeClock />
                  </PermissonRoute>
                ),
              },
              {
                path: "trade-transactions",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["superAdmin", "accountant", "admin"]}
                  >
                    <TradeTransactions />
                  </PermissonRoute>
                ),
              },
              {
                path: "brokerage-accounting/:section?",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["superAdmin", "accountant"]}
                  >
                    <BrokerageAccounting />
                  </PermissonRoute>
                ),
              },
              {
                path: "my-accounting",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["agent", "superAdmin", "client"]}
                  >
                    <MyAccounting />
                  </PermissonRoute>
                ),
              },
              {
                path: "marketplace",
                children: [
                  {
                    path: "order-history/:filter?",
                    element: (
                      <PermissonRoute
                        permission={["view-agent-marketplace"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <OrderHistory />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "borrow-order-history/:filter?",
                    element: (
                      <PermissonRoute
                        permission={["view-agent-marketplace"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <BorrowOrderHistory />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "purchase-product-list",
                    element: (
                      <PermissonRoute
                        permission={["view-agent-marketplace"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <InvoiceProduct />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "borrow-product-list",
                    element: (
                      <PermissonRoute
                        permission={["view-agent-marketplace"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <BorrowProductList />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "borrow-history/:filter?",
                    element: (
                      <PermissonRoute
                        permission={["view-agent-marketplace"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <BorrowProducts />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "discounts",
                    element: (
                      <PermissonRoute
                        permission={["view-agent-marketplace"]}
                        userTypePermission={["superAdmin", "agent"]}
                      >
                        <DiscountCoupon />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "inventory",
                    element: (
                      <PermissonRoute
                        permission={["view-agent-marketplace"]}
                        userTypePermission={["superAdmin", "admin"]}
                      >
                        <InventoryList />
                      </PermissonRoute>
                    ),
                  },
                  {
                    path: "inventory/transactions",
                    element: (
                      <PermissonRoute
                        permission={["view-agent-marketplace"]}
                        userTypePermission={["superAdmin", "admin"]}
                      >
                        <InventoryTransactions />
                      </PermissonRoute>
                    ),
                  },
                ],
              },
            ],
          },

          {
            path: "dashboard/super-admin",
            children: [
              {
                path: "paperworks-document-names",
                element: (
                  <PermissonRoute
                    permission={["view-paperwork-documents"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <FileUploadNames />
                  </PermissonRoute>
                ),
              },

              {
                path: "property-listing/:filter?",
                element: (
                  <PermissonRoute
                    permission={["view-property-listing"]}
                    userTypePermission={["superAdmin", "agent"]}
                  >
                    <PropertyListingManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "property-mere-listing/:filter?",
                element: (
                  <PermissonRoute
                    permission={["view-property-listing"]}
                    userTypePermission={["superAdmin", "agent"]}
                  >
                    <PropertyMereListingManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "realtor-property-listing/:filter?",
                element: (
                  <PermissonRoute
                    permission={["view-property-listing"]}
                    userTypePermission={["superAdmin", "agent"]}
                  >
                    <RealtorPropertyListingManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "create-update-property-listing/:uuid?",
                element: (
                  <PermissonRoute
                    permission={[
                      "create-property-listing",
                      "edit-property-listing",
                    ]}
                    userTypePermission={["superAdmin", "agent"]}
                  >
                    <CreateUpdatePropertyListing />
                  </PermissonRoute>
                ),
              },
              {
                path: "create-update-property-mere-listing/:uuid?",
                element: (
                  <PermissonRoute
                    permission={[
                      "create-property-listing",
                      "edit-property-listing",
                    ]}
                    userTypePermission={["superAdmin", "agent"]}
                  >
                    <CreateUpdatePropertyMereListing />
                  </PermissonRoute>
                ),
              },
              {
                path: "property-listing/paperwork-attachment-upload/:uuid?",
                element: (
                  <PermissonRoute
                    permission={[
                      "create-property-listing",
                      "edit-property-listing",
                    ]}
                    userTypePermission={["superAdmin", "agent"]}
                  >
                    <PropertyListingPaperworkAttachmentUpload />
                  </PermissonRoute>
                ),
              },
              {
                path: "view-property-listing/:uuid?",
                element: (
                  <PermissonRoute
                    permission={["view-property-listing"]}
                    userTypePermission={["superAdmin", "agent"]}
                  >
                    <ViewPropertyListing />
                  </PermissonRoute>
                ),
              },
              {
                path: "property-listing/paperwork-file-manager/:uuid",
                element: (
                  <PermissonRoute
                    permission={["view-property-listing"]}
                    userTypePermission={["superAdmin", "agent"]}
                  >
                    <PropertyListingPaperworkFileManager />
                  </PermissonRoute>
                ),
              },

              {
                path: "brokerage-managements",
                element: (
                  <PermissonRoute
                    permission={["view-brokerage"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <BrokerageManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "lawyer-firm-managements",
                element: (
                  <PermissonRoute
                    permission={["view-lawyers"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <LawyerFirmManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "lawyer-managements",
                element: (
                  <PermissonRoute
                    permission={["view-lawyers"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <LawyersDataManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "receipt-managements",
                element: (
                  <PermissonRoute
                    permission={["view-deposit-receipt"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <ReceiptManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "pickup-receipt-managements",
                element: (
                  <PermissonRoute
                    permission={["view-cheque-pickup-receipt"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <PickupReceiptManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "user-management",
                element: (
                  <PermissonRoute
                    permission={["view-user"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <UserManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "user-management/crate-and-update-user/:uuid?",
                element: (
                  <PermissonRoute
                    permission={["create-user", "edit-user"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <CreateAndUpdateUser />
                  </PermissonRoute>
                ),
              },
              {
                path: "announcements",
                element: (
                  <PermissonRoute
                    permission={["view-announcements"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <AnnouncementManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "conditions",
                element: (
                  <PermissonRoute
                    permission={["view-announcements"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <ConditionManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "vendor-categories",
                element: (
                  <PermissonRoute
                    permission={["view-announcements"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <VendorCategoryManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "vendors",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["superAdmin", "agent"]}
                  >
                    <VendorManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "companies",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["superAdmin", "agent"]}
                  >
                    <CompanyManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "file-activity",
                element: (
                  <PermissonRoute
                    permission={["view-announcements"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <FileActivity />
                  </PermissonRoute>
                ),
              },
              {
                path: "file-manager-activity",
                element: (
                  <PermissonRoute
                    permission={["view-announcements"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <FileManagerActivity />
                  </PermissonRoute>
                ),
              },
              {
                path: "system-logs",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["superAdmin"]}
                  >
                    <SystemLog />
                  </PermissonRoute>
                ),
              },
              {
                path: "template-builder/share-tradeSheet-document",
                element: (
                  <PermissonRoute
                    permission={["view-announcements"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <TradeSheetShareDocumentTemplate />
                  </PermissonRoute>
                ),
              },
              {
                path: "calendar-events",
                element: (
                  <PermissonRoute
                    permission={["view-calendar-events"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <CalendarEventManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "calendar-events/attendees/:uuid",
                element: (
                  <PermissonRoute
                    permission={["view-calendar-events"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <Attendees />
                  </PermissonRoute>
                ),
              },
              {
                path: "calendar-notes",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["superAdmin"]}
                  >
                    <CalendarNoteManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "calendar-list",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["agent"]}
                  >
                    <CalendarList />
                  </PermissonRoute>
                ),
              },
              {
                path: "share-trade-sheet-document/:uuid",
                element: (
                  <PermissonRoute
                    permission={["view-tradesheet"]}
                    userTypePermission={["superAdmin", "agent"]}
                  >
                    <ShareTradeSheetDocument />
                  </PermissonRoute>
                ),
              },
              {
                path: "leads",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["superAdmin"]}
                  >
                    <CampaignManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "leads/view/:campaignUuid",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["superAdmin"]}
                  >
                    <LeadsList />
                  </PermissonRoute>
                ),
              },
              {
                path: "leads/all",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["superAdmin"]}
                  >
                    <LeadsManagementPage />
                  </PermissonRoute>
                ),
              },
              {
                path: "leads/validation-logs",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["superAdmin"]}
                  >
                    <ValidationLogsList />
                  </PermissonRoute>
                ),
              },

              {
                path: "branch-management/branches",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["superAdmin", "admin"]}
                  >
                    <BranchList />
                  </PermissonRoute>
                ),
              },
              {
                path: "branch-management/branch",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["superAdmin"]}
                  >
                    <CreateAndUpdateBranch />
                  </PermissonRoute>
                ),
              },
              {
                path: "branch-management/branch/:uuid",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["superAdmin"]}
                  >
                    <CreateAndUpdateBranch />
                  </PermissonRoute>
                ),
              },


              {
                path: "freehold-sale",
                element: <FreeholdSale />,
              },
              {
                path: "freehold-lease",
                element: <FreeholdLease />,
              },
              {
                path: "pdf-extract",
                element: <PdfExtrack />,
              },

              {
                path: "agent-management/:filter?",
                element: (
                  <PermissonRoute
                    permission={["view-agent"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <AgentManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "agent-create/:uuid?",
                element: (
                  <PermissonRoute
                    permission={["create-agent", "edit-agent"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <CreateNewAgent />
                  </PermissonRoute>
                ),
              },
              {
                path: "agent-plan/:uuid",
                element: (
                  <PermissonRoute
                    permission={["create-agent", "edit-agent"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <AgentPlan />
                  </PermissonRoute>
                ),
              },
              {
                path: "agent-edit/:uuid",
                element: (
                  <PermissonRoute
                    permission={["create-agent", "edit-agent"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <EditAgent />
                  </PermissonRoute>
                ),
              },
              {
                path: "agent-file-upload/:uuid",
                element: (
                  <PermissonRoute
                    permission={["create-agent", "edit-agent"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <AgentFileUpload />
                  </PermissonRoute>
                ),
              },
              {
                path: "agreement-preview/:uuid",
                element: (
                  <PermissonRoute
                    permission={["view-agent"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <AgreementPreview />
                  </PermissonRoute>
                ),
              },
              {
                path: "external-agent-management",
                element: (
                  <PermissonRoute
                    permission={["view-agent"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <ExternalAgentManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "plan-management",
                element: (
                  <PermissonRoute
                    permission={["view-plans"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <PlanManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "plan-management/create",
                element: (
                  <PermissonRoute
                    permission={["create-plans", "edit-plans"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <CreatePlan />
                  </PermissonRoute>
                ),
              },
              {
                path: "plan-management/create-custom",
                element: (
                  <PermissonRoute
                    permission={["create-plans", "edit-plans"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <CreateCustomPlan />
                  </PermissonRoute>
                ),
              },
              {
                path: "plan-management/edit/:uuid",
                element: (
                  <PermissonRoute
                    permission={["create-plans", "edit-plans"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <EditPlan />
                  </PermissonRoute>
                ),
              },
              {
                path: "discount-management",
                element: (
                  <PermissonRoute
                    permission={["view-plans"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <DiscountManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "discount-management/create-custom",
                element: (
                  <PermissonRoute
                    permission={["create-plans", "edit-plans"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <CreateCustomDiscount />
                  </PermissonRoute>
                ),
              },
              {
                path: "discount-management/edit/:uuid",
                element: (
                  <PermissonRoute
                    permission={["create-plans", "edit-plans"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <EditDiscount />
                  </PermissonRoute>
                ),
              },

              {
                path: "role-permission/role-management",
                element: (
                  <PermissonRoute
                    permission={["view-role-permission"]}
                    userTypePermission={["superAdmin"]}
                  >
                    <RoleManagement />
                  </PermissonRoute>
                ),
              },
              {
                path: "role-permission/permission-management/:uuid?",
                element: (
                  <PermissonRoute
                    permission={[
                      "create-role-permission",
                      "edit-role-permission",
                    ]}
                    userTypePermission={["superAdmin"]}
                  >
                    <PermissionManagement />
                  </PermissonRoute>
                ),
              },
            ],
          },

          {
            path: "agent",
            children: [
              {
                path: "agent-agreeement-page-one",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["agent"]}
                  >
                    <AgreementPageOne />
                  </PermissonRoute>
                ),
              },
              {
                path: "agent-agreeement-page-two",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["agent"]}
                  >
                    <AgreementPageTwo />
                  </PermissonRoute>
                ),
              },
              {
                path: "agent-agreeement-page-three",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["agent"]}
                  >
                    <AgreementPageThree />
                  </PermissonRoute>
                ),
              },
              {
                path: "agent-agreeement-page-four",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["agent"]}
                  >
                    <AgreementPageFour />
                  </PermissonRoute>
                ),
              },
              {
                path: "agent-agreeement-page-five",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["agent"]}
                  >
                    <AgreementPageFive />
                  </PermissonRoute>
                ),
              },
              {
                path: "agent-agreeement-page-six",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["agent"]}
                  >
                    <AgreementPageSix />
                  </PermissonRoute>
                ),
              },
              {
                path: "agent-agreeement-page-seven",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["agent"]}
                  >
                    <AgreementPageSevent />
                  </PermissonRoute>
                ),
              },
            ],
          },
          {
            path: "/dashboard/agent/agreement-preview/:uuid",
            element: (
              <PermissonRoute permission={[]} userTypePermission={["agent"]}>
                <AgreementPreview />
              </PermissonRoute>
            ),
          },
          {
            path: "/dashboard/agent/my-leads",
            element: (
              <PermissonRoute permission={[]} userTypePermission={["agent"]}>
                <LeadsListByAgent />
              </PermissonRoute>
            ),
          },

          {
            path: "/agent-information-submit",
            element: (
              <PermissonRoute
                permission={[]}
                userTypePermission={["superAdmin", "agent"]}
              >
                <AgentInformationSubmit />
              </PermissonRoute>
            ),
          },
          {
            path: "/dashboard/knowledge-base",
            element: (
              <PermissonRoute
                permission={[]}
                userTypePermission={["superAdmin"]}
              >
                <KnowledgeBaseList />
              </PermissonRoute>
            ),
          },
          {
            path: "/dashboard/knowledge-base-view",
            element: (
              <PermissonRoute
                permission={[]}
                userTypePermission={["superAdmin", "agent"]}
              >
                <KnowledgeBaseAgentView />
              </PermissonRoute>
            ),
          },


          {
            path: "dashboard/support",
            children: [
              {
                path: "requests/:id?/:filter?",
                element: (
                  <PermissonRoute
                    permission={["support-request-view"]}
                    userTypePermission={["superAdmin", "agent"]}
                  >
                    <SupportRequestList />
                  </PermissonRoute>
                ),
              },
              {
                path: "art-work",
                element: (
                  <PermissonRoute
                    permission={["artwork-items-view"]}
                    userTypePermission={["superAdmin", "agent"]}
                  >
                    <ArtWorks />
                  </PermissonRoute>
                ),
              },
              {
                path: "art-work/request/:id?/:filter?",
                element: (
                  <PermissonRoute
                    permission={["support-request-view"]}
                    userTypePermission={["superAdmin", "agent"]}
                  >
                    <ArtWorkRequest />
                  </PermissonRoute>
                ),
              },
            ],
          },
          {
            path: "requests/:id",
            element: (
              <PermissonRoute
                permission={["support-request-view"]}
                userTypePermission={["superAdmin", "agent"]}
              >
                <SupportRequestDetail />
              </PermissonRoute>
            ),
          },

          {
            path: "dashboard",
            children: [
              {
                path: "accounting",
                children: [
                  {
                    path: "bank-account-management",
                    element: <BankAccountManagement />,
                  },
                  {
                    path: "bank-account-log/:uuid?",
                    element: <BankAccountLog />,
                  },
                  {
                    path: "trade-list",
                    element: <TradeList />,
                  },
                  {
                    path: "trade-sheet-finalize/:uuid?",
                    element: <FinalizeTrade />,
                  },
                  {
                    path: "account-cheque-posting/:uuid?",
                    element: <AccountChequePosting />,
                  },
                  {
                    path: "issue-agent-cheque",
                    element: <IssueAgentCheque />,
                  },
                  {
                    path: "agent-cheque-calculation/:uuid?/:agentAccountId?",
                    element: <AgentChequeCalculation />,
                  },
                  {
                    path: "agent-cheque-acknowledgement/:uuid?/:agentAccountId?",
                    element: <AgentChequeAcknowledgement />,
                  },
                  {
                    path: "acknowledgement-list",
                    element: <AcknowledgementlList />,
                  },
                  {
                    path: "agent-commission-transfer-history",
                    element: <AgentCommissionTransferHistory />,
                  },
                  {
                    path: "commission-cheque",
                    element: <CommissionCheque />,
                  },
                  {
                    path: "base-commission-cheque",
                    element: <BaseCommissionCheque />,
                  },
                  {
                    path: "agent-commission-cheque",
                    element: <AgentCommissionCheque />,
                  },
                  {
                    path: "tradesheet-invoicing",
                    element: <TradesheetInvoicing />,
                  },
                ],
              },
            ],
          },

          {
            path: "dashboard",
            children: [
              {
                path: "expences",
                children: [
                  {
                    path: "expence-category",
                    element: <EexpenceCategory />,
                  },
                  {
                    path: "expence-list",
                    element: <EexpenceList />,
                  },
                ],
              },
            ],
          },
          {
            path: "dashboard",
            children: [
              {
                path: "reports",
                children: [
                  {
                    path: "report-summery",
                    element: <ReportSummery />,
                  },
                  {
                    path: "top-report",
                    element: <TopReport />,
                  },
                  {
                    path: "agent-report",
                    element: <AgentReport />,
                  },
                  {
                    path: "trade-report",
                    element: <TradeReport />,
                  },
                  {
                    path: "hst-summery-report",
                    element: <HstSummery />,
                  },
                  {
                    path: "hst-details-report",
                    element: <HstDetails />,
                  },
                  {
                    path: "balance-sheet-report",
                    element: <BalanceSheet />,
                  },
                  {
                    path: "agent-report-details/:agentId?",
                    element: <AgentReportDetails />,
                  },
                  {
                    path: "dynamic-report",
                    element: <DynamicReport />,
                  },
                ],
              },
            ],
          },

          {
            path: "/profile",
            element: (
              <PermissonRoute
                permission={["view-my-profile"]}
                userTypePermission={[
                  "superAdmin",
                  "agent",
                  "client",
                  "support",
                  "other",
                ]}
              >
                <Profile />
              </PermissonRoute>
            ),
          },
          {
            path: "/super-admin/reset-password/:email",
            element: (
              <PermissonRoute
                permission={[]}
                userTypePermission={["superAdmin"]}
              >
                <ResetPassword />
              </PermissonRoute>
            ),
          },
        ],
      },

      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/event-join/:uuid",
        element: <EventJoin />,
      },
      {
        path: "/event-join-success",
        element: <EventJoinSuccess />,
      },
      {
        path: "shared-document/:uuid",
        element: <SharedDocument />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "/reset-password",
        element: <ChangePassword />,
      },
      {
        path: "/agent/create-password",
        element: <CreatePassword />,
      },
      {
        path: "/register/:agent_id?",
        element: <Signup />,
      },
    ],
  },
]);
