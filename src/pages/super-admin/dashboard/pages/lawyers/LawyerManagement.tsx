// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useEffect, useRef, useState } from "react";
import type { TableColumnsType, TableProps } from "antd";
import { useForm } from "react-hook-form";
import { Table, Modal, Button, Dropdown, Space, Tooltip } from "antd";
import {
  useGetLawyerDataQuery,
  useCreateLawyerDataMutation,
  useUpdateLawyerDataMutation,
  useDeleteLawyerDataMutation,
  useDeleteLawyerDataMultipleMutation,
  useSendLawyerPDFEmailMutation,
} from "../../../../../redux/api/superadmin/lawyerDataSlice";

import {
  useGetLawyerFirmDataQuery,
} from "../../../../../redux/api/superadmin/lawyerFirmDataSlice";
import { FaRegEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import toast from "react-hot-toast";
import {
  useGetCitiesQuery,
  useGetStatesQuery,
} from "../../../../../redux/api/common/countryStateCitySlice";
import TableLoader from "../../../../../components/loader/TableLoader";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaShareNodes } from "react-icons/fa6";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  formatPhoneNumber,
  formatPostalCode,
} from "../../../../../utils/format";
import ReactQuill from "react-quill-new";
import { usePermissions } from "../../../../../utils/permissionUtils";
import 'react-quill-new/dist/quill.snow.css';
import { NavLink } from "react-router-dom";
type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface Lawyer {
  key?: React.Key;
  firstName: string;
  lastName: string;
  address: string;
  streetAddress: string;
  countryId: number;
  stateId: number;
  cityId: number;
  postalZipCode: string;
  phoneNumber: string;
  cellPhoneNumber: string;
  faxNumber: string;
  email: string;
  uuid: string;
}

interface City {
  id: number;
  name: string;
}

interface State {
  id: number;
  name: string;
}

