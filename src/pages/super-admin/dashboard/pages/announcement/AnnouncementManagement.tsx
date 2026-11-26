/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React, { useState } from "react";
import { Table, Modal, Button, Dropdown, Space } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import AnnouncementModal from "../../../../../components/dashboard/modals/AnnouncementModal";
import NotificationModal from "../../../../../components/dashboard/modals/NotificationModal";
import NotificationLogs from "../../../../../components/dashboard/modals/NotificationLogs";
import moment from "moment-timezone";
import {
  useGetAnnouncementsListQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useDeleteAnnouncementMultipleMutation,
  useSendAnnouncementNotificationsMutation,
  useGetNotificationLogListQuery,
  useDeleteNotificationLogsMultipleMutation
} from "../../../../../redux/api/superadmin/announcementSlice";
import { useGetAgentListDataQuery } from "../../../../../redux/api/superadmin/agent/agentManagementSlice";
import { FaRegEdit, FaSearch, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import toast from "react-hot-toast";
import TableLoader from "../../../../../components/loader/TableLoader";
import { BsThreeDotsVertical } from "react-icons/bs";
import { usePermissions } from "../../../../../utils/permissionUtils";

type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface Announcement {
  id?: number;
  uuid?: string;
  title: string;
  slug: string;
  description?: string;
  date?: string;
  status: "publish" | "unpublish";
  emailBody?: string;
  smsBody?: string;
  selectedAgents?: string[];
  selectedBranches?: string[];
  targetType?: "all" | "branches";
  recipientScope?: "all_users" | "selected_users";
  sendEmail?: boolean;
  sendSms?: boolean;
}

type TabType = {
  id: string;
  name: string;
};

const tabs: TabType[] = [
  {
    id: "announcements",
    name: "Scheduled",
  },
  {
    id: "logs",
    name: "Logs",
  },
];

const AnnouncementManagement: React.FC = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("announcements");
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<
    string | null>(null);
  const [selectedLogKeys, setSelectedLogKeys] = useState<React.Key[]>([]);
  const [deleteNotificationLogsMultiple] = useDeleteNotificationLogsMultipleMutation();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState("");

  const { data, isLoading, refetch } = useGetAnnouncementsListQuery("");
  const announcements = data?.data?.announcements || [];

  const { data: logsData, isLoading: logsLoading } = useGetNotificationLogListQuery("");
  const notificationLogs = logsData?.data?.logs || [];

  const { data: agentList } = useGetAgentListDataQuery("");

  const filteredData = activeTab === "announcements" 
    ? announcements?.filter((record: any) => {
        const searchTerm = searchText?.toLowerCase();
        const inRecord = Object.values(record).some((value) =>
          String(value).toLowerCase().includes(searchTerm)
        );
        return inRecord;
      })
    : notificationLogs?.filter((record: any) => {
        const searchTerm = searchText?.toLowerCase();
        const inRecord = Object.values(record).some((value) =>
          String(value).toLowerCase().includes(searchTerm)
        );
        return inRecord;
      });

  const agentOptions = agentList?.data?.userData
    ?.filter((agent: any) =>
      (agent?.brokerageId === 24 || agent?.brokerageId === "24") &&
      agent?.status === "approved"
    )
    .map((agent: any) => ({
      value: String(agent.userId),
      userId: String(agent.userId),
      branchId: agent.branchId ? String(agent.branchId) : "",
      branchName: agent.branch?.name || agent.branchName,
      email: agent.email,
      firstName: agent.firstName,
      lastName: agent.lastName,
      phoneNumber: agent.phoneNumber,
      label: `${agent.firstName} ${agent.lastName}`,
    })) || [];

  const [createAnnouncement] = useCreateAnnouncementMutation();
  const [updateAnnouncement] = useUpdateAnnouncementMutation();
  const [sendAnnouncementNotifications] = useSendAnnouncementNotificationsMutation();
  const [deleteAnnouncement] = useDeleteAnnouncementMutation();
  const [deleteMultipleAnnouncement] = useDeleteAnnouncementMultipleMutation();
  const [isDeleteLogsModalVisible, setIsDeleteLogsModalVisible] = useState(false);

  const handleDeleteLogsMultipleClick = () => {
  if (selectedLogKeys.length > 0) {
    setIsDeleteLogsModalVisible(true);
  } else {
    toast.error("Please select logs to delete.");
  }
};

const handleDeleteLogsConfirm = async () => {
  try {
    const response = await deleteNotificationLogsMultiple(selectedLogKeys);
    
    if (response.data.status === true) {
      toast.success("Notification logs deleted successfully!");
      await refetch();
      setSelectedLogKeys([]);
    } else {
      toast.error("Failed to delete notification logs. Please try again.");
    }
  } catch (error) {
    toast.error("Failed to delete notification logs. Please try again.");
  } finally {
    setIsDeleteLogsModalVisible(false);
  }
};

const logRowSelection: TableRowSelection<any> = {
  selectedRowKeys: selectedLogKeys,
  onChange: (newSelectedRowKeys: React.Key[]) => {
    setSelectedLogKeys(newSelectedRowKeys);
  },
  selections: [
    Table.SELECTION_ALL,
    Table.SELECTION_INVERT,
    Table.SELECTION_NONE,
    {
      key: "odd",
      text: "Select Odd Row",
      onSelect: (changeableRowKeys) => {
        const newSelectedRowKeys = changeableRowKeys.filter((_, index) => index % 2 === 0);
        setSelectedLogKeys(newSelectedRowKeys);
      },
    },
    {
      key: "even",
      text: "Select Even Row",
      onSelect: (changeableRowKeys) => {
        const newSelectedRowKeys = changeableRowKeys.filter((_, index) => index % 2 !== 0);
        setSelectedLogKeys(newSelectedRowKeys);
      },
    },
  ],
};


  const handleCreate = () => {
    setSelectedAnnouncement(null);
    setIsModalOpen(true);
  };

  const handleCreateInstantNotification = () => {
    setSelectedAnnouncement(null);
    setIsNotificationModalOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (uuid: string) => {
    setAnnouncementToDelete(uuid);
    setIsDeleteModalVisible(true);
  };
  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (announcementToDelete) {
      try {
        toast.success("Announcement deleted successfully!");
        await deleteAnnouncement(announcementToDelete);

        setIsDeleteModalVisible(false);
        await refetch();
      } catch (error) {
        setIsDeleteModalVisible(false);
      }
    }
  };
  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteMultipleAnnouncement(selectedRowKeys);


        if (response.data.status == true) {
          toast.success("Announcement deleted successfully!");
          await refetch();
          setSelectedRowKeys([]);
          setIsDeleteModalMultipleVisible(false);
        } else {
          toast.error("Failed to delete announcement. Please try again.");
          setIsDeleteModalMultipleVisible(false);
        }
      } catch (error) {
        setIsDeleteModalMultipleVisible(false);
      }
    } else {
      toast.error("Please Select Items.");
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalVisible(false);
    setIsDeleteModalMultipleVisible(false);
    setAnnouncementToDelete(null);
  };

  const handleModalClose = async (data?: Announcement) => {
    setIsModalOpen(false);
    if (data) {
      try {
        if (selectedAnnouncement) {
          await updateAnnouncement({ data, uuid: selectedAnnouncement.uuid! });
          toast.success("Announcement updated successfully!");
        } else {
          await createAnnouncement(data);
          toast.success("Announcement created successfully!");
        }
        refetch();
      } catch (error) {
        console.error("Error saving announcement:", error);
        toast.error("Failed to save announcement. Please try again.");
      }
    }
  };

  const handleNotificationModalClose = async (data?: any) => {
    setIsNotificationModalOpen(false);
    if (data) {
      try {
        const notificationData = {
          title: data.title || "Instant Notification",
          description: data.description || "",
          sendEmail: data.sendEmail,
          sendSms: data.sendSms,
          emailBody: data.emailBody,
          smsBody: data.smsBody,
          selectedAgents: data.selectedAgents,
          targetType: data.targetType || "all",
          selectedBranches: data.selectedBranches || [],
          recipientScope: data.recipientScope || "all_users",
          customEmails: data.customEmails || [],
          customPhones: data.customPhones || [],
          status: "publish" as const,
          date: new Date().toISOString(),
        };
        
        
        await sendAnnouncementNotifications({ 
          data: notificationData,
        });
        
        toast.success("Instant notifications sent successfully!");
      } catch (error) {
        console.error("Error sending instant notifications:", error);
        toast.error("Failed to send instant notifications. Please try again.");
      }
    }
  };

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection: TableRowSelection<any> = {
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
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(
    new Set()
  );
  const columns: TableColumnsType<Announcement> = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 400,
      render: (text, record) => (
        <span
          onClick={() => handleEdit(record)}
          className="hover:text-blue-600 cursor-pointer hover:underline"
        >
          {text || "N/A"}
        </span>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (description, record) => {
        const safeDescription = description || "";
        const isExpanded = expandedDescriptions.has(record.uuid!);
        const maxLength = 50;

        const toggleExpand = (uuid: string) => {
          const newExpanded = new Set(expandedDescriptions);
          if (isExpanded) {
            newExpanded.delete(uuid);
          } else {
            newExpanded.add(uuid);
          }
          setExpandedDescriptions(newExpanded);
        };

        if (safeDescription.length <= maxLength) {
          return <div dangerouslySetInnerHTML={{ __html: safeDescription }} />;
        }

        const displayText = isExpanded
          ? safeDescription
          : safeDescription.substring(0, maxLength) + "...";

        return (
          <div className="max-w-[400px] ">
            <div
              dangerouslySetInnerHTML={{ __html: displayText }}
              className="!whitespace-normal !break-words"
            />
            <button
              onClick={() => toggleExpand(record.uuid!)}
              className="text-blue-500 hover:text-blue-700 text-sm mt-1"
            >
              {isExpanded ? "Show Less" : "Show More"}
            </button>
          </div>
        );
      },
    },
    
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (status === "publish" ? "Published" : "Unpublished"),
    },
    {
      title: "Schedule Date",
      dataIndex: "date",
      key: "date",
      width: 150,
      render: (date) => {
        if (!date) {
          return "No date";
        }
        const dateF = moment.utc(date).format("DD MMMM YYYY")
        return dateF;
      },
    },
    {
      title: "Actions",
      key: "actions",
      dataIndex: "uuid",
      width: 100,
      render: (uuid, record) => (
        <Dropdown
          menu={{
            items: [
              hasPermissionForSlug("edit-announcements") && {
                key: "edit",
                label: (
                  <button
                    onClick={() => handleEdit(record)}
                    className="flex items-center w-full gap-2"
                  >
                    <FaRegEdit />
                    Edit
                  </button>
                ),
              },
              hasPermissionForSlug("delete-announcements") && {
                key: "delete",
                label: (
                  <button
                    onClick={() => handleDeleteClick(uuid!)}
                    className="flex items-center w-full gap-2"
                  >
                    <MdDelete /> Delete
                  </button>
                ),
              },
            ].filter(Boolean),
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

  const tableSourceData = filteredData?.map((item: any, index: number) => {
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
              <button
                key={tab.id}
                type="button"
                onClick={() => { setActiveTab(tab.id); setSearchText(""); }}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                  activeTab === tab.id ? "bg-[#0f766e] text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {tab.name}
              </button>
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
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={handleCreateInstantNotification} className="primary-btn">Create Announcement</button>
            {hasPermissionForSlug("create-announcements") && (
              <button onClick={handleCreate} className="primary-btn">Create Schedule</button>
            )}
            {hasPermissionForSlug("delete-announcements") && activeTab === "announcements" && (
              <button onClick={handleDeleteMultipleClick} className="cancel-btn">
                Delete Selected ({selectedRowKeys.length})
              </button>
            )}
            {activeTab === "logs" && (
              <button onClick={handleDeleteLogsMultipleClick} className="cancel-btn">
                Delete Selected Logs ({selectedLogKeys.length})
              </button>
            )}
          </div>
        </div>

      <div>
        {activeTab === "announcements" ? (
          <>
            {isLoading ? (
              <TableLoader />
            ) : (
              <Table
                rowSelection={rowSelection}
                rowKey="uuid"
                columns={columns}
                dataSource={tableSourceData}
                scroll={{ x: "max-content" }}
                pagination={{ pageSize: 20 }}
              />
            )}
          </>
        ) : (
          <NotificationLogs 
            filteredLogs={filteredData} 
            isLoading={logsLoading} 
            rowSelection={logRowSelection}
          />
        )}
      </div>

      {isModalOpen && (
        <AnnouncementModal
          announcement={selectedAnnouncement}
          onClose={handleModalClose}
          agentOptions={agentOptions}
        />
      )}

      {isNotificationModalOpen && (
        <NotificationModal
          announcement={null}
          onClose={handleNotificationModalClose}
          agentOptions={agentOptions}
          isInstantNotification={true}
        />
      )}

      <Modal
        title="Confirm Deletion"
        open={isDeleteModalVisible}
        onCancel={handleDeleteCancel}
        footer={[
          <button
            className="cancel-btn"
            key="cancel"
            onClick={handleDeleteCancel}
          >
            Cancel
          </button>,
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={handleDeleteConfirm}
          >
            Confirm
          </Button>,
        ]}
      >
        Are you sure you want to delete this announcement?
      </Modal>

      <Modal
        title="Confirm Deletion"
        open={isDeleteMultipleModalVisible}
        onCancel={handleDeleteCancel}
        footer={[
          <Button key="cancel" onClick={handleDeleteCancel}>
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
        Are you sure you want to delete selected announcements?
      </Modal>
<Modal
  title="Confirm Deletion"
  open={isDeleteLogsModalVisible}
  onCancel={() => setIsDeleteLogsModalVisible(false)}
  footer={[
    <button
      className="cancel-btn"
      key="cancel"
      onClick={() => setIsDeleteLogsModalVisible(false)}
    >
      Cancel
    </button>,
    <Button
      key="confirm"
      type="primary"
      danger
      onClick={handleDeleteLogsConfirm}
    >
      Confirm
    </Button>,
  ]}
>
  Are you sure you want to delete {selectedLogKeys.length} selected announcement log(s)?
</Modal>
    </div>
    </div>
  );
};

export default AnnouncementManagement;