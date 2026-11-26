import React from 'react';

interface Plan {
  id: string;
  name: string;
  amount: number;
}

interface SelectedAddonsPlansProps {
  optionalPlans: Plan[];
}

const SelectedAddonsPlans: React.FC<SelectedAddonsPlansProps> = ({ optionalPlans }) => {
  return (
    <div>
      <p className="font-bold mt-3">Selected Addons Plans</p>
      {optionalPlans && optionalPlans.length > 0 ? (
        <ul>
          {optionalPlans.map((plan, index) => (
            <li key={plan.id}>
              {index + 1}. {plan.name} - ${plan.amount}
            </li>
          ))}
        </ul>
      ) : (
        <p>No Addon Plan</p>
      )}
    </div>
  );
};

export default SelectedAddonsPlans;