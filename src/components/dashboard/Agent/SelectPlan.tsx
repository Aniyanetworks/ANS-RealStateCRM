import React, { ReactNode } from 'react';

interface PlanSubItem {
  name: string;
  value: number;
}

interface PlanItem {
  type: ReactNode;
  planItems: [];
  id: string;
  name: string;
  value: number;
  isOptional: boolean;
  commissionOwner: number;
  commissionAgent: number;
  itemType: string;
  planSubItems: PlanSubItem[];
}

interface SelectPlanProps {
  plans: PlanItem[];
  selectedPlanId: number | null;
  onSelect: (planId: number) => void;
}

const SelectPlan: React.FC<SelectPlanProps> = ({ plans , selectedPlanId, onSelect }) => {
  return (
    <div>
      <label htmlFor="">Select Plan</label>
      <ul className="space-y-4">
        {plans?.map((plan) => (
          <li key={plan.id} className={`border border-gray-300 rounded-md p-4 ${selectedPlanId === parseInt(plan.id) ? "bg-gray-200" : ""}`} onClick={() => onSelect(parseInt(plan.id))}>
            <input
              type="radio"
              id={plan.id}
              name="plan"
              value={plan.id}
              checked={selectedPlanId === parseInt(plan?.id)}
              onChange={() => onSelect(parseInt(plan.id))}
              className="mr-2"
            />
            <label htmlFor={plan.id} className="flex-grow cursor-pointer">
                <h3 className="text-xs font-semibold">{plan?.name} ({plan.type})</h3>
                <ul className="list-disc pl-5">
                  {plan?.planItems?.map((item: PlanItem, itemIndex: number) => {
                    const isCommission = item.itemType === 'Commission';
                    const commissionDetails = isCommission ? `- (${item.commissionOwner} / ${item.commissionAgent})` : '';
                    const valueText = isCommission ? commissionDetails : (item.value>0 ? (`- $${item.value}`) : '');

                    return (
                      <li key={itemIndex} className="mb-2 text-sm">
                        <div>
                            <span className="text-xs">{item.name}</span> {valueText}
                        </div>
                        {item.planSubItems && item.planSubItems.length > 0 && (
                          <ul className="list-inside pl-5 mt-2">
                            {item?.planSubItems?.map((subItem: PlanSubItem, subItemIndex: number) => (
                              <li key={subItemIndex} className="text-xs">
                                  <span className="">{subItem.name}</span> {subItem.value>0 && (`- $${subItem.value}`)} 
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SelectPlan;