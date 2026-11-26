/* eslint-disable @typescript-eslint/no-explicit-any */
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
import moment from 'moment-timezone';
import {
  Controller,
  useForm,
} from 'react-hook-form';
import toast from 'react-hot-toast';
import { BsThreeDotsVertical } from 'react-icons/bs';
import {
  FaEye,
  FaRegEdit,
  FaUser
} from 'react-icons/fa';
import { MdDelete, MdEmail } from 'react-icons/md';
import {
  NavLink,
  useNavigate,
  useParams,
} from 'react-router-dom';

import TableLoader from '../../../../../components/loader/TableLoader';
import {
  useGetAgentListDataQuery,
} from '../../../../../redux/api/superadmin/agent/agentManagementSlice';
import {
  useAssignMultipleLeadsToAgentMutation,
  useChangeLeadStatusMutation,
  useChangeMultipleLeadsStatusMutation,
  useCreateLeadMutation,
  useDeleteLeadMutation,
  useDeleteMultipleLeadsMutation,
  useGetLeadsByCampaignQuery,
  useUpdateLeadMutation,
} from '../../../../../redux/api/superadmin/leadManagementSlice';
import { useLeadToClientMutation, useSendInvitationMutation } from '../../../../../redux/api/superadmin/user/userManageSlice';
import LeadNotes from './LeadNotes';
import { useAppSelector } from '../../../../../redux/hooks';

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

