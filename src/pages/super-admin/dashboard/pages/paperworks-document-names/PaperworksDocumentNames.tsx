// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any

import React, { useContext, useEffect, useMemo, useState } from "react";
import ModalMain from "../../../../../components/ui/Modal";
import { useForm } from "react-hook-form";
import type { TableColumnsType, TableProps } from "antd";
// drag and drop
import { HolderOutlined } from "@ant-design/icons";
import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Table, Modal, Button, Tooltip, Dropdown, Space } from "antd";
import {
  useGetFileUploadNameQuery,
  useCreateFileUploadNameMutation,
  useUpdateFileUploadNameMutation,
  useDeleteFileUploadNameMutation,
  useDeleteFileUploadNameMultipleMutation,
  useUpdateOrderFileUploadNameMutation,
} from "../../../../../redux/api/superadmin/fileUploadNameSlice";
import { FaRegEdit, FaSearch, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";

import toast from "react-hot-toast";
import getStatusBadge from "../../../../../components/Utils/StatusBadge";
import { formatDate, parseISO } from "date-fns";
import TableLoader from "../../../../../components/loader/TableLoader";
import Select from "react-select";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { AiFillWarning } from "react-icons/ai";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaLessThanEqual } from "react-icons/fa6";
import ButtonLoader from "../../../../../components/loader/buttonLoader";
import { ThreeCircles } from "react-loader-spinner";
import { usePermissions } from "../../../../../utils/permissionUtils";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface DataType {
  key?: React.Key;
  name: string;
  required: boolean;
  status: string;
  uuid: string;
  paperType: string;
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
    name: "Seller",
  },
  {
    id: 2,
    name: "Buyer",
  },
  {
    id: 3,
    name: "Tenant",
  },
  {
    id: 4,
    name: "Landlord",
  },
  {
    id: 5,
    name: "Client",
  },
];
interface RowContextProps {
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  listeners?: SyntheticListenerMap;
}

const RowContext = React.createContext<RowContextProps>({});
const DragHandle: React.FC = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  return (
    <Button
      type="text"
      size="small"
      icon={<HolderOutlined />}
      style={{ cursor: "move" }}
      ref={setActivatorNodeRef}
      {...listeners}
    />
  );
};

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  "data-row-key": string;
}

const Row: React.FC<RowProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props["data-row-key"] });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging ? { position: "relative", zIndex: 9999 } : {}),
  };

  const contextValue = useMemo<RowContextProps>(
    () => ({ setActivatorNodeRef, listeners }),
    [setActivatorNodeRef, listeners]
  );

  return (
    <RowContext.Provider value={contextValue}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes} />
    </RowContext.Provider>
  );
};

