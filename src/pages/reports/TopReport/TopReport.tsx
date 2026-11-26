// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, {
  useMemo,
  useState,
} from 'react';

import {
  DatePicker,
  Popover,
  Spin,
  Table,
  Tooltip,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';

import {
  CalendarOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

import {
  useGetTopAgentReportDataQuery,
} from '../../../redux/api/superadmin/agent/agentManagementSlice';
import { useAppSelector } from '../../../redux/hooks';
import { baseUrl, getFileUrl } from '../../../utils/constant';
import {
  formatNumberWithCommasAndDecimals,
} from '../../../utils/formatNumberWithCommasAndDecimals';

const { RangePicker } = DatePicker;

// Custom loading icon
const loadingIcon = (
  <LoadingOutlined style={{ fontSize: 48, color: "#9F8667" }} spin />
);

// Define TypeScript interfaces (same as Home.tsx)
interface Property {
  soldPrice?: string;
  salesPrice?: string;
  listingPrice?: string;
  closingDate?: string;
  propertyAddress?: string;
  mlsNumber?: string;
}

interface TradeSheet {
  id?: number;
  tradeSheetTypeId?: string;
  properties?: Property[];
  createdAt?: string;
  closingDate?: string;
  status?: string;
  tradeStatus?: string;
}

interface AgentCommission {
  agentCommissionTotal?: string;
  createdAt?: string;
  tradeSheet?: {
    id?: number;
    tradeSheetTypeId?: string;
  };
}

interface PropertyListing {
  id?: number;
  uuid?: string;
  propertyListingTypeId?: string;
  mlsNumber?: string;
  propertyAddress?: string;
  contractDate?: string;
  listingStatus?: string;
  listingPrice?: string;
  askingPrice?: string;
  city?: {
    name?: string;
  };
  state?: {
    name?: string;
  };
}

interface Agent {
  name: string;
  user?: {
    profilePicture?: string;
    userInTradeSheetSharedUser?: { tradeSheet: TradeSheet | null }[];
    tradeSheetsCreated?: TradeSheet[];
    unitsSalesTradeSheets?: TradeSheet[];
    propertyListings?: PropertyListing[];
  };
  tradeAgentCommission?: AgentCommission[];
}

interface AgentReportDataResponse {
  data?: {
    userData?: Agent[];
  };
}

interface CommissionDetail {
  commission: number;
  createdAt: string;
  tradeSheetId?: number;
  tradeSheetTypeId?: string;
}

interface TradeSheetDetail {
  id?: number;
  tradeSheetTypeId?: string;
  createdAt: string;
  closingDate?: string;
  salesPrice: number;
  soldPrice: number;
  listingPrice: number;
  totalPrice: number;
  properties?: Property[];
}

interface ListingDetail {
  id?: number;
  uuid?: string;
  propertyListingTypeId?: string;
  mlsNumber?: string;
  contractDate: string;
  propertyAddress?: string;
  listingPrice?: string;
  listingStatus?: string;
  city?: string;
  state?: string;
}

interface TopStats {
  name: string;
  totalCommission: number;
  totalUnits: number;
  totalSales: number;
  totalListings: number;
  profilePicture: string | null;
  commissionDetails?: CommissionDetail[];
  tradeSheetDetails?: TradeSheetDetail[];
  listingDetails?: ListingDetail[];
  agentId?: number;
}

// Function to calculate top statistics (same as Home.tsx)
const calculateTopStats = (data?: AgentReportDataResponse): TopStats[] => {
  if (!data?.data?.userData || !Array.isArray(data.data.userData)) {
    return [];
  }

  const agents = data.data.userData;

  const stats: TopStats[] = agents.map((agent) => {
    const tradeCommissions = agent.tradeAgentCommission || [];

    // Collect commission details
    const commissionDetails: CommissionDetail[] = tradeCommissions.map(
      (trade) => ({
        commission: parseFloat(trade.agentCommissionTotal || "0"),
        createdAt: trade.createdAt || "",
        tradeSheetId: trade.tradeSheet?.id,
        tradeSheetTypeId: trade.tradeSheet?.tradeSheetTypeId,
      })
    );

    const totalCommission = tradeCommissions.reduce(
      (sum, trade) => sum + parseFloat(trade.agentCommissionTotal || "0"),
      0
    );

    // Backend already filtered: units/sales (approved + closed + date filtered by closingDate)
    const unitsSalesTradeSheets = agent?.user?.unitsSalesTradeSheets || [];
    const fallbackTradeSheets = [
      ...(agent?.user?.userInTradeSheetSharedUser
        ?.map((trade) => trade.tradeSheet)
        .filter(Boolean) || []),
      ...(agent?.user?.tradeSheetsCreated || []),
    ];

    const allTradeSheets =
      unitsSalesTradeSheets.length > 0
        ? unitsSalesTradeSheets
        : fallbackTradeSheets;

    // Backend already filtered these (approved + closed + date by closingDate)
    const totalUnits = allTradeSheets.length;

    // Collect tradesheet details
    const tradeSheetDetails: TradeSheetDetail[] = allTradeSheets.map(
      (trade) => {
        const properties = Array.isArray(trade?.properties) ? trade.properties : [];

        const soldPrice = properties.reduce(
          (sum, property) => sum + parseFloat(property.soldPrice || "0"),
          0
        );

        const salesPrice = properties.reduce(
          (sum, property) => sum + parseFloat(property.salesPrice || "0"),
          0
        );

        const listingPrice = properties.reduce(
          (sum, property) => sum + parseFloat(property.listingPrice || "0"),
          0
        );

        const closingDate = properties[0]?.closingDate || null;

        return {
          id: trade?.id,
          tradeSheetTypeId: trade?.tradeSheetTypeId,
          createdAt: trade?.createdAt || "",
          closingDate: closingDate || "",
          salesPrice,
          soldPrice,
          listingPrice,
          totalPrice: soldPrice,
          properties,
        };
      }
    );

    const totalSales = tradeSheetDetails.reduce(
      (sum, trade) => sum + trade.soldPrice,
      0
    );

    // PROPERTY LISTINGS CALCULATION
    const propertyListings = agent?.user?.propertyListings || [];
    const listingDetails: ListingDetail[] = propertyListings.map((listing) => ({
      id: listing.id,
      uuid: listing.uuid,
      propertyListingTypeId: listing.propertyListingTypeId,
      mlsNumber: listing.mlsNumber,
      contractDate: listing.contractDate || "",
      propertyAddress: listing.propertyAddress || "",
      listingPrice: listing.listingPrice,
      listingStatus: listing.listingStatus,
      city: listing.city?.name,
      state: listing.state?.name,
    }));

    const totalListings = listingDetails.length;

    return {
      name: agent.name,
      profilePicture: agent.user?.profilePicture || null,
      totalCommission,
      totalUnits,
      totalSales,
      totalListings,
      commissionDetails,
      tradeSheetDetails,
      listingDetails,
    };
  });

  return stats;
};

const TopReport = () => {
  const { user } = useAppSelector((state) => state.user);
  const [selectedMonth, setSelectedMonth] = useState<string>("previous");
  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("units");

  // Build query parameters based on selected filter
  const buildQueryParams = () => {
    if (
      selectedMonth === "custom" &&
      dateRange &&
      dateRange[0] &&
      dateRange[1]
    ) {
      return {
        filterMonth: "custom",
        startDate: dateRange[0].format("YYYY-MM-DD"),
        endDate: dateRange[1].format("YYYY-MM-DD"),
      };
    }
    return selectedMonth;
  };

  // Pass filterMonth or custom date range to API
  const { data, isLoading, isFetching } = useGetTopAgentReportDataQuery(
    buildQueryParams()
  );

  // Calculate stats with safety check
  const statsData = React.useMemo(() => {
    if (!data || isLoading || isFetching) {
      return [];
    }
    return calculateTopStats(data);
  }, [data, isLoading, isFetching]);

  // Handle date range change
  const handleDateRangeChange = (
    dates: [Dayjs | null, Dayjs | null] | null
  ) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates);
      setSelectedMonth("custom");
    } else {
      setDateRange(null);
      if (selectedMonth === "custom") {
        setSelectedMonth("All Time");
      }
    }
  };

  // Handle preset filter click
  const handlePresetFilterClick = (
    filter: "current" | "previous" | "lastYear" | "All Time"
  ) => {
    setSelectedMonth(filter);
    setDateRange(null);
    setShowDatePicker(false);
  };

  const handleCalendarIconClick = () => {
    setShowDatePicker(!showDatePicker);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Render breakdown content for popover (same as Home.tsx)
  const renderBreakdownContent = (breakdownData: {
    type: "units" | "sales" | "listings";
    details: TradeSheetDetail[] | ListingDetail[];
    total: number;
  }) => {
    if (!breakdownData || breakdownData.details.length === 0) {
      return <div className="text-sm text-gray-500">No details available</div>;
    }

    if (breakdownData.type === "units") {
      const details = breakdownData.details as TradeSheetDetail[];
      return (
        <div className="w-96 max-h-96 overflow-y-auto">
          <div className="mb-3 pb-2 border-b">
            <h4 className="font-semibold text-gray-800">Top Units Breakdown</h4>
            <p className="text-xs text-gray-500">
              Total Units: {breakdownData.total}
            </p>
          </div>
          <div className="space-y-2">
            {details.map((detail, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-700">
                    {detail.tradeSheetTypeId
                      ? `${detail.tradeSheetTypeId}`
                      : `Tradesheet #${detail.id || index + 1}`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {detail.closingDate ? formatDate(detail.closingDate) : "N/A"}
                  </span>
                </div>
                {detail.properties && detail.properties.length > 0 ? (
                  <div className="text-xs text-gray-600 space-y-2">
                    {detail.properties.map((property, propIndex) => (
                      <div
                        key={propIndex}
                        className="pt-1 border-t border-gray-200 first:border-t-0 first:pt-0"
                      >
                        {property.propertyAddress && (
                          <div className="mb-1">
                            <span className="text-gray-500">Property:</span>{" "}
                            {property.propertyAddress}
                          </div>
                        )}
                        {(property.salesPrice || property.soldPrice) && (
                          <div className="grid grid-cols-2 gap-2">
                            {property.salesPrice && (
                              <div>
                                <span className="text-gray-500">
                                  Sales Price:
                                </span>{" "}
                                $
                                {formatNumberWithCommasAndDecimals(
                                  parseFloat(property.salesPrice || "0")
                                )}
                              </div>
                            )}
                            {property.soldPrice && (
                              <div>
                                <span className="text-gray-500">
                                  Sold Price:
                                </span>{" "}
                                $
                                {formatNumberWithCommasAndDecimals(
                                  parseFloat(property.soldPrice || "0")
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    No properties available
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (breakdownData.type === "sales") {
      const details = breakdownData.details as TradeSheetDetail[];
      return (
        <div className="w-96 max-h-96 overflow-y-auto">
          <div className="mb-3 pb-2 border-b">
            <h4 className="font-semibold text-gray-800">Sales Breakdown</h4>
            <p className="text-xs text-gray-500">
              Total Sales Value: $
              {formatNumberWithCommasAndDecimals(breakdownData.total)}
            </p>
          </div>
          <div className="space-y-2">
            {details.map((detail, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-700">
                    {detail.tradeSheetTypeId
                      ? `TS-${detail.tradeSheetTypeId}`
                      : `Tradesheet #${detail.id || index + 1}`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {detail.closingDate ? formatDate(detail.closingDate) : "N/A"}
                  </span>
                </div>
                {detail.properties && detail.properties.length > 0 ? (
                  <div className="space-y-2 mb-2">
                    {detail.properties.map((property, propIndex) => (
                      <div
                        key={propIndex}
                        className="text-xs border-t pt-2 first:border-t-0 first:pt-0"
                      >
                        {property.propertyAddress && (
                          <div className="mb-1 font-medium text-gray-700">
                            {property.propertyAddress}
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                          {property.listingPrice && (
                            <div>
                              <span className="text-gray-500">Listing:</span> $
                              {formatNumberWithCommasAndDecimals(
                                parseFloat(property.listingPrice || "0")
                              )}
                            </div>
                          )}
                          {property.salesPrice && (
                            <div>
                              <span className="text-gray-500">Sales:</span> $
                              {formatNumberWithCommasAndDecimals(
                                parseFloat(property.salesPrice || "0")
                              )}
                            </div>
                          )}
                          {property.soldPrice && (
                            <div className="font-medium text-[#9F8667]">
                              <span className="text-gray-500">Sold:</span> $
                              {formatNumberWithCommasAndDecimals(
                                parseFloat(property.soldPrice || "0")
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    No properties available
                  </div>
                )}
                <div className="pt-2 border-t mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Total Sold Value:
                    </span>
                    <span className="font-semibold text-gray-700 text-sm">
                      ${formatNumberWithCommasAndDecimals(detail.soldPrice)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (breakdownData.type === "listings") {
      const details = breakdownData.details as ListingDetail[];
      return (
        <div className="w-96 max-h-96 overflow-y-auto">
          <div className="mb-3 pb-2 border-b">
            <h4 className="font-semibold text-gray-800">
              Property Listings Breakdown
            </h4>
            <p className="text-xs text-gray-500">
              Total Listings: {breakdownData.total}
            </p>
          </div>
          <div className="space-y-2">
            {details.map((detail, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-700">
                    {detail.propertyListingTypeId || detail.mlsNumber
                      ? `${detail.propertyListingTypeId || detail.mlsNumber}`
                      : `Listing #${detail.id || index + 1}`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(detail.contractDate)}
                  </span>
                </div>
                {detail.propertyAddress && (
                  <div className="text-xs text-gray-600 mb-1">
                    <span className="text-gray-500">Property:</span>{" "}
                    {detail.propertyAddress}
                  </div>
                )}
                {detail.listingPrice && (
                  <div className="text-xs text-gray-600 mb-1">
                    <span className="text-gray-500">Listing Price:</span> $
                    {formatNumberWithCommasAndDecimals(
                      parseFloat(detail.listingPrice)
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  // Sort and prepare data for tables
  const topUnitSellers = useMemo(() => {
    return [...statsData]
      .filter((stat) => stat.totalUnits > 0)
      .sort((a, b) => b.totalUnits - a.totalUnits)
      .map((stat, index) => ({
        ...stat,
        serial: index + 1,
      }));
  }, [statsData]);

  const topSellers = useMemo(() => {
    return [...statsData]
      .filter((stat) => stat.totalSales > 0)
      .sort((a, b) => b.totalSales - a.totalSales)
      .map((stat, index) => ({
        ...stat,
        serial: index + 1,
      }));
  }, [statsData]);

  const topListingAgents = useMemo(() => {
    return [...statsData]
      .filter((stat) => stat.totalListings > 0)
      .sort((a, b) => b.totalListings - a.totalListings)
      .map((stat, index) => ({
        ...stat,
        serial: index + 1,
      }));
  }, [statsData]);

  // Table columns for Top Unit Seller
  const unitSellerColumns = [
    {
      title: "#",
      dataIndex: "serial",
      key: "serial",
      width: 60,
    },
    {
      title: "Agent Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: TopStats) => (
        <div className="flex items-center gap-3">
          {record.profilePicture ? (
            <img
              src={getFileUrl(record.profilePicture)}
              alt={text}
              className="w-10 h-10 rounded-full object-cover border-2"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-xs">N/A</span>
            </div>
          )}
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: "Total Units",
      dataIndex: "totalUnits",
      key: "totalUnits",
      render: (value: number) => (
        <span className="font-semibold">{value} Units</span>
      ),
      sorter: (a: TopStats, b: TopStats) => a.totalUnits - b.totalUnits,
    },
  ];

  // Table columns for Top Seller
  const topSellerColumns = [
    {
      title: "#",
      dataIndex: "serial",
      key: "serial",
      width: 60,
    },
    {
      title: "Agent Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: TopStats) => (
        <div className="flex items-center gap-3">
          {record.profilePicture ? (
            <img
              src={getFileUrl(record.profilePicture)}
              alt={text}
              className="w-10 h-10 rounded-full object-cover border-2"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-xs">N/A</span>
            </div>
          )}
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: "Total Sales",
      dataIndex: "totalSales",
      key: "totalSales",
      render: (value: number) => (
        <span className="font-semibold">
          ${formatNumberWithCommasAndDecimals(value)}
        </span>
      ),
      sorter: (a: TopStats, b: TopStats) => a.totalSales - b.totalSales,
    },
  ];

  // Table columns for Top Listing Agent
  const topListingAgentColumns = [
    {
      title: "#",
      dataIndex: "serial",
      key: "serial",
      width: 60,
    },
    {
      title: "Agent Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: TopStats) => (
        <div className="flex items-center gap-3">
          {record.profilePicture ? (
            <img
              src={getFileUrl(record.profilePicture)}
              alt={text}
              className="w-10 h-10 rounded-full object-cover border-2"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-xs">N/A</span>
            </div>
          )}
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: "Total Listings",
      dataIndex: "totalListings",
      key: "totalListings",
      render: (value: number) => (
        <span className="font-semibold">{value} Listings</span>
      ),
      sorter: (a: TopStats, b: TopStats) => a.totalListings - b.totalListings,
    },
  ];

  // Add hover popover to name column
  const unitSellerColumnsWithHover = unitSellerColumns.map((col) => {
    if (col.key === "name") {
      return {
        ...col,
        render: (text: string, record: TopStats) => {
          const breakdownData = {
            type: "units" as const,
            details: record.tradeSheetDetails || [],
            total: record.totalUnits,
          };

          const content = (
            <div className="flex items-center gap-3">
              {record.profilePicture ? (
                <img
                  src={getFileUrl(record.profilePicture)}
                  alt={text}
                  className="w-10 h-10 rounded-full object-cover border-2"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-xs">N/A</span>
                </div>
              )}
              <span className="font-medium">{text}</span>
            </div>
          );

          if (breakdownData.details.length > 0) {
            return (
              <Popover
                content={renderBreakdownContent(breakdownData)}
                trigger="hover"
                placement="right"
                overlayClassName="breakdown-popover"
              >
                <div className="cursor-pointer">{content}</div>
              </Popover>
            );
          }
          return content;
        },
      };
    }
    return col;
  });

  const topSellerColumnsWithHover = topSellerColumns.map((col) => {
    if (col.key === "name") {
      return {
        ...col,
        render: (text: string, record: TopStats) => {
          const breakdownData = {
            type: "sales" as const,
            details: record.tradeSheetDetails || [],
            total: record.totalSales,
          };

          const content = (
            <div className="flex items-center gap-3">
              {record.profilePicture ? (
                <img
                  src={getFileUrl(record.profilePicture)}
                  alt={text}
                  className="w-10 h-10 rounded-full object-cover border-2"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-xs">N/A</span>
                </div>
              )}
              <span className="font-medium">{text}</span>
            </div>
          );

          if (breakdownData.details.length > 0) {
            return (
              <Popover
                content={renderBreakdownContent(breakdownData)}
                trigger="hover"
                placement="right"
                overlayClassName="breakdown-popover"
              >
                <div className="cursor-pointer">{content}</div>
              </Popover>
            );
          }
          return content;
        },
      };
    }
    return col;
  });

  const topListingAgentColumnsWithHover = topListingAgentColumns.map((col) => {
    if (col.key === "name") {
      return {
        ...col,
        render: (text: string, record: TopStats) => {
          const breakdownData = {
            type: "listings" as const,
            details: record.listingDetails || [],
            total: record.totalListings,
          };

          const content = (
            <div className="flex items-center gap-3">
              {record.profilePicture ? (
                <img
                  src={getFileUrl(record.profilePicture)}
                  alt={text}
                  className="w-10 h-10 rounded-full object-cover border-2"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-xs">N/A</span>
                </div>
              )}
              <span className="font-medium">{text}</span>
            </div>
          );

          if (breakdownData.details.length > 0) {
            return (
              <Popover
                content={renderBreakdownContent(breakdownData)}
                trigger="hover"
                placement="right"
                overlayClassName="breakdown-popover"
              >
                <div className="cursor-pointer">{content}</div>
              </Popover>
            );
          }
          return content;
        },
      };
    }
    return col;
  });

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 flex-wrap">
          <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Top Report</h1>
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          {/* Filter pills */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {[
              { key: "All Time", label: "All Time" },
              { key: "lastYear", label: "This Year" },
              { key: "current", label: "This Month" },
              { key: "previous", label: "Previous Month" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handlePresetFilterClick(key)}
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  selectedMonth === key
                    ? "bg-[#9F8667] text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
            <div
              onClick={handleCalendarIconClick}
              className={`cursor-pointer px-1.5 py-0.5 rounded text-xs transition-all ${
                showDatePicker || selectedMonth === "custom"
                  ? "bg-[#9F8667] text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
              title="Custom Date Range"
            >
              <CalendarOutlined />
            </div>
            {showDatePicker && (
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                format="YYYY-MM-DD"
                placeholder={["Start Date", "End Date"]}
                size="small"
                style={{ borderColor: selectedMonth === "custom" ? "#9F8667" : undefined }}
                open={showDatePicker ? undefined : false}
              />
            )}
            {selectedMonth === "custom" && dateRange && dateRange[0] && dateRange[1] && (
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {dateRange[0].format("MMM DD, YYYY")} – {dateRange[1].format("MMM DD, YYYY")}
              </span>
            )}
          </div>
          <div className="flex-1" />
          {/* Tab pills */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {[
              { key: "units", label: "Top Unit Seller" },
              { key: "sales", label: "Top Seller" },
              { key: "listings", label: "Top Listing Agent" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  activeTab === tab.key
                    ? "bg-[#9F8667] text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {(isLoading || isFetching) && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Spin indicator={loadingIcon} />
              <p className="mt-4 text-gray-600 font-medium">Loading agent data...</p>
            </div>
          </div>
        )}

        {/* Tab content */}
        {!isLoading && !isFetching && (
          <>
            {activeTab === "units" && (
              <Table
                columns={unitSellerColumnsWithHover}
                dataSource={topUnitSellers}
                rowKey={(record) => `${record.name}-${record.serial}`}
                pagination={{ pageSize: 20 }}
              />
            )}
            {activeTab === "sales" && (
              <Table
                columns={topSellerColumnsWithHover}
                dataSource={topSellers}
                rowKey={(record) => `${record.name}-${record.serial}`}
                pagination={{ pageSize: 20 }}
              />
            )}
            {activeTab === "listings" && (
              <Table
                columns={topListingAgentColumnsWithHover}
                dataSource={topListingAgents}
                rowKey={(record) => `${record.name}-${record.serial}`}
                pagination={{ pageSize: 20 }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TopReport;