const LeadsList = () => {
  const { campaignUuid } = useParams<{ campaignUuid: string }>();
  const [tableData, setTableData] = useState<Lead[]>([]);
  const [campaignData, setCampaignData] = useState<Lead[]>([]);
  const { data, isLoading, refetch } = useGetLeadsByCampaignQuery(campaignUuid);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [selectedLeadForNotes, setSelectedLeadForNotes] = useState<{ id: number } | null>(null);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [isChangeStatusModalVisible, setIsChangeStatusModalVisible] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const [createLead] = useCreateLeadMutation();
  const [leadToClient] = useLeadToClientMutation();
  const [updateLead] = useUpdateLeadMutation();
  const [deleteLead] = useDeleteLeadMutation();
  const [deleteMultipleLeads] = useDeleteMultipleLeadsMutation();
  const { data: agentList } = useGetAgentListDataQuery("");
  const [changeLeadStatus] = useChangeLeadStatusMutation();
  const [assignMultipleLeadsToAgent] = useAssignMultipleLeadsToAgentMutation();
  const [changeMultipleLeadsStatus] = useChangeMultipleLeadsStatusMutation();
  const [sendInvitation] = useSendInvitationMutation();
  const { user } = useAppSelector((state) => state.user);

  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setTableData(data?.data?.leads);
    setCampaignData(data?.data?.campaign);
  }, [data]);

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
      agentAssigned: null,
      form: "",
      prefLocation: "",
    });
  };

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    setSelectedUUID(null);
  };

  const showModal = () => setIsModalOpen(true);


  const handleEdit = (record: Lead) => {
    console.log('record', record.agentAssigned)
    // Populate form with lead data
    const leadDateForForm = record.leadDate
      ? moment.utc(record.leadDate).local().format("YYYY-MM-DD")
      : "";
    setValue("leadDate", leadDateForForm);
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
    setSelectedUUID(record?.uuid);
    showModal();
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

  const [isDeleteModalVisible, setIsModalVisible] = useState(false);

  const handleDelete = (uuid: string) => {
    setSelectedUUID(uuid);
    setIsModalVisible(true);
  };


  const handleLeadToClient = async (uuid: string) => {

    try {
      if (uuid) {
        // Update lead
        await leadToClient({ data: { uuid }, uuid }).unwrap();
        toast.success(`Lead Successfully converted to Client`);
        navigate('/dashboard/clients/client-list')
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

    const agent = agentList.data.userData.find((agent) => agent.id === agentId)
    const agentAcc = agent.agentAccountId
    const data = {
      email,
      agentId: agentAcc
    }
    // alert(data.agentId)
    console.log("data for inviting client:-----------", data);
    try {
      const res = await sendInvitation({
        data
      });
      if (res.status === true) {
        toast.success('Email Invitation sent successfully!')
      }
    } catch (error: any) {
      toast.error("Invitation failed. Something went wrong!");
      console.error("Error:", error);
    }
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
      refetch(); // Refetch data to update the table
      setSelectedRowKeys([]); // Clear selected rows
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
    console.log("lead data", data)
    try {
      if (selectedUUID) {
        // Update lead
        const response = await updateLead({ uuid: selectedUUID, data }).unwrap();
        toast.success(`${response?.message}`);
      } else {
        // Create lead
        const response = await createLead({ campaignUuid, data }).unwrap();
        toast.success(`${response?.message}`);
      }
      refetch(); // Refetch data after update/create
      handleCancel();
    } catch (error: unknown) {
      toast.error("Operation failed. Something went wrong!");
      console.error("Operation error:", error);
    }
  };

  const handleNotesClick = (record: Lead) => {
    setSelectedLeadForNotes(record);
    setIsNotesModalOpen(true);
  };

  const handleNotesClose = () => {
    setIsNotesModalOpen(false);
    setSelectedLeadForNotes(null);
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

  const handleAssignConfirm = async (agentId: number) => {
    console.log("first=----------")
    try {
      setIsAssigning(true);
      const response = await assignMultipleLeadsToAgent({
        uuids: selectedRowKeys,
        agentId
      }).unwrap();

      if (response.status) {
        toast.success(response.message);
        // Ensure dates are properly handled in the refetch
        const updatedData = await refetch();
        // Explicitly handle dates in the updated data
        setTableData(updatedData.data?.data?.leads.map(lead => ({
          ...lead,
          leadDate: lead.leadDate ? moment.utc(lead.leadDate).format() : null,
          createdAt: lead.createdAt ? moment.utc(lead.createdAt).format() : null
        })));
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


  const handleMultipleStatusChange = async (status: number) => {
    try {
      setIsAssigning(true);
      const response = await changeMultipleLeadsStatus({
        uuids: selectedRowKeys,
        status
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
      // toast.error("Failed to change status for selected leads");
      console.error("Status Change error:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  const

    columns: TableColumnsType<Lead> = [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        fixed: "left",
        width: 130,
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
      // {
      //   title: "Platform",
      //   dataIndex: "platform",
      //   key: "platform",
      //   filterDropdown: ({
      //     setSelectedKeys,
      //     selectedKeys,
      //     confirm,
      //     clearFilters,
      //   }) => (
      //     <div style={{ padding: 8 }}>
      //       <Input
      //         placeholder={`Search platform`}
      //         value={selectedKeys[0]}
      //         onChange={(e) =>
      //           setSelectedKeys(e.target.value ? [e.target.value] : [])
      //         }
      //         onPressEnter={() => confirm()}
      //         style={{ marginBottom: 8, display: "block" }}
      //       />
      //       <Space>
      //         <Button
      //           type="primary"
      //           onClick={() => confirm()}
      //           icon={<FaRegEdit />}
      //           size="small"
      //           style={{ width: 90 }}
      //         >
      //           Search
      //         </Button>
      //         <Button
      //           onClick={() => clearFilters && clearFilters()}
      //           size="small"
      //           style={{ width: 90 }}
      //         >
      //           Reset
      //         </Button>
      //       </Space>
      //     </div>
      //   ),
      //   onFilter: (value, record) =>
      //     record.platform?.toLowerCase().includes(value.toLowerCase()),
      //   sorter: (a, b) => a.platform?.localeCompare(b.platform || "") || 0,
      // },
      // {
      //   title: "Form Name",
      //   dataIndex: "form",
      //   key: "form",
      //   filterDropdown: ({
      //     setSelectedKeys,
      //     selectedKeys,
      //     confirm,
      //     clearFilters,
      //   }) => (
      //     <div style={{ padding: 8 }}>
      //       <Input
      //         placeholder={`Search form`}
      //         value={selectedKeys[0]}
      //         onChange={(e) =>
      //           setSelectedKeys(e.target.value ? [e.target.value] : [])
      //         }
      //         onPressEnter={() => confirm()}
      //         style={{ marginBottom: 8, display: "block" }}
      //       />
      //       <Space>
      //         <Button
      //           type="primary"
      //           onClick={() => confirm()}
      //           icon={<FaRegEdit />}
      //           size="small"
      //           style={{ width: 90 }}
      //         >
      //           Search
      //         </Button>
      //         <Button
      //           onClick={() => clearFilters && clearFilters()}
      //           size="small"
      //           style={{ width: 90 }}
      //         >
      //           Reset
      //         </Button>
      //       </Space>
      //     </div>
      //   ),
      //   onFilter: (value, record) =>
      //     record.form?.toLowerCase().includes(value.toLowerCase()),
      //   sorter: (a, b) => a.form?.localeCompare(b.form || "") || 0,
      // },
      {
        title: "Preferred Location",
        dataIndex: "prefLocation",
        key: "prefLocation",
        filterDropdown: ({
          setSelectedKeys,
          selectedKeys,
          confirm,
          clearFilters,
        }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder={`Search Preferred Location`}
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
          const recordValue = String(record.prefContact || "").toLowerCase();
          const filterValue = String(value || "").toLowerCase();
          return recordValue.includes(filterValue);
        },
        sorter: (a, b) => a.prefContact?.localeCompare(b.prefContact || "") || 0,
      },
      {
        title: "Preferred Contact",
        dataIndex: "prefContact",
        key: "prefContact",
        filterDropdown: ({
          setSelectedKeys,
          selectedKeys,
          confirm,
          clearFilters,
        }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder={`Search Preferred Contact`}
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
          const recordValue = String(record.prefContact || "").toLowerCase();
          const filterValue = String(value || "").toLowerCase();
          return recordValue.includes(filterValue);
        },
        sorter: (a, b) => a.prefContact?.localeCompare(b.prefContact || "") || 0,
      },
      {
        title: "Property Type",
        dataIndex: "propertyType",
        key: "propertyType",
        filterDropdown: ({
          setSelectedKeys,
          selectedKeys,
          confirm,
          clearFilters,
        }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder={`Search Property Type`}
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
          const recordValue = String(record.propertyType || "").toLowerCase();
          const filterValue = String(value || "").toLowerCase();
          return recordValue.includes(filterValue);
        },
        sorter: (a, b) =>
          a.propertyType?.localeCompare(b.propertyType || "") || 0,
      },
      {
        title: "Budget",
        dataIndex: "budget",
        key: "budget",
        filterDropdown: ({
          setSelectedKeys,
          selectedKeys,
          confirm,
          clearFilters,
        }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder={`Search Budget`}
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
          const recordValue = String(record.budget || "").toLowerCase();
          const filterValue = String(value || "").toLowerCase();
          return recordValue.includes(filterValue);
        },
        sorter: (a, b) => a.budget?.localeCompare(b.budget || "") || 0,
      },
      {
        title: "Time Range",
        dataIndex: "timeRange",
        key: "timeRange",
        filterDropdown: ({
          setSelectedKeys,
          selectedKeys,
          confirm,
          clearFilters,
        }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder={`Search Time Range`}
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
          const recordValue = String(record.timeRange || "").toLowerCase();
          const filterValue = String(value || "").toLowerCase();
          return recordValue.includes(filterValue);
        },
        sorter: (a, b) => a.timeRange?.localeCompare(b.timeRange || "") || 0,
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
            {agentList?.data?.userData?.filter(agent => agent.status === "approved").map((agent: AgentListItem) => (
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
      {
        title: "Lead Created Date",
        dataIndex: "leadDate",
        key: "leadDate",
        render: (text) => {
          // Explicitly check for null/undefined/empty string
          if (!text) return "-";

          // Create moment object in UTC
          const date = moment.utc(text);

          // Check validity and format
          return date.isValid() ? date.local().format("DD MMMM YYYY") : "-";
        },
        sorter: (a, b) => {
          // Handle null values in sorting
          const dateA = a.leadDate ? moment.utc(a.leadDate).valueOf() : 0;
          const dateB = b.leadDate ? moment.utc(b.leadDate).valueOf() : 0;
          return dateA - dateB;
        }
      },
      {
        title: "Import Date",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (text) => {
          if (!text) return "-";
          const date = moment.utc(text);
          return date.isValid()
            ? date.tz("America/Toronto").format("DD MMMM YYYY, hh:mm A")
            : "-";
        },
        sorter: (a, b) => moment.utc(a.createdAt).valueOf() - moment.utc(b.createdAt).valueOf(),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 200,
        render: (text, record) => (
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
            <Option value="New">New</Option>
            <Option value="No Response">No Response</Option>
            <Option value="Responded">Responded</Option>
            <Option value="Qualified">Qualified</Option>
            <Option value="Not Qualified">Not Qualified</Option>
            <Option value="Active">Active</Option>
            <Option value="Lost">Lost</Option>
            <Option value="Closed">Closed</Option>
          </Select>
        ),
        filters: [
          { text: "New", value: "New" },
          { text: "No Response", value: "No Response" },
          { text: "Responded", value: "Responded" },
          { text: "Qualified", value: "Qualified" },
          { text: "Not Qualified", value: "Not Qualified" },
          { text: "Active", value: "Active" },
          { text: "Lost", value: "Lost" },
          { text: "Closed", value: "Closed" },
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
                {
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
                {
                  key: "mail",
                  label: (
                    <button
                      onClick={() => handleClientInvitation(record.email, record.agentAssigned)}
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

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();
    return Object.values(record).some((value) =>
      String(value || '').toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div>
      <h1 className="xl:hidden text-center mb-3">Leads List for Campaign: {campaignData?.name}</h1>
      <div className="flex items-center justify-between gap-5 xl:gap-10  mb-5 p-1">
        <h1 className="hidden xl:block">Leads List for Campaign: {campaignData?.name}</h1>

        <div className="2xl:w-1/3 lg:w-1/3 w-1/3">
          <input
            type="text"
            placeholder="Search from table..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="global-search "
          />
        </div>

        <div className="flex">
          <NavLink to="/dashboard/super-admin/leads" className="primary-btn mx-3 flex items-center gap-2">
            Go Back
            {/* <IoArrowBack /> */}
          </NavLink>
          <button onClick={showModal} className="primary-btn mx-3 flex items-center gap-2">
            Add New
            {/* <FaPlus /> */}
          </button>
          {
            selectedRowKeys.length > 0 && (
              <div>
                <button
                  onClick={handleAssignMultipleClick}
                  className="primary-btn mx-3"
                >
                  Assign Selected {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ""}
                </button>
                <button
                  onClick={handleStatusMultipleClick}
                  className="primary-btn mx-3"
                >
                  Change Status {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ""}
                </button>
                <button
                  onClick={handleDeleteMultipleClick}
                  className="cancel-btn mx-3"
                >
                  Delete Selected {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ""}
                </button>
              </div>
            )
          }
        </div>
      </div>

      {isLoading ? (
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
              className="bg-[#051f1e] text-white px-6 py-2 rounded hover:bg-[#0a1a33] transition-colors"
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
        <p>Are you sure you want to delete this lead?</p>
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
        <p>Are you sure you want to delete the selected leads?</p>
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

      {/* Assign Multiple Modal */}
      <Modal
        title="Assign Selected Leads"
        open={isAssignModalVisible}
        onCancel={() => !isAssigning && setIsAssignModalVisible(false)}
        footer={null}
        closable={!isAssigning}
      >
        <div className="space-y-4">
          <p>Select an agent to assign {selectedRowKeys.length} selected leads:</p>
          <Select
            style={{ width: "100%" }}
            placeholder="Select Agent"
            showSearch
            optionFilterProp="children"
            onChange={(value) => {
              console.log("value-------", value)
              handleAssignConfirm(value);
            }}
            disabled={isAssigning}
          >
            {agentList?.data?.userData?.filter(agent => agent.status === "approved").map((agent: AgentListItem) => (
              <Option key={agent.id} value={agent.id}>
                {agent.user.name}
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
          <p>Select an status to Change {selectedRowKeys.length} selected leads:</p>
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
            <Option value="New">New</Option>
            <Option value="No Response">No Response</Option>
            <Option value="Responded">Responded</Option>
            <Option value="Qualified">Qualified</Option>
            <Option value="Not Qualified">Not Qualified</Option>
            <Option value="Active">Active</Option>
            <Option value="Lost">Lost</Option>
            <Option value="Closed">Closed</Option>
          </Select>
          {isAssigning && (
            <div className="flex justify-center items-center mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#051f1e]"></div>
              <span className="ml-2">Changing Status...</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default LeadsList; 