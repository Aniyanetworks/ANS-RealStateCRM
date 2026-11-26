import React from 'react';

interface PlanItem {
  name: string;
  value: number;
  planSubItems?: { name: string; value: number }[];
}

interface Plan {
  id: string;
  name: string;
  type: string;
  planItems?: PlanItem[];
}

interface SelectedPlansDisplayProps {
  plan: Plan | null;
}

const SelectedPlansDisplay: React.FC<SelectedPlansDisplayProps> = ({ plan }) => {

  
  return (
    <div>
      {plan ? (
        <div>
          <p className="font-bold">Selected Plans</p>
          <ul className="space-y-4 mt-3">
            <li
              key={plan.id}
              className={`border border-gray-300 rounded-md p-4 ${
                plan.id ? "bg-gray-50 hover:bg-gray-100" : ""
              }`}
            >
              <label htmlFor={plan.id} className="flex-grow cursor-pointer">
                <h3 className="text-sm font-semibold">
                  {plan?.name} ({plan.type})
                </h3>
                
                <ul className="list-disc pl-5">
                  {plan?.planItems?.map((item:any, itemIndex:any) => {
                    const isCommission = item.itemType === 'Commission';
                    const commissionDetails = isCommission ? `- (${item.commissionOwner} / ${item.commissionAgent})` : '';
                    const valueText = isCommission ? commissionDetails : (item.value>0 ? (`- $${item.value}`) : '');

                    return (
                      <li key={itemIndex} className="mb-2 text-sm">
                        <div>
                            <span className="font-semibold">{item.name}</span> {valueText}
                        </div>
                        {item.planSubItems && item.planSubItems.length > 0 && (
                          <ul className="list-inside pl-5 mt-2">
                            {item.planSubItems.map((subItem:any, subItemIndex:any) => (
                              <li key={subItemIndex} className="text-xs">
                                  <span className="font-semibold">{subItem.name}</span> {subItem.value>0 && (`- $${subItem.value}`)} 
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
          </ul>
        </div>
      ) : (
        <p>No available plans.</p>
      )}
    </div>
  );
};

export default SelectedPlansDisplay;