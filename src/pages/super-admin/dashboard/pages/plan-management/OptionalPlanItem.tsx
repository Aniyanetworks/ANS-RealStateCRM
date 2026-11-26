// OptionalPlanItem.tsx
import { FaEdit, FaTrash } from 'react-icons/fa';
import { OptionalPlan } from './types';

interface OptionalPlanItemProps {
    plan: OptionalPlan;
    onEdit: () => void;
    onDelete: () => void;
}

const OptionalPlanItem: React.FC<OptionalPlanItemProps> = ({ plan, onEdit, onDelete }) => {
    return (
        <li className="border border-gray-300 rounded-sm p-2 text-sm">
            <div className="flex justify-between items-center">
                <h3 className="text-sm">{plan?.name} - ${plan?.amount}</h3>
                <div className="space-x-2 flex justify-between items-center">
                    <button onClick={onEdit}>
                        <FaEdit />
                    </button>
                    <button onClick={onDelete}>
                        <FaTrash />
                    </button>
                </div>
            </div>
        </li>
    );
};

export default OptionalPlanItem;
