/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import moment from 'moment-timezone';
import { Condition, CreateUpdateConditionRequest } from '../types/condition';
import ButtonLoader from './loader/buttonLoader';
import { useGetConditionTypeQuery } from '../redux/api/superadmin/conditionDataSlice';

interface ConditionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUpdateConditionRequest) => void;
  conditionData: Condition | null;
  isLoading: boolean;
  tradeSheetId: number;
}

const ConditionPopup: React.FC<ConditionPopupProps> = ({
  isOpen,
  onClose,
  onSubmit,
  conditionData,
  isLoading,
  tradeSheetId,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<CreateUpdateConditionRequest & { customCondition?: string }>({
    defaultValues: {
      conditionType: '',
      dueDate: '',
      tradeSheetId,
    },
  });

  const { data, isLoading: isConditionTypeLoading } = useGetConditionTypeQuery('');
  const conditionTypes = data?.data?.ConditionType || [];

  useEffect(() => {
    if (!isOpen || isConditionTypeLoading) return;

    if (conditionData) {
      const formatDateForInput = (dateString: string | null | undefined): string => {
        if (!dateString) return '';
        const parsed = moment.utc(dateString);
        if (!parsed.isValid()) return '';
        return parsed.format('YYYY-MM-DD');
      };

      const formattedDueDate = formatDateForInput(conditionData.dueDate);

      const isPredefined = conditionTypes.some(
        (ct: { condition: string }) => ct.condition === conditionData.conditionType
      );

      const resetData: any = {
        conditionType: isPredefined ? conditionData.conditionType : 'Others',
        customCondition: isPredefined ? '' : conditionData.conditionType,
        dueDate: formattedDueDate,
        tradeSheetId,
        completeStatus: conditionData.completeStatus || false,
        ...(conditionData.id && { id: conditionData.id }),
      };

      reset(resetData);
    } else {
      reset({
        conditionType: '',
        dueDate: '',
        tradeSheetId,
        completeStatus: false,
      });
    }
  }, [conditionData, reset, tradeSheetId, isOpen, conditionTypes, isConditionTypeLoading]);

  const handleFormSubmit = (
    data: CreateUpdateConditionRequest & { customCondition?: string }
  ) => {
    const submitData = {
      ...data,
      conditionType:
        data.conditionType === 'Others'
          ? data.customCondition || ''
          : data.conditionType,
    };
    delete (submitData as any).customCondition;
    onSubmit(submitData as CreateUpdateConditionRequest);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl font-bold"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-lg font-semibold mb-4">
          {conditionData ? 'Update Condition' : 'Add Condition'}
        </h2>
        <form>
          <div>
            <label className="block text-sm font-medium mb-1">
              Condition Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register('conditionType', {
                required: 'Condition type is required',
              })}
              className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isConditionTypeLoading}
            >
              <option value="">Select condition type</option>
              {conditionTypes.map((ct: { id: number; condition: string }) => (
                <option key={ct.id} value={ct.condition}>
                  {ct.condition}
                </option>
              ))}
              <option value="Others">Others</option>
            </select>
            {watch('conditionType') === 'Others' && (
              <input
                type="text"
                className="w-full p-2 border rounded mt-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter custom condition"
                {...register('customCondition', {
                  required: 'Custom condition is required',
                })}
              />
            )}
            {errors.conditionType && (
              <p className="text-red-500 text-sm mt-1">
                {errors.conditionType.message}
              </p>
            )}
            {watch('conditionType') === 'Others' && errors.customCondition && (
              <p className="text-red-500 text-sm mt-1">
                {errors.customCondition.message}
              </p>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              {...register('dueDate', { required: 'Due date is required' })}
              type="date"
              className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.dueDate && (
              <p className="text-red-500 text-sm mt-1">
                {errors.dueDate.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition duration-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit(handleFormSubmit)}
              disabled={isLoading}
              className="primary-btn px-4 py-2 text-white rounded disabled:opacity-50 transition duration-200 flex items-center justify-center min-w-[80px] bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? <ButtonLoader /> : conditionData ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConditionPopup;
