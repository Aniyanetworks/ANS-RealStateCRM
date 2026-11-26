/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { useEffect, useState, useRef } from "react";
import type { TableColumnsType, TableProps } from "antd";
import { useForm } from "react-hook-form";
import { Table, Modal, Button, Dropdown, Space, Tooltip, Tabs } from "antd";
import {
  useGetLawyerFirmDataQuery,
  useCreateLawyerFirmDataMutation,
  useUpdateLawyerFirmDataMutation,
  useDeleteLawyerFirmDataMutation,
  useDeleteLawyerFirmDataMultipleMutation,
  useValidateLawyerFirmDataMutation,
} from "../../../../../redux/api/superadmin/lawyerFirmDataSlice";
import { useCreateLawyerDataMutation, useUpdateLawyerDataMutation, useSendLawyerPDFEmailMutation } from "../../../../../redux/api/superadmin/lawyerDataSlice";

import { FaRegEdit, FaSearch, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { FaShareNodes } from "react-icons/fa6";
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
import { NavLink } from "react-router-dom";
import dayjs from "dayjs";
import TradeSheetSeparatePreviewPage from "../../../../agent/dashboard/pages/form/trade-sheet/TradeSheetSeparatePreviewPage";
import { useAppSelector } from "../../../../../redux/hooks";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ReactQuill from "react-quill-new";
import 'react-quill-new/dist/quill.snow.css';

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface DataType {
  key?: React.Key;
  firmName: string;
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

const BrokerageData = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const { data, isLoading, refetch } = useGetLawyerFirmDataQuery("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEnableContinueBtn, setIsEnableContinueBtn] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [postalCode, setPostalCode] = useState<string>("");
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [deleteMultipleBrokerageData] =
    useDeleteLawyerFirmDataMultipleMutation();
    const [selectedTradeData, setSelectedTradeData] = useState<DataType[]>([]);
  const [isModalPreviewTradeSheetVisible, setIsModalPreviewTradeSheetVisible] =
      useState(false);

  useEffect(() => {
    if (data?.data?.lawyerFirm) {
      setTableData(data.data.lawyerFirm);
    }
  }, [data]);
  const { user } = useAppSelector((state) => state.user);

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

  const [validateLawyerFirmData] = useValidateLawyerFirmDataMutation();
  const [createLawyerFirmData] = useCreateLawyerFirmDataMutation();
  const [updateLawyerFirmData] = useUpdateLawyerFirmDataMutation();
  const [deleteLawyerFirmData] = useDeleteLawyerFirmDataMutation();

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedUUID(null);
  };
  const handleCancelValidation = () => {
    setIsValidationModalOpen(false);
    setIsEnableContinueBtn(false);
    reset({
      phoneNumber: "",
    });
  };

  const resetForm = () => {
    reset({
      firmName: "",
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
      const response = await deleteLawyerFirmData(selectedUUID).unwrap();
      toast.success(response?.message);
      setTableData(tableData.filter((item) => item.uuid !== selectedUUID));
    } catch {
      toast.error("Delete failed. Something went wrong!");
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
        const response = (await updateLawyerFirmData({
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
      } catch {
        toast.error("Update failed. Something went wrong!");
        setIsUploading(false);
      }
    } else {
      try {
        const response = (await createLawyerFirmData(data)) as any;

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
      } catch {
        setIsUploading(false);
      }
    }
  };

  const onSubmitValidation = async () => {
    setIsUploading(true);
    const data = getValues();

    try {
      const response = (await validateLawyerFirmData(data)) as any;

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
        setIsEnableContinueBtn(false);
      } else if (response?.data?.status == true) {
        toast.success(`${response?.data?.message}`);
        setIsModalOpen(false);
        setIsUploading(false);
        setIsEnableContinueBtn(true);
      } else {
        setIsUploading(false);
        setIsEnableContinueBtn(false);
      }
    } catch {
      setIsUploading(false);
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
      } catch {
        setIsDeleteModalMultipleVisible(false);
        toast.error("Failed to delete announcement. Please try again.");
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
      dataIndex: "serial",
      fixed: "left",
    },
    {
      title: "Lawyer Firm Name",
      dataIndex: "firmName",
      key: "firmName",
      sorter: (a, b) => a.firmName.localeCompare(b.firmName),
      ellipsis: true,
      render: (text: string, record: any) => (
        <Tooltip title={text}>
          <button
            type="button"
            onClick={() => {
              setSelectedFirm(record);
              setSelectedLawyer(null);
              setFirmModalOpen(true);
            }}
            className="hover:text-blue-600 cursor-pointer hover:underline"
            style={{
              cursor: "pointer",
              background: "none",
              border: "none",
              padding: 0,
              font: "inherit"
            }}
          >
            {text?.length > 30 ? `${text?.slice(0, 30)}...` : text} ({record.lawyerData?.length || 0})
          </button>
        </Tooltip>
      ),
    },
    {
      title: "Address",
      key: "address", // Use key instead of dataIndex since we're combining fields
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

  const [firmModalOpen, setFirmModalOpen] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState<DataType | null>(null);
  const [selectedLawyer, setSelectedLawyer] = useState<DataType | null>(null);
  const [selectedTab, setSelectedTab] = useState('details');

  // Add Lawyer Modal State
  const [isAddLawyerModalOpen, setIsAddLawyerModalOpen] = useState(false);
  const [newLawyer, setNewLawyer] = useState({
    firstName: '',
    lastName: '',
    firmId: '',
    email: '',
    phoneNumber: '',
  });
  const [addLawyerErrors, setAddLawyerErrors] = useState<any>({});
  const [createLawyerData, { isLoading: isCreatingLawyer }] = useCreateLawyerDataMutation();

  // Edit Lawyer Modal State
  const [isEditLawyerModalOpen, setIsEditLawyerModalOpen] = useState(false);
  const [editLawyer, setEditLawyer] = useState({
    uuid: '',
    firstName: '',
    lastName: '',
    firmId: '',
    email: '',
    phoneNumber: '',
  });
  const [editLawyerErrors, setEditLawyerErrors] = useState<any>({});
  const [updateLawyerData, { isLoading: isUpdatingLawyer }] = useUpdateLawyerDataMutation();

  // Share Lawyer Modal State
  const [isShareLawyerModalOpen, setIsShareLawyerModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [recipientNote, setRecipientNote] = useState<string>("");
  const lawyerShareRef = useRef<HTMLDivElement>(null);
  const [sendLawyerPDFEmail] = useSendLawyerPDFEmailMutation();

  // Add Lawyer Handler
  const handleOpenAddLawyerModal = () => {
    setNewLawyer({
      firstName: '',
      lastName: '',
      firmId: selectedFirm?.id || '',
      email: '',
      phoneNumber: '',
    });
    setAddLawyerErrors({});
    setIsAddLawyerModalOpen(true);
  };
  const handleCloseAddLawyerModal = () => {
    setIsAddLawyerModalOpen(false);
    setAddLawyerErrors({});
  };
  const handleAddLawyerInputChange = (e: any) => {
    const { name, value } = e.target;
    setNewLawyer((prev) => ({ ...prev, [name]: value }));
  };
  const validateAddLawyerForm = () => {
    const errors: any = {};
    if (!newLawyer.firstName) errors.firstName = 'First name is required';
    if (!newLawyer.lastName) errors.lastName = 'Last name is required';
    if (!newLawyer.firmId) errors.firmId = 'Lawyer firm is required';
    if (!newLawyer.email) errors.email = 'Email is required';
    if (!newLawyer.phoneNumber) errors.phoneNumber = 'Phone number is required';
    return errors;
  };
  const handleAddLawyerSubmit = async (e: any) => {
    e.preventDefault();
    const errors = validateAddLawyerForm();
    setAddLawyerErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      await createLawyerData(newLawyer).unwrap();
      toast.success('Lawyer created successfully!');
      setIsAddLawyerModalOpen(false);
      // Refresh selectedFirm data
      if (selectedFirm) {
        await refetch();
        const updated = data?.data?.lawyerFirm?.find((f: any) => f.id === selectedFirm.id);
        if (updated) setSelectedFirm(updated);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create lawyer');
    }
  };

  // Edit Lawyer Handlers
  const handleOpenEditLawyerModal = () => {
    if (!selectedLawyer) return;
    setEditLawyer({
      uuid: selectedLawyer.uuid || '',
      firstName: selectedLawyer.firstName || '',
      lastName: selectedLawyer.lastName || '',
      firmId: selectedLawyer.firmId || selectedFirm?.id || '',
      email: selectedLawyer.email || '',
      phoneNumber: selectedLawyer.phoneNumber || '',
    });
    setEditLawyerErrors({});
    setIsEditLawyerModalOpen(true);
  };
  const handleCloseEditLawyerModal = () => {
    setIsEditLawyerModalOpen(false);
    setEditLawyerErrors({});
  };
  const handleEditLawyerInputChange = (e: any) => {
    const { name, value } = e.target;
    setEditLawyer((prev) => ({ ...prev, [name]: value }));
  };
  const validateEditLawyerForm = () => {
    const errors: any = {};
    if (!editLawyer.firstName) errors.firstName = 'First name is required';
    return errors;
  };
  const handleEditLawyerSubmit = async (e: any) => {
    e.preventDefault();
    const errors = validateEditLawyerForm();
    setEditLawyerErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      const { uuid, ...editLawyerData } = editLawyer;
      await updateLawyerData({ uuid, data: editLawyerData }).unwrap();
      toast.success('Lawyer updated successfully!');
      setIsEditLawyerModalOpen(false);
      // Refresh selectedFirm data and the currently-open lawyer panel
      if (selectedFirm) {
        const { data: refreshed } = await refetch();
        const updated = refreshed?.data?.lawyerFirm?.find((f: any) => f.id === selectedFirm.id);
        if (updated) {
          setSelectedFirm(updated);
          const updatedLawyer = updated.lawyerData?.find((l: any) => l.uuid === uuid);
          if (updatedLawyer) setSelectedLawyer(updatedLawyer);
        }
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update lawyer');
    }
  };

  // Share Lawyer Handlers
  const handleShareLawyer = () => {
    if (!selectedLawyer) return;
    setIsShareLawyerModalOpen(true);
  };

  const handleCancelShareLawyer = () => {
    setIsShareLawyerModalOpen(false);
    setRecipientEmail("");
    setRecipientNote("");
  };

  const handleEditorChange = (value: string) => {
    setRecipientNote(value);
  };

  const sendLawyerPDF = async () => {
    if (!lawyerShareRef.current || !selectedLawyer) return;
    
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    const generateAndSendPDF = async () => {
      try {
        const canvas = await html2canvas(lawyerShareRef.current);
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Define margins
        const margin = 20;
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        // Calculate the width and height of the image to fit within the margins
        let pdfImgWidth = pageWidth - 2 * margin;
        let pdfImgHeight = (imgHeight * pdfImgWidth) / imgWidth;

        // If the calculated height exceeds the page height, scale it down
        if (pdfImgHeight > pageHeight - 2 * margin) {
          const scaleRatio = (pageHeight - 2 * margin) / pdfImgHeight;
          pdfImgWidth *= scaleRatio;
          pdfImgHeight *= scaleRatio;
        }

        // Add the image to the PDF with margins
        pdf.addImage(imgData, "PNG", margin, margin, pdfImgWidth, pdfImgHeight);

        // Create a Blob from the PDF
        const pdfBlob = pdf.output("blob");
        const pdfFile = new File([pdfBlob], "lawyer-details.pdf", {
          type: "application/pdf",
        });

        const formData = new FormData();
        formData.append("email", recipientEmail);
        formData.append("note", recipientNote);
        formData.append("uuid", selectedLawyer.uuid || selectedLawyer.id);
        formData.append("attachments", pdfFile);

        const response = await sendLawyerPDFEmail(formData).unwrap();

        if (response.status) {
          toast.success(response.message);
          setRecipientNote("");
          setRecipientEmail("");
          setIsShareLawyerModalOpen(false);
        }
      } catch (error: any) {
        console.error("Error generating or sending PDF:", error);
        toast.error(error?.data?.message || "Failed to send lawyer details");
      }
    };

    await generateAndSendPDF();
  };

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Toolbar row */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Lawyer Firm List</h1>
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
          <NavLink to={"/dashboard/super-admin/lawyer-managements"} className="primary-btn">
            All Lawyers
          </NavLink>
          {hasPermissionForSlug("create-brokerage") && (
            <button onClick={() => setIsValidationModalOpen(true)} className="primary-btn">
              Add New
            </button>
          )}
          {hasPermissionForSlug("delete-brokerage") && (
            <button onClick={handleDeleteMultipleClick} className="cancel-btn">
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
        title={isEditMode ? "Edit Lawyer Firm Data" : "Create Lawyer Firm Data"}
        width={"800px"}
        loading={isUploading}
        footer={[
          <button
            key="cancel"
            className="cancel-btn mr-1"
            onClick={() => {setIsValidationModalOpen(false),setIsEnableContinueBtn(false)}}
          >
            Cancel
          </button>,
          <button
            key="confirm"
            className="primary-btn"
            onClick={onSubmitValidation}
            style={{ marginLeft: "8px" }}
          >
            Submit
          </button>,
        ]}
      >
        <form className="space-y-3">
          {/* Lawyer Firm Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
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

            <div className="flex flex-col gap-2 mt-7">
              {isEnableContinueBtn && (
                <button
                  key="confirm"
                  className="primary-btn"
                  onClick={(event) => {
                    event.preventDefault();
                    setIsValidationModalOpen(false);
                    setIsModalOpen(true);
                  }}
                  style={{ marginLeft: "8px" }}
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        onCancel={handleCancel}
        open={isModalOpen}
        title={isEditMode ? "Edit Lawyer Firm Data" : "Create Lawyer Firm Data"}
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
          {/* Lawyer Firm Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label>
                Lawyer Firm Name <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("firmName", {
                  required: "Lawyer Firm Name is required",
                })}
                type="text"
                placeholder="Enter Lawyer Firm Name"
                className=""
              />
              {errors.firmName && (
                <p className="text-red-500 text-sm">
                  {errors.firmName.message as string}
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

            <div className="flex flex-col gap-2">
              <label>Billing Email Address</label>
              <input
                {...register("billingEmailAddress", {
                  required: false,
                })}
                type="text"
                placeholder="Enter Email Address"
                className=""
              />
              {errors.billingEmailAddress && (
                <p className="text-red-500 text-sm">
                  {errors.billingEmailAddress.message as string}
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

      {firmModalOpen && selectedFirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setFirmModalOpen(false)}><FaTimes /></button>
            <div className="flex items-center justify-between border-b mb-4">
              <Tabs
                activeKey={selectedTab}
                onChange={setSelectedTab}
                className="custom-tabs"
                style={{ marginBottom: 0 }}
              >
                <Tabs.TabPane tab="Details" key="details" />
                <Tabs.TabPane tab="Lawyers" key="lawyers" />
                { user.userType === 'superAdmin' &&(
                <Tabs.TabPane tab="Trade Sheets" key="tradeSheets" />
              )}
              </Tabs>
              <button className="primary-btn ml-4" onClick={handleOpenAddLawyerModal}>Add Lawyer</button>
            </div>
            {/* Tab content rendering logic */}
            {selectedTab === 'details' && (
              <table className="min-w-full border ">
                <thead>
                          <tr>
                            <th colSpan={2} className="w-full font-semibold p-2 border bg-[#243451] text-white text-center">Lawyer Firm  Details</th>
                          </tr>
                        </thead>
                  <tbody className="text-[11px]">
                    <tr><td className="p-2 border font-semibold">Firm Name</td><td className="p-2 border">{selectedFirm.firmName}</td></tr>
                    <tr><td className="p-2 border font-semibold">Address</td><td className="p-2 border">{selectedFirm.address}</td></tr>
                    <tr><td className="p-2 border font-semibold">Street Address</td><td className="p-2 border">{selectedFirm.streetAddress}</td></tr>
                    <tr><td className="p-2 border font-semibold">City</td><td className="p-2 border">{selectedFirm.city?.name}</td></tr>
                    <tr><td className="p-2 border font-semibold">State</td><td className="p-2 border">{selectedFirm.state?.name}</td></tr>
                    <tr><td className="p-2 border font-semibold">Postal Code</td><td className="p-2 border">{selectedFirm.postalZipCode}</td></tr>
                    <tr><td className="p-2 border font-semibold">Phone</td><td className="p-2 border">{selectedFirm.phoneNumber}</td></tr>
                    <tr><td className="p-2 border font-semibold">Fax</td><td className="p-2 border">{selectedFirm.faxNumber}</td></tr>
                    <tr><td className="p-2 border font-semibold">Billing Email</td><td className="p-2 border">{selectedFirm.billingEmailAddress}</td></tr>
                    <tr><td className="p-2 border font-semibold">Created At</td><td className="p-2 border">{selectedFirm.createdAt ? dayjs(selectedFirm.createdAt).format('DD MMMM YYYY, hh:mm A') : ''}</td></tr>
                  </tbody>
                </table>
              )}
            {selectedTab === 'lawyers' && (
              <div className="flex gap-6 w-full" style={{ minHeight: 400 }}>
                {/* Sidebar */}
                <div className="w-2/5 border-r pr-1">
                <div className="max-h-[400px] overflow-y-auto">
                  <ul className="divide-y divide-gray-200">
                    {selectedFirm.lawyerData?.length > 0 ? selectedFirm.lawyerData.map((lawyer: any) => (
                      <li key={lawyer.id} className={`py-2 cursor-pointer ${selectedLawyer?.id === lawyer.id ? 'bg-blue-50 font-bold' : ''}`}>
                        <div
                          onClick={() => setSelectedLawyer(lawyer)}
                          className="hover:text-blue-600 p-1 rounded-md"
                        >
                          {lawyer.firstName} {lawyer.lastName}
                          <div className="text-xs text-gray-500">{lawyer.email}</div>
                        </div>
                      </li>
                    )) : <li className="text-gray-500">No lawyers found for this firm.</li>}
                  </ul>
                </div>
                </div>
                {/* Main Area */}
                <div className="w-3/5">
                  {selectedLawyer ? (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm">Lawyer Details</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleOpenEditLawyerModal}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors"
                            title="Edit lawyer details"
                          >
                            <FaRegEdit size={12} />
                            Edit
                          </button>
                          <button
                            onClick={handleShareLawyer}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            title="Share lawyer details"
                          >
                            <FaShareNodes size={12} />
                            Share
                          </button>
                        </div>
                      </div>
                      <table className="min-w-full border text-[11px]">
                          <tr>
                            <th colSpan={2} className="w-full font-semibold p-2 border bg-[#243451] text-white text-center">Lawyer Details</th>
                          </tr>
                          <tbody>
                            <tr><td className="p-2 border">Name</td><td className="p-2 border">{selectedLawyer.firstName} {selectedLawyer.lastName}</td></tr>
                            <tr><td className="p-2 border">Personal Email</td><td className="p-2 border">{selectedLawyer.email}</td></tr>
                            <tr><td className="p-2 border">Personal Phone</td><td className="p-2 border">{selectedLawyer.phoneNumber}</td></tr>
                           <tr><td className="p-2 border">Created At</td><td className="p-2 border">{selectedLawyer.createdAt ? dayjs(selectedLawyer.createdAt).format('DD MMMM YYYY, hh:mm A') : ""}</td></tr>
                          </tbody>
                        </table>
                    </div>
                  ) : (
                    <div className="text-gray-500">Select a lawyer to view details.</div>
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
          <th className="p-2 border bg-[#243451] text-white">Lawyer</th>
          <th className="p-2 border bg-[#243451] text-white">Admin Status</th>
          <th className="p-2 border bg-[#243451] text-white">Trade Status</th>
          <th className="p-2 border bg-[#243451] text-white">Representation</th>
        </tr>
      </thead>
      <tbody>
        {selectedFirm.lawyerData?.flatMap(lawyer => 
          [...(lawyer.sellerLawyerDetails || []), ...(lawyer.buyerLawyerDetails || [])]
            .map((detail, index) => (
              <tr key={`${detail.id}-${index}`}>
                <td className="p-2 border" >
                  <button onClick={() => { setIsModalPreviewTradeSheetVisible(true); setSelectedTradeData(detail.tradeSheet);}}
                        style={{
                          color:
                            detail.status === "rejected"
                              ? "red"
                              : detail.status === "underReview"
                                ? "#eb9715"
                                : "", 
                        }}
                        className={`
                          bg-transparent border-none p-0 text-inherit
                          hover:text-blue-600 hover:underline
                          cursor-pointer
                        `}
                      >
                    {detail.tradeSheet?.tradeSheetTypeId || 'N/A'}
                  </button>
                </td>
                <td className="p-2 border">{lawyer.firstName} {lawyer.lastName}</td>
                <td className="p-2 border capitalize">{detail.tradeSheet?.status?.replace(/([A-Z])/g, ' $1').toLowerCase() || 'N/A'}</td>
                <td className="p-2 border capitalize">{detail.tradeSheet?.tradeStatus || 'N/A'}</td>
                <td className="p-2 border capitalize">
                  {detail.tradeSheet?.representation || 'N/A'}
                </td>
                
              </tr>
            ))
        )}
        {(!selectedFirm.lawyerData || 
          selectedFirm.lawyerData.flatMap(lawyer => 
            [...(lawyer.sellerLawyerDetails || []), ...(lawyer.buyerLawyerDetails || [])]
          ).length === 0) && (
          <tr>
            <td colSpan={5} className="p-4 text-center text-gray-500">
              No trade sheets found for this firm
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
)}
            {/* Add Lawyer Modal */}
            <Modal
              open={isAddLawyerModalOpen}
              onCancel={handleCloseAddLawyerModal}
              title={`Add Lawyer to ${selectedFirm.firmName}`}
              footer={null}
              width={600}
            >
              <form className="space-y-3" onSubmit={handleAddLawyerSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label>First Name <span className="text-red-500 ml-1">*</span></label>
                    <input name="firstName" value={newLawyer.firstName} onChange={handleAddLawyerInputChange} type="text" className="border p-2 rounded w-full" />
                    {addLawyerErrors.firstName && <p className="text-red-500 text-sm">{addLawyerErrors.firstName}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label>Last Name <span className="text-red-500 ml-1">*</span></label>
                    <input name="lastName" value={newLawyer.lastName} onChange={handleAddLawyerInputChange} type="text" className="border p-2 rounded w-full" />
                    {addLawyerErrors.lastName && <p className="text-red-500 text-sm">{addLawyerErrors.lastName}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label>Lawyer Firm <span className="text-red-500 ml-1">*</span></label>
                    <input name="firmId" value={selectedFirm.firmName} disabled className="border p-2 rounded w-full bg-gray-100" />
                    {addLawyerErrors.firmId && <p className="text-red-500 text-sm">{addLawyerErrors.firmId}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label>Email </label>
                    <input name="email" value={newLawyer.email} onChange={handleAddLawyerInputChange} type="email" className="border p-2 rounded w-full" />
                    {addLawyerErrors.email && <p className="text-red-500 text-sm">{addLawyerErrors.email}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label>Phone Number </label>
                    <input
                      name="phoneNumber"
                      value={newLawyer.phoneNumber}
                      onChange={e => {
                        const formatted = formatPhoneNumber(e.target.value);
                        setNewLawyer(prev => ({ ...prev, phoneNumber: formatted }));
                      }}
                      type="text"
                      className="border p-2 rounded w-full"
                    />
                    {addLawyerErrors.phoneNumber && <p className="text-red-500 text-sm">{addLawyerErrors.phoneNumber}</p>}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" className="cancel-btn mr-1" onClick={handleCloseAddLawyerModal}>Cancel</button>
                  <button type="submit" className="primary-btn" disabled={isCreatingLawyer}>{isCreatingLawyer ? 'Creating...' : 'Submit'}</button>
                </div>
              </form>
            </Modal>

            {/* Edit Lawyer Modal */}
            <Modal
              open={isEditLawyerModalOpen}
              onCancel={handleCloseEditLawyerModal}
              title={`Edit Lawyer`}
              footer={null}
              width={600}
            >
              <form className="space-y-3" onSubmit={handleEditLawyerSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label>First Name <span className="text-red-500 ml-1">*</span></label>
                    <input name="firstName" value={editLawyer.firstName} onChange={handleEditLawyerInputChange} type="text" className="border p-2 rounded w-full" />
                    {editLawyerErrors.firstName && <p className="text-red-500 text-sm">{editLawyerErrors.firstName}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label>Last Name</label>
                    <input name="lastName" value={editLawyer.lastName} onChange={handleEditLawyerInputChange} type="text" className="border p-2 rounded w-full" />
                    {editLawyerErrors.lastName && <p className="text-red-500 text-sm">{editLawyerErrors.lastName}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label>Lawyer Firm</label>
                    <input value={selectedFirm.firmName} disabled className="border p-2 rounded w-full bg-gray-100" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label>Email</label>
                    <input name="email" value={editLawyer.email} onChange={handleEditLawyerInputChange} type="email" className="border p-2 rounded w-full" />
                    {editLawyerErrors.email && <p className="text-red-500 text-sm">{editLawyerErrors.email}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label>Phone Number</label>
                    <input
                      name="phoneNumber"
                      value={editLawyer.phoneNumber}
                      onChange={e => {
                        const formatted = formatPhoneNumber(e.target.value);
                        setEditLawyer(prev => ({ ...prev, phoneNumber: formatted }));
                      }}
                      type="text"
                      className="border p-2 rounded w-full"
                    />
                    {editLawyerErrors.phoneNumber && <p className="text-red-500 text-sm">{editLawyerErrors.phoneNumber}</p>}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" className="cancel-btn mr-1" onClick={handleCloseEditLawyerModal}>Cancel</button>
                  <button type="submit" className="primary-btn" disabled={isUpdatingLawyer}>{isUpdatingLawyer ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </Modal>



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
        </div>
      )}

      {/* Share Lawyer Modal */}
      <Modal
        onCancel={handleCancelShareLawyer}
        open={isShareLawyerModalOpen}
        title={"Share Lawyer Data"}
        width={"800px"}
        footer={[
          <button
            key="cancel"
            className="cancel-btn mr-1"
            onClick={handleCancelShareLawyer}
          >
            Close
          </button>,
          <button
            key="confirm"
            className="primary-btn"
            onClick={sendLawyerPDF}
            style={{ marginLeft: "8px" }}
          >
            Send
          </button>,
        ]}
      >
        <div className="space-y-3">
          <div ref={lawyerShareRef}>
            <h2 className="border-t border-gray-400 bg-[#243451] text-white border-x text-center text-sm font-bold py-1">
              Lawyer Information
            </h2>
            <table className="w-full text-xs border-collapse border border-gray-400 px-2 py-1">
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-2 py-1">Name</td>
                  <td className="border border-gray-400 px-2 py-1">
                    {selectedLawyer?.firstName} {selectedLawyer?.lastName}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    Lawyer Firm Name
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    {selectedFirm?.firmName || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1">Email</td>
                  <td className="border border-gray-400 px-2 py-1">
                    {selectedLawyer?.email || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    Phone Number
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    {selectedLawyer?.phoneNumber || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    Created At
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    {selectedLawyer?.createdAt ? dayjs(selectedLawyer.createdAt).format('DD MMMM YYYY, hh:mm A') : "N/A"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex flex-col mb-4">
            <label htmlFor="recipientEmail" className="mb-2 font-semibold">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter email address. Ex: example@email.com"
              className="border rounded p-2 w-full"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col mb-4">
            <label htmlFor="comment" className="mb-2 font-semibold">
              Comment
            </label>
            <ReactQuill
              id="comment"
              placeholder="Enter comment here."
              className="border rounded p-2 w-full"
              onChange={handleEditorChange}
              value={recipientNote}
            />
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
};

export default BrokerageData;
