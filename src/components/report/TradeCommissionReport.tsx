// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, {
  useRef,
  useState,
} from 'react';

import logo1 from '/logo.svg';
import type {
  TableColumnsType,
  TableProps,
} from 'antd';
import {
  Table,
  Tag,
} from 'antd';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import {
  FaFileExcel,
  FaFilePdf,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

import {
  formatNumberWithCommasAndDecimals,
} from '../../utils/formatNumberWithCommasAndDecimals';

interface TradeItem {
  id: string;
  tax: string;
  commissionProperty: string;
  agentCommissionTotal: string;
  status: string;
  tradeSheet: {
    id: string;
    status: string;
    tradeSheetTypeId: string;
    name: string;
    email: string;
    representation: string;
    representationType: string;
    multipleRepresentation: string;
    createdAt: string;
  }[];
}

interface TradeCommissionReportProps {
  filteredData: TradeItem[];
  toolbar?: React.ReactNode;
}

type OnChange = NonNullable<TableProps<TradeItem>["onChange"]>;
type Filters = Parameters<OnChange>[1];
type Sorts = Parameters<OnChange>[2] extends (infer U)[] ? U : never;

const TradeCommissionReport: React.FC<TradeCommissionReportProps> = ({ filteredData, toolbar }) => {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [filteredInfo, setFilteredInfo] = useState<Filters>({});
  const [sortedInfo, setSortedInfo] = useState<Sorts>({} as Sorts);

  const handleChange: OnChange = (_, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter as Sorts);
  };

  const columns: TableColumnsType<TradeItem> = [
    {
      title: "Trade Id",
      dataIndex: "tradeSheet",
      key: "tradeSheet",
      sorter: (a, b) => (a.tradeSheet.tradeSheetTypeId || "").localeCompare(b.tradeSheet.tradeSheetTypeId || ""),
      sortOrder: sortedInfo.columnKey === "tradeSheetTypeId" ? sortedInfo.order : null,
      render: (tradeSheet) => {
        return <p>{tradeSheet?.tradeSheetTypeId}</p>;
      },
      ellipsis: true,
    },
    {
      title: "Representation",
      dataIndex: "tradeSheet",
      key: "representation",
      render: (tradeSheet) => <Tag>{tradeSheet?.representation?.charAt(0)?.toUpperCase() + tradeSheet?.representation?.slice(1)}</Tag>,
      ellipsis: true,
    },
    {
      title: "Listing Price",
      dataIndex: "listingPrice",
      key: "listingPrice",
      render: (listingPrice) => <span>${formatNumberWithCommasAndDecimals(listingPrice || 0)}</span>,
      ellipsis: true,
    },
    {
      title: "Sales Price",
      dataIndex: "salesPrice",
      key: "salesPrice",
      render: (salesPrice) => <span>${formatNumberWithCommasAndDecimals(salesPrice || 0)}</span>,
      ellipsis: true,
    },
    {
      title: "Sold Price",
      dataIndex: "soldPrice",
      key: "soldPrice",
      render: (soldPrice) => <span>${formatNumberWithCommasAndDecimals(soldPrice || 0)}</span>,
      ellipsis: true,
    },
    {
      title: "Base Office Commission",
      dataIndex: "baseOfficeCommissionTotal",
      key: "baseOfficeCommissionTotal",
      render: (baseOfficeCommissionTotal) => <span>${formatNumberWithCommasAndDecimals(baseOfficeCommissionTotal || 0)}</span>,
      ellipsis: true,
    },
    {
      title: "Net Commission",
      dataIndex: "netCommissionTotal",
      key: "netCommissionTotal",
      render: (netCommissionTotal) => <span>${formatNumberWithCommasAndDecimals(netCommissionTotal || 0)}</span>,
      ellipsis: true,
    },
    {
      title: "Commission to Agent",
      dataIndex: "agentCommissionTotal",
      key: "agentCommissionTotal",
      render: (agentCommissionTotal) => <span>${formatNumberWithCommasAndDecimals(agentCommissionTotal || 0)}</span>,
      ellipsis: true,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => format(new Date(createdAt), "dd MMMM yyyy, hh:mm a"),
    },
  ];

  const baseOfficeCommission = () => {
    return filteredData
      .reduce((sum, item) => {
        const baseOfficeCommissionTotal = Number(item.baseOfficeCommissionTotal) || 0;
        return sum + baseOfficeCommissionTotal;
      }, 0)
      .toFixed(2);
  };
  const netCommission = () => {
    return filteredData
      .reduce((sum, item) => {
        const netCommissionTotal = Number(item.netCommissionTotal) || 0;
        return sum + netCommissionTotal;
      }, 0)
      .toFixed(2);
  };
  const commissionToAgent = () => {
    return filteredData
      .reduce((sum, item) => {
        const agentCommissionTotal = Number(item.agentCommissionTotal) || 0;
        return sum + agentCommissionTotal;
      }, 0)
      .toFixed(2);
  };


  const handleExport = () => {
    const exportData = filteredData.map((item) => ({
      Trade_id: item.tradeSheet.tradeSheetTypeId,
      Representation: item.tradeSheet.representation,
      Base_Office_Commission_Total: `$${Number(item.baseOfficeCommissionTotal || 0).toFixed(2)}`,
      Net_Commission_Total: `$${Number(item.netCommissionTotal || 0).toFixed(2)}`,
      Agent_Commission_Total: `$${Number(item.agentCommissionTotal || 0).toFixed(2)}`,
      Created_At: format(new Date(item.createdAt), "dd MMMM yyyy, hh:mm a"),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trade Commission Report");
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

    pdf.text("Trade Commission Report", pageWidth / 2, startY, { align: "center" });

    const headers = [
      "Trade ID",
      "Representation",
      "Base Office Commission",
      "Net Commission",
      "Agent Commission",
      "Created At",
    ];

    const columnWidths = [20, 25, 40, 35, 35, 40];

    let x = margin;
    headers.forEach((header, index) => {
      pdf.text(header, x, startY + lineHeight);
      x += columnWidths[index];
    });

    let currentY = startY + 2 * lineHeight;
    filteredData.forEach((item) => {
      const row = [
        item.tradeSheet.tradeSheetTypeId,
        item.tradeSheet.representation,
        `$${formatNumberWithCommasAndDecimals(item.baseOfficeCommissionTotal || 0)}`,
        `$${formatNumberWithCommasAndDecimals(item.netCommissionTotal || 0)}`,
        `$${formatNumberWithCommasAndDecimals(item.agentCommissionTotal || 0)}`,
        format(new Date(item.createdAt), "dd MMMM yyyy, hh:mm a"),
      ];

      if (currentY > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        currentY = margin;
      }

      x = margin;
      row.forEach((cell, index) => {
        pdf.text(cell, x, currentY);
        x += columnWidths[index];
      });

      currentY += lineHeight;
    });

    pdf.save("trade_commission_report.pdf");
  };


  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 flex-wrap">
        <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Trade Report</h1>
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

        <div
          className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1 cursor-pointer"
          style={{ borderLeft: "2px solid #6366f1", background: "#eef2ff" }}
          onClick={() => toast.success(`Total ${filteredData.length} completed trades. Check the list below.`)}
        >
          <span className="text-xs text-gray-500 whitespace-nowrap">Total Trades:</span>
          <span className="text-xs font-semibold text-indigo-600 whitespace-nowrap">{filteredData.length}</span>
        </div>

        <Link
          to="/dashboard/accounting/base-commission-cheque"
          className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1"
          style={{ borderLeft: "2px solid #22c55e", background: "#f0fdf4" }}
        >
          <span className="text-xs text-gray-500 whitespace-nowrap">Base Office Commission:</span>
          <span className="text-xs font-semibold text-green-600 whitespace-nowrap">${formatNumberWithCommasAndDecimals(baseOfficeCommission())}</span>
        </Link>

        <Link
          to="/dashboard/accounting/commission-cheque"
          className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1"
          style={{ borderLeft: "2px solid #ef4444", background: "#fef2f2" }}
        >
          <span className="text-xs text-gray-500 whitespace-nowrap">Net Commission:</span>
          <span className="text-xs font-semibold text-red-600 whitespace-nowrap">${formatNumberWithCommasAndDecimals(netCommission())}</span>
        </Link>

        <Link
          to="/dashboard/accounting/agent-commission-cheque"
          className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1"
          style={{ borderLeft: "2px solid #eab308", background: "#fefce8" }}
        >
          <span className="text-xs text-gray-500 whitespace-nowrap">Commission to Agent:</span>
          <span className="text-xs font-semibold text-yellow-600 whitespace-nowrap">${formatNumberWithCommasAndDecimals(commissionToAgent())}</span>
        </Link>

        <div className="flex-1" />
        {toolbar}
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <FaFilePdf
            onClick={handlePdfExport}
            size={20}
            className="cursor-pointer text-red-600 hover:text-red-700"
            title="Export to PDF"
          />
          <FaFileExcel
            onClick={handleExport}
            size={20}
            className="cursor-pointer text-green-600 hover:text-green-700"
            title="Export to Excel"
          />
        </div>
      </div>

      <div className="p-4" id="report" ref={tableRef}>
        <Table
          rowKey="id"
          scroll={{ x: "max-content" }}
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 20 }}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default TradeCommissionReport;