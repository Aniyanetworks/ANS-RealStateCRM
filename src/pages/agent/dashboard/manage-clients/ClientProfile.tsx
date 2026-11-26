// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import type { TableColumnsType, TableProps } from "antd";
import ModalMain from "../../../../components/ui/Modal";
import { useForm } from "react-hook-form";
import { Table, Modal, Tabs, Button, Dropdown, Space  } from "antd";
import { BsThreeDotsVertical } from "react-icons/bs";
import {  FaRegEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import toast from "react-hot-toast";
import TableLoader from "../../../../components/loader/TableLoader";
import {
    useCreateUpdateClientProfileListingMutation,
  useDeleteClientProfileListingMutation,
  useDeleteClientProfileListingMultipleMutation,
  useGetClientProfileListingQuery,
} from "../../../../redux/api/superadmin/client/clientProfileListingDataSlice";

import { useAppSelector } from "../../../../redux/hooks";
import { Link } from 'react-router-dom';

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface DataType {
  relation: string;
  name: string;
  userId: string;
  email: string;
  uuid: string;
}


const ClientPropertyListingManagement = () => {
  const [tableData, setTableData] = useState<DataType[]>([]);
  const { uuid } = useParams<{ uuid?: string }>();
  const { client } = useParams<{ client?: string }>();
  const { data, isLoading, refetch } = useGetClientProfileListingQuery({ uuid });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | "null">("null");
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAppSelector((state) => state.user);

  const [changeUuid, setChangeUuid] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [deleteClientPropertyListingMultiple] =
    useDeleteClientProfileListingMultipleMutation();
  const [searchText, setSearchText] = useState("");

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
    ...(((user.userType === "agent") || 
       (user.userType === "superAdmin") || 
       (user.userType === "admin")) 
      ? [{
          id: '0',
          name: "All Clients",
          link: "/dashboard/clients/client-list",
        }]
      : []),
    {
      id: '1',
      name: "Property",
      link: `/dashboard/clients/property-list/${uuid}/${client}`,
    },
    {
      id: '2',
      name: "Profile",
      link: `/dashboard/clients/profile-list/${uuid}/${client}`,
    },
    {
      id: '3',
      name: "Note",
      link: `/dashboard/clients/note-list/${uuid}/${client}`,
    },
    {
      id: '4',
      name: "View Document",
      link: `/dashboard/clients/document-list/${uuid}/${client}`,
    },
  ];


  useEffect(() => {
    if (data?.data?.clientProfileListingData) {
      setTableData(data.data.clientProfileListingData);
    }
  }, [data]);

  const {
    register,
    formState: { errors },
    reset,
    getValues,
    setValue,
    setError,
    handleSubmit,
  } = useForm<DataType>({});

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
  useCreateUpdateClientProfileListingMutation();
  const [deletePropertyListing] = useDeleteClientProfileListingMutation();

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedUUID("null");
  };

  const resetForm = () => {
    setValue("relation", "");
    setValue("name", "");
    setValue("userId", uuid);
    setValue("email", "");
    setIsEditMode(false);
    setSelectedUUID("null");
  };

  const handleEdit = (record: DataType) => {
    reset(record);
    setIsEditMode(true);
    setSelectedUUID(record.uuid);
    showModal();
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

  const onSubmit = async () => {
    setIsUploading(true);
    setValue("userId", uuid);
    const data = getValues();

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

  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true); // Show delete confirmation modal
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteClientPropertyListingMultiple(selectedRowKeys);
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
      title: "#",
      key: "serial",
      width: 50,
      render: (_, __, index) => index + 1,
      fixed: "left",
    },
    {
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (name) => (
          <span>
            {name || "N/A"}
          </span>
        ),
  
        width: 240,
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
        render: (email) => (
          <span>
            {email || "N/A"}
          </span>
        ),
  
        width: 240,
      },
    {
      title: "Relation",
      dataIndex: "relation",
      key: "relation",
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
      title: "Actions",
      dataIndex: "uuid",
      key: "actions",
      fixed: "right",
      width: 50,
      align: "center",
      render: (uuid, recoard) => (

        <Dropdown
          menu={{
            items: [
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
      </div>

      <div>
      <Tabs
      defaultActiveKey="2"
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
        title="Create or Update Profile"
        isLoading={isUploading}
        modalClass={"lg:!w-[60%] !z-[10000]"}
      >
        <form className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">            

            {/* Property Name */}
            <div className="flex flex-col gap-2">
              <label>
                Name <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("name", {
                  required: "Name is required",
                })}
                type="text"
                placeholder="Enter Profile Name"
                className=""
              />
              {errors.name && (
                <p className="text-red-500 text-sm">
                  {errors.name.message}
                </p>
              )}
            </div> 
            {/* Relation */}
            <div className="flex flex-col gap-2">
              <label>Relation</label>
              <input
                
                {...register("relation")}
                type="text"
                placeholder="Enter Relation"                
              />

              {errors.relation && (
                <p className="text-red-500 text-sm">
                  {errors.relation.message}
                </p>
              )}
            </div>         
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label>Email</label>
              <input
                
                {...register("email")}
                type="text"
                placeholder="Enter Email"                
              />

              {errors.email && (
                <p className="text-red-500 text-sm">
                  {errors.email.message}
                </p>
              )}
            </div>         
            
          </div>
        </form>
      </ModalMain>

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
