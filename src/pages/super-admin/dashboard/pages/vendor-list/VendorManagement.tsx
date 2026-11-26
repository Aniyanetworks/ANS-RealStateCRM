/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useState, useEffect, useMemo, useCallback } from "react";
import type { TableColumnsType, TableProps } from "antd";
import { useForm } from "react-hook-form";
import { 
  Table, 
  Modal, 
  Button, 
  Dropdown, 
  Space, 
  Tooltip, 
  Select, 
  Tag,
  Descriptions,
  Checkbox,
  Input
} from "antd";
import {
  useGetVendorsQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteMultipleVendorsMutation,
  useUpdateVendorStatusMutation,
  useGetCompaniesQuery,
  useShareVendorMutation
} from "../../../../../redux/api/superadmin/vendorSlice";
import { FaRegEdit } from "react-icons/fa";
import { MdDelete, MdShare } from "react-icons/md";
import toast from "react-hot-toast";
import TableLoader from "../../../../../components/loader/TableLoader";
import { BsThreeDotsVertical } from "react-icons/bs";
import { usePermissions } from "../../../../../utils/permissionUtils";
import { AiFillWarning } from "react-icons/ai";
import { formatPhoneNumber } from "../../../../../utils/format";
import { useAppSelector } from "../../../../../redux/hooks";
import { Link } from "react-router-dom";
import {
  useGetVendorCategoryQuery,
  useCreateVendorCategoryMutation,
  useUpdateVendorCategoryMutation,
  useDeleteMultipleVendorCategoryMutation,
} from "../../../../../redux/api/superadmin/vendorCategoryDataSlice";

import { FaSearch, FaTimes, FaExternalLinkAlt, FaFacebook, FaInstagram, FaLinkedin, FaYoutube, FaTiktok } from "react-icons/fa";

type TableRowSelection<T extends object = object> = TableProps<T>["rowSelection"];

interface Vendor {
  id: number;
  companyId: number | null;
  category: string[];
  contactPerson: string;
  contactPersonPhoneNumber: string;
  email: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  isCompanyAsVendor?: boolean;
  company?: {
    id: number;
    companyName: string;
    companyWebsite: string;
    companyPhoneNumber: string;
    companyEmail: string;
    category: string[];
    discountType?: string;
    discount?: string;
    socialUrls?: SocialUrl[];
  };
}

interface Company {
  id: number;
  companyName: string;
  companyWebsite: string;
  companyPhoneNumber: string;
  companyEmail: string;
  category: string[];
  discountType?: string;
  discount?: string;
  socialUrls?: SocialUrl[];
}

