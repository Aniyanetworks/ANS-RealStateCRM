// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useEffect, useState } from "react";
import type { TableColumnsType, TableProps } from "antd";
import { useForm } from "react-hook-form";
import { Table, Modal, Button, Dropdown, Space } from "antd";

import { FaEye, FaRegEdit, FaSearch, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import toast from "react-hot-toast";

import { BsThreeDotsVertical } from "react-icons/bs";
import 'react-quill-new/dist/quill.snow.css';
import {
  useCreateExpenseCategoryMutation,
  useDeleteMultipleExpenseCategoriesMutation,
  useDeleteExpenseCategoryMutation,
  useGetExpenseCategoryListQuery,
  useUpdateExpenseCategoryMutation,
} from "../../redux/api/superadmin/expenses/expenseCategorySlice";
import TableLoader from "../../components/loader/TableLoader";
import { usePermissions } from "../../utils/permissionUtils";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface DataType {
  key?: React.Key;
  name: string;
  status: string;
  uuid: string;
}

const ExpenseCategoryManagement = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const { data, isLoading, refetch } = useGetExpenseCategoryListQuery("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [deleteMultipleExpenseCategories] =
    useDeleteMultipleExpenseCategoriesMutation();
  const [searchText, setSearchText] = useState("");

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();

    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return inRecord;
  });

  useEffect(() => {
    setTableData(data?.data?.categories);
  }, [data]);

  const {
    register,
    formState: { errors },
    reset,
    getValues,
    setError,
    handleSubmit,
  } = useForm();

  const [createExpenseCategory] = useCreateExpenseCategoryMutation();
  const [updateExpenseCategory] = useUpdateExpenseCategoryMutation();
  const [deleteExpenseCategory] = useDeleteExpenseCategoryMutation();

  const resetForm = () => {
    reset({
      name: "",
      status: "",
    });
  };

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedUUID(null);
  };

  const handleEdit = (record: DataType) => {
    reset(record);
    setIsEditMode(true);
    setSelectedUUID(record?.uuid);
    showModal();
  };

  const confirmDelete = async () => {
    try {
      const response = await deleteExpenseCategory(selectedUUID).unwrap();
      toast.success(`${response?.message}`);
      setTableData(tableData.filter((item) => item.uuid !== selectedUUID));
    } catch (error) {
      toast.error("Delete failed. Something went wrong!");
      console.error("Delete error:", error);
    }
    setIsModalVisible(false);
    setSelectedUUID(null);
  };

  const cancelDelete = () => {
    setIsModalVisible(false);
    setSelectedUUID(null);
    setIsDeleteModalMultipleVisible(false);
  };

  const handleDelete = (uuid: string) => {
    setSelectedUUID(uuid);
    setIsModalVisible(true);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<DataType> = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteMultipleExpenseCategories(selectedRowKeys as string[]);
        setIsDeleteModalMultipleVisible(false);
        await refetch();
        if (response.data.status == true) {
          setSelectedRowKeys([]);
          toast.success("Categories deleted successfully!");
        } else {
          toast.error("Failed to delete categories. Please try again.");
        }
      } catch {
        setIsDeleteModalMultipleVisible(false);
        toast.success("Categories deleted successfully!");
      }
    } else {
      toast.error("Please select items.");
    }
  };

  const onSubmit = async () => {
    setIsUploading(true);
    const data = getValues();

    if (isEditMode) {
      try {
        if (!selectedUUID) {
          throw new Error("UUID is null");
        }
        const response = await updateExpenseCategory({
          uuid: selectedUUID,
          data,
        });

        if (response?.error?.data?.status === false) {
          response.error.data.errors.forEach((error: any) => {
            setError(error.path, {
              type: "manual",
              message: error.msg,
            });
          });
          setIsUploading(false);
        } else if (response?.data?.status === true) {
          toast.success(`${response?.data?.message}`);
          setIsModalOpen(false);
          setIsEditMode(false);
          setSelectedUUID(null);
          resetForm();
          setIsUploading(false);
        } else {
          resetForm();
          setIsEditMode(false);
          setIsUploading(false);
        }
      } catch (error) {
        console.error("Update error:", error);
        setIsUploading(false);
      }
    } else {
      try {
        const response = await createExpenseCategory(data);

        if (response?.error?.data?.status === false) {
          setIsUploading(false);
          response.error.data.errors?.forEach((error: any) => {
            setError(error.path, {
              type: "manual",
              message: error.msg,
            });
          });
        } else if (response?.data?.status === true) {
          toast.success(`${response?.data?.message}`);
          setIsModalOpen(false);
          resetForm();
          setIsUploading(false);
        } else {
          resetForm();
          setIsUploading(false);
        }
      } catch (error) {
        console.error("Submission error:", error);
        setIsUploading(false);
      }
    }
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: "Category Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: any) => (
        <span>{status ? status.charAt(0).toUpperCase() + status.slice(1) : "N/A"}</span>
      ),
    },
    {
      title: "Actions",
      dataIndex: "uuid",
      key: "actions",
      render: (uuid, record) => (
        <Dropdown
          menu={{
            items: [
              hasPermissionForSlug("edit_expense_category") && {
                key: "edit",
                label: (
                  <button
                    onClick={() => handleEdit(record)}
                    aria-label="Edit"
                    className="flex items-center gap-2"
                  >
                    <FaRegEdit />
                    Edit
                  </button>
                ),
              },
              hasPermissionForSlug("delete_expense_category") &&{
                key: "delete",
                label: (
                  <button
                    onClick={() => handleDelete(uuid)}
                    aria-label="Delete"
                    className="flex items-center gap-2"
                  >
                    <MdDelete size={14} />
                    Delete
                  </button>
                ),
              },
            ],
          }}
        >
          <a onClick={(e) => e.preventDefault()}>
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

  const showModal = () => setIsModalOpen(true);

  const tableSourceData = filteredData?.map((item: any, index: number) => {
    return {
      ...item,
      serial: index + 1,
    };
  });

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Expense Categories</h1>
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
            {hasPermissionForSlug("add_expense_category") && (
              <button onClick={showModal} className="primary-btn">Add New</button>
            )}
            {hasPermissionForSlug("delete_expense_category") && (
              <button
                onClick={() => setIsDeleteModalMultipleVisible(true)}
                className="cancel-btn"
                disabled={selectedRowKeys.length === 0}
              >
                Delete Selected
              </button>
            )}
          </div>
        </div>

        <div>
          {isLoading ? (
            <TableLoader />
          ) : (
            <Table
              rowSelection={rowSelection}
              rowKey="uuid"
              scroll={{ x: "max-content" }}
              columns={columns}
              dataSource={tableSourceData}
              pagination={{ pageSize: 20 }}
            />
          )}
        </div>

      <Modal
        onCancel={handleCancel}
        open={isModalOpen}
        onOk={handleSubmit(onSubmit)}
        title={isEditMode ? "Edit Expense Category" : "Create Expense Category"}
        width={"800px"}
        loading={isUploading}
        footer={[
          <button
            key="cancel"
            className="cancel-btn mr-1"
            onClick={handleCancel}
          >
            Cancel
          </button>,
          <button
            key="confirm"
            className="primary-btn"
            onClick={handleSubmit(onSubmit)}
            style={{ marginLeft: "8px" }}
          >
            Submit
          </button>,
        ]}
      >
        <form className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label>
                Category Name <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("name", {
                  required: "Category name is required",
                })}
                type="text"
                placeholder="Enter Category Name"
                className=""
              />
              {errors.name && (
                <p className="text-red-500 text-sm">
                  {errors.name.message as string}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>
                Status <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                {...register("status", { required: "Status is required" })}
              >
                <option value="">Select Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {errors.status && (
                <p className="text-red-500 text-sm">
                  {errors.status.message as string}
                </p>
              )}
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        title="Confirm Deletion"
        open={isModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={confirmDelete}
            style={{ marginLeft: "8px" }}
          >
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
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={handleDeleteConfirmMultiple}
          >
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

export default ExpenseCategoryManagement;
