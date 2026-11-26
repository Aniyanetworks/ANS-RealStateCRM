// @ts-nocheck
import { createBrowserRouter } from 'react-router-dom';

import App from '../App';
import CalendarList from '../components/dashboard/Calendar/CalendarList';
import RootLayout from '../layouts/RootLayout/RootLayout';
import BankAccountLog
  from '../pages/accounting/accounting-bank-account/BankAccountLog';
import BankAccountManagement
  from '../pages/accounting/accounting-bank-account/BankAccountManagement';
import AccountChequePosting
  from '../pages/accounting/tradesheet-accounting/AccountChequePosting';
import AcknowledgementlList
  from '../pages/accounting/tradesheet-accounting/AcknowledgementlList';
import AgentChequeAcknowledgement
  from '../pages/accounting/tradesheet-accounting/AgentChequeAcknowledgement';
import AgentChequeCalculation
  from '../pages/accounting/tradesheet-accounting/AgentChequeCalculation';
import AgentCommissionCheque
  from '../pages/accounting/tradesheet-accounting/AgentCommissionCheque';
import AgentCommissionTransferHistory
  from '../pages/accounting/tradesheet-accounting/AgentCommissionTransferHistory';
import BaseCommissionCheque
  from '../pages/accounting/tradesheet-accounting/BaseCommissionCheque';
import CommissionCheque
  from '../pages/accounting/tradesheet-accounting/CommissionCheque';
import FinalizeTrade
  from '../pages/accounting/tradesheet-accounting/FinalizeTrade';
import IssueAgentCheque
  from '../pages/accounting/tradesheet-accounting/IssueAgentCheque';
import TradeList from '../pages/accounting/tradesheet-accounting/TradeList';
import TradesheetInvoicing
  from '../pages/accounting/tradesheet-accounting/TradesheetInvoicing';
import AgentInformationSubmit from '../pages/agent/AgentInformationSubmit';
import AgreementPageFive from '../pages/agent/agreement-page/AgreementPageFive';
import AgreementPageFour from '../pages/agent/agreement-page/AgreementPageFour';
import AgreementPageOne from '../pages/agent/agreement-page/AgreementPageOne';
import AgreementPageSevent
  from '../pages/agent/agreement-page/AgreementPageSeven';
import AgreementPageSix from '../pages/agent/agreement-page/AgreementPageSix';
import AgreementPageThree
  from '../pages/agent/agreement-page/AgreementPageThree';
import AgreementPageTwo from '../pages/agent/agreement-page/AgreementPageTwo';
import AgreementPreview from '../pages/agent/AgreementPreview';
import CreatePassword from '../pages/agent/CreatePassword';
import ClientDocument
  from '../pages/agent/dashboard/manage-clients/ClientDocument';
import ClientManagement
  from '../pages/agent/dashboard/manage-clients/ClientManagement';
import ClientNote from '../pages/agent/dashboard/manage-clients/ClientNote';
import ClientProfile
  from '../pages/agent/dashboard/manage-clients/ClientProfile';
import ClientProperty
  from '../pages/agent/dashboard/manage-clients/ClientProperty';
import ClientPropertyNote
  from '../pages/agent/dashboard/manage-clients/ClientPropertyNote';
import CreateAndUpdateClient
  from '../pages/agent/dashboard/manage-clients/CreateAndUpdateClient';
import MySubmissionsArchiveTradeList
  from '../pages/agent/dashboard/pages/form/trade-sheet/MySubmissionsArchiveTradeList';
import MySubmissionsTradeList
  from '../pages/agent/dashboard/pages/form/trade-sheet/MySubmissionsTradeList';
import TradeSheetAdditionalDocumentUpload
  from '../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetAdditionalDocumentUpload';
import TradeSheetAgentBasicInfo
  from '../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetAgentBasicInfo';
import TradeSheetAgentDetails
  from '../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetAgentDetails';
import TradeSheetBuyerInformation
  from '../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetBuyerInformation';