interface SocialUrl {
  id: number;
  platform: string;
  handle: string;
  fullUrl: string;
  companyId: number;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = [
  {
    label: "Active",
    value: "active",
  },
  {
    label: "Inactive", 
    value: "inactive",
  },
  {
    label: "Pending",
    value: "pending",
  },
];

const SOCIAL_PLATFORMS = [
  { 
    value: 'facebook', 
    label: 'Facebook', 
    icon: FaFacebook, 
    color: '#1877F2',
    prefix: 'https://www.facebook.com/'
  },
  { 
    value: 'instagram', 
    label: 'Instagram', 
    icon: FaInstagram, 
    color: '#E4405F',
    prefix: 'https://www.instagram.com/'
  },
  { 
    value: 'tiktok', 
    label: 'TikTok', 
    icon: FaTiktok, 
    color: '#000000',
    prefix: 'https://www.tiktok.com/@'
  },
  { 
    value: 'linkedin', 
    label: 'LinkedIn', 
    icon: FaLinkedin, 
    color: '#0A66C2',
    prefix: 'https://www.linkedin.com/in/'
  },
  { 
    value: 'youtube', 
    label: 'YouTube', 
    icon: FaYoutube, 
    color: '#FF0000',
    prefix: 'https://www.youtube.com/@'
  },
  { 
    value: 'other', 
    label: 'Other', 
    icon: FaExternalLinkAlt, 
    color: '#6B7280',
    prefix: 'https://'
  }
];

const VendorManagement = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedVendorsForSharing, setSelectedVendorsForSharing] = useState<Vendor[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [emailMessage, setEmailMessage] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  
  const { user } = useAppSelector((state) => state.user);
  const { data: categoriesData } = useGetVendorCategoryQuery("");
  const CATEGORY_OPTIONS = categoriesData?.data?.VendorCategory?.map((cat: any) => cat.name) || [];
  const rawCategories: { id: number; name: string }[] = categoriesData?.data?.VendorCategory || [];

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  const [createVendorCategory] = useCreateVendorCategoryMutation();
  const [updateVendorCategory] = useUpdateVendorCategoryMutation();
  const [deleteMultipleVendorCategory] = useDeleteMultipleVendorCategoryMutation();

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      await createVendorCategory({ name }).unwrap();
      setNewCategoryName("");
      toast.success("Category created!");
    } catch {
      toast.error("Failed to create category.");
    }
  };

  const handleUpdateCategory = async (id: number) => {
    const name = editingCategoryName.trim();
    if (!name) return;
    try {
      await updateVendorCategory({ id, name }).unwrap();
      setEditingCategoryId(null);
      setEditingCategoryName("");
      toast.success("Category updated!");
    } catch {
      toast.error("Failed to update category.");
    }
  };

  const handleDeleteCategory = async (id: number, categoryName: string) => {
    try {
      await deleteMultipleVendorCategory([id]).unwrap();
      // If deleted category was selected in form, remove it
      const current: string[] = getValues("category") || [];
      if (current.includes(categoryName)) {
        setValue("category", current.filter((c) => c !== categoryName));
      }
      toast.success("Category deleted!");
    } catch {
      toast.error("Failed to delete category.");
    }
  };

  // API hooks
  const { data, isLoading, refetch } = useGetVendorsQuery("");
  const { data: companiesData } = useGetCompaniesQuery("");
  
  const [shareVendor] = useShareVendorMutation();
  const [createVendor] = useCreateVendorMutation();
  const [updateVendor] = useUpdateVendorMutation();
  const [deleteMultipleVendors] = useDeleteMultipleVendorsMutation();
  const [updateVendorStatus] = useUpdateVendorStatusMutation();

  // Form
  const {
    register,
    formState: { errors },
    reset,
    getValues,
    setError,
    handleSubmit,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      companyId: "",
      category: [] as string[],
      contactPerson: "",
      contactPersonPhoneNumber: "",
      email: "",
      status: "active"
    }
  });

  const watchCategory = watch("category", []);

  // Combined memoization for all vendor data
  const { allVendorEntries, companiesWithoutVendors, companyAsVendors } = useMemo(() => {
    const vendors = data?.data?.vendors || [];
    const companies = companiesData?.data?.companies || [];

    // Parse vendor categories
    const parsedVendors = vendors.map((vendor: any) => {
      let categoryArray: string[] = [];
      if (vendor.category) {
        if (Array.isArray(vendor.category)) {
          categoryArray = vendor.category;
        } else if (typeof vendor.category === 'string') {
          try {
            const parsed = JSON.parse(vendor.category);
            categoryArray = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            categoryArray = [vendor.category];
          }
        }
      }
      
      return {
        ...vendor,
        category: categoryArray
      };
    });

    // Create vendor entries for companies that don't have vendors
    const companiesWithoutVendors = companies.filter((company: Company) => {
      const hasVendor = parsedVendors.some((vendor: Vendor) => vendor.companyId === company.id);
      return !hasVendor;
    });

    // Convert companies to vendor format
    const companyAsVendors: Vendor[] = companiesWithoutVendors.map((company: Company) => {
      // Handle company category - it might be string or array
      let companyCategory: string[] = [];
      if (company.category) {
        if (Array.isArray(company.category)) {
          companyCategory = company.category;
        } else if (typeof company.category === 'string') {
          try {
            const parsed = JSON.parse(company.category);
            companyCategory = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            companyCategory = [company.category];
          }
        }
      }
      
      return {
        id: -company.id,
        companyId: company.id,
        category: companyCategory,
        contactPerson: company.companyName,
        contactPersonPhoneNumber: company.companyPhoneNumber,
        email: company.companyEmail,
        status: "active",
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        isCompanyAsVendor: true,
        company: {
          ...company,
          category: companyCategory
        }
      };
    });

    // Combine both real vendors and company-as-vendor entries
    const allVendorEntries = [...parsedVendors, ...companyAsVendors];

    return {
      allVendorEntries,
      companiesWithoutVendors,
      companyAsVendors
    };
  }, [data?.data?.vendors, companiesData?.data?.companies]);

  // Filtered data for search
  const filteredData = useMemo(() => {
    return allVendorEntries.filter((record: Vendor) => {
      const searchTerm = searchText?.toLowerCase() || "";
      const extractValues = (obj: any): string[] => {
        if (
          typeof obj === "string" ||
          typeof obj === "number" ||
          typeof obj === "boolean"
        ) {
          return [String(obj).toLowerCase()];
        }
        if (Array.isArray(obj)) {
          return obj.flatMap(extractValues);
        }
        if (obj && typeof obj === "object") {
          return Object.values(obj).flatMap(extractValues);
        }
        return [];
      };
      const allValues = extractValues(record);
      return allValues.some((value) => value.includes(searchTerm));
    });
  }, [allVendorEntries, searchText]);

  // Reset form
  const resetForm = () => {
    reset({
      companyId: "",
      category: [] as string[],
      contactPerson: "",
      contactPersonPhoneNumber: "",
      email: "",
      status: "active"
    });
  };

  // Modal handlers
  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedId(null);
  };

  const handleViewDetails = (record: Vendor) => {
    setSelectedVendor(record);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedVendor(null);
  };

  // Platform helper functions
  const getPlatformIcon = (platformValue: string) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.value === platformValue);
    return platform ? platform.icon : FaExternalLinkAlt;
  };

  const getPlatformColor = (platformValue: string) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.value === platformValue);
    return platform ? platform.color : '#6B7280';
  };

  const handleEdit = (record: Vendor) => {
    if (record.isCompanyAsVendor) {
      // Redirect to company management for editing the company
      window.location.href = `/dashboard/super-admin/companies?edit_id=${record.companyId}`;
      return;
    }
    
    // Ensure category is properly handled
    let categoryArray: string[] = [];
    if (record.category) {
      if (Array.isArray(record.category)) {
        categoryArray = record.category;
      } else if (typeof record.category === 'string') {
        try {
          const parsed = JSON.parse(record.category);
          categoryArray = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          categoryArray = [record.category];
        }
      }
    }

    reset({
      companyId: record.companyId?.toString() || "",
      category: categoryArray,
      contactPerson: record.contactPerson,
      contactPersonPhoneNumber: record.contactPersonPhoneNumber,
      email: record.email,
      status: record.status
    });
    setIsEditMode(true);
    setSelectedId(record.id);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteMultipleVendors({ ids: [selectedId] });
      toast.success("Vendor deleted successfully!");
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
    const vendor = allVendorEntries.find(v => v.id === id);
    if (vendor && vendor.isCompanyAsVendor) {
      toast.error("Cannot delete company entries. Please delete from company management.");
      return;
    }
    setSelectedId(id);
    setIsModalVisible(true);
  };

  // Handle status change
  const handleStatusChange = async (id: number, newStatus: string) => {
    const vendor = allVendorEntries.find(v => v.id === id);
    if (vendor && vendor.isCompanyAsVendor) {
      toast.error("Cannot change status of company entries. Please update from company management.");
      return;
    }
    
    try {
      await updateVendorStatus({ id, status: newStatus });
      toast.success("Vendor status updated successfully!");
      await refetch();
    } catch (error) {
      toast.error("Status update failed!");
    }
  };

  // Phone number formatting handlers
  const handleContactPersonPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatPhoneNumber(value);
    setValue("contactPersonPhoneNumber", formattedValue);
  };

  // Table row selection
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<Vendor> = {
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

  // Delete multiple
  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true);
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      // Filter out company-as-vendor entries
      const deletableIds = selectedRowKeys.filter(id => {
        const vendor = allVendorEntries.find(v => v.id === id);
        return !vendor?.isCompanyAsVendor;
      });

      if (deletableIds.length === 0) {
        toast.error("Cannot delete company entries. Please delete from company management.");
        return;
      }

      try {
        await deleteMultipleVendors({ ids: deletableIds });
        setIsDeleteModalMultipleVisible(false);
        setSelectedRowKeys([]);
        toast.success("Vendors deleted successfully!");
        await refetch();
      } catch (error) {
        setIsDeleteModalMultipleVisible(false);
        toast.error("Failed to delete vendors. Please try again.");
      }
    } else {
      toast.error("Please select vendors to delete.");
    }
  };

  // Share functionality
  const handleShareVendors = () => {
    if (selectedRowKeys.length === 0) {
      toast.error("Please select vendors to share.");
      return;
    }

    const selectedVendors = allVendorEntries.filter(vendor => 
      selectedRowKeys.includes(vendor.id)
    );

    setSelectedVendorsForSharing(selectedVendors);
    setIsShareModalOpen(true);
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
    setSelectedEmails([]);
    setEmailMessage("");
  };

  const handleSendEmail = async () => {
    // Clean and validate emails one more time before sending
    const cleanedEmails = selectedEmails
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (cleanedEmails.length === 0) {
      toast.error("Please enter at least one valid email address.");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = cleanedEmails.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email format: ${invalidEmails.join(', ')}`);
      return;
    }

    setIsSharing(true);
    try {
      // Prepare vendor data for email
      const vendorTableData = selectedVendorsForSharing.map(vendor => {
        const categories = vendor.isCompanyAsVendor 
          ? (Array.isArray(vendor.company?.category) 
              ? vendor.company.category.join(', ') 
              : vendor.company?.category || "Company")
          : (Array.isArray(vendor.category) 
              ? vendor.category.join(', ') 
              : vendor.category || "N/A");

        return {
          contactPerson: vendor.contactPerson || "N/A",
          company: vendor.isCompanyAsVendor ? "Sole Proprietorship" : (vendor.company?.companyName || "N/A"),
          category: categories,
          email: vendor.email || vendor.company?.companyEmail || "N/A",
          phone: vendor.contactPersonPhoneNumber || vendor.company?.companyPhoneNumber || "N/A"
        };
      });

      console.log("Sending email to:", cleanedEmails);
      console.log("Message:", emailMessage);
      console.log("Vendor Data:", vendorTableData);

      // Send to backend API
      const response = await shareVendor({
        vendors: vendorTableData,
        agentEmails: cleanedEmails,
        comment: emailMessage
      });

      if (response.data?.status) {
        toast.success(`Vendor information shared with ${cleanedEmails.length} email(s)!`);
      } else {
        toast.error(response.error?.data?.message || "Failed to share vendors");
      }

      handleCloseShareModal();
      setSelectedRowKeys([]);
    } catch (error) {
      console.error("Error sharing vendors:", error);
      toast.error("Failed to share vendors. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  // Create/Edit submit
  const onSubmit = async () => {
    const formData = getValues();
    
    // Validate at least one category is selected
    if (!formData.category || formData.category.length === 0) {
      setError("category", { type: "manual", message: "At least one category is required" });
      return;
    }

    // Prepare API data
    const apiData = {
      companyId: formData.companyId ? parseInt(formData.companyId) : null,
      category: formData.category,
      contactPerson: formData.contactPerson,
      contactPersonPhoneNumber: formData.contactPersonPhoneNumber,
      email: formData.email,
      status: formData.status
    };

    if (isEditMode && selectedId) {
      try {
        await updateVendor({ id: selectedId, ...apiData });
        toast.success("Vendor updated successfully!");
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
        await createVendor(apiData);
        toast.success("Vendor created successfully!");
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

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status tag color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'pending': return 'orange';
      default: return 'blue';
    }
  };

  // Get company name by ID
  const getCompanyName = useCallback((companyId: number | null) => {
    if (!companyId) return "N/A";
    const companies = companiesData?.data?.companies || [];
    const company = companies.find((c: Company) => c.id === companyId);
    return company?.companyName || "N/A";
  }, [companiesData?.data?.companies]);

  // Table columns
  const columns: TableColumnsType<Vendor> = [
    {
      title: "#",
      key: "serial",
      width: 80,
      render: (_, __, index) => index + 1,
      fixed: "left",
    },
    {
      title: "Contact Person",
      dataIndex: "contactPerson",
      key: "contactPerson",
      sorter: (a, b) => a.contactPerson?.localeCompare(b.contactPerson),
      ellipsis: true,
      render: (text: string, record: Vendor) => (
        <Tooltip title={`Click to view ${text} details`}>
          <button
            onClick={() => handleViewDetails(record)}
            className="hover:text-blue-600 cursor-pointer hover:underline text-left bg-transparent border-none p-0 text-inherit flex items-center gap-1"
          >
            {text?.length > 20 ? `${text?.slice(0, 20)}...` : text}
          </button>
        </Tooltip>
      ),
      fixed: "left",
      width: 150,
    },
    {
      title: "Company",
      key: "companyName",
      sorter: (a, b) => getCompanyName(a.companyId)?.localeCompare(getCompanyName(b.companyId)),
      ellipsis: true,
      render: (_, record: Vendor) => (
        <Tooltip title={getCompanyName(record.companyId)}>
          <span>
            {getCompanyName(record.companyId)?.length > 20 
              ? `${getCompanyName(record.companyId)?.slice(0, 20)}...` 
              : record.isCompanyAsVendor ? "Sole Proprietorship" : getCompanyName(record.companyId)
            }
          </span>
        </Tooltip>
      ),
      width: 150,
    },
    {
      title: "Platforms",
      key: "platforms",
      width: 120,
      render: (_, record: Vendor) => (
        <div className="flex flex-wrap gap-1">
          {record.company?.socialUrls?.slice(0, 3).map((platform, index) => {
            const PlatformIcon = getPlatformIcon(platform.platform);
            return (
              <Tooltip key={index} title={`${platform.platform}: ${platform.fullUrl}`}>
                <a 
                  href={platform.fullUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-6 h-6 rounded hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: getPlatformColor(platform.platform) }}
                >
                  <PlatformIcon className="text-white text-xs" />
                </a>
              </Tooltip>
            );
          })}
          {record.company?.socialUrls && record.company.socialUrls.length > 3 && (
            <Tag className="text-xs">+{record.company.socialUrls.length - 3}</Tag>
          )}
          {(!record.company?.socialUrls || record.company.socialUrls.length === 0) && (
            <span className="text-gray-500 text-xs">N/A</span>
          )}
        </div>
      ),
    },
    {
      title: "Discount",
      key: "discount",
      width: 150,
      render: (_, record: Vendor) => (
        <div className="flex flex-col gap-1">
          {record.company?.discountType === 'url' && record.company.discount && (
            <a 
              href={record.company.discount} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-xs"
            >
              Discount Link
            </a>
          )}
          {record.company?.discountType === 'coupon' && record.company.discount && (
            <Tag color="green" className="text-xs">
              Code: {record.company.discount}
            </Tag>
          )}
          {(!record.company?.discountType || !record.company.discount) && (
            <span className="text-gray-500 text-xs">N/A</span>
          )}
        </div>
      ),
    },
    {
      title: "Categories",
      dataIndex: "category",
      key: "category",
      sorter: (a, b) => {
        const aCategories = Array.isArray(a.category) ? a.category.join(', ') : a.category || '';
        const bCategories = Array.isArray(b.category) ? b.category.join(', ') : b.category || '';
        return aCategories.localeCompare(bCategories);
      },
      ellipsis: true,
      filters: [
        ...CATEGORY_OPTIONS.map(category => ({
          text: category,
          value: category,
        })),
        { text: "Company", value: "Company" }
      ],
      filterMultiple: false,
      onFilter: (value, record) => {
        if (record.isCompanyAsVendor) {
          const companyCategories = Array.isArray(record.company?.category) 
            ? record.company.category 
            : record.company?.category 
              ? [record.company.category] 
              : [];
          return companyCategories.includes(value as string);
        }
        
        const recordCategories = Array.isArray(record.category) 
          ? record.category 
          : record.category 
            ? [record.category] 
            : [];
        return recordCategories.includes(value as string);
      },
      render: (categories: any, record: Vendor) => {
        // Safely handle categories data
        let categoriesArray: string[] = [];
        
        if (categories) {
          if (Array.isArray(categories)) {
            categoriesArray = categories;
          } else if (typeof categories === 'string') {
            try {
              const parsed = JSON.parse(categories);
              categoriesArray = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
              categoriesArray = [categories];
            }
          }
        }

        // For company-as-vendor, use company categories
        const displayCategories = record.isCompanyAsVendor 
          ? (Array.isArray(record.company?.category) 
              ? record.company.category 
              : record.company?.category 
                ? [record.company.category] 
                : ["Company"])
          : categoriesArray;

        return (
          <div className="flex flex-wrap gap-1">
            {displayCategories.slice(0, 2).map((category, index) => (
              <Tooltip key={index} title={category}>
                <Tag 
                  color={record.isCompanyAsVendor ? "purple" : "blue"} 
                  className="text-xs"
                >
                  {category.length > 15 ? `${category.slice(0, 15)}...` : category}
                </Tag>
              </Tooltip>
            ))}
            {displayCategories.length > 2 && (
              <Tooltip title={displayCategories.slice(2).join(', ')}>
                <Tag className="text-xs">+{displayCategories.length - 2}</Tag>
              </Tooltip>
            )}
            {displayCategories.length === 0 && (
              <span className="text-gray-500 text-xs">N/A</span>
            )}
          </div>
        );
      },
      width: 200,
    },
    {
      title: "Contact Person Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => a.email?.localeCompare(b.email),
      ellipsis: true,
      render: (text: string, record: Vendor) => (
        <Tooltip title={record.isCompanyAsVendor ? record.company?.companyEmail : text}>
          <span>
            {record.isCompanyAsVendor 
              ? (record.company?.companyEmail || "N/A")
              : (text?.length > 25 ? `${text?.slice(0, 25)}...` : text || "N/A")
            }
          </span>
        </Tooltip>
      ),
      width: 200,
    },
    {
      title: "Contact Person Phone",
      dataIndex: "contactPersonPhoneNumber",
      key: "contactPersonPhoneNumber",
      sorter: (a, b) => a.contactPersonPhoneNumber?.localeCompare(b.contactPersonPhoneNumber),
      ellipsis: true,
      render: (text: string, record: Vendor) => (
        <Tooltip title={record.isCompanyAsVendor ? record.company?.companyPhoneNumber : text}>
          <span>
            {record.isCompanyAsVendor 
              ? (record.company?.companyPhoneNumber || "N/A")
              : (text || "N/A")
            }
          </span>
        </Tooltip>
      ),
      width: 150,
    },
    
    ...(user?.userType == "superAdmin"
      ? [
        {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => a.status?.localeCompare(b.status),
      filters: [
        { text: "Active", value: "active" },
        { text: "Inactive", value: "inactive" },
        { text: "Pending", value: "pending" },
      ],
      filterMultiple: false,
      onFilter: (value, record) => record.status === value,
      render: (status: string, record: Vendor) => (
        <Select
          value={status}
          onChange={(value) => handleStatusChange(record.id, value)}
          options={STATUS_OPTIONS}
          style={{ width: '100%' }}
          disabled={user?.userType !== "superAdmin" || record.isCompanyAsVendor || !hasPermissionForSlug("contructor-status-change")}
          dropdownStyle={{ minWidth: 150 }}
        />
      ),
      width: 150,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              hasPermissionForSlug("contructor-edit") && {
                key: "edit",
                label: (
                  <button
                    onClick={() => handleEdit(record)}
                    className="flex items-center gap-2 w-full"
                  >
                    <FaRegEdit /> 
                    {record.isCompanyAsVendor ? "Edit Company" : "Edit"}
                  </button>
                ),
              },
              hasPermissionForSlug("contructor-delete") && !record.isCompanyAsVendor && {
                key: "delete",
                label: (
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="flex items-center gap-2 w-full"
                  >
                    <MdDelete /> Delete
                  </button>
                ),
              },
            ].filter(Boolean),
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
      width: 80,
      align: "center",
    },
      ]
      : []),
  ];

  // Add index for serial number
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
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Vendor Directory</h1>
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
          {user?.userType == "superAdmin" && (
            <>
              {hasPermissionForSlug("vendor-view") && (
                <Link to="/dashboard/super-admin/companies" className="primary-btn">Go to Vendors</Link>
              )}
              {hasPermissionForSlug("contructor-create") && (
                <button onClick={() => setIsModalOpen(true)} className="primary-btn">Create</button>
              )}
              {hasPermissionForSlug("contructor-share") && (
                <button onClick={handleShareVendors} className="primary-btn flex items-center gap-2" disabled={selectedRowKeys.length === 0}>
                  <MdShare /> Share Selected ({selectedRowKeys.length})
                </button>
              )}
              {hasPermissionForSlug("contructor-delete") && (
                <button onClick={handleDeleteMultipleClick} className="cancel-btn">Delete Selected</button>
              )}
            </>
          )}
          {user?.userType == "agent" && (
            <button onClick={handleShareVendors} className="primary-btn flex items-center gap-2" disabled={selectedRowKeys.length === 0}>
              <MdShare /> Share Selected ({selectedRowKeys.length})
            </button>
          )}
        </div>

        <div>
          {isLoading ? (
            <TableLoader />
          ) : (
            <Table
              scroll={{ x: "max-content" }}
              rowSelection={rowSelection}
              columns={columns}
              dataSource={tableSourceData}
              pagination={{ pageSize: 20 }}
              rowKey="id"
            />
          )}
        </div>
      </div>

      {/* Create/Edit Vendor Modal */}
      <Modal
        onCancel={handleCancel}
        open={isModalOpen}
        title={isEditMode ? "Edit Contractor" : "Create New Contractor"}
        width={"800px"}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            onClick={handleSubmit(onSubmit)}
            style={{
              backgroundColor: "#072f2d",
              borderColor: "#072f2d",
              color: "#fff",
            }}
          >
            {isEditMode ? "Update Contractor" : "Create Contractor"}
          </Button>,
        ]}
      >
        <form className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {/* Company Selection */}
            <div className="flex flex-col gap-2">
              <label>Vendor</label>
              <select
                {...register("companyId")}
                className=""
              >
                <option value="">Select Vendor</option>
                {companiesData?.data?.companies?.map((company: Company) => (
                  <option key={company.id} value={company.id}>
                    {company.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label>Categories <span className="text-red-500 ml-1">*</span></label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-xs px-2 py-0.5 rounded bg-[#072f2d] text-white hover:opacity-80"
                >
                  Add/Edit Category
                </button>
              </div>
              <Select
                mode="multiple"
                value={watchCategory}
                onChange={(value) => setValue("category", value)}
                placeholder="Select Categories"
                options={CATEGORY_OPTIONS.map(category => ({
                  label: category,
                  value: category,
                }))}
                className="w-full"
              />
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category.message as string}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>Contact Person <span className="text-red-500 ml-1">*</span></label>
              <input
                {...register("contactPerson", { required: "Contact person is required" })}
                type="text"
                placeholder="Enter Contact Person"
                className=""
              />
              {errors.contactPerson && (
                <p className="text-red-500 text-sm mt-1">{errors.contactPerson.message as string}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>Contact Person Phone</label>
              <input
                {...register("contactPersonPhoneNumber")}
                type="text"
                placeholder="e.g. +1 (123) 456-7890"
                className=""
                onChange={handleContactPersonPhoneChange}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label>
                Contact Person Email 
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="Enter Email"
                className=""
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message as string}</p>
              )}
            </div>

            {isEditMode && (
              <div className="flex flex-col gap-2">
                <label>Status</label>
                <select
                  {...register("status")}
                  className=""
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* View Vendor Details Modal */}
      <Modal
        open={isViewModalOpen}
        onCancel={handleCloseViewModal}
        title="Contractor Details"
        width={800}
        footer={[
          <Button key="close" onClick={handleCloseViewModal}>
            Close
          </Button>
        ]}
      >
        {selectedVendor && (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="text-xl font-semibold text-gray-800">
                    {selectedVendor.isCompanyAsVendor ? "Sole Proprietorship" : "Contractor"}: 
                    <span> {selectedVendor.contactPerson || "N/A"}</span>
                  </h5>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(selectedVendor.category) 
                        ? selectedVendor.category.map((cat, index) => (
                            <Tag key={index} color={selectedVendor.isCompanyAsVendor ? "purple" : "blue"} className="text-sm">
                              {cat}
                            </Tag>
                          ))
                        : selectedVendor.category 
                          ? [selectedVendor.category].map((cat, index) => (
                              <Tag key={index} color={selectedVendor.isCompanyAsVendor ? "purple" : "blue"} className="text-sm">
                                {cat}
                              </Tag>
                            ))
                          : <Tag color={selectedVendor.isCompanyAsVendor ? "purple" : "blue"} className="text-sm">N/A</Tag>
                      }
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <Tag color={getStatusColor(selectedVendor.status)} className="text-sm">
                    {selectedVendor.status?.toUpperCase() || "N/A"}
                  </Tag>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Information */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-base font-semibold text-gray-800">Vendor Information</h4>
                </div>

                <div className="space-y-3">
                  {/* Vendor Name */}
                  <div className="flex gap-1">
                    <label className="block text-xs font-medium mb-1">Vendor Name :</label>
                    <p className="text-xs text-gray-800">
                      {selectedVendor.company?.companyName || "N/A"}
                    </p>
                  </div>

                  {/* Vendor Website */}
                  <div>
                    <label className="block text-xs font-medium mb-1">Vendor Website</label>
                    {selectedVendor.company?.companyWebsite ? (
                      <a
                        href={
                          selectedVendor.company.companyWebsite.startsWith("http")
                            ? selectedVendor.company.companyWebsite
                            : `https://${selectedVendor.company.companyWebsite}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline truncate block"
                      >
                        {selectedVendor.company.companyWebsite}
                      </a>
                    ) : (
                      <p className="text-xs text-gray-500">N/A</p>
                    )}
                  </div>

                  {/* Phone & Email */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex gap-1">
                      <label className="block text-xs font-medium mb-1">Phone :</label>
                      <p className="text-xs text-gray-800">
                        {selectedVendor.company?.companyPhoneNumber || "N/A"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <label className="block text-xs font-medium mb-1">Email :</label>
                      <p className="text-xs text-gray-800 truncate">
                        {selectedVendor.company?.companyEmail || "N/A"}
                      </p>
                    </div>
                  </div>

                 <div className="flex gap-1">
  <label className="block text-xs font-medium mb-1">Categories :</label>
  <div className="flex flex-wrap gap-1">
    {selectedVendor.company?.category ? (
      (() => {
        const categoryData = selectedVendor.company.category;
        
        // Handle different data types
        if (Array.isArray(categoryData)) {
          // If it's already an array, use it directly
          return categoryData.map((cat, index) => (
            <Tag key={index} color="blue" className="text-xs">
              {String(cat)}
            </Tag>
          ));
        } else if (typeof categoryData === 'string') {
          // If it's a string, process it
          const categoryStr = categoryData;
          
          // Extract all content from quoted strings
          const categories = categoryStr.match(/"([^"]+)"/g)?.map(cat => cat.replace(/"/g, '')) || [categoryStr];
          
          return categories.map((cat, index) => (
            <Tag key={index} color="blue" className="text-xs">
              {cat}
            </Tag>
          ));
        } else {
          // Fallback for other types (number, object, etc.)
          return (
            <Tag color="blue" className="text-xs">
              {String(categoryData)}
            </Tag>
          );
        }
      })()
    ) : (
      "N/A"
    )}
  </div>
