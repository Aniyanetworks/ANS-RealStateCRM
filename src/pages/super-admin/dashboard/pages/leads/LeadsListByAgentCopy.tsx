/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React, {
  useCallback,
  useEffect,
  useMemo,
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
  Popover,
  Progress,
  Select,
  Space,
  Table,
} from 'antd';
import dayjs from 'dayjs';
import moment from 'moment-timezone';
import {
  Controller,
  useForm,
} from 'react-hook-form';
import toast from 'react-hot-toast';
import { BsThreeDotsVertical } from 'react-icons/bs';
import {
  FaEye,
  FaInfoCircle,
  FaRegEdit,
  FaUser,
} from 'react-icons/fa';
import {
  MdDelete,
  MdEmail,
} from 'react-icons/md';
import { useSelector } from 'react-redux';
import {
  NavLink,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import LeadActivityLog from '../../../../../components/Lead/LeadActivityLog';
import TableLoader from '../../../../../components/loader/TableLoader';
import {
  useGetAgentListDataQuery,
} from '../../../../../redux/api/superadmin/agent/agentManagementSlice';
import {
  useAssignMultipleLeadsToAgentMutation,
  useChangeLeadStatusMutation,
  useChangeMultipleLeadsStatusMutation,
  useCreateLeadMutation,
  useCreateValidationLogsFromLeadsMutation,
  useDeleteLeadMutation,
  useDeleteMultipleLeadsMutation,
  useGetCampaignsQuery,
  useGetLeadsByCampaignQuery,
  useGetRecentActivityQuery,
  useMoveLeadsToCampaignMutation,
  useUpdateLeadMutation,
} from '../../../../../redux/api/superadmin/leadManagementSlice';
import {
  useLeadToClientMutation,
  useSendInvitationMutation,
} from '../../../../../redux/api/superadmin/user/userManageSlice';
import { formatDateYYYYMMDD } from '../../../../../utils/formatDateUtils';
import { usePermissions } from '../../../../../utils/permissionUtils';
import LeadNotes from './LeadNotes';

const { Option } = Select;

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];

// Status options based on campaign type
const BUYER_TENANT_STATUS_OPTIONS = [
  { value: "New", label: "New" },
  { value: "Attempted Contact", label: "Attempted Contact" },
  { value: "Connected", label: "Connected" },
  { value: "Qualified", label: "Qualified" },
  { value: "Active Search", label: "Active Search" },
  { value: "Offer Submitted", label: "Offer Submitted" },
  {
    value: "Under Contract / Conditional",
    label: "Under Contract / Conditional",
  },
  { value: "Closed", label: "Closed" },
  { value: "Lost / Inactive", label: "Lost / Inactive" },
  { value: "Not Qualified", label: "Not Qualified" },
];

const SELLER_LANDLORD_STATUS_OPTIONS = [
  { value: "New", label: "New" },
  { value: "Attempted Contact", label: "Attempted Contact" },
  { value: "Connected", label: "Connected" },
  { value: "Qualified", label: "Qualified" },
  { value: "Appointment Scheduled", label: "Appointment Scheduled" },
  { value: "Active Listing", label: "Active Listing" },
  {
    value: "Under Contract / Conditional",
    label: "Under Contract / Conditional",
  },
  { value: "Closed", label: "Closed" },
  { value: "Lost / Inactive", label: "Lost / Inactive" },
  { value: "Not Qualified", label: "Not Qualified" },
];

interface Lead {
  id: number;
  key?: React.Key;
  uuid: string;
  campaignId: number;
  leadDate?: string;
  platform?: string;
  name?: string;
  phone?: string;
  email?: string;
  agentAssigned?: number | null;
  createdAt: string;
  updatedAt: string;
  status?: string;
  agent?: {
    user: {
      id: number;
      name: string;
    };
  } | null;
  fields?: Array<{
    id: number;
    name: string;
    leadId: number;
  }>;
  rows?: Array<{
    id: number;
    data: Record<string, any>;
    leadId: number;
  }>;
}

interface AgentListItem {
  id: number;
  user: {
    id: number;
    name: string;
  };
  status: string;
}

