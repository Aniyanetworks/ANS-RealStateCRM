// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useEffect, useState } from "react";
import { Card, Alert, Spin, Select, Input, Modal, Form, Checkbox, Tabs, Switch } from "antd";
import { formatDate, parseISO } from "date-fns";
import toast from "react-hot-toast";
import {
  useClockInMutation,
  useClockOutMutation,
  useGetClockStatusQuery,
  useToggleRemoteClockInOutMutation,
} from "../../redux/api/common/clockInOutSlice";
import { useGetUserListDataQuery } from "../../redux/api/superadmin/user/userManageSlice";
import { useGetActiveBranchListDataQuery } from "../../redux/api/superadmin/branch/Branchmanagementslice";
import { useAppSelector } from "../../redux/hooks";
import { ClockCircleOutlined, CheckCircleOutlined, HistoryOutlined } from "@ant-design/icons";
import ClockHistoryTab from "./clock-in-out/ClockHistoryTab";
import ClockInReportTab from "./clock-in-out/ClockInReportTab";
import ScheduleTab from "./clock-in-out/ScheduleTab";

const ClockInOut = () => {
  const { user } = useAppSelector((state) => state.user);
  const isSuperAdmin = user?.roleId == 1 || user?.userType === 'superAdmin';
  const PRIVILEGED_ADMIN_EMAILS = ['admin@dvrealty.ca', 'nabaa@dvrealty.ca', 'superadmin@nomail.com'];
  const isMainBranchSuperAdmin = user?.userType === 'superAdmin' && PRIVILEGED_ADMIN_EMAILS.includes(user?.email);
  
  const [location, setLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    accuracy: number | null;
  }>({
    latitude: null,
    longitude: null,
    address: null,
    accuracy: null,
  });
  
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedBranchIdForClock, setSelectedBranchIdForClock] = useState<number | undefined>(undefined);

  const { data: statusData, isLoading: isStatusLoading, refetch: refetchStatus, error: statusError } =
    useGetClockStatusQuery(selectedBranchIdForClock ?? user?.branchId ?? undefined, {
      refetchOnMountOrArgChange: true,
    });

  const { data: userListData } = useGetUserListDataQuery("", {
    skip: !isSuperAdmin,
  });

  const { data: branchListData } = useGetActiveBranchListDataQuery(undefined, {
    skip: !isSuperAdmin,
  });
  const branchList = branchListData?.data?.branchData ?? branchListData?.data ?? [];

  const [clockIn, { isLoading: isClockInLoading }] = useClockInMutation();
  const [clockOut, { isLoading: isClockOutLoading }] = useClockOutMutation();
  const [toggleRemote, { isLoading: isTogglingRemote }] = useToggleRemoteClockInOutMutation();

  const remoteLocationEnabled = statusData?.data?.remoteClockInOutEnabled ?? false;

  const [isClockInModalVisible, setIsClockInModalVisible] = useState(false);
  const [isClockOutModalVisible, setIsClockOutModalVisible] = useState(false);
  const [clockInForm] = Form.useForm();
  const [clockOutForm] = Form.useForm();
  const remoteClockIn = Form.useWatch("remoteLocation", clockInForm);
  const remoteClockOut = Form.useWatch("remoteLocation", clockOutForm);
  const [clockedInDuration, setClockedInDuration] = useState<string>("");

  const isClockedIn = statusData?.data?.isClockedIn || false;
  const lastRecord = statusData?.data?.lastRecord;
  const isLastClockInRemote = Boolean(
    lastRecord?.action === "clock_in" &&
      (lastRecord?.latitude == null ||
        lastRecord?.latitude === "" ||
        lastRecord?.longitude == null ||
        lastRecord?.longitude === "")
  );
  const requiredLocation = statusData?.data?.requiredLocation || "";
  const allowedDistance = statusData?.data?.allowedDistance || 50;
  const requiredLat = statusData?.data?.latitude != null ? Number(statusData.data.latitude) : null;
  const requiredLon = statusData?.data?.longitude != null ? Number(statusData.data.longitude) : null;

  const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const distanceToRequired =
    location.latitude != null &&
    location.longitude != null &&
    requiredLat != null &&
    requiredLon != null
      ? Math.round(calculateDistanceMeters(location.latitude, location.longitude, requiredLat, requiredLon))
      : null;
  const isWithinRange =
    distanceToRequired != null && allowedDistance != null ? distanceToRequired <= allowedDistance : false;
  const locationAccuracyOk = location.accuracy == null || location.accuracy <= 150;
  const canClockInOut = Boolean(
    location.latitude != null && location.longitude != null &&
    locationAccuracyOk &&
    (requiredLat == null || isWithinRange)
  );

  const selectedBranchClockSettings = (() => {
    if (selectedBranchIdForClock == null) return null;
    const branch = branchList?.find((b: any) => (b.id ?? b.branchId) === selectedBranchIdForClock);
    return branch?.clockInOutSettings?.[0] ?? null;
  })();
  const modalRequiredLat = selectedBranchClockSettings?.latitude != null
    ? Number(selectedBranchClockSettings.latitude)
    : requiredLat;
  const modalRequiredLon = selectedBranchClockSettings?.longitude != null
    ? Number(selectedBranchClockSettings.longitude)
    : requiredLon;
  const modalAllowedDistance = selectedBranchClockSettings?.allowedDistance != null
    ? Number(selectedBranchClockSettings.allowedDistance)
    : allowedDistance;
  const hasBranchCoords =
    !isSuperAdmin ||
    selectedBranchClockSettings != null ||
    (selectedBranchIdForClock != null && modalRequiredLat != null && modalRequiredLon != null);
  const modalDistanceToRequired =
    hasBranchCoords &&
    location.latitude != null && location.longitude != null &&
    modalRequiredLat != null && modalRequiredLon != null
      ? Math.round(calculateDistanceMeters(location.latitude, location.longitude, modalRequiredLat, modalRequiredLon))
      : null;
  const modalWithinRange = modalDistanceToRequired != null
    ? modalDistanceToRequired <= (modalAllowedDistance ?? 100)
    : (requiredLat == null || !hasBranchCoords);

  const allowedRoleNames = ["Branch Admin", "Super Admin"];
  const filteredUserList = userListData?.data?.userData?.filter((userItem: any) => {
    const roleName =
      userItem?.userRole?.name ?? userItem?.user?.userRole?.name ?? userItem?.role?.name ?? "";
    if (!allowedRoleNames.includes(roleName)) return false;
    if (isSuperAdmin && user?.branchId) {
      return userItem.branchId === user.branchId || userItem.user?.branchId === user.branchId;
    }
    return true;
  }) || [];

  const reverseGeocode = async (latitude: number, longitude: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'ANS RealStateCRM-App'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        const addressParts = [];
        
        if (addr.road || addr.street) {
          addressParts.push(addr.road || addr.street);
        }
        if (addr.house_number) {
          addressParts[0] = `${addr.house_number} ${addressParts[0] || ''}`.trim();
        }
        if (addr.city || addr.town || addr.village) {
          addressParts.push(addr.city || addr.town || addr.village);
        }
        if (addr.state || addr.region) {
          addressParts.push(addr.state || addr.region);
        }
        if (addr.postcode) {
          addressParts.push(addr.postcode);
        }
        if (addr.country) {
          addressParts.push(addr.country);
        }

        return addressParts.length > 0 
          ? addressParts.join(', ') 
          : data.display_name || null;
      }

      return data.display_name || null;
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      return null;
    }
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setIsGettingLocation(false);
      return;
    }

    const GOOD_ACCURACY_M = 100;
    const MAX_ACCURACY_M = 500;
    const COLLECT_MS = 12000;

    let watchId: number | null = null;
    let bestPosition: GeolocationPosition | null = null;
    let finished = false;

    const applyPosition = async (pos: GeolocationPosition) => {
      finished = true;
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      const { latitude, longitude, accuracy } = pos.coords;
      let address: string | null = null;
      try {
        address = await reverseGeocode(latitude, longitude);
        if (!address) address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      } catch {
        address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }
      setLocation({ latitude, longitude, address, accuracy: Math.round(accuracy) });
      setIsGettingLocation(false);
    };

    const fallbackTimer = setTimeout(() => {
      if (finished) return;
      if (bestPosition) {
        applyPosition(bestPosition);
      } else {
        finished = true;
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        const msg = "Could not get a precise location. Please try again or use Remote location.";
        setLocationError(msg);
        setIsGettingLocation(false);
      }
    }, COLLECT_MS);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (finished) return;
        const acc = pos.coords.accuracy;

        if (acc > MAX_ACCURACY_M) return;

        if (!bestPosition || acc < bestPosition.coords.accuracy) {
          bestPosition = pos;
        }

        if (acc <= GOOD_ACCURACY_M) {
          clearTimeout(fallbackTimer);
          applyPosition(pos);
        }
      },
      (err) => {
        if (finished) return;
        clearTimeout(fallbackTimer);
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);

        if (bestPosition) {
          applyPosition(bestPosition);
          return;
        }

        finished = true;
        let errorMessage = "Failed to get your location. ";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage += "Please allow location access in your browser settings.";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case err.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
            break;
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (user?.branchId != null && selectedBranchIdForClock == null) {
      setSelectedBranchIdForClock(user.branchId);
    }
  }, [user?.branchId, selectedBranchIdForClock]);

  useEffect(() => {
    if (isClockedIn && statusData?.data?.lastRecord?.createdAt) {
      const updateDuration = () => {
        const clockInTime = parseISO(statusData.data.lastRecord.createdAt);
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
      setClockedInDuration("");
    }
  }, [isClockedIn, statusData?.data?.lastRecord?.createdAt]);

  const handleClockInClick = () => {
    clockInForm.setFieldsValue({
      branchId: selectedBranchIdForClock ?? user?.branchId,
      remoteLocation: false,
    });
    setIsClockInModalVisible(true);
  };

  const handleClockIn = async () => {
    try {
      const values = await clockInForm.validateFields();
      const isRemote = values.remoteLocation === true;

      if (!isRemote) {
        if (!location.latitude || !location.longitude) {
          toast.error("Please allow location access to clock in, refresh your location, or check Remote location.");
          return;
        }
        if (!modalWithinRange && modalRequiredLat != null && modalRequiredLon != null) {
          toast.error(
            `You are ${modalDistanceToRequired}m away. You must be within ${modalAllowedDistance}m of the required location, or check Remote location.`,
            { duration: 5000 }
          );
          return;
        }
      }

      const branchId = isSuperAdmin ? (values.branchId ?? selectedBranchIdForClock ?? user?.branchId) : user?.branchId;
      const result = await clockIn({
        ...(isRemote
          ? {
              remoteLocation: true,
              notes: values.notes || undefined,
              remoteAddress: values.remoteAddress?.trim() || undefined,
            }
          : {
              latitude: location.latitude!,
              longitude: location.longitude!,
              address: location.address || undefined,
              notes: values.notes || undefined,
            }),
        ...(branchId != null && { branchId }),
      }).unwrap();

      if (result.status) {
        toast.success(result.message || "Clocked in successfully!");
        setIsClockInModalVisible(false);
        clockInForm.resetFields();
        refetchStatus();
      }
    } catch (error: any) {
      if (error?.data?.message) {
        toast.error(error.data.message);
      } else if (error?.data?.data?.distance) {
        toast.error(
          `You are ${error.data.data.distance} meters away. Please be within ${error.data.data.allowedDistance} meters of the required location.`,
          { duration: 5000 }
        );
      } else {
        toast.error("Failed to clock in. Please try again.");
      }
    }
  };

  const handleClockOutClick = () => {
    const mustClockOutRemote = isLastClockInRemote;
    clockOutForm.setFieldsValue({
      branchId: selectedBranchIdForClock ?? lastRecord?.branchId ?? user?.branchId,
      remoteLocation: mustClockOutRemote,
      remoteAddress: mustClockOutRemote ? (lastRecord?.address || location.address || (location.latitude != null && location.longitude != null ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : "")) : undefined,
    });
    setIsClockOutModalVisible(true);
  };

  const handleClockOut = async () => {
    try {
      const values = await clockOutForm.validateFields();
      const isRemote = values.remoteLocation === true;

      if (!isRemote) {
        if (!location.latitude || !location.longitude) {
          toast.error("Please allow location access to clock out, refresh your location, or check Remote location.");
          return;
        }
        if (!modalWithinRange && modalRequiredLat != null && modalRequiredLon != null) {
          toast.error(
            `You are ${modalDistanceToRequired}m away. You must be within ${modalAllowedDistance}m of the required location, or check Remote location.`,
            { duration: 5000 }
          );
          return;
        }
      }

      const branchId = isSuperAdmin
        ? (values.branchId ?? selectedBranchIdForClock ?? lastRecord?.branchId ?? user?.branchId)
        : (user?.branchId ?? lastRecord?.branchId);
      const result = await clockOut({
        ...(isRemote
          ? {
              remoteLocation: true,
              notes: values.notes || undefined,
              remoteAddress: values.remoteAddress?.trim() || undefined,
            }
          : {
              latitude: location.latitude!,
              longitude: location.longitude!,
              address: location.address || undefined,
              notes: values.notes || undefined,
            }),
        ...(branchId != null && { branchId }),
      }).unwrap();

      if (result.status) {
        toast.success(result.message || "Clocked out successfully!");
        setIsClockOutModalVisible(false);
        clockOutForm.resetFields();
        refetchStatus();
      }
    } catch (error: any) {
      if (error?.data?.message) {
        toast.error(error.data.message);
      } else if (error?.data?.data?.distance) {
        toast.error(
          `You are ${error.data.data.distance} meters away. Please be within ${error.data.data.allowedDistance} meters of the required location.`,
          { duration: 5000 }
        );
      } else {
        toast.error("Failed to clock out. Please try again.");
      }
    }
  };

  return (
    <div className="pb-32">
      <div className="mb-5 p-1">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Clock In/Out</h1>
          {isMainBranchSuperAdmin && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Allow Remote Clock-In/Out</span>
              <Switch
                checked={remoteLocationEnabled}
                loading={isTogglingRemote}
                onChange={async (checked) => {
                  try {
                    await toggleRemote({ enabled: checked }).unwrap();
                  } catch {
                    toast.error("Failed to update remote clock-in/out setting.");
                  }
                }}
                size="small"
              />
            </div>
          )}
        </div>
        {statusError && (
          <Alert
            message="Error Loading Settings"
            description="Unable to load clock-in/out settings. Please refresh the page."
            type="error"
            showIcon
            className="mb-4"
          />
        )}
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isStatusLoading ? (
              <Spin />
            ) : (
              <>
                {isClockedIn ? (
                  <div className="flex items-center gap-2">
                    <CheckCircleOutlined className="text-green-500 text-2xl" />
                    <div>
                      <p className="font-semibold text-green-600">Currently Clocked In</p>
                      <p className="text-sm text-gray-500">
                        Last clock in:{" "}
                        {statusData?.data?.lastRecord?.createdAt
                          ? formatDate(
                              parseISO(statusData.data.lastRecord.createdAt),
                              "dd MMM yyyy, hh:mm a"
                            )
                          : "N/A"}
                      </p>
                      {clockedInDuration && (
                        <p className="text-sm font-medium text-green-600">
                          Duration: {clockedInDuration}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ClockCircleOutlined className="text-gray-400 text-2xl" />
                    <div>
                      <p className="font-semibold text-gray-600">Currently Clocked Out</p>
                      <p className="text-sm text-gray-500">Ready to clock in</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="primary-btn-ghost flex items-center gap-2"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
            >
              <HistoryOutlined />
              <span>{isGettingLocation ? "Refreshing..." : "Refresh Location"}</span>
            </button>
            {!isClockedIn ? (
              <button
                type="button"
                className="primary-btn flex items-center gap-2"
                onClick={handleClockInClick}
                disabled={isClockInLoading}
              >
                {isClockInLoading ? (
                  <span>Clocking In...</span>
                ) : (
                  <>
                    <CheckCircleOutlined />
                    <span>Clock In</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                className="danger-btn flex items-center gap-2"
                onClick={handleClockOutClick}
                disabled={isClockOutLoading}
              >
                {isClockOutLoading ? (
                  <span>Clocking Out...</span>
                ) : (
                  <>
                    <ClockCircleOutlined />
                    <span>Clock Out</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {locationError && (
          <Alert
            message="Location Error"
            description={locationError}
            type="error"
            showIcon
            className="mt-4"
                action={
                  <button type="button" className="primary-btn text-[10px] py-1 px-3" onClick={getCurrentLocation}>
                    Retry
                  </button>
                }
          />
        )}

        {location.latitude && location.longitude && !locationError && (
          <Alert
            message={
              <span className="text-sm font-medium">
                {modalRequiredLat != null && modalRequiredLon != null
                  ? modalWithinRange
                    ? "Location confirmed – within range"
                    : "Location ready – out of range"
                  : "Location Ready"}
              </span>
            }
            description={
              <div className="text-xs leading-tight">
                {location.address ? (
                  <div>
                    <span className="font-medium">{location.address}</span>
                    <span className="text-gray-500 ml-2">
                      ({location.latitude.toFixed(6)}, {location.longitude.toFixed(6)})
                    </span>
                    <div className="mt-1 flex flex-wrap gap-x-4">
                      {modalDistanceToRequired != null && (
                        <span>
                          Distance to office: <strong>{modalDistanceToRequired}m</strong>
                          {modalAllowedDistance != null && (
                            modalWithinRange
                              ? <span className="text-green-600"> ✓ within range</span>
                              : <span className="text-red-500"> (must be within {modalAllowedDistance}m)</span>
                          )}
                        </span>
                      )}
                      {location.accuracy != null && (
                        <span className={location.accuracy <= 100 ? "text-green-600" : "text-orange-500"}>
                          GPS accuracy: ±{location.accuracy}m
                          {location.accuracy > 100 ? " – signal weak, try refreshing" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <span>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
                )}
              </div>
            }
            type={modalRequiredLat != null && modalRequiredLon != null ? (modalWithinRange ? "success" : "warning") : "success"}
            showIcon
            className="mt-4 py-2"
            style={{ padding: '8px 12px' }}
          />
        )}

        {!location.latitude && !locationError && (
          <Alert
            message="Getting Location..."
            description="Please wait while we get your current location."
            type="info"
            showIcon
            className="mt-4"
          />
        )}
      </Card>

      <Tabs
        defaultActiveKey="clock"
        className="mb-6"
        items={[
          {
            key: "clock",
            label: "Clock History",
            children: (
              <ClockHistoryTab
                branchList={branchList}
                filteredUserList={filteredUserList}
                isSuperAdmin={isSuperAdmin}
                user={user}
              />
            ),
          },
          {
            key: "report",
            label: "Clock-In Report",
            children: (
              <ClockInReportTab
                branchList={branchList}
                filteredUserList={filteredUserList}
                isSuperAdmin={isSuperAdmin}
              />
            ),
          },
          {
            key: "schedule",
            label: "Schedule",
            children: (
              <ScheduleTab
                branchList={branchList}
                filteredUserList={filteredUserList}
                user={user}
                isSuperAdmin={isSuperAdmin}
              />
            ),
          },
        ]}
      />

      <Modal
        title="Clock In"
        open={isClockInModalVisible}
        onCancel={() => {
          setIsClockInModalVisible(false);
          clockInForm.resetFields();
          setSelectedBranchIdForClock(undefined);
        }}
        footer={[
          <button
            key="cancel"
            className="cancel-btn mx-2"
            onClick={() => {
              setIsClockInModalVisible(false);
              clockInForm.resetFields();
              setSelectedBranchIdForClock(undefined);
            }}
          >
            Cancel
          </button>,
          <button
            key="submit"
            className="primary-btn mx-2"
            onClick={handleClockIn}
            disabled={isClockInLoading}
          >
            {isClockInLoading ? "Clocking In..." : "Clock In"}
          </button>,
        ]}
      >
        <Form
          form={clockInForm}
          layout="vertical"
          className="mt-4"
          initialValues={{ branchId: selectedBranchIdForClock ?? user?.branchId, remoteLocation: false }}
        >
          {remoteLocationEnabled && (
            <Form.Item name="remoteLocation" valuePropName="checked">
              <Checkbox
                onChange={(e) => {
                  if (e.target.checked) {
                    const addr =
                      location.address ||
                      (location.latitude != null && location.longitude != null
                        ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                        : "");
                    clockInForm.setFieldValue("remoteAddress", addr);
                  }
                }}
              >
                Remote location (work from home / no location or distance required)
              </Checkbox>
            </Form.Item>
          )}
          {isSuperAdmin && branchList?.length > 0 && !remoteClockIn && (
            <Form.Item
              label="Branch"
              name="branchId"
              rules={[{ required: true, message: "Please select a branch" }]}
            >
              <Select
                placeholder="Select branch"
                allowClear={false}
                onChange={(v) => setSelectedBranchIdForClock(v ?? undefined)}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
                }
                options={branchList.map((b: any) => ({
                  value: b.id ?? b.branchId,
                  label: b.name ?? b.branchName ?? `Branch ${b.id ?? b.branchId}`,
                }))}
              />
            </Form.Item>
          )}
          {!remoteClockIn && (
            <Alert
              message={
                location.latitude && location.longitude
                  ? location.accuracy != null && location.accuracy > 150
                    ? "Weak GPS signal – please refresh"
                    : modalDistanceToRequired != null
                      ? modalWithinRange ? "Location confirmed – within range" : "Out of range"
                      : "Location confirmed"
                  : isGettingLocation ? "Acquiring GPS fix…" : "Location unavailable"
              }
              description={
                location.latitude && location.longitude ? (
                  <div className="space-y-0.5">
                    <div className="text-sm">{location.address || `${location.latitude?.toFixed(6)}, ${location.longitude?.toFixed(6)}`}</div>
                    <div className="text-xs text-gray-500">
                      Coordinates: {location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}
                    </div>
                    {modalDistanceToRequired != null && (
                      <div className={`text-xs font-medium ${modalWithinRange ? "text-green-600" : "text-red-500"}`}>
                        Distance to branch: {modalDistanceToRequired}m
                        {modalWithinRange
                          ? ` ✓ within ${modalAllowedDistance}m`
                          : ` — must be within ${modalAllowedDistance}m`}
                      </div>
                    )}
                    {location.accuracy != null && (
                      <div className={`text-xs font-medium ${location.accuracy <= 100 ? "text-green-600" : location.accuracy <= 150 ? "text-orange-500" : "text-red-500"}`}>
                        GPS accuracy: ±{location.accuracy}m
                        {location.accuracy > 150
                          ? " — too weak to clock in, please refresh location"
                          : location.accuracy > 100
                          ? " — signal weak, consider refreshing"
                          : " ✓ good"}
                      </div>
                    )}
                  </div>
                ) : (
                  "Allow location access or use Remote location to clock in."
                )
              }
              type={
                location.latitude && location.longitude
                  ? location.accuracy != null && location.accuracy > 150
                    ? "error"
                    : modalDistanceToRequired != null && !modalWithinRange
                      ? "warning"
                      : "success"
                  : "info"
              }
              showIcon
              className="mb-4"
            />
          )}
          {remoteClockIn && (
            <Form.Item
              label="Location"
              name="remoteAddress"
            >
              <Input
                placeholder="Filled with current location when available"
                maxLength={500}
                allowClear
              />
            </Form.Item>
          )}
          <Form.Item
            label="Notes (Optional)"
            name="notes"
          >
            <Input.TextArea
              rows={3}
              placeholder="Add any notes about this clock in..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Clock Out"
        open={isClockOutModalVisible}
        onOk={handleClockOut}
        onCancel={() => {
          setIsClockOutModalVisible(false);
          clockOutForm.resetFields();
        }}
        confirmLoading={isClockOutLoading}
        okText="Clock Out"
        cancelText="Cancel"
      >
        <Form
          form={clockOutForm}
          layout="vertical"
          className="mt-4"
          initialValues={{ branchId: selectedBranchIdForClock ?? user?.branchId, remoteLocation: false }}
        >
          {(remoteLocationEnabled || isLastClockInRemote) && (
          <Form.Item name="remoteLocation" valuePropName="checked">
            <Checkbox
              disabled={isLastClockInRemote}
              onChange={(e) => {
                if (e.target.checked) {
                  const addr =
                    location.address ||
                    (location.latitude != null && location.longitude != null
                      ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                      : "");
                  clockOutForm.setFieldValue("remoteAddress", addr);
                }
              }}
            >
              Remote location (work from home / no location or distance required)
            </Checkbox>
          </Form.Item>
          )}
          {isSuperAdmin && branchList?.length > 0 && !remoteClockOut && (
            <Form.Item
              label="Branch"
              name="branchId"
              rules={[{ required: true, message: "Please select a branch" }]}
            >
              <Select
                placeholder="Select branch"
                allowClear={false}
                onChange={(v) => setSelectedBranchIdForClock(v ?? undefined)}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
                }
                options={branchList.map((b: any) => ({
                  value: b.id ?? b.branchId,
                  label: b.name ?? b.branchName ?? `Branch ${b.id ?? b.branchId}`,
                }))}
              />
            </Form.Item>
          )}
          {statusData?.data?.lastRecord?.createdAt && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                <strong>Clocked in since:</strong>{" "}
                {formatDate(parseISO(statusData.data.lastRecord.createdAt), "dd MMM yyyy, hh:mm a")}
              </p>
              {clockedInDuration && (
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Total duration:</strong> {clockedInDuration}
                </p>
              )}
            </div>
          )}
          {!remoteClockOut && (
            <Alert
              message={
                location.latitude && location.longitude
                  ? location.accuracy != null && location.accuracy > 150
                    ? "Weak GPS signal – please refresh"
                    : "Location confirmed"
                  : isGettingLocation ? "Acquiring GPS fix…" : "Location unavailable"
              }
              description={
                location.latitude && location.longitude ? (
                  <div className="space-y-0.5">
                    <div className="text-sm">{location.address || `${location.latitude?.toFixed(6)}, ${location.longitude?.toFixed(6)}`}</div>
                    <div className="text-xs text-gray-500">
                      Coordinates: {location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}
                    </div>
                    {location.accuracy != null && (
                      <div className={`text-xs font-medium ${location.accuracy <= 100 ? "text-green-600" : location.accuracy <= 150 ? "text-orange-500" : "text-red-500"}`}>
                        GPS accuracy: ±{location.accuracy}m
                        {location.accuracy > 150
                          ? " — too weak to clock out, please refresh location"
                          : location.accuracy > 100
                          ? " — signal weak, consider refreshing"
                          : " ✓ good"}
                      </div>
                    )}
                  </div>
                ) : (
                  "Allow location access or use Remote location to clock out."
                )
              }
              type={
                location.latitude && location.longitude
                  ? location.accuracy != null && location.accuracy > 150 ? "error" : "success"
                  : "info"
              }
              showIcon
              className="mb-4"
            />
          )}
          {remoteClockOut && (
            <Form.Item
              label="Remote address (current location)"
              name="remoteAddress"
            >
              <Input
                placeholder="Filled with current location when available"
                maxLength={500}
                allowClear
              />
            </Form.Item>
          )}
          <Form.Item
            label="Notes (Optional)"
            name="notes"
          >
            <Input.TextArea
              rows={3}
              placeholder="Add any notes about this clock out..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default ClockInOut;