</div>

                  {/* Discount Section - FIXED */}
                  <div className="mt-3">
                    <label className="block text-xs font-medium mb-1">Discount</label>
                    {selectedVendor.company?.discountType && selectedVendor.company.discount ? (
                      <>
                        {selectedVendor.company.discountType === "url" && (
                          <div className="flex gap-2 text-xs">
                            <span className="font-semibold text-gray-700">Link:</span>
                            <a
                              href={selectedVendor.company.discount}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline break-all"
                            >
                              {selectedVendor.company.discount}
                            </a>
                          </div>
                        )}

                        {selectedVendor.company.discountType === "coupon" && (
                          <div className="flex gap-2 text-xs items-center">
                            <span className="font-semibold text-gray-700">Code:</span>
                            <Tag color="green">{selectedVendor.company.discount}</Tag>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">N/A</p>
                    )}
                  </div>

                  {/* Platforms / Social URLs - FIXED */}
                  <div className="mt-3">
                    <label className="block text-xs font-medium mb-1">Platforms</label>
                    {selectedVendor.company?.socialUrls && selectedVendor.company.socialUrls.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedVendor.company.socialUrls.map((platform, index) => {
                          const PlatformIcon = getPlatformIcon(platform.platform);
                          return (
                            <Tooltip
                              key={index}
                              title={`${platform.platform}: ${platform.fullUrl}`}
                            >
                              <a
                                href={platform.fullUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-1.5 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-all shadow-sm"
                              >
                                <PlatformIcon
                                  style={{
                                    color: getPlatformColor(platform.platform),
                                    fontSize: "16px",
                                  }}
                                />
                                <span className="text-xs font-medium text-gray-700">
                                  {SOCIAL_PLATFORMS.find(
                                    (p) => p.value === platform.platform
                                  )?.label || platform.platform}
                                </span>
                                {platform.handle && (
                                  <span className="text-xs text-gray-500">
                                    (@{platform.handle})
                                  </span>
                                )}
                              </a>
                            </Tooltip>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">N/A</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Person */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-base font-semibold text-gray-800">Contact Person</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="flex gap-1">
                    <label className="block text-xs font-medium mb-1">Name :</label>
                    <p className="text-sm text-gray-800">{selectedVendor.contactPerson || "N/A"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Phone :</label>
                      <p className="text-sm text-gray-800">{selectedVendor.contactPersonPhoneNumber || "N/A"}</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">Email :</label>
                      <p className="text-sm text-gray-800 truncate">{selectedVendor.email || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Share Vendors Modal */}
      <Modal
        open={isShareModalOpen}
        onCancel={handleCloseShareModal}
        title="Share Vendor Data"
        width={1200}
        footer={[
          <Button key="close" onClick={handleCloseShareModal}>
            Close
          </Button>,
          <Button 
            key="send" 
            type="primary" 
            onClick={handleSendEmail}
            loading={isSharing}
            disabled={isSharing}
            style={{
              backgroundColor: "#072f2d",
              borderColor: "#072f2d",
              color: "#fff",
            }}
          >
            {isSharing ? "Sending..." : "Send"}
          </Button>,
        ]}
      >
        <div className="space-y-6">
          {/* Vendor Information Section */}
          <div>
            <h2 className="border-t border-gray-400 bg-[#0b3b38] text-white border-x text-center text-sm font-bold py-1">
              Vendor Information
            </h2>
            <div className="border border-gray-400">
              <Table
                dataSource={selectedVendorsForSharing.map((vendor, index) => ({
                  key: index,
                  contactPerson: vendor.contactPerson || "N/A",
                  company: vendor.isCompanyAsVendor ? "Sole Proprietorship" : (vendor.company?.companyName || "N/A"),
                  category: vendor.isCompanyAsVendor 
                    ? (Array.isArray(vendor.company?.category) 
                        ? vendor.company.category.join(', ') 
                        : vendor.company?.category || "Company") 
                    : (Array.isArray(vendor.category) 
                        ? vendor.category.join(', ') 
                        : vendor.category || "N/A"),
                  email: vendor.email || vendor.company?.companyEmail || "N/A",
                  phone: vendor.contactPersonPhoneNumber || vendor.company?.companyPhoneNumber || "N/A"
                }))}
                columns={[
                  {
                    title: 'Contact Person',
                    dataIndex: 'contactPerson',
                    key: 'contactPerson',
                    width: '15%',
                    render: (text: string) => (
                      <div className="px-2 py-1 text-sm">{text}</div>
                    )
                  },
                  {
              title: 'Company',
              dataIndex: 'company',
              key: 'company',
              width: '15%',
              render: (text: string, record: any) => (
                <div className="px-2 py-1 text-sm">
                  {record.isCompanyAsVendor ? "Sole Proprietorship" : text}
                </div>
              )
            },
                  {
                    title: "Categories",
                    dataIndex: "category",
                    key: "category",
                    width: '15%',
                    render: (text: string, record: any) => (
                      <div className="px-2 py-1 text-sm">{text}</div>
                    )
                  },
                  {
                    title: 'Contact Person Email',
                    dataIndex: 'email',
                    key: 'email',
                    width: '20%',
                    render: (text: string) => (
                      <div className="px-2 py-1 text-sm">{text}</div>
                    )
                  },
                  {
                    title: 'Contact Person Phone',
                    dataIndex: 'phone',
                    key: 'phone',
                    width: '15%',
                    render: (text: string) => (
                      <div className="px-2 py-1 text-sm">{text}</div>
                    )
                  }
                ]}
                pagination={false}
                size="small"
                scroll={{ x: 1000 }}
                className="vendor-share-table"
              />
            </div>
          </div>

          {/* Email Section */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Email</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Addresses
                  <span className="text-gray-500 text-xs ml-1">
                    (Enter multiple emails separated by commas)
                  </span>
                </label>
                <Input
                  value={selectedEmails.join(', ')}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    setSelectedEmails([inputValue]);
                  }}
                  onBlur={(e) => {
                    const inputValue = e.target.value;
                    const emails = inputValue
                      .split(',')
                      .map(email => email.trim())
                      .filter(email => email.length > 0 && email.includes('@'));
                    setSelectedEmails(emails);
                  }}
                  placeholder="cocole8909@dropeso.com, test@gmail.com, example@domain.com"
                  style={{ width: '100%' }}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Type emails separated by commas. They will be processed when you click away from the field.
                </p>
                {selectedEmails.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium mb-1">Emails to send to:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedEmails.map((email, index) => (
                        <Tag key={index} color="blue" className="text-xs">
                          {email}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                <Input.TextArea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={4}
                  placeholder="Enter comment here"
                  size="large"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
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
        <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-md">
          <div className="flex items-center">
            <AiFillWarning className="text-2xl mr-2" />
            <p className="font-semibold text-sm">
              Are you sure you want to delete this vendor?
            </p>
          </div>
          <p className="mt-2 text-sm">
            <span className="font-semibold">Warning:</span> This action cannot be undone.
          </p>
        </div>
      </Modal>

      {/* Category Management Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#072f2d]">Manage Categories</span>
            <span className="text-xs font-medium bg-[#072f2d] text-white rounded-full px-2 py-0.5">
              {rawCategories.length}
            </span>
          </div>
        }
        open={isCategoryModalOpen}
        onCancel={() => {
          setIsCategoryModalOpen(false);
          setEditingCategoryId(null);
          setEditingCategoryName("");
          setNewCategoryName("");
        }}
        footer={null}
        width={500}
        zIndex={1100}
      >
        <div className="space-y-5 pt-1">
          {/* Add new category */}
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Add New Category</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                placeholder="e.g. Home Inspector"
                className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#072f2d]"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="px-4 py-1.5 rounded-md text-sm font-medium text-white bg-[#072f2d] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Existing categories */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Existing Categories
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {rawCategories.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No categories yet.</p>
                  <p className="text-xs mt-1">Add your first category above.</p>
                </div>
              )}
              {rawCategories.map((cat, index) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 px-3 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-[#072f2d] bg-blue-50 rounded-full flex-shrink-0">
                    {index + 1}
                  </span>

                  {editingCategoryId === cat.id ? (
                    <>
                      <input
                        type="text"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdateCategory(cat.id);
                          if (e.key === "Escape") { setEditingCategoryId(null); setEditingCategoryName(""); }
                        }}
                        className="flex-1 border border-[#072f2d] rounded px-2 py-1 text-sm focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateCategory(cat.id)}
                        className="px-3 py-1 text-xs font-medium rounded bg-[#072f2d] text-white hover:opacity-90"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingCategoryId(null); setEditingCategoryName(""); }}
                        className="px-3 py-1 text-xs font-medium rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-gray-700">{cat.name}</span>
                      <Tooltip title="Edit">
                        <button
                          type="button"
                          onClick={() => { setEditingCategoryId(cat.id); setEditingCategoryName(cat.name); }}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-blue-50 hover:text-[#072f2d] transition-colors"
                        >
                          <FaRegEdit size={13} />
                        </button>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <MdDelete size={15} />
                        </button>
                      </Tooltip>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-1 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setIsCategoryModalOpen(false);
                setEditingCategoryId(null);
                setEditingCategoryName("");
                setNewCategoryName("");
              }}
              className="px-4 py-1.5 rounded-md text-sm border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Done
            </button>
          </div>
        </div>
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
        <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-md">
          <div className="flex items-center">
            <AiFillWarning className="text-2xl mr-2" />
            <p className="font-semibold text-sm">
              Are you sure you want to delete {selectedRowKeys.length} selected vendors?
            </p>
          </div>
          <p className="mt-2 text-sm">
            <span className="font-semibold">Warning:</span> This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default VendorManagement;