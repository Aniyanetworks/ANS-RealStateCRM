/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useEffect,
  useState,
} from 'react';

import type {
  MenuProps,
  TableColumnsType,
  TableProps,
} from 'antd';
import {
  Button,
  Col,
  Descriptions,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import {
  formatDate,
  parseISO,
} from 'date-fns';
import toast from 'react-hot-toast';
import { BsThreeDotsVertical } from 'react-icons/bs';
import {
  FaEye,
  FaRegEdit,
  FaSearch,
  FaTimes,
} from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { useSelector } from 'react-redux';

import { SearchOutlined } from '@ant-design/icons';

import TableLoader from '../../../../../components/loader/TableLoader';
import {
  useGetCitiesQuery,
  useGetStatesQuery,
} from '../../../../../redux/api/common/countryStateCitySlice';
import {
  useCreateUpdateBranchMutation,
  useDeleteMultipleBranchMutation,
  useDeleteSpecificBranchMutation,
  useGetBranchListDataQuery,
  useGetSpecificBranchDataQuery,
} from '../../../../../redux/api/superadmin/branch/Branchmanagementslice';
import {
  formatPhoneNumber,
  formatPostalCode,
} from '../../../../../utils/format';
import { usePermissions } from '../../../../../utils/permissionUtils';

const { TextArea } = Input;
const { Option } = Select;

const formItemLayout = { style: { marginBottom: 16 } };
const inputFullWidth = { width: '100%' };

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];

interface ClockSettings {
  latitude?: string;
  longitude?: string;
  allowedDistance?: string;
  officeHoursWeekdayStart?: string;
  officeHoursWeekdayEnd?: string;
  officeHoursWeekendStart?: string;
  officeHoursWeekendEnd?: string;
}

interface DataType {
  key?: React.Key;
  id: string;
  uuid: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  status?: string;
  countryId?: number;
  stateId?: number;
  cityId?: number;
  postalCode?: string;
  country?: { id: number; countryName: string; shortName: string };
  state?: { id: number; name: string };
  city?: { id: number; name: string };
  isDefault?: string;
  clockInOutSettings?: ClockSettings[];
  _count?: {
    users: number;
    tradeSheets: number;
    campaigns: number;
    propertyListings: number;
  };
  createdAt: string;
  updatedAt: string;
}

type OnChange = NonNullable<TableProps<DataType>["onChange"]>;

type GetSingle<T> = T extends (infer U)[] ? U : never;
type Sorts = GetSingle<Parameters<OnChange>[2]>;
type ItemType = Required<MenuProps>["items"][number];

