/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import 'jspdf-autotable';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import logo1 from '/logo.svg';
import type { TableColumnsType } from 'antd';
import {
  Select,
  Table,
} from 'antd';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import {
  FaFileExcel,
  FaFilePdf,
  FaFilter,
  FaTimes,
} from 'react-icons/fa';
import { useSelector } from 'react-redux';
import * as XLSX from 'xlsx';

import {
  useGetAgentListDataQuery,
} from '../../../redux/api/superadmin/agent/agentManagementSlice';
import {
  useGetActiveBranchListDataQuery,
} from '../../../redux/api/superadmin/branch/Branchmanagementslice';
import {
  useGetDynamicTradesheetReportQuery,
} from '../../../redux/api/superadmin/report/dynamicReportSlice';
import {
  formatNumberWithCommasAndDecimals,
} from '../../../utils/formatNumberWithCommasAndDecimals';
import { formatStringCamelCasecapitalize } from '../../../utils/stringUtils';

interface TradesheetReportProps {
    branchIds: string[];
    reportTypes?: { value: string; label: string }[];
    selectedReportType?: string;
    onReportTypeChange?: (value: string) => void;
}

export default function TradesheetReport({ branchIds, reportTypes, selectedReportType, onReportTypeChange }: TradesheetReportProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedTradeStatus, setSelectedTradeStatus] = useState<string[]>([]);
    const [selectedAdminStatus, setSelectedAdminStatus] = useState<string[]>([]);
    const [selectedRepresentation, setSelectedRepresentation] = useState<string[]>([]);
    const [selectedBranches, setSelectedBranches] = useState<string[]>(branchIds);
    const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
    const [closingDateRange, setClosingDateRange] = useState<[string, string] | null>(null);
    const [createdDateRange, setCreatedDateRange] = useState<[string, string] | null>(null);
    const [periodFilter, setPeriodFilter] = useState<string | null>(null);
    const [closingCustomStart, setClosingCustomStart] = useState("");
    const [closingCustomEnd, setClosingCustomEnd] = useState("");
    const [createdCustomStart, setCreatedCustomStart] = useState("");
    const [createdCustomEnd, setCreatedCustomEnd] = useState("");
    const [searchText, setSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const { user } = useSelector((state: any) => state.user);
    const isSuperAdmin = user?.roleId == 1;

    // Initialize search text from localStorage
    useEffect(() => {
        setSearchText(localStorage.getItem("tradesheetReportSearchText") || "");
    }, []);

    // Handle period filter
    const handlePeriodFilter = (period: string) => {
        const now = new Date();
        const startDate = new Date();

        switch (period) {
            case 'Day':
                startDate.setDate(now.getDate() - 1);
                break;
            case 'Week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'Month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'Quarter':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case 'Year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            case 'Last 30 days':
                startDate.setDate(now.getDate() - 30);
                break;
            case 'Last 90 days':
                startDate.setDate(now.getDate() - 90);
                break;
            case 'Last Year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            case 'All Time':
                setCreatedDateRange(null);
                setPeriodFilter(null);
                setCreatedCustomStart("");
                setCreatedCustomEnd("");
                return;
        }

        setCreatedDateRange([startDate.toISOString().split('T')[0], now.toISOString().split('T')[0]]);
        setPeriodFilter(period);
        setCreatedCustomStart(startDate.toISOString().split('T')[0]);
        setCreatedCustomEnd(now.toISOString().split('T')[0]);
    };

    // Build query params
    const queryParams = useMemo(() => {
        const params: any = {};
        if (selectedBranches.length > 0) params.branchIds = selectedBranches.join(",");
        if (selectedTradeStatus.length > 0) params.tradeStatus = selectedTradeStatus.join(",");
        if (selectedAdminStatus.length > 0) params.adminStatus = selectedAdminStatus.join(",");
        if (selectedRepresentation.length > 0) params.representation = selectedRepresentation.join(",");
        if (selectedAgents.length > 0) params.agentIds = selectedAgents.join(",");
        if (createdDateRange) {
            params.createdStartDate = createdDateRange[0];
            params.createdEndDate = createdDateRange[1];
        }
        if (closingDateRange) {
            params.closingStartDate = closingDateRange[0];
            params.closingEndDate = closingDateRange[1];
        }
        return params;
    }, [selectedBranches, selectedTradeStatus, selectedAdminStatus, selectedRepresentation, selectedAgents, createdDateRange, closingDateRange]);

    const { data, isLoading } = useGetDynamicTradesheetReportQuery(queryParams);
    const { data: activeBranches } = useGetActiveBranchListDataQuery("");
    const { data: agentsData, isLoading: agentsLoading } = useGetAgentListDataQuery("");

    const tradesheetData = data?.data?.tradesheets || [];
    const summary = data?.data?.summary || {
        total: 0,
        closed: 0,
        draft: 0,
        pending: 0,
        totalSelling: 0,
        totalDepositAmount: 0,
    };

    // Filter data based on filters
    const filteredData = useMemo(() => {
        let filtered = [...tradesheetData];

        if (selectedTradeStatus.length > 0) {
            filtered = filtered.filter((item: any) =>
                selectedTradeStatus.includes(item.tradeStatus || "")
            );
        }

        if (selectedAdminStatus.length > 0) {
            filtered = filtered.filter((item: any) =>
                selectedAdminStatus.includes(item.status || "")
            );
        }

        if (selectedRepresentation.length > 0) {
            filtered = filtered.filter((item: any) =>
                selectedRepresentation.includes(item.representation || "")
            );
        }

        if (selectedAgents.length > 0) {
            filtered = filtered.filter((item: any) => {
                const agentIds = [
                    item.seller_landlord_agent_id,
                    item.buyer_tenant_agent_id,
                    ...(item.sharedUsers?.map((u: any) => u.sharedUserId) || []),
                ];
                return selectedAgents.some((id) => agentIds.includes(Number(id)));
            });
        }

        // Search filter
        if (searchText) {
            const searchTerm = searchText.toLowerCase();
            const extractValues = (obj: any): string[] => {
                if (
                    typeof obj === "string" ||
                    typeof obj === "number" ||
                    typeof obj === "boolean"
                ) {
                    return [String(obj).toLowerCase()];
                }
                if (Array.isArray(obj)) {
                    return obj.flatMap(extractValues);
                }
                if (obj && typeof obj === "object") {
                    return Object.values(obj).flatMap(extractValues);
                }
                return [];
            };
            filtered = filtered.filter((item: any) => {
                // Explicitly check tradeSheetTypeId
                const tradeSheetTypeIdMatch = item.tradeSheetTypeId
                    ? String(item.tradeSheetTypeId).toLowerCase().includes(searchTerm)
                    : false;

                // Search through all other values
                const allValues = extractValues(item);
                const otherValuesMatch = allValues.some((value) => value.includes(searchTerm));

                return tradeSheetTypeIdMatch || otherValuesMatch;
            });
        }

        return filtered;
    }, [tradesheetData, selectedTradeStatus, selectedAdminStatus, selectedRepresentation, selectedAgents, searchText]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedTradeStatus, selectedAdminStatus, selectedRepresentation, selectedAgents, searchText, selectedBranches, createdDateRange, closingDateRange]);

    const handleCreatedDateRange = () => {
        if (createdCustomStart && createdCustomEnd) {
            setCreatedDateRange([createdCustomStart, createdCustomEnd]);
            setPeriodFilter(null);
        }
    };

    const handleClosingDateRange = () => {
        if (closingCustomStart && closingCustomEnd) {
            setClosingDateRange([closingCustomStart, closingCustomEnd]);
        }
    };

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(
            filteredData.map((item: any, index: number) => ({
                "#": index + 1,
                "Trade Sheet ID": item.tradeSheetTypeId || item.uuid,
                "Property Address": item.properties?.[0]?.propertyAddress || "N/A",
                "Trade Status": item.tradeStatus || "N/A",
                "Admin Status": item.status || "N/A",
                "Representation": item.representation || "N/A",
                "Closing Date": item.properties?.[0]?.closingDate
                    ? format(new Date(item.properties[0].closingDate), "dd MMM yyyy")
                    : "N/A",
                "Sold Price": item.properties?.[0]?.soldPrice || 0,
                "Sales Price": item.properties?.[0]?.salesPrice || 0,
                "Deposit Amount": item.properties?.[0]?.depositAmount || 0,
                "Created At": item.createdAt
                    ? format(new Date(item.createdAt), "dd MMM yyyy")
                    : "N/A",
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Tradesheet Report");
        XLSX.writeFile(workbook, `Tradesheet_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    const handleExportPdf = () => {
        const doc = new jsPDF('landscape');
        const pageWidth = doc.internal.pageSize.getWidth();

        // Add logo
        const logoX = (pageWidth / 2) - 10;
        const logoY = 5;
        const logoWidth = 20;
        const logoHeight = 20;
        doc.addImage(logo1, "PNG", logoX, logoY, logoWidth, logoHeight);

        doc.setFontSize(16);
        doc.text('Tradesheet Report', pageWidth / 2, 30, { align: "center" });
        doc.setFontSize(10);
        doc.text(`Generated: ${format(new Date(), "dd MMM yyyy")}`, pageWidth / 2, 37, { align: "center" });

        const tableColumn = [
            '#',
            'Trade Sheet ID',
            'Property Address',
            'Agent Name',
            'Shared Agent',
            'Trade Status',
            'Admin Status',
            'Representation',
            'Closing Date',
            'Sold Price',
            'Sales Price',
            'Deposit Amount',
        ];

        const tableRows = filteredData.map((item: any, index: number) => {
            const sellerAgent = item?.seller_landlord_agent?.user?.name ||
                `${item?.seller_landlord_agent?.user?.firstName || ''} ${item?.seller_landlord_agent?.user?.lastName || ''}`.trim() || "N/A";
            const buyerAgent = item?.buyer_tenant_agent?.user?.name ||
                `${item?.buyer_tenant_agent?.user?.firstName || ''} ${item?.buyer_tenant_agent?.user?.lastName || ''}`.trim() || "";
            const agentName = (buyerAgent && buyerAgent !== sellerAgent && buyerAgent !== "N/A" && buyerAgent !== "")
                ? `${sellerAgent}, ${buyerAgent}`
                : sellerAgent;

            const sharedUsers = item?.sharedUsers || [];
            const sharedAgentNames = sharedUsers.length > 0
                ? sharedUsers.map((su: any) =>
                    su?.sharedUser?.name ||
                    `${su?.sharedUser?.firstName || ''} ${su?.sharedUser?.lastName || ''}`.trim() || "N/A"
                ).join(", ")
                : "N/A";

            return [
                index + 1,
                item.tradeSheetTypeId || item.uuid,
                item.properties?.[0]?.propertyAddress || "N/A",
                agentName,
                sharedAgentNames,
                formatStringCamelCasecapitalize(item.tradeStatus || ""),
                formatStringCamelCasecapitalize(item.status || ""),
                formatStringCamelCasecapitalize(item.representation || ""),
                item.properties?.[0]?.closingDate
                    ? format(new Date(item.properties[0].closingDate), "dd MMM yyyy")
                    : "N/A",
                `$${formatNumberWithCommasAndDecimals(item.properties?.[0]?.soldPrice || 0)}`,
                `$${formatNumberWithCommasAndDecimals(item.properties?.[0]?.salesPrice || 0)}`,
                `$${formatNumberWithCommasAndDecimals(item.properties?.[0]?.depositAmount || 0)}`,
            ];
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            headStyles: { fillColor: [20, 29, 44], textColor: [255, 255, 255] },
            margin: { top: 30, left: 10, right: 10, bottom: 10 },
        });
        doc.save(`Tradesheet_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    };

    const columns: TableColumnsType<any> = [
        {
            title: "Trade Sheet ID",
            dataIndex: "tradeSheetTypeId",
            key: "tradeSheetTypeId",
            render: (text: string, record: any) => record.tradeSheetTypeId || text || "N/A",
        },
        {
            title: "Property Address",
            key: "propertyAddress",
            render: (_: any, record: any) =>
                record.properties?.[0]?.propertyAddress || "N/A",
        },
        {
            title: "Agent Name",
            key: "agentName",
            render: (_: any, record: any) => {
                // const sellerAgent = record?.seller_landlord_agent?.user?.name ||
                //     `${record?.seller_landlord_agent?.user?.firstName || ''} ${record?.seller_landlord_agent?.user?.lastName || ''}`.trim() || "N/A";
                // const buyerAgent = record?.buyer_tenant_agent?.user?.name ||
                //     `${record?.buyer_tenant_agent?.user?.firstName || ''} ${record?.buyer_tenant_agent?.user?.lastName || ''}`.trim() || "";

                // // Show both if different, otherwise show one
                // if (buyerAgent && buyerAgent !== sellerAgent && buyerAgent !== "N/A" && buyerAgent !== "") {
                //     return `${sellerAgent}, ${buyerAgent}`;
                // }
                return record.name || "N/A";
            },
            width: 200,
        },
        {
            title: "Shared Agent",
            key: "sharedAgent",
            render: (_: any, record: any) => {
                const sharedUsers = record?.sharedUsers || [];
                if (!sharedUsers || sharedUsers.length === 0) {
                    return "N/A";
                }
                return sharedUsers.map((sharedUser: any, index: number) => {
                    const userName = sharedUser?.sharedUser?.name ||
                        `${sharedUser?.sharedUser?.firstName || ''} ${sharedUser?.sharedUser?.lastName || ''}`.trim() || "N/A";
                    return (
                        <span key={index}>
                            {userName}
                            {index < sharedUsers.length - 1 ? ", " : ""}
                        </span>
                    );
                });
            },
            width: 200,
        },
        {
            title: "Trade Status",
            dataIndex: "tradeStatus",
            key: "tradeStatus",
            render: (tradeStatus: string) => formatStringCamelCasecapitalize(tradeStatus || ""),
        },
        {
            title: "Admin Status",
            dataIndex: "status",
            key: "status",
            render: (status: string) => formatStringCamelCasecapitalize(status || ""),
        },
        {
            title: "Representation",
            dataIndex: "representation",
            key: "representation",
            render: (representation: string) => formatStringCamelCasecapitalize(representation || ""),
        },
        {
            title: "Closing Date",
            key: "closingDate",
            render: (_: any, record: any) =>
                record.properties?.[0]?.closingDate
                    ? format(new Date(record.properties[0].closingDate), "dd MMM yyyy")
                    : "N/A",
        },
        {
            title: "Sold Price",
            key: "soldPrice",
            render: (_: any, record: any) =>
                `$${formatNumberWithCommasAndDecimals(record.properties?.[0]?.soldPrice || 0)}`,
        },
        {
            title: "Sales Price",
            key: "salesPrice",
            render: (_: any, record: any) =>
                `$${formatNumberWithCommasAndDecimals(record.properties?.[0]?.salesPrice || 0)}`,
        },
        {
            title: "Deposit Amount",
            key: "depositAmount",
            render: (_: any, record: any) =>
                `$${formatNumberWithCommasAndDecimals(record.properties?.[0]?.depositAmount || 0)}`,
        },
    ];

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Single header row */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100">
                <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Dynamic Reports</h1>
                <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

                {/* Stat pills */}
                <div className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1" style={{ borderLeft: "2px solid #3b82f6", background: "#eff6ff" }}>
                    <span className="text-xs text-gray-500 whitespace-nowrap">Total:</span>
                    <span className="text-xs font-semibold text-blue-600 whitespace-nowrap">{summary.total}</span>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1" style={{ borderLeft: "2px solid #22c55e", background: "#f0fdf4" }}>
                    <span className="text-xs text-gray-500 whitespace-nowrap">Closed:</span>
                    <span className="text-xs font-semibold text-green-600 whitespace-nowrap">{summary.closed}</span>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1" style={{ borderLeft: "2px solid #eab308", background: "#fefce8" }}>
                    <span className="text-xs text-gray-500 whitespace-nowrap">Draft:</span>
                    <span className="text-xs font-semibold text-yellow-600 whitespace-nowrap">{summary.draft}</span>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1" style={{ borderLeft: "2px solid #f97316", background: "#fff7ed" }}>
                    <span className="text-xs text-gray-500 whitespace-nowrap">Pending:</span>
                    <span className="text-xs font-semibold text-orange-600 whitespace-nowrap">{summary.pending}</span>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1" style={{ borderLeft: "2px solid #a855f7", background: "#faf5ff" }}>
                    <span className="text-xs text-gray-500 whitespace-nowrap">Selling:</span>
                    <span className="text-xs font-semibold text-teal-600 whitespace-nowrap">${formatNumberWithCommasAndDecimals(summary.totalSelling)}</span>
                </div>
                <div className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1" style={{ borderLeft: "2px solid #6366f1", background: "#eef2ff" }}>
                    <span className="text-xs text-gray-500 whitespace-nowrap">Deposit:</span>
                    <span className="text-xs font-semibold text-indigo-600 whitespace-nowrap">${formatNumberWithCommasAndDecimals(summary.totalDepositAmount)}</span>
                </div>

                <div className="flex-1" />

                {/* Search */}
                <div className="relative flex-shrink-0" style={{ width: 170 }}>
                    <input
                        type="text"
                        className="w-full border p-1.5 text-sm rounded focus:ring"
                        placeholder="Search..."
                        value={searchText}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setSearchText(newValue);
                            localStorage.setItem("tradesheetReportSearchText", newValue);
                        }}
                        style={{ paddingRight: searchText ? 22 : 8 }}
                    />
                    {searchText && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchText("");
                                localStorage.removeItem("tradesheetReportSearchText");
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <FaTimes style={{ fontSize: 10 }} />
                        </button>
                    )}
                </div>
                <button
                    className="flex-shrink-0 bg-[#0f766e] text-white px-3 py-1.5 rounded flex items-center gap-1.5 text-xs hover:bg-[#1F2A3D]"
                    onClick={() => setShowDropdown(!showDropdown)}
                >
                    <FaFilter /> Filter
                </button>

                <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
                <FaFilePdf onClick={handleExportPdf} size={18} className="flex-shrink-0 cursor-pointer text-red-600 hover:text-red-700" title="Export to PDF" />
                <FaFileExcel onClick={handleExportExcel} size={18} className="flex-shrink-0 cursor-pointer text-green-600 hover:text-green-700" title="Export to Excel" />

                {reportTypes && onReportTypeChange && (
                    <>
                        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
                        <Select
                            value={selectedReportType}
                            onChange={onReportTypeChange}
                            style={{ width: 160 }}
                            options={reportTypes}
                            size="small"
                            className="flex-shrink-0"
                        />
                    </>
                )}
            </div>

            {/* Backdrop */}
            {showDropdown && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
                    onClick={() => setShowDropdown(false)}
                />
            )}

            {/* Slide-in Filter Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${showDropdown ? 'translate-x-0' : 'translate-x-full'
                    }`}
                style={{
                    maxHeight: '100vh',
                }}
            >
                <style>{`
                            .tradesheet-filter-scroll::-webkit-scrollbar {
                                width: 12px !important;
                            }
                            .tradesheet-filter-scroll::-webkit-scrollbar-track {
                                background: #f1f1f1 !important;
                                border-radius: 6px !important;
                                margin: 4px !important;
                            }
                            .tradesheet-filter-scroll::-webkit-scrollbar-thumb {
                                background: #888 !important;
                                border-radius: 6px !important;
                                border: 2px solid #f1f1f1 !important;
                            }
                            .tradesheet-filter-scroll::-webkit-scrollbar-thumb:hover {
                                background: #555 !important;
                            }
                        `}</style>

                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-[#0f766e] text-white">
                        <h3 className="text-lg font-semibold">Filter Options</h3>
                        <button
                            onClick={() => setShowDropdown(false)}
                            className="text-white hover:text-gray-300 text-2xl font-bold"
                        >
                            ×
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div
                        className="tradesheet-filter-scroll flex-1 overflow-y-auto overflow-x-hidden p-4"
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#888 #f1f1f1',
                        }}
                    >
                        <div className="space-y-4">
                            {/* Period Filter Buttons */}
                            <div className="flex gap-2 mb-4 flex-wrap">
                                {['Day', 'Week', 'Month', 'Quarter', 'Year'].map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => handlePeriodFilter(period)}
                                        className={`px-3 py-1 rounded ${periodFilter === period
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200'
                                            }`}
                                    >
                                        {period}
                                    </button>
                                ))}
                            </div>

                            {/* Predefined Date Ranges */}
                            <div className="space-y-2 mb-4">
                                {['Last 30 days', 'Last 90 days', 'Last Year', 'All Time'].map((range) => (
                                    <button
                                        key={range}
                                        className={`block w-full text-left px-3 py-2 rounded ${periodFilter === range
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200'
                                            }`}
                                        onClick={() => handlePeriodFilter(range)}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>
                            {/* Trade Status */}
                            <div>
                                <label className="font-semibold mb-2 block">Trade Status</label>
                                <Select
                                    mode="multiple"
                                    placeholder="Select trade status"
                                    value={selectedTradeStatus}
                                    onChange={setSelectedTradeStatus}
                                    options={[
                                        { value: "closed", label: "Closed" },
                                        { value: "dft", label: "DFT" },
                                        { value: "dealTerminated", label: "Deal Terminated" },
                                        { value: "soldConditional", label: "Sold Conditional" },
                                        { value: "pending", label: "Pending" },
                                    ]}
                                    className="w-full"
                                    allowClear
                                />
                            </div>

                            {/* Admin Status */}
                            <div>
                                <label className="font-semibold mb-2 block">Admin Status</label>
                                <Select
                                    mode="multiple"
                                    placeholder="Select admin status"
                                    value={selectedAdminStatus}
                                    onChange={setSelectedAdminStatus}
                                    options={[
                                        { value: "approved", label: "Approved" },
                                        { value: "underReview", label: "Under Review" },
                                        { value: "draft", label: "Draft" },
                                        { value: "rejected", label: "Incomplete" },
                                    ]}
                                    className="w-full"
                                    allowClear
                                />
                            </div>

                            {/* Representation */}
                            <div>
                                <label className="font-semibold mb-2 block">Representation</label>
                                <Select
                                    mode="multiple"
                                    placeholder="Select representation"
                                    value={selectedRepresentation}
                                    onChange={setSelectedRepresentation}
                                    options={[
                                        { value: "seller", label: "Seller" },
                                        { value: "buyer", label: "Buyer" },
                                        { value: "tenant", label: "Tenant" },
                                        { value: "landlord", label: "Landlord" },
                                    ]}
                                    className="w-full"
                                    allowClear
                                />
                            </div>

                            {/* Branch (only for superadmin) */}
                            {isSuperAdmin && (
                                <div>
                                    <label className="font-semibold mb-2 block">Branch</label>
                                    <Select
                                        mode="multiple"
                                        placeholder="Select branches"
                                        value={selectedBranches}
                                        onChange={setSelectedBranches}
                                        options={activeBranches?.data?.branchData?.map((branch: any) => ({
                                            value: branch.id.toString(),
                                            label: branch.name,
                                        }))}
                                        className="w-full"
                                        allowClear
                                    />
                                </div>
                            )}

                            {/* Closing Date Range */}
                            <div>
                                <label className="font-semibold mb-2 block">Closing Date Range</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="date"
                                        className="border p-2 rounded w-full"
                                        value={closingCustomStart}
                                        onChange={(e) => setClosingCustomStart(e.target.value)}
                                    />
                                    <input
                                        type="date"
                                        className="border p-2 rounded w-full"
                                        value={closingCustomEnd}
                                        onChange={(e) => setClosingCustomEnd(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Created Date Range (Custom Range) */}
                            <div className="border p-2 rounded">
                                <label className="font-semibold mb-2 block">Custom Range (Created At)</label>
                                <div className="flex flex-col sm:flex-row gap-2 mt-1">
                                    <input
                                        type="date"
                                        className="border p-2 rounded w-full"
                                        value={createdCustomStart}
                                        onChange={(e) => setCreatedCustomStart(e.target.value)}
                                    />
                                    <input
                                        type="date"
                                        className="border p-2 rounded w-full"
                                        value={createdCustomEnd}
                                        onChange={(e) => setCreatedCustomEnd(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Agent Name */}
                            <div>
                                <label className="font-semibold mb-2 block">Agent Name</label>
                                <Select
                                    mode="multiple"
                                    placeholder={agentsLoading ? "Loading agents..." : "Select agents"}
                                    value={selectedAgents}
                                    onChange={setSelectedAgents}
                                    options={(agentsData?.data?.userData || agentsData?.data?.agentData || []).map((agent: any) => {
                                        // AgentAccount has id, and user relation with name/firstName/lastName
                                        const agentId = agent.id; // AgentAccount id (this is what seller_landlord_agent_id references)
                                        const userName = agent.user?.name ||
                                            `${agent.user?.firstName || ''} ${agent.user?.lastName || ''}`.trim() ||
                                            agent.name ||
                                            `${agent.firstName || ''} ${agent.lastName || ''}`.trim() ||
                                            agent.user?.email ||
                                            agent.email ||
                                            agent.agentAccountId ||
                                            'N/A';
                                        return {
                                            value: agentId?.toString(),
                                            label: userName,
                                        };
                                    }).filter((option: any) => option.value)} // Filter out any invalid options
                                    className="w-full"
                                    allowClear
                                    showSearch
                                    loading={agentsLoading}
                                    filterOption={(input, option) =>
                                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fixed Footer with Action Buttons */}
                    <div className="flex gap-2 p-4 border-t bg-white">
                        <button
                            className="w-1/2 bg-[#0f766e] text-white p-2 rounded hover:bg-[#0f766e] transition-colors"
                            onClick={() => {
                                handleCreatedDateRange();
                                handleClosingDateRange();
                                setShowDropdown(false);
                            }}
                        >
                            Apply
                        </button>
                        <button
                            className="w-1/2 bg-[#FFDFDC] text-[#EF4444] p-2 rounded hover:bg-[#ffd0cd] transition-colors"
                            onClick={() => {
                                setShowDropdown(false);
                                setSelectedTradeStatus([]);
                                setSelectedAdminStatus([]);
                                setSelectedRepresentation([]);
                                setSelectedAgents([]);
                                setCreatedDateRange(null);
                                setClosingDateRange(null);
                                setPeriodFilter(null);
                                setCreatedCustomStart("");
                                setCreatedCustomEnd("");
                                setClosingCustomStart("");
                                setClosingCustomEnd("");
                            }}
                        >
                            Reset & Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div>
                <Table
                    rowKey="uuid"
                    scroll={{ x: "max-content" }}
                    columns={columns}
                    dataSource={filteredData}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        showSizeChanger: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        onChange: (page, size) => {
                            setCurrentPage(page);
                            setPageSize(size);
                        },
                    }}
                    loading={isLoading}
                />
            </div>
        </div>
    );
}
