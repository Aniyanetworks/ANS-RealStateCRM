// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import {
    ReloadOutlined,
    EyeOutlined
} from '@ant-design/icons';
import {
    Button,
    Modal,
    Spin,
    Table,
    Tag
} from 'antd';
import { FaSearch, FaTimes } from 'react-icons/fa';
import type { ColumnsType } from 'antd/es/table';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetAllLeadsQuery } from '../../../../../redux/api/superadmin/leadManagementSlice';

interface Lead {
    id: number;
    uuid: string;
    campaignId: number;
    leadDate: string;
    platform: string;
    name: string;
    phone: string;
    email: string;
    status: string;
    agentAssigned: number | null;
    createdAt: string;
    updatedAt: string;
    campaign: {
        id: number;
        uuid: string;
        slug: string;
        name: string;
        status: string;
    } | null;
    agent: {
        user: {
            id: number;
            name: string;
        };
    } | null;
}

interface LeadsResponse {
    status: boolean;
    data: {
        leads: Lead[];
        total?: number;
    };
}

const LeadsManagementPage: React.FC = () => {
    const [searchText, setSearchText] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
    });

    const { data, error, isLoading, refetch } = useGetAllLeadsQuery(undefined);
    const leads: Lead[] = data?.data?.leads || [];

    const handleSearch = (value: string) => {
        setSearchText(value);
    };

    const handleResetFilters = () => {
        setSearchText('');
        setStatusFilter('all');
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch =
            !searchText ||
            (lead.name && lead.name.toLowerCase().includes(searchText.toLowerCase())) ||
            (lead.email && lead.email.toLowerCase().includes(searchText.toLowerCase())) ||
            (lead.phone && lead.phone.includes(searchText)) ||
            (lead.campaign?.name && lead.campaign.name.toLowerCase().includes(searchText.toLowerCase()));

        const matchesStatus =
            statusFilter === 'all' ||
            lead.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const navigate = useNavigate();



    const columns: ColumnsType<Lead> = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => text || 'N/A',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (text, record) => text || 'N/A',
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            render: (text, record) => text || 'N/A',
        },
        {
            title: 'Campaign Name',
            dataIndex: ['campaign', 'name'],
            key: 'campaign',
            render: (text, record) => record.campaign?.name || 'N/A',
        },
        {
            title: 'Platform',
            dataIndex: 'platform',
            key: 'platform',
            render: (text, record) => text || 'N/A',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'default';
                if (status === 'New') color = 'blue';
                if (status === 'No Response') color = 'orange';
                if (status === 'Responded') color = 'green';
                if (status === 'Qualified') color = 'purple';
                if (status === 'Not Qualified') color = 'red';
                if (status === 'Active') color = 'green';
                if (status === 'Lost') color = 'red';
                if (status === 'Closed') color = 'gray';

                return (
                    <Tag color={color} key={status}>
                        {status || 'N/A'}
                    </Tag>
                );
            },
            filters: [
                { text: 'New', value: 'New' },
                { text: 'No Response', value: 'No Response' },
                { text: 'Responded', value: 'Responded' },
                { text: 'Qualified', value: 'Qualified' },
                { text: 'Not Qualified', value: 'Not Qualified' },
                { text: 'Active', value: 'Active' },
                { text: 'Lost', value: 'Lost' },
                { text: 'Closed', value: 'Closed' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Lead Date',
            dataIndex: 'leadDate',
            key: 'leadDate',
            render: (text, record) => {
                if (!text) return 'N/A';
                return new Date(text).toLocaleDateString();
            },
        },
        {
            title: 'Assigned Agent',
            dataIndex: ['agent', 'user', 'name'],
            key: 'agent',
            render: (text, record) => record.agent?.user?.name || 'Unassigned',
        },
    ];


    const navigateToCampaignLeads = (campaignUuid: string | undefined, leadName: string = '') => {
        if (campaignUuid) {
            const params = new URLSearchParams();
            if (leadName) {
                params.set('search', leadName);
            }

            navigate(`/dashboard/super-admin/leads/view/${campaignUuid}?${params.toString()}`);
        }
    };

    const handleRowClick = (record: Lead) => {
        return {
            onClick: () => {
                navigateToCampaignLeads(record.campaign?.uuid, record.name);
            },
            style: {
                cursor: 'pointer',
            },
        };
    };
    const handlePaginationChange = (page: number, pageSize?: number) => {
        const newPageSize = pageSize || pagination.pageSize;
        setPagination({
            current: page,
            pageSize: newPageSize
        });
    };

    return (
        <div className="pb-16">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
                    <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">
                        All Leads
                        <span className="ml-1 text-gray-400 font-normal text-[11px]">({filteredLeads.length})</span>
                        {isLoading && <Spin size="small" className="ml-2" />}
                    </h1>
                    <div className="flex-1" />
                    <div className="relative flex-shrink-0" style={{ width: 170 }}>
                        <FaSearch className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: 10, left: 8 }} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchText}
                            onChange={e => handleSearch(e.target.value)}
                            style={{ paddingLeft: 26, paddingRight: searchText ? 22 : 8, paddingTop: 4, paddingBottom: 4, width: "100%" }}
                        />
                        {searchText && (
                            <button type="button" onClick={handleResetFilters} className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" style={{ right: 6 }}>
                                <FaTimes />
                            </button>
                        )}
                    </div>
                    <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={refetch} className="primary-btn flex items-center gap-1">
                            <ReloadOutlined /> Refresh
                        </button>
                    </div>
                </div>

                {error ? (
                    <div className="text-center py-10">
                        <p className="text-red-500">Failed to load leads. Please try again.</p>
                        <Button className="mt-4" onClick={refetch}>Retry</Button>
                    </div>
                ) : (
                    <Table
                        columns={columns}
                        dataSource={filteredLeads}
                        rowKey="id"
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: filteredLeads.length,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} of ${total} items`,
                        }}
                        onChange={(pagination) => {
                            if (pagination.current) {
                                handlePaginationChange(pagination.current, pagination.pageSize);
                            }
                        }}
                        scroll={{ x: 1000 }}
                        loading={isLoading}
                        onRow={handleRowClick}
                    />
                )}
            </div>
        </div>
    );
};

export default LeadsManagementPage;