import TradeSheetLawyerDetails
  from '../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetLawyerDetails';
import TradeSheetPaperworkAttachmentUpload
  from '../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetPaperworkAttachmentUpload';
import TradeSheetPaperworkAttachmentUploadMultipleRepresentation
  from '../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetPaperworkAttachmentUploadMultipleRepresentation';
import TradeSheetPaperworkFileManager
  from '../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetPaperworkFileManager';
import TradeSheetPaperworkFileManagerMultipleRepresentation
  from '../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetPaperworkFileManagerMultipleRepresentation';
import TradeSheetPreviewPage
  from '../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetPreviewPage';
import TradeSheetPreviewPageWithoutStep
  from '../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetPreviewPageWithoutStep';
import TradeSheetPropertyDetails
  from '../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetPropertyDetails';
import TradeSheetPropertyDetailsMultipleRepresentation
  from '../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetPropertyDetailsMultipleRepresentation';
import TradeSheetPropertyDetailsSeller
  from '../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetPropertyDetailsSeller';
import TradeSheetSellerInformation
  from '../pages/agent/dashboard/pages/form/trade-sheet/TradeSheetSellerInformation';
import EventJoin from '../pages/event/EventJoin';
import EventJoinSuccess from '../pages/event/EventJoinSuccess';
import EexpenceList from '../pages/expences/Eexpence';
import EexpenceCategory from '../pages/expences/EexpenceCategory';
import FileManager from '../pages/file-manager/FileManager';
import ClockInOut from '../pages/common/ClockInOut';
import BrokerageAccounting from '../pages/brokerage-accounting/BrokerageAccounting';
import MyAccounting from '../pages/brokerage-accounting/MyAccounting';
import DvTimeClock from '../pages/dv-time-clock/DvTimeClock';
import TradeTransactions from '../pages/trade-transactions/TradeTransactions';
import Home from '../pages/home/Home';
import ChangePassword from '../pages/login/ChangePassword';
import ForgotPassword from '../pages/login/ForgotPassword';
import Login from '../pages/login/Login';
import FreeholdLease from '../pages/MLSForm/FreeholdLease';
import FreeholdSale from '../pages/MLSForm/FreeholdSale';
import PdfExtrack from '../pages/MLSForm/PdfExtrack';
import Profile from '../pages/profile/Profile';
import AgentReport from '../pages/reports/AgentReport/AgentReport';
import AgentReportDetails
  from '../pages/reports/AgentReport/AgentReportDetails';
import BalanceSheet from '../pages/reports/BalanceSheet';
import DynamicReport from '../pages/reports/DynamicReport/DynamicReport';
import HstDetails from '../pages/reports/HstDetails';
import HstSummery from '../pages/reports/HstSummery';
import ReportSummery from '../pages/reports/ReportSummery';
import TopReport from '../pages/reports/TopReport/TopReport';
import TradeReport from '../pages/reports/TradeReport/TradeReport';
import SharedDocument from '../pages/share-documents/SharedDocument';
import ShareTradeSheetDocument
  from '../pages/share-documents/ShareTradeSheetDocument';
import Signup from '../pages/signup/Signup';
import BorrowOrderHistory
  from '../pages/super-admin/dashboard/invoice-management/BorrowOrderHistory';
import BorrowProductList
  from '../pages/super-admin/dashboard/invoice-management/BorrowProductList';
import BorrowProducts
  from '../pages/super-admin/dashboard/invoice-management/BorrowProducts';
import DiscountCoupon
  from '../pages/super-admin/dashboard/invoice-management/DiscountCoupon';
import InvoiceProduct
  from '../pages/super-admin/dashboard/invoice-management/InvoiceProduct';
import InventoryList
  from '../pages/super-admin/dashboard/invoice-management/InventoryList';
import InventoryTransactions
  from '../pages/super-admin/dashboard/invoice-management/InventoryTransactions';
import OrderHistory
  from '../pages/super-admin/dashboard/invoice-management/OrderHistory';
