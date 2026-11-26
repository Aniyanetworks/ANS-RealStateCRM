// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useState, useMemo } from "react";
import { useGetAgentDetailsDataQuery } from "../../../redux/api/superadmin/agent/agentManagementSlice";
import { NavLink, useParams } from "react-router-dom";
import moment from 'moment-timezone';
import AgentSupportReport from "../../../components/report/AgentSupportReport";
import AgentMarketplaceReport from "../../../components/report/AgentMarketplaceReport";
import AgentTradeSheetReport from "../../../components/report/AgentTradeSheetReport";
import AgentPropertyListingReport from "../../../components/report/AgentPropertyListingReport";
import AgentsCLientReport from "../../../components/report/AgentsCLientReport";
import AgentTradeCommissionReport from "../../../components/report/AgentTradeCommissionReport";
import { FaFilter } from "react-icons/fa";
import { format } from "date-fns";

export default function SummaryReport() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string | null>(null);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [searchText, setSearchText] = useState("");
  const [reportType, setReportType] = useState("commissions");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  const { agentId } = useParams<{ agentId?: string }>();
  const { data } = useGetAgentDetailsDataQuery(agentId);

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

  const filteredData = useMemo(() => {
    if (!data?.data?.userData?.user) return [];

    let reportData = [];

    const combinedPropertyListings = [
      ...data.data.userData.user.userInPropertyListingUser.map(item => item.propertyListing),
      ...data.data.userData.user.propertyListingCreated.map(item => item)
    ];
    const combinedTradeSheetListings = [
      ...data.data.userData.user.userInTradeSheetSharedUser.filter(item => item.tradeSheet?.status !== "archive").map(item => item.tradeSheet),
      ...data.data.userData.user.tradeSheetsCreated.filter(item => item.status !== "archive").map(item => item)
    ];

    switch (reportType) {
      case "marketplace":
        reportData = data.data.userData.user.invoiceAgent || [];
        break;
      case "support":
        reportData = data.data.userData.user.requests || [];
        break;
      case "tradeshit":
        reportData = combinedTradeSheetListings || [];
        break;
      case "propertylisting":
        reportData = combinedPropertyListings || [];
        break;
      case "clients":
        reportData = data.data.userData.user.clientAgent || [];
        break;
      case "commissions":
        reportData = data.data.userData.tradeAgentCommission || [];
        break;
      default:
        return [];
    }

    if (dateRange) {
      const [startStr, endStr] = dateRange;
      if (!startStr || !endStr) return [];

      const start = moment.tz(startStr, "America/Toronto").startOf('day');
      const end = moment.tz(endStr, "America/Toronto").endOf('day');

      reportData = reportData.filter((item) => {
        let itemDate;
        if (reportType === 'marketplace') {
          itemDate = moment.utc(item.issued_date).tz("America/Toronto");
        } else if (reportType === "support") {
          itemDate = moment.utc(item?.request?.createdAt).tz("America/Toronto");
        } else if (reportType === "tradeshit") {
          itemDate = moment.utc(item?.trade_date).tz("America/Toronto");
        } else if (reportType === "propertylisting") {
          itemDate = moment.utc(item?.listing_date).tz("America/Toronto");
        }

        return itemDate?.isValid() && itemDate.isBetween(start, end, null, '[]');
      });
    }

    if (searchText) {
      const searchTerm = searchText.toLowerCase();

      const extractValues = (obj: any): string[] => {
        if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") {
          return [String(obj).toLowerCase()];
        }
        if (Array.isArray(obj)) {
          return obj.flatMap(extractValues);
        }
        if (obj && typeof obj === "object") {
          return Object.values(obj).flatMap(extractValues);
        }
        return [];
      };

      reportData = reportData.filter((record) => {
        const allValues = extractValues(record);
        return allValues.some((value) => value.includes(searchTerm));
      });
    }

    return reportData;
  }, [data, dateRange, reportType, searchText]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
  
    if (value.trim() === "") {
      setSearchSuggestions([]);
    } else {
      const suggestions = filteredData
        .flatMap((item) => {
          const values: (string | undefined)[] = [];
  
          if (reportType === "marketplace") {
            values.push(
              item.invoice_number?.toString(),
              item.total_amount?.toString(),
              item.status?.toString()
            );
          } else if (reportType === "support") {
            values.push(
              item.title?.toString(),
              item.description?.toString(),
              item.status?.toString(),
              item.priority?.toString()
            );
          } else if (reportType === "tradeshit") {
            values.push(
              item.tradeSheetTypeId?.toString(),
              item.name?.toString(),
              item.email?.toString(),
              item.status?.toString()
            );
          } else if (reportType === "propertylisting") {
            values.push(
              item.mlsNumber?.toString(),
              item.propertyAddress?.toString(),
              item.listingPrice?.toString(),
              item.status?.toString()
            );
          } else if (reportType === "clients") {
            values.push(
              item.clientUser?.name?.toString(),
              item.clientUser?.email?.toString(),
              item.clientUser?.clientType?.toString(),
              item.clientUser?.clientPriority?.toString()
            );
          } else if (reportType === "commissions") {
            values.push(
              item.tradeSheet?.tradeSheetTypeId?.toString(),
              item.commission?.toString(),
              item.status?.toString()
            );
          }
  
          return values;
        })
        .filter((field) => typeof field === "string" && field.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
  
      setSearchSuggestions(suggestions as string[]);
    }
  };
  

  const handleSuggestionClick = (suggestion: string) => {
    setSearchText(suggestion);
    setSearchSuggestions([]);
  };

  return (
    <div className="p-3 flex justify-center min-h-screen">
      <div className="w-full max-full">
        <div className="flex flex-col gap-4 px-4 md:px-6">
                    <div className="text-center">
                      <h2 className="text-xl font-semibold">
                        {data?.data?.userData?.name}'s Agent Report
                        {customStart && customEnd && (
                          <p>({format(new Date(customStart), "dd MMMM yyyy")} to {format(new Date(customEnd), "dd MMMM yyyy")})</p>
                        )}
                      </h2>
                    </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <div className="w-full sm:w-64">
              <select
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="marketplace">Marketplace</option>
                <option value="support">Support Requests</option>
                <option value="tradeshit">Trade Sheet</option>
                <option value="propertylisting">Property Listing</option>
                <option value="clients">Clients</option>
                <option value="commissions">Completed Trade Sheet</option>
              </select>
            </div>

            <div className="w-full sm:w-auto flex-1 max-w-2xl relative">
              <div className="flex">
                <input
                  type="text"
                  className="w-full border p-2 rounded-l focus:ring focus:#0a2a28"
                  placeholder="Search in all fields..."
                  value={searchText}
                  onChange={handleSearchInputChange}
                />
                <button
                  className="bg-[#0f766e] text-white px-4 py-2 rounded-r-md flex items-center gap-2 transition duration-200 hover:bg-[#1F2A3D]"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <FaFilter /> Filter
                </button>
              </div>

              {searchSuggestions.length > 0 && (
                <div className="absolute left-0 mt-1 w-full bg-white shadow-md border rounded-md z-10">
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
                <div className="absolute right-0 mt-2 w-full md:w-[450px] bg-white shadow-md border rounded-md p-4 z-10">
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {['Day', 'Week', 'Month', 'Quarter', 'Year'].map((period) => (
                      <button
                        key={period}
                        onClick={() => handlePeriodFilter(period)}
                        className={`px-3 py-1 rounded ${
                          periodFilter === period
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
                        className={`block w-full text-left px-3 py-2 rounded ${
                          periodFilter === range
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

                    <div className="flex gap-2 mt-4">
                      <button
                        className="w-1/2 bg-[#0f766e] text-white p-2 rounded"
                        onClick={handleCustomDateRange}
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
                        }}
                      >
                        Reset & Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <NavLink
              to={`/dashboard/reports/agent-report`}
              className="bg-[#0f766e] text-white py-2 px-4 rounded-md text-center min-w-[100px] transition duration-200 hover:bg-[#1F2A3D]"
            >
              Go Back
            </NavLink>
          </div>
        </div>

        <div className="w-full">
          {reportType === 'marketplace' && (<AgentMarketplaceReport filteredData={filteredData} />)}
          {reportType === 'support' && (<AgentSupportReport filteredData={filteredData} />)}
          {reportType === 'tradeshit' && (<AgentTradeSheetReport filteredData={filteredData} />)}
          {reportType === 'propertylisting' && (<AgentPropertyListingReport filteredData={filteredData} />)}
          {reportType === 'clients' && (<AgentsCLientReport filteredData={filteredData} />)}
          {reportType === 'commissions' && (<AgentTradeCommissionReport filteredData={filteredData} />)}
        </div>
      </div>
    </div>
  );
}