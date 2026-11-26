/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any

import {
  useEffect,
  useState,
} from 'react';

import type {
  TableColumnsType,
  TableProps,
} from 'antd';
import {
  Button,
  Dropdown,
  Input,
  Modal,
  Space,
  Spin,
  Table,
} from 'antd';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { BsThreeDotsVertical } from 'react-icons/bs';
import {
  FaClipboardList,
  FaEye,
  FaRegEdit,
  FaSearch,
  FaTimes,
  FaUpload,
  FaUserCheck,
  FaUserTimes,
} from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { NavLink } from 'react-router-dom';
import * as XLSX from 'xlsx';

import { LoadingOutlined } from '@ant-design/icons';

import TableLoader from '../../../../../components/loader/TableLoader';
import LeadStatistics from './LeadStatistics';
import {
  useGetActiveBranchListDataQuery,
} from '../../../../../redux/api/superadmin/branch/Branchmanagementslice';
import {
  useAnalyzeCampaignMergeMutation,
  useCreateCampaignMutation,
  useDeleteCampaignMutation,
  useDeleteMultipleCampaignsMutation,
  useExportLeadsQuery,
  useGetCampaignsQuery,
  useImportLeadsMutation,
  useMergeCampaignsMutation,
  useUpdateCampaignMutation,
} from '../../../../../redux/api/superadmin/leadManagementSlice';
import { useAppSelector } from '../../../../../redux/hooks';
import { usePermissions } from '../../../../../utils/permissionUtils';
import {
  formatStringCamelCasecapitalize,
} from '../../../../../utils/stringUtils';


type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];

interface Campaign {
  key?: React.Key;
  uuid: string;
  name: string;
  status: string;
  _count?: {
    leads: number;
  };
  createdAt: string;
}

interface SkippedLead {
  name?: string;
  email?: string;
  phone?: string;
  reason: string;
}

interface ImportStats {
  imported: number;
  skipped: number;
  skippedLeads: SkippedLead[];
}

interface CampaignFormData {
  name: string;
  status: string;
}

