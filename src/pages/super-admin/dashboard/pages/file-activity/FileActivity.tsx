// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import {
  useEffect,
  useState,
  useMemo,
} from 'react';
import moment from 'moment';
import type {
  TableColumnsType,
  TablePaginationConfig,
} from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import {
  Badge,
  Card,
  Col,
  Row,
  Space,
  Table,
  Tag,
} from 'antd';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { format } from 'date-fns';

import TableLoader from '../../../../../components/loader/TableLoader';
import {
  useGetFileActivityLogsQuery,
} from '../../../../../redux/api/superadmin/fileActivitySlice';

interface FileActivityLog {
  id: number;
  userId: number;
  filePath: string;
  uploadFileName: string;
  operation: 'upload' | 'delete' | 'replace';
  relatedTable: string;
  oldFilePath: string | null;
  newFilePath: string | null;
  status: 'success' | 'error';
  errorMessage: string | null;
  tradeId: number;
  propertyMlsNumber: string;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
  };
  tradeSheet: {
    tradeSheetTypeId: string;
  };
}

interface FileActivitySummary {
  totalLogs: number;
  uploads: number;
  deletes: number;
  replaces: number;
}

interface FileActivityResponse {
  status: boolean;
  message: string;
  data: FileActivityLog[];
  summary: FileActivitySummary;
}

