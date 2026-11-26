/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useEffect, useState } from "react";
import type { TableColumnsType, TableProps } from "antd";
import { useForm } from "react-hook-form";
import { Table, Modal, Button, Dropdown, Space, Tooltip, Tabs, Input } from "antd";
import {
  useGetBrokerageDataQuery,
  useCreateBrokerageDataMutation,
  useUpdateBrokerageDataMutation,
  useDeleteBrokerageDataMutation,
  useDeleteBrokerageDataMultipleMutation,
  useValidateBrokerageDataMutation,
} from "../../../../../redux/api/superadmin/brokerageDataSlice";

import { FaRegEdit, FaSearch, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import toast from "react-hot-toast";
import {
  useGetCitiesQuery,
  // useGetCountriesQuery,
  useGetStatesQuery,
} from "../../../../../redux/api/common/countryStateCitySlice";
import TableLoader from "../../../../../components/loader/TableLoader";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  formatPhoneNumber,
  formatPostalCode,
} from "../../../../../utils/format";
import { usePermissions } from "../../../../../utils/permissionUtils";
import dayjs from 'dayjs';
import Select from 'react-select';
import {
  useCreateAgentMutation,
  useDeleteSingleAgentMutation
} from '../../../../../redux/api/superadmin/agent/agentManagementSlice';
import { Link, NavLink } from "react-router-dom";
import TradeSheetSeparatePreviewPage from "../../../../agent/dashboard/pages/form/trade-sheet/TradeSheetSeparatePreviewPage";
import { useAppSelector } from "../../../../../redux/hooks";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface DataType {
  key?: React.Key;
  brokerageName: string;
  address: string;
  streetAddress: string;
  streetAddressLine2: string;
  countryId: string;
  stateId: string;
  cityId: string;
  postalZipCode: string;
  phoneNumber: string;
  faxNumber: string;
  uuid: string;
  country: object;
  state: {
    name: string;
  };
  city: {
    name: string;
  };
}