const CampaignManagement = () => {
  const { user } = useAppSelector((state) => state.user);
  const { hasPermissionForSlug } = usePermissions();
  const isSuperAdmin = user?.roleId == 1;
  const [tableData, setTableData] = useState<Campaign[]>([]);
  const [selectedBranchFilter, setSelectedBranchFilter] =
    useState<string>("all");

  const { data, isLoading, refetch } = useGetCampaignsQuery(
    isSuperAdmin ? selectedBranchFilter : undefined
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [selectedCampaignName, setSelectedCampaignName] = useState<
    string | null
  >(null);
  const [createCampaign] = useCreateCampaignMutation();
  const [updateCampaign] = useUpdateCampaignMutation();
  const [deleteCampaign] = useDeleteCampaignMutation();
  const [importLeads] = useImportLeadsMutation();
  const { data: exportData } = useExportLeadsQuery(selectedUUID, {
    skip: !selectedUUID || !isExportModalVisible,
  });
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isMergeModalVisible, setIsMergeModalVisible] = useState(false);
  const [mergeCampaigns] = useMergeCampaignsMutation();
  const [isDeleteModalMultipleVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [deleteMultipleCampaigns] = useDeleteMultipleCampaignsMutation();
  const [mergeAnalysis, setMergeAnalysis] = useState<any>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeCampaignMerge] = useAnalyzeCampaignMergeMutation();
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>("all");

  const campaignTypes = ["Tenant", "Landload", "Seller", "Buyer"];

  useEffect(() => {
    setTableData(data?.data?.campaigns);
  }, [data]);

  const { data: activeBranches } = useGetActiveBranchListDataQuery("", {
    skip: !isSuperAdmin,
  });

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit,
    setValue,
  } = useForm<Campaign>();

  const resetForm = () => {
    reset({
      name: "",
      type: "",
      status: "active",
    });
  };

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedUUID(null);
  };

  const showModal = () => setIsModalOpen(true);

  const handleEdit = (record: Campaign) => {
    setValue("name", record.name);
    setValue("type", record.type);
    setValue("status", record.status);
    setIsEditMode(true);
    setSelectedUUID(record?.uuid);
    showModal();
  };

  const confirmDelete = async () => {
    if (!selectedUUID || !selectedCampaignName) {
      toast.error("No campaign selected for deletion");
      return;
    }

    try {
      toast.loading(`Deleting campaign "${selectedCampaignName}"...`, {
        id: "delete-campaign",
      });
      const response = await deleteCampaign(selectedUUID).unwrap();
      toast.success(`${response?.message}`, { id: "delete-campaign" });
      setTableData(tableData.filter((item) => item.uuid !== selectedUUID));
    } catch (error) {
      toast.error(
        `Failed to delete campaign "${selectedCampaignName}". Something went wrong!`,
        { id: "delete-campaign" }
      );
      console.error("Delete error:", error);
    } finally {
      setIsModalVisible(false);
      setSelectedUUID(null);
      setSelectedCampaignName(null);
    }
  };

  const [isDeleteModalVisible, setIsModalVisible] = useState(false);

  const handleDelete = (uuid: string, name: string) => {
    setSelectedUUID(uuid);
    setSelectedCampaignName(name);
    setIsModalVisible(true);
  };

  const cancelDelete = () => {
    setIsModalVisible(false);
    setSelectedUUID(null);
    setSelectedCampaignName(null);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<Campaign> = {
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
            if (index % 2 === 0) {
              return false;
            }
            return true;
          });
          setSelectedRowKeys(newSelectedRowKeys);
        },
      },
    ],
  };

  const onSubmit = async (data: CampaignFormData) => {
    try {
      if (isEditMode) {
        const response = await updateCampaign({
          uuid: selectedUUID,
          data,
        }).unwrap();
        toast.success(`${response?.message}`);
      } else {
        const response = await createCampaign(data).unwrap();
        toast.success(`${response?.message}`);
      }
      refetch();
      handleCancel();
    } catch (error: unknown) {
      toast.error(
        error?.data?.message || "Operation failed. Something went wrong!"
      );
      console.error("Operation error:", error);
    }
  };

  const handleImportLeads = async (campaignUuid: string) => {
    setSelectedUUID(campaignUuid);

    const campaign = data?.data?.campaigns?.find(
      (c) => c.uuid === campaignUuid
    );
    const hasExistingLeads = campaign?._count?.leads > 0;

    if (hasExistingLeads) {
      setIsImportModalVisible(true);
      setFileHeaders([]);
      setSelectedFields([]);
    } else {
      setIsImportModalVisible(true);
    }
  };

  const parseFileHeaders = (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let headers: string[] = [];

          if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
              header: 1,
            });
            headers = jsonData[0] as string[];
          } else {
            const content = data as string;
            const lines = content.split("\n");

            const isTSV = content.includes("\t");
            const delimiter = isTSV ? "\t" : ",";

            headers = lines[0].split(delimiter).map((h) => h.trim());
          }

          headers = headers.filter(Boolean).map(String);
          resolve(headers);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("File reading failed"));

      if (file.name.endsWith(".csv") || file.name.endsWith(".tsv")) {
        reader.readAsText(file);
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error("Only CSV, TSV, or Excel files are supported"));
      }
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFileHeaders([]);
    setSelectedFields([]);

    try {
      const headers = await parseFileHeaders(file);
      setFileHeaders(headers);
      setSelectedFields(headers);

      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        toast.success("Excel file headers loaded successfully");
      }
    } catch (error) {
      toast.error("Failed to parse file. Please check the file format.");
      console.error("File parsing error:", error);
    }
  };

  const handleImportSubmit = async () => {
    if (!selectedFile || !selectedUUID || selectedFields.length === 0) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("campaignUuid", selectedUUID);
      formData.append("selectedFields", JSON.stringify(selectedFields));

      const response = await importLeads(formData).unwrap();
      setImportStats({
        imported: response.data.importedCount,
        skipped: response.data.skippedCount,
        skippedLeads: response.data.skippedLeads,
      });
      toast.success(
        `Successfully imported ${response.data.importedCount} leads. ${response.data.skippedCount} leads were skipped.`
      );
      refetch();

      setIsImportModalVisible(false);
      setSelectedFile(null);
      setImportStats(null);
    } catch (error: unknown) {
      console.error("Import error:", error);
      toast.error(
        `Failed to import leads. ${
          error?.data?.message || "Please check the file format and try again."
        }`
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportSubmit = () => {
    if (!exportData) return;

    const blob = new Blob([exportData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${selectedUUID}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    setIsExportModalVisible(false);
  };

  const handleMergeClick = async () => {
    if (selectedRowKeys.length < 2) {
      toast.error("Please select at least 2 campaigns to merge");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await analyzeCampaignMerge({
        campaignUuids: selectedRowKeys.map((key) => key.toString()),
      }).unwrap();

      setMergeAnalysis(response.data);

      const uniqueLeadUuids = response.data.uniqueLeadsDetails.map(
        (lead: any) => lead.uuid
      );
      const duplicateSelections = response.data.duplicateDetails.map(
        (group: any) => {
          const sortedLeads = [...group.leads].sort((a: any, b: any) => {
            if (a.hasAgent && !b.hasAgent) return -1;
            if (!a.hasAgent && b.hasAgent) return 1;
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });
          return sortedLeads[0].uuid;
        }
      );

      setSelectedLeads([...uniqueLeadUuids, ...duplicateSelections]);
      setIsMergeModalVisible(true);
    } catch (error: any) {
      console.error("Analysis error:", error);

      if (error?.data?.message) {
        toast.error(`Analysis failed: ${error.data.message}`);
      } else if (error?.status === 404) {
        toast.error("Some selected campaigns were not found");
      } else if (error?.status === 400) {
        toast.error("Invalid campaign selection");
      } else if (error?.status === 500) {
        toast.error("Server error during analysis. Please try again.");
      } else {
        toast.error("Failed to analyze campaigns for merging");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLeadSelection = (leadUuid: string) => {
    setSelectedLeads((prev) =>
      prev.includes(leadUuid)
        ? prev.filter((uuid) => uuid !== leadUuid)
        : [...prev, leadUuid]
    );
  };

  const handleSelectAllInGroup = (group: any) => {
    const groupUuids = group.leads.map((lead: any) => lead.uuid);
    setSelectedLeads((prev) => [
      ...prev,
      ...groupUuids.filter((uuid: string) => !prev.includes(uuid)),
    ]);
  };

  const handleDeselectAllInGroup = (group: any) => {
    const groupUuids = group.leads.map((lead: any) => lead.uuid);
    setSelectedLeads((prev) =>
      prev.filter((uuid) => !groupUuids.includes(uuid))
    );
  };

  const handleSelectAll = () => {
    const allUuids = [
      ...mergeAnalysis.uniqueLeadsDetails.map((lead: any) => lead.uuid),
      ...mergeAnalysis.duplicateDetails.flatMap((group: any) =>
        group.leads.map((lead: any) => lead.uuid)
      ),
    ];
    setSelectedLeads(allUuids);
  };

  const handleDeselectAll = () => {
    setSelectedLeads([]);
  };

  const handleMergeSubmit = async (data: {
    newCampaignName: string;
    type: string;
    status: string;
  }) => {
    try {
      const response = await mergeCampaigns({
        campaignUuids: selectedRowKeys.map((key) => key.toString()),
        newCampaignName: data.newCampaignName,
        type: data.type,
        status: data.status,
        selectedLeads: selectedLeads,
        duplicateResolution: "keep-selected",
      }).unwrap();

      toast.success(response.message);
      setIsMergeModalVisible(false);
      refetch();
      setSelectedRowKeys([]);
      setMergeAnalysis(null);
      setSelectedLeads([]);
    } catch (error: unknown) {
      toast.error(error?.data?.message || "Failed to merge campaigns");
      console.error("Merge error:", error);
    }
  };

  const cancelMerge = () => {
    setIsMergeModalVisible(false);
  };

  const calculateTotalLeads = (): number => {
    if (!tableData || selectedRowKeys.length === 0) return 0;

    return tableData
      .filter((campaign) => selectedRowKeys.includes(campaign.uuid))
      .reduce((total, campaign) => total + (campaign._count?.leads || 0), 0);
  };

  const handleDeleteMultipleClick = () => {
    if (selectedRowKeys.length === 0) {
      toast.error("Please select campaigns to delete.");
      return;
    }
    setIsDeleteModalMultipleVisible(true);
  };

  const handleDeleteConfirmMultiple = async () => {
    try {
      const totalLeads = calculateTotalLeads();
      toast.loading(
        `Deleting ${selectedRowKeys.length} campaigns and ${totalLeads} leads...`,
        {
          id: "delete-multiple-campaigns",
        }
      );

      const response = await deleteMultipleCampaigns({
        campaignUuids: selectedRowKeys.map((key) => key.toString()),
      }).unwrap();

      toast.success(
        response?.message ||
          `Successfully deleted ${selectedRowKeys.length} campaigns and their leads`,
        {
          id: "delete-multiple-campaigns",
        }
      );

      setTableData(
        (prevData) =>
          prevData?.filter((item) => !selectedRowKeys.includes(item.uuid)) || []
      );
      setSelectedRowKeys([]);
      setIsDeleteModalMultipleVisible(false);
    } catch (error: unknown) {
      console.error("Delete multiple error details:", error);

      if (error?.data?.message) {
        toast.error(error.data.message, {
          id: "delete-multiple-campaigns",
        });
      } else {
        toast.error(`Failed to delete campaigns. Something went wrong!`, {
          id: "delete-multiple-campaigns",
        });
      }
    }
  };

  const cancelDeleteMultiple = () => {
    setIsDeleteModalMultipleVisible(false);
  };

  const columns: TableColumnsType<Campaign> = [
    {
      title: "Campaign Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <NavLink
          to={`/dashboard/super-admin/leads/view/${record.uuid}`}
          className={"hover:text-blue-600 cursor-pointer hover:underline"}
        >
          {text}
        </NavLink>
      ),
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search Name"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<FaRegEdit />}
              size="small"
              style={{ width: 90 }}
            >
              Search
            </Button>
            <Button
              onClick={() => clearFilters && clearFilters()}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        const recordValue = String(record.name || "").toLowerCase();
        const filterValue = String(value || "").toLowerCase();
        return recordValue.includes(filterValue);
      },
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text) => formatStringCamelCasecapitalize(text),
      filters: [
        { text: "Active", value: "active" },
        { text: "Inactive", value: "inactive" },
        { text: "Completed", value: "completed" },
      ],
      onFilter: (value, record) => {
        const filterValue = String(value);
        return record.status === filterValue;
      },
    },
    {
      title: "Type",
      dataIndex: "typeOfCampaign",
      key: "type",
      render: (text) => text || "N/A",
      filters: campaignTypes.map((type) => ({ text: type, value: type })),
      onFilter: (value, record) => {
        const filterValue = String(value);
        return record.typeOfCampaign === filterValue;
      },
    },
    {
      title: "Branch",
      dataIndex: "branch",
      key: "branch",
      render: (branch) => branch?.name || "Main Branch",
      filters: isSuperAdmin
        ? [
            { text: "Main Branch", value: null },
            ...(activeBranches?.data?.branchData?.map((b: any) => ({
              text: b.name,
              value: b.id,
            })) || []),
          ]
        : undefined,
      onFilter: (value, record) => {
        if (value === null) return !record.branch;
        return record.branch?.id === value;
      },
    },
    {
      title: "Total Leads",
      dataIndex: "_count",
      key: "totalLeads",
      render: (_count) => _count?.leads || 0,
      sorter: (a, b) => (a._count?.leads || 0) - (b._count?.leads || 0),
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => {
        const date = new Date(text);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;

        return `${year}-${month}-${day}, ${hours}:${minutes} ${ampm}`;
      },
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              hasPermissionForSlug("edit_campaign") && {
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
              hasPermissionForSlug("delete_campaign") && {
                key: "delete",
                label: (
                  <button
                    onClick={() => handleDelete(record.uuid, record.name)}
                    className="flex items-center gap-2 w-full"
                  >
                    <MdDelete /> Delete
                  </button>
                ),
              },
              hasPermissionForSlug("import_leads") && {
                key: "import",
                label: (
                  <button
                    onClick={() => handleImportLeads(record.uuid)}
                    className="flex items-center gap-2 w-full"
                  >
                    <FaUpload /> Import Lead
                  </button>
                ),
              },
              hasPermissionForSlug("view_campaign") && {
                key: "view",
                label: (
                  <NavLink
                    to={`/dashboard/super-admin/leads/view/${record.uuid}`}
                    className="flex items-center gap-2 w-full"
                  >
                    <FaEye /> View Leads
                  </NavLink>
                ),
              },
              hasPermissionForSlug("validation_log") && {
                key: "validation-logs",
                label: (
                  <NavLink
                    to={`/dashboard/super-admin/leads/validation-logs?campaignUuid=${record.uuid}`}
                    className="flex items-center gap-2 w-full"
                  >
                    <FaClipboardList /> View Validation Logs
                  </NavLink>
                ),
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button icon={<BsThreeDotsVertical />} />
        </Dropdown>
      ),
    },
  ];

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();
    const matchesSearch = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );

    const matchesType =
      activeTypeFilter === "all" || record.typeOfCampaign === activeTypeFilter;

    return matchesSearch && matchesType;
  });

  const campaignHasLeads = isImportModalVisible
    ? data?.data?.campaigns?.find((c) => c.uuid === selectedUUID)?._count
        ?.leads > 0
    : false;

  const getTypeCount = (type: string) => {
    if (type === "all") return tableData?.length || 0;
    return (
      tableData?.filter((campaign) => campaign.typeOfCampaign === type)
        .length || 0
    );
  };

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Manage Leads</h1>
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTypeFilter("all")}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                activeTypeFilter === "all" ? "bg-[#0f766e] text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              All Campaigns ({getTypeCount("all")})
            </button>
            {campaignTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveTypeFilter(type)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                  activeTypeFilter === type ? "bg-[#0f766e] text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {type} ({getTypeCount(type)})
              </button>
            ))}
            <button
              onClick={() => setActiveTypeFilter("statistics")}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                activeTypeFilter === "statistics" ? "bg-[#0f766e] text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              📊 Lead Statistics
            </button>
          </div>
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
          {isSuperAdmin && (
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="border border-gray-200 rounded px-2 py-1 text-xs text-gray-600 bg-white outline-none flex-shrink-0" style={{ width: 130 }}
            >
              <option value="all">All Branches</option>
              {activeBranches?.data?.branchData?.map((branch: any) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          )}
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          {hasPermissionForSlug("ai_validation") && (
            <NavLink to={"/dashboard/super-admin/leads/validation-logs"} className="primary-btn whitespace-nowrap">AI Validations</NavLink>
          )}
          {hasPermissionForSlug("all_lead") && (
            <NavLink to={"/dashboard/super-admin/leads/all"} className="primary-btn whitespace-nowrap">All Leads</NavLink>
          )}
          {hasPermissionForSlug("add_campaign") && (
            <button onClick={showModal} className="primary-btn whitespace-nowrap">Add New</button>
          )}
          {selectedRowKeys.length > 0 && (
            <>
            {hasPermissionForSlug("delete_campaign") && (
              <button
                onClick={handleDeleteMultipleClick}
                className="cancel-btn whitespace-nowrap text-sm"
              >
                Delete Selected ({selectedRowKeys.length})
              </button>
            )}

              {hasPermissionForSlug("mearge_campaign") && selectedRowKeys.length >= 2 && (
                <button
                  onClick={handleMergeClick}
                  className="primary-btn whitespace-nowrap text-sm"
                >
                  Merge Campaigns ({selectedRowKeys.length})
                </button>
              )}
            </>
          )}
        </div>


        {activeTypeFilter === "statistics" ? (
          <LeadStatistics />
        ) : isLoading ? (
          <TableLoader />
        ) : (
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredData}
            pagination={{ pageSize: 20 }}
            rowKey="uuid"
          />
        )}
      </div>

      <Modal
        title={isEditMode ? "Edit Campaign" : "Create Campaign"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label>Campaign Name:</label>
            <input
              type="text"
              className="border rounded p-2 w-full"
              {...register("name", { required: "Campaign name is required" })}
            />
            {errors.name && (
              <span className="text-red-500">This field is required</span>
            )}
          </div>

          <div className="mt-3">
            <label>Campaign Type:</label>
            <select
              {...register("type", { required: "Campaign type is required" })}
              onChange={(e) => setValue("type", e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            >
              <option value="">Select Type</option>
              {campaignTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.type && (
              <span className="text-red-500">This field is required</span>
            )}
          </div>

          {isSuperAdmin ? (
            <div className="mt-3">
              <label>Assign to Branch:</label>
              <select
                {...register("branchId")}
                onChange={(e) => setValue("branchId", e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                {activeBranches?.data?.branchData?.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
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

          {!isSuperAdmin && user?.branch && (
            <div className="mt-3">
              <label>Branch:</label>
              <input
                type="text"
                value={user.branch.name}
                disabled
                className="border rounded p-2 w-full bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Campaign will be assigned to your branch automatically
              </p>
            </div>
          )}

          <div className="mt-3">
            <label>Status:</label>
            <select
              {...register("status", { required: true })}
              defaultValue="active"
              onChange={(e) => setValue("status", e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
            </select>
            {errors.status && (
              <span className="text-red-500">This field is required</span>
            )}
          </div>

          <div
            style={{ display: "flex", justifyContent: "center", marginTop: 16 }}
          >
            <Button
              type="primary"
              htmlType="submit"
              style={{ backgroundColor: "#051f1e", borderColor: "#051f1e" }}
            >
              {isEditMode ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        title="Confirm Delete!"
        open={isDeleteModalVisible}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        {selectedCampaignName ? (
          <>
            <p>
              Are you sure you want to delete the campaign{" "}
              <strong>"{selectedCampaignName}"</strong>?
            </p>
            <p className="text-red-500">This action cannot be undone.</p>
          </>
        ) : (
          <p>Loading campaign information...</p>
        )}
      </Modal>

      <Modal
        title="Confirm Delete Selected Campaigns"
        open={isDeleteModalMultipleVisible}
        onOk={handleDeleteConfirmMultiple}
        onCancel={cancelDeleteMultiple}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <div className="space-y-3">
          <p>Are you sure you want to delete the selected campaigns?</p>

          <div className="bg-red-50 p-3 rounded border border-red-200">
            <p className="text-red-800 font-semibold">Warning:</p>
            <p className="text-red-700 text-sm">
              This action will permanently delete {selectedRowKeys.length}{" "}
              campaign(s) and all associated leads. This action cannot be
              undone.
            </p>
          </div>

          {selectedRowKeys.length > 0 && (
            <div className="bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
              <p className="font-semibold mb-2">Selected Campaigns:</p>
              <ul className="list-disc list-inside text-sm">
                {tableData
                  ?.filter((campaign) =>
                    selectedRowKeys.includes(campaign.uuid)
                  )
                  .slice(0, 10)
                  .map((campaign) => (
                    <li key={campaign.uuid}>{campaign.name}</li>
                  ))}
                {selectedRowKeys.length > 10 && (
                  <li className="text-gray-500">
                    ...and {selectedRowKeys.length - 10} more
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        title="Import Leads"
        open={isImportModalVisible}
        onCancel={() => {
          setIsImportModalVisible(false);
          setSelectedFile(null);
          setImportStats(null);
          setFileHeaders([]);
          setSelectedFields([]);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsImportModalVisible(false);
              setSelectedFile(null);
              setImportStats(null);
              setFileHeaders([]);
              setSelectedFields([]);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="import"
            type="primary"
            style={{
              backgroundColor: "#051f1e",
              borderColor: "#051f1e",
              color: "#FFFFFF",
            }}
            onClick={handleImportSubmit}
            disabled={
              !selectedFile ||
              isImporting ||
              (!campaignHasLeads && selectedFields.length === 0)
            }
          >
            {isImporting ? (
              <Spin
                indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
              />
            ) : (
              "Import"
            )}
          </Button>,
        ]}
        width={800}
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Select CSV or Excel File:</label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="w-full"
            />
          </div>

          {fileHeaders.length > 0 && !campaignHasLeads && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Select Fields to Import:</h4>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedFields.length === fileHeaders.length) {
                      setSelectedFields([]);
                    } else {
                      setSelectedFields([...fileHeaders]);
                    }
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {selectedFields.length === fileHeaders.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>

              <div className="border rounded p-4 max-h-[300px] overflow-y-auto bg-gray-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {fileHeaders.map((header) => (
                    <div
                      key={header}
                      className="flex items-center p-2 hover:bg-gray-100 rounded"
                    >
                      <input
                        type="checkbox"
                        id={`field-${header}`}
                        checked={selectedFields.includes(header)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFields([...selectedFields, header]);
                          } else {
                            setSelectedFields(
                              selectedFields.filter((f) => f !== header)
                            );
                          }
                        }}
                        className="mr-2 h-4 w-4 flex-shrink-0 bg-teal-950"
                      />
                      <label
                        htmlFor={`field-${header}`}
                        className="text-sm break-all whitespace-normal"
                        title={header}
                      >
                        {header}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-2 text-sm text-gray-500">
                <p>
                  Selected {selectedFields.length} of {fileHeaders.length}{" "}
                  fields
                </p>
                {selectedFields.length === 0 && (
                  <p className="text-red-500">
                    Please select at least one field to import
                  </p>
                )}
              </div>
            </div>
          )}

          {campaignHasLeads && (
            <div className="mt-4 p-4 bg-yellow-50 rounded text-sm">
              <p className="font-semibold">Note:</p>
              <p>
                This campaign already has leads. The import will use the same
                field structure as existing leads.
              </p>
            </div>
          )}

        </div>
      </Modal>

      <Modal
        title="Export Leads"
        open={isExportModalVisible}
        onCancel={() => setIsExportModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsExportModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="export"
            type="primary"
            style={{ backgroundColor: "#051f1e", borderColor: "#051f1e" }}
            onClick={handleExportSubmit}
            disabled={!exportData}
          >
            Export
          </Button>,
        ]}
      >
        <p>Click Export to download the leads data in CSV format.</p>
      </Modal>

      <Modal
        title={`Merge ${selectedRowKeys.length} Campaigns`}
        open={isMergeModalVisible}
        onCancel={() => {
          cancelMerge();
          setMergeAnalysis(null);
          setSelectedLeads([]);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              cancelMerge();
              setMergeAnalysis(null);
              setSelectedLeads([]);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="merge"
            type="primary"
            style={{ backgroundColor: "#051f1e", borderColor: "#051f1e" }}
            onClick={() => {
              const form = document.getElementById(
                "merge-form"
              ) as HTMLFormElement;
              if (form) {
                const formData = new FormData(form);
                handleMergeSubmit({
                  newCampaignName: formData.get("newCampaignName") as string,
                  type: formData.get("type") as string,
                  status: formData.get("status") as string,
                });
              }
            }}
            disabled={selectedLeads.length === 0}
          >
            Merge ({selectedLeads.length} leads)
          </Button>,
        ]}
        width={900}
      >
        {isAnalyzing ? (
          <div className="text-center py-8">
            <Spin size="large" />
            <p className="mt-4">Analyzing campaigns for duplicates...</p>
          </div>
        ) : mergeAnalysis ? (
          <div className="max-h-[600px] overflow-y-auto">
            <form id="merge-form">
              <div className="mb-4">
                <label className="block mb-2 font-semibold">
                  New Campaign Name:
                </label>
                <input
                  type="text"
                  name="newCampaignName"
                  placeholder="Enter new campaign name"
                  className="border rounded p-2 w-full"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-semibold">
                  Campaign Type:
                </label>
                <select
                  name="type"
                  className="border rounded p-2 w-full"
                  required
                >
                  <option value="">Select Type</option>
                  {campaignTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-semibold">Status:</label>
                <select
                  name="status"
                  defaultValue="active"
                  className="border rounded p-2 w-full"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="mb-4 bg-gray-50 p-3 rounded">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold">Campaigns to be merged:</p>
                  <span className="text-sm text-gray-600">
                    {mergeAnalysis.totalLeads} total leads â€¢{" "}
                    {mergeAnalysis.duplicateGroups} duplicate groups
                  </span>
                </div>
                <ul className="list-disc list-inside">
                  {mergeAnalysis.campaigns.map((campaign: any) => (
                    <li key={campaign.uuid} className="text-sm">
                      {campaign.name} ({campaign.leadCount} leads)
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="font-semibold mb-2 text-sm">Legend:</p>
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <FaUserCheck className="text-green-600" />
                    <span>Agent Assigned</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaUserTimes className="text-gray-400" />
                    <span>No Agent</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                      Recommended
                    </span>
                    <span>Keep this lead (has agent assigned)</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold">
                    Duplicate Leads ({mergeAnalysis.duplicateGroups} groups)
                  </h4>
                  <div className="flex gap-2">
                    <Button size="small" onClick={handleSelectAll}>
                      Select All
                    </Button>
                    <Button size="small" onClick={handleDeselectAll}>
                      Deselect All
                    </Button>
                  </div>
                </div>

                {mergeAnalysis.duplicateDetails.map((group: any) => (
                  <div
                    key={group.groupId}
                    className="mb-4 border rounded-lg p-4 bg-white shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-3 pb-2 border-b">
                      <div className="flex items-center gap-2">
                        <strong className="text-base">
                          Phone: {group.phone}
                        </strong>
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full font-medium">
                          {group.count} duplicates
                        </span>
                        {group.hasAnyAgent && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium flex items-center gap-1">
                            <FaUserCheck /> Has Agent
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="small"
                          onClick={() => handleSelectAllInGroup(group)}
                        >
                          Select All
                        </Button>
                        <Button
                          size="small"
                          onClick={() => handleDeselectAllInGroup(group)}
                        >
                          Deselect All
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {group.leads.map((lead: any, index: number) => (
                        <div
                          key={lead.uuid}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                            selectedLeads.includes(lead.uuid)
                              ? "bg-blue-50 border-blue-300"
                              : "bg-gray-50 border-gray-200"
                          } ${
                            lead.hasAgent && index === 0
                              ? "ring-2 ring-green-300"
                              : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead.uuid)}
                            onChange={() => handleLeadSelection(lead.uuid)}
                            className="h-4 w-4 mt-1 flex-shrink-0"
                          />

                          <div className="flex-shrink-0 mt-1">
                            {lead.hasAgent ? (
                              <FaUserCheck
                                className="text-green-600 text-lg"
                                title="Agent assigned"
                              />
                            ) : (
                              <FaUserTimes
                                className="text-gray-400 text-lg"
                                title="No agent assigned"
                              />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {lead.name}
                              </span>
                              {lead.hasAgent && index === 0 && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {lead.email && <span>ðŸ“§ {lead.email}</span>}
                                <span>ðŸ“± {lead.phone}</span>
                                <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                                  {lead.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>
                                  From: <strong>{lead.sourceCampaign}</strong>
                                </span>
                                <span>â€¢</span>
                                <span>
                                  {new Date(
                                    lead.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              {lead.agent && (
                                <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded inline-block">
                                  <FaUserCheck />
                                  <span>
                                    Agent:{" "}
                                    <strong>
                                      {lead.agent.user?.name || "Unknown"}
                                    </strong>
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {mergeAnalysis.uniqueLeadsDetails.length > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold">
                        Unique Leads ({mergeAnalysis.uniqueLeadsDetails.length})
                      </h4>
                      <span className="text-xs text-gray-600">
                        These leads have unique phone numbers
                      </span>
                    </div>

                    <div className="space-y-2">
                      {mergeAnalysis.uniqueLeadsDetails.map((lead: any) => (
                        <div
                          key={lead.uuid}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                            selectedLeads.includes(lead.uuid)
                              ? "bg-blue-50 border-blue-300"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead.uuid)}
                            onChange={() => handleLeadSelection(lead.uuid)}
                            className="h-4 w-4 mt-1 flex-shrink-0"
                          />

                          <div className="flex-shrink-0 mt-1">
                            {lead.hasAgent ? (
                              <FaUserCheck
                                className="text-green-600 text-lg"
                                title="Agent assigned"
                              />
                            ) : (
                              <FaUserTimes
                                className="text-gray-400 text-lg"
                                title="No agent assigned"
                              />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 mb-1">
                              {lead.name}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {lead.email && <span>ðŸ“§ {lead.email}</span>}
                                <span>ðŸ“± {lead.phone}</span>
                                <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                                  {lead.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>
                                  From: <strong>{lead.sourceCampaign}</strong>
                                </span>
                                <span>â€¢</span>
                                <span>
                                  {new Date(
                                    lead.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              {lead.agent && (
                                <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded inline-block">
                                  <FaUserCheck />
                                  <span>
                                    Agent:{" "}
                                    <strong>
                                      {lead.agent.user?.name || "Unknown"}
                                    </strong>
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default CampaignManagement;
