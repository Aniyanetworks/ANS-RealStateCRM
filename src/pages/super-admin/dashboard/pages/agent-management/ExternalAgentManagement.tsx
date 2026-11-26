// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useEffect, useRef, useState } from "react";
import type { TableColumnsType, TableProps } from "antd";
import { useForm } from "react-hook-form";
import { Table, Modal, Button, Dropdown, Space } from "antd";
import { FaEye, FaRegEdit, FaSearch, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import toast from "react-hot-toast";
import {
  useGetCitiesQuery,
  // useGetCountriesQuery,
  useGetStatesQuery,
} from "../../../../../redux/api/common/countryStateCitySlice";
import TableLoader from "../../../../../components/loader/TableLoader";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaShareNodes, FaSpaghettiMonsterFlying } from "react-icons/fa6";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  formatPhoneNumber,
  formatPostalCode,
} from "../../../../../utils/format";
import ReactQuill from "react-quill-new";
import 'react-quill-new/dist/quill.snow.css';
import {
  useCreateRoleMutation,
  useDeleteMultipleRolesMutation,
  useDeleteRoleMutation,
  useGetRoleListQuery,
  useUpdateRoleMutation,
} from "../../../../../redux/api/superadmin/roleManagementSlice";
import { Link, NavLink } from "react-router-dom";
import { formatStringCamelCasecapitalize } from "../../../../../utils/stringUtils";
import { usePermissions } from "../../../../../utils/permissionUtils";
import { useGetExternalAgentListQuery,useUpdateExternalAgentMutation, useDeleteExternalAgentMutation, useDeleteMultipleExternalAgentMutation } from "../../../../../redux/api/agent/externalAgent";
type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface DataType {
  key?: React.Key;
  name: string;
  userType: string;
  status: string;
  uuid: string;
}
const ExternalAgentManagement = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const { data, isLoading, refetch } = useGetExternalAgentListQuery("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModal2Open, setIsModal2Open] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);

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
    setTableData(data?.data?.externalAgents);
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
  const [updateExternalAgent] = useUpdateExternalAgentMutation();
  const [deleteExternalAgent] = useDeleteExternalAgentMutation();
  const [deleteMultipleExternalAgent] = useDeleteMultipleExternalAgentMutation();

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
    setSelectedUUID(recoard?.id);
    showModal();
  };

  const shareIt = (recoard: DataType) => {
    reset(recoard);
    setSelectedUUID(recoard?.id);
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
      const response = await deleteExternalAgent(selectedUUID).unwrap();
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
        const response = await deleteMultipleExternalAgent(selectedRowKeys);
        setIsDeleteModalMultipleVisible(false);
        // Ensure the refetch waits for the data to be refreshed
        await refetch();
        if (response.data.status == true) {
          setSelectedRowKeys([]);
          toast.success("Item deleted successfully!");
        } else {
          toast.error("Failed to delete Item. Please try again.");
        }
      } catch (error) {
        setIsDeleteModalMultipleVisible(false);
        toast.error("Failed to delete Item. Please try again.");
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
        const response = (await updateExternalAgent({
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
    //   try {
    //     const response = (await createRole(data)) as any;

    //     if (response?.error?.data?.status == false) {
    //       setIsUploading(false);
    //       response.error.data.errors
    //         ? response.error.data.errors.forEach((error: any) => {
    //             setError(error.path, {
    //               type: "manual",
    //               message: error.msg,
    //             });
    //           })
    //         : toast.error(`${response?.error.data?.message}`);
    //     } else if (response?.data?.status == true) {
    //       toast.success(`${response?.data?.message}`);
    //       setIsModalOpen(false);
    //       resetForm();
    //       setIsUploading(false);
    //     } else {
    //       resetForm();
    //       setIsUploading(false);
    //     }
    //   } catch (error) {
    //     console.error("Submission error:", error);
    //     setIsUploading(false);
    //   }
    }
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: "Agent Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      sorter: (a, b) => a.phone.localeCompare(b.phone),
    },
    {
      title: "Actions",
      dataIndex: "id",
      key: "actions",
      render: (id, recoard) => (
        <Dropdown
          menu={{
            items: [
              hasPermissionForSlug("edit-agent") && {
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
              }, // Empty array if condition is false,
              ,
              hasPermissionForSlug("delete-agent") && {
                key: "delete",
                label: (
                  <button
                    onClick={() => handleDelete(id)}
                    aria-label="Delete"
                    className="flex items-center gap-2"
                  >
                    <MdDelete size={17} />
                    Delete
                  </button>
                ),
              }, // Empty array if condition is false
              ,
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
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">External Agent</h1>
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
            <NavLink to="/dashboard/super-admin/agent-management" className="primary-btn">← Back to Agents</NavLink>
            {hasPermissionForSlug("delete-agent") && (
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
        title={isEditMode ? "Edit External Agent" : "Create External Agent"}
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
                First Name <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("firstName", {
                  required: "First name is required",
                })}
                type="text"
                placeholder="Enter First Name"
                className=""
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm">
                  {errors.firstName.message as string}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>
                Last Name <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("lastName", {
                  required: "Last name is required",
                })}
                type="text"
                placeholder="Enter Last Name"
                className=""
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm">
                  {errors.lastName.message as string}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>
                Email <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("email", {
                  required: "Email is required",
                })}
                type="text"
                placeholder="Enter Email"
                className=""
              />
              {errors.email && (
                <p className="text-red-500 text-sm">
                  {errors.email.message as string}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label>Phone Number</label>
              <input
                {...register(`phone`)}
                type="text"
                placeholder="+1 (XXX) XXX-XXXX"
                className="border border-gray-300 p-2 rounded"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const formattedPhoneNumber = formatPhoneNumber(
                    e.target.value
                  );
                  setValue(`phone`, formattedPhoneNumber);
                }}
              />
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

export default ExternalAgentManagement;
