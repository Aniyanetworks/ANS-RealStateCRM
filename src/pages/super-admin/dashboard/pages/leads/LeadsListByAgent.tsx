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
  Select,
  Space,
  Table,
} from 'antd';
import {
  Controller,
  useForm,
} from 'react-hook-form';
import { FaInfoCircle } from 'react-icons/fa';
import { Popover } from 'antd';
import toast from 'react-hot-toast';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { FaEye, FaRegEdit } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { FaStickyNote } from 'react-icons/fa';
import moment from "moment-timezone";
import { useSelector } from 'react-redux';
import {
  NavLink,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import TableLoader from '../../../../../components/loader/TableLoader';
import AgentLeadStatistics from './AgentLeadStatistics';
import {
  useGetAgentListDataQuery,
} from '../../../../../redux/api/superadmin/agent/agentManagementSlice';
import {
  useCreateLeadMutation,
  useDeleteLeadMutation,
  useDeleteMultipleLeadsMutation,
  useGetLeadsByAgentQuery,
  useUpdateLeadMutation,
  useChangeLeadStatusMutation,
} from '../../../../../redux/api/superadmin/leadManagementSlice';
import LeadNotes from './LeadNotes';

const { Option } = Select;

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];

interface Lead {
  id: number;
  key?: React.Key;
  uuid: string;
  campaignId: number;
  leadDate?: string;
  platform?: string;
  propertyType?: string;
  budget?: string;
  timeRange?: string;
  prefContact?: string;
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
  form?: string;
  prefLocation?: string;
}

interface AgentListItem {
  id: number;
  user: {
    id: number;
    name: string;
  };
  status: string;
}

const BUYER_TENANT_STATUS_OPTIONS = [
  { value: "New", label: "New" },
  { value: "Attempted Contact", label: "Attempted Contact" },
  { value: "Connected", label: "Connected" },
  { value: "Qualified", label: "Qualified" },
  { value: "Active Search", label: "Active Search" },
  { value: "Offer Submitted", label: "Offer Submitted" },
  { value: "Under Contract / Conditional", label: "Under Contract / Conditional" },
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
  { value: "Under Contract / Conditional", label: "Under Contract / Conditional" },
  { value: "Closed", label: "Closed" },
  { value: "Lost / Inactive", label: "Lost / Inactive" },
  { value: "Not Qualified", label: "Not Qualified" },
];

const campaignTypes = ["Tenant", "Landload", "Seller", "Buyer"];

