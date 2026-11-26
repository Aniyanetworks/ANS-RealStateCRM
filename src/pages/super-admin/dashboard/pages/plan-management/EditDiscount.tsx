// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, {
  useEffect,
  useState,
} from 'react';

import toast from 'react-hot-toast';
import {
  FaPlus,
  FaTrash,
} from 'react-icons/fa';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';

import TableLoader from '../../../../../components/loader/TableLoader';
import {
  useGetSingleDiscountDataQuery,
  useUpdateDiscountMutation,
} from '../../../../../redux/api/superadmin/discount-management/discountManagementSlice';

interface DiscountItem {
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

const EditDiscount = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();

  // States
  const [discountName, setDiscountName] = useState('');
  const [discountItems, setDiscountItems] = useState<DiscountItem[]>([]);

  // API Hooks
  const { data, isLoading } = useGetSingleDiscountDataQuery(uuid || '');
  const [updateDiscount] = useUpdateDiscountMutation();

  useEffect(() => {
    if (data?.status && data.data.singleDiscount) {
      const discount = data.data.singleDiscount;
      setDiscountName(discount.name);
      // Format the items with special handling for discountItem
      const formattedItems = discount.discountItems.map(item => ({
        ...item,
        // Ensure discountItem matches exactly with the enum values
        discountItem: item.discountItem || '',
        discountType: item.discountType || '',
        discountMethod: item.discountMethod || '',
        startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : undefined,
        endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : undefined,
      }));
      console.log('Formatted Items:', formattedItems); // For debugging
      setDiscountItems(formattedItems);
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await updateDiscount({
        data: {
          name: discountName,
          discountItems: discountItems.map(item => ({
            ...item,
            duration: item.discountType === 'Once' ? undefined : item.duration,
            startDate: item.discountType === 'Date Range' ? item.startDate : undefined,
            endDate: item.discountType === 'Date Range' ? item.endDate : undefined,
          }))
        },
        uuid
      }).unwrap();

      if (response.status) {
        toast.success('Discount updated successfully!');
        navigate('/dashboard/super-admin/discount-management');
      }
    } catch (error) {
      toast.error('Failed to update discount');
    }
  };

  const handleAddItem = () => {
    setDiscountItems([...discountItems, {
      name: '',
      discountItem: '',
      discountType: '',
      duration: 0,
      discountMethod: '',
      discountValue: 0,
      isOptional: false
    }]);
  };

  const handleRemoveItem = (index: number) => {
    if (discountItems.length > 1) {
      setDiscountItems(discountItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof DiscountItem, value: any) => {
    setDiscountItems(prev => {
      const updated = [...prev];
      updated[index] = { 
        ...updated[index], 
        [field]: value,
        // Reset related fields when discount type changes
        ...(field === 'discountType' && {
          duration: value === 'Once' ? undefined : 0,
          startDate: value === 'Date Range' ? '' : undefined,
          endDate: value === 'Date Range' ? '' : undefined,
        })
      };
      return updated;
    });
  };

  if (isLoading) return <TableLoader />;

  return (
    <div className="pb-32">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Edit Discount</h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-sm"
      >
        <div className="mb-6">
          <label
            htmlFor="discountName"
            className="block text-sm font-medium mb-2"
          >
            Discount Name
          </label>
          <input
            type="text"
            id="discountName"
            value={discountName}
            onChange={(e) => setDiscountName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        {discountItems.map((item, index) => (
          <div
            key={index}
            className="mb-6 p-4 border border-gray-200 rounded-lg"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Discount Item {index + 1}</h3>
              {discountItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaTrash />
                </button>
              )}
            </div>

            <div className="flex gap-5 flex-wrap">
              <div className="w-full md:w-[calc(50%-10px)]">
                <label className="block text-sm font-medium mb-2">
                  Discount Item
                </label>
                <select
                  value={item.discountItem}
                  onChange={(e) =>
                    handleItemChange(index, "discountItem", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                    <option value="">Select Discount Item</option>
                    <option value="Desk Fee">Desk Fee</option>
                    <option value="Commission Split">Commission Split</option>
                    <option value="Buy/Sale Admin Fees">Buy/Sale Admin Fees</option>
                    <option value="Lease Admin Fees">Lease Admin Fees</option>
                    <option value="Authentisign">Authentisign</option>
                    <option value="DVREALTY Email">DVREALTY Email</option>
                    <option value="500 Business Cards">500 Business Cards</option>
                    <option value="1 DV Lock Box">1 DV Lock Box</option>
                    <option value="Transection Cap Fee">Transection Cap Fee</option>
                </select>
              </div>

              <div className="w-full md:w-[calc(50%-10px)]">
                <label className="block text-sm font-medium mb-2">
                  Discount Type
                </label>
                <select
                  value={item.discountType}
                  onChange={(e) =>
                    handleItemChange(index, "discountType", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                    <option value="">Select Type</option>
                    <option value="Yearly">Yearly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Once">One Time</option>
                    <option value="Date Range">Date Range</option>
                </select>
              </div>

              {item.discountType === "Date Range" ? (
                <>
                  <div className="w-full md:w-[calc(50%-10px)]">
                    <label className="block text-sm font-medium mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={item.startDate}
                      onChange={(e) =>
                        handleItemChange(index, "startDate", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div className="w-full md:w-[calc(50%-10px)]">
                    <label className="block text-sm font-medium mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={item.endDate}
                      onChange={(e) =>
                        handleItemChange(index, "endDate", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </>
              ) : (
                item.discountType &&
                item.discountType !== "Once" && (
                  <div className="w-full md:w-[calc(50%-10px)]">
                    <label className="block text-sm font-medium mb-2">
                      Duration ({item.discountType.toLowerCase()})
                    </label>
                    <input
                      type="number"
                      value={item.duration}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "duration",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full p-2 border border-gray-300 rounded-md"
                      min="1"
                      required
                    />
                  </div>
                )
              )}

              <div className="w-full md:w-[calc(50%-10px)]">
                <label className="block text-sm font-medium mb-2">
                  Discount Method
                </label>
                <select
                  value={item.discountMethod}
                  onChange={(e) =>
                    handleItemChange(index, "discountMethod", e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                <option value="">Select Method</option>
                <option value="Amount">Fixed Amount</option>
                <option value="Percentage">Percentage</option>
                </select>
              </div>

              {item.discountMethod && (
                <div className="w-full md:w-[calc(50%-10px)]">
                  <label className="block text-sm font-medium mb-2">
                    {item.discountMethod === "Percentage"
                      ? "Percentage (%)"
                      : "Amount ($)"}
                  </label>
                  <input
                    type="number"
                    value={item.discountValue}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "discountValue",
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min="0"
                    max={item.discountMethod === "Percentage" ? 100 : undefined}
                    step="0.01"
                    required
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-4 mt-6">
          <button
            type="button"
            onClick={handleAddItem}
            className="primary-btn mr-2 flex items-center gap-1"
          >
            <FaPlus className="text-white" />
            ADD ITEM
          </button>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Link to="/dashboard/super-admin/discount-management">
            <button type="button" className="btn-common-outline">
              Cancel
            </button>
          </Link>
          <button type="submit" className="primary-btn">
            Update Discount
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditDiscount;
