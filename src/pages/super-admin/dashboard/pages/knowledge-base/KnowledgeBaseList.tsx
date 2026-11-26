// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any

import 'react-quill-new/dist/quill.snow.css';
import React, {
  useEffect,
  useState,
} from 'react';

import {
  Button,
  Dropdown,
  message,
  Modal,
  Select,
  Space,
  Table,
  TableColumnsType,
  Tag,
  Upload,
  UploadProps,
} from 'antd';
import {
  formatDate,
  parseISO,
} from 'date-fns';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { BsThreeDotsVertical } from 'react-icons/bs';
import {
  FaEdit,
  FaEye,
  FaSearch,
  FaTimes,
  FaTrash,
} from 'react-icons/fa';
import ReactQuill from 'react-quill-new';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { UploadOutlined } from '@ant-design/icons';

import ButtonLoader from '../../../../../components/loader/buttonLoader';
import TableLoader from '../../../../../components/loader/TableLoader';
import {
  useChangeKnowledgeBaseStatusMutation,
  useCreateOrUpdateKnowledgeBaseMutation,
  useDeleteMultipleKnowledgeBaseMutation,
  useGetKnowledgeBaseQuery,
} from '../../../../../redux/api/superadmin/knowledgeBase/knowledgeBaseSlice';
import { RootState } from '../../../../../redux/store';
import { baseUrl } from '../../../../../utils/constant';
import { usePermissions } from '../../../../../utils/permissionUtils';

interface KnowledgeBase {
  id: number;
  uuid: string;
  title: string;
  description: string;
  type: "document" | "tutorial" | "training";
  url: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  userType: string;
}

