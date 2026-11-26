// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useState } from 'react';
import { Button, Dropdown, Modal, Space, Table, TableColumnsType, Tag } from 'antd';
import { Link } from 'react-router-dom';
import {
    useGetArtWorksQuery,
    useCreateArtWorkMutation,
    useUpdateArtWorkMutation,
    useDeleteArtWorkMutation
} from '../../../../../redux/api/superadmin/artwork/artWorkSlice';
import TableLoader from '../../../../../components/loader/TableLoader';
import { useForm } from 'react-hook-form';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { FaEdit, FaSearch, FaTimes, FaTrash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { usePermissions } from '../../../../../utils/permissionUtils';

type ArtWork = {
    id: string;
    title: string;
    status: string;
};

const ArtWorks: React.FC = () => {

    const { register, handleSubmit, formState: { errors }, reset, getValues } = useForm<ArtWork>();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [editingArtWork, setEditingArtWork] = useState<ArtWork | null>(null);
    const [searchText, setSearchText] = useState("");

    const authUser = useSelector((state: RootState) => state.user.user as User);
    const { hasPermissionForSlug } = usePermissions();
  
    const userType = authUser?.userType;

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
      ...(userType === "superAdmin" &&
      hasPermissionForSlug("artwork-items-view")
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

    const { data: artWorks, isLoading } = useGetArtWorksQuery('');
    const [createArtWork] = useCreateArtWorkMutation();
    const [updateArtWork] = useUpdateArtWorkMutation();
    const [deleteArtWork] = useDeleteArtWorkMutation();

   
      const filteredData = artWorks?.data?.filter((record:any) => {
        const searchTerm = searchText?.toLowerCase() || "";
        const extractValues = (obj: any): string[] => {
          if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") {
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
      

    const tableSourceData = filteredData?.map((item: ArtWork, index: number) => {
        return {
            ...item,
            serial: index + 1,
        };
    });
    

    const handleCreate = () => {
        setIsModalVisible(true);
        setEditingArtWork(null);
    };

    const handleCreateUpdateSubmit = async () => {
        const data = getValues();
        try {
            if (editingArtWork) {
                await updateArtWork({ id: editingArtWork?.id, artwork: data }).unwrap();
                toast.success('ArtWork updated successfully');
            } else {
                await createArtWork(data).unwrap();
                toast.success('ArtWork created successfully');
            }
            resetForm();
        } catch (error) {
            console.error('Failed to create ArtWork:', error);
        }
    };

    const handleUpdate = (record: ArtWork) => {
        setIsModalVisible(true);
        reset(record);
        setEditingArtWork(record);
    };

    const handleDelete = (record: ArtWork) => {
        setIsDeleteModalVisible(true);
        setEditingArtWork(record);
    };

    const confirmDelete = async () => {
        try {
            await deleteArtWork(editingArtWork?.id).unwrap();
            resetForm();
            setIsDeleteModalVisible(false);
        } catch (error) {
            console.error('Failed to delete ArtWork:', error);
        }
    };

    const resetForm = () => {
        setIsModalVisible(false);
        setEditingArtWork(null);
        reset();
    };

    const columns: TableColumnsType<ArtWork> = [
        { title: 'Title', dataIndex: 'title', key: 'title',
            render: (text, record) => (
                <span
                  onClick={() => {
                    if (hasPermissionForSlug("artwork-items-edit")) {
                        handleUpdate(record);
                    }
                  }}
                className={hasPermissionForSlug("artwork-items-edit") ? "hover:text-blue-600 cursor-pointer hover:underline" : ""}
                >
                  {text || "N/A"}
                </span>
              )              
         },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => status === 'active' ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>
        },
        {
            title: "Action",
            key: "actions",
            dataIndex: "id",
            render: (_, record) => (
                <Dropdown
                    menu={{
                        items: [
                            hasPermissionForSlug("artwork-items-edit") &&{
                                key: "edit",
                                label: (
                                    <div className="flex items-center gap-2 p-2" onClick={() => handleUpdate(record)}>
                                        <FaEdit />
                                        Edit
                                    </div>
                                ),
                            },
                            hasPermissionForSlug("artwork-items-delete") &&{
                                key: "delete",
                                label: (
                                    <div className="flex items-center gap-2 p-2" onClick={() => handleDelete(record)}>
                                        <FaTrash />
                                        Delete
                                    </div>
                                ),
                            },
                        ],
                    }}
                    trigger={['click']}
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
                    {hasPermissionForSlug("artwork-items-view") && (
                        <button className="primary-btn flex-shrink-0" onClick={handleCreate}>Add Art Work</button>
                    )}
                </div>
                <div>
                    {isLoading ? (
                        <TableLoader />
                    ) : (
                        <Table
                            rowKey="id"
                            scroll={{ x: "max-content" }}
                            columns={columns}
                            dataSource={tableSourceData}
                            pagination={{ pageSize: 20 }}
                        />
                    )}

                    <Modal
                        title={editingArtWork ? "Edit Art Work" : "Add Art Work"}
                        open={isModalVisible}
                        onCancel={resetForm}
                        footer={null}
                    >
                        <form onSubmit={handleSubmit(handleCreateUpdateSubmit)}>
                            <div>
                                <label htmlFor="title">Title</label>
                                <input type="text" id="title" {...register('title', { required: "Title is required" })} />
                                {errors.title && <span className="text-red-500">{errors.title.message}</span>}
                            </div>
                            <div className="my-4">
                                <label htmlFor="status">Status</label>
                                <select id="status" {...register('status', { required: "Status is required" })}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                {errors.status && <span className="text-red-500">{errors.status.message}</span>}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" className="cancel-btn" onClick={resetForm}>Cancel</button>
                                <button className="primary-btn" type="submit">Submit</button>
                            </div>
                        </form>
                    </Modal>

                    <Modal
                        title="Delete Support Request"
                        open={isDeleteModalVisible}
                        onCancel={resetForm}
                        footer={[
                        <Button key="cancel" onClick={resetForm}>
                            Cancel
                        </Button>,
                        <Button
                            key="confirm"
                            type="primary"
                            danger
                            onClick={confirmDelete}
                        >
                            Confirm
                        </Button>,
                        ]}
                    >
                        <p>Are you sure you want to delete this Art Work?</p>
                    </Modal>

                </div>
            </div>
        </div>
    );
};

export default ArtWorks; 