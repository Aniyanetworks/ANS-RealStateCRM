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
  useGetDynamicExpenseReportQuery,
} from '../../../redux/api/superadmin/report/dynamicReportSlice';
import {
  formatNumberWithCommasAndDecimals,
} from '../../../utils/formatNumberWithCommasAndDecimals';
import { formatStringCamelCasecapitalize } from '../../../utils/stringUtils';

interface ExpenseReportProps {
    branchIds: string[];
}

export default function ExpenseReport({ branchIds }: ExpenseReportProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedExpenseStatus, setSelectedExpenseStatus] = useState<string[]>([]);
    const [selectedRecurrenceType, setSelectedRecurrenceType] = useState<string[]>([]);
    const [selectedRecurring, setSelectedRecurring] = useState<string[]>([]);
    const [transactionDateRange, setTransactionDateRange] = useState<[string, string] | null>(null);
    const [periodFilter, setPeriodFilter] = useState<string | null>(null);
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [searchText, setSearchText] = useState("");
    const [selectedBranches, setSelectedBranches] = useState<string[]>(branchIds);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const { user } = useSelector((state: any) => state.user);
    const isSuperAdmin = user?.roleId == 1;
    const { data: activeBranches, isLoading: branchesLoading } = useGetActiveBranchListDataQuery("");

    useEffect(() => {
        setSearchText(localStorage.getItem("expenseReportSearchText") || "");
    }, []);

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
                setTransactionDateRange(null);
                setPeriodFilter(null);
                setCustomStart("");
                setCustomEnd("");
                return;
        }

        setTransactionDateRange([startDate.toISOString().split('T')[0], now.toISOString().split('T')[0]]);
        setPeriodFilter(period);
        setCustomStart(startDate.toISOString().split('T')[0]);
        setCustomEnd(now.toISOString().split('T')[0]);
    };

    const queryParams = useMemo(() => {
        const params: any = {};
        if (selectedBranches.length > 0) params.branchIds = selectedBranches.join(",");
        if (selectedExpenseStatus.length > 0) params.expenseStatus = selectedExpenseStatus.join(",");
        if (selectedRecurrenceType.length > 0) params.recurrenceType = selectedRecurrenceType.join(",");
        if (selectedRecurring.length > 0) params.isRecurring = selectedRecurring.join(",");
        if (transactionDateRange) {
            params.startDate = transactionDateRange[0];
            params.endDate = transactionDateRange[1];
        }
        return params;
    }, [selectedBranches, selectedExpenseStatus, selectedRecurrenceType, selectedRecurring, transactionDateRange]);

    const { data, isLoading } = useGetDynamicExpenseReportQuery(queryParams);

    const expenseData = data?.data?.expenses || [];
    const summary = data?.data?.summary || {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalAmount: 0,
        totalTax: 0,
        totalExpense: 0,
    };

    const filteredData = useMemo(() => {
        let filtered = [...expenseData];

        if (selectedExpenseStatus.length > 0) {
            filtered = filtered.filter((item: any) =>
                selectedExpenseStatus.includes(item.expenseStatus || "")
            );
        }

        if (selectedRecurrenceType.length > 0) {
            filtered = filtered.filter((item: any) =>
                selectedRecurrenceType.includes(item.recurrenceType || "")
            );
        }

        if (selectedRecurring.length > 0) {
            const isRecurringFilter = selectedRecurring.includes("yes");
            filtered = filtered.filter((item: any) => {
                if (isRecurringFilter) return item.isRecurring === true;
                return item.isRecurring === false;
            });
        }

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
                const allValues = extractValues(item);
                return allValues.some((value) => value.includes(searchTerm));
            });
        }

        return filtered;
    }, [expenseData, selectedExpenseStatus, selectedRecurrenceType, selectedRecurring, searchText]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedExpenseStatus, selectedRecurrenceType, selectedRecurring, searchText, selectedBranches, transactionDateRange]);

    const handleCustomDateRange = () => {
        if (customStart && customEnd) {
            setTransactionDateRange([customStart, customEnd]);
            setPeriodFilter(null);
            setShowDropdown(false);
        }
    };

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(
            filteredData.map((item: any, index: number) => ({
                "#": index + 1,
                "Invoice ID": item.invoice_number || "N/A",
                "Title": item.name || "N/A",
                "Description": item.description || "N/A",
                "Amount": item.amount || 0,
                "Tax": item.tax || 0,
                "Total": item.total || 0,
                "Date": item.transactionDate
                    ? format(new Date(item.transactionDate), "dd MMM yyyy")
                    : "N/A",
                "Category": item.expenseCategory?.name || "N/A",
                "Branch": item.branch?.name || "N/A",
                "Recurring": item.isRecurring ? "Yes" : "No",
                "Expense Status": item.expenseStatus || "N/A",
                "Recurrence Type": item.recurrenceType || "-",
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Expense Report");
        XLSX.writeFile(workbook, `Expense_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    const handleExportPdf = () => {
        const doc = new jsPDF('landscape');
        const pageWidth = doc.internal.pageSize.getWidth();

        const logoX = (pageWidth / 2) - 10;
        const logoY = 5;
        const logoWidth = 20;
        const logoHeight = 20;
        doc.addImage(logo1, "PNG", logoX, logoY, logoWidth, logoHeight);

        doc.setFontSize(16);
        doc.text('Expense Report', pageWidth / 2, 30, { align: "center" });
        doc.setFontSize(10);
        doc.text(`Generated: ${format(new Date(), "dd MMM yyyy")}`, pageWidth / 2, 37, { align: "center" });

        const tableColumn = [
            '#',
            'Invoice ID',
            'Title',
            'Description',
            'Amount',
            'Tax',
            'Total',
            'Date',
            'Category',
            'Branch',
            'Recurring',
        ];

        const tableRows = filteredData.map((item: any, index: number) => [
            index + 1,
            item.invoice_number || "N/A",
            item.name || "N/A",
            item.description || "N/A",
            `$${formatNumberWithCommasAndDecimals(item.amount || 0)}`,
            `$${formatNumberWithCommasAndDecimals(item.tax || 0)}`,
            `$${formatNumberWithCommasAndDecimals(item.total || 0)}`,
            item.transactionDate
                ? format(new Date(item.transactionDate), "dd MMM yyyy")
                : "N/A",
            item.expenseCategory?.name || "N/A",
            item.branch?.name || "N/A",
            item.isRecurring ? "Yes" : "No",
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            headStyles: { fillColor: [20, 29, 44], textColor: [255, 255, 255] },
            margin: { top: 30, left: 10, right: 10, bottom: 10 },
        });
        doc.save(`Expense_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    };

    const columns: TableColumnsType<any> = [
        {
            title: "Invoice ID",
            dataIndex: "invoice_number",
            key: "invoice_number",
        },
        {
            title: "Title",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            ellipsis: true,
        },
        {
            title: "Amount",
            key: "amount",
            render: (_: any, record: any) =>
                `$${formatNumberWithCommasAndDecimals(record.amount || 0)}`,
        },
        {
            title: "Tax",
            key: "tax",
            render: (_: any, record: any) =>
                `$${formatNumberWithCommasAndDecimals(record.tax || 0)}`,
        },
        {
            title: "Total",
            key: "total",
            render: (_: any, record: any) =>
                `$${formatNumberWithCommasAndDecimals(record.total || 0)}`,
        },
        {
            title: "Date",
            key: "transactionDate",
            render: (_: any, record: any) =>
                record.transactionDate
                    ? format(new Date(record.transactionDate), "dd MMM yyyy")
                    : "N/A",
        },
        {
            title: "Category",
            key: "category",
            render: (_: any, record: any) => record.expenseCategory?.name || "N/A",
        },
        {
            title: "Branch",
            key: "branch",
            render: (_: any, record: any) => record.branch?.name || "N/A",
        },
        {
            title: "Recurring",
            key: "isRecurring",
            render: (_: any, record: any) => (record.isRecurring ? "Yes" : "No"),
        },
        {
            title: "Expense Status",
            dataIndex: "expenseStatus",
            key: "expenseStatus",
            render: (text: string) => formatStringCamelCasecapitalize(text || ""),
        },
        {
            title: "Recurrence Type",
            dataIndex: "recurrenceType",
            key: "recurrenceType",
            render: (text: string) => text || "-",
        },
    ];

    return (
        <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 my-3">
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Total Expenses</span>
                        <span className="text-lg font-semibold text-blue-600">{summary.total}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Pending</span>
                        <span className="text-lg font-semibold text-yellow-600">{summary.pending}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Approved</span>
                        <span className="text-lg font-semibold text-green-600">{summary.approved}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Rejected</span>
                        <span className="text-lg font-semibold text-red-600">{summary.rejected}</span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-teal-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Total Amount</span>
                        <span className="text-lg font-semibold text-teal-600">
                            ${formatNumberWithCommasAndDecimals(summary.totalAmount)}
                        </span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-indigo-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Total Tax</span>
                        <span className="text-lg font-semibold text-indigo-600">
                            ${formatNumberWithCommasAndDecimals(summary.totalTax)}
                        </span>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Total Expense</span>
                        <span className="text-lg font-semibold text-orange-600">
                            ${formatNumberWithCommasAndDecimals(summary.totalExpense)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                <div className="w-full sm:w-auto flex-1 max-w-2xl relative">
                    <div className="flex">
                        <input
                            type="text"
                            className="w-full border p-2 rounded-l focus:ring focus:#0a2a28"
                            placeholder="Search expenses..."
                            value={searchText}
                            onChange={(e) => {
                                const newValue = e.target.value;
                                setSearchText(newValue);
                                localStorage.setItem("expenseReportSearchText", newValue);
                            }}
                        />
                        {searchText && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchText("");
                                    localStorage.removeItem("expenseReportSearchText");
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

                    {showDropdown && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
                            onClick={() => setShowDropdown(false)}
                        />
                    )}

                    <div
                        className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${showDropdown ? 'translate-x-0' : 'translate-x-full'
                            }`}
                        style={{
                            maxHeight: '100vh',
                        }}
                    >
                        <style>{`
                            .expense-filter-scroll::-webkit-scrollbar {
                                width: 12px !important;
                            }
                            .expense-filter-scroll::-webkit-scrollbar-track {
                                background: #f1f1f1 !important;
                                border-radius: 6px !important;
                                margin: 4px !important;
                            }
                            .expense-filter-scroll::-webkit-scrollbar-thumb {
                                background: #888 !important;
                                border-radius: 6px !important;
                                border: 2px solid #f1f1f1 !important;
                            }
                            .expense-filter-scroll::-webkit-scrollbar-thumb:hover {
                                background: #555 !important;
                            }
                        `}</style>

                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between p-4 border-b bg-[#0f766e] text-white">
                                <h3 className="text-lg font-semibold">Filter Options</h3>
                                <button
                                    onClick={() => setShowDropdown(false)}
                                    className="text-white hover:text-gray-300 text-2xl font-bold"
                                >
                                    ×
                                </button>
                            </div>

                            <div
                                className="expense-filter-scroll flex-1 overflow-y-auto overflow-x-hidden p-4"
                                style={{
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: '#888 #f1f1f1',
                                }}
                            >
                                <div className="space-y-4">
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

                                    <div>
                                        <label className="font-semibold mb-2 block">Recurrence Type</label>
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

                                    <div>
                                        <label className="font-semibold mb-2 block">Recurring</label>
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

                                    <div className="border p-2 rounded">
                                        <label className="font-semibold mb-2 block">Custom Range (Transaction Date)</label>
                                        <div className="flex flex-col sm:flex-row gap-2 mt-1">
                                            <input
                                                type="date"
                                                className="border p-2 rounded w-full"
                                                value={customStart}
                                                onChange={(e) => setCustomStart(e.target.value)}
                                            />
                                            <input
                                                type="date"
                                                className="border p-2 rounded w-full"
                                                value={customEnd}
                                                onChange={(e) => setCustomEnd(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 p-4 border-t bg-white">
                                <button
                                    className="w-1/2 bg-[#0f766e] text-white p-2 rounded hover:bg-[#0f766e] transition-colors"
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
                                        setSelectedExpenseStatus([]);
                                        setSelectedRecurrenceType([]);
                                        setSelectedRecurring([]);
                                        setSelectedBranches(branchIds);
                                        setTransactionDateRange(null);
                                        setPeriodFilter(null);
                                        setCustomStart("");
                                        setCustomEnd("");
                                    }}
                                >
                                    Reset & Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

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

            <div>
                <h2 className="pt-2 font-semibold mb-3">Expense Report</h2>
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
