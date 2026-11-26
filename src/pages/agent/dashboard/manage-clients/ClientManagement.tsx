/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useEffect, useState } from "react";
import type { TableColumnsType, TableProps } from "antd";
import { Table, Modal, Button, Dropdown, Select, Space } from "antd";
import { FaEye, FaRegEdit, FaSearch, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { Link, NavLink, useParams } from "react-router-dom";
import ModalMain from "../../../../components/ui/Modal";
import toast from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import {
  useDeleteSpacificUserMutation,
  useDeleteMultipleUserMutation,
  useGetClientListDataQuery,
  useSendInvitationMutation,
} from "../../../../redux/api/superadmin/user/userManageSlice";
import TableLoader from "../../../../components/loader/TableLoader";
import { formatDate, parseISO } from "date-fns";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useAppSelector } from "../../../../redux/hooks";
import { useGetAgentListDataQuery } from "../../../../redux/api/superadmin/agent/agentManagementSlice";
import { usePermissions } from "../../../../utils/permissionUtils";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface DataType {
  key?: React.Key;
  name: any;
  email: any;
  status: any;
  role: any;
  userType: any;
  createdAt: any;
  uuid: string; // Ensure uuid is included in DataType
}



type TabType = {
  id: number;
  name: string;
};

const tabs: TabType[] = [
  {
    id: 0,
    name: "All",
  },
  {
    id: 1,
    name: "High",
  },
  {
    id: 2,
    name: "Medium",
  },
  {
    id: 3,
    name: "Low",
  }
];

