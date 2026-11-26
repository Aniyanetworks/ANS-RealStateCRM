/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useState } from "react";
import type { TableColumnsType, TableProps } from "antd";
import { useForm } from "react-hook-form";
import { Table, Modal, Button, Dropdown, Space, Tooltip } from "antd";
import {
  useGetVendorCategoryQuery,
  useCreateVendorCategoryMutation,
  useUpdateVendorCategoryMutation,
  useDeleteMultipleVendorCategoryMutation,
} from "../../../../../redux/api/superadmin/vendorCategoryDataSlice";
import { FaRegEdit, FaSearch, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import toast from "react-hot-toast";
import TableLoader from "../../../../../components/loader/TableLoader";
import { BsThreeDotsVertical } from "react-icons/bs";
import { usePermissions } from "../../../../../utils/permissionUtils";

type TableRowSelection<T extends object = object> = TableProps<T>["rowSelection"];

interface VendorCategory {
  id: number;
  name: string;
}

interface VendorCategoryFormData {
  name: string;
}

const VendorCategoryManagement = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] = useState(false);
  const [searchText, setSearchText] = useState(""); // Search state

  // API hooks
  const { data, isLoading, refetch } = useGetVendorCategoryQuery("");
  const [createVendorCategory] = useCreateVendorCategoryMutation();
  const [updateVendorCategory] = useUpdateVendorCategoryMutation();
  const [deleteMultipleVendorCategory] = useDeleteMultipleVendorCategoryMutation();

  // Form
  const {
    register,
    formState: { errors },
    reset,
    handleSubmit,
    setError,
  } = useForm<VendorCategoryFormData>({ defaultValues: { name: "" } });

  // Table data
  const VendorCategorys = data?.data?.VendorCategory || [];

  // Filtered data for search
  const filteredData = VendorCategorys.filter((record: VendorCategory) =>
    record.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Reset form
  const resetForm = () => {
    reset({ name: "" });
  };

  // Modal handlers
  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedId(null);
  };

  const handleEdit = (record: VendorCategory) => {
    reset(record);
    setIsEditMode(true);
    setSelectedId(record.id);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteMultipleVendorCategory([selectedId]);
      toast.success("Deleted successfully!");
      setIsModalVisible(false);
      setSelectedId(null);
      await refetch();
    } catch (error) {
      toast.error("Delete failed!");
      setIsModalVisible(false);
      setSelectedId(null);
    }
  };

  const cancelDelete = () => {
    setIsModalVisible(false);
    setSelectedId(null);
    setIsDeleteModalMultipleVisible(false);
  };

  const handleDelete = (id: number) => {
    setSelectedId(id);
    setIsModalVisible(true);
  };

  // Table row selection
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<VendorCategory> = {
    selectedRowKeys,
    onChange: onSelectChange,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  // Delete multiple
  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true);
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        await deleteMultipleVendorCategory(selectedRowKeys);
        setIsDeleteModalMultipleVisible(false);
        setSelectedRowKeys([]);
        toast.success("Deleted successfully!");
        await refetch();
      } catch (error) {
        setIsDeleteModalMultipleVisible(false);
        toast.error("Failed to delete. Please try again.");
      }
    } else {
      toast.error("Please select items.");
    }
  };

  // Create/Edit submit - FIXED VERSION
  const onSubmit = async (formData: VendorCategoryFormData) => {
    console.log("Form data:", formData); // Debug log
    
    if (isEditMode && selectedId) {
      try {
        const payload = { id: selectedId, ...formData };
        await updateVendorCategory(payload);
        toast.success("Updated successfully!");
        setIsModalOpen(false);
        setIsEditMode(false);
        setSelectedId(null);
        resetForm();
        await refetch();
      } catch (error: any) {
        if (error?.data?.errors) {
          error.data.errors.forEach((err: { path: string; msg: string }) => {
            setError(err.path, { type: "manual", message: err.msg });
          });
        } else {
          toast.error("Update failed!");
        }
      }
    } else {
      try {
        await createVendorCategory(formData);
        toast.success("Created successfully!");
        setIsModalOpen(false);
        resetForm();
        await refetch();
      } catch (error: any) {
        if (error?.data?.errors) {
          error.data.errors.forEach((err: { path: string; msg: string }) => {
            setError(err.path, { type: "manual", message: err.msg });
          });
        } else {
          toast.error("Create failed!");
        }
      }
    }
  };

  // Table columns
  const columns: TableColumnsType<VendorCategory> = [
    {
      title: "#",
      key: "serial",
      width: 50,
      render: (_, __, index) => index + 1,
      fixed: "left",
    },
    {
      title: "Category Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      ellipsis: true,
      render: (text: string, record: VendorCategory) => (
        <Tooltip title={text}>
          <button
            onClick={() => handleEdit(record)}
            className="hover:text-blue-600 cursor-pointer hover:underline"
          >
            {text?.length > 30 ? `${text?.slice(0, 30)}...` : text}
          </button>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              hasPermissionForSlug("vendor-category-edit") && {
                key: "edit",
                label: (
                  <button
                    className="flex items-center gap-2 w-full"
                    onClick={() => handleEdit(record)}
                  >
                    <FaRegEdit />
                    Edit
                  </button>
                ),
              },
              hasPermissionForSlug("vendor-category-delete") && {
                key: "delete",
                label: (
                  <button
                    className="flex items-center gap-2 w-full"
                    onClick={() => handleDelete(record.id)}
                  >
                    <MdDelete size={17} />
                    Delete
                  </button>
                ),
              },
            ].filter(Boolean),
          }}
        >
          <a onClick={e => e.preventDefault()}>
            <Space>
              <BsThreeDotsVertical />
            </Space>
          </a>
        </Dropdown>
      ),
      fixed: "right",
      align: "center",
    },
  ];

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Vendor Category</h1>
          <div className="flex-1" />
          <div className="relative flex-shrink-0" style={{ width: 170 }}>
            <FaSearch className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: 10, left: 8 }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
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
            {hasPermissionForSlug("vendor-category-create") && (
              <button onClick={() => setIsModalOpen(true)} className="primary-btn">Add New</button>
            )}
            {hasPermissionForSlug("vendor-category-delete") && (
              <button onClick={handleDeleteMultipleClick} className="cancel-btn">Delete Selected</button>
            )}
          </div>
        </div>
        <div>
          {isLoading ? (
            <TableLoader />
          ) : (
            <Table
              rowSelection={rowSelection}
              rowKey="id"
              scroll={{ x: "max-content" }}
              columns={columns}
              dataSource={filteredData.map((item, idx) => ({ ...item, serial: idx + 1 }))}
              pagination={{ pageSize: 20 }}
            />
          )}
        </div>

      {/* Modal with proper form submission */}
      <Modal
        onCancel={handleCancel}
        open={isModalOpen}
        title={isEditMode ? "Edit Vendor Category" : "Create Vendor Category"}
        width={"400px"}
        footer={null} // Remove footer buttons since we'll handle submission in the form
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="flex flex-col gap-2">
            <label>
              Category Name <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              {...register("name", { required: "Name is required" })}
              type="text"
              placeholder="Enter Category Name"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message as string}</p>
            )}
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="primary-btn"
            >
              {isEditMode ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        title="Confirm Deletion"
        open={isModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button key="confirm" type="primary" danger onClick={confirmDelete} style={{ marginLeft: "8px" }}>
            Confirm
          </Button>,
          <Button key="cancel" onClick={cancelDelete}>
            Cancel
          </Button>,
        ]}
      >
        <p>Are you sure you want to delete this item?</p>
      </Modal>
      
      <Modal
        title="Confirm Deletion"
        open={isDeleteMultipleModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button key="cancel" onClick={cancelDelete}>
            Cancel
          </Button>,
          <Button key="confirm" type="primary" danger onClick={handleDeleteConfirmMultiple}>
            Confirm
          </Button>,
        ]}
      >
        Are you sure you want to delete selected items?
      </Modal>
      </div>
    </div>
  );
};

export default VendorCategoryManagement;