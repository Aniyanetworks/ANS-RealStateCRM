import React, { useState } from 'react';
import { formatDate, parseISO } from 'date-fns';
import { Table } from 'antd';
import type { TableColumnsType, TableProps } from "antd";
import * as XLSX from 'xlsx';
import { FaFileExcel, FaFilePdf  } from "react-icons/fa";
import jsPDF from 'jspdf';
import { useRef } from "react";
import logo1 from "/logo.svg";

interface PropertyListing {
  id: string;
  mlsNumber: string;
    address:string;
    propertyListingType:string;
    status:string;
    listingStatus:string;
    createdAt:string;
    sellersInfo: Array<{
      firstName: string;
      lastName: string;
    }>;
  issued_date: string;
  total_amount: number;
}

interface PropertyListingProps {
  filteredData: PropertyListing[];
}

type OnChange = NonNullable<TableProps<PropertyListing>["onChange"]>;
type Filters = Parameters<OnChange>[1];

type GetSingle<T> = T extends (infer U)[] ? U : never;
type Sorts = GetSingle<Parameters<OnChange>[2]>;

const PropertyListing: React.FC<PropertyListingProps> = ({ filteredData }) => {
  const [filteredInfo, setFilteredInfo] = useState<Filters>({});
  const [sortedInfo, setSortedInfo] = useState<Sorts>({});

  const handleChange: OnChange = (_pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter as Sorts);
  };

  const ListingStatusOptions = [
    {
      text: "Listed",
      value: "approved",
    },
    {
      text: "Pending MLS",
      value: "pendingMls",
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
      text: "Available",
      value: "available",
    },
    {
      text: "Sold",
      value: "sold",
    },
    {
      text: "Leased",
      value: "leased",
    },
    {
      text: "Terminated",
      value: "terminated",
    },
    {
      text: "Extended",
      value: "extended",
    },
    {
      text: "Expired",
      value: "expired",
    },
    {
      text: "Deal Fell Through",
      value: "dealFellThrough",
    },
    {
      text: "Closed",
      value: "closed",
    },
    {
      text: "Exclusive",
      value: "exclusive",
    },
    {
      text: "Sold Conditionally",
      value: "soldConditionally",
    },
    {
      text: "Rejected",
      value: "rejected",
    },
  ];
  const StatusOptions = [
    {
      text: "Approved",
      value: "approved",
    },
    {
      text: "Under Review",
      value: "underReview",
    },
    {
      text: "Pending MLS",
      value: "pendingMls",
    },
    {
      text: "Rejected",
      value: "rejected",
    },
    {
      text: "Draft",
      value: "draft",
    },
    {
      text: "Closed",
      value: "closed",
    }
  ];

  const columns: TableColumnsType<PropertyListing> = [
    {
      title: "Mls Number",
      dataIndex: "mlsNumber",
      key: "mlsNumber",
      render: (mlsNumber) => (
        <span>{mlsNumber}</span> 
      ),
    },    
    {
      title: "Type",
      dataIndex: "propertyListingType",
      key: "propertyListingType",
      render: (propertyListingType) => (
        <span>{propertyListingType}</span> 
      ),
    },    
    {
      title: "Listing Status",
      dataIndex: "listingStatus",
      key: "listingStatus",
      render: (listingStatus) => (
        <div>
          <p>{listingStatus.charAt(0).toUpperCase() + listingStatus.slice(1).toLowerCase()}</p>
        </div>
      ),
      filters: [...ListingStatusOptions],
      filteredValue: filteredInfo.status || null,
      onFilter: (value, record) => record.status.includes(value as string),
      sorter: (a, b) => a.listingStatus.length - b.listingStatus.length,
      sortOrder: sortedInfo.columnKey === "listingStatus" ? sortedInfo.order : null,
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <div>
          <p>{status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}</p>
        </div>
      ),
      filters: [...StatusOptions],
      filteredValue: filteredInfo.status || null,
      onFilter: (value, record) => record.status.includes(value as string),
      sorter: (a, b) => a.status.length - b.status.length,
      sortOrder: sortedInfo.columnKey === "status" ? sortedInfo.order : null,
      ellipsis: true,
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      render: (address) => <span>{address}</span>,
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
      mlsNumber: item.mlsNumber,
      propertyListingType: item.propertyListingType,
      listingStatus: item.listingStatus,
      status: item.status,
      address: item.address,

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

    pdf.text("Property Listing Report", pageWidth / 2, startY, { align: "center" });

    const headers = ["Mls Number", "Listing Type", "Address","Listing Status", "Status", "Created At"];
    const columnWidths = [40, 25, 40, 25, 25, 40]; 
    
    let x = margin;
    headers.forEach((header, index) => {
        pdf.text(header, x, startY + lineHeight);
        x += columnWidths[index];
    });

    let currentY = startY + 2 * lineHeight;
    filteredData.forEach((item) => {
        const row = [
            item.mlsNumber || "...",
            item.propertyListingType || "...",
            item.address || "...",
            item.listingStatus || "Unknown",
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

    pdf.save("property_listing_report.pdf");
};

  const statusCounts = filteredData.reduce((acc, item) => {
    const listingStatus = item?.listingStatus?.toLowerCase();
    if (listingStatus) {
      acc[listingStatus] = (acc[listingStatus] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);


  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 my-3">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Total Listings</span>
            <span className="text-lg font-semibold text-blue-600">
              {filteredData.length}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Listed</span>
            <span className="text-lg font-semibold text-green-600">
              {statusCounts.approved || 0}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Pending MLS</span>
            <span className="text-lg font-semibold text-yellow-600">
              {statusCounts.pendingmls || 0}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-teal-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Under Review</span>
            <span className="text-lg font-semibold text-teal-600">
              {statusCounts.underreview || 0}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-cyan-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Available</span>
            <span className="text-lg font-semibold text-cyan-600">
              {statusCounts.available || 0}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-emerald-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Sold</span>
            <span className="text-lg font-semibold text-emerald-600">
              {statusCounts.sold || 0}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-indigo-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Leased</span>
            <span className="text-lg font-semibold text-indigo-600">
              {statusCounts.leased || 0}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Closed</span>
            <span className="text-lg font-semibold text-gray-600">
              {statusCounts.closed || 0}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-amber-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Exclusive</span>
            <span className="text-lg font-semibold text-amber-600">
              {statusCounts.exclusive || 0}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-lime-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Sold Conditionally</span>
            <span className="text-lg font-semibold text-lime-600">
              {statusCounts.soldconditionally || 0}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-rose-500 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Terminated</span>
            <span className="text-lg font-semibold text-rose-600">
              {statusCounts.terminated || 0}
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

export default PropertyListing;
