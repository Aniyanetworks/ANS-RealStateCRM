import React, { useState } from 'react';
import { formatDate, parseISO } from 'date-fns';
// import TableLoader from '../loader/TableLoader';
import { Table, Tag } from 'antd';
import type { TableColumnsType, TableProps } from "antd";
import * as XLSX from 'xlsx';
import { FaFileExcel, FaFilePdf  } from "react-icons/fa";
import jsPDF from 'jspdf';
import { useRef } from "react";
import logo1 from "/logo.svg";
import { formatNumberWithCommasAndDecimals } from '../../utils/formatNumberWithCommasAndDecimals';

interface MarketplaceItem {
  id: string;
  invoice_number: string;
  status: string;
  order_item_status: string;
  issued_date: string;
  total_amount: number;
  tax: number;
  discount: number;
  invoiceItems: {
    order_item_status: string;
    due_date: string;
    total_price: number;
    quantity: number;
  }[];
}


interface MarketplaceReportProps {
  filteredData: MarketplaceItem[];
}

type OnChange = NonNullable<TableProps<MarketplaceItem>["onChange"]>;
type Filters = Parameters<OnChange>[1];

type GetSingle<T> = T extends (infer U)[] ? U : never;
type Sorts = GetSingle<Parameters<OnChange>[2]>;

