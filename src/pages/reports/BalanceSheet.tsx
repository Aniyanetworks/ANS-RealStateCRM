// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useState, useEffect, useMemo } from "react";
import moment from 'moment-timezone';
import { useGetBalanceSheetDataQuery } from "../../redux/api/superadmin/report/reportManagementSlice";
import { jsPDF } from "jspdf";
import { FaFilter } from "react-icons/fa";
import "jspdf-autotable";
import logo1 from "/logo.svg";
import { FaFilePdf, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import { formatNumberWithCommasAndDecimals } from "../../utils/formatNumberWithCommasAndDecimals";

interface BalanceItem {
  name: string;
  amount: number;
}

interface BalanceData {
  assets: BalanceItem[];
  liabilities: BalanceItem[];
  equity: BalanceItem[];
}

interface TradeData {
  soldPrice: string;
  salesPrice: string;
  agentCommissionTax: string;
  netCommissionTax: string;
  agentCommissionTotal: string;
  netCommissionTotal: string;
  createdAt: string;
}

interface ApiResponse {
  data?: {
    tradeData: TradeData[];
  };
}

const BalanceSheet = () => {
  const { data } = useGetBalanceSheetDataQuery() as { data: ApiResponse };
  const [showDropdown, setShowDropdown] = useState(false);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string | null>(null);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  const [balanceData, setBalanceData] = useState<BalanceData>({
    assets: [],
    liabilities: [],
    equity: [],
  });

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
        new Date(customEnd).toISOString(),
      ]);
      setShowDropdown(false);
    }
  };

  const searchInObject = (obj: any, searchTerm: string): boolean => {
    if (!obj) return false;

    const lowerSearchTerm = searchTerm.toLowerCase();

    return Object.values(obj).some((value) => {
      if (typeof value === "string" && value.toLowerCase().includes(lowerSearchTerm)) {
        return true;
      } else if (Array.isArray(value)) {
        return value.some((item) => searchInObject(item, searchTerm));
      } else if (typeof value === "object" && value !== null) {
        return searchInObject(value, searchTerm);
      }
      return false;
    });
  };

  const filteredData = useMemo(() => {
    if (!data?.data?.tradeData) return [];

    let reportData = data.data.tradeData;

    if (dateRange) {
      const [startStr, endStr] = dateRange;
      const start = moment.tz(startStr, "America/Toronto").startOf('day');
      const end = moment.tz(endStr, "America/Toronto").endOf('day');
      reportData = reportData.filter((item) => {
        const itemDate = moment.utc(item.createdAt).tz("America/Toronto");
        return itemDate?.isValid() && itemDate.isBetween(start, end, null, '[]');
      });
    }

    if (searchText) {
      reportData = reportData.filter((item) => searchInObject(item, searchText));
    }

    return reportData;
  }, [data, dateRange, searchText]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);

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
        .slice(0, 5);
      setSearchSuggestions(suggestions as string[]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchText(suggestion);
    setSearchSuggestions([]);
  };




  useEffect(() => {
    if (filteredData) {
      const tradeData = filteredData;

      const newLocal = [
        { name: "Sold Price", amount: tradeData.reduce((acc, trade) => acc + parseFloat(trade.salesPrice) + parseFloat(trade.soldPrice), 0) },
      ];
      const assets: BalanceItem[] = newLocal;

      const liabilities: BalanceItem[] = [
        { name: "Agent Commission Tax", amount: tradeData.reduce((acc, trade) => acc + parseFloat(trade.agentCommissionTax), 0) },
        { name: "Office Commission Tax", amount: tradeData.reduce((acc, trade) => acc + parseFloat(trade.netCommissionTax), 0) },
      ];

      const equity: BalanceItem[] = [
        { name: "Agent Commission", amount: tradeData.reduce((acc, trade) => acc + parseFloat(trade.agentCommissionTotal), 0) },
        { name: "Office Commission", amount: tradeData.reduce((acc, trade) => acc + parseFloat(trade.netCommissionTotal), 0) },
      ];

      setBalanceData({ assets, liabilities, equity });
    }
  }, [filteredData]);

  const calculateTotal = (items: BalanceItem[]): number => items.reduce((total, item) => total + item.amount, 0);

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const logoX = (pageWidth / 2) - 10;
    const logoY = 5;
    const logoWidth = 20;
    const logoHeight = 20;
    doc.addImage(logo1, "PNG", logoX, logoY, logoWidth, logoHeight);

    doc.setFontSize(16);
    doc.text("Trade Balance Sheet", pageWidth / 2, 32, { align: "center" });

    const addTable = (title: string, items: BalanceItem[], yOffset: number) => {
      doc.setFontSize(12);
      doc.text(title, 14, yOffset);

      const total = items.reduce((acc, item) => acc + item.amount, 0);

      doc.autoTable({
        startY: yOffset + 5,
        body: [
          ...items.map((item) => [item.name, `$${formatNumberWithCommasAndDecimals(item.amount)}`]),
          ["Total", `= $${formatNumberWithCommasAndDecimals(total)}`],
        ],
        theme: "striped",
        bodyStyles: {
          halign: 'justify',
        },
        margin: { left: 14 },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'right' },
        },
        didDrawCell: (data: any) => {
          if (data.row.index === items.length) {
            doc.setFont("helvetica", "bold");
          }
        },
        willDrawCell: (data: any) => {
          if (data.row.index === items.length) {
            doc.setFont("helvetica", "normal");
          }
        },
      });
    };

    let yOffset = 40;
    addTable("Assets", balanceData.assets, yOffset);

    yOffset = doc.lastAutoTable.finalY + 15;
    addTable("Liabilities", balanceData.liabilities, yOffset);

    yOffset = doc.lastAutoTable.finalY + 15;
    addTable("Equity", balanceData.equity, yOffset);

    doc.save("balance-sheet.pdf");
  };

  const generateExcel = () => {
    const workbook = XLSX.utils.book_new();

    const assetsSheet = XLSX.utils.json_to_sheet([
      ...balanceData.assets.map((item) => ({
        name: item.name,
        amount: `$${formatNumberWithCommasAndDecimals(item.amount)}`,
      })),
      { name: "Total Assets", amount: `$${formatNumberWithCommasAndDecimals(calculateTotal(balanceData.assets))}` },
    ]);
    const liabilitiesSheet = XLSX.utils.json_to_sheet([
      ...balanceData.liabilities.map((item) => ({
        name: item.name,
        amount: `$${formatNumberWithCommasAndDecimals(item.amount)}`,
      })),
      { name: "Total Liabilities", amount: `$${formatNumberWithCommasAndDecimals(calculateTotal(balanceData.liabilities))}` },
    ]);
    const equitySheet = XLSX.utils.json_to_sheet([
      ...balanceData.equity.map((item) => ({
        name: item.name,
        amount: `$${formatNumberWithCommasAndDecimals(item.amount)}`,
      })),
      { name: "Total Equity", amount: `$${formatNumberWithCommasAndDecimals(calculateTotal(balanceData.equity))}` },
    ]);

    XLSX.utils.book_append_sheet(workbook, assetsSheet, "Assets");
    XLSX.utils.book_append_sheet(workbook, liabilitiesSheet, "Liabilities");
    XLSX.utils.book_append_sheet(workbook, equitySheet, "Equity");

    XLSX.writeFile(workbook, "balance-sheet.xlsx");
  };

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Trade Balance Sheet</h1>
          <div className="flex-1" />
          <div className="relative flex-shrink-0" style={{ width: 320 }}>
            <div className="flex">
              <input
                type="text"
                className="w-full border p-1.5 text-sm rounded-l focus:ring focus:#0a2a28"
                placeholder="Search by trade ID, name, email, address, date..."
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
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          <div className="flex items-center gap-2 flex-shrink-0">
            <FaFilePdf
              onClick={generatePDF}
              size={20}
              className="cursor-pointer text-red-600 hover:text-red-700"
              title="Export to PDF"
            />
            <FaFileExcel
              onClick={generateExcel}
              size={20}
              className="cursor-pointer text-green-600 hover:text-green-700"
              title="Export to Excel"
            />
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Assets</h3>
            <ul>
              {balanceData.assets.map((asset, index) => (
                <li key={index} className="flex justify-between py-1 border-b">
                  <span>{asset.name}</span>
                  <span>${formatNumberWithCommasAndDecimals(asset.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between font-bold mt-2">
              <span>Total Assets:</span>
              <span>${formatNumberWithCommasAndDecimals(calculateTotal(balanceData.assets))}</span>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold">Liabilities</h3>
            <ul>
              {balanceData.liabilities.map((liability, index) => (
                <li key={index} className="flex justify-between py-1 border-b">
                  <span>{liability.name}</span>
                  <span>${formatNumberWithCommasAndDecimals(liability.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between font-bold mt-2">
              <span>Total Liabilities:</span>
              <span>${formatNumberWithCommasAndDecimals(calculateTotal(balanceData.liabilities))}</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Equity</h3>
            <ul>
              {balanceData.equity.map((eq, index) => (
                <li key={index} className="flex justify-between py-1 border-b">
                  <span>{eq.name}</span>
                  <span>${formatNumberWithCommasAndDecimals(eq.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between font-bold mt-2">
              <span>Total Equity:</span>
              <span>${formatNumberWithCommasAndDecimals(calculateTotal(balanceData.equity))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;