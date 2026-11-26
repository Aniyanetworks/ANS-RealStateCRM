/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
// import { Condition, CreateUpdateConditionRequest } from '../../types/condition';
/* import {
  useGetConditionalDetailsQuery,
  useCreateUpdateConditionMutation,
  useDeleteConditionMutation,
} from '../../redux/api/agent/trade-sheet/tradeSheetConditionSlice'; */
import ConditionPopup from './ConditionPopup';
import ConditionsList from './ConditionsList';
import toast from 'react-hot-toast';
import { useGetConditionalDetailsQuery,
  useCreateUpdateConditionMutation,
  useDeleteConditionMutation, } from '../redux/api/agent/trade-sheet/tradeSheetConditionSlice';
import { Condition, CreateUpdateConditionRequest } from '../types/condition';

interface ConditionalSectionProps {
  tradeSheetId: number;
  isConditional: boolean;
}

const ConditionalSection: React.FC<ConditionalSectionProps> = ({
  tradeSheetId,
  isConditional,
}) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingCondition, setEditingCondition] = useState<Condition | null>(null);

  // Fetch conditions
  const {
    data: conditionsData,
    isLoading: isLoadingConditions,
    refetch: refetchConditions,
  } = useGetConditionalDetailsQuery({ tradeSheetId }, {
    skip: !tradeSheetId || !isConditional,
  });

  // Mutations
  const [createUpdateCondition, { isLoading: isSubmitting }] = useCreateUpdateConditionMutation();
  const [deleteCondition, { isLoading: isDeleting }] = useDeleteConditionMutation();

  const conditions = conditionsData?.data?.ConditionData || [];

  useEffect(() => {
    if (isConditional && tradeSheetId) {
      refetchConditions();
    }
  }, [isConditional, tradeSheetId, refetchConditions]);

  const handleAddCondition = () => {
    setEditingCondition(null);
    setIsPopupOpen(true);
  };

  const handleEditCondition = (condition: Condition) => {
    setEditingCondition(condition);
    setIsPopupOpen(true);
  };

  const handleDeleteCondition = async (conditionId: string) => {
      try {
        await deleteCondition(conditionId).unwrap();
        toast.success('Condition deleted successfully');
        refetchConditions();
      } catch (error) {
        toast.error('Error deleting condition');
      }
  };

  const handleConditionSubmit = async (data: CreateUpdateConditionRequest) => {
    try {
      const conditionData: CreateUpdateConditionRequest = {
        ...data,
        tradeSheetId,
        completeStatus: data.completeStatus || editingCondition?.completeStatus || false,
      };

      if (editingCondition) {
        conditionData.id = editingCondition.id;
        // The popup form has no field for conditionMetDate, so it's never part of
        // `data`. Without carrying it forward here, updating anything else on an
        // existing condition (e.g. its due date) wipes the previously-set met date.
        conditionData.conditionMetDate = editingCondition.conditionMetDate;
      }

      await createUpdateCondition(conditionData).unwrap();
      toast.success(`Condition ${editingCondition ? 'updated' : 'added'} successfully`);
      setIsPopupOpen(false);
      setEditingCondition(null);
      refetchConditions();
    } catch (error: any) {
      toast.error(`Error ${editingCondition ? 'updating' : 'adding'} condition: ${error.data?.message || 'Please try again'}`);
    }
  };

  if (!isConditional) {
    return null;
  }

  return (
    <div className="mt-6 p-6 bg-white rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
        </div>
        <button
          type="button"
          onClick={handleAddCondition}
          className="primary-btn px-4 py-2  text-white rounded-lg  transition duration-200 font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Condition
        </button>
      </div>

      <ConditionsList
        conditions={conditions}
        onEditCondition={handleEditCondition}
        onDeleteCondition={handleDeleteCondition}
        isLoading={isLoadingConditions}
      />

      <ConditionPopup
        isOpen={isPopupOpen}
        onClose={() => {
          setIsPopupOpen(false);
          setEditingCondition(null);
        }}
        onSubmit={handleConditionSubmit}
        conditionData={editingCondition}
        isLoading={isSubmitting}
        tradeSheetId={tradeSheetId}
      />
    </div>
  );
};

export default ConditionalSection;