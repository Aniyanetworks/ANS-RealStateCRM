/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import 'react-quill-new/dist/quill.snow.css';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import logo1 from '/logo.svg';
import type {
  TableColumnsType,
  TableProps,
} from 'antd';
import {
  Button,
  Dropdown,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from 'antd';
import jsPDF from 'jspdf';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { BsThreeDotsVertical } from 'react-icons/bs';
import {
  FaExchangeAlt,
  FaEye,
  FaFileExcel,
  FaFilePdf,
  FaRegEdit,
  FaSearch,
  FaTimes,
} from 'react-icons/fa';
import { FaFileArrowUp } from 'react-icons/fa6';
import { MdDelete } from 'react-icons/md';
import { RiKey2Line } from 'react-icons/ri';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import * as XLSX from 'xlsx';

import AgentDocument
  from '../../../../../components/dashboard/Agent/AgentDocument';
import SelectedAddonsPlans
  from '../../../../../components/dashboard/Agent/SelectedAddonPlan';
import SelectedDiscount
  from '../../../../../components/dashboard/Agent/SelectedDiscount';
import SelectedPlansDisplay
  from '../../../../../components/dashboard/Agent/SelectedPlan';
import TableLoader from '../../../../../components/loader/TableLoader';
import {
  useChangeAgentAccountStatusMutation,
  useDeleteMultipleAgentMutation,
  useDeleteSingleAgentMutation,
  useGetAgentListDataQuery,
  useToggleAgentShowWebsiteMutation,
  useToggleAgentStatusMutation,
} from '../../../../../redux/api/superadmin/agent/agentManagementSlice';
import {
  useGetActiveBranchListDataQuery,
} from '../../../../../redux/api/superadmin/branch/Branchmanagementslice';
import {
  useGetBrokerageDataQuery,
} from '../../../../../redux/api/superadmin/brokerageDataSlice';
import {
  useGetOptionalPlanListDataQuery,
} from '../../../../../redux/api/superadmin/plan-management/planManagementSlice';
import {
  useImpersonateMutation,
  useResendOtpMutation,
} from '../../../../../redux/api/userSlice';
import { useAppDispatch, useAppSelector } from '../../../../../redux/hooks';
import {
  setAccessToken,
  setUser,
} from '../../../../../redux/slices/userSlice';
import { baseUrl } from '../../../../../utils/constant';
import { usePermissions } from '../../../../../utils/permissionUtils';
import ActiveAgreementPreviewPopup
  from '../../../../agent/ActiveAgreementPreviewPopup';
import AgreementPreviewPopup from '../../../../agent/AgreementPreviewPopup';
import AgentDetailsForm from './AgentDetailsForm';
import AgentInvitation from './AgentInvitation';

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
type TabType = {
  id: number;
  name: string;
  label: string;
};

const tabs: TabType[] = [
  {
    id: 0,
    name: "ourAgent",
    label: "Our Agents",
  },
  {
    id: 1,
    name: "otherAgent",
    label: "Other Agents",
  },
  {
    id: 2,
    name: "approved",
    label: "Approved",
  },
  {
    id: 3,
    name: "closed",
    label: "Terminate",
  },
  {
    id: 4,
    name: "allAgents",
    label: "All Agents",
  },
];

interface Plan {
  id: string;
  name: string;
  type: string;
  planItems: PlanItem[];
}

interface PlanItem {
  id: number;
  name: string;
  planSubItems: PlanSubItem[];
}

interface PlanSubItem {
  id: number;
  name: string;
}

interface DataType {
  plan: Plan;
  key?: React.Key;
  id: string;
  uuid: string;
  planId: number;
  firstName: string;
  lastName: string;
  precName: string;
  email: string;
  address: string;
  cellPhone: string;
  phoneServiceProvider: string;
  recoRegNumber: string;
  recoExpiryDate: string;
  sin: string;
  dob: string;
  emergencyContact: string;
  hstNo: string;
  precHstNo: string;
  expectedGross: number;
  remarks: string;
  status: string;
  agreementStatus: string;
  createdAt: string;
  special_note: string;
  fileUpload: string;
  user: { uuid: string };
  optionalPlanId: string;
  branch?: BranchData;
  branchId?: number;
  isActive?: boolean;
  show_website?: boolean;
}

interface OptionalPlan {
  id: string;
  name: string;
  amount: number;
}

interface BrokerageData {
  id: string;
  brokerageName: string;
  brokeragePhone: string;
  brokerageEmail: string;
  brokerageAddress: string;
}

interface BranchData {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  status: string;
}

interface AgentAccount {
  id: number;
  planId: number;
  status: string;
  agreementStatus: string;
}

type OnChange = NonNullable<TableProps<DataType>["onChange"]>;
type Filters = Parameters<OnChange>[1];

type GetSingle<T> = T extends (infer U)[] ? U : never;
type Sorts = GetSingle<Parameters<OnChange>[2]>;

const AgentManagement: React.FC = () => {
  const [searchParams] = useSearchParams();
  const brokerageId = searchParams.get('brokerageId');
  const parsedBrokerageId = brokerageId ? parseInt(brokerageId) : null;
  const { filter } = useParams('filter');
  const { hasPermissionForSlug } = usePermissions();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { data, isLoading, refetch } = useGetAgentListDataQuery("");
  const [selectedUUID, setSelectedUUID] = useState<string | null>(null);
  const [isModal2Visible, setIsModal2Visible] = useState(false);
  const [isModalAgentInvite, setIsModalAgentInvite] = useState(false);
  const [isModal3Visible, setIsModal3Visible] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);

  //otp
  const [isImpersonateOtpModalVisible, setIsImpersonateOtpModalVisible] = useState(false);
  const [impersonateOtp, setImpersonateOtp] = useState("");
  const [impersonateTarget, setImpersonateTarget] = useState<DataType | null>(null);
  const [resendImpersonateOtp] = useResendOtpMutation();

  const {
    register,
    formState: { errors },
    reset,
  } = useForm<DataType>();

  const [deleteAgent] = useDeleteSingleAgentMutation();
  const [agentAccount, setAgentAccount] = useState<AgentAccount | null>(null);
  const [singelAgentAccount, setSingelAgentAccount] = useState<AgentAccount | null>(null);
  const [deleteMultipleAgent] = useDeleteMultipleAgentMutation();
  const [optionalPlans, setOptionalPlans] = useState<OptionalPlan[]>([]);
  const { data: optionalPlanData } = useGetOptionalPlanListDataQuery("");
  const { data: brokerageData } = useGetBrokerageDataQuery("");
  const { data: activeBranches } = useGetActiveBranchListDataQuery("");
  const [searchText, setSearchText] = useState("");
  const [filteredInfo, setFilteredInfo] = useState<Filters>({});
  const [sortedInfo, setSortedInfo] = useState<Sorts>({});
  const [agentStatus, setAgentStatus] = useState<string | null>(filter ? 'allAgents' : 'ourAgent');
  const [activeTabId, setActiveTabId] = useState(filter ? 4 : 0);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [isModalAgreementVisible, setIsModalAgreementVisible] = useState(false);
  const [isToggleModalVisible, setIsToggleModalVisible] = useState(false);
  const [currentToggleAgent, setCurrentToggleAgent] = useState<{
    id: string;
    name: string;
    currentStatus: boolean;
  } | null>(null);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.user);
  const isAdminOrSuperAdmin = user?.userType === 'superAdmin' || user?.userType === 'admin';
  const [impersonate] = useImpersonateMutation();
  const [toggleAgentStatus, { isLoading: isToggling }] = useToggleAgentStatusMutation();
  const [toggleAgentShowWebsite] = useToggleAgentShowWebsiteMutation();

  const filteredData = tableData?.filter((record) => {

    // Brokerage filter
    if (parsedBrokerageId) {
      const hasMatchingBrokerage = record.brokerageId === parsedBrokerageId;
      if (!hasMatchingBrokerage) return false;
    }

    const searchTerm = searchText?.toLowerCase();

    const inRecords = Object.values(record.user || {}).some((data) =>
      String(data).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const inRecords1 = record?.plan?.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return inRecords || inRecords1 || inRecord;
  });

  const nextFilteredData =
    agentStatus === "allAgents"
      ? filteredData // Show all agents without any filtering
      : agentStatus && agentStatus !== "otherAgent"
        ? filteredData
          ?.filter((record) => {
            if (agentStatus === "ourAgent") {
              // Filter by brokerage ID 24 (ANS RealStateCRM Inc.)
              return (record?.brokerageId === 24 || record?.brokerageId === '24') && record?.status !== "closed";
            } else {
              // Filter by status for other tabs
              return record?.status?.split(",").includes(agentStatus);
            }
          })
          .sort((a, b) => {
            const orderKey =
              agentStatus == "approved"
                ? "Approved"
                : agentStatus == "closed"
                  ? "Terminated"
                  : "Approved"; // Default key

            return (a[orderKey] || 0) - (b[orderKey] || 0);
          })
        : filteredData?.filter((record) => {
          // Filter for "Other Agent" tab - exclude ANS RealStateCRM Inc.
          return record?.brokerageId !== 24 && record?.brokerageId !== '24' && record?.status !== "closed";
        });


  console.log(nextFilteredData);

  const statusOptions = [
    { label: "Approved", value: "approved" },
    { label: "Pending", value: "pending" },
    { label: "Under Review", value: "underReview" },
    { label: "Draft", value: "draft" },
    { label: "Rejected", value: "rejected" },
    { label: "Terminate", value: "closed" },
  ];

  useEffect(() => {
    if (data?.data?.userData) {
      // Add isActive field to each agent with default value true if not present
      const agentsWithActiveStatus = data.data.userData.map((agent: any) => ({
        ...agent,
        isActive: agent.isActive !== undefined ? (agent.isActive === 'yes' || agent.isActive === true) : true,
        show_website:
          agent.show_website === true ||
          agent.show_website === 'true' ||
          agent.show_website === 'yes' ||
          agent.show_website === 1,
      }));
      setTableData(agentsWithActiveStatus);
    }
    setAgentAccount(data?.data?.userData);
    setSearchText(localStorage.getItem('searchTextAgentList') || '')
  }, [data, searchText]);

  // Set agentStatus to "allAgents" when filter is present
  useEffect(() => {
    if (filter) {
      setAgentStatus('allAgents');
    }
  }, [filter]);

  const confirmDelete = async () => {
    if (!selectedUUID) return;

    try {
      const response = await deleteAgent(selectedUUID).unwrap();
      toast.success(response?.message);
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
    console.log(uuid);

    setSelectedUUID(uuid);
    setIsModalVisible(true);
  };

  const resetForm = () => {
    reset({
      brokerageName: "",
      firstName: "",
      lastName: "",
      precName: "",
      email: "",
      special_note: "",
      address: "",
      cellPhone: "",
      phoneServiceProvider: "",
      recoRegNumber: "",
      recoExpiryDate: "",
      sin: "",
      dob: "",
      emergencyContact: "",
      hstNo: "",
      precHstNo: "",
      expectedGross: 0,
      status: "pending",
      agreementStatus: "pending",
    });
    setAgentAccount(null);
  };

  const showAgentDetailsModal = (record: DataType) => {
    console.log("record", record);
    // Format the dates to YYYY-MM-DD
    const formattedRecoExpiryDate = record.recoExpiryDate
      ? record.recoExpiryDate.split("T")[0]
      : "";
    const formattedAgrementExpiryDate = record.agrementExpiryDate
      ? record.agrementExpiryDate.split("T")[0]
      : "";
    const formattedDob = record.dob ? record.dob.split("T")[0] : "";

    reset({
      ...record,
      brokerageName: record?.brokerageData?.brokerageName,
      recoExpiryDate: formattedRecoExpiryDate,
      agrementExpiryDate: formattedAgrementExpiryDate,
      dob: formattedDob,
    });
    setPlan(record?.plan);
    const planArray = record.optionalPlanId
      ? record.optionalPlanId.split(",").map(Number)
      : [];
    // Filter the optional plans where the plan id is included in the planArray
    const filteredOptionalPlans =
      planArray && optionalPlanData?.data?.optionalPlans
        ? optionalPlanData?.data?.optionalPlans.filter((plan: OptionalPlan) =>
          planArray.includes(Number(plan.id))
        )
        : [];
    setOptionalPlans(filteredOptionalPlans);
    setAgentAccount(record as unknown as AgentAccount);
    setSpecialNote(record?.special_note);
    setSelectedUUID(record?.uuid);
    setIsModal2Visible(true);
  };

  const handleCancel2 = () => {
    setIsModal2Visible(false);
    setIsEditMode(false);
    // resetForm();
  };

  const handleCancelAgentInvitation = () => {
    setIsModalAgentInvite(false);
    resetForm();
  };

  const handleCancel3 = () => {
    setIsModal3Visible(false);
    setAgentAccount(null);
  };

  const handleDocumentSubmit = (record: DataType) => {
    setIsModal3Visible(true);
    setAgentAccount(record as unknown as AgentAccount);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true); // Show delete confirmation modal
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const selectedData = selectedRowKeys.map((item: any) => item?.uuid);
        const response = await deleteMultipleAgent(selectedData);
        setIsDeleteModalMultipleVisible(false);
        // Ensure the refetch waits for the data to be refreshed
        await refetch();
        if (response.data.status == true) {
          setSelectedRowKeys([]);
          toast.success("Deleted successfully!");
        } else {
          toast.error("Failed to delete. Please try again.");
        }
      } catch (error: any) {
        console.log(error);
        setIsDeleteModalMultipleVisible(false);
        toast.error("Failed to delete. Please try again.");
      }
    } else {
      toast.error("Please Select Items.");
    }
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

  const [changeAgentAccountStatus] = useChangeAgentAccountStatusMutation();
  // const [changeAgentAgreementStatus] = useChangeAgentAgreementStatusMutation();

  const handleChangeAccountStatus = async (newStatus: string, id: string) => {
    try {
      const response = await changeAgentAccountStatus({
        status: newStatus,
        id,
      }).unwrap();
      toast.success(`${response?.message}`);
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  const [specialNote, setSpecialNote] = useState("");

  const handleChange: OnChange = (pagination, filters, sorter) => {
    console.log(pagination);
    setFilteredInfo(filters);
    setSortedInfo(sorter as Sorts);
    localStorage.setItem("agentCurentPage", pagination?.current || 1);
    setCurrentPage(pagination?.current || 1);
  };

  const columns: TableColumnsType<DataType> = [
    {
      title: "#",
      key: "serial",
      dataIndex: "serial",
      width: 50,
      fixed: "left",
    },
    {
      title: "Agent ID",
      dataIndex: "agentAccountId",
      key: "agentAccountId",
      sorter: (a, b) => a.agentAccountId.localeCompare(b.agentAccountId),
      sortOrder:
        sortedInfo.columnKey === "agentAccountId" ? sortedInfo.order : null,
      render: (text, record) => (
        <button
          onClick={() => {
            showAgentDetailsModal(record);
            localStorage.setItem("agentId", record?.id || "");
            setSelectedAgentId(record?.id);
          }}
          className="hover:text-blue-600 cursor-pointer hover:underline"
        >
          {text || "N/A"}
        </button>
      ),
    },

    {
      title: "First Name",
      dataIndex: "firstName",
      key: "firstName",
      sorter: (a, b) => a.firstName.localeCompare(b.firstName),
      sortOrder: sortedInfo.columnKey === "firstName" ? sortedInfo.order : null,
    },
    {
      title: "Last Name",
      dataIndex: "lastName",
      key: "lastName",
      sorter: (a, b) => a.lastName.localeCompare(b.lastName),
      sortOrder: sortedInfo.columnKey === "lastName" ? sortedInfo.order : null,

      ellipsis: true,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => a.email.localeCompare(b.email),
      sortOrder: sortedInfo.columnKey === "email" ? sortedInfo.order : null,
    },
    {
      title: "Brokerage Name",
      dataIndex: "brokerageData",
      key: "brokerageData",
      filters: brokerageData?.data?.brokerageData?.map((brokerage: BrokerageData) => ({
        text: brokerage.brokerageName,
        value: brokerage.brokerageName,
      })) || [],
      filteredValue: filteredInfo.brokerageData || null,
      onFilter: (value, record) => record?.brokerageData?.brokerageName === value,
      render: (brokerageData: BrokerageData) => brokerageData?.brokerageName,
    },
    {
      title: "Branch",
      dataIndex: "branch",
      key: "branch",
      width: 150,
      filters: Array.from(
        new Set(
          tableData
            .filter((item) => item.branch)
            .map((item) =>
              JSON.stringify({ name: item.branch?.name, id: item.branch?.id })
            )
        )
      ).map((str) => {
        const parsed = JSON.parse(str);
        return { text: parsed.name, value: parsed.name };
      }),
      filteredValue: filteredInfo.branch || null,
      onFilter: (value, record) => record?.branch?.name === value,
      sorter: (a, b) =>
        (a?.branch?.name || "").localeCompare(b?.branch?.name || ""),
      sortOrder: sortedInfo.columnKey === "branch" ? sortedInfo.order : null,
      render: (branch: BranchData) => {
        if (!branch) {
          return <Tag color="default">No Branch</Tag>;
        }
        return (
          <Tooltip title={`Status: ${branch.status}`}>
            <Tag color={branch.status === "active" ? "green" : "red"}>
              {branch.name}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Cell Phone",
      dataIndex: "cellPhone",
      key: "cellPhone",
    },
    {
      title: "Designation",
      dataIndex: "designation",
      key: "designation",
      filters: [
        { text: "Sales Representative", value: "Sales Representative" },
        { text: "Broker", value: "Broker" },
        { text: "Broker of Record", value: "Broker of Record" },
        { text: "Branch Manager", value: "Branch Manager" },
      ],
      filteredValue: filteredInfo.designation || null,
      onFilter: (value, record) => (record?.designation || "").includes(value as string),
      sorter: (a, b) => (a?.designation || "").localeCompare(b?.designation || ""),
      sortOrder: sortedInfo.columnKey === "plan" ? sortedInfo.order : null,
      render: (designation: Plan) => designation ? (designation as string).charAt(0).toUpperCase() + (designation as string).slice(1) : "N/A",
    },
    {
      title: "Account Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Select
          value={status}
          onChange={(newStatus) =>
            handleChangeAccountStatus(newStatus, record.id)
          }
          options={statusOptions}
          style={{ width: 150 }}
        />
      ),
      filters: [
        { text: "Approved", value: "approved" },
        { text: "Pending", value: "pending" },
        { text: "Draft", value: "draft" },
        {
          text: "Under Review",
          value: "underReview",
        },
        { text: "Rejected", value: "rejected" },
        { text: "Terminate", value: "closed" },
      ],
      filteredValue: filteredInfo.status || null,
      onFilter: (value, record) => record.status.includes(value as string),
      sorter: (a, b) => a.status.length - b.status.length,
      sortOrder: sortedInfo.columnKey === "status" ? sortedInfo.order : null,
      ellipsis: true,
    },
    {
      key: 'impersonate',
      title: 'Impersonate Mode',
      render: (text, record) => (
        <button
          onClick={() => handleImpersonate(record)}
          className="flex items-center gap-2 bg-[#072f2d] text-white px-3 py-1 rounded hover:bg-[#182843]"
        >
          <FaExchangeAlt />
          Impersonate
        </button>
      ),
    },
    {
      title: "Active",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      align: "center",
      filters: [
        { text: "Active", value: true },
        { text: "Inactive", value: false },
      ],
      filteredValue: filteredInfo.isActive || null,
      onFilter: (value, record) => record.isActive === value,
      render: (isActive: boolean, record: DataType) => (
        <Tooltip
          title={
            isActive
              ? "Active - Click to deactivate"
              : "Inactive - Click to activate"
          }
        >
          <Switch
            checked={isActive}
            onChange={() => handleToggleClick(record.id, record.firstName + ' ' + record.lastName, isActive)}
            size="small"
            className={isActive ? "active-switch" : "inactive-switch"}
          />
        </Tooltip>
      ),
    },
    {
      title: "Show on Website",
      key: "show_website",
      width: 110,
      align: "center",
      render: (_: any, record: DataType) => (
        <Switch
          size="small"
          checked={!!record.show_website}
          onChange={(checked) => handleToggleShowWebsite(record.id, checked)}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      dataIndex: "id",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                label: (
                  <button
                    className="flex items-center gap-2 w-full"
                    onClick={() => {
                      showAgentDetailsModal(record)
                      localStorage.setItem("agentId", record?.id || "")
                      setSelectedAgentId(record?.id)
                    }}
                  >
                    <FaEye />
                    View
                  </button>
                ),
              },
              hasPermissionForSlug("edit-agent") && {
                key: "edit",
                label: (
                  <Link
                    onClick={() => {
                      localStorage.setItem("agentId", record?.id || "")
                      setSelectedAgentId(record?.id)
                    }}
                    className="flex items-center w-full gap-2"
                    to={`/dashboard/super-admin/agent-create/${record?.user?.uuid}`}
                  >
                    <FaRegEdit />
                    Edit
                  </Link>
                ),
              },
              {
                key: "impersonate",
                label: (
                  <button
                    onClick={() => handleImpersonate(record)}
                    className="flex items-center w-full gap-2"
                  >
                    <FaExchangeAlt />
                    Impersonate
                  </button>
                ),
              },
              record.agreementFile && {
                key: "agreement",
                label: (
                  <a
                    href={record.agreementFile ? `${baseUrl}${record.agreementFile}` : "#"}
                    className="flex items-center w-full gap-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaFileArrowUp />
                    Agreement
                  </a>
                ),
              },
              hasPermissionForSlug("edit-agent") && {
                key: "documents",
                label: (
                  <button
                    onClick={() => {
                      handleDocumentSubmit(record)
                      localStorage.setItem("agentId", record?.id || "")
                      setSelectedAgentId(record?.id)
                    }}
                    className="flex items-center w-full gap-2"
                  >
                    <FaFileArrowUp />
                    Documents
                  </button>
                ),
              },
              hasPermissionForSlug("delete-agent") && {
                key: "delete",
                label: (
                  <button
                    onClick={() => handleDelete(record.user.uuid)}
                    className="flex items-center w-full gap-2"
                  >
                    <MdDelete /> Delete
                  </button>
                ),
              },
              hasPermissionForSlug("edit-agent") && {
                key: "reset-password",
                label: (
                  <Link
                    className="flex items-center gap-2"
                    to={`/super-admin/reset-password/${encodeURIComponent(
                      record.email
                    )}`}
                  >
                    <RiKey2Line />
                    Reset Password
                  </Link>
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

  const reportFilter = filter ? nextFilteredData.filter(item => item.status == filter) : nextFilteredData;

  const tableSourceData = reportFilter?.map(
    (item: DataType, index: number) => {
      return {
        ...item,
        serial: index + 1,
      };
    }
  );

  const handleOnViewDocument = (modalAgreementVisible, modal3Visible) => {
    setIsModalAgreementVisible(modalAgreementVisible); // or false, depending on your need
    setIsModal3Visible(modal3Visible); // or false, depending on your need
  };



  const [currentPage, setCurrentPage] = useState(
    localStorage.getItem("agentCurentPage") || 1
  );
  const [selectedAgentId, setSelectedAgentId] = useState(
    localStorage.getItem("agentId") || ""
  );

  const handleExportCSV = () => {
    const exportData = tableData.map(item => ({
      'Agent ID': item.agentAccountId,
      'First Name': item.firstName,
      'Last Name': item.lastName,
      'Email': item.email,
      'Cell Phone': item.cellPhone,
      'Agent Plan': item.plan?.name || 'N/A',
      'Account Status': item.status,
      'Created At': item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agent List");
    XLSX.writeFile(wb, "agent_list.xlsx");
  };

  const handleExportPDF = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;
    const startY = 30;
    const lineHeight = 10;
    const fontSize = 8;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(fontSize);

    // Add logo
    const logoX = (pageWidth / 2) - 10;
    const logoY = 5;
    const logoWidth = 20;
    const logoHeight = 20;
    pdf.addImage(logo1, "PNG", logoX, logoY, logoWidth, logoHeight);

    pdf.text("Agent List Report", pageWidth / 2, startY, { align: "center" });

    const headers = ["Agent ID", "First Name", "Last Name", "Email", "Cell Phone", "Agent Plan", "Status"];
    const columnWidths = [25, 30, 30, 40, 30, 30, 25];

    let x = margin;
    headers.forEach((header, index) => {
      pdf.text(header, x, startY + lineHeight);
      x += columnWidths[index];
    });

    let currentY = startY + 2 * lineHeight;
    tableData.forEach((item) => {
      const row = [
        item.agentAccountId || "N/A",
        item.firstName || "N/A",
        item.lastName || "N/A",
        item.email || "N/A",
        item.cellPhone || "N/A",
        item.plan?.name || "N/A",
        item.status || "N/A"
      ];

      if (currentY > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        currentY = margin;
      }

      x = margin;
      row.forEach((cell, index) => {
        pdf.text(String(cell), x, currentY);
        x += columnWidths[index];
      });

      currentY += lineHeight;
    });

    pdf.save("agent_list.pdf");
  };

  const handleImpersonate = async (record: DataType) => {
    try {
      setImpersonateTarget(record);

      const response = await impersonate({
        agentId: record.id,
        email: record.email
      }).unwrap();

      if (response.requiresOtp) {
        // Show OTP modal if OTP is required
        setIsImpersonateOtpModalVisible(true);
        toast.success('OTP sent to your phone number');
      } else if (response.status) {
        // If no OTP required (shouldn't happen with OTP enabled)
        handleImpersonationSuccess(response);
      } else {
        toast.error(response.message || 'Failed to impersonate agent');
      }
    } catch (error: any) {
      console.error('Impersonation error:', error);
      if (error.data?.requiresOtp) {
        setIsImpersonateOtpModalVisible(true);
        toast.success('OTP sent to your phone number');
      } else {
        toast.error(error.data?.message || 'Failed to impersonate agent');
      }
    }
  };

  const handleImpersonationOtpVerification = async () => {
    if (!impersonateTarget) return;

    try {
      const response = await impersonate({
        agentId: impersonateTarget.id,
        email: impersonateTarget.email,
        otp: impersonateOtp
      }).unwrap();

      if (response.status) {
        handleImpersonationSuccess(response);
        setIsImpersonateOtpModalVisible(false);
        setImpersonateOtp("");
      } else {
        toast.error(response.message || 'Invalid OTP');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error(error.data?.message || 'Invalid OTP');
    }
  };

  // Auto-verify when OTP length reaches 6
  

  const handleImpersonationSuccess = useCallback((response: any) => {
    // Store original user data in localStorage
    localStorage.setItem('originalUser', JSON.stringify({
      token: response.originalToken,
      user: response.originalUser
    }));

    // Set new user data
    dispatch(setAccessToken(response.token));
    dispatch(setUser(response.user));

    // Navigate to agent dashboard
    navigate('/');
    toast.success('Successfully impersonating agent');
  }, [dispatch, navigate]);

  useEffect(() => {
    const autoVerify = async () => {
      if (impersonateOtp.length === 6 && isImpersonateOtpModalVisible && impersonateTarget) {
        try {
          const response = await impersonate({
            agentId: impersonateTarget.id,
            email: impersonateTarget.email,
            otp: impersonateOtp
          }).unwrap();

          if (response.status) {
            handleImpersonationSuccess(response);
            setIsImpersonateOtpModalVisible(false);
            setImpersonateOtp("");
          } else {
            toast.error(response.message || 'Invalid OTP');
          }
        } catch (error: any) {
          console.error('OTP verification error:', error);
          toast.error(error.data?.message || 'Invalid OTP');
        }
      }
    };

    autoVerify();
  }, [impersonateOtp, isImpersonateOtpModalVisible, impersonateTarget, impersonate, handleImpersonationSuccess]);

  const handleResendImpersonationOtp = async () => {
    try {
      // Get current user email from Redux store or localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await resendImpersonateOtp({
        email: currentUser.email,
        purpose: 'impersonate'
      }).unwrap();

      if (response.status) {
        toast.success('OTP resent successfully');
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      toast.error(error.data?.message || 'Failed to resend OTP');
    }
  };

  // Toggle Agent Status Handlers
  const handleToggleClick = (
    agentId: string,
    agentName: string,
    currentStatus: boolean
  ) => {
    setCurrentToggleAgent({
      id: agentId,
      name: agentName,
      currentStatus: currentStatus,
    });
    setIsToggleModalVisible(true);
  };

  const handleToggleConfirm = async () => {
    if (!currentToggleAgent) return;

    try {
      const response = await toggleAgentStatus({
        agentId: currentToggleAgent.id,
        isActive: !currentToggleAgent.currentStatus,
      }).unwrap();

      if (response.status) {
        toast.success(
          `Agent ${
            !currentToggleAgent.currentStatus ? "activated" : "deactivated"
          } successfully`
        );

        setTableData((prevData) =>
          prevData.map((agent) =>
            agent.id === currentToggleAgent.id
              ? { ...agent, isActive: !currentToggleAgent.currentStatus }
              : agent
          )
        );
      } else {
        toast.error(response.message || "Failed to update agent status");
      }
    } catch (error: any) {
      console.error("Toggle agent status error:", error);
      toast.error(error.data?.message || "Failed to update agent status");
    } finally {
      setIsToggleModalVisible(false);
      setCurrentToggleAgent(null);
    }
  };

  const handleToggleCancel = () => {
    setIsToggleModalVisible(false);
    setCurrentToggleAgent(null);
  };

  const handleToggleShowWebsite = async (agentId: string, showWebsite: boolean) => {
    try {
      const response = await toggleAgentShowWebsite({
        agentId: String(agentId),
        showWebsite,
      }).unwrap();

      if (response?.status) {
        toast.success(response?.message || "Website visibility updated successfully");
        setTableData((prevData) =>
          prevData.map((agent) =>
            agent.id === agentId
              ? { ...agent, show_website: showWebsite }
              : agent
          )
        );
      } else {
        toast.error(response?.message || "Failed to update website visibility");
      }
    } catch (error: any) {
      console.error("Toggle show_website error:", error);
      toast.error(error?.data?.message || "Failed to update website visibility");
    }
  };

  const adminOnlyColumns = ['agentAccountId', 'status', 'impersonate', 'isActive', 'show_website', 'actions'];

  const getFilteredColumns = () => {
    let cols = isAdminOrSuperAdmin
      ? columns
      : columns.filter((col) => !adminOnlyColumns.includes(col.key as string));

    if (agentStatus === 'otherAgent') {
      cols = cols.filter((col) => col.key !== 'status' && col.key !== 'impersonate');
    }

    return cols;
  };

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Agent List</h1>
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTabId(tab.id);
                  setAgentStatus(tab.name);
                }}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                  activeTabId === tab.id
                    ? "bg-[#0f766e] text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="relative flex-shrink-0" style={{ width: 170 }}>
            <FaSearch className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: 10, left: 8 }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => {
                const newValue = e.target.value;
                setSearchText(newValue);
                localStorage.setItem("searchTextAgentList", newValue);
              }}
              style={{ paddingLeft: 26, paddingRight: searchText ? 22 : 8, paddingTop: 4, paddingBottom: 4, width: "100%" }}
            />
            {searchText && (
              <button type="button" onClick={() => { setSearchText(""); localStorage.removeItem("searchTextAgentList"); }} className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" style={{ right: 6 }}>
                <FaTimes />
              </button>
            )}
          </div>
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <FaFilePdf onClick={handleExportPDF} size={18} className="cursor-pointer text-red-600 hover:text-red-700" title="Export to PDF" />
            <FaFileExcel onClick={handleExportCSV} size={18} className="cursor-pointer text-green-600 hover:text-green-700" title="Export to Excel" />
            {hasPermissionForSlug("create-agent") && (
              <button className="primary-btn" onClick={() => setIsModalAgentInvite(true)}>Send Invitation</button>
            )}
            {hasPermissionForSlug("create-agent") && (
              <Link to={"/dashboard/super-admin/agent-create"}>
                <button className="primary-btn">Add New</button>
              </Link>
            )}
            {hasPermissionForSlug("delete-agent") && (
              <button onClick={handleDeleteMultipleClick} className="cancel-btn">Delete Selected</button>
            )}
          </div>
        </div>

        <div>
          {isLoading ? (
            <TableLoader />
          ) : (
            <Table
              rowSelection={rowSelection}
              rowKey="user"
              scroll={{ x: "max-content" }}
              columns={getFilteredColumns()}
              dataSource={tableSourceData}
              onChange={handleChange}
              pagination={{ pageSize: 20, current: currentPage }}
              rowClassName={(record) =>
                record.id == selectedAgentId
                  ? "bg-gray-200 border-2 border-gray-200"
                  : ""
              }
            />
          )}
        </div>
      </div>

      <Modal
        title="Agent other documents"
        open={isModal3Visible}
        onCancel={handleCancel3}
        width={1400}
        footer={[
          <Button key="cancel" onClick={handleCancel3}>
            Close
          </Button>,
        ]}
      >
        <div>
          {/* pass the record here */}
          <AgentDocument agentAccount={agentAccount} />
        </div>
      </Modal>

      <Modal
        title="Agent submit details"
        open={isModal2Visible}
        onCancel={handleCancel2}
        width={1200}
        footer={[
          <Button key="cancel" onClick={handleCancel2}>
            Close
          </Button>,
        ]}
      >
        <Tabs
          defaultActiveKey="personal"
          type="card"
          items={[
            {
              key: "personal",
              label: <span>Personal Details</span>,
              children: (
                <AgentDetailsForm
                  // key={agentAccount?.id}
                  register={register}
                  agentAccount={agentAccount}
                  statusOptions={statusOptions}
                  errors={errors}
                  isEditMode={isEditMode}
                  baseUrl={baseUrl}
                  specialNote={specialNote}
                />
              ),
            },
            {
              key: "plan",
              label: <span>Plan</span>,
              children: (
                <div className="grid grid-cols-2 gap-4 w-full p-5 border">
                  <SelectedPlansDisplay plan={plan as any} />
                  <SelectedDiscount agentAccount={agentAccount} />
                  <SelectedAddonsPlans
                    optionalPlans={optionalPlans as OptionalPlan[]}
                  />
                </div>
              ),
            },
            {
              key: "documents",
              label: <span>Document List</span>,
              children: (
                <div className="flex flex-col mt-4">
                  <AgentDocument key={agentAccount?.id} agentAccount={agentAccount} mode="view" />
                </div>
              ),
            },
          ]}
        />
      </Modal>

      <Modal
        title="Agent Invitation"
        open={isModalAgentInvite}
        onCancel={handleCancelAgentInvitation}
        width={800}
        footer={null}
      >
        <AgentInvitation
          handleCancelAgentInvitation={handleCancelAgentInvitation}
        />
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

      {/* Ag */}
      <Modal
        title="Agreement"
        open={isModalAgreementVisible}
        onCancel={() => { setIsModalAgreementVisible(false), refetch() }}
        width={900}
        footer={[
          <Button
            key="cancel"
            onClick={() => { setIsModalAgreementVisible(false), refetch() }}
          >
            Close
          </Button>,
        ]}
      >
        <div>
          {singelAgentAccount?.agreementStatus != 'approved' ? (
            <AgreementPreviewPopup uuid={selectedUuid} onViewDocument={handleOnViewDocument} />
          ) : (
            <ActiveAgreementPreviewPopup agentAccount={agentAccount} />
          )}
        </div>

      </Modal>

      {/* Impersonation OTP Verification Modal */}
      <Modal
        title="Impersonation Verification"
        open={isImpersonateOtpModalVisible}
        onCancel={() => {
          setIsImpersonateOtpModalVisible(false);
          setImpersonateOtp("");
        }}
        width={500}
        footer={[
          <Button
            key="resend"
            onClick={handleResendImpersonationOtp}
            type="default"
          >
            Resend OTP
          </Button>,
          <Button
            key="verify"
            type="primary"
            className='primary-btn'
            onClick={handleImpersonationOtpVerification}
            disabled={impersonateOtp.length !== 6}
          >
            Verify OTP
          </Button>,
        ]}
      >
        <div className="p-4">
          <p className="text-gray-600">
            Enter the 6-digit OTP sent to your phone number to verify impersonation
          </p>

          <div className="my-4">
            <input
              type="text"
              value={impersonateOtp}
              onChange={(e) => setImpersonateOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (impersonateOtp.length === 6) handleImpersonationOtpVerification();
                }
              }}
              placeholder="Enter OTP"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primaryPurple"
              maxLength={6}
            />
          </div>

          <p className="text-sm text-gray-500 mt-4">
            This extra security step ensures only authorized superadmins can impersonate agents.
          </p>
        </div>
      </Modal>

      {/* Toggle Agent Status Confirmation Modal */}
      <Modal
        title="Confirm Status Change"
        open={isToggleModalVisible}
        onCancel={handleToggleCancel}
        footer={[
          <Button key="cancel" onClick={handleToggleCancel}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleToggleConfirm}
            loading={isToggling}
          >
            Confirm
          </Button>,
        ]}
      >
        <p>
          Are you sure you want to{" "}
          {currentToggleAgent?.currentStatus ? "deactivate" : "activate"}{" "}
          agent <strong>{currentToggleAgent?.name}</strong>?
        </p>
      </Modal>
    </div>
  );
};

export default AgentManagement;
