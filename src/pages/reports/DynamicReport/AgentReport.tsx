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

import logo1 from '/logo.png';
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
  useGetBrokerageDataQuery,
} from '../../../redux/api/superadmin/brokerageDataSlice';
import {
  useGetDynamicAgentReportQuery,
} from '../../../redux/api/superadmin/report/dynamicReportSlice';
import {
  formatNumberWithCommasAndDecimals,
} from '../../../utils/formatNumberWithCommasAndDecimals';
import { formatStringCamelCasecapitalize } from '../../../utils/stringUtils';

interface AgentReportProps {
    branchIds: string[];
}

export default function AgentReport({ branchIds }: AgentReportProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedBranches, setSelectedBranches] = useState<string[]>(branchIds);
    const [selectedBrokerageIds, setSelectedBrokerageIds] = useState<string[]>([]);
    const [selectedAccountStatus, setSelectedAccountStatus] = useState<string[]>([]);
    const [selectedTradeStatus, setSelectedTradeStatus] = useState<string[]>([]);
    const [selectedAdminStatus, setSelectedAdminStatus] = useState<string[]>([]);
    const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
    const [selectedAgentType, setSelectedAgentType] = useState<string | null>(null);
    const [createdDateRange, setCreatedDateRange] = useState<[string, string] | null>(null);
    const [periodFilter, setPeriodFilter] = useState<string | null>(null);
    const [createdCustomStart, setCreatedCustomStart] = useState("");
    const [createdCustomEnd, setCreatedCustomEnd] = useState("");
    const [searchText, setSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const { user } = useSelector((state: any) => state.user);
    const isSuperAdmin = user?.roleId == 1;
    const { data: activeBranches, isLoading: branchesLoading } = useGetActiveBranchListDataQuery("");
    const { data: brokerageData } = useGetBrokerageDataQuery("");
    const { data: agentsData, isLoading: agentsLoading } = useGetAgentListDataQuery("");

    // Initialize search text from localStorage
    useEffect(() => {
        setSearchText(localStorage.getItem("agentReportSearchText") || "");
    }, []);

    // Save search text to localStorage
    useEffect(() => {
        localStorage.setItem("agentReportSearchText", searchText);
    }, [searchText]);

    // Build query params
    const queryParams = useMemo(() => {
        const params: any = {};
        if (selectedBranches.length > 0) params.branchIds = selectedBranches.join(",");
        if (selectedBrokerageIds.length > 0) params.brokerageIds = selectedBrokerageIds.join(",");
        if (selectedAccountStatus.length > 0) params.accountStatus = selectedAccountStatus.join(",");
        if (selectedTradeStatus.length > 0) params.tradeStatus = selectedTradeStatus.join(",");
        if (selectedAdminStatus.length > 0) params.adminStatus = selectedAdminStatus.join(",");
        if (selectedAgentType) params.agentType = selectedAgentType;
        if (createdDateRange) {
            params.createdStartDate = createdDateRange[0];
            params.createdEndDate = createdDateRange[1];
        }
        return params;
    }, [
        selectedBranches, selectedBrokerageIds, selectedAccountStatus,
        selectedTradeStatus, selectedAdminStatus, selectedAgentType, createdDateRange
    ]);

    const { data, isLoading } = useGetDynamicAgentReportQuery(queryParams);

    const agentData = data?.data?.agents || [];
    const summary = data?.data?.summary || {
        totalAgent: 0,
        approvedAgent: 0,
        pendingAgent: 0,
        underReviewAgent: 0,
        rejectedAgent: 0,
        terminatedAgent: 0,
        deactiveAgent: 0,
        ourAgent: 0,
        otherAgent: 0,
        totalTradesheet: 0,
        totalClosedTrade: 0,
        totalSales: 0,
        totalSold: 0,
        totalSalesIncome: 0,
        totalSoldIncome: 0,
    };

    // Helper function to extract all values from an object for search
    const extractValues = (obj: any): string[] => {
        const values: string[] = [];
        if (obj === null || obj === undefined) return values;
        if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
            values.push(String(obj));
        } else if (Array.isArray(obj)) {
            obj.forEach(item => {
                values.push(...extractValues(item));
            });
        } else if (typeof obj === 'object') {
            Object.values(obj).forEach(value => {
                values.push(...extractValues(value));
            });
        }
        return values;
    };

    // Filter data based on search and selected agents
    const filteredData = useMemo(() => {
        let filtered = [...agentData];

        // Agent Type filter (client-side filtering for consistency)
        if (selectedAgentType === 'ourAgent') {
            filtered = filtered.filter((item: any) => {
                return (item.brokerageId === 24 || item.brokerageId === '24') && item.accountStatus !== 'closed';
            });
        } else if (selectedAgentType === 'otherAgent') {
            filtered = filtered.filter((item: any) => {
                return item.brokerageId !== 24 && item.brokerageId !== '24' && item.accountStatus !== 'closed';
            });
        }

        // Agent filter
        if (selectedAgents.length > 0) {
            filtered = filtered.filter((item: any) => {
                const agentId = item.id?.toString();
                return selectedAgents.includes(agentId);
            });
        }

        // Search filter
        if (searchText) {
            const searchLower = searchText.toLowerCase();
            filtered = filtered.filter((item: any) => {
                const allValues = extractValues(item);
                return allValues.some(val => val.toLowerCase().includes(searchLower));
            });
        }

        return filtered;
    }, [agentData, selectedAgentType, selectedAgents, searchText]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedBranches, selectedBrokerageIds, selectedAccountStatus, selectedTradeStatus, selectedAdminStatus, selectedAgents, selectedAgentType, createdDateRange, searchText]);

    // Account Status options
    const accountStatusOptions = [
        { label: "Approved", value: "approved" },
        { label: "Pending", value: "pending" },
        { label: "Under Review", value: "underReview" },
        { label: "Rejected", value: "rejected" },
        { label: "Terminated", value: "closed" },
        { label: "Deactive", value: "deactive" },
    ];

    // Trade Status options
    const tradeStatusOptions = [
        { label: "Closed", value: "closed" },
        { label: "DFT", value: "dft" },
        { label: "Deal Terminated", value: "dealTerminated" },
        { label: "Sold Conditional", value: "soldConditional" },
        { label: "Pending", value: "pending" },
    ];

    // Admin Status options
    const adminStatusOptions = [
        { label: "Approved", value: "approved" },
        { label: "Under Review", value: "underReview" },
        { label: "Draft", value: "draft" },
        { label: "Incomplete", value: "rejected" },
    ];

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
                return;
        }

        setCreatedDateRange([startDate.toISOString(), now.toISOString()]);
        setPeriodFilter(period);
    };

    // Handle custom date range
    const handleCustomDateRange = () => {
        if (createdCustomStart && createdCustomEnd) {
            setCreatedDateRange([createdCustomStart, createdCustomEnd]);
            setPeriodFilter(null);
        }
    };

    // Reset filters
    const handleResetFilters = () => {
        setSelectedBranches(branchIds);
        setSelectedBrokerageIds([]);
        setSelectedAccountStatus([]);
        setSelectedTradeStatus([]);
        setSelectedAdminStatus([]);
        setSelectedAgents([]);
        setSelectedAgentType(null);
        setCreatedDateRange(null);
        setPeriodFilter(null);
        setCreatedCustomStart("");
        setCreatedCustomEnd("");
        setSearchText("");
        localStorage.removeItem("agentReportSearchText");
        setShowDropdown(false);
    };

    // Export to PDF
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
        doc.text('Agent Report', pageWidth / 2, 30, { align: "center" });
        doc.setFontSize(10);
        doc.text(`Generated: ${format(new Date(), "dd MMM yyyy")}`, pageWidth / 2, 37, { align: "center" });

        const tableColumn = [
            '#',
            'Agent ID',
            'Name',
            'Email',
            'Brokerage Name',
            'Branch',
            'Cell Phone',
            'Designation',
            'Account Status',
            'Tradesheet',
            'Closed Trade',
            'Sales',
            'Sold',
        ];

        const tableRows = filteredData.map((item: any, index: number) => [
            index + 1,
            item.agentAccountId || "N/A",
            item.name || "N/A",
            item.email || "N/A",
            item.brokerageName || "N/A",
            item.branch || "N/A",
            item.cellPhone || "N/A",
            item.designation || "N/A",
            formatStringCamelCasecapitalize(item.accountStatus || ""),
            item.totalTradesheets || 0,
            item.closedTrades || 0,
            `$${formatNumberWithCommasAndDecimals(item.totalSales || 0)}`,
            `$${formatNumberWithCommasAndDecimals(item.totalSold || 0)}`,
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            headStyles: { fillColor: [20, 29, 44], textColor: [255, 255, 255] },
            margin: { top: 30, left: 10, right: 10, bottom: 10 },
        });
        doc.save(`Agent_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    };

    // Export to Excel
    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(
            filteredData.map((item: any, index: number) => ({
                '#': index + 1,
                'Agent ID': item.agentAccountId || "N/A",
                'Name': item.name || "N/A",
                'Email': item.email || "N/A",
                'Brokerage Name': item.brokerageName || "N/A",
                'Branch': item.branch || "N/A",
                'Cell Phone': item.cellPhone || "N/A",
                'Designation': item.designation || "N/A",
                'Account Status': formatStringCamelCasecapitalize(item.accountStatus || ""),
                'Tradesheet': item.totalTradesheets || 0,
                'Closed Trade': item.closedTrades || 0,
                'Sales': item.totalSales || 0,
                'Sold': item.totalSold || 0,
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Agent Report");
        XLSX.writeFile(workbook, `Agent_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    // Table columns
    const columns: TableColumnsType<any> = [
        {
            title: '#',
            key: 'index',
            width: 60,
            render: (_: any, __: any, index: number) => (currentPage - 1) * pageSize + index + 1,
        },
        {
            title: 'Agent ID',
            dataIndex: 'agentAccountId',
            key: 'agentAccountId',
            sorter: (a: any, b: any) => (a.agentAccountId || "").localeCompare(b.agentAccountId || ""),
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a: any, b: any) => (a.name || "").localeCompare(b.name || ""),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a: any, b: any) => (a.email || "").localeCompare(b.email || ""),
        },
        {
            title: 'Brokerage Name',
            dataIndex: 'brokerageName',
            key: 'brokerageName',
            sorter: (a: any, b: any) => (a.brokerageName || "").localeCompare(b.brokerageName || ""),
        },
        {
            title: 'Branch',
            dataIndex: 'branch',
            key: 'branch',
            sorter: (a: any, b: any) => (a.branch || "").localeCompare(b.branch || ""),
        },
        {
            title: 'Cell Phone',
            dataIndex: 'cellPhone',
            key: 'cellPhone',
            sorter: (a: any, b: any) => (a.cellPhone || "").localeCompare(b.cellPhone || ""),
        },
        {
            title: 'Designation',
            dataIndex: 'designation',
            key: 'designation',
            sorter: (a: any, b: any) => (a.designation || "").localeCompare(b.designation || ""),
        },
        {
            title: 'Account Status',
            dataIndex: 'accountStatus',
            key: 'accountStatus',
            sorter: (a: any, b: any) => (a.accountStatus || "").localeCompare(b.accountStatus || ""),
            render: (status: string) => formatStringCamelCasecapitalize(status || ""),
        },
        {
            title: 'Tradesheet',
            dataIndex: 'totalTradesheets',
            key: 'totalTradesheets',
            sorter: (a: any, b: any) => (a.totalTradesheets || 0) - (b.totalTradesheets || 0),
            align: 'right',
        },
        {
            title: 'Closed Trade',
            dataIndex: 'closedTrades',
            key: 'closedTrades',
            sorter: (a: any, b: any) => (a.closedTrades || 0) - (b.closedTrades || 0),
            align: 'right',
        },
        {
            title: 'Sales',
            dataIndex: 'totalSales',
            key: 'totalSales',
            sorter: (a: any, b: any) => (a.totalSales || 0) - (b.totalSales || 0),
            align: 'right',
            render: (value: number) => `$${formatNumberWithCommasAndDecimals(value || 0)}`,
        },
        {
            title: 'Sold',
            dataIndex: 'totalSold',
            key: 'totalSold',
            sorter: (a: any, b: any) => (a.totalSold || 0) - (b.totalSold || 0),
            align: 'right',
            render: (value: number) => `$${formatNumberWithCommasAndDecimals(value || 0)}`,
        },
    ];

    return (
        <div className="pb-32">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-4 my-3">
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Total Agent</span>
                        <span className="text-lg font-semibold text-blue-600">{summary.totalAgent}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Approved Agent</span>
                        <span className="text-lg font-semibold text-green-600">{summary.approvedAgent}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Pending Agent</span>
                        <span className="text-lg font-semibold text-yellow-600">{summary.pendingAgent}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Under Review Agent</span>
                        <span className="text-lg font-semibold text-orange-600">{summary.underReviewAgent}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Rejected Agent</span>
                        <span className="text-lg font-semibold text-red-600">{summary.rejectedAgent}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Terminated Agent</span>
                        <span className="text-lg font-semibold text-purple-600">{summary.terminatedAgent}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Deactive Agent</span>
                        <span className="text-lg font-semibold text-gray-600">{summary.deactiveAgent}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-indigo-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Our Agent</span>
                        <span className="text-lg font-semibold text-indigo-600">{summary.ourAgent}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-slate-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Other Agent</span>
                        <span className="text-lg font-semibold text-slate-600">{summary.otherAgent}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-pink-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Total Tradesheet</span>
                        <span className="text-lg font-semibold text-pink-600">{summary.totalTradesheet}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-teal-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Total Closed Trade</span>
                        <span className="text-lg font-semibold text-teal-600">{summary.totalClosedTrade}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-cyan-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Total Sales</span>
                        <span className="text-lg font-semibold text-cyan-600">
                            ${formatNumberWithCommasAndDecimals(summary.totalSales)}
                        </span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-amber-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Total Sold</span>
                        <span className="text-lg font-semibold text-amber-600">
                            ${formatNumberWithCommasAndDecimals(summary.totalSold)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Filter and Export Section */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                <div className="w-full sm:w-auto flex-1 max-w-2xl relative">
                    <div className="flex">
                        <input
                            type="text"
                            className="w-full border p-2 rounded-l focus:ring focus:#141D2C"
                            placeholder="Search agents..."
                            value={searchText}
                            onChange={(e) => {
                                const newValue = e.target.value;
                                setSearchText(newValue);
                                localStorage.setItem("agentReportSearchText", newValue);
                            }}
                        />
                        {searchText && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchText("");
                                    localStorage.removeItem("agentReportSearchText");
                                }}
                                className="absolute right-20 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes />
                            </button>
                        )}
                        <button
                            className="bg-[#141D2C] text-white px-4 py-2 rounded-r-md flex items-center gap-2"
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            <FaFilter /> Filter
                        </button>
                    </div>
                </div>

                {/* Export Buttons */}
                <div className="flex gap-3">
                    <FaFilePdf
                        onClick={handleExportPdf}
                        size={32}
                        className="cursor-pointer text-red-600 hover:text-red-700"
                        title="Export to PDF"
                    />
                    <FaFileExcel
                        onClick={handleExportExcel}
                        size={32}
                        className="cursor-pointer text-green-600 hover:text-green-700"
                        title="Export to Excel"
                    />
                </div>
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
                    .agent-filter-scroll::-webkit-scrollbar {
                        width: 12px !important;
                    }
                    .agent-filter-scroll::-webkit-scrollbar-track {
                        background: #f1f1f1 !important;
                        border-radius: 6px !important;
                        margin: 4px !important;
                    }
                    .agent-filter-scroll::-webkit-scrollbar-thumb {
                        background: #888 !important;
                        border-radius: 6px !important;
                        border: 2px solid #f1f1f1 !important;
                    }
                    .agent-filter-scroll::-webkit-scrollbar-thumb:hover {
                        background: #555 !important;
                    }
                `}</style>

                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-[#141D2C] text-white">
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
                        className="agent-filter-scroll flex-1 overflow-y-auto overflow-x-hidden p-4"
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

                            {/* Agent Type Filter */}
                            <div>
                                <label className="font-semibold mb-2 block">Agent Type</label>
                                <Select
                                    placeholder="Select agent type"
                                    value={selectedAgentType}
                                    onChange={setSelectedAgentType}
                                    options={[
                                        { label: "Our Agent", value: "ourAgent" },
                                        { label: "Other Agent", value: "otherAgent" },
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
                                        showSearch
                                        filterOption={(input, option) =>
                                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                        }
                                        loading={branchesLoading}
                                    />
                                </div>
                            )}

                            {/* Brokerage Name */}
                            <div>
                                <label className="font-semibold mb-2 block">Brokerage Name</label>
                                <Select
                                    mode="multiple"
                                    placeholder="Select brokerages"
                                    value={selectedBrokerageIds}
                                    onChange={setSelectedBrokerageIds}
                                    options={brokerageData?.data?.brokerageData?.map((brokerage: any) => ({
                                        value: brokerage.id.toString(),
                                        label: brokerage.brokerageName,
                                    }))}
                                    className="w-full"
                                    allowClear
                                    showSearch
                                    filterOption={(input, option) =>
                                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                    }
                                />
                            </div>

                            {/* Account Status */}
                            <div>
                                <label className="font-semibold mb-2 block">Account Status</label>
                                <Select
                                    mode="multiple"
                                    placeholder="Select account status"
                                    value={selectedAccountStatus}
                                    onChange={setSelectedAccountStatus}
                                    options={accountStatusOptions}
                                    className="w-full"
                                    allowClear
                                />
                            </div>

                            {/* Trade Status */}
                            <div>
                                <label className="font-semibold mb-2 block">Trade Status</label>
                                <Select
                                    mode="multiple"
                                    placeholder="Select trade status"
                                    value={selectedTradeStatus}
                                    onChange={setSelectedTradeStatus}
                                    options={tradeStatusOptions}
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
                                    options={adminStatusOptions}
                                    className="w-full"
                                    allowClear
                                />
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
                                        const agentId = agent.id;
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
                                    }).filter((option: any) => option.value)}
                                    className="w-full"
                                    allowClear
                                    showSearch
                                    loading={agentsLoading}
                                    filterOption={(input, option) =>
                                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                    }
                                />
                            </div>

                            {/* Custom Date Range (Created At) */}
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
                        </div>
                    </div>

                    {/* Fixed Footer with Action Buttons */}
                    <div className="flex gap-2 p-4 border-t bg-white">
                        <button
                            className="w-1/2 bg-[#141D2C] text-white p-2 rounded hover:bg-[#1a2533] transition-colors"
                            onClick={() => {
                                handleCustomDateRange();
                                setShowDropdown(false);
                            }}
                        >
                            Apply
                        </button>
                        <button
                            className="w-1/2 bg-[#FFDFDC] text-[#EF4444] p-2 rounded hover:bg-[#ffd0cd] transition-colors"
                            onClick={() => {
                                setShowDropdown(false);
                                setSelectedBranches(branchIds);
                                setSelectedBrokerageIds([]);
                                setSelectedAccountStatus([]);
                                setSelectedTradeStatus([]);
                                setSelectedAdminStatus([]);
                                setSelectedAgents([]);
                                setSelectedAgentType(null);
                                setCreatedDateRange(null);
                                setPeriodFilter(null);
                                setCreatedCustomStart("");
                                setCreatedCustomEnd("");
                            }}
                        >
                            Reset & Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <Table
                rowKey="id"
                scroll={{ x: "max-content" }}
                columns={columns}
                dataSource={filteredData}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    onChange: (page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    },
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                }}
                loading={isLoading}
            />
        </div>
    );
}
