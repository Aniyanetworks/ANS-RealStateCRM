// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ModalMain from "../../../../components/ui/Modal";
import { useForm } from "react-hook-form";
import { Modal, Tabs, Button } from "antd";
import { formatDate, parseISO } from "date-fns";
import { FaRegEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import toast from "react-hot-toast";
import { getFileUrl } from "../../../../utils/constant";
import {
  useCreateUpdateClientPropertyNoteMutation,
  useDeleteClientPropertyNoteMutation,
  useGetClientPropertyNoteQuery,
} from "../../../../redux/api/superadmin/client/clientNotePropertyDataSlice";
import { useAppSelector } from "../../../../redux/hooks";
import { Link } from "react-router-dom";

interface DataType {
  note: string;
  userId: string;
  uuid: string;
  property: string;
  data: object;
}

const ClientPropertyListingManagement = () => {
  const { uuid } = useParams<{ uuid?: string }>();
  const { client } = useParams<{ client?: string }>();
  const { property } = useParams<{ property?: string }>();
  const { mls } = useParams<{ mls?: string }>();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const { data, isLoading, refetch } = useGetClientPropertyNoteQuery({
    property,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | "null">("null");
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAppSelector((state) => state.user);

  // const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  // const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
  //   useState(false);
  // const [deleteClientPropertyListingMultiple] =
  //   useDeleteClientPropertyNoteMultipleMutation();
  const [searchText, setSearchText] = useState("");

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();

    const inUser = Object.values(record.createdUser || {}).some((data) =>
      String(data).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return inUser || inRecord;
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
      id: "5",
      name: "Property Note",
      link: `/dashboard/clients/note-list/${uuid}/${property}/${mls}/${client}`,
    },
    {
      id: "4",
      name: "View Document",
      link: `/dashboard/clients/document-list/${uuid}/${client}`,
    },
  ];

  useEffect(() => {
    if (data?.data?.clientPropertyNoteData) {
      setTableData(data.data.clientPropertyNoteData);
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
    watch,
  } = useForm<DataType>({});

  const handleEditorChange = (value: string) => {
    setValue("note", value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  // const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
  //   console.log("selectedRowKeys changed: ", newSelectedRowKeys);
  //   setSelectedRowKeys(newSelectedRowKeys);
  // };

  // const rowSelection: TableRowSelection<DataType> = {
  //   selectedRowKeys,
  //   onChange: onSelectChange,
  //   selections: [
  //     Table.SELECTION_ALL,
  //     Table.SELECTION_INVERT,
  //     Table.SELECTION_NONE,
  //     {
  //       key: "odd",
  //       text: "Select Odd Row",
  //       onSelect: (changeableRowKeys) => {
  //         let newSelectedRowKeys = [];
  //         newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
  //           if (index % 2 !== 0) {
  //             return false;
  //           }
  //           return true;
  //         });
  //         setSelectedRowKeys(newSelectedRowKeys);
  //       },
  //     },
  //     {
  //       key: "even",
  //       text: "Select Even Row",
  //       onSelect: (changeableRowKeys) => {
  //         let newSelectedRowKeys = [];
  //         newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
  //           if (index % 2 !== 0) {
  //             return true;
  //           }
  //           return false;
  //         });
  //         setSelectedRowKeys(newSelectedRowKeys);
  //       },
  //     },
  //   ],
  // };

  const [createUpdatePropertyNote] =
    useCreateUpdateClientPropertyNoteMutation();
  const [deletePropertyNote] = useDeleteClientPropertyNoteMutation();

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedUUID("null");
  };

  const resetForm = () => {
    setValue("note", "");
    setValue("userId", uuid);
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
      const response = await deletePropertyNote(selectedUUID).unwrap();
      toast.success(response?.message);
      setTableData(tableData.filter((item): any => item.uuid !== selectedUUID));
      refetch();
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
    setValue("clientPropertyId", property);
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
      const response = await createUpdatePropertyNote({
        uuid: selectedUUID,
        data,
      });
      refetch();

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

  // const handleDeleteMultipleClick = () => {
  //   setIsDeleteModalMultipleVisible(true); // Show delete confirmation modal
  // };

  // const handleDeleteConfirmMultiple = async () => {
  //   if (selectedRowKeys.length > 0) {
  //     try {
  //       const response = await deleteClientPropertyListingMultiple(selectedRowKeys);
  //       setIsDeleteModalMultipleVisible(false);
  //       // Ensure the refetch waits for the data to be refreshed
  //       await refetch();
  //       if (response.data.status == true) {
  //         setSelectedRowKeys([]);
  //         toast.success("Deleted successfully!");
  //       } else {
  //         toast.error("Failed to delete. Please try again.");
  //       }
  //     } catch (error) {
  //       setIsDeleteModalMultipleVisible(false);
  //       toast.error("Failed to delete. Please try again.");
  //     }
  //   } else {
  //     toast.error("Please Select Items.");
  //   }
  // };

  // const columns: TableColumnsType<DataType> = [
  //   {
  //     title: "#",
  //     key: "serial",
  //     width: 50,
  //     render: (_, __, index) => index + 1,
  //     fixed: "left",
  //   },
  //   {
  //       title: "Note",
  //       dataIndex: "note",
  //       key: "note",
  //       render: (note) => (
  //         <span>
  //           {note || "N/A"}
  //         </span>
  //       ),

  //       width: 240,
  //     },
  //   {
  //     title: "Client",
  //     dataIndex: "user",
  //     key: "user",
  //     render: (user) => (
  //       <span>
  //         {user?.name || "N/A"}
  //       </span>
  //     ),

  //     width: 240,
  //   },
  //   {
  //     title: "Actions",
  //     dataIndex: "uuid",
  //     key: "actions",
  //     fixed: "right",
  //     render: (uuid, recoard) => (
  //       <div className="flex gap-5 items-center">
  //         <button
  //           onClick={() => handleEdit(recoard)}
  //           className="hover:text-red-500 text-lg duration-100"
  //         >
  //           <FaRegEdit />
  //         </button>

  //         {recoard.status === "rejected" && (
  //           <button
  //             onClick={() => handleRejectReasonView(recoard?.rejectReason)}
  //             className="text-[16px] hover:text-primaryPurple duration-100 ml-4"
  //           >
  //             <FaComment className="text-red-500" />{" "}
  //             {/* Reject Reason icon with red color */}
  //           </button>
  //         )}

  //         {((user.userType === "agent") ||
  //           user.userType === "superAdmin" ||
  //           user.userType === "admin") && (
  //           <button
  //             onClick={() => handleDelete(uuid)}
  //             className="hover:text-red-500 text-lg duration-100"
  //           >
  //             <MdDelete />
  //           </button>
  //         )}

  //       </div>
  //     ),
  //   },
  // ];

  const showModal = () => setIsModalOpen(true);
  return (
    <div className="pb-32">
      <div className="flex items-center justify-between gap-5 xl:gap-10  mb-5 p-1">
        <h1>{client}</h1>
        <div className="w-1/2">
          <input
            type="text"
            placeholder="Search from notes..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="global-search "
          />
        </div>
        <div>
          <button onClick={showModal} className="primary-btn mx-3">
            Add New
          </button>
          {/* <button
            onClick={handleDeleteMultipleClick}
            className="cancel-btn mx-3"
          >
            Delete All
          </button> */}
        </div>
      </div>

      <div>
        <Tabs
          defaultActiveKey="5"
          type="card"
          items={tabs.map((tab) => ({
            label: <Link to={tab.link}>{tab.name}</Link>,
            key: tab.id,
          }))}
        />
      </div>
      <div className="">
        <h1 className="py-4">{mls}</h1>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div>
            <div>
              <ul className="space-y-4">
                {filteredData?.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start space-x-4 p-3 rounded-lg bg-white "
                  >
                    <img
                      src={getFileUrl(item.ownerNote.profilePicture)}
                      alt={item.ownerNote.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex">
                        <strong className="mx-1 text-sm text-gray-700">
                          {item.ownerNote.name}
                        </strong>
                        <sub className="text-xs  text-gray-400">
                          {formatDate(
                            parseISO(item.CreatedAt),
                            "dd MMMM yyyy, hh:mm a"
                          )}
                        </sub>
                      </div>

                      <div>
                        {/* <p className="mt-1 text-gray-600">{item.note}</p> */}
                        <div
                          dangerouslySetInnerHTML={{ __html: item.note }}
                          className="text-gray-700 leading-relaxed"
                        />
                        <div className="my-3 flex gap-3">
                          <button
                            onClick={() => handleEdit(item)}
                            className="hover:text-red-500 text-lg duration-100"
                          >
                            <FaRegEdit />
                          </button>

                          {(user.userType === "agent" ||
                            user.userType === "superAdmin" ||
                            user.userType === "admin") && (
                            <button
                              onClick={() => handleDelete(item.uuid)}
                              className="hover:text-red-500 text-lg duration-100"
                            >
                              <MdDelete />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {
        <ModalMain
          handleCancel={handleCancel}
          isModalOpen={isModalOpen}
          handleOk={handleSubmit(onSubmit)}
          title="Create or Update Note"
          isLoading={isUploading}
          modalClass={"lg:!w-[40%] !z-[10000]"}
        >
          <form className="space-y-3 mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 gap-4">
              <div className="flex flex-col gap-2 mb-8">
                <label>
                  Note <span className="text-red-500 ml-1">*</span>
                </label>

                <ReactQuill
                  value={watch("note")}
                  id="comment"
                  placeholder="Enter note here."
                  className=" w-full"
                  onChange={handleEditorChange}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.note.message}</p>
                )}
              </div>
            </div>
          </form>
        </ModalMain>
      }

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
      {/* <Modal
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
      </Modal> */}
    </div>
  );
};

export default ClientPropertyListingManagement;
