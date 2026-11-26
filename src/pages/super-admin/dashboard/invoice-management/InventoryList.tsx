// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Select,
  Space,
  Dropdown,
  Tooltip,
  Popover,
} from "antd";
import type { TableColumnsType } from "antd";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaRegEdit, FaEye, FaSearch, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { FaArrowLeft, FaArrowRight, FaChevronDown, FaChevronUp } from "react-icons/fa";
import toast from "react-hot-toast";
import TableLoader from "../../../../components/loader/TableLoader";
import ModalMain from "../../../../components/ui/Modal";
import {
  useGetInventoryQuery,
  useGetInventoryTransactionsQuery,
  useCreateUpdateInventoryMutation,
  useDeleteInventoryMutation,
  useDeleteInventoryMultipleMutation,
  useCreateInventoryTransactionMutation,
} from "../../../../redux/api/superadmin/invoice/inventoryDataSlice";
import { useGetAgentListDataQuery } from "../../../../redux/api/superadmin/agent/agentManagementSlice";
import { useGetActiveBranchListDataQuery } from "../../../../redux/api/superadmin/branch/Branchmanagementslice";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useAppSelector } from "../../../../redux/hooks";
import { usePermissions } from "../../../../utils/permissionUtils";
import {
  formatDate,
  parseISO,
} from "date-fns";
import { baseUrl } from "../../../../utils/constant";

const { Option } = Select;

interface DataType {
  id: number;
  uuid: string;
  productName: string;
  quantity: number;
  description: string;
  createdAt: string;
  image?: string;
}

interface TransactionLogType {
  id: number;
  uuid: string;
  inventoryId: number;
  userId: number;
  transactionType: "give" | "return";
  quantity: number;
  notes: string;
  createdAt: string;
  user?: {
    id: number;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
  };
}

