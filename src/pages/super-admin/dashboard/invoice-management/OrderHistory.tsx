// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import type { TableColumnsType, TableProps } from "antd";
import ModalMain from "../../../../components/ui/Modal";
import { useForm } from "react-hook-form";
import { Table, Modal, Button, Dropdown, Space, Select, Tag } from "antd";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaEye, FaFile, FaSearch, FaTimes } from "react-icons/fa";
import logo from "/logo.svg";
import { MdDelete } from "react-icons/md";
import toast from "react-hot-toast";
import TableLoader from "../../../../components/loader/TableLoader";

import html2pdf from 'html2pdf.js';
import {
  useCreateUpdateOrderMutation,
  useDeleteOrderMutation,
  useDeleteOrderMultipleMutation,
  useGetOrderQuery,
  useChangeOrderPaymentStatusMutation,
} from "../../../../redux/api/superadmin/invoice/orderDataSlice";

import { useAppSelector } from "../../../../redux/hooks";
import { Link } from "react-router-dom";
import { formatDate, parseISO } from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";
import { usePermissions } from "../../../../utils/permissionUtils";
import { formatNumberWithCommasAndDecimals } from "../../../../utils/formatNumberWithCommasAndDecimals";
import { text } from "stream/consumers";

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
  const { filter } = useParams()
  const { hasPermissionForSlug } = usePermissions();
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const sectionRef = useRef();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [details_data, setDetailsData] = useState<DataType>({});
  const { uuid } = useParams<{ uuid?: string }>();
  const { data, isLoading, refetch } = useGetOrderQuery('purchase');
  const [taxRate] = useState<string | null>(13.0);
  const [onlineTransectionCharge] = useState<string | null>(5.0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | "null">("null");
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAppSelector((state) => state.user);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [deleteClientPropertyListingMultiple] =
    useDeleteOrderMultipleMutation();
  const [searchText, setSearchText] = useState("");
  const [filteredInfo, setFilteredInfo] = useState<Record<string, React.Key[] | null>>({});
const [sortedInfo, setSortedInfo] = useState<Record<string, any>>({});

const handleTableChange: TableProps<DataType>['onChange'] = (pagination, filters, sorter) => {
  setFilteredInfo(filters);
  setSortedInfo(sorter);
};

  const calculateSubTotal = () => {
    const subTotalAmount = details_data?.invoiceItems?.reduce(
      (sum, item) => sum + Number(item.total_price),
      0
    );
    return formatNumberWithCommasAndDecimals(subTotalAmount);
  };

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();

    const inProperties = Object.values(record.agent || {}).some((data) =>
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

  const orderItemPaymentStatus = [
    { label: "Paid", value: "Paid" },
    { label: "Due", value: "Due" },
    { label: "Pending", value: "Pending" },
  ];

  const tabs: TabType[] = [
    {
      id: "0",
      name: "Product for Purchase",
      link: `/dashboard/marketplace/purchase-product-list`,
    },
    {
      id: "1",
      name: "Order History",
      link: "/dashboard/marketplace/order-history",
    },
  ];

  const navigate = useNavigate();
  const location = useLocation();

  const activeTab =
    tabs.find((tab) => tab.link === location.pathname)?.id || tabs[0].id;

  const [activeKey, setActiveKey] = useState(activeTab);

  const handleTabChange = (key: string) => {
    const tab = tabs.find((t) => t.id === key);
    if (tab) {
      setActiveKey(key);
      navigate(tab.link);
    }
  };

  const handleChangeOrderPaymentStatus = async (
    newStatus: string,
    id: string
  ) => {
    try {
      const response = await changeOrderPaymentStatus({
        status: newStatus,
        id,
      }).unwrap();
      toast.success(`${response?.message}`);
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  useEffect(() => {
    if (data?.data?.OrderData) {
      setTableData(data.data.OrderData);
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
    setSelectedRowKeys(newSelectedRowKeys);
  };

   const downloadPDF = async () => {
      setIsDownloading(true);
      const element = sectionRef.current;
    
      const images = element.getElementsByTagName('img');
      const imageLoadPromises = Array.from(images).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) resolve();
            else img.onload = resolve;
          })
      );
    
      await Promise.all(imageLoadPromises);
    
      const pageHeightInPixels = 1122;
      const marginInPixels = 10;
    
      Array.from(images).forEach((img) => {
       
        const imgHeight = img.clientHeight;
        if (imgHeight > pageHeightInPixels - marginInPixels) {
          const scaleFactor = (pageHeightInPixels - marginInPixels) / imgHeight;
          img.style.width = `${img.clientWidth * scaleFactor}px`;
          img.style.height = `${imgHeight * scaleFactor}px`;
        }
      });
    
      const options = {
        margin: marginInPixels,
        filename: 'invoice.pdf',
        image: { type: 'png', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'css' }, 
      };
    
      html2pdf().from(element).set(options).save();
      setIsDownloading(false);
    };

  

  const printPdf = () => {
    const printContents = sectionRef.current.outerHTML;
    const printStyle = `
      <style>
        @media print {
          body * { visibility: hidden; }
          #printSection, #printSection * { visibility: visible; }
          #printSection { position: absolute; top: 0; left: 0; }
        }
      </style>
    `;

    const newWindow = window.open("", "_blank");
    newWindow.document.write(`
      <html>
        <head>
          <title>Invoice</title>
          <script src="https://cdn.tailwindcss.com"></script>
          ${printStyle}
        </head>
        <body>
          <div id="printSection" style="width:800px;margin:auto auto">
            ${printContents}
          </div>
        </body>
      </html>
    `);
    newWindow.document.close();

    newWindow.onload = () => {
      newWindow.print();
      newWindow.close();
    };
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

  const [createUpdatePropertyListing] = useCreateUpdateOrderMutation();
  const [deletePropertyListing] = useDeleteOrderMutation();
  const [changeOrderPaymentStatus] = useChangeOrderPaymentStatusMutation();

  const handleCancel = () => {
    resetForm();
    setIsInvoiceModalOpen(false);
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


  const confirmDelete = async () => {
    if (!selectedUUID) return;
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
  const cancelDetails = () => {
    setDetailsData({});
    setIsDetailsModalVisible(false);
  };

  const showDetailsModal = (record) => {
    setDetailsData(record);
    setIsDetailsModalVisible(true);
  };
  const handleInvoiceModal = (record) => {
    setDetailsData(record);
    setIsInvoiceModalOpen(true);
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
        setSelectedUUID("null");
      }
    }
  };

  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true);
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteClientPropertyListingMultiple(
          selectedRowKeys
        );
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

  const columns: TableColumnsType<DataType> = [
    {
      title: "Invoice Number",
      dataIndex: "invoice_number",
      key: "invoice_number",
      render: (invoice_number,record) => <span onClick={() => showDetailsModal(record)} className="hover:text-blue-600 cursor-pointer hover:underline">{invoice_number || "N/A"}</span>,
    },
    {
      title: "Agent Name",
      dataIndex: "agent",
      key: "agent",
      render: (agent) => <span>{agent?.name || "N/A"}</span>,
    },
    {
      title: "Agent Phone Number",
      dataIndex: "agent",
      key: "agent",
      render: (agent) => <span>{agent?.phoneNumber || "N/A"}</span>,
    },
    
    {
      title: "Payment Method",
      dataIndex: "payment_method",
      key: "payment_method",
    },
    {
  title: "Payment Status",
  dataIndex: "status",
  key: "status",
  filters: [
    { text: "Pending", value: "Pending" },
    { text: "Paid", value: "Paid" },
    { text: "Due", value: "Due" },
  ],
  filteredValue: filteredInfo?.status || null,
  onFilter: (value, record) => record.status === value,
  render: (status, record) => (
    <Select
      value={status}
      onChange={(newStatus) =>
        handleChangeOrderPaymentStatus(newStatus, record.id)
      }
      options={orderItemPaymentStatus}
      style={{ width: 150 }}
      disabled={user.userType === "agent"}
    />
  ),
},
    {
      title: "Discount",
      dataIndex: "discount",
      key: "discount",

      render: (discount) => <span>${formatNumberWithCommasAndDecimals(discount || "0.00")}</span>,
    },
    {
      title: "Tax",
      dataIndex: "tax",
      key: "tax",

      render: (tax) => <span>${formatNumberWithCommasAndDecimals(tax || "0.00")}</span>,
    },
    {
      title: "Online Payment Charge",
      dataIndex: "online_transection_charge",
      key: "online_transection_charge",

      render: (online_transection_charge) => (
        <span>${formatNumberWithCommasAndDecimals(online_transection_charge || "0.00")}</span>
      ),
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",

      render: (total_amount) => <span>${formatNumberWithCommasAndDecimals(total_amount || "0.00")}</span>,
    },
    {
      title: "Order Issued Date",
      dataIndex: "issued_date",
      key: "issued_date",
      render: (issued_date) => {
        if (!issued_date) {
          return "No date";
        }
        const date = parseISO(issued_date);
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
              {
                key: "show",
                label: (
                  <button
                    className="flex items-center gap-2 w-full"
                    onClick={() => showDetailsModal(record)}
                  >
                    <FaEye />
                    Show Order Details
                  </button>
                ),
              },
              {
                key: "invoice",
                label: (
                  <button
                    className="flex items-center gap-2 w-full"
                    onClick={() => handleInvoiceModal(record)}
                  >
                    <FaFile />
                    Invoice
                  </button>
                ),
              },
              ...(user.userType === "superAdmin" || user.userType === "admin"
                ? [
                    {
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
                  ]
                : []),
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

  const orderDetailsItemColumns = [
    {
      title: "Product Name",
      dataIndex: "tradeProduct",
      key: "name",
      render: (tradeProduct) => (
        <span className="hover:text-blue-600 cursor-pointer hover:underline">{tradeProduct?.product_name || "N/A"}</span>
      ),
    },
    {
      title: "Unit Value",
      dataIndex: "unit_price",
      key: "unit_price",
      render: (unit_price) => <span>${formatNumberWithCommasAndDecimals(unit_price)}</span>,
    },

    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Total Price",
      dataIndex: "total_price",
      key: "total_price",

      render: (total_price) => (
        <span>${formatNumberWithCommasAndDecimals(total_price)}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "order_item_status",
      key: "order_item_status",

      render: (order_item_status) => (
        <div>
          {order_item_status === "Borrow" ? (
            <span className="text-[#DC8806]">Borrow</span>
          ) : (
            <span className="text-[#6A9E0D]  ">Purchase</span>
          )}
        </div>
      ),
    },
  ];

  const showModal = () => setIsModalOpen(true);

  const filterProps = filter ? filteredData?.filter((item) => item.status === filter) : filteredData;

  const tableSourceData = filterProps?.map((item: any, index: number) => {
    return {
      ...item,
      serial: index + 1,
    };
  });
  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={tab.link}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap no-underline ${
                  location.pathname === tab.link
                    ? "bg-[#0f766e] text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {tab.name}
              </Link>
            ))}
          </div>
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
              <button
                type="button"
                onClick={() => setSearchText("")}
                className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                style={{ right: 6 }}
              >
                <FaTimes />
              </button>
            )}
          </div>
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {(user.userType == "superAdmin" || user.userType == "admin") &&
              hasPermissionForSlug("delete-agent-marketplace") && (
                <button onClick={handleDeleteMultipleClick} className="cancel-btn">
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
              scroll={{ x: "max-content" }}
              rowSelection={rowSelection}
              columns={columns}
              dataSource={tableSourceData}
              pagination={{ pageSize: 20 }}
              rowKey="uuid"
              onChange={handleTableChange}
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
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>
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
            <div className="flex flex-col gap-2">
              <label>Email</label>
              <input
                {...register("email")}
                type="text"
                placeholder="Enter Email"
              />

              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
          </div>
        </form>
      </ModalMain>

      <ModalMain
        title="Order Details"
        hideFooter={true}
        handleCancel={cancelDetails}
        isModalOpen={isDetailsModalVisible}
        modalClass={"lg:!w-[60%] !z-[10000]"}
      >
        <div className="w-full  bg-white  rounded-lg">
          <Table
            scroll={{ x: "max-content" }}
            dataSource={details_data?.invoiceItems}
            columns={orderDetailsItemColumns}
            pagination={false}
            rowKey="uuid"
          />

          <div className="space-y-3 mt-6 border border-neutral-300/30 p-4 rounded-md">
            <div className="flex justify-between  ">
              <span className="text-sm text-gray-600">Discount</span>
              <span className="font-medium">
                - $
                {details_data.discount
                  ? formatNumberWithCommasAndDecimals(details_data.discount)
                  : "0.00"}
              </span>
            </div>


            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tax ({taxRate}%)</span>
              <span className="font-medium">
                ${formatNumberWithCommasAndDecimals(details_data.tax)}
              </span>
            </div>

            {details_data.payment_method == "Card" && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  Online Payment Charge ({onlineTransectionCharge}%)
                </span>
                <span className="font-medium">
                  $
                  {formatNumberWithCommasAndDecimals(details_data.online_transection_charge)}
                </span>
              </div>
            )}

            <div className="flex justify-between  ">
              <span className="text-sm text-gray-600">Sub Total</span>
              <span className="font-medium"> ${formatNumberWithCommasAndDecimals(calculateSubTotal())}</span>
            </div>

            <div className="flex justify-between items-center  border-t border-gray-100 pt-2">
              <span className="text-[16px] font-medium text-gray-900">
                Totals
              </span>
              <span className="text-[16px] font-semibold text-gray-900">
                = ${formatNumberWithCommasAndDecimals(details_data.total_amount)}
              </span>
            </div>
          </div>
        </div>

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

      <ModalMain
        okBtnText="Download"
        printBtnText="Print"
        handleCancel={handleCancel}
        handlePrint={printPdf}
        handleOk={downloadPDF}
        isModalOpen={isInvoiceModalOpen}
        isLoading={isDownloading}
        modalClass={"lg:!w-[1000px] !z-[10000] mx-auto"}
      >
        <div className="space-y-3 pt-5" ref={sectionRef} id="printSection">
          <div className=" flex flex-col items-center gap-2  ">
            <img src={logo} alt="" className={`w-[50px]`} />
            <h2
              className={`tracking-widest text-base playfair-display-sc-bold text-[#0f766e]`}
            >
              ANS REALSTATECRM
            </h2>
          </div>

          <div className="text-center">
            <h2 className="font-semibold text-[#0b3b38] text-xl">Invoice</h2>
          </div>
          <div className=" space-y-5 p-5">
            <div className="px-4 py-2">
              <div className="flex justify-between text-sm">
                <div className="flex gap-1">
                  <label className="font-semibold">Invoice ID:</label>
                  <p>#{details_data.invoice_number}</p>
                </div>
                <div className="flex gap-1">
                  <label className="font-semibold">Created At:</label>
                  { details_data?.createdAt && (
                    <p>
                    { formatDate(parseISO(details_data?.createdAt), "dd MMMM yyyy, hh:mm a") || "N/A"}
                  </p>
                  )}
                  
                </div>
              </div>

              <div className="flex justify-between text-sm mt-2">
                <div className="flex gap-1">
                  <label className="font-semibold">Payment Method:</label>
                  <p>{details_data.payment_method || "N/A"}</p>
                </div>
               
                
                <div className="flex gap-1">
                  <label className="font-semibold">Agent Name:</label>
                  <p>{details_data.agent?.name || "N/A"}</p>
                </div>
              </div>
              <div className="flex justify-between text-sm mt-2">
              {details_data.payment_method=='Card' && (
                  <div className="flex gap-1">
                  <label className="font-semibold">Transaction ID :</label>
                  <p>{details_data.squareTransactionId  || "N/A"}</p>
                </div>
                )}
               
                
               <div className="flex gap-1">
                  <label className="font-semibold">Agent Phone:</label>
                  <p>
                    {details_data?.agent?.phoneNumber || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex justify-between text-sm mt-2">
                <div className="flex gap-1">
                  <label className="font-semibold">Payment Status:</label>
                  <p>{details_data.status || "N/A"}</p>
                </div>
                
              </div>


              <div className="flex justify-between text-sm mt-2"></div>
            </div>

            <div className="w-full  bg-white  rounded-lg">
              <Table
                scroll={{ x: "max-content" }}
                dataSource={details_data?.invoiceItems}
                columns={orderDetailsItemColumns}
                pagination={false}
                rowKey="uuid"
              />

              <div className="space-y-3 mt-6 border border-neutral-300/30 p-4 rounded-md">
                <div className="flex justify-between  ">
                  <span className="text-sm text-gray-600">Discount</span>
                  <span className="font-medium">
                    - $
                    {details_data.discount
                      ? formatNumberWithCommasAndDecimals(details_data.discount)
                      : "0.00"}
                  </span>
                </div>


                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Tax ({taxRate}%)
                  </span>
                  <span className="font-medium">
                    ${formatNumberWithCommasAndDecimals(details_data.tax)}
                  </span>
                </div>

                {details_data.payment_method == "Card" && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Online Payment Charge ({onlineTransectionCharge} %)
                    </span>
                    <span className="font-medium">
                      $
                      {formatNumberWithCommasAndDecimals(details_data.online_transection_charge)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between  ">
                  <span className="text-sm text-gray-600">Sub Total</span>
                  <span className="font-medium"> ${ calculateSubTotal()}</span>
                </div>

                <div className="flex justify-between items-center  border-t border-gray-100 pt-2">
                  <span className="text-[16px] font-medium text-gray-900">
                    Total
                  </span>
                  <span className="text-[16px] font-semibold text-gray-900">
                   =  ${formatNumberWithCommasAndDecimals(details_data.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ModalMain>
      </div>
    </div>
  );
};

export default ClientPropertyListingManagement;
