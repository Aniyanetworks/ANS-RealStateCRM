import { PlanItem } from './types';

interface PlanItemProps {
    planItem: PlanItem;
    onDelete: () => void;
}

const PlanItemComponent: React.FC<PlanItemProps> = ({ planItem }) => {
    const isCommission = planItem.itemType === 'Commission';
    const commissionDetails = isCommission ? `(${planItem.commissionAgent} / ${planItem.commissionOwner})` : null;
    const valueText = isCommission ? commissionDetails : `$${planItem.value}`;

    return (
        <li className="mb-2 text-sm">
            <div>
                <span className="font-semibold">{planItem.name}</span> - {valueText}
            </div>
            {planItem.planSubItems && planItem.planSubItems.length > 0 && (
                <ul className="list-inside pl-5 mt-2">
                    {planItem.planSubItems.map((subItem, subItemIndex) => (
                        <li key={subItemIndex} className="text-xs">
                            <span className="font-semibold">{subItem.name}</span> - ${subItem.value}
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
};

export default PlanItemComponent;
