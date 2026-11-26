/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useEffect, useState, Suspense } from "react";
import { Outlet } from "react-router-dom";

import ClosingDatePopup from "../../components/ClosingDatePopup";
import {
  useGetTradeSheetListBasedonClosingQuery,
} from "../../redux/api/agent/trade-sheet/tradeSheetSlice";
import {
  useGetPropertyListingListBasedOnExpiryQuery,
} from "../../redux/api/superadmin/propertyListingDataSlice";
import InactivityLogout from "../../components/InactivityLogout";
import { useSocket } from "../../sockets/socket";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";

const RootLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  const { connectSocket, disconnectSocket } = useSocket();

  const {
    data: tradeListData,
    isLoading: tradeLoading,
    refetch: refetchTrade,
  } = useGetTradeSheetListBasedonClosingQuery("");

  const {
    data: propertyListData,
    isLoading: propertyLoading,
    refetch: refetchProperty,
  } = useGetPropertyListingListBasedOnExpiryQuery("");

  const [tradeData, setTradeData] = useState<any[]>([]);
  const [propertyData, setPropertyData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setTradeData(tradeListData?.data?.tradeSheetData ?? []);
    setPropertyData(propertyListData?.data?.propertyListingData ?? []);

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [tradeListData, propertyListData]);

  useEffect(() => {
    connectSocket();
  }, [connectSocket, disconnectSocket]);

  const toggleCollapsed = () => setCollapsed(!collapsed);

  return (
    <div className="flex">
      <ClosingDatePopup
        tradeData={tradeData}
        propertyData={propertyData}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />

      <div
        className={`absolute lg:relative z-[999] w-[300px] h-[100dvh] overflow-hidden bg-[#0b3b38] ${sidebarCollapsed
          ? sidebarCollapsed && windowWidth < 1024
            ? "block"
            : "hidden"
          : !sidebarCollapsed && windowWidth < 1024
            ? "hidden"
            : "block"
          }`}
      >
        <Sidebar
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          collapsed={collapsed}
          handleCollapse={toggleCollapsed}
        />
      </div>

      <div
        className={`${collapsed
          ? sidebarCollapsed
            ? "w-[calc(100vw)]"
            : "lg:ml-[85px] w-[calc(100vw)]"
          : "w-full"
          } h-[100dvh] flex flex-col overflow-hidden [&>header]:shrink-0`}
      >
        <TopNav
          setIsModalOpen={setIsModalOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />

        <div className="p-5 flex-1 min-h-0 overflow-y-auto">
          <div className="pb-10">
            <Suspense fallback={<div className="flex h-64 items-center justify-center text-[13px] text-gray-400">Loading...</div>}>
              <Outlet />
            </Suspense>
          </div>
        </div>

        <InactivityLogout />
      </div>
    </div>
  );
};

export default RootLayout;