const LeadsList = () => {
  const { campaignUuid } = useParams<{ campaignUuid: string }>();
  const [tableData, setTableData] = useState<Lead[]>([]);
  const [campaignData, setCampaignData] = useState<Lead[]>([]);
  const { user } = useSelector((state: any) => state.user);
  const { data, isLoading, refetch } = useGetLeadsByAgentQuery(user?.agentAccount?.[0]?.id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedLeadForNotes, setSelectedLeadForNotes] = useState<{ id: number } | null>(null);

  const [createLead] = useCreateLeadMutation();
  const [updateLead] = useUpdateLeadMutation();
  const [deleteLead] = useDeleteLeadMutation();
  const [deleteMultipleLeads] = useDeleteMultipleLeadsMutation();
  const { data: agentList } = useGetAgentListDataQuery("");
  const [changeLeadStatus] = useChangeLeadStatusMutation();
  const [searchParams] = useSearchParams();
  const leadIdParam = searchParams.get('leadId');
  const [searchText, setSearchText] = useState("");
  const [activeView, setActiveView] = useState<"list" | "statistics">("list");
  const [existingLead, setExistingLead] = useState<Lead | null>(null);

  useEffect(() => {
    setTableData(data?.data?.leads);
    setCampaignData(data?.data?.campaign);
  }, [data]);


  useEffect(() => {
    if (leadIdParam && data?.data?.leads) {
      const matchingLead = data.data.leads.find(lead => lead.uuid === leadIdParam);
      if (matchingLead) {
        handleNotesClick(matchingLead);
      }
    }
  }, [leadIdParam, data?.data?.leads]);

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit,
    setValue,
    control,
  } = useForm<Lead>();

  const resetForm = () => {
  reset({
    leadDate: "",
    platform: "",
    propertyType: "",
    budget: "",
    timeRange: "",
    prefContact: "",
    name: "",
    phone: "",
    email: "",
    status: "New",
    agentAssigned: null,
    form: "",
    prefLocation: "",
  });
  setExistingLead(null);
};

  const handleCancel = () => {
  resetForm();
  setIsModalOpen(false);
  setSelectedUUID(null);
  setExistingLead(null);
};

  const showModal = () => setIsModalOpen(true);

  const handleEdit = (record: Lead) => {
  setValue(
    "leadDate", record.leadDate ? moment.utc(record.leadDate).format("YYYY-MM-DD") : ""
  );
  setValue("platform", record.platform);
  setValue("propertyType", record.propertyType);
  setValue("budget", record.budget);
  setValue("timeRange", record.timeRange);
  setValue("prefContact", record.prefContact);
  setValue("name", record.name);
  setValue("phone", record.phone);
  setValue("email", record.email);
  setValue("agentAssigned", record.agentAssigned || null);
  setValue("form", record.form);
  setValue("prefLocation", record.prefLocation);
  setValue("status", record.status || "New");
  setSelectedUUID(record?.uuid);
  setExistingLead(record);
  showModal();
};

  const confirmDelete = async () => {
    try {
      const response = await deleteLead(selectedUUID).unwrap();
      toast.success(`${response?.message}`);
      refetch();
    } catch (error) {
      toast.error("Delete failed. Something went wrong!");
      console.error("Delete error:", error);
    }
    setIsModalVisible(false);
    setSelectedUUID(null);
  };

  const [isDeleteModalVisible, setIsModalVisible] = useState(false);

  const handleDelete = (uuid: string) => {
    setSelectedUUID(uuid);
    setIsModalVisible(true);
  };

  const cancelDelete = () => {
    setIsModalVisible(false);
    setSelectedUUID(null);
    setIsDeleteModalMultipleVisible(false);
  };

  const handleDeleteMultipleClick = () => {
    if (selectedRowKeys.length === 0) {
      toast.error("Please select leads to delete.");
      return;
    }
    setIsDeleteModalMultipleVisible(true);
  };

  const handleDeleteConfirmMultiple = async () => {
    try {
      const response = await deleteMultipleLeads(selectedRowKeys).unwrap();
      toast.success(`${response?.message}`);
      refetch();
      setSelectedRowKeys([]);
    } catch (error) {
      toast.error("Delete failed. Something went wrong!");
      console.error("Delete error:", error);
    }
    setIsDeleteModalMultipleVisible(false);
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

  const onSubmit = async (data: Lead) => {
    try {
      if (selectedUUID) {
        const response = await updateLead({ uuid: selectedUUID, data }).unwrap();
        toast.success(`${response?.message}`);
      } else {
        const response = await createLead({ campaignUuid, data }).unwrap();
        toast.success(`${response?.message}`);
      }
      refetch();
      handleCancel();
    } catch (error: unknown) {
      toast.error("Operation failed. Something went wrong!");
      console.error("Operation error:", error);
    }
  };

  const handleNotesClick = (record: Lead) => {
    let flatData = record.rows?.[0]?.data || {};

    if (Array.isArray(flatData.rows) && flatData.rows[0]?.data) {
      flatData = flatData.rows[0].data;
    }

    setSelectedLeadForNotes({
      ...record,
      flatData
    });
    setIsNotesModalOpen(true);
  };

  const handleNotesClose = () => {
    setIsNotesModalOpen(false);
    setSelectedLeadForNotes(null);
  };

  const columns: TableColumnsType<Lead> = [
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
            placeholder={`Search Name`}
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
    ...(user.userType === "superadmin"
      ? [
      ]
      : []),
    ...(user.userType === "superadmin"
      ? [
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
              onChange={(value) => {
                updateLead({
                  uuid: record.uuid,
                  data: { agentAssigned: value },
                })
                  .unwrap()
                  .then(() => {
                    toast.success("Agent assigned successfully");
                    refetch();
                  })
                  .catch((error) => {
                    toast.error("Failed to assign agent");
                    console.error("Update error:", error);
                  });
              }}
            >
              {agentList?.data?.userData
                ?.filter((agent) => agent.status === "approved")
                .map((agent: AgentListItem) => (
                  <Option key={agent.id} value={agent.id}>
                    {agent.user.name}
                  </Option>
                ))}
            </Select>
          ),

          filterDropdown: ({
            setSelectedKeys,
            selectedKeys,
            confirm,
            clearFilters,
          }) => (
            <div style={{ padding: 8 }}>
              <Input
                placeholder="Search Agent Assigned"
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
            const agentName = String(record.agent?.name || "").toLowerCase();
            const filterValue = String(value || "").toLowerCase();
            return agentName.includes(filterValue);
          },

          sorter: (a, b) => {
            const nameA = a.agent?.name || "";
            const nameB = b.agent?.name || "";
            return nameA.localeCompare(nameB);
          },
        },
      ]
      : []),
    ...(user.userType === "superadmin"
      ? [

        {
          title: "Import Date",
          dataIndex: "createdAt",
          key: "createdAt",
          render: (text) =>
            moment
              .tz(text, "YYYY-MM-DD HH:mm:ss", "UTC")
              .tz("America/Toronto")
              .format("DD MMMM YYYY, hh:mm A"),
          sorter: (a, b) =>
            new Date(a.leadDate).getTime() - new Date(b.leadDate).getTime(),
        },
      ]
      : []),
    {
      title: "Lead Assigned Date",
      dataIndex: "leadDate",
      key: "leadDate",
      render: (text) =>
        moment.utc(text).format("DD MMMM YYYY"),
      sorter: (a, b) =>
        new Date(a.leadDate).getTime() - new Date(b.leadDate).getTime(),
    },
    {
      title: "Type",
      dataIndex: "typeOfCampaign",
      key: "type",
      render: (text) => text || "N/A",
      filters: campaignTypes.map(type => ({ text: type, value: type })),
      onFilter: (value, record) => {
        const filterValue = String(value);
        return record.typeOfCampaign === filterValue;
      },
    },
    {
  title: (
    <span className='flex'>
      Status 
      <Popover 
        content={
          <div className='text-xs' style={{ maxWidth: 450, maxHeight: 400, overflowY: 'auto', fontSize: '10px'}}>
            <div><strong>Buyer & Tenant Leads</strong></div>
            <div>New â€“ Lead just received or assigned, no contact made yet.</div>
            <div>Attempted Contact â€“ Agent tried reaching out (call, text, email), waiting for response.</div>
            <div>Connected â€“ Two-way communication established; initial conversation done.</div>
            <div>Qualified â€“ Lead's needs, budget, and timeline confirmed. Actively looking.</div>
            <div>Active Search â€“ Actively viewing or shortlisting properties.</div>
            <div>Offer Submitted â€“ Offer sent or application submitted (for tenants).</div>
            <div>Under Contract / Conditional â€“ Offer accepted, pending conditions or lease finalization.</div>
            <div>Closed â€“ Deal done. Lease signed or purchase completed.</div>
            <div>Lost / Inactive â€“ Lead went silent, changed plans, or worked with another agent.</div>
            <div>Not Qualified â€“ Doesn't meet basic requirements (unrealistic budget, poor credit, incomplete info).</div>
            
            <div style={{ marginTop: 8 }}><strong>Seller & Landlord Leads</strong></div>
            <div>New â€“ Lead just received or assigned, no contact made yet.</div>
            <div>Attempted Contact â€“ Outreach made, waiting for response.</div>
            <div>Connected â€“ Spoke with the client, confirmed property interest.</div>
            <div>Qualified â€“ Motivation, timing, and property details verified. Lead is worth pursuing.</div>
            <div>Appointment Scheduled â€“ Listing presentation or property visit booked.</div>
            <div>Active Listing â€“ Listing agreement signed, property on the market.</div>
            <div>Under Contract / Conditional â€“ Offer accepted, pending conditions or lease finalization.</div>
            <div>Closed â€“ Sale or lease completed.</div>
            <div>Lost / Inactive â€“ Client chose another agent, withdrew property, or unresponsive.</div>
            <div>Not Qualified â€“ Not ready to list, unrealistic expectations, or outside target area.</div>
          </div>
        }
        placement="top"
        trigger="hover"
      >
        <FaInfoCircle 
          style={{ 
            marginLeft: 8, 
            color: '#0f766e', 
            cursor: 'pointer',
            fontSize: '14px'
          }} 
        />
      </Popover>
    </span>
  ),
  dataIndex: "status",
  key: "status",
  width: 200,
  render: (text, record) => {
    const statusOptions = record.typeOfCampaign === "Seller" || 
                         record.typeOfCampaign === "Landlord" 
      ? SELLER_LANDLORD_STATUS_OPTIONS 
      : BUYER_TENANT_STATUS_OPTIONS;

    return (
      <Select
        defaultValue={record.status || "New"}
        style={{ width: "100%" }}
        onChange={(value) => {
          changeLeadStatus({
            uuid: record.uuid,
            data: { status: value }
          })
            .unwrap()
            .then((response) => {
              if (response.status) {
                toast.success(response.message);
                refetch();
              } else {
                toast.error(response.message);
              }
            })
            .catch((error) => {
              toast.error("Failed to update status");
              console.error("Status update error:", error);
            });
        }}
      >
        {statusOptions.map(option => (
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
    { text: "Under Contract / Conditional", value: "Under Contract / Conditional" },
    { text: "Closed", value: "Closed" },
    { text: "Lost / Inactive", value: "Lost / Inactive" },
    { text: "Not Qualified", value: "Not Qualified" },
  ],
  onFilter: (value, record) => record.status === value,
  sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
},
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
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
              ...(user.userType === "superadmin"
                ? [
                  {
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
                  {
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
                ]
                : []),
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

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();
    return Object.values(record).some((value) =>
      String(value || '').toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div>
      <h1 className="xl:hidden text-center mb-3">Leads List for Campaign: {campaignData?.name}</h1>
      <div className="flex items-center justify-between gap-5 xl:gap-10 mb-5 p-1">
        <div className="flex items-center gap-2">
          <h1 className="hidden xl:block">Leads List for Campaign: {campaignData?.name}</h1>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => setActiveView("list")}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                activeView === "list" ? "bg-[#0f766e] text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              All Leads
            </button>
            <button
              onClick={() => setActiveView("statistics")}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                activeView === "statistics" ? "bg-[#0f766e] text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              📊 My Statistics
            </button>
          </div>
        </div>

        {activeView === "list" && (
          <div className="2xl:w-1/3 lg:w-1/3 w-1/3">
            <input
              type="text"
              placeholder="Search from table..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="global-search"
            />
          </div>
        )}

        <div className="flex">
          {user.userType === "superadmin" &&
            <div>
              <NavLink to="/dashboard/super-admin/leads" className="primary-btn mx-3">
                Go Back
              </NavLink>
              <button onClick={showModal} className="primary-btn mx-3">
                Add New
              </button>
              <button onClick={handleDeleteMultipleClick} className="cancel-btn mx-3">
                Delete Selected
              </button>
            </div>
          }
        </div>
      </div>

      {activeView === "statistics" ? (
        <AgentLeadStatistics />
      ) : isLoading ? (
        <TableLoader />
      ) : (
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 20 }}
          rowKey="uuid"
          scroll={{ x: 'max-content' }}
        />
      )}

      <Modal
        title={selectedUUID ? "Edit Lead" : "Add Lead"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2">Lead Date:</label>
              <input
                type="date"
                className="border rounded p-2 w-full"
                {...register("leadDate")}
              />
            </div>
            <div>
              <label className="block mb-2">Platform:</label>
              <input
                type="text"
                className="border rounded p-2 w-full"
                {...register("platform")}
              />
            </div>
            <div>
              <label className="block mb-2">Property Type:</label>
              <input
                type="text"
                className="border rounded p-2 w-full"
                {...register("propertyType")}
              />
            </div>
            <div>
              <label className="block mb-2">Budget:</label>
              <input
                type="text"
                className="border rounded p-2 w-full"
                {...register("budget")}
              />
            </div>
            <div>
              <label className="block mb-2">Time Range:</label>
              <input
                type="text"
                className="border rounded p-2 w-full"
                {...register("timeRange")}
              />
            </div>
            <div>
              <label className="block mb-2">Preferred Contact:</label>
              <input
                type="text"
                className="border rounded p-2 w-full"
                {...register("prefContact")}
              />
            </div>
            <div>
              <label className="block mb-2">Form Name:</label>
              <input
                type="text"
                className="border rounded p-2 w-full"
                {...register("form")}
              />
            </div>
            <div>
              <label className="block mb-2">Preferred Location:</label>
              <input
                type="text"
                className="border rounded p-2 w-full"
                {...register("prefLocation")}
              />
            </div>
            <div>
              <label className="block mb-2">Name:</label>
              <input
                type="text"
                className="border rounded p-2 w-full"
                {...register("name")}
              />
            </div>
            <div>
              <label className="block mb-2">Phone: <span className="text-red-500">*</span></label>
              <input
                type="tel"
                className="border rounded p-2 w-full"
                {...register("phone", {
                  required: "Phone number is required",
                  pattern: {
                    value: /^[0-9+\-\s()]*$/,
                    message: "Please enter a valid phone number"
                  }
                })}
              />
              {errors.phone && <span className="text-red-500 text-sm">{errors.phone.message}</span>}
            </div>
            <div>
              <label className="block mb-2">Email: <span className="text-red-500">*</span></label>
              <input
                type="email"
                className="border rounded p-2 w-full"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Please enter a valid email address"
                  }
                })}
              />
              {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
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
                    onChange={(value) => field.onChange(value)}
                    onBlur={field.onBlur}
                    value={field.value === null ? undefined : field.value}
                  >
                    {agentList?.data?.userData?.filter(agent => agent.status === "approved").map((agent: AgentListItem) => (
                      <Option key={agent.id} value={agent.id}>
                        {agent.user.name}
                      </Option>
                    ))}
                  </Select>
                )}
              />
            </div>
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

      <Modal
        title="Confirm Delete"
        open={isDeleteModalVisible}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this lead?</p>
      </Modal>

      <Modal
        title="Confirm Delete Selected"
        open={isDeleteMultipleModalVisible}
        onOk={handleDeleteConfirmMultiple}
        onCancel={cancelDelete}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete the selected leads?</p>
      </Modal>

      {selectedLeadForNotes && (
        <LeadNotes
          leadId={selectedLeadForNotes.id}
          isOpen={isNotesModalOpen}
          onClose={handleNotesClose}
          leadData={selectedLeadForNotes}
          refetchLeads={refetch}
        />
      )}
    </div>
  );
};

export default LeadsList; 