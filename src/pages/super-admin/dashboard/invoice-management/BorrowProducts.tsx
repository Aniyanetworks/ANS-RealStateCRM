// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ModalMain from "../../../../components/ui/Modal";
import { useForm, Controller } from "react-hook-form";
import { Table, Select, Input, Dropdown, Space } from "antd";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaRegEdit, FaSearch, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import TableLoader from "../../../../components/loader/TableLoader";
import {
  useChangeOrderItemStatusMutation,
  useUpdateOrderMutation,
  useGetBorrowOrderQuery
} from "../../../../redux/api/superadmin/invoice/orderDataSlice";

import { useAppSelector } from "../../../../redux/hooks";
import { Link } from "react-router-dom";
import { formatDate, parseISO } from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";

import { Resizable } from "react-resizable";

const ClientPropertyListingManagement = () => {
  const { filter } = useParams();
  const [tableData, setTableData] = useState<any[]>([]);
  const { uuid } = useParams<{ uuid?: string }>();
  const { data, isLoading, refetch } = useGetBorrowOrderQuery({
    uuid,
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [isEditUploading, setIsEditUploading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const { user } = useAppSelector((state) => state.user);
  const [updateOrder] = useUpdateOrderMutation();

  const tabs = [
    {
      id: "0",
      name: "Product for Borrow",
      link: `/dashboard/marketplace/borrow-product-list`,
    },
    {
      id: "2",
      name: "Order History",
      link: "/dashboard/marketplace/borrow-order-history",
    },
    {
      id: "3",
      name: "Order Items",
      link: `/dashboard/marketplace/borrow-history/${filter}`,
    },
  ];

  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = tabs.find((tab) => tab.link === location.pathname)?.id || tabs[0].id;
  const [activeKey, setActiveKey] = useState(activeTab);

  const handleTabChange = (key: string) => {
    const tab = tabs.find((t) => t.id === key);
    if (tab) {
      setActiveKey(key);
      navigate(tab.link);
    }
  };

  useEffect(() => {
    if (data?.data?.OrderData) {
      setTableData(data.data.OrderData);
    }
  }, [data]);

  const {
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    control: controlEdit,
    formState: { errors: errorsEdit },
  } = useForm();

  const [changeOrderItemStatus] = useChangeOrderItemStatusMutation();

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setEditingOrder(null);
    resetEdit();
  };

  const handleEdit = (record: any) => {
    setEditingOrder(record);
    setIsEditModalOpen(true);
    
    setValueEdit("quantity", record.quantity);
    setValueEdit("order_item_status", record.order_item_status);
    setValueEdit("pickup_date", record.pickup_date ? formatDateForInput(record.pickup_date) : "");
    setValueEdit("due_date", record.due_date ? formatDateForInput(record.due_date) : "");
  };

  const formatDateForInput = (dateString: string) => {
    const date = parseISO(dateString);
    return formatDate(date, "yyyy-MM-dd'T'HH:mm");
  };

const onEditSubmit = async (data: any) => {
  setIsEditUploading(true);
  
  try {
    const response = await updateOrder({
      uuid: editingOrder.uuid,
      data: {
        ...data,
        id: editingOrder.id,
        tradeProductId: editingOrder.tradeProductId,
        invoiceId: editingOrder.invoiceId,
      },
    }).unwrap();

    if (response?.status === true) {
      toast.success(response.message);
      setIsEditModalOpen(false);
      setEditingOrder(null);
      resetEdit();
      refetch();
    } else {
      toast.error(response?.message || "Update failed");
    }
  } catch (error: any) {
    toast.error(error?.data?.message || "Update failed. Something went wrong!");
    console.error("Edit error:", error);
  } finally {
    setIsEditUploading(false);
  }
};


  const handleChangeOrderItemStatus = async (
    newStatus: string,
    id: string,
    product_id: string
  ) => {
    try {
      const response = await changeOrderItemStatus({
        status: newStatus,
        id,
        product_id,
      }).unwrap();
      toast.success(`${response?.message}`);
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  const orderItemStatusOptions = [
    { label: "Checked Out", value: "Borrow" },
    { label: "Returned", value: "Returned" },
    { label: "Reported Damaged/Lost", value: "Damaged" },
    { label: "Awaiting Processing", value: "Pending" },
  ];

  const columns = [
  {
    title: "BA ID",
    dataIndex: "invoice",
    key: "invoice",
    width: 150,
    render: (invoice, record) => (
      user.userType !== "agent" ? (
        <span 
          className="hover:text-blue-600 cursor-pointer hover:underline" 
          onClick={() => handleEdit(record)}
        >
          {invoice?.invoice_number || "N/A"}
        </span>
      ) : (
        <span>
          {invoice?.invoice_number || "N/A"}
        </span>
      )
    ),
  },
  {
    title: "Agent Name",
    dataIndex: "invoice",
    key: "agent",
    width: 150,
    render: (invoice) => <span>{invoice?.agent?.name || "N/A"}</span>,
  },
  {
    title: "Agent Phone Number",
    dataIndex: "invoice",
    key: "agent_phone",
    width: 150,
    render: (invoice) => <span>{invoice?.agent?.phoneNumber || "N/A"}</span>,
  },
  {
    title: "Order Pickup Date",
    dataIndex: "pickup_date",
    key: "pickup_date",
    width: 200,
    render: (pickup_date) => {
      if (!pickup_date) return <span style={{ color: "gray" }}>No Pickup Date</span>;
      const date = parseISO(pickup_date);
      return formatDate(date, "dd MMMM yyyy, hh:mm a");
    },
  },
  {
    title: "Return Due Date",
    dataIndex: "due_date",
    key: "due_date",
    width: 200,
    render: (due_date, record) => {
      if (!due_date) {
        return <span style={{ color: "gray" }}>No Due Date</span>;
      }
      try {
        const date = parseISO(due_date);
        const formattedDate = formatDate(date, "dd MMMM yyyy");
        const isPastDueAndNotReturned =
          date < new Date() && record.order_item_status !== "Returned";
        return (
          <span style={{ color: isPastDueAndNotReturned ? "red" : "black" }}>
            {formattedDate}
          </span>
        );
      } catch (error) {
        console.error("Error parsing date:", error, "due_date:", due_date);
        return <span style={{ color: "gray" }}>Invalid Date</span>;
      }
    },
  },
  {
    title: "Quantity",
    dataIndex: "quantity",
    key: "quantity",
    width: 100,
    render: (quantity) => <span>{quantity || "N/A"}</span>,
  },
  {
    title: "Status",
    dataIndex: "order_item_status",
    key: "order_item_status",
    width: 200,
    filters: [
      {
        text: 'Checked Out',
        value: 'Borrow',
      },
      {
        text: 'Returned',
        value: 'Returned',
      },
      {
        text: 'Awaiting Processing',
        value: 'Pending',
      },
      {
        text: 'Reported Damaged/Lost',
        value: 'Damaged',
      },
    ],
    onFilter: (value, record) => record.order_item_status === value,
    render: (order_item_status, record) => (
      <Select
        value={order_item_status}
        onChange={(newStatus) =>
          handleChangeOrderItemStatus(
            newStatus,
            record.id,
            record.tradeProductId
          )
        }
        options={orderItemStatusOptions}
        style={{ width: 150 }}
        disabled={user.userType === "agent"}
      />
    ),
  },
  {
    title: "Order Issued Date",
    dataIndex: "invoice",
    key: "issued_date",
    width: 200,
    render: (invoice) => {
      const date = parseISO(invoice?.issued_date);
      return formatDate(date, "dd MMMM yyyy, hh:mm a");
    },
  },
  ...((user.userType === "superAdmin" || user.userType === "admin") ? [{
    title: "Actions",
    key: "actions",
    width: 100,
    fixed: "right",
    render: (_, record) => (
      <Dropdown
        menu={{
          items: [
            {
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
  }] : [])
];

  const handleResize =
    (index: number) =>
    (_: any, { size }: any) => {
      setColumns((prevColumns) => {
        const newColumns = [...prevColumns];
        newColumns[index] = {
          ...newColumns[index],
          width: size.width,
        };
        return newColumns;
      });
    };

  const mergedColumns = columns.map((col, index) => ({
    ...col,
    onHeaderCell: (column: any) => ({
      width: column.width,
      onResize: handleResize(index),
    }),
  }));

  const filteredData = tableData?.filter((record) => {
    const searchTerm = searchText?.toLowerCase();
    const inProperties = record.invoice?.agent
      ? Object.values(record.invoice.agent).some((data) =>
          String(data || "")
            .toLowerCase()
            .includes(searchTerm)
        )
      : false;
    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return inProperties || inRecord;
  });

  const filterProps = filter
  ? filteredData?.filter((item) => {
      return item.invoice?.invoice_number === filter;
    })
  : filteredData;
    

  const tableSourceData = filterProps?.map((item: any, index: number) => ({
    ...item,
    serial: index + 1,
  }));

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">
            Products for Borrow
            <span className="ml-1 text-gray-400 font-normal text-[11px]">({tableData.length})</span>
          </h1>
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
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
            <FaSearch
              className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              style={{ fontSize: 10, left: 8 }}
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                paddingLeft: 26,
                paddingRight: searchText ? 22 : 8,
                paddingTop: 4,
                paddingBottom: 4,
                width: "100%",
              }}
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
        </div>

      <div>
        {isLoading ? (
          <TableLoader />
        ) : (
          <Table
            scroll={{ x: "max-content" }}
            components={{
              header: {
                cell: ResizableTitle,
              },
            }}
            columns={mergedColumns}
            dataSource={tableSourceData}
            pagination={{ pageSize: 20 }}
            rowKey="uuid"
          />
        )}
      </div>

      <ModalMain
        handleCancel={handleEditCancel}
        isModalOpen={isEditModalOpen}
        handleOk={handleSubmitEdit(onEditSubmit)}
        title="Edit Order"
        isLoading={isEditUploading}
        modalClass={"lg:!w-[50%] !z-[10000]"}
      >
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label>
                Quantity <span className="text-red-500 ml-1">*</span>
              </label>
              <Controller
                name="quantity"
                control={controlEdit}
                rules={{ required: "Quantity is required", min: 1 }}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    min="1"
                    placeholder="Enter quantity"
                  />
                )}
              />
              {errorsEdit.quantity && (
                <p className="text-red-500 text-sm">{errorsEdit.quantity.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>
                Status <span className="text-red-500 ml-1">*</span>
              </label>
              <Controller
                name="order_item_status"
                control={controlEdit}
                rules={{ required: "Status is required" }}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={orderItemStatusOptions}
                    placeholder="Select status"
                    style={{ width: '100%' }}
                  />
                )}
              />
              {errorsEdit.order_item_status && (
                <p className="text-red-500 text-sm">{errorsEdit.order_item_status.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label>Pickup Date</label>
              <Controller
                name="pickup_date"
                control={controlEdit}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="datetime-local"
                    placeholder="Select pickup date"
                  />
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label>Return Due Date</label>
              <Controller
                name="due_date"
                control={controlEdit}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="datetime-local"
                    placeholder="Select due date"
                  />
                )}
              />
            </div>
          </div>
        </form>
      </ModalMain>
    </div>
    </div>
  );
};

export default ClientPropertyListingManagement;

const ResizableTitle = (props: any) => {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};