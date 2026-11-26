// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useEffect, useMemo, useState } from "react";
import { Card, Empty, Input, Modal, Space, Table, Upload, message, Breadcrumb, Select, Dropdown } from "antd";
import type { MenuProps } from "antd";
import toast from 'react-hot-toast';
import type { TableColumnsType, UploadProps } from "antd";
import { FolderAddOutlined, UploadOutlined, DeleteOutlined, ShareAltOutlined, DownloadOutlined, ArrowUpOutlined, EyeOutlined, AppstoreOutlined, BarsOutlined, SortAscendingOutlined, SortDescendingOutlined, FileOutlined, FolderFilled, MoreOutlined, EditOutlined, SearchOutlined  } from "@ant-design/icons";
import {
  useListNodesQuery,
  useCreateFolderMutation,
  useUploadFileMutation,
  useDeleteNodeMutation,
  useDeleteMultipleNodesMutation,
  useMoveNodeMutation,
  useMoveMultipleNodesMutation,
  useShareWithMultipleUsersMutation,
  useShareSingleNodeWithMultipleUsersMutation,
  useShareMultipleNodesMutation,
  useGetDownloadUrlMutation,
  useSharedWithMeQuery,
  useSharedChildrenQuery,
  useGetAllFoldersQuery,
  useRenameNodeMutation 
} from "../../redux/api/common/fileManagerSlice";
import GlobalSearch from '../../components/GlobalSearch';
import type { FileNode } from "../../redux/api/common/fileManagerSlice";
import { useGetUserListDataQuery } from "../../redux/api/superadmin/user/userManageSlice";
import { useAppSelector } from "../../redux/hooks";
import { usePermissions } from "../../utils/permissionUtils";

type SharePermission = "view" | "download" | "delete" | "share";

type UserOption = { label: string; value: number };


const FileManager = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [parentIdStack, setParentIdStack] = useState<Array<number | null>>([null]);
  const currentParentId = parentIdStack[parentIdStack.length - 1];

  const [showShared, setShowShared] = useState(false);
   const { user } = useAppSelector((state) => state.user);

  const { data, isLoading, refetch } = useListNodesQuery({ parentId: currentParentId ,userId: user?.id || ""},{
    skip: !user?.id,
  });
  const { data: allFolders, isLoading: allFoldersLoading, refetch: refetchAllFolders } = useGetAllFoldersQuery({userId: user?.id || ""},{
    skip: !user?.id,
  });
  const { data: sharedData, isLoading: sharedLoading } = useSharedWithMeQuery();
  const { data: sharedChildrenData, isLoading: sharedChildrenLoading } = useSharedChildrenQuery(
    { parentId: currentParentId ?? 0 }, 
    { skip: !showShared || (showShared && currentParentId === null) }
  );
  const [createFolder, { isLoading: creating }] = useCreateFolderMutation();
  const [uploadFile, { isLoading: uploading }] = useUploadFileMutation();
  const [deleteNode, { isLoading: deleting }] = useDeleteNodeMutation();
  const [deleteMultipleNodes, { isLoading: deletingMultiple }] = useDeleteMultipleNodesMutation();
  const [moveNode, { isLoading: moving }] = useMoveNodeMutation();
  const [moveMultipleNodes, { isLoading: movingMultiple }] = useMoveMultipleNodesMutation();
  const [shareWithMultipleUsers, { isLoading: sharing }] = useShareWithMultipleUsersMutation();
  const [shareSingleNodeWithMultipleUsers, { isLoading: sharingSingle }] = useShareSingleNodeWithMultipleUsersMutation();
  const [shareMultipleNodes, { isLoading: sharingMultiple }] = useShareMultipleNodesMutation();
  const [getDownloadUrl] = useGetDownloadUrlMutation();
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameTargetNode, setRenameTargetNode] = useState<{ id: number; name: string; isFolder: boolean } | null>(null);
  const [newName, setNewName] = useState("");

  const [renameNode, { isLoading: renaming }] = useRenameNodeMutation();

  const openRenameModal = (node: { id: number; name: string; isFolder: boolean }) => {
  setRenameTargetNode(node);
  setNewName(node.name);
  setIsRenameModalOpen(true);
};

const renderToolbar = () => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
    <select
      value={typeFilter}
      onChange={(e) => setTypeFilter(e.target.value as "all" | "folders" | "files")}
      className="base-input"
      style={{ width: 150 }}
    >
      <option value="all">All items</option>
      <option value="folders">Folders</option>
      <option value="files">Files</option>
    </select>
    
    <select
      value={sortField}
      onChange={(e) => setSortField(e.target.value as "name" | "type" | "size")}
      className="base-input"
      style={{ width: 150 }}
    >
      <option value="name">Sort by name</option>
      <option value="type">Sort by type</option>
      <option value="size">Sort by size</option>
    </select>
    
    <button
      className="primary-btn-ghost"
      onClick={() => setSortOrder(o => (o === "asc" ? "desc" : "asc"))}
      title={`Toggle sort order (${sortOrder})`}
    >
      {sortOrder === "asc" ? <SortAscendingOutlined /> : <SortDescendingOutlined />} {sortOrder === "asc" ? "Asc" : "Desc"}
    </button>
    
    
    <button
      className="primary-btn-ghost"
      onClick={() => setIsSearchOpen(true)}
      title="Global search (Ctrl+K)"
    >
      <SearchOutlined /> Global Search
    </button>
    
    <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
      <button
        className={viewMode === "list" ? "primary-btn" : "primary-btn-ghost"}
        onClick={() => setViewMode("list")}
        title="List view"
      >
        <BarsOutlined />
      </button>
      <button
        className={viewMode === "grid" ? "primary-btn" : "primary-btn-ghost"}
        onClick={() => setViewMode("grid")}
        title="Grid view"
      >
        <AppstoreOutlined />
      </button>
    </div>
  </div>
);

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setIsSearchOpen(true);
    }
    if (e.key === 'Escape' && isSearchOpen) {
      setIsSearchOpen(false);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isSearchOpen]);


