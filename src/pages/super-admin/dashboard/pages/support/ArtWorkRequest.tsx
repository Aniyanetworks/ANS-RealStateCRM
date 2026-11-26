// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useEffect, useState } from "react";
import {
  Table,
  Modal,
  message,
  TableColumnsType,
  Dropdown,
  Space,
  Button,
  Tabs,
  Tag,
  Upload,
  UploadProps,
} from "antd";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useParams } from "react-router-dom";

import {
  useCreateSupportRequestMutation,
  useUploadArtWorkFileMutation,
  useGetArtWorkFilesQuery,
  useGetSupportRequestsQuery,
  useChangeSuportStatusMutation,
  useUpdateSupportRequestMutation,
  useDeleteSupportRequestMutation,
  useDeleteArtWorkFileMutation,
  useAssignSupportRequestMutation,
  useGetSupportCommentsQuery,
  useCreateUpdateSupportCommentMutation,
  useDeleteSupportCommentMutation,
} from "../../../../../redux/api/common/supportSlice";
import TableLoader from "../../../../../components/loader/TableLoader";
import { FaChevronDown, FaEdit, FaSearch, FaTimes, FaTrash, FaUser } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useForm } from "react-hook-form";
import { baseUrl } from "../../../../../utils/constant";
import { Link } from "react-router-dom";
import {
  useGetSupportTeamQuery,
  useGetArtWorksQuery,
} from "../../../../../redux/api/superadmin/artwork/artWorkSlice";
import { UploadOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../redux/store";
import toast from "react-hot-toast";
import ButtonLoader from "../../../../../components/loader/buttonLoader";
import { usePermissions } from "../../../../../utils/permissionUtils";
import { formatDate, parseISO } from "date-fns";

interface SupportRequest {
  id: number;
  uuid?: string;
  userId: number;
  teamId: string;
  teamMemberId: string;
  title?: string;
  description?: string;
  status: string;
  type?: string;
  priority?: string;
  comment?: string;
  supportId?: string;
  supportRequestId?: string;
  createdAt: string;
  updatedAt: string;
  files?: ExistingFile[];
  selectedArtworks?: { id: number; platform: string }[];
  artworkRequirement?: { artWorkId: number; socialMedia: string }[];
  assignments?: {
    teamMemberId: number;
  }[];
}

interface SupportMember {
  id: number;
  name: string;
}

interface ExistingFile {
  id: number;
  filePath: string;
}

interface User {
  id: number;
  userType: string;
}

const SupportRequestList: React.FC = () => {
  const { id, filter } = useParams();
  const {
    data,
    error,
    refetch: refetchSuport,
    isLoading,
  } = useGetSupportRequestsQuery("graphic");
  const [supportId, setSupportId] = useState<string>("");
  const [singleData, setSingleData] = useState<object>("");
  const { data: singleArtWorkFileData, refetch: refetchArtworkFile } =
    useGetArtWorkFilesQuery(singleData.id, {
      skip: !singleData.id,
    });

  useEffect(() => {
    if (singleData && singleData.id) {
      refetchArtworkFile();
    }
  }, [singleData, refetchArtworkFile]);

  const { data: comments, refetch } = useGetSupportCommentsQuery(
    { supportRequestId: supportId },
    { skip: !supportId }
  );
  const [tableData, setTableData] = useState<SupportRequest[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteRequestUuid, setDeleteRequestUuid] = useState<string | null>(
    null
  );
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SupportRequest>();
  const [editingRequest, setEditingRequest] = useState<SupportRequest | null>(
    null
  );
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([]);
  const [removedFileIds, setRemovedFileIds] = useState<number[]>([]);
  const [description, setDescription] = useState<string>("");
  const { data: supportTeamData } = useGetSupportTeamQuery("Design Group");
  const [searchText, setSearchText] = useState("");
  const [selectedRequests, setSelectedRequests] = useState<{
    [key: string]: string;
  }>({});

  const [createRequest] = useCreateSupportRequestMutation();
  const [uploadArtWork] = useUploadArtWorkFileMutation();
  const [createComment] = useCreateUpdateSupportCommentMutation();
  const [deleteComment] = useDeleteSupportCommentMutation();
  const [updateRequest] = useUpdateSupportRequestMutation();
  const [deleteRequest] = useDeleteSupportRequestMutation();
  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>([]);
  const [isBulkDeleteVisible, setIsBulkDeleteVisible] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const handleBulkDelete = async () => {
    const uuids = ((tableSourceData as any[]) || [])
      .filter((r: any) => selectedRowKeys.includes(r.id))
      .map((r: any) => r.uuid)
      .filter(Boolean);
    if (!uuids.length) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(uuids.map((u: string) => deleteRequest(u).unwrap()));
      message.success(`${uuids.length} request${uuids.length > 1 ? "s" : ""} deleted successfully`);
      setSelectedRowKeys([]);
      setIsBulkDeleteVisible(false);
    } catch (err) {
      message.error("Failed to delete some requests");
    } finally {
      setIsBulkDeleting(false);
    }
  };
  const [deleteArtworkFile] = useDeleteArtWorkFileMutation();
  const [assignSupportRequest] = useAssignSupportRequestMutation();
  const [changeSuportStatus] = useChangeSuportStatusMutation();
  const { data: artWorks, isLoading: artWorksLoading } =
    useGetArtWorksQuery("");

  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const [filteredInfo, setFilteredInfo] = useState<Filters>({});
  const [sortedInfo, setSortedInfo] = useState<Sorts>({});

  const authUser = useSelector((state: RootState) => state.user.user as User);
  const { hasPermissionForSlug } = usePermissions();
  const userType = authUser?.userType;

  const statusOptions = [
    {
      label: "Open",
      value: "open",
    },
    {
      label: "In Progress",
      value: "inProgress",
    },
    {
      label: "Completed",
      value: "completed",
    },
    {
      label: "Closed",
      value: "closed",
    },
  ];
  const [currentComment, setCurrentComment] = useState<string>("");
  const [editId, setEditId] = useState<number | null>(null);

  const handleAddComment = async (): Promise<void> => {
    if (currentComment === "") {
      toast.error("Comment cannot be empty");
      return;
    }
    try {
      const formData = {
        comment: currentComment,
        supportRequestId: supportId,
      };

      await createComment({
        id: editId,
        data: formData,
      }).unwrap();

      toast.success("Comment submitted successfully");
      refetch();
    } catch (err: any) {
      const errorMessage = err?.data?.message || "Failed to submit comment";
      toast.error(errorMessage);
    }
    cancelComment();
  };

  const handleDeleteComment = async (delete_id: any): Promise<void> => {
    try {
      await deleteComment(delete_id).unwrap();

      toast.success("Comment deleted successfully");
      refetch();
    } catch (err: any) {
      const errorMessage = err?.data?.message || "Failed to delete comment";
      toast.error(errorMessage);
    }
  };

  const closeSuportDetails = (): void => {
    setSupportId("");
    setSelectedMember(null);
    setSelectedStatus(null);
  };
  const cancelComment = (): void => {
    setCurrentComment("");
    setEditId(null);
  };
  const handleEditComment = (id: number, comment: string): void => {
    setCurrentComment(comment);
    setEditId(id);
  };

  useEffect(() => {
    if (data?.data) {
      const filteredData = data?.data;
      setTableData(filteredData);
    }
  }, [data]);

  const filteredData = tableData?.filter((record) => {
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

  const handleChange: OnChange = (pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter as Sorts);
  };

  const filterProps = filter
    ? filteredData
        ?.filter((item) => item.user?.userType == "agent")
        ?.filter((record) => record.status == filter)
    : filteredData;

  const tableSourceData = filterProps?.map(
    (item: SupportRequest, index: number) => {
      return {
        ...item,
        serial: index + 1,
      };
    }
  );

  const [isAddOrUpdateLoading, setIsAddOrUpdateLoading] = useState(false);

  const handleAddOrUpdateRequest = async (values: SupportRequest) => {
    try {
      setIsAddOrUpdateLoading(true);
      const formData = new FormData();
      formData.append("title", values.title || "");
      formData.append("description", description || "");
      formData.append("status", values.status || "");
      formData.append("priority", values.priority || "");
      formData.append("type", values.type || "");
      formData.append("teamId", values.teamId || "");
      formData.append("teamMemberId", values.teamMemberId || "");

      const selectedArtworks = Object.entries(selectedRequests).map(
        ([id, platform]) => ({ id, platform })
      );

      formData.append("selectedArtworks", JSON.stringify(selectedArtworks));

      newFiles.forEach((file) => {
        formData.append("attachments", file);
      });

      formData.append("removedFileIds", JSON.stringify(removedFileIds));
      if (editingRequest) {
        await updateRequest({
          uuid: editingRequest.uuid,
          request: formData,
        }).unwrap();
        setIsAddOrUpdateLoading(false);
        toast.success("Support request updated successfully");
      } else {
        await createRequest(formData).unwrap();
        setIsAddOrUpdateLoading(false);
        toast.success("Support request created successfully");
      }
      setIsAddOrUpdateLoading(false);
      resetForm();
    } catch (err: any) {
      setIsAddOrUpdateLoading(false);
      toast.error(err.data.message);
    }
  };

  const handleOpenModal = () => {
    setEditingRequest(null);
    setIsModalVisible(true);
    setNewFiles([]);
    setExistingFiles([]);
    setDescription("");
  };

  const resetForm = () => {
    setIsModalVisible(false);
    setEditingRequest(null);
    setNewFiles([]);
    setExistingFiles([]);
    setRemovedFileIds([]);
    setDescription("");
    setSelectedRequests({});
    reset({
      title: "",
      priority: "",
      type: "",
      teamId: 2,
      teamMemberId: "",
    });
  };

  const handleEdit = (request: SupportRequest) => {
    setEditingRequest(request);
    setExistingFiles(request.files || []);
    setDescription(request.description || "");
    reset({
      title: request.title,
      priority: request.priority,
      type: request.type,
      status: request.status,
      teamId: request.teamId,
      teamMemberId: request?.assignments[0]?.teamMemberId,
    });

    const initialSelectedRequests =
      request.artworkRequirement?.reduce(
        (acc: { [key: string]: string }, requirement) => {
          acc[requirement.artWorkId] = requirement.socialMedia;
          return acc;
        },
        {}
      ) || {};

    setSelectedRequests(initialSelectedRequests);

    setIsModalVisible(true);
  };

  const handleDelete = (record: SupportRequest) => {
    setDeleteRequestUuid(record.uuid || null);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (deleteRequestUuid) {
      try {
        await deleteRequest(deleteRequestUuid).unwrap();
        message.success("Support request deleted successfully");
        setDeleteRequestUuid(null);
        setIsDeleteModalVisible(false);
      } catch (err) {
        message.error("Failed to delete support request");
      }
    }
  };
  const removeFile = async (uuid) => {
    if (uuid) {
      try {
        await deleteArtworkFile(uuid).unwrap();
        refetchArtworkFile();
        message.success("Artwork file deleted successfully");
      } catch (err) {
        message.error("Failed to delete artwork file");
      }
    }
  };

  type TabType = {
    id: string;
    name: string;
    link: string;
  };

  const tabs: TabType[] = [
    ...(hasPermissionForSlug("support-request-view")
      ? [
          {
            id: "1",
            name: "Support Request",
            link: `/dashboard/support/requests`,
          },
        ]
      : []),
    ...(userType === "superAdmin" && hasPermissionForSlug("artwork-items-view")
      ? [
          {
            id: "2",
            name: "Art Work Items",
            link: `/dashboard/support/art-work`,
          },
        ]
      : []),
    ...(hasPermissionForSlug("artwork-request-view")
      ? [
          {
            id: "3",
            name: "Art Work Request",
            link: `/dashboard/support/art-work/request`,
          },
        ]
      : []),
  ];
  const tabs2: TabType[] = [
    {
      id: "1",
      name: "Description",
    },
    {
      id: "2",
      name: "Comments",
    },
    {
      id: "3",
      name: "Attachments",
    },
    {
      id: "4",
      name: "Submit Art-Work",
    },
  ];

  const [activeTabKey, setActiveTabKey] = useState(tabs2[0]?.id);

  const resetDeleteForm = () => {
    resetForm();
    setIsDeleteModalVisible(false);
    setDeleteRequestUuid(null);
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setNewFiles((prevFiles) =>
      prevFiles.filter((file) => file.name !== fileToRemove.name)
    );
  };

  const handleRemoveExistingFile = (fileToRemove: {
    id: number;
    filePath: string;
  }) => {
    setRemovedFileIds((prev) => [...prev, fileToRemove.id]);
    setExistingFiles((prevFiles) =>
      prevFiles.filter((file) => file.id !== fileToRemove.id)
    );
  };

  const uploadProps: UploadProps = {
    multiple: true,
    beforeUpload: (file) => {
      setNewFiles((prevFiles) => [...prevFiles, file]);
      return false;
    },
    onRemove: (file) => {
      handleRemoveFile(file as unknown as File);
    },
    fileList: newFiles.map((file) => ({
      uid: file.name,
      name: file.name,
      status: "done",
    })),
  };

  const handleSuportDetails = (record: any) => {
    setSingleData(record);
    setSupportId(record.id);
    setSelectedMember(record.assignments?.[0]?.teamMemberId?.toString());
    setSelectedStatus(record.status);
  };

  useEffect(() => {
    if (id && data) {
      const record = data?.data.find((item) => item.id == id);
      if (record) {
        handleSuportDetails(record);
      }
    }
  }, [id, data]);

  const [assignLoading, setAssignLoading] = useState(false);

  const handleAssignRequest = async (e) => {
    try {
      setSelectedMember(e);
      setAssignLoading(true);
      const response = await assignSupportRequest({
        supportRequestId: supportId,
        teamMemberId: e,
      }).unwrap();
      if (response.status) {
        toast.success("Support request assigned successfully");
        refetchSuport();
      } else {
        toast.error(response.message);
      }
      setAssignLoading(false);
    } catch (err: any) {
      toast.error(err.data.message);
      setAssignLoading(false);
    }
  };

  const resetAssignForm = () => {
    setIsAssignModalVisible(false);
    setSelectedMember(null);
    setEditingRequest(null);
  };

  const handleRadioChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    artworkId: number
  ) => {
    const { value: platform } = event.target;
    const newSelection = { ...selectedRequests, [artworkId]: platform };

    if (Object.keys(newSelection).length <= 3) {
      setSelectedRequests(newSelection);
    } else {
      toast.error("You can select a maximum of 3 requests at a time.");
    }
  };

  const handleChangeStatus = async (newStatus: string, uuid: string) => {
    setSelectedStatus(newStatus);
    const requestData = {
      status: newStatus,
    };
    try {
      const response = await changeSuportStatus({
        data: requestData,
        uuid: uuid,
      }).unwrap();
      toast.success(`${response?.message}`);

      refetchSuport();
    } catch (error: any) {
      toast.error(`Error: ${error?.data?.message || "Something went wrong"}`);
    }
  };

  const handleChangeArtWorkFile = async (e, id) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const formData = new FormData();
    const fileDataArray = [];

    Array.from(selectedFiles).forEach((file) => {
      formData.append("files", file);
      fileDataArray.push({
        fileName: file.name,
        fileType: file.type,
      });
    });

    formData.append("fileDataArray", JSON.stringify(fileDataArray));
    formData.append("supportRequestId", id);

    try {
      const response = await uploadArtWork(formData).unwrap();
      if (response.status == true) {
        refetchArtworkFile();
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };


  const downloadFile = async (filePath) => {
    if (!filePath) {
      console.error("File path is empty");
      return;
    }

    const fileName = filePath.split("/").pop();
    const pdfUrl = filePath;

    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("Failed to fetch file");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the file:", error);
    }
  };

  if (error) {
    const errorMessage =
      "message" in error ? error.message : "An unknown error occurred";
    return <div>Error: {errorMessage}</div>;
  }

  const columns: TableColumnsType<SupportRequest> = [
    {
      title: "Suport ID",
      dataIndex: "suportID",
      key: "suportID",
      render: (suportID, record) => (
        <div
          className="hover:text-blue-600 cursor-pointer hover:underline"
          onClick={() => handleSuportDetails(record)}
        >
          {suportID}
        </div>
      ),
      sorter: (a, b) => a.suportID?.localeCompare(b.suportID),
      sortOrder: sortedInfo.columnKey === "suportID" ? sortedInfo.order : null,
      ellipsis: true,
    },
    {
      title: "Title",
      dataIndex: "title",

      render: (title, record) => (
        <div
          className="hover:text-blue-600 cursor-pointer hover:underline"
          onClick={() => handleSuportDetails(record)}
        >
          {title}
        </div>
      ),
      key: "title",
      sorter: (a, b) => a.title.localeCompare(b.title),
      sortOrder: sortedInfo.columnKey === "title" ? sortedInfo.order : null,
      ellipsis: true,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (description: string) => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = description;
        const textContent = tempDiv.textContent || tempDiv.innerText || "";
        return (
          <div>
            {textContent.substring(0, 50)}
            <br />
            {textContent.substring(50, 100) 
              ? textContent.substring(50, 100) + (textContent.length > 100 ? "..." : "")
              : null}
          </div>
        );
      },
    },
    {
      title: "Assigned By",
      dataIndex: "user",
      key: "user",
      render: (user: object) => user?.name || "...",
    },
    {
      title: "Assigned To",
      dataIndex: "assignments",
      key: "assignments",
      render: (assignments: Array) => assignments[0]?.teamMember?.name || "...",
    },

    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: string) =>
        formatDate(parseISO(createdAt), "dd MMMM yyyy, hh:mm a"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Open", value: "open" },
        { text: "In Progress", value: "inProgress" },
        { text: "Completed", value: "completed" },
        { text: "Closed", value: "closed" },
      ],
      filteredValue: filteredInfo?.status,
      onFilter: (value, record) => record?.status.includes(value as string),
      ellipsis: true,
      render: (status, record) => {
        const val = record?.status ?? status;
        const statusLabelMap: Record<string, string> = {
          open: "Open",
          inProgress: "In Progress",
          completed: "Completed",
          closed: "Closed",
        };
        const label = statusLabelMap[val] ?? val;
        const badgeStyle: React.CSSProperties = {
          display: "inline-flex", alignItems: "center", justifyContent: "space-between", gap: 6, minWidth: 108,
          padding: "2px 8px", borderRadius: 4, cursor: "pointer",
          border: "1px solid #e8e8e8", color: "#595959", fontSize: 11, lineHeight: 1.5, whiteSpace: "nowrap",
          userSelect: "none",
        };
        if (!hasPermissionForSlug("artwork-request-status-change")) {
          return <span style={{ ...badgeStyle, cursor: "default" }}>{label}</span>;
        }
        return (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: statusOptions.map((opt) => ({
                key: opt.value,
                label: (
                  <span style={{ fontSize: 11, color: "#595959" }}>
                    {opt.label}
                  </span>
                ),
                onClick: () => handleChangeStatus(opt.value, record.uuid),
              })),
            }}
          >
            <span style={badgeStyle}>
              {label}
              <FaChevronDown style={{ fontSize: 8, opacity: 0.45, flexShrink: 0 }} />
            </span>
          </Dropdown>
        );
      },
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",

      filters: [
        { text: "New Feature", value: "New Feature" },
        { text: "Improvement", value: "Improvement" },
        { text: "Bug Fix", value: "Bug Fix" },
        { text: "Other", value: "Other" },
      ],
      filteredValue: filteredInfo?.type,
      onFilter: (value, record) => record?.type.includes(value as string),
      ellipsis: true,
      render: (type: string) =>
        type === "New Feature" ? (
          <Tag color="green">New Feature</Tag>
        ) : type === "Improvement" ? (
          <Tag color="yellow">Improvement</Tag>
        ) : type === "Bug Fix" ? (
          <Tag color="red">Bug Fix</Tag>
        ) : (
          <Tag color="purple">Other</Tag>
        ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      filters: [
        { text: "Low", value: "Low" },
        { text: "Medium", value: "Medium" },
        { text: "High", value: "High" },
      ],
      filteredValue: filteredInfo?.priority,
      onFilter: (value, record) => record?.priority.includes(value as string),
      ellipsis: true,
      render: (priority: string) =>
        priority === "Low" ? (
          <Tag color="green">Low</Tag>
        ) : priority === "Medium" ? (
          <Tag color="blue">Medium</Tag>
        ) : (
          <Tag color="red">High</Tag>
        ),
    },
    {
      title: "Action",
      key: "action",
      dataIndex: "id",
      render: (_, record) => (
        <div>
          {(record.userId == authUser?.id || userType == "superAdmin") && (
            <Dropdown
              menu={{
                items: [
                  hasPermissionForSlug("artwork-request-edit") && {
                    key: "edit",
                    label: (
                      <div
                        className="flex items-center gap-2 p-2"
                        onClick={() => handleEdit(record)}
                      >
                        <FaEdit />
                        Edit
                      </div>
                    ),
                  },
                  hasPermissionForSlug("artwork-request-delete") && {
                    key: "delete",
                    label: (
                      <div
                        className="flex items-center gap-2 p-2"
                        onClick={() => handleDelete(record)}
                      >
                        <FaTrash />
                        Delete
                      </div>
                    ),
                  },
                ],
              }}
              trigger={["click"]}
            >
              <a onClick={(e) => e.preventDefault()}>
                <Space>
                  <BsThreeDotsVertical />
                </Space>
              </a>
            </Dropdown>
          )}
        </div>
      ),
      fixed: "right",
      align: "center",
    },
  ];

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
              <button type="button" onClick={() => setSearchText("")} className="absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" style={{ right: 6 }}>
                <FaTimes />
              </button>
            )}
          </div>
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          {hasPermissionForSlug("artwork-request-delete") && (
            <button
              className="cancel-btn flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedRowKeys.length}
              onClick={() => setIsBulkDeleteVisible(true)}
            >
              Delete Selected ({selectedRowKeys.length})
            </button>
          )}
          {hasPermissionForSlug("artwork-request-create") && (
            <button className="primary-btn flex-shrink-0" onClick={handleOpenModal}>Add Request</button>
          )}
        </div>

        <div>
          {isLoading ? (
            <TableLoader />
          ) : (
            <Table
              rowKey="id"
              rowSelection={
                hasPermissionForSlug("artwork-request-delete")
                  ? { selectedRowKeys, onChange: (keys) => setSelectedRowKeys(keys as (string | number)[]) }
                  : undefined
              }
              scroll={{ x: "max-content" }}
              columns={columns}
              dataSource={tableSourceData}
              pagination={{ pageSize: 20 }}
              onChange={handleChange}
            />
          )}
        </div>

      <Modal
        title="Delete selected requests"
        open={isBulkDeleteVisible}
        onCancel={() => setIsBulkDeleteVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsBulkDeleteVisible(false)}>
            Cancel
          </Button>,
          <Button key="delete" type="primary" danger loading={isBulkDeleting} onClick={handleBulkDelete}>
            Delete
          </Button>,
        ]}
      >
        <p>
          Are you sure you want to delete {selectedRowKeys.length} selected request
          {selectedRowKeys.length > 1 ? "s" : ""}? This cannot be undone.
        </p>
      </Modal>

      <Modal
        title={
          editingRequest ? "Edit Art Work Request" : "Add Art Work Request"
        }
        open={isModalVisible}
        onCancel={resetForm}
        width={700}
        footer={null}
      >
        <form onSubmit={handleSubmit(handleAddOrUpdateRequest)}>
          <div className="my-5">
            <label>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="global-input"
              {...register("title", { required: "Please input the title!" })}
              placeholder="Enter the title"
            />
            {errors.title && (
              <p className="text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="my-5">
            <p>Select a team member to assign this Art Work Request:</p>
            <select
              className="global-input"
              {...register("teamMemberId", {
                required: "Please select team member id!",
              })}
              defaultValue="150"
            >
              <option value="">Select a member</option>
              {Array.isArray(supportTeamData?.data) &&
                supportTeamData?.data?.map((member: SupportMember) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="artwork-requirements">
            <p>ARTWORK REQUIREMENTS (Max. 3 Request at a time)</p>

            <table className="min-w-full my-4 divide-y divide-gray-200 shadow-sm rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FACEBOOK
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    INSTAGRAM
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!artWorksLoading &&
                  artWorks?.data?.map((artwork: ArtWork) => (
                    <tr
                      key={artwork.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {artwork.title}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                        <input
                          type="radio"
                          name={`artwork-${artwork.id}`}
                          value="facebook"
                          checked={selectedRequests[artwork.id] === "facebook"}
                          onChange={(e) => handleRadioChange(e, artwork.id)}
                          className="form-radio h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                        />
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                        <input
                          type="radio"
                          name={`artwork-${artwork.id}`}
                          value="instagram"
                          checked={selectedRequests[artwork.id] === "instagram"}
                          onChange={(e) => handleRadioChange(e, artwork.id)}
                          className="form-radio h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="mb-20">
            <label>Description</label>
            <ReactQuill
              modules={{
                toolbar: [
                  [{ header: "1" }, { header: "2" }, { font: [] }],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["bold", "italic", "underline"],
                  [{ align: [] }],
                  ["link", "image"],
                  [{ color: [] }],
                ],
              }}
              value={description}
              onChange={setDescription}
              placeholder="Write your description here..."
              style={{ height: "100px", marginBottom: "40px" }}
            />
          </div>

          <div className="my-5">
            <label>Attachments (If Required)</label>
            <Upload.Dragger {...uploadProps} listType="text">
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag files to this area to upload
              </p>
              <p className="ant-upload-hint">
                Support for a single or bulk upload.
              </p>
            </Upload.Dragger>
            {existingFiles?.length > 0 && (
              <div className="selected-files mt-2">
                {existingFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 mb-1">
                    <a
                      href={file.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {file.filePath?.split("\\").pop()?.split("/").pop()}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingFile(file)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Ã—
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex mb-5">
            <div className="w-1/2 pr-2">
              <label>
                Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register("type", { required: "Please select the type!" })}
              >
                <option value="">Select a type</option>
                <option value="New Feature">New Feature</option>
                <option value="Bug Fix">Bug Fix</option>
                <option value="Improvement">Improvement</option>
                <option value="Other">Other</option>
              </select>
              {errors.type && (
                <p className="text-red-500">{errors.type.message}</p>
              )}
            </div>
            <div className="w-1/2 pr-2">
              <label>
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                {...register("priority", {
                  required: "Please select the priority!",
                })}
              >
                <option value="">Select a priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              {errors.priority && (
                <p className="text-red-500">{errors.priority.message}</p>
              )}
            </div>
            <div className="w-1/2 pl-2" hidden>
              <label>
                Status <span className="text-red-500">*</span>
              </label>
              <select
                {...register("status", {
                  required: "Please select the status!",
                })}
                value="open"
              >
                <option value="">Select a status</option>
                <option value="open">Open</option>
                <option value="inProgress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
              </select>
              {errors.status && (
                <p className="text-red-500">{errors.status.message}</p>
              )}
            </div>
            <div className="w-1/2 pl-2" hidden>
              <label>
                Team <span className="text-red-500">*</span>
              </label>
              <select
                {...register("teamId", { required: "Please select the team!" })}
                value="2"
              >
                <option value="2" selected>
                  Graphics
                </option>
              </select>
              {errors.teamId && (
                <p className="text-red-500">{errors.teamId.message}</p>
              )}
            </div>
          </div>

          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}
          >
            <button type="button" className="cancel-btn" onClick={resetForm}>
              Cancel
            </button>
            <button className="primary-btn" type="submit">
              {isAddOrUpdateLoading ? <ButtonLoader /> : "Submit"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        title="Assign Support Request"
        open={isAssignModalVisible}
        onCancel={resetAssignForm}
        footer={[
          <Button key="cancel" onClick={resetAssignForm}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleAssignRequest}
            disabled={!selectedMember}
          >
            {assignLoading ? <ButtonLoader /> : "Assign"}
          </Button>,
        ]}
      >
        <p>Select a team member to assign this support request:</p>
        <select
          value={selectedMember || ""}
          onChange={(e) => handleAssignRequest(e.target.value)}
          className="global-input"
        >
          <option value="" disabled>
            Select a member
          </option>
          {Array.isArray(supportTeamData?.data) &&
            supportTeamData?.data?.map((member: SupportMember) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
        </select>
      </Modal>

      <Modal
        title="Art Work Details"
        open={supportId ? true : false}
        onCancel={closeSuportDetails}
        footer={false}
        width={700}
      >
        <div>
          <p className="my-2 text-gray-600">
            Support ID: <span className="font-sm"> {singleData?.suportID}</span>
          </p>
          <p className="my-2 text-gray-600">
            Title: <span className="font-sm"> {singleData?.title}</span>
          </p>
          <p className="my-2 text-gray-600">
            Assigned By:{" "}
            <span className="font-bold"> {singleData?.user?.name}</span>
          </p>
          <p className="my-2 text-gray-600">
            Priority:{" "}
            {singleData?.priority === "Low" ? (
              <Tag color="green">Low</Tag>
            ) : singleData?.priority === "Medium" ? (
              <Tag color="blue">Medium</Tag>
            ) : (
              <Tag color="red">High</Tag>
            )}
          </p>

          {!hasPermissionForSlug("artwork-request-assign") && (
            <p className="my-2 text-gray-600">
              Assigned To:{" "}
              <span className="font-bold">
                {" "}
                {singleData ? singleData?.assignments[0]?.teamMember?.name : ""}
              </span>
            </p>
          )}

          {hasPermissionForSlug("artwork-request-assign") && (
            <div className="flex gap-3 mt-3">
              <p className="my-2 text-gray-600">Assign To:</p>
              <select
                value={selectedMember || ""}
                onChange={(e) => handleAssignRequest(e.target.value)}
                className="global-input w-1/3"
              >
                <option value="" disabled>
                  Select a member
                </option>
                {Array.isArray(supportTeamData?.data) &&
                  supportTeamData?.data?.map((member: SupportMember) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
          {!hasPermissionForSlug("artwork-request-status-change") && (
            <p className="my-2 text-gray-600">
              Status:
              {singleData?.status === "completed" ? (
                <Tag color="blue" className="mx-2">
                  Completed
                </Tag>
              ) : singleData?.status === "inProgress" ? (
                <Tag color="orange" className="mx-2">
                  In Progress
                </Tag>
              ) : singleData?.status === "closed" ? (
                <Tag color="green" className="mx-2">
                  Closed
                </Tag>
              ) : (
                <Tag color="red " className="mx-2">
                  Open
                </Tag>
              )}
            </p>
          )}
          {hasPermissionForSlug("artwork-request-status-change") && (
            <div className="flex gap-3 mt-3">
              <p className="my-2 text-gray-600">Status:</p>
              <select
                value={selectedStatus || ""}
                onChange={(e) =>
                  handleChangeStatus(e.target.value, singleData.uuid)
                }
                className="global-input w-1/3 ml-5"
              >
                <option value="" disabled>
                  Select a member
                </option>
                {Array.isArray(statusOptions) &&
                  statusOptions?.map((status) => (
                    <option key={status} value={status.value}>
                      {status.label}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="mt-3">
            <Tabs
              defaultActiveKey="1"
              type="card"
              className="m-2"
              onChange={(key) => setActiveTabKey(key)}
              items={tabs2.map((tab) => ({
                label: <span>{tab.name}</span>,
                key: tab.id,
              }))}
            />
          </div>
          {activeTabKey == "1" && (
            <div>
              <div
                className="mb-3"
                dangerouslySetInnerHTML={{ __html: singleData.description }}
              />

              {singleData.files && singleData.files.length > 0 ? (
                singleData.files.map((file) => (
                  <a
                    key={file.id}
                    href={`${file.filePath}`}
                    className="text-[#0f766e] font-medium bg-[#0f766e]/10 py-1 px-3 rounded-3xl hover:bg-[#0f766e]/20 hover:text-black transition duration-200 text-[12px]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {file?.filePath?.split(/[/\\]/)?.pop() || ""}
                  </a>
                ))
              ) : (
                <span className="text-sm text-gray-500">
                  No attachments available
                </span>
              )}
            </div>
          )}

          {activeTabKey == "2" && (
            <div>
              <p className="mb-2 text-gray-600">
                {editId !== null ? "Edit Comment:" : "Add Comment:"}
              </p>
              <ReactQuill
                modules={{
                  toolbar: [
                    [{ header: "1" }, { header: "2" }, { font: [] }],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["bold", "italic", "underline"],
                    [{ align: [] }],
                    ["link", "image"],
                    [{ color: [] }],
                  ],
                }}
                value={currentComment}
                onChange={setCurrentComment}
                placeholder="Write your comment here..."
                style={{ height: "80px", marginBottom: "40px" }}
              />
              <br />
              <div className=" flex justify-end gap-2">
                <button
                  className="primary-btn text-white px-4 py-2 rounded-md "
                  onClick={handleAddComment}
                >
                  {editId !== null ? "Update" : "Add"}
                </button>

                <button
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  onClick={cancelComment}
                >
                  Clear
                </button>
              </div>

              {comments?.data?.clientSupportRequestData.length > 0 && (
                <div className="mt-4 max-h-[300px] overflow-y-auto">
                  <div className="">
                    <h3 className="text-md font-semibold mb-2">
                      Existing Comments:
                    </h3>
                    <ul className="space-y-2">
                      {comments?.data?.clientSupportRequestData?.map(
                        (comment, index) => (
                          <li
                            key={comment.id}
                            className="flex justify-between items-center bg-gray-100 p-2 px-4 rounded-md"
                          >
                            <div className="flex gap-3">
                              {comment.commentCreatedBy.profilePicture ? (
                                <img
                                  src={comment.commentCreatedBy.profilePicture}
                                  alt={comment.commentCreatedBy.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="min-w-10 max-h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                                  {comment.commentCreatedBy.name
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                              <span className="text-gray-700 px-3">
                                <p className="text-xs mb-1 font-bold">
                                  {comment.commentCreatedBy.name}
                                </p>
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: comment.comment,
                                  }}
                                />
                                <span className="text-sm text-gray-500 font-light">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </span>
                              </span>
                            </div>
                            {comment.commentCreatedBy.id == authUser.id && (
                              <div className="flex gap-2">
                                <button
                                  className="text-blue-500 hover:underline"
                                  onClick={() =>
                                    handleEditComment(
                                      comment.id,
                                      comment.comment
                                    )
                                  }
                                >
                                  Edit
                                </button>
                                <button
                                  className="text-red-500 hover:underline"
                                  onClick={() =>
                                    handleDeleteComment(comment.id)
                                  }
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </li>
                        )
                      )}
                      {comments?.length === 0 && (
                        <p className="text-gray-500 text-sm">
                          No comments yet.
                        </p>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTabKey == "3" && (
            <div className="flex justify-between items-center">
              {singleData.files && singleData.files.length > 0 ? (
                singleData.files.map((file) => (
                  <a
                    key={file.id}
                    href={`${file.filePath}`}
                    className="text-sm text-[#0f766e] font-medium bg-[#0f766e]/10 py-1 px-3 rounded-3xl hover:bg-[#0f766e]/20 hover:text-white transition duration-200"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {file?.filePath?.split(/[/\\]/)?.pop() || ""}
                  </a>
                ))
              ) : (
                <span className="text-sm text-gray-500">
                  No attachments available
                </span>
              )}
            </div>
          )}
          {activeTabKey == "4" && (
            <div className="items-center">
              <div>
                <div>
                  <label className="flex justify-center items-center py-2 border border-dashed border-gray-400 rounded-md gap-2 hover:border-blue-500 cursor-pointer w-[300px]">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        handleChangeArtWorkFile(e, singleData.id)
                      }
                      accept="*"
                      multiple
                    />
                    <span>Upload Files</span>
                  </label>
                </div>
              </div>

              <div>
                {singleArtWorkFileData &&
                singleArtWorkFileData.data.length > 0 ? (
                  <div className="mt-4">
                    {singleArtWorkFileData.data.map(
                      (file: any, index: number) => (
                        <div key={index} className="flex items-center mb-2">
                          {file.fileType.startsWith("image") ? (
                            <div>
                              <a
                                href={file.filePath}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={file.filePath}
                                  alt={file.fileName}
                                  className="h-16 object-cover"
                                />
                              </a>
                            </div>
                          ) : (
                            <a
                              href={file.filePath}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span className="text-sm text-gray-600">
                                {file.fileName}
                              </span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => removeFile(file.uuid)}
                            className="ml-2 text-red-500"
                          >
                            âœ– Remove
                          </button>
                          <a
                            href={file.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            <button
                              type="button"
                              onClick={() => downloadFile(file.filePath)}
                              className="ml-2 text-blue-500"
                            >
                              â¬‡ Download
                            </button>
                          </a>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p>No files uploaded yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        title="Delete Support Request"
        open={isDeleteModalVisible}
        onCancel={resetDeleteForm}
        footer={[
          <Button key="cancel" onClick={resetDeleteForm}>
            Cancel
          </Button>,
          <Button key="confirm" type="primary" danger onClick={confirmDelete}>
            Confirm
          </Button>,
        ]}
      >
        <p>Are you sure you want to delete this support request?</p>
      </Modal>
      </div>
    </div>
  );
};

export default SupportRequestList;
