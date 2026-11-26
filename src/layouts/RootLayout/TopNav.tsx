// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useEffect, useState } from 'react';

import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  MenuProps,
} from 'antd';
import toast from 'react-hot-toast';
import {
  FaExchangeAlt,
  FaUserSecret,
} from 'react-icons/fa';
import {
  FiBell,
  FiCalendar,
} from 'react-icons/fi';
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';

// @ts-nocheck
import {
  AlignLeftOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';

import { api } from '../../redux/api/apiSlice';
import {
  useGetClockStatusQuery,
  useClockOutMutation,
} from '../../redux/api/common/clockInOutSlice';
import {
  useDeleteMultipleNotificationsMutation,
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
} from '../../redux/api/common/notificationSlice';
import { useUserLogoutMutation } from '../../redux/api/userSlice';
import {
  useAppDispatch,
  useAppSelector,
} from '../../redux/hooks';
import {
  clearUser,
  setAccessToken,
  setUser,
} from '../../redux/slices/userSlice';
import { useSocket } from '../../sockets/socket';
import { baseUrl, getFileUrl } from '../../utils/constant';

const TopNav = ({ sidebarCollapsed, setSidebarCollapsed, setIsModalOpen }) => {
  const location = useLocation();
  const { data, refetch } = useGetNotificationsQuery();
  const { data: clockStatusData, refetch: refetchClockStatus } = useGetClockStatusQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const isClockedIn = clockStatusData?.data?.isClockedIn ?? false;
  const lastRecord = clockStatusData?.data?.lastRecord;
  const [clockedInDuration, setClockedInDuration] = useState('');
  const [clockOut, { isLoading: isClockOutLoading }] = useClockOutMutation();
  const isLastClockInRemote = Boolean(
    lastRecord?.action === 'clock_in' &&
      (lastRecord?.latitude == null ||
        lastRecord?.latitude === '' ||
        lastRecord?.longitude == null ||
        lastRecord?.longitude === '')
  );
  const [deleteNotification] = useDeleteNotificationMutation();
  const [deleteMultipleNotifications] =
    useDeleteMultipleNotificationsMutation();
  const { socket, connectSocket } = useSocket();

  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.user);
  const navigate = useNavigate();
  const [userLogout] = useUserLogoutMutation();

  useEffect(() => {
    connectSocket();
    socket?.on("notifications", (res) => {
      if (res.users.includes(user.id)) {
        refetch();
      }
    });
  }, [connectSocket]);

  // Calculate and update clocked-in duration for navbar
  useEffect(() => {
    if (isClockedIn && lastRecord?.createdAt) {
      const updateDuration = () => {
        const clockInTime = new Date(lastRecord.createdAt);
        const now = new Date();
        const diffMs = now.getTime() - clockInTime.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        if (hours > 0) {
          setClockedInDuration(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setClockedInDuration(`${minutes}m ${seconds}s`);
        } else {
          setClockedInDuration(`${seconds}s`);
        }
      };
      updateDuration();
      const interval = setInterval(updateDuration, 1000);
      return () => clearInterval(interval);
    } else {
      setClockedInDuration('');
    }
  }, [isClockedIn, lastRecord?.createdAt]);

  const handleLogout = async () => {
    try {
      const response = await userLogout("").unwrap();
      dispatch(api.util.resetApiState());
      dispatch(clearUser());
      toast.success(`${response?.message}`);
    } catch (error: any) {
      dispatch(api.util.resetApiState());
      dispatch(clearUser());
      toast.success(`Successfully logged out`);
      <Navigate to={"/login"} />;
    }
  };

  // Handle individual notification deletion
  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id).unwrap();
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };
  const handleClick = async (msg) => {
    toast.success(msg);
  };

  // Handle bulk delete for all notifications
  const handleDeleteAll = async () => {
    const ids = data?.data?.data_list?.map((item) => item.id);
    if (ids?.length) {
      try {
        await deleteMultipleNotifications(ids).unwrap();
        toast.success("All notifications clear successfully");
      } catch (error) {
        toast.error("Failed to delete notifications");
      }
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: { 'User-Agent': 'ANS RealStateCRM-App' },
        }
      );
      if (!response.ok) return null;
      const data = await response.json();
      if (data?.address) {
        const a = data.address;
        const parts = [];
        if (a.road || a.street) parts.push(a.house_number ? `${a.house_number} ${a.road || a.street}` : (a.road || a.street));
        if (a.city || a.town || a.village) parts.push(a.city || a.town || a.village);
        if (a.state || a.region) parts.push(a.state || a.region);
        if (a.postcode) parts.push(a.postcode);
        if (a.country) parts.push(a.country);
        return parts.length > 0 ? parts.join(', ') : data.display_name || null;
      }
      return data.display_name || null;
    } catch {
      return null;
    }
  };

  const handleNavbarClockOut = async () => {
    try {
      if (isLastClockInRemote) {
        const position = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            // Small cache window to avoid jitter but not too stale
            maximumAge: 60 * 1000,
          });
        });
        const { latitude: lat, longitude: lon, accuracy } = (position as GeolocationPosition).coords;
        if (accuracy != null && accuracy > 200) {
          toast.error('Your location signal is weak. Please move closer to a window and try again.');
          return;
        }
        const address = await reverseGeocode(lat, lon);
        const remoteAddress = address
          ? (address.toLowerCase().startsWith('remote') ? address : `Remote - ${address}`)
          : `Remote - ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        await clockOut({
          remoteLocation: true,
          remoteAddress,
        }).unwrap();
      } else {
        const position = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60 * 1000,
          });
        });
        const { latitude, longitude, accuracy } = (position as GeolocationPosition).coords;
        if (accuracy != null && accuracy > 200) {
          toast.error('Your location signal is weak. Please move closer to a window and try again.');
          return;
        }
        const address = await reverseGeocode(latitude, longitude);
        await clockOut({
          latitude,
          longitude,
          address: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        }).unwrap();
      }
      toast.success('Clocked out successfully.');
      refetchClockStatus();
    } catch (err) {
      if (err?.code === 1) {
        toast.error('Location denied. Allow location access to clock out from here.');
      } else if (err?.code === 2 || err?.code === 3) {
        toast.error('Could not get your location. Please try again.');
      } else {
        toast.error(err?.data?.message || 'Failed to clock out.');
      }
    }
  };

  const handleSwitchPortal = () => {
    const originalUser = JSON.parse(
      localStorage.getItem("originalUser") || "{}"
    );

    if (originalUser.token && originalUser.user) {
      // Reset all API cache before switching
      dispatch(api.util.resetApiState());

      // Switch back to Super Admin
      dispatch(setAccessToken(originalUser.token));
      dispatch(setUser(originalUser.user));
      localStorage.removeItem("originalUser");
      navigate("/dashboard/super-admin/user-management");
      toast.success("Switched back to Super Admin portal");
    }
  };

  // avatar profile dropdown items
  const dropitems: MenuProps["items"] = [
    {
      key: "1",
      label: "My Account",
      disabled: true,
    },
    {
      type: "divider",
    },

    {
      key: "2",
      label: (
        <Link to="/profile" className=" flex items-center gap-2">
          <UserOutlined /> Profile
        </Link>
      ),
    },
    {
      key: "4",
      label: (
        <button onClick={handleLogout} className=" flex items-center gap-2">
          <LogoutOutlined /> Logout
        </button>
      ),
      danger: true,
    },
  ];

  const notifications: MenuProps["items"] = Array.isArray(data?.data?.data_list)
    ? data.data.data_list.map((item: any, index: number) => {
      const parsedData = JSON.parse(item.data); // Parse the `data` field
      return {
        key: item.id || `notification-${index}`, // Ensure unique key
        label: (
          <div
            className="flex justify-between items-center"
            onClick={() => handleDelete(item.id)}
          >
            <Link
              to={parsedData.url === "#" ? location.pathname : parsedData.url}
              onClick={
                parsedData.url == "#"
                  ? () => handleClick(parsedData.message)
                  : undefined
              }
              className="block no-underline flex gap-3 xl:w-64"
            >
              <Avatar
                className="flex-shrink-0"
                size="large"
                icon={<UserOutlined className="text-xl" />}
              />
              <div>
                <h4 className="!font-semibold">{item.notifiableUser.name}</h4>
                <p className="text-gray-500">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
                <p className="text-black">{parsedData.message} </p>
              </div>
            </Link>
          </div>
        ),
      };
    })
    : [];

  return (
    <header className="py-4 pl-4 pr-4 sticky items-center top-0 border-b border-primaryPurple/10 z-50 flex justify-between bg-white">
      <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
        {sidebarCollapsed ? <AlignLeftOutlined /> : <AlignLeftOutlined />}
      </button>

      {/* User Information Section */}
      <div className="flex flex-col xl:flex-row  gap-4">
        {user && (
          <h2 className="flex items-center gap-1 !m-0">
            Welcome,
            <h2 className="!m-0"> {user.name} </h2> to
            <h2 className="text-[#0b3b38] font-bold !m-0">
              {user.userType === "agent" && " Agent"}
              {user.userType === "client" && " Client"}
              {user.userType === "admin" && " Admin"}
              {user.userType === "superAdmin" && " Super Admin"}
              {user?.userRole?.name === "Support" && "Support"}
            </h2>{" "}
            Dashboard
            {user?.branch?.name && (
              <span className="inline-flex items-center px-2 py-0.5 ml-2 rounded-full text-sm font-medium bg-[#F4F5F7] text-[#354052] border border-[#C5C9D1] shadow-sm">
                {user.branch.name}
              </span>
            )}
          </h2>
        )}

        {/* Eye Focus Training Mode Banner */}
        {window.location.hostname.includes("dev.dvrealty.ca") && (
          <div className="mt-0">
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium text-center">
              You are now in training mode.
              <span
                onClick={() =>
                  (window.location.href = "http://hub.dvrealty.ca/")
                }
                className="text-[#0b3b38] ml-2 cursor-pointer hover:underline"
              >
                Switch to hub.dvrealty.ca
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Avatar Section */}
      <div className="flex items-center gap-5">
        {isClockedIn && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
            <ClockCircleOutlined className="text-green-600 text-sm" />
            <span className="text-sm font-medium text-green-800 whitespace-nowrap">
              Clocked In
            </span>
            {clockedInDuration && (
              <span className="text-xs text-green-600/90 whitespace-nowrap">
                ({clockedInDuration})
              </span>
            )}
            <Button
              type="primary"
              size="small"
              danger
              className="!text-xs !h-7 !px-2"
              loading={isClockOutLoading}
              onClick={handleNavbarClockOut}
            >
              Clock Out
            </Button>
          </div>
        )}
        {localStorage.getItem("originalUser") && (
          <button
            onClick={handleSwitchPortal}
            className="flex items-center gap-2 px-4 py-2 bg-[#072f2d] text-white rounded-lg hover:bg-[#182843]"
          >
            <FaExchangeAlt />
            Switch to Super Admin
          </button>
        )}
        <button onClick={() => setIsModalOpen(true)} className="ml-3">
          <FiCalendar className="text-xl mb-2" />
        </button>
        <div>
          <Dropdown
            className="cursor-pointer "
            overlayClassName="h-[400px] overflow-hidden"
            menu={{
              items: [
                {
                  key: "delete-all",
                  label: (
                    <Button
                      type="text"
                      onClick={handleDeleteAll}
                      className="block w-full flex justify-end text-left"
                    >
                      Clear All
                    </Button>
                  ),
                },
                ...notifications,
              ],
            }}
          >
            <Badge count={data?.data?.data_list?.length} showZero size="small">
              <FiBell className="text-xl" />
            </Badge>
            {/* New icon to trigger ClosingDatePopup */}
          </Dropdown>
        </div>
        <Dropdown menu={{ items: dropitems }} className="cursor-pointer">
          {user?.profilePicture ? (
            <div className="w-[40px] h-[40px] rounded-full overflow-hidden">
              <img
                className="w-full h-full"
                src={getFileUrl(user?.profilePicture)}
                alt=""
              />
            </div>
          ) : (
            <Avatar
              size="large"
              icon={<UserOutlined />}
              className="bg-primaryPurple"
            />
          )}
        </Dropdown>
      </div>
    </header>
  );
};

export default TopNav;
