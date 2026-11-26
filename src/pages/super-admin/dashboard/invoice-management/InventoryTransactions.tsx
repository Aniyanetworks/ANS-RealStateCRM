// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Select,
  Tag,
} from "antd";
import {
  formatDate,
  parseISO,
} from "date-fns";
import type { TableColumnsType } from "antd";
import toast from "react-hot-toast";
import TableLoader from "../../../../components/loader/TableLoader";
import ModalMain from "../../../../components/ui/Modal";
import {
  useGetInventoryQuery,
  useGetInventoryTransactionsQuery,
  useCreateInventoryTransactionMutation,
} from "../../../../redux/api/superadmin/invoice/inventoryDataSlice";
import { useGetAgentListDataQuery } from "../../../../redux/api/superadmin/agent/agentManagementSlice";
import { useAppSelector } from "../../../../redux/hooks";
import { usePermissions } from "../../../../utils/permissionUtils";

const { Option } = Select;

interface TransactionType {
  id: number;
  uuid: string;
  inventoryId: number;
  userId: number;
  transactionType: "give" | "return";
  quantity: number;
  notes: string;
  createdAt: string;
  inventory: {
    id: number;
    productName: string;
    quantity: number;
  };
  user: {
    id: number;
    firstName: string;
    lastName: string;
    name: string;
    email: string;
  };
}