// Custom Brokerage Details Modal (brokarage-style)
const BrokerageDetailsModal = ({ open, onClose, brokerage, onAddAgent, onRefetch  }) => {
  const [selectedTab, setSelectedTab] = useState('details');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentSearchText, setAgentSearchText] = useState('');
  const [isModalPreviewTradeSheetVisible, setIsModalPreviewTradeSheetVisible] =
      useState(false);
  const [selectedTradeData, setSelectedTradeData] = useState(null);
  const { user } = useAppSelector((state) => state.user);
  
  // Agent edit/delete states
  const [isDeleteAgentModalOpen, setIsDeleteAgentModalOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState(null);

  const [deleteSingleAgent, { isLoading: isDeletingAgent }] = useDeleteSingleAgentMutation();

  // Handle delete agent
  const handleDeleteAgent = (agent) => {
    setAgentToDelete(agent);
    setIsDeleteAgentModalOpen(true);
  };

  const confirmDeleteAgent = async () => {
  if (!agentToDelete) return;
  
  try {
    const response = await deleteSingleAgent(agentToDelete?.user?.uuid).unwrap();
    if (response?.status) {
      setIsDeleteAgentModalOpen(false);
      setAgentToDelete(null);
      toast.success('Agent deleted successfully!');
      // Trigger refetch to update the data
      if (onRefetch) {
        await onRefetch();
      }
    }
  } catch (error) {
    toast.error(error?.data?.message || 'Failed to delete agent');
  }
};

  if (!brokerage) return null;
  
  return (
    open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
          <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={onClose}><FaTimes /></button>
          <div className="flex items-center justify-between  mb-4">
            <Tabs
              activeKey={selectedTab}
              onChange={setSelectedTab}
              className="custom-tabs"
              style={{ marginBottom: 0 }}
            >
              <Tabs.TabPane tab="Details" key="details" />
              <Tabs.TabPane tab="Agents" key="agents" />
              { user.userType === 'superAdmin' &&(
                <Tabs.TabPane tab="Trade Sheets" key="tradeSheets" />
              )}
              
            </Tabs>


            {selectedTab === 'agents' && (
              <div className="flex gap-3" >
                <Input
                  placeholder="Search agents..."
                  value={agentSearchText}
                  onChange={(e) => setAgentSearchText(e.target.value)}
                  className="text-base"
                  allowClear
                />
                <button className="primary-btn w-full " onClick={onAddAgent}>
                  Add Agent
                </button>

              </div>
            )}
          </div>
          {/* Tab content rendering logic */}
          {selectedTab === 'details' && (
            <table className="min-w-full border ">
              <thead>
                <tr>
                  <th colSpan={2} className="w-full font-semibold p-2 border bg-[#243451] text-white text-center">Brokerage Details</th>
                </tr>
              </thead>
              <tbody className="text-[11px]">
                <tr><td className="p-2 border font-semibold">Name</td><td className="p-2 border">{brokerage.brokerageName}</td></tr>
                <tr><td className="p-2 border font-semibold">Address</td><td className="p-2 border">{brokerage.address}</td></tr>
                <tr><td className="p-2 border font-semibold">Street Address</td><td className="p-2 border">{brokerage.streetAddress}</td></tr>
                <tr><td className="p-2 border font-semibold">City</td><td className="p-2 border">{brokerage.city?.name}</td></tr>
                <tr><td className="p-2 border font-semibold">State</td><td className="p-2 border">{brokerage.state?.name}</td></tr>
                <tr><td className="p-2 border font-semibold">Country</td><td className="p-2 border">{brokerage.country?.countryName}</td></tr>
                <tr><td className="p-2 border font-semibold">Postal Code</td><td className="p-2 border">{brokerage.postalZipCode}</td></tr>
                <tr><td className="p-2 border font-semibold">Phone</td><td className="p-2 border">{brokerage.phoneNumber}</td></tr>
                <tr><td className="p-2 border font-semibold">Fax</td><td className="p-2 border">{brokerage.faxNumber || 'N/A'}</td></tr>
                <tr><td className="p-2 border font-semibold">Billing Email</td><td className="p-2 border">{brokerage.billingEmailAddress || 'N/A'}</td></tr>
                <tr><td className="p-2 border font-semibold">Created At</td><td className="p-2 border">{brokerage.createdAt ? dayjs(brokerage.createdAt).format('DD MMMM YYYY, hh:mm A') : ''}</td></tr>
              </tbody>
            </table>
          )}
          {selectedTab === 'agents' && (
            <div className="flex gap-6 w-full" style={{ minHeight: 400 }}>
              {/* Sidebar */}
              <div className="w-2/5 border-r pr-1">
                {/* Search Input */}

                <div className="max-h-[400px] overflow-y-auto">
                  <ul className="divide-y divide-gray-200">
                    {brokerage.agentData?.length > 0 ?
                      brokerage.agentData
                        .filter((agent) => {
                          const searchTerm = agentSearchText.toLowerCase();
                          const agentName = `${agent.firstName} ${agent.lastName}`.toLowerCase();
                          const agentEmail = agent.email?.toLowerCase() || '';
                          return agentName.includes(searchTerm) || agentEmail.includes(searchTerm);
                        })
                        .map((agent) => (
                          <li key={agent.id} className={`py-2 cursor-pointer ${selectedAgent?.id === agent.id ? 'bg-blue-50 font-bold' : ''}`}>
                            <div
                              onClick={() => setSelectedAgent(agent)}
                              className="hover:text-blue-600 p-1 rounded-md"
                            >
                              <div className="flex justify-between items-center">
                                <span>
                                  {agent.firstName} {agent.lastName}
                                </span>
                                {user.userType === 'superAdmin' && (
                                  <div className="flex gap-1">
                                  <Link
                                    to={`/dashboard/super-admin/agent-create/${agent.user?.uuid}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-blue-600 hover:text-blue-800 text-xs p-1"
                                  >
                                    Edit
                                  </Link>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAgent(agent);
                                    }}
                                    className="text-red-600 hover:text-red-800 text-xs p-1"
                                  >
                                    Delete
                                  </button>
                                </div>
                                )}
                                
                              </div>
                              <div className="text-xs text-gray-500">{agent.email}</div>
                            </div>
                          </li>
                        ))
                      : <li className="text-gray-500">No agents found for this brokerage.</li>}
                  </ul>
                </div>
              </div>
              {/* Main Area */}
              <div className="w-3/5">
                {selectedAgent ? (
                  <table className="min-w-full border text-[11px]">
                    <thead>
                      <tr>
                        <th colSpan={2} className="w-full font-semibold p-2 border bg-[#243451] text-white text-center">Agent Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="p-2 border font-semibold">Name</td><td className="p-2 border">{selectedAgent.firstName} {selectedAgent.lastName}</td></tr>
                      <tr><td className="p-2 border font-semibold">Email</td><td className="p-2 border">{selectedAgent.email}</td></tr>
                      <tr><td className="p-2 border font-semibold">Cell Phone</td><td className="p-2 border">{selectedAgent.cellPhone}</td></tr>
                      <tr><td className="p-2 border font-semibold">Created At</td><td className="p-2 border">{selectedAgent.createdAt ? dayjs(selectedAgent.createdAt).format('DD MMMM YYYY, hh:mm A') : ''}</td></tr>
                    </tbody>
                  </table>
                ) : (
                  <div className="text-gray-500">Select an agent to view details.</div>
                )}
              </div>
            </div>
          )}
            {selectedTab === 'tradeSheets' && (
              <div className="mt-4">
                <table className="min-w-full border text-[11px] text-left">
                  <thead>
                    <tr>
                      <th className="p-2 border bg-[#243451] text-white">Trade Record</th>
                      <th className="p-2 border bg-[#243451] text-white">Agent</th>
                      <th className="p-2 border bg-[#243451] text-white">Admin Status</th>
                      <th className="p-2 border bg-[#243451] text-white">Trade Status</th>
                      <th className="p-2 border bg-[#243451] text-white">Representation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Combine buyer and seller agent details and remove duplicates */}
                    {[...(brokerage.buyerAgentDetails || []), ...(brokerage.sellerAgentDetails || [])]
                      .filter((detail, index, self) => 
                        index === self.findIndex(d => d.tradeSheet?.id === detail.tradeSheet?.id)
                      )
                      .map((detail) => (
                        <tr key={detail.id}>
                          <td className="p-2 border">
                            <button 
                              onClick={() => { 
                                setIsModalPreviewTradeSheetVisible(true); 
                                setSelectedTradeData(detail.tradeSheet);
                              }}
                              style={{
                                color:
                                  detail.tradeSheet?.status === "rejected"
                                    ? "red"
                                    : detail.tradeSheet?.status === "underReview"
                                      ? "#eb9715"
                                      : "",
                              }}
                              className="bg-transparent border-none p-0 text-inherit hover:text-blue-600 hover:underline cursor-pointer"
                            >
                              {detail.tradeSheet?.tradeSheetTypeId || 'N/A'}
                            </button>
                          </td>
                          <td className="p-2 border">
                            {detail.buyerFirstName && detail.buyerLastName 
                              ? `${detail.buyerFirstName} ${detail.buyerLastName}`
                              : detail.sellerFirstName && detail.sellerLastName
                                ? `${detail.sellerFirstName} ${detail.sellerLastName}`
                                : 'N/A'
                            }
                          </td>
                          <td className="p-2 border capitalize">
                            {detail.tradeSheet?.status?.replace(/([A-Z])/g, ' $1').toLowerCase() || 'N/A'}
                          </td>
                          <td className="p-2 border capitalize">
                            {detail.tradeSheet?.tradeStatus || 'N/A'}
                          </td>
                          <td className="p-2 border capitalize">
                            {detail.tradeSheet?.representation || 'N/A'}
                          </td>
                        </tr>
                      ))
                    }
                    {(!brokerage.buyerAgentDetails?.length && !brokerage.sellerAgentDetails?.length) && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-500">
                          No trade sheets found for this brokerage
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                 {/* Tradesheet Preview page */}
                        <Modal
                          title="Tradesheet Preview page"
                          open={isModalPreviewTradeSheetVisible}
                          onCancel={() => setIsModalPreviewTradeSheetVisible(false)}
                          width={1300}
                          footer={[
                            <Button
                              key="cancel"
                              onClick={() => setIsModalPreviewTradeSheetVisible(false)}
                            >
                              Close
                            </Button>,
                          ]}
                        >
                          <div>
                            <TradeSheetSeparatePreviewPage uuid={selectedTradeData?.uuid} />
                          </div>
                        </Modal>
              </div>
            )}

          {/* Delete Agent Confirmation Modal */}
          <Modal
            title="Confirm Delete Agent"
            open={isDeleteAgentModalOpen}
            onCancel={() => {
              setIsDeleteAgentModalOpen(false);
              setAgentToDelete(null);
            }}
            footer={[
              <Button key="cancel" onClick={() => {
                setIsDeleteAgentModalOpen(false);
                setAgentToDelete(null);
              }}>
                Cancel
              </Button>,
              <Button
                key="confirm"
                type="primary"
                danger
                onClick={confirmDeleteAgent}
                loading={isDeletingAgent}
              >
                Confirm Delete
              </Button>,
            ]}
          >
            <p>Are you sure you want to delete agent: <strong>{agentToDelete?.firstName} {agentToDelete?.lastName}</strong>?</p>
            <p className="text-red-500 mt-2">This action cannot be undone.</p>
          </Modal>
        </div>
      </div>
    )
  );
};

const BrokerageData = () => {
  const { hasPermissionForSlug } = usePermissions();
  const { user } = useAppSelector((state) => state.user);
  
  const [tableData, setTableData] = useState<DataType[]>([]);
  const { data, isLoading, refetch } = useGetBrokerageDataQuery("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [postalCode, setPostalCode] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [deleteMultipleBrokerageData] =
    useDeleteBrokerageDataMultipleMutation();
  const [selectedBrokerage, setSelectedBrokerage] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [cellPhone, setCellPhone] = useState("");



  // Agent creation modal state
  const [isCreateAgentModalOpen, setIsCreateAgentModalOpen] = useState(false);
  const createAgentForm = useForm();
  const [createAgent, { isLoading: isCreatingAgent }] = useCreateAgentMutation();

  // Brokerage options for the select
  const brokerageOptions =
    data?.data?.brokerageData?.map((brokerage) => ({
      value: brokerage?.id,
      label: brokerage?.brokerageName,
    })) || [];

  const handleCreateAgent = async (data) => {
    try {
      const response = await createAgent(data).unwrap();
      if (response?.status) {
        setIsCreateAgentModalOpen(false);
        createAgentForm.reset();
        setCellPhone("");
        toast.success('Agent created successfully!');
        // Add new agent to selectedBrokerage.agentData
        await refetch();
       /*  if (selectedBrokerage) {
          const newAgent = response.data.agentData;
          setSelectedBrokerage({
            ...selectedBrokerage,
            agentData: [...(selectedBrokerage.agentData || []), newAgent]
          });
          // Update the main tableData list
          setTableData(prev =>
            prev.map(b =>
              b.id === selectedBrokerage.id
                ? { ...b, agentData: [...(b.agentData || []), newAgent] }
                : b
            )
          );
        } */
      }
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to create agent or refetch data');
    }
  };

  // Handler to open Add Agent modal and set brokerageId
  const handleAddAgent = () => {
    setIsCreateAgentModalOpen(true);
    createAgentForm.setValue('brokerageId', selectedBrokerage?.id);
  };

  useEffect(() => {
  if (data?.data?.brokerageData) {
    setTableData(data.data.brokerageData);
    // Update selectedBrokerage with fresh data when refetch happens
    if (selectedBrokerage) {
      const updatedBrokerage = data.data.brokerageData.find(
        (b: any) => b.id === selectedBrokerage.id
      );
      if (updatedBrokerage) {
        setSelectedBrokerage(updatedBrokerage);
      }
    }
  }
}, [data]);

  const [searchText, setSearchText] = useState("");
  const [brokerageNameFilter, setBrokerageNameFilter] = useState("");

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();
    const brokerageNameTerm = brokerageNameFilter?.toLowerCase();

    // Filter by brokerage name if filter is set
    if (brokerageNameTerm && !record.brokerageName?.toLowerCase().includes(brokerageNameTerm)) {
      return false;
    }

    // If no general search term, only apply brokerage name filter
    if (!searchTerm) {
      return true;
    }

    const inProperties1 = Object.values(record.country || {}).some((data) =>
      String(data).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const inProperties2 = Object.values(record.state || {}).some((data) =>
      String(data).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const inProperties3 = Object.values(record.city || {}).some((data) =>
      String(data).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return inProperties1 || inProperties2 || inProperties3 || inRecord;
  });

  const {
    register,
    formState: { errors },
    reset,
    getValues,
    setError,
    handleSubmit,
    watch,
    setValue,
  } = useForm<DataType>({ defaultValues: { countryId: "39" } }); // Specify DataType for better type safety

  const [validateBrokerageData] = useValidateBrokerageDataMutation();
  const [createBrokerageData] = useCreateBrokerageDataMutation();
  const [updateBrokerageData] = useUpdateBrokerageDataMutation();
  const [deleteBrokerageData] = useDeleteBrokerageDataMutation();

  const handleCancelValidation = () => {
    setIsValidationModalOpen(false);
    reset({
      phoneNumber: "",
      address: "",
    });
  };

  const onSubmitValidation = async () => {
    setIsUploading(true);
    const data = getValues();

    try {
      const response = (await validateBrokerageData(data)) as any;

      if (response?.error?.data?.status == false) {
        setIsUploading(false);
        response.error.data.errors
          ? response.error.data.errors.forEach((error: any) => {
            setError(error.path, {
              type: "manual",
              message: error.msg,
            });
          })
          : toast.error(`${response?.error.data?.message}`);
      } else if (response?.data?.status == true) {
        setIsUploading(false);
        setIsValidationModalOpen(false);
        setIsModalOpen(true);
      } else {
        setIsUploading(false);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedUUID(null);
  };

  const resetForm = () => {
    reset({
      brokerageName: "",
      address: "",
      streetAddress: "",
      streetAddressLine2: "",
      countryId: "39",
      cityId: "",
      stateId: "",
      postalZipCode: "",
      phoneNumber: "",
      faxNumber: "",
    });
  };

  const handleEdit = (record: DataType) => {
    reset(record);
    setPostalCode(record.postalZipCode);
    setValue("stateId", record.stateId);
    setIsEditMode(true);
    setSelectedUUID(record.uuid);
    showModal();
  };

  const confirmDelete = async () => {
    if (!selectedUUID) return; // Add check to avoid undefined

    try {
      const response = await deleteBrokerageData(selectedUUID).unwrap();
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
    setSelectedUUID(uuid);
    setIsModalVisible(true);
  };

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

  const selectedCountry = watch("countryId");
  const selectedState = watch("stateId");
  const selectedCity = watch("cityId");

  // Fetch countries
  // const { data: countries } = useGetCountriesQuery({});

  // Fetch states based on selected country
  const { data: states = [] } = useGetStatesQuery(selectedCountry, {
    skip: !selectedCountry, // Skip if no country is selected
  });

  // Fetch cities based on selected state
  const { data: cities = [] } = useGetCitiesQuery(selectedState, {
    skip: !selectedState, // Skip if no state is selected
  });

  const onSubmit = async () => {
    setIsUploading(true);
    const data = getValues();

    if (isEditMode) {
      try {
        if (!selectedUUID) {
          throw new Error("UUID is null");
        }
        const response = (await updateBrokerageData({
          uuid: selectedUUID,
          data,
        })) as any;

        if (response?.error?.data?.status == false) {
          response.error.data.errors.forEach((error: any) => {
            setError(error.path, {
              type: "manual",
              message: error.msg,
            });
          });
          setIsUploading(false);
        } else if (response?.data?.status == true) {
          toast.success(`${response?.data?.message}`);
          setIsModalOpen(false);
          setIsEditMode(false);
          setSelectedUUID(null);
          resetForm();
          setIsUploading(false);
        } else {
          resetForm();
          setIsEditMode(false);
          setIsUploading(false);
        }
      } catch (error) {
        toast.error("Update failed. Something went wrong!");
        console.error("Update error:", error);
        setIsUploading(false);
      }
    } else {
      try {
        const response = (await createBrokerageData(data)) as any;

        if (response?.error?.data?.status == false) {
          setIsUploading(false);
          response.error.data.errors
            ? response.error.data.errors.forEach((error: any) => {
              setError(error.path, {
                type: "manual",
                message: error.msg,
              });
            })
            : toast.error(`${response?.error.data?.message}`);
        } else if (response?.data?.status == true) {
          toast.success(`${response?.data?.message}`);
          setIsModalOpen(false);
          resetForm();
          setIsUploading(false);
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

  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true); // Show delete confirmation modal
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteMultipleBrokerageData(selectedRowKeys);
        setIsDeleteModalMultipleVisible(false);
        // Ensure the refetch waits for the data to be refreshed
        await refetch();
        if (response.data.status == true) {
          setSelectedRowKeys([]);
          toast.success("Announcement deleted successfully!");
        } else {
          toast.error("Failed to delete announcement. Please try again.");
        }
      } catch (error) {
        setIsDeleteModalMultipleVisible(false);
        toast.error("Failed to delete announcement. Please try again.");
      }
    } else {
      toast.error("Please Select Items.");
    }
  };

  // Replace the calculateUniqueTradeSheets function
function calculateUniqueTradeSheets(record) {
  const buyerTradeSheets = record.buyerAgentDetails?.map(item => item.tradeSheet?.id) || [];
  const sellerTradeSheets = record.sellerAgentDetails?.map(item => item.tradeSheet?.id) || [];
  const allTradeSheets = [...buyerTradeSheets, ...sellerTradeSheets];
  return new Set(allTradeSheets.filter(id => id !== undefined && id !== null)).size;
}

  const columns: TableColumnsType<DataType> = [
    {
      title: "#",
      key: "serial",
      width: 50,
      dataIndex: "serial",
      fixed: "left",
    },
    {
      title: "Brokerage Name",
      dataIndex: "brokerageName",
      key: "brokerageName",
      sorter: (a, b) => a.brokerageName.localeCompare(b.brokerageName),
      ellipsis: true,
      render: (text: string, record: any) => (
        <Tooltip title={text}>
          <button
            onClick={() => { setSelectedBrokerage(record); setIsDetailsModalOpen(true); }}
            className="hover:text-blue-600 cursor-pointer hover:underline"
          >
            {text?.length > 30 ? `${text?.slice(0, 30)}...` : text} 
          </button>
          {user.userType === 'superAdmin' ? (
            <>
            <Link to={'/dashboard/super-admin/agent-management?brokerageId=' + record.id}
            className="hover:text-blue-600 cursor-pointer hover:underline"
          >
            (A:{record.agentData?.length ?? 0}),
          </Link>
          <Link to={'/dashboard/agent/pages/form/trade-sheet/my-submission-trade-list?brokerageId=' + record.id}
            className="hover:text-blue-600 cursor-pointer hover:underline"
          >
            (T:{calculateUniqueTradeSheets(record)})
          </Link>
            </>
          ):(
            <>
            <span className="ml-2">(A:{record.agentData?.length ?? 0})</span>
            <span className="ml-2">(T:{calculateUniqueTradeSheets(record)})</span>
            </>
          )}
          
        </Tooltip>
      ),
    },
    {
      title: "Address",
      key: "address", 
      render: (_, record) => {
        const address = record.address || "--";
        const streetAddress = record.streetAddress
          ? `, ${record.streetAddress}`
          : "";
        const city = record.city.name ? `, ${record.city.name}` : "";
        const state = record.state.name ? `, ${record.state.name}` : "";
        const postalZipCode = record.postalZipCode
          ? `, ${record.postalZipCode}`
          : "";
        return `${address}${streetAddress}${city}${state}${postalZipCode}`;
      },
    },

    {
      title: "Phone Number",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },

    {
      title: "Actions",
      dataIndex: "uuid",
      key: "actions",
      render: (uuid, record) => (
        <Dropdown
          placement="bottomRight"
          menu={{
            items: [
              hasPermissionForSlug("edit-brokerage") && {
                key: "edit",

                label: (
                  <button
                    className="flex items-center gap-2 w-full"
                    onClick={() => handleEdit(record)}
                  >
                    <FaRegEdit />
                    Edit
                  </button>
                ),
              },
              hasPermissionForSlug("delete-brokerage") && {
                key: "delete",

                label: (
                  <button
                    className="flex items-center gap-2 w-full"
                    onClick={() => handleDelete(uuid)}
                  >
                    <MdDelete size={17} />
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
      ),
      fixed: "right",
      align: "center",
    },
  ];

  const handlePostalZipCodeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    const formattedValue = formatPostalCode(value);
    setPostalCode(formattedValue);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    const formattedValue = formatPhoneNumber(value);
    setValue("phoneNumber", formattedValue);
  };

  const handleFaxNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    const formattedValue = formatPhoneNumber(value);
    setValue("faxNumber", formattedValue);
  };

  const showModal = () => setIsModalOpen(true);
  // serial number in the table
  const tableSourceData = filteredData?.map((item: any, index: number) => {
    return {
      ...item,
      serial: index + 1,
    };
  });
  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Toolbar row */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Brokerage List</h1>
          <div className="flex-1" />
          <div className="relative flex-shrink-0" style={{ width: 170 }}>
            <FaSearch className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: 10, left: 8 }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ paddingLeft: 26, paddingRight: 8, paddingTop: 4, paddingBottom: 4, width: "100%" }}
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0"
                style={{ right: 6 }}
              >
                <FaTimes style={{ fontSize: 10 }} />
              </button>
            )}
          </div>
          <NavLink to={"/dashboard/super-admin/agent-management"} className="primary-btn">
            All Agents
          </NavLink>
          {hasPermissionForSlug("create-brokerage") && (
            <button onClick={() => setIsValidationModalOpen(true)} className="primary-btn whitespace-nowrap">
              Add New
            </button>
          )}
          {hasPermissionForSlug("delete-brokerage") && (
            <button onClick={handleDeleteMultipleClick} className="cancel-btn whitespace-nowrap">
              Delete Selected
            </button>
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
            />
          )}
      </div>

      <Modal
        onCancel={handleCancelValidation}
        open={isValidationModalOpen}
        title="Create Brokerage Data"
        width={"600px"}
        loading={isUploading}
        footer={[
          <button
            key="cancel"
            className="cancel-btn mr-1"
            onClick={handleCancelValidation}
          >
            Cancel
          </button>,
          <button
            key="confirm"
            className="primary-btn"
            onClick={onSubmitValidation}
            style={{ marginLeft: "8px" }}
          >
            Continue
          </button>,
        ]}
      >
        <form className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone Number */}
            <div className="flex flex-col gap-2">
              <label>
                Phone Number<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("phoneNumber", {
                  required: "Phone number is required",
                })}
                type="text"
                placeholder="e.g. +1 (123) 456-7890"
                className=""
                onChange={handlePhoneNumberChange}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm">
                  {errors.phoneNumber.message as string}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="flex flex-col gap-2">
              <label>
                Address<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("address", { required: "Address is required" })}
                type="text"
                placeholder="Enter Address"
                className=""
              />
              {errors.address && (
                <p className="text-red-500 text-sm">
                  {errors.address.message as string}
                </p>
              )}
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        onCancel={handleCancel}
        open={isModalOpen}
        title={isEditMode ? "Edit Brokerage Data" : "Create Brokerage Data"}
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
          {/* Brokerage Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label>
                Brokerage Name <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("brokerageName", {
                  required: "Brokerage name is required",
                })}
                type="text"
                placeholder="Enter Brokerage Name"
                className=""
              />
              {errors.brokerageName && (
                <p className="text-red-500 text-sm">
                  {errors.brokerageName.message as string}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="flex flex-col gap-2">
              <label>
                Address<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("address", { required: "Address is required" })}
                type="text"
                placeholder="Enter Address"
                className=""
              />
              {errors.address && (
                <p className="text-red-500 text-sm">
                  {errors.address.message as string}
                </p>
              )}
            </div>

            {/* Street Address */}
            <div className="flex flex-col gap-2">
              <label>Street Address</label>
              <input
                {...register("streetAddress", {
                  required: false,
                })}
                type="text"
                placeholder="Enter Street Address 2"
                className=""
              />
              {errors.streetAddress && (
                <p className="text-red-500 text-sm">
                  {errors.streetAddress.message as string}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label>
                Province<span className="text-red-500 ml-1">*</span>
              </label>
              <select
                {...register("stateId", { required: "Province is required" })}
                disabled={!watch("countryId")}
              >
                <option value="">Select Province</option>
                {states?.data?.states?.map((state: any) => (
                  <option
                    key={state.id}
                    value={state.id}
                    selected={selectedState == state.id}
                  >
                    {state.name}
                  </option>
                ))}
              </select>
              {errors.stateId && (
                <p className="text-red-500 text-sm">
                  {errors.stateId.message as string}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label>
                City<span className="text-red-500 ml-1">*</span>
              </label>
              <select
                {...register("cityId", { required: "City is required" })}
                disabled={!watch("stateId")}
              >
                <option value="">Select City</option>
                {cities?.data?.cities?.map((city: any) => (
                  <option
                    key={city.id}
                    value={city.id}
                    selected={selectedCity == city.id}
                  >
                    {city.name}
                  </option>
                ))}
              </select>
              {errors.cityId && (
                <p className="text-red-500 text-sm">
                  {errors.cityId.message as string}
                </p>
              )}
            </div>

            {/* Postal/Zip Code */}
            <div className="flex flex-col gap-2">
              <label>
                Postal Code<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                value={postalCode}
                {...register("postalZipCode", {
                  required: "Postal code is required",
                })}
                type="text"
                placeholder="e.g. A1A 1A1"
                className=""
                onChange={handlePostalZipCodeChange}
              />
              {errors.postalZipCode && (
                <p className="text-red-500 text-sm">
                  {errors.postalZipCode.message as string}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-2">
              <label>
                Phone Number<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("phoneNumber", {
                  required: "Phone number is required",
                })}
                type="text"
                placeholder="e.g. +1 (123) 456-7890"
                className=""
                onChange={handlePhoneNumberChange}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm">
                  {errors.phoneNumber.message as string}
                </p>
              )}
            </div>

            {/* Fax Number */}
            <div className="flex flex-col gap-2">
              <label>Fax Number</label>
              <input
                {...register("faxNumber", {
                  required: false,
                })}
                type="text"
                placeholder="e.g. +1 (123) 456-7890"
                className=""
                onChange={handleFaxNumberChange}
              />
              {errors.faxNumber && (
                <p className="text-red-500 text-sm">
                  {errors.faxNumber.message as string}
                </p>
              )}
            </div>

            {user.userType != 'agent' && (
              <div className="flex flex-col gap-2">
              <label>Billing Email Address</label>
              <input
                {...register("billingEmailAddress", {
                  required: false,
                })}
                type="text"
                placeholder="Enter Fax Number"
                className=""
              />
              {errors.billingEmailAddress && (
                <p className="text-red-500 text-sm">
                  {errors.billingEmailAddress.message as string}
                </p>
              )}
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

      {/* Create New Agent Modal */}
      <Modal
        open={isCreateAgentModalOpen}
        onCancel={() => {
          setIsCreateAgentModalOpen(false);
          createAgentForm.reset();
          setCellPhone("");
        }}
        title="Create New Agent"
        footer={[
          <button key="cancel" onClick={() => { setIsCreateAgentModalOpen(false); createAgentForm.reset(); setCellPhone(""); }} className="cancel-btn mr-2">Cancel</button>,
          <button
            key="create"
            onClick={createAgentForm.handleSubmit(handleCreateAgent)}
            className="primary-btn"
            disabled={isCreatingAgent}
          >
            {isCreatingAgent ? 'Creating...' : 'Create'}
          </button>,
        ]}
      >
        <form>
          <div className="flex flex-col gap-4">
            <Select
              options={brokerageOptions}
              value={brokerageOptions.find(opt => opt.value === selectedBrokerage?.id)}
              isDisabled={true}
              placeholder="Select Brokerage"
              classNamePrefix="select"
              isClearable={false}
              isLoading={!brokerageOptions.length}
            />
            <div className='w-full flex gap-3'>
            <div className="flex-1">
              <label htmlFor="firstName" className="block text-sm font-medium mb-1">First Name *</label>
              <input 
                {...createAgentForm.register("firstName", { required: true })} 
                placeholder="First Name" 
                className="border p-2 rounded w-full" 
              />
            </div>
            <div className="flex-1">
              <label htmlFor="lastName" className="block text-sm font-medium mb-1">Last Name </label>
              <input 
                {...createAgentForm.register("lastName", { required: false })} 
                placeholder="Last Name" 
                className="border p-2 rounded w-full" 
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email *</label>
            <input 
              {...createAgentForm.register("email", { required: true })} 
              placeholder="Email" 
              type="email" 
              className="border p-2 rounded w-full" 
            />
          </div>
            <input
              {...createAgentForm.register("cellPhone"/* , { required: true } */)}
              placeholder="Cell Phone"
              className="border p-2 rounded"
              value={cellPhone}
              onChange={e => {
                const formatted = formatPhoneNumber(e.target.value);
                setCellPhone(formatted);
                createAgentForm.setValue("cellPhone", formatted);
              }}
            />
          </div>
        </form>
      </Modal>

      <BrokerageDetailsModal
  open={isDetailsModalOpen}
  onClose={() => setIsDetailsModalOpen(false)}
  brokerage={selectedBrokerage}
  onAddAgent={handleAddAgent}
  onRefetch={async () => {
    await refetch();
  }}
/>

      </div>
    </div>
  );
};

export default BrokerageData;