const handleSearchNavigate = (node: FileNode & { parent?: any }) => {
  if (node.isFolder) {
    if (node.ownerId === user?.id) {
      setShowShared(false);
      setParentIdStack([null, node.id]);
      setIdToName(prev => ({ ...prev, [node.id]: node.name }));
    } else {
      setShowShared(true);
      setParentIdStack([null, node.id]);
      setSharedFolderHierarchy([{ id: node.id, name: node.name }]);
    }
  } else {
    if (node.mimeType?.startsWith('image/') || node.mimeType === 'application/pdf') {
      handleView(node);
    } else {
      handleDownload(node);
    }
  }
};

const handleNavigateToFolder = (folderId: number | null, folderName: string, isShared: boolean) => {
  if (isShared) {
    setShowShared(true);
    if (folderId) {
      setParentIdStack([null, folderId]);
      setSharedFolderHierarchy([{ id: folderId, name: folderName }]);
    } else {
      setParentIdStack([null]);
      setSharedFolderHierarchy([]);
    }
  } else {
    setShowShared(false);
    if (folderId) {
      setParentIdStack([null, folderId]);
      setIdToName(prev => ({ ...prev, [folderId]: folderName }));
    } else {
      setParentIdStack([null]);
    }
  }
};

const handleViewFile = (node: FileNode) => {
  handleView(node);
};

const handleRenameConfirm = async () => {
  if (!renameTargetNode || !newName.trim()) {
    message.error("Please enter a valid name");
    return;
  }

  if (newName.trim() === renameTargetNode.name) {
    setIsRenameModalOpen(false);
    return;
  }

  try {
    await renameNode({ id: renameTargetNode.id, name: newName.trim() }).unwrap();
    message.success(`"${renameTargetNode.name}" renamed to "${newName.trim()}"`);
    setIsRenameModalOpen(false);
    setRenameTargetNode(null);
    setNewName("");
    refetch();
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string };
    message.error(err?.data?.message || err?.message || "Rename failed");
  }
};

  const usingSharedRoot = showShared && parentIdStack.length === 1;
  
  const nodes: FileNode[] = useMemo(() => {
    if (usingSharedRoot) {
      return sharedData?.data ?? [];
    } else if (showShared && currentParentId !== null) {
      return sharedChildrenData?.data ?? [];
    }
    return data?.data ?? [];
  }, [usingSharedRoot, sharedData?.data, showShared, currentParentId, sharedChildrenData?.data, data?.data]);

  const isLoadingData = showShared 
    ? (usingSharedRoot ? sharedLoading : sharedChildrenLoading)
    : isLoading;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  const [isDeleteMultipleModalVisible, setIsDeleteMultipleModalVisible] = useState(false);
  const [pendingDeleteItems, setPendingDeleteItems] = useState<Set<number>>(new Set());
  const [isDeleteSingleModalVisible, setIsDeleteSingleModalVisible] = useState(false);
const [pendingSingleDeleteId, setPendingSingleDeleteId] = useState<number | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTargetNode, setShareTargetNode] = useState<{ id: number; name: string } | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Array<{ userId: number; permissions: string[] }>>([]);
  const [sharePermission, setSharePermission] = useState<SharePermission>("view");

  const [isBulkShareModalOpen, setIsBulkShareModalOpen] = useState(false);
  const [bulkShareUsers, setBulkShareUsers] = useState<Array<{ userId: number; permissions: string[] }>>([]);
  const [bulkSharePermission, setBulkSharePermission] = useState<SharePermission>("view");

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveTargetNode, setMoveTargetNode] = useState<{ id: number; name: string } | null>(null);
  const [moveTargetParentNode, setMoveTargetParentNode] = useState<{ id: number } | null>(null);
  const [moveToFolderId, setMoveToFolderId] = useState<string>("");

  const [isBulkMoveModalOpen, setIsBulkMoveModalOpen] = useState(false);
  const [bulkMoveToFolderId, setBulkMoveToFolderId] = useState<string>("");

  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());


  const [idToName, setIdToName] = useState<Record<number, string>>({});

  const [sharedFolderHierarchy, setSharedFolderHierarchy] = useState<Array<{id: number, name: string}>>([]);

  useEffect(() => {
  setSelectedItems(new Set());
}, [showShared]);

  useEffect(() => {
    if (!nodes || nodes.length === 0) return;
    setIdToName((prev) => {
      const next = { ...prev };
      for (const node of nodes) {
        if (node.isFolder && node.name && typeof node.id === "number") {
          if (next[node.id] !== node.name) {
            next[node.id] = node.name;
          }
        }
      }
      return next;
    });
  }, [nodes]);

  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "folders" | "files">("all");
  const [sortField, setSortField] = useState<"name" | "size" | "type">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewNode, setPreviewNode] = useState<FileNode | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);

  const { data: usersResp } = useGetUserListDataQuery("");
  const userOptions: UserOption[] = (usersResp?.data?.userData || [])
    .map((u: { id?: number; name?: string; fullName?: string; email?: string }) => ({
      label: `${u?.name || u?.fullName || u?.email || ""}`.trim(),
      value: Number(u?.id || 0),
    }))
    .filter((opt: UserOption) => Boolean(opt.value));

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragOver(false);
  
  if (showShared) {
    message.error("Cannot upload files to shared folders");
    return;
  }

  const files = Array.from(e.dataTransfer.files);
  if (files.length === 0) return;

  const allowedExtensions = [
    'doc', 'docx', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx',
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'
  ];
  const allowedFiles = files.filter(file => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension && allowedExtensions.includes(extension);
  });

  const rejectedFiles = files.filter(file => !allowedFiles.includes(file));

  if (rejectedFiles.length > 0) {
    message.error(`${rejectedFiles.length} file(s) rejected. Only documents (DOC, PDF, Excel, PPT) and images are allowed.`);
  }

  if (allowedFiles.length === 0) return;

  try {
    await uploadFile({ files: allowedFiles, parentId: currentParentId ?? null }).unwrap();
    message.success(`Successfully uploaded ${allowedFiles.length} file${allowedFiles.length !== 1 ? 's' : ''}`);
    refetch();
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string };
    message.error(err?.data?.message || err?.message || "Upload failed");
  }
};

  const uploadProps: UploadProps = {
  name: 'files',
  multiple: true,
  showUploadList: false,
  accept: '.doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg',
  beforeUpload: (file) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'image/svg+xml'
    ];
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = [
      'doc', 'docx', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx',
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'
    ];
    
    const isAllowed = allowedTypes.includes(file.type) || 
                     (fileExtension && allowedExtensions.includes(fileExtension));
    
    if (!isAllowed) {
      message.error(`${file.name} is not a supported file type. Only documents (DOC, PDF, Excel, PPT) and images are allowed.`);
      return Upload.LIST_IGNORE;
    }
    
    return true;
  },
  customRequest: async ({ file, onSuccess, onError }) => {
    try {
      await uploadFile({ files: [file as File], parentId: currentParentId ?? null }).unwrap();
      if (onSuccess) onSuccess("Ok");
      message.success(`${(file as File).name} uploaded successfully`);
      refetch();
    } catch (error: any) {
      if (onError) onError(error);
      message.error(error?.data?.message || error?.message || "Upload failed");
    }
  },
  disabled: uploading || showShared,
};

  const handlePermissionToggle = (permission: string, userId: number) => {
    setSelectedUsers(prev => prev.map(user => {
      if (user.userId === userId) {
        const hasPermission = user.permissions.includes(permission);
        if (hasPermission) {
          return { ...user, permissions: user.permissions.filter(p => p !== permission) };
        } else {
          return { ...user, permissions: [...user.permissions, permission] };
        }
      }
      return user;
    }));
  };

  const handleBulkPermissionToggle = (permission: string, userId: number) => {
    setBulkShareUsers(prev => prev.map(user => {
      if (user.userId === userId) {
        const hasPermission = user.permissions.includes(permission);
        if (hasPermission) {
          return { ...user, permissions: user.permissions.filter(p => p !== permission) };
        } else {
          return { ...user, permissions: [...user.permissions, permission] };
        }
      }
      return user;
    }));
  };

  const onCreateFolder = () => {
    setFolderName("");
    setIsCreateModalOpen(true);
  };

  const handleCreateFolderOk = async () => {
    if (!folderName?.trim()) {
      toast.error("Folder name is required");
      return;
    }
    try {
      await createFolder({ name: folderName.trim(), parentId: currentParentId ?? null }).unwrap();
      toast.success("Folder created");
      setIsCreateModalOpen(false);
      refetch();
    } catch (e: unknown) {
      const err = e as { data?: { message?: string }; message?: string };
      toast.error(err?.data?.message || err?.message || "Failed to create folder");
    }
  };

  const handleDelete = (id: number) => {
    setPendingSingleDeleteId(id);
    setIsDeleteSingleModalVisible(true);
  };

  const handleDeleteConfirmSingle = async () => {
    if (!pendingSingleDeleteId) return;
    
    try {
      await deleteNode({ id: pendingSingleDeleteId }).unwrap();
      toast.success("Deleted");
      setIsDeleteSingleModalVisible(false);
      setPendingSingleDeleteId(null);
      refetch();
    } catch (e: unknown) {
      const err = e as { data?: { message?: string }; message?: string };
      toast.error(err?.data?.message || err?.message || "Failed to delete");
    }
  };

  const cancelSingleDelete = () => {
    setIsDeleteSingleModalVisible(false);
    setPendingSingleDeleteId(null);
  };

  const handleBulkDelete = () => {
  if (selectedItems.size === 0) {
    toast.error("Please select items to delete");
    return;
  }
  
  setPendingDeleteItems(new Set(selectedItems));
  setIsDeleteMultipleModalVisible(true);
};

