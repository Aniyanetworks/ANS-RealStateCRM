// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import 'jspdf-autotable';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import logo from '/logo.svg';
import logo1 from '/logo.svg';
import type {
  TableColumnsType,
  TableProps,
} from 'antd';
import {
  Button,
  Checkbox,
  Dropdown,
  Modal,
  Select,
  Space,
  Table,
  Upload,
  UploadProps,
} from 'antd';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import moment from 'moment-timezone';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { BsThreeDotsVertical } from 'react-icons/bs';
import {
  FaEye,
  FaFileExcel,
  FaFilePdf,
  FaFilter,
  FaRegEdit,
  FaTimes,
} from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { useSelector } from 'react-redux';
import * as XLSX from 'xlsx';

import { UploadOutlined } from '@ant-design/icons';

import TableLoader from '../../components/loader/TableLoader';
import {
  useGetActiveBranchListDataQuery,
} from '../../redux/api/superadmin/branch/Branchmanagementslice';
import {
  useGetPropertyListingQuery,
} from '../../redux/api/superadmin/propertyListingDataSlice';
import {
  useGetExpenseCategoryListQuery,
} from '../../redux/api/superadmin/expenses/expenseCategorySlice';
import {
  useChangeExpenseStatusMutation,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useDeleteMultipleExpensesMutation,
  useGetExpenseListQuery,
  useUpdateExpenseMutation,
} from '../../redux/api/superadmin/expenses/expenseSlice';
import { useAppSelector } from '../../redux/hooks';
import {
  formatNumberWithCommasAndDecimals,
} from '../../utils/formatNumberWithCommasAndDecimals';
import { usePermissions } from '../../utils/permissionUtils';

type TableRowSelection<T extends object = object> = TableProps<T>["rowSelection"];

interface DataType {
  key?: React.Key;
  name: string;
  description: string;
  amount: number;
  transactionDate: string;
  expenseCategory: {
    name: string;
    id: string;
  };
  branch?: {
    id: number;
    name: string;
  };
  branchId?: number;
  uuid: string;
  tax: number;
  total: number;
  invoice_number: string;
  expense_id: string;
  receiptPath?: string;
  propertyListingId?: number | string;
  propertyListing?: {
    id?: number | string;
    propertyAddress?: string;
  };
  isRecurring: boolean;
  recurrenceType?: string;
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
}

interface ExistingFile {
  filePath: string;
  id: string;
}

const recurrenceOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const ExpenseManagement = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const { data: expensesData, isLoading, refetch } = useGetExpenseListQuery("");
  const { data: categoriesData } = useGetExpenseCategoryListQuery("");
  const { data: activeBranches, isLoading: branchesLoading } = useGetActiveBranchListDataQuery("");
  const { data: propertyListingData } = useGetPropertyListingQuery("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] = useState(false);
  const [deleteMultipleExpenses] = useDeleteMultipleExpensesMutation();
  const [searchText, setSearchText] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string | null>(null);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([]);
  const [filteredInfo, setFilteredInfo] = useState<Filters>({});
  const [sortedInfo, setSortedInfo] = useState<Sorts>({});
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<DataType | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedPropertyListings, setSelectedPropertyListings] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(() =>
    parseInt(localStorage.getItem("agentCurentPage") || "1", 10)
  );
  const pageSize = 20;
  const { tradeSheetRepresentationData } = useAppSelector(
    (state: any) => state.user
  );
  const { user } = useSelector((state: any) => state.user);
  const isSuperAdmin = user?.roleId == 1;
  const EXPENSE_EDIT_EMAILS = ['admin@dvrealty.ca', 'nabaa@dvrealty.ca', 'superadmin@nomail.com'];
  const canEditExpense = EXPENSE_EDIT_EMAILS.includes(user?.email);

  const handleView = (record: DataType) => {
    setSelectedExpense(record);
    setIsViewModalVisible(true);
  };

  const closeViewModal = () => {
    setIsViewModalVisible(false);
    setSelectedExpense(null);
  };

  const uploadProps: UploadProps = {
    multiple: true,
    beforeUpload: (file) => {
      setNewFiles((prevFiles) => [...prevFiles, file]);
      return false;
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

  const handleRemoveFile = (file: File) => {
    setNewFiles(newFiles.filter(f => f.name !== file.name));
  };

  const handleRemoveExistingFile = (file: ExistingFile) => {
    setExistingFiles(existingFiles.filter(f => f.id !== file.id));
  };

  const handlePeriodFilter = (period: string) => {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'Day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'Week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'Month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'Quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'Year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'Last 30 days':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'Last 90 days':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'Last Year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'All Time':
        setDateRange(null);
        setPeriodFilter(null);
        return;
    }

    setDateRange([startDate.toISOString(), now.toISOString()]);
    setPeriodFilter(period);
    setShowDropdown(false);
  };

  const handleCustomDateRange = () => {
    if (customStart && customEnd) {
      setDateRange([
        new Date(customStart).toISOString(),
        new Date(customEnd).toISOString(),
      ]);
      setPeriodFilter('Custom');
      setShowDropdown(false);
    }
  };

  const handleApplyFilters = () => {
    if (customStart && customEnd) {
      handleCustomDateRange();
    } else {
      setShowDropdown(false);
    }
  };

  const handleCategoryFilter = (selectedCategoryIds: string[]) => {
    setSelectedCategories(selectedCategoryIds);
  };

  const handleBranchFilter = (selectedBranchIds: string[]) => {
    setSelectedBranches(selectedBranchIds);
  };

  const handlePropertyListingFilter = (selectedPropertyListingIds: string[]) => {
    setSelectedPropertyListings(selectedPropertyListingIds);
  };

  const searchInObject = (item: any, searchTerm: string): boolean => {
    if (!item || !searchTerm) return false;

    const lowerSearchTerm = searchTerm.toLowerCase();

    const fields = [
      item?.name,
      item?.invoice_number,
      item?.expenseCategory?.name,
      item?.branch?.name,
      item?.propertyListing?.propertyAddress,
      moment.utc(item.transactionDate).format("DD MMMM YYYY"),
      formatNumberWithCommasAndDecimals(item.amount),
      `$${formatNumberWithCommasAndDecimals(item.amount)}`,
      formatNumberWithCommasAndDecimals(item.tax),
      `$${formatNumberWithCommasAndDecimals(item.tax)}`,
      formatNumberWithCommasAndDecimals(item.total),
      `$${formatNumberWithCommasAndDecimals(item.total)}`,
      item?.isRecurring ? "Recurring" : "One-time",
      item?.recurrenceType,
    ];

    return fields.some((field) =>
      field?.toString().toLowerCase().includes(lowerSearchTerm)
    );
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);

    if (value.trim() === "") {
      setSearchSuggestions([]);
    } else {
      const suggestions = tableData
        .map((item) => [
          item?.name,
          item?.invoice_number,
          item?.expense_id,
          item?.description,
          item?.expenseCategory?.name,
          item?.propertyListing?.propertyAddress,
          moment.utc(item.transactionDate).format("DD MMMM YYYY"),
          `$${formatNumberWithCommasAndDecimals(item.amount)}`,
          `$${formatNumberWithCommasAndDecimals(item.tax)}`,
          `$${formatNumberWithCommasAndDecimals(item.total)}`,
          item?.isRecurring ? "Recurring" : "One-time",
          item?.recurrenceType,
        ])
        .flat()
        .filter((field) => field?.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5);
      setSearchSuggestions(suggestions as string[]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchText(suggestion);
    setSearchSuggestions([]);
  };

  const filteredData = useMemo(() => {
    if (!tableData) return [];

    let reportData = [...tableData];

    if (dateRange) {
      const [startStr, endStr] = dateRange;
      const start = moment.tz(startStr, "America/Toronto").startOf('day');
      const end = moment.tz(endStr, "America/Toronto").endOf('day');
      reportData = reportData.filter((item) => {
        const itemDate = moment.utc(item.transactionDate).tz("America/Toronto");
        return itemDate?.isValid() && itemDate.isBetween(start, end, null, '[]');
      });
    }

    if (selectedCategories.length > 0) {
      reportData = reportData.filter((item) =>
        selectedCategories.includes(item.expenseCategory?.id)
      );
    }

    if (selectedBranches.length > 0) {
      reportData = reportData.filter((item) =>
        selectedBranches.includes(item.branch?.id?.toString())
      );
    }

    if (selectedPropertyListings.length > 0) {
      reportData = reportData.filter((item) =>
        selectedPropertyListings.includes(item.propertyListing?.id?.toString())
      );
    }

    if (searchText) {
      reportData = reportData.filter((item) => searchInObject(item, searchText));
    }

    return reportData;
  }, [tableData, dateRange, selectedCategories, selectedBranches, selectedPropertyListings, searchText]);

  useEffect(() => {
    setTableData(expensesData?.data?.expenses || []);
  }, [expensesData]);

  const {
    register,
    formState: { errors },
    reset,
    getValues,
    setError,
    handleSubmit,
    setValue,
    watch,
  } = useForm();

  const [createExpense] = useCreateExpenseMutation();
  const [updateExpense] = useUpdateExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();

  useEffect(() => {
    const amount = parseFloat(watch("amount") || "0");
    const tax = parseFloat(watch("tax") || "0");
    setValue("total", ((Number(amount) + Number(tax)).toFixed(2)));
  }, [watch("amount"), watch("tax")]);

  const branchData = activeBranches?.data?.branchData;
  useEffect(() => {
    if (isModalOpen && !isEditMode && (watch("branchId") === undefined || watch("branchId") === null)) {
      const firstBranchId = branchData?.[0]?.id;
      if (firstBranchId != null) {
        setValue("branchId", firstBranchId);
      }
    }
  }, [isModalOpen, isEditMode, branchData, setValue, watch]);

  const resetForm = () => {
    reset({
      name: "",
      invoice_number: "",
      description: "",
      amount: "",
      tax: 0.00,
      total: "",
      transactionDate: "",
      expenseCategoryId: "",
      propertyListingId: undefined,
      branchId: undefined,
      isRecurring: false,
      recurrenceType: undefined,
      recurrenceInterval: undefined,
      recurrenceEndDate: undefined,
      expenseStatus: "approved",
    });
    setNewFiles([]);
    setExistingFiles([]);
  };

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedUUID(null);
  };

  const handleEdit = (record: DataType) => {
    reset({
      ...record,
      expenseCategoryId: record.expenseCategory?.id,
      propertyListingId: record.propertyListingId || record.propertyListing?.id,
      branchId: record.branchId || record.branch?.id,
      transactionDate: record.transactionDate?.split('T')[0],
      recurrenceEndDate: record.recurrenceEndDate?.split('T')[0]
    });
    setIsEditMode(true);
    setSelectedUUID(record?.uuid);

    if (record.receiptPath) {
      setExistingFiles([{
        filePath: record.receiptPath,
        id: record.uuid
      }]);
    }

    showModal();
  };

  const confirmDelete = async () => {
    try {
      const response = await deleteExpense(selectedUUID).unwrap();
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
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteMultipleExpenses(selectedRowKeys as string[]);
        setIsDeleteModalMultipleVisible(false);
        await refetch();
        if (response.data.status == true) {
          setSelectedRowKeys([]);
          toast.success("Expenses deleted successfully!");
        } else {
          toast.error("Failed to delete expenses. Please try again.");
        }
      } catch {
        setIsDeleteModalMultipleVisible(false);
        toast.success("Expenses deleted successfully!");
      }
    } else {
      toast.error("Please select items.");
    }
  };

  const onSubmit = async () => {
    setIsUploading(true);
    const formData = getValues();

    const sanitizedFormData = {
      ...formData,
      tax: formData.tax === "" ? "0" : formData.tax,
    };

    const formPayload = new FormData();

    const validBranchIds = activeBranches?.data?.branchData?.map((b: { id: number }) => b.id) ?? [];
    Object.keys(sanitizedFormData).forEach(key => {
      if (key !== 'receipt') {
        const value = sanitizedFormData[key];
        if (value === undefined || value === null || value === '') {
          return;
        }
        if (key === 'branchId') {
          const num = Number(value);
          if (Number.isNaN(num) || num < 1) return;
          if (validBranchIds.length > 0 && !validBranchIds.includes(num)) return;
          formPayload.append(key, String(num));
          return;
        }
        if (value instanceof Date) {
          formPayload.append(key, value.toISOString());
        } else {
          formPayload.append(key, value);
        }
      }
    });

    if (newFiles.length > 0) {
      formPayload.append('receipt', newFiles[0]);
    }

    if (existingFiles.length > 0 && newFiles.length === 0) {
      formPayload.append('existingReceiptPath', existingFiles[0].filePath);
    }

    if (isEditMode) {
      try {
        if (!selectedUUID) {
          throw new Error("UUID is null");
        }
        const response = await updateExpense({
          uuid: selectedUUID,
          data: formPayload,
        });

        if (response?.error?.data?.status === false) {
          response.error.data.errors.forEach((error: any) => {
            setError(error.path, {
              type: "manual",
              message: error.msg,
            });
          });
          setIsUploading(false);
        } else if (response?.data?.status === true) {
          toast.success(`${response?.data?.message}`);
          setIsModalOpen(false);
          setIsEditMode(false);
          setSelectedUUID(null);
          resetForm();
          setIsUploading(false);
          refetch();
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
        const response = await createExpense(formPayload);

        if (response?.error?.data?.status === false) {
          setIsUploading(false);
          response.error.data.errors?.forEach((error: any) => {
            setError(error.path, {
              type: "manual",
              message: error.msg,
            });
          });
        } else if (response?.data?.status === true) {
          toast.success(`${response?.data?.message}`);
          setIsModalOpen(false);
          resetForm();
          setIsUploading(false);
          refetch();
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

  const [changeExpenseStatus] = useChangeExpenseStatusMutation();

  const handleChangeExpenseStatus = async (newStatus: string, id: string) => {
    try {
      const response = await changeExpenseStatus({
        expenseStatus: newStatus,
        id,
      }).unwrap();
      toast.success(`${response?.message}`);
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  const handleChange: OnChange = (pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter as Sorts);
    localStorage.setItem("agentCurentPage", pagination?.current || 1);
    setCurrentPage(pagination?.current || 1);
  };

  const statusOptions = [
    { label: "Approved", value: "approved" },
    { label: "Pending", value: "pending" },
    { label: "Rejected", value: "rejected" },
  ];

  const columns: TableColumnsType<DataType> = [
    {
      title: "Invoice ID",
      dataIndex: "invoice_number",
      key: "invoice_number",
      render: (invoice_number: string, record: DataType) => (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            handleView(record);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              handleView(record);
            }
          }}
          className="cursor-pointer  hover:text-blue-600 hover:underline transition-colors"
        >
          {invoice_number || "-"}
        </span>
      ),
    },
    {
      title: "Title",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => text || "-",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => {
        return `$${formatNumberWithCommasAndDecimals(amount)}`;
      },
    },
    {
      title: "Tax",
      dataIndex: "tax",
      key: "tax",
      render: (tax) => `$${formatNumberWithCommasAndDecimals(tax)}`,
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total) => `$${formatNumberWithCommasAndDecimals(total)}`,
    },
    {
      title: "Date",
      dataIndex: "transactionDate",
      key: "date",
      render: (date) => {
        if (!date) return "-";
        return moment.utc(date).format("DD MMMM YYYY");
      },
    },
    {
      title: "Category",
      dataIndex: ["expenseCategory", "name"],
      key: "category",
      render: (name) => name || "-",
    },
    {
      title: "Branch",
      dataIndex: "branch",
      key: "branch",
      render: (branch) => branch?.name || "Main Branch",
      filters: activeBranches?.data?.branchData?.map((branch: any) => ({
        text: branch.name,
        value: branch.name,
      })) || [],
      filteredValue: filteredInfo.branch || null,
      onFilter: (value, record) => record?.branch?.name === value,
      sorter: (a, b) => {
        const aName = a?.branch?.name || "";
        const bName = b?.branch?.name || "";
        return aName.localeCompare(bName);
      },
      sortOrder: sortedInfo.columnKey === "branch" ? sortedInfo.order : null,
      ellipsis: true,
    },
    {
      title: "Property Listing",
      dataIndex: "propertyListing",
      key: "propertyListing",
      render: (propertyListing) => propertyListing?.propertyAddress || "-",
      filters: propertyListingData?.data?.propertyListingData?.map((item: any) => ({
        text: item.propertyAddress,
        value: item.propertyAddress,
      })) || [],
      filteredValue: filteredInfo.propertyListing || null,
      onFilter: (value, record) => record?.propertyListing?.propertyAddress === value,
      sorter: (a, b) => {
        const aAddress = a?.propertyListing?.propertyAddress || "";
        const bAddress = b?.propertyListing?.propertyAddress || "";
        return aAddress.localeCompare(bAddress);
      },
      sortOrder: sortedInfo.columnKey === "propertyListing" ? sortedInfo.order : null,
      ellipsis: true,
    },
    {
      title: "Recurring",
      dataIndex: "isRecurring",
      key: "isRecurring",
      render: (isRecurring) => isRecurring ? "Yes" : "No",
    },
    {
      title: "Recurrence Type",
      dataIndex: "recurrenceType",
      key: "recurrenceType",
      render: (type) => type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : "-",
    },
    {
      title: "Actions",
      dataIndex: "uuid",
      key: "actions",
      render: (uuid, record) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Dropdown
            menu={{
            items: [
              hasPermissionForSlug("view_expense") && {
                key: "view",
                label: (
                  <button
                    onClick={() => handleView(record)}
                    aria-label="View"
                    className="flex items-center gap-2"
                  >

                    <FaEye /> View
                  </button>
                ),
              },
              canEditExpense && {
                key: "edit",
                label: (
                  <button
                    onClick={() => handleEdit(record)}
                    aria-label="Edit"
                    className="flex items-center gap-2"
                  >
                    <FaRegEdit />
                    Edit
                  </button>
                ),
              },
              hasPermissionForSlug("delete_expense") && {
                key: "delete",
                label: (
                  <button
                    onClick={() => handleDelete(uuid)}
                    aria-label="Delete"
                    className="flex items-center gap-2"
                  >
                    <MdDelete size={14} />
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
        </span>
      ),
      fixed: "right",
      align: "center",
    },
  ];

  const showModal = () => setIsModalOpen(true);

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const logoX = (pageWidth / 2) - 10;
    const logoY = 5;
    const logoWidth = 20;
    const logoHeight = 20;
    doc.addImage(logo1, "PNG", logoX, logoY, logoWidth, logoHeight);

    doc.setFontSize(16);
    doc.text("Expense Report", pageWidth / 2, 32, { align: "center" });

    if (periodFilter || dateRange) {
      doc.setFontSize(10);
      let filterText = "";
      if (periodFilter) {
        filterText += `${periodFilter}`;
      }
      if (dateRange) {
        filterText += ` (${moment(dateRange[0]).format('MMM D, YYYY')} - ${moment(dateRange[1]).format('MMM D, YYYY')})`;
      }
      const pageWidth = doc.internal.pageSize.getWidth();
      const textWidth = doc.getTextWidth(filterText);
      const textX = (pageWidth - textWidth) / 2;
      doc.text(filterText, textX, 40);
    }

    const tableData = filteredData.filter(item => item.expenseStatus == 'approved').map(item => [
      item.invoice_number,
      item.name,
      item.propertyListing?.propertyAddress || "-",
      `$${formatNumberWithCommasAndDecimals(item.amount)}`,
      `$${formatNumberWithCommasAndDecimals(item.tax)}`,
      `$${formatNumberWithCommasAndDecimals(item.total)}`,
      moment(item.transactionDate).format('MMM D, YYYY'),
      item.expenseCategory?.name || '-',
    ]);

    doc.autoTable({
      startY: 45,
      head: [['Invoice', 'Name', 'Property Listing', 'Amount', 'Tax', 'Total', 'Date', 'Category']],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [20, 29, 44],
        textColor: 255,
        fontStyle: 'bold'
      },
      margin: { left: 14 },
    });

    const approvedForTotals = filteredData.filter((item) => item.expenseStatus === "approved");
    const totalAmount = approvedForTotals.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalTax = approvedForTotals.reduce((sum, item) => sum + Number(item.tax || 0), 0);
    const grandTotal = approvedForTotals.reduce((sum, item) => sum + Number(item.total || 0), 0);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Totals:", 14, doc.lastAutoTable.finalY + 15);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      body: [
        ['Total Amount', `$${formatNumberWithCommasAndDecimals(totalAmount)}`],
        ['Total Tax', `$${formatNumberWithCommasAndDecimals(totalTax)}`],
        ['Grand Total', `$${formatNumberWithCommasAndDecimals(grandTotal)}`],
      ],
      theme: "grid",
      margin: { left: 14 },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'right' }
      },
      styles: {
        fontSize: 11
      }
    });

    doc.save(`expense-report-${moment().format('YYYY-MM-DD')}.pdf`);
  };

  const generateExcel = () => {
    const approvedForExcel = filteredData.filter((item) => item.expenseStatus === "approved");
    const excelData = approvedForExcel.map(item => ({
      Name: item.name,
      Invoice: item.invoice_number,
      Description: item.description || '',
      'Property Listing': item.propertyListing?.propertyAddress || '',
      Amount: item.amount,
      Tax: item.tax,
      Total: item.total,
      Date: moment(item.transactionDate).format('MMM D, YYYY'),
      Category: item.expenseCategory?.name || '',
      Recurring: item.isRecurring ? 'Yes' : 'No',
      'Recurrence Type': item.recurrenceType || '',
    }));

    const totalAmount = approvedForExcel.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalTax = approvedForExcel.reduce((sum, item) => sum + Number(item.tax || 0), 0);
    const grandTotal = approvedForExcel.reduce((sum, item) => sum + Number(item.total || 0), 0);

    excelData.push({
      Invoice: '',
      Name: 'TOTALS',
      Description: '',
      Amount: totalAmount,
      Tax: totalTax,
      Total: grandTotal,
      Date: '',
      Category: '',
      Recurring: '',
      'Recurrence Type': '',
    });

    const ws = XLSX.utils.json_to_sheet([]);

    if (periodFilter || dateRange) {
      XLSX.utils.sheet_add_aoa(ws, [[
        `${periodFilter || ''} Data`,
        dateRange ? `(${moment(dateRange[0]).format('MMM D, YYYY')} - ${moment(dateRange[1]).format('MMM D, YYYY')})` : ''
      ]], { origin: 'A1' });
    }

    XLSX.utils.sheet_add_json(ws, excelData, { origin: periodFilter || dateRange ? 'A3' : 'A1' });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");

    XLSX.writeFile(wb, `expense-report-${moment().format('YYYY-MM-DD')}.xlsx`);
  };

  const calculatePendingExpenses = () => {
    return filteredData.filter(item => item.expenseStatus == 'pending').length;
  };
  const calculateTotalExpenses = () => {
    return filteredData.filter(item => item.expenseStatus == 'approved').reduce((sum, item) => sum + Number(item.total || 0), 0).toFixed(2);
  };
  const calculateTotalAmount = () => {
    return filteredData.filter(item => item.expenseStatus == 'approved').reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2);
  };
  const calculateTotalTax = () => {
    return filteredData.filter(item => item.expenseStatus == 'approved').reduce((sum, item) => sum + Number(item.tax || 0), 0).toFixed(2);
  };

  return (
    <div className="pb-16">
      {(periodFilter || dateRange) && (
        <div className="text-center font-semibold py-4">
          <p>
            {dateRange
              ? `(${periodFilter ? `${periodFilter}: ` : ''}${format(new Date(dateRange[0]), "dd MMMM yyyy")} to ${format(new Date(dateRange[1]), "dd MMMM yyyy")})`
              : periodFilter}
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Expenses</h1>
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          <div className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1" style={{ borderLeft: "2px solid #0f766e", background: "#f9f6f3" }}>
            <span className="text-xs text-gray-500 whitespace-nowrap">Total Expenses:</span>
            <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "#0f766e" }}>${formatNumberWithCommasAndDecimals(calculateTotalExpenses())}</span>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1" style={{ borderLeft: "2px solid #0f766e", background: "#f9f6f3" }}>
            <span className="text-xs text-gray-500 whitespace-nowrap">Amount:</span>
            <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "#0f766e" }}>${formatNumberWithCommasAndDecimals(calculateTotalAmount())}</span>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1 rounded px-2 py-1" style={{ borderLeft: "2px solid #0f766e", background: "#f9f6f3" }}>
            <span className="text-xs text-gray-500 whitespace-nowrap">Tax:</span>
            <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "#0f766e" }}>${formatNumberWithCommasAndDecimals(calculateTotalTax())}</span>
          </div>
          <div className="flex-1" />
          <div className="relative flex-shrink-0" style={{ width: 220 }}>
            <div className="flex">
              <input
                type="text"
                className="w-full border rounded-l"
                placeholder="Search expenses..."
                value={searchText}
                onChange={handleSearchInputChange}
                style={{ paddingLeft: 8, paddingRight: searchText ? 22 : 8, paddingTop: 4, paddingBottom: 4, fontSize: 12 }}
              />
              {searchText && (
                <button type="button" onClick={() => { setSearchText(""); setSearchSuggestions([]); }} className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" style={{ right: 38 }}>
                  <FaTimes style={{ fontSize: 10 }} />
                </button>
              )}
              <button
                className="bg-[#0f766e] text-white px-2 rounded-r flex items-center gap-1 flex-shrink-0"
                style={{ fontSize: 11 }}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <FaFilter size={10} /> Filter
              </button>
            </div>
            {searchSuggestions.length > 0 && (
              <div className="absolute left-0 mt-1 w-full bg-white shadow-md border rounded-md z-20">
                {searchSuggestions.map((suggestion, index) => (
                  <div key={index} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-xs" onClick={() => handleSuggestionClick(suggestion)}>
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
            {showDropdown && (
              <div className="absolute left-0 mt-1 w-[450px] bg-white shadow-md border rounded-md p-4 z-30">
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Date Range</h3>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {['Day', 'Week', 'Month', 'Quarter', 'Year'].map((period) => (
                      <button
                        key={period}
                        onClick={() => handlePeriodFilter(period)}
                        className={`px-3 py-1 rounded ${periodFilter === period ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {['Last 30 days', 'Last 90 days', 'Last Year', 'All Time'].map((range) => (
                      <button
                        key={range}
                        className={`block w-full text-left px-3 py-2 rounded ${periodFilter === range ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                        onClick={() => handlePeriodFilter(range)}
                      >
                        {range}
                      </button>
                    ))}
                    <div className="border p-2 rounded">
                      <label className="font-semibold">Custom Range</label>
                      <div className="flex flex-col sm:flex-row gap-2 mt-1">
                        <input type="date" className="border p-2 rounded w-full" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                        <input type="date" className="border p-2 rounded w-full" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Categories</h3>
                  <Select
                    mode="multiple"
                    placeholder="Select categories"
                    value={selectedCategories}
                    onChange={handleCategoryFilter}
                    options={categoriesData?.data?.categories?.map((cat: any) => ({ value: cat.id, label: cat.name }))}
                    className="w-full"
                    allowClear
                    showSearch
                    filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                  />
                </div>
                {isSuperAdmin && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Branches</h3>
                    <Select
                      mode="multiple"
                      placeholder="Select branches"
                      value={selectedBranches}
                      onChange={handleBranchFilter}
                      options={activeBranches?.data?.branchData?.map((branch: any) => ({ value: branch.id.toString(), label: branch.name }))}
                      className="w-full"
                      allowClear
                      showSearch
                      filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                      loading={branchesLoading}
                    />
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Property Listings</h3>
                  <Select
                    mode="multiple"
                    placeholder="Select property listings"
                    value={selectedPropertyListings}
                    onChange={handlePropertyListingFilter}
                    options={propertyListingData?.data?.propertyListingData?.map((item: any) => ({ value: item.id.toString(), label: item.propertyAddress }))}
                    className="w-full"
                    allowClear
                    showSearch
                    filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="w-1/2 bg-[#0f766e] text-white p-2 rounded" onClick={handleApplyFilters}>Apply</button>
                  <button
                    type="button"
                    className="w-1/2 bg-[#FFDFDC] text-[#EF4444] p-2 rounded"
                    onClick={() => {
                      setDateRange(null);
                      setPeriodFilter(null);
                      setCustomStart("");
                      setCustomEnd("");
                      setSelectedCategories([]);
                      setSelectedBranches([]);
                      setSelectedPropertyListings([]);
                      setShowDropdown(false);
                    }}
                  >
                    Reset & Close
                  </button>
                </div>
              </div>
            )}
          </div>
          <FaFilePdf onClick={generatePDF} size={20} className="cursor-pointer text-red-600 hover:text-red-700 flex-shrink-0" title="Export to PDF" />
          <FaFileExcel onClick={generateExcel} size={20} className="cursor-pointer text-green-600 hover:text-green-700 flex-shrink-0" title="Export to Excel" />
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasPermissionForSlug("add_expense") && (
              <button
                onClick={() => {
                  resetForm();
                  const firstBranchId = activeBranches?.data?.branchData?.[0]?.id;
                  if (firstBranchId != null) { setValue("branchId", firstBranchId); }
                  showModal();
                }}
                className="primary-btn"
              >
                Add New
              </button>
            )}
            {hasPermissionForSlug("delete_expense") && (
              <button onClick={() => setIsDeleteModalMultipleVisible(true)} className="cancel-btn" disabled={selectedRowKeys.length === 0}>
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
              rowSelection={rowSelection}
              rowKey="uuid"
              scroll={{ x: "max-content" }}
              columns={columns}
              onChange={handleChange}
              dataSource={filteredData}
              pagination={{ pageSize, current: currentPage, showSizeChanger: false }}
              onRow={(record) => ({
                onClick: (e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('button, .ant-dropdown, .ant-select')) return;
                  handleView(record);
                },
                style: { cursor: 'pointer' },
              })}
            />
          )}
        </div>

      <Modal
        onCancel={handleCancel}
        open={isModalOpen}
        onOk={handleSubmit(onSubmit)}
        title={isEditMode ? "Edit Expense" : "Create Expense"}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label>
                Title <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("name", { required: "Name is required" })}
                type="text"
                placeholder="Enter Name"
                className=""
              />
              {errors.name && (
                <p className="text-red-500 text-sm">
                  {errors.name.message as string}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>Description</label>
              <input
                {...register("description")}
                type="text"
                placeholder="Enter Description"
                className=""
              />
            </div>

            <div className="flex flex-col gap-2">
              <label>
                Amount <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("amount", {
                  required: "Amount is required",
                  min: { value: 0, message: "Amount must be positive" }
                })}
                type="number"
                step="0.01"
                placeholder="Enter Amount"
                className=""
              />
              {errors.amount && (
                <p className="text-red-500 text-sm">
                  {errors.amount.message as string}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>Tax</label>
              <input
                {...register("tax", {
                  min: { value: 0, message: "Tax must be positive" }
                })}
                type="number"
                step="0.01"
                placeholder="Enter Tax"
                className=""
              />
              {errors.tax && (
                <p className="text-red-500 text-sm">
                  {errors.tax.message as string}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>Total</label>
              <input
                {...register("total")}
                type="number"
                step="0.01"
                readOnly
                className="bg-gray-100"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label>
                Date <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("transactionDate", { required: "Date is required" })}
                type="date"
                className=""
              />
              {errors.transactionDate && (
                <p className="text-red-500 text-sm">
                  {errors.transactionDate.message as string}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>Category</label>
              <Select
                {...register("expenseCategoryId")}
                options={categoriesData?.data?.categories?.map((cat: any) => ({
                  value: cat.id,
                  label: cat.name,
                }))}
                value={watch("expenseCategoryId")}
                onChange={(selectedOption) =>
                  setValue("expenseCategoryId", selectedOption)
                }
                placeholder="Select Category"
                className="w-full"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <label>Property Listing (Optional)</label>
              <Select
                {...register("propertyListingId")}
                options={propertyListingData?.data?.propertyListingData?.map((item: any) => ({
                  value: item.id,
                  label: item.propertyAddress,
                }))}
                value={watch("propertyListingId")}
                onChange={(selectedOption) =>
                  setValue("propertyListingId", selectedOption)
                }
                placeholder="Select Property Listing"
                className="w-full"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>
            {isSuperAdmin ? (
              <div className="flex flex-col gap-2">
                <label>Branch (If any)</label>
                <Select
                  {...register("branchId")}
                  options={activeBranches?.data?.branchData?.map((branch: { id: number; name: string }) => ({
                    value: branch.id,
                    label: branch.name,
                  }))}
                  value={
                    watch("branchId") ??
                    (activeBranches?.data?.branchData?.length
                      ? activeBranches.data.branchData[0].id
                      : undefined)
                  }
                  onChange={(selectedOption) =>
                    setValue("branchId", selectedOption)
                  }
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
                <input
                  type="hidden"
                  {...register("branchId")}
                  value={user?.branchId ?? 1}
                  readOnly
                />
                <div className="">
                  <label>Branch Name:</label>
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

          <div className="border p-4 rounded-md mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Checkbox
                {...register("isRecurring")}
                checked={watch("isRecurring")}
                onChange={(e) => setValue("isRecurring", e.target.checked)}
              />
              <label className="mt-1">This is a recurring expense</label>
            </div>

            {watch("isRecurring") && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label>Recurrence Type <span className="text-red-500 ml-1">*</span></label>
                  <Select
                    {...register("recurrenceType")}
                    options={recurrenceOptions}
                    value={watch("recurrenceType")}
                    onChange={(value) => setValue("recurrenceType", value)}
                    placeholder="Select type"
                    className="w-full"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label>Recurrence Interval <span className="text-red-500 ml-1">*</span></label>
                  <input
                    {...register("recurrenceInterval", {
                      min: { value: 1, message: "Interval must be at least 1" }
                    })}
                    type="number"
                    min="1"
                    placeholder="Every X days/weeks/months"
                    className=""
                  />
                  {errors.recurrenceInterval && (
                    <p className="text-red-500 text-sm">
                      {errors.recurrenceInterval.message as string}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label>Recurrence End Date</label>
                  <input
                    {...register("recurrenceEndDate")}
                    type="date"
                    className=""
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label>Invoice</label>
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
                      href={`${file.filePath}`}
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

      <Modal
        onCancel={closeViewModal}
        title="Expense Details"
        open={isViewModalVisible}
        width={"800px"}
        loading={isUploading}
        footer={[
          <button
            key="cancel"
            className="cancel-btn mr-1"
            onClick={closeViewModal}
          >
            Close
          </button>,
          <button
            key="confirm"
            className="primary-btn"
            onClick={() => {
              const doc = new jsPDF();
              const pageWidth = doc.internal.pageSize.getWidth();

              const logoX = (pageWidth / 2) - 10;
              const logoY = 5;
              const logoWidth = 20;
              const logoHeight = 20;
              doc.addImage(logo, "PNG", logoX, logoY, logoWidth, logoHeight);

              doc.setFontSize(16);
              doc.text("ANS REALSTATECRM", pageWidth / 2, 32, { align: "center" });

              doc.setFontSize(12);
              doc.text("Expense Details", pageWidth / 2, 40, { align: "center" });

              if (selectedExpense) {
                const details = [
                  `Invoice Number: ${selectedExpense.invoice_number}`,
                  `Title: ${selectedExpense.name}`,
                  `Description: ${selectedExpense.description || "N/A"}`,
                  `Amount: $${formatNumberWithCommasAndDecimals(selectedExpense.amount)}`,
                  `Tax: $${formatNumberWithCommasAndDecimals(selectedExpense.tax)}`,
                  `Total: $${formatNumberWithCommasAndDecimals(selectedExpense.total)}`,
                  `Date: ${moment
                    .utc(selectedExpense.transactionDate)
                    .format("DD MMMM YYYY")}`,
                  `Category: ${selectedExpense.expenseCategory?.name || "N/A"}`,
                  `Property Listing: ${selectedExpense.propertyListing?.propertyAddress || "N/A"}`,
                  `Recurring: ${selectedExpense.isRecurring ? "Yes" : "No"}`,
                ];

                if (selectedExpense.isRecurring) {
                  details.push(
                    `Recurrence Type: ${selectedExpense.recurrenceType || "N/A"}`,
                    `Recurrence Interval: ${selectedExpense.recurrenceInterval || "N/A"}`,
                    `Recurrence End Date: ${selectedExpense.recurrenceEndDate
                      ? format(new Date(selectedExpense.recurrenceEndDate), "dd MMMM yyyy")
                      : "N/A"
                    }`
                  );
                }

                details.forEach((detail, index) => {
                  doc.text(detail, 14, 50 + index * 10);
                });

                if (selectedExpense.receiptPath) {
                  doc.text(`Receipt: ${selectedExpense.receiptPath}`, 14, 60 + details.length * 10);
                }
              }

              doc.save(`expense-details-${selectedExpense?.invoice_number || "unknown"}.pdf`);
            }}
            style={{ marginLeft: "8px" }}
          >
            Download
          </button>,
        ]}
      >
        {selectedExpense ? (
          <div className="space-y-4">
            <div className=" flex flex-col items-center gap-2  ">
              <img src={logo} alt="" className={`w-[50px]`} />
              <h2
                className={`tracking-widest text-base playfair-display-sc-bold text-[#0f766e]`}
              >
                ANS REALSTATECRM
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <p className="text-base"><span className="font-bold text-gray-700">Invoice Number:</span> {selectedExpense.invoice_number}</p>
              <p className="text-base"><span className="font-bold text-gray-700">Title:</span> {selectedExpense.name}</p>
              <p className="text-base"><span className="font-bold text-gray-700">Description:</span> {selectedExpense.description || "N/A"}</p>
              <p className="text-base"><span className="font-bold text-gray-700">Amount:</span> ${formatNumberWithCommasAndDecimals(selectedExpense.amount)}</p>
              <p className="text-base"><span className="font-bold text-gray-700">Tax:</span> ${formatNumberWithCommasAndDecimals(selectedExpense.tax)}</p>
              <p className="text-base"><span className="font-bold text-gray-700">Total:</span> ${formatNumberWithCommasAndDecimals(selectedExpense.total)}</p>
              <p className="text-base"><span className="font-bold text-gray-700">Date:</span> {moment.utc(selectedExpense.transactionDate).format("DD MMMM YYYY")}</p>
              <p className="text-base"><span className="font-bold text-gray-700">Category:</span> {selectedExpense.expenseCategory?.name || "N/A"}</p>
              <p className="text-base"><span className="font-bold text-gray-700">Property Listing:</span> {selectedExpense.propertyListing?.propertyAddress || "N/A"}</p>
              <p className="text-base"><span className="font-bold text-gray-700">Recurring:</span> {selectedExpense.isRecurring ? "Yes" : "No"}</p>
              {selectedExpense.isRecurring && (
                <>
                  <p className="text-base"><span className="font-bold text-gray-700">Recurrence Type:</span> {selectedExpense.recurrenceType || "N/A"}</p>
                  <p className="text-base"><span className="font-bold text-gray-700">Recurrence Interval:</span> {selectedExpense.recurrenceInterval || "N/A"}</p>
                  <p className="text-base"><span className="font-bold text-gray-700">Recurrence End Date:</span> {selectedExpense.recurrenceEndDate ? format(new Date(selectedExpense.recurrenceEndDate), "dd MMMM yyyy") : "N/A"}</p>
                </>
              )}
              {selectedExpense.receiptPath && (
                <p className="text-base sm:col-span-2">
                  <span className="font-bold text-gray-700">Receipt:</span>{" "}
                  <a href={selectedExpense.receiptPath} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View Receipt
                  </a>
                </p>
              )}
            </div>
          </div>
        ) : (
          <p>No expense selected.</p>
        )}
      </Modal>
      </div>
    </div>
  );
};

export default ExpenseManagement;