const LawyersDataManagement = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [tableData, setTableData] = useState<Lawyer[]>([]);
  const { data, isLoading, refetch } = useGetLawyerDataQuery("");
  const { data:firms } = useGetLawyerFirmDataQuery("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModal2Open, setIsModal2Open] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [deleteLawyerDataMultiple] = useDeleteLawyerDataMultipleMutation();
  const [searchText, setSearchText] = useState("");
  const lawyerRef = useRef<HTMLDivElement>(null);

  const [recipientNote, setRecipientNote] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [cellPhoneNumber, setCellPhoneNumber] = useState<string>("");
  const [faxNumber, setFaxNumber] = useState<string>("");

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
    const inFirmName = (record.firm?.firmName || "").toLowerCase().includes(searchTerm);
    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return inProperties1 || inProperties2 || inProperties3 || inFirmName || inRecord;
  });

  useEffect(() => {
    setTableData(data?.data?.lawyerData);
  }, [data]);

  const {
    register,
    formState: { errors },
    reset,
    getValues,
    setError,
    setValue,
    handleSubmit,
    watch,
  } = useForm({ defaultValues: { countryId: 39 } });

  const [createLawyerData] = useCreateLawyerDataMutation();
  const [updateLawyerData] = useUpdateLawyerDataMutation();
  const [deleteLawyerData] = useDeleteLawyerDataMutation();

  const resetForm = () => {
    reset({
      firstName: "",
      lastName: "",
      firmId: "",
      address: "",
      streetAddress: "",
      countryId: 39,
      cityId: "",
      stateId: "",
      postalZipCode: "",
      phoneNumber: "",
      cellPhoneNumber: "",
      faxNumber: "",
      email: "",
    });
    setRecipientNote("");
    setRecipientEmail("");
    setValue("comment", "");
    setValue("recipientEmail", "");
    setPostalCode("");
    setPhoneNumber("");
    setCellPhoneNumber("");
    setFaxNumber("");
  };

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedUUID(null);
  };

  const handleEdit = (record: Lawyer) => {
    reset(record);
    setIsEditMode(true);
    setSelectedUUID(record?.uuid);
    showModal();
    setPostalCode(record?.postalZipCode);
    setPhoneNumber(record?.phoneNumber);
    setCellPhoneNumber(record?.cellPhoneNumber);
    setFaxNumber(record?.faxNumber);
    setValue("countryId", record?.countryId);
    setValue("stateId", record?.stateId);
    setValue("cityId", record?.cityId);
  };

  const shareIt = (record: Lawyer) => {
    reset(record);
    setSelectedUUID(record?.uuid);
    showModal2();
  };

  const handleCancel2 = () => {
    resetForm();
    setRecipientNote("");
    setRecipientEmail("");
    setValue("comment", "");
    setValue("recipientEmail", "");
    setIsModal2Open(false);
  };

  const confirmDelete = async () => {
    try {
      const response = await deleteLawyerData(selectedUUID).unwrap();
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

  const selectedCountry = watch("countryId");
  const selectedState = watch("stateId");


  const { data: states = [] } = useGetStatesQuery(selectedCountry, {
    skip: !selectedCountry,
  });

  const { data: cities = [] } = useGetCitiesQuery(selectedState, {
    skip: !selectedState,
  });

  
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<Lawyer> = {
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

  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true);
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteLawyerDataMultiple(selectedRowKeys);
        setIsDeleteModalMultipleVisible(false);
        await refetch();
        if (response.data.status == true) {
          setSelectedRowKeys([]);
          toast.success("Announcement deleted successfully!");
        } else {
          toast.error("Failed to delete announcement. Please try again.");
        }
      } catch (error: unknown) {
        setIsDeleteModalMultipleVisible(false);
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("An unknown error occurred.");
        }
      }
    } else {
      toast.error("Please Select Items.");
    }
  };

  const onSubmit = async () => {
    const data = getValues();

    if (isEditMode) {
      try {
        if (!selectedUUID) {
          throw new Error("UUID is null");
        }
        const response = await updateLawyerData({
          uuid: selectedUUID,
          data,
        });

        if (response && 'error' in response && response.error?.data?.status == false) {
          (response.error.data.errors as unknown[]).forEach((error) => {
            const err = error as { path: string; msg: string };

            setError(err.path, {
              type: "field",
              message: err.msg,
            });
          });
        } else if (response?.data?.status == true) {
          toast.success(`${response?.data?.message}`);
          setIsModalOpen(false);
          setIsEditMode(false);
          setSelectedUUID(null);
          resetForm();
          setPostalCode("");
        } else {
          resetForm();
          setIsEditMode(false);
        }
      } catch (error) {
        toast.error("Update failed. Something went wrong!");
        console.error("Update error:", error);
      }
    } else {
      try {
        const response = (await createLawyerData(data)) as any;

        if (response?.error?.data?.status == false) {
          if (response.error.data.errors) {
            (response.error.data.errors as unknown[]).forEach((error) => {
              const err = error as { path: string; msg: string };
              setError(err.path, {
                type: "manual",
                message: err.msg,
              });
            });
          } else {
            toast.error(`${response?.error.data?.message}`);
          }
        } else if (response?.data?.status == true) {
          toast.success(`${response?.data?.message}`);
          setIsModalOpen(false);
          resetForm();
        } else {
          resetForm();
          setIsEditMode(false);
        }
      } catch (error) {
        console.error("Submission error:", error);
      }
    }
  };

  const [sendLawyerPDFEmail] = useSendLawyerPDFEmailMutation();

  const sendLawyerPDF = async () => {
    if (!lawyerRef.current) return;

    const formValues = getValues();
    const emailValue = formValues.recipientEmail || recipientEmail;
    const commentValue = formValues.comment || recipientNote;

    if (!emailValue) {
      toast.error("Email is required");
      return;
    }

    const generateAndSendPDF = async () => {
      try {
        const canvas = await html2canvas(lawyerRef.current);
        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const margin = 20;
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        let pdfImgWidth = pageWidth - 2 * margin;
        let pdfImgHeight = (imgHeight * pdfImgWidth) / imgWidth;

        if (pdfImgHeight > pageHeight - 2 * margin) {
          const scaleRatio = (pageHeight - 2 * margin) / pdfImgHeight;
          pdfImgWidth *= scaleRatio;
          pdfImgHeight *= scaleRatio;
        }

        pdf.addImage(imgData, "PNG", margin, margin, pdfImgWidth, pdfImgHeight);

        const pdfBlob = pdf.output("blob");
        const pdfFile = new File([pdfBlob], "lawyer-details.pdf", {
          type: "application/pdf",
        });

        const formData = new FormData();
        formData.append("email", emailValue);
        formData.append("note", commentValue || "");
        formData.append("uuid", selectedUUID);
        formData.append("attachments", pdfFile);

        const response = await sendLawyerPDFEmail(formData).unwrap();

        if (response.status) {
          toast.success(response.message);
          setRecipientNote("");
          setRecipientEmail("");
          setValue("comment", "");
          setValue("recipientEmail", "");
          setIsModal2Open(false);
        }
      } catch (error) {
        console.error("Error generating or sending PDF:", error);
      }
    };

    setTimeout(() => {
      generateAndSendPDF();
    }, 500);
  };

  const columns: TableColumnsType<Lawyer> = [

    {
      title: "Lawyer Firm",
      dataIndex: "firm",
      key: "firm",
      sorter: (a, b) => {
        const aName = a.firm?.firmName || '';
        const bName = b.firm?.firmName || '';
        return aName.localeCompare(bName);
      },
      filterSearch: true,
      filters: Array.from(
        new Set(tableData?.map((item) => item.firm?.firmName).filter(Boolean))
      ).map((name) => ({
        text: name,
        value: name,
      })),
      onFilter: (value, record) => record.firm?.firmName === value,
      ellipsis: true,
      render: (_, record) => record.firm?.firmName || 'N/A',
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      ellipsis: true,
      render: (text: string, record: any) => (
        <Tooltip title={text}>
          <button
            onClick={() => handleEdit(record)}
            className="hover:text-blue-600 cursor-pointer hover:underline"
          >
            {text?.length > 30 ? `${text?.slice(0, 30)}...` : text}
          </button>
        </Tooltip>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => a.email.localeCompare(b.email),
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
          menu={{
            items: [
              hasPermissionForSlug("edit-lawyers") && {
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
              hasPermissionForSlug("delete-lawyers") && {
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
              {
                key: "share",
                label: (
                  <button
                    className="flex items-center gap-2 w-full"
                    onClick={() => shareIt(record)}
                  >
                    <FaShareNodes />
                    Share
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
  const showModal2 = () => setIsModal2Open(true);

  const tableSourceData = filteredData?.map((item: Lawyer, index: number) => {
    return {
      ...item,
      serial: index + 1,
    };
  });

  const handleChangePostalCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const postalCode = e.target.value;
    const value = formatPostalCode(postalCode);

    setPostalCode(value);
  };

  const handleChangePhoneNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneNumber = e.target.value;

    const value = formatPhoneNumber(phoneNumber);
    setPhoneNumber(value);
  };

  const handleChangeCellPhoneNumber = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const cellPhoneNumber = e.target.value;

    const value = formatPhoneNumber(cellPhoneNumber);
    setCellPhoneNumber(value);
  };


  const handleChangeFaxNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const faxNumber = e.target.value;

    const value = formatPhoneNumber(faxNumber);
    setFaxNumber(value);
  };

  const handleEditorChange = (value: string) => {
    setRecipientNote(value);
    setValue("comment", value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <div className="pb-32">
      <div className="flex items-center justify-between gap-5 xl:gap-10  mb-5 p-1">
        <h1>Lawyers List</h1>

        <div className="w-1/2">
          <input
            type="text"
            placeholder="Search from table..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="global-search "
          />
        </div>

        <div className="flex">
          <NavLink to={"/dashboard/super-admin/lawyer-firm-managements"}  className="primary-btn mx-3">
            Lawyer Firms
          </NavLink>
          {hasPermissionForSlug("create-lawyers") && (
            <button onClick={showModal} className="primary-btn mx-3">
              Add New
            </button>
          )}
          {hasPermissionForSlug("delete-lawyers") && (
            <button
              onClick={handleDeleteMultipleClick}
              className="cancel-btn mx-3"
            >
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
          />
        )}
      </div>

      <Modal
        onCancel={handleCancel}
        open={isModalOpen}
        title={isEditMode ? "Edit Lawyer Data" : "Create Lawyer Data"}
        width={"800px"}
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
            onClick={onSubmit}
            style={{ marginLeft: "8px" }}
          >
            Submit
          </button>,
        ]}
      >
        <form className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label>
                First Name <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("firstName", {
                  required: "Lawyer name is required",
                })}
                type="text"
                placeholder="Enter Lawyer Name"
                className=""
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm">
                  {errors.firstName.message as string}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>
                Last Name <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                {...register("lastName", {
                  required: "Lawyer name is required",
                })}
                type="text"
                placeholder="Enter Lawyer Name"
                className=""
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm">
                  {errors.lastName.message as string}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>
              Lawyer Firm <span className="text-red-500 ml-1">*</span>
              </label>
              <select
              {...register("firmId", {
                required: "Lawyer firm name is required",
              })}
              className=""
              defaultValue=""
              >
              <option value="" disabled>
                Select Lawyer Firm
              </option>
              {firms?.data?.lawyerFirm?.map((firm: any) => (
                <option key={firm.id} value={firm.id}>
                {firm.firmName}
                </option>
              ))}
              </select>
              {errors.firmId && (
              <p className="text-red-500 text-sm">
                {errors.firmId.message as string}
              </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>
                Email
              </label>
              <input
                {...register("email")}
                type="text"
                placeholder="Enter your Email"
                className=""
              />
              {errors.email && (
                <p className="text-red-500 text-sm">
                  {errors.email.message as string}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>
                Phone Number 
              </label>
              <input
                value={phoneNumber}
                type="text"
                id="phoneNumber"
                placeholder="+1 (XXX) XXX-XXXX"
                maxLength="18"
                className=""
                {...register("phoneNumber")}
                onChange={handleChangePhoneNumber}
              />

              {errors.phoneNumber && (
                <p className="text-red-500 text-sm">
                  {errors.phoneNumber.message as string}
                </p>
              )}
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        onCancel={handleCancel2}
        open={isModal2Open}
        title={"Share Lawyer Data"}
        width={"800px"}
        footer={[
          <button
            key="cancel"
            className="cancel-btn mr-1"
            onClick={handleCancel2}
          >
            Close
          </button>,
          <button
            key="confirm"
            className="primary-btn"
            onClick={handleSubmit(sendLawyerPDF)}
            style={{ marginLeft: "8px" }}
          >
            Send
          </button>,
        ]}
      >
        <div className="space-y-3">
          <div ref={lawyerRef}>
            <h2 className="border-t border-gray-400 bg-[#0b3b38] text-white border-x text-center text-sm font-bold py-1">
              Lawyer Information
            </h2>
            <table className="w-full text-xs border-collapse border border-gray-400 px-2 py-1">
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-2 py-1">Name</td>
                  <td className="border border-gray-400 px-2 py-1">
                    {watch("name") || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    Lawyer Firm Name
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    {watch("firm.firmName") || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1">Address</td>
                  <td className="border border-gray-400 px-2 py-1">
                    {watch("address") || ""}, {watch("streetAddress") || ""},
                    {states?.data?.states?.find(
                      (state: State) => state.id === watch("stateId")
                    )?.name || ""}
                    ,
                    {cities?.data?.cities?.find(
                      (city: City) => city.id === watch("cityId")
                    )?.name || ""}
                    ,{watch("postalZipCode") || ""}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1">Email</td>
                  <td className="border border-gray-400 px-2 py-1">
                    {watch("email") || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    Phone Number
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    {watch("phoneNumber") || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    Cell Phone Number
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    {watch("cellPhoneNumber") || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    Fax Number
                  </td>
                  <td className="border border-gray-400 px-2 py-1">
                    {watch("faxNumber") || "N/A"}
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
              {...register("recipientEmail", { 
                required: "Email is required",
              })}
              onChange={(e) => {
                setRecipientEmail(e.target.value);
              }}
            />
            {errors.recipientEmail && (
              <p className="text-red-500">{errors.recipientEmail.message}</p>
            )}
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
              value={watch("comment")}
            />
            <input
              type="hidden"
              {...register("comment", {
                required: "Comment is required",
                validate: (value) =>
                  value.trim() !== "" || "Comment cannot be empty",
              })}
            />
            {errors.comment && (
              <p className="text-red-500">{errors.comment.message}</p>
            )}
          </div>
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

export default LawyersDataManagement;
