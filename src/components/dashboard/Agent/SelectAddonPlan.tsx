import React from 'react';

interface Plan {
  id: string;
  name: string;
  amount: number;
}

interface AddonsPlanSelectorProps {
  optionalPlanData: { data: { optionalPlans: Plan[] } };
  optionalPlans: number[];
  register: any;
  handleOptionalPlanChange: (id: number) => void;
}

const AddonsPlanSelector: React.FC<AddonsPlanSelectorProps> = ({
  optionalPlanData,
  register,
  handleOptionalPlanChange,
  optionalPlans
}) => {
  return (
    <div>
      <label htmlFor="">Select Addons Plan</label>
      <ul className="space-y-2">
        {optionalPlanData?.data?.optionalPlans.map((plan, index) => (
          <li key={index} className="border border-gray-300 rounded-sm p-2 text-sm">
            <div className="flex justify-between items-center">
              <p className="text-xs">
                {++index}. {plan?.name} - ${plan?.amount}
              </p>
              <div className="space-x-2 flex justify-between items-center">
                <input
                  {...register("optionalPlanId", { required: false })}
                  type="checkbox"
                  id={`optionalPlan-${plan.id}`}
                  value={plan.id}
                  checked={optionalPlans.includes(parseInt(plan.id))}
                  onChange={() => handleOptionalPlanChange(parseInt(plan.id))}
                  className="mr-2"
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AddonsPlanSelector;