const handleDeleteConfirmMultiple = async () => {
  try {
    await deleteMultipleNodes({ nodeIds: Array.from(pendingDeleteItems) }).unwrap();
    toast.success(`Deleted ${pendingDeleteItems.size} item${pendingDeleteItems.size !== 1 ? 's' : ''}`);
    setSelectedItems(new Set());
    setIsDeleteMultipleModalVisible(false);
    refetch();
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string };
    toast.error(err?.data?.message || err?.message || "Delete failed");
  }
};

const cancelDelete = () => {
  setIsDeleteMultipleModalVisible(false);
  setPendingDeleteItems(new Set());
};

  const handleOpen = async (node: FileNode) => {
    if (!node.isFolder) return;
    
    if (showShared) {
      setIdToName((prev) => ({ ...prev, [node.id]: node.name }));
      
      const currentIndex = sharedFolderHierarchy.findIndex(f => f.id === node.id);
      if (currentIndex >= 0) {
        setSharedFolderHierarchy(prev => prev.slice(0, currentIndex + 1));
      } else {
        setSharedFolderHierarchy(prev => [...prev, { id: node.id, name: node.name }]);
      }
      
      setParentIdStack((prev) => [...prev, node.id]);
    } else {
      setIdToName((prev) => ({ ...prev, [node.id]: node.name }));
      setParentIdStack((prev) => [...prev, node.id]);
    }
  };

  const goToRoot = () => {
    setParentIdStack([null]);
    if (showShared) {
      setSharedFolderHierarchy([]);
    }
  };

  const goToBreadcrumb = (index: number) => {
    if (showShared) {
      if (index === 0) {
        setParentIdStack([null]);
        setSharedFolderHierarchy([]);
      } else {
        const folderId = sharedFolderHierarchy[index - 1]?.id;
        if (folderId) {
          setParentIdStack([null, folderId]);
          setSharedFolderHierarchy(sharedFolderHierarchy.slice(0, index));
        }
      }
    } else {
      setParentIdStack((prev) => prev.slice(0, index + 1));
    }
  };

  const goUp = () => {
    if (parentIdStack.length > 1) {
      setParentIdStack((prev) => prev.slice(0, prev.length - 1));
      if (showShared && sharedFolderHierarchy.length > 0) {
        setSharedFolderHierarchy(prev => prev.slice(0, prev.length - 1));
      }
    }
  };

  const openShareModal = (node: { id: number; name: string }) => {
    setShareTargetNode({ id: node.id, name: node.name });
    setSelectedUsers([]);
    setSharePermission("view");
    setIsShareModalOpen(true);
  };

  const openBulkShareModal = () => {
    if (selectedItems.size === 0) {
      toast.error("Please select items to share");
      return;
    }
    setBulkShareUsers([]);
    setIsBulkShareModalOpen(true);
  };


  const openMoveModal = (node: { id: number; name: string }) => {
    setMoveTargetNode({ id: node.id, name: node.name });
    setMoveTargetParentNode({ id: node.parentId });
    setMoveToFolderId("");
    setIsMoveModalOpen(true);
  };

  const openBulkMoveModal = () => {
    if (selectedItems.size === 0) {
      toast.error("Please select items to move");
      return;
    }
    setBulkMoveToFolderId("");
    setIsBulkMoveModalOpen(true);
  };

  const handleMoveConfirm = async () => {
    if (!moveTargetNode) return;
    const newParentId = moveToFolderId ? Number(moveToFolderId) : null;
    try {
      await moveNode({ nodeId: moveTargetNode.id, newParentId }).unwrap();
      toast.success("Moved successfully");
      setIsMoveModalOpen(false);
      refetch();
      refetchAllFolders();
    } catch (e: unknown) {
      const err = e as { data?: { message?: string }; message?: string };
      toast.error(err?.data?.message || err?.message || "Move failed");
    }
  };

  const handleBulkMoveConfirm = async () => {
    if (selectedItems.size === 0) return;
    const newParentId = bulkMoveToFolderId ? Number(bulkMoveToFolderId) : null;
    try {
      await moveMultipleNodes({ nodeIds: Array.from(selectedItems), newParentId }).unwrap();
      toast.success(`Moved ${selectedItems.size} item${selectedItems.size !== 1 ? 's' : ''} successfully`);
      setIsBulkMoveModalOpen(false);
      setSelectedItems(new Set());
      refetch();
    } catch (e: unknown) {
      const err = e as { data?: { message?: string }; message?: string };
      toast.error(err?.data?.message || err?.message || "Move failed");
    }
  };

  const getFolderOptions = () => {
  const folderOptions = (allFolders?.data || [])
    .filter(folder => folder.id !== moveTargetParentNode?.id)
    .map(folder => ({
      label: `📁 ${folder.name}`,
      value: folder.id,
    }));

  return [
    { label: "🏠 Root", value: "" },
    ...folderOptions,
  ];
};

