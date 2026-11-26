// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import {
  useMemo,
  useState,
} from 'react';

import logo from '/logo-icon.svg';
import {
  Input,
  Menu,
  MenuProps,
} from 'antd';
import toast from 'react-hot-toast';
import {
  FaBuilding,
  FaBullhorn,
  FaChalkboardTeacher,
  FaClipboardList,
  FaFile,
  FaFileInvoice,
  FaFilePdf,
  FaGavel,
  FaHeadset,
  FaHome,
  FaKey,
  FaMoneyCheckAlt,
  FaReceipt,
  FaRegCalendarAlt,
  FaRegIdBadge,
  FaStickyNote,
  FaUniversity,
  FaUser,
  FaUsers,
  FaUserTie,
} from 'react-icons/fa';
import {
  FaMoneyCheckDollar,
  FaPeopleLine,
} from 'react-icons/fa6';
import { FcDocument } from 'react-icons/fc';
import {
  NavLink,
  useNavigate,
} from 'react-router-dom';

import {
  AuditOutlined,
  BlockOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
  SearchOutlined,
  SettingOutlined,
  ShopOutlined,
} from '@ant-design/icons';

import leftIcon from '../../assets/left-arrow.svg';
import { api } from '../../redux/api/apiSlice';
import {
  useGetNotificationsQuery,
} from '../../redux/api/common/notificationSlice';
import { useUserLogoutMutation } from '../../redux/api/userSlice';
import {
  useAppDispatch,
  useAppSelector,
} from '../../redux/hooks';
import { clearUser } from '../../redux/slices/userSlice';
import { baseUrl } from '../../utils/constant';

const NewBadge = () => (
  <span
    style={{
      position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)",
      background: "#0d6b64", color: "#fff", fontSize: 9, fontWeight: 700, lineHeight: 1,
      padding: "3px 6px", borderRadius: 999, letterSpacing: 0.3, textTransform: "uppercase", pointerEvents: "none",
    }}
  >
    New
  </span>
);

const dvTimeClockItem = (key: string) => ({
  key,
  icon: <ClockCircleOutlined />,
  label: (
    <NavLink className="flex items-center" to={"/dashboard/dv-time-clock"} style={{ position: "relative", width: "100%", paddingRight: 44 }}>
      ANS Time Clock
      <NewBadge />
    </NavLink>
  ),
});
const tradeTransactionsItem = (key: string, extra: Record<string, unknown> = {}) => ({
  key,
  icon: <AuditOutlined />,
  ...extra,
  label: (
    <NavLink className="flex items-center" to={"/dashboard/trade-transactions"} style={{ position: "relative", width: "100%", paddingRight: 44 }}>
      Trade Transactions
      <NewBadge />
    </NavLink>
  ),
});
const isStaffType = (userType?: string) => Boolean(userType) && userType !== "client";


type TProps = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (sidebarCollapsed: boolean) => void;
  collapsed: boolean;
  handleCollapse: (collapsed: boolean, type: string) => void;
};

