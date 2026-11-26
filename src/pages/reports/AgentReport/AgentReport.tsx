// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import {
  useEffect,
  useState,
} from 'react';

import { Select } from 'antd';
import { FaFilter } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import AgentDashboardStats
  from '../../../components/report/AgentDashboardStats';
import {
  useGetAgentReportDataQuery,
} from '../../../redux/api/superadmin/agent/agentManagementSlice';
import {
  useGetActiveBranchListDataQuery,
} from '../../../redux/api/superadmin/branch/Branchmanagementslice';

interface DataType {
  id: string;
  agentAccountId: string;
  name: string;
  user: { uuid: string; branchId?: number; branch?: { id: number; name: string } };
  branchId?: number;
  branch?: { id: number; name: string };
}

const AgentManagement: React.FC = () => {
  const { user } = useSelector((state: any) => state.user);
  const isSuperAdmin = user?.roleId == 1;
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  const queryParams = selectedBranches.length > 0 ? { branchIds: selectedBranches } : undefined;
  const { data, isLoading } = useGetAgentReportDataQuery(queryParams);
  const { data: activeBranches, isLoading: branchesLoading } = useGetActiveBranchListDataQuery("");

  const [showDropdown, setShowDropdown] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<DataType[]>([]);
  const [filteredData, setFilteredData] = useState<DataType[]>([]);

  const isDateInRange = (dateToCheck: string) => {
    if (!dateRange) return true;
    const [start, end] = dateRange;
    const date = new Date(dateToCheck);
    return date >= new Date(start) && date <= new Date(end);
  };

  const handleBranchFilter = (selectedBranchIds: string[]) => {
    setSelectedBranches(selectedBranchIds);
  };

  const filteredValue = filteredData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();

    if (!searchTerm && !dateRange && selectedBranches.length === 0) return true;

    const searchInObject = (obj: any): boolean => {
      return Object.entries(obj).some(([key, value]) => {
        if (key === 'key' || key === 'user' || key === 'plan') return false;

        if (value && typeof value === 'object') {
          return searchInObject(value);
        }

        if (Array.isArray(value)) {
          return value.some(item =>
            typeof item === 'object'
              ? searchInObject(item)
              : String(item).toLowerCase().includes(searchTerm)
          );
        }

        return String(value).toLowerCase().includes(searchTerm);
      });
    };

    const matchesSearch = searchTerm ? searchInObject(record) : true;

    const matchesUserSearch = searchTerm ? searchInObject(record.user || {}) : true;

    const matchesPlanSearch = searchTerm
      ? record?.plan?.name?.toLowerCase().includes(searchTerm)
      : true;

    const matchesDateRange = dateRange
      ? isDateInRange(record.createdAt)
      : true;

    const matchesBranch = selectedBranches.length > 0
      ? selectedBranches.includes(record?.branch?.id?.toString()) ||
      selectedBranches.includes(record?.user?.branchId?.toString()) ||
      selectedBranches.includes(record?.branchId?.toString())
      : true;

    return (matchesSearch || matchesUserSearch || matchesPlanSearch) && matchesDateRange && matchesBranch;
  });

  const handlePeriodFilter = (period: string) => {
    const now = new Date();
    let startDate = new Date();

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

  useEffect(() => {
    if (data?.data?.userData) {
      const fetchedData = data.data.userData;
      setFilteredData(fetchedData);
    }
  }, [data]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearchText(searchTerm);

    if (searchTerm === "") {
      setSuggestions([]);
      setFilteredData(data?.data?.userData || []);
      return;
    }

    const filteredSuggestions = data?.data?.userData.filter((record: DataType) => {
      return (
        record.name.toLowerCase().includes(searchTerm) ||
        record.agentAccountId.toLowerCase().includes(searchTerm)
      );
    });

    setSuggestions(filteredSuggestions || []);
    setFilteredData(filteredSuggestions || []);
  };

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Agent Report</h1>
          <div className="flex-1" />
          <div className="relative flex-shrink-0" style={{ width: 280 }}>
            <div className="flex">
              <input
                type="text"
                className="w-full border p-1.5 text-sm rounded-l focus:ring focus:#0a2a28"
                placeholder="Search by Agent Name or ID..."
                value={searchText}
                onChange={handleSearch}
              />
              <button
                className="bg-[#0f766e] text-white px-3 py-1.5 rounded-r-md flex items-center gap-1.5 text-xs transition duration-200 hover:bg-[#1F2A3D]"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <FaFilter /> Filter
              </button>
            </div>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white shadow-md border rounded-md p-4 z-50">
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
                    <label className="text-sm font-semibold">Custom Range</label>
                    <div className="flex gap-2 mt-1">
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
                      className="w-1/2 bg-[#0f766e] text-white p-2 rounded"
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

            {suggestions.length > 0 && (
              <div className="absolute left-0 mt-2 w-full bg-white shadow-md border rounded-md p-4 z-50">
                {suggestions.map((record) => (
                  <div
                    key={record.id}
                    className="cursor-pointer p-2 hover:bg-gray-100"
                  >
                    <Link to={`/dashboard/reports/agent-report-details/${record.agentAccountId}`}>
                      <div className="flex justify-between">
                        <span>{record.name}</span>
                        <span>{record.agentAccountId}</span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          <AgentDashboardStats filteredData={filteredValue} />
        </div>
      </div>
    </div>
  );
};

export default AgentManagement;