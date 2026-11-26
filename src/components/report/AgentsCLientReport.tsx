// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useState } from 'react';
import { formatDate, parseISO } from 'date-fns';
// import TableLoader from '../loader/TableLoader';
import { Table, Tag } from 'antd';
import type { TableColumnsType, TableProps } from "antd";
import * as XLSX from 'xlsx';
import { FaFileExcel, FaFilePdf  } from "react-icons/fa";
import jsPDF from 'jspdf';
import logo1 from "/logo.png";
import { useRef } from "react";
// import getStatusBadge from '../Utils/StatusBadge';



interface SupportItem {
  id: string;
  clientUser:{
    name: string;
    status: string;
    createdAt: string;
    email: string;
    phoneNumber: string;
    clientType: string;
  }
  
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
      title: "Name",
      dataIndex: "clientUser",
      key: "clientUser",
      render: (clientUser) => (
        <span>{clientUser.name}</span> 
      ),
      sorter: (a, b) => a.clientUser.name.localeCompare(b.clientUser.name),
      sortOrder: sortedInfo.columnKey === "name" ? sortedInfo.order : null,
    },    
    {
      title: "Email",
      dataIndex: "clientUser",
      key: "clientUser",
      render: (clientUser) => (
        <span>{clientUser.email}</span> 
      ),
      sorter: (a, b) => a.clientUser.email.localeCompare(b.clientUser.email),
      sortOrder: sortedInfo.columnKey === "email" ? sortedInfo.order : null,
    },    
    {
      title: "Phone Number",
      dataIndex: "clientUser",
      key: "clientUser",
      render: (clientUser) => (
        <span>{clientUser.phoneNumber}</span> 
      ),
      sorter: (a, b) => a.clientUser.phoneNumber.localeCompare(b.clientUser.phoneNumber),
      sortOrder: sortedInfo.columnKey === "phoneNumber" ? sortedInfo.order : null,
    },    
    {
      title: "Client Type",
      dataIndex: "clientUser",
      key: "clientType",      
      filters: [
        { text: "Seller", value: "Seller" },
        { text: "Buyer", value: "Buyer" },
        { text: "Tenant", value: "Tenant" },
        { text: "Landlord", value: "Landlord" },
      ],
      render: (clientUser) =>
        clientUser.clientType === "Seller" ? (
          <Tag color="blue" className="mx-2">
            Seller
          </Tag>
        ) : clientUser.clientType === "Buyer" ? (
          <Tag color="orange" className="mx-2">
            Buyer
          </Tag>
        ) : clientUser.clientType === "Tenant" ? (
          <Tag color="green" className="mx-2">
            Tenant
          </Tag>
        ) : (
          <Tag color="red" className="mx-2">
            Landlord
          </Tag>
        ),
      filteredValue: filteredInfo?.clientType || null,
      onFilter: (value, record) =>record?.clientUser.clientType.includes(value as string),
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
      name: item.clientUser.name,
      Email: item.clientUser.email,
      Number: item.clientUser.phoneNumber,
      Type: item.clientUser.clientType,
      status: item.status,
      createdAt: item.createdAt ? formatDate(parseISO(item.createdAt), "dd MMMM yyyy, hh:mm a") : "No date",
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData); 
    const wb = XLSX.utils.book_new(); 
    XLSX.utils.book_append_sheet(wb, ws, "Client Report");
    XLSX.writeFile(wb, "client_report.xlsx");
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

    pdf.text("Client Report", pageWidth / 2, startY, { align: "center" });

    const headers = ["Name", "Email", "Phone Number", "Client Type", "Status", "Created At"];
    const columnWidths = [40, 40, 30, 25, 25, 40]; 
    
    let x = margin;
    headers.forEach((header, index) => {
        pdf.text(header, x, startY + lineHeight);
        x += columnWidths[index];
    });

    let currentY = startY + 2 * lineHeight; // Start below headers
    filteredData.forEach((item) => {
        const row = [
            item.clientUser.name || "...",
            item.clientUser.email || "...",
            item.clientUser.phoneNumber || "...",
            item.clientUser.clientType || "...",
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

    pdf.save("client_report.pdf");
};

  // Calculate client type counts
  const clientTypeCounts = filteredData.reduce((acc, item) => {
    const type = item?.clientUser?.clientType;
    if (type) {
      acc[type.toLowerCase()] = (acc[type.toLowerCase()] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      {/* Client Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 my-3">
        {/* Total Clients */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Total Clients</span>
            <span className="text-lg font-semibold text-blue-600">
              {filteredData.length}
            </span>
          </div>
        </div>

        {/* Sellers */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-indigo-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Sellers</span>
            <span className="text-lg font-semibold text-indigo-600">
              {clientTypeCounts.seller || 0}
            </span>
          </div>
        </div>

        {/* Buyers */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Buyers</span>
            <span className="text-lg font-semibold text-orange-600">
              {clientTypeCounts.buyer || 0}
            </span>
          </div>
        </div>

        {/* Tenants */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Tenants</span>
            <span className="text-lg font-semibold text-green-600">
              {clientTypeCounts.tenant || 0}
            </span>
          </div>
        </div>

        {/* Landlords */}
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Landlords</span>
            <span className="text-lg font-semibold text-purple-600">
              {clientTypeCounts.landlord || 0}
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

export default Supports;