const handleShareConfirm = async () => {
  if (!shareTargetNode || selectedUsers.length === 0) {
    toast.error("Please select at least one user to share with");
    return;
  }
  try {
    await shareSingleNodeWithMultipleUsers({ 
      nodeId: shareTargetNode.id, 
      users: selectedUsers 
    }).unwrap();
    const userCount = selectedUsers.length;
    const itemType = shareTargetNode.name.includes('.') ? 'file' : 'folder';
    toast.success(`Successfully shared ${itemType} "${shareTargetNode.name}" with ${userCount} user${userCount > 1 ? 's' : ''}`);
    setIsShareModalOpen(false);
    refetch();
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string };
    toast.error(err?.data?.message || err?.message || "Share failed");
  }
};

const handleBulkShareConfirm = async () => {
  if (selectedItems.size === 0 || bulkShareUsers.length === 0) {
    toast.error("Please select items and at least one user to share with");
    return;
  }
  try {
    await shareMultipleNodes({ 
      nodeIds: Array.from(selectedItems), 
      users: bulkShareUsers
    }).unwrap();
    const userCount = bulkShareUsers.length;
    toast.success(`Successfully shared ${selectedItems.size} item${selectedItems.size !== 1 ? 's' : ''} with ${userCount} user${userCount > 1 ? 's' : ''}`);
    setIsBulkShareModalOpen(false);
    setSelectedItems(new Set());
    refetch();
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; message?: string };
    toast.error(err?.data?.message || err?.message || "Share failed");
  }
};


  const handleDownload = async (node: FileNode) => {
    const res = await getDownloadUrl({ id: node.id }).unwrap();
    const url = res?.url;
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = node.name || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      const a = document.createElement("a");
      a.href = url;
      a.download = node.name || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const handleView = async (node: FileNode) => {
    const res = await getDownloadUrl({ id: node.id }).unwrap();
    const url = res?.url || null;
    setPreviewNode(node);
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = nodes.map(node => node.id);
      setSelectedItems(new Set(allIds));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (nodeId: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(nodeId);
    } else {
      newSelected.delete(nodeId);
    }
    setSelectedItems(newSelected);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0 || !bytes) return '-';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    if (i === 0) return `${bytes} ${sizes[i]}`;
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const columns: TableColumnsType<FileNode> = [
    {
    title: !showShared && (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <input
          type="checkbox"
          checked={selectedItems.size > 0 && selectedItems.size === nodes.length}
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      </div>
    ),
    dataIndex: "select",
    width: 48,
    align: "center",
    render: (_: unknown, record: FileNode) => 
      !showShared ? (
        <input
          type="checkbox"
          checked={selectedItems.has(record.id)}
          onChange={(e) => handleSelectItem(record.id, e.target.checked)}
        />
      ) : null,
  },
    {
      title: "Name",
      dataIndex: "name",
      render: (_: unknown, record: FileNode) => (
        <span 
          style={{ 
            cursor: record.isFolder ? "pointer" : "default", 
            fontWeight: record.isFolder ? 600 : 400,
            color: "inherit"
          }} 
          onClick={() => handleOpen(record)}
        >
          {record.isFolder ? "📁" : "📄"} {record.name}
        </span>
      ),
    },
    {
      title: "Type",
      render: (_: unknown, record: FileNode) => (record.isFolder ? "Folder" : record.mimeType ?? "File"),
    },
    {
      title: "Size",
      dataIndex: "size",
      render: (_: unknown, record: FileNode) => 
        (record.isFolder ? "-" : formatFileSize(record.size ?? 0)),
    },
    {
      title: "Actions",
      render: (_: unknown, record: FileNode) => {
        const items: MenuProps['items'] = [
          !record.isFolder && hasPermissionForSlug("file-manager-items-view") && (showShared && record.permissions?.includes('view') || record.ownerId === user.id) && {
            key: 'view',
            label: (
              <button className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded" onClick={() => handleView(record)}>
                <EyeOutlined /> <span>View</span>
              </button>
            )
          },
          !record.isFolder && hasPermissionForSlug("file-manager-items-download") && (showShared && record.permissions?.includes('download') || record.ownerId === user.id) && {
            key: 'download',
            label: (
              <button className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded" onClick={() => handleDownload(record)}>
                <DownloadOutlined /> <span>Download</span>
              </button>
            )
          },
          !showShared && hasPermissionForSlug("file-manager-items-move") && {
            key: 'move',
            label: (
              <button className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded" onClick={() => openMoveModal(record)}>
                <ArrowUpOutlined /> <span>Move</span>
              </button>
            )
          },
          !showShared && hasPermissionForSlug("file-manager-items-share") && {
            key: 'share',
            label: (
              <button className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded" onClick={() => openShareModal(record)}>
                <ShareAltOutlined /> <span>Share</span>
              </button>
            )
          },
          !showShared && hasPermissionForSlug("file-manager-items-delete") && {
            key: 'delete',
            label: (
              <button className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-red-500" onClick={() => handleDelete(record.id)} disabled={deleting}>
                <DeleteOutlined /> <span>Delete</span>
              </button>
            )
          },
          !showShared && hasPermissionForSlug("file-manager-items-rename") && record.isFolder && {
            key: 'rename',
            label: (
              <button className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded" onClick={() => openRenameModal(record)}>
                <EditOutlined /> <span>Rename</span>
              </button>
            )
          },
          showShared && hasPermissionForSlug("file-manager-items-share") && record.permissions?.includes('share') && {
            key: 'sharePerm',
            label: (
              <button className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded">
                <ShareAltOutlined /> <span>Share</span>
              </button>
            )
          },
          showShared && hasPermissionForSlug("file-manager-items-delete") && record.permissions?.includes('delete') && {
            key: 'deletePerm',
            label: (
              <button className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-red-500">
                <DeleteOutlined /> <span>Delete</span>
              </button>
            )
          },
        ].filter(Boolean) as MenuProps['items'];
        return (
          <Dropdown menu={{ items }} trigger={["click", "hover"]} placement="bottomRight">
            <button className="p-1 rounded hover:bg-gray-100" title="Actions">
              <MoreOutlined />
            </button>
          </Dropdown>
        );
      },
    },
  ];

  const filteredNodes = nodes
    .filter(n => {
      if (typeFilter === "folders" && !n.isFolder) return false;
      if (typeFilter === "files" && n.isFolder) return false;
      if (searchQuery.trim()) {
        return n.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    })
    .slice()
    .sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1;
      if (sortField === "name") {
        return a.name.localeCompare(b.name) * dir;
      }
      if (sortField === "type") {
        const ta = a.isFolder ? "folder" : (a.mimeType || "file");
        const tb = b.isFolder ? "folder" : (b.mimeType || "file");
        return ta.localeCompare(tb) * dir;
      }
      if (sortField === "size") {
        const sa = a.size || 0;
        const sb = b.size || 0;
        return (sa - sb) * dir;
      }
      return 0;
    });

  const getSharedBreadcrumbItems = () => {
    const items = [
      {
        title: (
          <span className="clickable-breadcrumb" onClick={goToRoot}>
            👥 Shared with Me
          </span>
        )
      }
    ];

    sharedFolderHierarchy.forEach((folder, index) => {
      items.push({
        title: (
          <span 
            className="clickable-breadcrumb" 
            onClick={() => goToBreadcrumb(index + 1)}
          >
            📁 {folder.name}
          </span>
        )
      });
    });

    return items;
  };

  return (
    <>
    <style>
      {`
        .clickable-breadcrumb {
          cursor: pointer;
          color: #1890ff;
        }
        .clickable-breadcrumb:hover {
          color: #40a9ff;
          text-decoration: underline;
        }
        .drag-over {
          border: 2px dashed #1890ff !important;
          background-color: #f0f8ff !important;
        }
      `}
    </style>
    <Card title={
      <Space>
        <div style={{ display: "flex", gap: 8 }}>
          <button 
            className={!showShared ? "primary-btn" : "primary-btn-ghost"}
            onClick={() => {
              setShowShared(false);
              goToRoot();
            }}
            style={{ minWidth: "100px" }}
          >
            📁 My Files
          </button>
          <button 
            className={showShared ? "primary-btn" : "primary-btn-ghost"}
            onClick={() => {
              setShowShared(true);
              goToRoot();
            }}
            style={{ minWidth: "100px" }}
          >
            👥 Shared with Me
          </button>
        </div>
        {!showShared && hasPermissionForSlug("file-manager-items-upload") && (
          <>
            <button className="primary-btn" onClick={onCreateFolder} disabled={creating}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <FolderAddOutlined /> New Folder
              </span>
            </button>           
          </>
        )}
        {parentIdStack.length > 1 && (
          <button className="primary-btn-ghost" onClick={goUp}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <ArrowUpOutlined /> One Step Up
            </span>
          </button>
        )}
        {selectedItems.size > 0 && (
          <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
            {hasPermissionForSlug("file-manager-items-remove") && (
            <button 
              className="cancel-btn"
              onClick={handleBulkDelete}
              disabled={deletingMultiple}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <DeleteOutlined /> Delete ({selectedItems.size})
              </span>
            </button>
            )}
             {hasPermissionForSlug("file-manager-items-move") && (
            <button 
              className="primary-btn-ghost"
              onClick={openBulkMoveModal}
              disabled={movingMultiple}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <ArrowUpOutlined /> Move ({selectedItems.size})
              </span>
            </button>
            )}
            {hasPermissionForSlug("file-manager-items-share") && (
            <button 
              className="primary-btn-ghost"
              onClick={openBulkShareModal}
              disabled={sharingMultiple}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <ShareAltOutlined /> Share ({selectedItems.size})
              </span>
            </button>
            )}
          </div>
        )}
      </Space>
    }>
      {!showShared && hasPermissionForSlug("file-manager-items-upload") && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={isDragOver ? "drag-over" : ""}
          style={{
            border: '2px dashed #d9d9d9',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '16px',
            backgroundColor: isDragOver ? '#f0f8ff' : '#fafafa',
            transition: 'all 0.3s ease'
          }}
        >
          <Upload {...uploadProps}>
            <button className="primary-btn border-none py-3" disabled={uploading}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <UploadOutlined /> {uploading ? "Uploading..." : "Upload"}
              </span>
            </button>
          </Upload>
          <p style={{ margin: '8px 0', fontSize: '16px', fontWeight: '500' }}>
            Or you can drag & drop files here to upload
          </p>
          <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
            Supported formats: DOC, DOCX, PDF, XLS, XLSX, PPT, PPTX, JPG, PNG, GIF, BMP, WEBP, SVG
          </p>
          <p style={{ margin: '8px 0 0 0', color: '#999', fontSize: '12px' }}>
            Max 10 files at once
          </p>
        </div>
      )}

      <Breadcrumb style={{ marginBottom: 16 }}>
        {showShared ? (
          <>
            <Breadcrumb.Item>📁 File Manager</Breadcrumb.Item>
            {getSharedBreadcrumbItems().map((item, index) => (
              <Breadcrumb.Item key={index}>
                {item.title}
              </Breadcrumb.Item>
            ))}
          </>
        ) : (
          <>
            <Breadcrumb.Item 
              className="clickable-breadcrumb"
              onClick={goToRoot}
            >
              🏠 Root
            </Breadcrumb.Item>
            {parentIdStack.slice(1).map((pid, idx) => (
              <Breadcrumb.Item 
                key={idx + 1}
                className="clickable-breadcrumb"
                onClick={() => goToBreadcrumb(idx + 1)}
              >
                📁 {(() => {
                  const folder = nodes.find(n => n.id === pid);
                  return folder?.name || (pid != null && idToName[pid as number]) || `Folder ${pid}`;
                })()}
              </Breadcrumb.Item>
            ))}
          </>
        )}
      </Breadcrumb>
      
      <div style={{ 
        marginBottom: 12, 
        fontSize: "12px", 
        color: "#666",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <span>
          {showShared ? "Shared files" : "My files"}: {nodes.length} item{nodes.length !== 1 ? 's' : ''}
        </span>
        {showShared && (
          <span style={{ color: "#1890ff" }}>
            💡 Switch to "My Files" to manage your own files and folders
          </span>
        )}
      </div>

      <div style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        alignItems: "center",
        marginBottom: 12
      }}>
        
        
              {renderToolbar()}
      
      <GlobalSearch
  isOpen={isSearchOpen}
  onClose={() => setIsSearchOpen(false)}
  onNavigate={handleSearchNavigate}
  onNavigateToFolder={handleNavigateToFolder}
  onViewFile={handleViewFile}
  currentUser={user}
