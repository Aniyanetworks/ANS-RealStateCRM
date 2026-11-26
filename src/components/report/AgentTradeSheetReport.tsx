import React, { useState } from 'react';
import { formatDate, parseISO } from 'date-fns';
import { Table, Tag } from 'antd';
import type { TableColumnsType, TableProps } from "antd";
import * as XLSX from 'xlsx';
import { FaFileExcel, FaFilePdf  } from "react-icons/fa";
import jsPDF from 'jspdf';
import { useRef } from "react";
import logo1 from "/logo.svg";



interface tradeItem {
  id: string;
  tradeSheetTypeId: string;
  status: string;
  tradeStatus: string;
  createdAt: string;
  name: string;
}

interface TradeProps {
  filteredData: tradeItem[];
}

type OnChange = NonNullable<TableProps<tradeItem>["onChange"]>;
type Filters = Parameters<OnChange>[1];

type GetSingle<T> = T extends (infer U)[] ? U : never;
type Sorts = GetSingle<Parameters<OnChange>[2]>;

const Supports: React.FC<TradeProps> = ({ filteredData }) => {
  const [filteredInfo, setFilteredInfo] = useState<Filters>({});
  const [sortedInfo, setSortedInfo] = useState<Sorts>({});

  const handleChange: OnChange = (_pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter as Sorts);
  };

  const columns: TableColumnsType<tradeItem> = [
    {
      title: "Trade Sheet Id",
      dataIndex: "tradeSheetTypeId",
      key: "tradeSheetTypeId",
      render: (tradeSheetTypeId) => (
        <span>{tradeSheetTypeId}</span> 
      ),
      sorter: (a, b) => a.tradeSheetTypeId.localeCompare(b.tradeSheetTypeId),
      sortOrder: sortedInfo.columnKey === "tradeSheetTypeId" ? sortedInfo.order : null,
    },        
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <span>{name}</span> 
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortOrder: sortedInfo.columnKey === "name" ? sortedInfo.order : null,
    },  
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        {
          text: "Approved",
          value: "approved",
        },
        {
          text: "Under Review",
          value: "underReview",
        },
        {
          text: "Draft",
          value: "draft",
        },
        {
          text: "Rejected",
          value: "rejected",
        }
      ],
      filteredValue: filteredInfo.status || null,
      onFilter: (value, record) => record.status.includes(value as string),      
      render: (status) => {
        const statusColors: Record<string, string> = {
          approved: "green",
          underReview: "blue",
          draft: "gray",
          rejected: "red",
        };
    
        const formattedStatus =
          status?.charAt(0).toUpperCase() +
          status?.slice(1).toLowerCase();
    
        return (
          <Tag color={statusColors[status]} className="mx-2">
            {formattedStatus}
          </Tag>
        );
      },
      sorter: (a, b) => a.status.length - b.status.length,
      sortOrder: sortedInfo.columnKey === "status" ? sortedInfo.order : null,
      ellipsis: true,
    },
    
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => createdAt ? formatDate(parseISO(createdAt), "dd MMMM yyyy, hh:mm a") : "No date",
    }
  ];

  const tableSourceData = filteredData.map((item, index) => ({
    ...item,
    serial: index + 1,
  }));

  const handleExport = () => {
    const exportData = filteredData.map(item => ({
      tradeSheetTypeId: item.tradeSheetTypeId,
      name: item.name,
      status: item.status,
      createdAt: item.createdAt,
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData); 
    const wb = XLSX.utils.book_new(); 
    XLSX.utils.book_append_sheet(wb, ws, "Marketplace Report");
    XLSX.writeFile(wb, "marketplace_report.xlsx");
  };

  const tableRef = useRef<HTMLDivElement | null>(null);

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

    pdf.text("Trade Sheet Report", pageWidth / 2, startY, { align: "center" });

    const headers = ["Trade Id", "Name","Status", "Created At"];
    const columnWidths = [30, 30, 30, 40]; 
    
    let x = margin;
    headers.forEach((header, index) => {
        pdf.text(header, x, startY + lineHeight);
        x += columnWidths[index];
    });

    let currentY = startY + 2 * lineHeight;
    filteredData.forEach((item) => {
        const row = [
            item.tradeSheetTypeId || "...",
            item.name || "...",
            item.status || "Unknown",
            item.createdAt ? formatDate(parseISO(item.createdAt), "dd MMMM yyyy, hh:mm a") : "N/A"
        ];

        if (currentY > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            currentY = margin;
        }

        x = margin;
        row.forEach((cell, index) => {
            pdf.text(String(cell), x, currentY);
            x += columnWidths[index];
        });

        currentY += lineHeight;
    });

    pdf.save("trade_report.pdf");
};

  const statusCounts = filteredData.reduce((acc, item) => {
    const status = item?.status?.toLowerCase();
    if (status) {
      acc[status] = (acc[status] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div className="my-3">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Total Trade Sheet</span>
              <span className="text-lg font-semibold text-blue-600">
                {filteredData.length}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500 hover:shadow-md transition-shadow">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Approved</span>
              <span className="text-lg font-semibold text-green-600">
                {statusCounts.approved || 0}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Under Review</span>
              <span className="text-lg font-semibold text-blue-600">
                {statusCounts.underreview || 0}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-500 hover:shadow-md transition-shadow">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Draft</span>
              <span className="text-lg font-semibold text-gray-600">
                {statusCounts.draft || 0}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500 hover:shadow-md transition-shadow">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Rejected</span>
              <span className="text-lg font-semibold text-red-600">
                {statusCounts.rejected || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

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

export default Supports;
