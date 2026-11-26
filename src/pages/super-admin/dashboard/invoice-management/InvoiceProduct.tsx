/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import {
  ApplePay,
  GooglePay,
  CreditCard,
  PaymentForm,
} from "react-square-web-payments-sdk";
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
} from "react-image-crop";

/* import { useParams } from "react-router-dom";
import { apiUrl } from "../../../../utils/constant"; */
import setCanvasPreview from "../../../../components/cropper/setCanvasPreview";
import { baseUrl, getFileUrl } from "../../../../utils/constant";
// set ratio of crop image
const ASPECT_RATIO = 1;
const MIN_DIMENSION = 150;
import { square_applicationId } from "../../../../utils/constant";
import { locationId } from "../../../../utils/constant";
// import { getEnvUrls } from "../../../../utils/constant";
import { useEffect, useState, useRef } from "react";
import type { TableColumnsType, TableProps } from "antd";
import ModalMain from "../../../../components/ui/Modal";
import { useForm, Controller } from "react-hook-form";
import {
  Table,
  Modal,
  Button,
  Dropdown,
  Space,
  Select,
  Tag,
  Upload,
  UploadProps,
} from "antd";
import { BsThreeDotsVertical } from "react-icons/bs";
import { RiDeleteBack2Fill } from "react-icons/ri";
import { FaRegEdit, FaShoppingCart, FaEye, FaCrop, FaSearch, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import toast from "react-hot-toast";
import logo from "/logo.svg";
import TableLoader from "../../../../components/loader/TableLoader";
import { UploadOutlined } from "@ant-design/icons";
import {
  useCreateUpdateTradeProductMutation,
  useDeleteTradeProductMutation,
  useDeleteTradeProductMultipleMutation,
  useGetTradeProductQuery,
} from "../../../../redux/api/superadmin/invoice/productDataSlice";

const { Option } = Select;

import { useGetValidatedCouponMutation } from "../../../../redux/api/superadmin/invoice/couponDataSlice";

import { useCreateUpdateOrderMutation } from "../../../../redux/api/superadmin/invoice/orderDataSlice";

import { useAppSelector } from "../../../../redux/hooks";
import { Link } from "react-router-dom";
// import Select from "react-select";
import { useGetAgentListDataQuery } from "../../../../redux/api/superadmin/agent/agentManagementSlice";
import { useGetActiveBranchListDataQuery } from "../../../../redux/api/superadmin/branch/Branchmanagementslice";
import { useNavigate, useLocation } from "react-router-dom";
import ReactQuill from "react-quill-new";
import { usePermissions } from "../../../../utils/permissionUtils";
import { type } from "./../../../../types/FreeHoldSale";
import "react-quill-new/dist/quill.snow.css";
import { formatNumberWithCommasAndDecimals } from "../../../../utils/formatNumberWithCommasAndDecimals";
type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface DataType {
  unit_price: string;
  product_name: string;
  quantity: string;
  description: string;
  uuid: string;
  branchId?: number;
  branchIds?: number[];
}

const ClientPropertyListingManagement = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const { data, isLoading, refetch } = useGetTradeProductQuery();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCheckout, setIsCheckoutMode] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | "null">("null");
  const [selectedRecord, setSelectedRecord] = useState<DataType[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAppSelector((state) => state.user);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [orderStatus, setOrderStatus] = useState("Due");
  const [sourceId, setSourceId] = useState("");
  const sectionRef = useRef();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const [discount, setDiscount] = useState<string | null>(0.0);
  const [taxRate] = useState<string | null>(13.0);
  const [onlineTransectionCharge] = useState<string | null>(5.0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [cartItems, setCartItems] = useState<React.Key[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [isCreateOrderModalVisible, setIsCreateOrderVisible] = useState(false);
  const [deleteClientPropertyListingMultiple] =
    useDeleteTradeProductMultipleMutation();
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([]);
  const [removedFileIds, setRemovedFileIds] = useState<number[]>([]);

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
  // const [agentEmail, setAgentEmail] = useState("");

  const { data: agentList } = useGetAgentListDataQuery("");
  const isSuperAdmin = user?.userType === "superAdmin";
  const { data: activeBranches, isLoading: branchesLoading } = useGetActiveBranchListDataQuery("");

  // State to track quantities for each product
  const [quantities, setQuantities] = useState({});
  const [dueDate, setDueDate] = useState({});
  const [orderItemStatus, setOrderItemStatus] = useState({});

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");

  const handleRemoveFile = (fileToRemove: File) => {
    setNewFiles((prevFiles) =>
      prevFiles.filter((file) => file.name !== fileToRemove.name)
    );
  };

  const handleRemoveExistingFile = (fileToRemove: {
    id: number;
    filePath: string;
  }) => {
    setRemovedFileIds((prev) => [...prev, fileToRemove.id]);
    setExistingFiles((prevFiles) =>
      prevFiles.filter((file) => file.id !== fileToRemove.id)
    );
  };

  const uploadProps: UploadProps = {
    multiple: true,
    beforeUpload: (file) => {
      setNewFiles((prevFiles) => [...prevFiles, file]);
      return false; // Prevent automatic upload
    },
    onRemove: (file) => {
      handleRemoveFile(file as unknown as File);
    },
    fileList: newFiles.map((file) => ({
      uid: file.name,
      name: file.name,
      status: "done",
    })),
  };

  const handleEditorChange = (value: string) => {
    setValue("description", value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [crop, setCrop] = useState<PercentCro | undefined>(undefined);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const applyCoupon = async () => {
    try {
      // Get product UUIDs from cart items (cartItems already contains UUIDs)
      const productIds = cartItems.filter(Boolean) as string[];
      
      const response = await getValidatedCoupon({
        coupon_code: couponCode.trim(),
        product_ids: productIds.length > 0 ? productIds : undefined,
      });

      if (response?.data?.status === false || response?.error) {
        const errorMessage = response?.error?.data?.message || response?.data?.message || "Invalid Coupon Code";
        toast.error(errorMessage);
        setCouponError(errorMessage);
        return;
      }

      if (response.data.message == "Coupon Code Applied") {
        const couponData = response.data.data.CouponData;
        let calculatedDiscount = 0;

        // Check if coupon is product-based
        if (couponData.discount_scope === "Product Based") {
          // Find matching products - cartItems contains UUIDs that should match coupon's products array
          const matchingCartItemUuids = productIds.filter((uuid) =>
            couponData.products && Array.isArray(couponData.products) && couponData.products.includes(uuid)
          );

          if (matchingCartItemUuids.length === 0) {
            toast.error("No matching products in cart for this coupon");
            setCouponError("No matching products in cart for this coupon");
            return;
          }

          // Find matching products from selectedProducts by matching UUIDs
          const matchingProducts = selectedProducts.filter((product) => {
            const tableProduct = tableData.find((item) => item.id === product.id);
            return tableProduct && matchingCartItemUuids.includes(tableProduct.uuid);
          });

          // Calculate total for matching products only
          const matchingProductsTotal = matchingProducts.reduce(
            (sum, item) => sum + Number(item.total_price),
            0
          );

          if (couponData.type == "Percentage") {
            calculatedDiscount = (matchingProductsTotal * parseFloat(couponData.discount)) / 100;
          } else {
            // Fixed discount - total amount off
            calculatedDiscount = parseFloat(couponData.discount);
          }
        } else {
          // Global discount - apply to entire subtotal
          if (couponData.type == "Percentage") {
            calculatedDiscount =
              (parseFloat(calculateSubTotal()) * parseFloat(couponData.discount)) / 100;
          } else {
            calculatedDiscount = parseFloat(couponData.discount);
          }
        }

        setDiscount(calculatedDiscount);
        setAppliedCoupon(couponCode.trim());
        setCouponError("");
        toast.success(response?.data?.message || "Coupon Code Applied");
      } else {
        setCouponError(response.data.message || "Invalid Coupon Code");
        toast.error(response.data.message || "Invalid Coupon Code");
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Failed to validate coupon";
      toast.error(errorMessage);
      setCouponError(errorMessage);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    setDiscount(0.0);
  };

  // Handle input change to update quantity
  const handleQuantityChange = (uuid, value) => {
    // Remove leading zeros and convert to number
    const sanitizedValue = value.replace(/^0+(?=\d)/, "") || "0";

    const item = tableData.find((item) => item.uuid === uuid);
    if (!item) {
      toast.error(`Item with UUID ${uuid} not found in tableData.`);
      return;
    }

    setQuantities((prev) => ({
      ...prev,
      [uuid]: sanitizedValue,
    }));
  };

  const handleQuantityIncrement = (uuid) => {
    setQuantities((prev) => {
      const currentValue = Number(prev[uuid] || 0); // Convert to number

      const item = tableData.find((item) => item.uuid === uuid);
      if (!item) {
        toast.error(`Item with UUID ${uuid} not found in tableData.`);
        return prev;
      }

      return {
        ...prev,
        [uuid]: currentValue + 1,
      };
    });
  };

  const handleQuantityDecrement = (uuid) => {
    setQuantities((prev) => ({
      ...prev,
      [uuid]: Math.max((prev[uuid] || 0) - 1, 0), // Decrement quantity but not below 0
    }));
  };

  useEffect(() => {
    if (!cartItems.length || !tableData?.length) {
      setSelectedProducts([]);
    } else {
      const filteredProducts = tableData
        .filter((item) => cartItems.includes(item.uuid))
        .map((item) => ({
          id: item.id,
          name: item.product_name,
          unit_price: item.unit_price,
          total_price: (quantities[item.uuid] || 0) * item.unit_price,
          due_date: dueDate[item.uuid],
          order_item_status: "Purchase", // Always set to Purchase
          quantity: quantities[item.uuid] || 0,
        }));
      setSelectedProducts(filteredProducts);
    }
  }, [cartItems, tableData, quantities, dueDate]);

  const handleRemoveItem = (uuid) => {
    /* if (e) e.preventDefault();  */
    setCartItems((prev) => prev.filter((key) => key !== uuid));
    setQuantities((prev) => {
      const updatedQuantities = { ...prev };
      delete updatedQuantities[uuid]; // Remove quantity for the specific product
      return updatedQuantities;
    });
  };

  const handleAddToCart = (uuid, quantity = 1, e) => {
    if (e) e.preventDefault();
    const itemExists = cartItems.some((item) => item == uuid);

    if (!itemExists) {
      setCartItems((prev) => [...prev, uuid]);
      setQuantities((prev) => ({
        ...prev,
        [uuid]: quantity,
      }));
      
      // Always set to Purchase
      setOrderItemStatus((prev) => ({
        ...prev,
        [uuid]: "Purchase",
      }));
      
      toast.success("Item added to cart successfully!");
    } else {
      toast.error("Item already in cart!");
    }
  };

  const toggleCheckoutState = () => {
    setIsCheckoutMode((prev) => !prev);
  };

  const agentOptions =
    agentList?.data?.userData?.map((agent: any) => ({
      value: agent.user.id,
      email: agent.user.email,
      firstName: agent?.user?.firstName,
      lastName: agent?.user?.lastName,
      label: `${agent?.user?.name}`,
    })) || [];

  type TabType = {
    id: number;
    name: string;
  };
  const tabs: TabType[] = [
    {
      id: "0",
      name: "Product for Purchase",
      link: `/dashboard/marketplace/purchase-product-list`,
    },
    {
      id: "1",
      name: "Order History",
      link: "/dashboard/marketplace/order-history",
    },
  ];

  const navigate = useNavigate();
  const location = useLocation();

  const activeTab =
    tabs.find((tab) => tab.link === location.pathname)?.id || tabs[0].id;

  const [activeKey, setActiveKey] = useState(activeTab);

  const handleTabChange = (key: string) => {
    const tab = tabs.find((t) => t.id === key);
    if (tab) {
      setActiveKey(key); // Update the active tab
      navigate(tab.link); // Update the URL
    }
  };

  // Filter only purchase products
  useEffect(() => {
    if (data?.data?.TradeProductsData) {
      const purchaseProducts = data.data.TradeProductsData.filter(
        (product: DataType) => product.type === 'Purchase'
      );
      setTableData(purchaseProducts);
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
    control,
  } = useForm<DataType>({});

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
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

  const [createUpdateTradeProduct] = useCreateUpdateTradeProductMutation();
  const [createUpdateOrder] = useCreateUpdateOrderMutation();
  const [getValidatedCoupon] = useGetValidatedCouponMutation();
  const [deletePropertyListing] = useDeleteTradeProductMutation();

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    setIsDetailsModalOpen(false);
    setIsEditMode(false);
    setImageFile(null);
    setSelectedImage(null);
    setSelectedUUID("null");
  };

  const resetCart = () => {
    //Create Order
    setValue("agentId", "");
    setValue("status", "");
    setValue("total_amount", "");
    setValue("product_ids", "");
    setValue("payment_method", "");
    setValue("discount", "");
    setSelectedProducts([]);
    setCartItems([]);
    setPaymentMethod("");
    setIsCheckoutMode(true);
    setDiscount(0.0);
    removeCoupon();
  };
  const resetForm = () => {
    setValue("product_name", "");
    setValue("unit_price", "");
    setValue("quantity", "");
    setValue("description", "");
    if (isSuperAdmin) {
      setValue("branchIds", []);
    } else {
      setValue("branchIds", user?.branchId != null ? [user.branchId] : []);
    }
    setNewFiles([]);
    setExistingFiles([]);
    setRemovedFileIds([]);
    setIsEditMode(false);
    setSelectedUUID("null");
    setImageFile(null);
    setSelectedImage(null);

    setIsCreateOrderVisible(false);
  };

  const handleEdit = (record: DataType) => {
    reset(record);
    // Support both branchIds (multiple) and branchId (single) from API
    const ids = (record as any).branchIds ?? ((record as any).branchId != null ? [(record as any).branchId] : []);
    setValue("branchIds", ids);
    setExistingFiles(record.tradeFile || []);
    setIsEditMode(true);
    setSelectedUUID(record.uuid);
    showModal();
  };
  const handleShow = (record: DataType) => {
    setIsDetailsModalOpen(true);
    setSelectedRecord(record);
  };

  const confirmDelete = async () => {
    if (!selectedUUID) return; // Add check to avoid undefined
    try {
      const response = await deletePropertyListing(selectedUUID).unwrap();
      toast.success(response?.message);
      setTableData(
        tableData.filter((item): any => item?.uuid !== selectedUUID)
      );
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
  const cancelCreateOrder = () => {
    resetForm();
  };

  const handleDelete = (uuid: string) => {
    setSelectedUUID(uuid);
    setIsModalVisible(true);
  };
  const goCheckout = () => {
    setIsCheckoutMode(true);
  };
  const goBack = () => {
    setIsCheckoutMode(false);
  };

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
    }
  };

  useEffect(() => {
    if (sourceId) {
      handleCreateOrder();
    } else {
      console.error("Source ID is null or empty");
    }
  }, [sourceId]);

  const handleCreateOrder = async () => {
    if (loading === true) {
      return toast.error("Please wait, your order is being processed");
    }

    setLoading(true);
    if (user.userType === "agent") {
      setValue("agentId", user.id);
    }

    setValue("product_ids", selectedProducts);
    setValue("discount", discount);
    setValue("status", orderStatus);
    setValue("tax", calculateTax(calculateSubTotal(), discount, taxRate));
    setValue(
      "online_transection_charge",
      calculateOnlineTransectionCharge(
        calculateSubTotal(),
        discount,
        onlineTransectionCharge
      )
    );
    setValue("total_amount", calculateSubTotal());

    if (getValues().payment_method == "Card") {
      setValue("sourceId", sourceId);
    }

    const data = getValues();

    data.order_type = 'purchase'

    try {
      const response = await createUpdateOrder({
        uuid: selectedUUID,
        data,
      });
      if (response?.data?.status === true) {
        refetch();
        resetCart();
      }

      handleResponse(response);
    } catch (error: any) {
      toast.error("Order Create failed. Something went wrong!");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    setIsUploading(true);
    const data = getValues();
    data.imageFile = imageFile;
    data.type = 'Purchase'; // Always set to Purchase
    data.removedFileIds = JSON.stringify(removedFileIds);
    // Ensure branchIds is always an array for API (support multiple branches)
    if (!Array.isArray(data.branchIds) && (data as any).branchId != null) {
      data.branchIds = [(data as any).branchId];
    }
    if (!Array.isArray(data.branchIds)) {
      data.branchIds = [];
    }

    const formData = new FormData();

    // Handle attachments dynamically
    newFiles.forEach((file) => {
      formData.append("attachments", file);
    });
    // Append all fields dynamically
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0 && value[0] instanceof File) {
          // Handle multiple file uploads
          value.forEach((file) => {
            formData.append(`${key}[]`, file); // Append files properly
          });
        } else {
          formData.append(key, JSON.stringify(value)); // Convert other arrays to JSON string
        }
      } else if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else {
        formData.append(key, value || "");
      }
    });

    try {
      const response = await createUpdateTradeProduct({
        uuid: selectedUUID,
        data: formData,
      });

      handleResponse(response);
    } catch (error: any) {
      toast.error("Update failed. Something went wrong!");
      console.error("Error:", error);
    } finally {
      setIsUploading(false);
      if (isEditMode) {
        setIsEditMode(false);
        setSelectedUUID("null"); // Use null instead of 'null'
      }
    }
  };

  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true); // Show delete confirmation modal
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteClientPropertyListingMultiple(
          selectedRowKeys
        );
        setIsDeleteModalMultipleVisible(false);
        // Ensure the refetch waits for the data to be refreshed
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
      toast.error("Please Select Items.");
    }
  };

  const calculateTax = (total, discount, taxRate) => {
    // Ensure inputs are numbers and default to 0 if invalid
    const validTotal = parseFloat(total) || 0;
    const validDiscount = parseFloat(discount) || 0;
    const validTaxRate = parseFloat(taxRate) || 0;

    // Calculate taxable amount and tax
    const taxableAmount = validTotal - validDiscount;
    const tax = (taxableAmount * validTaxRate) / 100;

    // Return tax rounded to 2 decimal places
    return parseFloat(tax.toFixed(2));
  };
  const calculateOnlineTransectionCharge = (total, discount, percent) => {
    // Ensure inputs are numbers and default to 0 if invalid
    const validTotal = parseFloat(total) || 0;
    const validDiscount = parseFloat(discount) || 0;
    const transectionTaxRate = parseFloat(percent) || 0;

    // Calculate taxable amount and tax
    const taxableAmount = validTotal - validDiscount;
    const tax = (taxableAmount * transectionTaxRate) / 100;

    // Return tax rounded to 2 decimal places
    return paymentMethod === "Card" ? parseFloat(tax.toFixed(2)) : 0.0;
  };
  const calculateSubTotal = () => {
    const subTotalAmount = selectedProducts?.reduce(
      (sum, item) => sum + Number(item.total_price),
      0
    );
    return parseFloat(subTotalAmount).toFixed(2);
  };

  //Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // Safely access the first file
    if (!file) return; // Return if no file is selected

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const imageElement = new Image();
      const imageUrl = reader.result?.toString() || ""; // Safely convert result to string
      imageElement.src = imageUrl;

      imageElement.addEventListener("load", (event: Event) => {
        const { naturalWidth, naturalHeight } =
          event.currentTarget as HTMLImageElement;

        setImageFile(null); // Resetting the file

        if (naturalWidth < MIN_DIMENSION || naturalHeight < MIN_DIMENSION) {
          alert("Image must be at least 1000 x 500 pixels.");
          return setSelectedImage(""); // Reset the selected image if the dimensions are invalid
        }

        // Set the selected image if the dimensions are valid
        setSelectedImage(imageUrl);
      });
    });

    reader.readAsDataURL(file); // Read the file as Data URL
  };

  // crop image
  const onImageLoad = (e: React.ChangeEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const cropWidthInPercent = (MIN_DIMENSION / width) * 100;

    const crop = makeAspectCrop(
      {
        unit: "%",
        width: cropWidthInPercent,
      },
      ASPECT_RATIO,
      width,
      height
    );
    const centeredCrop = centerCrop(crop, width, height);

    setCrop(centeredCrop);
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: "#",
      key: "serial",
      width: 50,
      render: (_, __, index) => index + 1,
      fixed: "left",
    },
    {
      title: "Thumbnail",
      dataIndex: "image",
      key: "image",
      render: (image, index) => (
        <div
          className="relative flex items-center justify-center w-[30px] h-[30px] rounded-full bg-gray-200 cursor-pointer"
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <img
            src={
              image
                ? image
                : "https://ui-avatars.com/api/?name=PThumbnail&background=random"
            }
            alt="Product Thumbnail"
            className="w-full h-full rounded-full object-cover"
          />

          {/* Enlarged Image Popup - Only Show for Hovered Row */}
          {hoveredIndex === index && (
            <div className="fixed inset-[450px] flex items-center justify-center  z-[9999]">
              <div className="relative w-[450px] h-[450px] rounded-lg bg-white shadow-xl border border-gray-300 flex items-center justify-center">
                <img
                  onMouseLeave={() => setHoveredIndex(null)}
                  src={
                    image
                      ? image
                      : "https://ui-avatars.com/api/?name=PThumbnail&background=random"
                  }
                  alt="Enlarged Thumbnail"
                  className="w-full h-full rounded-lg object-cover"
                />
              </div>
            </div>
          )}
        </div>
      ),
      width: 240,
    },
    {
      title: "Product Name",
      dataIndex: "product_name",
      key: "product_name",
      render: (product_name, record) => (
        <span
          onClick={() => handleShow(record)}
          className="hover:text-blue-600 cursor-pointer hover:underline"
          style={{
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.target.style.color = "#69B1FF")}
          onMouseLeave={(e) => (e.target.style.color = "")}
        >
          {product_name || "N/A"}
        </span>
      ),
      width: 240,
    },
    {
      title: "Unit Value",
      dataIndex: "unit_price",
      key: "unit_price",
      render: (unit_price) => (
        <span>${formatNumberWithCommasAndDecimals(unit_price || "0.00")}</span>
      ),
    },
    

    ...(user.userType === "superAdmin" || user.userType === "admin"
      ? [
        {
          title: "Instock",
          dataIndex: "quantity",
          key: "quantity",
          render: (quantity) => (
            <span>{formatNumberWithCommasAndDecimals(quantity || "0.00")}</span>
          ),
        },
          
        ]
      : []),

    {
      title: "Add to Cart",
      dataIndex: "uuid",
      key: "uuid",
      render: (uuid, records) => (
        <button
          type="button"
          onClick={(e) => handleAddToCart(uuid, 1, e)} // Correctly passing the function reference
          className="primary-btn mx-3"
        >
          {selectedProducts.some((item) => item.id === records.id)
            ? "âœ“ Added"
            : "Add to Cart"}
        </button>
      ),
      width: 240,
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
              ...((user.userType === "superAdmin" ||
                user.userType === "admin") &&
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
                    ...((user.userType === "superAdmin" ||
                      user.userType === "admin") &&
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
    },
  ];

  //=============== columns for cart table
  const cartItemColumns = [
    {
      title: "Product Thumbnail",
      dataIndex: "image",
      key: "image",
      render: (image) => (
        <img
          className="w-[80px] h-[80px] rounded-full"
          src={getFileUrl(image)}
          alt=""
        />
      ),

      width: 240,
    },
    {
      title: "Product Name",
      dataIndex: "product_name",
      key: "product_name",
      render: (product_name) => <span>{product_name || "N/A"}</span>,

      width: 240,
    },
    ...((user.userType === "superAdmin" || user.userType === "admin") 
    ? [
        {
          title: "Instock",
          dataIndex: "quantity",
          key: "quantity",
          render: (quantity) => <span>{quantity || 0}</span>,
          width: 160,
        },
      ]
    : []
  ),
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: 150,

      render: (quantity, record) => (
        <div className="flex items-center gap-2 ">
          <button
            type="button"
            className="border rounded px-2 py-1 bg-gray-100 hover:bg-gray-200"
            onClick={() => handleQuantityDecrement(record.uuid)}
          >
            -
          </button>
          <div>
            <input
              type="number"
              className="!w-12  text-center border rounded px-1 !py-1"
              min="0"
              value={quantities[record.uuid] || 0}
              onChange={(e) =>
                handleQuantityChange(record.uuid, e.target.value)
              }
            />
          </div>
          <button
            type="button"
            className="border rounded px-2 py-1 bg-gray-100 hover:bg-gray-200"
            onClick={() => handleQuantityIncrement(record.uuid)}
          >
            +
          </button>

          {/* --- remoove button ----- */}
          <div>
            <button
              onClick={() => handleRemoveItem(record.uuid)}
              className=" text-red-700 duration-200 hover:!text-red-500 flex-center "
              style={{ fontSize: "20px" }}
              type="button"
            >
              <MdDelete />
            </button>
          </div>
        </div>
      ),
    },
  ];

  //================ columns for checkout  table
  const checkoutItemColumns = [
    {
      title: "Product Name",
      dataIndex: "name",
      key: "name",
      render: (product_name) => <span>{product_name || "N/A"}</span>,
      width: 240,
    },
    {
      title: "Unit Value",
      dataIndex: "unit_price",
      key: "unit_price",
      render: (unit_price) => (
        <span>${formatNumberWithCommasAndDecimals(unit_price)}</span>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Total Price",
      dataIndex: "total_price",
      key: "total_price",
      render: (total_price) => (
        <span>${formatNumberWithCommasAndDecimals(total_price)}</span>
      ),
    },
  ];

  // searchable select on cart

  const showModal = () => setIsModalOpen(true);
  const showCreateOrderModal = () => {
    if (cartItems?.length) {
      setIsCreateOrderVisible(true);
    } else {
      toast.error("Please Select Products");
    }
  };
  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Toolbar + Tabs row */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          {/* Tabs */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={tab.link}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap no-underline ${
                  location.pathname === tab.link
                    ? "bg-[#0f766e] text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {tab.name}
              </Link>
            ))}
          </div>
          {/* Spacer */}
          <div className="flex-1" />
          {/* Search */}
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
              onClick={showCreateOrderModal}
              className="primary-btn flex items-center gap-2"
              aria-label={`Shopping Cart with ${cartItems?.length || 0} items`}
            >
              <FaShoppingCart className="text-lg" />
              <span>{cartItems?.length || 0}</span>
            </button>
            {(user.userType == "superAdmin" || user.userType == "admin") &&
              hasPermissionForSlug("create-agent-marketplace") && (
                <button onClick={() => { resetForm(); showModal(); }} className="primary-btn">
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
        title="Create or Update Purchase-Products"
        isLoading={isUploading}
        modalClass={"lg:!w-[50%] !z-[10000]"}
      >
        <form className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1/2">
                <label
                  htmlFor="image"
                  className=" border-dashed py-1 max-w-[250px] px-5 cursor-pointer text-center rounded-md border border-gray-600"
                >
                  <span>Upload Thumbnail</span>
                  <input
                    onChange={handleImageUpload}
                    className=" hidden"
                    type="file"
                    id="image"
                  />
                </label>
              </div>

              {/* croper start  */}

              <div>
                {imageFile ? (
                  ""
                ) : (
                  <div className="">
                    {selectedImage && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                          <div>
                            <ReactCrop
                              crop={crop}
                              onChange={(percentCrop) => setCrop(percentCrop)}
                              circularCrop
                              keepSelection
                              aspect={ASPECT_RATIO}
                              minWidth={MIN_DIMENSION}
                            >
                              <img
                                ref={imgRef}
                                src={selectedImage}
                                alt="Upload"
                                onLoad={onImageLoad}
                              />
                            </ReactCrop>
                            <button
                              className="text-white font-mono text-xs py-2 px-4 rounded-2xl mt-4 cursor-pointer bg-[#0b3b38] w-[200px] text-center hover:bg-[#0b3b38]"
                              onClick={() => {
                                if (
                                  imgRef.current &&
                                  previewCanvasRef.current
                                ) {
                                  if (crop) {
                                    const croppedArea = convertToPixelCrop(
                                      crop,
                                      imgRef.current.width,
                                      imgRef.current.height
                                    );

                                    setCanvasPreview(
                                      imgRef.current,
                                      previewCanvasRef.current,
                                      croppedArea
                                    );

                                    const dataUrl =
                                      previewCanvasRef.current.toDataURL();
                                    setImageFile(dataUrl);
                                  } else {
                                    console.error(
                                      "Crop is undefined, please set a valid crop."
                                    );
                                  }
                                } else {
                                  console.error(
                                    "Image or Canvas reference is null"
                                  );
                                }
                              }}
                            >
                              <FaCrop className="inline-block mr-2" />
                              Crop Image
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {crop && (
                  <canvas
                    ref={previewCanvasRef}
                    className="mt-4"
                    style={{
                      display: "none",
                      border: "1px solid black",
                      objectFit: "contain",
                    }}
                  />
                )}
              </div>

              {/* croper end */}

              <div className="w-1/2 flex justify-center">
                {imageFile ? (
                  <img
                    className="w-[120px] h-[120px] rounded-full"
                    src={imageFile}
                    alt=""
                  />
                ) : (
                  <div className="flex items-center justify-center w-[120px] h-[120px] rounded-full bg-gray-200">
                    {watch("image") ? (
                      <img
                        src={watch("image")}
                        alt="Product Thumbnail"
                        className="rounded-full"
                      />
                    ) : (
                      <img
                        src="https://ui-avatars.com/api/?name=PThumbnail&background=random"
                        alt="Product Thumbnail"
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Product Name */}
            <div className="flex flex-col ">
              <label>
                Product Name <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("product_name", {
                  // required: "Product name is required",
                })}
                type="text"
                placeholder="Enter Product Name"
                className=""
              />
              {errors.product_name && (
                <p className="text-red-500 text-sm">
                  {errors.product_name.message}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="flex flex-col ">
              <label>
                Quantity <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("quantity")}
                type="number"
                placeholder="Enter Quantity"
              />

              {errors.quantity && (
                <p className="text-red-500 text-sm">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="flex flex-col ">
              <label>
                Unit Value <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("unit_price")}
                type="text"
                placeholder="Enter Price"
              />

              {errors.unit_price && (
                <p className="text-red-500 text-sm">
                  {errors.unit_price.message}
                </p>
              )}
            </div>

            {/* Branch (superAdmin: multi-select; others: hidden + display) */}
            {isSuperAdmin ? (
              <div className="flex flex-col gap-2">
                <label>Branches (Select one or more)</label>
                <Select
                  mode="multiple"
                  value={watch("branchIds") ?? []}
                  onChange={(val) => setValue("branchIds", val ?? [])}
                  options={activeBranches?.data?.branchData?.map((branch: { id: number; name: string }) => ({
                    value: branch.id,
                    label: branch.name,
                  }))}
                  placeholder="Select Branches"
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
          </div>
          <div className="flex flex-col  w-full">
            <label>Attachments (If Required)</label>
            <Upload.Dragger {...uploadProps} listType="text">
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag files to this area to upload
              </p>
              <p className="ant-upload-hint">
                Support for a single or bulk upload.
              </p>
            </Upload.Dragger>
            {existingFiles?.length > 0 && (
              <div className="selected-files mt-2">
                {existingFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 mb-1">
                    <a
                      href={file.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {file.filePath?.split("\\").pop()?.split("/").pop()}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingFile(file)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Ã—
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col  w-full">
            <label>Description</label>

            <ReactQuill
              theme={"snow"}
              value={watch("description")}
              id="comment"
              placeholder="Enter description here."
              className="  w-full"
              onChange={handleEditorChange}
              style={{ height: "100px", marginBottom: "40px" }}
            />

            {errors.description && (
              <p className="text-red-500 text-sm">
                {errors.description.message}
              </p>
            )}
          </div>
        </form>
      </ModalMain>

      {/* Create New Order */}

      {/* ====== cart modal =======s */}
      <ModalMain
        handleCancel={cancelCreateOrder}
        isModalOpen={isCreateOrderModalVisible}
        handleCheckout={goCheckout}
        handleCheckoutState={isCheckout}
        toggleCheckoutState={toggleCheckoutState}
        checkoutBtnText=" Checkout"
        showOkButton={false}
        handleBack={goBack}
        backBtnText="Back"
        handleOk={handleSubmit(handleCreateOrder)}
        title="Cart"
        isLoading={isUploading}
        modalClass={"!w-full lg:!w-[50%] !z-[10000]  "}
      >
        <form className="space-y-3 overflow-y-auto ">
          {isCheckout &&
            (user.userType == "superAdmin" || user.userType == "admin") && (
              <div className="grid grid-cols-1 sm:grid-cols-2  gap-4 mb-6 ">
                {/* Select Agent */}
                <div className="flex flex-col gap-2 ">
                  <div className="flex flex-col ">
                    <label htmlFor="">Select Agent From Existing One</label>

                    <Controller
                      name="agentId"
                      control={control}
                      // rules={{ required: "Agent is required" }}
                      defaultValue={user.userType === "agent" ? user.id : ""}
                      render={({ field }) => (
                        <Select
                          {...field}
                          disabled={user.userType === "agent"}
                          placeholder="Select Agent"
                          showSearch
                          rootClassName="custom-select "
                          optionFilterProp="children"
                          style={{ width: "100%" }}
                          allowClear
                          onChange={(value) => field.onChange(value)}
                          onBlur={field.onBlur}
                        >
                          <option value="" disabled>
                            Select Agent
                          </option>
                          {agentOptions?.map((agent, i) => (
                            <Option key={i} value={agent.value}>
                              {agent.label}
                            </Option>
                          ))}
                        </Select>
                      )}
                    />
                  </div>
                  {errors.agentId && (
                    <p className="text-red-500 text-sm">
                      {errors.agentId.message}
                    </p>
                  )}
                </div>
              </div>
            )}

          {/* ====cart ======= */}

          {isCheckout && (
            <Table
              scroll={{ x: "max-content" }}
              dataSource={tableData.filter((item) =>
                cartItems.includes(item.uuid)
              )}
              columns={cartItemColumns}
              pagination={{ pageSize: 20 }}
              rowKey="uuid"
            />
          )}

          {/* ===== checkout ======= */}

          {!isCheckout && (
            <div className="">
              <Table
                scroll={{ x: "max-content" }}
                dataSource={selectedProducts}
                columns={checkoutItemColumns}
                pagination={false}
                rowKey="uuid"
              />

              <div className=" mt-8 grid grid-cols-2 gap-4 mb-8">
                {/*  calculate total /tax/subtotal */}
                <div>
                  <div className="space-y-3 border border-neutral-300/30 p-4 rounded-md">
                    {/* discount */}
                    <div className="flex justify-between  ">
                      <span className="text-sm text-gray-600">Discount</span>
                      <span className="font-medium">
                        {" "}
                        - ${formatNumberWithCommasAndDecimals(discount)}
                      </span>
                    </div>

                    {/* tax */}

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Tax ({taxRate}%)
                      </span>
                      <span className="font-medium">
                        $
                        {formatNumberWithCommasAndDecimals(
                          calculateTax(calculateSubTotal(), discount, taxRate)
                        )}
                      </span>
                    </div>

                    {paymentMethod === "Card" && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Online Payment Charge ({onlineTransectionCharge}%)
                        </span>
                        <span className="font-medium">
                          $
                          {formatNumberWithCommasAndDecimals(
                            calculateOnlineTransectionCharge(
                              calculateSubTotal(),
                              discount,
                              onlineTransectionCharge
                            )
                          )}
                        </span>
                      </div>
                    )}

                    {/* sub total */}
                    <div className="flex justify-between  ">
                      <span className="text-sm text-gray-600">Sub Total</span>
                      <span className="font-medium">
                        {" "}
                        $
                        {formatNumberWithCommasAndDecimals(calculateSubTotal())}
                      </span>
                    </div>

                    {/* total */}
                    <div className="flex justify-between items-center  border-t border-gray-100 pt-2">
                      <span className="text-[16px] font-medium text-gray-900">
                        Total
                      </span>
                      <span className="text-[16px] font-semibold text-gray-900">
                        = $
                        {formatNumberWithCommasAndDecimals(
                          calculateSubTotal() -
                            discount +
                            calculateTax(
                              calculateSubTotal(),
                              discount,
                              taxRate
                            ) +
                            calculateOnlineTransectionCharge(
                              calculateSubTotal(),
                              discount,
                              onlineTransectionCharge
                            )
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* payment method and card info */}
                <div className="shadow-sm space-y-4 border border-neutral-300/30 p-4 rounded-md">
                  {/* payment status */}
                  {(user.userType == "superAdmin" ||
                    user.userType == "admin") && (
                    <div className="flex flex-col ">
                      <label className="">Payment Status</label>
                      <select
                        onChange={(e) => setOrderStatus(e.target.value)}
                        className="border rounded px-2 py-2"
                      >
                        <option value="">Select Status</option>
                        <option value="Paid">Paid</option>
                        <option value="Due">Due</option>
                        <option value="Pending">Pending</option>
                      </select>
                      {errors.status && (
                        <p className="text-red-500 text-sm">
                          {errors.status.message}
                        </p>
                      )}
                    </div>
                  )}

                  {/* payment method */}
                  <div className="flex  flex-col  ">
                    <label className="">Payment Method</label>
                    <select
                      {...register("payment_method")}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="border rounded px-2 py-2"
                    >
                      <option value="" disabled selected>
                        Select Method
                      </option>
                      <option value="Card">Card Payment</option>
                      <option value="Offline">Offline</option>
                    </select>
                    {errors?.payment_method && (
                      <p className="text-red-500 text-sm">
                        {errors.payment_method.message}
                      </p>
                    )}
                  </div>

                  {/* apply coupon */}
                  <div>
                    {!appliedCoupon ? (
                      <div className="flex  gap-2 flex-col">
                        <div className="flex gap-2 items-center w-full">
                          <input
                            type="text"
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                          />
                          <button
                            onClick={applyCoupon}
                            type="button"
                            className="primary-btn"
                          >
                            Apply
                          </button>
                        </div>

                        {couponError && (
                          <p className="text-red-500 text-sm mt-2">
                            {couponError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="text-[13px] font-medium ">
                          Applied Coupon
                        </label>

                        <div className="flex justify-between items-center rounded-md">
                          <Tag color="green-inverse" className="py-1">
                            {appliedCoupon}
                          </Tag>
                          <button
                            type="button"
                            onClick={removeCoupon}
                            className="text-red-500  text-xl hover:text-red-600 duration-200"
                          >
                            <RiDeleteBack2Fill />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {paymentMethod == "Card" && (
                    <div className="payment-container mt-3">
                      <PaymentForm
                        applicationId={square_applicationId}
                        cardTokenizeResponseReceived={async (token) => {
                          if (token && token.token) {
                            setSourceId(token.token);
                          } else {
                            alert("Token is null or empty");
                          }
                        }}
                        locationId={locationId}
                      >
                        <CreditCard
                          buttonProps={{
                            css: {
                              padding: "8px",
                              backgroundColor: "#082624",
                              fontSize: "14px",
                              color: "#fff",
                              "&:hover": {
                                backgroundColor: "#000",
                              },
                            },
                          }}
                        />
                      </PaymentForm>
                    </div>
                  )}

                  {paymentMethod != "Card" && (
                    <div className="mt-6 flex w-full gap-4">
                      <button
                        disabled={loading}
                        type="button"
                        className="flex items-center justify-center w-full primary-btn"
                        onClick={() => handleCreateOrder()}
                      >
                        {loading ? (
                          <svg
                            className="animate-spin h-5 w-5 mr-2 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            ></path>
                          </svg>
                        ) : null}
                        {loading ? "Loading..." : "Confirm Order"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </ModalMain>

      {/* View  product  Details Modal  */}
      <ModalMain
        handleCancel={handleCancel}
        isModalOpen={isDetailsModalOpen}
        hideFooter={true}
        modalClass={"lg:!w-[50%] max-w-screen-md !z-[10000] mx-auto"}
      >
        <div
          className="space-y-3 pt-5 !w-full  "
          ref={sectionRef}
          id="printSection"
        >
          <div className=" flex flex-col  gap-2 ">
            <img src={logo} alt="" className={`w-[50px] mx-auto`} />
            <h2
              className={`tracking-widest text-center text-base playfair-display-sc-bold text-[#0f766e]`}
            >
              ANS REALSTATECRM
            </h2>

            <div className="  mt-8  ">
              <div
                className="flex items-center justify-center w-[80px] h-[80px] rounded-full bg-gray-200 cursor-pointer"
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <img
                  onMouseEnter={() => setHoveredIndex("details")}
                  src={
                    selectedRecord?.image
                      ? selectedRecord?.image
                      : "https://ui-avatars.com/api/?name=PThumbnail&background=random"
                  }
                  alt="Product Thumbnail"
                  className="rounded-full"
                />
              </div>

              {hoveredIndex === "details" && (
                <div className="fixed inset-[450px] flex items-center justify-center  z-[9999]">
                  <div className="relative w-[450px] h-[450px] rounded-lg bg-white shadow-xl border border-gray-300 flex items-center justify-center">
                    <img
                      src={
                        selectedRecord?.image
                          ? selectedRecord?.image
                          : "https://ui-avatars.com/api/?name=PThumbnail&background=random"
                      }
                      alt="Enlarged Thumbnail"
                      className="w-full h-full rounded-lg object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Product Details */}
              <div className="overflow-hidden bg-white  rounded-lg">
                <div className=" space-y-2 ">
                  {/* Title */}
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedRecord.product_name}
                  </h3>

                  {/* Pricing Section */}
                  <div className="space-y-2 ">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 font-medium">
                        Price:
                      </span>
                      <span className="text-lg font-semibold text-primary">
                        $
                        {formatNumberWithCommasAndDecimals(
                          selectedRecord.unit_price
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 font-medium">
                        Available Quantity:
                      </span>
                      <span className="font-medium bg-[#0f766e]/15 py-1 rounded-3xl px-3">
                        {selectedRecord.quantity} available
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 font-medium">
                        Branches:
                      </span>
                      {(() => {
                        const branches = activeBranches?.data?.branchData ?? [];
                        const idsRaw =
                          (selectedRecord as any)?.branchIds ??
                          ((selectedRecord as any)?.branchId != null
                            ? [(selectedRecord as any).branchId]
                            : []);
                        const ids = Array.isArray(idsRaw)
                          ? Array.from(
                              new Set(
                                idsRaw
                                  .map((x: any) => Number(x))
                                  .filter((n: any) => Number.isFinite(n))
                              )
                            )
                          : [];

                        // Fallback for old payloads where `branch` is included but ids are missing
                        if (ids.length === 0 && (selectedRecord as any)?.branch?.name) {
                          return (
                            <div className="flex flex-wrap justify-end gap-1">
                              <Tag color="gold">
                                {(selectedRecord as any).branch.name}
                              </Tag>
                            </div>
                          );
                        }

                        if (ids.length === 0) {
                          return (
                            <span className="text-sm text-gray-500">
                              No branch assigned
                            </span>
                          );
                        }

                        return (
                          <div className="flex flex-wrap justify-end gap-1">
                            {ids.map((id: number) => {
                              const name =
                                branches.find((b: any) => b.id === id)?.name ??
                                `#${id}`;
                              return (
                                <Tag key={id} color="gold">
                                  {name}
                                </Tag>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 font-medium">
                        Attachments:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {selectedRecord.tradeFile &&
                        selectedRecord.tradeFile.length > 0 ? (
                          selectedRecord.tradeFile.map((file) => (
                            <a
                              key={file.id}
                              href={`${file.filePath}`} // Linking to the file path
                              className="text-sm text-[#0f766e] font-medium bg-[#0f766e]/10 py-1 px-3 rounded-3xl hover:bg-[#0f766e]/20 hover:text-white transition duration-200"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {file.filePath.split("/").pop()}
                            </a>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">
                            No attachments available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <hr className="!my-4" />

                  {/* Description Section */}
                  {selectedRecord.description && (
                    <div>
                      <h4 className="text-lg font-semibold mb-2">
                        Description
                      </h4>

                      <div
                        dangerouslySetInnerHTML={{
                          __html: selectedRecord.description,
                        }}
                      ></div>
                    </div>
                  )}

                  {/* add to cart btn */}
                  <div className=" flex justify-end  !mt-6">
                    <button
                      type="button"
                      onClick={(e) =>
                        handleAddToCart(selectedRecord.uuid, 1, e)
                      }
                      className="primary-btn "
                    >
                      {selectedProducts.some(
                        (item) => item.id === selectedRecord.id
                      )
                        ? "âœ“ Added"
                        : "Add to Cart"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
    </div>
  );
};

export default ClientPropertyListingManagement;