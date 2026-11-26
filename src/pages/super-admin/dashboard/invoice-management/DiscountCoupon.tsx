// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import type { TableColumnsType, TableProps } from "antd";
import ModalMain from "../../../../components/ui/Modal";
import { useForm } from "react-hook-form";
import { Table, Modal, Button, Dropdown, Space, Select } from "antd";
import { FaComment, FaRegEdit, FaSearch, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import toast from "react-hot-toast";
import TableLoader from "../../../../components/loader/TableLoader";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  useCreateUpdateCouponMutation,
  useDeleteCouponMutation,
  useDeleteCouponMultipleMutation,
  useGetCouponQuery,
} from "../../../../redux/api/superadmin/invoice/couponDataSlice";
import { useGetTradeProductQuery } from "../../../../redux/api/superadmin/invoice/productDataSlice";
import { useGetActiveBranchListDataQuery } from "../../../../redux/api/superadmin/branch/Branchmanagementslice";

import { useAppSelector } from "../../../../redux/hooks";
import { Link } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { usePermissions } from "../../../../utils/permissionUtils";
import { formatNumberWithCommasAndDecimals } from "../../../../utils/formatNumberWithCommasAndDecimals";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface DataType {
  relation: string;
  name: string;
  userId: string;
  email: string;
  uuid: string;
}

