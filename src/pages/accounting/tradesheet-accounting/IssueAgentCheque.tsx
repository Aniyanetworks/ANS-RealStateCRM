// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useEffect, useState } from "react";
import type { TableColumnsType, TableProps } from "antd";
import { Table, Modal, Button, Select, Dropdown, Space } from "antd";
import { FaEye, FaRegEdit, FaSearch, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import TableLoader from "../../../components/loader/TableLoader";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import {
  useChangeAgentAccountStatusMutation,
  useChangeAgentAgreementStatusMutation,
  useDeleteSingleAgentMutation,
  useDeleteMultipleAgentMutation,
  useGetAgentListDataQuery,
} from "../../../redux/api/superadmin/agent/agentManagementSlice";
import 'react-quill-new/dist/quill.snow.css';
import { baseUrl } from "../../../utils/constant";
import { useGetOptionalPlanListDataQuery } from "../../../redux/api/superadmin/plan-management/planManagementSlice";
import AgentDocument from "../../../components/dashboard/Agent/AgentDocument";
import { FaFileArrowUp } from "react-icons/fa6";
import SelectedPlansDisplay from "../../../components/dashboard/Agent/SelectedPlan";

import AgentDetailsForm from "../../super-admin/dashboard/pages/agent-management/AgentDetailsForm";
import { BsThreeDotsVertical } from "react-icons/bs";
import { Link } from "react-router-dom";
import SelectedAddonsPlans from "../../../components/dashboard/Agent/SelectedAddonPlan";
import { usePermissions } from "../../../utils/permissionUtils";
import { formatNumberWithCommasAndDecimals } from "../../../utils/formatNumberWithCommasAndDecimals";
import capitalizeFirstLetter from "../../../utils/capitalizeFirstLetter";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];

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
}

