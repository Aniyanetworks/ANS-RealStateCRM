import { useEffect, useState } from 'react';
import { Modal, Button } from 'antd';
import {
  useCreateOptionalPlanMutation,
  useUpdateOptionalPlanMutation,
  useDeleteSinglePlanMutation,
  useGetOptionalPlanListDataQuery,
  useGetPlanListDataQuery,
  useDeleteSingleOptionalPlanMutation
} from '../../../../../redux/api/superadmin/plan-management/planManagementSlice';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import TableLoader from '../../../../../components/loader/TableLoader';
import { FaEdit, FaPlusCircle, FaTrash } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { SerializedError } from '@reduxjs/toolkit';
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { usePermissions } from '../../../../../utils/permissionUtils';

interface PlanSubItem {
  name: string;
  value: number;
}

interface PlanItem {
  id: string;
  name: string;
  value: number;
  isOptional: boolean;
  commissionOwner: number;
  commissionAgent: number;
  itemType: string;
  planSubItems: PlanSubItem[];
}

interface Plan {
  id: string;
  uuid: string;
  name: string;
  type: string;
  planItems: PlanItem[];
}

interface OptionalPlan {
  id: string;
  uuid: string;
  name: string;
  slug: string;
  optionalPlanName: string;
  amount: number;
}