const LeadsList = () => {
  const { hasPermissionForSlug } = usePermissions();
  const { campaignUuid } = useParams<{ campaignUuid: string }>();
  const [tableData, setTableData] = useState<Lead[]>([]);
  const [campaignData, setCampaignData] = useState<any>(null);
  const { user } = useSelector((state: any) => state.user);
  // const { data, isLoading, refetch } = useGetLeadsByAgentQuery(user?.agentAccount?.[0]?.id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedLeadForNotes, setSelectedLeadForNotes] = useState<Lead | null>(
    null
  );
  const [dynamicColumns, setDynamicColumns] = useState<TableColumnsType<Lead>>(
    []
  );
  const [existingLead, setExistingLead] = useState<Lead | null>(null);
  const [createLead] = useCreateLeadMutation();
  const [updateLead] = useUpdateLeadMutation();
  const [deleteLead] = useDeleteLeadMutation();
  const [deleteMultipleLeads] = useDeleteMultipleLeadsMutation();
  const { data: agentList } = useGetAgentListDataQuery("");
  const [changeLeadStatus] = useChangeLeadStatusMutation();
  const [isDeleteModalVisible, setIsModalVisible] = useState(false);
  const { data, isLoading, refetch } = useGetLeadsByCampaignQuery(campaignUuid);
  // const [searchText, setSearchText] = useState("");
  const [sendInvitation] = useSendInvitationMutation();
  const [leadToClient] = useLeadToClientMutation();
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isChangeStatusModalVisible, setIsChangeStatusModalVisible] =
    useState(false);
  const navigate = useNavigate();
  const [agentFilter, setAgentFilter] = useState<string | null>(null);
  const [agentFilterSearch, setAgentFilterSearch] = useState("");
  const [assignMultipleLeadsToAgent] = useAssignMultipleLeadsToAgentMutation();
  const [changeMultipleLeadsStatus] = useChangeMultipleLeadsStatusMutation();
  const [createValidationLogsFromLeads] =
    useCreateValidationLogsFromLeadsMutation();
  const [campaignFields, setCampaignFields] = useState<string[]>([]);
  const [isSaveValidationLogModalVisible, setIsSaveValidationLogModalVisible] =
    useState(false);
  const [isSavingValidationLog, setIsSavingValidationLog] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearchText = searchParams.get("search") || "";
  const [searchText, setSearchText] = useState(initialSearchText);
  const showModal = () => setIsModalOpen(true);
  const [isActivityLogVisible, setIsActivityLogVisible] = useState(false);
  const [selectedLeadForActivity, setSelectedLeadForActivity] =
    useState<Lead | null>(null);
  const [isMoveModalVisible, setIsMoveModalVisible] = useState(false);
  const [selectedTargetCampaign, setSelectedTargetCampaign] = useState<string | null>(null);
  const [moveProgress, setMoveProgress] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [moveResult, setMoveResult] = useState<{ movedCount: number; totalRequested: number } | null>(null);
  const [moveLeadsToCampaign] = useMoveLeadsToCampaignMutation();
  const { data: campaignsData } = useGetCampaignsQuery("");

  // Fetch recent activity to get last activity dates
  const { data: recentActivityData } = useGetRecentActivityQuery(1000); // Get enough to cover all leads

  // Update URL when search text changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (searchText) {
      params.set("search", searchText);
    } else {
      params.delete("search");
    }
    setSearchParams(params);
  }, [searchText, searchParams, setSearchParams]);

  useEffect(() => {
    if (data?.data?.leads) {
      const leadsWithKeys = data.data.leads.map((lead) => ({
        ...lead,
        key: lead.uuid,
        rows: lead.rows || [{ data: {} }],
      }));
      setTableData(leadsWithKeys);

      // Extract dynamic fields from campaign structure
      if (data.data.campaign?.formStructure) {
        const fields = extractDynamicFields(data.data.campaign.formStructure);
        setCampaignFields(fields);
      } else if (leadsWithKeys.length > 0) {
        // Fallback: extract from first lead if no campaign structure
        const fields = extractDynamicFieldsFromLead(leadsWithKeys[0]);
        setCampaignFields(fields);
      }
    }

    if (data?.data?.campaign) {
      setCampaignData(data.data.campaign);
    }
  }, [data]);

  // Helper function to extract dynamic fields from campaign form structure
  const extractDynamicFields = (formStructure: any): string[] => {
    const fields: string[] = [];

    if (formStructure?.sections) {
      formStructure.sections.forEach((section: any) => {
        if (section.fields) {
          section.fields.forEach((field: any) => {
            if (field.name && !isStandardField(field.name)) {
              fields.push(field.name);
            }
          });
        }
      });
    }

    return fields;
  };

  // Helper function to extract dynamic fields from a lead
  const extractDynamicFieldsFromLead = (lead: Lead): string[] => {
    const fields: string[] = [];
    const standardFields = [
      "name",
      "phone",
      "email",
      "status",
      "agentassigned",
      "leaddate",
      "platform",
    ];

    let rowData = lead.rows?.[0]?.data || {};

    // Handle nested structure
    if (Array.isArray(rowData.rows) && rowData.rows[0]?.data) {
      rowData = rowData.rows[0].data;
    }

    Object.keys(rowData).forEach((fieldName) => {
      const lowerFieldName = fieldName.toLowerCase();
      if (!standardFields.includes(lowerFieldName)) {
        fields.push(fieldName);
      }
    });

    return fields;
  };

  // Check if field is standard
  const isStandardField = (fieldName: string): boolean => {
    const standardFields = [
      "name",
      "phone",
      "email",
      "status",
      "agentassigned",
      "leaddate",
      "platform",
    ];
    return standardFields.includes(fieldName.toLowerCase());
  };
  const {
    register,
    formState: { errors },
    reset,
    handleSubmit,
    setValue,
    control,
  } = useForm<Lead>();

  const resetForm = () => {
    const defaultValues: any = {
      leadDate: "",
      platform: "",
      name: "",
      phone: "",
      email: "",
      status: "New",
      agentAssigned: null,
      customFields: {},
    };

    // Initialize dynamic fields with empty values
    campaignFields.forEach((fieldName) => {
      defaultValues.customFields[fieldName] = "";
    });

    reset(defaultValues);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<Lead> = {
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

  const handleEdit = useCallback(
    (record: Lead) => {
      setExistingLead(record);
      setSelectedUUID(record.uuid);

      const standardValues = {
        leadDate: record.leadDate
          ? moment.utc(record.leadDate).format("YYYY-MM-DD")
          : "",
        platform: record.platform,
        name: record.name,
        phone: record.phone,
        email: record.email,
        status: record.status,
        agentAssigned: record.agentAssigned || null,
      };

      // Extract dynamic fields deeply from rows structure
      let dynamicData = record.rows?.[0]?.data || {};

      // If nested rows exist, dig deeper
      if (
        Array.isArray(dynamicData.rows) &&
        dynamicData.rows.length > 0 &&
        dynamicData.rows[0].data
      ) {
        dynamicData = dynamicData.rows[0].data;
      }

      const dynamicValues: Record<string, any> = {};
      Object.entries(dynamicData).forEach(([key, value]) => {
        if (
          ![
            "name",
            "phone",
            "email",
            "status",
            "agentassigned",
            "leaddate",
            "platform",
          ].includes(key.toLowerCase())
        ) {
          dynamicValues[`customFields.${key}`] = value;
        }
      });

      reset({
        ...standardValues,
        ...dynamicValues,
      });

      setIsModalOpen(true);
    },
    [reset]
  );

  const handleAgentAssignment = async (value: any, record: any) => {
    // Preserve existing dynamic fields
    let existingRowData = record.rows?.[0]?.data || {};
    if (Array.isArray(existingRowData.rows) && existingRowData.rows[0]?.data) {
      existingRowData = existingRowData.rows[0].data;
    }

    // âœ… Include static fields from record
    const updateData = {
      agentAssigned: value,
      leadDate: new Date().toISOString(),
      name: record.name, // âœ… keep existing name
      phone: record.phone, // âœ… keep existing phone
      email: record.email, // âœ… keep existing email
      platform: record.platform, // if you need
      status: record.status, // if you need
      rows: [
        {
          id: record.rows?.[0]?.id,
          data: existingRowData,
        },
      ],
    };

    try {
      await updateLead({
        uuid: record.uuid,
        data: updateData,
      }).unwrap();

      toast.success("Agent assigned successfully");
      const updatedData = await refetch();
      if (updatedData.data?.data?.leads) {
        const leadsWithKeys = updatedData.data.data.leads.map((lead) => ({
          ...lead,
          key: lead.uuid,
          rows: lead.rows || [{ data: {} }],
        }));
        setTableData(leadsWithKeys);
        generateDynamicColumns(leadsWithKeys[0]);
      }
    } catch (error) {
      toast.error("Failed to assign agent");
      console.error("Update error:", error);
    }
  };

  const generateDynamicColumns = useCallback(
    (sampleLead: any) => {
      if (!sampleLead) {
        setDynamicColumns([]);
        return;
      }

      // âœ… Get all unique dynamic fields from ALL leads, not just the first one
      const allDynamicFields = new Set<string>();

      tableData.forEach((lead) => {
        let rowData = lead.rows?.[0]?.data || {};

        // Handle nested structure
        if (Array.isArray(rowData.rows) && rowData.rows[0]?.data) {
          rowData = rowData.rows[0].data;
        }

        // Collect all dynamic field names
        Object.keys(rowData).forEach((fieldName) => {
          const lower = fieldName.toLowerCase();
          if (
            ![
              "leadDate",
              "platform",
              "status",
              "agentAssigned",
              "rows",
              "name",
              "phone",
              "email",
            ].includes(lower)
          ) {
            allDynamicFields.add(fieldName);
          }
        });
      });

      // Convert Set to Array for mapping
      const dynamicFieldNames = Array.from(allDynamicFields);

      // Generate dynamic columns
      const dynamicCols = dynamicFieldNames.map((fieldName) => ({
        title: fieldName,
        dataIndex: fieldName,
        key: fieldName,
        render: (_: any, record: any) => {
          let rowData = record.rows?.[0]?.data || {};
          if (Array.isArray(rowData.rows) && rowData.rows[0]?.data) {
            rowData = rowData.rows[0].data;
          }
          let value = rowData[fieldName];
          if (typeof value === "object" && value !== null) {
            try {
              value = JSON.stringify(value);
            } catch {
              value = "[object]";
            }
          }
          return value ?? "-";
        },
        sorter: (a: any, b: any) => {
          const getValue = (rec: any) => {
            let rd = rec.rows?.[0]?.data || {};
            if (Array.isArray(rd.rows) && rd.rows[0]?.data) {
              rd = rd.rows[0].data;
            }
            return rd[fieldName] || "";
          };
          return String(getValue(a)).localeCompare(String(getValue(b)));
        },
        filterDropdown: ({
          setSelectedKeys,
          selectedKeys,
          confirm,
          clearFilters,
        }: any) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder={`Search ${fieldName}`}
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
        onFilter: (value: any, record: any) => {
          let rowData = record.rows?.[0]?.data || {};
          if (Array.isArray(rowData.rows) && rowData.rows[0]?.data) {
            rowData = rowData.rows[0].data;
          }
          const fieldValue = String(rowData[fieldName] || "").toLowerCase();
          return fieldValue.includes(String(value).toLowerCase());
        },
      }));

      // --- 4ï¸âƒ£ Fixed columns (Lead Date, Agent, Status, Action) ---
      const fixedCols = [
        {
          title: "Lead Assign Date",
          dataIndex: "leadDate",
          key: "leadDate",
          fixed: true,
          render: (text: any) => formatDateYYYYMMDD(text),
          filterDropdown: ({
            setSelectedKeys,
            selectedKeys,
            confirm,
            clearFilters,
          }: any) => (
            <div style={{ padding: 8 }}>
              <Input
                placeholder="Search Lead Assign Date"
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
          onFilter: (value: any, record: any) => {
            const recordValue = String(record.leadDate || "").toLowerCase();
            const filterValue = String(value || "").toLowerCase();
            return recordValue.includes(filterValue);
          },
          sorter: (a: any, b: any) =>
            (a.leadDate || "").localeCompare(b.leadDate || ""),
        },
        {
          title: "Last Activity",
          key: "lastActivity",
          fixed: true,
          width: 180,
          render: (_: any, record: any) => {
            const lastActivity = getLastActivity(record.id);

            if (!lastActivity) {
              return (
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "12px", color: "#00000073" }}>
                    No activity
                  </span>
                </div>
              );
            }

            const actionColor = getActionColor(lastActivity.action);
            const actionText = lastActivity.action
              .replace("_", " ")
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");

            return (
              <div
                onClick={() => handleViewActivityLog(record)}
                style={{
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "4px",
                  transition: "background-color 0.2s",
                  fontSize: "12px",
                }}
                className="hover:bg-gray-100"
              >
                <span style={{ color: "#1890ff", fontWeight: 500 }}>
                  {dayjs(lastActivity.createdAt).format("YYYY-MM-DD")}
                </span>
                <span style={{ margin: "0 6px", color: "#888" }}>â†’</span>
                <span style={{ color: actionColor, fontWeight: 500 }}>
                  {actionText}
                </span>
              </div>
            );
          },
          sorter: (a: any, b: any) => {
            const activityA = getLastActivity(a.id);
            const activityB = getLastActivity(b.id);

            if (!activityA && !activityB) return 0;
            if (!activityA) return 1;
            if (!activityB) return -1;

            return (
              new Date(activityB.createdAt).getTime() -
              new Date(activityA.createdAt).getTime()
            );
          },
          filterDropdown: ({
            setSelectedKeys,
            selectedKeys,
            confirm,
            clearFilters,
          }: any) => (
            <div style={{ padding: 8 }}>
              <div style={{ marginBottom: 8 }}>
                <Button
                  type="primary"
                  onClick={() => {
                    setSelectedKeys(["has_activity"]);
                    confirm();
                  }}
                  size="small"
                  block
                >
                  Has Activity
                </Button>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Button
                  onClick={() => {
                    setSelectedKeys(["no_activity"]);
                    confirm();
                  }}
                  size="small"
                  block
                >
                  No Activity
                </Button>
              </div>
              <Button
                onClick={() => {
                  clearFilters && clearFilters();
                  setSelectedKeys([]);
                  confirm();
                }}
                size="small"
                block
              >
                Reset
              </Button>
            </div>
          ),
          onFilter: (value: any, record: any) => {
            const lastActivity = getLastActivity(record.id);
            if (value === "has_activity") {
              return lastActivity !== null;
            }
            if (value === "no_activity") {
              return lastActivity === null;
            }
            return true;
          },
        },
        {
          title: "Agent Assigned",
          key: "agentAssigned",
          render: (text, record) => (
            <Select
              defaultValue={record.agentAssigned || undefined}
              style={{ width: "100%" }}
              placeholder="Select Agent"
              allowClear
              showSearch
              optionFilterProp="children"
              // âœ… Use your reusable function instead of inline update
              onChange={(value) => handleAgentAssignment(value, record)}
              filterOption={(input, option) =>
                (option?.children ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {agentList?.data?.userData
                ?.filter((agent) => agent.status === "approved")
                .map((agent) => (
                  <Option key={agent.id} value={agent.id}>
                    {agent?.user?.name}
                  </Option>
                ))}
            </Select>
          ),

          // --- your existing filterDropdown, onFilter, sorter remain unchanged ---
          filterDropdown: ({
            setSelectedKeys,
            selectedKeys,
            confirm,
            clearFilters,
          }) => {
            const filteredAgents =
              agentList?.data?.userData
                ?.filter((agent) => agent.status === "approved")
                ?.filter((agent) =>
                  agent.user?.name
                    ?.toLowerCase()
                    .includes(agentFilterSearch.toLowerCase())
                ) || [];

            return (
              <div style={{ maxWidth: 150 }}>
                <div
                  style={{ maxHeight: 300, overflowY: "auto" }}
                  className="text-left"
                >
                  {filteredAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="p-1 text-xs hover:text-gray-500"
                      style={{
                        cursor: "pointer",
                        backgroundColor: selectedKeys.includes(agent.id)
                          ? "#e6f7ff"
                          : "transparent",
                      }}
                      onClick={() => {
                        const newSelectedKeys = selectedKeys.includes(agent.id)
                          ? selectedKeys.filter((key) => key !== agent.id)
                          : [...selectedKeys, agent.id];
                        setSelectedKeys(newSelectedKeys);
                      }}
                    >
                      {agent.user?.name}
                    </div>
                  ))}
                </div>
                <Space
                  style={{ marginTop: 8 }}
                  className="w-full flex justify-evenly"
                >
                  <Button
                    onClick={() => {
                      clearFilters?.();
                      setSelectedKeys([]);
                      setAgentFilterSearch("");
                      confirm();
                    }}
                    size="small"
                  >
                    Reset
                  </Button>
                  <Button type="primary" onClick={() => confirm()} size="small">
                    OK
                  </Button>
                </Space>
              </div>
            );
          },

          onFilter: (value, record) => {
            if (!value) return true;
            const values = Array.isArray(value) ? value : [value];
            return values.includes(record.agentAssigned);
          },

          sorter: (a, b) => {
            const agentA = agentList?.data?.userData?.find(
              (agent) => agent.id === a.agentAssigned
            );
            const agentB = agentList?.data?.userData?.find(
              (agent) => agent.id === b.agentAssigned
            );
            const nameA = agentA?.user?.name || "";
            const nameB = agentB?.user?.name || "";
            return nameA.localeCompare(nameB);
          },
        },
        {
          title: (
            <span className="flex">
              Status
              <Popover
                content={
                  <div
                    className="text-xs"
                    style={{
                      maxWidth: 450,
                      maxHeight: 400,
                      overflowY: "auto",
                      fontSize: "10px",
                    }}
                  >
                    <div>
                      <strong>Buyer & Tenant Leads</strong>
                    </div>
                    <div>
                      New â€“ Lead just received or assigned, no contact made yet.
                    </div>
                    <div>
                      Attempted Contact â€“ Agent tried reaching out (call, text,
                      email), waiting for response.
                    </div>
                    <div>
                      Connected â€“ Two-way communication established; initial
                      conversation done.
                    </div>
                    <div>
                      Qualified â€“ Lead's needs, budget, and timeline confirmed.
                      Actively looking.
                    </div>
                    <div>
                      Active Search â€“ Actively viewing or shortlisting
                      properties.
                    </div>
                    <div>
                      Offer Submitted â€“ Offer sent or application submitted (for
                      tenants).
                    </div>
                    <div>
                      Under Contract / Conditional â€“ Offer accepted, pending
                      conditions or lease finalization.
                    </div>
                    <div>
                      Closed â€“ Deal done. Lease signed or purchase completed.
                    </div>
                    <div>
                      Lost / Inactive â€“ Lead went silent, changed plans, or
                      worked with another agent.
                    </div>
                    <div>
                      Not Qualified â€“ Doesn't meet basic requirements
                      (unrealistic budget, poor credit, incomplete info).
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <strong>Seller & Landlord Leads</strong>
                    </div>
                    <div>
                      New â€“ Lead just received or assigned, no contact made yet.
                    </div>
                    <div>
                      Attempted Contact â€“ Outreach made, waiting for response.
                    </div>
                    <div>
                      Connected â€“ Spoke with the client, confirmed property
                      interest.
                    </div>
                    <div>
                      Qualified â€“ Motivation, timing, and property details
                      verified. Lead is worth pursuing.
                    </div>
                    <div>
                      Appointment Scheduled â€“ Listing presentation or property
                      visit booked.
                    </div>
                    <div>
                      Active Listing â€“ Listing agreement signed, property on the
                      market.
                    </div>
                    <div>
                      Under Contract / Conditional â€“ Offer accepted, pending
                      conditions or lease finalization.
                    </div>
                    <div>Closed â€“ Sale or lease completed.</div>
                    <div>
                      Lost / Inactive â€“ Client chose another agent, withdrew
                      property, or unresponsive.
                    </div>
                    <div>
                      Not Qualified â€“ Not ready to list, unrealistic
                      expectations, or outside target area.
                    </div>
                  </div>
                }
                placement="top"
                trigger="hover"
              >
                <FaInfoCircle
                  style={{
                    marginLeft: 8,
                    color: "#1890ff",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                />
              </Popover>
            </span>
          ),
          dataIndex: "status",
          key: "status",
          width: 200,
          render: (text: any, record: any) => {
            // Determine which status options to show based on campaign type
            const statusOptions =
              campaignData?.typeOfCampaign === "Seller" ||
              campaignData?.typeOfCampaign === "Landlord"
                ? SELLER_LANDLORD_STATUS_OPTIONS
                : BUYER_TENANT_STATUS_OPTIONS;

            return (
              <Select
                defaultValue={record.status || "New"}
                style={{ width: "100%" }}
                onChange={(value) => {
                  changeLeadStatus({
                    uuid: record.uuid,
                    data: { status: value },
                  })
                    .unwrap()
                    .then((response: any) => {
                      if (response.status) {
                        toast.success(response.message);
                        refetch();
                      } else {
                        toast.error(response.message);
                      }
                    })
                    .catch((error: any) => {
                      toast.error("Failed to update status");
                      console.error("Status update error:", error);
                    });
                }}
              >
                {statusOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            );
          },
          filters: [
            { text: "New", value: "New" },
            { text: "Attempted Contact", value: "Attempted Contact" },
            { text: "Connected", value: "Connected" },
            { text: "Qualified", value: "Qualified" },
            { text: "Active Search", value: "Active Search" },
            { text: "Offer Submitted", value: "Offer Submitted" },
            { text: "Appointment Scheduled", value: "Appointment Scheduled" },
            { text: "Active Listing", value: "Active Listing" },
            {
              text: "Under Contract / Conditional",
              value: "Under Contract / Conditional",
            },
            { text: "Closed", value: "Closed" },
            { text: "Lost / Inactive", value: "Lost / Inactive" },
            { text: "Not Qualified", value: "Not Qualified" },
          ],
          onFilter: (value: any, record: any) => record.status === value,
          sorter: (a: any, b: any) =>
            (a.status || "").localeCompare(b.status || ""),
        },
        {
          title: "Action",
          key: "action",
          render: (_: any, record: any) => (
            <Dropdown
              menu={{
                items: [
                hasPermissionForSlug("view_lead") && {
                    key: "details",
                    label: (
                      <button
                        onClick={() => handleNotesClick(record)}
                        className="flex items-center gap-2 w-full"
                      >
                        <FaEye /> View Details
                      </button>
                    ),
                  },
                  hasPermissionForSlug("edit_lead") && {
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
                  hasPermissionForSlug("delete_lead") && {
                    key: "delete",
                    label: (
                      <button
                        onClick={() => handleDelete(record.uuid)}
                        className="flex items-center gap-2 w-full"
                      >
                        <MdDelete /> Delete
                      </button>
                    ),
                  },
                  hasPermissionForSlug("convert_to_client") && {
                    key: "transfer",
                    label: (
                      <button
                        onClick={() => handleLeadToClient(record.uuid)}
                        className="flex items-center gap-2 w-full"
                      >
                        <FaUser /> Convert to Client
                      </button>
                    ),
                  },
                  hasPermissionForSlug("send_invitation") && {
                    key: "mail",
                    label: (
                      <button
                        onClick={() =>
                          handleClientInvitation(
                            record.email,
                            record.agentAssigned
                          )
                        }
                        className="flex items-center gap-2 w-full"
                      >
                        <MdEmail /> Send Invitation
                      </button>
                    ),
                  },
                ],
              }}
              trigger={["click"]}
            >
              <Button icon={<BsThreeDotsVertical />} />
            </Dropdown>
          ),
          fixed: "right",
          width: 50,
          align: "center",
        },
      ];

      // --- 5ï¸âƒ£ Set final columns (dynamic first, then fixed) ---
      setDynamicColumns([...dynamicCols, ...fixedCols]);
    },
    [tableData, agentList]
  );

  // Add this helper function
  const getActionColor = (action: string) => {
    switch (action) {
      case "created":
        return "green";
      case "status_changed":
        return "blue";
      case "updated":
        return "orange";
      case "assigned":
        return "cyan";
      case "unassigned":
        return "red";
      case "validation_log_created":
        return "purple";
      default:
        return "default";
    }
  };
  // Base columns that don't depend on dynamic fields
  const baseColumns = useMemo<TableColumnsType<Lead>>(() => {
    const allColumns = [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
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
        onFilter: (value, record) =>
          record.name?.toLowerCase().includes(value.toLowerCase()),
        sorter: (a, b) => a.name?.localeCompare(b.name || "") || 0,
        render: (text, record) => (
          <span
            className="hover:text-blue-600 cursor-pointer hover:underline"
            onClick={() => handleNotesClick(record)}
          >
            {text}
          </span>
        ),
      },
      {
        title: "Phone",
        dataIndex: "phone",
        key: "phone",
        filterDropdown: ({
          setSelectedKeys,
          selectedKeys,
          confirm,
          clearFilters,
        }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder={`Search Phone`}
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
          const recordValue = String(record.phone || "").toLowerCase();
          const filterValue = String(value || "").toLowerCase();
          return recordValue.includes(filterValue);
        },
        sorter: (a, b) => a.phone?.localeCompare(b.phone || "") || 0,
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
        filterDropdown: ({
          setSelectedKeys,
          selectedKeys,
          confirm,
          clearFilters,
        }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder={`Search Email`}
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
          const recordValue = String(record.email || "").toLowerCase();
          const filterValue = String(value || "").toLowerCase();
          return recordValue.includes(filterValue);
        },
        sorter: (a, b) => a.email?.localeCompare(b.email || "") || 0,
      },
      {
        title: "Platform",
        dataIndex: "platform",
        key: "platform",
        filterDropdown: ({
          setSelectedKeys,
          selectedKeys,
          confirm,
          clearFilters,
        }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="Search Platform"
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
          const recordValue = String(record.platform || "").toLowerCase();
          const filterValue = String(value || "").toLowerCase();
          return recordValue.includes(filterValue);
        },
        sorter: (a, b) => (a.platform || "").localeCompare(b.platform || ""),
      },
    ];

    // Safely check if data exists and is an array
    // const hasLeadDate = Array.isArray(data) && data.some(record => record.leadDate != null);
    // const hasPlatform = Array.isArray(data) && data.some(record => record.platform != null);

    return allColumns.filter((column) => {
      if (column.key === "platform") {
        return (
          Array.isArray(data) && data.some((record) => record.platform != null)
        );
      }
      return true; // Always show mandatory columns (name, phone, email, leadDate)
    });
  }, [user.userType, changeLeadStatus, refetch, handleEdit, data]);

  // Combine base columns with dynamic columns
  const columns = useMemo(() => {
    return [...baseColumns, ...dynamicColumns];
  }, [baseColumns, dynamicColumns]);

  useEffect(() => {
    if (tableData.length > 0) {
      generateDynamicColumns(tableData[0]);
    }
  }, [tableData, generateDynamicColumns]);

  // ... (keep all your existing handler functions)
  const handleNotesClick = (record: Lead) => {
    // Flatten the data structure before passing to the modal
    let flatData = record.rows?.[0]?.data || {};

    if (Array.isArray(flatData.rows) && flatData.rows[0]?.data) {
      flatData = flatData.rows[0].data;
    }

    setSelectedLeadForNotes({
      ...record,
      flatData, // Add the flattened data to the record
    });
    setIsNotesModalOpen(true);
  };
  const handleMultipleStatusChange = async (status: string) => {
    try {
      setIsAssigning(true);
      const response = await changeMultipleLeadsStatus({
        uuids: selectedRowKeys,
        status,
      }).unwrap();

      if (response.status) {
        toast.success(response.message);
        await refetch();
        setSelectedRowKeys([]);
        setIsChangeStatusModalVisible(false);
        window.location.reload();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Failed to change status for selected leads");
      console.error("Status Change error:", error);
    } finally {
      setIsAssigning(false);
    }
  };
  // Add this function before the generateDynamicColumns function
  const getLastActivity = useCallback(
    (leadId: number) => {
      if (!recentActivityData?.data?.logs) return null;

      const leadActivities = recentActivityData.data.logs.filter(
        (log: any) => log.lead?.id === leadId
      );

      if (leadActivities.length === 0) return null;

      // Activities are already sorted by createdAt desc (latest first)
      return leadActivities[0];
    },
    [recentActivityData]
  );

  const handleViewActivityLog = (record: Lead) => {
    setSelectedLeadForActivity(record);
    setIsActivityLogVisible(true);
  };

  const handleActivityLogClose = () => {
    setIsActivityLogVisible(false);
    setSelectedLeadForActivity(null);
  };

  const handleAssignMultipleClick = () => {
    if (selectedRowKeys.length === 0) {
      toast.error("Please select leads to assign.");
      return;
    }
    setIsAssignModalVisible(true);
  };

  const handleStatusMultipleClick = () => {
    if (selectedRowKeys.length === 0) {
      toast.error("Please select leads to change status.");
      return;
    }
    setIsChangeStatusModalVisible(true);
  };

  const handleSaveValidationLogClick = () => {
    if (selectedRowKeys.length === 0) {
      toast.error("Please select leads to save to validation log.");
      return;
    }
    setIsSaveValidationLogModalVisible(true);
  };

  const handleMoveLeadsClick = () => {
    if (selectedRowKeys.length === 0) {
      toast.error("Please select leads to move.");
      return;
    }
    setSelectedTargetCampaign(null);
    setMoveProgress(0);
    setMoveResult(null);
    setIsMoveModalVisible(true);
  };

  const handleMoveConfirm = async () => {
    if (!selectedTargetCampaign) {
      toast.error("Please select a target campaign.");
      return;
    }

    if (selectedTargetCampaign === campaignUuid) {
      toast.error("Cannot move leads to the same campaign.");
      return;
    }

    try {
      setIsMoving(true);
      setMoveProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setMoveProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await moveLeadsToCampaign({
        leadUuids: selectedRowKeys as string[],
        targetCampaignUuid: selectedTargetCampaign,
      }).unwrap();

      clearInterval(progressInterval);
      setMoveProgress(100);

      if (response.status) {
        setMoveResult({
          movedCount: response.data.movedCount,
          totalRequested: response.data.totalRequested,
        });
        toast.success(response.message);
        
        // Wait a moment to show completion, then close and refetch
        setTimeout(async () => {
          await refetch();
          setIsMoveModalVisible(false);
          setSelectedRowKeys([]);
          setMoveProgress(0);
          setMoveResult(null);
          setSelectedTargetCampaign(null);
        }, 2000);
      } else {
        toast.error(response.message || "Failed to move leads");
        setIsMoving(false);
        setMoveProgress(0);
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to move leads");
      setIsMoving(false);
      setMoveProgress(0);
    }
  };

  const handleMoveCancel = () => {
    if (!isMoving) {
      setIsMoveModalVisible(false);
      setSelectedTargetCampaign(null);
      setMoveProgress(0);
      setMoveResult(null);
    }
  };

  const handleSaveValidationLogConfirm = async () => {
    try {
      setIsSavingValidationLog(true);
      const response = await createValidationLogsFromLeads({
        uuids: selectedRowKeys,
      }).unwrap();

      if (response.status) {
        toast.success(
          response.message || "Leads saved to validation log successfully"
        );
        setSelectedRowKeys([]);
        setIsSaveValidationLogModalVisible(false);
      } else {
        toast.error(
          response.message || "Failed to save leads to validation log"
        );
      }
    } catch (error: any) {
      toast.error(
        error?.data?.message || "Failed to save leads to validation log"
      );
      console.error("Save validation log error:", error);
    } finally {
      setIsSavingValidationLog(false);
    }
  };

  const handleAssignConfirm = async (agentId: number) => {
    try {
      setIsAssigning(true);
      const response = await assignMultipleLeadsToAgent({
        uuids: selectedRowKeys,
        agentId,
      }).unwrap();

      if (response.status) {
        toast.success(response.message);
        // Ensure dates are properly handled in the refetch
        const updatedData = await refetch();
        // Explicitly handle dates in the updated data
        setTableData(
          updatedData.data?.data?.leads.map((lead) => ({
            ...lead,
            leadDate: lead.leadDate ? moment.utc(lead.leadDate).format() : null,
            createdAt: lead.createdAt
              ? moment.utc(lead.createdAt).format()
              : null,
          }))
        );
        setSelectedRowKeys([]);
        setIsAssignModalVisible(false);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Failed to assign leads");
      console.error("Assignment error:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleNotesClose = () => {
    setIsNotesModalOpen(false);
    setSelectedLeadForNotes(null);
  };

  const handleDelete = (uuid: string) => {
    setSelectedUUID(uuid);
    setIsModalVisible(true);
  };

  const cancelDelete = () => {
    setIsModalVisible(false);
    setSelectedUUID(null);
    setIsDeleteModalMultipleVisible(false);
  };

  const handleLeadToClient = async (uuid: string) => {
    try {
      if (uuid) {
        // Update lead
        await leadToClient({ data: { uuid }, uuid }).unwrap();
        toast.success(`Lead Successfully converted to Client`);
        navigate("/dashboard/clients/client-list");
      }
    } catch (error: unknown) {
      toast.error("Operation failed. Something went wrong!");
      console.error("Operation error:", error);
    }
  };

  const handleClientInvitation = async (email, agentId) => {
    if (user.userType === "agent") {
      agentId = user.agentAccount[0].agentAccountId;
    }

    const agent = agentList.data.userData.find((agent) => agent.id === agentId);
    const agentAcc = agent.agentAccountId;
    const data = {
      email,
      agentId: agentAcc,
    };
    // alert(data.agentId)
    console.log("data for inviting client:-----------", data);
    try {
      const res = await sendInvitation({
        data,
      });
      if (res.status === true) {
        toast.success("Email Invitation sent successfully!");
      }
    } catch (error: any) {
      toast.error("Invitation failed. Something went wrong!");
      console.error("Error:", error);
    }
  };

  const handleDeleteMultipleClick = () => {
    if (selectedRowKeys.length === 0) {
      toast.error("Please select leads to delete.");
      return;
    }
    setIsDeleteModalMultipleVisible(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await deleteLead(selectedUUID).unwrap();
      toast.success(`${response?.message}`);
      refetch(); // Refetch leads after deletion
    } catch (error) {
      toast.error("Delete failed. Something went wrong!");
      console.error("Delete error:", error);
    }
    setIsModalVisible(false);
    setSelectedUUID(null);
  };

  const handleDeleteConfirmMultiple = async () => {
    try {
      const response = await deleteMultipleLeads(selectedRowKeys).unwrap();
      toast.success(`${response?.message}`);
      refetch(); // Refetch data to update the table
      setSelectedRowKeys([]); // Clear selected rows
    } catch (error) {
      toast.error("Delete failed. Something went wrong!");
      console.error("Delete error:", error);
    }
    setIsDeleteModalMultipleVisible(false);
  };

  const onSubmit = async (formData) => {
    const {
      leadDate,
      platform,
      name,
      phone,
      email,
      status,
      agentAssigned,
      customFields,
    } = formData;

    // Prepare dynamic fields data
    const dynamicData: Record<string, any> = {};

    if (existingLead) {
      // For edit mode: preserve ALL existing dynamic fields first
      let existingRowData = existingLead.rows?.[0]?.data || {};

      // Handle nested structure if it exists
      if (
        Array.isArray(existingRowData.rows) &&
        existingRowData.rows[0]?.data
      ) {
        existingRowData = existingRowData.rows[0].data;
      }

      // Copy all existing dynamic fields (non-standard fields)
      Object.keys(existingRowData).forEach((key) => {
        if (!isStandardField(key)) {
          dynamicData[key] = existingRowData[key];
        }
      });

      // Then update with new values from the form
      if (customFields) {
        Object.entries(customFields).forEach(([key, value]) => {
          dynamicData[key] = value;
        });
      }
    } else {
      // For create mode: just use the customFields from form
      if (customFields) {
        Object.entries(customFields).forEach(([key, value]) => {
          dynamicData[key] = value;
        });
      }
    }

    const payload = {
      leadDate,
      platform,
      name,
      phone,
      email,
      status,
      agentAssigned,
      rows: [
        {
          id: existingLead?.rows?.[0]?.id || undefined,
          data: dynamicData,
        },
      ],
    };

    try {
      if (selectedUUID) {
        // Update existing lead
        await updateLead({ uuid: selectedUUID, data: payload }).unwrap();
        toast.success("Lead updated successfully");
      } else {
        // Create new lead
        await createLead({
          campaignUuid,
          data: payload,
        }).unwrap();
        toast.success("Lead created successfully");
      }

      await refetch();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error(
        selectedUUID ? "Failed to update lead" : "Failed to create lead"
      );
    }
  };

  const handleCancel = () => {
    reset();
    setIsModalOpen(false);
    setSelectedUUID(null);
    setExistingLead(null);
  };
  const filteredData = useMemo(() => {
    if (!tableData || !agentList?.data?.userData) return [];

    return tableData.filter((record) => {
      const searchTerm = searchText.toLowerCase();
      const fieldValues = record.rows?.[0]?.data || {};

      // Get agent name by ID
      const agent = agentList.data.userData.find(
        (a) => String(a.id) === String(record.agentAssigned)
      );
      const agentName = agent?.user?.name?.toLowerCase() || "";

      // Apply agent filter
      if (agentFilter) {
        if (String(record.agentAssigned) !== String(agentFilter)) {
          return false;
        }
      }

      // Then check search term
      if (searchTerm) {
        // Check standard fields
        const matchesStandardFields =
          record.name?.toLowerCase().includes(searchTerm) ||
          record.phone?.toLowerCase().includes(searchTerm) ||
          record.email?.toLowerCase().includes(searchTerm) ||
          agentName.includes(searchTerm) || // now searching by agent's name
          record.status?.toLowerCase().includes(searchTerm);

        // Check dynamic fields
        const matchesDynamicFields = Object.values(fieldValues).some((value) =>
          String(value).toLowerCase().includes(searchTerm)
        );

        if (!matchesStandardFields && !matchesDynamicFields) {
          return false;
        }
      }

      return true;
    });
  }, [tableData, searchText, agentFilter, agentList]);

  return (
    <div>
      {/* Header and search section */}
      <div className="mb-5 p-1">
        <div className="flex flex-col xl:flex-row xl:items-center xl:gap-6 gap-3">
          {/* Main heading */}
          <div className="flex-1 mb-3 xl:mb-0">
            <h1 className="text-center xl:text-left mb-1 xl:mb-0">
              Leads List for Campaign: {campaignData?.name}
            </h1>
          </div>
          {/* Search and Controls */}
          <div className="flex flex-col xl:flex-row xl:items-center gap-3 w-full xl:w-auto">
            {/* Search input */}
            <div className="w-full xl:w-64 flex-shrink-0">
              <input
                type="text"
                placeholder="Search from table..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="global-search w-full"
              />
            </div>
            {/* Action buttons */}
            <div className="flex flex-wrap xl:flex-nowrap gap-2 justify-start xl:justify-end w-full xl:w-auto">
              {selectedRowKeys.length <= 0 && (
                <>
                  {hasPermissionForSlug("view_campaign") && (
                    <NavLink
                      to="/dashboard/super-admin/leads"
                      className="primary-btn flex items-center gap-2 mb-2 xl:mb-0"
                    >
                      Go Back
                    </NavLink>
                  )}
                  {hasPermissionForSlug("add_lead") && (
                    <button
                      onClick={showModal}
                      className="primary-btn flex items-center gap-2 mb-2 xl:mb-0"
                    >
                      Add New
                    </button>
                  )}
                </>
              )}

              {selectedRowKeys.length > 0 && (
                <>
                  {hasPermissionForSlug("view_campaign") && (
                    <NavLink
                      to="/dashboard/super-admin/leads"
                      className="primary-btn flex items-center gap-2 mb-2 xl:mb-0"
                    >
                      Go Back
                    </NavLink>
                  )}
                  <button
                    onClick={handleMoveLeadsClick}
                    className="primary-btn flex items-center gap-2 mb-2 xl:mb-0"
                  >
                    Move Lead
                    {selectedRowKeys.length > 0
                      ? ` (${selectedRowKeys.length})`
                      : ""}
                  </button>
                  <button
                    onClick={handleAssignMultipleClick}
                    className="primary-btn flex items-center gap-2 mb-2 xl:mb-0"
                  >
                    Assign Selected
                    {selectedRowKeys.length > 0
                      ? ` (${selectedRowKeys.length})`
                      : ""}
                  </button>
                  <button
                    onClick={handleStatusMultipleClick}
                    className="primary-btn flex items-center gap-2 mb-2 xl:mb-0"
                  >
                    Change Status
                    {selectedRowKeys.length > 0
                      ? ` (${selectedRowKeys.length})`
                      : ""}
                  </button>
                  <button
                    onClick={handleSaveValidationLogClick}
                    className="primary-btn flex items-center gap-2 mb-2 xl:mb-0"
                  >
                    Start Auto Validation
                    {selectedRowKeys.length > 0
                      ? ` (${selectedRowKeys.length})`
                      : ""}
                  </button>
                  <button
                    onClick={handleDeleteMultipleClick}
                    className="cancel-btn flex items-center gap-2 mb-2 xl:mb-0"
                  >
                    Delete Selected
                    {selectedRowKeys.length > 0
                      ? ` (${selectedRowKeys.length})`
                      : ""}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableLoader />
      ) : (
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 20 }}
          scroll={{ x: "max-content" }}
          bordered
        />
      )}

      {/* Edit Lead Modal */}
      <Modal
        title={selectedUUID ? "Edit Lead" : "Add Lead"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Standard Fields */}
            <div>
              <label className="block mb-2">Lead Date:*</label>
              <input
                type="date"
                className="border rounded p-2 w-full"
                {...register("leadDate")}
              />
            </div>

            <div>
              <label className="block mb-2">Platform:*</label>
              <input
                type="text"
                className="border rounded p-2 w-full"
                {...register("platform")}
              />
            </div>

            <div>
              <label className="block mb-2">Name:*</label>
              <input
                type="text"
                className="border rounded p-2 w-full"
                {...register("name")}
              />
            </div>

            <div>
              <label className="block mb-2">Phone:*</label>
              <input
                type="tel"
                className="border rounded p-2 w-full"
                {...register("phone")}
              />
            </div>

            <div>
              <label className="block mb-2">Email:*</label>
              <input
                type="email"
                className="border rounded p-2 w-full"
                {...register("email")}
              />
            </div>

            <div>
              <label className="block mb-2">Status:*</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => {
                  const statusOptions =
                    campaignData?.typeOfCampaign === "Seller" ||
                    campaignData?.typeOfCampaign === "Landlord"
                      ? SELLER_LANDLORD_STATUS_OPTIONS
                      : BUYER_TENANT_STATUS_OPTIONS;

                  return (
                    <Select
                      {...field}
                      style={{ width: "100%" }}
                      options={statusOptions}
                    />
                  );
                }}
              />
            </div>

            <div>
              <label className="block mb-2">Agent Assigned:</label>
              <Controller
                name="agentAssigned"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Select Agent"
                    showSearch
                    allowClear
                    optionFilterProp="children"
                    style={{ width: "100%" }}
                  >
                    {agentList?.data?.userData
                      ?.filter((agent) => agent.status === "approved")
                      .map((agent: AgentListItem) => (
                        <Option key={agent.id} value={agent.id}>
                          {agent?.user?.name}
                        </Option>
                      ))}
                  </Select>
                )}
              />
            </div>

            {/* Dynamic Fields - Show for both create and edit */}
            {campaignFields.map((fieldName) => {
              // For edit mode, get the existing value
              let defaultValue = "";
              if (existingLead) {
                let dynamicData = existingLead.rows?.[0]?.data || {};
                if (
                  Array.isArray(dynamicData.rows) &&
                  dynamicData.rows[0]?.data
                ) {
                  dynamicData = dynamicData.rows[0].data;
                }
                defaultValue = dynamicData[fieldName] || "";
              }

              return (
                <div key={fieldName}>
                  <label className="block mb-2 capitalize">{fieldName}:</label>
                  <input
                    type="text"
                    defaultValue={defaultValue}
                    className="border rounded p-2 w-full"
                    {...register(`customFields.${fieldName}`)}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-center mt-6">
            <button
              type="submit"
              className="bg-[#0f766e] text-white px-6 py-2 rounded hover:bg-[#0f766e] transition-colors"
            >
              {selectedUUID ? "Update Lead" : "Create Lead"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Delete"
        open={isDeleteModalVisible}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to delete the lead:{" "}
          <strong>
            {tableData.find((lead) => lead.uuid === selectedUUID)?.name ||
              "Unknown Lead"}
          </strong>
          ?
        </p>
      </Modal>

      {/* Delete Multiple Confirmation Modal */}
      <Modal
        title="Confirm Delete Selected"
        open={isDeleteMultipleModalVisible}
        onOk={handleDeleteConfirmMultiple}
        onCancel={cancelDelete}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <div>
          <p>
            Are you sure you want to delete the following{" "}
            {selectedRowKeys.length} lead(s)?
          </p>
          <div className="mt-3 max-h-32 overflow-y-auto">
            <ul className="list-disc pl-5">
              {selectedRowKeys.map((uuid) => {
                const lead = tableData.find((lead) => lead.uuid === uuid);
                return (
                  <li key={uuid} className="text-sm">
                    <strong>{lead?.name || "Unknown Lead"}</strong>
                    {lead?.email && (
                      <span className="text-gray-600 ml-1">({lead.email})</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Modal>

      {/* Assign Multiple Modal */}
      <Modal
        title="Assign Selected Leads"
        open={isAssignModalVisible}
        onCancel={() => !isAssigning && setIsAssignModalVisible(false)}
        footer={null}
        closable={!isAssigning}
      >
        <div className="space-y-4">
          <p>
            Select an agent to assign {selectedRowKeys.length} selected leads:
          </p>
          <Select
            style={{ width: "100%" }}
            placeholder="Select Agent"
            showSearch
            optionFilterProp="children"
            onChange={(value) => {
              handleAssignConfirm(value);
            }}
            disabled={isAssigning}
          >
            {agentList?.data?.userData
              ?.filter((agent) => agent.status === "approved")
              .map((agent: AgentListItem) => (
                <Option key={agent.id} value={agent.id}>
                  {agent?.user?.name}
                </Option>
              ))}
          </Select>
          {isAssigning && (
            <div className="flex justify-center items-center mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#051f1e]"></div>
              <span className="ml-2">Assigning leads...</span>
            </div>
          )}
        </div>
      </Modal>

      {/* Change Status Multiple Modal */}
      <Modal
        title="Change Selected Status Leads"
        open={isChangeStatusModalVisible}
        onCancel={() => !isAssigning && setIsChangeStatusModalVisible(false)}
        footer={null}
        closable={!isAssigning}
      >
        <div className="space-y-4">
          <p>
            Select a status to change {selectedRowKeys.length} selected leads:
          </p>
          <Select
            style={{ width: "100%" }}
            placeholder="Select Status"
            showSearch
            optionFilterProp="children"
            onChange={(value) => {
              handleMultipleStatusChange(value);
            }}
            disabled={isAssigning}
          >
            {campaignData?.typeOfCampaign === "Seller" ||
            campaignData?.typeOfCampaign === "Landlord"
              ? SELLER_LANDLORD_STATUS_OPTIONS.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))
              : BUYER_TENANT_STATUS_OPTIONS.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
          </Select>
          {isAssigning && (
            <div className="flex justify-center items-center mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#051f1e]"></div>
              <span className="ml-2">Changing Status...</span>
            </div>
          )}
        </div>
      </Modal>

      {/* Save to Validation Log Modal */}
      <Modal
        title="Save Selected Leads to Validation Log"
        open={isSaveValidationLogModalVisible}
        onCancel={() =>
          !isSavingValidationLog && setIsSaveValidationLogModalVisible(false)
        }
        footer={null}
        closable={!isSavingValidationLog}
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to save {selectedRowKeys.length} selected
            lead(s) to the validation log?
          </p>
          <div className="mt-3 max-h-32 overflow-y-auto">
            <ul className="list-disc pl-5">
              {selectedRowKeys.map((uuid) => {
                const lead = tableData.find((lead) => lead.uuid === uuid);
                return (
                  <li key={uuid} className="text-sm">
                    <strong>{lead?.name || "Unknown Lead"}</strong>
                    {lead?.email && (
                      <span className="text-gray-600 ml-1">({lead.email})</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={() => setIsSaveValidationLogModalVisible(false)}
              disabled={isSavingValidationLog}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleSaveValidationLogConfirm}
              loading={isSavingValidationLog}
            >
              Start Auto Validation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lead Notes Modal */}
      {selectedLeadForNotes && (
        <LeadNotes
          leadId={selectedLeadForNotes.id}
          isOpen={isNotesModalOpen}
          onClose={handleNotesClose}
          leadData={selectedLeadForNotes}
          refetchLeads={refetch}
        />
      )}

      {/* Lead Activity Log Modal */}
      {selectedLeadForActivity && (
        <LeadActivityLog
          leadUuid={selectedLeadForActivity.uuid}
          visible={isActivityLogVisible}
          onClose={handleActivityLogClose}
          leadName={selectedLeadForActivity.name}
        />
      )}

      {/* Move Leads Modal */}
      <Modal
        title="Move Leads to Another Campaign"
        open={isMoveModalVisible}
        onCancel={handleMoveCancel}
        footer={null}
        closable={!isMoving}
        width={600}
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2">
              You are about to move <strong>{selectedRowKeys.length}</strong> lead(s) to another campaign.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Current Campaign: <strong>{campaignData?.name}</strong>
            </p>
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Select Target Campaign: <span className="text-red-500">*</span>
            </label>
            <Select
              style={{ width: "100%" }}
              placeholder="Select Campaign"
              value={selectedTargetCampaign}
              onChange={(value) => setSelectedTargetCampaign(value)}
              showSearch
              optionFilterProp="children"
              disabled={isMoving}
              filterOption={(input, option) =>
                (option?.children ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {campaignsData?.data?.campaigns
                ?.filter((campaign: any) => campaign.uuid !== campaignUuid)
                .map((campaign: any) => (
                  <Option key={campaign.uuid} value={campaign.uuid}>
                    {campaign.name} ({campaign.typeOfCampaign})
                  </Option>
                ))}
            </Select>
          </div>

          {isMoving && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Moving leads...</span>
                <span className="text-sm font-semibold">{moveProgress}%</span>
              </div>
              <Progress
                percent={moveProgress}
                status={moveProgress === 100 ? "success" : "active"}
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": "#87d068",
                }}
              />
              {moveResult && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800 font-semibold">
                    âœ“ Successfully moved {moveResult.movedCount} out of {moveResult.totalRequested} lead(s)!
                  </p>
                </div>
              )}
            </div>
          )}

          {!isMoving && (
            <div className="flex justify-end gap-2 mt-6">
              <Button onClick={handleMoveCancel}>Cancel</Button>
              <Button
                type="primary"
                onClick={handleMoveConfirm}
                disabled={!selectedTargetCampaign}
              >
                Confirm Move
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default LeadsList;