interface OptionalPlan {
  id: string;
  name: string;
  amount: number;
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

const IssueAgentCheque: React.FC = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { data, isLoading, refetch } = useGetAgentListDataQuery("");
  const [selectedUUID, setSelectedUUID] = useState<string | null>(null);
  const [isModal2Visible, setIsModal2Visible] = useState(false);
  const [isModal3Visible, setIsModal3Visible] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);

  const {
    register,
    formState: { errors },
    reset,
  } = useForm<DataType>();

  const [deleteAgent] = useDeleteSingleAgentMutation();
  const [agentAccount, setAgentAccount] = useState<AgentAccount | null>(null);
  const [deleteMultipleAgent] = useDeleteMultipleAgentMutation();
  const [optionalPlans, setOptionalPlans] = useState<OptionalPlan[]>([]);
  const { data: optionalPlanData } = useGetOptionalPlanListDataQuery("");
  const [searchText, setSearchText] = useState("");
  const [filteredInfo, setFilteredInfo] = useState<Filters>({});
  const [sortedInfo, setSortedInfo] = useState<Sorts>({});
  const [tradeAgentCommission, setTradeAgentCommission] = useState<OptionalPlan[]>([]);

  const filteredData = tableData?.filter((record) => {
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

  const statusOptions = [
    { label: "Approved", value: "approved" },
    { label: "Pending", value: "pending" },
    { label: "Under Review", value: "underReview" },
    { label: "Draft", value: "draft" },
    { label: "Rejected", value: "rejected" },
    { label: "Closed", value: "closed" },
  ];

  useEffect(() => {
    if (data?.data?.userData) {
      const filteredData = data?.data?.userData;
      setTableData(filteredData);
    }
    setAgentAccount(data?.data?.userData);
  }, [data]);

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
    // Format the dates to YYYY-MM-DD
    const formattedRecoExpiryDate = record.recoExpiryDate
      ? record.recoExpiryDate.split("T")[0]
      : "";
    const formattedDob = record.dob ? record.dob.split("T")[0] : "";

    reset({
      ...record,
      recoExpiryDate: formattedRecoExpiryDate,
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
    console.log('record',record?.tradeAgentCommission)
    setTradeAgentCommission(record?.tradeAgentCommission)
    // setAgentTradeSheet(record?.)
    setOptionalPlans(filteredOptionalPlans);
    setAgentAccount(record as unknown as AgentAccount);
    setSpecialNote(record?.special_note);
    setSelectedUUID(record.uuid);
    setIsModal2Visible(true);
  };

  const handleCancel2 = () => {
    setIsModal2Visible(false);
    setIsEditMode(false);
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
      } catch (error) {
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
  const [changeAgentAgreementStatus] = useChangeAgentAgreementStatusMutation();

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

  const handleChangeAgreementStatus = async (newStatus: string, id: string) => {
    try {
      const response = await changeAgentAgreementStatus({
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
      title: "First Name",
      dataIndex: "firstName",
      key: "firstName",
      sorter: (a, b) => a.firstName.localeCompare(b.firstName),
      sortOrder: sortedInfo.columnKey === "firstName" ? sortedInfo.order : null,
      render: (text, record) => (
        <span
          className="hover:text-blue-600 cursor-pointer hover:underline"
          onClick={() => showAgentDetailsModal(record)}
          style={{ color: text || "" }}
        >
          {text || "N/A"}
        </span>
      ),
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
      title: "Cell Phone",
      dataIndex: "cellPhone",
      key: "cellPhone",
    },
    // {
    //   title: "Agent Plan",
    //   dataIndex: "plan",
    //   render: (plan: Plan) => plan?.name,
    //   key: "plan",
    // },
    // {
    //   title: "Account Status",
    //   dataIndex: "status",
    //   key: "status",
    //   render: (status, record) => (
    //     <Select
    //       value={status}
    //       onChange={(newStatus) =>
    //         handleChangeAccountStatus(newStatus, record.id)
    //       }
    //       options={statusOptions}
    //       style={{ width: 150 }}
    //     />
    //   ),
    //   filters: [
    //     { text: "Approved", value: "approved" },
    //     { text: "Pending", value: "pending" },
    //     { text: "Draft", value: "draft" },
    //     {
    //       text: "Under Review",
    //       value: "underReview",
    //     },
    //     { text: "Rejected", value: "rejected" },
    //     { text: "Closed", value: "closed" },
    //   ],
    //   filteredValue: filteredInfo.status || null,
    //   onFilter: (value, record) => record.status.includes(value as string),
    //   sorter: (a, b) => a.status.length - b.status.length,
    //   sortOrder: sortedInfo.columnKey === "status" ? sortedInfo.order : null,
    //   ellipsis: true,
    // },
    // {
    //   title: "Agreement Status",
    //   dataIndex: "agreementStatus",
    //   key: "agreementStatus",
    //   render: (agreementStatus, record) => (
    //     <Select
    //       value={agreementStatus}
    //       onChange={(newStatus) =>
    //         handleChangeAgreementStatus(newStatus, record.id)
    //       }
    //       options={statusOptions}
    //       style={{ width: 150 }}
    //     />
    //   ),
    //   filters: [
    //     { text: "Approved", value: "approved" },
    //     { text: "Pending", value: "pending" },
    //     { text: "Draft", value: "draft" },
    //     {
    //       text: "Under Review",
    //       value: "underReview",
    //     },
    //     { text: "Rejected", value: "rejected" },
    //     { text: "Closed", value: "closed" },
    //   ],
    //   filteredValue: filteredInfo.agreementStatus || null,
    //   onFilter: (value, record) =>
    //     record.agreementStatus.includes(value as string),
    //   sorter: (a, b) => a.agreementStatus.length - b.agreementStatus.length,
    //   sortOrder:
    //     sortedInfo.columnKey === "agreementStatus" ? sortedInfo.order : null,
    //   ellipsis: true,
    // },
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
                    onClick={() => showAgentDetailsModal(record)}
                  >
                    <FaEye />
                    View
                  </button>
                ),
              },
            //   hasPermissionForSlug("edit-agent") && {
            //     key: "edit",
            //     label: (
            //       <Link
            //         className="flex items-center w-full gap-2"
            //         to={`/dashboard/super-admin/agent-create/${record.user.uuid}`}
            //       >
            //         <FaRegEdit />
            //         Edit
            //       </Link>
            //     ),
            //   },
            //   {
            //     key: "agreement",
            //     label: (
            //       <Link
            //         to={`/dashboard/super-admin/agreement-preview/${record.user.uuid}`}
            //         className="flex items-center w-full gap-2"
            //         target="_blank"
            //       >
            //         <FaFileArrowUp />
            //         Agreement
            //       </Link>
            //     ),
            //   },
            //   hasPermissionForSlug("edit-agent") && {
            //     key: "documents",
            //     label: (
            //       <button
            //         onClick={() => handleDocumentSubmit(record)}
            //         className="flex items-center w-full gap-2"
            //       >
            //         <FaFileArrowUp />
            //         Documents
            //       </button>
            //     ),
            //   },
            //   hasPermissionForSlug("delete-agent") && {
            //     key: "delete",
            //     label: (
            //       <button
            //         onClick={() => handleDelete(record.user.uuid)}
            //         className="flex items-center w-full gap-2"
            //       >
            //         <MdDelete /> Delete
            //       </button>
            //     ),
            //   },
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

  const tableSourceData = filteredData?.map((item: DataType, index: number) => {
    return {
      ...item,
      serial: index + 1,
    };
  });

  const rows = [
    {
      id: 1,
      agentName: 'John Doe',
      tradesheetId: 'TS12345',
      tradesheetAddress: '1234 Trade St, NY',
      netComm: '$2000',
      netCheque: '$1500',
    },
    {
      id: 2,
      agentName: 'Jane Smith',
      tradesheetId: 'TS67890',
      tradesheetAddress: '5678 Market Ave, LA',
      netComm: '$2500',
      netCheque: '$1800',
    },
    {
      id: 3,
      agentName: 'Michael Johnson',
      tradesheetId: 'TS11223',
      tradesheetAddress: '9876 Commerce Blvd, SF',
      netComm: '$1800',
      netCheque: '$1400',
    },
  ];

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Agent List</h1>
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
        </div>

        <div>
          {isLoading ? (
            <TableLoader />
          ) : (
            <Table
              rowSelection={rowSelection}
              rowKey="user"
              scroll={{ x: "max-content" }}
              columns={columns}
              dataSource={tableSourceData}
              pagination={{ pageSize: 20 }}
              onChange={handleChange}
            />
          )}
        </div>
      </div>

      <Modal
        title="Tradesheet Agent Commission Amount"
        open={isModal2Visible}
        onCancel={handleCancel2}
        width={1150}
        footer={[
          <Button key="cancel" onClick={handleCancel2}>
            Close
          </Button>,
        ]}
      >
        <div className="">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr>
                {/* <th className="border px-4 py-2">Select</th> */}
                <th className="border px-4 py-2">Agent Name</th>
                <th className="border px-4 py-2">Tradesheet Id</th>
                <th className="border px-4 py-2">Tradesheet Address</th>
                <th className="border px-4 py-2">Net Commission</th>
                <th className="border px-4 py-2">Net Cheque</th>
                <th className="border px-4 py-2">Transfer Status</th>
                <th className="border px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {tradeAgentCommission.map((data) => (
                <tr key={data.id}>
                  {/* <td className="border px-4 py-2">
                    <input
                      type="checkbox"
                      // checked={selectedRows.includes(row.id)}
                      // onChange={() => handleCheckboxChange(row.id)}
                    />
                  </td> */}
                  <td className="border px-4 py-2">{data?.tradeSheet?.name}</td>
                  <td className="border px-4 py-2">
                    {data?.tradeSheet?.tradeSheetTypeId}
                  </td>
                  <td className="border px-4 py-2">
                    {data?.tradeSheet?.properties?.[0]?.propertyAddress}
                  </td>
                  <td className="border px-4 py-2">
                    $ {formatNumberWithCommasAndDecimals(data?.agentCommissionTotal)}
                  </td>
                  <td className="border px-4 py-2">
                    $ {formatNumberWithCommasAndDecimals(data?.agentCommissionTotal)}
                  </td>
                  <td className="border px-4 py-2">
                    {capitalizeFirstLetter(data?.status)}
                  </td>
                  <td className="border px-4 py-2">
                    <Link
                      className="flex items-center w-full gap-2"
                      to={`/dashboard/accounting/agent-cheque-calculation/${data?.uuid}/${data?.agentAccountId}`}
                    >
                      <FaRegEdit />
                      Calculation
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    </div>
  );
};

export default IssueAgentCheque;
