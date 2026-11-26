// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import type { TableColumnsType, TableProps } from "antd";
import ModalMain from "../../../../components/ui/Modal";
import { useForm } from "react-hook-form";
import { Table, Modal, Button, Dropdown, Space, Select, Tag } from "antd";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaEye, FaFile, FaFileContract, FaSearch, FaTimes } from "react-icons/fa";
import { FaDownload } from "react-icons/fa";
import logo from "/logo.svg";
import { baseUrl } from "../../../../utils/constant";
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
  useAgreeToTermsMutation
} from "../../../../redux/api/superadmin/invoice/orderDataSlice";
import { FaEdit } from "react-icons/fa";

import { useAppSelector } from "../../../../redux/hooks";
import { Link } from "react-router-dom";
import { formatDate, parseISO } from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";
import { usePermissions } from "../../../../utils/permissionUtils";
import { formatNumberWithCommasAndDecimals } from "../../../../utils/formatNumberWithCommasAndDecimals";
import { text } from "stream/consumers";
import TermsAndConditionsModal from "../../../../components/TermsAndConditionsModal";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface DataType {
  relation: string;
  name: string;
  userId: string;
  email: string;
  uuid: string;
}

const BorrowOrderHistory = () => {
  const { filter } = useParams()
  const { hasPermissionForSlug } = usePermissions();
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const sectionRef = useRef();
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [details_data, setDetailsData] = useState<DataType>({});
  const { uuid } = useParams<{ uuid?: string }>();
  const { data, isLoading, refetch } = useGetOrderQuery('borrow');
  const [taxRate] = useState<string | null>(13.0);
  const [onlineTransectionCharge] = useState<string | null>(5.0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedUUID, setSelectedUUID] = useState<string | "null">("null");
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAppSelector((state) => state.user);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [selectedOrderForTerms, setSelectedOrderForTerms] = useState<any>(null);
  const [agreeToTerms, { isLoading: isAgreeingToTerms }] = useAgreeToTermsMutation();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [editOrderData, setEditOrderData] = useState<any>(null);
const [editFormData, setEditFormData] = useState({
  status: "",
  invoiceItems: [] as any[]
});

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [deleteClientPropertyListingMultiple] =
    useDeleteOrderMultipleMutation();
  const [searchText, setSearchText] = useState("");
  const [filteredInfo, setFilteredInfo] = useState<Record<string, React.Key[] | null>>({});
const [sortedInfo, setSortedInfo] = useState<Record<string, any>>({});

// Add these functions in your component

const handleTermsAndConditions = (record: any) => {
  setSelectedOrderForTerms(record);
  setIsTermsModalOpen(true);
};

// Add these functions in your component

const getAgreementContent = () => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Borrow Agreement - ${details_data?.invoice_number || 'Order'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          
          body { 
            font-family: 'Inter', Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.6;
            color: #1f2937;
            font-size: 14px;
          }
          
          .agreement-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
          }
          
          .header { 
            text-align: center; 
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #1a365d;
          }
          
          .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 10px;
          }
          
          .logo-section img {
            height: 50px;
            width: auto;
          }
          
          .company-name {
            font-size: 20px;
            font-weight: 700;
            color: #0f766e;
            letter-spacing: 1.5px;
          }
          
          .agreement-title {
            font-size: 24px;
            font-weight: 700;
            color: #1a365d;
            margin: 10px 0;
          }
          
          .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 25px;
            font-size: 14px;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
          }
          
          .terms-section { 
            margin: 25px 0; 
          }
          
          .terms-section h3 {
            color: #1a365d;
            border-bottom: 2px solid #d1d5db;
            padding-bottom: 8px;
            margin-bottom: 15px;
            font-size: 18px;
            font-weight: 600;
          }
          
          .terms-list {
            margin: 15px 0;
            padding-left: 20px;
          }
          
          .terms-list li {
            margin-bottom: 10px;
            font-size: 14px;
            line-height: 1.5;
          }
          
          .signature-section {
            margin: 25px 0;
            padding-top: 20px;
            border-top: 2px solid #1a365d;
          }
          
          .signature-image {
            max-width: 300px;
            max-height: 120px;
            border: 2px solid #d1d5db;
            margin: 8px 0;
            padding: 5px;
            background: white;
          }
          
          .footer { 
            margin-top: 30px; 
            text-align: center;
            font-size: 12px; 
            color: #6b7280;
            border-top: 1px solid #d1d5db;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="agreement-container">
          <div class="header">
            <div class="logo-section">
              <img src="${logo}" alt="ANS RealStateCRM" />
              <div class="company-name">ANS REALSTATECRM</div>
            </div>
            <h1 class="agreement-title">BORROW AGREEMENT</h1>
          </div>
          
          <div class="info-section">
            <div><strong>BA ID:</strong> ${details_data?.invoice_number || 'N/A'}</div>
            <div><strong>Date:</strong> ${details_data?.createdAt ? formatDate(parseISO(details_data.createdAt), "dd MMMM yyyy") : 'N/A'}</div>
            <div><strong>Agent:</strong> ${details_data?.agent?.name || 'N/A'}</div>
            <div><strong>Phone:</strong> ${details_data?.agent?.phoneNumber || 'N/A'}</div>
          </div>
          
          <div class="terms-section">
            <h3>Terms & Conditions</h3>
            <ul class="terms-list">
              <li>I agree to return the borrowed item(s) on or before the specified due date.</li>
              <li>I agree to inspect the item(s) upon receipt and report any damages within 24 hours.</li>
              <li>I am responsible for any loss or damage to the item(s) during the borrowing period.</li>
              <li>"I understand that the item(s) must be returned in the same condition as when borrowed, accounting for normal wear and tear.</li>
              <li>I authorize the lender to charge my account for any repair or replacement costs if the item is damaged or not returned.</li>
              <li>I confirm that I have read and understood all the terms and conditions of this borrowing agreement.</li>
            </ul>
          </div>
          
          <div class="signature-section">
            <h3>Signature</h3>
            <div class="signature-info">
              <div><strong>Signed By:</strong> ${details_data?.agent?.name || 'N/A'}</div>
              <div><strong>Date Signed:</strong> ${details_data?.agreedAt ? formatDate(parseISO(details_data.agreedAt), "dd MMMM yyyy HH:mm") : 'N/A'}</div>
            </div>
            ${details_data?.signature ? 
              `<img src="${baseUrl}${details_data.signature}" alt="Signature" class="signature-image" />` : 
              '<p style="color: #ef4444; font-style: italic;">Signature not provided</p>'
            }
          </div>
          
          <div class="footer">
            <p><strong>This agreement is electronically generated and legally binding.</strong></p>
            <p>ANS RealStateCRM Inc. - ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const downloadAgreementPDF = async (content: string) => {
  setIsDownloading(true);
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  
  // Wait for images to load
  const images = tempDiv.getElementsByTagName('img');
  const imageLoadPromises = Array.from(images).map(
    (img) =>
      new Promise((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = resolve;
          img.onerror = resolve;
        }
      })
  );

  try {
    await Promise.all(imageLoadPromises);
  } catch (error) {
    console.log('Some images failed to load, continuing with PDF generation...');
  }

  const options = {
    margin: 10,
    filename: `borrow-agreement-${details_data?.invoice_number || 'order'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      allowTaint: true,
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait',
      compress: true
    },
  };

  try {
    await html2pdf().set(options).from(tempDiv).save();
    toast.success('Agreement PDF downloaded successfully');
  } catch (error) {
    console.error('Error generating agreement PDF:', error);
    toast.error('Failed to download agreement PDF');
  } finally {
    setIsDownloading(false);
  }
};

const handleCloseTermsModal = () => {
  setIsTermsModalOpen(false);
  setSelectedOrderForTerms(null);
};

const handleAgreeToTerms = async (signatureData: string, comment?: string, attachment?: string) => {
  try {
    console.log('Sending agreement data:', {
      orderId: selectedOrderForTerms.id,
      signature: signatureData,
      comment: comment,
      attachment: attachment,
      agreedAt: new Date().toISOString()
    });

    const response = await agreeToTerms({
      orderId: selectedOrderForTerms.id,
      signature: signatureData,
      comment: comment || '', // Ensure comment is sent even if empty
      attachment: attachment || '', // Ensure attachment is sent even if empty
      agreedAt: new Date().toISOString()
    }).unwrap();
    
    toast.success("Terms & Conditions agreed successfully!");
    setIsTermsModalOpen(false);
    // Optionally refetch data to update the status
    await refetch();
  } catch (error: any) {
    toast.error(`Error: ${error?.data?.message || "Failed to agree to terms"}`);
  }
};

const orderItemStatusOptions = [
  { label: "Checked Out", value: "Borrow" },
  { label: "Returned", value: "Returned" },
  { label: "Reported Damaged/Lost", value: "Damaged" },
  { label: "Awaiting Processing", value: "Pending" },
];

const handleTableChange: TableProps<DataType>['onChange'] = (pagination, filters, sorter) => {
  console.log('Various parameters', pagination, filters, sorter);
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
      name: "Product for Borrow",
      link: `/dashboard/marketplace/borrow-product-list`,
    },
    {
      id: "1",
      name: "Order History",
      link: "/dashboard/marketplace/borrow-order-history",
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
      setActiveKey(key); // Update the active tab
      navigate(tab.link); // Update the URL
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
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
    setSelectedRowKeys(newSelectedRowKeys);
  };

   const downloadPDF = async () => {
      setIsDownloading(true);
      const element = sectionRef.current;
    
      // Wait for images to load
      const images = element.getElementsByTagName('img');
      const imageLoadPromises = Array.from(images).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) resolve();
            else img.onload = resolve;
          })
      );
    
      await Promise.all(imageLoadPromises);
    
      // Calculate maximum height for an image to fit on a single page
      const pageHeightInPixels = 1122; // A4 height in pixels at 96 DPI (297mm â‰ˆ 1122px)
      const marginInPixels = 10; // Margin in pixels
    
      Array.from(images).forEach((img) => {
       
        const imgHeight = img.clientHeight;
        if (imgHeight > pageHeightInPixels - marginInPixels) {
          // Scale the image to fit within the page
          const scaleFactor = (pageHeightInPixels - marginInPixels) / imgHeight;
          img.style.width = `${img.clientWidth * scaleFactor}px`;
          img.style.height = `${imgHeight * scaleFactor}px`;
        }
      });
    
      // Options for the PDF
      const options = {
        margin: marginInPixels,
        filename: 'invoice.pdf',
        image: { type: 'png', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true }, // Enable CORS for external images
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'css' }, 
      };
    
      // Generate and download the PDF
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
        .no-print-agreement { display: none !important; }
      }
    </style>
  `;

  // Open a new window
  const newWindow = window.open("", "_blank", "width=1000,height=800,scrollbars=yes");
  
  if (newWindow) {
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

    // Wait for the new window to load content before printing
    newWindow.onload = () => {
      setTimeout(() => {
        newWindow.print();
        // Don't close immediately to allow user to see print dialog
      }, 1000);
    };
  } else {
    toast.error('Please allow popups to print');
  }
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

  /* const handleEdit = (record: DataType) => {
    reset(record);
    setIsEditMode(true);
    setSelectedUUID(record.uuid);
    showModal();
  }; */

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

  const handleEdit = (record: any) => {
  setEditOrderData(record);
  setEditFormData({
    status: record.status || "",
    invoiceItems: record.invoiceItems.map((item: any) => ({
      id: item.id,
      tradeProductId: item.tradeProductId,
      product_name: item.tradeProduct?.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      due_date: item.due_date?.split('T')[0] || "",
      pickup_date: item.pickup_date?.split('T')[0] || "",
      order_item_status: item.order_item_status || "Borrow" // Add this line
    }))
  });
  setIsEditModalOpen(true);
};

const handleEditFormChange = (field: string, value: any, index?: number) => {
  if (index !== undefined && field.startsWith('items.')) {
    const itemField = field.replace('items.', '');
    const updatedItems = [...editFormData.invoiceItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [itemField]: value
    };
    setEditFormData(prev => ({
      ...prev,
      invoiceItems: updatedItems
    }));
  } else {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }
};

const handleUpdateOrder = async () => {
  try {
    // Validate required fields
    const hasInvalidQuantity = editFormData.invoiceItems.some(item => !item.quantity || item.quantity < 1);
    if (hasInvalidQuantity) {
      toast.error("All items must have a valid quantity (at least 1)");
      return;
    }

    const hasInvalidStatus = editFormData.invoiceItems.some(item => !item.order_item_status);
    if (hasInvalidStatus) {
      toast.error("All items must have a status");
      return;
    }

    setIsUploading(true);
    
    const updateData = {
      status: editFormData.status,
      invoiceItems: editFormData.invoiceItems.map(item => ({
        id: item.id,
        due_date: item.due_date ? `${item.due_date}T00:00:00.000Z` : null,
        pickup_date: item.pickup_date ? `${item.pickup_date}T00:00:00.000Z` : null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        order_item_status: item.order_item_status // Add this line
      }))
    };

    const response = await createUpdatePropertyListing({
      uuid: editOrderData.uuid,
      data: updateData
    });

    if (response?.data?.status === true) {
      toast.success(response.data.message);
      setIsEditModalOpen(false);
      setEditOrderData(null);
      await refetch(); // Refresh the data
    } else {
      toast.error(response?.error?.data?.message || "Update failed");
    }
  } catch (error: any) {
    toast.error("Update failed. Something went wrong!");
    console.error("Error:", error);
  } finally {
    setIsUploading(false);
  }
};

  const columns: TableColumnsType<DataType> = [
    {
      title: "BA ID",
      dataIndex: "invoice_number",
      key: "invoice_number",
      render: (invoice_number,record) => <span onClick={() => handleEdit(record)} className="hover:text-blue-600 cursor-pointer hover:underline">{invoice_number || "N/A"}</span>,
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
    
    /* {
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
  filteredValue: filteredInfo?.status || null, // Fixed this line
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
    }, */
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
  render: (uuid: string, record: DataType) => (
    <Dropdown
      menu={{
        items: [
          user.userType !== "agent" &&
          {
            key: "edit",
            label: (
              <button
                className="flex items-center gap-2 w-full"
                onClick={() => handleEdit(record)}
              >
                <FaEdit />
                Edit Order
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
                Borrow Agreement 
              </button>
            ),
          },
          {
            key: "terms",
            label: (
              <button
                className="flex items-center gap-2 w-full"
                onClick={() => handleTermsAndConditions(record)}
              >
                <FaFileContract />
                Terms & Condition
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

  //================ orderDetails columns for checkout  table
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
    /* {
      title: "Total Price",
      dataIndex: "total_price",
      key: "total_price",

      render: (total_price) => (
        <span>${formatNumberWithCommasAndDecimals(total_price)}</span>
      ),
    }, */
    {
      title: "Status",
      dataIndex: "order_item_status",
      key: "order_item_status",

      render: (order_item_status) => (
        <div>
          {order_item_status != "Purchase" ? (
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

  // for serial number in table
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
          {/* Tabs */}
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
          {/* Spacer */}
          <div className="flex-1" />
          {/* Search */}
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
          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          {/* Actions */}
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
            onChange={handleTableChange} // Add this prop
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
                <p className="text-red-500 text-sm">{errors.name.message}</p>
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
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
          </div>
        </form>
      </ModalMain>

      {/*==============  order details modal */}
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

          {/* Total Section */}
          <div className="space-y-3 mt-6 border border-neutral-300/30 p-4 rounded-md">
            {/* discount */}
            <div className="flex justify-between  ">
              <span className="text-sm text-gray-600">Discount</span>
              <span className="font-medium">
                - $
                {details_data.discount
                  ? formatNumberWithCommasAndDecimals(details_data.discount)
                  : "0.00"}
              </span>
            </div>

            {/* tax */}

            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tax ({taxRate}%)</span>
              <span className="font-medium">
                ${formatNumberWithCommasAndDecimals(details_data.tax)}
              </span>
            </div>
            {/* online_transection_charge */}

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

            {/* sub total */}
            <div className="flex justify-between  ">
              <span className="text-sm text-gray-600">Sub Total</span>
              <span className="font-medium"> ${formatNumberWithCommasAndDecimals(calculateSubTotal())}</span>
            </div>

            {/* total */}
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

        {/* <div className="col-span-2">
                  <pre className="mt-4 p-2 border rounded bg-gray-100 text-sm">
                    {JSON.stringify(details_data, null, 2)}
                  </pre>
                </div> */}
      </ModalMain>

      {/*  delete confirmation modal ====== */}
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


    {/* View Invoice Modal */}
<ModalMain
  okBtnText="Download"
  printBtnText="Print"
  handleCancel={handleCancel}
  handlePrint={printPdf}
  handleOk={downloadPDF}
  isModalOpen={isInvoiceModalOpen}
  isLoading={isDownloading}
  modalClass={"lg:!w-[800px] !z-[10000] mx-auto"}
>
  {/* Add this style tag for print hiding */}
  <style>
    {`
      @media print {
        .no-print-agreement {
          display: none !important;
        }
      }
    `}
  </style>

  <div className="space-y-3 pt-5" ref={sectionRef} id="printSection">
    {/* Header */}
    <div className="flex flex-col items-center gap-2">
      <img src={logo} alt="" className={`w-[50px]`} />
      <h2 className={`tracking-widest text-base playfair-display-sc-bold text-[#0f766e]`}>
        ANS REALSTATECRM
      </h2>
    </div>

    <div className="text-center">
      <h2 className="font-semibold text-[#0b3b38] text-xl">Borrow Agreement</h2>
    </div>

    {/* Invoice Info */}
    <div className="space-y-4 p-5">
      <div className="flex justify-between items-start">
        <div className="space-y-1 text-sm">
          <div className="flex gap-1">
            <label className="font-semibold min-w-[100px]">BA ID:</label>
            <p>#{details_data.invoice_number}</p>
          </div>
          <div className="flex gap-1">
            <label className="font-semibold min-w-[100px]">Created At:</label>
            <p>
              {details_data?.createdAt && 
                formatDate(parseISO(details_data?.createdAt), "dd MMMM yyyy, hh:mm a")
              }
            </p>
          </div>
        </div>
        
        <div className="space-y-1 text-sm text-right">
          <div className="flex gap-1 justify-end">
            <label className="font-semibold">Agent Name:</label>
            <p>{details_data.agent?.name || "N/A"}</p>
          </div>
          <div className="flex gap-1 justify-end">
            <label className="font-semibold">Agent Phone:</label>
            <p>{details_data?.agent?.phoneNumber || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="w-full bg-white rounded-lg border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left p-2 text-sm border-r">Product Name</th>
              <th className="text-left p-2 text-sm border-r">Unit Value</th>
              <th className="text-left p-2 text-sm border-r">Quantity</th>
              <th className="text-left p-2 text-sm">Status</th>
            </tr>
          </thead>
          <tbody>
            {details_data?.invoiceItems?.map((item, index) => (
              <tr key={item.uuid || index} className="border-b hover:bg-gray-50">
                <td className="p-2 border-r text-sm">
                  {item.tradeProduct?.product_name || "N/A"}
                </td>
                <td className="p-2 border-r text-sm">
                  ${formatNumberWithCommasAndDecimals(item.unit_price)}
                </td>
                <td className="p-2 border-r text-sm">
                  {item.quantity}
                </td>
                <td className="p-2 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    item.order_item_status !== "Purchase" 
                      ? "bg-yellow-100 text-yellow-800" 
                      : "bg-green-100 text-green-800"
                  }`}>
                    {item.order_item_status !== "Purchase" ? "Borrow" : "Purchase"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Comments Section */}
        {details_data?.comment && (
          <div className="mt-4 p-3 bg-gray-50 rounded border">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Comments:</label>
            <p className="text-sm text-gray-600">{details_data.comment}</p>
          </div>
        )}

      {/* Signature Section */}
      <div className="border-t pt-4 mt-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Signature Display */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Signature</label>
            <div className="border border-gray-300 rounded p-3 bg-white min-h-[100px]">
              {details_data?.signature ? (
                <img 
                  src={`${baseUrl}${details_data.signature}`} 
                  alt="Customer Signature" 
                  className="max-w-full max-h-[80px] object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-20 text-gray-500 italic">
                  No signature provided
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Signed by: {details_data?.agent?.name || 'N/A'}
            </div>
            {details_data?.agreedAt && (
              <div className="text-xs text-gray-500">
                Signed on: {formatDate(parseISO(details_data.agreedAt), "dd MMMM yyyy, hh:mm a")}
              </div>
            )}
          </div>

          {/* Agreement Download - Hidden when printing */}
          <div className="space-y-2 no-print-agreement">
            <label className="text-sm font-medium text-gray-700">Borrow Agreement</label>
            <div className="border border-gray-300 rounded p-4 bg-gray-50">
              <div className="text-center space-y-3">
                <button
                  onClick={() => {
                    // Trigger the agreement download
                    const agreementContent = getAgreementContent();
                    downloadAgreementPDF(agreementContent);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm flex items-center justify-center gap-2 w-full"
                >
                  <FaDownload />
                  Download Signed Agreement
                </button>
              </div>
            </div>
          </div>
        </div>        
      </div>

      {/* Simple Total Section - Hidden as per requirement */}
      <div className="space-y-3 mt-6 border border-neutral-300/30 p-4 rounded-md hidden">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Discount</span>
          <span className="font-medium">
            - ${details_data.discount ? formatNumberWithCommasAndDecimals(details_data.discount) : "0.00"}
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
              ${formatNumberWithCommasAndDecimals(details_data.online_transection_charge)}
            </span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Sub Total</span>
          <span className="font-medium">${calculateSubTotal()}</span>
        </div>

        <div className="flex justify-between items-center border-t border-gray-100 pt-2">
          <span className="text-[16px] font-medium text-gray-900">Total</span>
          <span className="text-[16px] font-semibold text-gray-900">
            = ${formatNumberWithCommasAndDecimals(details_data.total_amount)}
          </span>
        </div>
      </div>
    </div>
  </div>
</ModalMain>

<ModalMain
  handleCancel={() => {
    setIsEditModalOpen(false);
    setEditOrderData(null);
  }}
  isModalOpen={isEditModalOpen}
  handleOk={handleUpdateOrder}
  title="Edit Order"
  isLoading={isUploading}
  modalClass={"lg:!w-[600px] !z-[10000]"}
>
  <div className="space-y-4">
    {/* Order Information */}
    <div className="grid grid-cols-1 gap-4">
      <div>
        <p className="block text-sm font-medium mb-2">BA ID: {editOrderData?.invoice_number}</p>
      </div>
      <div>
        <p className="block text-sm font-medium mb-2">Agent: {editOrderData?.agent?.name || ""}</p>
      </div>
    </div>

    {/* Order Items - Focus on Quantity, Pickup Date, Return Due Date, and Status */}
    <div>
      <label className="block text-sm font-medium mb-2">Order Items</label>
      <div className="space-y-3">
        {editFormData.invoiceItems.map((item, index) => (
          <div key={item.id} className="border rounded p-4 bg-gray-50">
            <div className="mb-3">
              <p className="text-sm font-medium">Product: {item.product_name}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Quantity - Required */}
              <div>
                <label className="block text-xs font-medium mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleEditFormChange('items.quantity', parseInt(e.target.value) || 1, index)}
                  className="w-full p-2 border rounded text-sm"
                  min="1"
                  required
                />
              </div>

              {/* Pickup Date */}
              <div>
                <label className="block text-xs font-medium mb-1">Pickup Date</label>
                <input
                  type="date"
                  value={item.pickup_date}
                  onChange={(e) => handleEditFormChange('items.pickup_date', e.target.value, index)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              {/* Return Due Date */}
              <div>
                <label className="block text-xs font-medium mb-1">Return Due Date</label>
                <input
                  type="date"
                  value={item.due_date}
                  onChange={(e) => handleEditFormChange('items.due_date', e.target.value, index)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              {/* Status for each item */}
              <div>
                <label className="block text-xs font-medium mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={item.order_item_status || "Borrow"}
                  onChange={(e) => handleEditFormChange('items.order_item_status', e.target.value, index)}
                  className="w-full p-2 border rounded text-sm"
                  required
                >
                  {orderItemStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
</ModalMain>



<TermsAndConditionsModal
  isOpen={isTermsModalOpen}
  onClose={handleCloseTermsModal}
  onAgree={(signature, comment, attachment) => handleAgreeToTerms(signature, comment, attachment)}
  orderData={selectedOrderForTerms}
  isLoading={isAgreeingToTerms}
/>
    </div>
    </div>
  );
};

export default BorrowOrderHistory;
