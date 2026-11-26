/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React from 'react';
import moment from 'moment-timezone';
import { Condition } from '../types/condition';
import { Table, Button, Tag, Tooltip, Switch, message, Input } from 'antd';
import { useUpdateConditionStatusMutation } from '../redux/api/agent/trade-sheet/tradeSheetConditionSlice';

interface ConditionsListProps {
  conditions: Condition[];
  onEditCondition: (condition: Condition) => void;
  onDeleteCondition: (conditionId: string) => void;
  isLoading?: boolean;
}

const ConditionsList: React.FC<ConditionsListProps> = ({
  conditions,
  onEditCondition,
  onDeleteCondition,
  isLoading = false,
}) => {
  const [updateConditionStatus, { isLoading: isUpdatingStatus }] = useUpdateConditionStatusMutation();

  // dueDate / conditionMetDate are calendar dates with no meaningful time-of-day.
  // Converting them to America/Toronto shifts a UTC-midnight date back into the
  // previous day's evening, displaying one day early. Stay in UTC so the stored
  // calendar date renders unchanged.
  const formatDate = (isoDate: string | null | undefined): string => {
    if (isoDate) {
      return moment.utc(isoDate).format('MMM DD, YYYY');
    }
    return 'Not set';
  };

  const handleDateChange = async (conditionId: string, newDate: string) => {
  try {
    await updateConditionStatus({
      id: conditionId,
      completeStatus:'yes',
      conditionMetDate: newDate ? new Date(newDate).toISOString() : null,
    }).unwrap();

    message.success('Condition met date updated');
  } catch (error) {
    console.error('Failed to update condition met date:', error);
    message.error('Failed to update condition met date');
  }
};

  const handleToggleStatus = async (conditionId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'yes' ? 'no' : 'yes';

      await updateConditionStatus({
        id: conditionId,
        completeStatus: newStatus,
        // Set today's date when marking met, otherwise the date column renders
        // an empty input with nothing to show until the user manually picks one.
        conditionMetDate: newStatus === 'yes' ? new Date().toISOString() : null,
      }).unwrap();

      message.success(`Condition status updated to ${newStatus === 'yes' ? 'met' : 'not met'}`);
    } catch (error) {
      console.error('Failed to update condition status:', error);
      message.error('Failed to update condition status');
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 border rounded-lg bg-gray-200 h-20"></div>
        ))}
      </div>
    );
  }

  if (conditions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-lg mb-2">No conditions added yet</div>
        <p className="text-gray-400 text-sm">Click "Add Condition" to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table
        dataSource={conditions}
        rowKey="id"
        pagination={false}
        size="small"
        columns={[
          {
            title: 'Condition',
            dataIndex: 'conditionType',
            key: 'conditionType',
          },
          {
            title: 'Expiry Date',
            dataIndex: 'dueDate',
            key: 'dueDate',
            render: (dueDate: string | null | undefined) => formatDate(dueDate),
          },
          /* {
            title: 'Condition Met Date',
            dataIndex: 'conditionMetDate',
            key: 'conditionMetDate',
            render: (conditionMetDate: string | null | undefined, record: Condition) =>
              record.completeStatus === 'yes' ? formatDate(conditionMetDate) : 'Not met',
          }, */
          {
  title: 'Condition Met Date',
  dataIndex: 'conditionMetDate',
  key: 'conditionMetDate',
  render: (conditionMetDate: string | null | undefined, record: Condition) =>
    record.completeStatus === 'yes' ? (
      <Input
        type="date"
        value={conditionMetDate ? moment.utc(conditionMetDate).format('YYYY-MM-DD') : ''}
        onChange={(e) => {
          const value = e.target.value;
          // A native date input fires onChange per segment (day/month/year) while
          // typing, with an incomplete/empty value in between. Only save once the
          // value is a complete date, so a mid-edit "" doesn't wipe the saved date.
          if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            handleDateChange(record.id, value);
          }
        }}
        size="small"
        style={{ width: '120px' }}
      />
    ) : (
      'Not met'
    ),
},
          {
            title: 'Condition Met',
            dataIndex: "completeStatus",
            key: "completeStatus",
            render: (completeStatus: string, record: Condition) => (
              <Tooltip 
                title={completeStatus === 'yes' 
                  ? "Click to mark as condition not met" 
                  : "Click to mark as condition met"
                }
              >
                <Switch
                  checked={completeStatus === 'yes'}
                  onChange={() => handleToggleStatus(record.id, completeStatus)}
                  loading={isUpdatingStatus}
                  size="small"
                />
              </Tooltip>
            ),
          },
          {
  title: 'Actions',
  key: 'actions',
  fixed: "right",
  align: "center",
  width: 200, // Add fixed width for better consistency
  render: (_: any, condition: Condition) => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', // Proper center alignment
      alignItems: 'center',
      gap: 8 
    }}>
      <Button
        size="small"
        type="primary"
        onClick={() => onEditCondition(condition)}
      >
        Edit
      </Button>
      <Button
        size="small"
        danger
        onClick={() => onDeleteCondition(condition.id)}
      >
        Delete
      </Button>
    </div>
  ),
}
        ]}
      />
    </div>
  );
};

export default ConditionsList;