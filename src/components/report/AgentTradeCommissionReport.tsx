// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useState, useRef } from "react";
import { format } from "date-fns";
// import TableLoader from "../loader/TableLoader";
import { Table, Tag } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import * as XLSX from "xlsx";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import jsPDF from "jspdf";
import logo1 from "/logo.svg";
import { formatNumberWithCommasAndDecimals } from "../../utils/formatNumberWithCommasAndDecimals";

interface TradeCommissionItem {
  id: string;
  status: string;
  tax: number;
  createdAt: string;
  agentCommissionTotal: number;
  tradeSheet: {
    tradeSheetTypeId: string;
    properties: {
      listingPrice: string;
    }[];
  }[];
}

interface MarketplaceReportProps {
  filteredData: TradeCommissionItem[];
}

type OnChange = NonNullable<TableProps<TradeCommissionItem>["onChange"]>;
type Filters = Parameters<OnChange>[1];
type Sorts = Parameters<OnChange>[2] extends (infer U)[] ? U : never;

const MarketplaceReport: React.FC<MarketplaceReportProps> = ({ filteredData }) => {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [filteredInfo, setFilteredInfo] = useState<Filters>({});
  const [sortedInfo, setSortedInfo] = useState<Sorts>({} as Sorts);

  const handleChange: OnChange = (_, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter as Sorts);
  };

  const columns: TableColumnsType<TradeCommissionItem> = [
    {
      title: "#",
      key: "serial",
      dataIndex: "serial",
      width: 50,
      fixed: "left",
    },
    {
      title: "Trade Id",
      dataIndex: "tradeSheet",
      key: "tradeSheetTypeId",
      render: (tradeSheet) => tradeSheet?.tradeSheetTypeId || "N/A",
      sorter: (a, b) =>
        (a.tradeSheet.tradeSheetTypeId || "").localeCompare(
          b.tradeSheet.tradeSheetTypeId || ""
        ),
      sortOrder: sortedInfo.columnKey === "tradeSheetTypeId" ? sortedInfo.order : null,
      ellipsis: true,
    },
    {
      title: "Agent Commission Transfer",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Open", value: "open" },
        { text: "In Progress", value: "inProgress" },
        { text: "Completed", value: "completed" },
        { text: "Closed", value: "closed" },
      ],
      filteredValue: filteredInfo.status || null,
      onFilter: (value, record) => record.status.includes(value as string),
      sorter: (a, b) => a.status.localeCompare(b.status),
      sortOrder: sortedInfo.columnKey === "status" ? sortedInfo.order : null,
      render: (status: string) => {
        const statusColors: Record<string, string> = {
          completed: "blue",
          inProgress: "orange",
          pending: "orange",
          closed: "green",
          open: "red",
        };

        return <Tag color={statusColors[status] || "default"}>{status}</Tag>;
      },
      ellipsis: true,
    },
    {
      title: "Listing Price",
      dataIndex: "tradeSheet",
      key: "listingPrice",
      sorter: (a, b) => {
        const priceA = Number(a.tradeSheet?.properties?.[0]?.listingPrice) || 0;
        const priceB = Number(b.tradeSheet?.properties?.[0]?.listingPrice) || 0;
        return priceA - priceB;
      },
      sortOrder: sortedInfo.columnKey === "listingPrice" ? sortedInfo.order : null,
      render: (tradeSheet) => {
        const listingPrice = tradeSheet?.properties?.[0]?.listingPrice || 0;
        return <span>${formatNumberWithCommasAndDecimals(listingPrice)}</span>;
      },
      ellipsis: true,
    },
    {
      title: "Sales Price",
      dataIndex: "tradeSheet",
      key: "salesPrice",
      sorter: (a, b) => {
        const priceA = Number(a.tradeSheet?.properties?.[0]?.salesPrice) || 0;
        const priceB = Number(b.tradeSheet?.properties?.[0]?.salesPrice) || 0;
        return priceA - priceB;
      },
      sortOrder: sortedInfo.columnKey === "salesPrice" ? sortedInfo.order : null,
      render: (tradeSheet) => {
        const salesPrice = tradeSheet?.properties?.[0]?.salesPrice || 0;
        return <span>${formatNumberWithCommasAndDecimals(salesPrice)}</span>;
      },
      ellipsis: true,
    },
    {
      title: "Sold Price",
      dataIndex: "tradeSheet",
      key: "soldPrice",
      sorter: (a, b) => {
        const priceA = Number(a.tradeSheet?.properties?.[0]?.soldPrice) || 0;
        const priceB = Number(b.tradeSheet?.properties?.[0]?.soldPrice) || 0;
        return priceA - priceB;
      },
      sortOrder: sortedInfo.columnKey === "soldPrice" ? sortedInfo.order : null,
      render: (tradeSheet) => {
        const soldPrice = tradeSheet?.properties?.[0]?.soldPrice || 0;
        return <span>${formatNumberWithCommasAndDecimals(soldPrice)}</span>;
      },
      ellipsis: true,
    },
    {
      title: "Base Office Commission",
      dataIndex: "tradeSheet",
      key: "baseOfficeCommissionTotal",
      sorter: (a, b) => {
        const aCommission = parseFloat(a.tradeSheet.tradeTransaction?.[0]?.baseOfficeCommissionTotal) || 0;
        const bCommission = parseFloat(b.tradeSheet.tradeTransaction?.[0]?.baseOfficeCommissionTotal) || 0;
        return aCommission - bCommission;
      },
      sortOrder: sortedInfo.columnKey === "baseOfficeCommissionTotal" ? sortedInfo.order : null,
      render: (tradeSheet) => {
        const commission = tradeSheet.tradeTransaction?.[0]?.baseOfficeCommissionTotal;
        return <span>{commission ? `$${formatNumberWithCommasAndDecimals(commission)}` : "N/A"}</span>;
      },
      ellipsis: true,
    },
    {
      title: "Net Commission",
      dataIndex: "tradeSheet",
      key: "netCommissionTotal",
      sorter: (a, b) => {
        const aCommission = parseFloat(a.tradeSheet.tradeTransaction?.[0]?.netCommissionTotal) || 0;
        const bCommission = parseFloat(b.tradeSheet.tradeTransaction?.[0]?.netCommissionTotal) || 0;
        return aCommission - bCommission;
      },
      sortOrder: sortedInfo.columnKey === "netCommissionTotal" ? sortedInfo.order : null,
      render: (tradeSheet) => {
        const commission = tradeSheet.tradeTransaction?.[0]?.netCommissionTotal;
        return <span>{commission ? `$${formatNumberWithCommasAndDecimals(commission)}` : "N/A"}</span>;
      },
      ellipsis: true,
    },
    {
      title: "Commission to Agent",
      dataIndex: "agentCommissionTotal",
      key: "agentCommissionTotal",
      sorter: (a, b) => a.agentCommissionTotal - b.agentCommissionTotal,
      sortOrder: sortedInfo.columnKey === "agentCommissionTotal" ? sortedInfo.order : null,
      render: (agentCommissionTotal) => <span>${(formatNumberWithCommasAndDecimals(agentCommissionTotal) || 0)}</span>,
      ellipsis: true,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) =>
        createdAt ? format(new Date(createdAt), "dd MMMM yyyy, hh:mm a") : "No date",
    },
  ];

  const tableSourceData = filteredData.map((item, index) => ({
    ...item,
    serial: index + 1,
  }));

  
  const calculateTotalCommission = (status?: string) => {
    const total = filteredData.reduce((sum, item) => {
      if (status && item.status.toLowerCase() !== status.toLowerCase()) {
        return sum;
      }
      return sum + (Number(item.agentCommissionTotal) || 0);
    }, 0);
    return total.toFixed(2);
  };

  const calculateAverageCommission = () => {
    const total = filteredData.reduce((sum, item) => sum + (Number(item.commissionProperty) || 0), 0);
    return (total / (filteredData.length || 1)).toFixed(1);
  };
  const calculateAverageTax = () => {
    const total = filteredData.reduce((sum, item) => sum + (Number(item.tax) || 0), 0);
    return (total / (filteredData.length || 1)).toFixed(1);
  };

  const calculateTotalListingPrice = () => {
    const total = filteredData.reduce((sum, item) => {
      const listingPrice = item.tradeSheet?.properties?.[0]?.listingPrice || 0;
      return sum + Number(listingPrice);
    }, 0);
    return total.toFixed(2);
  };
  const calculateTotalSalesPrice = () => {
    const total = filteredData.reduce((sum, item) => {
      const salesPrice = item.tradeSheet?.properties?.[0]?.salesPrice || 0;
      return sum + Number(salesPrice);
    }, 0);
    return total.toFixed(2);
  };
  const calculateTotalSoldPrice = () => {
    const total = filteredData.reduce((sum, item) => {
      const soldPrice = item.tradeSheet?.properties?.[0]?.soldPrice || 0;
      return sum + Number(soldPrice);
    }, 0);
    return total.toFixed(2);
  };
  const calculateTotalBaseCommission = () => {
    const total = filteredData.reduce((sum, item) => {
      const soldPrice = item.tradeSheet?.tradeTransaction?.[0]?.baseOfficeCommissionTotal || 0;
      return sum + Number(soldPrice);
    }, 0);
    return total.toFixed(2);
  };
  const calculateTotalNetCommission = () => {
    const total = filteredData.reduce((sum, item) => {
      const soldPrice = item.tradeSheet?.tradeTransaction?.[0]?.netCommissionTotal || 0;
      return sum + Number(soldPrice);
    }, 0);
    return total.toFixed(2);
  };

  const handleExport = () => {
    const exportData = filteredData.map((item) => ({
      Trade_id: item.tradeSheet?.tradeSheetTypeId || "N/A",
      Agent_Commission_Transfer: item.status,
      Base_Office_Commission: `${item.tradeSheet.tradeTransaction?.[0]?.baseOfficeCommissionTotal}%`,
      Net_Commission: `${item.tradeSheet.tradeTransaction?.[0]?.netCommissionTotal}%`,
      Agent_Commission: `$${(Number(item.agentCommissionTotal) || 0).toFixed(2)}`, // Ensure number
      Issued_date: item.createdAt ? format(new Date(item.createdAt), "dd MMMM yyyy, hh:mm a") : "No date",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agent Trade Commission Report");
    XLSX.writeFile(wb, "trade_commission_report.xlsx");
  };

  const handlePdfExport = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;
    const startY = 30; 
    const lineHeight = 10;
    const fontSize = 8; 
  
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(fontSize);

    const logoX = (pageWidth / 2) - 10;
    const logoY = 5; 
    const logoWidth = 20; 
    const logoHeight = 20; 
    pdf.addImage(logo1, "PNG", logoX, logoY, logoWidth, logoHeight);

    pdf.text("Agent Trade Commission Report", pageWidth / 2, startY, { align: "center" });

    const headers = ["Trade ID", "Agent_Commission_Transfer", "Base_Office_Commission", "Net_Commission", "Agent_Commission", "Created At"];
    const columnWidths = [20, 40, 40, 30, 30, 40]; 
    
    let x = margin;
    headers.forEach((header, index) => {
        pdf.text(header, x, startY + lineHeight);
        x += columnWidths[index];
    });

    let currentY = startY + 2 * lineHeight; // Start below headers
    filteredData.forEach((item) => {
        const row = [
          item.tradeSheet?.tradeSheetTypeId || "N/A",
          item.status,
          `${item.tradeSheet.tradeTransaction?.[0]?.baseOfficeCommissionTotal}%`,
          `${item.tradeSheet.tradeTransaction?.[0]?.netCommissionTotal}%`,
          `$${(Number(item.agentCommissionTotal) || 0).toFixed(2)}`, // Ensure number
          item.createdAt ? format(new Date(item.createdAt), "dd MMMM yyyy, hh:mm a") : "No date",
        ];

        if (currentY > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            currentY = margin;
        }

        x = margin;
        row.forEach((cell, index) => {
            pdf.text(String(cell), x, currentY); // Convert to string to avoid errors
            x += columnWidths[index];
        });

        currentY += lineHeight;
    });

    pdf.save("commission_report.pdf");
};

  return (
    <div>
      {/* Commission Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 my-3">
        {/* Total Trades */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-indigo-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Total Trades</span>
            <span className="text-lg font-semibold text-indigo-600">
              {formatNumberWithCommasAndDecimals(filteredData.length)}
            </span>
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Total Listing Price</span>
            <span className="text-lg font-semibold text-orange-600">
              ${formatNumberWithCommasAndDecimals(calculateTotalListingPrice())}
            </span>
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Total Sales Price</span>
            <span className="text-lg font-semibold text-orange-600">
              ${formatNumberWithCommasAndDecimals(calculateTotalSalesPrice())}
            </span>
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Total Sold Price</span>
            <span className="text-lg font-semibold text-orange-600">
              ${formatNumberWithCommasAndDecimals(calculateTotalSoldPrice())}
            </span>
          </div>
        </div>

        {/* Total Income */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Total Base Office Commission</span>
            <span className="text-lg font-semibold text-blue-600">
              ${formatNumberWithCommasAndDecimals(calculateTotalBaseCommission())}
            </span>
          </div>
        </div>
        {/* Total Income */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Total Net Commission</span>
            <span className="text-lg font-semibold text-blue-600">
              ${formatNumberWithCommasAndDecimals(calculateTotalNetCommission())}
            </span>
          </div>
        </div>
        {/* Total Income */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Total Commission to Agent</span>
            <span className="text-lg font-semibold text-blue-600">
              ${formatNumberWithCommasAndDecimals(calculateTotalCommission())}
            </span>
          </div>
        </div>

        {/* Transferred Amount */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Total Transferred Amount to Agent</span>
            <span className="text-lg font-semibold text-green-600">
              ${formatNumberWithCommasAndDecimals(calculateTotalCommission('completed'))}
            </span>
          </div>
        </div>

        {/* Average Commission Rate */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Average Commission Rate</span>
            <span className="text-lg font-semibold text-red-600">
              {formatNumberWithCommasAndDecimals(calculateAverageCommission())}%
            </span>
          </div>
        </div>
        {/* Average Tax Rate */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-teal-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Average Tax Rate</span>
            <span className="text-lg font-semibold text-teal-600">
              {formatNumberWithCommasAndDecimals(calculateAverageTax())}%
            </span>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-3 justify-end my-3">
        <FaFilePdf
          onClick={handlePdfExport}
          size={32}
          className="cursor-pointer text-red-600 hover:text-red-700"
          title="Export to PDF"
        />
        <FaFileExcel
          onClick={handleExport}
          size={32}
          className="cursor-pointer text-green-600 hover:text-green-700"
          title="Export to Excel"
        />
      </div>

      {/* Table */}
      <div ref={tableRef}>
        <Table
          rowKey="id"
          scroll={{ x: "max-content" }}
          columns={columns}
          dataSource={tableSourceData}
          pagination={{ pageSize: 20 }}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default MarketplaceReport;
