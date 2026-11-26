/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import type { TableColumnsType, TableProps } from "antd";
import { useForm } from "react-hook-form";
import { 
  Table, 
  Modal, 
  Button, 
  Dropdown, 
  Space, 
  Tooltip, 
  Tag,
  Tabs,
  Select,
  Input,
  Collapse,
  Radio
} from "antd";
import {
  useGetCompaniesQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteMultipleCompaniesMutation,
  useUpdateVendorStatusMutation,
  useGetVendorsQuery,
  useCreateVendorMutation,
  useShareVendorMutation,
} from "../../../../../redux/api/superadmin/vendorSlice";
import { FaRegEdit } from "react-icons/fa";
import { MdDelete, MdShare } from "react-icons/md";
import { FaTimes, FaSearch, FaPlus, FaTrash, FaExternalLinkAlt, FaFacebook, FaInstagram, FaLinkedin, FaYoutube, FaTiktok } from "react-icons/fa";
import { SiAmazon, SiWalmart, SiEbay, SiTarget } from "react-icons/si";
import toast from "react-hot-toast";
import TableLoader from "../../../../../components/loader/TableLoader";
import { BsThreeDotsVertical } from "react-icons/bs";
import { usePermissions } from "../../../../../utils/permissionUtils";
import { AiFillWarning } from "react-icons/ai";
import { formatPhoneNumber } from "../../../../../utils/format";
import { useAppSelector } from "../../../../../redux/hooks";
import dayjs from "dayjs";
import { Link,useSearchParams  } from "react-router-dom";
import {
  useGetVendorCategoryQuery,
  useCreateVendorCategoryMutation,
  useUpdateVendorCategoryMutation,
  useDeleteMultipleVendorCategoryMutation,
} from "../../../../../redux/api/superadmin/vendorCategoryDataSlice";

type TableRowSelection<T extends object = object> = TableProps<T>["rowSelection"];

interface PlatformUrl {
  platform: string;
  username: string;  // This maps to 'handle' in the database
  url: string;       // This maps to 'fullUrl' in the database
}

interface Company {
  id: number;
  companyName: string;
  companyWebsite: string;
  companyPhoneNumber: string;
  companyEmail: string;
  category: string[];
  discountType: string;
  discount: string;  // Single discount field from database
  discountUrl?: string;  // For frontend display only
  discountCouponCode?: string;  // For frontend display only
  socialUrls?: SocialUrl[];  // From database
  platformUrls?: PlatformUrl[];  // Mapped from socialUrls for frontend
  createdAt: string;
  updatedAt: string;
  vendorLists?: Vendor[];
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


interface Vendor {
  id: number;
  companyId: number;
  category: string;
  contactPerson: string;
  contactPersonPhoneNumber: string;
  email: string;
  status: string;
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

// Category options
/* const CATEGORY_OPTIONS = [
  "Mortgage Broker",
  "Home Inspector",
  "Contractor / Renovation Specialist",
  "Painter",
  "Home Stager",
  "Photographer / Videographer",
  "Cleaning Service",
  "Mover / Moving Company",
  "Insurance Broker"
]; */



// Social Media Platform options with URL prefixes
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
    value: 'amazon', 
    label: 'Amazon', 
    icon: SiAmazon, 
    color: '#FF9900',
    prefix: 'https://www.amazon.com/'
  },
  
  { 
    value: 'other', 
    label: 'Other', 
    icon: FaExternalLinkAlt, 
    color: '#6B7280',
    prefix: 'https://'
  }
];

// Discount type options
const DISCOUNT_TYPES = [
  { label: 'Discount URL', value: 'url' },
  { label: 'Coupon Code', value: 'coupon' },
  { label: 'None', value: 'none' }
];

const { Panel } = Collapse;

