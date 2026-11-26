import React, { useState } from 'react';
import { Modal, Button, Table, Tag, Form, Input, Select, Popconfirm, message } from 'antd';
import { useAppSelector } from '../../../redux/hooks';
import { useGetAgentLeadRemindersQuery, useCreateAgentLeadReminderMutation, useUpdateAgentLeadReminderMutation, useDeleteAgentLeadReminderMutation } from '../../../redux/api/agent/leadReminderSlice';
import { useGetLeadRemindersQuery, useCreateLeadReminderMutation, useUpdateLeadReminderMutation, useDeleteLeadReminderMutation } from '../../../redux/api/superadmin/leadReminderSlice';
import dayjs from 'dayjs';

const { Option } = Select;

type Reminder = {
  id: number | string;
  leadId: number | string;
  agentId: number | string;
  type: 'sms' | 'email';
  message: string;
  scheduledTime: string;
  sentStatus: 'pending' | 'sent' | 'failed';
  createdAt?: string;
  updatedAt?: string;
};

type LeadReminderProps = {
  leadId: number | string;
  agentId: number | string;
};

const statusColors: Record<string, string> = {
  pending: 'gold',
  sent: 'green',
  failed: 'red',
};

const typeColors: Record<string, string> = {
  sms: 'blue',
  email: 'purple',
};

const LeadReminder: React.FC<LeadReminderProps> = ({ leadId, agentId }) => {
  const { user } = useAppSelector((state) => state.user);
  const isAdmin = user.userType === 'superAdmin' || user.userType === 'admin';

  const agentRemindersQuery = useGetAgentLeadRemindersQuery({ leadId: String(leadId) });
  const adminRemindersQuery = useGetLeadRemindersQuery({ agentId, leadId });
  const [createAgentReminder] = useCreateAgentLeadReminderMutation();
  const [createAdminReminder] = useCreateLeadReminderMutation();
  const [updateAgentReminder] = useUpdateAgentLeadReminderMutation();
  const [updateAdminReminder] = useUpdateLeadReminderMutation();
  const [deleteAgentReminder] = useDeleteAgentLeadReminderMutation();
  const [deleteAdminReminder] = useDeleteLeadReminderMutation();

  const remindersQuery = isAdmin ? adminRemindersQuery : agentRemindersQuery;
  const createReminder = isAdmin ? createAdminReminder : createAgentReminder;
  const updateReminder = isAdmin ? updateAdminReminder : updateAgentReminder;
  const deleteReminder = isAdmin ? deleteAdminReminder : deleteAgentReminder;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [form] = Form.useForm();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };
  const openEdit = (record: Reminder) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      scheduledTime: dayjs(record.scheduledTime).format('YYYY-MM-DDTHH:mm'),
    });
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const handleDelete = async (id: number | string) => {
    try {
      await deleteReminder(id).unwrap();
      message.success('Reminder deleted');
    } catch {
      message.error('Delete failed');
    }
  };

  const handleFinish = async (values: { type: 'sms' | 'email'; message: string; scheduledTime: string }) => {
    const { scheduledTime, ...payload } = values;
    const isoScheduledTime = dayjs(scheduledTime).toISOString();
    const finalPayload = {
      ...payload,
      scheduledTime: isoScheduledTime,
      leadId,
      agentId,
    };
    try {
      if (editing) {
        await updateReminder({ id: editing.id, ...finalPayload }).unwrap();
        message.success('Reminder updated');
      } else {
        await createReminder(finalPayload).unwrap();
        message.success('Reminder created');
      }
      closeModal();
    } catch {
      message.error('Save failed');
    }
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      render: (type: string) => <Tag color={typeColors[type]}>{type.toUpperCase()}</Tag>,
    },
    {
      title: 'Message',
      dataIndex: 'message',
      ellipsis: true,
    },
    {
      title: 'Scheduled Time',
      dataIndex: 'scheduledTime',
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Status',
      dataIndex: 'sentStatus',
      render: (status: string) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: 'Actions',
      render: (_: unknown, record: Reminder) => (
        <>
          <Button size="small" onClick={() => openEdit(record)} style={{ marginRight: 8 }}>
            Edit
          </Button>
          <Popconfirm title="Delete this reminder?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div className='p-6'>
      <div className="flex justify-between mb-4">
        <h2 className="text-lg font-semibold">Reminders</h2>
        <Button type="primary" onClick={openCreate}>
          + Add Reminder
        </Button>
      </div>
      <Table
        dataSource={remindersQuery.data?.data || []}
        columns={columns}
        rowKey="id"
        loading={remindersQuery.isLoading}
        pagination={false}
      />
      <Modal
        open={modalOpen}
        title={editing ? 'Edit Reminder' : 'Create Reminder'}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editing ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}> 
            <Select>
              <Option value="sms">SMS</Option>
              <Option value="email">Email</Option>
            </Select>
          </Form.Item>
          <Form.Item name="message" label="Message" rules={[{ required: true }]}> 
            <Input.TextArea rows={3} maxLength={300} />
          </Form.Item>
          <Form.Item name="scheduledTime" label="Remind At (Date & Time)" rules={[{ required: true }]}> 
            <Input type="datetime-local" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LeadReminder;