const InventoryTransactions = () => {
  const { hasPermissionForSlug } = usePermissions();
  const { user } = useAppSelector((state) => state.user);
  const navigate = useNavigate();
  const [tableData, setTableData] = useState<TransactionType[]>([]);
  const { data: transactionsData, isLoading, refetch } =
    useGetInventoryTransactionsQuery();
  const { data: inventoryData } = useGetInventoryQuery();
  const { data: agentList } = useGetAgentListDataQuery("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [transactionType, setTransactionType] = useState<"give" | "return">(
    "give"
  );
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit,
    setValue,
    watch,
    control,
  } = useForm();

  const [createInventoryTransaction] = useCreateInventoryTransactionMutation();

  useEffect(() => {
    if (transactionsData?.data?.TransactionData) {
      setTableData(transactionsData.data.TransactionData);
    }
  }, [transactionsData]);

  useEffect(() => {
    if (inventoryData?.data?.InventoryData) {
      const firstInventory = inventoryData.data.InventoryData[0];
      if (firstInventory) {
        setValue("inventoryId", firstInventory.id.toString());
      }
    }
  }, [inventoryData, setValue]);

  // Helper function to get user display name
  const getUserDisplayName = (user: TransactionType["user"]) => {
    if (!user) return "N/A";
    return (
      user.name ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.email ||
      "N/A"
    );
  };

  // Get unique users for filter
  const uniqueUsers = React.useMemo(() => {
    return Array.from(
      new Map(
        tableData
          .filter((record) => record.user)
          .map((record) => [record.userId, getUserDisplayName(record.user)])
      ).entries()
    ).map(([userId, userName]) => ({
      text: userName,
      value: userId,
    }));
  }, [tableData]);

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();
    return (
      record.inventory?.productName?.toLowerCase().includes(searchTerm) ||
      record.user?.name?.toLowerCase().includes(searchTerm) ||
      record.user?.email?.toLowerCase().includes(searchTerm) ||
      record.transactionType?.toLowerCase().includes(searchTerm)
    );
  });

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setValue("inventoryId", "");
    setValue("userId", "");
    setValue("quantity", "");
    setValue("notes", "");
    setTransactionType("give");
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    resetForm();
    showModal();
  };

  const onSubmit = async (formData: any) => {
    setIsUploading(true);
    try {
      const data = {
        inventoryId: parseInt(formData.inventoryId, 10),
        userId: parseInt(formData.userId, 10),
        transactionType: transactionType,
        quantity: parseInt(formData.quantity, 10),
        notes: formData.notes || "",
      };

      const response = await createInventoryTransaction(data).unwrap();

      if (response?.status === true) {
        toast.success(response.message);
        setIsModalOpen(false);
        resetForm();
        refetch();
      } else {
        toast.error(response?.message || "Transaction failed");
      }
    } catch (error: any) {
      if (error?.data?.errors) {
        error.data.errors.forEach((err: any) => {
          toast.error(err.msg || err.message);
        });
      } else {
        toast.error(error?.data?.message || "Transaction failed. Something went wrong!");
      }
      console.error("Error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const columns = React.useMemo<TableColumnsType<TransactionType>>(() => [
    {
      title: "#",
      key: "serial",
      width: 50,
      render: (_, __, index) => index + 1,
      fixed: "left",
    },
    {
      title: "Product Name",
      key: "productName",
      render: (_, record) => (
        <span>{record.inventory?.productName || "N/A"}</span>
      ),
      width: 200,
    },
    {
      title: "User",
      key: "user",
      filters: uniqueUsers,
      onFilter: (value, record) => record.userId === value,
      render: (_, record) => (
        <span>
          {getUserDisplayName(record.user)}
        </span>
      ),
      width: 200,
    },
    {
      title: "Type",
      dataIndex: "transactionType",
      key: "transactionType",
      filters: [
        { text: "Given", value: "give" },
        { text: "Returned", value: "return" },
      ],
      onFilter: (value, record) => record.transactionType === value,
      render: (type: string) => (
        <Tag color={type === "give" ? "red" : "green"}>
          {type === "give" ? "Given" : "Returned"}
        </Tag>
      ),
      width: 120,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity) => <span>{quantity || 0}</span>,
      width: 100,
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      render: (notes) => (
        <span className="truncate max-w-xs">{notes || " "}</span>
      ),
      width: 200,
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (
        <span>
          {date ? formatDate(parseISO(date), "dd MMMM yyyy") : "N/A"}
        </span>
      ),
      width: 180,
    },
  ], [uniqueUsers]);

  const selectedInventoryId = watch("inventoryId");
  const selectedInventory = inventoryData?.data?.InventoryData?.find(
    (inv: any) => inv.id.toString() === selectedInventoryId
  );

  return (
    <div className="pb-32">
      <div className="flex items-center justify-between gap-5 xl:gap-10 mb-5 p-1">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/dashboard/marketplace/inventory")} className="primary-btn">
            â† Back to Inventory
          </button>
          <h1>Inventory Logs</h1>
        </div>
        <div className="w-1/2">
          <input
            type="text"
            placeholder="Search from table..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="global-search"
          />
        </div>
        <div className="flex">
          {(user?.userType === "superAdmin" || user?.userType === "admin") &&
            hasPermissionForSlug("create-agent-marketplace") && (
              <button onClick={showModal} className="primary-btn mx-3">
                Add New
              </button>
            )}
        </div>
      </div>

      {/* ==== transactions table ========= */}
      <div>
        {isLoading ? (
          <TableLoader />
        ) : (
          <Table
            scroll={{ x: "max-content" }}
            columns={columns}
            dataSource={filteredData}
            pagination={{ pageSize: 20 }}
            rowKey="uuid"
          />
        )}
      </div>

      {/* ======== create transaction ======== */}
      <ModalMain
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        handleOk={handleSubmit(onSubmit)}
        title="Create Transaction"
        isLoading={isUploading}
        modalClass={"lg:!w-[50%] !z-[10000]"}
      >
        <form className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-medium">
                Transaction Type <span className="text-red-500">*</span>
              </label>
              <Select
                value={transactionType}
                onChange={(value) => setTransactionType(value)}
                className="w-full"
                style={{ width: "100%" }}
              >
                <Option value="give">Give Product</Option>
                <Option value="return">Return Product</Option>
              </Select>
            </div>

            <div>
              <label className="text-[13px] font-medium">
                Product <span className="text-red-500">*</span>
              </label>
              <Controller
                name="inventoryId"
                control={control}
                rules={{ required: "Product is required" }}
                render={({ field }) => (
                  <Select
                    {...field}
                    className="w-full"
                    style={{ width: "100%" }}
                    placeholder="Select a product"
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)
                        ?.toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    {inventoryData?.data?.InventoryData?.map((inventory: any) => (
                      <Option key={inventory.id} value={inventory.id.toString()}>
                        {inventory.productName} (Available: {inventory.quantity})
                      </Option>
                    ))}
                  </Select>
                )}
              />
              {errors.inventoryId && (
                <p className="text-red-500">
                  {errors.inventoryId.message as string}
                </p>
              )}
              {selectedInventory && transactionType === "give" && (
                <p className="text-sm text-gray-500 mt-1">
                  Available quantity: {selectedInventory.quantity}
                </p>
              )}
            </div>

            <div>
              <label className="text-[13px] font-medium">
                User <span className="text-red-500">*</span>
              </label>
              <Controller
                name="userId"
                control={control}
                rules={{ required: "User is required" }}
                render={({ field }) => (
                  <Select
                    {...field}
                    className="w-full"
                    style={{ width: "100%" }}
                    placeholder="Select a user"
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as unknown as string)
                        ?.toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    {agentList?.data?.userData?.map((agent: any) => {
                      const userId = agent.user?.id || agent.id;
                      const userName = agent.user?.name ||
                        `${agent.user?.firstName || ""} ${agent.user?.lastName || ""}`.trim() ||
                        agent.name ||
                        `${agent.firstName || ""} ${agent.lastName || ""}`.trim() ||
                        agent.user?.email ||
                        agent.email ||
                        "N/A";
                      return (
                        <Option key={userId} value={userId.toString()}>
                          {userName}
                        </Option>
                      );
                    })}
                  </Select>
                )}
              />
              {errors.userId && (
                <p className="text-red-500">{errors.userId.message as string}</p>
              )}
            </div>

            <div>
              <label className="text-[13px] font-medium">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                className="global-input"
                {...register("quantity", {
                  required: "Quantity is required",
                  min: { value: 1, message: "Quantity must be at least 1" },
                  validate: (value) => {
                    if (transactionType === "give" && selectedInventory) {
                      if (parseInt(value, 10) > selectedInventory.quantity) {
                        return "Quantity cannot exceed available inventory";
                      }
                    }
                    return true;
                  },
                })}
                placeholder="Enter quantity"
              />
              {errors.quantity && (
                <p className="text-red-500">
                  {errors.quantity.message as string}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-[13px] font-medium">Notes</label>
            <textarea
              {...register("notes")}
              rows={4}
              className="global-input"
              placeholder="Enter notes (optional)"
            />
          </div>
        </form>
      </ModalMain>
    </div>
  );
};

export default InventoryTransactions;
