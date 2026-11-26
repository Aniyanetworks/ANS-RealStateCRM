// PlanList.tsx
import { Plan } from './types';  // Import Plan type
import PlanItemComponent from './PlanItem'; // PlanItem component
import { FaEdit, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface PlanListProps {
    plans: Plan[];
    onDelete: (planId: string) => void;
}

const PlanList: React.FC<PlanListProps> = ({ plans, onDelete }) => {
    return (
        <ul className="space-y-4">
            {plans.map((plan) => (
                <li key={plan.id} className="border border-gray-300 rounded-sm p-4 text-sm">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold">{plan.name} ({plan.type})</h3>
                        <div className="space-x-2 flex justify-between items-center">
                            <Link to={`/dashboard/super-admin/plan-management/edit/${plan.uuid}`}>
                                <FaEdit />
                            </Link>
                            <button onClick={() => onDelete(plan.id)}>
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                    <ul className="list-disc pl-5">
                        {plan.planItems.map((item, itemIndex) => (
                            <PlanItemComponent key={itemIndex} planItem={item} onDelete={() => {}} />
                        ))}
                    </ul>
                </li>
            ))}
        </ul>
    );
};

export default PlanList;
