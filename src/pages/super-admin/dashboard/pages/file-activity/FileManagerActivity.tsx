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
  useGetFileManagerActivityLogsQuery,
} from '../../../../../redux/api/superadmin/fileActivitySlice';

interface FileActivityLog {
  id: number;
  uuid: string;
  userId: number;
  filePath: string | null;
  uploadFileName: string;
  operation: 'upload_file' | 'delete_file' | 'replace_file' | 'create_folder' | 'rename' | 'move_file' | 'share_file' | 'download';
  relatedTable: string;
  oldFilePath: string | null;
  newFilePath: string | null;
  status: 'success' | 'error';
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface FileActivitySummary {
  totalLogs: number;
  uploads: number;
  deletes: number;
  replaces: number;
  creates: number;
  renames: number;
  moves: number;
  downloads: number;
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

  // Get File Manager Activity Logs
  const {
    data: fileActivityData,
    isLoading,
    refetch,
  } = useGetFileManagerActivityLogsQuery({
    page: 1, // Always fetch all data for frontend pagination
    search: "", // No backend search, we'll handle it in frontend
  });

  const fileActivityResponse = fileActivityData as FileActivityResponse;
  const allLogs = useMemo(() => fileActivityResponse?.data || [], [fileActivityResponse?.data]);
  const summary = fileActivityResponse?.summary;

  // Filter data based on search text and selected operation
  const filteredData = useMemo(() => {
    let filtered = allLogs;

    // Filter by search text
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter((log) => {
        return (
          log.uploadFileName?.toLowerCase().includes(searchLower) ||
          log.user?.name?.toLowerCase().includes(searchLower) ||
          log.operation?.toLowerCase().includes(searchLower) ||
          log.status?.toLowerCase().includes(searchLower) ||
          log.relatedTable?.toLowerCase().includes(searchLower) ||
          format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm').toLowerCase().includes(searchLower)
        );
      });
    }

    // Filter by selected operation
    if (selectedOperation) {
      filtered = filtered.filter((log) => log.operation === selectedOperation);
    }

    return filtered;
  }, [allLogs, searchText, selectedOperation]);

