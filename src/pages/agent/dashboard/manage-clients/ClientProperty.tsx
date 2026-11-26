// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import type { TableColumnsType, TableProps } from "antd";
import ModalMain from "../../../../components/ui/Modal";
import { useForm } from "react-hook-form";
import { Table, Modal, Tabs, Button, Dropdown, Space } from "antd";
import { BsThreeDotsVertical } from "react-icons/bs";
import { format } from "date-fns";
import {
  FaStickyNote,
  FaRegEdit,
  FaRegClock,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import toast from "react-hot-toast";
import TableLoader from "../../../../components/loader/TableLoader";
import {
  useCreateUpdateClientPropertyListingMutation,
  useCreateUpdateClientPropertyVisitingDateMutation,
  useDeleteClientPropertyListingMutation,
  useDeleteClientPropertyListingMultipleMutation,
  useGetClientPropertyListingQuery,
} from "../../../../redux/api/superadmin/client/clientPropertyListingDataSlice";
import { Select } from "antd";
import { useAppSelector } from "../../../../redux/hooks";
import { Link } from "react-router-dom";
import {
  useGetCitiesQuery,
  useGetStatesQuery,
} from "../../../../redux/api/common/countryStateCitySlice";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface DataType {
  mlsNumber: string;
  propertyAddress: string;
  userId: string;
  visitingDate: string;
  uuid: string;
}

const ClientPropertyListingManagement = () => {
  const { uuid } = useParams<{ uuid?: string }>();
  const user_id = uuid;
  const { client } = useParams<{ client?: string }>();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const { data, isLoading, refetch } = useGetClientPropertyListingQuery({
    uuid,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isVisitingMode, setIsVisitingMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | "null">("null");
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAppSelector((state) => state.user);

  const [changeUuid, setChangeUuid] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [deleteClientPropertyListingMultiple] =
    useDeleteClientPropertyListingMultipleMutation();
  const [searchText, setSearchText] = useState("");

  const {
    register,
    formState: { errors },
    reset,
    getValues,
    setValue,
    watch,
    setError,
    handleSubmit,
  } = useForm<DataType>({});

  const selectedCountry = 39;
  const selectedState = watch("stateId");
  const selectedCity = watch("cityId");
  const selectedPostalCode = watch("postalCode");
  const selectedAddress = watch("address");

  // Fetch states based on selected country
  const { data: states = [] } = useGetStatesQuery(selectedCountry, {
    skip: !selectedCountry, // Skip if no country is selected
  });

  // Fetch cities based on selected state
  const { data: cities = [], isLoading: isCityLoading } = useGetCitiesQuery(
    selectedState,
    {
      skip: !selectedState, // Skip if no state is selected
    }
  );

  useEffect(() => {
    setValue("countryId", 39); //by defult set county canada

    // Recompute the property address whenever any field changes
    const stateName =
      states?.data?.states?.find((state) => state.id == selectedState)?.name ||
      "";
    const cityName =
      cities?.data?.cities?.find((city) => city.id == selectedCity)?.name || "";
    // const formattedAddress = `${selectedAddress}, ${selectedPostalCode}, ${cityName}, ${stateName}, Canada`;
    const formattedAddress = `${selectedAddress}, ${cityName}, ${stateName}, ${selectedPostalCode}`;

    setValue("propertyAddress", formattedAddress);
  }, [
    selectedState,
    selectedCity,
    selectedPostalCode,
    selectedAddress,
    cities,
    data,
  ]);

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();

    const inProperties = Object.values(record.createdUser || {}).some((data) =>
      String(data).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return inProperties || inRecord;
  });

  type TabType = {
    id: number;
    name: string;
  };

  const tabs: TabType[] = [
    ...(user.userType === "agent" ||
    user.userType === "superAdmin" ||
    user.userType === "admin"
      ? [
          {
            id: "0",
            name: "All Clients",
            link: "/dashboard/clients/client-list",
          },
        ]
      : []),
    {
      id: "1",
      name: "Property",
      link: `/dashboard/clients/property-list/${uuid}/${client}`,
    },
    {
      id: "2",
      name: "Profile",
      link: `/dashboard/clients/profile-list/${uuid}/${client}`,
    },
    {
      id: "3",
      name: "Note",
      link: `/dashboard/clients/note-list/${uuid}/${client}`,
    },
    {
      id: "4",
      name: "View Document",
      link: `/dashboard/clients/document-list/${uuid}/${client}`,
    },
  ];

  const formatDate = (isoDate: any) => {
    return isoDate ? format(new Date(isoDate), "yyyy-MM-dd HH:mm:ss") : " ";
  };

  useEffect(() => {
    if (data?.data?.clientPropertyListingData) {
      setTableData(data.data.clientPropertyListingData);
    }
  }, [data]);

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

  const [createUpdatePropertyListing] =
    useCreateUpdateClientPropertyListingMutation();
  const [createUpdatePropertyVisiting] =
    useCreateUpdateClientPropertyVisitingDateMutation();
  const [deletePropertyListing] = useDeleteClientPropertyListingMutation();

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    setIsEditMode(false);
    setIsVisitingMode(false);
    setSelectedUUID("null");
  };

  const resetForm = () => {
    setValue("mlsNumber", "");
    setValue("stateId", "");
    setValue("cityId", "");
    setValue("postalCode", "");
    setValue("address", "");
    setValue("userId", uuid);
    setValue("visitingDate", "");
    setValue("url", "");
    setIsEditMode(false);
    setIsVisitingMode(false);
    setSelectedUUID("null");
  };

  const handleEdit = (record: DataType) => {
    // Create a new object with formatted date fields
    const formattedRecord = {
      ...record,
      visitingDate: formatDate(record.visitingDate),
    };

    // Reset the form with the formatted record
    reset(formattedRecord);
    setIsEditMode(true);
    setSelectedUUID(record.uuid);
    showModal();
  };
  const handleVisiting = (record: DataType) => {
    const formattedRecord = {
      ...record,
      visitingDate: formatDate(record.visitingDate),
    };

    // Reset the form with the formatted record
    reset(formattedRecord);
    setIsVisitingMode(true);
    setSelectedUUID(record.uuid);
  };

  const confirmDelete = async () => {
    if (!selectedUUID) return; // Add check to avoid undefined
    try {
      const response = await deletePropertyListing(selectedUUID).unwrap();
      toast.success(response?.message);
      setTableData(tableData.filter((item): any => item.uuid !== selectedUUID));
    } catch (error) {
      toast.error("Delete failed. Something went wrong!");
      console.error("Delete error:", error);
    }
    setIsModalVisible(false);
    setSelectedUUID("null");
  };

  const cancelDelete = () => {
    setIsModalVisible(false);
    setSelectedUUID("null");
    setChangeUuid(null);
    setIsDeleteModalMultipleVisible(false);
  };

  const handleDelete = (uuid: string) => {
    setSelectedUUID(uuid);
    setIsModalVisible(true);
  };

  if (isCityLoading || isLoading) {
    return <TableLoader />;
  }

  const onSubmit = async () => {
    setIsUploading(true);
    setValue("userId", uuid);
    const data = getValues();

    try {
      const response = await createUpdatePropertyListing({
        uuid: selectedUUID,
        data,
      });

      handleResponse(response);
    } catch (error: any) {
      toast.error("Update failed. Something went wrong!");
      console.error("Error:", error);
    } finally {
      setIsUploading(false);
      if (isEditMode) {
        setIsEditMode(false);
        setSelectedUUID("null"); // Use null instead of 'null'
      }
    }
  };

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

  const onVisitingSubmit = async () => {
    setIsUploading(true);
    setValue("userId", uuid);
    const data = getValues();

    try {
      const response = await createUpdatePropertyVisiting({
        uuid: selectedUUID,
        data,
      });

      handleResponse(response);
    } catch (error: any) {
      toast.error("Update failed. Something went wrong!");
      console.error("Error:", error);
    } finally {
      setIsUploading(false);
      if (isVisitingMode) {
        setIsVisitingMode(false);
        setSelectedUUID("null");
      }
    }
  };

  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true); // Show delete confirmation modal
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteClientPropertyListingMultiple(
          selectedRowKeys
        );
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

  const columns: TableColumnsType<DataType> = [
    {
      title: "MLS Number",
      dataIndex: "mlsNumber",
      key: "mlsNumber",
      width: 240,
    },
    /* {
      title: "Client",
      dataIndex: "user",
      key: "user",
      render: (user) => (
        <span>
          {user?.name || "N/A"}
        </span>
      ),

      width: 240,
    }, */
    {
      title: "Property Address",
      dataIndex: "propertyAddress",
      key: "propertyAddress",
      render: (propertyAddress) => <span>{propertyAddress || ""}</span>,

      width: 240,
    },
    {
      title: "Property Url",
      dataIndex: "url",
      key: "url",
      render: (url) => (
        <span>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-500 hover:underline"
            >
              {/* {url} */}
              <FaExternalLinkAlt className="ml-2 text-sm" />
            </a>
          ) : (
            " "
          )}
        </span>
      ),
    },

    {
      title: "Visiting Date and Time",
      dataIndex: "visitingDate",
      key: "visitingDate",
      render: (text) => formatDate(text),
      width: 240,
    },
    {
      title: "Actions",
      dataIndex: "uuid",
      key: "actions",
      render: (uuid, recoard) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "visiting",
                label: (
                  <button
                    onClick={() => handleVisiting(recoard)}
                    className="flex items-center gap-2"
                  >
                    <FaRegClock /> Property Visiting
                  </button>
                ),
              },
              {
                key: "note",
                label: (
                  <Link
                    to={`/dashboard/clients/note-list/${user_id}/${recoard.id}/${recoard.mlsNumber}/${client}`}
                    className="flex gap-2"
                  >
                    <FaStickyNote className="mt-1" /> Property Note
                  </Link>
                ),
              },
              {
                key: "edit",
                label: (
                  <button
                    onClick={() => handleEdit(recoard)}
                    className="flex items-center gap-2"
                  >
                    <FaRegEdit /> Edit
                  </button>
                ),
              },
              {
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
    <div className="pb-32">
      <div className="flex items-center justify-between gap-5 xl:gap-10  mb-5 p-1">
        <h1>{client}</h1>
        <div className="w-1/2">
          <input
            type="text"
            placeholder="Search from table..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="global-search "
          />
        </div>
        <div>
          {user.userType != "client" && (
            <div>
              <button onClick={showModal} className="primary-btn mx-3">
                Add New
              </button>
              <button
                onClick={handleDeleteMultipleClick}
                className="cancel-btn mx-3"
              >
                Delete All
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <Tabs
          defaultActiveKey="1"
          type="card"
          items={tabs.map((tab) => ({
            label: <Link to={tab.link}>{tab.name}</Link>,
            key: tab.id,
          }))}
        />
      </div>

      <div>
        {isLoading ? (
          <TableLoader />
        ) : (
          <Table
            scroll={{ x: "max-content" }}
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredData}
            pagination={{ pageSize: 20 }}
            rowKey="uuid"
          />
        )}
      </div>

      <ModalMain
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        handleOk={handleSubmit(onSubmit)}
        title="Create or Update Property Listing"
        isLoading={isUploading}
        modalClass={"lg:!w-[60%] !z-[10000]"}
      >
        <form className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {/* MLS Number */}
            <div className="flex flex-col gap-2">
              <label>MLS Number</label>
              <input
                {...register("mlsNumber")}
                type="text"
                placeholder="Enter MLS Number"
              />

              {errors.mlsNumber && (
                <p className="text-red-500 text-sm">
                  {errors.mlsNumber.message}
                </p>
              )}
            </div>
            {/* Property Url */}
            <div className="flex flex-col gap-2">
              <label>Property Url</label>
              <input
                {...register("url")}
                type="text"
                placeholder="Enter Property Url"
              />

              {errors.url && (
                <p className="text-red-500 text-sm">{errors.url.message}</p>
              )}
            </div>

            <div>
              <label>
                Province <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                {...register("stateId", {
                  required: "Province is required",
                })}
              >
                <option value="">Select Province</option>
                {states?.data?.states?.map((state: any) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
              {/* Error message for Province */}
              {errors.stateId && (
                <p className="text-red-500">{errors.stateId.message}</p>
              )}
            </div>

            <div>
              <label>
                City <span className="text-red-500 ml-1">*</span>
              </label>
              <select {...register("cityId", { required: "City is required" })}>
                <option value="">Select City</option>
                {cities?.data?.cities?.map((city: any) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
              {/* Error message for City */}
              {errors.cityId && (
                <p className="text-red-500">{errors.cityId.message}</p>
              )}
            </div>

            <div className="w-full">
              <label htmlFor="postalCode">
                Postal Code <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("postalCode", {
                  required: "Postal code is required",
                })}
                type="text"
                id="postalCode"
                className="w-full"
              />
              {/* Error message for Postal Code */}
              {errors.postalCode && (
                <p className="text-red-500">{errors.postalCode.message}</p>
              )}
            </div>

            {/* Property Address */}
            <div className="flex flex-col gap-2">
              <label>
                Property Address <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                {...register("address", {
                  required: "Property address is required",
                })}
                type="textarea"
                placeholder="Enter Property Address"
                className=""
              />
              {errors.propertyAddress && (
                <p className="text-red-500 text-sm">
                  {errors.propertyAddress.message}
                </p>
              )}
            </div>
            {/* Deposit Date */}
            {/* <div className="flex flex-col gap-2">
              <label>Visiting Date</label>
              <input {...register("visitingDate")} type="datetime-local" className="" />
              {errors.visitingDate && (
                <p className="text-red-500 text-sm">
                  {errors.visitingDate.message}
                </p>
              )}
            </div> */}
          </div>
        </form>
      </ModalMain>

      <Modal
        title="Set Property Visiting Shedule"
        visible={isVisitingMode}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <button
            className="primary-btn "
            onClick={handleSubmit(onVisitingSubmit)}
            style={{ marginLeft: "8px" }}
          >
            Submit
          </button>,
        ]}
      >
        <form className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {/* Deposit Date */}
            <div className="flex flex-col gap-2 w-full">
              <label>Visiting Date and Time</label>
              <input
                {...register("visitingDate")}
                type="datetime-local"
                className="w-full"
              />
              {errors.visitingDate && (
                <p className="text-red-500 text-sm">
                  {errors.visitingDate.message}
                </p>
              )}
            </div>
          </div>
        </form>
      </Modal>
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

export default ClientPropertyListingManagement;
