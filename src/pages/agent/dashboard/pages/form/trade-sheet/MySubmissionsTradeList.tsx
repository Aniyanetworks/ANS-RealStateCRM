/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any

import 'react-quill-new/dist/quill.snow.css';


import {
  useEffect,
  useRef,
  useState,
} from 'react';

import type {
  TableColumnsType,
  TableProps,
} from 'antd';
import {
  Button,
  Checkbox,
  DatePicker,
  Dropdown,
  Input,
  Modal,
  Popover,
  Select,
  Space,
  Table,
  Tooltip,
} from 'antd';
import uploadIcon from '../../../../../../assets/upload2.svg';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import moment from 'moment';
import toast from 'react-hot-toast';
import { BsLayoutThreeColumns, BsThreeDotsVertical } from 'react-icons/bs';
import {
  FaChevronDown,
  FaComment,
  FaEye,
  FaFileAlt,
  FaFileUpload,
  FaRegEdit,
  FaSearch,
  FaTimes,
} from 'react-icons/fa';
import {
  FaMoneyBillTransfer,
  FaShare,
} from 'react-icons/fa6';
import { MdDelete, MdLock } from 'react-icons/md';
import ReactQuill from 'react-quill-new';
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import TableLoader from '../../../../../../components/loader/TableLoader';
import { usePdfSizeGuard } from '../../../../../../hooks/usePdfSizeGuard';
import ConfirmDeleteModal from '../../../../../../components/ui/ConfirmDeleteModal';
import {
  useArchiveMultipleTradeSheetsMutation,
  useArchiveSpecificTradeSheetMutation,
  useChangeTradeAdminStatusMutation,
  useChangeTradeSheetStatusMutation,
  useGetTradeSheetListDataQuery,
  useUploadPaperWorkFileAttachmentMutation,
} from '../../../../../../redux/api/agent/trade-sheet/tradeSheetSlice';
import {
  useSendLawyerPDFEmailMutation,
} from '../../../../../../redux/api/superadmin/lawyerDataSlice';
import { useAppSelector } from '../../../../../../redux/hooks';
import { usePermissions } from '../../../../../../utils/permissionUtils';
import ShareTradeSheetDocument
  from '../../../../../share-documents/ShareTradeSheetDocument';
import TradeSheetAdditionalDocumentUpload
  from './TradeSheetAdditionalDocumentUpload';
import TradeSheetPaperworkFileManager from './TradeSheetPaperworkFileManager';
import TradeSheetPaperworkFileManagerMultipleRepresentation
  from './TradeSheetPaperworkFileManagerMultipleRepresentation';
import TradeSheetSeparatePreviewPage from './TradeSheetSeparatePreviewPage';

const { RangePicker } = DatePicker;
type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface DataType {
  key?: React.Key;
  id?: number;
  name: any;
  email: any;
  status: any;
  role: any;
  representation: any;
  createdAt: any;
  uuid: string;
}

type OnChange = NonNullable<TableProps<DataType>["onChange"]>;
type Filters = Parameters<OnChange>[1];

