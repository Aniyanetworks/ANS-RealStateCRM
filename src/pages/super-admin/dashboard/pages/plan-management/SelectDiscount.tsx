import React, { ReactNode } from 'react';

interface DiscountItem {
  id: string;
  name: string;
  discountItem: string;
  discountType: string;
  duration?: number;
  startDate?: string;
  endDate?: string;
  discountMethod: string;
  discountValue: number;
  isOptional: boolean;
}

interface Discount {
  id: string;
  uuid: string;
  name: string;
  type: ReactNode;
  discountItems: DiscountItem[];
}

interface SelectDiscountProps {
  discounts: Discount[];
  selectedDiscountId: number | null;
  onSelect: (discountId: number) => void;
}

const SelectDiscount: React.FC<SelectDiscountProps> = ({ discounts, selectedDiscountId, onSelect }) => {
  return (
    <div>
      <label htmlFor="">Select Discount</label>
      <ul className="space-y-4">
        {discounts?.map((discount) => (
          <li 
            key={discount.id} 
            className={`border border-gray-300 rounded-md p-4 ${
              selectedDiscountId === parseInt(discount.id) ? "bg-gray-200" : ""
            }`} 
            onClick={() => onSelect(parseInt(discount.id))}
          >
            <input
              type="radio"
              id={discount.id}
              name="discount"
              value={discount.id}
              checked={selectedDiscountId === parseInt(discount.id)}
              onChange={() => onSelect(parseInt(discount.id))}
              className="mr-2"
            />
            <label htmlFor={discount.id} className="flex-grow cursor-pointer">
              <h3 className="text-xs font-semibold">{discount.name}</h3>
              <ul className="list-disc pl-5">
                {discount.discountItems?.map((item: DiscountItem, itemIndex: number) => {
                  // Helper function to get duration text with proper plural form
                  const getDurationText = (duration: number, type: string) => {
                    const durationTypes = {
                      'Weekly': duration === 1 ? 'Week Discount ' : 'Weeks Discount ',
                      'Monthly': duration === 1 ? 'Month Discount ' : 'Months Discount ',
                      'Yearly': duration === 1 ? 'Year Discount ' : 'Years Discount '
                    };
                    return `${duration} ${durationTypes[type as keyof typeof durationTypes] || ''}`;
                  };

                  return (
                    <li key={itemIndex} className="mb-2 text-sm">
                      <div>
                        <span className="text-xs">
                          <span className="font-medium">
                            {item.discountItem}
                          </span>
                          <span className="mx-1">:</span>
                          <span>
                            {item.discountType === "Date Range" ? (
                              `Discount from ${new Date(item.startDate!).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })} to ${new Date(item.endDate!).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}`
                            ) : item.discountType === "Once" ? (
                              "Once"
                            ) : (
                              getDurationText(item.duration!, item.discountType)
                            )}
                          </span>
                          <span className="mx-1">,</span>
                          <span>
                            Discount {item.discountMethod === "Percentage" ? "Percentage" : "Amount"}: {' '}
                            {item.discountMethod === "Percentage" ? (
                              `${item.discountValue}%`
                            ) : (
                              `$${item.discountValue}`
                            )}
                          </span>
                        </span>
                      </div>
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

export default SelectDiscount; 