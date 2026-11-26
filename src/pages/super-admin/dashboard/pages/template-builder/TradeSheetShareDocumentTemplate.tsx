/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React, { useState } from 'react';

import type {
  TableColumnsType,
  TableProps,
} from 'antd';
import {
  Button,
  Dropdown,
  Modal,
  Space,
  Table,
} from 'antd';
import toast from 'react-hot-toast';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { FaRegEdit, FaSearch, FaTimes } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';

import AnnouncementModal
  from '../../../../../components/dashboard/modals/AnnouncementModal';
import TradeSheetShareDocumentTemplateModal
  from '../../../../../components/dashboard/modals/TradeSheetShareDocumentTemplateModal';
import TableLoader from '../../../../../components/loader/TableLoader';
import {
  useDeleteAnnouncementMultipleMutation,
  useDeleteAnnouncementMutation,
  useGetAnnouncementsListQuery,
} from '../../../../../redux/api/superadmin/announcementSlice';
import { format, formatDate, isWithinInterval, parseISO } from "date-fns";
import { usePermissions } from '../../../../../utils/permissionUtils';
import { 
  useCreateTemplateBuilderMutation,
  useDeleteMultipleTemplateBuildersMutation,
  useDeleteTemplateBuilderMutation,
  useGetTemplateBuilderListQuery,
  useUpdateTemplateBuilderMutation
 } from '../../../../../redux/api/superadmin/templateBuilderSlice';

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
}

const TradeSheetShareDocumentTemplate: React.FC = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleteMultipleModalVisible, setIsDeleteModalMultipleVisible] =
    useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<Announcement | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<
    string | null
  >(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Fetch templates
  const { data, isLoading, refetch } = useGetTemplateBuilderListQuery({ type: "email", area: "tradesheet_share_document" });

  const templates = data?.data?.templateBuilders || [];

  const [searchText, setSearchText] = useState("");

  const filteredData = templates?.filter((record: any) => {
    const searchTerm = searchText?.toLowerCase();
    const inRecord = Object.values(record).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
    return inRecord;
  });

  // Mutations
  const [createTemplate] = useCreateTemplateBuilderMutation();
  const [updateTemplate] = useUpdateTemplateBuilderMutation();
  const [deleteTemplateBuilder] = useDeleteTemplateBuilderMutation();
  const [deleteMultipleTemplateBuilder] = useDeleteMultipleTemplateBuildersMutation();

  // Handle create
  const handleCreate = () => {
    setSelectedTemplate(null);
    setIsModalOpen(true);
  };

  // Handle edit
  const handleEdit = (template: Announcement) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  // Handle delete click, show confirmation modal
  const handleDeleteClick = (uuid: string) => {
    setAnnouncementToDelete(uuid);
    setIsDeleteModalVisible(true); // Show delete confirmation modal
  };
  const handleDeleteMultipleClick = () => {
    setIsDeleteModalMultipleVisible(true); // Show delete confirmation modal
  };

  // Confirm deletion
  const handleDeleteConfirm = async () => {
    if (announcementToDelete) {
      try {
        toast.success("Template deleted successfully!");
        await deleteTemplateBuilder(announcementToDelete);

        setIsDeleteModalVisible(false);
        // Ensure the refetch waits for the data to be refreshed
        await refetch();
      } catch (error) {
        console.log(error);
        setIsDeleteModalVisible(false);
        // toast.error("Failed to delete template. Please try again.");
      }
    }
  };
  const handleDeleteConfirmMultiple = async () => {
    if (selectedRowKeys.length > 0) {
      try {
        const response = await deleteMultipleTemplateBuilder(selectedRowKeys);

        // Ensure the refetch waits for the data to be refreshed

        if (response.data.status == true) {
          toast.success("Template deleted successfully!");
          await refetch();
          setSelectedRowKeys([]);
          setIsDeleteModalMultipleVisible(false);
        } else {
          toast.error("Failed to delete Template. Please try again.");
          setIsDeleteModalMultipleVisible(false);
        }
      } catch (error) {
        setIsDeleteModalMultipleVisible(false);
        console.log(error);
        // toast.error("Failed to delete template. Please try again.");
      }
    } else {
      toast.error("Please Select Items.");
    }
  };

  // Cancel deletion
  const handleDeleteCancel = () => {
    setIsDeleteModalVisible(false);
    setIsDeleteModalMultipleVisible(false);
    setAnnouncementToDelete(null); // Clear selected template for deletion
  };

  // Handle modal close (create/update template)
  const handleModalClose = async (data?: Announcement) => {
    setIsModalOpen(false);
    
    if (!data) return;
  
    try {
      let response;
  
      if (selectedTemplate) {
        response = await updateTemplate({ data, uuid: selectedTemplate.uuid! }).unwrap();
      } else {
        response = await createTemplate(data).unwrap();
      }
  
      if (response.status === true) {
        toast.success(`${response?.message}`);
      } else {
        toast.error(`${response?.message}`);
      }
      
      refetch();
    } catch (error: any) {
      console.error("Error in handleModalClose:", error);
      toast.error(error?.data?.message);
    }
  };
  

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    console.log("selectedRowKeys changed: ", newSelectedRowKeys);
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
      title: "#",
      key: "serial",
      width: 80,
      dataIndex: "serial",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 600,
      render: (name,record) => (
        <span onClick={() => handleEdit(record)}  className="hover:text-blue-600 cursor-pointer hover:underline">{name || "N/A"}</span>
      ),
    },
    {
      title: "Content",
      dataIndex: "content",
      key: "content",
      render: (description, record) => {
        const safeDescription = description || "";
        const isExpanded = expandedDescriptions.has(record.uuid!);
        const maxLength = 50; // Adjust this value to change the initial text length

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
          <div className="max-w-[600px] ">
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
      render: (status) => (status === "active" ? "Active" : "Inactive"),
    },
    {
      title: "Date",
     dataIndex: "createdAt",
           key: "createdAt",
           render: (createdAt) => {
             if (!createdAt) return "No date";
             return format(parseISO(createdAt), "dd MMMM yyyy, hh:mm a");
      },
    },
    {
      title: "Actions",
      key: "actions",
      dataIndex: "uuid",
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

  // serial number in the table
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
          <h1 className="!mb-0 text-sm text-gray-800 font-semibold whitespace-nowrap flex-shrink-0">Share TradeSheet Document Email Template</h1>
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
            {hasPermissionForSlug("create-announcements") && (
              <button onClick={handleCreate} className="primary-btn">Add New</button>
            )}
            {hasPermissionForSlug("delete-announcements") && (
              <button onClick={handleDeleteMultipleClick} className="cancel-btn">Delete Selected</button>
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
              columns={columns}
              dataSource={tableSourceData}
              scroll={{ x: "max-content" }}
            />
          )}
        </div>

      {isModalOpen && (
        <TradeSheetShareDocumentTemplateModal
          template={selectedTemplate}
          onClose={handleModalClose}
        />
      )}

      {/* Delete Confirmation Modal */}
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
        Are you sure you want to delete this template?
      </Modal>

      {/* Delete Multiple Confirmation Modal */}
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
        Are you sure you want to delete selected templates?
      </Modal>
      </div>
    </div>
  );
};

export default TradeSheetShareDocumentTemplate;
