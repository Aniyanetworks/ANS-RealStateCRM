// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useState, useMemo } from "react";
import moment from 'moment-timezone';
import HstSummeryReport from "../../components/report/HstSummeryReport";
import { FaFilter } from "react-icons/fa";
import { useGetTradeReportDataQuery } from "../../redux/api/superadmin/report/reportManagementSlice";
import { useGetOrderQuery } from "../../redux/api/superadmin/invoice/orderDataSlice";
import { useGetExpenseListQuery } from "../../redux/api/superadmin/expenses/expenseSlice";
import { format } from "date-fns";

interface Agent {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
}

interface InvoiceItem {
  id: number;
}

interface MarketplaceOrder {
  id: number;
  uuid: string;
  invoice_number: string;
  agentId: number;
  issued_date: string;
  status: string;
  total_amount: number;
  tax: number;
  payment_method: string;
  createdAt: string;
  updatedAt: string;
  agent: Agent;
  invoiceItems: InvoiceItem[];
}

interface TradeData {
  id: number;
}

interface Expense {
  id: number;
  expense_id: string;
  invoice_number: string;
  name: string;
  description: string;
  amount: string;
  tax: string;
  total: string;
  transactionDate: string;
  status: string;
  receiptPath: string | null;
  isRecurring: boolean;
  recurrenceType: string | null;
  recurrenceInterval: number | null;
  recurrenceEndDate: string | null;
  createdAt: string;
  updatedAt: string;
  expenseCategory: {
    id: number;
    name: string;
    status: string;
  };
}

export default function TradeReport() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string | null>(null);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  const { data } = useGetTradeReportDataQuery();
  const { data: marketplace } = useGetOrderQuery();
  const { data: expense } = useGetExpenseListQuery();

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
  
  const { filteredData, filteredMarketplaceData, filteredExpenseData } = useMemo(() => {
    const emptyResult = { 
      filteredData: [], 
      filteredMarketplaceData: [],
      filteredExpenseData: [] 
    };
    
    if (!data?.data?.tradeData) return emptyResult;
    if (!marketplace?.data?.OrderData) return emptyResult;
    if (!expense?.data?.expenses) return emptyResult;
    
    let reportData: TradeData[] = data.data.tradeData;
    let marketplaceData: MarketplaceOrder[] = marketplace.data.OrderData;
    let expenseData: Expense[] = expense.data.expenses;
  
    if (dateRange) {
      const [startStr, endStr] = dateRange;
      if (!startStr || !endStr) return emptyResult;
      
      const start = moment.tz(startStr, "America/Toronto").startOf('day');
      const end = moment.tz(endStr, "America/Toronto").endOf('day');
      
      reportData = reportData.filter((item) => {
        const itemDate = moment.utc(item.createdAt).tz("America/Toronto");
        return itemDate?.isValid() && itemDate.isBetween(start, end, null, '[]');
      });
      
      marketplaceData = marketplaceData.filter((item) => {
        const itemDate = moment.utc(item.createdAt).tz("America/Toronto");
        return itemDate?.isValid() && itemDate.isBetween(start, end, null, '[]');
      });

      expenseData = expenseData.filter((item) => {
        const itemDate = moment.utc(item.transactionDate).tz("America/Toronto");
        return itemDate?.isValid() && itemDate.isBetween(start, end, null, '[]');
      });
    }
  
    if (searchText) {
      reportData = reportData.filter((item) => searchInObject(item, searchText));
      marketplaceData = marketplaceData.filter((item) => searchInObject(item, searchText));
      expenseData = expenseData.filter((item) => searchInObject(item, searchText));
    }
  
    return {
      filteredData: reportData,
      filteredMarketplaceData: marketplaceData,
      filteredExpenseData: expenseData.filter(item => item.expenseStatus == 'approved')
    };
  }, [data, marketplace, expense, dateRange, searchText]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);

    if (value.trim() === "") {
      setSearchSuggestions([]);
    } else {
      const reportSuggestions = filteredData
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
        .flat();

      const marketplaceSuggestions = filteredMarketplaceData
        .map((item) => [
          item.invoice_number,
          item.agent.name,
          item.agent.email,
          item.agent.phoneNumber,
          item.status,
          `$${item.total_amount.toFixed(2)}`,
          `Tax: $${item.tax.toFixed(2)}`,
          format(new Date(item.issued_date), "MMM dd, yyyy"),
          item.payment_method,
        ])
        .flat();

      const expenseSuggestions = filteredExpenseData
        .map((item) => [
          item.expense_id,
          item.invoice_number,
          item.name,
          item.description,
          `$${item.amount}`,
          `Tax: $${item.tax}`,
          `Total: $${item.total}`,
          format(new Date(item.transactionDate), "MMM dd, yyyy"),
          item.expenseCategory.name,
          item.status,
        ])
        .flat();

      const allSuggestions = [...reportSuggestions, ...marketplaceSuggestions, ...expenseSuggestions]
        .filter((field) => field?.toString().toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
        
      setSearchSuggestions(allSuggestions as string[]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchText(suggestion);
    setSearchSuggestions([]);
  };

  const searchFilterToolbar = (
    <div className="relative flex-shrink-0" style={{ width: 300 }}>
      <div className="flex">
        <input
          type="text"
          className="w-full border p-1.5 text-sm rounded-l focus:ring focus:#0a2a28"
          placeholder="Search by invoice, agent, amount, date..."
          value={searchText}
          onChange={handleSearchInputChange}
        />
        <button
          className="bg-[#0f766e] text-white px-3 py-1.5 rounded-r-md flex items-center gap-1.5 text-xs transition duration-200 hover:bg-[#1F2A3D]"
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
  );

  return (
    <div className="pb-16">
      <HstSummeryReport
        filteredData={filteredData}
        filteredMarketplaceData={filteredMarketplaceData}
        filteredExpenseData={filteredExpenseData}
        dateRangeLabel={customStart && customEnd ? (
          <p>({format(new Date(customStart), "dd MMMM yyyy")} to {format(new Date(customEnd), "dd MMMM yyyy")})</p>
        ) : periodFilter && dateRange ? (
          <p>({periodFilter}: {format(new Date(dateRange[0]), "dd MMMM yyyy")} to {format(new Date(dateRange[1]), "dd MMMM yyyy")})</p>
        ) : null}
        toolbar={searchFilterToolbar}
      />
    </div>
  );
}