const PlanManagement = () => {
  const { hasPermissionForSlug } = usePermissions();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [optionalPlans, setOptionalPlans] = useState<OptionalPlan[]>([]);
  const [activeTab, setActiveTab] = useState<'plan' | 'optionalPlan'>('plan');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [optionalPlanToDelete, setOptionalPlanToDelete] = useState<string | null>(null);
  const [isOptionalPlanModalVisible, setIsOptionalPlanModalVisible] = useState(false);
  const [selectedOptionalPlan, setSelectedOptionalPlan] = useState<OptionalPlan | null>(null);

  const { data, isLoading } = useGetPlanListDataQuery('');
  const { data: optionalPlanData } = useGetOptionalPlanListDataQuery('');
  const [deletePlan] = useDeleteSinglePlanMutation();
  const [createOptionalPlan] = useCreateOptionalPlanMutation();
  const [updateOptionalPlan] = useUpdateOptionalPlanMutation();
  const [deleteSingleOptionalPlan] = useDeleteSingleOptionalPlanMutation();
  const navigate = useNavigate();

  const { register, formState: { errors }, handleSubmit, reset, getValues } = useForm<OptionalPlan>();

  useEffect(() => {
    if (data?.data?.plans) {
      setPlans([...data.data.plans].sort((a, b) => a.name.localeCompare(b.name)));
    }
    if (optionalPlanData?.data?.optionalPlans) {
      setOptionalPlans([...optionalPlanData.data.optionalPlans].sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, [data, optionalPlanData]);

  if (isLoading) {
    return <div><TableLoader /></div>;
  }

  const switchTab = (tab: 'plan' | 'optionalPlan') => {
    setActiveTab(tab);
  };

  const createOptionalPlanModal = () => {
    setSelectedOptionalPlan(null);
    setIsOptionalPlanModalVisible(true);
  };

  const editOptionalPlanModal = (plan: OptionalPlan) => {
    setSelectedOptionalPlan(plan);
    reset({ optionalPlanName: plan.name, amount: plan.amount });
    setIsOptionalPlanModalVisible(true);
  };

  const handleOptionalPlanSubmit = async () => {
    try {
      const data = getValues();
      let response: { data: any; error?: undefined; } | { data?: undefined; error: FetchBaseQueryError | SerializedError; };
      if (selectedOptionalPlan) {
        response = await updateOptionalPlan({ data, uuid: selectedOptionalPlan.uuid });
        if (response) {
          toast.success(`Addon Plans updated successfully!`);
          setOptionalPlans(prevPlans =>
            prevPlans.map(plan => (plan.id === selectedOptionalPlan.id ? { ...plan, ...data } : plan))
          );
        }
      } else {
        response = await createOptionalPlan(data);
        if (response) {
          toast.success(`Addon Plans created successfully!`);
          setOptionalPlans(prevPlans => [...prevPlans, response.data.optionalPlan]);
        }
      }
    } catch (error) {
      console.error('Error handling optional plan:', error);
      toast.error('Error handling optional plan.');
    }

    setIsOptionalPlanModalVisible(false);
    reset({ optionalPlanName: '', amount: 0 });
  };

  const handleOptionalPlanCancel = () => {
    setIsOptionalPlanModalVisible(false);
    reset({ optionalPlanName: '', amount: 0 });
  };

  // Functions for Plan Deletion
  const showConfirmDeletePlan = (planId: string) => {
    setPlanToDelete(planId);
    setIsModalVisible(true);
  };

  const cancelDelete = () => {
    setIsModalVisible(false);
    setPlanToDelete(null);
    setOptionalPlanToDelete(null);
  };

  const confirmDeletePlan = () => {
    if (planToDelete) {
      deletePlan(planToDelete)
        .then(() => {
          toast.success(`Plan Deleted Successfully!`);
          setPlans(prevPlans => prevPlans.filter(plan => plan.id !== planToDelete));
          cancelDelete();
        })
        .catch((error: any) => {
          toast.error('Delete failed. Something went wrong!');
          console.error('Error deleting plan:', error);
        });
    }
  };

  // Functions for Addon Plans Deletion
  const showConfirmOptionalDeletePlan = (planUUID: string) => {
    setOptionalPlanToDelete(planUUID);
    setIsModalVisible(true);
  };

  const confirmDeleteOptionalPlan = async () => {
    if (optionalPlanToDelete) {
      const response = await deleteSingleOptionalPlan(optionalPlanToDelete);
      console.log(response.data.status);
      if (response.data.status) {
        toast.success('Addon Plans Deleted Successfully!');
        setOptionalPlans(prevPlans => prevPlans.filter(plan => plan.uuid !== optionalPlanToDelete));
        cancelDelete();
      } else {
        toast.error('Delete failed. Something went wrong!');
      }
    }
  };

  return (
    <div className="pb-16">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
          {/* Tabs */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => switchTab("plan")}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                activeTab === "plan" ? "bg-[#9F8667] text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              Regular Plans
            </button>
            <button
              type="button"
              onClick={() => switchTab("optionalPlan")}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                activeTab === "optionalPlan" ? "bg-[#9F8667] text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              Addon Plans
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/super-admin/discount-management")}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-all duration-150 whitespace-nowrap text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              Discount
            </button>
          </div>
          {/* Spacer */}
          <div className="flex-1" />
          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {activeTab === "plan" && (
              <>
                {hasPermissionForSlug("create-plans") && (
                  <Link
                    to="/dashboard/super-admin/plan-management/create-custom"
                    className="primary-btn flex items-center gap-1"
                  >
                    <FaPlusCircle /> Custom Plan
                  </Link>
                )}
                {hasPermissionForSlug("create-plans") && (
                  <Link
                    to="/dashboard/super-admin/plan-management/create"
                    className="primary-btn flex items-center gap-1"
                  >
                    <FaPlusCircle /> Plan
                  </Link>
                )}
              </>
            )}
            {activeTab === "optionalPlan" && (
              <button
                type="button"
                onClick={createOptionalPlanModal}
                className="primary-btn flex items-center gap-1"
              >
                <FaPlusCircle /> Addon Plans
              </button>
            )}
          </div>
        </div>

      <div className="p-6">
        {activeTab === "plan" && plans.length === 0 && (
          <p>No regular plans available.</p>
        )}
        {activeTab === "optionalPlan" && optionalPlans.length === 0 && (
          <p>No optional plans available.</p>
        )}
        {activeTab === "plan" && plans.length > 0 && (
          <ul className="space-y-4">
            {plans.map((plan, index) => (
              <li
                key={index}
                className="border border-gray-300 rounded-sm p-4 text-xs"
              >
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-xs font-semibold">
                    {++index}. {plan.name} ({plan.type})
                  </h3>
                  <div className="space-x-2 flex justify-between items-center">
                    {hasPermissionForSlug("edit-plans") && (
                      <Link
                        to={`/dashboard/super-admin/plan-management/edit/${plan.uuid}`}
                      >
                        <FaEdit />
                      </Link>
                    )}
                    {hasPermissionForSlug("delete-plans") && (
                      <button onClick={() => showConfirmDeletePlan(plan.id)}>
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
                <ul className="list-disc pl-5">
                  {plan.planItems.map((item, itemIndex) => {
                    const isCommission = item.itemType === "Commission";
                    const commissionDetails = isCommission
                      ? `- (${item.commissionOwner} / ${item.commissionAgent})`
                      : "";
                    const valueText = isCommission
                      ? commissionDetails
                      : item.value > 0
                      ? `- $${item.value}`
                      : "";

                    return (
                      <li key={itemIndex} className="mb-1 text-xs">
                        <div>
                          <span>{item.name}</span> {valueText}
                        </div>
                        {item.planSubItems && item.planSubItems.length > 0 && (
                          <ul className="list-inside pl-3 mt-1">
                            {item.planSubItems.map((subItem, subItemIndex) => (
                              <li key={subItemIndex} className="text-xs">
                                <span>{subItem.name}</span>{" "}
                                {subItem.value > 0 && `- $${subItem.value}`}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}

        {activeTab === "optionalPlan" && optionalPlans.length > 0 && (
          <ul className="space-y-2">
            {optionalPlans.map((plan, index) => (
              <li
                key={index}
                className="border border-gray-300 rounded-sm p-2 text-sm"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-sm">
                    {++index}. {plan?.name} - ${plan?.amount}
                  </h3>
                  <div className="space-x-2 flex justify-between items-center">
                    {hasPermissionForSlug("edit-plans") && (
                      <button onClick={() => editOptionalPlanModal(plan)}>
                        <FaEdit />
                      </button>
                    )}
                    {hasPermissionForSlug("delete-plans") && (
                      <button
                        onClick={() =>
                          showConfirmOptionalDeletePlan(plan?.uuid)
                        }
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>

      {/* Confirmation Modal for Deletion */}
      <Modal
        title="Confirm Deletion"
        open={isModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={
              planToDelete != null
                ? confirmDeletePlan
                : confirmDeleteOptionalPlan
            }
          >
            Confirm
          </Button>,
          <Button key="cancel" onClick={cancelDelete}>
            Cancel
          </Button>,
        ]}
      >
        <p className="text-sm">Are you sure you want to delete this item?</p>
      </Modal>

      {/* Modal for Addon Plans Creation / Edit */}
      <Modal
        title={selectedOptionalPlan ? "Edit Addon Plans" : "Create Addon Plans"}
        open={isOptionalPlanModalVisible}
        onCancel={handleOptionalPlanCancel}
        footer={[
          <button
            key="cancel"
            className="cancel-btn mr-1"
            onClick={handleOptionalPlanCancel}
          >
            Cancel
          </button>,
          <button
            key="confirm"
            className="primary-btn"
            onClick={handleSubmit(handleOptionalPlanSubmit)}
            style={{ marginLeft: "8px" }}
          >
            Submit
          </button>,
        ]}
      >
        <div className="mb-4">
          <label htmlFor="optionalPlanName">Name</label>
          <input
            {...register("optionalPlanName", {
              required: "Plan name is required",
            })}
            placeholder="Enter optional plan name"
            className={`border p-2 w-full ${
              errors.optionalPlanName ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.optionalPlanName && (
            <p className="text-red-500 text-xs">
              {errors.optionalPlanName.message}
            </p>
          )}
        </div>
        <div className="mb-1">
          <label htmlFor="amount">Amount</label>
          <input
            {...register("amount", { required: "Amount is required" })}
            type="number"
            placeholder="Enter optional Amount"
            className={`border p-2 w-full ${
              errors.amount ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.amount && (
            <p className="text-red-500 text-xs">{errors.amount.message}</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PlanManagement;