
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
  useGetActiveBranchListDataQuery,
} from '../../../redux/api/superadmin/branch/Branchmanagementslice';
import {
  useGetAgentListDataQuery,
} from '../../../redux/api/superadmin/agent/agentManagementSlice';
import {
  useGetBrokerageDataQuery,
} from '../../../redux/api/superadmin/brokerageDataSlice';
import {
  useGetCitiesQuery,
  useGetStatesQuery,
} from '../../../redux/api/common/countryStateCitySlice';
import {
  useGetDynamicBranchReportQuery,
} from '../../../redux/api/superadmin/report/dynamicReportSlice';
import {
  formatNumberWithCommasAndDecimals,
} from '../../../utils/formatNumberWithCommasAndDecimals';
import { formatStringCamelCasecapitalize } from '../../../utils/stringUtils';

interface BranchReportProps {
    branchIds: string[];
}

export default function BranchReport({ branchIds }: BranchReportProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedBranches, setSelectedBranches] = useState<string[]>(branchIds);
    const [selectedBranchStatus, setSelectedBranchStatus] = useState<string[]>([]);
    const [selectedBranchLocation, setSelectedBranchLocation] = useState<string[]>([]);
    const [selectedAgentStatus, setSelectedAgentStatus] = useState<string[]>([]);
    const [selectedBrokerageName, setSelectedBrokerageName] = useState<string[]>([]);
    const [selectedTradeStatus, setSelectedTradeStatus] = useState<string[]>([]);
    const [selectedAdminStatus, setSelectedAdminStatus] = useState<string[]>([]);
    const [selectedRepresentation, setSelectedRepresentation] = useState<string[]>([]);
    const [selectedExpenseStatus, setSelectedExpenseStatus] = useState<string[]>([]);
    const [selectedRecurring, setSelectedRecurring] = useState<string[]>([]);
    const [selectedRecurrenceType, setSelectedRecurrenceType] = useState<string[]>([]);
    const [closingDateRange, setClosingDateRange] = useState<[string, string] | null>(null);
    const [tradeCreatedDateRange, setTradeCreatedDateRange] = useState<[string, string] | null>(null);
    const [branchCreatedDateRange, setBranchCreatedDateRange] = useState<[string, string] | null>(null);
    const [closingCustomStart, setClosingCustomStart] = useState("");
    const [closingCustomEnd, setClosingCustomEnd] = useState("");
    const [tradeCreatedCustomStart, setTradeCreatedCustomStart] = useState("");
    const [tradeCreatedCustomEnd, setTradeCreatedCustomEnd] = useState("");
    const [branchCreatedCustomStart, setBranchCreatedCustomStart] = useState("");
    const [branchCreatedCustomEnd, setBranchCreatedCustomEnd] = useState("");
    const [searchText, setSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const { user } = useSelector((state: any) => state.user);
    const isSuperAdmin = user?.roleId == 1;
    const { data: activeBranches, isLoading: branchesLoading } = useGetActiveBranchListDataQuery("");
    const { data: agentsData } = useGetAgentListDataQuery("");
    const { data: brokerageData } = useGetBrokerageDataQuery("");
    const selectedCountry = 39; // Canada by default
    const { data: states = [] } = useGetStatesQuery(selectedCountry, {
        skip: !selectedCountry,
    });

    // Initialize search text from localStorage
    useEffect(() => {
        setSearchText(localStorage.getItem("branchReportSearchText") || "");
    }, []);

    // Build query params
    const queryParams = useMemo(() => {
        const params: any = {};
        if (selectedBranches.length > 0) params.branchIds = selectedBranches.join(",");
        if (selectedBranchStatus.length > 0) params.branchStatus = selectedBranchStatus.join(",");
        if (selectedBranchLocation.length > 0) params.branchLocation = selectedBranchLocation.join(",");
        if (selectedAgentStatus.length > 0) params.agentStatus = selectedAgentStatus.join(",");
        if (selectedBrokerageName.length > 0) params.brokerageName = selectedBrokerageName.join(",");
        if (selectedTradeStatus.length > 0) params.tradeStatus = selectedTradeStatus.join(",");
        if (selectedAdminStatus.length > 0) params.adminStatus = selectedAdminStatus.join(",");
        if (selectedRepresentation.length > 0) params.representation = selectedRepresentation.join(",");
        if (selectedExpenseStatus.length > 0) params.expenseStatus = selectedExpenseStatus.join(",");
        if (selectedRecurring.length > 0) params.isRecurring = selectedRecurring.join(",");
        if (selectedRecurrenceType.length > 0) params.recurrenceType = selectedRecurrenceType.join(",");
        if (closingDateRange) {
            params.closingStartDate = closingDateRange[0];
            params.closingEndDate = closingDateRange[1];
        }
        if (tradeCreatedDateRange) {
            params.tradeCreatedStartDate = tradeCreatedDateRange[0];
            params.tradeCreatedEndDate = tradeCreatedDateRange[1];
        }
        if (branchCreatedDateRange) {
            params.branchCreatedStartDate = branchCreatedDateRange[0];
            params.branchCreatedEndDate = branchCreatedDateRange[1];
        }
        return params;
    }, [
        selectedBranches, selectedBranchStatus, selectedBranchLocation, selectedAgentStatus,
        selectedBrokerageName, selectedTradeStatus, selectedAdminStatus, selectedRepresentation,
        selectedExpenseStatus, selectedRecurring, selectedRecurrenceType,
        closingDateRange, tradeCreatedDateRange, branchCreatedDateRange
    ]);

    const { data, isLoading } = useGetDynamicBranchReportQuery(queryParams);

    const branchData = data?.data?.branches || [];
    const summary = data?.data?.summary || {
        totalBranch: 0,
        activeBranch: 0,
        inactiveBranch: 0,
        totalUser: 0,
        totalAgent: 0,
        totalTradesheet: 0,
        totalProperty: 0,
        totalCampaign: 0,
        totalTradeSelling: 0,
        totalTradeDeposit: 0,
        totalExpense: 0,
    };

    // Filter data based on search
    const filteredData = useMemo(() => {
        let filtered = [...branchData];

        // Search filter
        if (searchText) {
            const searchTerm = searchText.toLowerCase();
            filtered = filtered.filter((item: any) => {
                const allValues = [
                    item.name,
                    item.email,
                    item.phone,
                    item.location,
                    item.status,
                ].filter(Boolean).map(v => String(v).toLowerCase());
                return allValues.some((value) => value.includes(searchTerm));
            });
        }

        return filtered;
    }, [branchData, searchText]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [
        selectedBranches, selectedBranchStatus, selectedBranchLocation, selectedAgentStatus,
        selectedBrokerageName, selectedTradeStatus, selectedAdminStatus, selectedRepresentation,
        selectedExpenseStatus, selectedRecurring, selectedRecurrenceType,
        closingDateRange, tradeCreatedDateRange, branchCreatedDateRange, searchText
    ]);

    const handleClosingDateRange = () => {
        if (closingCustomStart && closingCustomEnd) {
            setClosingDateRange([closingCustomStart, closingCustomEnd]);
        }
    };

    const handleTradeCreatedDateRange = () => {
        if (tradeCreatedCustomStart && tradeCreatedCustomEnd) {
            setTradeCreatedDateRange([tradeCreatedCustomStart, tradeCreatedCustomEnd]);
        }
    };

    const handleBranchCreatedDateRange = () => {
        if (branchCreatedCustomStart && branchCreatedCustomEnd) {
            setBranchCreatedDateRange([branchCreatedCustomStart, branchCreatedCustomEnd]);
        }
    };

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(
            filteredData.map((item: any, index: number) => ({
                "#": index + 1,
                "Branch Name": item.name || "N/A",
                "Location": item.location || "N/A",
                "Branch Email": item.email || "N/A",
                "Branch Phone": item.phone || "N/A",
                "Branch Status": formatStringCamelCasecapitalize(item.status || ""),
                "User": item.totalUsers || 0,
                "Agent": item.totalAgents || 0,
                "Tradesheet": item.totalTradesheets || 0,
                "Property": item.totalProperties || 0,
                "Campaign": item.totalCampaigns || 0,
                "Trade Selling": item.totalTradeSelling || 0,
                "Trade Deposit": item.totalTradeDeposit || 0,
                "Expense": item.totalExpense || 0,
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Branch Report");
        XLSX.writeFile(workbook, `Branch_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
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
        doc.text('Branch Report', pageWidth / 2, 30, { align: "center" });
        doc.setFontSize(10);
        doc.text(`Generated: ${format(new Date(), "dd MMM yyyy")}`, pageWidth / 2, 37, { align: "center" });

        const tableColumn = [
            '#',
            'Branch Name',
            'Location',
            'Branch Email',
            'Branch Phone',
            'Branch Status',
            'User',
            'Agent',
            'Tradesheet',
            'Property',
            'Campaign',
            'Trade Selling',
            'Trade Deposit',
            'Expense',
        ];

        const tableRows = filteredData.map((item: any, index: number) => [
            index + 1,
            item.name || "N/A",
            item.location || "N/A",
            item.email || "N/A",
            item.phone || "N/A",
            formatStringCamelCasecapitalize(item.status || ""),
            item.totalUsers || 0,
            item.totalAgents || 0,
            item.totalTradesheets || 0,
            item.totalProperties || 0,
            item.totalCampaigns || 0,
            `$${formatNumberWithCommasAndDecimals(item.totalTradeSelling || 0)}`,
            `$${formatNumberWithCommasAndDecimals(item.totalTradeDeposit || 0)}`,
            `$${formatNumberWithCommasAndDecimals(item.totalExpense || 0)}`,
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            headStyles: { fillColor: [20, 29, 44], textColor: [255, 255, 255] },
            margin: { top: 30, left: 10, right: 10, bottom: 10 },
        });
        doc.save(`Branch_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    };

    const columns: TableColumnsType<any> = [
        {
            title: "Branch Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Location",
            key: "location",
            render: (_: any, record: any) => record.location || "N/A",
        },
        {
            title: "Branch Email",
            dataIndex: "email",
            key: "email",
            render: (email: string) => email || "N/A",
        },
        {
            title: "Branch Phone",
            dataIndex: "phone",
            key: "phone",
            render: (phone: string) => phone || "N/A",
        },
        {
            title: "Branch Status",
            dataIndex: "status",
            key: "status",
            render: (status: string) => formatStringCamelCasecapitalize(status || ""),
        },
        {
            title: "User",
            key: "totalUsers",
            render: (_: any, record: any) => record.totalUsers || 0,
        },
        {
            title: "Agent",
            key: "totalAgents",
            render: (_: any, record: any) => record.totalAgents || 0,
        },
        {
            title: "Tradesheet",
            key: "totalTradesheets",
            render: (_: any, record: any) => record.totalTradesheets || 0,
        },
        {
            title: "Property",
            key: "totalProperties",
            render: (_: any, record: any) => record.totalProperties || 0,
        },
        {
            title: "Campaign",
            key: "totalCampaigns",
            render: (_: any, record: any) => record.totalCampaigns || 0,
        },
        {
            title: "Trade Selling",
            key: "totalTradeSelling",
            render: (_: any, record: any) =>
                `$${formatNumberWithCommasAndDecimals(record.totalTradeSelling || 0)}`,
        },
        {
            title: "Trade Deposit",
            key: "totalTradeDeposit",
            render: (_: any, record: any) =>
                `$${formatNumberWithCommasAndDecimals(record.totalTradeDeposit || 0)}`,
        },
        {
            title: "Expense",
            key: "totalExpense",
            render: (_: any, record: any) =>
                `$${formatNumberWithCommasAndDecimals(record.totalExpense || 0)}`,
        },
    ];

    // Get unique locations from branches
    // Get unique locations from branches (using state/city IDs)
    const uniqueLocations = useMemo(() => {
        const locationMap = new Map<string, { value: string; label: string }>();
        activeBranches?.data?.branchData?.forEach((branch: any) => {
            // Add state as location option
            if (branch.stateId && branch.state?.name) {
                locationMap.set(`state_${branch.stateId}`, {
                    value: branch.stateId.toString(),
                    label: branch.state.name,
                });
            }
            // Add city as location option (with state name if available)
            if (branch.cityId && branch.city?.name) {
                const stateName = branch.state?.name || '';
                const label = stateName ? `${branch.city.name}, ${stateName}` : branch.city.name;
                locationMap.set(`city_${branch.cityId}`, {
                    value: branch.cityId.toString(),
                    label: label,
                });
            }
        });
        return Array.from(locationMap.values());
    }, [activeBranches]);

    return (
        <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 my-3">
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Total Branch</span>
                        <span className="text-lg font-semibold text-blue-600">{summary.totalBranch}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Active Branch</span>
                        <span className="text-lg font-semibold text-green-600">{summary.activeBranch}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Inactive Branch</span>
                        <span className="text-lg font-semibold text-red-600">{summary.inactiveBranch}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-teal-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Total User</span>
                        <span className="text-lg font-semibold text-teal-600">{summary.totalUser}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-indigo-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Total Agent</span>
                        <span className="text-lg font-semibold text-indigo-600">{summary.totalAgent}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Total Tradesheet</span>
                        <span className="text-lg font-semibold text-orange-600">{summary.totalTradesheet}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-pink-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Total Property</span>
                        <span className="text-lg font-semibold text-pink-600">{summary.totalProperty}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-teal-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Total Campaign</span>
                        <span className="text-lg font-semibold text-teal-600">{summary.totalCampaign}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-cyan-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Total Trade Selling</span>
                        <span className="text-lg font-semibold text-cyan-600">
                            ${formatNumberWithCommasAndDecimals(summary.totalTradeSelling)}
                        </span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-amber-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Total Trade Deposit</span>
                        <span className="text-lg font-semibold text-amber-600">
                            ${formatNumberWithCommasAndDecimals(summary.totalTradeDeposit)}
                        </span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-lime-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Total Expense</span>
                        <span className="text-lg font-semibold text-lime-600">
                            ${formatNumberWithCommasAndDecimals(summary.totalExpense)}
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
                            className="w-full border p-2 rounded-l focus:ring focus:#0a2a28"
                            placeholder="Search branches..."
                            value={searchText}
                            onChange={(e) => {
                                const newValue = e.target.value;
                                setSearchText(newValue);
                                localStorage.setItem("branchReportSearchText", newValue);
                            }}
                        />
                        {searchText && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchText("");
                                    localStorage.removeItem("branchReportSearchText");
                                }}
                                className="absolute right-20 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes />
                            </button>
                        )}
                        <button
                            className="bg-[#0f766e] text-white px-4 py-2 rounded-r-md flex items-center gap-2"
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            <FaFilter /> Filter
                        </button>
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
                            .branch-filter-scroll::-webkit-scrollbar {
                                width: 12px !important;
                            }
                            .branch-filter-scroll::-webkit-scrollbar-track {
                                background: #f1f1f1 !important;
                                border-radius: 6px !important;
                                margin: 4px !important;
                            }
                            .branch-filter-scroll::-webkit-scrollbar-thumb {
                                background: #888 !important;
                                border-radius: 6px !important;
                                border: 2px solid #f1f1f1 !important;
                            }
                            .branch-filter-scroll::-webkit-scrollbar-thumb:hover {
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
                                className="branch-filter-scroll flex-1 overflow-y-auto overflow-x-hidden p-4"
                                style={{
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: '#888 #f1f1f1',
                                }}
                            >
                                <div className="space-y-4">
                                    {/* Branch */}
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

                                    {/* Branch Status */}
                                    <div>
                                        <label className="font-semibold mb-2 block">Branch Status</label>
                                        <Select
                                            mode="multiple"
                                            placeholder="Select branch status"
                                            value={selectedBranchStatus}
                                            onChange={setSelectedBranchStatus}
                                            options={[
                                                { value: "active", label: "Active" },
                                                { value: "deactive", label: "Inactive" },
                                            ]}
                                            className="w-full"
                                            allowClear
                                        />
                                    </div>

                                    {/* Branch Location */}
                                    <div>
                                        <label className="font-semibold mb-2 block">Branch Location</label>
                                        <Select
                                            mode="multiple"
                                            placeholder="Select location"
                                            value={selectedBranchLocation}
                                            onChange={setSelectedBranchLocation}
                                            options={uniqueLocations}
                                            className="w-full"
                                            allowClear
                                            showSearch
                                        />
                                    </div>

                                    {/* Agent Status */}
                                    <div>
                                        <label className="font-semibold mb-2 block">Agent Status</label>
                                        <Select
                                            mode="multiple"
                                            placeholder="Select agent status"
                                            value={selectedAgentStatus}
                                            onChange={setSelectedAgentStatus}
                                            options={[
                                                { value: "approved", label: "Approved" },
                                                { value: "pending", label: "Pending" },
                                                { value: "underReview", label: "Under Review" },
                                                { value: "draft", label: "Draft" },
                                                { value: "rejected", label: "Rejected" },
                                                { value: "closed", label: "Terminate" },
                                            ]}
                                            className="w-full"
                                            allowClear
                                        />
                                    </div>

                                    {/* Brokerage Name */}
                                    <div>
                                        <label className="font-semibold mb-2 block">Brokerage Name</label>
                                        <Select
                                            mode="multiple"
                                            placeholder="Select brokerage"
                                            value={selectedBrokerageName}
                                            onChange={setSelectedBrokerageName}
                                            options={brokerageData?.data?.brokerageData?.map((brokerage: any) => ({
                                                value: brokerage.brokerageName,
                                                label: brokerage.brokerageName,
                                            }))}
                                            className="w-full"
                                            allowClear
                                            showSearch
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

                                    {/* Trade Representation */}
                                    <div>
                                        <label className="font-semibold mb-2 block">Trade Representation</label>
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

                                    {/* Expense Status */}
                                    <div>
                                        <label className="font-semibold mb-2 block">Expense Status</label>
                                        <Select
                                            mode="multiple"
                                            placeholder="Select expense status"
                                            value={selectedExpenseStatus}
                                            onChange={setSelectedExpenseStatus}
                                            options={[
                                                { value: "pending", label: "Pending" },
                                                { value: "approved", label: "Approved" },
                                                { value: "rejected", label: "Rejected" },
                                            ]}
                                            className="w-full"
                                            allowClear
                                        />
                                    </div>

                                    {/* Expense Recurring */}
                                    <div>
                                        <label className="font-semibold mb-2 block">Expense Recurring</label>
                                        <Select
                                            mode="multiple"
                                            placeholder="Select recurring"
                                            value={selectedRecurring}
                                            onChange={setSelectedRecurring}
                                            options={[
                                                { value: "yes", label: "Yes" },
                                                { value: "no", label: "No" },
                                            ]}
                                            className="w-full"
                                            allowClear
                                        />
                                    </div>

                                    {/* Expense Recurrence Type */}
                                    <div>
                                        <label className="font-semibold mb-2 block">Expense Recurrence Type</label>
                                        <Select
                                            mode="multiple"
                                            placeholder="Select recurrence type"
                                            value={selectedRecurrenceType}
                                            onChange={setSelectedRecurrenceType}
                                            options={[
                                                { value: "DAILY", label: "Daily" },
                                                { value: "WEEKLY", label: "Weekly" },
                                                { value: "MONTHLY", label: "Monthly" },
                                                { value: "YEARLY", label: "Yearly" },
                                            ]}
                                            className="w-full"
                                            allowClear
                                        />
                                    </div>

                                    {/* Trade Closing Date Range */}
                                    <div className="border p-2 rounded">
                                        <label className="font-semibold mb-2 block">Trade Closing Date Range</label>
                                        <div className="flex flex-col sm:flex-row gap-2 mt-1">
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

                                    {/* Trade Created Date Range */}
                                    <div className="border p-2 rounded">
                                        <label className="font-semibold mb-2 block">Trade Created Date Range</label>
                                        <div className="flex flex-col sm:flex-row gap-2 mt-1">
                                            <input
                                                type="date"
                                                className="border p-2 rounded w-full"
                                                value={tradeCreatedCustomStart}
                                                onChange={(e) => setTradeCreatedCustomStart(e.target.value)}
                                            />
                                            <input
                                                type="date"
                                                className="border p-2 rounded w-full"
                                                value={tradeCreatedCustomEnd}
                                                onChange={(e) => setTradeCreatedCustomEnd(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Branch Created Date Range */}
                                    <div className="border p-2 rounded">
                                        <label className="font-semibold mb-2 block">Custom Range (Branch Created At)</label>
                                        <div className="flex flex-col sm:flex-row gap-2 mt-1">
                                            <input
                                                type="date"
                                                className="border p-2 rounded w-full"
                                                value={branchCreatedCustomStart}
                                                onChange={(e) => setBranchCreatedCustomStart(e.target.value)}
                                            />
                                            <input
                                                type="date"
                                                className="border p-2 rounded w-full"
                                                value={branchCreatedCustomEnd}
                                                onChange={(e) => setBranchCreatedCustomEnd(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Fixed Footer with Action Buttons */}
                            <div className="flex gap-2 p-4 border-t bg-white">
                                <button
                                    className="w-1/2 bg-[#0f766e] text-white p-2 rounded hover:bg-[#0f766e] transition-colors"
                                    onClick={() => {
                                        handleClosingDateRange();
                                        handleTradeCreatedDateRange();
                                        handleBranchCreatedDateRange();
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
                                        setSelectedBranchStatus([]);
                                        setSelectedBranchLocation([]);
                                        setSelectedAgentStatus([]);
                                        setSelectedBrokerageName([]);
                                        setSelectedTradeStatus([]);
                                        setSelectedAdminStatus([]);
                                        setSelectedRepresentation([]);
                                        setSelectedExpenseStatus([]);
                                        setSelectedRecurring([]);
                                        setSelectedRecurrenceType([]);
                                        setClosingDateRange(null);
                                        setTradeCreatedDateRange(null);
                                        setBranchCreatedDateRange(null);
                                        setClosingCustomStart("");
                                        setClosingCustomEnd("");
                                        setTradeCreatedCustomStart("");
                                        setTradeCreatedCustomEnd("");
                                        setBranchCreatedCustomStart("");
                                        setBranchCreatedCustomEnd("");
                                    }}
                                >
                                    Reset & Close
                                </button>
                            </div>
                        </div>
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

            {/* Table */}
            <div>
                <h2 className="pt-2 font-semibold mb-3">Branch Report</h2>
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