const MarketplaceReport: React.FC<MarketplaceReportProps> = ({ filteredData }) => {
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [filteredInfo, setFilteredInfo] = useState<Filters>({});
  const [sortedInfo, setSortedInfo] = useState<Sorts>({});

  const handleChange: OnChange = (pagination, filters, sorter) => {
    console.log(pagination);
    setFilteredInfo(filters);
    setSortedInfo(sorter as Sorts);
  };

  const columns: TableColumnsType<MarketplaceItem> = [
    {
      title: "Invoice",
      dataIndex: "invoice_number",
      key: "invoice_number",
      sorter: (a, b) => a.invoice_number.localeCompare(b.invoice_number),
      sortOrder: sortedInfo.columnKey === "invoice_number" ? sortedInfo.order : null,
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Paid", value: "Paid" },
        { text: "Due", value: "Due" },
      ],
      filteredValue: filteredInfo.status || null,
      onFilter: (value, record) => record.status.includes(value as string),
      sorter: (a, b) => a.status.localeCompare(b.status),
      sortOrder: sortedInfo.columnKey === "status" ? sortedInfo.order : null,
      render: (status:string) =>
        status === "Paid" ? (
          <Tag color="blue" className="mx-2">
            Paid
          </Tag>
        ) :  (
          <Tag color="orange" className="mx-2">
            Due
          </Tag>
        ) ,
      ellipsis: true,
    },
    {
      title: "Tax",
      dataIndex: "tax",
      key: "tax",
      sorter: (a, b) => a.tax - b.tax,
      sortOrder: sortedInfo.columnKey === "tax" ? sortedInfo.order : null,
      render: (tax) => <span>${formatNumberWithCommasAndDecimals(tax || '0.00') }</span>,
      ellipsis: true,
    },
    {
      title: "Discount",
      dataIndex: "discount",
      key: "discount",
      sorter: (a, b) => a.discount - b.discount,
      sortOrder: sortedInfo.columnKey === "discount" ? sortedInfo.order : null,
      render: (discount) => <span>${formatNumberWithCommasAndDecimals(discount || '0.00') }</span>,
      ellipsis: true,
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      sorter: (a, b) => a.total_amount - b.total_amount,
      sortOrder: sortedInfo.columnKey === "total_amount" ? sortedInfo.order : null,
      render: (total_amount) => <span>${formatNumberWithCommasAndDecimals(total_amount)}</span>,
      ellipsis: true,
    },
    {
      title: "Created At",
      dataIndex: "issued_date",
      key: "issued_date",
      render: (issued_date) => issued_date ? formatDate(parseISO(issued_date), "dd MMMM yyyy, hh:mm a") : "No date",
    }
  ];

  const tableSourceData = filteredData.map((item, index) => ({
    ...item,
    serial: index + 1,
  }));

  const calculateTotalPurchaseAmount = (orderItemStatusFilter?: string) => {
    return filteredData
      .flatMap((invoice) => invoice.invoiceItems) // Flatten nested items
      .filter((item) => (orderItemStatusFilter ? item.order_item_status === orderItemStatusFilter : true))
      .reduce((sum, item) => sum + item.total_price, 0)
      .toFixed(2);
  };
  
  const calculateTotalPaid = () => {
    return filteredData
      .filter((invoice) => invoice.status === "Paid")
      .reduce((sum, invoice) => sum + invoice.total_amount, 0)
      .toFixed(2);
  };
  
  const calculateTotalDue = () => {
    return filteredData
      .filter((invoice) => invoice.status === "Due")
      .reduce((sum, invoice) => sum + invoice.total_amount, 0)
      .toFixed(2);
  };
  const calculateTotalPending = () => {
    return filteredData
      .filter((invoice) => invoice.status === "Pending")
      .reduce((sum, invoice) => sum + invoice.total_amount, 0)
      .toFixed(2);
  };
  
  const calculateTotalTax = () => {
    return filteredData
      .reduce((sum, invoice) => sum + (invoice.tax || 0), 0)
      .toFixed(2);
  };
  
  const calculateTotalDiscount = () => {
    return filteredData
      .reduce((sum, invoice) => sum + (invoice.discount || 0), 0)
      .toFixed(2);
  };
  
  const calculateTotalBorrow = () => {
    return filteredData
      .flatMap((invoice) => invoice.invoiceItems)
      .filter((item) => item.order_item_status === "Borrow").length;
  };
  const calculateTotalBorrowReturnExpired = () => {
    return filteredData
      .flatMap((invoice) => invoice.invoiceItems)
      .filter((item) => item.order_item_status === "Borrow")
      .filter((item) => new Date(item.due_date) < new Date()).length;
  };
  
  

  // Function to handle Excel export
  const handleExport = () => {
    const exportData = filteredData.map(item => ({
      Invoice: item.invoice_number,
      Status: item.status,
      Issued_date: item.issued_date,
      Tax: item.tax,
      Discount: item.discount,
      Total_amount: item.total_amount,
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData); 
    const wb = XLSX.utils.book_new(); 
    XLSX.utils.book_append_sheet(wb, ws, "Marketplace Report");
    XLSX.writeFile(wb, "marketplace_report.xlsx");
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

    pdf.text("Marketplace Report", pageWidth / 2, startY, { align: "center" });

    const headers = ["Invoice ID", "Total Amount", "Discount", "Tax", "Status", "Created At"];
    const columnWidths = [25, 30, 20, 25, 30, 40]; // Ensure it matches headers
    
    let x = margin;
    headers.forEach((header, index) => {
        pdf.text(header, x, startY + lineHeight);
        x += columnWidths[index];
    });

    let currentY = startY + 2 * lineHeight; // Start below headers
    filteredData.forEach((item) => {
        const row = [
            item.invoice_number || "N/A",
            item.total_amount || "0.00",
            item.discount || "0.00",
            item.tax || "0.00",
            item.status || "Unknown",
            item.issued_date ? formatDate(parseISO(item.issued_date), "dd MMMM yyyy, hh:mm a") : "N/A"
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

    pdf.save("marketplace_report.pdf");
};



  
  

  return (
    <div>
      {/* Modern Report Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 my-3">
        {/* Total Paid */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-teal-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Total Paid Amount</span>
            <span className="text-lg font-semibold text-teal-600">
              ${formatNumberWithCommasAndDecimals(calculateTotalPaid())}
            </span>
          </div>
        </div>

        {/* Total Due */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Total Due Amount</span>
            <span className="text-lg font-semibold text-red-600">
              ${formatNumberWithCommasAndDecimals(calculateTotalDue())}
            </span>
          </div>
        </div>
        {/* Total Pending */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Total Pending Amount</span>
            <span className="text-lg font-semibold text-red-600">
              ${formatNumberWithCommasAndDecimals(calculateTotalPending())}
            </span>
          </div>
        </div>

        {/* Total Purchase */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Total Purchase</span>
            <span className="text-lg font-semibold text-blue-600">
              ${formatNumberWithCommasAndDecimals(calculateTotalPurchaseAmount('Purchase'))}
            </span>
          </div>
        </div>

        {/* Total Borrow */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Total Borrow</span>
            <span className="text-lg font-semibold text-green-600">
              ${formatNumberWithCommasAndDecimals(calculateTotalPurchaseAmount('Borrow'))}
            </span>
          </div>
        </div>

        {/* Total Tax */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-amber-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Total Tax</span>
            <span className="text-lg font-semibold text-amber-600">
              ${formatNumberWithCommasAndDecimals(calculateTotalTax())}
            </span>
          </div>
        </div>

        {/* Total Discount */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-teal-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Total Discount</span>
            <span className="text-lg font-semibold text-teal-600">
              ${formatNumberWithCommasAndDecimals(calculateTotalDiscount())}
            </span>
          </div>
        </div>

        {/* Borrow Products */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-indigo-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Borrowed Order</span>
            <span className="text-lg font-semibold text-indigo-600">
              {formatNumberWithCommasAndDecimals(calculateTotalBorrow())}
            </span>
          </div>
        </div>
        {/* Borrowed Return Date Expired */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-indigo-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Borrowed Date Expired</span>
            <span className="text-lg font-semibold text-indigo-600">
              {formatNumberWithCommasAndDecimals(calculateTotalBorrowReturnExpired())}
            </span>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-3 justify-end"> 
        <FaFilePdf
          onClick={handlePdfExport}
          size={32} 
          className="cursor-pointer text-red-600 hover:text-red-700 my-3"
          aria-label="Export to PDF"
          title="Export to PDF"
        />
        <FaFileExcel
          onClick={handleExport}
          size={32} 
          className="cursor-pointer text-green-600 hover:text-green-700 my-3"
          aria-label="Export to Excel"
          title="Export to Excel"
        />
      </div>

      {/* Table */}
      <div id="table-container" ref={tableRef}>
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
