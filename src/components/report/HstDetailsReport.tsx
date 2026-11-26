// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useState, useRef } from "react";
import { format } from "date-fns";
import { Table, Tag } from "antd";
import type { TableColumnsType, TableProps } from "antd";
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
  id: number;
  invoice_number: string;
  tax: string;
  total: string;
  name: string;
  description: string;
  transactionDate: string;
  createdAt: string;
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

type OnChange = NonNullable<TableProps<any>["onChange"]>;
type Filters = Parameters<OnChange>[1];
type Sorts = Parameters<OnChange>[2] extends (infer U)[] ? U : never;

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

const HstDetailsReport: React.FC<HstDetailsReportProps> = ({
  filteredData,
  filteredMarketplaceData,
  filteredExpenseData,
  dateRangeLabel,
  toolbar
}) => {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [sortedInfo, setSortedInfo] = useState<Sorts>({} as Sorts);

  const handleChange: OnChange = (_, filters, sorter) => {
    setSortedInfo(sorter as Sorts);
  };

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
        type: `${item.expenseCategory?.name || 'Other'}`,
        reference: item.invoice_number,
        createdAt: item.createdAt,
        earned: "0.00",
        itc: item.tax,
        parentId: item.id,
        source: 'expense'
      });
    }
  });

  const columns: TableColumnsType<ExpandedRowData> = [
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      render: (source) => {
        let color = 'blue';
        if (source === 'marketplace') color = 'green';
        if (source === 'expense') color = 'orange';
        return (
          <Tag color={color}>
            {source === 'trade' ? 'Trade' : source === 'marketplace' ? 'Marketplace' : 'Expense'}
          </Tag>
        );
      },
      filters: [
        { text: 'Trade', value: 'trade' },
        { text: 'Marketplace', value: 'marketplace' },
        { text: 'Expense', value: 'expense' },
      ],
      onFilter: (value, record) => record.source === value,
    },
    {
      title: "Reference",
      dataIndex: "reference",
      key: "reference",
      sorter: (a, b) => a.reference.localeCompare(b.reference),
      sortOrder: sortedInfo.columnKey === "reference" ? sortedInfo.order : null,
      ellipsis: true,
    },
    {
      title: "Description",
      dataIndex: "type",
      key: "type",
      sorter: (a, b) => a.type.localeCompare(b.type),
      sortOrder: sortedInfo.columnKey === "type" ? sortedInfo.order : null,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => format(new Date(createdAt), "dd MMMM yyyy, hh:mm a"),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      sortOrder: sortedInfo.columnKey === "createdAt" ? sortedInfo.order : null,
    },
    {
      title: "HST Earned",
      dataIndex: "earned",
      key: "earned",
      render: (earned) => <span>${formatNumberWithCommasAndDecimals(earned || 0)}</span>,
      sorter: (a, b) => Number(a.earned) - Number(b.earned),
      sortOrder: sortedInfo.columnKey === "earned" ? sortedInfo.order : null,
    },
    {
      title: "HST I.T.C",
      dataIndex: "itc",
      key: "itc",
      render: (itc) => <span>${formatNumberWithCommasAndDecimals(itc || 0)}</span>,
      sorter: (a, b) => Number(a.itc) - Number(b.itc),
      sortOrder: sortedInfo.columnKey === "itc" ? sortedInfo.order : null,
    },
    {
      title: "Net Remit",
      key: "netRemit",
      render: (_, record) => <span>${formatNumberWithCommasAndDecimals((Number(record.earned) - Number(record.itc)) || 0)}</span>,
      sorter: (a, b) => (Number(a.earned) - Number(a.itc)) - (Number(b.earned) - Number(b.itc)),
      sortOrder: sortedInfo.columnKey === "netRemit" ? sortedInfo.order : null,
    }
  ];

  const totalHst = () => {
    return expandedData
      .reduce((sum, item) => sum + Number(item.earned || 0), 0)
      .toFixed(2);
  };

  const totalItc = () => {
    return expandedData
      .reduce((sum, item) => sum + Number(item.itc || 0), 0)
      .toFixed(2);
  };

  const totalNetRemit = () => {
    return expandedData
      .reduce((sum, item) => sum + (Number(item.earned) - Number(item.itc)), 0)
      .toFixed(2);
  };

  const totalBySource = (source: 'trade' | 'marketplace' | 'expense') => {
    return expandedData
      .filter(item => item.source === source)
      .reduce((sum, item) => sum + Number(item.earned || 0), 0)
      .toFixed(2);
  };

  const totalItcBySource = (source: 'trade' | 'marketplace' | 'expense') => {
    return expandedData
      .filter(item => item.source === source)
      .reduce((sum, item) => sum + Number(item.itc || 0), 0)
      .toFixed(2);
  };

  const handleExport = () => {
    const exportData = expandedData.map((item) => ({
      Source: item.source === 'trade' ? 'Trade' : item.source === 'marketplace' ? 'Marketplace' : 'Expense',
      Reference: item.reference,
      Description: item.type,
      "Created At": format(new Date(item.createdAt), "dd MMMM yyyy, hh:mm a"),
      "HST Earned": `$${formatNumberWithCommasAndDecimals(item.earned || 0)}`,
      "HST I.T.C": `$${formatNumberWithCommasAndDecimals(item.itc || 0)}`,
      "Net Remit": `$${formatNumberWithCommasAndDecimals((Number(item.earned) - Number(item.itc)) || 0)}`
    }));

    exportData.push({
      Source: "Total",
      Reference: "",
      Description: "",
      "Created At": "",
      "HST Earned": `$${formatNumberWithCommasAndDecimals(totalHst())}`,
      "HST I.T.C": `$${formatNumberWithCommasAndDecimals(totalItc())}`,
      "Net Remit": `$${formatNumberWithCommasAndDecimals(totalNetRemit())}`
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();

    if (dateRangeLabel) {
      const dateRangeText = String(dateRangeLabel.props.children).replace(/,\s*/g, '');
      XLSX.utils.sheet_add_aoa(ws, [[`Source: ${dateRangeText}`]], { origin: "A1" });
    }

    XLSX.utils.book_append_sheet(wb, ws, "HST Detailed Report");
    XLSX.writeFile(wb, "hst_detailed_report.xlsx");
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

    pdf.text("Detailed HST Report", pageWidth / 2, startY, { align: "center" });

    if (dateRangeLabel) {
      const dateRangeText = `${String(dateRangeLabel.props.children).replace(/,\s*/g, '')}`;
      pdf.text(dateRangeText, pageWidth / 2, startY + lineHeight, { align: "center" });
    }

    const headers = [
      "Source",
      "Reference",
      "Description",
      "Created At",
      "HST Earned",
      "HST I.T.C",
      "Net Remit"
    ];

    const columnWidths = [20, 25, 40, 25, 20, 20, 20];

    let x = margin;
    headers.forEach((header, index) => {
      pdf.text(header, x, startY + 2 * lineHeight);
      x += columnWidths[index];
    });

    let currentY = startY + 3 * lineHeight;
    expandedData.forEach((item) => {
      const row = [
        item.source === 'trade' ? 'Trade' : item.source === 'marketplace' ? 'Marketplace' : 'Expense',
        item.reference,
        item.type,
        format(new Date(item.createdAt), "dd MMM yyyy"),
        `$${formatNumberWithCommasAndDecimals(item.earned || 0)}`,
        `$${formatNumberWithCommasAndDecimals(item.itc || 0)}`,
        `$${formatNumberWithCommasAndDecimals((Number(item.earned) - Number(item.itc)) || 0)}`
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

    currentY += lineHeight;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Summary", margin, currentY);
    currentY += lineHeight;

    pdf.setFont("helvetica", "normal");
    pdf.text(`Total HST Earned: $${formatNumberWithCommasAndDecimals(totalHst())}`, margin, currentY);
    currentY += lineHeight;
    pdf.text(`- From Trade: $${formatNumberWithCommasAndDecimals(totalBySource('trade'))}`, margin + 10, currentY);
    currentY += lineHeight;
    pdf.text(`- From Marketplace: $${formatNumberWithCommasAndDecimals(totalBySource('marketplace'))}`, margin + 10, currentY);
    currentY += lineHeight;
    pdf.text(`Total HST I.T.C: $${formatNumberWithCommasAndDecimals(totalItc())}`, margin, currentY);
    currentY += lineHeight;
    pdf.text(`- From Trade: $${formatNumberWithCommasAndDecimals(totalItcBySource('trade'))}`, margin + 10, currentY);
    currentY += lineHeight;
    pdf.text(`- From Marketplace: $${formatNumberWithCommasAndDecimals(totalItcBySource('marketplace'))}`, margin + 10, currentY);
    currentY += lineHeight;
    pdf.text(`- From Expenses: $${formatNumberWithCommasAndDecimals(totalItcBySource('expense'))}`, margin + 10, currentY);
    currentY += lineHeight;
    pdf.text(`Total Net Remit: $${formatNumberWithCommasAndDecimals(totalNetRemit())}`, margin, currentY);

    pdf.save("detailed_hst_report.pdf");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 flex-wrap">
        <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">HST Details Report</h1>
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
        <div className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1" style={{ borderLeft: "2px solid #6366f1", background: "#eef2ff" }}>
          <span className="text-xs text-gray-500 whitespace-nowrap">HST Earned:</span>
          <span className="text-xs font-semibold text-indigo-600 whitespace-nowrap">${formatNumberWithCommasAndDecimals(totalHst())}</span>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1" style={{ borderLeft: "2px solid #3b82f6", background: "#eff6ff" }}>
          <span className="text-xs text-gray-500 whitespace-nowrap">From Trade:</span>
          <span className="text-xs font-semibold text-blue-600 whitespace-nowrap">${formatNumberWithCommasAndDecimals(totalBySource('trade'))}</span>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1" style={{ borderLeft: "2px solid #22c55e", background: "#f0fdf4" }}>
          <span className="text-xs text-gray-500 whitespace-nowrap">Marketplace:</span>
          <span className="text-xs font-semibold text-green-600 whitespace-nowrap">${formatNumberWithCommasAndDecimals(totalBySource('marketplace'))}</span>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1" style={{ borderLeft: "2px solid #f97316", background: "#fff7ed" }}>
          <span className="text-xs text-gray-500 whitespace-nowrap">Expenses:</span>
          <span className="text-xs font-semibold text-orange-600 whitespace-nowrap">${formatNumberWithCommasAndDecimals(totalItcBySource('expense'))}</span>
        </div>
        <div className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1" style={{ borderLeft: "2px solid #ef4444", background: "#fef2f2" }}>
          <span className="text-xs text-gray-500 whitespace-nowrap">Net Remit:</span>
          <span className="text-xs font-semibold text-red-600 whitespace-nowrap">${formatNumberWithCommasAndDecimals(totalNetRemit())}</span>
        </div>
        <div className="flex-1" />
        {toolbar}
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <FaFilePdf onClick={handlePdfExport} size={18} className="cursor-pointer text-red-600 hover:text-red-700" title="Export to PDF" />
          <FaFileExcel onClick={handleExport} size={18} className="cursor-pointer text-green-600 hover:text-green-700" title="Export to Excel" />
        </div>
      </div>

      <div className="p-4" id="hst-report" ref={tableRef}>
        <Table
          rowKey="key"
          scroll={{ x: "max-content" }}
          columns={columns}
          dataSource={expandedData}
          pagination={{ pageSize: 20 }}
          onChange={handleChange}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}>
                  <strong>Total</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <strong>${formatNumberWithCommasAndDecimals(totalHst())}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <strong>${formatNumberWithCommasAndDecimals(totalItc())}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <strong>${formatNumberWithCommasAndDecimals(totalNetRemit())}</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </div>
    </div>
  );
};

export default HstDetailsReport;