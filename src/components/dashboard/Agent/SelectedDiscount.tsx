import React from 'react';

type DiscountItem = {
  discountItem: string;
  discountType: 'Date Range' | 'Once' | 'Weekly' | 'Monthly' | 'Yearly';
  startDate?: string;
  endDate?: string;
  duration?: number;
  discountMethod: 'Percentage' | 'Amount';
  discountValue: number;
};

type Discount = {
  id: string;
  name: string;
  discountItems: DiscountItem[];
};

type AgentAccount = {
  discount?: Discount;
};

interface SelectedDiscountProps {
  agentAccount?: AgentAccount;
}

const SelectedDiscount: React.FC<SelectedDiscountProps> = ({ agentAccount }) => {
  const getDurationText = (duration: number, type: string) => {
    const durationTypes = {
      'Weekly': duration === 1 ? 'Week Discount ' : 'Weeks Discount ',
      'Monthly': duration === 1 ? 'Month Discount ' : 'Months Discount ',
      'Yearly': duration === 1 ? 'Year Discount ' : 'Years Discount '
    };
    return `${duration} ${durationTypes[type as keyof typeof durationTypes] || ''}`;
  };

  return (
    <div>
      <p className="font-bold">Your Discount</p>
      {agentAccount?.discount ? (
        <label
          htmlFor={agentAccount.discount.id}
          className="cursor-pointer p-4 border rounded-lg shadow-lg bg-gray-50 hover:bg-gray-100 transition-colors mt-3"
        >
          <h3 className="text-xs font-semibold">{agentAccount.discount.name}</h3>
          <ul className="list-disc pl-5">
            {agentAccount.discount.discountItems.map((item, itemIndex) => (
              <li key={itemIndex} className="mb-2 text-sm">
                <div>
                  <span className="text-xs">
                    <span className="font-medium">{item.discountItem}</span>
                    <span className="mx-1">:</span>
                    <span>
                      {item.discountType === 'Date Range' ? (
                        `Discount from ${new Date(item.startDate!).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })} to ${new Date(item.endDate!).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}`
                      ) : item.discountType === 'Once' ? (
                        'Once'
                      ) : (
                        getDurationText(item.duration!, item.discountType)
                      )}
                    </span>
                    <span className="mx-1">,</span>
                    <span>
                      Discount {item.discountMethod === 'Percentage' ? 'Percentage' : 'Amount'}: {' '}
                      {item.discountMethod === 'Percentage' ? (
                        `${item.discountValue}%`
                      ) : (
                        `$${item.discountValue}`
                      )}
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </label>
      ) : (
        <div className="p-4 border rounded-lg bg-gray-50 text-center text-gray-600">
          <p>No discount available</p>
        </div>
      )}
    </div>
  );
};

export default SelectedDiscount;