const couponManagement = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const { uuid } = useParams<{ uuid?: string }>();
  const { client } = useParams<{ client?: string }>();
  const { data, isLoading, refetch } = useGetCouponQuery({ uuid });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | "null">("null");
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAppSelector((state) => state.user);

  const [changeUuid, setChangeUuid] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [deleteCouponMultiple] = useDeleteCouponMultipleMutation();
  const [searchText, setSearchText] = useState("");
  const isSuperAdmin = user?.userType === "superAdmin";
  const { data: activeBranches, isLoading: branchesLoading } = useGetActiveBranchListDataQuery("");

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();

    const inProperties = Object.values(record.createdUser || {}).some((data) =>
      String(data).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return inProperties || inRecord;
  });


   

  const navigate = useNavigate();
  const location = useLocation();




  useEffect(() => {
    if (data?.data?.CouponData) {
      setTableData(data.data.CouponData);
    }
  }, [data]);

  const {
    register,
    formState: { errors },
    reset,
    getValues,
    setValue,
    setError,
    handleSubmit,
    watch,
  } = useForm<DataType>({});

  const discountScope = watch("discount_scope");

  useEffect(() => {
    if (discountScope === "Global") {
      setSelectedProducts([]);
      setValue("products", []);
    }
  }, [discountScope, setValue]);

  const { data: productsData, isLoading: isProductsLoading } = useGetTradeProductQuery();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    if (productsData) {
    }
  }, [productsData]);

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

  const [createUpdatePropertyListing] = useCreateUpdateCouponMutation();
  const [deletePropertyListing] = useDeleteCouponMutation();

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedUUID("null");
  };

  const resetForm = () => {
    setValue("coupon_code", "");
    setValue("type", "Fixed");
    setValue("discount", 0.0);
    setValue("status", "Active");
    setValue("discount_scope", "Global");
    setValue("products", []);
    setValue("branchId", isSuperAdmin && activeBranches?.data?.branchData?.length ? activeBranches.data.branchData[0].id : (user?.branchId ?? undefined));
    setSelectedProducts([]);
    setIsEditMode(false);
    setSelectedUUID("null");
  };

  const handleEdit = (record: DataType) => {
    reset(record);
    setIsEditMode(true);
    setSelectedUUID(record.uuid);
    if (record.branchId != null) setValue("branchId", record.branchId);
    if (record.products && Array.isArray(record.products)) {
      setSelectedProducts(record.products);
      setValue("products", record.products);
    } else {
      setSelectedProducts([]);
      setValue("products", []);
    }
    showModal();
  };

  const confirmDelete = async () => {
    if (!selectedUUID) return;
    try {
      const response = await deletePropertyListing(selectedUUID).unwrap();
      toast.success(response?.message);
      setTableData(tableData.filter((item): any => item.uuid !== selectedUUID));
    } catch (error) {
      toast.error("Delete failed. Something went wrong!");
      console.error("Delete error:", error);
    }
    setIsModalVisible(false);
    setSelectedUUID("null");
  };

  const cancelDelete = () => {
    setIsModalVisible(false);
    setSelectedUUID("null");
    setChangeUuid(null);
    setIsDeleteModalMultipleVisible(false);
  };

  const handleDelete = (uuid: string) => {
    setSelectedUUID(uuid);
    setIsModalVisible(true);
  };

  const onSubmit = async () => {
    setIsUploading(true);
    setValue("userId", uuid);
    const data = getValues();

    if (data.discount_scope === "Product Based") {
      data.products = selectedProducts;
      if (!selectedProducts || selectedProducts.length === 0) {
        toast.error("Please select at least one product for Product Based discount");
        setIsUploading(false);
        return;
      }
    } else {
      data.products = [];
    }

    const handleResponse = (response: any) => {
      if (response?.error?.data?.status === false) {
        response.error.data.errors
          ? response.error.data.errors.forEach((error: any) => {
              setError(error.path, {
                type: "manual",
                message: error.msg,
              });
            })
          : toast.error(response.error.data.message);
      } else if (response?.data?.status === true) {
        toast.success(response.data.message);
        setIsModalOpen(false);
        resetForm();
        refetch();
      }
    };

    try {
      const response = await createUpdatePropertyListing({
        uuid: selectedUUID,
        data,
      });

      handleResponse(response);
    } catch (error: any) {
      toast.error("Update failed. Something went wrong!");
      console.error("Error:", error);
    } finally {
      setIsUploading(false);
      if (isEditMode) {
        setIsEditMode(false);
        setSelectedUUID("null");
      }
    }
  };

  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true);
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteCouponMultiple(selectedRowKeys);
        setIsDeleteModalMultipleVisible(false);
        await refetch();
        if (response.data.status == true) {
          setSelectedRowKeys([]);
          toast.success("Deleted successfully!");
        } else {
          toast.error("Failed to delete. Please try again.");
        }
      } catch (error) {
        setIsDeleteModalMultipleVisible(false);
        toast.error("Failed to delete. Please try again.");
      }
    } else {
      toast.error("Please Select Product.");
    }
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: "Coupon Code",
      dataIndex: "coupon_code",
      key: "coupon_code",
      render: (coupon_code) => <span>{coupon_code || "N/A"}</span>,
    },
    {
      title: "Discount",
      dataIndex: "discount",
      key: "discount",
      render: (discount) => <span>{formatNumberWithCommasAndDecimals(discount || "0.00")}</span>,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => <span>{type ? type.charAt(0).toUpperCase() + type.slice(1) : "N/A"}</span>,
    },
    {
      title: "Discount Scope",
      dataIndex: "discount_scope",
      key: "discount_scope",
      render: (discount_scope) => <span>{discount_scope ? discount_scope.charAt(0).toUpperCase() + discount_scope.slice(1) : "Global"}</span>,
    },
    {
      title: "Products",
      dataIndex: "products",
      key: "products",
      render: (products, record) => {
        if (record.discount_scope === "Product Based" && products && Array.isArray(products) && products.length > 0) {
          const allProducts = productsData?.data?.TradeProductsData || [];
          const productNames = products
            .map((productUuid: string) => {
              const product = allProducts.find((p: any) => p.uuid === productUuid);
              return product?.product_name || productUuid;
            })
            .filter(Boolean);
          
          return (
            <span title={productNames.join(", ")}>
              {productNames.length} product{productNames.length > 1 ? "s" : ""}
            </span>
          );
        }
        return <span>-</span>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
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
  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">
            Discount Coupons
            <span className="ml-1 text-gray-400 font-normal text-[11px]">({tableData.length})</span>
          </h1>
          <div className="flex-1" />
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
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {(user.userType == "superAdmin" || user.userType == "admin") &&
              hasPermissionForSlug("create-agent-marketplace") && (
                <button onClick={showModal} className="primary-btn">
                  Add New
                </button>
              )}
            {(user.userType == "superAdmin" || user.userType == "admin") &&
              hasPermissionForSlug("delete-agent-marketplace") && (
                <button onClick={handleDeleteMultipleClick} className="cancel-btn">
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
            scroll={{ x: "max-content" }}
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredData}
            pagination={{ pageSize: 20 }}
            rowKey="uuid"
          />
        )}
      </div>

      <ModalMain
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        handleOk={handleSubmit(onSubmit)}
        title="Create or Update Coupon Discount"
        isLoading={isUploading}
        modalClass={" !z-[10000]"}
      >
        <form className="pb-3">
          <div className="grid grid-cols-1  gap-4">
            <div className="flex flex-col">
              <label>
                Coupon Code <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("coupon_code", {
                  required: "Coupon code is required",
                })}
                type="text"
                placeholder="Enter Coupon Code"
                className=""
              />
              {errors.coupon_code && (
                <p className="text-red-500 text-sm">
                  {errors.coupon_code.message}
                </p>
              )}
            </div>
            <div className="flex flex-col">
              <label>Discount</label>
              <input
                {...register("discount")}
                type="number"
                placeholder="Enter Discount"
              />

              {errors.discount && (
                <p className="text-red-500 text-sm">
                  {errors.discount.message}
                </p>
              )}
            </div>
            <div>
              <label className="block ">Type:</label>
              <select {...register("type", { required: true })}>
                <option value="Percentage">Percentage</option>
                <option value="Fixed">Fixed</option>
              </select>
              {errors.type && (
                <span className="text-red-500">Type is required</span>
              )}
            </div>
            <div>
              <label className="block ">
                Discount Scope <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                {...register("discount_scope", { required: true })}
                onChange={(e) => {
                  const value = e.target.value;
                  setValue("discount_scope", value);
                  if (value === "Global") {
                    setSelectedProducts([]);
                    setValue("products", []);
                  }
                }}
              >
                <option value="Global">Global Discount</option>
                <option value="Product Based">Product Based Discount</option>
              </select>
              {errors.discount_scope && (
                <span className="text-red-500">Discount scope is required</span>
              )}
            </div>
            
            {discountScope === "Product Based" && (
              <div className="flex flex-col">
                <label>
                  Select Products <span className="text-red-500 ml-1">*</span>
                </label>
                {isProductsLoading ? (
                  <div className="text-sm text-gray-500">Loading products...</div>
                ) : (
                  <>
                    <Select
                      mode="multiple"
                      placeholder="Select products"
                      value={selectedProducts}
                      onChange={(values) => {
                        setSelectedProducts(values);
                        setValue("products", values);
                      }}
                      loading={isProductsLoading}
                      style={{ width: "100%" }}
                      notFoundContent={
                        (productsData?.data?.TradeProductsData || []).length === 0
                          ? "No products available"
                          : undefined
                      }
                      options={
                        (productsData?.data?.TradeProductsData?.filter((product: any) => product.type === "Purchase") || []).map((product: any) => ({
                          label: product.product_name || "N/A",
                          value: product.uuid,
                        }))
                      }
                    />
                    {(productsData?.data?.TradeProductsData?.filter((product: any) => product.type === "Purchase") || []).length === 0 && !isProductsLoading && (
                      <p className="text-yellow-500 text-sm mt-1">
                        No products available. Please add products first.
                      </p>
                    )}
                    {discountScope === "Product Based" && (!selectedProducts || selectedProducts.length === 0) && (
                      <p className="text-red-500 text-sm mt-1">
                        Please select at least one product
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
            {isSuperAdmin ? (
              <div className="flex flex-col gap-2">
                <label>Branch (If any)</label>
                <Select
                  value={watch("branchId") ?? (activeBranches?.data?.branchData?.length ? activeBranches.data.branchData[0].id : undefined)}
                  onChange={(val) => setValue("branchId", val)}
                  options={activeBranches?.data?.branchData?.map((branch: { id: number; name: string }) => ({
                    value: branch.id,
                    label: branch.name,
                  }))}
                  placeholder="Select Branch (optional = global)"
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
                  <label>Branch</label>
                  <input
                    type="text"
                    value={user?.branch?.name || "No Branch Assigned"}
                    disabled
                    className="border rounded p-2 w-full bg-gray-100"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block ">Status:</label>
              <select {...register("status", { required: true })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              {errors.status && (
                <span className="text-red-500">Status is required</span>
              )}
            </div>
          </div>
        </form>
      </ModalMain>

      <Modal
        title="Confirm Deletion"
        visible={isModalVisible}
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
        Are you sure you want to delete selected Product?
      </Modal>
    </div>
    </div>
  );
};

export default couponManagement;