/>

      </div>
      
      {viewMode === "list" ? (
        <Table
          rowKey="id"
          dataSource={filteredNodes}
          columns={columns}
          loading={isLoadingData}
          expandable={{ showExpandColumn: false }}
          indentSize={0}
          locale={{ 
            emptyText: showShared ? 
              <Empty 
                description={
                  <div>
                    <div>No files shared with you</div>
                    <div style={{ fontSize: "12px", color: "#666", marginTop: 4 }}>
                      Files shared by other users will appear here with different permission levels
                    </div>
                  </div>
                } 
              /> : 
              <Empty 
                description={
                  <div>
                    <div>No files or folders</div>
                    <div style={{ fontSize: "12px", color: "#666", marginTop: 4 }}>
                      Create a folder or upload files to get started
                    </div>
                  </div>
                } 
              />
          }}
          pagination={false}
          style={{ marginTop: 12 }}
        />
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 12,
          marginTop: 12
        }}>
          {filteredNodes.map(node => (
            <div key={node.id} style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              background: "#fff",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: node.isFolder ? "pointer" : "default" }} onClick={() => handleOpen(node)}>
                    {node.isFolder ? <FolderFilled style={{ color: "#0d9488" }} /> : <FileOutlined />}
                    <span style={{ fontWeight: node.isFolder ? 600 : 400 }}>{node.name}</span>
                  </div>
                  {!(showShared && node.isFolder) && (
                  <Dropdown
                    trigger={["click", "hover"]}
                    placement="bottomRight"
                    menu={{
                      items: [
                        !node.isFolder && hasPermissionForSlug("file-manager-items-view") && (showShared && node.permissions?.includes('view') || node.ownerId === user.id) && {
                          key: 'view',
                          label: (
                            <button className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded" onClick={() => handleView(node)}>
                              <EyeOutlined /> <span>View</span>
                            </button>
                          )
                        },
                        !node.isFolder  && hasPermissionForSlug("file-manager-items-download") && (showShared && node.permissions?.includes('download') || node.ownerId === user.id) && {
                          key: 'download',
                          label: (
                            <button className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded" onClick={() => handleDownload(node)}>
                              <DownloadOutlined /> <span>Download</span>
                            </button>
                          )
                        },
                        !showShared && hasPermissionForSlug("file-manager-items-move") && {
                          key: 'move',
                          label: (
                            <button className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded" onClick={() => openMoveModal(node)}>
                              <ArrowUpOutlined /> <span>Move</span>
                            </button>
                          )
                        },
                        !showShared && hasPermissionForSlug("file-manager-items-share") && {
                          key: 'share',
                          label: (
                            <button className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded" onClick={() => openShareModal(node)}>
                              <ShareAltOutlined /> <span>Share</span>
                            </button>
                          )
                        },
                        !showShared && hasPermissionForSlug("file-manager-items-rename") && node?.isFolder && {
                          key: 'rename',
                          label: (
                            <button className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded" onClick={() => openRenameModal(node)}>
                              <EditOutlined /> <span>Rename</span>
                            </button>
                          )
                        },
                        !showShared && hasPermissionForSlug("file-manager-items-delete") && {
                          key: 'delete',
                          label: (
                            <button className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-red-500" onClick={() => handleDelete(node.id)}>
                              <DeleteOutlined /> <span>Delete</span>
                            </button>
                          )
                        },
                        showShared && hasPermissionForSlug("file-manager-items-share") && node.permissions?.includes('share') && {
                          key: 'sharePerm',
                          label: (
                            <button className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded">
                              <ShareAltOutlined /> <span>Share</span>
                            </button>
                          )
                        },
                        showShared && hasPermissionForSlug("file-manager-items-delete") && node.permissions?.includes('delete') && {
                          key: 'deletePerm',
                          label: (
                            <button className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded text-red-500">
                              <DeleteOutlined /> <span>Delete</span>
                            </button>
                          )
                        },
                      ].filter(Boolean) as MenuProps['items']
                    }}
                  >
                    <button className="p-1 rounded hover:bg-gray-100" title="Actions">
                      <MoreOutlined />
                    </button>
                  </Dropdown>
                  )}
                </div>
                {!showShared && (
                  <input
                    type="checkbox"
                    checked={selectedItems.has(node.id)}
                    onChange={(e) => handleSelectItem(node.id, e.target.checked)}
                  />
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#6b7280" }}>
                <span>{node.isFolder ? "Folder" : (node.mimeType || "File")}</span>
                <span>{node.isFolder ? "-" : formatFileSize(node.size || 0)}</span>
              </div>
              
            </div>
          ))}
        </div>
      )}
    </Card>

    <Modal
      title={`Move ${selectedItems.size} items`}
      open={isBulkMoveModalOpen}
      onCancel={() => setIsBulkMoveModalOpen(false)}
      footer={[
        <button key="cancel" className="cancel-btn" onClick={() => setIsBulkMoveModalOpen(false)}>Cancel</button>,
        <button key="move" className="primary-btn" onClick={handleBulkMoveConfirm} disabled={movingMultiple}>
          {movingMultiple ? "Moving..." : `Move ${selectedItems.size} items`}
        </button>
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Select
          placeholder="Select destination folder"
          options={getFolderOptions()}
          onChange={(val) => setBulkMoveToFolderId(val)}
          value={bulkMoveToFolderId}
          style={{ width: "100%" }}
          loading={allFoldersLoading}

        />
        <div style={{ fontSize: "12px", color: "#666" }}>
          Select "Root" to move to the top level
        </div>
      </Space>
    </Modal>

    <Modal
  title={`Share ${selectedItems.size} items`}
  open={isBulkShareModalOpen}
  onCancel={() => setIsBulkShareModalOpen(false)}
  footer={[
    <button key="cancel" className="cancel-btn mx-3" onClick={() => setIsBulkShareModalOpen(false)}>
      Cancel
    </button>,
    <button 
      key="share" 
      className="primary-btn" 
      disabled={bulkShareUsers.length === 0 || sharingMultiple}
      onClick={handleBulkShareConfirm}
    >
      {sharingMultiple ? "Sharing..." : `Share with ${bulkShareUsers.length} user${bulkShareUsers.length !== 1 ? 's' : ''}`}
    </button>
  ]}
>
  <Space direction="vertical" style={{ width: "100%" }}>
    <Select
      mode="multiple"
      showSearch
      placeholder="Search and select users to share with"
      options={userOptions}
      filterOption={(input, option) => {
        const label = (option?.label as string)?.toLowerCase() || "";
        return label.includes(input.toLowerCase());
      }}
      onChange={(values) => {
        const users = values.map(val => ({
          userId: Number(val),
          permissions: ["view"]
        }));
        setBulkShareUsers(users);
      }}
      value={bulkShareUsers.map(u => u.userId)}
      style={{ width: "100%" }}
    />
    
    {bulkShareUsers.length > 0 && (
      <div style={{ marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: "12px", color: "#666" }}>Selected users ({bulkShareUsers.length}):</span>
          <button 
            className="primary-btn-ghost"
            onClick={() => setBulkShareUsers([])}
            style={{ fontSize: "11px" }}
          >
            Clear All
          </button>
        </div>
        {bulkShareUsers.map((user, index) => {
          const userOption = userOptions.find(opt => opt.value === user.userId);
          return (
            <div key={index} style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              padding: "8px", 
              backgroundColor: "#f5f5f5", 
              borderRadius: 4, 
              marginBottom: 4 
            }}>
              <span>{userOption?.label || `User ${user.userId}`}</span>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "center" }}>
                  {["view", "download"].map(permission => (
                    <label key={permission} style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={user.permissions.includes(permission)}
                        onChange={() => handleBulkPermissionToggle(permission, user.userId)}
                        style={{ margin: 0 }}
                      />
                      {permission === "view" && <EyeOutlined style={{ fontSize: "18px", color: "#1890ff" }} />}
                      {permission === "download" && <DownloadOutlined style={{ fontSize: "18px", color: "#52c41a" }} />}
                    </label>
                  ))}
                </div>
                <button 
                  className="cancel-btn"
                  onClick={() => setBulkShareUsers(prev => prev.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </Space>
</Modal>

    <Modal
      title={`Move: ${moveTargetNode?.name || "Item"}`}
      open={isMoveModalOpen}
      onCancel={() => setIsMoveModalOpen(false)}
      footer={[
        <button key="cancel" className="cancel-btn mx-3" onClick={() => setIsMoveModalOpen(false)}>Cancel</button>,
        <button key="move" className="primary-btn" onClick={handleMoveConfirm} disabled={moving}>{moving ? "Moving..." : "Move"}</button>
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Select
          placeholder="Select destination folder"
          options={getFolderOptions()}
          onChange={(val) => setMoveToFolderId(val)}
          value={moveToFolderId}
          style={{ width: "100%" }}
          loading={allFoldersLoading}
        />
        <div style={{ fontSize: "12px", color: "#666" }}>
          Select "Root" to move to the top level
        </div>
      </Space>
    </Modal>

    <Modal
      title={`Share: ${shareTargetNode?.name || "Item"}`}
      open={isShareModalOpen}
      onCancel={() => setIsShareModalOpen(false)}
      footer={[
        <button key="cancel" className="cancel-btn mx-3" onClick={() => setIsShareModalOpen(false)}>
          Cancel
        </button>,
        <button 
          key="share" 
          className="primary-btn" 
          disabled={selectedUsers.length === 0 || sharing}
          onClick={handleShareConfirm}
        >
          {sharing ? "Sharing..." : `Share with ${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''}`}
        </button>
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Select
          mode="multiple"
          showSearch
          placeholder="Search and select users to share with"
          options={userOptions}
          filterOption={(input, option) => {
            const label = (option?.label as string)?.toLowerCase() || "";
            return label.includes(input.toLowerCase());
          }}
          onChange={(values) => {
            const users = values.map(val => ({
              userId: Number(val),
              permissions: [sharePermission]
            }));
            setSelectedUsers(users);
          }}
          value={selectedUsers.map(u => u.userId)}
          style={{ width: "100%" }}
        />
        
        <div style={{ 
          marginTop: 8, 
          padding: "8px 12px", 
          backgroundColor: "#f0f0f0", 
          border: "1px solid #d9d9d9", 
          borderRadius: 4,
          fontSize: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>🔐 <strong>Permission Mode:</strong> Multiple Selection</span>
          <div style={{ display: "flex", gap: 4 }}>
            {["view", "download"].map(permission => (
              <button 
                key={permission}
                className={selectedUsers.length > 0 && selectedUsers.every(u => u.permissions.includes(permission)) ? "primary-btn" : "primary-btn-ghost"}
                onClick={() => {
                  setSharePermission(permission as SharePermission);
                  setSelectedUsers(prev => prev.map(user => {
                    const hasPermission = user.permissions.includes(permission);
                    return {
                      ...user,
                      permissions: hasPermission 
                        ? user.permissions.filter(p => p !== permission)
                        : [...user.permissions, permission]
                    };
                  }));
                }}
              >
                {permission.charAt(0).toUpperCase() + permission.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {selectedUsers.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: "12px", color: "#666" }}>Selected users ({selectedUsers.length}):</span>
              <button 
                className="primary-btn-ghost"
                onClick={() => setSelectedUsers([])}
                style={{ fontSize: "11px" }}
              >
                Clear All
              </button>
            </div>
            {selectedUsers.map((user, index) => {
              const userOption = userOptions.find(opt => opt.value === user.userId);
              return (
                <div key={index} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  padding: "8px", 
                  backgroundColor: "#f5f5f5", 
                  borderRadius: 4, 
                  marginBottom: 4 
                }}>
                  <span>{userOption?.label || `User ${user.userId}`}</span>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <div style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "center" }}>
                      {["view", "download"].map(permission => (
                        <label key={permission} style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={user.permissions.includes(permission)}
                            onChange={() => handlePermissionToggle(permission, user.userId)}
                            style={{ margin: 0 }}
                          />
                          {permission === "view" && <EyeOutlined style={{ fontSize: "18px", color: "#1890ff" }} />}
                          {permission === "download" && <DownloadOutlined style={{ fontSize: "18px", color: "#52c41a" }} />}
                        </label>
                      ))}
                    </div>
                    <button 
                      className="cancel-btn"
                      onClick={() => setSelectedUsers(prev => prev.filter((_, i) => i !== index))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Space>
    </Modal>

    <Modal
      title="Create folder"
      open={isCreateModalOpen}
      onCancel={() => setIsCreateModalOpen(false)}
      footer={[
        <button key="cancel" className="cancel-btn mx-3" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>,
        <button key="create" className="primary-btn" onClick={handleCreateFolderOk} disabled={creating}>{creating ? "Creating..." : "Create"}</button>
      ]}
    >
      <Input
        placeholder="Folder name"
        value={folderName}
        onChange={(e) => setFolderName(e.target.value)}
        onPressEnter={handleCreateFolderOk}
      />
    </Modal>

    <Modal
      title={previewNode?.name || "Preview"}
      open={isPreviewOpen}
      onCancel={() => {
        setIsPreviewOpen(false);
        setPreviewNode(null);
        setPreviewUrl(null);
      }}
      footer={[
        <button key="close" className="cancel-btn" onClick={() => setIsPreviewOpen(false)}>Close</button>
      ]}
      width={800}
    >
      {previewNode && !previewNode.isFolder && previewUrl ? (
        (() => {
          const mime = previewNode.mimeType || "";
          if (mime.startsWith("image/")) {
            return <img src={previewUrl} alt={previewNode.name} style={{ maxWidth: "100%", height: "auto" }} />;
          }
          if (mime === "application/pdf") {
            const pdfUrl = `${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`;
            return (
              <iframe
                src={pdfUrl}
                title="PDF Preview"
                style={{ width: "100%", height: 600, border: 0 }}
              />
            );
          }
          if (mime.startsWith("video/")) {
            return (
              <video src={previewUrl} controls style={{ width: "100%" }} />
            );
          }
          if (mime.startsWith("audio/")) {
            return <audio src={previewUrl} controls style={{ width: "100%" }} />;
          }
          return (
            <div>
              <p>This file type cannot be previewed. You can download it instead.</p>
            </div>
          );
        })()
      ) : (
        <div>
          <p>No preview available.</p>
        </div>
      )}
    </Modal>

<Modal
  title="Confirm Deletion"
  open={isDeleteMultipleModalVisible}
  onCancel={cancelDelete}
  footer={[
    <button key="cancel" className="cancel-btn mx-3" onClick={cancelDelete}>
      Cancel
    </button>,
    <button
      key="confirm"
      className="primary-btn danger"
      onClick={handleDeleteConfirmMultiple}
      disabled={deletingMultiple}
    >
      {deletingMultiple ? "Deleting..." : `Confirm Delete ${pendingDeleteItems.size} items`}
    </button>,
  ]}
>
  Are you sure you want to delete {pendingDeleteItems.size} selected item{pendingDeleteItems.size !== 1 ? 's' : ''}?
</Modal>


      <Modal
        title="Confirm Deletion"
        open={isDeleteSingleModalVisible}
        onCancel={cancelSingleDelete}
        footer={[
          <button key="cancel" className="cancel-btn mx-3" onClick={cancelSingleDelete}>
            Cancel
          </button>,
          <button
            key="confirm"
            className="primary-btn danger"
            onClick={handleDeleteConfirmSingle}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Confirm Delete"}
          </button>,
        ]}
      >
        Are you sure you want to delete this item?
      </Modal>

<Modal
  title={`Rename ${renameTargetNode?.isFolder ? 'Folder' : 'File'}`}
  open={isRenameModalOpen}
  onCancel={() => {
    setIsRenameModalOpen(false);
    setRenameTargetNode(null);
    setNewName("");
  }}
  footer={[
    <button key="cancel" className="cancel-btn mx-3" onClick={() => setIsRenameModalOpen(false)}>
      Cancel
    </button>,
    <button key="rename" className="primary-btn" onClick={handleRenameConfirm} disabled={renaming}>
      {renaming ? "Renaming..." : "Rename"}
    </button>
  ]}
>
  <Space direction="vertical" style={{ width: "100%" }}>
    <label style={{ fontSize: "14px", fontWeight: 500 }}>
      Current name: <span style={{ color: "#666" }}>{renameTargetNode?.name}</span>
    </label>
    <Input
      placeholder={`Enter new ${renameTargetNode?.isFolder ? 'folder' : 'file'} name`}
      value={newName}
      onChange={(e) => setNewName(e.target.value)}
      onPressEnter={handleRenameConfirm}
      autoFocus
    />
    {renameTargetNode?.isFolder && (
      <div style={{ fontSize: "12px", color: "#666", marginTop: 8 }}>
        💡 Note: Renaming a folder will not automatically update S3 paths for files inside it.
      </div>
    )}
  </Space>
</Modal>
    </>
  );
};

export default FileManager;