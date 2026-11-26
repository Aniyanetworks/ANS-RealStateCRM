/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useEffect, useState } from "react";
import type { TableColumnsType, TableProps } from "antd";
import { useForm } from "react-hook-form";
import { Table, Modal, Button, Dropdown, Space } from "antd";
import {
  useCreateBrokerageDataMutation,
  useUpdateBrokerageDataMutation,
  useDeleteBrokerageDataMutation,
  useDeleteBrokerageDataMultipleMutation,
} from "../../../redux/api/superadmin/brokerageDataSlice";
import { useGetChequePostingsQuery, useTransferCommissionChequeMutation } from "../../../redux/api/accounting/tradeAccountingSlice";

import { FaRegEdit, FaSearch, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import toast from "react-hot-toast";
import {
  useGetCitiesQuery,
  // useGetCountriesQuery,
  useGetStatesQuery,
} from "../../../redux/api/common/countryStateCitySlice";
import TableLoader from "../../../components/loader/TableLoader";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  formatPhoneNumber,
  formatPostalCode,
  formatToTwoDecimalPlaces,
} from "../../../utils/format";
import { usePermissions } from "../../../utils/permissionUtils";
import { useGetAccountingBankAccountsQuery } from "../../../redux/api/accounting/bankAccountManagementSlice";
import { formatNumberWithCommasAndDecimals } from "../../../utils/formatNumberWithCommasAndDecimals";

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

