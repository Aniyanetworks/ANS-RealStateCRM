import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useGetSinglePlanDataQuery, useUpdatePlanMutation } from '../../../../../redux/api/superadmin/plan-management/planManagementSlice';
import toast from 'react-hot-toast';
import { FaMinusCircle, FaPlusCircle } from 'react-icons/fa';
import TableLoader from '../../../../../components/loader/TableLoader';

interface PlanSubItem {
    name: string;
    value: number;
}

interface PlanItem {
    name: string;
    value: number;
    commissionOwner: number;
    commissionAgent: number;
    itemType: string;
    planSubItems: PlanSubItem[];
}

const EditPlan = () => {
    const { uuid } = useParams<{ uuid: string }>();
    const [planName, setPlanName] = useState<string>('');
    const [planType, setPlanType] = useState<string>('Yearly');
    const [planItems, setPlanItems] = useState<PlanItem[]>([]);
    const [message, setMessage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const navigate = useNavigate();

    const { data, isLoading, isError } = useGetSinglePlanDataQuery(uuid || '');
    const [updatePlan] = useUpdatePlanMutation();

    useEffect(() => {
        if (data?.status && data.data.singlePlan) {
            const plan = data.data.singlePlan;
            setPlanName(plan.name);
            setPlanType(plan.type);
            setPlanItems(plan.planItems);
        }
    }, [data]);

    const handleAddPlanItem = () => {
        setPlanItems(prevPlanItems => [
            ...prevPlanItems,
            { name: '', value: 0, commissionOwner: 0, commissionAgent: 0, itemType: 'Fee', planSubItems: [] }
        ]);
    };

    const handleRemovePlanItem = (index: number) => {
        const newPlanItems = planItems.filter((_, i) => i !== index);
        setPlanItems(newPlanItems);
    };


    const handlePlanItemChange = <K extends keyof PlanItem>(index: number, field: K, value: PlanItem[K]) => {
        setPlanItems(prevPlanItems => {
            const updatedItems = [...prevPlanItems];
            updatedItems[index] = { ...updatedItems[index], [field]: value };
            return updatedItems;
        });
    };

    const handleAddSubItem = (itemIndex: number) => {
        setPlanItems(prevPlanItems => {
            const updatedItems = prevPlanItems.map((item, index) => {
                if (index === itemIndex) {
                    const updatedItem = { ...item };
                    updatedItem.planSubItems = updatedItem.planSubItems ? [...updatedItem.planSubItems, { name: '', value: 0 }] : [{ name: '', value: 0 }];
                    return updatedItem;
                }
                return item;
            });
    
            return updatedItems;
        });
    };

    const handleRemoveSubItem = (itemIndex: number, subItemIndex: number) => {
        setPlanItems(prevPlanItems => {
            const updatedPlanItems = [...prevPlanItems];
    
            const updatedItem = { ...updatedPlanItems[itemIndex] };
            updatedItem.planSubItems = Array.isArray(updatedItem.planSubItems)
                ? updatedItem.planSubItems.filter((_, i) => i !== subItemIndex) 
                : [];
    
            updatedPlanItems[itemIndex] = updatedItem;
    
            return updatedPlanItems;
        });
    };
    

    const handleSubItemChange = <K extends keyof PlanSubItem>(itemIndex: number, subItemIndex: number, field: K, value: PlanSubItem[K]) => {
        setPlanItems(prevPlanItems => {
            const updatedItems = [...prevPlanItems];
            const updatedSubItems = updatedItems[itemIndex].planSubItems.map((subItem, idx) =>
                idx === subItemIndex
                    ? { ...subItem, [field]: value }
                    : subItem
            );
            updatedItems[itemIndex] = { ...updatedItems[itemIndex], planSubItems: updatedSubItems };
            return updatedItems;
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = {
            id: uuid,
            name: planName,
            type: planType,
            planItems: planItems,
        };

        try {
            const response = await updatePlan({data,uuid}).unwrap();
            if (response.status) {
                toast.success("Plan updated successfully!");
                navigate('/dashboard/super-admin/plan-management', { replace: true });
                setMessage('Plan updated successfully!');
                setError('');
            }
        } catch (error) {
            setError('Error updating plan. Please try again.');
            toast.error("Error updating plan. Please try again.");
            setMessage('');
        }
    };

    if (isLoading) return <div><TableLoader/></div>;
    if (isError) return <div>Error loading plan data.</div>;


    return (
        <div className="mx-auto p-6 bg-white rounded-md shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Edit Plan</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <div className="mb-4">
                        <label htmlFor="planName" className="block text-sm font-medium text-gray-700">Plan Name:</label>
                        <input
                            id="planName"
                            type="text"
                            value={planName}
                            onChange={(e) => setPlanName(e.target.value)}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="planType" className="block text-sm font-medium text-gray-700">Plan Type:</label>
                        <select
                            id="planType"
                            value={planType}
                            onChange={(e) => setPlanType(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                        >
                            <option value="Yearly">Yearly</option>
                            <option value="Monthly">Monthly</option>
                        </select>
                    </div>

                    <h3 className="text-lg font-semibold mb-2">Plan Items</h3>
                    {planItems.map((item, index) => (
                        <div key={index} className="mb-6 p-4 border border-gray-300 rounded-md">
                            <div className='flex justify-between'>
                                <h4 className="text-md font-semibold mb-2">Item {index + 1}</h4> 
                                <button type="button" onClick={() => handleRemovePlanItem(index)} className="text-red-600 text-2xl mt-2">
                                    <FaMinusCircle/>
                                </button>
                            </div>
                            <div className="mb-4">
                                <label htmlFor={`itemName-${index}`} className="block text-sm font-medium text-gray-700">Name:</label>
                                <input
                                    id={`itemName-${index}`}
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => handlePlanItemChange(index, 'name', e.target.value)}
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor={`itemType-${index}`} className="block text-sm font-medium text-gray-700">Item Type:</label>
                                <select
                                    id={`itemType-${index}`}
                                    value={item.itemType}
                                    onChange={(e) => handlePlanItemChange(index, 'itemType', e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                                >
                                    <option value="Fee">Fee</option>
                                    <option value="Commission">Commission</option>
                                    <option value="Optional">Optional</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {item.itemType !== 'Commission' && (
                                <div className="mb-4">
                                    <label htmlFor={`itemValue-${index}`} className="block text-sm font-medium text-gray-700">Value:</label>
                                    <input
                                        id={`itemValue-${index}`}
                                        type="number"
                                        value={item.value}
                                        onChange={(e) => handlePlanItemChange(index, 'value', parseFloat(e.target.value))}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                                    />
                                </div>
                            )}

                            {item.itemType === 'Commission' && (
                                <div className="mb-4">
                                    <h5 className="text-md font-semibold text-gray-700 mb-2">Commission Split</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="mb-4">
                                            <label htmlFor={`commissionOwner-${index}`} className="block text-sm font-medium text-gray-700">Brokerage(%):</label>
                                            <input
                                                id={`commissionOwner-${index}`}
                                                type="number"
                                                value={item.commissionOwner}
                                                onChange={(e) => handlePlanItemChange(index, 'commissionOwner', parseFloat(e.target.value))}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor={`commissionAgent-${index}`} className="block text-sm font-medium text-gray-700">Agent(%):</label>
                                            <input
                                                id={`commissionAgent-${index}`}
                                                type="number"
                                                value={item.commissionAgent}
                                                onChange={(e) => handlePlanItemChange(index, 'commissionAgent', parseFloat(e.target.value))}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <h5 className="text-md font-semibold mb-2">Sub Items</h5>
                            {item.planSubItems?.map((subItem, subItemIndex) => (
                                <div key={subItemIndex} className="mb-4 p-4 border border-gray-300 rounded-md">
                                    <div className="mb-4">
                                        <div className='flex justify-end'>
                                            <button type="button" onClick={() => handleRemoveSubItem(index, subItemIndex)} className="text-red-600 text-2xl">
                                                <FaMinusCircle/>
                                            </button>
                                        </div>
                                        <label htmlFor={`subItemName-${index}-${subItemIndex}`} className="block text-sm font-medium text-gray-700">Sub Item Name:</label>
                                        <input
                                            id={`subItemName-${index}-${subItemIndex}`}
                                            type="text"
                                            value={subItem.name}
                                            onChange={(e) => handleSubItemChange(index, subItemIndex, 'name', e.target.value)}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label htmlFor={`subItemValue-${index}-${subItemIndex}`} className="block text-sm font-medium text-gray-700">Sub Item Value:</label>
                                        <input
                                            id={`subItemValue-${index}-${subItemIndex}`}
                                            type="number"
                                            value={subItem.value}
                                            onChange={(e) => handleSubItemChange(index, subItemIndex, 'value', parseFloat(e.target.value))}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={() => handleAddSubItem(index)} className="primary-btn">
                                <FaPlusCircle/>
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={handleAddPlanItem} className="primary-btn mr-2">
                        Add Plan Item
                    </button>
                </div>

                <div className="flex justify-end">
                    <Link to={`/dashboard/super-admin/plan-management`}>
                        <button type="submit" className="cancel-btn mt-3 mr-3">
                            Go Back
                        </button>
                    </Link>
                    <button type="submit" className="primary-btn mt-3">
                        Update Plan
                    </button>
                </div>

                {message && <p className="text-green-600">{message}</p>}
                {error && <p className="text-red-600">{error}</p>}
            </form>
        </div>
    );
};

export default EditPlan;