const FileUploadNames = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { data, isLoading, refetch } = useGetFileUploadNameQuery("");
  const [dataReorder, setDataReorder] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [isOrderLoading, setIsOrderLoading] = useState<boolean>(false);
  const [deleteMultipleFileUploadName] =
    useDeleteFileUploadNameMultipleMutation();

  const [representation, setRepresentation] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState(2);

  // for drag and drop

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

  useEffect(() => {
    setTableData(data?.data?.uploadFileNames);
  }, [data]);

  const {
    register,
    formState: { errors },
    reset,
    getValues,
    setError,
    handleSubmit,
    setValue,
  } = useForm();

  const [selectedMainCategory, setSelectedMainCategory] = useState<{
    value: number;
    label: string;
  } | null>(null);
  const [subcategories, setSubcategories] = useState<
    {
      value: string;
      label: string;
    }[]
  >([
    { value: "buyer", label: "Buyer" },
    { value: "seller", label: "Seller" },
    { value: "tenant", label: "Tenant" },
    { value: "landlord", label: "Landlord" },
    { value: "client", label: "Client" },
  ]);

  const [selectedSubcategories, setSelectedSubcategories] = useState<
    { value: string; label: string }[]
  >([]);

  const [createFileUploadName] = useCreateFileUploadNameMutation();
  const [updateFileUploadName] = useUpdateFileUploadNameMutation();
  const [deleteFileUploadName] = useDeleteFileUploadNameMutation();
  const [updateOrderFileUploadName] = useUpdateOrderFileUploadNameMutation();

  const handleCancel = () => {
    handleReset();
    setIsModalOpen(false);
    setIsEditMode(false);
  };

  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true); // Show delete confirmation modal
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteMultipleFileUploadName(selectedRowKeys);
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

  const handleReset = () => {
    setValue("name", "");
    setValue("uploadFileCategoryId", []);
    setValue("required", "no");
    setValue("status", "active");
    setValue("paperType", "singleUpload");
    setValue("hasAdditionalFile", "no");
    setValue("showOnPropertyListing", "no");
    setValue("propertyListingRequired", "no");
    setValue("listType", "");
    setSelectedUUID(null);
    setSelectedMainCategory(null);
    setSelectedSubcategories([]);
  };

  const handleEdit = (record: object) => {
    reset(record);
    setSelectedUUID(record?.uuid);

    // Set selected main category based on the record
    // const mainCategory = categories.find(
    //   (category) => category.id === record.uploadFileCategory.id
    // );
    // setSelectedMainCategory(
    //   mainCategory
    //     ? { value: mainCategory.id, label: mainCategory.label }
    //     : null
    // );

    // // Set main category ID in form state
    // setValue("uploadFileCategoryId", mainCategory ? mainCategory.id : null);

    // Ensure subcategories are available for selection
    // const selectedCategory = categories.find(
    //   (category) => category.id === record.uploadFileCategory.id
    // );
    // const availableSubcategories = selectedCategory
    //   ? selectedCategory.subcategories
    //   : [];
    // setSubcategories(availableSubcategories);

    // Split the comma-separated 'representation' string into an array
    const representationValue = record.representation;
    const representationArray = representationValue
      ? representationValue?.split(",")
      : [];

    // Map representation values to their corresponding labels
    const selectedOptions = representationArray
      .map((rep: string) => {
        const foundSubcategory = subcategories.find((sub) => sub.value === rep);
        return foundSubcategory
          ? { value: foundSubcategory.value, label: foundSubcategory.label }
          : null;
      })
      .filter((option: string) => option !== null); // Filter out any null values

    // Set selected subcategories based on the array of subcategory values
    setSelectedSubcategories(selectedOptions);
    setValue(
      "subcategories",
      selectedOptions.map((option: object) => option.value)
    );
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await deleteFileUploadName(selectedUUID).unwrap();
      toast.success(`${response?.message}`);
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

  const onSubmit = async () => {
    setIsUploading(true);
    const data = getValues();
    if (isEditMode) {
      try {
        if (!selectedUUID) {
          throw new Error("UUID is null");
        }
        const response = (await updateFileUploadName({
          uuid: selectedUUID,
          data,
        })) as object;

        if (response) {
          setIsUploading(false);
        }
        if (response?.error?.data?.status == false) {
          response.error.data.errors.forEach((error: any) => {
            setError(error.path, {
              type: "manual",
              message: error.msg,
            });
          });
        } else if (response?.data?.status == true) {
          toast.success(`${response?.data?.message}`);
          setIsModalOpen(false);
          setIsEditMode(false);
          setSelectedUUID(null);
          handleReset();
        } else {
          handleReset();
          setIsEditMode(false);
        }
      } catch (error) {
        toast.error("Update failed. Something went wrong!");
        console.error("Update error:", error);
        setIsUploading(false);
      }
    } else {
      try {
        const response = (await createFileUploadName(data)) as any;
        if (response) {
          setIsUploading(false);
        }

        if (response?.error?.data?.status == false) {
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
          handleReset();
        } else {
          handleReset();
          setIsUploading(false);
        }
      } catch (error) {
        console.error("Submission error:", error);
        toast.error("Submission failed. Something went wrong!");
        setIsUploading(false);
      }
    }
  };

  if (isLoading) {
    <TableLoader />;
  }
  const [searchText, setSearchText] = useState("");

  const filteredData = tableData?.filter((record) => {
    const { uploadFileCategory, name, required, status }: any = record;
    return (
      name?.toLowerCase().includes(searchText.toLowerCase()) ||
      uploadFileCategory?.name
        .toLowerCase()
        .includes(searchText.toLowerCase()) ||
      required?.toLowerCase().includes(searchText.toLowerCase()) ||
      status?.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const nextFilteredData =
    representation && representation !== "All"
      ? filteredData
          ?.filter((record) =>
            record.representation
              ?.split(",")
              .includes(representation.toLocaleLowerCase())
          )
          .sort((a, b) => {
            const orderKey =
              representation === "Seller"
                ? "sellerOrder"
                : representation === "Buyer"
                ? "buyerOrder"
                : representation === "Tenant"
                ? "tenantOrder"
                : "landlordOrder"; // Default to landlordOrder
            return a[orderKey] - b[orderKey];
          })
      : filteredData;

  const columns: TableColumnsType<DataType> = [
    ...(representation !== "All" && representation !== null
      ? [
          {
            key: "sort",
            align: "center",
            width: 80,
            render: () => <DragHandle />,
          },
        ]
      : []),


    {
      title: "Upload Name",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      render: (text: string, record: any) => (
        <Tooltip title={text}>
          <button
            className="hover:text-blue-600 cursor-pointer hover:underline"
            onClick={() => handleEdit(record)}
            style={{
              cursor: "pointer",
              // color: "#1890ff", // Optional: blue link color
              // textDecoration: "underline", // Optional: underline to show it's clickable
            }}
          >
            {text?.length > 30 ? `${text?.slice(0, 30)}...` : text}
          </button>
        </Tooltip>
      ),
    },
    // {
    //   title: "Category Name",
    //   dataIndex: "uploadFileCategory",
    //   key: "categoryName",
    //   render: (uploadFileCategory) => uploadFileCategory.name,
    // },
    {
      title: "Paper Type",
      dataIndex: "paperType",
      key: "paperType",
      render: (paperType) => {
        return paperType == "singleUpload"
          ? "Single File Upload"
          : "Multiple File Upload";
      },
    },

    {
      title: "List Type",
      dataIndex: "listType",
      key: "listType",
      filters: [
        { text: "Commercial", value: "Commercial" },
        { text: "Residential", value: "Residential" },
        { text: "Both (Residential and Commercial)", value: "Both" },
      ],
      onFilter: (value, record) => record.listType === value,
      render: (listType) => listType ?? "—",
    },

    {
      title: "Additional File",
      dataIndex: "hasAdditionalFile",
      key: "hasAdditionalFile",
      filters: [
        { text: "Yes", value: "yes" },
        { text: "No", value: "no" },
      ],
      onFilter: (value, record) => record.hasAdditionalFile === value,
      render: (hasAdditionalFile: any) => (
        <span>{hasAdditionalFile ? hasAdditionalFile.charAt(0).toUpperCase() + hasAdditionalFile.slice(1) : "N/A"}</span>
      ),
    },
    {
      title: "Required",
      dataIndex: "required",
      key: "required",
      filters: [
        { text: "Yes", value: "yes" },
        { text: "No", value: "no" },
      ],
      onFilter: (value, record) => record.required === value,
      render: (required: any) => (
        <span>{required ? required.charAt(0).toUpperCase() + required.slice(1) : "N/A"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Active", value: "active" },
        { text: "Inactive", value: "inactive" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: any) => getStatusBadge(status),
    },
    {
      title: "Submitted at",
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
      render: (uuid, record) => (
        <Dropdown
          menu={{
            items: [
              hasPermissionForSlug("edit-paperwork-documents") && {
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
              hasPermissionForSlug("delete-paperwork-documents") && {
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

  const showModal = () => setIsModalOpen(true);

  const categories = [
    {
      id: 1,
      label: "Listing Paperwork",
      subcategories: [
        { value: "seller", label: "Seller" },
        { value: "landlord", label: "Landlord" },
        { value: "client", label: "Client" },
      ],
    },
    {
      id: 2,
      label: "Co Work Paperwork",
      subcategories: [
        { value: "buyer", label: "Buyer" },
        { value: "tenant", label: "Tenant" },
        { value: "client", label: "Client" },
      ],
    },
  ];

  const handleMainCategoryChange = (selectedOption: any) => {
    setSelectedMainCategory(selectedOption);
    const selectedCategory = categories.find(
      (category) => category.label === selectedOption.label
    );
    setSubcategories(selectedCategory ? selectedCategory.subcategories : []);
    setSelectedSubcategories([]);
    setValue(
      "uploadFileCategoryId",
      selectedCategory ? selectedCategory.id : null
    );
  };

  const handleSubcategoryChange = (selectedOptions: any) => {
    setSelectedSubcategories(selectedOptions);
    setValue(
      "subcategories",
      selectedOptions.map((option: any) => option.value)
    );
  };

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    setIsOrderLoading(true);
    // setDataReorder(true);
    if (active.id !== over?.id) {
      setTableData((prevState) => {
        const activeIndex = prevState.findIndex(
          (record) => record.uuid === active?.id
        );
        const overIndex = prevState.findIndex(
          (record) => record.uuid === over?.id
        );
        const updatedData = arrayMove(prevState, activeIndex, overIndex);

        // Update sellerOrder and buyerOrder
        const reorderedData = updatedData.map((record, index) => ({
          ...record,
          sellerOrder:
            representation == "Seller" ? index + 1 : record.sellerOrder,
          buyerOrder: representation == "Buyer" ? index + 1 : record.buyerOrder,
          tenantOrder:
            representation == "Tenant" ? index + 1 : record.tenantOrder,
          landlordOrder:
            representation == "Landlord" ? index + 1 : record.landlordOrder,
        }));
        handleUdateOrder(reorderedData);
        return reorderedData;
      });
    }
  };

  const handleUdateOrder = async (data: any) => {
    setIsOrderLoading(true);
    try {
      await updateOrderFileUploadName({ data: data });
      toast.success("Order updated successfully!");
      setIsOrderLoading(false);

      setDataReorder(false);
    } catch (error) {
      toast.error(error.message);
      setDataReorder(false);
      setIsOrderLoading(false);
    }
  };

  return (
    <div className="pb-16">
      {isOrderLoading && (
        <div className="fixed z-50 inset-0 bg-gray-500 bg-opacity-35 flex w-full justify-center items-center h-screen">
          <ThreeCircles visible={true} height="100" width="100" color="#4fa94d" ariaLabel="three-circles-loading" wrapperStyle={{}} wrapperClass="" />
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Paperwork Documents</h1>
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTabId(tab.id);
                  setRepresentation(tab.name);
                }}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                  activeTabId === tab.id
                    ? "bg-[#0f766e] text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
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
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasPermissionForSlug("create-paperwork-documents") && (
              <button onClick={showModal} className="primary-btn">Create</button>
            )}
            {hasPermissionForSlug("delete-paperwork-documents") && (
              <button onClick={handleDeleteMultipleClick} className="cancel-btn">Delete Selected</button>
            )}
          </div>
        </div>

        <div>
        {isLoading || dataReorder ? (
          <TableLoader />
        ) : (
          <DndContext
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={(nextFilteredData || []).map((i) => i.uuid)}
              strategy={verticalListSortingStrategy}
            >
              <Table<DataType>
                rowKey="uuid"
                components={{ body: { row: Row } }}
                columns={columns}
                rowSelection={rowSelection}
                scroll={{ x: "max-content" }}
                dataSource={nextFilteredData}
                pagination={false}
              />
            </SortableContext>
          </DndContext>
        )}
      </div>
      </div>

      <ModalMain
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        handleOk={handleSubmit(onSubmit)}
        title="Create File Upload Name"
        isLoading={isUploading}
        modalClass={"lg:!w-[60%] z-[99999]"}
      >
        <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {/* Category and Representation Inputs */}
          {/* <div className="flex flex-col gap-2">
            <label>
              Category <span className="text-red-500 ml-1">*</span>
            </label>
            <Select
              {...register("uploadFileCategoryId", {
                required: "Category is required",
              })}
              options={categories.map((category) => ({
                value: category.id,
                label: category.label,
              }))}
              onChange={handleMainCategoryChange}
              classNamePrefix="react-select"
              value={selectedMainCategory}
            />
            {errors.uploadFileCategoryId && (
              <p className="text-red-500 text-sm">
                {errors.uploadFileCategoryId.message}
              </p>
            )}
          </div> */}

          <div className="flex flex-col gap-2">
            <label>
              Representation <span className="text-red-500 ml-1">*</span>
            </label>
            <Select
              {...register("subcategories", {
                required: "Representation is required",
              })}
              options={subcategories}
              isMulti
              value={selectedSubcategories}
              onChange={handleSubcategoryChange}
              classNamePrefix="react-select"
              // isDisabled={!selectedMainCategory}
            />
            {errors.subcategories && (
              <p className="text-red-500 text-sm">
                {errors.subcategories.message}
              </p>
            )}
          </div>

          {/* File Name */}
          <div className="flex flex-col gap-2">
            <label>
              Name <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              {...register("name", { required: "Name is required" })}
              type="text"
              placeholder="Enter File Upload Name"
              className="border rounded p-2"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{`${errors.name.message} is required`}</p>
            )}
          </div>

          {/* Paper Type */}
          <div className="flex flex-col gap-2">
            <label>
              Paper Type <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              {...register("paperType", { required: true })}
              className="border rounded p-2 w-full"
            >
              <option value="singleUpload">Single File Upload</option>
              <option value="multipleUpload">Multiple File Upload</option>
            </select>
            {errors.paperType && (
              <p className="text-red-500 text-sm">{errors.paperType.message}</p>
            )}
          </div>

          {/* List Type */}
          <div className="flex flex-col gap-2">
            <label>
              List type <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              {...register("listType", { required: true })}
              className="border rounded p-2 w-full"
            >
              <option value="">Please Select</option>
              <option value="Both">Both (Commercial and Residential)</option>
              <option value="Commercial">Commercial</option>
              <option value="Residential">Residential</option>
            </select>
            {errors.listType && (
              <p className="text-red-500 text-sm">{errors.listType.message}</p>
            )}
          </div>

          {/* Required */}
          <div className="flex flex-col gap-2">
            <label>
              Is Required <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              {...register("required", { required: true })}
              className="border rounded p-2 w-full"
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
            {errors.required && (
              <p className="text-red-500 text-sm">{errors.required.message}</p>
            )}
          </div>

          {/* Additional */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center">
              Has Additional File
              <span className="text-red-500 ml-1">*</span>
              <span
                className="ml-2 text-gray-500 cursor-pointer"
                title="When tradesheet is approved, if Has Additional File is yes agent can't upload additional file in this section."
              >
                <AiOutlineInfoCircle className="text-lg" />{" "}
                {/* Adjust the size here */}
              </span>
            </label>

            <select
              {...register("hasAdditionalFile", { required: true })}
              className="border rounded p-2 w-full"
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
            {errors.hasAdditionalFile && (
              <p className="text-red-500 text-sm">
                {errors.hasAdditionalFile.message}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <label>
              Status <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              {...register("status", { required: true })}
              className="border rounded p-2 w-full"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {errors.status && (
              <p className="text-red-500 text-sm">Status is required</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center">
              Show on Property Listing
              <span className="text-red-500 ml-1">*</span>
              <span
                className="ml-2 text-gray-500 cursor-pointer"
                // title="When tradesheet is approved, if Has Additional File is yes agent can't upload additional file in this section."
              >
                <AiOutlineInfoCircle className="text-lg" />{" "}
                {/* Adjust the size here */}
              </span>
            </label>

            <select
              {...register("showOnPropertyListing", { required: true })}
              className="border rounded p-2 w-full"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
            {errors.showOnPropertyListing && (
              <p className="text-red-500 text-sm">
                {errors.showOnPropertyListing.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center">
              Property Listing Required
              <span className="text-red-500 ml-1">*</span>
              <span
                className="ml-2 text-gray-500 cursor-pointer"
                // title="When tradesheet is approved, if Has Additional File is yes agent can't upload additional file in this section."
              >
                <AiOutlineInfoCircle className="text-lg" />{" "}
                {/* Adjust the size here */}
              </span>
            </label>

            <select
              {...register("propertyListingRequired", { required: true })}
              className="border rounded p-2 w-full"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
            {errors.propertyListingRequired && (
              <p className="text-red-500 text-sm">
                {errors.propertyListingRequired.message}
              </p>
            )}
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
        <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-md">
          <div className="flex items-center">
            <AiFillWarning className="text-2xl mr-2" /> {/* Warning icon */}
            <p className="font-semibold text-sm">
              Are you sure you want to delete this item?
            </p>
          </div>
          <p className="mt-2 text-sm">
            <span className="font-semibold">Warning:</span> If you delete this
            Paperwork document, all previously uploaded files in this section
            will be permanently deleted. Please make sure to backup the uploaded
            tradesheet file in this Paperwork before proceeding.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Deleting this document cannot be undone. Proceed with caution.
          </p>
        </div>
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

export default FileUploadNames;
