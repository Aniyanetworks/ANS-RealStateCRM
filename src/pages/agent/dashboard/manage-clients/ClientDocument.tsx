// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import {  useParams } from "react-router-dom";
import { useEffect, useState ,useRef} from "react";
import logo from "/logo.svg";
// import type { TableColumnsType, TableProps } from "antd";
import ModalMain from "../../../../components/ui/Modal";
import { useForm } from "react-hook-form";
import {  Modal, Tabs, Button, Tooltip } from "antd";
// import { FaComment, FaRegEdit } from "react-icons/fa";
// import { MdDelete } from "react-icons/md";
import toast from "react-hot-toast";
import TableLoader from "../../../../components/loader/TableLoader";
import {
    useCreateUpdateClientDocumentMutation,
  useDeleteClientDocumentMutation,
  useDeleteClientDocumentMultipleMutation,
  useGetClientDocumentQuery,
  useGetClientDocumentNameQuery,
  
} from "../../../../redux/api/superadmin/client/clientDocumentDataSlice";
import { useAppSelector } from "../../../../redux/hooks";
import { Link } from 'react-router-dom';
import { baseUrl } from "../../../../utils/constant";
// import { TiDocument } from "react-icons/ti";
import uploadIcon from "./../../../../assets/upload2.svg";
import crossIcon from "./../../../../assets/cross.svg";
import ButtonLoader from "../../../../components/loader/buttonLoader";
// import Templates from './../../../templates/Templates';
import { AlignLeftOutlined } from "@ant-design/icons";
import rightArrow from "./../../../../assets/right-arrow.svg";


/* type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"]; */
interface DataType {
  relation: string;
  name: string;
  userId: string;
  email: string;
  uuid: string;
}


