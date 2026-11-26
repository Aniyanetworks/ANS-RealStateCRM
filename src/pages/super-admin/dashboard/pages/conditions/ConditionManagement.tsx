/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import {  useState } from "react";
import type { TableColumnsType, TableProps } from "antd";
import { useForm } from "react-hook-form";
import { Table, Modal, Button, Dropdown, Space, Tooltip } from "antd";
import {
  useGetConditionTypeQuery,
  useCreateConditionTypeMutation,
  useUpdateConditionTypeMutation,
  useDeleteMultipleConditionTypeMutation,
} from "../../../../../redux/api/superadmin/conditionDataSlice";
import { FaRegEdit, FaSearch, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import toast from "react-hot-toast";
import TableLoader from "../../../../../components/loader/TableLoader";
import { BsThreeDotsVertical } from "react-icons/bs";
import { usePermissions } from "../../../../../utils/permissionUtils";

type TableRowSelection<T extends object = object> = TableProps<T>["rowSelection"];

interface ConditionType {
  id: number;
  condition: string;
}

const ConditionTypeManagement = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] = useState(false);
  const [searchText, setSearchText] = useState(""); // Search state

  // API hooks
  const { data, isLoading, refetch } = useGetConditionTypeQuery("");
  const [createConditionType] = useCreateConditionTypeMutation();
  const [updateConditionType] = useUpdateConditionTypeMutation();
  const [deleteMultipleConditionType] = useDeleteMultipleConditionTypeMutation();

  // Form
  const {
    register,
    formState: { errors },
    reset,
    getValues,
    setError,
    handleSubmit,
  } = useForm({ defaultValues: { condition: "" } });

  // Table data
  const conditionTypes = data?.data?.ConditionType || [];

  // Filtered data for search
  const filteredData = conditionTypes.filter((record: ConditionType) =>
    record.condition.toLowerCase().includes(searchText.toLowerCase())
  );

  // Reset form
  const resetForm = () => {
    reset({ condition: "" });
  };

  // Modal handlers
  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedId(null);
  };

  const handleEdit = (record: ConditionType) => {
    reset(record);
    setIsEditMode(true);
    setSelectedId(record.id);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteMultipleConditionType([selectedId]);
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

  const rowSelection: TableRowSelection<ConditionType> = {
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
        await deleteMultipleConditionType(selectedRowKeys);
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

  // Create/Edit submit
  const onSubmit = async () => {
    const formData = getValues();
    if (isEditMode) {
      try {
        await updateConditionType({ id: selectedId, ...formData });
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
        await createConditionType(formData);
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
  const columns: TableColumnsType<ConditionType> = [
    {
      title: "Condition",
      dataIndex: "condition",
      key: "condition",
      sorter: (a, b) => a.condition.localeCompare(b.condition),
      ellipsis: true,
      render: (text: string, record: ConditionType) => (
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
              hasPermissionForSlug("edit-condition-type") && {
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
              hasPermissionForSlug("delete-condition-type") && {
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
          <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Condition Types</h1>
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
            <button onClick={() => setIsModalOpen(true)} className="primary-btn">Add New</button>
            <button onClick={handleDeleteMultipleClick} className="cancel-btn">Delete Selected</button>
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
      <Modal
        onCancel={handleCancel}
        open={isModalOpen}
        title={isEditMode ? "Edit Condition Type" : "Create Condition Type"}
        width={"400px"}
        footer={[
          <button key="cancel" className="cancel-btn mr-1" onClick={handleCancel}>
            Cancel
          </button>,
          <button key="confirm" className="primary-btn" onClick={handleSubmit(onSubmit)} style={{ marginLeft: "8px" }}>
            Submit
          </button>,
        ]}
      >
        <form className="space-y-3">
          <div className="flex flex-col gap-2">
            <label>
              Condition <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              {...register("condition", { required: "Condition is required" })}
              type="text"
              placeholder="Enter Condition"
              className=""
            />
            {errors.condition && (
              <p className="text-red-500 text-sm">{errors.condition.message as string}</p>
            )}
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

export default ConditionTypeManagement;
