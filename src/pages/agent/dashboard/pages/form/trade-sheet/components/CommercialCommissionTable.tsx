// components/CommercialCommissionTable.tsx
import { Controller, useFieldArray } from 'react-hook-form';
import { useEffect, useRef } from 'react';

interface CommercialCommissionTableProps {
  type: 'seller' | 'buyer';
  control: any;
  setValue: any;
  watch: any;
  errors: any;
  commissionType?: string;
}

interface CommissionYear {
  year: number;
  yearlyRent: string;
  commission: string;
}

const CommercialCommissionTable: React.FC<CommercialCommissionTableProps> = ({
  type,
  control,
  watch,
  commissionType = "percentage",
}) => {
  const fieldName = `${type}CommercialCommission`;
  const { fields, append, replace, remove } = useFieldArray({
    control,
    name: fieldName,
  });
  const initialized = useRef(false);
  
  // Watch commission type to update display
  const currentCommissionType = watch(`${type}CommissionType`) || commissionType;
  const isPercentage = currentCommissionType === "percentage";

  // Initialize with existing data or one year if empty (only once)
  useEffect(() => {
    if (!initialized.current) {
      const currentValue = watch(fieldName);
      if (currentValue && Array.isArray(currentValue) && currentValue.length > 0) {
        // Use existing data - ensure proper format
        const formattedData = currentValue.map((item: any, idx: number) => ({
          year: item.year || idx + 1,
          yearlyRent: item.yearlyRent?.toString() || item.numberOfYears?.toString() || '',
          commission: item.commission?.toString() || '',
        }));
        replace(formattedData);
      } else if (!currentValue || currentValue.length === 0) {
        // Initialize with one empty row
        append({ year: 1, yearlyRent: '', commission: '' });
      }
      initialized.current = true;
    }
  }, [append, replace, fieldName, watch]);

  // Calculate commission amount for a single row
  const calculateCommissionAmount = (yearlyRent: string, commission: string): number => {
    const rent = parseFloat(yearlyRent) || 0;
    const comm = parseFloat(commission) || 0;
    
    if (isPercentage) {
      // If percentage: (yearlyRent * commission) / 100
      return (rent * comm) / 100;
    } else {
      // If amount: use commission directly
      return comm;
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const years = watch(fieldName) || [];
    const totalYearlyRent = years.reduce((sum: number, year: CommissionYear) => {
      const rent = parseFloat(year.yearlyRent) || 0;
      return sum + rent;
    }, 0);
    
    const totalCommission = years.reduce((sum: number, year: CommissionYear) => {
      const commission = parseFloat(year.commission) || 0;
      return sum + commission;
    }, 0);

    const totalCalculatedCommission = years.reduce((sum: number, year: CommissionYear) => {
      return sum + calculateCommissionAmount(year.yearlyRent, year.commission);
    }, 0);

    return { totalYearlyRent, totalCommission, totalCalculatedCommission };
  };
  
  // const formatCommissionValue = (value: number) => {
  //   if (isPercentage) {
  //     return formatPercentage(value);
  //   } else {
  //     return formatCurrency(value);
  //   }
  // };

  const { totalYearlyRent, totalCommission, totalCalculatedCommission } = calculateTotals();

  const handleAddYear = () => {
    const currentYears = watch(fieldName) || [];
    const nextYear = currentYears.length + 1;
    append({ year: nextYear, yearlyRent: '', commission: '' });
  };

  const handleRemoveYear = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="mt-3">
      <label className="block mb-1.5 text-sm font-semibold">
        Commercial Commission Structure
      </label>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 bg-white text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-1.5 text-left text-xs">Years</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left text-xs">Yearly Rent</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left text-xs">
                Commission {isPercentage ? "(%)" : "($)"}
              </th>
              <th className="border border-gray-300 px-2 py-1.5 text-left text-xs">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => {
              const yearlyRent = watch(`${fieldName}.${index}.yearlyRent`) || '';
              const commission = watch(`${fieldName}.${index}.commission`) || '';
              const calculatedAmount = calculateCommissionAmount(yearlyRent, commission);
              
              return (
                <tr key={field.id}>
                  <td className="border border-gray-300 px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveYear(index)}
                          className="ml-auto text-red-500 hover:text-red-700 text-xs bg-gray-100 rounded-full px-1"
                          title="Remove row"
                        >
                          ×
                        </button>
                      )}
                      
                      <span className="font-medium text-sm"> {index + 1}</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-2 py-1.5">
                    <Controller
                      name={`${fieldName}.${index}.yearlyRent`}
                      control={control}
                      render={({ field: inputField }) => (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500 text-xs">$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            className="w-full border border-gray-300 px-1.5 py-1 rounded text-sm"
                            onChange={(e) => {
                              const value = e.target.value;
                              // Allow empty, numbers, and one decimal point
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                inputField.onChange(value);
                              }
                            }}
                            onBlur={inputField.onBlur}
                            value={inputField.value ?? ''}
                          />
                        </div>
                      )}
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1.5">
                    <Controller
                      name={`${fieldName}.${index}.commission`}
                      control={control}
                      render={({ field: inputField }) => (
                        <div className="flex items-center gap-1">
                          {!isPercentage && <span className="text-gray-500 text-xs">$</span>}
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            className="w-full border border-gray-300 px-1.5 py-1 rounded text-sm"
                            onChange={(e) => {
                              const value = e.target.value;
                              // Allow empty, numbers, and one decimal point
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                inputField.onChange(value);
                              }
                            }}
                            onBlur={inputField.onBlur}
                            value={inputField.value ?? ''}
                          />
                          {isPercentage && <span className="text-gray-500 text-xs">%</span>}
                        </div>
                      )}
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1.5">
                    <div className="text-sm font-medium text-gray-700">
                      {formatCurrency(calculatedAmount)}
                    </div>
                  </td>
                </tr>
              );
            })}
            {/* Add Year Row */}
            <tr>
              <td className="border border-gray-300 px-2 py-1.5"></td>
              <td className="border border-gray-300 px-2 py-1.5"></td>
              <td className="border border-gray-300 px-2 py-1.5">
                <button
                  type="button"
                  onClick={handleAddYear}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm w-full text-left"
                >
                  + Add Year
                </button>
              </td>
              <td className="border border-gray-300 px-2 py-1.5"></td>
            </tr>
            {/* Total Row */}
            <tr className="bg-gray-50 font-semibold">
              <td className="border border-gray-300 px-2 py-1.5 text-sm">Total</td>
              <td className="border border-gray-300 px-2 py-1.5 text-sm">
                {formatCurrency(totalYearlyRent)}
              </td>
              <td className="border border-gray-300 px-2 py-1.5 text-sm">
                {isPercentage ? (
                  // For percentage type, show weighted average percentage based on total yearly rent
                  totalYearlyRent > 0 
                    ? formatPercentage((totalCalculatedCommission / totalYearlyRent) * 100)
                    : formatPercentage(0)
                ) : (
                  // For amount type, show sum of commission amounts
                  formatCurrency(totalCommission)
                )}
              </td>
              <td className="border border-gray-300 px-2 py-1.5 text-sm">
                {formatCurrency(totalCalculatedCommission)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommercialCommissionTable;
