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
  useGetSpecificAccountingBankAccountQuery
} from "../../../redux/api/accounting/bankAccountManagementSlice";
import { FaEye, FaRegEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import toast from "react-hot-toast";
import TableLoader from "../../../components/loader/TableLoader";
import { BsThreeDotsVertical } from "react-icons/bs";
import { usePermissions } from "../../../utils/permissionUtils";
import { NavLink, useParams } from "react-router-dom";
import { formatNumberWithCommasAndDecimals } from "../../../utils/formatNumberWithCommasAndDecimals";
import capitalizeFirstLetter from "../../../utils/capitalizeFirstLetter";
import capitalizeAllLetters from "../../../utils/capitalizeAllLetters";

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
const BankAccountLog = () => {
  const { uuid } = useParams<{ uuid?: string }>();
  const { hasPermissionForSlug } = usePermissions();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const { data, isLoading, refetch } = useGetSpecificAccountingBankAccountQuery(uuid);
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
    setTableData(data?.data?.account?.bankAccountLog);
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

  const [createBankAccount] = useCreateAccountingBankAccountMutation();
  const [updateBankAccount] = useUpdateAccountingBankAccountMutation();
  const [deleteBankAccount] = useDeleteAccountingBankAccountMutation();
  const [deleteMultipleBankAccounts] =
    useDeleteMultipleAccountingBankAccountsMutation();

  const resetForm = () => {
    reset({
      name: "",
      description: "",
      accountNumber: "",
      bankName: "",
      status: "active",
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
      title: "Transaction ID",
      dataIndex: "transactionId",
      key: "transactionId",
    },
    {
      title: "Transaction Type",
      dataIndex: "transactionType",
      key: "transactionType",
      sorter: (a, b) => a.transactionType.localeCompare(b.transactionType),
    },
    {
      title: "Transaction Direction",
      dataIndex: "transactionDirection",
      key: "transactionDirection",
      sorter: (a, b) => a.transactionDirection.localeCompare(b.transactionDirection),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: any, record) => `$ ${formatNumberWithCommasAndDecimals(amount)}`,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Balance Before Change",
      dataIndex: "balanceBeforeChange",
      key: "balanceBeforeChange",
      render: (balanceBeforeChange: any, record) => `$ ${formatNumberWithCommasAndDecimals(balanceBeforeChange)}`,
    },
    {
      title: "Balance After Change",
      dataIndex: "balanceAfterChange",
      key: "balanceAfterChange",
      render: (balanceAfterChange: any, record) => `$ ${formatNumberWithCommasAndDecimals(balanceAfterChange)}`,
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (paymentMethod: any, record) => `$ ${capitalizeAllLetters(paymentMethod)}`,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (description: any) => description || 'N/A',
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: any) => new Date(createdAt).toLocaleString(),
    },
  ];
  
  const tableSourceData = filteredData?.map((item: any, index: number) => {
    return {
      ...item,
      serial: index + 1,
    };
  });

  return (
    <div className="pb-32">
      <div className="flex items-center justify-between gap-5 xl:gap-10 mb-5 p-1">
        <h1>Bank Account Log ({data?.data?.account?.name})</h1>
        <div className="w-1/2">
          <input
            type="text"
            placeholder="Search from table..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="global-search "
          />
        </div>
        <div className="flex">
          <NavLink to="/dashboard/accounting/bank-account-management" className="back-btn mx-3">
            <button className="primary-btn mx-3">Go Back</button>
          </NavLink>
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
                className=""
              />
              {errors.description && (
                <p className="text-red-500 text-sm">
                  {errors.description.message as string}
                </p>
              )}
            </div>



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

export default BankAccountLog;