import AgentFileUpload
  from '../pages/super-admin/dashboard/pages/agent-management/AgentFileUpload';
import AgentManagement
  from '../pages/super-admin/dashboard/pages/agent-management/AgentManagement';
import AgentPlan
  from '../pages/super-admin/dashboard/pages/agent-management/AgentPlan';
import CreateNewAgent
  from '../pages/super-admin/dashboard/pages/agent-management/CreateNewAgent';
import EditAgent
  from '../pages/super-admin/dashboard/pages/agent-management/EditAgent';
import ExternalAgentManagement
  from '../pages/super-admin/dashboard/pages/agent-management/ExternalAgentManagement';
import AnnouncementManagement
  from '../pages/super-admin/dashboard/pages/announcement/AnnouncementManagement';
import BranchList
  from '../pages/super-admin/dashboard/pages/branch management/BranchList';
import CreateAndUpdateBranch
  from '../pages/super-admin/dashboard/pages/branch management/CreateAndUpdateBranch';
import BrokerageManagement
  from '../pages/super-admin/dashboard/pages/brokerage/BrokerageManagement';
import Attendees from '../pages/super-admin/dashboard/pages/calendar/Attendees';
import CalendarEventManagement
  from '../pages/super-admin/dashboard/pages/calendar/CalendarEventManagement';
import CalendarNoteManagement
  from '../pages/super-admin/dashboard/pages/calendar/CalendarNoteManagement';
import ConditionManagement
  from '../pages/super-admin/dashboard/pages/conditions/ConditionManagement';
import FileActivity
  from '../pages/super-admin/dashboard/pages/file-activity/FileActivity';
import FileManagerActivity
  from '../pages/super-admin/dashboard/pages/file-activity/FileManagerActivity';
import SystemLog
  from '../pages/super-admin/dashboard/pages/system-log/SystemLog';
import KnowledgeBaseAgentView
  from '../pages/super-admin/dashboard/pages/knowledge-base/KnowledgeBaseAgentView';
import KnowledgeBaseList
  from '../pages/super-admin/dashboard/pages/knowledge-base/KnowledgeBaseList';
import LawyerFirmManagement
  from '../pages/super-admin/dashboard/pages/lawyers/LawyerFirmManagement';
import LawyersDataManagement
  from '../pages/super-admin/dashboard/pages/lawyers/LawyerManagement';
import LeadsManagementPage
  from '../pages/super-admin/dashboard/pages/leads/AllLeads';
import CampaignManagement
  from '../pages/super-admin/dashboard/pages/leads/CampaignManagement';
import LeadsListByAgent
  from '../pages/super-admin/dashboard/pages/leads/LeadsListByAgent';
import LeadsList
  from '../pages/super-admin/dashboard/pages/leads/LeadsListByAgentCopy';
import ValidationLogsList
  from '../pages/super-admin/dashboard/pages/leads/ValidationLogsList';
import FileUploadNames
  from '../pages/super-admin/dashboard/pages/paperworks-document-names/PaperworksDocumentNames';
import PickupReceiptManagement
  from '../pages/super-admin/dashboard/pages/pickup-receipt/PickupReceiptManagement';
import CreateCustomDiscount
  from '../pages/super-admin/dashboard/pages/plan-management/CreateCustomDiscount';
import CreateCustomPlan
  from '../pages/super-admin/dashboard/pages/plan-management/CreateCustomPlan';
import CreatePlan
  from '../pages/super-admin/dashboard/pages/plan-management/CreatePlan';
import DiscountManagement
  from '../pages/super-admin/dashboard/pages/plan-management/DiscountManagement';
import EditDiscount
  from '../pages/super-admin/dashboard/pages/plan-management/EditDiscount';
import EditPlan
  from '../pages/super-admin/dashboard/pages/plan-management/EditPlan';
import PlanManagement
  from '../pages/super-admin/dashboard/pages/plan-management/PlanManagement';
