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
  useGetDynamicUserReportQuery,
} from '../../../redux/api/superadmin/report/dynamicReportSlice';
import {
  useGetRoleListQuery,
} from '../../../redux/api/superadmin/roleManagementSlice';
import { formatStringCamelCasecapitalize } from '../../../utils/stringUtils';

interface UserReportProps {
    branchIds: string[];
}

export default function UserReport({ branchIds }: UserReportProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedBranches, setSelectedBranches] = useState<string[]>(branchIds);
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
    const [selectedIsActive, setSelectedIsActive] = useState<string | null>(null);
    const [selectedUserType, setSelectedUserType] = useState<string | null>(null);
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
    const { data: roleData } = useGetRoleListQuery("");

    // Initialize search text from localStorage
    useEffect(() => {
        setSearchText(localStorage.getItem("userReportSearchText") || "");
    }, []);

    // Save search text to localStorage
    useEffect(() => {
        localStorage.setItem("userReportSearchText", searchText);
    }, [searchText]);

    // Build query params
    const queryParams = useMemo(() => {
        const params: any = {};
        if (selectedBranches.length > 0) params.branchIds = selectedBranches.join(",");
        if (selectedRoleIds.length > 0) params.roleIds = selectedRoleIds.join(",");
        if (selectedStatus.length > 0) params.status = selectedStatus.join(",");
        if (selectedIsActive !== null) params.isActive = selectedIsActive;
        if (selectedUserType) params.userType = selectedUserType;
        if (createdDateRange) {
            params.createdStartDate = createdDateRange[0];
            params.createdEndDate = createdDateRange[1];
        }
        return params;
    }, [
        selectedBranches, selectedRoleIds, selectedStatus, selectedIsActive, selectedUserType, createdDateRange
    ]);

    const { data, isLoading } = useGetDynamicUserReportQuery(queryParams);

    const userData = data?.data?.users || [];
    const summary = data?.data?.summary || {
        totalUser: 0,
        activeUser: 0,
        inactiveUser: 0,
        approvedUser: 0,
        pendingUser: 0,
        draftUser: 0,
        underReviewUser: 0,
        rejectedUser: 0,
        closedUser: 0,
        ourUser: 0,
        otherUser: 0,
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

    // Filter data based on search
    const filteredData = useMemo(() => {
        let filtered = [...userData];

        // Search filter
        if (searchText) {
            const searchLower = searchText.toLowerCase();
            filtered = filtered.filter((item: any) => {
                const allValues = extractValues(item);
                return allValues.some(val => val.toLowerCase().includes(searchLower));
            });
        }

        return filtered;
    }, [userData, searchText]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedBranches, selectedRoleIds, selectedStatus, selectedIsActive, selectedUserType, createdDateRange, searchText]);

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
        setSelectedRoleIds([]);
        setSelectedStatus([]);
        setSelectedIsActive(null);
        setSelectedUserType(null);
        setCreatedDateRange(null);
        setPeriodFilter(null);
        setCreatedCustomStart("");
        setCreatedCustomEnd("");
        setSearchText("");
        localStorage.removeItem("userReportSearchText");
        setShowDropdown(false);
    };

    // Status options
    const statusOptions = [
        { label: "Approved", value: "approved" },
        { label: "Pending", value: "pending" },
        { label: "Draft", value: "draft" },
        { label: "Under Review", value: "underReview" },
        { label: "Rejected", value: "rejected" },
        { label: "Closed", value: "closed" },
    ];

    // Get role cards dynamically from summary
    const roleCards = useMemo(() => {
        if (!roleData?.data?.roles || !summary) return [];
        return roleData.data.roles.map((role: any) => {
            const roleKey = `role_${role.id}`;
            const count = summary[roleKey] || 0;
            return {
                id: role.id,
                name: role.name,
                count: count,
            };
        }).filter((role: any) => role.count > 0 || true); // Show all roles even if count is 0
    }, [roleData, summary]);

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
        doc.text('User Report', pageWidth / 2, 30, { align: "center" });
        doc.setFontSize(10);
        doc.text(`Generated: ${format(new Date(), "dd MMM yyyy")}`, pageWidth / 2, 37, { align: "center" });

        const tableColumn = [
            '#',
            'User ID',
            'Name',
            'Email',
            'Phone Number',
            'User Role',
            'Branch',
            'Status',
            'Active',
            'Created At',
        ];

        const tableRows = filteredData.map((item: any, index: number) => [
            index + 1,
            item.userTypeUId || "N/A",
            item.name || "N/A",
            item.email || "N/A",
            item.phoneNumber || "N/A",
            formatStringCamelCasecapitalize(item.userRole || ""),
            item.branch || "N/A",
            formatStringCamelCasecapitalize(item.status || ""),
            item.isActive ? "Yes" : "No",
            item.createdAt
                ? format(new Date(item.createdAt), "dd MMM yyyy")
                : "N/A",
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            headStyles: { fillColor: [20, 29, 44], textColor: [255, 255, 255] },
            margin: { top: 30, left: 10, right: 10, bottom: 10 },
        });
        doc.save(`User_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    };

    // Export to Excel
    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(
            filteredData.map((item: any, index: number) => ({
                '#': index + 1,
                'User ID': item.userTypeUId || "N/A",
                'Name': item.name || "N/A",
                'Email': item.email || "N/A",
                'Phone Number': item.phoneNumber || "N/A",
                'User Role': formatStringCamelCasecapitalize(item.userRole || ""),
                'Branch': item.branch || "N/A",
                'Status': formatStringCamelCasecapitalize(item.status || ""),
                'Active': item.isActive ? "Yes" : "No",
                'Created At': item.createdAt
                    ? format(new Date(item.createdAt), "dd MMM yyyy")
                    : "N/A",
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "User Report");
        XLSX.writeFile(workbook, `User_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
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
            title: 'User ID',
            dataIndex: 'userTypeUId',
            key: 'userTypeUId',
            sorter: (a: any, b: any) => (a.userTypeUId || "").localeCompare(b.userTypeUId || ""),
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
            title: 'Phone Number',
            dataIndex: 'phoneNumber',
            key: 'phoneNumber',
            sorter: (a: any, b: any) => (a.phoneNumber || "").localeCompare(b.phoneNumber || ""),
        },
        {
            title: 'User Role',
            dataIndex: 'userRole',
            key: 'userRole',
            sorter: (a: any, b: any) => (a.userRole || "").localeCompare(b.userRole || ""),
            render: (role: string) => formatStringCamelCasecapitalize(role || ""),
        },
        {
            title: 'Branch',
            dataIndex: 'branch',
            key: 'branch',
            sorter: (a: any, b: any) => (a.branch || "").localeCompare(b.branch || ""),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            sorter: (a: any, b: any) => (a.status || "").localeCompare(b.status || ""),
            render: (status: string) => formatStringCamelCasecapitalize(status || ""),
        },
        {
            title: 'Active',
            dataIndex: 'isActive',
            key: 'isActive',
            sorter: (a: any, b: any) => (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0),
            render: (isActive: boolean) => isActive ? "Yes" : "No",
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            render: (createdAt: string) =>
                createdAt ? format(new Date(createdAt), "dd MMM yyyy") : "N/A",
        },
    ];

    return (
        <div className="pb-32">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-4 my-3">
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Total User</span>
                        <span className="text-lg font-semibold text-blue-600">{summary.totalUser}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Active User</span>
                        <span className="text-lg font-semibold text-green-600">{summary.activeUser}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Inactive User</span>
                        <span className="text-lg font-semibold text-red-600">{summary.inactiveUser}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Approved User</span>
                        <span className="text-lg font-semibold text-yellow-600">{summary.approvedUser}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Pending User</span>
                        <span className="text-lg font-semibold text-orange-600">{summary.pendingUser}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-teal-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Draft User</span>
                        <span className="text-lg font-semibold text-teal-600">{summary.draftUser}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-indigo-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Under Review</span>
                        <span className="text-lg font-semibold text-indigo-600">{summary.underReviewUser}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-pink-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Rejected User</span>
                        <span className="text-lg font-semibold text-pink-600">{summary.rejectedUser}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-teal-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Closed User</span>
                        <span className="text-lg font-semibold text-teal-600">{summary.closedUser}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-indigo-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Our User</span>
                        <span className="text-lg font-semibold text-indigo-600">{summary.ourUser}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-slate-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Other User</span>
                        <span className="text-lg font-semibold text-slate-600">{summary.otherUser}</span>
                    </div>
                </div>
                {/* Dynamic Role Cards */}
                {roleCards.map((role: any, index: number) => {
                    const colors = [
                        'border-cyan-500', 'border-amber-500', 'border-lime-500', 'border-emerald-500',
                        'border-teal-500', 'border-teal-500', 'border-rose-500', 'border-sky-500'
                    ];
                    const textColors = [
                        'text-cyan-600', 'text-amber-600', 'text-lime-600', 'text-emerald-600',
                        'text-teal-600', 'text-teal-600', 'text-rose-600', 'text-sky-600'
                    ];
                    const colorIndex = index % colors.length;
                    return (
                        <div key={role.id} className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${colors[colorIndex]}`}>
                            <div className="flex flex-col">
                                <span className="text-sm text-gray-500 mb-1">{role.name}</span>
                                <span className={`text-lg font-semibold ${textColors[colorIndex]}`}>{role.count}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filter and Export Section */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                <div className="w-full sm:w-auto flex-1 max-w-2xl relative">
                    <div className="flex">
                        <input
                            type="text"
                            className="w-full border p-2 rounded-l focus:ring focus:#0a2a28"
                            placeholder="Search users..."
                            value={searchText}
                            onChange={(e) => {
                                const newValue = e.target.value;
                                setSearchText(newValue);
                                localStorage.setItem("userReportSearchText", newValue);
                            }}
                        />
                        {searchText && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchText("");
                                    localStorage.removeItem("userReportSearchText");
                                }}
                                className="absolute right-20 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                <FaTimes />
                            </button>
                        )}
                        <button
                            className="bg-[#0a2a28] text-white px-4 py-2 rounded-r-md flex items-center gap-2"
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
                    .user-filter-scroll::-webkit-scrollbar {
                        width: 12px !important;
                    }
                    .user-filter-scroll::-webkit-scrollbar-track {
                        background: #f1f1f1 !important;
                        border-radius: 6px !important;
                        margin: 4px !important;
                    }
                    .user-filter-scroll::-webkit-scrollbar-thumb {
                        background: #888 !important;
                        border-radius: 6px !important;
                        border: 2px solid #f1f1f1 !important;
                    }
                    .user-filter-scroll::-webkit-scrollbar-thumb:hover {
                        background: #555 !important;
                    }
                `}</style>

                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b bg-[#0a2a28] text-white">
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
                        className="user-filter-scroll flex-1 overflow-y-auto overflow-x-hidden p-4"
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

                            {/* User Role */}
                            <div>
                                <label className="font-semibold mb-2 block">User Role</label>
                                <Select
                                    mode="multiple"
                                    placeholder="Select roles"
                                    value={selectedRoleIds}
                                    onChange={setSelectedRoleIds}
                                    options={roleData?.data?.roles?.map((role: any) => ({
                                        value: role.id.toString(),
                                        label: role.name,
                                    }))}
                                    className="w-full"
                                    allowClear
                                    showSearch
                                    filterOption={(input, option) =>
                                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                    }
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="font-semibold mb-2 block">Status</label>
                                <Select
                                    mode="multiple"
                                    placeholder="Select status"
                                    value={selectedStatus}
                                    onChange={setSelectedStatus}
                                    options={statusOptions}
                                    className="w-full"
                                    allowClear
                                />
                            </div>

                            {/* Active/Inactive */}
                            <div>
                                <label className="font-semibold mb-2 block">Active Status</label>
                                <Select
                                    placeholder="Select active status"
                                    value={selectedIsActive}
                                    onChange={setSelectedIsActive}
                                    options={[
                                        { label: "Yes", value: "yes" },
                                        { label: "No", value: "no" },
                                    ]}
                                    className="w-full"
                                    allowClear
                                />
                            </div>

                            {/* User Type (Our Users / Other Users) */}
                            <div>
                                <label className="font-semibold mb-2 block">User Type</label>
                                <Select
                                    placeholder="Select user type"
                                    value={selectedUserType}
                                    onChange={setSelectedUserType}
                                    options={[
                                        { label: "Our Users", value: "ourUsers" },
                                        { label: "Other Users", value: "otherUsers" },
                                    ]}
                                    className="w-full"
                                    allowClear
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
                            className="w-1/2 bg-[#0a2a28] text-white p-2 rounded hover:bg-[#1a2533] transition-colors"
                            onClick={() => {
                                handleCustomDateRange();
                                setShowDropdown(false);
                            }}
                        >
                            Apply
                        </button>
                        <button
                            className="w-1/2 bg-[#FFDFDC] text-[#EF4444] p-2 rounded hover:bg-[#ffd0cd] transition-colors"
                            onClick={handleResetFilters}
                        >
                            Reset & Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <Table
                rowKey="uuid"
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