  // Calculate pagination for filtered data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * 20;
    const endIndex = startIndex + 20;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage]);

  // Use API summary data, but update total logs based on filtered data
  const filteredSummary = useMemo(() => {
    if (!summary) return null;
    
    return {
      ...summary,
      totalLogs: filteredData.length
    };
  }, [summary, filteredData.length]);

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
    
    // Refetch data on every page load
    refetch();
  }, [refetch]);

  // Reset to first page when search or operation filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, selectedOperation]);

  // Ensure current page doesn't exceed maximum when data changes
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
    const colorMap: Record<string, string> = {
      upload_file: 'green',
      delete_file: 'red',
      replace_file: 'blue',
      create_folder: 'cyan',
      rename: 'orange',
      move_file: 'purple',
      share_file: 'magenta',
      download: 'gold',
    };
    
    // Format the operation name for display
    const formatOperationName = (op: string) => {
      return op
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
    
    return (
      <Tag color={colorMap[operation] || 'default'}>
        {formatOperationName(operation)}
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
      title: "#",
      key: "serial",
      width: 80,
      render: (_, __, index) => (currentPage - 1) * 10 + index + 1,
    },
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      width: 150,
      render: (user) => user?.name || '',
    },
    {
      title: "File/Folder Name",
      dataIndex: "uploadFileName",
      key: "uploadFileName",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Operation",
      dataIndex: "operation",
      key: "operation",
      width: 150,
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
      title: "File Path",
      dataIndex: "filePath",
      key: "filePath",
      width: 150,
      render: (filePath) => filePath || '',
      ellipsis: true,
    },
    {
      title: "Old Path",
      dataIndex: "oldFilePath",
      key: "oldFilePath",
      width: 150,
      render: (oldFilePath) => oldFilePath || '',
      ellipsis: true,
    },
    {
      title: "New Path",
      dataIndex: "newFilePath",
      key: "newFilePath",
      width: 150,
      render: (newFilePath) => newFilePath || '',
      ellipsis: true,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date) => moment(date).format("D MMMM YYYY [at] h:mm A"),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ];

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">File Manager Syslog</h1>
          {filteredSummary && (
            <>
              <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
              <button
                onClick={() => setSelectedOperation(null)}
                className={`flex-shrink-0 flex items-center gap-1 rounded px-2 py-1 transition-all ${selectedOperation === null ? 'ring-1 ring-[#0f766e]' : ''}`}
                style={{ borderLeft: "2px solid #0f766e", background: "#f9f6f3" }}
              >
                <span className="text-xs text-gray-500 whitespace-nowrap">Total:</span>
                <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "#0f766e" }}>{allLogs.length}</span>
              </button>
              <button
                onClick={() => setSelectedOperation(selectedOperation === 'upload_file' ? null : 'upload_file')}
                className={`flex-shrink-0 flex items-center gap-1 rounded px-2 py-1 transition-all ${selectedOperation === 'upload_file' ? 'ring-1 ring-green-500' : ''}`}
                style={{ borderLeft: "2px solid #22c55e", background: "#f0fdf4" }}
              >
                <span className="text-xs text-gray-500 whitespace-nowrap">Uploads:</span>
                <span className="text-xs font-semibold text-green-600 whitespace-nowrap">{filteredSummary.uploads}</span>
              </button>
              <button
                onClick={() => setSelectedOperation(selectedOperation === 'delete_file' ? null : 'delete_file')}
                className={`flex-shrink-0 flex items-center gap-1 rounded px-2 py-1 transition-all ${selectedOperation === 'delete_file' ? 'ring-1 ring-red-500' : ''}`}
                style={{ borderLeft: "2px solid #ef4444", background: "#fef2f2" }}
              >
                <span className="text-xs text-gray-500 whitespace-nowrap">Deletes:</span>
                <span className="text-xs font-semibold text-red-600 whitespace-nowrap">{filteredSummary.deletes}</span>
              </button>
              <button
                onClick={() => setSelectedOperation(selectedOperation === 'create_folder' ? null : 'create_folder')}
                className={`flex-shrink-0 flex items-center gap-1 rounded px-2 py-1 transition-all ${selectedOperation === 'create_folder' ? 'ring-1 ring-cyan-500' : ''}`}
                style={{ borderLeft: "2px solid #06b6d4", background: "#ecfeff" }}
              >
                <span className="text-xs text-gray-500 whitespace-nowrap">Creates:</span>
                <span className="text-xs font-semibold text-cyan-600 whitespace-nowrap">{filteredSummary.creates}</span>
              </button>
              <button
                onClick={() => setSelectedOperation(selectedOperation === 'move_file' ? null : 'move_file')}
                className={`flex-shrink-0 flex items-center gap-1 rounded px-2 py-1 transition-all ${selectedOperation === 'move_file' ? 'ring-1 ring-teal-500' : ''}`}
                style={{ borderLeft: "2px solid #a855f7", background: "#faf5ff" }}
              >
                <span className="text-xs text-gray-500 whitespace-nowrap">Moves:</span>
                <span className="text-xs font-semibold text-teal-600 whitespace-nowrap">{filteredSummary.moves}</span>
              </button>
              <button
                onClick={() => setSelectedOperation(selectedOperation === 'share_file' ? null : 'share_file')}
                className={`flex-shrink-0 flex items-center gap-1 rounded px-2 py-1 transition-all ${selectedOperation === 'share_file' ? 'ring-1 ring-pink-500' : ''}`}
                style={{ borderLeft: "2px solid #ec4899", background: "#fdf2f8" }}
              >
                <span className="text-xs text-gray-500 whitespace-nowrap">Shares:</span>
                <span className="text-xs font-semibold text-pink-600 whitespace-nowrap">{filteredSummary.totalLogs}</span>
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
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FileActivity;