import CreateUpdatePropertyListing
  from '../pages/super-admin/dashboard/pages/property-listing/CreateUpdatePropertyListing';
import CreateUpdatePropertyMereListing
  from '../pages/super-admin/dashboard/pages/property-listing/CreateUpdatePropertyMereListing';
import PropertyListingManagement
  from '../pages/super-admin/dashboard/pages/property-listing/PropertyListingManagement';
import PropertyListingPaperworkAttachmentUpload
  from '../pages/super-admin/dashboard/pages/property-listing/PropertyListingPaperworkAttachmentUpload';
import PropertyListingPaperworkFileManager
  from '../pages/super-admin/dashboard/pages/property-listing/PropertyListingPaperworkFileManager';
import PropertyMereListingManagement
  from '../pages/super-admin/dashboard/pages/property-listing/PropertyMereListingManagement';
import RealtorPropertyListingManagement
  from '../pages/super-admin/dashboard/pages/property-listing/RealtorPropertyListingManagement';
import ViewPropertyListing
  from '../pages/super-admin/dashboard/pages/property-listing/ViewPropertyListing';
import ReceiptManagement
  from '../pages/super-admin/dashboard/pages/receipt/ReceiptManagement';
import PermissionManagement
  from '../pages/super-admin/dashboard/pages/role-permission/PermissionManagement';
import RoleManagement
  from '../pages/super-admin/dashboard/pages/role-permission/RoleManagement';
import ArtWorkRequest
  from '../pages/super-admin/dashboard/pages/support/ArtWorkRequest';
import ArtWorks from '../pages/super-admin/dashboard/pages/support/ArtWorks';
import SupportRequestDetail
  from '../pages/super-admin/dashboard/pages/support/SupportRequestDetail';
import SupportRequestList
  from '../pages/super-admin/dashboard/pages/support/SupportRequestList';
import TradeSheetShareDocumentTemplate
  from '../pages/super-admin/dashboard/pages/template-builder/TradeSheetShareDocumentTemplate';
import CreateAndUpdateUser
  from '../pages/super-admin/dashboard/pages/user-management/CreateAndUpdateUser';
import ResetPassword
  from '../pages/super-admin/dashboard/pages/user-management/ResetPassword';
import UserManagement
  from '../pages/super-admin/dashboard/pages/user-management/UserManagement';
import VendorCategoryManagement
  from '../pages/super-admin/dashboard/pages/vendor-category/VendorCategoryManagement';
import CompanyManagement
  from '../pages/super-admin/dashboard/pages/vendor-list/CompanyManagement';
import VendorManagement
  from '../pages/super-admin/dashboard/pages/vendor-list/VendorManagement';
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

          // Treadesheet create,update,delete Route
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

          // Client Section route
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
                        userTypePermission={["superAdmin", "agent"]}
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
                        userTypePermission={["superAdmin", "agent"]}
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

          // Market Place Section route
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
              // DV Time Clock (rebuild of the dvclock app; access is checked by the API)
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
              // Trade Transactions (bodv Transactions screen on the existing trade accounting data)
              {
                path: "trade-transactions",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["superAdmin", "accountant"]}
                  >
                    <TradeTransactions />
                  </PermissonRoute>
                ),
              },
              // Brokerage accounting (merged from DV Accounting)
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
                    userTypePermission={["agent", "superAdmin"]}
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

          // Super Admin Routes
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

              // Property Listing
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

              // Basic superadmin route
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

              //  Super admin Branch admin routes starts here!!!
              {
                path: "branch-management/branches",
                element: (
                  <PermissonRoute
                    permission={[]}
                    userTypePermission={["superAdmin"]}
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

              //  Super admin branch admin routes ends here!!

              // Not using route
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

              // Agent manage Route
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

              // Role Permission route
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

          //  Agent Account Route
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

          // Support Section Route

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

          // Accounting Section route
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

          // Expense Section route
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
          // Report Section route
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

          // Others route
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

      // Without login access route unprotected
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