const KnowledgeBaseList: React.FC = () => {
  const { data, isLoading } = useGetKnowledgeBaseQuery();
  const [createOrUpdateKnowledgeBase] = useCreateOrUpdateKnowledgeBaseMutation();
  const [deleteMultipleKnowledgeBase] = useDeleteMultipleKnowledgeBaseMutation();
  const [changeKnowledgeBaseStatus] = useChangeKnowledgeBaseStatusMutation();

  const [tableData, setTableData] = useState<KnowledgeBase[]>([]);
  const [filteredData, setFilteredData] = useState<KnowledgeBase[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteUuids, setDeleteUuids] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<KnowledgeBase | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filteredInfo, setFilteredInfo] = useState<Filters>({});
  const [sortedInfo, setSortedInfo] = useState<Sorts>({});
  const [description, setDescription] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("all");

  const navigate = useNavigate();
  const authUser = useSelector((state: RootState) => state.user.user as User);
  const { hasPermissionForSlug } = usePermissions();
  const userType = authUser?.userType;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<KnowledgeBase>();

  const watchType = watch("type");

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  const typeOptions = [
    { label: "Document", value: "document" },
    { label: "Tutorial", value: "tutorial" },
    { label: "Training", value: "training" },
  ];

  // Tabs configuration
  const tabs = [
    {
      key: "all",
      label: "All",
      type: null,
    },
    {
      key: "document",
      label: "Referral Forms",
      type: "document" as const,
    },
    {
      key: "tutorial",
      label: "Tutorial Videos",
      type: "tutorial" as const,
    },
    {
      key: "training",
      label: "Training and Appointments",
      type: "training" as const,
    },
  ];

  const getType = (cat_name: string) => {
    // alert(cat_name)
  let new_cat: string;

  switch (cat_name) {
    case "document":
      new_cat = "Referral Forms";
      break;
    case "tutorial":
      new_cat = "Tutorial Videos";
      break;
    case "training":
      new_cat = "Training and Appointments";
      break;
    default:
      new_cat = cat_name; // fallback if no match
  }

  return new_cat;
};

  useEffect(() => {
    if (data?.data) {
      setTableData(data.data);
    }
  }, [data]);

  // Filter data based on active tab and search text
  useEffect(() => {
    let filtered = tableData;

    // Filter by active tab
    if (activeTab !== "all") {
      filtered = filtered.filter(item => item.type === activeTab);
    }

    // Filter by search text
    if (searchText) {
      const searchTerm = searchText.toLowerCase();
      filtered = filtered.filter((record) => {
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
        const allValues = extractValues(record);
        return allValues.some((value) => value.includes(searchTerm));
      });
    }

    setFilteredData(filtered);
  }, [tableData, activeTab, searchText]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSelectedRowKeys([]); // Clear selection when changing tabs
  };

  const handleChange: OnChange = (pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter as Sorts);
  };

  const tableSourceData = filteredData?.map((item: KnowledgeBase, index: number) => ({
    ...item,
    serial: index + 1,
  }));

  const [isAddOrUpdateLoading, setIsAddOrUpdateLoading] = useState(false);

  const handleAddOrUpdateItem = async (values: KnowledgeBase) => {
    try {
      setIsAddOrUpdateLoading(true);
      
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", description);
      formData.append("type", values.type);
      formData.append("status", values.status);
      
      if (values.type === "document" && file) {
        formData.append("file", file);
      } else if (["tutorial", "training"].includes(values.type)) {
        formData.append("url", url);
      }
      
      if (editingItem) {
        formData.append("uuid", editingItem.uuid);
      }

      await createOrUpdateKnowledgeBase(formData).unwrap();
      
      setIsAddOrUpdateLoading(false);
      toast.success(
        editingItem 
          ? "Knowledge Base updated successfully" 
          : "Knowledge Base created successfully"
      );
      resetForm();
    } catch (err: any) {
      setIsAddOrUpdateLoading(false);
      toast.error(err.data?.message || "Something went wrong");
    }
  };

  const handleOpenModal = () => {
    setEditingItem(null);
    setIsModalVisible(true);
    setDescription("");
    setFile(null);
    setUrl("");
    
    // Set the type based on active tab (if not "all")
    if (activeTab !== "all") {
      setValue("type", activeTab as "document" | "tutorial" | "training");
    } else {
      setValue("type", "document"); // Default to document if "all" tab
    }
    
    reset({
      title: "",
      type: activeTab !== "all" ? activeTab : "document",
      status: "active",
    });
  };

  const resetForm = () => {
    setIsModalVisible(false);
    setEditingItem(null);
    setDescription("");
    setFile(null);
    setUrl("");
    reset({
      title: "",
      type: activeTab !== "all" ? activeTab : "document",
      status: "active",
    });
  };

  const handleEdit = (item: KnowledgeBase) => {
    setEditingItem(item);
    setDescription(item.description || "");
    setUrl(item.type !== "document" ? item.url : "");
    reset({
      title: item.title,
      type: item.type,
      status: item.status,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (item: KnowledgeBase) => {
    setDeleteUuids([item.uuid]);
    setIsDeleteModalVisible(true);
  };

  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      toast.error("Please select items to delete");
      return;
    }
    const uuids = selectedRowKeys.map(key => 
      filteredData.find(item => item.id === key)?.uuid
    ).filter(Boolean) as string[];
    
    setDeleteUuids(uuids);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (deleteUuids.length > 0) {
      try {
        await deleteMultipleKnowledgeBase({ ids: deleteUuids }).unwrap();
        message.success("Knowledge Base items deleted successfully");
        setDeleteUuids([]);
        setIsDeleteModalVisible(false);
        setSelectedRowKeys([]);
      } catch (err) {
        message.error("Failed to delete knowledge base items");
      }
    }
  };

  const handleChangeStatus = async (newStatus: string, uuid: string) => {
    try {
      await changeKnowledgeBaseStatus({ uuid, status: newStatus }).unwrap();
      toast.success("Status updated successfully");
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      setFile(file);
      return false;
    },
    onRemove: () => {
      setFile(null);
    },
    fileList: file ? [file] : [],
    accept: ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png",
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const columns: TableColumnsType<KnowledgeBase> = [
    {
      title: "#",
      key: "serial",
      dataIndex: "serial",
      width: 50,
      fixed: "left",
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      sorter: (a, b) => a.title.localeCompare(b.title),
      sortOrder: sortedInfo.columnKey === "title" ? sortedInfo.order : null,
      ellipsis: true,
      render: (title, record) => (
        <div
          className="hover:text-blue-600 cursor-pointer hover:underline"
          onClick={() => handleEdit(record)}
        >
          {title}
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (description: string) => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = description;
        const textContent = tempDiv.textContent || tempDiv.innerText || "";
        return (
          <div>
            {textContent.substring(0, 50)}
            <br />
            {textContent.substring(50, 100)
              ? textContent.substring(50, 100) + (textContent.length > 100 ? "..." : "")
              : null}
          </div>
        );
      },
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      filters: [
        { text: "Referral Forms", value: "document" },
        { text: "Tutorial Videos", value: "tutorial" },
        { text: "Training and Appointment", value: "training" },
      ],
      filteredValue: filteredInfo?.type,
      onFilter: (value, record) => record.type === value,
      ellipsis: true,
      render: (type: string) => (
        <Tag 
          color={
            type === "document" ? "blue" : 
            type === "tutorial" ? "green" : "orange"
          }
        >
          {getType(type).charAt(0).toUpperCase() + getType(type).slice(1)}
        </Tag>
      ),
    },
    {
      title: "Resource",
      dataIndex: "url",
      key: "url",
      render: (url: string, record) => {
        if (record.type === "document") {
          return (
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View Document
            </a>
          );
        } else {
          return (
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-green-600 hover:underline"
            >
              Open Link
            </a>
          );
        }
      },
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: string) =>
        formatDate(parseISO(createdAt), "dd MMMM yyyy, hh:mm a"),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      sortOrder: sortedInfo.columnKey === "createdAt" ? sortedInfo.order : null,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Active", value: "active" },
        { text: "Inactive", value: "inactive" },
      ],
      filteredValue: filteredInfo?.status,
      onFilter: (value, record) => record.status === value,
      ellipsis: true,
      render: (status, record) => (
        <div>
          {hasPermissionForSlug("knowledge-base-status-change") && (
            <Select
              value={status}
              onChange={(newStatus) =>
                handleChangeStatus(newStatus, record.uuid)
              }
              options={statusOptions}
              style={{ width: 120 }}
            />
          )}
          {!hasPermissionForSlug("knowledge-base-status-change") && (
            <Tag color={status === "active" ? "green" : "red"}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      dataIndex: "id",
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <div>
          {/* {(hasPermissionForSlug("knowledge-base-edit") || 
            hasPermissionForSlug("knowledge-base-delete")) && ( */}
            <Dropdown
              menu={{
                items: [
                  hasPermissionForSlug("knowledge-base-edit") && {
                    key: "edit",
                    label: (
                      <div
                        className="flex items-center gap-2 p-2"
                        onClick={() => handleEdit(record)}
                      >
                        <FaEdit />
                        Edit
                      </div>
                    ),
                  },
                  hasPermissionForSlug("knowledge-base-delete") && {
                    key: "delete",
                    label: (
                      <div
                        className="flex items-center gap-2 p-2"
                        onClick={() => handleDelete(record)}
                      >
                        <FaTrash />
                        Delete
                      </div>
                    ),
                  },
                ].filter(Boolean),
              }}
              trigger={["click"]}
            >
              <a onClick={(e) => e.preventDefault()}>
                <Space>
                  <BsThreeDotsVertical />
                </Space>
              </a>
            </Dropdown>
          {/* )} */}
        </div>
      ),
    },
  ];

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          {/* Filter tabs */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-[#0f766e] text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="relative flex-shrink-0" style={{ width: 170 }}>
            <FaSearch className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: 10, left: 8 }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ paddingLeft: 26, paddingRight: searchText ? 22 : 8, paddingTop: 4, paddingBottom: 4, width: "100%" }}
            />
            {searchText && (
              <button type="button" onClick={() => setSearchText("")} className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" style={{ right: 6 }}>
                <FaTimes />
              </button>
            )}
          </div>
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {selectedRowKeys.length > 0 && hasPermissionForSlug("knowledge-base-delete") && (
              <button className="cancel-btn" onClick={handleBulkDelete}>
                Delete Selected ({selectedRowKeys.length})
              </button>
            )}
            {hasPermissionForSlug("knowledge-base-create") && (
              <button className="primary-btn" onClick={handleOpenModal}>
                Add {activeTab !== "all" ? tabs.find(tab => tab.key === activeTab)?.label?.slice(0, -1) : "Item"}
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
              dataSource={tableSourceData}
              pagination={{ pageSize: 20 }}
              onChange={handleChange}
              rowSelection={hasPermissionForSlug("knowledge-base-delete") ? rowSelection : undefined}
            />
          )}
        </div>

      {/* Add/Edit Modal */}
      <Modal
        title={
          editingItem 
            ? "Edit Knowledge Base Item" 
            : `Add ${activeTab !== "all" ? tabs.find(t => t.key === activeTab)?.label?.slice(0, -1) : "Knowledge Base Item"}`
        }
        open={isModalVisible}
        onCancel={resetForm}
        width={700}
        footer={null}
      >
        <form onSubmit={handleSubmit(handleAddOrUpdateItem)}>
          <div className="my-5">
            <label>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="global-input"
              {...register("title", { required: "Please input the title!" })}
              placeholder="Enter the title"
            />
            {errors.title && (
              <p className="text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="mb-20">
            <label>Description</label>
            <ReactQuill
              modules={{
                toolbar: [
                  [{ header: "1" }, { header: "2" }, { font: [] }],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["bold", "italic", "underline"],
                  [{ align: [] }],
                  ["link", "image"],
                  [{ color: [] }],
                ],
              }}
              value={description}
              onChange={setDescription}
              placeholder="Write your description here..."
              style={{ height: "100px", marginBottom: "40px" }}
            />
          </div>

          <div className="flex mb-5 gap-4">
            <div className="w-1/2">
              <label>
                Type <span className="text-red-500">*</span>
              </label>
              <select
                className="global-input"
                {...register("type", { required: "Please select the type!" })}
                disabled={activeTab !== "all" && !editingItem} // Disable if specific tab is selected and not editing
              >
                <option value="">Select a type</option>
                <option value="document">Referral Forms</option>
                <option value="tutorial">Tutorial Videos</option>
                <option value="training">Training and Appointments</option>
              </select>
              
              {errors.type && (
                <p className="text-red-500">{errors.type.message}</p>
              )}
            </div>
            <div className="w-1/2">
              <label>
                Status <span className="text-red-500">*</span>
              </label>
              <select
                className="global-input"
                {...register("status", { required: "Please select the status!" })}
              >
                <option value="">Select status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {errors.status && (
                <p className="text-red-500">{errors.status.message}</p>
              )}
            </div>
          </div>

          {watchType === "document" && (
            <div className="my-5">
              <label>Upload Document</label>
              <Upload.Dragger {...uploadProps} listType="text">
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">
                  Click or drag file to this area to upload
                </p>
                <p className="ant-upload-hint">
                  Supports PDF, DOC, DOCX, TXT, JPG, PNG files
                </p>
              </Upload.Dragger>
              {editingItem?.type === "document" && editingItem?.url && !file && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Current file:</p>
                  <a
                    href={baseUrl + editingItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {editingItem.url.split('/').pop()}
                  </a>
                </div>
              )}
            </div>
          )}

          {["tutorial", "training"].includes(watchType || "") && (
            <div className="my-5">
              <label>
                URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="global-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL"
                required={["tutorial", "training"].includes(watchType || "")}
              />
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" className="cancel-btn" onClick={resetForm}>
              Cancel
            </button>
            <button className="primary-btn" type="submit">
              {isAddOrUpdateLoading ? <ButtonLoader /> : "Submit"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Knowledge Base Items"
        open={isDeleteModalVisible}
        onCancel={() => setIsDeleteModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsDeleteModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="confirm" type="primary" danger onClick={confirmDelete}>
            Confirm Delete
          </Button>,
        ]}
      >
        <p>
          Are you sure you want to delete {deleteUuids.length} item(s)?
          This action cannot be undone.
        </p>
      </Modal>
      </div>
    </div>
  );
};

export default KnowledgeBaseList;