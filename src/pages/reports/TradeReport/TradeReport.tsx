// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import {
  useMemo,
  useState,
} from 'react';

import { Select } from 'antd';
import { format } from 'date-fns';
import moment from 'moment-timezone';
import { FaFilter } from 'react-icons/fa';
import { useSelector } from 'react-redux';

import TradeCommissionReport
  from '../../../components/report/TradeCommissionReport';
import {
  useGetActiveBranchListDataQuery,
} from '../../../redux/api/superadmin/branch/Branchmanagementslice';
import {
  useGetTradeReportDataQuery,
} from '../../../redux/api/superadmin/report/reportManagementSlice';

export default function TradeReport() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string | null>(null);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]); // State for search suggestions
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  const { data } = useGetTradeReportDataQuery();
  const { data: activeBranches, isLoading: branchesLoading } = useGetActiveBranchListDataQuery("");
  const { user } = useSelector((state: any) => state.user);
  const isSuperAdmin = user?.roleId == 1;

  // Function to set predefined date ranges
  const handlePeriodFilter = (period: string) => {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'Day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'Week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'Month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'Quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'Year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'Last 30 days':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'Last 90 days':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'Last Year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'All Time':
        setDateRange(null);
        setPeriodFilter(null);
        return;
    }

    setDateRange([startDate.toISOString(), now.toISOString()]);
    setPeriodFilter(period);
    setShowDropdown(false);
  };

  const handleCustomDateRange = () => {
    if (customStart && customEnd) {
      setDateRange([
        new Date(customStart).toISOString(),
        new Date(customEnd).toISOString()
      ]);
      setShowDropdown(false);
    }
  };

  // Handle branch filter change
  const handleBranchFilter = (selectedBranchIds: string[]) => {
    setSelectedBranches(selectedBranchIds);
  };
  const searchInObject = (obj: any, searchTerm: string): boolean => {
    if (!obj) return false;

    const lowerSearchTerm = searchTerm.toLowerCase();

    return Object.values(obj).some((value) => {
      if (typeof value === "string") {
        return value.toLowerCase().includes(lowerSearchTerm);
      } else if (Array.isArray(value)) {
        return value.some((item) => searchInObject(item, searchTerm));
      } else if (typeof value === "object" && value !== null) {
        return searchInObject(value, searchTerm);
      }
      return false;
    });
  };

  // Memoized logic for filtering data
  const filteredData = useMemo(() => {
    if (!data?.data?.tradeData) return [];
    let reportData = data.data.tradeData;

    // Filter by Date Range
    if (dateRange) {
      const [startStr, endStr] = dateRange;
      if (!startStr || !endStr) return [];
      const start = moment.tz(startStr, "America/Toronto").startOf('day');
      const end = moment.tz(endStr, "America/Toronto").endOf('day');
      reportData = reportData.filter((item) => {
        const itemDate = moment.utc(item.createdAt).tz("America/Toronto");
        return itemDate?.isValid() && itemDate.isBetween(start, end, null, '[]');
      });
    }

    // Filter by Branches
    if (selectedBranches.length > 0) {
      reportData = reportData.filter((item) =>
        selectedBranches.includes(item?.tradeSheet?.branchId?.toString()) ||
        selectedBranches.includes(item?.branchId?.toString()) ||
        selectedBranches.includes(item?.tradeSheet?.branch?.id?.toString())
      );
    }

    // Search Filter
    if (searchText) {
      reportData = reportData.filter((item) => searchInObject(item, searchText));
    }

    return reportData;
  }, [data, dateRange, selectedBranches, searchText]);


  // Function to handle search input changes
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);

    // Generate search suggestions based on the input
    if (value.trim() === "") {
      setSearchSuggestions([]);
    } else {
      const suggestions = filteredData
        .map((item) => [
          item?.tradeSheet?.tradeSheetTypeId,
          item?.tradeSheet?.name,
          item?.tradeSheet?.email,
          item?.tradeSheet?.representation,
          item?.tradeSheet?.representationType,
          item?.tradeSheet?.multipleRepresentation,
          item?.tradeSheet?.propertyListing?.address,
          item.status,
          item.agentCommissionStatus,
          item.netCommissionStatus,
          item.baseOfficeCommissionStatus,
          item.createdAt,
          item.closingDate,
        ])
        .flat()
        .filter((field) => field?.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5); // Limit to 5 suggestions
      setSearchSuggestions(suggestions as string[]);
    }
  };

  // Function to handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    setSearchText(suggestion);
    setSearchSuggestions([]); // Clear suggestions
  };

  const searchFilterToolbar = (
    <div className="relative flex-shrink-0" style={{ width: 320 }}>
      <div className="flex">
        <input
          type="text"
          className="w-full border p-1.5 text-sm rounded-l focus:ring focus:#0a2a28"
          placeholder="Search by trade ID, name, email, address..."
          value={searchText}
          onChange={handleSearchInputChange}
        />
        <button
          className="bg-[#0a2a28] text-white px-3 py-1.5 rounded-r-md flex items-center gap-1.5 text-xs transition duration-200 hover:bg-[#1F2A3D]"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <FaFilter /> Filter
        </button>
      </div>

      {searchSuggestions.length > 0 && (
        <div className="absolute left-0 mt-1 w-full bg-white shadow-md border rounded-md z-50">
          {searchSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-full md:w-[450px] bg-white shadow-md border rounded-md p-4 z-50">
          <div className="flex gap-2 mb-4 flex-wrap">
            {['Day', 'Week', 'Month', 'Quarter', 'Year'].map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodFilter(period)}
                className={`px-3 py-1 rounded ${periodFilter === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200'
                  }`}
              >
                {period}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {['Last 30 days', 'Last 90 days', 'Last Year', 'All Time'].map((range) => (
              <button
                key={range}
                className={`block w-full text-left px-3 py-2 rounded ${periodFilter === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200'
                  }`}
                onClick={() => handlePeriodFilter(range)}
              >
                {range}
              </button>
            ))}

            <div className="border p-2 rounded">
              <label className="font-semibold">Custom Range</label>
              <div className="flex flex-col sm:flex-row gap-2 mt-1">
                <input
                  type="date"
                  className="border p-2 rounded w-full"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
                <input
                  type="date"
                  className="border p-2 rounded w-full"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </div>

            {isSuperAdmin && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Branches</h3>
                <Select
                  mode="multiple"
                  placeholder="Select branches"
                  value={selectedBranches}
                  onChange={handleBranchFilter}
                  options={activeBranches?.data?.branchData?.map((branch: any) => ({
                    value: branch.id.toString(),
                    label: branch.name,
                  }))}
                  className="w-full"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  loading={branchesLoading}
                />
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                className="w-1/2 bg-[#0a2a28] text-white p-2 rounded"
                onClick={() => {
                  handleCustomDateRange();
                  setShowDropdown(false);
                }}
              >
                Apply
              </button>
              <button
                className="w-1/2 bg-[#FFDFDC] text-[#EF4444] p-2 rounded"
                onClick={() => {
                  setShowDropdown(false);
                  setDateRange(null);
                  setPeriodFilter(null);
                  setCustomStart("");
                  setCustomEnd("");
                  setSelectedBranches([]);
                }}
              >
                Reset & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="pb-16">
      <TradeCommissionReport filteredData={filteredData} toolbar={searchFilterToolbar} />
    </div>
  );
}