const BranchList = () => {
  const { hasPermissionForSlug } = usePermissions();
  const { user } = useSelector((state: any) => state.user);
  const isSuperAdmin = user?.roleId == 1;
  const [form] = Form.useForm();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);
  const { data, isLoading, refetch } = useGetBranchListDataQuery("");
  const [deleteSpecificBranch] = useDeleteSpecificBranchMutation();
  const [deleteMultipleBranch] = useDeleteMultipleBranchMutation();
  const [createUpdateBranch, { isLoading: isSaving }] =
    useCreateUpdateBranchMutation();

  // Phone and Postal Code formatting states
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");

  // Create Modal States
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  // Edit Modal States
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editBranchUuid, setEditBranchUuid] = useState<string | undefined>(
    undefined
  );

  // View Modal States
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewBranchUuid, setViewBranchUuid] = useState<string | undefined>(
    undefined
  );

  // Fetch data for edit modal
  const { data: editBranchData, isLoading: isFetchingEditBranch } =
    useGetSpecificBranchDataQuery(editBranchUuid, {
      skip: !editBranchUuid,
    });

  // Fetch data for view modal
  const { data: viewBranchData, isLoading: isFetchingViewBranch } =
    useGetSpecificBranchDataQuery(viewBranchUuid, {
      skip: !viewBranchUuid,
    });

  // Location state management
  const selectedCountry = 39; // Canada by default
  const selectedStateCreate = Form.useWatch("stateId", form);
  const selectedStateEdit = editBranchData?.data?.branchData?.stateId;

  // Fetch states based on selected country
  const { data: states = [] } = useGetStatesQuery(selectedCountry, {
    skip: !selectedCountry,
  });

  // Fetch cities for create modal
  const { data: citiesCreate = [] } = useGetCitiesQuery(selectedStateCreate, {
    skip: !selectedStateCreate || !isCreateModalVisible,
  });

  // Fetch cities for edit modal
  const { data: citiesEdit = [] } = useGetCitiesQuery(selectedStateEdit, {
    skip: !selectedStateEdit || !isEditModalVisible,
  });

  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [sortedInfo, setSortedInfo] = useState<Sorts>({});
  const [searchText, setSearchText] = useState("");

  // Filter logic with search
  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();
    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return inRecord;
  });

  useEffect(() => {
    if (data?.data?.branchData) {
      setTableData(data.data.branchData);
    }
  }, [data]);

  // Load branch data into form for edit
  useEffect(() => {
    if (editBranchData?.data?.branchData && isEditModalVisible) {
      const branch = editBranchData.data.branchData;
      const clockSettings = branch.clockInOutSettings?.[0];
      form.setFieldsValue({
        name: branch.name,
        slug: branch.slug,
        email: branch.email,
        phone: branch.phone,
        address: branch.address,
        status: branch.status,
        countryId: branch.countryId || 39,
        stateId: branch.stateId,
        cityId: branch.cityId,
        postalCode: branch.postalCode,
        clockInOutLatitude: clockSettings?.latitude != null ? parseFloat(clockSettings.latitude) : undefined,
        clockInOutLongitude: clockSettings?.longitude != null ? parseFloat(clockSettings.longitude) : undefined,
        clockInOutAllowedDistance: clockSettings?.allowedDistance != null ? parseFloat(clockSettings.allowedDistance) : undefined,
        officeHoursWeekdayStart: clockSettings?.officeHoursWeekdayStart || undefined,
        officeHoursWeekdayEnd: clockSettings?.officeHoursWeekdayEnd || undefined,
        officeHoursWeekendStart: clockSettings?.officeHoursWeekendStart || undefined,
        officeHoursWeekendEnd: clockSettings?.officeHoursWeekendEnd || undefined,
      });
      setPhoneNumber(formatPhoneNumber(branch.phone || ""));
      setPostalCode(formatPostalCode(branch.postalCode || ""));
    }
  }, [editBranchData, form, isEditModalVisible]);

  const handleChange: OnChange = (_pagination, _filters, sorter) => {
    setSortedInfo(sorter as Sorts);
  };

  // Handle phone number formatting
  const handleChangePhoneNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatPhoneNumber(e.target.value);
    setPhoneNumber(value);
    form.setFieldValue("phone", value);
  };

  // Handle postal code formatting
  const handleChangePostalCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatPostalCode(e.target.value);
    setPostalCode(value);
    form.setFieldValue("postalCode", value);
  };

  // ========== CREATE MODAL HANDLERS ==========
  const handleCreateClick = () => {
    form.resetFields();
    // Set default values
    form.setFieldsValue({
      status: "active",
      countryId: 39, // Default to Canada
    });
    setPhoneNumber("");
    setPostalCode("");
    setIsCreateModalVisible(true);
  };

  const handleCreateModalClose = () => {
    setIsCreateModalVisible(false);
    form.resetFields();
    setPhoneNumber("");
    setPostalCode("");
  };

  const handleCreateSubmit = async (values: any) => {
    try {
      // Generate slug from name automatically
      const slug = values.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const submitData = {
        ...values,
        slug,
        clockInOutAddress: values.address || undefined,
        clockInOutLatitude: values.clockInOutLatitude,
        clockInOutLongitude: values.clockInOutLongitude,
        clockInOutAllowedDistance: values.clockInOutAllowedDistance,
        officeHoursWeekdayStart: values.officeHoursWeekdayStart || undefined,
        officeHoursWeekdayEnd: values.officeHoursWeekdayEnd || undefined,
        officeHoursWeekendStart: values.officeHoursWeekendStart || undefined,
        officeHoursWeekendEnd: values.officeHoursWeekendEnd || undefined,
      };

      const response = await createUpdateBranch({
        data: submitData,
        uuid: undefined,
      }).unwrap();

      if (response.status) {
        toast.success(response.message || "Branch created successfully");
        handleCreateModalClose();
        refetch();
      } else {
        toast.error(response.message || "Something went wrong");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error?.data?.message || "Failed to create branch");
    }
  };

  // ========== EDIT MODAL HANDLERS ==========
  const handleEditClick = (uuid: string) => {
    setEditBranchUuid(uuid);
    setIsEditModalVisible(true);
  };

  const handleEditModalClose = () => {
    setIsEditModalVisible(false);
    setEditBranchUuid(undefined);
    form.resetFields();
    setPhoneNumber("");
    setPostalCode("");
  };

  const handleEditSubmit = async (values: any) => {
    try {
      const branch = editBranchData?.data?.branchData;
      const submitData = {
        ...values,
        slug: values.slug ?? branch?.slug,
        clockInOutAddress: values.address || undefined,
        clockInOutLatitude: values.clockInOutLatitude,
        clockInOutLongitude: values.clockInOutLongitude,
        clockInOutAllowedDistance: values.clockInOutAllowedDistance,
        officeHoursWeekdayStart: values.officeHoursWeekdayStart || undefined,
        officeHoursWeekdayEnd: values.officeHoursWeekdayEnd || undefined,
        officeHoursWeekendStart: values.officeHoursWeekendStart || undefined,
        officeHoursWeekendEnd: values.officeHoursWeekendEnd || undefined,
      };
      const response = await createUpdateBranch({
        data: submitData,
        uuid: editBranchUuid,
      }).unwrap();

      if (response.status) {
        toast.success(response.message || "Branch updated successfully");
        handleEditModalClose();
        refetch();
      } else {
        toast.error(response.message || "Something went wrong");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error?.data?.message || "Failed to update branch");
    }
  };

  // ========== VIEW MODAL HANDLERS ==========
  const handleViewClick = (uuid: string) => {
    setViewBranchUuid(uuid);
    setIsViewModalVisible(true);
  };

  const handleViewModalClose = () => {
    setIsViewModalVisible(false);
    setViewBranchUuid(undefined);
  };

  // Switch from View to Edit
  const handleSwitchToEdit = () => {
    const uuid = viewBranchUuid;
    handleViewModalClose();
    setTimeout(() => {
      if (uuid) {
        handleEditClick(uuid);
      }
    }, 100);
  };

  const handleDelete = (uuid: string) => {
    setDeleteUuid(uuid);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteMultipleClick = () => {
    if (selectedRowKeys.length === 0) {
      toast.error("Please select branches to delete.");
      return;
    }

    // Check if any selected branch is default
    const selectedBranches = tableData.filter((branch) =>
      selectedRowKeys.includes(branch.uuid)
    );
    const defaultBranches = selectedBranches.filter(
      (branch) => branch.isDefault === 'yes'
    );

    if (defaultBranches.length > 0) {
      toast.error(
        `Cannot delete default branch(es): ${defaultBranches.map((b) => b.name).join(', ')}. Please set another branch as default first.`
      );
      return;
    }

    setIsDeleteModalMultipleVisible(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await deleteSpecificBranch(deleteUuid).unwrap();
      toast.success(`${response?.message || "Branch deleted successfully"}`);
      await refetch();
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
    setIsDeleteModalVisible(false);
    setDeleteUuid(null);
  };

  const cancelDelete = () => {
    setIsDeleteModalVisible(false);
    setDeleteUuid(null);
    setIsDeleteModalMultipleVisible(false);
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<DataType> | undefined = hasPermissionForSlug("delete-branch") ? {
    selectedRowKeys,
    onChange: onSelectChange,
    getCheckboxProps: (record) => ({
      disabled: record.isDefault === 'yes',
      name: record.name,
    }),
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  } : undefined;

  const baseColumns: TableColumnsType<DataType> = [
    {
      title: "Branch Name",
      dataIndex: "name",
      key: "name",
      filterDropdown: ({ setSelectedKeys, confirm, selectedKeys }) => (
        <div className="p-2">
          <Input
            value={selectedKeys[0]}
            onChange={(e) => {
              setSelectedKeys(e.target.value ? [e.target.value] : []);
              confirm({ closeDropdown: false });
            }}
            onPressEnter={() => confirm()}
            onBlur={() => confirm()}
          />
          <button onClick={() => confirm()} className="primary-btn !py-1 mt-2">
            Search
          </button>
        </div>
      ),
      filterIcon: () => <SearchOutlined />,
      onFilter: (value, record) =>
        record.name.toLowerCase().includes(String(value).toLowerCase()),
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortOrder: sortedInfo.columnKey === "name" ? sortedInfo.order : null,
      ellipsis: true,
      render: (text: string, record: any) => (
        <Tooltip title={text}>
          {hasPermissionForSlug("view-branch") ? (
            <button
              onClick={() => handleViewClick(record.uuid)}
              className="hover:text-blue-600 cursor-pointer hover:underline text-left"
            >
              {text?.length > 40 ? `${text?.slice(0, 40)}...` : text}
            </button>
          ) : (
            <span>{text?.length > 40 ? `${text?.slice(0, 40)}...` : text}</span>
          )}
        </Tooltip>
      ),
    },
    {
      title: "Location",
      key: "location",
      render: (_, record) => {
        const locationParts = [record.city?.name, record.state?.name].filter(
          Boolean
        );
        return locationParts.length > 0 ? locationParts.join(", ") : "N/A";
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => (a.email || "").localeCompare(b.email || ""),
      sortOrder: sortedInfo.columnKey === "email" ? sortedInfo.order : null,
      render: (email) => email || "N/A",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (phone) => phone || "N/A",
    },
    {
      title: "Lat / Long",
      key: "latlong",
      render: (_: any, record: DataType) => {
        const s = record.clockInOutSettings?.[0];
        if (!s?.latitude && !s?.longitude) return <span className="text-gray-400">N/A</span>;
        return (
          <span className="text-xs font-mono">
            {s.latitude ?? "—"}, {s.longitude ?? "—"}
          </span>
        );
      },
    },
    {
      title: "Office Hours",
      key: "officeHours",
      render: (_: any, record: DataType) => {
        const s = record.clockInOutSettings?.[0];
        if (!s?.officeHoursWeekdayEnd && !s?.officeHoursWeekendEnd) return <span className="text-gray-400">N/A</span>;
        const parts = [];
        if (s.officeHoursWeekdayStart && s.officeHoursWeekdayEnd)
          parts.push(`Wkday: ${s.officeHoursWeekdayStart}–${s.officeHoursWeekdayEnd}`);
        if (s.officeHoursWeekendStart && s.officeHoursWeekendEnd)
          parts.push(`Wkend: ${s.officeHoursWeekendStart}–${s.officeHoursWeekendEnd}`);
        return <span className="text-xs whitespace-nowrap">{parts.join(' | ')}</span>;
      },
    },
  ];

  const superAdminColumns: TableColumnsType<DataType> = isSuperAdmin ? [
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      sorter: (a: any, b: any) => (a.status || "").localeCompare(b.status || ""),
      sortOrder: sortedInfo.columnKey === "status" ? sortedInfo.order : null,
      render: (status: any) => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status?.toUpperCase() || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Is Default",
      dataIndex: "isDefault",
      key: "isDefault",
      width: 120,
      align: "center" as const,
      sorter: (a: any, b: any) => (a.isDefault || "").localeCompare(b.isDefault || ""),
      sortOrder: sortedInfo.columnKey === "isDefault" ? sortedInfo.order : null,
      filters: [
        { text: "Yes", value: "yes" },
        { text: "No", value: "no" },
      ],
      onFilter: (value: any, record: any) => record.isDefault === value,
      render: (isDefault: any) => (
        <Tag color={isDefault === "yes" ? "blue" : "default"}>
          {isDefault === "yes" ? "Default" : "No"}
        </Tag>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      sortOrder: sortedInfo.columnKey === "createdAt" ? sortedInfo.order : null,
      render: (createdAt: any) => {
        if (!createdAt) return "No date";
        const date = parseISO(createdAt);
        return formatDate(date, "dd MMM yyyy");
      },
    },
  ] : [];

  const columns: TableColumnsType<DataType> = [
    ...baseColumns,
    ...superAdminColumns,
    {
      title: "Users",
      key: "users",
      width: 80,
      align: "center" as const,
      render: (_, record) => record._count?.users || 0,
    },
    {
      title: "Actions",
      dataIndex: "uuid",
      key: "actions",
      render: (uuid, record) => (
        <Dropdown
          menu={{
            items: [
              hasPermissionForSlug("edit-branch") && {
                key: "edit",
                label: (
                  <button
                    onClick={() => handleEditClick(uuid)}
                    className="flex items-center gap-2 w-full"
                  >
                    <FaRegEdit /> Edit
                  </button>
                ),
              },
              hasPermissionForSlug("view-branch") && {
                key: "view",
                label: (
                  <button
                    onClick={() => handleViewClick(uuid)}
                    className="flex items-center gap-2 w-full"
                  >
                    <FaEye /> View
                  </button>
                ),
              },
              hasPermissionForSlug("delete-branch") && record.isDefault !== 'yes' && {
                key: "delete",
                label: (
                  <button
                    onClick={() => handleDelete(uuid)}
                    className="flex items-center gap-2 w-full"
                  >
                    <MdDelete /> Delete
                  </button>
                ),
              },
            ].filter(Boolean) as ItemType[],
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

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteMultipleBranch(selectedRowKeys);
        setIsDeleteModalMultipleVisible(false);
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

  // Serial number in the table
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
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Branch List</h1>
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
          {hasPermissionForSlug("create-branch") && (
            <button onClick={handleCreateClick} className="primary-btn">Create New</button>
          )}
          {hasPermissionForSlug("delete-branch") && (
            <button onClick={handleDeleteMultipleClick} className="cancel-btn">Delete Selected</button>
          )}
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
      </div>

      {/* ========== CREATE MODAL ========== */}
      <Modal
        title="Create New Branch"
        open={isCreateModalVisible}
        onCancel={handleCreateModalClose}
        footer={null}
        width={680}
        destroyOnHidden
        styles={{ body: { paddingTop: 12 } }}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateSubmit} size="middle">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Basic</h3>
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item label="Branch Name" name="name" rules={[{ required: true }, { min: 2 }, { max: 100 }]} {...formItemLayout}>
                  <Input placeholder="Branch name" style={inputFullWidth} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Email" name="email" rules={[{ type: "email" }]} {...formItemLayout}>
                  <Input placeholder="branch@example.com" type="email" style={inputFullWidth} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="Phone" name="phone" rules={[{ pattern: /^[0-9+\-\s()]+$/ }]} {...formItemLayout}>
                  <Input placeholder="+1 234 567 8900" value={phoneNumber} onChange={handleChangePhoneNumber} style={inputFullWidth} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Location</h3>
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={8}>
                <Form.Item label="Province" name="stateId" rules={[{ required: true }]} {...formItemLayout}>
                  <Select placeholder="Province" showSearch optionFilterProp="children" onChange={() => form.setFieldValue("cityId", undefined)} style={inputFullWidth}>
                    {states?.data?.states?.map((state: any) => (
                      <Option key={state.id} value={state.id}>{state.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="City" name="cityId" {...formItemLayout}>
                  <Select placeholder="City" showSearch optionFilterProp="children" disabled={!selectedStateCreate} style={inputFullWidth}>
                    {citiesCreate?.data?.cities?.map((city: any) => (
                      <Option key={city.id} value={city.id}>{city.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="Postal Code" name="postalCode" {...formItemLayout}>
                  <Input placeholder="A1A 1A1" value={postalCode} onChange={handleChangePostalCode} style={inputFullWidth} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label="Address" name="address" {...formItemLayout}>
                  <TextArea placeholder="Street address" rows={3} maxLength={500} showCount style={inputFullWidth} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Clock In/Out (optional)</h3>
            <p className="text-xs text-gray-500 mb-3">Uses address above. Set coordinates &amp; allowed distance.</p>
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={8}>
                <Form.Item label="Latitude" name="clockInOutLatitude" rules={[{ type: "number", min: -90, max: 90 }]} {...formItemLayout}>
                  <InputNumber placeholder="43.7895" step={0.000001} precision={6} style={inputFullWidth} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="Longitude" name="clockInOutLongitude" rules={[{ type: "number", min: -180, max: 180 }]} {...formItemLayout}>
                  <InputNumber placeholder="-79.2304" step={0.000001} precision={6} style={inputFullWidth} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="Allowed (m)" name="clockInOutAllowedDistance" rules={[{ type: "number", min: 1 }]} {...formItemLayout}>
                  <InputNumber placeholder="100" min={1} step={10} style={inputFullWidth} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-1">Office Hours (optional)</h3>
            <p className="text-xs text-gray-500 mb-3">Users still clocked in past end time will be auto clocked out.</p>
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={6}>
                <Form.Item label="Weekday Start" name="officeHoursWeekdayStart" {...formItemLayout}>
                  <Input placeholder="11:00" style={inputFullWidth} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item label="Weekday End" name="officeHoursWeekdayEnd" {...formItemLayout}>
                  <Input placeholder="19:00" style={inputFullWidth} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item label="Weekend Start" name="officeHoursWeekendStart" {...formItemLayout}>
                  <Input placeholder="12:00" style={inputFullWidth} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item label="Weekend End" name="officeHoursWeekendEnd" {...formItemLayout}>
                  <Input placeholder="20:00" style={inputFullWidth} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button onClick={handleCreateModalClose} size="middle">Cancel</Button>
            <Button htmlType="submit" loading={isSaving} className="primary-btn" size="middle">Create Branch</Button>
          </div>
        </Form>
      </Modal>

      {/* ========== EDIT MODAL ========== */}
      <Modal
        title="Edit Branch"
        open={isEditModalVisible}
        onCancel={handleEditModalClose}
        footer={null}
        width={680}
        destroyOnHidden
        styles={{ body: { paddingTop: 12 } }}
      >
        {isFetchingEditBranch ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Form form={form} layout="vertical" onFinish={handleEditSubmit} size="middle">
            <Form.Item name="slug" hidden><input type="hidden" /></Form.Item>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Basic</h3>
              <Row gutter={[16, 0]}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Branch Name" name="name" rules={[{ required: true }, { min: 2 }, { max: 100 }]} {...formItemLayout}>
                    <Input placeholder="Branch name" style={inputFullWidth} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Email" name="email" rules={[{ type: "email" }]} {...formItemLayout}>
                    <Input placeholder="branch@example.com" type="email" style={inputFullWidth} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Phone" name="phone" rules={[{ pattern: /^[0-9+\-\s()]+$/ }]} {...formItemLayout}>
                    <Input placeholder="+1 234 567 8900" value={phoneNumber} onChange={handleChangePhoneNumber} style={inputFullWidth} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Status" name="status" rules={[{ required: true }]} {...formItemLayout}>
                    <Select placeholder="Status" style={inputFullWidth}>
                      <Option value="active">Active</Option>
                      <Option value="deactive">Deactive</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Location</h3>
              <Row gutter={[16, 0]}>
                <Col xs={24} sm={8}>
                  <Form.Item label="Province" name="stateId" rules={[{ required: true }]} {...formItemLayout}>
                    <Select placeholder="Province" showSearch optionFilterProp="children" onChange={() => form.setFieldValue("cityId", undefined)} style={inputFullWidth}>
                      {states?.data?.states?.map((state: any) => (
                        <Option key={state.id} value={state.id}>{state.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item label="City" name="cityId" {...formItemLayout}>
                    <Select placeholder="City" showSearch optionFilterProp="children" disabled={!selectedStateEdit} style={inputFullWidth}>
                      {citiesEdit?.data?.cities?.map((city: any) => (
                        <Option key={city.id} value={city.id}>{city.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item label="Postal Code" name="postalCode" {...formItemLayout}>
                    <Input placeholder="A1A 1A1" value={postalCode} onChange={handleChangePostalCode} style={inputFullWidth} />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label="Address" name="address" {...formItemLayout}>
                    <TextArea placeholder="Street address" rows={3} maxLength={500} showCount style={inputFullWidth} />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Clock In/Out (optional)</h3>
              <p className="text-xs text-gray-500 mb-3">Uses branch address. Set coordinates &amp; allowed distance.</p>
              <Row gutter={[16, 0]}>
                <Col xs={24} sm={8}>
                  <Form.Item label="Latitude" name="clockInOutLatitude" rules={[{ type: "number", min: -90, max: 90 }]} {...formItemLayout}>
                    <InputNumber placeholder="43.7895" step={0.000001} precision={6} style={inputFullWidth} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item label="Longitude" name="clockInOutLongitude" rules={[{ type: "number", min: -180, max: 180 }]} {...formItemLayout}>
                    <InputNumber placeholder="-79.2304" step={0.000001} precision={6} style={inputFullWidth} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item label="Allowed (m)" name="clockInOutAllowedDistance" rules={[{ type: "number", min: 1 }]} {...formItemLayout}>
                    <InputNumber placeholder="100" min={1} step={10} style={inputFullWidth} />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Office Hours (optional)</h3>
              <p className="text-xs text-gray-500 mb-3">Users still clocked in past end time will be auto clocked out.</p>
              <Row gutter={[16, 0]}>
                <Col xs={24} sm={6}>
                  <Form.Item label="Weekday Start" name="officeHoursWeekdayStart" {...formItemLayout}>
                    <Input placeholder="11:00" style={inputFullWidth} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={6}>
                  <Form.Item label="Weekday End" name="officeHoursWeekdayEnd" {...formItemLayout}>
                    <Input placeholder="19:00" style={inputFullWidth} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={6}>
                  <Form.Item label="Weekend Start" name="officeHoursWeekendStart" {...formItemLayout}>
                    <Input placeholder="12:00" style={inputFullWidth} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={6}>
                  <Form.Item label="Weekend End" name="officeHoursWeekendEnd" {...formItemLayout}>
                    <Input placeholder="20:00" style={inputFullWidth} />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button onClick={handleEditModalClose} size="middle">Cancel</Button>
              <Button type="primary" htmlType="submit" loading={isSaving} size="middle">Update Branch</Button>
            </div>
          </Form>
        )}
      </Modal>

      {/* ========== VIEW MODAL ========== */}
      <Modal
        title="Branch Details"
        open={isViewModalVisible}
        onCancel={handleViewModalClose}
        footer={[
          <Button key="close" onClick={handleViewModalClose} size="large">
            Close
          </Button>,
          hasPermissionForSlug("edit-branch") && (
            <Button
              key="edit"
              // type="primary"
              onClick={handleSwitchToEdit}
              size="large"
              className="primary-btn"
            >
              Edit Branch
            </Button>
          ),
        ]}
        width={800}
      >
        {isFetchingViewBranch ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          viewBranchData?.data?.branchData && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                  Basic Information
                </h3>
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Branch Name" span={2}>
                    <span className="font-medium text-lg">
                      {viewBranchData.data.branchData.name}
                    </span>
                  </Descriptions.Item>

                  <Descriptions.Item label="Status">
                    <Tag
                      color={
                        viewBranchData.data.branchData.status === "active"
                          ? "green"
                          : "red"
                      }
                    >
                      {viewBranchData.data.branchData.status?.toUpperCase() ||
                        "N/A"}
                    </Tag>
                  </Descriptions.Item>

                  <Descriptions.Item label="Email">
                    {viewBranchData.data.branchData.email || "N/A"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Phone" span={2}>
                    {viewBranchData.data.branchData.phone || "N/A"}
                  </Descriptions.Item>
                </Descriptions>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                  Location Information
                </h3>
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Address" span={2}>
                    {viewBranchData.data.branchData.address || "N/A"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Province">
                    {viewBranchData.data.branchData.state?.name || "N/A"}
                  </Descriptions.Item>

                  <Descriptions.Item label="City">
                    {viewBranchData.data.branchData.city?.name || "N/A"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Postal Code">
                    {viewBranchData.data.branchData.postalCode || "N/A"}
                  </Descriptions.Item>

                  <Descriptions.Item label="Country">
                    {viewBranchData.data.branchData.country?.countryName ||
                      "Canada"}
                  </Descriptions.Item>
                </Descriptions>
              </div>

              {viewBranchData.data.branchData.clockInOutSettings?.[0] && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">
                    Clock In/Out & Office Hours
                  </h3>
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="Latitude">
                      {viewBranchData.data.branchData.clockInOutSettings[0].latitude ?? "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Longitude">
                      {viewBranchData.data.branchData.clockInOutSettings[0].longitude ?? "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Allowed distance">
                      {viewBranchData.data.branchData.clockInOutSettings[0].allowedDistance ?? "N/A"} m
                    </Descriptions.Item>
                    <Descriptions.Item label="Weekday Hours">
                      {viewBranchData.data.branchData.clockInOutSettings[0].officeHoursWeekdayStart && viewBranchData.data.branchData.clockInOutSettings[0].officeHoursWeekdayEnd
                        ? `${viewBranchData.data.branchData.clockInOutSettings[0].officeHoursWeekdayStart} – ${viewBranchData.data.branchData.clockInOutSettings[0].officeHoursWeekdayEnd}`
                        : "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Weekend Hours">
                      {viewBranchData.data.branchData.clockInOutSettings[0].officeHoursWeekendStart && viewBranchData.data.branchData.clockInOutSettings[0].officeHoursWeekendEnd
                        ? `${viewBranchData.data.branchData.clockInOutSettings[0].officeHoursWeekendStart} – ${viewBranchData.data.branchData.clockInOutSettings[0].officeHoursWeekendEnd}`
                        : "N/A"}
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              )}

              {viewBranchData.data.branchData._count && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">
                    Statistics
                  </h3>
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="Total Users">
                      {viewBranchData.data.branchData._count.users}
                    </Descriptions.Item>

                    <Descriptions.Item label="Trade Sheets">
                      {viewBranchData.data.branchData._count.tradeSheets}
                    </Descriptions.Item>

                    <Descriptions.Item label="Campaigns">
                      {viewBranchData.data.branchData._count.campaigns}
                    </Descriptions.Item>

                    <Descriptions.Item label="Property Listings">
                      {viewBranchData.data.branchData._count.propertyListings}
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              )}
            </div>
          )
        )}
      </Modal>

      {/* ========== DELETE CONFIRMATION MODAL ========== */}
      <Modal
        title="Confirm Deletion"
        open={isDeleteModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button key="cancel" onClick={cancelDelete}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={confirmDelete}
            style={{ marginLeft: "8px" }}
          >
            Confirm
          </Button>,
        ]}
      >
        <p>Are you sure you want to delete this branch?</p>
      </Modal>

      {/* ========== DELETE MULTIPLE CONFIRMATION MODAL ========== */}
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
        Are you sure you want to delete selected branches?
      </Modal>
    </div>
  );
};

export default BranchList;
