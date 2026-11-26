/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import type {
  TableColumnsType,
  TableProps,
} from 'antd';
import {
  Button,
  Dropdown,
  Input,
  message,
  Modal,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from 'antd';
import {
  formatDate,
  parseISO,
} from 'date-fns';
import toast from 'react-hot-toast';
import { BsThreeDotsVertical } from 'react-icons/bs';
import {
  FaExchangeAlt,
  FaEye,
  FaRegEdit,
  FaSearch,
  FaTimes,
  FaSignOutAlt,
} from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { RiKey2Line } from 'react-icons/ri';
import {
  Link,
  NavLink,
  useNavigate,
} from 'react-router-dom';

import { SearchOutlined } from '@ant-design/icons';

import TableLoader from '../../../../../components/loader/TableLoader';
import {
  useForceClockOutMutation,
  useGetActiveClockUsersQuery,
} from '../../../../../redux/api/common/clockInOutSlice';
import getStatusBadge from '../../../../../components/Utils/StatusBadge';
import { api } from '../../../../../redux/api/apiSlice';
import {
  useGetRoleListQuery,
} from '../../../../../redux/api/superadmin/roleManagementSlice';
import {
  useDeleteMultipleUserMutation,
  useDeleteSpacificUserMutation,
  useGetUserListDataQuery,
} from '../../../../../redux/api/superadmin/user/userManageSlice';
import {
  useImpersonateMutation,
  useResendOtpMutation,
  useResetUserAuthenticatorMutation,
  useToggleSmsOtpMutation,
  useToggleUserStatusMutation,
} from '../../../../../redux/api/userSlice';
import { useAppDispatch } from '../../../../../redux/hooks';
import {
  setAccessToken,
  setUser,
} from '../../../../../redux/slices/userSlice';
import { usePermissions } from '../../../../../utils/permissionUtils';

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface DataType {
  key?: React.Key;
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  userType: string;
  createdAt: string;
  uuid: string;
  smsOtpEnabled?: boolean;
  phoneNumber?: string;
  isActive?: boolean;
  branch?: {
    id: number;
    uuid: string;
    name: string;
    slug: string;
    status: string;
  };
  userRole?: {
    name: string;
    uuid: string;
    status: string;
    slug: string;
  };
}
type OnChange = NonNullable<TableProps<DataType>["onChange"]>;
type Filters = Parameters<OnChange>[1];

type GetSingle<T> = T extends (infer U)[] ? U : never;
type Sorts = GetSingle<Parameters<OnChange>[2]>;

interface RoleType {
  name: string;
  uuid: string;
  status: string;
  importRoleName?: string;
  isDefault?: string;
}

const CreateAndUpdateUser = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);
  const { data, isLoading, refetch } = useGetUserListDataQuery("");
  const { data: roleData } = useGetRoleListQuery("");
  const [deleteSpacificUser] = useDeleteSpacificUserMutation();
  const [toggleSmsOtp] = useToggleSmsOtpMutation();
  const [resetUserAuthenticator] = useResetUserAuthenticatorMutation();
  const [toggleUserStatus, { isLoading: isToggling }] =
    useToggleUserStatusMutation();
  const [currentToggleUser, setCurrentToggleUser] = useState<{
    id: string;
    name: string;
    currentStatus: boolean;
  } | null>(null);

  // Toggle User Status State
  const [isToggleModalVisible, setIsToggleModalVisible] = useState(false);

  // Delete Multiple
  const [deleteMultipleUser] = useDeleteMultipleUserMutation();
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filteredInfo, setFilteredInfo] = useState<Filters>({});
  const [sortedInfo, setSortedInfo] = useState<Sorts>({});
  const [searchText, setSearchText] = useState("");

  // User filter state - default to "ourUsers"
  const [userFilter, setUserFilter] = useState<string>("ourUsers");

  // Force clock out state
  const [isClockOutModalVisible, setIsClockOutModalVisible] = useState(false);
  const [clockOutTarget, setClockOutTarget] = useState<DataType | null>(null);
  const [forceClockOut, { isLoading: isClockingOut }] = useForceClockOutMutation();
  const { data: activeClockData } = useGetActiveClockUsersQuery(undefined, { pollingInterval: 30000 });
  const activeClockUserIds: number[] = activeClockData?.data?.map((u: any) => u.userId ?? u.id) ?? [];

  // Impersonate state
  const [isImpersonateOtpModalVisible, setIsImpersonateOtpModalVisible] = useState(false);
  const [impersonateOtp, setImpersonateOtp] = useState("");
  const [impersonateTarget, setImpersonateTarget] = useState<DataType | null>(null);
  const [impersonate] = useImpersonateMutation();
  const [resendImpersonateOtp] = useResendOtpMutation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Define tabs for user filtering
  const userFilterTabs = [
    { id: "ourUsers", label: "Our Users" },
    { id: "otherUsers", label: "Other Users" },
  ];

  // Filter logic with user role filter
  const filteredData = tableData?.filter((record) => {
    // First apply the user filter based on selected tab
    if (userFilter === "ourUsers") {
      // Show users who have branchId OR roleId == 1
      const hasBranchId = !!record.branch;
      const isSuperAdmin = record?.roleId == 1;
      if (!hasBranchId && !isSuperAdmin) return false;
    } else if (userFilter === "otherUsers") {
      // Show users who don't have branchId AND roleId != 1
      const hasBranchId = !!record.branch;
      const isSuperAdmin = record?.roleId == 1;
      if (hasBranchId || isSuperAdmin) return false;
      if (record.branch) return false;
    }

    // Then apply search filter
    const searchTerm = searchText?.toLowerCase();
    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return inRecord;
  });

  useEffect(() => {
    if (data?.data?.userData) {
      // Add isActive field to each user with default value true if not present
      const usersWithActiveStatus = data.data.userData.map((user: any) => ({
        ...user,
        isActive: user.isActive === 'yes' ? true : user.isActive === 'no' ? false : true,
      }));
      setTableData(usersWithActiveStatus);
    }
  }, [data]);

  // Toggle User Status Handlers
  const handleToggleClick = (
    userId: string,
    userName: string,
    currentStatus: boolean
  ) => {
    setCurrentToggleUser({
      id: userId,
      name: userName,
      currentStatus: currentStatus,
    });
    setIsToggleModalVisible(true);
  };

  const handleToggleConfirm = async () => {
    if (!currentToggleUser) return;

    try {
      const response = await toggleUserStatus({
        userId: currentToggleUser.id,
        isActive: !currentToggleUser.currentStatus,
      }).unwrap();

      if (response.status) {
        message.success(
          `User ${!currentToggleUser.currentStatus ? "activated" : "deactivated"
          } successfully`
        );

        setTableData((prevData) =>
          prevData.map((user) =>
            user.id === currentToggleUser.id
              ? { ...user, isActive: !currentToggleUser.currentStatus }
              : user
          )
        );
      } else {
        message.error(response.message || "Failed to update user status");
      }
    } catch (error: any) {
      console.error("Toggle user status error:", error);
      message.error(error.data?.message || "Failed to update user status");
    } finally {
      setIsToggleModalVisible(false);
      setCurrentToggleUser(null);
    }
  };

  const handleToggleCancel = () => {
    setIsToggleModalVisible(false);
    setCurrentToggleUser(null);
  };

  const handleToggleSmsOtp = async (userId: string, enabled: boolean) => {
    try {
      const response = await toggleSmsOtp({
        userId,
        enabled,
      }).unwrap();

      if (response.status) {
        toast.success(response.message);
        setTableData((prevData) =>
          prevData.map((user) =>
            user.id === userId ? { ...user, smsOtpEnabled: enabled } : user
          )
        );
      } else {
        toast.error(response.message || "Failed to update OTP settings");
      }
    } catch (error: any) {
      console.error("Toggle OTP error:", error);
      toast.error(error.data?.message || "Failed to update OTP settings");
    }
  };

  const handleResetAuthenticator = async (userId: string, userName: string) => {
    Modal.confirm({
      title: "Reset Authenticator 2FA",
      content: `This will disable the Authenticator app for "${userName}". They will no longer be prompted for an authenticator code on login. Continue?`,
      okText: "Reset",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const response = await resetUserAuthenticator({ userId }).unwrap();
          if (response.status) {
            toast.success(response.message);
          } else {
            toast.error(response.message || "Failed to reset authenticator");
          }
        } catch (error: any) {
          toast.error(error.data?.message || "Failed to reset authenticator");
        }
      },
    });
  };

  const handleChange: OnChange = (pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter as Sorts);
  };

  const handleDelete = (uuid: string) => {
    setDeleteUuid(uuid);
    setIsModalVisible(true);
  };

  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await deleteSpacificUser(deleteUuid).unwrap();
      toast.success(`${response?.message}`);
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
    setIsModalVisible(false);
    setDeleteUuid(null);
  };

  const cancelDelete = () => {
    setIsModalVisible(false);
    setDeleteUuid(null);
    setIsDeleteModalMultipleVisible(false);
  };

  const getUserTypeName = (userType) => {
    const userTypeMap = {
      superAdmin: "Super Admin",
      admin: "Admin",
      agent: "Agent",
      accountant: "Accountant",
      client: "Client",
      itSupport: "It Support",
      graphicDesigner: "Graphic Designer",
    };
    return userTypeMap[userType] || "Unknown User Type";
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<DataType> = {
    selectedRowKeys,
    onChange: onSelectChange,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
      {
        key: "odd",
        text: "Select Odd Row",
        onSelect: (changeableRowKeys) => {
          let newSelectedRowKeys = [];
          newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
            if (index % 2 !== 0) {
              return false;
            }
            return true;
          });
          setSelectedRowKeys(newSelectedRowKeys);
        },
      },
      {
        key: "even",
        text: "Select Even Row",
        onSelect: (changeableRowKeys) => {
          let newSelectedRowKeys = [];
          newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
            if (index % 2 !== 0) {
              return true;
            }
            return false;
          });
          setSelectedRowKeys(newSelectedRowKeys);
        },
      },
    ],
  };

  // Extract unique branches for filter
  const uniqueBranches = Array.from(
    new Set(
      tableData
        .filter((item) => item.branch)
        .map((item) =>
          JSON.stringify({ name: item.branch?.name, id: item.branch?.id })
        )
    )
  ).map((str) => JSON.parse(str));

  const columns: TableColumnsType<DataType> = [
    {
      title: "#",
      key: "serial",
      width: 50,
      dataIndex: "serial",
      fixed: "left",
    },
    {
      title: "User ID",
      key: "userTypeUId",
      width: 50,
      dataIndex: "userTypeUId",
      render: (text: string, record: any) => (
        <Link
          to={`/dashboard/super-admin/user-management/crate-and-update-user/${record.uuid}`}
          className="hover:text-blue-600 cursor-pointer hover:underline"
        >
          {text}
        </Link>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      filterDropdown: ({ setSelectedKeys, confirm, selectedKeys }) => (
        <div className="p-2">
          <Input
            value={selectedKeys[0]}
            onChange={(e) => {
              setSelectedKeys(e.target.value ? [e.target.value] : []);
              confirm({ closeDropdown: false });
            }}
            onPressEnter={() => confirm()}
            onBlur={() => confirm()}
          />
          <button onClick={() => confirm()} className="primary-btn !py-1 mt-2">
            Search
          </button>
        </div>
      ),
      filterIcon: () => <SearchOutlined />,
      onFilter: (value, record) =>
        record.name.toLowerCase().includes(String(value).toLowerCase()),
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortOrder: sortedInfo.columnKey === "name" ? sortedInfo.order : null,
      ellipsis: true,
      render: (text: string, record: any) => {
        const isClockedIn = activeClockUserIds.includes(Number(record.id));
        return (
          <Tooltip title={text}>
            <div className="flex items-center gap-1.5">
              <Link
                to={`/dashboard/super-admin/user-management/crate-and-update-user/${record.uuid}`}
                style={{ cursor: "pointer" }}
              >
                {text?.length > 30 ? `${text?.slice(0, 30)}...` : text}
              </Link>
              {isClockedIn && (
                <Tooltip title="Currently clocked in">
                  <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-700 border border-green-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </span>
                </Tooltip>
              )}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => a.email.localeCompare(b.email),
      sortOrder: sortedInfo.columnKey === "email" ? sortedInfo.order : null,
    },
    {
      title: "Phone Number",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: "User Role",
      dataIndex: "userRole",
      key: "userRole",
      filters:
        roleData?.data?.roles?.map((role: RoleType) => ({
          text: role.name,
          value: role.name,
        })) || [],
      filteredValue: filteredInfo.userRole || null,
      onFilter: (value, record) =>
        (record?.userRole?.name || "").includes(value as string) &&
        record?.userRole?.name === value,
      sorter: (a, b) =>
        (a?.userRole?.name || "").localeCompare(b?.userRole?.name || ""),
      sortOrder: sortedInfo.columnKey === "userRole" ? sortedInfo.order : null,
      render: (userRole, record) => record?.userRole?.name || "N/A",
    },
    {
      title: "Branch",
      dataIndex: "branch",
      key: "branch",
      width: 150,
      filters: uniqueBranches.map((branch) => ({
        text: branch.name,
        value: branch.name,
      })),
      filteredValue: filteredInfo.branch || null,
      onFilter: (value, record) => record?.branch?.name === value,
      sorter: (a, b) =>
        (a?.branch?.name || "").localeCompare(b?.branch?.name || ""),
      sortOrder: sortedInfo.columnKey === "branch" ? sortedInfo.order : null,
      render: (branch, record) => {
        if (!branch) {
          // If user is superadmin, show "All Branch", otherwise "No Branch"
          const isSuperAdmin = record?.roleId == 1;
          return (
            <Tag color="default">
              {isSuperAdmin ? "All Branch" : "No Branch"}
            </Tag>
          );
        }
        return (
          <Tooltip title={`Status: ${branch.status}`}>
            <Tag color={branch.status === "active" ? "green" : "red"}>
              {branch.name}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: any) => getStatusBadge(status),
      filters: [
        { text: "Approved", value: "approved" },
        { text: "Pending", value: "pending" },
        { text: "Draft", value: "draft" },
        {
          text: "Under Review",
          value: "underReview",
        },
        { text: "Rejected", value: "rejected" },
        { text: "Closed", value: "closed" },
      ],
      filteredValue: filteredInfo.status || null,
      onFilter: (value, record) => record.status.includes(value as string),
      sorter: (a, b) => a.status.length - b.status.length,
      sortOrder: sortedInfo.columnKey === "status" ? sortedInfo.order : null,
    },
    {
      title: "Active",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      align: "center",
      filters: [
        { text: "Active", value: true },
        { text: "Inactive", value: false },
      ],
      filteredValue: filteredInfo.isActive || null,
      onFilter: (value, record) => record.isActive === value,
      render: (isActive: boolean, record: DataType) => (
        <Tooltip
          title={
            isActive
              ? "Active - Click to deactivate"
              : "Inactive - Click to activate"
          }
        >
          <Switch
            checked={isActive}
            onChange={() => handleToggleClick(record.id, record.name, isActive)}
            size="small"
            className={isActive ? "active-switch" : "inactive-switch"}
          />
        </Tooltip>
      ),
    },
    {
      title: "Login OTP",
      dataIndex: "smsOtpEnabled",
      key: "smsOtpEnabled",
      filters: [
        { text: "Yes", value: true },
        { text: "No", value: false },
      ],
      filteredValue: filteredInfo.smsOtpEnabled || null,
      onFilter: (value, record) => record.smsOtpEnabled === value,
      width: 100,
      align: "center",
      render: (enabled: boolean, record: DataType) => (
        <Tooltip
          title={
            record.phoneNumber
              ? enabled
                ? "OTP Enabled - Click to disable"
                : "OTP Disabled - Click to enable"
              : "No phone number registered"
          }
        >
          <Switch
            checked={enabled}
            onChange={(checked) => handleToggleSmsOtp(record.id, checked)}
            disabled={!record.phoneNumber}
            size="small"
          />
        </Tooltip>
      ),
    },
    {
      title: "Authenticator 2FA",
      key: "auth2fa",
      width: 120,
      align: "center",
      render: (_: any, record: DataType) => (
        <Tooltip title="Reset / disable authenticator app for this user">
          <Button
            size="small"
            danger
            onClick={() => handleResetAuthenticator(record.id, record.name)}
          >
            Reset 2FA
          </Button>
        </Tooltip>
      ),
    },
    {
      title: "Created at",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => {
        if (!createdAt) {
          return "No date";
        }
        const date = parseISO(createdAt);
        return formatDate(date, "dd MMMM yyyy, hh:mm a");
      },
    },
    {
      key: 'impersonate',
      title: 'Impersonate Mode',
      render: (text, record) => (
        <button
          onClick={() => handleImpersonate(record)}
          className="flex items-center gap-2 bg-[#0B1D3D] text-white px-3 py-1 rounded hover:bg-[#182843]"
        >
          <FaExchangeAlt />
          Impersonate
        </button>
      ),
    },
    {
      title: "Actions",
      dataIndex: "uuid",
      key: "actions",
      render: (uuid, record) => (
        <Dropdown
          menu={{
            items: [
              hasPermissionForSlug("edit-user") && {
                key: "edit",
                label: (
                  <Link
                    to={`/dashboard/super-admin/user-management/crate-and-update-user/${uuid}`}
                    className="flex items-center gap-2"
                  >
                    <FaRegEdit /> Edit
                  </Link>
                ),
              },
              {
                key: "view",
                label: (
                  <Link
                    to={`/dashboard/super-admin/user-management/crate-and-update-user/${uuid}`}
                    className="flex items-center gap-2"
                  >
                    <FaEye /> View
                  </Link>
                ),
              },
              {
                key: "impersonate",
                label: (
                  <button
                    onClick={() => handleImpersonate(record)}
                    className="flex items-center w-full gap-2"
                  >
                    <FaExchangeAlt />
                    Impersonate
                  </button>
                ),
              },
              activeClockUserIds.includes(Number(record.id)) && {
                key: "force-clock-out",
                label: (
                  <button
                    onClick={() => handleForceClockOut(record)}
                    className="flex items-center gap-2 text-orange-600 w-full"
                  >
                    <FaSignOutAlt /> Force Clock Out
                  </button>
                ),
              },
              hasPermissionForSlug("delete-user") && {
                key: "delete",
                label: (
                  <button
                    onClick={() => handleDelete(uuid)}
                    className="flex items-center gap-2"
                  >
                    <MdDelete /> Delete
                  </button>
                ),
              },
              hasPermissionForSlug("edit-user") && {
                key: "reset-password",
                label: (
                  <Link
                    className="flex items-center gap-2"
                    to={`/super-admin/reset-password/${encodeURIComponent(
                      record.email
                    )}`}
                  >
                    <RiKey2Line />
                    Reset Password
                  </Link>
                ),
              },
            ],
          }}
        >
          <a onClick={(e) => e.preventDefault()}>
            <Space>
              <BsThreeDotsVertical />
            </Space>
          </a>
        </Dropdown>
      ),
      fixed: "right",
      width: 50,
      align: "center",
    },
  ];

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteMultipleUser(selectedRowKeys);
        setIsDeleteModalMultipleVisible(false);
        await refetch();
        if (response.data.status == true) {
          setSelectedRowKeys([]);
          toast.success("Deleted successfully!");
        } else {
          toast.error("Failed to delete. Please try again.");
        }
      } catch (error) {
        setIsDeleteModalMultipleVisible(false);
        toast.error("Failed to delete. Please try again.");
      }
    } else {
      toast.error("Please Select Items.");
    }
  };

  // Serial number in the table
  const tableSourceData = filteredData?.map((item: any, index: number) => {
    return {
      ...item,
      serial: index + 1,
    };
  });

  // Impersonate handlers
  const handleImpersonate = async (record: DataType) => {
    try {
      setImpersonateTarget(record);

      const response = await impersonate({
        userId: record.id,
        email: record.email
      }).unwrap();

      if (response.requiresOtp) {
        // Show OTP modal if OTP is required
        setIsImpersonateOtpModalVisible(true);
        toast.success('OTP sent to your phone number');
      } else if (response.status) {
        // If no OTP required (shouldn't happen with OTP enabled)
        handleImpersonationSuccess(response);
      } else {
        toast.error(response.message || 'Failed to impersonate user');
      }
    } catch (error: any) {
      console.error('Impersonation error:', error);
      if (error.data?.requiresOtp) {
        setIsImpersonateOtpModalVisible(true);
        toast.success('OTP sent to your phone number');
      } else {
        toast.error(error.data?.message || 'Failed to impersonate user');
      }
    }
  };

  const handleImpersonationOtpVerification = async () => {
    if (!impersonateTarget) return;

    try {
      const response = await impersonate({
        userId: impersonateTarget.id,
        email: impersonateTarget.email,
        otp: impersonateOtp
      }).unwrap();

      if (response.status) {
        handleImpersonationSuccess(response);
        setIsImpersonateOtpModalVisible(false);
        setImpersonateOtp("");
      } else {
        toast.error(response.message || 'Invalid OTP');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error(error.data?.message || 'Invalid OTP');
    }
  };

  const handleImpersonationSuccess = useCallback((response: any) => {
    // Reset all API cache before switching
    dispatch(api.util.resetApiState());

    // Store original user data in localStorage
    localStorage.setItem('originalUser', JSON.stringify({
      token: response.originalToken,
      user: response.originalUser
    }));

    // Set new user data
    dispatch(setAccessToken(response.token));
    dispatch(setUser(response.user));

    // Navigate to dashboard
    navigate('/');
    toast.success('Successfully impersonating user');
  }, [dispatch, navigate]);

  useEffect(() => {
    const autoVerify = async () => {
      if (impersonateOtp.length === 6 && isImpersonateOtpModalVisible && impersonateTarget) {
        try {
          const response = await impersonate({
            userId: impersonateTarget.id,
            email: impersonateTarget.email,
            otp: impersonateOtp
          }).unwrap();

          if (response.status) {
            handleImpersonationSuccess(response);
            setIsImpersonateOtpModalVisible(false);
            setImpersonateOtp("");
          } else {
            toast.error(response.message || 'Invalid OTP');
          }
        } catch (error: any) {
          console.error('OTP verification error:', error);
          toast.error(error.data?.message || 'Invalid OTP');
        }
      }
    };

    autoVerify();
  }, [impersonateOtp, isImpersonateOtpModalVisible, impersonateTarget, impersonate, handleImpersonationSuccess]);

  const handleResendImpersonationOtp = async () => {
    try {
      // Get current user email from Redux store or localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await resendImpersonateOtp({
        email: currentUser.email,
        purpose: 'impersonate'
      }).unwrap();

      if (response.status) {
        toast.success('OTP resent successfully');
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      toast.error(error.data?.message || 'Failed to resend OTP');
    }
  };

  const handleForceClockOut = (record: DataType) => {
    setClockOutTarget(record);
    setIsClockOutModalVisible(true);
  };

  const confirmForceClockOut = async () => {
    if (!clockOutTarget) return;
    try {
      const response = await forceClockOut({ userId: Number(clockOutTarget.id) }).unwrap();
      if (response.status) {
        toast.success(`${clockOutTarget.name} has been clocked out successfully`);
      } else {
        toast.error(response.message || "Failed to clock out user");
      }
    } catch (error: any) {
      toast.error(error.data?.message || "Failed to clock out user");
    } finally {
      setIsClockOutModalVisible(false);
      setClockOutTarget(null);
    }
  };

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">User List</h1>
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          <div className="flex items-center gap-1">
            {userFilterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setUserFilter(tab.id)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                  userFilter === tab.id ? "bg-[#9F8667] text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="relative flex-shrink-0" style={{ width: 170 }}>
            <FaSearch className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: 10, left: 8 }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ paddingLeft: 26, paddingRight: searchText ? 22 : 8, paddingTop: 4, paddingBottom: 4, width: "100%" }}
            />
            {searchText && (
              <button type="button" onClick={() => setSearchText("")} className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" style={{ right: 6 }}>
                <FaTimes />
              </button>
            )}
          </div>
          {hasPermissionForSlug("create-user") && (
            <NavLink to="/dashboard/super-admin/user-management/crate-and-update-user" className="primary-btn">Create New</NavLink>
          )}
          {hasPermissionForSlug("delete-user") && (
            <button onClick={handleDeleteMultipleClick} className="cancel-btn">Delete Selected</button>
          )}
        </div>

        <div>
          {isLoading ? (
            <TableLoader />
          ) : (
            <Table
              rowSelection={rowSelection}
              rowKey="uuid"
              scroll={{ x: "max-content" }}
              columns={columns}
              dataSource={tableSourceData}
              pagination={{ pageSize: 20 }}
              onChange={handleChange}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Deletion"
        open={isModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={confirmDelete}
            style={{ marginLeft: "8px" }}
          >
            Confirm
          </Button>,
          <Button key="cancel" onClick={cancelDelete}>
            Cancel
          </Button>,
        ]}
      >
        <p>Are you sure you want to delete this user?</p>
      </Modal>

      {/* Delete Multiple Confirmation Modal */}
      <Modal
        title="Confirm Deletion"
        open={isDeleteMultipleModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button key="cancel" onClick={cancelDelete}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={handleDeleteConfirmMultiple}
          >
            Confirm
          </Button>,
        ]}
      >
        Are you sure you want to delete selected items?
      </Modal>

      {/* Toggle User Status Confirmation Modal */}
      <Modal
        title="Confirm Status Change"
        open={isToggleModalVisible}
        onOk={handleToggleConfirm}
        onCancel={handleToggleCancel}
        okText="Confirm"
        cancelText="Cancel"
        okType="primary"
        confirmLoading={isToggling}
      >
        {currentToggleUser && (
          <div>
            <p>
              Are you sure you want to{" "}
              <strong>
                {currentToggleUser.currentStatus ? "deactivate" : "activate"}
              </strong>{" "}
              the user <strong>"{currentToggleUser.name}"</strong>?
            </p>
            {currentToggleUser.currentStatus ? (
              <p style={{ color: "#ff4d4f", marginTop: "10px" }}>
                {"⚠️"} Warning: Deactivating this user will prevent them from
                accessing the system.
              </p>
            ) : (
              <p style={{ color: "#52c41a", marginTop: "10px" }}>
                {"✅"} Note: Activating this user will grant them system access.
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Force Clock Out Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-orange-600">
            <FaSignOutAlt />
            Force Clock Out
          </div>
        }
        open={isClockOutModalVisible}
        onCancel={() => { setIsClockOutModalVisible(false); setClockOutTarget(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setIsClockOutModalVisible(false); setClockOutTarget(null); }}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            loading={isClockingOut}
            onClick={confirmForceClockOut}
          >
            Clock Out Now
          </Button>,
        ]}
      >
        {clockOutTarget && (
          <div className="py-2">
            <p className="text-gray-700">
              Are you sure you want to force clock out{" "}
              <strong>{clockOutTarget.name}</strong>?
            </p>
            <p className="text-orange-500 text-sm mt-2">
              ⚠ This will immediately end their active clock-in session.
            </p>
          </div>
        )}
      </Modal>

      {/* Impersonation OTP Verification Modal */}
      <Modal
        title="Impersonation Verification"
        open={isImpersonateOtpModalVisible}
        onCancel={() => {
          setIsImpersonateOtpModalVisible(false);
          setImpersonateOtp("");
        }}
        width={500}
        footer={[
          <Button
            key="resend"
            onClick={handleResendImpersonationOtp}
            type="default"
          >
            Resend OTP
          </Button>,
          <Button
            key="verify"
            type="primary"
            className='primary-btn'
            onClick={handleImpersonationOtpVerification}
            disabled={impersonateOtp.length !== 6}
          >
            Verify OTP
          </Button>,
        ]}
      >
        <div className="p-4">
          <p className="text-gray-600">
            Enter the 6-digit OTP sent to your phone number to verify impersonation
          </p>

          <div className="my-4">
            <input
              type="text"
              value={impersonateOtp}
              onChange={(e) => setImpersonateOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (impersonateOtp.length === 6) handleImpersonationOtpVerification();
                }
              }}
              placeholder="Enter OTP"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primaryPurple"
              maxLength={6}
            />
          </div>

          <p className="text-sm text-gray-500 mt-4">
            This extra security step ensures only authorized superadmins can impersonate users.
          </p>
        </div>
      </Modal>

      <style jsx>{`
        .active-switch :global(.ant-switch-checked) {
          background-color: #52c41a;
        }

        .inactive-switch :global(.ant-switch) {
          background-color: #d9d9d9;
        }
      `}</style>
    </div>
  );
};

export default CreateAndUpdateUser;
