/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck

import { useEffect, useState } from "react";
import type { TableColumnsType } from "antd";
import { Table } from "antd";
import { FaSearch, FaTimes } from "react-icons/fa";
import TableLoader from "../../../../../components/loader/TableLoader";
import { useGetRealtorPropertiesQuery } from "../../../../../redux/api/realtor/realtorPropertySlice";
import { formatNumberWithCommasAndDecimals } from "../../../../../utils/formatNumberWithCommasAndDecimals";
import moment from "moment";
import { Modal } from "antd";
import { Button } from "antd";

interface RealtorPropertyType {
  ListingKey: string;
  ContractStatus: string;
  ListPrice: number;
  MlsStatus: string;
  ListAgentKey: string;
  ListOfficeKey: string;
  PropertyType: string;
  StreetNumber: string;
  StreetName: string;
  City: string;
  StandardStatus: string;
  OriginatingSystemName: string;
  OriginalListPrice: number | null;
  OriginalListPriceUnit: string | null;
  PercentListPrice: string | null;
  PreviousListPrice: number | null;
  RoomsTotal: number | null;
  RoomsAboveGrade: number | null;
  RoomsBelowGrade: number | null;
  ExpirationDate: string | null;
}



const RealtorPropertyListingManagement = () => {
  const { data, isLoading, error, refetch } = useGetRealtorPropertiesQuery();
  const [tableData, setTableData] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [listingFilter, setListingFilter] = useState<
    "current" | "previous" | "all"
  >("current");
  const [
    isModalPropertyListPreviewVisible,
    setIsModalPropertyListPreviewVisible,
  ] = useState(false);
  const [selectedProperty, setSelectedProperty] =
    useState<RealtorPropertyType | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Log error for debugging
  useEffect(() => {
    if (error) {
      console.error("Realtor Properties Error:", error);
    }
  }, [error]);

  useEffect(() => {
    if (data?.data) {
      // Transform the API data to match our table structure
      const transformedData = data.data.map((property: RealtorPropertyType) => {
        // Build full address
        const addressParts = [
          property.StreetNumber,
          property.StreetName,
          property.City,
        ].filter(Boolean);
        const propertyAddress = addressParts.join(" ");

        // Map MlsStatus to listingStatus (normalize to lowercase)
        const listingStatus =
          property.MlsStatus?.toLowerCase() ||
          property.StandardStatus?.toLowerCase() ||
          "";

        return {
          ...property,
          // Map fields for compatibility with existing UI
          mlsNumber: property.ListingKey,
          propertyAddress: propertyAddress,
          listingPrice: property.ListPrice,
          listingStatus: listingStatus,
          propertyType: property.PropertyType,
          contractStatus: property.ContractStatus,
          standardStatus: property.StandardStatus,
          listAgentKey: property.ListAgentKey,
          listOfficeKey: property.ListOfficeKey,
          originalListPrice: property.OriginalListPrice,
          previousListPrice: property.PreviousListPrice,
          percentListPrice: property.PercentListPrice,
          roomsTotal: property.RoomsTotal,
          roomsAboveGrade: property.RoomsAboveGrade,
          roomsBelowGrade: property.RoomsBelowGrade,
          originatingSystemName: property.OriginatingSystemName,
          expirationDate: property.ExpirationDate,
          // Generate a unique ID for each property
          id: property.ListingKey,
          uuid: property.ListingKey,
        };
      });
      setTableData(transformedData);
    }
  }, [data]);

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();
    return Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
  });

  const getFilteredData = () => {
    if (!filteredData) return [];

    switch (listingFilter) {
      case "current":
        return filteredData.filter(
          (item) =>
            item.contractStatus === "Available" ||
            item.standardStatus === "Active" ||
            item.listingStatus === "new"
        );
      case "previous":
        return filteredData.filter(
          (item) =>
            item.contractStatus === "Unavailable" ||
            item.standardStatus !== "Active"
        );
      case "all":
      default:
        return filteredData;
    }
  };

  const filterProps = getFilteredData();

  // serial number in the table
  const tableSourceData = filterProps?.map((item: any, index: number) => {
    return {
      ...item,
      serial: index + 1,
    };
  });

  const handleViewProperty = (property: any) => {
    setSelectedProperty(property);
    setIsModalPropertyListPreviewVisible(true);
  };

  const columns: TableColumnsType<any> = [
    {
      title: "#",
      key: "serial",
      width: 50,
      dataIndex: "serial",
      fixed: "left",
    },
    {
      title: "MLS Number",
      dataIndex: "mlsNumber",
      key: "mlsNumber",
      render: (mlsNumber, record) => (
        <button
          onClick={() => handleViewProperty(record)}
          style={{
            cursor: "pointer",
            border: "none",
            background: "none",
            padding: 0,
            color: "inherit",
            font: "inherit",
            textDecoration: "none",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.textDecoration = "underline")
          }
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          {mlsNumber || "N/A"}
        </button>
      ),
    },
    {
      title: "Property Address",
      dataIndex: "propertyAddress",
      key: "propertyAddress",
      render: (propertyAddress, record) => (
        <button
          onClick={() => handleViewProperty(record)}
          style={{
            cursor: "pointer",
            border: "none",
            background: "none",
            padding: 0,
            color: "inherit",
            font: "inherit",
          }}
        >
          {propertyAddress || "N/A"}
        </button>
      ),
      width: 240,
    },
    {
      title: "Listing Price",
      dataIndex: "listingPrice",
      key: "listingPrice",
      render: (price: number) => (
        <span>${formatNumberWithCommasAndDecimals(price || 0)}</span>
      ),
    },
    {
      title: "Property Type",
      dataIndex: "propertyType",
      key: "propertyType",
      filters: [
        { text: "Residential Freehold", value: "Residential Freehold" },
        {
          text: "Residential Condo & Other",
          value: "Residential Condo & Other",
        },
        { text: "Commercial", value: "Commercial" },
      ],
      onFilter: (value, record) => record.propertyType === value,
      render: (propertyType: any) => <span>{propertyType || "N/A"}</span>,
    },
    {
      title: "Agent",
      dataIndex: "ListAgentFullName",
      key: "ListAgentFullName",
      render: (key: string) => key || "N/A",
    },
    {
      title: "Agent Phone",
      dataIndex: "ListAgentDirectPhone",
      key: "ListAgentDirectPhone",
      render: (key: string) => "+1 " + key || "N/A",
    },
    {
      title: "MLS Status",
      dataIndex: "MlsStatus",
      key: "MlsStatus",
      filters: [
        // { value: "New", text: "New" },
        { value: "Price Change", text: "Price Change" },
        { value: "Terminated", text: "Terminated" },
        { value: "Expired", text: "Expired" },
        { value: "Leased", text: "Leased" },
      ],
      onFilter: (value, record) => record.MlsStatus === value,
      render: (status: any) => <span>{status || "N/A"}</span>,
    },
    {
      title: "Contract Status",
      dataIndex: "contractStatus",
      key: "contractStatus",
      filters: [
        { text: "Available", value: "Available" },
        { text: "Unavailable", value: "Unavailable" },
      ],
      onFilter: (value, record) => record.contractStatus === value,
      render: (status: any) => <span>{status || "N/A"}</span>,
    },
    {
      title: "Standard Status",
      dataIndex: "standardStatus",
      key: "standardStatus",
      filters: [
        { text: "Active", value: "Active" },
        { text: "Cancelled", value: "Cancelled" },
        { text: "Expired", value: "Expired" },
        { text: "Closed", value: "Closed" },
      ],
      onFilter: (value, record) => record.standardStatus === value,
      render: (status: any) => <span>{status || "N/A"}</span>,
    },
    {
      title: "Expiration Date",
      dataIndex: "expirationDate",
      key: "expirationDate",
      render: (date: string) => {
        if (!date) return "N/A";
        const formattedDate = moment.utc(date).format("DD MMMM YYYY");
        return <span>{formattedDate}</span>;
      },
    },
  ];

  const currentCount = filteredData?.filter(
    (item) => item.contractStatus === "Available" || item.standardStatus === "Active" || item.listingStatus === "new"
  ).length ?? 0;
  const previousCount = filteredData?.filter(
    (item) => item.contractStatus === "Unavailable" || item.standardStatus !== "Active"
  ).length ?? 0;
  const allCount = filteredData?.length ?? 0;

  const tabList = [
    { key: "current", label: "Current Listings", count: currentCount },
    { key: "previous", label: "Previous Listings", count: previousCount },
    { key: "all", label: "All Listings", count: allCount },
  ];

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">

        {/* Single toolbar row */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">

          {/* Title */}
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">
            Office Listings
            <span className="ml-1 text-gray-400 font-normal text-[11px]">({allCount})</span>
          </h1>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

          {/* Tabs */}
          <div className="flex items-center gap-1">
            {tabList.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setListingFilter(tab.key as "current" | "previous" | "all")}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                  listingFilter === tab.key
                    ? "bg-[#0f766e] text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {tab.label}
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                    listingFilter === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <div className="relative flex-shrink-0" style={{ width: 170 }}>
            <FaSearch
              className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              style={{ fontSize: 10, left: 8 }}
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                paddingLeft: 26,
                paddingRight: searchText ? 22 : 8,
                paddingTop: 4,
                paddingBottom: 4,
                width: "100%",
              }}
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                style={{ right: 6 }}
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div>
          {isLoading ? (
            <TableLoader />
          ) : error ? (
            <div className="p-8 bg-red-50 border border-red-200 rounded-lg m-4">
              <h3 className="text-red-800 font-semibold mb-2">Error Loading Office Listings</h3>
              <p className="text-red-600 mb-4">
                {error?.status === "FETCH_ERROR" || error?.status === "CORS_ERROR"
                  ? "CORS Error: The request was blocked by the browser."
                  : `Error: ${error?.data?.message || error?.error || "Unknown error occurred"}`}
              </p>
              <button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Retry
              </button>
            </div>
          ) : (
            <Table
              size="small"
              scroll={{ x: "max-content" }}
              columns={columns}
              dataSource={tableSourceData}
              rowKey="ListingKey"
              pagination={{ pageSize: 20, current: currentPage }}
              onChange={(pagination) => setCurrentPage(pagination?.current || 1)}
            />
          )}
        </div>

      </div>

      {/* Property Preview Modal */}
      <Modal
        title="Property Preview"
        open={isModalPropertyListPreviewVisible}
        onCancel={() => setIsModalPropertyListPreviewVisible(false)}
        width={1200}
        footer={[
          <Button
            key="close"
            onClick={() => setIsModalPropertyListPreviewVisible(false)}
          >
            Close
          </Button>,
        ]}
      >
        {selectedProperty && (
          <div className="max-w-6xl mx-auto p-4">
            <h2 className="border-t border-gray-400 bg-[#0b3b38] text-white border-x text-center text-sm font-bold py-1 uppercase">
              {selectedProperty.ListingKey || "N/A"} -{" "}
              {[
                selectedProperty.StreetNumber,
                selectedProperty.StreetName,
                selectedProperty.City,
              ]
                .filter(Boolean)
                .join(", ") || "N/A"}
            </h2>
            {/* Property Details Section */}
            <div className="mb-6 mt-3">
              <h3 className="border-t border-gray-400 bg-[#0f766e] text-white border-x text-center text-sm font-bold py-1">
                PROPERTY DETAILS
              </h3>
              <table className="w-full text-xs border-collapse border border-gray-400">
                <colgroup>
                  <col className="w-1/6" />
                  <col className="w-1/6" />
                  <col className="w-1/6" />
                  <col className="w-1/6" />
                </colgroup>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">
                      MLS #
                    </td>
                    <td className="border border-gray-400 px-2 py-1">
                      {selectedProperty.ListingKey || "N/A"}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">
                      Property Type
                    </td>
                    <td className="border border-gray-400 px-2 py-1">
                      {selectedProperty.PropertyType || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">
                      Property Address
                    </td>
                    <td
                      className="border border-gray-400 px-2 py-1"
                      colSpan="3"
                    >
                      {[
                        selectedProperty.StreetNumber,
                        selectedProperty.StreetName,
                        selectedProperty.City,
                      ]
                        .filter(Boolean)
                        .join(" ") || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">
                      List Price
                    </td>
                    <td className="border border-gray-400 px-2 py-1">
                      $
                      {formatNumberWithCommasAndDecimals(
                        selectedProperty.ListPrice || 0
                      )}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">
                      Originating System
                    </td>
                    <td className="border border-gray-400 px-2 py-1">
                      {selectedProperty.OriginatingSystemName || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">
                      Original List Price
                    </td>
                    <td className="border border-gray-400 px-2 py-1">
                      {selectedProperty.OriginalListPrice
                        ? `$${formatNumberWithCommasAndDecimals(
                            selectedProperty.OriginalListPrice
                          )}`
                        : "N/A"}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">
                      Previous List Price
                    </td>
                    <td className="border border-gray-400 px-2 py-1">
                      {selectedProperty.PreviousListPrice
                        ? `$${formatNumberWithCommasAndDecimals(
                            selectedProperty.PreviousListPrice
                          )}`
                        : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">
                      Percent List Price
                    </td>
                    <td className="border border-gray-400 px-2 py-1">
                      {selectedProperty.PercentListPrice || "N/A"}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">
                      Expiration Date
                    </td>
                    <td className="border border-gray-400 px-2 py-1">
                      {selectedProperty.ExpirationDate
                        ? moment
                            .utc(selectedProperty.ExpirationDate)
                            .format("DD MMMM YYYY")
                        : "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Status Information Section */}
            <div className="mb-6">
              <h3 className="border-t border-gray-400 bg-[#0f766e] text-white border-x text-center text-sm font-bold py-1">
                STATUS INFORMATION
              </h3>
              <table className="w-full text-xs border-collapse border border-gray-400">
                <colgroup>
                  <col className="w-1/6" />
                  <col className="w-1/6" />
                  <col className="w-1/6" />
                  <col className="w-1/6" />
                </colgroup>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">
                      MLS Status
                    </td>
                    <td className="border border-gray-400 px-2 py-1">
                      {selectedProperty.MlsStatus || "N/A"}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">
                      Contract Status
                    </td>
                    <td className="border border-gray-400 px-2 py-1">
                      {selectedProperty.ContractStatus || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">
                      Standard Status
                    </td>
                    <td
                      className="border border-gray-400 px-2 py-1"
                      colSpan="3"
                    >
                      {selectedProperty.StandardStatus || "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Agent & Office Information Section */}
            <div className="mb-6">
              <h3 className="border-t border-gray-400 bg-[#0f766e] text-white border-x text-center text-sm font-bold py-1">
                AGENT & OFFICE INFORMATION
              </h3>
              <table className="w-full text-xs border-collapse border border-gray-400">
                <colgroup>
                  <col className="w-1/6" />
                  <col className="w-1/6" />
                  <col className="w-1/6" />
                  <col className="w-1/6" />
                </colgroup>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">
                      List Agent Key
                    </td>
                    <td className="border border-gray-400 px-2 py-1">
                      {selectedProperty.ListAgentKey || "N/A"}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">
                      List Office Key
                    </td>
                    <td className="border border-gray-400 px-2 py-1">
                      {selectedProperty.ListOfficeKey || "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Room Information Section */}
            <div className="mb-6">
              <h3 className="border-t border-gray-400 bg-[#0f766e] text-white border-x text-center text-sm font-bold py-1">
                ROOM INFORMATION
              </h3>
              <table className="w-full text-xs border-collapse border border-gray-400">
                <colgroup>
                  <col className="w-1/6" />
                  <col className="w-1/6" />
                  <col className="w-1/6" />
                  <col className="w-1/6" />
                </colgroup>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">
                      Rooms Total
                    </td>
                    <td className="border border-gray-400 px-2 py-1">
                      {selectedProperty.RoomsTotal || "N/A"}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">
                      Rooms Above Grade
                    </td>
                    <td className="border border-gray-400 px-2 py-1">
                      {selectedProperty.RoomsAboveGrade || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold">
                      Rooms Below Grade
                    </td>
                    <td
                      className="border border-gray-400 px-2 py-1"
                      colSpan="3"
                    >
                      {selectedProperty.RoomsBelowGrade || "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RealtorPropertyListingManagement;