const CommissionCheque = () => {
  const [bankAccounts, setBankAccounts] = useState<DataType[]>([]);
  const { hasPermissionForSlug } = usePermissions();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const { data, isLoading, refetch } = useGetChequePostingsQuery("");
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      const { data:bankAccountList, isLoading:bankAccountIsLoading, refetch:bankAccountRefetch} = useGetAccountingBankAccountsQuery(""); // Use the bank account data query

  useEffect(() => {
    setBankAccounts(bankAccountList?.data?.accounts); // Ensure correct data mapping
    if (data?.data?.chequePostings) {
      setTableData(data.data.chequePostings);
    }
  }, [data]);

  const [searchText, setSearchText] = useState("");

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();

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

  const [createBrokerageData] = useCreateBrokerageDataMutation();
  const [transferCommissionCheque] = useTransferCommissionChequeMutation();
  const [deleteBrokerageData] = useDeleteBrokerageDataMutation();

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
    setValue('tradeSheetId',record?.tradeTransaction?.tradeSheet?.tradeSheetTypeId || "N/A");
    setValue('tradeSheetAddress',record?.tradeTransaction?.tradeSheet?.properties?.[0]?.propertyAddress || "N/A");
    setValue('amount',formatToTwoDecimalPlaces(record?.tradeTransaction?.netCommissionTotal) || "N/A");
    setValue('fromBankAccountId',record?.bankAccountId);
    setValue('toBankAccountId',2);
    setValue('tradeTransactionId',record?.tradeTransaction?.id)

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

  const [chequeTypes] = useState([
    { label: "EFT", value: "eft" },
    { label: "Cheque", value: "cheque" },
  ]);

  const onSubmit = async () => {
    setIsUploading(true);
    const data = getValues();

    if (isEditMode) {
      try {
        const response = (await transferCommissionCheque(data)) as any;

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
        const response = (await transferCommissionCheque(data)) as any;

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

  const columns: TableColumnsType<DataType> = [
    {
      title: "Tradesheet Id",
      dataIndex: "tradeSheetTypeId", 
      key: "tradeSheetTypeId", 
      render: (text, record) => {
        <span
          className="hover:text-blue-600 cursor-pointer hover:underline"
          onClick={() => handleEdit(record)}
        >
          {record?.tradeTransaction?.tradeSheet?.tradeSheetTypeId || "N/A"}
        </span>;
        // return record?.tradeTransaction?.tradeSheet?.tradeSheetTypeId || "N/A"; 
      },
    },
    {
      title: "Tradesheet Address",
      dataIndex: "tradeSheetTypeId", // Keep dataIndex as is, unless you want to map it differently
      key: "tradeSheetTypeId", // Keep key as is
      render: (text, record) => {
        // Safely access the tradeSheet and its tradeSheetTypeId
        return (
          record?.tradeTransaction?.tradeSheet?.properties?.[0]
            ?.propertyAddress || "N/A"
        ); // Default value if tradeSheetTypeId is not present
      },
    },
    
    {
      title: "Seeling Commission",
      dataIndex: "tradeSheetTypeId", // Keep dataIndex as is, unless you want to map it differently
      key: "tradeSheetTypeId", // Keep key as is
      render: (text, record) => {
        // Safely access the tradeSheet and its tradeSheetTypeId
        const formattedCommission = formatNumberWithCommasAndDecimals(record?.tradeTransaction?.agentCommissionSelling);
        return formattedCommission ? `$${formattedCommission}` : "N/A"; // Default value if tradeSheetTypeId is not present
      },
    },
    {
      title: "Listing Commission",
      dataIndex: "tradeSheetTypeId", // Keep dataIndex as is, unless you want to map it differently
      key: "tradeSheetTypeId", // Keep key as is
      render: (text, record) => {
        // Safely access the tradeSheet and its tradeSheetTypeId
        const formattedCommission = formatNumberWithCommasAndDecimals(record?.tradeTransaction?.agentCommissionListing);
        return formattedCommission ? `$${formattedCommission}` : "N/A"; // Default value if tradeSheetTypeId is not present
      },
    },
    {
      title: "Tax",
      dataIndex: "tradeSheetTypeId", // Keep dataIndex as is, unless you want to map it differently
      key: "tradeSheetTypeId", // Keep key as is
      render: (text, record) => {
        // Safely access the tradeSheet and its tradeSheetTypeId
        const formattedCommission = formatNumberWithCommasAndDecimals(record?.tradeTransaction?.agentCommissionTax);
        return formattedCommission ? `$${formattedCommission}` : "N/A"; // Default value if tradeSheetTypeId is not present
      },
    },
    {
      title: "Total Commission",
      dataIndex: "tradeSheetTypeId", // Keep dataIndex as is, unless you want to map it differently
      key: "tradeSheetTypeId", // Keep key as is
      render: (text, record) => {
        // Safely access the tradeSheet and its tradeSheetTypeId
        const formattedCommission = formatNumberWithCommasAndDecimals(record?.tradeTransaction?.agentCommissionTotal);
        return formattedCommission ? `$${formattedCommission}` : "N/A"; // Default value if tradeSheetTypeId is not present
      },
    },
    {
      title: "Transfer Status",
      dataIndex: "transferStatus", // Keep dataIndex as is, unless you want to map it differently
      key: "transferStatus", // Keep key as is
      render: (text, record) => {
        // Safely access the tradeSheet and its tradeSheetTypeId
        // return record?.tradeTransaction?.netCommissionStatus || "N/A"; // Default value if tradeSheetTypeId is not present
        const val = record?.tradeTransaction?.agentCommissionStatus || "N/A";
        return <span>{val.charAt(0).toUpperCase() + val.slice(1)}</span>;
      },
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
              record?.tradeTransaction?.netCommissionStatus == "pending" && {
                key: "edit",
                label: (
                  <button
                    className="flex items-center gap-2 w-full"
                    onClick={() => handleEdit(record)}
                  >
                    <FaRegEdit />
                    Transfer
                  </button>
                ),
              },
              // hasPermissionForSlug("delete-brokerage") && {
              //   key: "delete",

              //   label: (
              //     <button
              //       className="flex items-center gap-2 w-full"
              //       onClick={() => handleDelete(uuid)}
              //     >
              //       <MdDelete size={17} />
              //       Delete
              //     </button>
              //   ),
              // },
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
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Agent Commissions</h1>
          <div className="flex-1" />
          <div className="relative flex-shrink-0" style={{ width: 170 }}>
            <FaSearch className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: 10, left: 8 }} />
            <input type="text" placeholder="Search..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ paddingLeft: 26, paddingRight: searchText ? 22 : 8, paddingTop: 4, paddingBottom: 4, width: "100%" }} />
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
              rowKey="uuid"
              scroll={{ x: "max-content" }}
              columns={columns}
              dataSource={tableSourceData}
              pagination={{ pageSize: 20 }}
            />
          )}
        </div>
      </div>

      <Modal
        onCancel={handleCancel}
        open={isModalOpen}
        title={isEditMode ? "Commission cheque" : "Commission cheque"}
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
                Tradesheet Id <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("tradeSheetId", {
                  required: "TradeSheet Id is required",
                })}
                disabled
                type="text"
                placeholder="TradeSheet Id"
                className=""
              />
              {errors.tradeSheetId && (
                <p className="text-red-500 text-sm">
                  {errors.tradeSheetId.message as string}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>
                Tradesheet Address<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("tradeSheetAddress")}
                disabled
                type="text"
                placeholder="Address"
                className=""
              />
              {errors.tradeSheetAddress && (
                <p className="text-red-500 text-sm">
                  {errors.tradeSheetAddress.message as string}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>Net Commission</label>
              <div class="flex items-center border border-gray-300 rounded-md w-full mt-2">
                <span class="px-2">$</span>
                <input
                  {...register("amount", {
                    required: false,
                  })}
                  disabled
                  type="text"
                  placeholder="Amount"
                  className=""
                />
                {errors.Amount && (
                  <p className="text-red-500 text-sm">
                    {errors.Amount.message as string}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="chequeType"
                className="font-semibold text-gray-700"
              >
                Cheque Type:
              </label>
              <select
                {...register("chequeType", {
                  required: "Cheque Type is required",
                })}
                className="w-full mt-2 p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select</option>
                {chequeTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.chequeType && (
                <p className="text-red-500 text-sm">
                  {errors.chequeType.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="bankAccount"
                className="font-semibold text-gray-700"
              >
                Bank Account:
              </label>
              <select
                {...register("toBankAccountId", {
                  required: "Bank Account is required",
                })}
                className="w-full mt-2 p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select</option>
                {bankAccounts?.map((option) => (
                  <option key={option?.id} value={option?.id}>
                    {option?.name}
                  </option>
                ))}
              </select>
              {errors.toBankAccountId && (
                <p className="text-red-500 text-sm">
                  {errors.toBankAccountId.message}
                </p>
              )}
            </div>
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
    </div>
  );
};

export default CommissionCheque;
