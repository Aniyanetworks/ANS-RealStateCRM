import React, { useState } from 'react';
import { formatDate, parseISO } from 'date-fns';
// import TableLoader from '../loader/TableLoader';
import { Table, Tag } from 'antd';
import type { TableColumnsType, TableProps } from "antd";
import * as XLSX from 'xlsx';
import { FaFileExcel, FaFilePdf  } from "react-icons/fa";
import TicketStatusSummary from './TicketStatusSummery';
import jsPDF from 'jspdf';
import { useRef } from "react";
import logo1 from "/logo.svg";


interface SupportItem {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  type: string;
  priority: string;
}

interface SupportProps {
  filteredData: SupportItem[];
}

type OnChange = NonNullable<TableProps<SupportItem>["onChange"]>;
type Filters = Parameters<OnChange>[1];

type GetSingle<T> = T extends (infer U)[] ? U : never;
type Sorts = GetSingle<Parameters<OnChange>[2]>;

const Supports: React.FC<SupportProps> = ({ filteredData }) => {
  const [filteredInfo, setFilteredInfo] = useState<Filters>({});
  const [sortedInfo, setSortedInfo] = useState<Sorts>({});

  const handleChange: OnChange = (pagination, filters, sorter) => {
    console.log(pagination);
    setFilteredInfo(filters);
    setSortedInfo(sorter as Sorts);
  };



  const columns: TableColumnsType<SupportItem> = [
    {
      title: "#",
      key: "serial",
      dataIndex: "serial",
      width: 50,
      fixed: "left",
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (title: string) => (
        <span>{title}</span> 
      ),
      sorter: (a, b) => a.title.localeCompare(b.title),
      sortOrder: sortedInfo.columnKey === "title" ? sortedInfo.order : null,
    },    
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      filters: [
        { text: "New Feature", value: "New Feature" },
        { text: "Improvement", value: "Improvement" },
        { text: "Bug Fix", value: "Bug Fix" },
        { text: "Other", value: "Other" },
      ],      
      filteredValue: filteredInfo?.type,
      render: (type: string) =>
        type === "New Feature" ? (
          <Tag color="green">New Feature</Tag>
        ) : type === "Improvement" ? (
          <Tag color="yellow">Improvement</Tag>
        ) : type === "Bug Fix" ? (
          <Tag color="red">Bug Fix</Tag>
        ) : (
          <Tag color="purple">Other</Tag>
        ),
        onFilter: (value, record) => record?.type.includes(value as string),
        ellipsis: true,
    },    
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      filters: [
        { text: "Low", value: "Low" },
        { text: "Medium", value: "Medium" },
        { text: "High", value: "High" },
      ],
      filteredValue: filteredInfo?.priority,
      render: (priority: string) =>
        priority === "Low" ? (
                <Tag color="green">Low</Tag>
              ) : priority === "Medium" ? (
                <Tag color="blue">Medium</Tag>
              ) : (
                <Tag color="red">High</Tag>
              ),
      onFilter: (value, record) => record?.priority.includes(value as string),
      ellipsis: true,
    },    
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Open", value: "open" },
        { text: "In Progress", value: "inProgress" },
        { text: "Completed", value: "completed" },
        { text: "Closed", value: "closed" },
      ],
      filteredValue: filteredInfo?.status,

      render: (status:string) =>
        status === "completed" ? (
          <Tag color="blue" className="mx-2">
            Completed
          </Tag>
        ) : status === "inProgress" ? (
          <Tag color="orange" className="mx-2">
            In Progress
          </Tag>
        ) : status === "closed" ? (
          <Tag color="green" className="mx-2">
            Closed
          </Tag>
        ) : (
          <Tag color="red" className="mx-2">
            Open
          </Tag>
        ),
        
      onFilter: (value, record) => record?.status.includes(value as string),
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

  

  // Function to handle Excel export
  const handleExport = () => {
    const exportData = filteredData.map(item => ({
      title: item.title,
      type: item.type,
      priority: item.priority,
      status: item.status,
      createdAt: item.createdAt ? formatDate(parseISO(item.createdAt), "dd MMMM yyyy, hh:mm a") : "N/A",
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

    pdf.text("Support Request Report", pageWidth / 2, startY, { align: "center" });

    const headers = ["Title", "Type", "Priority", "Status", "Created At"];
    const columnWidths = [80, 30, 20, 25, 40]; 
    
    let x = margin;
    headers.forEach((header, index) => {
        pdf.text(header, x, startY + lineHeight);
        x += columnWidths[index];
    });

    let currentY = startY + 2 * lineHeight; // Start below headers
    filteredData.forEach((item) => {
        const row = [
            item.title || "...",
            item.type || "...",
            item.priority || "...",
            item.status || "Unknown",
            item.createdAt ? formatDate(parseISO(item.createdAt), "dd MMMM yyyy, hh:mm a") : "N/A"
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

    pdf.save("support_report.pdf");
};

  return (
      <div>
        <TicketStatusSummary filteredData={filteredData} />
      <div>

      <div className="flex gap-3 justify-end"> 
        <FaFilePdf
          onClick={handlePdfExport}
          size={32} 
          className="cursor-pointer text-red-600 hover:text-red-700 my-3"
          aria-label="Export to Excel"
          title="Export to Excel"
        />
        <FaFileExcel
          onClick={handleExport}
          size={32} 
          className="cursor-pointer text-green-600 hover:text-green-700 my-3"
          aria-label="Export to Excel"
          title="Export to Excel"
        />
      </div>

        {/* {filteredData.length === 0 ? (
          <TableLoader />
        ) : ( */}
          <div id="table-container" ref={tableRef} >
            <Table
              rowKey="id"
              scroll={{ x: "max-content" }}
              columns={columns}
              dataSource={tableSourceData}
              pagination={{ pageSize: 20 }}
              onChange={handleChange}
            />
          </div>
        {/* )} */}
      </div>
    </div>
  );
};

export default Supports;