const CompanyManagement = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedCompaniesForSharing, setSelectedCompaniesForSharing] = useState<Company[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [emailMessage, setEmailMessage] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('details');
  const [vendorSearchText, setVendorSearchText] = useState("");
  const [activePlatformPanels, setActivePlatformPanels] = useState<string[]>([]);
  const { user } = useAppSelector((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
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
      const current: string[] = getValues("category") || [];
      if (current.includes(categoryName)) {
        setValue("category", current.filter((c: string) => c !== categoryName));
      }
      toast.success("Category deleted!");
    } catch {
      toast.error("Failed to delete category.");
    }
  };

  // Add Vendor Modal State
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({
    companyId: '',
    category: '',
    contactPerson: '',
    contactPersonPhoneNumber: '',
    email: '',
    status: 'active'
  });
  const [addVendorErrors, setAddVendorErrors] = useState<any>({});

  // API hooks
  const { data, isLoading, refetch } = useGetCompaniesQuery("");
  const { data: vendorsData, refetch: refetchVendors } = useGetVendorsQuery("");
  const [createCompany] = useCreateCompanyMutation();
  const [updateCompany] = useUpdateCompanyMutation();
  const [deleteMultipleCompanies] = useDeleteMultipleCompaniesMutation();
  const [updateVendorStatus] = useUpdateVendorStatusMutation();
  const [createVendor, { isLoading: isCreatingVendor }] = useCreateVendorMutation();
  const [shareVendor] = useShareVendorMutation();

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
      companyName: "",
      companyWebsite: "",
      companyPhoneNumber: "",
      companyEmail: "",
      category: [] as string[],
      discountType: "none",
      discountUrl: "",
      discountCouponCode: "",
      platformUrls: [] as PlatformUrl[]
    }
  });

  const watchPlatformUrls = watch("platformUrls", []);
  const watchDiscountType = watch("discountType", "none");

  // Table data
  const companies = useMemo(() => {
  if (!data?.data?.companies) return [];
  
  return data.data.companies.map((company: any) => {
    // Safely handle category data - it might be string, array, or JSON string
    let categoryArray: string[] = [];
    
    if (company.category) {
      if (Array.isArray(company.category)) {
        // If it's already an array, use it directly
        categoryArray = company.category;
      } else if (typeof company.category === 'string') {
        try {
          // Try to parse as JSON
          const parsed = JSON.parse(company.category);
          categoryArray = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          // If not JSON, check if it's comma-separated
          if (company.category.includes(',')) {
            categoryArray = company.category.split(',').map((cat: string) => cat.trim());
          } else {
            // Single category as string
            categoryArray = [company.category];
          }
        }
      }
    }
    
    return {
      ...company,
      category: categoryArray, // Ensure it's always an array
      // Map socialUrls to platformUrls for frontend compatibility
      platformUrls: company.socialUrls ? company.socialUrls.map((social: SocialUrl) => ({
        platform: social.platform,
        username: social.handle,
        url: social.fullUrl
      })) : [],
      // Map discount field to appropriate frontend fields
      discountUrl: company.discountType === 'url' ? company.discount : null,
      discountCouponCode: company.discountType === 'coupon' ? company.discount : null
    };
  });
}, [data]);
  const allVendors = vendorsData?.data?.vendors || [];

  useEffect(() => {
    const handleEditFromUrl = async () => {
      const editId = searchParams.get('edit_id');
      
      if (editId && !isNaN(Number(editId))) {
        const companyId = parseInt(editId);
        
        try {
          // Find the company in the current data
          const companyToEdit = companies.find((company: Company) => company.id === companyId);
          
          if (companyToEdit) {
            // Map the data for the form
            const formData = {
              ...companyToEdit,
              discountType: companyToEdit.discountType || "none",
              discountUrl: companyToEdit.discountType === 'url' ? (companyToEdit.discount || '') : '',
              discountCouponCode: companyToEdit.discountType === 'coupon' ? (companyToEdit.discount || '') : '',
              platformUrls: companyToEdit.platformUrls || []
            };
            
            reset(formData);
            setIsEditMode(true);
            setSelectedId(companyId);
            setIsModalOpen(true);
            
            // Remove the edit_id parameter from URL
            searchParams.delete('edit_id');
            setSearchParams(searchParams);
            
            toast.success(`Editing company: ${companyToEdit.companyName}`);
          } else {
            console.warn(`Company with ID ${companyId} not found`);
            toast.error(`Company with ID ${companyId} not found`);
          }
        } catch (error) {
          console.error('Error handling edit from URL:', error);
          toast.error('Error loading company for editing');
        }
      }
    };

    // Only run if we have companies data loaded and not already editing
    if (companies.length > 0 && !isEditMode) {
      handleEditFromUrl();
    }
  }, [companies, reset, searchParams, setSearchParams, isEditMode]);

  // Filtered data for search
  const filteredData = companies.filter((record: Company) => {
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

  // Get vendors for selected company
  const getCompanyVendors = (companyId: number) => {
  return allVendors.filter((vendor: Vendor) => vendor.companyId === companyId);
};

  // Filter vendors based on search text
  const filteredVendors = useMemo(() => {
    if (!selectedCompany) return [];
    
    const vendors = getCompanyVendors(selectedCompany.id);
    
    if (!vendorSearchText) return vendors;
    
    const searchTerm = vendorSearchText.toLowerCase();
    return vendors.filter((vendor: Vendor) => 
      vendor.contactPerson?.toLowerCase().includes(searchTerm) ||
      vendor.email?.toLowerCase().includes(searchTerm) ||
      vendor.category?.toLowerCase().includes(searchTerm) ||
      vendor.status?.toLowerCase().includes(searchTerm)
    );
  }, [selectedCompany, allVendors, vendorSearchText]);

 // Reset form
const resetForm = () => {
  reset({
    companyName: "",
    companyWebsite: "",
    companyPhoneNumber: "",
    companyEmail: "",
    category: [] as string[], // Reset to empty array
    discountType: "none",
    discountUrl: "",
    discountCouponCode: "",
    platformUrls: []
  });
  setActivePlatformPanels([]);
};

  // Platform URL handlers
  const addPlatformUrl = () => {
    const currentPlatformUrls = getValues("platformUrls") || [];
    const newPlatformUrl: PlatformUrl = { platform: '', username: '', url: '' };
    setValue("platformUrls", [...currentPlatformUrls, newPlatformUrl]);
    // Auto-open the new panel
    setActivePlatformPanels([...activePlatformPanels, `platform-${currentPlatformUrls.length}`]);
  };

  const updatePlatformUrl = (index: number, field: keyof PlatformUrl, value: string) => {
    const currentPlatformUrls = [...(getValues("platformUrls") || [])];
    
    if (field === 'platform') {
      const platform = SOCIAL_PLATFORMS.find(p => p.value === value);
      if (platform) {
        currentPlatformUrls[index] = {
          ...currentPlatformUrls[index],
          platform: value,
          url: platform.prefix + (currentPlatformUrls[index].username || '')
        };
      }
    } else if (field === 'username') {
      const platform = SOCIAL_PLATFORMS.find(p => p.value === currentPlatformUrls[index].platform);
      if (platform) {
        currentPlatformUrls[index] = {
          ...currentPlatformUrls[index],
          username: value,
          url: platform.prefix + value
        };
      }
    } else {
      currentPlatformUrls[index] = {
        ...currentPlatformUrls[index],
        [field]: value
      };
    }
    
    setValue("platformUrls", currentPlatformUrls);
  };

  const removePlatformUrl = (index: number) => {
    const currentPlatformUrls = [...(getValues("platformUrls") || [])];
    currentPlatformUrls.splice(index, 1);
    setValue("platformUrls", currentPlatformUrls);
    
    // Remove from active panels if it was open
    const panelKey = `platform-${index}`;
    setActivePlatformPanels(activePlatformPanels.filter(panel => panel !== panelKey));
  };

  const getPlatformIcon = (platformValue: string) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.value === platformValue);
    return platform ? platform.icon : FaExternalLinkAlt;
  };

  const getPlatformColor = (platformValue: string) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.value === platformValue);
    return platform ? platform.color : '#6B7280';
  };

  const getPlatformPrefix = (platformValue: string) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.value === platformValue);
    return platform ? platform.prefix : 'https://';
  };

  // Modal handlers
  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedId(null);
    
    // Clear any edit_id from URL when modal closes
    if (searchParams.get('edit_id')) {
      searchParams.delete('edit_id');
      setSearchParams(searchParams);
    }
  };

  const handleViewDetails = (record: Company) => {
    const companyWithVendors = {
      ...record,
      vendorLists: getCompanyVendors(record.id)
    };
    setSelectedCompany(companyWithVendors);
    setSelectedVendor(companyWithVendors.vendorLists?.[0] || null);
    setSelectedTab('details');
    setVendorSearchText(""); // Reset vendor search when opening modal
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedCompany(null);
    setSelectedVendor(null);
    setVendorSearchText(""); // Reset vendor search when closing modal
  };

  const handleEdit = (record: Company) => {
  // Ensure category is properly handled for the form
  let categoryArray: string[] = [];
  
  if (record.category) {
    if (Array.isArray(record.category)) {
      categoryArray = record.category;
    } else if (typeof record.category === 'string') {
      try {
        const parsed = JSON.parse(record.category);
        categoryArray = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        if (record.category.includes(',')) {
          categoryArray = record.category.split(',').map((cat: string) => cat.trim());
        } else {
          categoryArray = [record.category];
        }
      }
    }
  }
  
  // Map the data for the form
  const formData = {
    ...record,
    category: categoryArray, // Ensure it's an array
    discountType: record.discountType || "none",
    discountUrl: record.discountType === 'url' ? (record.discount || '') : '',
    discountCouponCode: record.discountType === 'coupon' ? (record.discount || '') : '',
    platformUrls: record.platformUrls || []
  };
  
  console.log('Edit form data:', formData); // For debugging
  
  reset(formData);
  setIsEditMode(true);
  setSelectedId(record.id);
  setIsModalOpen(true);
};

  const confirmDelete = async () => {
    try {
      await deleteMultipleCompanies({ ids: [selectedId] });
      toast.success("Company deleted successfully!");
      setIsModalVisible(false);
      setSelectedId(null);
      await refetch();
    } catch (error: any) {
      if (error?.data?.companiesWithVendors) {
        toast.error("Cannot delete company with associated vendors");
      } else {
        toast.error("Delete failed!");
      }
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

  // Handle vendor status change
  const handleVendorStatusChange = async (vendorId: number, newStatus: string) => {
    try {
      await updateVendorStatus({ id: vendorId, status: newStatus });
      toast.success("Vendor status updated successfully!");
      // Refresh the vendor data
      await refetchVendors();
      // Update the selected vendor if it's the one being updated
      if (selectedVendor && selectedVendor.id === vendorId) {
        setSelectedVendor({ ...selectedVendor, status: newStatus });
      }
      // Update the selected company data
      if (selectedCompany) {
        const updatedVendors = getCompanyVendors(selectedCompany.id);
        setSelectedCompany({ ...selectedCompany, vendorLists: updatedVendors });
      }
    } catch (error) {
      toast.error("Status update failed!");
    }
  };

  // Phone number formatting handler
  const handleCompanyPhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatPhoneNumber(value);
    setValue("companyPhoneNumber", formattedValue);
  };

  // Add Vendor Handlers
  const handleOpenAddVendorModal = () => {
    setNewVendor({
      companyId: selectedCompany?.id?.toString() || '',
      category: '',
      contactPerson: '',
      contactPersonPhoneNumber: '',
      email: '',
      status: 'active'
    });
    setAddVendorErrors({});
    setIsAddVendorModalOpen(true);
  };

  const handleCloseAddVendorModal = () => {
    setIsAddVendorModalOpen(false);
    setAddVendorErrors({});
  };

  const handleAddVendorInputChange = (e: any) => {
    const { name, value } = e.target;
    setNewVendor((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddVendorPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatPhoneNumber(value);
    setNewVendor((prev) => ({ ...prev, contactPersonPhoneNumber: formattedValue }));
  };

  const validateAddVendorForm = () => {
    const errors: any = {};
    if (!newVendor.contactPerson) errors.contactPerson = 'Contact person is required';
    if (!newVendor.category) errors.category = 'Category is required';
    if (!newVendor.companyId) errors.companyId = 'Company is required';
    return errors;
  };

  const handleAddVendorSubmit = async (e: any) => {
    e.preventDefault();
    const errors = validateAddVendorForm();
    setAddVendorErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const vendorData = {
        companyId: newVendor.companyId ? parseInt(newVendor.companyId) : null,
        category: newVendor.category,
        contactPerson: newVendor.contactPerson,
        contactPersonPhoneNumber: newVendor.contactPersonPhoneNumber,
        email: newVendor.email,
        status: newVendor.status
      };

      await createVendor(vendorData).unwrap();
      toast.success('Vendor created successfully!');
      setIsAddVendorModalOpen(false);
      
      // Refresh vendor data immediately
      await refetchVendors();
      
      // Update selected company with new vendor list
      if (selectedCompany) {
        const updatedVendors = getCompanyVendors(selectedCompany.id);
        setSelectedCompany({ ...selectedCompany, vendorLists: updatedVendors });
        
        // Auto-select the newly created vendor
        const newVendorFromResponse = updatedVendors.find((v: Vendor) => 
          v.contactPerson === newVendor.contactPerson && v.email === newVendor.email
        );
        
        if (newVendorFromResponse) {
          setSelectedVendor(newVendorFromResponse);
        } else if (updatedVendors.length > 0) {
          setSelectedVendor(updatedVendors[0]);
        }
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create vendor');
    }
  };

  // Handle vendor search
  const handleVendorSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVendorSearchText(e.target.value);
  };

  // Clear vendor search
  const clearVendorSearch = () => {
    setVendorSearchText("");
  };

  // Table row selection
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<Company> = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  // Delete multiple
  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true);
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        await deleteMultipleCompanies({ ids: selectedRowKeys });
        setIsDeleteModalMultipleVisible(false);
        setSelectedRowKeys([]);
        toast.success("Companies deleted successfully!");
        await refetch();
      } catch (error: any) {
        if (error?.data?.companiesWithVendors) {
          const companiesWithVendors = error.data.companiesWithVendors;
          toast.error(`Cannot delete ${companiesWithVendors.length} companies with associated vendors`);
        } else {
          toast.error("Failed to delete companies. Please try again.");
        }
        setIsDeleteModalMultipleVisible(false);
      }
    } else {
      toast.error("Please select companies to delete.");
    }
  };

  // Share functionality
  const handleShareVendors = () => {
    if (selectedRowKeys.length === 0) {
      toast.error("Please select vendors to share.");
      return;
    }

    const selected = companies.filter((company: Company) =>
      selectedRowKeys.includes(company.id)
    );

    setSelectedCompaniesForSharing(selected);
    setIsShareModalOpen(true);
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
    setSelectedEmails([]);
    setEmailMessage("");
  };

  const handleSendEmail = async () => {
    const cleanedEmails = selectedEmails
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (cleanedEmails.length === 0) {
      toast.error("Please enter at least one valid email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = cleanedEmails.filter((email) => !emailRegex.test(email));

    if (invalidEmails.length > 0) {
      toast.error(`Invalid email format: ${invalidEmails.join(', ')}`);
      return;
    }

    setIsSharing(true);
    try {
      const vendorTableData = selectedCompaniesForSharing.map((company) => {
        const categories = Array.isArray(company.category)
          ? company.category.join(', ')
          : company.category || "N/A";

        return {
          contactPerson: company.companyName || "N/A",
          company: company.companyName || "N/A",
          category: categories,
          email: company.companyEmail || "N/A",
          phone: company.companyPhoneNumber || "N/A",
        };
      });

      const response = await shareVendor({
        vendors: vendorTableData,
        agentEmails: cleanedEmails,
        comment: emailMessage,
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

  const onSubmit = async () => {
  const formData = getValues();

  if (!formData.category || formData.category.length === 0) {
    setError("category", { type: "manual", message: "At least one category is required" });
    return;
  }

  // Clean up discount data based on selected type for backend
  const submitData = {
    ...formData,
    category: formData.category,
    discountType: formData.discountType === 'none' ? null : formData.discountType
  };

  console.log('Submitting data:', submitData); // For debugging

  if (isEditMode && selectedId) {
    try {
      await updateCompany({ id: selectedId, ...submitData });
      toast.success("Company updated successfully!");
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
      await createCompany(submitData);
      toast.success("Company created successfully!");
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


  // Get status tag color for vendors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'pending': return 'orange';
      default: return 'blue';
    }
  };

  // Company table columns
  const columns: TableColumnsType<Company> = [
    {
      title: "Vendor Name",
      dataIndex: "companyName",
      key: "companyName",
      sorter: (a, b) => a.companyName?.localeCompare(b.companyName),
      ellipsis: true,
      render: (text: string, record: Company) => (
        <Tooltip title={`Click to view ${text} details`}>
          <button
            onClick={() => handleViewDetails(record)}
            className="hover:text-blue-600 cursor-pointer hover:underline text-left bg-transparent border-none p-0 text-inherit flex items-center gap-1"
          >
            {text?.length > 20 ? `${text?.slice(0, 20)}...` : text} ({getCompanyVendors(record.id)?.length || 0})
          </button>
        </Tooltip>
      ),
      fixed: "left",
      width: 200,
    },
    {
      title: "Vendor Website",
      dataIndex: "companyWebsite",
      key: "companyWebsite",
      sorter: (a, b) => a.companyWebsite?.localeCompare(b.companyWebsite),
      ellipsis: true,
      render: (text: string) => (
        text ? (
          <a 
            href={text.startsWith('http') ? text : `https://${text}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {text.length > 30 ? `${text.slice(0, 30)}...` : text}
          </a>
        ) : (
          <span className="text-gray-500">N/A</span>
        )
      ),
      width: 200,
    },
    {
      title: "Discount",
      key: "discount",
      width: 150,
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          {record.discountType === 'url' && record.discount && (
            <a 
              href={record.discount} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-xs"
            >
              Discount Link
            </a>
          )}
          {record.discountType === 'coupon' && record.discount && (
            <Tag color="green" className="text-xs">
              Code: {record.discount}
            </Tag>
          )}
          {(!record.discountType || record.discountType === 'none' || !record.discount) && (
            <span className="text-gray-500 text-xs">N/A</span>
          )}
        </div>
      ),
    },
    {
      title: "Platforms",
      key: "platforms",
      width: 120,
      render: (_, record) => (
        <div className="flex flex-wrap gap-1">
          {record.platformUrls?.slice(0, 3).map((platform, index) => {
            const PlatformIcon = getPlatformIcon(platform.platform);
            return (
              <Tooltip key={index} title={`${platform.platform}: ${platform.url}`}>
                <a 
                  href={platform.url} 
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
          {record.platformUrls && record.platformUrls.length > 3 && (
            <Tag className="text-xs">+{record.platformUrls.length - 3}</Tag>
          )}
          {(!record.platformUrls || record.platformUrls.length === 0) && (
            <span className="text-gray-500 text-xs">N/A</span>
          )}
        </div>
      ),
    },
    {
      title: "Vendor Phone",
      dataIndex: "companyPhoneNumber",
      key: "companyPhoneNumber",
      sorter: (a, b) => a.companyPhoneNumber?.localeCompare(b.companyPhoneNumber),
      ellipsis: true,
      width: 150,
    },
    {
      title: "Vendor Email",
      dataIndex: "companyEmail",
      key: "companyEmail",
      sorter: (a, b) => a.companyEmail?.localeCompare(b.companyEmail),
      ellipsis: true,
      width: 200,
    },
    {
  title: "Categories",
  dataIndex: "category",
  key: "category",
  width: 200,
  render: (categories: any) => {
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
          if (categories.includes(',')) {
            categoriesArray = categories.split(',').map((cat: string) => cat.trim());
          } else {
            categoriesArray = [categories];
          }
        }
      }
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {categoriesArray.map((category, index) => (
          <Tooltip key={index} title={category}>
            <Tag color="blue" className="text-xs">
              {category.length > 15 ? `${category.slice(0, 15)}...` : category}
            </Tag>
          </Tooltip>
        ))}
        {categoriesArray.length === 0 && (
          <span className="text-gray-500 text-xs">N/A</span>
        )}
      </div>
    );
  },
  filters: CATEGORY_OPTIONS.map(category => ({
    text: category,
    value: category,
  })),
  onFilter: (value, record) => {
    // Safely handle record.category for filtering
    let recordCategories: string[] = [];
    
    if (record.category) {
      if (Array.isArray(record.category)) {
        recordCategories = record.category;
      } else if (typeof record.category === 'string') {
        try {
          const parsed = JSON.parse(record.category);
          recordCategories = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          if (record.category.includes(',')) {
            recordCategories = record.category.split(',').map((cat: string) => cat.trim());
          } else {
            recordCategories = [record.category];
          }
        }
      }
    }
    
    return recordCategories.includes(value as string);
  },
},
    ...(user?.userType == "superAdmin"
      ? [
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              hasPermissionForSlug("vendor-edit") && {
                key: "edit",
                label: (
                  <button
                    onClick={() => handleEdit(record)}
                    className="flex items-center gap-2 w-full"
                  >
                    <FaRegEdit /> Edit
                  </button>
                ),
              },
              hasPermissionForSlug("vendor-delete") && {
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
              {hasPermissionForSlug("vendor-create") && (
                <button onClick={() => setIsModalOpen(true)} className="primary-btn">Create Vendor</button>
              )}
              {hasPermissionForSlug("contructor-view") && (
                <Link to={'/dashboard/super-admin/vendors'} className="primary-btn">All Contractor</Link>
              )}
              {hasPermissionForSlug("contructor-share") && (
                <button onClick={handleShareVendors} className="primary-btn flex items-center gap-2" disabled={selectedRowKeys.length === 0}>
                  <MdShare /> Share Selected ({selectedRowKeys.length})
                </button>
              )}
              {hasPermissionForSlug("vendor-delete") && (
                <button onClick={handleDeleteMultipleClick} className="cancel-btn">Delete Selected</button>
              )}
            </>
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

      {/* Create/Edit Company Modal */}
      <Modal
        onCancel={handleCancel}
        open={isModalOpen}
        title={isEditMode ? "Edit Company" : "Create New Company"}
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
            {isEditMode ? "Update Vendor" : "Create Vendor"}
          </Button>,
        ]}
      >
        <form className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label>Vendor Name <span className="text-red-500 ml-1">*</span></label>
              <input
                {...register("companyName", { required: "Vendor name is required" })}
                type="text"
                placeholder="Enter Vendor Name"
                className=""
              />
              {errors.companyName && (
                <p className="text-red-500 text-sm mt-1">{errors.companyName.message as string}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>Vendor Website</label>
              <input
                {...register("companyWebsite")}
                type="text"
                placeholder="Enter Website URL"
                className=""
              />
            </div>

            <div className="flex flex-col gap-2">
              <label>Vendor Phone</label>
              <input
                {...register("companyPhoneNumber")}
                type="text"
                placeholder="e.g. +1 (123) 456-7890"
                className=""
                onChange={handleCompanyPhoneNumberChange}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label>
                Vendor Email 
              </label>
              <input
                {...register("companyEmail")}
                type="email"
                placeholder="Enter Email"
                className=""
              />
              {errors.companyEmail && (
                <p className="text-red-500 text-sm mt-1">{errors.companyEmail.message as string}</p>
              )}
            </div>
           <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label>Categories <span className="text-red-500 ml-1">*</span></label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-xs px-2 py-0.5 rounded bg-[#0f766e] text-white hover:opacity-80"
                >
                  Add/Edit Category
                </button>
              </div>
              <Select
                mode="multiple"
                value={watch("category")}
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
          </div>

          {/* Discount Section */}
          <div className="mt-4">
            <label className="font-semibold">Discount Type</label>
            <Radio.Group 
              value={watchDiscountType}
              onChange={(e) => setValue("discountType", e.target.value)}
              className="mt-2"
            >
              {DISCOUNT_TYPES.map(type => (
                <Radio key={type.value} value={type.value}>{type.label}</Radio>
              ))}
            </Radio.Group>

            {watchDiscountType === 'url' && (
              <div className="mt-3">
                <label>Discount URL</label>
                <input
                  {...register("discountUrl")}
                  type="text"
                  placeholder="Enter discount URL"
                  className="w-full mt-1"
                />
              </div>
            )}

            {watchDiscountType === 'coupon' && (
              <div className="mt-3">
                <label>Discount Coupon Code</label>
                <input
                  {...register("discountCouponCode")}
                  type="text"
                  placeholder="Enter coupon code"
                  className="w-full mt-1"
                />
              </div>
            )}
          </div>

          {/* Platform URLs Section */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-3">
              <label className="font-semibold">Social Media & Platform URLs</label>
              <Button 
                type="dashed" 
                onClick={addPlatformUrl}
                icon={<FaPlus />}
                size="small"
              >
                Add Platform
              </Button>
            </div>
            
            <Collapse 
              activeKey={activePlatformPanels}
              onChange={setActivePlatformPanels}
              ghost
            >
              {watchPlatformUrls?.map((platformUrl, index) => (
                <Panel 
                  key={`platform-${index}`}
                  header={
                    <div className="flex items-center gap-2">
                      {platformUrl.platform ? (
                        <>
                          {(() => {
                            const PlatformIcon = getPlatformIcon(platformUrl.platform);
                            return <PlatformIcon style={{ color: getPlatformColor(platformUrl.platform) }} />;
                          })()}
                          <span>
                            {SOCIAL_PLATFORMS.find(p => p.value === platformUrl.platform)?.label || 'Select Platform'}
                          </span>
                          {platformUrl.username && (
                            <Tag color="blue" className="text-xs">
                              @{platformUrl.username}
                            </Tag>
                          )}
                        </>
                      ) : (
                        <span>New Platform</span>
                      )}
                    </div>
                  }
                  extra={
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<FaTrash />}
                      onClick={(e) => {
                        e.stopPropagation();
                        removePlatformUrl(index);
                      }}
                    />
                  }
                >
                  <div className="grid grid-cols-1 gap-3 p-2 border rounded bg-gray-50">
                    <div className="flex flex-col gap-2">
                      <label>Platform</label>
                      <Select
                        value={platformUrl.platform}
                        onChange={(value) => updatePlatformUrl(index, 'platform', value)}
                        placeholder="Select platform"
                        options={SOCIAL_PLATFORMS.map(platform => ({
                          value: platform.value,
                          label: (
                            <div className="flex items-center gap-2">
                              <platform.icon style={{ color: platform.color }} />
                              {platform.label}
                            </div>
                          )
                        }))}
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label>Username/Handle</label>
                      <Input
                        value={platformUrl.username}
                        onChange={(e) => updatePlatformUrl(index, 'username', e.target.value)}
                        placeholder="Enter username or handle"
                        addonBefore={
                          <span className="text-xs">
                            {getPlatformPrefix(platformUrl.platform)}
                          </span>
                        }
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label>Full URL (Auto-generated)</label>
                      <Input
                        value={platformUrl.url}
                        onChange={(e) => updatePlatformUrl(index, 'url', e.target.value)}
                        placeholder="URL will be auto-generated"
                        readOnly
                        className="bg-gray-100"
                      />
                    </div>
                  </div>
                </Panel>
              ))}
            </Collapse>

            {(!watchPlatformUrls || watchPlatformUrls.length === 0) && (
              <div className="text-center py-4 border-2 border-dashed rounded text-gray-500">
                No platform URLs added. Click "Add Platform" to add one.
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Company Details Modal with Sidebar */}
      {isViewModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 relative">
            <button 
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" 
              onClick={handleCloseViewModal}
            >
              ✕
            </button>
            
            <div className="flex items-center justify-between">
              <Tabs
                activeKey={selectedTab}
                onChange={setSelectedTab}
                className="custom-tabs"
                style={{ marginBottom: 0 }}
              >
                <Tabs.TabPane tab="Details" key="details" />
                <Tabs.TabPane tab={`Contractors (${filteredVendors.length})`} key="vendors" />
              </Tabs>
              {user?.userType == "superAdmin" && 
                <button className="primary-btn ml-4" onClick={handleOpenAddVendorModal}>Add Contractor</button>
              }
              
            </div>

            {/* Details Tab */}
            {/* Details Tab */}
{selectedTab === 'details' && (
  <table className="min-w-full border">
    <thead>
      <tr>
        <th colSpan={2} className="w-full font-semibold p-2 border bg-[#0b3b38] text-white text-center">
          Vendor Details
        </th>
      </tr>
    </thead>
    <tbody className="text-[11px]">
      <tr>
        <td className="p-2 border font-semibold">Name</td>
        <td className="p-2 border">{selectedCompany.companyName}</td>
      </tr>
      <tr>
        <td className="p-2 border font-semibold">Website</td>
        <td className="p-2 border">
          {selectedCompany.companyWebsite ? (
            <a 
              href={selectedCompany.companyWebsite.startsWith('http') ? selectedCompany.companyWebsite : `https://${selectedCompany.companyWebsite}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {selectedCompany.companyWebsite}
            </a>
          ) : "N/A"}
        </td>
      </tr>
      <tr>
        <td className="p-2 border font-semibold">Phone</td>
        <td className="p-2 border">{selectedCompany.companyPhoneNumber || "N/A"}</td>
      </tr>
      <tr>
        <td className="p-2 border font-semibold">Email</td>
        <td className="p-2 border">{selectedCompany.companyEmail}</td>
      </tr>
      {/* In the Details Tab of CompanyManagement */}
<tr>
  <td className="p-2 border font-semibold">Categories</td>
  <td className="p-2 border">
    <div className="flex flex-wrap gap-1">
      {selectedCompany.category?.map((cat, index) => (
        <Tag key={index} color="blue">{cat}</Tag>
      ))}
    </div>
  </td>
</tr>
      
      {/* Show discount information only if available */}
      {selectedCompany.discountType && selectedCompany.discountType !== 'none' && (
        <>
          <tr>
            <td className="p-2 border font-semibold">Discount Type</td>
            <td className="p-2 border">
              {selectedCompany.discountType === 'url' && 'Discount URL'}
              {selectedCompany.discountType === 'coupon' && 'Coupon Code'}
            </td>
          </tr>
          {selectedCompany.discountType === 'url' && selectedCompany.discount && (
            <tr>
              <td className="p-2 border font-semibold">Discount URL</td>
              <td className="p-2 border">
                <a 
                  href={selectedCompany.discount}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {selectedCompany.discount}
                </a>
              </td>
            </tr>
          )}
          {selectedCompany.discountType === 'coupon' && selectedCompany.discount && (
            <tr>
              <td className="p-2 border font-semibold">Discount Code</td>
              <td className="p-2 border">
                <Tag color="green">{selectedCompany.discount}</Tag>
              </td>
            </tr>
          )}
        </>
      )}
      
      {/* Show N/A if no discount */}
      {(!selectedCompany.discountType || selectedCompany.discountType === 'none' || !selectedCompany.discount) && (
        <tr>
          <td className="p-2 border font-semibold">Discount</td>
          <td className="p-2 border">N/A</td>
        </tr>
      )}
      
      <tr>
        <td className="p-2 border font-semibold">Platforms</td>
        <td className="p-2 border">
          <div className="flex flex-wrap gap-2">
            {selectedCompany.platformUrls?.map((platform, index) => {
              const PlatformIcon = getPlatformIcon(platform.platform);
              return (
                <Tooltip key={index} title={`${platform.platform}: ${platform.url}`}>
                  <a 
                    href={platform.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50"
                  >
                    <PlatformIcon 
                      style={{ 
                        color: getPlatformColor(platform.platform),
                        fontSize: '16px'
                      }} 
                    />
                    <span className="text-xs">
                      {SOCIAL_PLATFORMS.find(p => p.value === platform.platform)?.label}
                    </span>
                    {platform.username && (
                      <span className="text-xs text-gray-600">(@{platform.username})</span>
                    )}
                  </a>
                </Tooltip>
              );
            })}
            {!selectedCompany.platformUrls || selectedCompany.platformUrls.length === 0 ? "N/A" : ""}
          </div>
        </td>
      </tr>
    </tbody>
  </table>
)}

            {/* Vendors Tab with Sidebar */}
            {selectedTab === 'vendors' && (
              <div className="flex gap-6 w-full" style={{ minHeight: 400 }}>
                {/* Sidebar */}
                <div className="w-2/5 border-r pr-1">
                  {/* Vendor Search */}
                  <div className="mb-3 relative">
                    <Input
                      placeholder="Search vendors..."
                      value={vendorSearchText}
                      onChange={handleVendorSearch}
                      prefix={<FaSearch className="text-gray-400" />}
                      suffix={
                        vendorSearchText && (
                          <button
                            type="button"
                            onClick={clearVendorSearch}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <FaTimes size={12} />
                          </button>
                        )
                      }
                      size="small"
                    />
                  </div>
                  
                  <div className="max-h-[350px] overflow-y-auto">
                    <ul className="divide-y divide-gray-200">
                      {filteredVendors.length > 0 ? filteredVendors.map((vendor: Vendor) => (
                        <li key={vendor.id} className={`py-2 cursor-pointer ${selectedVendor?.id === vendor.id ? 'bg-blue-50 font-bold' : ''}`}>
                          <div
                            onClick={() => setSelectedVendor(vendor)}
                            className="hover:text-blue-600 p-1 rounded-md px-2"
                          >
                            <div className="font-medium text-xs">{vendor.contactPerson}</div>
                            <div className="flex items-center gap-1 mt-1">
                              <Tag color="blue" className="text-xs">
                                {vendor.category}
                              </Tag>
                              <Tag color={getStatusColor(vendor.status)} className="text-xs">
                                {vendor.status}
                              </Tag>
                            </div>
                          </div>
                        </li>
                      )) : (
                        <li className="text-gray-500 py-4 text-center">
                          {vendorSearchText ? 'No Contractor found matching your search' : 'No Contractor found for this company'}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Main Area */}
                <div className="w-3/5">
                  {selectedVendor ? (
                    <table className="min-w-full border text-[11px]">
                      <thead>
                        <tr>
                          <th colSpan={2} className="w-full font-semibold p-2 border bg-[#0b3b38] text-white text-center">
                            Contractor Details
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 border font-semibold">Contact Person</td>
                          <td className="p-2 border">{selectedVendor.contactPerson}</td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-semibold">Category</td>
                          <td className="p-2 border">
                            <Tag color="blue">{selectedVendor.category}</Tag>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-semibold">Email</td>
                          <td className="p-2 border">{selectedVendor.email}</td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-semibold">Phone</td>
                          <td className="p-2 border">{selectedVendor.contactPersonPhoneNumber || "N/A"}</td>
                        </tr>
                        <tr>
                          <td className="p-2 border font-semibold">Status</td>
                          <td className="p-2 border">
                            <Select
                              value={selectedVendor.status}
                              onChange={(value) => handleVendorStatusChange(selectedVendor.id, value)}
                              options={STATUS_OPTIONS}
                              style={{ width: '100%' }}
                              disabled={user?.userType !== "superAdmin"}
                              size="small"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-gray-500 flex items-center justify-center h-64">
                      {filteredVendors.length > 0 ? 'Select a vendor to view details' : 'No vendors available'}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Add Vendor Modal */}
            <Modal
              open={isAddVendorModalOpen}
              onCancel={handleCloseAddVendorModal}
              title={`Add Contractor to ${selectedCompany.companyName}`}
              footer={null}
              width={600}
            >
              <form className="space-y-3" onSubmit={handleAddVendorSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label>Contractor Name <span className="text-red-500 ml-1">*</span></label>
                    <input 
                      name="contactPerson" 
                      value={newVendor.contactPerson} 
                      onChange={handleAddVendorInputChange} 
                      type="text" 
                      className="border p-2 rounded w-full" 
                    />
                    {addVendorErrors.contactPerson && <p className="text-red-500 text-sm">{addVendorErrors.contactPerson}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label>Category <span className="text-red-500 ml-1">*</span></label>
                    <select 
                      name="category" 
                      value={newVendor.category} 
                      onChange={handleAddVendorInputChange} 
                      className="border p-2 rounded w-full"
                    >
                      <option value="">Select Category</option>
                      {CATEGORY_OPTIONS.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {addVendorErrors.category && <p className="text-red-500 text-sm">{addVendorErrors.category}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label>Vendor <span className="text-red-500 ml-1">*</span></label>
                    <input 
                      name="companyId" 
                      value={selectedCompany.companyName} 
                      disabled 
                      className="border p-2 rounded w-full bg-gray-100" 
                    />
                    {addVendorErrors.companyId && <p className="text-red-500 text-sm">{addVendorErrors.companyId}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label>Email </label>
                    <input 
                      name="email" 
                      value={newVendor.email} 
                      onChange={handleAddVendorInputChange} 
                      type="email" 
                      className="border p-2 rounded w-full" 
                    />
                    {addVendorErrors.email && <p className="text-red-500 text-sm">{addVendorErrors.email}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label>Phone Number</label>
                    <input
                      name="contactPersonPhoneNumber"
                      value={newVendor.contactPersonPhoneNumber}
                      onChange={handleAddVendorPhoneChange}
                      type="text"
                      className="border p-2 rounded w-full"
                      placeholder="e.g. +1 (123) 456-7890"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label>Status</label>
                    <select 
                      name="status" 
                      value={newVendor.status} 
                      onChange={handleAddVendorInputChange} 
                      className="border p-2 rounded w-full"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" className="cancel-btn mr-1" onClick={handleCloseAddVendorModal}>Cancel</button>
                  <button type="submit" className="primary-btn" disabled={isCreatingVendor}>
                    {isCreatingVendor ? 'Creating...' : 'Submit'}
                  </button>
                </div>
              </form>
            </Modal>
          </div>
        </div>
      )}

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
                dataSource={selectedCompaniesForSharing.map((company, index) => ({
                  key: index,
                  contactPerson: company.companyName || "N/A",
                  category: Array.isArray(company.category)
                    ? company.category.join(', ')
                    : company.category || "N/A",
                  email: company.companyEmail || "N/A",
                  phone: company.companyPhoneNumber || "N/A",
                }))}
                columns={[
                  {
                    title: 'Vendor Name',
                    dataIndex: 'contactPerson',
                    key: 'contactPerson',
                    width: '25%',
                    render: (text: string) => (
                      <div className="px-2 py-1 text-sm">{text}</div>
                    )
                  },
                  {
                    title: "Categories",
                    dataIndex: "category",
                    key: "category",
                    width: '25%',
                    render: (text: string) => (
                      <div className="px-2 py-1 text-sm">{text}</div>
                    )
                  },
                  {
                    title: 'Vendor Email',
                    dataIndex: 'email',
                    key: 'email',
                    width: '25%',
                    render: (text: string) => (
                      <div className="px-2 py-1 text-sm">{text}</div>
                    )
                  },
                  {
                    title: 'Vendor Phone',
                    dataIndex: 'phone',
                    key: 'phone',
                    width: '25%',
                    render: (text: string) => (
                      <div className="px-2 py-1 text-sm">{text}</div>
                    )
                  }
                ]}
                pagination={false}
                size="small"
                scroll={{ x: 800 }}
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
                      .map((email) => email.trim())
                      .filter((email) => email.length > 0 && email.includes('@'));
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
              Are you sure you want to delete this company?
            </p>
          </div>
          <p className="mt-2 text-sm">
            <span className="font-semibold">Warning:</span> This action cannot be undone.
          </p>
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
              Are you sure you want to delete {selectedRowKeys.length} selected companies?
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
            <span className="text-xs font-medium bg-[#0f766e] text-white rounded-full px-2 py-0.5">
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
                className="px-4 py-1.5 rounded-md text-sm font-medium text-white bg-[#0f766e] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
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
                        className="px-3 py-1 text-xs font-medium rounded bg-[#0f766e] text-white hover:opacity-90"
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

    </div>
  );
};

export default CompanyManagement;