const CreateAndUpdateUser = () => {
  const { filter } = useParams('filter');
  const { hasPermissionForSlug } = usePermissions();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);
  const { data, isLoading, refetch } = useGetClientListDataQuery("");
  const [deleteSpacificUser] = useDeleteSpacificUserMutation();
  const [sendInvitation] = useSendInvitationMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAppSelector((state) => state.user);
  // filter
  const [filteredInfo, setFilteredInfo] = useState<Filters>({});
  const [sortedInfo, setSortedInfo] = useState<Sorts>({});

  //Delete Multiple
  const [deleteMultipleUser] = useDeleteMultipleUserMutation();
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [searchText, setSearchText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: agentList } = useGetAgentListDataQuery("");

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();

    /* const inProperties = Object.values(record.createdUser || {}).some((data) =>
      String(data).toLowerCase().includes(searchTerm.toLowerCase())
  ); */

    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return /* inProperties || */ inRecord;
  });

  const [clientPriority, setclientPriority] = useState<string | null>(null);

  const agentOptions = agentList?.data?.userData?.map((agent: any) => ({
    value: agent?.agentAccountId,
    email: agent?.user?.email,
    firstName: agent?.user?.firstName,
    lastName: agent?.user?.lastName,
    label: `${agent?.user?.name}`,
  })) || [];

  const nextFilteredData =
    clientPriority && clientPriority !== "All"
      ? filteredData
        ?.filter((record) =>
          record.clientPriority
            ?.split(",")
            .includes(clientPriority)
        )
        .sort((a, b) => {
          const orderKey =
            clientPriority === "High"
              ? "HighOrder"
              : clientPriority === "Medium"
                ? "MediumOrder"
                : clientPriority === "Low"
                  ? "LowOrder"
                  : "HighOrder"; // Default to HighOrder
          return a[orderKey] - b[orderKey];
        })
      : filteredData;


  useEffect(() => {
    setTableData(data?.data?.userData);
  }, [data]);

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false)
  };

  const handleDelete = (uuid: string) => {
    setDeleteUuid(uuid);
    setIsModalVisible(true);
  };

  //Delete Multiple
  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true);
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteMultipleUser(selectedRowKeys);
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

  const {
    register,
    formState: { errors },
    reset,
    getValues,
    setValue,
    setError,
    handleSubmit,
    watch,
    control
  } = useForm<DataType>({});

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

  const resetForm = () => {
    setValue("email", "");
    setValue("agentId", "");
  };


  const onSubmit = async () => {
    setIsUploading(true);
    if (user.userType === "agent") {
      setValue("agentId", user.agentAccount[0].agentAccountId);
    }
    const data = getValues();
    // alert(data.agentId)
    console.log("data for inviting client:-----------", data);
    try {
      const response = await sendInvitation({
        data
      });
      handleResponse(response);
    } catch (error: any) {
      toast.error("Invitation failed. Something went wrong!");
      console.error("Error:", error);
    } finally {
      setIsUploading(false);
    }
  };


  const confirmDelete = async () => {
    try {
      const response = await deleteSpacificUser(deleteUuid).unwrap();
      toast.success(`${response?.message}`);
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
    setIsModalVisible(false);
    setDeleteUuid(null);
  };

  const cancelDelete = () => {
    setIsModalVisible(false);
    setDeleteUuid(null); // Reset deleteUuid
    setIsDeleteModalMultipleVisible(false);
  };

  /* const getUserTypeName = (userType) => {
    const userTypeMap = {
      superAdmin: "Super Admin",
      admin: "Admin",
      agent: "Agent",
      accountant: "Accountant",
    };
    return userTypeMap[userType] || "Unknown User Type";
  }; */

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

  const handleChange: OnChange = (pagination, filters, sorter) => {
    console.log(pagination);
    setFilteredInfo(filters);
    setSortedInfo(sorter as Sorts);
  };

  const filterProps = filter ? nextFilteredData?.filter((record) => record.clientType?.toLowerCase() === filter) : nextFilteredData;

  // serial number in the table
  const tableSourceData = filterProps?.map((item: any, index: number) => {
    return {
      ...item,
      serial: index + 1,
    };
  });

  const columns: TableColumnsType<DataType> = [
    {
      title: "#",
      key: "serial",
      width: 50,
      dataIndex: "serial",
      fixed: "left",
    },
    ...(user.userType === "superAdmin" || user.userType === "admin"
      ? [
        {
          title: "Agent Name",
          dataIndex: "clientAccount",
          key: "clientAccount",
          render: (clientAccount) => <span>{clientAccount?.[0]?.clientAgent?.name || ""}</span>,

          sorter: (a, b) => a.name.localeCompare(b.name),
        }

      ]
      : []),
    {
      title: "Client Name",
      dataIndex: "name",
      key: "name",
      render: (name, records) => (
        <span>
          <Link
            to={`/dashboard/clients/property-list/${records.id}/${records.name}`}
            className="hover:text-blue-600 cursor-pointer hover:underline"
          >
            {name || "N/A"}
          </Link>
        </span>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Client Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: "Client Phone Number",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: "Client Type",
      dataIndex: "clientType",
      key: "clientType",
      render: (clientType) => (
        <span>
          {clientType ? clientType : '...'}
        </span>
      ),
      filters: [
        { text: "Seller", value: "Seller" },
        { text: "Buyer", value: "Buyer" },
        { text: "Tenant", value: "Tenant" },
        { text: "Landlord", value: "Landlord" },
      ],
      filteredValue: filteredInfo?.clientType || null,
      onFilter: (value, record) => record?.clientType.includes(value as string),
      ellipsis: true,
    },
    {
      title: "Client Priority",
      dataIndex: "clientPriority",
      key: "clientPriority",
      render: (clientPriority) => (
        <span>
          {clientPriority ? clientPriority : '...'}
        </span>
      ),
      filters: [
        { value: "High", text: "High" },
        { value: "Medium", text: "Medium" },
        { value: "Low", text: "Low" }
      ],
      filteredValue: filteredInfo?.clientPriority || null,
      onFilter: (value, record) => record?.clientPriority.includes(value as string),
      ellipsis: true,
    },

    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      render: (source) => <span>{source || "DVR"}</span>,
      filters: [
        { text: "DVR", value: "DVR" },
        { text: "GHL", value: "GHL" },
      ],
      filteredValue: filteredInfo?.source || null,
      onFilter: (value, record) => (record?.source || "DVR") === value,
      ellipsis: true,
    },
    {
      title: "Created at",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => {
        if (!createdAt) {
          return "No date";
        }
        const date = parseISO(createdAt);
        return formatDate(date, "dd MMMM yyyy, hh:mm a");
      },
    },

    {
      title: "Actions",
      dataIndex: "uuid",
      key: "actions",
      render: (uuid, records) => (
        <Dropdown
          menu={{
            items: [
              hasPermissionForSlug("create-client") && {
                key: "edit",
                label: (
                  <Link
                    to={`/dashboard/clients/create-update-client/${uuid}`}
                    className="flex items-center gap-2"
                  >
                    <FaRegEdit /> Edit
                  </Link>
                ),
              },
              {
                key: "view",
                label: (
                  <Link
                    to={`/dashboard/clients/property-list/${records.id}/${records.name}`}
                    className="flex items-center gap-2"
                  >
                    <FaEye /> View
                  </Link>
                ),
              },
              (hasPermissionForSlug("delete-client") || records.createdUser.id == user.id) && {
                key: "delete",
                label: (
                  <button
                    onClick={() => handleDelete(uuid)}
                    className="flex items-center gap-2"
                  >
                    <MdDelete /> Delete
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
      ),
      fixed: "right",
      width: 50,
      align: "center",
    },
  ];

  const showModal = () => setIsModalOpen(true);

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          {/* Title */}
          <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">
            Client List
            <span className="ml-1 text-gray-400 font-normal text-[11px]">({tableSourceData?.length ?? 0})</span>
          </h1>
          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          {/* Filter tabs */}
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setclientPriority(tab.name === "All" ? null : tab.name)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                  (tab.name === "All" && !clientPriority) || clientPriority === tab.name
                    ? "bg-[#9F8667] text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
          {/* Spacer */}
          <div className="flex-1" />
          {/* Search */}
          <div className="relative flex-shrink-0" style={{ width: 170 }}>
            <FaSearch
              className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              style={{ fontSize: 10, left: 8 }}
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                paddingLeft: 26,
                paddingRight: searchText ? 22 : 8,
                paddingTop: 4,
                paddingBottom: 4,
                width: "100%",
              }}
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
            <button onClick={showModal} className="primary-btn">
              Send Invitation
            </button>
            {hasPermissionForSlug("create-client") && (
              <NavLink to="/dashboard/clients/create-update-client" className="primary-btn">
                Create New
              </NavLink>
            )}
            {hasPermissionForSlug("delete-client") && (
              <button onClick={handleDeleteMultipleClick} className="cancel-btn">
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
            dataSource={tableSourceData}
            pagination={{ pageSize: 20 }}
            onChange={handleChange}
          />
        )}
      </div>
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
        <p>Are you sure you want to delete this trade sheet?</p>
      </Modal>

      {
        <ModalMain
          handleCancel={handleCancel}
          isModalOpen={isModalOpen}
          handleOk={handleSubmit(onSubmit)}
          title="Send Client Registration Invitation"
          isLoading={isUploading}
          modalClass={"lg:!w-[40%] !z-[10000]"}
        >
          <form className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 gap-4">
              <div>
                <label htmlFor="email">
                  Email Address <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^@ ]+@[^@ ]+\.[^@ .]{2,}$/,
                      message: "Email is not valid",
                    },
                  })}
                  type="email"
                />
                {errors.email && (
                  <p className="text-red-500">{errors.email.message}</p>
                )}
              </div>

              {(user.userType == "superAdmin" || user.userType == "admin") && (
                <div className="grid grid-cols-1 sm:grid-cols-2  gap-4 mb-6 w-full ">
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
            </div>
          </form>
        </ModalMain>
      }

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

export default CreateAndUpdateUser;