const Sidebar = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  collapsed,
}: TProps) => {
  const { user } = useAppSelector((state) => state.user);
  const navigate = useNavigate();
  const sidebarItems = () => {
    const hasPermissionForCategory = (categorySlug: string): boolean => {
      const hasPermission = user?.userRole?.permissions?.some((permission) => {
        return permission?.permission?.category?.slug == categorySlug;
      });
      return hasPermission;
    };
    const logoutItem = {
      key: "logout",
      label: (
        <NavLink className="flex items-center" to={"#"} onClick={handleLogout}>
          Logout
        </NavLink>
      ),
      icon: <LogoutOutlined />,
    };

    let agentItemsList = agentItems ?? [];
    const adminItemsList = adminItems ?? [];
    const superAdminItemsList = superAdminitems ?? [];
    const clientItemsList = clientItems ?? [];
    const commonItemsList = commonItems ?? [];

    if (
      user &&
      (!user?.userRole?.permissions || user?.userRole?.permissions.length === 0)
    ) {
      if (user && user.userType === "agent") {
        if (
          user.status != "approved" ||
          user.agentAccount[0].status != "approved"
        ) {
          agentItemsList = [
            {
              key: "one",
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/agent-information-submit"}
                >
                  Agent Details Submit
                </NavLink>
              ),
              icon: <FcDocument />,
            },
          ];
        }
        return [...agentItemsList, logoutItem];
      }

      if (user && user.userType === "admin") {
        return [...adminItemsList, logoutItem];
      }

      if (user && user.userType === "superAdmin") {
        return [...superAdminItemsList, logoutItem];
      }
      if (user && user.userType === "client") {
        return [...clientItemsList, logoutItem];
      }
      if (user && user?.userRole?.name === "Support") {
        return [...supportItems, logoutItem];
      }
    } else {
      const filteredItems = commonItemsList.filter((item) => {
        if (!item?.permissionCategorySlug) {
          return true;
        }
        return hasPermissionForCategory(item?.permissionCategorySlug);
      });
      return [...filteredItems, logoutItem];
    }

    if (isStaffType(user?.userType)) return [dvTimeClockItem("dv-time-clock-fallback"), logoutItem];
    return [];
  };

  const dispatch = useAppDispatch();
  const [userLogout] = useUserLogoutMutation();

  const { data } = useGetNotificationsQuery();

  const isValidInvoiceUrl = (url, substring) => {
    return url?.includes(substring);
  };

  const matchingIds = [];

  const checkUrls = (url_data) => {
    let isInvoiceUrl = false;

    data?.data?.data_list?.forEach((item) => {
      let url = "";

      try {
        const parsedData = JSON.parse(item.data);
        url = parsedData.url;
      } catch (error) {
        console.error("Error parsing data:", error);
      }

      if (isValidInvoiceUrl(url, url_data)) {
        isInvoiceUrl = true;
        matchingIds.push(item.id);
      }
    });

    return isInvoiceUrl;
  };


  const handleLogout = async () => {
    try {
      const response = await userLogout("").unwrap();
      toast.success(`${response?.message}`);

      dispatch(api.util.resetApiState());
      dispatch(clearUser());
    } catch (error: any) {
      dispatch(api.util.resetApiState());
      dispatch(clearUser());
      navigate("/login");
    }
  };

  const superAdminitems: MenuProps["items"] = [

    {
      key: "1",
      icon: <BlockOutlined />,
      label: (
        <NavLink className="flex items-center" to="/">
          Dashboard
        </NavLink>
      ),
    },
    {
      key: "2",
      icon: <FaFileInvoice />,
      label: (
        <NavLink
          className="flex items-center"
          to={
            "/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list"
          }
        >
          Trade Sheet
          {checkUrls("dashboard/agent/pages/form/trade-sheet") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },
    {
      key: "marketplace",
      icon: <FaUserTie />,
      label: "Agent Marketplace",
      children: [
        {
          key: "marketplace_purchase",
          icon: <AuditOutlined />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/marketplace/purchase-product-list"}
            >
              Products for Purchase
            </NavLink>
          ),
        },
        ...(user.roleId == 1
          ? [
              {
                key: "marketplace_borrow",
                icon: <AuditOutlined />,
                label: (
                  <NavLink
                    className="flex items-center"
                    to={"/dashboard/marketplace/borrow-product-list"}
                  >
                    Products for Borrow
                  </NavLink>
                ),
              },
            ]
            : []),
        ...(user.userType === "superAdmin" || user.userType === "admin"
          ? [
            {
              key: "marketplace_coupons",
              icon: <AuditOutlined />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/marketplace/discounts"}
                >
                  Discount Coupons
                </NavLink>
              ),
            },
             {
              key: "marketplace_inventory",
              icon: <AuditOutlined />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/marketplace/inventory"}
                >
                  Inventory
                </NavLink>
              ),
            },
          ]
          : []),
      ],
    },
    {
      key: "branch-management",
      icon: <FaBuilding />,
      permissionCategorySlug: "property-listing",
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/branch-management/branches"}
        >
          Branch Management
        </NavLink>
      ),
    },
    {
      key: "3",
      icon: <FaMoneyCheckAlt />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/paperworks-document-names"}
        >
          Paperwork Documents
        </NavLink>
      ),
    },
    {
      key: "4",
      icon: <FaBuilding />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/property-listing"}
        >
          Property Listing{" "}
          {checkUrls("dashboard/super-admin/property-listing") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },
    {
      key: "realtor",
      icon: <FaBuilding />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/realtor-property-listing"}
        >
          Office Listings{" "}
          {checkUrls("/dashboard/super-admin/realtor-property-listing") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },
    {
      key: "401",
      icon: <FaBuilding />,
      permissionCategorySlug: "property-listing",
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/property-mere-listing"}
        >
          Mere Listings{" "}
          {checkUrls("/dashboard/super-admin/property-mere-listing") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },
    {
      key: "101",
      icon: <FaFilePdf />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/pdf-extract"}
        >
          PDF
        </NavLink>
      ),
    },
    {
      key: "5",
      icon: <FaUniversity />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/brokerage-managements"}
        >
          Brokerages
        </NavLink>
      ),
    },
    {
      key: "6",
      icon: <FaGavel />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/lawyer-firm-managements"}
        >
          Lawyer Firms
        </NavLink>
      ),
    },
    {
      key: "7",
      icon: <FaReceipt />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/receipt-managements"}
        >
          Deposit Receipt
        </NavLink>
      ),
    },
    {
      key: "8",
      icon: <FaMoneyCheckDollar />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/pickup-receipt-managements"}
        >
          Cheque Pickup Receipt
        </NavLink>
      ),
    },
    {
      key: "/client-list",
      icon: <FaUsers />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/clients/client-list"}
        >
          Clients
        </NavLink>
      ),
    },
    {
      key: "9",
      icon: <FaUser />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/user-management"}
        >
          User
        </NavLink>
      ),
    },
    {
      key: "10",
      icon: <FaUserTie />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/agent-management"}
        >
          Agent
        </NavLink>
      ),
    },
    {
      key: "11",
      icon: <FaClipboardList />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/plan-management"}
        >
          Plans
        </NavLink>
      ),
    },
    {
      key: "file-manager-agent",
      permissionCategorySlug: "file-manager",
      icon: <FaFile />,
      label: (
        <NavLink className="flex items-center" to={"/dashboard/file-manager"}>
          File Manager
        </NavLink>
      ),
    },
    {
      key: "clock-in-out-superadmin",
      icon: <ClockCircleOutlined />,
      label: (
        <NavLink className="flex items-center" to={"/dashboard/clock-in-out"}>
          Clock In/Out
        </NavLink>
      ),
    },
    dvTimeClockItem("dv-time-clock-superadmin"),
    tradeTransactionsItem("trade-transactions-superadmin"),
    {
      key: "12",
      icon: <FaBullhorn />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/announcements"}
        >
          Announcement{" "}
          {checkUrls("dashboard/super-admin/announcements") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },

    {
      key: "1221",
      icon: <FaRegCalendarAlt />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/calendar-events"}
        >
          Calendar Events{" "}
          {checkUrls("dashboard/super-admin/calendar-events") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },
    {
      key: "1211",
      permissionCategorySlug: "manage-lead-campaign",
      icon: <FaPeopleLine />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/leads"}
        >
          Manage Leads{" "}
          {checkUrls("dashboard/super-admin/leads") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },
    {
      key: "122",
      icon: <FaHeadset />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/support/requests"}
        >
          Support{" "}
          {checkUrls("/dashboard/support/requests") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },
    {
      key: "expences",
      icon: <FaFile />,
      permissionCategorySlug: "expense-management",
      label: "Expenses",
      children: [
        {
          key: "expence-category",
          permissionCategorySlug: "view_expense_category",
          icon: <FaFile />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/expences/expence-category"}
            >
              Expense Category
            </NavLink>
          ),
        },
        {
          key: "expence-list",
          permissionCategorySlug: "view_expense",
          icon: <FaFile />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/expences/expence-List"}
            >
              Expense List
            </NavLink>
          ),
        },
      ],
    },
    {
      key: "12211",
      icon: <AuditOutlined />,
      permissionCategorySlug: "accounting-management",
      label: "Accounting",
      children: [
        {
          key: "7.1",
          permissionCategorySlug: "accounts",
          icon: <AuditOutlined />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/accounting/bank-account-management"}
            >
              Accounts
            </NavLink>
          ),
        },
        {
          key: "8.1",
          permissionCategorySlug: "trade-accounting",
          icon: <AuditOutlined />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/accounting/trade-list"}
            >
              Trade Accounting
            </NavLink>
          ),
        },
        {
          key: "8.2",
          permissionCategorySlug: "issue-agent-cheque",
          icon: <AuditOutlined />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/accounting/issue-agent-cheque"}
            >
              Issue Agent Cheque
            </NavLink>
          ),
        },
        {
          key: "8.3",
          permissionCategorySlug: "net-commission",
          icon: <AuditOutlined />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/accounting/commission-cheque"}
            >
              Net Commission
            </NavLink>
          ),
        },
        {
          key: "8.3.2",
          permissionCategorySlug: "agent-commission",
          icon: <AuditOutlined />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/accounting/agent-commission-cheque"}
            >
              Agent Commission
            </NavLink>
          ),
        },
        {
          key: "8.3.1",
          permissionCategorySlug: "base-commission",
          icon: <AuditOutlined />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/accounting/base-commission-cheque"}
            >
              Base Commission
            </NavLink>
          ),
        },
        {
          key: "8.4",
          permissionCategorySlug: "invoicing",
          icon: <AuditOutlined />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/accounting/tradesheet-invoicing"}
            >
              Invoicing
            </NavLink>
          ),
        },
      ],
    },
    {
      key: "122112",
      icon: <FaBuilding />,
      label: "Template",
      children: [
        {
          key: "share-tradeSheet-document",
          icon: <FaFile />,
          label: (
            <NavLink
              className="flex items-center"
              to={
                "/dashboard/super-admin/template-builder/share-tradeSheet-document"
              }
            >
              Share Trade Document
            </NavLink>
          ),
        },
      ],
    },
    {
      key: "knowledgeBase",
      icon: <BlockOutlined />,
      label: (
        <NavLink className="flex items-center" to={"/dashboard/knowledge-base"}>
          Knowledge Base{" "}
        </NavLink>
      ),
    },
    {
      key: "vendorList",
      icon: <ShopOutlined />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/companies"}
        >
          Vendor Directory{" "}
        </NavLink>
      ),
    },
    { type: "divider" },
    {
      key: "group",
      label: "Settings",
      type: "group",
      children: [
        {
          key: "13",
          icon: <FaRegIdBadge />,
          label: (
            <NavLink className="flex items-center" to={"/profile"}>
              My Profile
            </NavLink>
          ),
        },
      ],
    },
    {
      key: "14",
      permissionCategorySlug: "dashboard",
      icon: <SettingOutlined />,
      label: "Site Settings",
      children: [
        {
          key: "conditions",
          icon: <SettingOutlined />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/super-admin/conditions"}
            >
              Types of Conditions{" "}
              {checkUrls("dashboard/super-admin/conditions") ? (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
                  <style>
                    {`
                    @keyframes blink {
                      0%, 50% {
                        opacity: 1;
                      }
                      50.1%, 100% {
                        opacity: 0;
                      }
                    }
                  `}
                  </style>
                </div>
              ) : (
                ""
              )}
            </NavLink>
          ),
        },
        {
          key: "vendor-categories",
          icon: <SettingOutlined />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/super-admin/vendor-categories"}
            >
              Vendor Category{" "}
              {checkUrls("dashboard/super-admin/vendor-categories") ? (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
                  <style>
                    {`
                    @keyframes blink {
                      0%, 50% {
                        opacity: 1;
                      }
                      50.1%, 100% {
                        opacity: 0;
                      }
                    }
                  `}
                  </style>
                </div>
              ) : (
                ""
              )}
            </NavLink>
          ),
        },
      ],
    },
    {
      key: "20",
      permissionCategorySlug: "dashboard",
      icon: <SettingOutlined />,
      label: (
        <NavLink
          className="flex items-center"
          to={`${baseUrl}status`}
          target="_blank"
        >
          Site Performance
        </NavLink>
      ),
    },
    {
      key: "15",
      permissionCategorySlug: "role-permission",
      icon: <FaKey />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/role-permission/role-management"}
        >
          Role & Permission{" "}
        </NavLink>
      ),
    },
    {
      key: "17",
      permissionCategorySlug: "sys-log",
      icon: <FaFile />,
      label: "Syslog",
      children: [
        {
          key: "trade-document-syslog",
          permissionCategorySlug: "trade-doc-sys-log",
          icon: <FaFile />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/super-admin/file-activity"}
            >
              Trade Documents Syslog
            </NavLink>
          ),
        },
        {
          key: "file-manager-syslog",
          permissionCategorySlug: "file-manager-sys-log",
          icon: <FaFile />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/super-admin/file-manager-activity"}
            >
              File Manager Syslog
            </NavLink>
          ),
        },
        {
          key: "system-log",
          permissionCategorySlug: "sys-log",
          icon: <FaFile />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/super-admin/system-logs"}
            >
              System Log
            </NavLink>
          ),
        },
      ],
    },

  ];


  const adminItems: MenuProps["items"] = [
    {
      key: "1",
      icon: <BlockOutlined />,
      label: (
        <NavLink className="flex items-center" to={"/"}>
          Dashboard{" "}
        </NavLink>
      ),
    },
    {
      key: "2",
      icon: <FaFileInvoice />,
      label: (
        <NavLink
          className="flex items-center"
          to={
            "/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list"
          }
        >
          Trade Sheet{" "}
          {checkUrls("dashboard/agent/pages/form/trade-sheet") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },
    { type: "divider" },
    {
      key: "group",
      label: "Settings",
      type: "group",
      children: [
        {
          key: "3",
          icon: <FaRegIdBadge />,
          label: (
            <NavLink className="flex items-center" to={"/profile"}>
              My Profile
            </NavLink>
          ),
        },
      ],
    },
    {
      key: "support",
      icon: <FaHeadset />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/support/requests"}
        >
          Support{" "}
          {checkUrls("/dashboard/support/requests") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
          @keyframes blink {
            0%, 50% {
              opacity: 1;
            }
            50.1%, 100% {
              opacity: 0;
            }
          }
        `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },
    {
      key: "clock-in-out-admin",
      icon: <ClockCircleOutlined />,
      label: (
        <NavLink className="flex items-center" to={"/dashboard/clock-in-out"}>
          Clock In/Out
        </NavLink>
      ),
    },
    dvTimeClockItem("dv-time-clock-admin"),
  ];

  const agentItems: MenuProps["items"] = [
    {
      key: "1",
      icon: <BlockOutlined />,
      label: (
        <NavLink className="flex items-center" to={"/"}>
          Dashboard
        </NavLink>
      ),
    },
    {
      key: "2",
      icon: <FaFileInvoice />,
      label: (
        <NavLink
          className="flex items-center"
          to={
            "/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list"
          }
        >
          Trade Sheet
          {checkUrls("dashboard/agent/pages/form/trade-sheet") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },
    {
      key: "marketplace",
      icon: <FaUserTie />,
      label: "Agent Marketplace",
      children: [
        {
          key: "marketplace_purchase",
          icon: <AuditOutlined />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/marketplace/purchase-product-list"}
            >
              Products for Purchase
            </NavLink>
          ),
        },
        ...(user.roleId == 1
          ? [
              {
                key: "marketplace_borrow",
                icon: <AuditOutlined />,
                label: (
                  <NavLink
                    className="flex items-center"
                    to={"/dashboard/marketplace/borrow-product-list"}
                  >
                    Products for Borrow
                  </NavLink>
                ),
              },
            ]
        : []),
      ],
    },

    {
      key: "4",
      icon: <FaBuilding />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/property-listing"}
        >
          My Listing{" "}
          {checkUrls("dashboard/super-admin/property-listing") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },
    {
      key: "realtor",
      icon: <FaBuilding />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/realtor-property-listing"}
        >
          Office Listings{" "}
          {checkUrls("/dashboard/super-admin/realtor-property-listing") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },

    {
      key: "12111",
      icon: <FaPeopleLine />,
      label: (
        <NavLink className="flex items-center" to={"/dashboard/agent/my-leads"}>
          My Leads{" "}
          {checkUrls("dashboard/agent/my-leads") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },
    {
      key: "5",
      icon: <FaUsers />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/clients/client-list"}
        >
          Clients
        </NavLink>
      ),
    },
    {
      key: "knowledgeBase",
      icon: <BlockOutlined />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/knowledge-base-view"}
        >
          Knowledge Base{" "}
        </NavLink>
      ),
    },
    {
      key: "121",
      icon: <FaRegCalendarAlt />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/calendar-list"}
        >
          Calendar Events{" "}
          {checkUrls("/dashboard/super-admin/calendar-list") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },
    {
      key: "vendorList",
      icon: <ShopOutlined />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/vendors"}
        >
          Vendor Directory{" "}
        </NavLink>
      ),
    },
    { type: "divider" },
    {
      key: "group",
      label: "Settings",
      type: "group",
      children: [
        {
          key: "3",
          icon: <FaRegIdBadge />,
          label: (
            <NavLink className="flex items-center" to={"/profile"}>
              My Profile
            </NavLink>
          ),
        },
      ],
    },
    {
      key: "support",
      icon: <FaHeadset />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/support/requests"}
        >
          Support{" "}
          {checkUrls("/dashboard/support/requests") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
          @keyframes blink {
            0%, 50% {
              opacity: 1;
            }
            50.1%, 100% {
              opacity: 0;
            }
          }
        `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },
  ];

  const clientItems: MenuProps["items"] = [
    {
      key: "dashboard",
      icon: <BlockOutlined />,
      label: (
        <NavLink className="flex items-center" to={"/"}>
          Dashboard
        </NavLink>
      ),
    },
    {
      key: "my-accounting-agent",
      icon: <AuditOutlined />,
      label: (
        <NavLink className="flex items-center" to={"/dashboard/my-accounting"}>
          My Accounting
        </NavLink>
      ),
    },
    dvTimeClockItem("dv-time-clock-agent"),
    {
      key: "my-property",
      icon: <FaHome />,
      label: (
        <NavLink
          className="flex items-center"
          to={`/dashboard/clients/property-list/${user.id}/${user.name}`}
        >
          My Property
        </NavLink>
      ),
    },
    {
      key: "profile",
      icon: <FaRegIdBadge />,
      label: (
        <NavLink className="flex items-center" to={"/profile"}>
          My Profile
        </NavLink>
      ),
    },
  ];

  const supportItems: MenuProps["items"] = [
    {
      key: "1",
      icon: <BlockOutlined />,
      label: (
        <NavLink className="flex items-center" to={"/"}>
          Dashboard
        </NavLink>
      ),
    },
    ...(user?.userType == "itSupport"
      ? [
        {
          key: "2",
          icon: <FaHeadset />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/support/requests"}
            >
              Support{" "}
              {checkUrls("/dashboard/support/requests") ? (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
                  <style>
                    {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
                  </style>
                </div>
              ) : (
                ""
              )}
            </NavLink>
          ),
        },
      ]
      : []),
    ...(user?.userType == "graphicDesigner"
      ? [
        {
          key: "3",
          icon: <FaHeadset />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/support/art-work/request"}
            >
              Support{" "}
              {checkUrls("/dashboard/support/art-work/request") ? (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
                  <style>
                    {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
                  </style>
                </div>
              ) : (
                ""
              )}
            </NavLink>
          ),
        },
      ]
      : []),
    {
      key: "profile",
      icon: <FaRegIdBadge />,
      label: (
        <NavLink className="flex items-center" to={"/profile"}>
          My Profile
        </NavLink>
      ),
    },
    dvTimeClockItem("dv-time-clock-support"),
  ];

  const commonItems: MenuProps["items"] = [
    {
      key: "1",
      permissionCategorySlug: "dashboard",
      icon: <BlockOutlined />,
      label: (
        <NavLink className="flex items-center" to={"/"}>
          Dashboard
        </NavLink>
      ),
    },
    {
      key: "2",
      permissionCategorySlug: "trade-sheet",
      icon: <FaFileInvoice />,
      label: (
        <NavLink
          className="flex items-center"
          to={
            "/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list"
          }
        >
          Trade Sheet
          {checkUrls("dashboard/agent/pages/form/trade-sheet") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },
    {
      key: "marketplace",
      icon: <FaUserTie />,
      permissionCategorySlug: "agent-marketplace",
      label: "Agent Marketplace",
      children: [
        {
          key: "marketplace_purchase",
          icon: <AuditOutlined />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/marketplace/purchase-product-list"}
            >
              Products for Purchase
            </NavLink>
          ),
        },
        ...(user.roleId == 1
          ? [
              {
                key: "marketplace_borrow",
                icon: <AuditOutlined />,
                label: (
                  <NavLink
                    className="flex items-center"
                    to={"/dashboard/marketplace/borrow-product-list"}
                  >
                    Products for Borrow
                  </NavLink>
                ),
              }
            ]
            : []),
        ...(user?.userType === "superAdmin" || user?.userType === "admin"
          ? [
            {
              key: "marketplace_coupons",
              icon: <AuditOutlined />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/marketplace/discounts"}
                >
                  Discount Coupons
                </NavLink>
              ),
            },
            {
              key: "marketplace_inventory",
              icon: <AuditOutlined />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/marketplace/inventory"}
                >
                  Inventory
                </NavLink>
              ),
            },
          ]
          : []),
      ],
    },
    ...(user?.userType == "superAdmin"
      ? [
        {
          key: "3",
          permissionCategorySlug: "paperwork-documents",
          icon: <FaMoneyCheckAlt />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/super-admin/paperworks-document-names"}
            >
              Paperwork Documents
            </NavLink>
          ),
        },
      ]
      : []),
    {
      key: "4",
      permissionCategorySlug: "property-listing",
      icon: <FaBuilding />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/property-listing"}
        >
          {user?.userType === "agent" ? "My Listings " : "Property Listings "}
          {checkUrls("dashboard/super-admin/property-listing") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },
    {
      key: "branch-management",
      icon: <FaBuilding />,
      permissionCategorySlug: "property-listing",
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/branch-management/branches"}
        >
          Branch Management
        </NavLink>
      ),
    },
    {
      key: "realtor",
      permissionCategorySlug: "property-listing",
      icon: <FaBuilding />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/realtor-property-listing"}
        >
          Office Listings{" "}
          {checkUrls("/dashboard/super-admin/realtor-property-listing") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },
    ...(user?.userType == "superAdmin"
      ? [
        {
          key: "401",
          permissionCategorySlug: "property-listing",
          icon: <FaBuilding />,
          label: (
            <NavLink
                className="flex items-center"
              to={"/dashboard/super-admin/property-mere-listing"}
            >
              Mere Listings{" "}
              {checkUrls("/dashboard/super-admin/property-mere-listing") ? (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
                  <style>
                    {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
                  </style>
                </div>
              ) : (
                ""
              )}
            </NavLink>
          ),
        },
      ]
      : []),
    ...(user?.userType === "agent"
      ? [
        {
          key: "12111",
          permissionCategorySlug: "property-listing",
          icon: <FaPeopleLine />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/agent/my-leads"}
            >
              My Leads{" "}
              {checkUrls("dashboard/agent/my-leads") ? (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
                  <style>
                    {`
                      @keyframes blink {
                        0%, 50% {
                          opacity: 1;
                        }
                        50.1%, 100% {
                          opacity: 0;
                        }
                      }
                    `}
                  </style>
                </div>
              ) : null}
            </NavLink>
          ),
        },
      ]
      : []),
    ...(user?.userType == "superAdmin"
      ? [
        {
          key: "101",
          permissionCategorySlug: "role-permission",
          icon: <FaFilePdf />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/super-admin/pdf-extract"}
            >
              PDF
            </NavLink>
          ),
        },
        {
          key: "9",
          permissionCategorySlug: "user",
          icon: <FaUser />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/super-admin/user-management"}
            >
              User
            </NavLink>
          ),
        },
        {
          key: "file-manager-common",
          permissionCategorySlug: "file-manager",
          icon: <FaFile />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/file-manager"}
            >
              File Manager
            </NavLink>
          ),
        },
        {
          key: "clock-in-out",
          icon: <ClockCircleOutlined />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/clock-in-out"}
            >
              Clock In/Out
            </NavLink>
          ),
        }
      ]
      : []),
    
    {
      key: "5",
      permissionCategorySlug: "brokerage",
      icon: <FaUniversity />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/brokerage-managements"}
        >
          Brokerages
        </NavLink>
      ),
    },
    {
      key: "6",
      permissionCategorySlug: "lawyers",
      icon: <FaGavel />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/lawyer-firm-managements"}
        >
          Lawyer Firms
        </NavLink>
      ),
    },
    ...(user?.userType == "superAdmin"
      ? [
        {
          key: "7",
          permissionCategorySlug: "deposit-receipt",
          icon: <FaReceipt />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/super-admin/receipt-managements"}
            >
              Deposit Receipt
            </NavLink>
          ),
        },
        {
          key: "8",
          permissionCategorySlug: "cheque-pickup-receipt",
          icon: <FaMoneyCheckDollar />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/super-admin/pickup-receipt-managements"}
            >
              Cheque Pickup Receipt
            </NavLink>
          ),
        },
      ]
      : []),
    {
      key: "/client-list",
      permissionCategorySlug: "client",
      icon: <FaUsers />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/clients/client-list"}
        >
          Clients
        </NavLink>
      ),
    },
    ...(user?.userType == "client"
      ? [
        {
          key: "my-property",
          permissionCategorySlug: "dashboard",
          icon: <FaHome />,
          label: (
            <NavLink
              className="flex items-center"
              to={`/dashboard/clients/property-list/${user.id}/${user.name}`}
            >
              My Property
            </NavLink>
          ),
        },
      ]
      : []),

    ...(user?.userType == "superAdmin"
      ? [
        {
          key: "10",
          permissionCategorySlug: "agent",
          icon: <FaUserTie />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/super-admin/agent-management"}
            >
              Agent
            </NavLink>
          ),
        },
      ]
      : []),
    {
      key: "11",
      permissionCategorySlug: "plans",
      icon: <FaClipboardList />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/plan-management"}
        >
          Plans
        </NavLink>
      ),
    },

    {
      key: "12",
      permissionCategorySlug: "announcements",
      icon: <FaBullhorn />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/super-admin/announcements"}
        >
          Announcement{" "}
          {checkUrls("dashboard/super-admin/announcements") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },
    ...(user?.userType == "superAdmin"
      ? [
        {
          key: "121",
          permissionCategorySlug: "calendar-events",
          icon: <FaRegCalendarAlt />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/super-admin/calendar-events"}
            >
              Calendar Events{" "}
              {checkUrls("dashboard/super-admin/calendar-events") ? (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
                  <style>
                    {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
                  </style>
                </div>
              ) : (
                ""
              )}
            </NavLink>
          ),
        },
        {
          key: "1214",
          icon: <FaStickyNote />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/super-admin/calendar-notes"}
            >
              Calendar Notes{" "}
              {checkUrls("dashboard/super-admin/calendar-notes") ? (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
                  <style>
                    {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
                  </style>
                </div>
              ) : (
                ""
              )}
            </NavLink>
          ),
        },
        {
          key: "1211",
          permissionCategorySlug: "manage-lead-campaign",
          icon: <FaPeopleLine />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/super-admin/leads"}
            >
              Manage Leads{" "}
              {checkUrls("dashboard/super-admin/leads") ? (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
                  <style>
                    {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
                  </style>
                </div>
              ) : (
                ""
              )}
            </NavLink>
          ),
        },
      ]
      : []),
    ...(user?.userType == "agent"
      ? [
        {
          key: "121",
          permissionCategorySlug: "calendar-events",
          icon: <FaRegCalendarAlt />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/super-admin/calendar-list"}
            >
              Calendar Events{" "}
              {checkUrls("/dashboard/super-admin/calendar-list") ? (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
                  <style>
                    {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
                  </style>
                </div>
              ) : (
                ""
              )}
            </NavLink>
          ),
        },
        {
          key: "vendorList",
          icon: <ShopOutlined />,
          permissionCategorySlug: "ven-dir",
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/super-admin/vendors"}
            >
              Vendor Directory{" "}
            </NavLink>
          ),
        },
        {
          key: "knowledgeBase",
          permissionCategorySlug: "knowledge-base",
          icon: <BlockOutlined />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/knowledge-base-view"}
            >
              Knowledge Base{" "}
            </NavLink>
          ),
        },
      ]
      : []),

    {
      key: "122",
      permissionCategorySlug: "support",
      icon: <FaHeadset />,
      label: (
        <NavLink
          className="flex items-center"
          to={"/dashboard/support/requests"}
        >
          Support{" "}
          {checkUrls("/dashboard/support/requests") ? (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
              <style>
                {`
                @keyframes blink {
                  0%, 50% {
                    opacity: 1;
                  }
                  50.1%, 100% {
                    opacity: 0;
                  }
                }
              `}
              </style>
            </div>
          ) : (
            ""
          )}
        </NavLink>
      ),
    },

    ...(user?.userType == "superAdmin"
      ? [
        {
          key: "vendorList",
          icon: <ShopOutlined />,
          permissionCategorySlug: "ven-dir",
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/super-admin/companies"}
            >
              Vendor Directory{" "}
            </NavLink>
          ),
        },
        {
          key: "expences",
          icon: <FaFile />,
          permissionCategorySlug: "expense-management",
          label: "Expenses",
          children: [
            {
              key: "expence-category",
              permissionCategorySlug: "view_expense_category",
              icon: <FaFile />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/expences/expence-category"}
                >
                  Expense Category
                </NavLink>
              ),
            },
            {
              key: "expence-list",
              permissionCategorySlug: "view_expense",
              icon: <FaFile />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/expences/expence-List"}
                >
                  Expense List
                </NavLink>
              ),
            },
          ],
        },
        {
          key: "12211",
          icon: <AuditOutlined />,
          permissionCategorySlug: "accounting-management",
          label: "Accounting",
          children: [
            {
              key: "7.1",
              permissionCategorySlug: "accounts",
              icon: <AuditOutlined />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/accounting/bank-account-management"}
                >
                  Accounts
                </NavLink>
              ),
            },
            {
              key: "8.1",
              permissionCategorySlug: "trade-accounting",
              icon: <AuditOutlined />,
              label: (
                <NavLink to={"/dashboard/accounting/trade-list"}>
                  Trade Accounting
                </NavLink>
              ),
            },
            {
              key: "8.2",
              permissionCategorySlug: "issue-agent-cheque",
              icon: <AuditOutlined />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/accounting/issue-agent-cheque"}
                >
                  Issue Agent Cheque
                </NavLink>
              ),
            },
            {
              key: "8.3",
              permissionCategorySlug: "net-commission",
              icon: <AuditOutlined />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/accounting/commission-cheque"}
                >
                  Net Commission
                </NavLink>
              ),
            },
            {
              key: "8.3.2",
              permissionCategorySlug: "agent-commission",
              icon: <AuditOutlined />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/accounting/agent-commission-cheque"}
                >
                  Agent Commission
                </NavLink>
              ),
            },
            {
              key: "8.3.1",
              permissionCategorySlug: "base-commission",
              icon: <AuditOutlined />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/accounting/base-commission-cheque"}
                >
                  Base Commission
                </NavLink>
              ),
            },
            {
              key: "8.4",
              permissionCategorySlug: "invoicing",
              icon: <AuditOutlined />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/accounting/tradesheet-invoicing"}
                >
                  Invoicing
                </NavLink>
              ),
            },
          ],
        },

        ...(user?.userType == "agent"
          ? [
            {
              key: "122111",
              icon: <AuditOutlined />,
              permissionCategorySlug: "trade-sheet",
              label: "Agent Accounting",
              children: [
                {
                  key: "7.1",
                  permissionCategorySlug: "role-permission",
                  icon: <AuditOutlined />,
                  label: (
                    <NavLink
                      className="flex items-center"
                      to={"/dashboard/accounting/acknowledgement-list"}
                    >
                      Acknowledgement list
                    </NavLink>
                  ),
                },
                {
                  key: "8.1",
                  permissionCategorySlug: "role-permission",
                  icon: <AuditOutlined />,
                  label: (
                    <NavLink
                      to={
                        "/dashboard/accounting/agent-commission-transfer-history"
                      }
                    >
                      Transfer History
                    </NavLink>
                  ),
                },
              ],
            },
          ]
          : []),
        {
          key: "reports",
          icon: <FaFile />,
          permissionCategorySlug: "report-management",
          label: "Reports",
          children: [
            {
              key: "top-report",
              permissionCategorySlug: "agent-report",
              icon: <FaFile />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/reports/top-report"}
                >
                  Top Agent Report
                </NavLink>
              ),
            },
            {
              key: "agent-report",
              permissionCategorySlug: "agent-report",
              icon: <FaFile />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/reports/agent-report"}
                >
                  Agent Report
                </NavLink>
              ),
            },
            {
              key: "trade-report",
              permissionCategorySlug: "trade-report",
              icon: <FaFile />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/reports/trade-report"}
                >
                  Trade Report
                </NavLink>
              ),
            },
            {
              key: "balance-sheet-report",
              permissionCategorySlug: "trade-balance-sheet",
              icon: <FaFile />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/reports/balance-sheet-report"}
                >
                  Trade Balance Sheet
                </NavLink>
              ),
            },
            {
              key: "trade-details-report",
              permissionCategorySlug: "hst-details-report",
              icon: <FaFile />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/reports/hst-details-report"}
                >
                  HST Details Report
                </NavLink>
              ),
            },
            {
              key: "trade-summary-report",
              permissionCategorySlug: "hst-summery-report",
              icon: <FaFile />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/reports/hst-summery-report"}
                >
                  HST Summary Report
                </NavLink>
              ),
            },
            {
              key: "dynamic-report",
              permissionCategorySlug: "report-management",
              icon: <FaFile />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/reports/dynamic-report"}
                >
                  Dynamic Report
                </NavLink>
              ),
            },
          ],
        },
        {
          key: "122112",
          icon: <FaBuilding />,
          permissionCategorySlug: "role-permission",
          label: "Template",
          children: [
            {
              key: "share-tradeSheet-document",
              permissionCategorySlug: "role-permission",
              icon: <FaFile />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={
                    "/dashboard/super-admin/template-builder/share-tradeSheet-document"
                  }
                >
                  Share Trade Document
                </NavLink>
              ),
            },
          ],
        },
        {
          key: "knowledgeBase",
          icon: <BlockOutlined />,
          permissionCategorySlug: "knowledge-base",
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/knowledge-base"}
            >
              Knowledge Base{" "}
            </NavLink>
          ),
        },
      ]
      : []),
    { type: "divider" },
    ...(isStaffType(user?.userType) ? [dvTimeClockItem("dv-time-clock-common")] : []),
    tradeTransactionsItem("trade-transactions-common", { permissionCategorySlug: "accounting-management" }),
    {
      key: "group",
      permissionCategorySlug: "dashboard",
      label: "Settings",
      type: "group",
      children: [
        {
          key: "13",
          permissionCategorySlug: "my-profile",
          icon: <FaRegIdBadge />,
          label: (
            <NavLink className="flex items-center" to={"/profile"}>
              My Profile
            </NavLink>
          ),
        },
      ],
    },
    ...(user?.userType == "superAdmin"
      ? [
        {
          key: "14",
          permissionCategorySlug: "role-permission",
          icon: <SettingOutlined />,
          label: (
            <NavLink className="flex items-center" to={"/"}>
              Site Settings
            </NavLink>
          ),
          children: [
            {
              key: "conditions",
              icon: <SettingOutlined />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/super-admin/conditions"}
                >
                  Types of Conditions{" "}
                  {checkUrls("dashboard/super-admin/conditions") ? (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
                      <style>
                        {`
                    @keyframes blink {
                      0%, 50% {
                        opacity: 1;
                      }
                      50.1%, 100% {
                        opacity: 0;
                      }
                    }
                  `}
                      </style>
                    </div>
                  ) : (
                    ""
                  )}
                </NavLink>
              ),
            },
            {
              key: "vendor-categories",
              icon: <SettingOutlined />,
              permissionCategorySlug: "vendor-category-view",
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/super-admin/vendor-categories"}
                >
                  Vendor Category{" "}
                  {checkUrls("dashboard/super-admin/vendor-categories") ? (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-[blink_1s_infinite] ml-2">
                      <style>
                        {`
                    @keyframes blink {
                      0%, 50% {
                        opacity: 1;
                      }
                      50.1%, 100% {
                        opacity: 0;
                      }
                    }
                  `}
                      </style>
                    </div>
                  ) : (
                    ""
                  )}
                </NavLink>
              ),
            },
          ],
        },
        {
          key: "20",
          permissionCategorySlug: "role-permission",
          icon: <SettingOutlined />,
          label: (
            <NavLink
              className="flex items-center"
              to={`${baseUrl}status`}
              target="_blank"
            >
              Site Performance
            </NavLink>
          ),
        },
        {
          key: "15",
          permissionCategorySlug: "role-permission",
          icon: <FaKey />,
          label: (
            <NavLink
              className="flex items-center"
              to={"/dashboard/super-admin/role-permission/role-management"}
            >
              Role & Permission{" "}
            </NavLink>
          ),
        },
        {
          key: "17",
          permissionCategorySlug: "sys-log",
          icon: <FaFile />,
          label: "Syslog",
          children: [
            {
              key: "trade-document-syslog",
              permissionCategorySlug: "trade-doc-sys-log",
              icon: <FaFile />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/super-admin/file-activity"}
                >
                  Trade Documents Syslog
                </NavLink>
              ),
            },
            {
              key: "file-manager-syslog",
              permissionCategorySlug: "file-manager-sys-log",
              icon: <FaFile />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/super-admin/file-manager-activity"}
                >
                  File Manager Syslog
                </NavLink>
              ),
            },
            {
              key: "system-log",
              permissionCategorySlug: "sys-log",
              icon: <FaFile />,
              label: (
                <NavLink
                  className="flex items-center"
                  to={"/dashboard/super-admin/system-logs"}
                >
                  System Log
                </NavLink>
              ),
            },
          ],
        },
      ]
      : []),

  ];

  const SidebarSearch = ({ menuItems, onNavigate }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [showResults, setShowResults] = useState(false);

    const flattenMenuItems = (items, parentLabel = "") => {
      let flattened = [];

      items?.forEach((item) => {
        if (
          item &&
          item.label &&
          item.key !== "logout" &&
          item.type !== "divider" &&
          item.type !== "group"
        ) {
          let labelText = "";
          let navLink = "";

          if (typeof item.label === "string") {
            labelText = item.label;
          } else if (item.label?.props?.children) {
            const children = item.label.props.children;
            if (typeof children === "string") {
              labelText = children;
            } else if (Array.isArray(children)) {
              labelText = children.find((c) => typeof c === "string") || "";
            }
            navLink = item.label.props.to || "";
          }

          const fullLabel = parentLabel
            ? `${parentLabel} > ${labelText}`
            : labelText;

          if (navLink) {
            flattened.push({
              key: item.key,
              label: labelText,
              fullPath: fullLabel,
              navLink: navLink,
              icon: item.icon,
            });
          }

          if (item.children && Array.isArray(item.children)) {
            flattened = [
              ...flattened,
              ...flattenMenuItems(item.children, labelText),
            ];
          }
        }
      });

      return flattened;
    };

    const allMenuItems = useMemo(
      () => flattenMenuItems(menuItems),
      [menuItems]
    );

    const filteredItems = useMemo(() => {
      if (!searchTerm.trim()) return [];

      const search = searchTerm.toLowerCase();
      return allMenuItems
        .filter(
          (item) =>
            item.label.toLowerCase().includes(search) ||
            item.fullPath.toLowerCase().includes(search)
        )
        .slice(0, 8);
    }, [searchTerm, allMenuItems]);

    const handleSelect = (item) => {
      if (item.navLink) {
        onNavigate(item.navLink);
        setSearchTerm("");
        setShowResults(false);
      }
    };

    return (
      <div className="relative px-4 mb-4">
        <Input
          placeholder="Search menu..."
          prefix={<SearchOutlined className="text-gray-400" />}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          className="rounded-md"
          size="large"
          allowClear
        />

        {showResults && filteredItems.length > 0 && (
          <div className="absolute top-full left-4 right-4 mt-1 bg-[#1a2332] border border-gray-600 rounded-md shadow-lg z-[1000] max-h-[300px] overflow-y-auto">
            {filteredItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleSelect(item)}
                className="w-full px-4 py-2 text-left hover:bg-[#2d3e50] transition-colors flex items-center gap-3 text-white border-b border-gray-700 last:border-b-0"
              >
                <span className="text-gray-400">{item.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-400">{item.fullPath}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`  z-[500] `}>
      <div>
        <div>
          <div className={`demo-logo-vertical my-5  relative`}>
            <div className=" flex flex-col items-center gap-2  ">
              <img
                src={logo}
                alt=""
                className={`${collapsed ? "w-[40px]" : "w-[48px]"}`}
              />
              <h2
                className={`${collapsed ? "hidden" : ""
                  } tracking-widest text-[14px] 2xl:[15px] text-center playfair-display-sc-bold text-white`}
              >
                ANS REALSTATECRM
              </h2>
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`absolute top-0 w-[30px] right-3 lg:hidden ${!sidebarCollapsed && "hidden"
                }`}
            >
              <img src={leftIcon} alt="" />
            </button>
          </div>
        </div>

        {!collapsed && (
          <SidebarSearch menuItems={sidebarItems()} onNavigate={navigate} />
        )}

        <div className=" h-[calc(100vh-120px)] overflow-auto   ">
          <Menu
            defaultSelectedKeys={["1"]}
            defaultOpenKeys={["sub1"]}
            mode="inline"
            inlineCollapsed={collapsed}
            items={sidebarItems()}
            style={{ backgroundColor: "#0b3b38" }}
          />
        </div>
      </div>
      <div className="relative">
        <div className="absolute bottom-0 left-0 w-full flex justify-center items-center">

          <div className="absolute right-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 border-2 border-gray-300 hover:bg-gray-600 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 hover:border-gray-400"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="white"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={collapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