type GetSingle<T> = T extends (infer U)[] ? U : never;
type Sorts = GetSingle<Parameters<OnChange>[2]>;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Builds "street, city, province, postal code" for a lawyer: the firm's
// office address for the street line (falling back to the lawyer's own
// address if the lawyer isn't linked to a firm address), but the lawyer's
// own city/state/postal code — this matches the already-working preview
// page (LayerDetails.tsx), which is where this field combination is proven
// to actually be populated.
const formatLawyerAddress = (lawyer: any): string => {
  if (!lawyer) return "N/A";
  const parts = [
    lawyer.firm?.address || lawyer.address,
    lawyer.city?.name,
    lawyer.state?.name,
    lawyer.postalZipCode,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "N/A";
};

const MySubmissionsTradeList = () => {
  const [searchParams] = useSearchParams();
  const brokerageId = searchParams.get("brokerageId");
  const parsedBrokerageId = brokerageId ? parseInt(brokerageId) : null;
  const { filter } = useParams("filter");
  const { user } = useAppSelector((state) => state.user);
  const isSuperAdmin = user?.roleId === 1 && user?.userType === "superAdmin";
  const isBranchAdmin = user?.roleId === 12 && user?.userType === "superAdmin";
  const { guardFile, modal: pdfSizeReductionModal } = usePdfSizeGuard(MAX_FILE_SIZE);
  const [activeTab, setActiveTab] = useState<string>("all");
  // ...existing code...
  const [lawyerType, setLawyerType] = useState<string>("");
  // ...existing code...
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deleteUuid, setDeleteUuid] = useState<string | null>(null);
  const [currentDateFilter, setCurrentDateFilter] = useState(null);
  // Add user.id as a query param to force refetch when user changes
  const { data, isLoading, refetch } = useGetTradeSheetListDataQuery(
    user?.id || "",
    {
      skip: !user?.id,
    }
  );
  const [archiveSpecificTradeSheet] = useArchiveSpecificTradeSheetMutation();

  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [isRejectReasonViewModalVisible, setIsRejectReasonViewModalVisible] =
    useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonMain, setRejectReasonMain] = useState("");
  const [changeStatus, setChangeStatus] = useState("");
  const [changeUuid, setChangeUuid] = useState<string | null>(null);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [archiveMultipleTradeSheets] = useArchiveMultipleTradeSheetsMutation();

  // filter
  const [filteredInfo, setFilteredInfo] = useState<Filters>({});
  const [sortedInfo, setSortedInfo] = useState<Sorts>({});

  const { hasPermissionForSlug } = usePermissions();
  const [searchText, setSearchText] = useState("");

  const [selectedTradeData, setSelectedTradeData] = useState<DataType[]>([]);
  const [isModalFileManagereVisible, setIsModalFileManagereVisible] =
    useState(false);
  const [
    isModalShareTradeSheetDocumentVisible,
    setIsModalShareTradeSheetDocumentVisible,
  ] = useState(false);
  const [
    isModalAdditionalDocumentVisible,
    setIsModalModalAdditionalDocumentVisible,
  ] = useState(false);
  const [isModalPreviewTradeSheetVisible, setIsModalPreviewTradeSheetVisible] =
    useState(false);
  const [missingImportantFiles, setMissingImportantFiles] = useState<{ id: number; name: string }[]>([]);
  const [isMissingFilesModalVisible, setIsMissingFilesModalVisible] = useState(false);
  const [missingFilesTradeSheetId, setMissingFilesTradeSheetId] = useState<number | null>(null);
  const [uploadedInModal, setUploadedInModal] = useState<Set<number>>(new Set());
  const [uploadingInModal, setUploadingInModal] = useState<number | null>(null);
  const [uploadPaperWorkFileAttachment] = useUploadPaperWorkFileAttachmentMutation();
  const [isModalLawyerShareVisible, setIsModalLawyerShareVisible] =
    useState(false);
  const [manageFieldsOpen, setManageFieldsOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>([
    "serial", "tradeSheetTypeId", "propertyAddress", "agentName", "sharedAgent",
    "representation", "tradeStatus", "status", "closingDate", "actions",
  ]);

  const statusOptions = [
    {
      label: "Approved",
      value: "approved",
    },
    {
      label: "Under Review",
      value: "underReview",
    },
    {
      label: "Draft",
      value: "draft",
    },
    {
      label: "Incomplete",
      value: "rejected",
    },
  ];

  const tradeStatusOptions = [
    {
      label: "Closed",
      value: "closed",
    },
    {
      label: "DFT",
      value: "dft",
    },
    {
      // Like DFT: the property can be used on a new trade sheet again
      label: "Deal Terminated",
      value: "dealTerminated",
    },
    {
      label: "Sold Conditional",
      value: "soldConditional",
    },
    {
      label: "Pending",
      value: "pending",
    },
  ];

  const [sendLawyerPDFEmail, { isLoading: isSharingLawyer }] =
    useSendLawyerPDFEmailMutation();
  const [selectedEmail, setSelectedEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [comment, setComment] = useState("");
  const lawyerInfoRef = useRef(null);

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const tradeId = query.get("trade_id");

  // Add this state for the original data
  const [allData, setAllData] = useState<DataType[]>([]);

  useEffect(() => {
    // refetch()
    // user?.userType
    setAllData(data?.data?.tradeSheetData || []);
    setSearchText(localStorage.getItem("searchText") || "");
  }, [data]);

  useEffect(() => {
    if (tradeId && data && data.data?.tradeSheetData) {
      const found = data.data.tradeSheetData.find(
        (item) => item.tradeSheetTypeId === tradeId
      );
      if (found) {
        setSelectedTradeData(found);
        setIsModalPreviewTradeSheetVisible(true);
      }
    }
  }, [tradeId, data]);

  //set filter dates
  // Remove the effect that sets tableData from filterDataByDate
  // const [filterDataByDate, setFilterDataByDate] = useState([]);

  //Change Item Status
  const [changeTradeSheetStatus] = useChangeTradeSheetStatusMutation();
  const [changeTradeAdminStatus] = useChangeTradeAdminStatusMutation();
  const handleChangeAdminStatus = async (newStatus: string, uuid: string) => {
    setChangeStatus(newStatus);
    setChangeUuid(uuid);

    if (newStatus == "rejected") {
      setIsRejectModalVisible(true);
    } else {
      changeStatusApi(newStatus, uuid);
    }
  };

  const handleChangeTradeStatus = async (newStatus: string, uuid: string) => {
    const requestData = {
      status: newStatus,
    };
    try {
      const response = await changeTradeSheetStatus({
        data: requestData,
        uuid: uuid,
      }).unwrap();
      toast.success(`${response?.message}`);

      cancelDelete();
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  const changeStatusApi = async (newStatus: string, uuid: string) => {
    const requestData = {
      status: changeStatus || newStatus || "rejected",
      rejectReasonMain: rejectReasonMain,
    };
    try {
      const response = await changeTradeAdminStatus({
        data: requestData,
        uuid: changeUuid || uuid,
      }).unwrap();
      toast.success(`${response?.message}`);

      cancelDelete();
    } catch (error: any) {
      const missing = error?.data?.missingImportantFiles;
      if (missing && missing.length > 0) {
        setMissingFilesTradeSheetId(error?.data?.tradeSheetId ?? null);
        setMissingImportantFiles(missing);
        setUploadedInModal(new Set());
        setIsMissingFilesModalVisible(true);
      } else {
        toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
      }
    }
  };
  // const handleRejectReasonChange = (e) => {
  //   setRejectReason(e.target.value);
  // };

  // const handleRejectReasonView = (rejectReasonMain, uuid, currentStatus) => {
  //   if (rejectReasonMain && rejectReasonMain.trim() !== "") {
  //     // If reason exists, show the view modal
  //     setRejectReasonMain(rejectReasonMain);
  //     setIsRejectReasonViewModalVisible(true);
  //   } else {
  //     // If no reason exists, open the add reason modal
  //     // Use the current status of the record (should be "rejected")
  //     setChangeStatus(currentStatus || "rejected");
  //     setChangeUuid(uuid);
  //     setRejectReasonMain(""); // Clear any previous reason
  //     setIsRejectModalVisible(true);
  //   }
  // };

  const handleRejectReasonView = (rejectReasonMain) => {
    setRejectReasonMain(rejectReasonMain);
    setIsRejectReasonViewModalVisible(true);
  };

  const handleDelete = (uuid: string) => {
    setDeleteUuid(uuid);
    setIsModalVisible(true);
  };

  const handleChange: OnChange = (pagination, filters, sorter) => {
    console.log(pagination);
    localStorage.setItem("tradeSheetCurentPage", pagination?.current || 1);
    setCurrentPage(pagination?.current || 1);
    setFilteredInfo(filters);
    setSortedInfo(sorter as Sorts);
  };

  // const clearFilters = () => {
  //   setFilteredInfo({});
  // };

  const confirmDelete = async () => {
    try {
      const response = await archiveSpecificTradeSheet(deleteUuid).unwrap();
      toast.success(`${response?.message}`);
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
    setIsModalVisible(false);
    setDeleteUuid(null);
  };

  const cancelDelete = () => {
    setIsModalVisible(false);
    setDeleteUuid(null);

    setIsRejectModalVisible(false);
    setIsRejectReasonViewModalVisible(false);
    setRejectReasonMain(""); // Changed from setRejectReason
    setChangeStatus("");
    setChangeUuid(null);
    setIsDeleteModalMultipleVisible(false);
  };

  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true); // Show delete confirmation modal
  };

  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys?.length > 0) {
      try {
        const response = await archiveMultipleTradeSheets(selectedRowKeys);
        setIsDeleteModalMultipleVisible(false);
        // Ensure the refetch waits for the data to be refreshed
        await refetch();
        if (response.data.status == true) {
          setSelectedRowKeys([]);
          toast.success(`${response?.message}`);
        } else {
          toast.error("Failed to delete announcement. Please try again.");
        }
      } catch (error) {
        setIsDeleteModalMultipleVisible(false);
        toast.error("Failed to delete announcement. Please try again.");
      }
    } else {
      toast.error("Please Select Items.");
    }
  };

  // Date filter
  const dateFilteredData =
    currentDateFilter && currentDateFilter.length === 2
      ? allData.filter((record) => {
          const closingDate = record?.properties?.[0]?.closingDate;
          if (!closingDate) return false;

          try {
            // Parse record date in UTC to match how it's displayed
            // Extract date part from ISO string if it's a string
            let recordDateStr;
            if (typeof closingDate === "string") {
              // Extract just the date part (YYYY-MM-DD) from ISO string
              const datePart = closingDate.split("T")[0].split(" ")[0];
              // Validate and use the date part directly (already in YYYY-MM-DD format)
              if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                recordDateStr = datePart;
              } else {
                // If format is different, parse in UTC
                recordDateStr = moment.utc(closingDate).format("YYYY-MM-DD");
              }
            } else {
              // If it's a Date object or moment, format it in UTC
              recordDateStr = moment.utc(closingDate).format("YYYY-MM-DD");
            }

            if (!recordDateStr || recordDateStr === "Invalid date")
              return false;

            // Get filter dates from RangePicker (these are dayjs/moment objects)
            const [startMoment, endMoment] = currentDateFilter;

            if (!startMoment || !endMoment) return false;

            // Format the selected dates - extract year, month, day from the date object
            // This ensures we get the exact date the user selected
            let startDateStr, endDateStr;

            if (startMoment.format) {
              // dayjs/moment object - format directly (preserves selected date)
              startDateStr = startMoment.format("YYYY-MM-DD");
            } else if (startMoment instanceof Date) {
              // Date object - get components and format
              startDateStr = `${startMoment.getFullYear()}-${String(
                startMoment.getMonth() + 1
              ).padStart(2, "0")}-${String(startMoment.getDate()).padStart(
                2,
                "0"
              )}`;
            } else {
              startDateStr = moment(startMoment).format("YYYY-MM-DD");
            }

            if (endMoment.format) {
              // dayjs/moment object - format directly (preserves selected date)
              endDateStr = endMoment.format("YYYY-MM-DD");
            } else if (endMoment instanceof Date) {
              // Date object - get components and format
              endDateStr = `${endMoment.getFullYear()}-${String(
                endMoment.getMonth() + 1
              ).padStart(2, "0")}-${String(endMoment.getDate()).padStart(
                2,
                "0"
              )}`;
            } else {
              endDateStr = moment(endMoment).format("YYYY-MM-DD");
            }

            if (
              !startDateStr ||
              !endDateStr ||
              startDateStr === "Invalid date" ||
              endDateStr === "Invalid date"
            ) {
              return false;
            }

            // Compare date strings directly (YYYY-MM-DD format allows string comparison)
            // recordDateStr is in UTC (YYYY-MM-DD), filter dates are the selected dates (YYYY-MM-DD)
            const isInRange =
              recordDateStr >= startDateStr && recordDateStr <= endDateStr;

            return isInRange;
          } catch (error) {
            console.error(
              "Error filtering by date:",
              error,
              closingDate,
              currentDateFilter
            );
            return false;
          }
        })
      : allData;
  // Search filter
  // Filter the trade sheets based on brokerageId
  const filteredData = dateFilteredData.filter((record) => {
    // Brokerage filter
    if (parsedBrokerageId) {
      const hasMatchingBrokerage = record.agentDetails.some(
        (agent) =>
          agent.sellerBrokerageId === parsedBrokerageId ||
          agent.buyerBrokerageId === parsedBrokerageId
      );
      if (!hasMatchingBrokerage) return false;
    }

    // Existing search filter
    const searchTerm = searchText?.toLowerCase() || "";
    const extractValues = (obj: any): string[] => {
      if (
        typeof obj === "string" ||
        typeof obj === "number" ||
        typeof obj === "boolean"
      ) {
        return [String(obj).toLowerCase()];
      }
      if (Array.isArray(obj)) {
        return obj.flatMap(extractValues);
      }
      if (obj && typeof obj === "object") {
        return Object.values(obj).flatMap(extractValues);
      }
      return [];
    };
    const allValues = extractValues(record);
    return allValues.some((value) => value.includes(searchTerm));
  });

  const [currentPage, setCurrentPage] = useState(
    localStorage.getItem("tradeSheetCurentPage") || 1
  );
  const [selectedTradeSheetId, setSelectedTradeSheetId] = useState(
    localStorage.getItem("tradeSheetId") || ""
  );

  //filter by date range

  const handleFilter = (dates) => {
    if (!dates || dates?.length !== 2) {
      setCurrentDateFilter(null);
      return;
    }

    // Store moment/dayjs objects for the filter
    setCurrentDateFilter(dates);
  };

  // Represent/Type abbreviations: Tenant=T, Landlord=L, Seller=S, Buyer=B, Residential=R, Commercial=C
  const REP_TO_LETTER = { seller: "S", buyer: "B", landlord: "L", tenant: "T" };
  const LIST_TO_LETTER = { Commercial: "C", Residential: "R" };

  const getPropertyAddress = (record: any): string =>
    record?.representation === "seller" || record?.representationType === "multiple"
      ? record?.propertyListing?.propertyAddress || "—"
      : record?.properties?.[0]?.propertyAddress || "—";

  const getRepresentTypeBadges = (record: any): string[] => {
    const badges: string[] = [];
    const listLetter = record.listType ? LIST_TO_LETTER[record.listType] : "";
    if (listLetter) badges.push(listLetter);
    if (record.representationType === "single") {
      const rep = record.representation;
      if (rep && rep !== "yes") {
        const letter = REP_TO_LETTER[rep] || rep?.charAt(0)?.toUpperCase();
        if (letter) badges.push(letter);
      }
    } else {
      const arr = record.multipleRepresentation?.split(",").map((s: string) => s.trim()) || [];
      if (record.representationType === "designation" && user.userType === "agent") {
        const currentAgentId = user.agentAccount[0]?.id;
        if (currentAgentId && record.seller_landlord_agent_id == currentAgentId) {
          if (arr.includes("seller")) badges.push("S"); else if (arr.includes("landlord")) badges.push("L");
        } else if (currentAgentId && record.buyer_tenant_agent_id == currentAgentId) {
          if (arr.includes("buyer")) badges.push("B"); else if (arr.includes("tenant")) badges.push("T");
        }
      } else {
        arr.forEach((r: string) => {
          const letter = REP_TO_LETTER[r];
          if (letter) badges.push(letter);
        });
      }
    }
    return badges.length ? badges : [];
  };

  const getRepresentTypeColor = (value: string) => {
    if (!value) return "#999";
    if (/[SB]/.test(value)) return "#34C759";
    if (/[LT]/.test(value)) return "#FF9500";
    if (/[RC]/.test(value)) return "#1890ff";
    return "#34C759";
  };

  const allColumnDefs = [
    { key: "serial", label: "#", locked: true },
    { key: "tradeSheetTypeId", label: "Trade Record", locked: false },
    { key: "propertyAddress", label: "Property Address", locked: false },
    ...(user.userType !== "agent" ? [{ key: "agentName", label: "Agent Name", locked: false }] : []),
    { key: "sharedAgent", label: "Shared Agent", locked: false },
    { key: "representation", label: "Represent/Type", locked: false },
    { key: "tradeStatus", label: "Trade Status", locked: false },
    { key: "status", label: "Admin Status", locked: false },
    { key: "closingDate", label: "Closing Date", locked: false },
    { key: "createdAt", label: "Submitted At", locked: false },
    { key: "listType", label: "List Type", locked: false },
    { key: "representationType", label: "Rep. Type", locked: false },
    { key: "salesPrice", label: "Sales Price", locked: false },
    { key: "depositAmount", label: "Deposit Amount", locked: false },
    { key: "buyerName", label: "Buyer Name", locked: false },
    { key: "sellerName", label: "Seller Name", locked: false },
    { key: "leadSource", label: "Lead Source", locked: false },
    { key: "actions", label: "Actions", locked: true },
  ];

  const toggleColumn = (key: string) => {
    setVisibleColumnKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Filter value (dropdown) -> letter for exact-match
  const VALUE_TO_LETTER: Record<string, string> = {
    ...REP_TO_LETTER,
    Residential: "R",
    Commercial: "C",
  };

  // Exact match: row badges must equal selected filter set (e.g. S+B only shows S and B, not S+C)
  const representationFilteredData =
    filteredInfo?.representation?.length > 0
      ? filteredData.filter((record) => {
          const selectedLetters = new Set(
            (filteredInfo.representation as string[])
              .map((v) => VALUE_TO_LETTER[v])
              .filter(Boolean)
          );
          const rowBadges = getRepresentTypeBadges(record);
          const rowSet = new Set(rowBadges);
          if (selectedLetters.size !== rowSet.size) return false;
          for (const letter of selectedLetters) if (!rowSet.has(letter)) return false;
          return true;
        })
      : filteredData;

  const columns: TableColumnsType<DataType> = [
    {
      title: "#",
      key: "serial",
      width: 45,
      dataIndex: "serial",
    },
    {
      title: "Trade Record",
      dataIndex: "tradeSheetTypeId",
      key: "tradeSheetTypeId",

      render: (tradeSheetTypeId, record) => (
        <button
          onClick={() => {
            setIsModalPreviewTradeSheetVisible(true);
            localStorage.setItem(
              "tradeSheetRepresentationData",
              JSON.stringify(
                record?.representation ?? record?.multipleRepresentation ?? ""
              )
            );

            setSelectedTradeData(record);
            setSelectedTradeSheetId(record?.tradeSheetTypeId);
            localStorage.setItem(
              "tradeSheetId",
              record?.tradeSheetTypeId || ""
            );
          }}
          style={{
            color:
              record.status === "rejected"
                ? "red"
                : record.status === "underReview"
                ? "#eb9715"
                : "",
          }}
          className={`
        bg-transparent border-none p-0 text-inherit
        hover:text-blue-600 hover:underline
        cursor-pointer
        ${record.status === "rejected" ? "animate-blink" : ""}
      `}
        >
          {tradeSheetTypeId || "—"}
        </button>
      ),
      fixed: "left",
      width: 90,

      sorter: (a, b) => a.tradeSheetTypeId.localeCompare(b.tradeSheetTypeId),
      sortOrder:
        sortedInfo.columnKey === "tradeSheetTypeId" ? sortedInfo.order : null,
      ellipsis: true,
    },
    {
      title: "Property Address",
      dataIndex: "tradeSheetTypeId",
      key: "propertyAddress",
      render: (text, record) => {
        const address =
          record.representation === "seller" ||
          record.representationType === "multiple"
            ? record?.propertyListing?.propertyAddress || "—"
            : record?.properties[0]?.propertyAddress || "—";

        return (
          <Tooltip title={address} placement="topLeft">
            <div
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "150px",
                cursor: "pointer",
              }}
            >
              {address}
            </div>
          </Tooltip>
        );
      },
      width: 150, // This should match the width in the style above
      ellipsis: true,
    },
    ...(user.userType !== "agent"
      ? [
          {
            title: "Agent Name",
            dataIndex: "name",
            key: "agentName",

            sorter: (a, b) => a.name.localeCompare(b.name),
            sortOrder:
              sortedInfo.columnKey === "agentName" ? sortedInfo.order : null,
            ellipsis: true,
            width: 150,
          },
        ]
      : []),
    // { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Shared Agent",
      dataIndex: "name",
      key: "sharedAgent",
      render: (text, record) => {
        const sharedUsers = record?.sharedUsers || [];
        const isSingleRepresentation = record?.representationType === "single";
        const selectedSharedUsers =
          isSingleRepresentation &&
          (record?.representation === "seller" || record?.representation === "buyer")
            ? sharedUsers.filter(
                (rep: any) => rep?.representationType === record?.representation
              )
            : sharedUsers;

        if (!selectedSharedUsers?.length) return "—";

        const fullText = selectedSharedUsers.map((rep: any) => rep["name"]).join(", ");
        return (
          <Tooltip title={fullText} placement="topLeft">
            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: 110 }}>
              {fullText}
            </div>
          </Tooltip>
        );
      },
      width: 110,
    },
    {
      title: "Represent/Type",
      dataIndex: "representation",
      key: "representation",
      render: (_: any, record: any) => {
        const badges = getRepresentTypeBadges(record);
        if (!badges.length) return "—";
        return (
          <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {badges.map((letter, index) => (
              <span key={index} style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 22, height: 22, borderRadius: 4,
                backgroundColor: getRepresentTypeColor(letter) + "22",
                color: getRepresentTypeColor(letter),
                fontWeight: 600, fontSize: 11, lineHeight: 1,
              }}>{letter}</span>
            ))}
          </span>
        );
      },
      width: 90,
      filters: [
        { text: "Seller", value: "seller" },
        { text: "Buyer", value: "buyer" },
        { text: "Tenant", value: "tenant" },
        { text: "Landlord", value: "landlord" },
        { text: "Residential", value: "Residential" },
        { text: "Commercial", value: "Commercial" },
      ],
      filteredValue: filteredInfo?.representation ?? null,
      onFilter: () => true,
      ellipsis: true,
    },
    {
      title: "Trade Status",
      dataIndex: "tradeStatus",
      key: "tradeStatus",
      render: (tradeStatus, record) => {
        const map: Record<string, { label: string }> = {
          closed:          { label: "Closed" },
          dft:             { label: "DFT" },
          dealTerminated:  { label: "Deal Terminated" },
          soldConditional: { label: "Sold Conditional" },
          pending:         { label: "Pending" },
        };
        const cfg = map[tradeStatus] ?? { label: tradeStatus ?? "—" };
        const badgeStyle: React.CSSProperties = {
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          minWidth: 108, padding: "2px 8px", borderRadius: 4,
          border: "1px solid #e8e8e8",
          color: "#595959", fontSize: 11, lineHeight: 1.5,
        };

        if (user.userType === "agent") {
          return <span style={badgeStyle}>{cfg.label}</span>;
        }
        return (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: tradeStatusOptions.map((opt) => ({
                key: opt.value,
                label: <span style={{ fontSize: 11, color: "#595959" }}>{opt.label}</span>,
                onClick: () => handleChangeTradeStatus(opt.value, record.uuid),
              })),
            }}
          >
            <span style={{ ...badgeStyle, cursor: "pointer", userSelect: "none", justifyContent: "space-between", gap: 6 }}>
              <span>{cfg.label}</span>
              <FaChevronDown style={{ fontSize: 8, opacity: 0.45, flexShrink: 0 }} />
            </span>
          </Dropdown>
        );
      },
      width: 120,
      filters: [
        { text: "Closed", value: "closed" },
        { text: "DFT", value: "dft" },
        { text: "Deal Terminated", value: "dealTerminated" },
        { text: "Sold Conditional", value: "soldConditional" },
        { text: "Pending", value: "pending" },
      ],
      filteredValue: filteredInfo.tradeStatus || null,
      onFilter: (value, record) =>
        record?.tradeStatus?.includes(value as string),
      sorter: (a, b) => a.tradeStatus?.length - b.tradeStatus?.length,
      sortOrder:
        sortedInfo.columnKey === "tradeStatus" ? sortedInfo.order : null,
      ellipsis: true,
    },
    {
      title: "Admin Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        const map: Record<string, { label: string }> = {
          approved:    { label: "Approved" },
          underReview: { label: "Under Review" },
          draft:       { label: "Draft" },
          rejected:    { label: "Incomplete" },
          closed:      { label: "Closed" },
        };
        const cfg = map[status] ?? { label: status ?? "—" };
        const badgeStyle: React.CSSProperties = {
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          minWidth: 108, padding: "2px 8px", borderRadius: 4,
          border: "1px solid #e8e8e8",
          color: "#595959", fontSize: 11, lineHeight: 1.5,
        };

        if (user.userType === "agent") {
          return <span style={badgeStyle}>{cfg.label}</span>;
        }
        return (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: statusOptions.map((opt) => ({
                key: opt.value,
                label: <span style={{ fontSize: 11, color: "#595959" }}>{opt.label}</span>,
                onClick: () => handleChangeAdminStatus(opt.value, record.uuid),
              })),
            }}
          >
            <span style={{ ...badgeStyle, cursor: "pointer", userSelect: "none", justifyContent: "space-between", gap: 6 }}>
              <span>{cfg.label}</span>
              <FaChevronDown style={{ fontSize: 8, opacity: 0.45, flexShrink: 0 }} />
            </span>
          </Dropdown>
        );
      },
      width: 120,
      filters: [
        { text: "Approved", value: "approved" },
        { text: "Draft", value: "draft" },
        { text: "Under Review", value: "underReview" },
        { text: "Rejected", value: "rejected" },
        { text: "Closed", value: "closed" },
      ],
      filteredValue: filteredInfo.status || null,
      onFilter: (value, record) => record?.status?.includes(value as string),
      sorter: (a, b) => a.status?.length - b.status?.length,
      sortOrder: sortedInfo.columnKey === "status" ? sortedInfo.order : null,
      ellipsis: true,
    },
    {
      title: "Closing Date",
      dataIndex: "properties",
      key: "closingDate",
      render: (properties) => {
        if (!properties || !properties[0]?.closingDate) return "No date";
        const date = properties[0].closingDate;
        return moment.utc(date).format("D MMMM, YYYY");
      },
      width: 140,
      sorter: (a, b) => {
        const dateA = a?.properties?.[0]?.closingDate
          ? new Date(a.properties[0].closingDate).getTime()
          : 0;
        const dateB = b?.properties?.[0]?.closingDate
          ? new Date(b.properties[0].closingDate).getTime()
          : 0;
        return dateA - dateB;
      },
      sortOrder:
        sortedInfo.columnKey === "closingDate" ? sortedInfo.order : null,
      filterDropdown: ({ setSelectedKeys, selectedKeys, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <RangePicker
            value={
              currentDateFilter && currentDateFilter.length === 2
                ? currentDateFilter
                : selectedKeys &&
                  selectedKeys[0] &&
                  selectedKeys[0].length === 2
                ? [
                    selectedKeys[0][0] ? selectedKeys[0][0] : null,
                    selectedKeys[0][1] ? selectedKeys[0][1] : null,
                  ]
                : [null, null]
            }
            onChange={(dates) => {
              if (dates && dates.length === 2) {
                const dateRange = [
                  dates[0].toISOString(),
                  dates[1].toISOString(),
                ];
                setSelectedKeys([dateRange]);
                handleFilter([dates[0], dates[1]]);
              } else {
                setSelectedKeys([]);
                handleFilter([]);
              }
            }}
            style={{ marginBottom: 8, width: "250px" }}
          />
          <Space>
            <Button
              type="primary"
              className="mx-1"
              danger
              onClick={() => {
                clearFilters();
                setSelectedKeys([]);
                setCurrentDateFilter(null);
              }}
              size="small"
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
    },
    {
      title: "Submitted At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => createdAt ? moment(createdAt).format("D MMM YYYY, hh:mm A") : "—",
      width: 160,
    },
    {
      title: "List Type",
      dataIndex: "listType",
      key: "listType",
      render: (listType) => listType || "—",
      width: 110,
      filters: [
        { text: "Residential", value: "Residential" },
        { text: "Commercial", value: "Commercial" },
      ],
      filteredValue: filteredInfo.listType || null,
      onFilter: (value, record) => record?.listType === value,
    },
    {
      title: "Rep. Type",
      dataIndex: "representationType",
      key: "representationType",
      render: (representationType) => {
        const map: Record<string, string> = { single: "Single", multiple: "Multiple", designation: "Designation" };
        return map[representationType] || representationType || "—";
      },
      width: 110,
      filters: [
        { text: "Single", value: "single" },
        { text: "Multiple", value: "multiple" },
        { text: "Designation", value: "designation" },
      ],
      filteredValue: filteredInfo.representationType || null,
      onFilter: (value, record) => record?.representationType === value,
    },
    {
      title: "Sales Price",
      dataIndex: "properties",
      key: "salesPrice",
      render: (properties) => {
        const price = properties?.[0]?.salesPrice || properties?.[0]?.soldPrice || properties?.[0]?.listingPrice;
        return price ? `$${Number(price).toLocaleString()}` : "—";
      },
      width: 120,
    },
    {
      title: "Deposit Amount",
      dataIndex: "properties",
      key: "depositAmount",
      render: (properties) => {
        const deposit = properties?.[0]?.depositAmount;
        return deposit ? `$${Number(deposit).toLocaleString()}` : "—";
      },
      width: 130,
    },
    {
      title: "Buyer Name",
      dataIndex: "buyerInformations",
      key: "buyerName",
      render: (buyerInformations) => {
        const buyer = buyerInformations?.[0];
        if (!buyer) return "—";
        return `${buyer.firstName || ""} ${buyer.lastName || ""}`.trim() || "—";
      },
      width: 130,
    },
    {
      title: "Seller Name",
      dataIndex: "propertyListing",
      key: "sellerName",
      render: (propertyListing) => {
        try {
          const sellersInfo = propertyListing?.sellersInfo ? JSON.parse(propertyListing.sellersInfo).sellersInfo : [];
          const seller = sellersInfo?.[0];
          if (!seller) return "—";
          return `${seller.firstName || ""} ${seller.lastName || ""}`.trim() || "—";
        } catch { return "—"; }
      },
      width: 130,
    },
    {
      title: "Lead Source",
      dataIndex: "leadSource",
      key: "leadSource",
      render: (leadSource) => {
        if (leadSource === "dvrLead") return "DVR Lead";
        if (leadSource === "myLead") return "Non DVR Lead";
        return "—";
      },
      width: 120,
      filters: [
        { text: "DVR Lead", value: "dvrLead" },
        { text: "Non DVR Lead", value: "myLead" },
      ],
      filteredValue: filteredInfo.leadSource || null,
      onFilter: (value, record) => record?.leadSource === value,
    },
    {
      title: "Actions",
      dataIndex: "uuid",
      key: "actions",
      render: (uuid, record) => (
        <>
          <Dropdown
            menu={{
              items: [
                ((user.userType === "agent" &&
                  (record.status === "draft" ||
                    record.status === "rejected")) ||
                  isSuperAdmin ||
                  isBranchAdmin) &&
                  hasPermissionForSlug("edit-tradesheet") && {
                    key: "edit",
                    label: (
                      <Link
                        onClick={() => {
                          localStorage.setItem(
                            "tradeSheetId",
                            record?.tradeSheetTypeId || ""
                          );
                        }}
                        className="flex items-center gap-2"
                        to={`/dashboard/agent/pages/form/trade-sheet/agent-basic-info/${uuid}`}
                      >
                        <FaRegEdit /> Edit
                      </Link>
                    ),
                  },
                //view rejecction cause
                record.status === "rejected" && {
                  key: "Rejected",
                  label: (
                    <button
                      onClick={() => {
                        handleRejectReasonView(record?.rejectReasonMain);
                        localStorage.setItem(
                          "tradeSheetId",
                          record?.tradeSheetTypeId || ""
                        );
                      }}
                      className="flex gap-2 items-center hover:text-primaryPurple duration-100 "
                    >
                      <FaComment className="text-red-500" /> Incomplete
                    </button>
                  ),
                },

                // view tradesher
                {
                  key: "view",
                  label: (
                    <button
                      onClick={() => {
                        setIsModalPreviewTradeSheetVisible(true);
                        localStorage.setItem(
                          "tradeSheetRepresentationData",
                          JSON.stringify(record?.representation || "")
                        );
                        setSelectedTradeData(record);
                        setSelectedTradeSheetId(record?.tradeSheetTypeId);
                        localStorage.setItem(
                          "tradeSheetId",
                          record?.tradeSheetTypeId || ""
                        );
                      }}
                      className="flex items-center gap-2"
                      to={`/dashboard/agent/pages/form/trade-sheet/preview-page/${uuid}`}
                    >
                      <FaEye /> View
                    </button>
                  ),
                },

                //file manager for single representation

                {
                  key: "fileManager",
                  label: (
                    <button
                      onClick={() => {
                        setIsModalFileManagereVisible(true);
                        setSelectedTradeData(record);
                        setSelectedTradeSheetId(record?.tradeSheetTypeId);
                        localStorage.setItem(
                          "tradeSheetId",
                          record?.tradeSheetTypeId || ""
                        );
                      }}
                      to={`/dashboard/agent/pages/form/trade-sheet/paperwork-file-manager/${uuid}`}
                      className=" flex items-center gap-2" // Added margin left for spacing
                    >
                      <FaFileAlt /> File Manager
                    </button>
                  ),
                },

                //additional document
                record.status != "closed" &&
                  /* record.representationType == "single" && */ {
                    key: "additionalDocument",
                    label: (
                      <button
                        onClick={() => {
                          setIsModalModalAdditionalDocumentVisible(true);
                          setSelectedTradeData(record);
                          setSelectedTradeSheetId(record?.tradeSheetTypeId);
                          localStorage.setItem(
                            "tradeSheetId",
                            record?.tradeSheetTypeId || ""
                          );
                        }}
                        title="Additional Document"
                        to={`/dashboard/agent/pages/form/trade-sheet/additional-document/${uuid}`}
                        className=" flex items-center gap-2"
                      >
                        <FaFileUpload /> Additional Document
                      </button>
                    ),
                  },
                hasPermissionForSlug("share-document-tradesheet") && {
                  key: "share",
                  label: (
                    <button
                      onClick={() => {
                        setIsModalShareTradeSheetDocumentVisible(true);
                        setSelectedTradeData(record);
                        setSelectedTradeSheetId(record?.tradeSheetTypeId);
                        localStorage.setItem(
                          "tradeSheetId",
                          record?.tradeSheetTypeId || ""
                        );
                      }}
                      to={`/dashboard/super-admin/share-trade-sheet-document/${uuid}`}
                      className=" flex items-center gap-2"
                    >
                      <FaShare /> Share Document
                    </button>
                  ),
                },

                //lawyer share
                {
                  key: "lawyerShare",
                  label: (
                    <button
                      onClick={() => {
                        const sellerInfo = record.propertyListing?.sellersInfo
                          ? JSON.parse(record.propertyListing.sellersInfo)
                              .sellersInfo[0]
                          : {};
                        const property =
                          record.properties && record.properties[0]
                            ? record.properties[0]
                            : {};
                        const lawyerDetails =
                          record.lawyerDetails && record.lawyerDetails[0]
                            ? record.lawyerDetails[0]
                            : {};
                        const sellerLawyer = lawyerDetails.sellerLawyer || {};
                        const buyerLawyer = lawyerDetails.buyerLawyer || {};
                        const buyerInfo =
                          record.buyerInformations &&
                          record.buyerInformations[0]
                            ? record.buyerInformations[0]
                            : {};
                        const sharedUsers = record.sharedUsers || [];
                        // Collect only lawyer emails with names
                        let emailOptions = [];
                        if (sellerLawyer?.email)
                          emailOptions.push({
                            label: `Seller Lawyer: ${
                              sellerLawyer.name || ""
                            } (${sellerLawyer.email})`,
                            value: sellerLawyer.email,
                          });
                        if (buyerLawyer?.email)
                          emailOptions.push({
                            label: `Buyer Lawyer: ${buyerLawyer.name || ""} (${
                              buyerLawyer.email
                            })`,
                            value: buyerLawyer.email,
                          });
                        // Remove duplicates and empty emails
                        emailOptions = emailOptions.filter(
                          (opt, idx, arr) =>
                            opt.value &&
                            arr.findIndex((o) => o.value === opt.value) === idx
                        );
                        setIsModalLawyerShareVisible(true);
                        setSelectedTradeData({
                          tradeSheetTypeId: record.tradeSheetTypeId,
                          representation: record.representation,
                          propertyAddress:
                            property.propertyAddress ||
                            record.propertyListing?.propertyAddress,
                          sellerName: sellerInfo
                            ? `${sellerInfo.firstName || ""} ${
                                sellerInfo.lastName || ""
                              }`.trim()
                            : "N/A",
                          buyerName: buyerInfo
                            ? `${buyerInfo.firstName || ""} ${
                                buyerInfo.lastName || ""
                              }`.trim()
                            : "N/A",
                          closingDate: property.closingDate,
                          purchasePrice:
                            property.salesPrice > 0
                              ? property.salesPrice
                              : property.listingPrice > 0
                              ? property.listingPrice
                              : property.soldPrice > 0
                              ? property.soldPrice
                              : 0.0,
                          depositAmount: property.depositAmount,
                          sellerLawyer: {
                            name: sellerLawyer.name || "N/A",
                            firmName: sellerLawyer.firm?.firmName || "N/A",
                            address: sellerLawyer.address || "N/A",
                            firm: sellerLawyer.firm,
                            city: sellerLawyer.city,
                            state: sellerLawyer.state,
                            postalZipCode: sellerLawyer.postalZipCode,
                            email: sellerLawyer.email || "N/A",
                            phoneNumber: sellerLawyer.phoneNumber || "N/A",
                            cellPhoneNumber:
                              sellerLawyer.cellPhoneNumber || "N/A",
                            faxNumber: sellerLawyer.faxNumber || "N/A",
                          },
                          buyerLawyer: {
                            name: buyerLawyer.name || "N/A",
                            firmName: buyerLawyer.firm?.firmName || "N/A",
                            address: buyerLawyer.address || "N/A",
                            firm: buyerLawyer.firm,
                            city: buyerLawyer.city,
                            state: buyerLawyer.state,
                            postalZipCode: buyerLawyer.postalZipCode,
                            email: buyerLawyer.email || "N/A",
                            phoneNumber: buyerLawyer.phoneNumber || "N/A",
                            cellPhoneNumber:
                              buyerLawyer.cellPhoneNumber || "N/A",
                            faxNumber: buyerLawyer.faxNumber || "N/A",
                          },
                          emailOptions,
                        });
                      }}
                      className="flex items-center gap-2"
                    >
                      <FaShare /> Lawyer Share
                    </button>
                  ),
                },

                //delete tradesheet
                ((user.userType === "agent" && record.status === "draft") || isSuperAdmin || (isBranchAdmin && (user?.branchId == null ||record?.branchId == null || record.branchId === user.branchId))) &&
                  hasPermissionForSlug("delete-tradesheet") && {
                    key: "delete",
                    label: (
                      <button
                        onClick={() => handleDelete(uuid)}
                        className=" flex items-center gap-2"
                      >
                        <MdDelete /> Delete
                      </button>
                    ),
                  },

                // trade accounting access (super admin / main admin only)
                isSuperAdmin && {
                  key: "trade-accounting",
                  label: (
                    <Link
                      to={`/dashboard/accounting/trade-sheet-finalize/${uuid}`}
                      className=" flex items-center gap-2"
                    >
                      <FaMoneyBillTransfer /> Trade Accounting
                    </Link>
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
        </>
      ),
      fixed: "right",
      width: 20,
      align: "center",
    },
  ];

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
          newSelectedRowKeys = changeableKeys.filter((_, index) => {
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
          newSelectedRowKeys = changeableKeys.filter((_, index) => {
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

  // Use representationFilteredData (exact-match Represent/Type) for filterProps and tableSourceData
  const filterProps = filter
    ? representationFilteredData?.filter((item) => item.tradeStatus === filter)
    : representationFilteredData;

  //add index for serial number
  const tableSourceData = filterProps?.map((item: any, index: number) => {
    return {
      ...item,
      serial: index + 1,
    };
  });

  const handleShare = async () => {
    await sendLawyerPDFEmail({
      tradeSheetId: selectedTradeData.tradeSheetTypeId,
      email: selectedEmail,
      note: comment,
    });
  };

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  const visibleColumns = columns.filter(col => visibleColumnKeys.includes(col.key as string));

  const renderTable = (dataSource: any[]) =>
    isLoading ? (
      <TableLoader />
    ) : (
      <Table
        size="small"
        scroll={{ x: "max-content" }}
        rowSelection={rowSelection}
        columns={visibleColumns}
        dataSource={dataSource}
        pagination={{ pageSize: 20, current: currentPage }}
        rowKey="uuid"
        onChange={handleChange}
        rowClassName={(record) =>
          record.tradeSheetTypeId === selectedTradeSheetId
            ? "bg-blue-50 border-l-2 border-[#9F8667]"
            : ""
        }
      />
    );

  const totalCount = tableSourceData?.length ?? 0;
  const draftCount =
    tableSourceData?.filter((i) => i.status === "draft").length ?? 0;
  const pendingCount =
    tableSourceData?.filter((i) => i.tradeStatus === "pending").length ?? 0;
  const closedCount =
    tableSourceData?.filter((i) => i.tradeStatus === "closed").length ?? 0;

  const activeTabData =
    activeTab === "all"
      ? tableSourceData
      : activeTab === "draft"
      ? tableSourceData?.filter((i) => i.status === "draft")
      : activeTab === "pending"
      ? tableSourceData?.filter((i) => i.tradeStatus === "pending")
      : tableSourceData?.filter((i) => i.tradeStatus === "closed");

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">

        {/* Single toolbar row */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">

          {/* Title */}
          <h1 className="!mb-0 text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">
            My Trade Sheet Submissions
            <span className="ml-1 text-gray-400 font-normal text-[11px]">({totalCount})</span>
          </h1>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

          {/* Tabs */}
          <div className="flex items-center gap-1">
            {[
              { key: "all", label: "All", count: totalCount },
              { key: "draft", label: "Draft", count: draftCount },
              { key: "pending", label: "Pending", count: pendingCount },
              { key: "closed", label: "Closed", count: closedCount },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all duration-150 whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-[#9F8667] text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {tab.label}
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                    activeTab === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
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
              onChange={(e) => {
                setSearchText(e.target.value);
                localStorage.setItem("searchText", e.target.value);
              }}
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
                onClick={() => {
                  setSearchText("");
                  localStorage.removeItem("searchText");
                }}
                className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                style={{ right: 6 }}
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

          {/* Manage Fields */}
          <Popover
            open={manageFieldsOpen}
            onOpenChange={setManageFieldsOpen}
            trigger="click"
            placement="bottomRight"
            title={<span style={{ fontSize: 13, fontWeight: 600 }}>Manage fields</span>}
            content={
              <div style={{ width: 270 }}>
                <div style={{ marginBottom: 8 }}>
                  <input
                    placeholder="Search field"
                    value={columnSearch}
                    onChange={e => setColumnSearch(e.target.value)}
                    style={{ width: "100%", padding: "4px 8px", border: "1px solid #d9d9d9", borderRadius: 4, fontSize: 12 }}
                  />
                </div>
                <div style={{ fontSize: 11, color: "#8c8c8c", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  Fields in table
                </div>
                {allColumnDefs
                  .filter(def => def.label.toLowerCase().includes(columnSearch.toLowerCase()))
                  .map(def => (
                    <div key={def.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f5f5f5" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "#ccc", fontSize: 13, cursor: def.locked ? "default" : "grab", userSelect: "none", letterSpacing: "-1px" }}>⠿⠿</span>
                        <Checkbox
                          checked={def.locked || visibleColumnKeys.includes(def.key)}
                          disabled={def.locked}
                          onChange={() => toggleColumn(def.key)}
                        >
                          <span style={{ fontSize: 13 }}>{def.label}</span>
                        </Checkbox>
                      </div>
                      {def.locked && <MdLock style={{ color: "#bbb", fontSize: 13, flexShrink: 0 }} />}
                    </div>
                  ))
                }
              </div>
            }
          >
            <button
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs flex-shrink-0"
            >
              <BsLayoutThreeColumns style={{ fontSize: 12 }} />
              <span>Fields</span>
            </button>
          </Popover>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasPermissionForSlug("create-tradesheet") && (
              <Link
                to="/dashboard/agent/pages/form/trade-sheet/agent-basic-info"
                className="primary-btn"
              >
                Create
              </Link>
            )}
            {hasPermissionForSlug("delete-tradesheet") && (
              <button onClick={handleDeleteMultipleClick} className="cancel-btn">
                Delete Selected
              </button>
            )}
            {isSuperAdmin && hasPermissionForSlug("delete-tradesheet") && (
              <Link
                to="/dashboard/agent/pages/form/trade-sheet/my-submission-archive-trade-list"
                className="primary-btn"
              >
                Archive
              </Link>
            )}
          </div>
        </div>

        {/* Table */}
        <div>{renderTable(activeTabData)}</div>

      </div>

      {/* ── Delete Single Confirmation Modal ── */}
      <ConfirmDeleteModal
        open={isModalVisible}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />

      {/* ── Reject Reason Modal ── */}
      <Modal
        title="Add Reject Reasons"
        open={isRejectModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={() => changeStatusApi(changeStatus, changeUuid)}
            style={{
              marginLeft: "8px",
              backgroundColor: "#0B1D3D",
              borderColor: "#0B1D3D",
              color: "#fff",
            }}
          >
            Save
          </Button>,
          <Button key="cancel" onClick={cancelDelete}>
            Cancel
          </Button>,
        ]}
      >
        <Input.TextArea
          rows={4}
          placeholder="Enter reject reason here"
          value={rejectReasonMain}
          onChange={(e) => setRejectReasonMain(e.target.value)}
        />
      </Modal>

      {/* ── Missing Important Files Modal ── */}
      <Modal
        title="Important Documents Missing"
        open={isMissingFilesModalVisible}
        onCancel={() => { setIsMissingFilesModalVisible(false); setUploadedInModal(new Set()); }}
        footer={[
          uploadedInModal.size === missingImportantFiles.length && missingImportantFiles.length > 0 ? (
            <Button
              key="approve"
              type="primary"
              onClick={async () => {
                setIsMissingFilesModalVisible(false);
                setUploadedInModal(new Set());
                await changeStatusApi("approved", changeUuid || "");
              }}
              style={{ backgroundColor: "#0B1D3D", borderColor: "#0B1D3D" }}
            >
              Approve Now
            </Button>
          ) : (
            <Button key="cancel" onClick={() => { setIsMissingFilesModalVisible(false); setUploadedInModal(new Set()); }}>
              Cancel
            </Button>
          ),
        ]}
      >
        <p style={{ marginBottom: 12 }}>
          Please upload the following required documents before approving this trade sheet.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {missingImportantFiles.map((f) => {
            const uploaded = uploadedInModal.has(f.id);
            const uploading = uploadingInModal === f.id;
            return (
              <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", border: `1px solid ${uploaded ? "#16a34a" : "#e5e7eb"}`, borderRadius: 6, backgroundColor: uploaded ? "#f0fdf4" : "#fafafa" }}>
                <span style={{ color: uploaded ? "#16a34a" : "#dc2626", fontWeight: 500, flex: 1 }}>
                  {uploaded ? "✓ " : ""}{f.name}
                </span>
                {!uploaded && (
                  <label style={{ cursor: uploading ? "not-allowed" : "pointer", marginLeft: 12, lineHeight: 1 }}>
                    <input
                      type="file"
                      style={{ display: "none" }}
                      disabled={uploading || !missingFilesTradeSheetId}
                      onChange={async (e) => {
                        const rawFile = e.target.files?.[0];
                        if (!rawFile || !missingFilesTradeSheetId) return;

                        const file = await guardFile(rawFile);
                        if (!file) {
                          e.target.value = "";
                          return;
                        }

                        setUploadingInModal(f.id);
                        const formData = new FormData();
                        formData.append("attachment", file);
                        try {
                          await uploadPaperWorkFileAttachment({
                            data: formData,
                            tradeSheetId: missingFilesTradeSheetId,
                            uploadFileNameId: f.id,
                          }).unwrap();
                          setUploadedInModal((prev) => new Set([...prev, f.id]));
                          toast.success(`${f.name} uploaded successfully.`);
                        } catch {
                          toast.error(`Failed to upload ${f.name}.`);
                        }
                        setUploadingInModal(null);
                        e.target.value = "";
                      }}
                    />
                    {uploading ? (
                      <span style={{ fontSize: 12, color: "#6b7280" }}>Uploading...</span>
                    ) : (
                      <img src={uploadIcon} alt="Upload" style={{ width: 22, height: 22, display: "block" }} />
                    )}
                  </label>
                )}
              </div>
            );
          })}
        </div>
        {uploadedInModal.size === missingImportantFiles.length && missingImportantFiles.length > 0 && (
          <p style={{ marginTop: 12, color: "#16a34a", fontWeight: 500 }}>
            All documents uploaded. Click "Approve Now" to proceed.
          </p>
        )}
      </Modal>

      {/* ── Reject Reason View Modal ── */}
      <Modal
        title="Reject Reasons View"
        open={isRejectReasonViewModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button key="cancel" onClick={cancelDelete}>
            Cancel
          </Button>,
        ]}
      >
        <div>{rejectReasonMain ? rejectReasonMain : rejectReason}</div>
      </Modal>

      {/* ── Delete Multiple Confirmation Modal ── */}
      <ConfirmDeleteModal
        open={isDeleteMultipleModalVisible}
        onCancel={cancelDelete}
        onConfirm={handleDeleteConfirmMultiple}
      />

      {/* ── File Manager Modal ── */}
      <Modal
        title={
          <span>
            File Manager
            {selectedTradeData?.tradeSheetTypeId && (
              <span className="font-normal text-gray-500 text-sm">
                {" — "}
                {selectedTradeData.tradeSheetTypeId} — {getPropertyAddress(selectedTradeData)}
              </span>
            )}
          </span>
        }
        open={isModalFileManagereVisible}
        onCancel={() => setIsModalFileManagereVisible(false)}
        width={1300}
        footer={[
          <Button
            key="cancel"
            onClick={() => setIsModalFileManagereVisible(false)}
          >
            Close
          </Button>,
        ]}
      >
        <div>
          {selectedTradeData?.representationType == "single" ? (
            <TradeSheetPaperworkFileManager
              uuid={selectedTradeData?.uuid}
              resetTrigger={isModalFileManagereVisible}
            />
          ) : (
            <TradeSheetPaperworkFileManagerMultipleRepresentation
              uuid={selectedTradeData?.uuid}
              resetTrigger={isModalFileManagereVisible}
            />
          )}
        </div>
      </Modal>

      {/* ── Share Document Modal ── */}
      <Modal
        title="Share TradeSheet Document"
        open={isModalShareTradeSheetDocumentVisible}
        onCancel={() => setIsModalShareTradeSheetDocumentVisible(false)}
        width={1100}
        footer={null}
      >
        <div>
          <ShareTradeSheetDocument
            uuid={selectedTradeData?.uuid}
            onClose={() => setIsModalShareTradeSheetDocumentVisible(false)}
          />
        </div>
      </Modal>

      {/* ── Additional Document Modal ── */}
      <Modal
        title="Additional TradeSheet Document"
        open={isModalAdditionalDocumentVisible}
        onCancel={() => setIsModalModalAdditionalDocumentVisible(false)}
        width={1100}
        footer={[
          <Button
            key="cancel"
            onClick={() => setIsModalModalAdditionalDocumentVisible(false)}
          >
            Close
          </Button>,
        ]}
      >
        <div>
          <TradeSheetAdditionalDocumentUpload uuid={selectedTradeData?.uuid} />
        </div>
      </Modal>

      {/* ── Preview Modal ── */}
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

      {/* Lawyer Share Modal */}
      <Modal
        title="Share Lawyer Data"
        open={isModalLawyerShareVisible}
        onCancel={() => setIsModalLawyerShareVisible(false)}
        width={800}
        footer={[
          <>
            <Checkbox
              checked={lawyerType === "seller"}
              onChange={() =>
                setLawyerType(lawyerType === "seller" ? "" : "seller")
              }
            >
              Seller Lawyer
            </Checkbox>
            <Checkbox
              checked={lawyerType === "buyer"}
              onChange={() =>
                setLawyerType(lawyerType === "buyer" ? "" : "buyer")
              }
            >
              Buyer Lawyer
            </Checkbox>
            <Button
              key="send"
              type="primary"
              loading={isSharingLawyer}
              onClick={async () => {
                if (!selectedEmail || !isValidEmail(selectedEmail)) {
                  setEmailError("Please enter a valid email address.");
                  return;
                }
                if (!lawyerInfoRef.current) return;
                // Generate PDF from lawyer info
                const canvas = await html2canvas(lawyerInfoRef.current);
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
                pdf.addImage(
                  imgData,
                  "PNG",
                  margin,
                  margin,
                  pdfImgWidth,
                  pdfImgHeight
                );
                const pdfBlob = pdf.output("blob");
                const pdfFile = new File([pdfBlob], "lawyer-details.pdf", {
                  type: "application/pdf",
                });
                // Prepare FormData
                const formData = new FormData();
                formData.append("email", selectedEmail);
                formData.append("note", comment);
                formData.append(
                  "tradeSheetId",
                  selectedTradeData.tradeSheetTypeId
                );
                formData.append("attachments", pdfFile);
                formData.append("lawyerType", lawyerType);
                await sendLawyerPDFEmail(formData);
                setIsModalLawyerShareVisible(false);
                setSelectedEmail("");
                setComment("");
              }}
            >
              Send
            </Button>
          </>,
        ]}
      >
        <div className="space-y-3">
          <div ref={lawyerInfoRef}>
            {/* Trade Info Box */}
            <h2 className="border-t border-gray-400 bg-[#9F8667] text-white border-x text-center text-sm font-bold py-1">
              Trade Information
            </h2>
            <table className="w-full text-xs border-collapse border border-gray-400 px-2 w-[50%] py-1 mb-4">
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-2 w-[50%] py-1 font-semibold">
                    TR ID
                  </td>
                  <td className="border border-gray-400 px-2 w-[50%] py-1">
                    {selectedTradeData?.tradeSheetTypeId || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 w-[50%] py-1 font-semibold">
                    Property Address
                  </td>
                  <td className="border border-gray-400 px-2 w-[50%] py-1">
                    {selectedTradeData?.propertyAddress || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 w-[50%] py-1 font-semibold">
                    Seller Name
                  </td>
                  <td className="border border-gray-400 px-2 w-[50%] py-1">
                    {selectedTradeData?.sellerName || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 w-[50%] py-1 font-semibold">
                    Buyer Name
                  </td>
                  <td className="border border-gray-400 px-2 w-[50%] py-1">
                    {selectedTradeData?.buyerName || "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 w-[50%] py-1 font-semibold">
                    Closing Date
                  </td>
                  <td className="border border-gray-400 px-2 w-[50%] py-1">
                    {selectedTradeData?.closingDate
                      ? new Date(
                          selectedTradeData?.closingDate
                        ).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 w-[50%] py-1 font-semibold">
                    Purchase Price
                  </td>
                  <td className="border border-gray-400 px-2 w-[50%] py-1">
                    {selectedTradeData?.purchasePrice
                      ? `$${selectedTradeData?.purchasePrice}`
                      : "N/A"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-2 w-[50%] py-1 font-semibold">
                    Deposit Amounts
                  </td>
                  <td className="border border-gray-400 px-2 w-[50%] py-1">
                    {selectedTradeData?.depositAmount
                      ? `$${selectedTradeData?.depositAmount}`
                      : "N/A"}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Show both if lawyerType is "" */}
            {(lawyerType === "" || lawyerType === "seller") && (
              <>
                {/* Seller Lawyer Info Table */}
                <h2 className="border-t border-gray-400 bg-[#9F8667] text-white border-x text-center text-sm font-bold py-1">
                  Seller Lawyer Information
                </h2>
                <table className="w-full text-xs border-collapse border border-gray-400 px-2 w-[50%] py-1 mb-4">
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        Name
                      </td>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        {selectedTradeData?.sellerLawyer?.name || "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        Lawyer Firm Name
                      </td>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        {selectedTradeData?.sellerLawyer?.firmName || "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        Address
                      </td>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        {formatLawyerAddress(selectedTradeData?.sellerLawyer)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        Email
                      </td>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        {selectedTradeData?.sellerLawyer?.email || "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        Phone Number
                      </td>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        {selectedTradeData?.sellerLawyer?.phoneNumber || "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        Cell Phone Number
                      </td>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        {selectedTradeData?.sellerLawyer?.cellPhoneNumber ||
                          "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        Fax Number
                      </td>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        {selectedTradeData?.sellerLawyer?.faxNumber || "N/A"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
            {(lawyerType === "" || lawyerType === "buyer") && (
              <>
                {/* Buyer Lawyer Info Table */}
                <h2 className="border-t border-gray-400 bg-[#9F8667] text-white border-x text-center text-sm font-bold py-1">
                  Buyer Lawyer Information
                </h2>
                <table className="w-full text-xs border-collapse border border-gray-400 px-2 w-[50%] py-1 mb-4">
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        Name
                      </td>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        {selectedTradeData?.buyerLawyer?.name || "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        Lawyer Firm Name
                      </td>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        {selectedTradeData?.buyerLawyer?.firmName || "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        Address
                      </td>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        {formatLawyerAddress(selectedTradeData?.buyerLawyer)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        Email
                      </td>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        {selectedTradeData?.buyerLawyer?.email || "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        Phone Number
                      </td>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        {selectedTradeData?.buyerLawyer?.phoneNumber || "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        Cell Phone Number
                      </td>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        {selectedTradeData?.buyerLawyer?.cellPhoneNumber ||
                          "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        Fax Number
                      </td>
                      <td className="border border-gray-400 px-2 w-[50%] py-1">
                        {selectedTradeData?.buyerLawyer?.faxNumber || "N/A"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
          </div>
          <div className="flex flex-col mb-4">
            <label htmlFor="recipientEmail" className="mb-2 font-semibold">
              Email
            </label>
            <Select
              mode="tags"
              maxTagCount={1}
              maxTagTextLength={100}
              style={{ width: "100%" }}
              placeholder="Select or type email address"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={selectedTradeData?.emailOptions || []}
              value={selectedEmail ? [selectedEmail] : []}
              onChange={(values) => {
                // Only allow one value
                const value = values[0] || "";
                setSelectedEmail(value);
                setEmailError("");
              }}
              notFoundContent={null}
            />
            {emailError && (
              <div style={{ color: "red", fontSize: 12 }}>{emailError}</div>
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
              value={comment}
              onChange={setComment}
            />
          </div>
        </div>
      </Modal>

      {pdfSizeReductionModal}
    </div>
  );
};

export default MySubmissionsTradeList;
