// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import type { TableColumnsType, TableProps } from "antd";
import { Button, Dropdown, Modal, Space, Table } from "antd";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaEye, FaRegEdit, FaSearch, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import 'react-quill-new/dist/quill.snow.css';
import { Link } from "react-router-dom";
import TableLoader from "../../../../../components/loader/TableLoader";
import {
  useCreateRoleMutation,
  useDeleteMultipleRolesMutation,
  useDeleteRoleMutation,
  useGetRoleListQuery,
  useUpdateRoleMutation,
} from "../../../../../redux/api/superadmin/roleManagementSlice";
import { usePermissions } from "../../../../../utils/permissionUtils";
import { formatStringCamelCasecapitalize } from "../../../../../utils/stringUtils";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface DataType {
  key?: React.Key;
  name: string;
  userType: string;
  status: string;
  uuid: string;
}
const RoleManagement = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const { data, isLoading, refetch } = useGetRoleListQuery("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModal2Open, setIsModal2Open] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [deleteMultipleRoles] = useDeleteMultipleRolesMutation();
  const [searchText, setSearchText] = useState("");
  const lawyerRef = useRef<HTMLDivElement>(null);

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();

    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return inRecord;
  });

  useEffect(() => {
    setTableData(data?.data?.roles);
  }, [data]);

  const {
    register,
    formState: { errors },
    reset,
    getValues,
    setError,
    setValue,
    handleSubmit,
    watch,
  } = useForm({ defaultValues: { countryId: 39 } });

  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

  const resetForm = () => {
    reset({
      name: "",
      userType: "",
    });
  };

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedUUID(null);
  };

  const handleEdit = (recoard: DataType) => {
    reset(recoard);
    setIsEditMode(true);
    setSelectedUUID(recoard?.uuid);
    showModal();
  };

  const shareIt = (recoard: DataType) => {
    reset(recoard);
    setSelectedUUID(recoard?.uuid);
    showModal2();
  };

  const handleCancel2 = () => {
    resetForm();
    setRecipientNote("");
    setRecipientEmail("");
    setValue("comment", "");
    setValue("recipientEmail", "");
    setIsModal2Open(false);
  };

  const confirmDelete = async () => {
    try {
      const response = await deleteRole(selectedUUID).unwrap();
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
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
      {
        key: "odd",
        text: "Select Odd Row",
        onSelect: (changeableRowKeys) => {
          let newSelectedRowKeys = [];
          newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
            if (index % 2 !== 0) {
              return false;
            }
            return true;
          });
          setSelectedRowKeys(newSelectedRowKeys);
        },
      },
      {
        key: "even",
        text: "Select Even Row",
        onSelect: (changeableRowKeys) => {
          let newSelectedRowKeys = [];
          newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
            if (index % 2 !== 0) {
              return true;
            }
            return false;
          });
          setSelectedRowKeys(newSelectedRowKeys);
        },
      },
    ],
  };

  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true); // Show delete confirmation modal
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteMultipleRoles(selectedRowKeys);
        setIsDeleteModalMultipleVisible(false);
        // Ensure the refetch waits for the data to be refreshed
        await refetch();
        if (response.data.status == true) {
          setSelectedRowKeys([]);
          toast.success("Announcement deleted successfully!");
        } else {
          toast.error("Failed to delete announcement. Please try again.");
        }
      } catch (error) {
        setIsDeleteModalMultipleVisible(false);
        toast.error("Failed to delete announcement. Please try again.");
      }
    } else {
      toast.error("Please Select Items.");
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
        const response = (await updateRole({
          uuid: selectedUUID,
          data,
        })) as any;

        if (response?.error?.data?.status == false) {
          response.error.data.errors.forEach((error: any) => {
            setError(error.path, {
              type: "manual",
              message: error.msg,
            });
          });
          setIsUploading(false);
        } else if (response?.data?.status == true) {
          toast.success(`${response?.data?.message}`);
          setIsModalOpen(false);
          setIsEditMode(false);
          setSelectedUUID(null);
          resetForm();
          setIsUploading(false);
          setPostalCode("");
        } else {
          resetForm();
          setIsEditMode(false);
          setIsUploading(false);
        }
      } catch (error) {
        // toast.error("Update failed. Something went wrong!");
        console.error("Update error:", error);
        setIsUploading(false);
      }
    } else {
      try {
        const response = (await createRole(data)) as any;

        if (response?.error?.data?.status == false) {
          setIsUploading(false);
          response.error.data.errors
            ? response.error.data.errors.forEach((error: any) => {
              setError(error.path, {
                type: "manual",
                message: error.msg,
              });
            })
            : toast.error(`${response?.error.data?.message}`);
        } else if (response?.data?.status == true) {
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
      title: "Role Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name,uuid) => (
        <Link className="hover:text-blue-600 cursor-pointer hover:underline"
                        to={`/dashboard/super-admin/role-permission/permission-management/${uuid}`}
                      >{name || "N/A"}</Link>
      ),
    },
    // {
    //   title: "User Type",
    //   dataIndex: "userType",
    //   key: "userType",
    //   sorter: (a, b) => a.userType.localeCompare(b.userType),
    // },
    {
      title: "Import From",
      dataIndex: "importRoleName",
      key: "importRoleName",
      render: (text, record) => {
        // Check if it's a default system role and display the appropriate message
        if (record?.isDefault === "yes") {
          return "This is a default system role and is not eligible for modification.";
        }
        // Otherwise, format and display the import role name
        return `${formatStringCamelCasecapitalize(
          record?.importRoleName || "N/A"
        )}`;
      },
      sorter: (a, b) => a.importRoleName.localeCompare(b.importRoleName),
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
      render: (uuid, recoard) => (
        <Dropdown
          menu={{
            items: [
              ...(recoard?.isDefault === "no"
                ? [
                  hasPermissionForSlug("edit-role-permission") && {
                    key: "edit",
                    label: (
                      <button
                        onClick={() => handleEdit(recoard)}
                        aria-label="Delete"
                        className="flex items-center gap-2"
                      >
                        <FaRegEdit />
                        Edit
                      </button>
                    ),
                  },
                ]
                : []), // Empty array if condition is false,

                hasPermissionForSlug("edit-role-permission") && {
                    key: "permission",
                    label: (
                      <Link
                        className="flex items-center gap-2"
                        to={`/dashboard/super-admin/role-permission/permission-management/${uuid}`}
                      >
                        <FaEye /> Permission
                      </Link>
                    ),
                },

             /*  ...(recoard?.isDefault === "no"
                ? [
                  hasPermissionForSlug("edit-role-permission") && {
                    key: "permission",
                    label: (
                      <Link
                        className="flex items-center gap-2"
                        to={`/dashboard/super-admin/role-permission/permission-management/${uuid}`}
                      >
                        <FaEye /> Permission
                      </Link>
                    ),
                  },
                ]
                : []),  */
              // Conditionally add the delete button if recoard?.isDefault is 'no'
              ...(recoard?.isDefault === "no"
                ? [
                  hasPermissionForSlug("delete-role-permission") && {
                    key: "delete",
                    label: (
                      <button
                        onClick={() => handleDelete(uuid)}
                        aria-label="Delete"
                        className="flex items-center gap-2"
                      >
                        <MdDelete size={17} />
                        Delete
                      </button>
                    ),
                  },
                ]
                : []), // Empty array if condition is false
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
  const showModal2 = () => setIsModal2Open(true);

  // serial number in the table
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
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Role List</h1>
          <div className="flex-1" />
          <div className="relative flex-shrink-0" style={{ width: 170 }}>
            <FaSearch className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: 10, left: 8 }} />
            <input type="text" placeholder="Search..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ paddingLeft: 26, paddingRight: searchText ? 22 : 8, paddingTop: 4, paddingBottom: 4, width: "100%" }} />
            {searchText && (
              <button type="button" onClick={() => setSearchText("")} className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" style={{ right: 6 }}>
                <FaTimes />
              </button>
            )}
          </div>
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasPermissionForSlug("create-role-permission") && (
              <button onClick={showModal} className="primary-btn">Add New</button>
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
      </div>

      <Modal
        onCancel={handleCancel}
        open={isModalOpen}
        onOk={handleSubmit(onSubmit)}
        title={isEditMode ? "Edit Role" : "Create Role"}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {/* Lawyer Name */}
            <div className="flex flex-col gap-2">
              <label>
                Role Name <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("name", {
                  required: "Role name is required",
                })}
                type="text"
                placeholder="Enter Role Name"
                className=""
              />
              {errors.name && (
                <p className="text-red-500 text-sm">
                  {errors.name.message as string}
                </p>
              )}
            </div>

            {/* <div className="flex flex-col gap-2">
              <label>
                User Type <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                {...register("userType", { required: "User type is required" })}
              >
                <option value="">Select User Type</option>
                <option value="superAdmin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="agent">Agent</option>
                <option value="accountant">Accountant</option>
                <option value="client">Client</option>
              </select>
              {errors.userType && (
                <p className="text-red-500 text-sm">
                  {errors.userType.message as string}
                </p>
              )}
            </div> */}

            <div className="flex flex-col gap-2">
              <label>Import Role</label>
              <select {...register("importRoleId")}>
                <option value="">Import Role</option>
                {tableData?.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {errors.importRoleId && (
                <p className="text-red-500 text-sm">
                  {errors.importRoleId.message as string}
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
                <option value="active" selected>
                  Active
                </option>
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

      {/* Delete Multiple Confirmation Modal */}
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
  );
};

export default RoleManagement;