const InventoryList = () => {
  const { hasPermissionForSlug } = usePermissions();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.user);
  const [tableData, setTableData] = useState<DataType[]>([]);
  const { data, isLoading, refetch } = useGetInventoryQuery();
  const { data: transactionsData } = useGetInventoryTransactionsQuery();
  const { data: agentList } = useGetAgentListDataQuery("");
  const isSuperAdmin = user?.userType === "superAdmin";
  const { data: activeBranches, isLoading: branchesLoading } = useGetActiveBranchListDataQuery("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | "null">("null");
  const [selectedRecord, setSelectedRecord] = useState<DataType | null>(null);
  const [selectedProductForTransaction, setSelectedProductForTransaction] = useState<DataType | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedBranchTab, setSelectedBranchTab] = useState<string>("all");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteMultipleModalVisible] =
    useState(false);
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [transactionType, setTransactionType] = useState<"give" | "return">("give");
  const [detailsLogSearch, setDetailsLogSearch] = useState("");
  const [detailsLogTypeFilter, setDetailsLogTypeFilter] = useState<string>("all");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit,
    setValue,
    watch,
  } = useForm<DataType>();

  const transactionForm = useForm({
    defaultValues: {
      userId: "",
      quantity: "",
      notes: "",
    },
  });

  const [createUpdateInventory] = useCreateUpdateInventoryMutation();
  const [deleteInventory] = useDeleteInventoryMutation();
  const [deleteInventoryMultiple] = useDeleteInventoryMultipleMutation();
  const [createInventoryTransaction] = useCreateInventoryTransactionMutation();

  useEffect(() => {
    if (data?.data?.InventoryData) {
      setTableData(data.data.InventoryData);
    }
  }, [data]);

  useEffect(() => {
    if (!isSuperAdmin && user?.branchId) {
      setSelectedBranchTab(String(user.branchId));
    }
  }, [isSuperAdmin, user?.branchId]);

  const getInventoryBranchIds = (record: DataType) => {
    const branchIdsFromArray = Array.isArray((record as any)?.branchIds)
      ? (record as any).branchIds
      : [];

    const allBranchIds = [
      ...branchIdsFromArray,
      (record as any)?.branchId,
      (record as any)?.branch?.id,
    ]
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));

    return Array.from(new Set(allBranchIds));
  };

  const filteredData = tableData?.filter((record) => {
    const matchesBranch =
      selectedBranchTab === "all"
        ? true
        : getInventoryBranchIds(record).includes(Number(selectedBranchTab));

    if (!matchesBranch) return false;

    const searchTerm = searchText?.toLowerCase();
    return Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
  });

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    setIsDetailsModalOpen(false);
    setIsEditMode(false);
    setSelectedUUID("null");
    setDescription("");
    setDetailsLogSearch("");
    setDetailsLogTypeFilter("all");
    setIsDescriptionExpanded(false);
  };

  const resetForm = () => {
    setValue("productName", "");
    setValue("quantity", "");
    setValue("branchId", isSuperAdmin && activeBranches?.data?.branchData?.length ? activeBranches.data.branchData[0].id : (user?.branchId ?? undefined));
    setDescription("");
    setImageFile(null);
    setImagePreview("");
    setIsEditMode(false);
    setSelectedUUID("null");
  };

  const resetTransactionForm = (keepProduct = false) => {
    transactionForm.reset({
      userId: undefined,
      quantity: undefined,
      notes: "",
    });
    if (!keepProduct) {
      setSelectedProductForTransaction(null);
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    resetForm();
    showModal();
  };

  const handleEdit = (record: DataType) => {
    const resolvedEditBranchId = (record as any).branchId ?? (record as any).branch?.id ?? undefined;
    reset({
      productName: record.productName,
      quantity: record.quantity,
      branchId: resolvedEditBranchId,
      image: record.image || "",
    });
    setDescription(record.description || "");
    setImageFile(null);
    setImagePreview(record.image || "");
    setIsEditMode(true);
    setSelectedUUID(record.uuid);
    showModal();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      setImageFile(null);
      setImagePreview("");
      e.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string) || "");
      reader.onerror = (error) => reject(error);
    });

  const handleShow = (record: DataType) => {
    setIsDetailsModalOpen(true);
    setSelectedRecord(record);
  };

  const handleAssign = (record: DataType) => {
    // Reset form fields first
    transactionForm.reset({
      userId: undefined,
      quantity: undefined,
      notes: "",
    });
    // Then set the product (this won't be cleared)
    setSelectedProductForTransaction(record);
    setTransactionType("give");
    setIsAssignModalOpen(true);
  };

  const handleReturn = (record: DataType) => {
    // Reset form fields first
    transactionForm.reset({
      userId: undefined,
      quantity: undefined,
      notes: "",
    });
    // Then set the product (this won't be cleared)
    setSelectedProductForTransaction(record);
    setTransactionType("return");
    setIsReturnModalOpen(true);
  };

  const handleAssignFromDetails = (outstandingProduct: OutstandingProduct) => {
    if (!selectedRecord) return;
    // Reset form fields first
    transactionForm.reset({
      userId: outstandingProduct.userId.toString(),
      quantity: undefined,
      notes: "",
    });
    // Set the product
    setSelectedProductForTransaction(selectedRecord);
    setTransactionType("give");
    setIsDetailsModalOpen(false);
    setIsAssignModalOpen(true);
  };

  const handleReturnFromDetails = (outstandingProduct: OutstandingProduct) => {
    if (!selectedRecord) return;
    // Reset form fields first
    transactionForm.reset({
      userId: outstandingProduct.userId.toString(),
      quantity: undefined,
      notes: "",
    });
    // Set the product
    setSelectedProductForTransaction(selectedRecord);
    setTransactionType("return");
    setIsDetailsModalOpen(false);
    setIsReturnModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUUID || selectedUUID === "null") return;
    try {
      const response = await deleteInventory(selectedUUID).unwrap();
      toast.success(response?.message || "Deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Delete failed");
    }
    setIsDeleteModalVisible(false);
    setSelectedUUID("null");
  };

  const cancelDelete = () => {
    setIsDeleteModalVisible(false);
    setSelectedUUID("null");
  };

  const handleDelete = (uuid: string) => {
    setSelectedUUID(uuid);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteMultipleClick = () => {
    setIsDeleteMultipleModalVisible(true);
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteInventoryMultiple(
          selectedRowKeys as string[]
        ).unwrap();
        setIsDeleteMultipleModalVisible(false);
        await refetch();
        if (response.status === true) {
          setSelectedRowKeys([]);
          toast.success("Deleted successfully!");
        } else {
          toast.error("Failed to delete. Please try again.");
        }
      } catch (error) {
        setIsDeleteMultipleModalVisible(false);
        toast.error("Failed to delete. Please try again.");
      }
    } else {
      toast.error("Please Select Items.");
    }
  };

  const onSubmit = async (formData: any) => {
    setIsUploading(true);
    try {
      const data: any = {
        productName: formData.productName,
        quantity: formData.quantity,
        description: description,
        branchId: formData.branchId ?? undefined,
      };

      // Inventory endpoint validates JSON body fields; include image as base64 payload.
      if (imageFile) {
        const imageBase64 = await toBase64(imageFile);
        data.image = imageBase64;
        data.imageFile = imageBase64;
      }

      const response = await createUpdateInventory({
        uuid: selectedUUID,
        data,
      });

      if (response?.data?.status === true) {
        toast.success(response.data.message);
        setIsModalOpen(false);
        resetForm();
        refetch();
      } else if (response?.error?.data?.status === false) {
        if (response.error.data.errors) {
          response.error.data.errors.forEach((error: any) => {
            toast.error(error.msg);
          });
        } else {
          toast.error(response.error.data.message);
        }
      }
    } catch (error: any) {
      toast.error("Operation failed. Something went wrong!");
      console.error("Error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmitTransaction = async (formData: any) => {
    if (!selectedProductForTransaction) {
      toast.error("Product not selected");
      return;
    }
    
    setIsUploading(true);
    try {
      const userIdValue = formData.userId ? (typeof formData.userId === 'string' ? parseInt(formData.userId, 10) : formData.userId) : null;
      const quantityValue = formData.quantity ? (typeof formData.quantity === 'string' ? parseInt(formData.quantity, 10) : parseInt(formData.quantity.toString(), 10)) : null;
      
      if (!userIdValue || !quantityValue) {
        toast.error("Please fill in all required fields");
        setIsUploading(false);
        return;
      }

      const data = {
        inventoryId: selectedProductForTransaction.id,
        userId: userIdValue,
        transactionType: transactionType,
        quantity: quantityValue,
        notes: formData.notes || "",
      };

      const response = await createInventoryTransaction(data).unwrap();

      if (response?.status === true) {
        toast.success(response.message);
        setIsAssignModalOpen(false);
        setIsReturnModalOpen(false);
        resetTransactionForm();
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

  const getImageSrc = (image?: string) => {
    if (!image) return "https://ui-avatars.com/api/?name=PThumbnail&background=random";
    if (image.startsWith("http") || image.startsWith("data:") || image.startsWith("blob:")) {
      return image;
    }
    return `${baseUrl}${image}`;
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: "Thumbnail",
      dataIndex: "image",
      key: "image",
      render: (image, record) => (
        <Popover
          trigger="hover"
          placement="right"
          overlayStyle={{ zIndex: 12000 }}
          content={
            <div className="w-[180px] h-[180px] rounded-lg bg-white shadow-xl border border-gray-300 flex items-center justify-center p-1">
              <img
                src={getImageSrc(image)}
                alt="Enlarged Thumbnail"
                className="w-full h-full rounded-lg object-cover"
              />
            </div>
          }
        >
          <div className="flex items-center justify-center w-[32px] h-[32px] rounded-full bg-gray-200 cursor-pointer">
            <img
              src={getImageSrc(image)}
              alt={`${record?.productName || "Product"} thumbnail`}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </Popover>
      ),
      width: 120,
    },
    {
      title: "Products",
      dataIndex: "productName",
      key: "productName",
      render: (productName, record) => (
        <span
          onClick={() => handleShow(record)}
          className="hover:text-blue-600 cursor-pointer hover:underline"
          style={{
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.target.style.color = "#69B1FF")}
          onMouseLeave={(e) => (e.target.style.color = "")}
        >
          {productName || "N/A"}
        </span>
      ),
      width: 240,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity) => <span>{quantity || 0}</span>,
      width: 120,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 200,
      ellipsis: true,
      render: (description: string) => {
        if (!description) return "â€”";
        // Strip HTML tags and get plain text
        const textContent = description.replace(/<[^>]*>/g, "").trim();
        const maxLength = 50;
        const truncated = textContent.length > maxLength 
          ? textContent.substring(0, maxLength) + "..." 
          : textContent;
        
        const content = (
          <div 
            className="text-[12px] text-gray-700"
            style={{
              maxWidth: "400px",
              maxHeight: "300px",
              overflowY: "auto",
              wordWrap: "break-word",
            }}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        );
        
        return (
          <Popover
            content={content}
            title="Description"
            trigger="hover"
            placement="topLeft"
            overlayStyle={{
              maxWidth: "450px",
            }}
            overlayInnerStyle={{
              padding: "16px",
            }}
          >
            <span className="text-[11px] cursor-help text-gray-700 hover:text-blue-600 transition-colors ">
              {truncated}
            </span>
          </Popover>
        );
      },
    },
    {
      title: "Actions",
      dataIndex: "uuid",
      key: "actions",
      render: (uuid, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "details",
                label: (
                  <button
                    className="flex items-center gap-2 w-full"
                    onClick={() => handleShow(record)}
                  >
                    <FaEye />
                    View
                  </button>
                ),
              },
              ...((user?.userType === "superAdmin" ||
                user?.userType === "admin") &&
              hasPermissionForSlug("edit-agent-marketplace")
                ? [
                    {
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
                      key: "assign",
                      label: (
                        <button
                          className="flex items-center gap-2 w-full text-green-600"
                          onClick={() => handleAssign(record)}
                        >
                          <FaArrowRight />
                          Assign Product
                        </button>
                      ),
                    },
                    {
                      key: "return",
                      label: (
                        <button
                          className="flex items-center gap-2 w-full text-blue-600"
                          onClick={() => handleReturn(record)}
                        >
                          <FaArrowLeft />
                          Return Product
                        </button>
                      ),
                    },
                    ...((user?.userType === "superAdmin" ||
                      user?.userType === "admin") &&
                    hasPermissionForSlug("delete-agent-marketplace")
                      ? [
                          {
                            key: "delete",
                            label: (
                              <button
                                className="flex items-center gap-2 w-full"
                                onClick={() => handleDelete(uuid)}
                              >
                                <MdDelete size={17} />
                                Delete
                              </button>
                            ),
                          },
                        ]
                      : []),
                  ]
                : []),
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
      width: 50,
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const selectedQuantity = transactionForm.watch("quantity");

  const formatUserName = (user?: TransactionLogType["user"]) => {
    if (!user) return "N/A";
    return (
      user.name ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.email ||
      "N/A"
    );
  };

  const productLogs: TransactionLogType[] = selectedRecord
    ? (transactionsData?.data?.TransactionData || []).filter(
        (t: TransactionLogType) => t.inventoryId === selectedRecord.id
      )
    : [];

  // Calculate outstanding products per user (assigned but not returned)
  interface OutstandingProduct {
    userId: number;
    user: TransactionLogType["user"];
    outstandingQty: number;
    lastAssignedDate: string;
    lastAssignedNotes?: string;
  }

  const calculateOutstandingProducts = (): OutstandingProduct[] => {
    if (!selectedRecord) return [];

    // Group transactions by user
    const userTransactions: Record<number, { given: number; returned: number; lastGive: TransactionLogType | null }> = {};

    productLogs.forEach((log) => {
      const userId = log.userId;
      if (!userTransactions[userId]) {
        userTransactions[userId] = { given: 0, returned: 0, lastGive: null };
      }

      if (log.transactionType === "give") {
        userTransactions[userId].given += log.quantity;
        // Track the most recent assignment
        if (!userTransactions[userId].lastGive || new Date(log.createdAt) > new Date(userTransactions[userId].lastGive!.createdAt)) {
          userTransactions[userId].lastGive = log;
        }
      } else if (log.transactionType === "return") {
        userTransactions[userId].returned += log.quantity;
      }
    });

    // Calculate outstanding products and filter out users with zero outstanding
    const outstanding: OutstandingProduct[] = Object.entries(userTransactions)
      .map(([userId, data]) => {
        const outstandingQty = data.given - data.returned;
        if (outstandingQty <= 0) return null;

        const lastGive = data.lastGive!;
        return {
          userId: parseInt(userId, 10),
          user: lastGive.user,
          outstandingQty,
          lastAssignedDate: lastGive.createdAt,
          lastAssignedNotes: lastGive.notes,
        };
      })
      .filter((item): item is OutstandingProduct => item !== null);

    return outstanding;
  };

  const outstandingProducts = calculateOutstandingProducts();

  // Get unique users for table filter
  const uniqueUsersForTableFilter = React.useMemo(() => {
    return Array.from(
      new Map(
        outstandingProducts.map((item) => [item.userId, formatUserName(item.user)])
      ).entries()
    ).map(([userId, userName]) => ({
      text: userName,
      value: userId,
    }));
  }, [outstandingProducts]);

  // Filter outstanding products by search
  const filteredOutstandingProducts = outstandingProducts.filter((item) => {
    const searchLower = detailsLogSearch.trim().toLowerCase();
    if (!searchLower) return true;
    const userName = formatUserName(item.user).toLowerCase();
    const notes = (item.lastAssignedNotes || "").toLowerCase();
    return userName.includes(searchLower) || notes.includes(searchLower);
  });

  // Calculate description text length (strip HTML tags)
  const getDescriptionTextLength = (html: string) => {
    if (!html) return 0;
    // Strip HTML tags and get text length
    const textContent = html.replace(/<[^>]*>/g, "").trim();
    return textContent.length;
  };

  // Log statistics - show outstanding products
  const totalOutstandingQty = outstandingProducts.reduce((sum, item) => sum + item.outstandingQty, 0);
  const totalAssignedQty = productLogs
    .filter((log) => log.transactionType === "give")
    .reduce((sum, log) => sum + log.quantity, 0);
  const totalReturnedQty = productLogs
    .filter((log) => log.transactionType === "return")
    .reduce((sum, log) => sum + log.quantity, 0);

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          {/* Title */}
          <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">
            Inventory Management
            <span className="ml-1 text-gray-400 font-normal text-[11px]">({tableData.length})</span>
          </h1>
          {isSuperAdmin && (
            <>
              {/* Divider */}
              <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
              {/* Branch tabs */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedBranchTab("all")}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                    selectedBranchTab === "all"
                      ? "bg-[#0f766e] text-white"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  All Branches
                </button>
                {(activeBranches?.data?.branchData || []).map((branch: any) => (
                  <button
                    key={branch.id}
                    type="button"
                    onClick={() => setSelectedBranchTab(String(branch.id))}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                      selectedBranchTab === String(branch.id)
                        ? "bg-[#0f766e] text-white"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    }`}
                  >
                    {branch.name}
                  </button>
                ))}
              </div>
            </>
          )}
          {/* Spacer */}
          <div className="flex-1" />
          {/* Search */}
          <div className="relative flex-shrink-0" style={{ width: 170 }}>
            <FaSearch
              className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              style={{ fontSize: 10, left: 8 }}
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                paddingLeft: 26,
                paddingRight: searchText ? 22 : 8,
                paddingTop: 4,
                paddingBottom: 4,
                width: "100%",
              }}
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                style={{ right: 6 }}
              >
                <FaTimes />
              </button>
            )}
          </div>
          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => navigate("/dashboard/marketplace/inventory/transactions")}
              className="primary-btn"
            >
              View Logs
            </button>
            {(user?.userType === "superAdmin" || user?.userType === "admin") &&
              hasPermissionForSlug("create-agent-marketplace") && (
                <button onClick={handleAdd} className="primary-btn">
                  Add New
                </button>
              )}
            {(user?.userType === "superAdmin" || user?.userType === "admin") &&
              hasPermissionForSlug("delete-agent-marketplace") && (
                <button onClick={handleDeleteMultipleClick} className="cancel-btn">
                  Delete Selected
                </button>
              )}
          </div>
        </div>

      {/* ==== product table ========= */}
      <div>

        {isLoading ? (
          <TableLoader />
        ) : (
          <Table
            scroll={{ x: "max-content" }}
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredData}
            pagination={{ pageSize: 20 }}
            rowKey="uuid"
          />
        )}
      </div>

      {/* ======== create update product ======== */}
      <ModalMain
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        handleOk={handleSubmit(onSubmit)}
        title={isEditMode ? "Edit Inventory Product" : "Create Inventory Product"}
        isLoading={isUploading}
        modalClass={"lg:!w-[50%] !z-[10000]"}
      >
        <form className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-medium">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="global-input"
                {...register("productName", {
                  required: "Product name is required",
                })}
                placeholder="Enter product name"
              />
              {errors.productName && (
                <p className="text-red-500">{errors.productName.message}</p>
              )}
            </div>

            <div>
              <label className="text-[13px] font-medium">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                className="global-input"
                {...register("quantity", {
                  required: "Quantity is required",
                  min: { value: 0, message: "Quantity must be non-negative" },
                })}
                placeholder="Enter quantity"
              />
              {errors.quantity && (
                <p className="text-red-500">{errors.quantity.message}</p>
              )}
            </div>

            {/* Branch (superAdmin: dropdown; others: hidden + display) */}
            {isSuperAdmin ? (
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium">Branch (If any)</label>
                <Select
                  value={watch("branchId") ?? (activeBranches?.data?.branchData?.length ? activeBranches.data.branchData[0].id : undefined)}
                  onChange={(val) => setValue("branchId", val)}
                  options={activeBranches?.data?.branchData?.map((branch: { id: number; name: string }) => ({
                    value: branch.id,
                    label: branch.name,
                  }))}
                  placeholder="Select Branch"
                  className="w-full"
                  allowClear
                  showSearch
                  disabled={branchesLoading}
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                />
              </div>
            ) : (
              <>
                <input type="hidden" {...register("branchId")} value={user?.branchId ?? ""} readOnly />
                <div className="flex flex-col">
                  <label className="text-[13px] font-medium">Branch</label>
                  <input
                    type="text"
                    value={user?.branch?.name || "No Branch Assigned"}
                    disabled
                    className="border rounded p-2 w-full bg-gray-100"
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <label className="text-[13px] font-medium">Description</label>
            <ReactQuill
              modules={{
                toolbar: [
                  [{ header: "1" }, { header: "2" }, { font: [] }],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["bold", "italic", "underline"],
                  ["link"],
                ],
              }}
              value={description}
              onChange={setDescription}
              placeholder="Enter description..."
              style={{ height: "150px", marginBottom: "50px" }}
            />
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label
                htmlFor="inventory-image"
                className="border-dashed py-1 max-w-[250px] px-5 cursor-pointer text-center rounded-md border border-gray-600 inline-block"
              >
                <span>Upload Thumbnail</span>
                <input
                  id="inventory-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="w-[90px] h-[90px] rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border">
              {imagePreview || watch("image") ? (
                <img
                  src={getImageSrc(imagePreview || watch("image"))}
                  alt="Inventory thumbnail"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <img
                  src="https://ui-avatars.com/api/?name=PThumbnail&background=random"
                  alt="Product Thumbnail"
                  className="w-10 h-10 rounded-full"
                />
              )}
            </div>
          </div>
        </form>
      </ModalMain>

      {/* Assign Product Modal */}
      <ModalMain
        handleCancel={() => {
          setIsAssignModalOpen(false);
          resetTransactionForm();
        }}
        isModalOpen={isAssignModalOpen}
        handleOk={transactionForm.handleSubmit(onSubmitTransaction)}
        title="Assign Product to User"
        isLoading={isUploading}
        modalClass={"lg:!w-[50%] !z-[10000]"}
      >
        <form className="space-y-3">
          <div>
            <label className="text-[13px] font-medium">
              Product <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="global-input"
              value={selectedProductForTransaction?.productName || ""}
              disabled
            />
            <p className="text-sm text-gray-500 mt-1">
              Available quantity: {selectedProductForTransaction?.quantity || 0}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-medium">
                User <span className="text-red-500">*</span>
              </label>
              <Controller
                name="userId"
                control={transactionForm.control}
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
              {transactionForm.formState.errors.userId && (
                <p className="text-red-500">
                  {transactionForm.formState.errors.userId.message as string}
                </p>
              )}
            </div>

            <div>
              <label className="text-[13px] font-medium">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={selectedProductForTransaction?.quantity || 0}
                className="global-input"
                {...transactionForm.register("quantity", {
                  required: "Quantity is required",
                  min: { value: 1, message: "Quantity must be at least 1" },
                  validate: (value) => {
                    if (selectedProductForTransaction) {
                      if (parseInt(value, 10) > selectedProductForTransaction.quantity) {
                        return "Quantity cannot exceed available inventory";
                      }
                    }
                    return true;
                  },
                })}
                placeholder="Enter quantity"
              />
              {transactionForm.formState.errors.quantity && (
                <p className="text-red-500">
                  {transactionForm.formState.errors.quantity.message as string}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-[13px] font-medium">Notes</label>
            <textarea
              {...transactionForm.register("notes")}
              rows={4}
              className="global-input"
              placeholder="Enter notes (optional)"
            />
          </div>
        </form>
      </ModalMain>

      {/* Return Product Modal */}
      <ModalMain
        handleCancel={() => {
          setIsReturnModalOpen(false);
          resetTransactionForm();
        }}
        isModalOpen={isReturnModalOpen}
        handleOk={transactionForm.handleSubmit(onSubmitTransaction)}
        title="Return Product from User"
        isLoading={isUploading}
        modalClass={"lg:!w-[50%] !z-[10000]"}
      >
        <form className="space-y-3">
          <div>
            <label className="text-[13px] font-medium">
              Product <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="global-input"
              value={selectedProductForTransaction?.productName || ""}
              disabled
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] font-medium">
                User <span className="text-red-500">*</span>
              </label>
              <Controller
                name="userId"
                control={transactionForm.control}
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
              {transactionForm.formState.errors.userId && (
                <p className="text-red-500">
                  {transactionForm.formState.errors.userId.message as string}
                </p>
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
                {...transactionForm.register("quantity", {
                  required: "Quantity is required",
                  min: { value: 1, message: "Quantity must be at least 1" },
                })}
                placeholder="Enter quantity"
              />
              {transactionForm.formState.errors.quantity && (
                <p className="text-red-500">
                  {transactionForm.formState.errors.quantity.message as string}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-[13px] font-medium">Notes</label>
            <textarea
              {...transactionForm.register("notes")}
              rows={4}
              className="global-input"
              placeholder="Enter notes (optional)"
            />
          </div>
        </form>
      </ModalMain>

      {/* View product Details Modal */}
      <ModalMain
        handleCancel={handleCancel}
        isModalOpen={isDetailsModalOpen}
        hideFooter={true}
        modalClass={"lg:!w-[50%] !z-[10000]"}
      >
        {selectedRecord && (
          <div className="space-y-4 pt-8">
            {/* Product info header with actions */}
            <div className="border border-[#70707036] rounded-md p-4 bg-gray-50/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedRecord.productName}
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-gray-700">
                        Quantity:
                      </span>
                      <span className="font-semibold text-[#082624] text-base">
                        {selectedRecord.quantity}
                      </span>
                    </div>
                    <span className="text-[12px] text-gray-500 mt-1">
                      Created:{" "}
                      {selectedRecord.createdAt
                        ? formatDate(parseISO(selectedRecord.createdAt), "dd MMMM yyyy")
                        : "N/A"}
                    </span>
                  </div>
                </div>
                {/* Action buttons */}
                {(user?.userType === "superAdmin" ||
                  user?.userType === "admin") &&
                  hasPermissionForSlug("edit-agent-marketplace") && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setIsDetailsModalOpen(false);
                          handleAssign(selectedRecord);
                        }}
                        className="primary-btn text-[11px] whitespace-nowrap flex items-center gap-1.5"
                      >
                        <FaArrowRight size={12} />
                        Assign
                      </button>
                      <button
                        onClick={() => {
                          setIsDetailsModalOpen(false);
                          handleReturn(selectedRecord);
                        }}
                        className="primary-btn-ghost text-[11px] whitespace-nowrap flex items-center gap-1.5"
                      >
                        <FaArrowLeft size={12} />
                        Return
                      </button>
                    </div>
                  )}
              </div>
            </div>

            {/* Description with expand/collapse */}
            {selectedRecord.description && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[13px] font-medium">
                    Description
                  </label>
                  {getDescriptionTextLength(selectedRecord.description) > 200 && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="text-[11px] text-[#082624] hover:text-[#0b3331] flex items-center gap-1 font-medium transition-colors"
                    >
                      {isDescriptionExpanded ? (
                        <>
                          <span>See less</span>
                          <FaChevronUp size={10} />
                        </>
                      ) : (
                        <>
                          <span>See more</span>
                          <FaChevronDown size={10} />
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div
                    className={`text-[12px] text-gray-600 border border-[#70707036] rounded-md p-3 bg-white transition-all ${
                      !isDescriptionExpanded && getDescriptionTextLength(selectedRecord.description) > 200
                        ? "max-h-[100px] overflow-hidden"
                        : ""
                    }`}
                    dangerouslySetInnerHTML={{
                      __html: selectedRecord.description,
                    }}
                  />
                  {!isDescriptionExpanded &&
                    getDescriptionTextLength(selectedRecord.description) > 200 && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-md" />
                    )}
                </div>
              </div>
            )}

            {selectedRecord.image && (
              <div>
                <label className="text-[13px] font-medium mb-2 block">Product Image</label>
                <img
                  src={getImageSrc(selectedRecord.image)}
                  alt={selectedRecord.productName}
                  className="h-24 w-24 rounded-md border object-cover"
                />
              </div>
            )}

            {/* Product logs - Outstanding Products */}
            <div>
              <div className="flex items-center justify-between mb-2">
                {outstandingProducts.length > 0 && (
                  <div className="flex items-center gap-3 text-[11px] text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      Outstanding: {outstandingProducts.length} user(s) ({totalOutstandingQty} items)
                    </span>
                    <span className="text-gray-400">
                      Total Assigned: {totalAssignedQty} | Returned: {totalReturnedQty}
                    </span>
                  </div>
                )}
              </div>
              {/* Search */}
              {outstandingProducts.length > 0 && (
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Search by user name..."
                    value={detailsLogSearch}
                    onChange={(e) => setDetailsLogSearch(e.target.value)}
                    className="global-search w-full"
                  />
                </div>
              )}
              {productLogs.length === 0 ? (
                <div className="border border-dashed border-[#70707036] rounded-md py-8 text-center text-[12px] text-gray-500 bg-gray-50/50">
                  No transactions yet for this product.
                </div>
              ) : outstandingProducts.length === 0 ? (
                <div className="border border-dashed border-[#70707036] rounded-md py-8 text-center text-[12px] text-gray-500 bg-gray-50/50">
                  All products have been returned. No outstanding products.
                </div>
              ) : filteredOutstandingProducts.length === 0 ? (
                <div className="border border-dashed border-[#70707036] rounded-md py-8 text-center text-[12px] text-gray-500 bg-gray-50/50">
                  No users match your search.
                </div>
              ) : (
                <Table
                  dataSource={filteredOutstandingProducts}
                  rowKey="userId"
                  scroll={{ x: "max-content" }}
                  columns={[
                      {
                        title: "User",
                        key: "user",
                        width: 180,
                        filters: uniqueUsersForTableFilter,
                        onFilter: (value, record) => record.userId === value,
                        render: (_, record) => (
                          <span className="font-medium">{formatUserName(record.user)}</span>
                        ),
                      },
                      {
                        title: "Outstanding Qty",
                        dataIndex: "outstandingQty",
                        key: "outstandingQty",
                        width: 120,
                        align: "center",
                        render: (qty: number) => (
                          <span className="font-semibold text-orange-600">{qty}</span>
                        ),
                      },                      
                      {
                        title: "Assigned Date",
                        dataIndex: "lastAssignedDate",
                        key: "lastAssignedDate",
                        width: 150,
                        render: (date: string) => {
                          if (!date) return "N/A";
                          return (
                            <span className="text-[11px]">
                              {formatDate(parseISO(date), "dd MMMM yyyy")}
                            </span>
                          );
                        },
                      },
                      {
                        title: "Notes",
                        dataIndex: "lastAssignedNotes",
                        key: "notes",
                        ellipsis: true,
                        render: (notes: string) => notes || "â€”",
                      },
                      {
                        title: "Actions",
                        key: "actions",
                        fixed: "right",
                        align: "center",
                        width: 50,
                        render: (_, record: OutstandingProduct) => (
                          <Dropdown
                            menu={{
                              items: [
                                ...((user?.userType === "superAdmin" ||
                                  user?.userType === "admin") &&
                                hasPermissionForSlug("edit-agent-marketplace")
                                  ? [
                                      {
                                        key: "assign",
                                        label: (
                                          <button
                                            className="flex items-center gap-2 w-full text-green-600"
                                            onClick={() => handleAssignFromDetails(record)}
                                          >
                                            <FaArrowRight />
                                            Assign Product
                                          </button>
                                        ),
                                      },
                                      {
                                        key: "return",
                                        label: (
                                          <button
                                            className="flex items-center gap-2 w-full text-blue-600"
                                            onClick={() => handleReturnFromDetails(record)}
                                          >
                                            <FaArrowLeft />
                                            Return Product
                                          </button>
                                        ),
                                      },
                                    ]
                                  : []),
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
                      }
                    ]}
                    pagination={{ pageSize: 20 }}
                  />
              )}
            </div>
          </div>
        )}
      </ModalMain>

      {/* Delete Confirmation Modal */}
      <ModalMain
        handleCancel={cancelDelete}
        isModalOpen={isDeleteModalVisible}
        handleOk={confirmDelete}
        title="Delete Product"
        okBtnText="Delete"
        modalClass={"!z-[10000]"}
      >
        <p>Are you sure you want to delete this product?</p>
      </ModalMain>

      {/* Delete Multiple Confirmation Modal */}
      <ModalMain
        handleCancel={() => setIsDeleteMultipleModalVisible(false)}
        isModalOpen={isDeleteMultipleModalVisible}
        handleOk={handleDeleteConfirmMultiple}
        title="Delete Products"
        okBtnText="Delete"
        modalClass={"!z-[10000]"}
      >
        <p>
          Are you sure you want to delete {selectedRowKeys.length} selected
          product(s)?
        </p>
      </ModalMain>
    </div>
    </div>
  );
};

export default InventoryList;