const ClientDocumentManagement = () => {
  // const [fetchLoading, setFetchLoading] = useState<boolean>(false);
  const { uuid } = useParams<{ uuid?: string }>();
  const { client } = useParams<{ client?: string }>();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const { data, isLoading, refetch } = useGetClientDocumentQuery({ uuid });
  const { data:documentData, isLoadingDocument } = useGetClientDocumentNameQuery('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [isEditMode, setIsEditMode] = useState(false);
  const [DocumentName, setDocumentName] = useState(null);
  const [isUploadingOther, setIsUploadingOther] = useState<boolean>(false);
  const [isDeletingOther, setIsDeletingOther] = useState<number | null>(null);
  const [fileDocuments, setFileDocuments] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | "null">("null");
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAppSelector((state) => state.user);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [deleteClientDocumentMultiple] =
    useDeleteClientDocumentMultipleMutation();
  const [searchText, setSearchText] = useState("");
  const fileInputRef: any = useRef(null);

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();

    const inUsers = Object.values(record.createdUser || {}).some((data) =>
      String(data).toLowerCase().includes(searchTerm.toLowerCase())
  );
  
    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return inUsers || inRecord;
  });

  /* pdf */
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [pdfToView, setPdfToView] = useState<object>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState<number>(310);
  const sliceSize = Math.floor((sidebarWidth - 300) / 15) + 20;
  const [isResizing, setIsResizing] = useState<boolean>(false);
    

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
    if (!isLoadingDocument && data) {
      // setFetchLoading(true);
  
      // Check if documentData and its properties are defined
      if (documentData?.data?.clientDocumentName) {
        const activeDocuments = documentData.data.clientDocumentName.filter(
          (file: FileType) => file.status === "active"
        );
  
        const documents = activeDocuments?.map((file: FileType) => {
          // Check if data and clientDocumentData are defined
          const fileData = data?.data?.clientDocumentData?.filter(
            (upload: UploadFileType) => upload.fileID === file.id
          );
          return {
            ...file,
            fileData,
          };
        });
  
        // setClientDocuments(activeDocuments || []);
        setFileDocuments(documents || []);
      }
      
      // setFetchLoading(false);
    }
  
    // Only update tableData if data is available
    if (data?.data?.clientDocumentData) {
      setTableData(data.data.clientDocumentData);
    }



  }, [isLoadingDocument, data, documentData?.data?.clientDocumentName]);

  
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    /* if (pdfToView?.status) {
      setSelectedStatus(pdfToView?.status);
    } */

    // Add event listener on component mount
    window.addEventListener("resize", handleResize);

    // Remove event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const {
    formState: { errors },
    /* reset,
    getValues, */
    setValue,
    setError,
    // handleSubmit,
  } = useForm<DataType>({});

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleMouseMove = (e) => {
    if (isResizing) {
      const newWidth = Math.max(300, Math.min(e.clientX, 500)); 
      setSidebarWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };


  const handleViewClick = (file: object) => {
    setPdfToView(file);
    setLoading(true);
    setError(null);
  };

  // if (isLoading) return <TableLoader />;
  const handleDownload = async () => {
    const pdfUrl = `${baseUrl}${pdfToView.file}`;

    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("Failed to fetch PDF file");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link to download the file
      const link = document.createElement("a");
      link.href = url;
      link.download = pdfToView.file;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Release the URL object
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the PDF:", error);
    }
  };

  
  

  /* const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  }; */

  /* const rowSelection: TableRowSelection<DataType> = {
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
  }; */

  

  const [createUpdateClientDocument] =
  useCreateUpdateClientDocumentMutation();
  const [deleteClientDocument] = useDeleteClientDocumentMutation();

  const handleCancel = () => {
    resetForm();
    setIsModalOpen(false);
    // setIsEditMode(false);
    setSelectedUUID("null");
  };

  const resetForm = () => {
    setValue("title", "");
    setValue("filePath", null);
    setValue("userId", uuid);
    // setIsEditMode(false);
    setSelectedUUID("null");
  };

  /* const handleEdit = (record: DataType) => {
    reset(record);
    setIsEditMode(true);
    setSelectedUUID(record.uuid);
    showModal();
  }; */

  const confirmDelete = async () => {
    if (!selectedUUID) return; // Add check to avoid undefined
    try {
      const response = await deleteClientDocument(selectedUUID).unwrap();
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
    setIsDeleteModalMultipleVisible(false);
  };

  const handleDelete = (uuid: string) => {
    setSelectedUUID(uuid);
    setIsDeletingOther(uuid);
    setIsModalVisible(true);
  };



  const handleOtherDocumentUpload = async (e) => {
    setIsUploadingOther(true);

    const formData = new FormData();
    formData.append("filePath", e.target.files[0]);
      formData.append("title", DocumentName || 'unknown')
      formData.append("userId", uuid);

    try {
      const response = await createUpdateClientDocument({
        uuid: selectedUUID,
        data:formData,
      });
      

      setDocumentName("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      handleResponse(response);
      
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
      setIsUploadingOther(false);
    }
   
  };

  const handleResponse = (response: any) => {         
    setIsUploadingOther(false);
    setIsUploading(null);
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

  const handleUploadFile = async (e: any, document: any) => {
    setIsUploading(document.id);
  const formData = new FormData();
    formData.append("filePath", e.target.files[0]);
      formData.append("title",  document.name || 'unknown')
      formData.append("userId", uuid);
      formData.append("fileID", document.id);

      try {     
        const response =  await createUpdateClientDocument({
          uuid: selectedUUID,
          data:formData,
        });

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        handleResponse(response);
        
      } catch (error: any) {
        setIsUploading(null);
        toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
      }
    };

  /* const onSubmit = async () => {
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
      if (!data.filePath) {
        setError("filePath", {
          type: "manual",
          message: "File Is Required",
        });
        return;
      }
      
      const formData = new FormData();
      formData.append("filePath", data.filePath);
      formData.append("title", data.title);
      formData.append("userId", data.userId);

      const response = await createUpdateClientDocument({
        uuid: selectedUUID,
        data:formData,
      });

      handleResponse(response);
    } catch (error: any) {
      toast.error("Update failed. Something went wrong!");
      console.error("Error:", error);
    } finally {
      setIsUploading(false);
      if (isEditMode) {
        setIsEditMode(false);
        setSelectedUUID("null"); 
      }
    }
  }; */

  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true); 
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys?.length > 0) {
      try {
        const response = await deleteClientDocumentMultiple(selectedRowKeys);
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

 /*  const columns: TableColumnsType<DataType> = [
    {
      title: "#",
      key: "serial",
      width: 50,
      render: (_, __, index) => index + 1,
      fixed: "left",
    },
    {
        title: "Title",
        dataIndex: "title",
        key: "title",
        render: (title) => (
          <span>
            {title || "N/A"}
          </span>
        ),
  
        width: 240,
      },
      
      {
        title: "File",
        dataIndex: "file",
        key: "file",
        render: (file) => (
          file ? (
            <div>
              <NavLink
                to={`${baseUrl + file}`}
                className="flex items-center p-1 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors rounded-md"
                target="_blank"
              >
                <span className="flex-1">Download</span>
                <TiDocument />
              </NavLink>
            </div>
          ) : null
        ),
      width: 240,
    },
    {
      title: "Actions",
      dataIndex: "uuid",
      key: "actions",
      fixed: "right",
      render: (uuid, recoard) => (
        <div className="flex gap-5 items-center">
          <button
            onClick={() => handleEdit(recoard)}
            className="hover:text-red-500 text-lg duration-100"
          >
            <FaRegEdit />
          </button>

          {recoard.status === "rejected" && (
            <button
              onClick={() => handleRejectReasonView(recoard?.rejectReason)}
              className="text-[16px] hover:text-primaryPurple duration-100 ml-4"
            >
              <FaComment className="text-red-500" />{" "}
            </button>
          )}

          {((user.userType === "agent") ||
            user.userType === "superAdmin" ||
            user.userType === "admin") && (
            <button
              onClick={() => handleDelete(uuid)}
              className="hover:text-red-500 text-lg duration-100"
            >
              <MdDelete /> 
            </button>
          )}
          
        </div>
      ),
    },
  ]; */

  const showModal = () => setIsModalOpen(true);
  return (
    <div className="pb-32">
      <div className="flex items-center justify-between gap-5 xl:gap-10  mb-5 p-1">
        <h1>{client}</h1>
        <div className="w-1/2">
          <input
            type="text"
            placeholder="Search documents"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="global-search "
          />
        </div>
        <div>
          <button onClick={showModal} className="primary-btn mx-3">
            Upload Document
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
      defaultActiveKey="4"
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
          /* <Table
          scroll={{ x: "max-content" }}
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 20 }}
          rowKey="uuid"
          /> */


          <div>
        <div className="flex h-[calc(100vh-7rem)]">
          {/* Resizer */}

          <div
            style={{ width: `${sidebarWidth}px` }}
            className={`    absolute lg:relative   rounded-l-lg bg-white h-[calc(100vh-7rem)] overflow-y-auto overflow-x-hidden  py-5 ${
              collapsed
                ? collapsed && windowWidth < 1024
                  ? "block"
                  : "hidden"
                : !collapsed && windowWidth < 1024
                ? "hidden"
                : "block"
            }`}
          >
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`absolute top-2 w-[30px] right-0 lg:hidden ${
                !collapsed && "hidden"
              }`}
            >
              <svg
                fill="#000"
                height="15px"
                width="15px"
                version="1.1"
                id="Layer_1"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                viewBox="0 0 330 330"
                xml:space="preserve"
              >
                <path
                  id="XMLID_92_"
                  d="M111.213,165.004L250.607,25.607c5.858-5.858,5.858-15.355,0-21.213c-5.858-5.858-15.355-5.858-21.213,0.001
	l-150,150.004C76.58,157.211,75,161.026,75,165.004c0,3.979,1.581,7.794,4.394,10.607l150,149.996
	C232.322,328.536,236.161,330,240,330s7.678-1.464,10.607-4.394c5.858-5.858,5.858-15.355,0-21.213L111.213,165.004z"
                />
              </svg>
            </button>
            {filteredData?.filter((file: any) => file.fileID !== null)?.map((file: any, index: number)  => (
                <div key={index} className=" ">
                  <div>
                          <ul
                            onClick={() => [
                              setCategoryId(file.id),
                              handleViewClick(file),
                            ]}
                            className={`relative flex px-5 text-[#0b3b38] py-2 hover:bg-[#f0f7f6] ${
                              file.file == pdfToView.file &&
                              "bg-[#f0f7f6]"
                            } items-center   cursor-pointer gap-3`}
                          >
                            <Tooltip
                              placement="right"
                              color="#fff"
                              title={file.title}
                            >
                              <div className="flex gap-2 items-center">
                                {file.file == pdfToView.file ? (
                                  <svg
                                    width="15px"
                                    height="15px"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M0 1H6L9 4H16V14H0V1Z"
                                      fill="#0f766e"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    width="15px"
                                    height="15px"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M0 1H6L9 4H16V14H0V1Z"
                                      fill="#000000"
                                    />
                                  </svg>
                                )}

                                <p
                                   style={{
                                    color: file.file == pdfToView.file
                                        ? "#f59e0b"
                                        : "", 
                                  }}
                                >
                                  {file.title.length > 20
                                    ? file.title.slice(0, 18) + "..." 
                                    : file.title}
                                </p>
                              </div>
                            </Tooltip>
                            {file.file === pdfToView.file && (
                              <div className="absolute right-[-8px] top-1/2 transform -translate-y-1/2">
                                <span className="bg-[#fff] h-4 w-4 rotate-45 transform block"></span>
                              </div>
                            )}
                          </ul>
                  </div>
                </div>
              )
            )}

            <div>              
                <div  className={`px-5 py-2 hover:bg-[#f0f7f6] text-[#0b3b38]`}>
                <div>
              {filteredData?.filter((file: any) => file.fileID === null)?.length === 1 ? (
                filteredData?.filter((file: any) => file.fileID === null)?.map((uploadFile: any, i: number) => (
                  <ul
                    key={i}
                    onClick={() => [
                      setCategoryId("someId"), 
                      handleViewClick(uploadFile),
                    ]}
                    style={{
                      color: uploadFile.file == pdfToView.file
                          ? "#f59e0b"
                          : "", 
                    }}
                    className={`flex text-[#0b3b38] py-2 hover:bg-[#f0f7f6]  items-center cursor-pointer gap-3 `}
                  >
                    <Tooltip placement="right" color="#fff" title="Others">
                      <div className="flex items-center gap-2">
                        <svg
                          width="15px"
                          height="15px"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M0 1H6L9 4H16V14H0V1Z" fill="#000000" />
                        </svg>{" "}
                        <p>Others Document</p>
                      </div>
                    </Tooltip>
                  </ul>
                ))
              ) : (
                <div className={` py-2 hover:bg-[#f0f7f6] text-[#0b3b38]`}>
                  <div>
                    <div
                      onClick={
                        () =>
                          setCategoryId(
                            categoryId === "someId" ? null : "someId"
                          ) 
                      }
                      className="flex cursor-pointer justify-between items-center"
                    >
                      <Tooltip placement="right" title="Others" color="#fff">
                        <div className="flex items-center gap-2">
                          <svg
                            width="20px"
                            height="20px"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M3 8.2C3 7.07989 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H9.67452C10.1637 5 10.4083 5 10.6385 5.05526C10.8425 5.10425 11.0376 5.18506 11.2166 5.29472C11.4184 5.4184 11.5914 5.59135 11.9373 5.93726L12.0627 6.06274C12.4086 6.40865 12.5816 6.5816 12.7834 6.70528C12.9624 6.81494 13.1575 6.89575 13.3615 6.94474C13.5917 7 13.8363 7 14.3255 7H17.8C18.9201 7 19.4802 7 19.908 7.21799C20.2843 7.40973 20.5903 7.71569 20.782 8.09202C21 8.51984 21 9.0799 21 10.2V15.8C21 16.9201 21 17.4802 20.782 17.908C20.5903 18.2843 20.2843 18.5903 19.908 18.782C19.4802 19 18.9201 19 17.8 19H6.2C5.07989 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2Z"
                              stroke="#000000"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                          <p>Others Document</p>
                        </div>
                      </Tooltip>
                      {filteredData?.filter((file: any) => file.fileID === null)?.length === 0 ? (
                        ""
                      ) : (
                        <img src={rightArrow} alt="" />
                      )}
                    </div>
                    <div
                      className={`space-y-3 ml-10 transition-all duration-500 ease-in-out overflow-hidden ${
                        categoryId === "someId"
                          ? "max-h-[1000px] opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      {filteredData?.filter((file: any) => file.fileID === null)?.map((uploadFile: any) => (
                        <div>
                          <ul className="flex  cursor-pointer mt-2">
                            <Tooltip
                              placement="right"
                              color="#fff"
                              title={uploadFile.title}
                            >
                              <p  style={{
                      color: uploadFile.file == pdfToView.file
                          ? "#f59e0b"
                          : "", 
                    }}
                              onClick={() => handleViewClick(uploadFile)}>
                                {uploadFile.title.slice(
                                  0,
                                  sliceSize
                                )}
                              </p>
                            </Tooltip>
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
                </div>
            </div>
          </div>
          <div
            className="w-[4px] bg-gray-200 cursor-ew-resize"
            onMouseDown={handleMouseDown}
          ></div>

          <div className=" w-full   bg-white rounded-r-lg shadow-md p-4">
            <div className="flex justify-between pb-4 items-center border-b mb-2">
              <h3 className=" font-semibold flex items-center gap-2 text-[#0b3b38]">
                <div onClick={() => setCollapsed(!collapsed)}>
                  <AlignLeftOutlined></AlignLeftOutlined>
                </div>
                {Object.keys(pdfToView).length > 0
                  ? pdfToView?.title
                  : "Client Documents"}
                {!pdfToView?.title
                  ? pdfToView?.file
                      ?.split(/[/\\]/) 
                      .pop()
                  : ""}{" "}
              </h3>
              <div className="flex items-center">
                {Object.keys(pdfToView).length > 0 && (
                  <button onClick={handleDownload} className="primary-btn ml-2">
                    Download
                  </button>
                )}
              </div>
            </div>
            

            {Object.keys(pdfToView).length > 0 ? (
              <div className="pdf-viewer ">
                {error && <p className="text-red-500">{error}</p>}

                { pdfToView.file.split('.').pop().toLowerCase() == 'pdf' && (
                  <iframe
                  src={`${baseUrl + pdfToView.file}`}
                  className="overflow-auto w-full h-[calc(100vh-17rem)]"
                  title="PDF Preview"
                  onLoad={() => setLoading(false)}
                  onError={() => setError("Failed to load PDF")}
                  style={{
                    border: "none", 
                    overflow: "hidden", 
                    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)", 
                    borderRadius: "8px", 
                  }}
                />
                )}
                { pdfToView.file.split('.').pop().toLowerCase() != 'pdf' && (
                  <img
                  src={`${baseUrl + pdfToView.file}`}
                  className="overflow-auto"
                  title="PDF Preview"
                  onLoad={() => setLoading(false)}
                  onError={() => setError("Failed to load PDF")}
                  style={{
                    border: "none",
                    overflow: "hidden",
                    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                    borderRadius: "8px",
                    maxWidth: "100%", 
                    width: "100%",    
                    height: "auto",   
                  }}
                />
                
                )}
                
              </div>
            ) : (
              <div className="h-[calc(100vh-14rem)] flex flex-col justify-center items-center gap-2  ">
                <img src={logo} alt="" className={`w-[70px]`} />
                <h2
                  className={` tracking-widest text-[18px] 2xl:[20px] text-center playfair-display-sc-bold text-[#0f766e]`}
                >
                  ANS REALSTATECRM
                </h2>
              </div>
            )}
          </div>
        </div>
      </div>











        )}
      </div>
      
      {/* File Upload */}
      <ModalMain
        handleCancel={handleCancel}
        isModalOpen={isModalOpen}
        // handleOk={handleSubmit(onSubmit)}
        title="Manage Clients Documents"
        isLoading={isUploading}
        modalClass={"lg:!w-[60%] !z-[10000]"}
        hideFooter={true}
      >
        {/* documents upload and show */}
        {fileDocuments?.map((document: any, index: number) => (
          <div key={index}>
            <div className="flex px-2 border-b border-[#eaf4f2] hover:bg-[#f8f8f8e3] py-2 items-center justify-between">
              <div className="w-[80px] ">
                <p>{index + 1}</p>
              </div>
              <div className="w-full flex gap-1 items-center">
                <p>
                  {document.name.slice(0, 70)}
                  {document?.name?.length > 70 ? "  ..." : ""}
                </p>
                <p className="text-red-500">
                  {document.required === "yes" ? "*" : ""}
                </p>
                <p className=" text-gray-400">
                  {document.paperType == "singleUpload"
                    ? " (Only one file allowed)"
                    : " (Multiple files allowed)"}
                </p>

                {filteredData?.map((file: any, i: number) => {
                  if (document?.id == file.fileID) {
                    return (
                      <div key={i} className="flex items-center">
                        <p>
                          <a
                            href={`${baseUrl}${file?.file}`}
                            target="_blank"
                            rel="noopener noreferrer" 
                            className="text-blue-500"
                          >
                            {file?.file?.split(/[/\\]/).pop() || "Unnamed File"}
                          </a>
                        </p>
                        
                        <button
                          onClick={() => handleDelete(file.uuid)}
                          className="text-white px-3 rounded-md"
                        >
                          <img src={crossIcon} alt="Remove" />
                        </button>
                      </div>
                    );
                  }
                  return null;
                })}

              </div>
              <div className="flex items-center gap-2">
                {document?.paperType == "singleUpload" ? (
                  !filteredData.some(item => item.fileID === document?.id) ? (
                    <div>
                      <label htmlFor={document.name} className="cursor-pointer">
                        <input
                          ref={fileInputRef}
                          onChange={(e) => handleUploadFile(e, document)}
                          type="file"
                          className="hidden"
                          id={document.name}
                        />
                        {isUploading === document.id ? (
                          <ButtonLoader />
                        ) : (
                          <img src={uploadIcon} alt="" className="-mb-2" />
                        )}
                      </label>
                    </div>
                  ) : null
                ) : document.paperType == "multipleUpload" ? (
                  <div>
                    <label htmlFor={document.name} className=" cursor-pointer">
                      <input
                        ref={fileInputRef}
                        onChange={(e) => handleUploadFile(e, document)}
                        type="file"
                        className="hidden"
                        id={document.name}
                      />
                      {isUploading == document.title ? (
                        <ButtonLoader />
                      ) : (
                        <img src={uploadIcon} alt="" className="-mb-2" />
                      )}
                    </label>
                  </div>
                ) : (
                  <label htmlFor={document.name} className=" cursor-pointer">
                      <input
                        ref={fileInputRef}
                        onChange={(e) => handleUploadFile(e, document)}
                        type="file"
                        className="hidden"
                        id={document.name}
                      />

                      {isUploading == document.id ? (
                        <ButtonLoader />
                      ) : (
                        <img src={uploadIcon} alt="" className="-mb-2" />
                      )}
                    </label>
                )}

                
              </div>
            </div>
            <div>
              {document.fileData?.length > 1 && (
                <div>
                  {document?.fileData.map((file: any, i: number) => (
                    <div
                      key={i}
                      className="ml-20 py-2 border-b border-[#eaf4f2] "
                    >
                      <p className="flex items-center">
                        <a
                          key={i}
                          href={baseUrl + file.filePath}
                          target="_blank"
                          className=" text-blue-500"
                        >
                          {"  "}
                          {file.filePath?.split(/[/\\]/).pop()}
                        </a>                        
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* other files upload */}
        <div className="flex justify-between items-center p-2">
          <div className="flex items-center gap-3">
            <p className="w-[80px] ">*</p>
            <p className=" ml-3 text-nowrap">Upload other documents</p>
            <input
              type="text"
              name=""
              id=""
              className="min-w-[300px]"
              placeholder="File name"
              value={DocumentName}
              onChange={(e) => {
                setDocumentName(e.target.value);
              }}
            />
          </div>
          <div className={`${DocumentName ? "block" : "hidden "}`}>
            <label htmlFor="upload-others" className=" cursor-pointer">
              <input
                ref={fileInputRef}
                onChange={handleOtherDocumentUpload}
                type="file"
                className="hidden"
                id="upload-others"
              />

              {isUploadingOther ? (
                <ButtonLoader />
              ) : (
                <img src={uploadIcon} alt="" className="-mb-2" />
              )}
            </label>
          </div>
        </div>

        {/* all files others show */}
        <div>
          {filteredData?.map((file: any, index: number) => {
            if (!file.fileID) {
              return (
                <div
                  key={index}
                  className="ml-20 py-2 border-b border-[#eaf4f2]"
                >
                  <p className="flex items-center">
                    <a
                      href={`${baseUrl}${file?.file}`}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="text-blue-500"
                    >
                      {file?.file?.split(/[/\\]/).pop() || "Unnamed File"}
                    </a>

                    <button
                    onClick={() => handleDelete(file.uuid)}
                      className="text-white px-3 rounded-md"
                    >
                      {isDeletingOther === file.uuid ? (
                        <ButtonLoader />
                      ) : (
                        <img src={crossIcon} alt="Remove" />
                      )}
                    </button>
                  </p>
                </div>
              );
            }
            return null; 
          })}
        </div>
      </ModalMain>

      {/* Delete  Confirmation Modal */}
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

export default ClientDocumentManagement;
