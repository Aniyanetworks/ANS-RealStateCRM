// PlanManagement.tsx
import { useEffect, useState } from 'react';
import { Modal, Button } from 'antd';
import { useCreateOptionalPlanMutation, useUpdateOptionalPlanMutation, useDeleteSinglePlanMutation, useGetOptionalPlanListDataQuery, useGetPlanListDataQuery, useDeleteSingleOptionalPlanMutation } from '../../../../../redux/api/superadmin/plan-management/planManagementSlice';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import TableLoader from '../../../../../components/loader/TableLoader';
import { FaPlusCircle } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import PlanList from './PlanList';
import OptionalPlanItem from './OptionalPlanItem';

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
    const [plans, setPlans] = useState<Plan[]>([]);
    const [optionalPlans, setOptionalPlans] = useState<OptionalPlan[]>([]);
    const [activeTab, setActiveTab] = useState<'plan' | 'optionalPlan'>('plan');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<string | null>(null);
    const [isOptionalPlanModalVisible, setIsOptionalPlanModalVisible] = useState(false);
    const [selectedOptionalPlan, setSelectedOptionalPlan] = useState<OptionalPlan | null>(null); 

    const { data, isLoading } = useGetPlanListDataQuery('');
    const { data: optionalPlanData } = useGetOptionalPlanListDataQuery('');
    const [deletePlan] = useDeleteSinglePlanMutation();
    const [createOptionalPlan] = useCreateOptionalPlanMutation();
    const [updateOptionalPlan] = useUpdateOptionalPlanMutation();  
    const [deleteSingleOptionalPlan] = useDeleteSingleOptionalPlanMutation();

    const { register, handleSubmit, reset, getValues } = useForm<OptionalPlan>();

    useEffect(() => {
        if (data?.data?.plans) {
            setPlans(data.data.plans);
        }
        if (optionalPlanData?.data?.optionalPlans) {
            setOptionalPlans(optionalPlanData.data.optionalPlans);
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

            if (selectedOptionalPlan) {
                let response = await updateOptionalPlan({ data, uuid: selectedOptionalPlan.uuid });
                if (response) {
                    toast.success(`Addon Plans updated successfully!`);
                    setOptionalPlans(prevPlans =>
                        prevPlans.map(plan => (plan.id === selectedOptionalPlan.id ? { ...plan, ...data } : plan))
                    );
                }
            } else {
                let response = await createOptionalPlan(data);
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

    const handleDeletePlan = async () => {
        try {
            if (planToDelete) {
                const response = await deletePlan(planToDelete);
                if (response) {
                    setPlans(prevPlans => prevPlans.filter(plan => plan.id !== planToDelete));
                    toast.success('Plan deleted successfully!');
                }
            }
        } catch (error) {
            toast.error('Failed to delete plan.');
        }
        setIsModalVisible(false);
    };

    const handleDeleteOptionalPlan = async (optionalPlanId: string) => {
        try {
            const response = await deleteSingleOptionalPlan(optionalPlanId);
            if (response) {
                setOptionalPlans(prevPlans => prevPlans.filter(plan => plan.id !== optionalPlanId));
                toast.success('Optional Plan deleted successfully!');
            }
        } catch (error) {
            toast.error('Failed to delete Optional Plan.');
        }
    };

    return (
        <div className="pb-32">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <button onClick={() => switchTab('plan')} className={`px-4 py-2 rounded-md ${activeTab === 'plan' ? 'bg-[#0b3b38] text-white' : 'bg-gray-200'}`}>Regular Plans</button>
                    <button onClick={() => switchTab('optionalPlan')} className={`px-4 py-2 rounded-md ${activeTab === 'optionalPlan' ? 'bg-[#0b3b38] text-white' : 'bg-gray-200'}`}>Addon Plans</button>
                </div>
                <div className="flex justify-between items-center">
                    {activeTab === 'plan' && (
                        <Link to={`/dashboard/super-admin/plan-management/create`} className="text-[16px] hover:text-primaryPurple duration-100">
                            <button className="primary-btn flex items-center gap-1 mx-3">
                                <FaPlusCircle className="text-lg" />
                                Custom Plan
                            </button>
                        </Link>
                    )}
                    {activeTab === 'optionalPlan' && (
                        <button onClick={createOptionalPlanModal} className="text-[16px] hover:text-primaryPurple duration-100">
                            <button className="primary-btn flex items-center gap-2 mx-3">
                                <FaPlusCircle className="text-lg" />
                                Addon Plans
                            </button>
                        </button>
                    )}
                </div>
            </div>

            <div className="mx-auto p-6 bg-white rounded-md shadow-sm">
                {activeTab === 'plan' && <PlanList plans={plans} onDelete={showConfirmDeletePlan} />}
                {activeTab === 'optionalPlan' && optionalPlans.map(plan => (
                    <OptionalPlanItem key={plan.id} plan={plan} onDelete={() => handleDeleteOptionalPlan(plan.id)} onEdit={() => editOptionalPlanModal(plan)} />
                ))}
            </div>

            <Modal
                title="Confirm Deletion"
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={[
                    <Button key="confirm" type="primary" danger onClick={handleDeletePlan}>
                        Confirm
                    </Button>,
                    <Button key="cancel" onClick={() => setIsModalVisible(false)}>
                        Cancel
                    </Button>,
                ]}
            >
                <p>Are you sure you want to delete this plan?</p>
            </Modal>

            {/* Optional Plan Modal */}
            <Modal
                title={selectedOptionalPlan ? 'Edit Optional Plan' : 'Create Optional Plan'}
                visible={isOptionalPlanModalVisible}
                onCancel={handleOptionalPlanCancel}
                footer={[
                    <Button key="cancel" onClick={handleOptionalPlanCancel}>
                        Cancel
                    </Button>,
                    <Button key="submit" type="primary" onClick={handleSubmit(handleOptionalPlanSubmit)}>
                        Submit
                    </Button>,
                ]}
            >
                <form onSubmit={handleSubmit(handleOptionalPlanSubmit)}>
                    <div className="mb-3">
                        <label className="block">Optional Plan Name</label>
                        <input
                            type="text"
                            {...register('optionalPlanName')}
                            className="form-input w-full"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="block">Amount</label>
                        <input
                            type="number"
                            {...register('amount')}
                            className="form-input w-full"
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PlanManagement;
