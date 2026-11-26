// components/GlobalSearch.tsx
import { useState, useEffect } from 'react';
import { SearchOutlined, CloseOutlined, FileOutlined, FolderFilled, UserOutlined } from '@ant-design/icons';
import { Input, List, Modal, Spin, Empty, Typography } from 'antd';
import { useSearchNodesQuery } from '../redux/api/common/fileManagerSlice';
import type { FileNode } from '../redux/api/common/fileManagerSlice';

const { Text } = Typography;

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (node: FileNode) => void;
  onNavigateToFolder: (folderId: number | null, folderName: string, isShared: boolean) => void;
  onViewFile: (node: FileNode) => void;
  currentUser: any; // Pass the current user object
}

const GlobalSearch = ({ 
  isOpen, 
  onClose, 
  onNavigate, 
  onNavigateToFolder,
  onViewFile,
  currentUser 
}: GlobalSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  const { data: searchResults, isLoading: isSearching } = useSearchNodesQuery(
    { query: debouncedQuery },
    { skip: !debouncedQuery || debouncedQuery.length < 2 }
  );

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const handleResultClick = (node: FileNode & { parent?: { name: string }, sharedBy?: string }) => {
    if (node.isFolder) {
      // For folders, navigate directly
      onNavigate(node);
    } else {
      // For files: determine if it's shared or owned by current user
      const isSharedFile = node.ownerId !== currentUser?.id;
      
      if (node.parentId) {
        // Navigate to the parent folder first
        onNavigateToFolder(node.parentId, node.parent?.name || 'Folder', isSharedFile);
        
        // Use a small delay to ensure navigation completes before viewing
        setTimeout(() => {
          onViewFile(node);
        }, 100);
      } else {
        // File is in root - navigate to root first
        onNavigateToFolder(null, 'Root', isSharedFile);
        
        // Use a small delay to ensure navigation completes before viewing
        setTimeout(() => {
          onViewFile(node);
        }, 100);
      }
    }
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0 || !bytes) return '-';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    if (i === 0) return `${bytes} ${sizes[i]}`;
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getLocationText = (node: FileNode & { parent?: { name: string }, sharedBy?: string }) => {
    if (node.parentId && node.parent?.name) {
      return `📁 ${node.parent.name}`;
    } else if (node.parentId) {
      return '📁 Folder';
    } else {
      return '📁 Root';
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SearchOutlined />
          <span>Search Files and Folders</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={600}
      style={{ top: 100 }}
      afterClose={() => setSearchQuery('')}
    >
      <Input
        placeholder="Search by name or type..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        prefix={<SearchOutlined />}
        suffix={
          searchQuery && (
            <CloseOutlined
              onClick={() => setSearchQuery('')}
              style={{ cursor: 'pointer', color: '#999' }}
            />
          )
        }
        size="large"
        autoFocus
      />

      <div style={{ marginTop: 16, maxHeight: 400, overflow: 'auto' }}>
        {isSearching ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : searchResults?.data && searchResults.data.length === 0 && debouncedQuery.length >= 2 ? (
          <Empty
            description={
              <div>
                <div>No results found for "{debouncedQuery}"</div>
                <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                  Try different keywords or check your spelling
                </Text>
              </div>
            }
          />
        ) : searchResults?.data && searchResults.data.length > 0 ? (
          <List
            dataSource={searchResults.data}
            renderItem={(node: FileNode & { parent?: { name: string }, sharedBy?: string }) => (
              <List.Item
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                }}
                onClick={() => handleResultClick(node)}
                className="search-result-item"
              >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <div style={{ marginRight: 12, fontSize: 20 }}>
                    {node.isFolder ? (
                      <FolderFilled style={{ color: '#0d9488' }} />
                    ) : (
                      <FileOutlined />
                    )}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>
                      {node.name}
                    </div>
                    
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {node.isFolder ? 'Folder' : node.mimeType || 'File'}
                      {node.size && !node.isFolder && ` • ${formatFileSize(node.size)}`}
                    </div>
                    
                    <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                      {getLocationText(node)}
                      {node.sharedBy && ` • Shared by ${node.sharedBy}`}
                      {!node.sharedBy && node.ownerId !== currentUser?.id && ' • Shared'}
                    </div>
                  </div>
                  
                  {(node.sharedBy || node.ownerId !== currentUser?.id) && (
                    <UserOutlined style={{ color: '#1890ff', marginLeft: 8 }} />
                  )}
                  
                  {!node.isFolder && (
                    <span style={{ fontSize: 12, color: '#1890ff', marginLeft: 8 }}>
                      👁️ View
                    </span>
                  )}
                </div>
              </List.Item>
            )}
          />
        ) : null}
      </div>

      {debouncedQuery.length > 0 && searchResults?.data && searchResults.data.length > 0 && (
        <div style={{ 
          padding: '8px 16px', 
          backgroundColor: '#f9f9f9', 
          borderTop: '1px solid #f0f0f0',
          fontSize: 12,
          color: '#666'
        }}>
          {searchResults.data.length} result{searchResults.data.length !== 1 ? 's' : ''} found
        </div>
      )}

      <style>
        {`
          .search-result-item:hover {
            background-color: #f5f5f5;
          }
        `}
      </style>
    </Modal>
  );
};

export default GlobalSearch;