const FileActivity: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);

  const {
    data: fileActivityData,
    isLoading,
    refetch,
  } = useGetFileActivityLogsQuery({
    page: 1,
    search: "",
  });


  const fileActivityResponse = fileActivityData as FileActivityResponse;
  const allLogs = useMemo(() => fileActivityResponse?.data || [], [fileActivityResponse?.data]);
  const summary = fileActivityResponse?.summary;

  const filteredData = useMemo(() => {
    let filtered = allLogs;

    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter((log) => {
        return (
          log.uploadFileName?.toLowerCase().includes(searchLower) ||
          log.user?.name?.toLowerCase().includes(searchLower) ||
          log.operation?.toLowerCase().includes(searchLower) ||
          log.status?.toLowerCase().includes(searchLower) ||
          log.propertyMlsNumber?.toLowerCase().includes(searchLower) ||
          log.relatedTable?.toLowerCase().includes(searchLower) ||
          log.tradeSheet?.tradeSheetTypeId?.toLowerCase().includes(searchLower) ||
          format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm').toLowerCase().includes(searchLower)
        );
      });
    }

    if (selectedOperation) {
      filtered = filtered.filter((log) => log.operation === selectedOperation);
    }

    return filtered;
  }, [allLogs, searchText, selectedOperation]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * 20;
    const endIndex = startIndex + 20;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage]);

  const filteredSummary = useMemo(() => {
    if (!summary) return null;
    
    return {
      ...summary
    };
  }, [summary]);

  useEffect(() => {
    const savedSearchText = localStorage.getItem("searchTextFileActivity");
    if (savedSearchText) {
      setSearchText(savedSearchText);
    }
    
    const savedCurrentPage = localStorage.getItem("fileActivityCurentPage");
    if (savedCurrentPage) {
      const page = parseInt(savedCurrentPage);
      if (!isNaN(page) && page > 0) {
        setCurrentPage(page);
      }
    }
    
    refetch();
  }, [refetch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, selectedOperation]);

  useEffect(() => {
    const maxPage = Math.ceil(filteredData.length / 10);
    if (currentPage > maxPage && maxPage > 0) {
      setCurrentPage(maxPage);
    }
  }, [filteredData.length, currentPage]);

  const handleChange = (pagination: TablePaginationConfig) => {
    localStorage.setItem("fileActivityCurentPage", pagination?.current?.toString() || "1");
    setCurrentPage(pagination?.current || 1);
  };

  

  const getOperationTag = (operation: string) => {
    const colorMap = {
      upload: 'green',
      delete: 'red',
      replace: 'blue',
    };
    return (
      <Tag color={colorMap[operation as keyof typeof colorMap]}>
        {operation.toUpperCase()}
      </Tag>
    );
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge
        status={status === 'success' ? 'success' : 'error'}
        text={status === 'success' ? 'Success' : 'Error'}
      />
    );
  };

  const columns: TableColumnsType<FileActivityLog> = [
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      width: 150,
      render: (user) => user?.name || 'N/A',
    },
    {
      title: "File/Form Name",
      dataIndex: "uploadFileName",
      key: "uploadFileName",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Operation",
      dataIndex: "operation",
      key: "operation",
      width: 120,
      render: (operation) => (
        <Space>
          {getOperationTag(operation)}
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => getStatusBadge(status),
    },
    {
      title: "Trade Sheet ID",
      dataIndex: "tradeSheet",
      key: "tradeSheetId",
      width: 150,
      render: (tradeSheet) => tradeSheet?.tradeSheetTypeId || 'N/A',
    },
    {
      title: "Property Listing ID",
      dataIndex: "propertyListingTypeId",
      key: "propertyListingTypeId",
      width: 120,
    },
    {
      title: "Related Table",
      dataIndex: "relatedTable",
      key: "relatedTable",
      width: 150,
      ellipsis: true,
    },
    {
  title: "File Path",
  dataIndex: "filePath",
  key: "filePath",
  width: 50,
  ellipsis: true,
  render: (filePath: string) =>
    filePath ? (
      <div style={{ textAlign: "center" }}>
        <a href={filePath} target="_blank" rel="noopener noreferrer" className='hover:underline text-blue-600'>
          <LinkOutlined style={{ fontSize: "20px" }} />
        </a>
      </div>
    ) : (
      <div style={{ textAlign: "center" }}>N/A</div>
    ),
},

    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (createdAt) => moment(createdAt).format("D MMMM YYYY [at] h:mm A"),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ];

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Trade Documents Syslog</h1>
          {filteredSummary && (
            <>
              <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
              <button
                onClick={() => setSelectedOperation(null)}
                className={`flex-shrink-0 flex items-center gap-1 rounded px-2 py-1 transition-all ${selectedOperation === null ? 'ring-1 ring-[#0f766e]' : ''}`}
                style={{ borderLeft: "2px solid #0f766e", background: "#f9f6f3" }}
              >
                <span className="text-xs text-gray-500 whitespace-nowrap">Total:</span>
                <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "#0f766e" }}>{filteredSummary.totalLogs}</span>
              </button>
              <button
                onClick={() => setSelectedOperation(selectedOperation === 'upload' ? null : 'upload')}
                className={`flex-shrink-0 flex items-center gap-1 rounded px-2 py-1 transition-all ${selectedOperation === 'upload' ? 'ring-1 ring-green-500' : ''}`}
                style={{ borderLeft: "2px solid #039855", background: "#f0fdf4" }}
              >
                <span className="text-xs text-gray-500 whitespace-nowrap">Uploads:</span>
                <span className="text-xs font-semibold text-green-600 whitespace-nowrap">{filteredSummary.uploads}</span>
              </button>
              <button
                onClick={() => setSelectedOperation(selectedOperation === 'delete' ? null : 'delete')}
                className={`flex-shrink-0 flex items-center gap-1 rounded px-2 py-1 transition-all ${selectedOperation === 'delete' ? 'ring-1 ring-red-500' : ''}`}
                style={{ borderLeft: "2px solid #d92d20", background: "#fef2f2" }}
              >
                <span className="text-xs text-gray-500 whitespace-nowrap">Deletes:</span>
                <span className="text-xs font-semibold text-red-600 whitespace-nowrap">{filteredSummary.deletes}</span>
              </button>
              <button
                onClick={() => setSelectedOperation(selectedOperation === 'replace' ? null : 'replace')}
                className={`flex-shrink-0 flex items-center gap-1 rounded px-2 py-1 transition-all ${selectedOperation === 'replace' ? 'ring-1 ring-blue-500' : ''}`}
                style={{ borderLeft: "2px solid #3b82f6", background: "#eff6ff" }}
              >
                <span className="text-xs text-gray-500 whitespace-nowrap">Replaces:</span>
                <span className="text-xs font-semibold text-blue-600 whitespace-nowrap">{filteredSummary.replaces}</span>
              </button>
            </>
          )}
          <div className="flex-1" />
          <div className="relative flex-shrink-0" style={{ width: 170 }}>
            <FaSearch className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: 10, left: 8 }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => {
                const newValue = e.target.value;
                setSearchText(newValue);
                localStorage.setItem("searchTextFileActivity", newValue);
              }}
              style={{ paddingLeft: 26, paddingRight: searchText ? 22 : 8, paddingTop: 4, paddingBottom: 4, width: "100%" }}
            />
            {searchText && (
              <button type="button" onClick={() => { setSearchText(""); localStorage.removeItem("searchTextFileActivity"); }} className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" style={{ right: 6 }}>
                <FaTimes style={{ fontSize: 10 }} />
              </button>
            )}
          </div>
        </div>

        <div>
          {isLoading ? (
            <TableLoader />
          ) : (
            <Table
              rowKey="id"
              scroll={{ x: "max-content" }}
              columns={columns}
              dataSource={paginatedData}
              onChange={handleChange}
              pagination={{
                pageSize: 20,
                current: currentPage,
                total: filteredData.length,
                showSizeChanger: false,
                showQuickJumper: false,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FileActivity; 