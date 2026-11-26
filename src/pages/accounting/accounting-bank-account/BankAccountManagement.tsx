// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useEffect, useRef, useState } from "react";
import type { TableColumnsType, TableProps } from "antd";
import { useForm } from "react-hook-form";
import { Table, Modal, Button, Dropdown, Space } from "antd";
import {
  useCreateAccountingBankAccountMutation,
  useUpdateAccountingBankAccountMutation,
  useDeleteAccountingBankAccountMutation,
  useDeleteMultipleAccountingBankAccountsMutation,
  useGetAccountingBankAccountsQuery,
} from "../../../redux/api/accounting/bankAccountManagementSlice"; // Use the correct API hooks
import { FaEye, FaRegEdit, FaSearch, FaStreetView, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import toast from "react-hot-toast";
import TableLoader from "../../../components/loader/TableLoader";
import { BsThreeDotsVertical } from "react-icons/bs";
import { usePermissions } from "../../../utils/permissionUtils";
import { Link } from "react-router-dom";
import { formatToTwoDecimalPlaces } from "../../../utils/format";
import capitalizeFirstLetter from "../../../utils/capitalizeFirstLetter";
import { formatNumberWithCommasAndDecimals } from "../../../utils/formatNumberWithCommasAndDecimals";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface DataType {
  key?: React.Key;
  name: string;
  accountNumber: string;
  bankName: string;
  status: string;
  uuid: string;
}
const BankAccountManagement = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const { data, isLoading, refetch } = useGetAccountingBankAccountsQuery(""); // Use the bank account data query
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [searchText, setSearchText] = useState("");

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();

    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return inRecord;
  });

  useEffect(() => {
    setTableData(data?.data?.accounts); // Ensure correct data mapping
  }, [data]);

  const {
    register,
    formState: { errors },
    reset,
    getValues,
    setError,
    setValue,
    handleSubmit,
  } = useForm();
  const showModal = () => setIsModalOpen(true);

  const [createBankAccount] = useCreateAccountingBankAccountMutation(); // Correct mutation
  const [updateBankAccount] = useUpdateAccountingBankAccountMutation(); // Correct mutation
  const [deleteBankAccount] = useDeleteAccountingBankAccountMutation(); // Correct mutation
  const [deleteMultipleBankAccounts] =
    useDeleteMultipleAccountingBankAccountsMutation(); // Correct mutation

  const resetForm = () => {
    reset({
      name: "",
      description: "",
      accountNumber: "",
      bankName: "",
      status: "active", // Default status
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
      const response = await deleteBankAccount(selectedUUID).unwrap();
      toast.success(`${response?.message}`);
      setTableData(tableData.filter((item) => item.uuid !== selectedUUID));
    } catch (error) {
      toast.error("Delete failed. Something went wrong!");
      console.error("Delete error:", error);
    }
    setIsModalOpen(false);
    setSelectedUUID(null);
  };

  const cancelDelete = () => {
    setIsModalOpen(false);
    setSelectedUUID(null);
    setIsDeleteModalMultipleVisible(false);
  };

  const handleDelete = (uuid: string) => {
    setSelectedUUID(uuid);
    setIsModalOpen(true);
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
    setIsDeleteModalMultipleVisible(true);
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteMultipleBankAccounts(selectedRowKeys);
        setIsDeleteModalMultipleVisible(false);
        // Ensure the refetch waits for the data to be refreshed
        await refetch();
        if (response.data.status == true) {
          setSelectedRowKeys([]);
          toast.success("Bank accounts deleted successfully!");
        } else {
          toast.error("Failed to delete bank accounts. Please try again.");
        }
      } catch (error) {
        setIsDeleteModalMultipleVisible(false);
        toast.error("Failed to delete bank accounts. Please try again.");
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
        const response = (await updateBankAccount({
          uuid: selectedUUID,
          data,
        })) as any;

        if (response?.error?.data?.status == false) {
          response.error.data.errors.forEach((error: any) => {
            setError(error.path, {
              type: "manual",
              message: error.msg,
            });
            setIsUploading(false);
          });
        } else if (response?.data?.status == true) {
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
        const response = (await createBankAccount(data)) as any;

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
      title: "#",
      key: "serial",
      width: 50,
      dataIndex: "serial",
      fixed: "left",
    },
    {
      title: "Account Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <span
          onClick={() => handleEdit(record)}
          className="hover:text-blue-600 cursor-pointer hover:underline"
        >
          {text || "N/A"}
        </span>
      ),
    },
    {
      title: "Account Balance",
      dataIndex: "balance",
      key: "balance",
      render: (text, record) => {
        // Safely access the tradeSheet and its tradeSheetTypeId
        return (
          '$ ' + formatNumberWithCommasAndDecimals(record?.balance)
        ); 
      },
      sorter: (a, b) => a.balance.localeCompare(b.balance),
    },
    // {
    //   title: "Account Number",
    //   dataIndex: "accountNumber",
    //   key: "accountNumber",
    // },
    // {
    //   title: "Bank Name",
    //   dataIndex: "bankName",
    //   key: "bankName",
    //   sorter: (a, b) => a.bankName.localeCompare(b.bankName),
    // },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: any) => (
        <span
          style={{
            color: status === "active" ? "green" : "red",
          }}
        >
          {capitalizeFirstLetter(status)}
        </span>
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
              (hasPermissionForSlug("edit-bank-account") || true) && {
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
              {
                key: "log",
                label: (
                  <Link
                    to={`/dashboard/accounting/bank-account-log/${record.uuid || ''}`}  // Dynamic UUID path
                    className="flex items-center gap-2 w-full"
                  >
                    <FaEye />
                    Log/Statement
                  </Link>
                ),
              },
              (hasPermissionForSlug("delete-bank-account") || true) && {
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
            ].filter(Boolean), // Filters out any falsey values like `undefined`
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
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Bank Account List</h1>
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
          {(hasPermissionForSlug("create-bank-account") || true) && (
            <button onClick={() => setIsModalOpen(true)} className="primary-btn">
              Add New
            </button>
          )}
          {(hasPermissionForSlug("delete-bank-account") || true) && (
            <button onClick={handleDeleteMultipleClick} className="cancel-btn">
              Delete Selected
            </button>
          )}
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
        title={isEditMode ? "Edit Bank Account" : "Create Bank Account"}
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
            {/* Bank Account Name */}
            <div className="flex flex-col gap-2">
              <label>
                Account Name <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("name", {
                  required: "Account name is required",
                })}
                type="text"
                placeholder="Enter Account Name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm">
                  {errors.name.message as string}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>
                Description <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                {...register("description")}
                placeholder="Enter Description"
                rows="4"
                className="" // Optional: To prevent resizing of the text area
              />
              {errors.description && (
                <p className="text-red-500 text-sm">
                  {errors.description.message as string}
                </p>
              )}
            </div>

            {/* Account Number */}
            {/* <div className="flex flex-col gap-2">
              <label>
                Account Number <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("accountNumber", {
                  required: "Account number is required",
                })}
                type="text"
                placeholder="Enter Account Number"
              />
              {errors.accountNumber && (
                <p className="text-red-500 text-sm">
                  {errors.accountNumber.message as string}
                </p>
              )}
            </div> */}

            {/* Bank Name */}
            {/* <div className="flex flex-col gap-2">
              <label>
                Bank Name <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("bankName", {
                  required: "Bank name is required",
                })}
                type="text"
                placeholder="Enter Bank Name"
              />
              {errors.bankName && (
                <p className="text-red-500 text-sm">
                  {errors.bankName.message as string}
                </p>
              )}
            </div> */}

            {/* Status */}
            <div className="flex flex-col gap-2">
              <label>
                Status <span className="text-red-500 ml-1">*</span>
              </label>
              <select {...register("status")}>
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
    </div>
  );
};

export default BankAccountManagement;
