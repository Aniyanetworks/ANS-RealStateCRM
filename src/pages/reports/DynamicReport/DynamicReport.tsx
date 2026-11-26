/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useState } from 'react';

import { Select } from 'antd';
import { useSelector } from 'react-redux';

import {
  useGetActiveBranchListDataQuery,
} from '../../../redux/api/superadmin/branch/Branchmanagementslice';
import AgentReport from './AgentReport';
import BranchReport from './BranchReport';
import ExpenseReport from './ExpenseReport';
import TradesheetReport from './TradesheetReport';
import UserReport from './UserReport';

const reportTypes = [
    { value: "tradesheet", label: "Tradesheet Report" },
    { value: "expense", label: "Expense Report" },
    { value: "branch", label: "Branch Report" },
    { value: "agent", label: "Agent Report" },
    { value: "user", label: "User Report" },
];

export default function DynamicReport() {
    const [selectedReportType, setSelectedReportType] = useState<string>("tradesheet");
    const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

    const { user } = useSelector((state: any) => state.user);
    const isSuperAdmin = user?.roleId == 1;
    const { data: activeBranches, isLoading: branchesLoading } = useGetActiveBranchListDataQuery("");

    // If not superadmin, automatically filter by user's branch
    const branchFilter = isSuperAdmin
        ? selectedBranches
        : user?.branchId
            ? [user.branchId.toString()]
            : [];

    return (
        <div className="pb-16">
            {selectedReportType === "tradesheet" && (
                <TradesheetReport
                    branchIds={branchFilter}
                    reportTypes={reportTypes}
                    selectedReportType={selectedReportType}
                    onReportTypeChange={setSelectedReportType}
                />
            )}
            {selectedReportType === "expense" && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
                        <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Expense Report</h1>
                        <div className="flex-1" />
                        <span className="text-xs text-gray-500 whitespace-nowrap">Report:</span>
                        <Select value={selectedReportType} onChange={setSelectedReportType} style={{ width: 180 }} options={reportTypes} size="small" />
                    </div>
                    <div className="p-4"><ExpenseReport branchIds={branchFilter} /></div>
                </div>
            )}
            {selectedReportType === "branch" && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
                        <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Branch Report</h1>
                        <div className="flex-1" />
                        <span className="text-xs text-gray-500 whitespace-nowrap">Report:</span>
                        <Select value={selectedReportType} onChange={setSelectedReportType} style={{ width: 180 }} options={reportTypes} size="small" />
                    </div>
                    <div className="p-4"><BranchReport branchIds={branchFilter} /></div>
                </div>
            )}
            {selectedReportType === "agent" && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
                        <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Agent Report</h1>
                        <div className="flex-1" />
                        <span className="text-xs text-gray-500 whitespace-nowrap">Report:</span>
                        <Select value={selectedReportType} onChange={setSelectedReportType} style={{ width: 180 }} options={reportTypes} size="small" />
                    </div>
                    <div className="p-4"><AgentReport branchIds={branchFilter} /></div>
                </div>
            )}
            {selectedReportType === "user" && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
                        <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">User Report</h1>
                        <div className="flex-1" />
                        <span className="text-xs text-gray-500 whitespace-nowrap">Report:</span>
                        <Select value={selectedReportType} onChange={setSelectedReportType} style={{ width: 180 }} options={reportTypes} size="small" />
                    </div>
                    <div className="p-4"><UserReport branchIds={branchFilter} /></div>
                </div>
            )}
        </div>
    );
}
