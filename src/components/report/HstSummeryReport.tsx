// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useState, useRef } from "react";
import { format } from "date-fns";
import { Table, Tag } from "antd";
import type { TableColumnsType } from "antd";
import * as XLSX from "xlsx";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import jsPDF from "jspdf";
import logo1 from "/logo.svg";
import { formatNumberWithCommasAndDecimals } from "../../utils/formatNumberWithCommasAndDecimals";

interface TradeItem {
  id: string;
  tax: string;
  baseOfficeCommissionTax: string;
  agentCommissionTax: string;
  netCommissionTax: string;
  tradeSheet: {
    id: string;
    tradeSheetTypeId: string;
    name: string;
    representation: string;
    createdAt: string;
  };
  createdAt: string;
}

interface MarketplaceOrder {
  id: string;
  invoice_number: string;
  tax: number;
  status: string;
  agent: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface ExpenseItem {
  id: string;
  expense_id: string;
  invoice_number: string;
  tax: string;
  total: string;
  transactionDate: string;
  status: string;
  expenseCategory: {
    name: string;
  };
}

interface HstDetailsReportProps {
  filteredData: TradeItem[];
  filteredMarketplaceData: MarketplaceOrder[];
  filteredExpenseData: ExpenseItem[];
  dateRangeLabel?: React.ReactNode;
  toolbar?: React.ReactNode;
}

interface ExpandedRowData {
  key: string;
  type: string;
  reference: string;
  createdAt: string;
  earned: string;
  itc: string;
  parentId: string;
  source: 'trade' | 'marketplace' | 'expense';
}

interface SummaryData {
  key: string;
  description: string;
  amount: string;
  details?: {
    fromTrade: string;
    fromMarketplace: string;
    fromExpense: string;
  };
}

const HstDetailsReport: React.FC<HstDetailsReportProps> = ({
  filteredData,
  filteredMarketplaceData,
  filteredExpenseData,
  dateRangeLabel,
  toolbar
}) => {
  const tableRef = useRef<HTMLDivElement | null>(null);

  const expandedData: ExpandedRowData[] = [];
  
  filteredData.forEach((item) => {
    if (item.agentCommissionTax && Number(item.agentCommissionTax)) {
      expandedData.push({
        key: `${item.id}-agent`,
        type: "Agent Commission",
        reference: item.tradeSheet?.tradeSheetTypeId || "",
        createdAt: item.createdAt,
        earned: item.agentCommissionTax,
        itc: "0.00",
        parentId: item.id,
        source: 'trade'
      });
    }

    if (item.netCommissionTax && Number(item.netCommissionTax)) {
      expandedData.push({
        key: `${item.id}-net`,
        type: "Net Commission",
        reference: item.tradeSheet?.tradeSheetTypeId || "",
        createdAt: item.createdAt,
        earned: item.netCommissionTax,
        itc: "0.00",
        parentId: item.id,
        source: 'trade'
      });
    }
  });

  filteredMarketplaceData.forEach((item) => {
    if (item.tax && Number(item.tax)) {
      expandedData.push({
        key: `${item.id}-marketplace`,
        type: "Marketplace Sale",
        reference: item.invoice_number,
        createdAt: item.createdAt,
        earned: item.tax.toString(),
        itc: "0.00",
        parentId: item.id,
        source: 'marketplace'
      });
    }
  });

  filteredExpenseData.forEach((item) => {
    if (item.tax && Number(item.tax)) {
      expandedData.push({
        key: `${item.id}-expense`,
        type: "Expense",
        reference: item.invoice_number || item.expense_id,
        createdAt: item.transactionDate,
        earned: "0.00",
        itc: item.tax,
        parentId: item.id,
        source: 'expense'
      });
    }
  });

  const totalHst = expandedData
    .reduce((sum, item) => sum + Number(item.earned || 0), 0)
    .toFixed(2);

  const totalItc = expandedData
    .reduce((sum, item) => sum + Number(item.itc || 0), 0)
    .toFixed(2);

  const totalNetRemit = expandedData
    .reduce((sum, item) => sum + (Number(item.earned) - Number(item.itc)), 0)
    .toFixed(2);

  const totalBySource = (source: 'trade' | 'marketplace' | 'expense', field: 'earned' | 'itc') => {
    return expandedData
      .filter(item => item.source === source)
      .reduce((sum, item) => sum + Number(item[field] || 0), 0)
      .toFixed(2);
  };

  const summaryData: SummaryData[] = [
    {
      key: '1',
      description: 'Total HST Earned',
      amount: `$${formatNumberWithCommasAndDecimals(totalHst)}`,
      details: {
        fromTrade: `$${formatNumberWithCommasAndDecimals(totalBySource('trade', 'earned'))}`,
        fromMarketplace: `$${formatNumberWithCommasAndDecimals(totalBySource('marketplace', 'earned'))}`,
        fromExpense: `$${formatNumberWithCommasAndDecimals(totalBySource('expense', 'earned'))}`
      }
    },
    {
      key: '2',
      description: 'Total HST I.T.C',
      amount: `$${formatNumberWithCommasAndDecimals(totalItc)}`,
      details: {
        fromTrade: `$${formatNumberWithCommasAndDecimals(totalBySource('trade', 'itc'))}`,
        fromMarketplace: `$${formatNumberWithCommasAndDecimals(totalBySource('marketplace', 'itc'))}`,
        fromExpense: `$${formatNumberWithCommasAndDecimals(totalBySource('expense', 'itc'))}`
      }
    },
    {
      key: '3',
      description: 'Net Remit',
      amount: `$${formatNumberWithCommasAndDecimals(totalNetRemit)}`
    }
  ];

  const summaryColumns: TableColumnsType<SummaryData> = [
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text, record) => (
        <div>
          <div>{text}</div>
          {record.details && (
            <div className="text-xs text-gray-500 mt-1">
              <div>From Trade: {record.details.fromTrade}</div>
              <div>From Marketplace: {record.details.fromMarketplace}</div>
              <div>From Expense: {record.details.fromExpense}</div>
            </div>
          )}
        </div>
      )
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: 'right',
      render: (amount) => <span className="font-semibold">{amount}</span>
    }
  ];

  const handleExport = () => {
    const exportData = [
      {
        "Description": "Total HST Earned",
        "Amount": `$${formatNumberWithCommasAndDecimals(totalHst)}`,
        "From Trade": `$${formatNumberWithCommasAndDecimals(totalBySource('trade', 'earned'))}`,
        "From Marketplace": `$${formatNumberWithCommasAndDecimals(totalBySource('marketplace', 'earned'))}`,
        "From Expense": `$${formatNumberWithCommasAndDecimals(totalBySource('expense', 'earned'))}`
      },
      {
        "Description": "Total HST I.T.C",
        "Amount": `$${formatNumberWithCommasAndDecimals(totalItc)}`,
        "From Trade": `$${formatNumberWithCommasAndDecimals(totalBySource('trade', 'itc'))}`,
        "From Marketplace": `$${formatNumberWithCommasAndDecimals(totalBySource('marketplace', 'itc'))}`,
        "From Expense": `$${formatNumberWithCommasAndDecimals(totalBySource('expense', 'itc'))}`
      },
      {
        "Description": "Net Remit",
        "Amount": `$${formatNumberWithCommasAndDecimals(totalNetRemit)}`,
        "From Trade": "",
        "From Marketplace": "",
        "From Expense": ""
      }
    ];

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();

        if (dateRangeLabel) {
          const dateRangeText = String(dateRangeLabel.props.children).replace(/,\s*/g, '');
          XLSX.utils.sheet_add_aoa(ws, [[`Source: ${dateRangeText}`]], { origin: "A1" });
        }

    XLSX.utils.book_append_sheet(wb, ws, "HST Summary Report");
    XLSX.writeFile(wb, "hst_summary_report.xlsx");
  };

  const handlePdfExport = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;
    const startY = 30;
    const lineHeight = 10;
    const fontSize = 10;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(fontSize);

    const logoX = (pageWidth / 2) - 10;
    const logoY = 5;
    const logoWidth = 20;
    const logoHeight = 20;
    pdf.addImage(logo1, "PNG", logoX, logoY, logoWidth, logoHeight);
    
    pdf.text("HST Summary Report", pageWidth / 2, startY, { align: "center" });

    if (dateRangeLabel) {
      const dateRangeText = `${String(dateRangeLabel.props.children).replace(/,\s*/g, '')}`;
      pdf.text(dateRangeText, pageWidth / 2, startY + lineHeight, { align: "center" });
    }
  
    let currentY = startY + 3 * lineHeight;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Description", margin, currentY);
    pdf.text("Amount", pageWidth - margin - 20, currentY, { align: "right" });
    currentY += lineHeight;

    pdf.setFont("helvetica", "normal");
    
    pdf.text("Total HST Earned", margin, currentY);
    pdf.text(`$${formatNumberWithCommasAndDecimals(totalHst)}`, pageWidth - margin - 20, currentY, { align: "right" });
    currentY += lineHeight;
    
    pdf.setFontSize(10);
    pdf.text(`From Trade: $${formatNumberWithCommasAndDecimals(totalBySource('trade', 'earned'))}`, margin + 5, currentY);
    currentY += lineHeight;
    pdf.text(`From Marketplace: $${formatNumberWithCommasAndDecimals(totalBySource('marketplace', 'earned'))}`, margin + 5, currentY);
    currentY += lineHeight;
    pdf.text(`From Expense: $${formatNumberWithCommasAndDecimals(totalBySource('expense', 'earned'))}`, margin + 5, currentY);
    currentY += lineHeight;
    
    pdf.setFontSize(12);
    pdf.text("Total HST I.T.C", margin, currentY);
    pdf.text(`$${formatNumberWithCommasAndDecimals(totalItc)}`, pageWidth - margin - 20, currentY, { align: "right" });
    currentY += lineHeight;
    
    pdf.setFontSize(10);
    pdf.text(`From Trade: $${formatNumberWithCommasAndDecimals(totalBySource('trade', 'itc'))}`, margin + 5, currentY);
    currentY += lineHeight;
    pdf.text(`From Marketplace: $${formatNumberWithCommasAndDecimals(totalBySource('marketplace', 'itc'))}`, margin + 5, currentY);
    currentY += lineHeight;
    pdf.text(`From Expense: $${formatNumberWithCommasAndDecimals(totalBySource('expense', 'itc'))}`, margin + 5, currentY);
    currentY += lineHeight;
    
    pdf.setFontSize(12);
    pdf.text("Net Remit", margin, currentY);
    pdf.text(`$${formatNumberWithCommasAndDecimals(totalNetRemit)}`, pageWidth - margin - 20, currentY, { align: "right" });
    
    pdf.save("hst_summary_report.pdf");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100">
        <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">HST Summary Report</h1>
        <div className="flex-1" />
        {toolbar}
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <FaFilePdf
            onClick={handlePdfExport}
            size={18}
            className="cursor-pointer text-red-600 hover:text-red-700"
            title="Export to PDF"
          />
          <FaFileExcel
            onClick={handleExport}
            size={18}
            className="cursor-pointer text-green-600 hover:text-green-700"
            title="Export to Excel"
          />
        </div>
      </div>

      <div className="p-4" id="hst-report" ref={tableRef}>
        <Table
          rowKey="key"
          columns={summaryColumns}
          dataSource={summaryData}
          pagination={false}
          bordered
          className="rounded-lg overflow-hidden"
        />
      </div>
    </div>
  );
};

export default HstDetailsReport;