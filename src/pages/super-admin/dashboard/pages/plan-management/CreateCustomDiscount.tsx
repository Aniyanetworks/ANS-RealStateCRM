// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import React, { useState } from 'react';

import toast from 'react-hot-toast';
import {
  FaPlus,
  FaTimes,
  FaTrash,
} from 'react-icons/fa';
import {
  Link,
  useNavigate,
} from 'react-router-dom';

import plusBlack from '../../../../../assets/plus-black.svg';
import plusIcon from '../../../../../assets/plus.svg';
import { useCreateDiscountMutation } from '../../../../../redux/api/superadmin/discount-management/discountManagementSlice';
interface DiscountSubItem {
  name: string;
  value: number;
}

interface DiscountItem {
  name: string;
  discountItem: string;
  discountType: string;
  duration: number;
  startDate: string;
  endDate: string;
  discountMethod: string;
  discountValue: number;
  isOptional: boolean;
}

const CreateCustomDiscount = () => {
  const [discountName, setDiscountName] = useState<string>("");
  const [discountItems, setDiscountItems] = useState<DiscountItem[]>([]);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const [createDiscount] = useCreateDiscountMutation();

  const handleAddItem = () => {
    const newItem: DiscountItem = {
      name: '',
      discountItem: '',
      discountType: '',
      duration: 0,
      startDate: '',
      endDate: '',
      discountMethod: '',
      discountValue: 0,
      isOptional: false
    };
    setDiscountItems([...discountItems, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setDiscountItems(discountItems.filter((_, i) => i !== index));
  };

  const handleItemChange = <K extends keyof DiscountItem>(
    index: number,
    field: K,
    value: DiscountItem[K]
  ) => {
    const updatedItems = [...discountItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    setDiscountItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await createDiscount({
        name: discountName,
        items: discountItems
      }).unwrap();

      if (response.status) {
        toast.success('Discount created successfully!');
        navigate('/dashboard/super-admin/discount-management');
      }
    } catch (error) {
      toast.error('Failed to create discount');
    }
  };

  return (
    <div className="mx-auto p-6 mb-10  rounded-md shadow-sm">
      <form onSubmit={handleSubmit}>
        <div>
          <div className="bg-white border border-gray-100 rounded-2xl mb-5 shadow-md">
            <h1 className="bg-[#EEE] px-4 py-2 rounded-t-2xl">
              Create Discount
            </h1>
            <div className="flex gap-5 px-4 py-4 ">
              <div className="w-full">
                <label htmlFor="">Discount Name</label>
                <input
                  id="discountName"
                  type="text"
                  value={discountName}
                  onChange={(e) => setDiscountName(e.target.value)}
                  required
                  placeholder="Discount Name"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {discountItems.map((item, index) => (
            <div
              key={index}
              className="mb-6  border border-gray-100 bg-white rounded-2xl shadow-md"
            >
              <div className="flex bg-[#EEE] rounded-t-2xl py-2 px-4 justify-between">
                <h4 className="text-md font-semibold ">Item {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <FaTrash size={18} />
                </button>
              </div>

              <div className="flex gap-5 p-4">
                <div className="w-full">
                  <label htmlFor={`discountItem-${index}`}>Discount Item</label>
                  <select
                    id={`discountItem-${index}`}
                    value={item.discountItem}
                    onChange={(e) => handleItemChange(index, 'discountItem', e.target.value)}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                  >
                    <option value="">Select Discount Item</option>
                    <option value="Desk Fee">Desk Fee</option>
                    <option value="Commission Split">Commission Split</option>
                    <option value="Buy/Sale Admin Fees">Buy/Sale Admin Fees</option>
                    <option value="Lease Admin Fees">Lease Admin Fees</option>
                    <option value="Authentisign">Authentisign</option>
                    <option value="DVREALTY Email">DVREALTY Email</option>
                    <option value="500 Business Cards">500 Business Cards</option>
                    <option value="1 ANS Lock Box">1 ANS Lock Box</option>
                    <option value="Transection Cap Fee">Transection Cap Fee</option>
                  </select>
                </div>

                <div className="w-full">
                  <label htmlFor={`discountType-${index}`}>Discount Type</label>
                  <select
                    id={`discountType-${index}`}
                    value={item.discountType}
                    onChange={(e) => handleItemChange(index, 'discountType', e.target.value)}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="">Select Type</option>
                    <option value="Yearly">Yearly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Once">One Time</option>
                    <option value="Date Range">Date Range</option>
                  </select>
                </div>

                {item.discountType && item.discountType !== "Date Range" && (
                  <div className="w-full">
                    <label htmlFor={`duration-${index}`}>
                      {item.discountType === "Yearly" && "Number of Years"}
                      {item.discountType === "Monthly" && "Number of Months"}
                      {item.discountType === "Weekly" && "Number of Weeks"}
                      {item.discountType === "Once" && "One Time"}
                    </label>
                    <input
                      id={`duration-${index}`}
                      type="number"
                      value={item.discountType === "Once" ? 1 : item.duration}
                      onChange={(e) => handleItemChange(index, 'duration', parseInt(e.target.value))}
                      min={1}
                      max={
                        item.discountType === "Yearly" ? 10 :
                        item.discountType === "Monthly" ? 12 :
                        item.discountType === "Weekly" ? 52 : 1
                      }
                      disabled={item.discountType === "Once"}
                      required
                      className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                    />
                  </div>
                )}

                {item.discountType === "Date Range" && (
                  <div className="w-full flex gap-4">
                    <div className="w-1/2">
                      <label
                        htmlFor={`startDate-${index}`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        Start Date
                      </label>
                      <input
                        id={`startDate-${index}`}
                        type="date"
                        value={item.startDate}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "startDate",
                            e.target.value
                          )
                        }
                        required
                        className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                      />
                    </div>

                    <div className="w-1/2">
                      <label
                        htmlFor={`endDate-${index}`}
                        className="block text-sm font-medium text-gray-700"
                      >
                        End Date
                      </label>
                      <input
                        id={`endDate-${index}`}
                        type="date"
                        value={item.endDate}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "endDate",
                            e.target.value
                          )
                        }
                        required
                        className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
                <div className="w-full">
                  <label htmlFor={`discountMethod-${index}`}>Discount Method</label>
                  <select
                    id={`discountMethod-${index}`}
                    value={item.discountMethod}
                    onChange={(e) => handleItemChange(index, 'discountMethod', e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                  >
                    <option value="">Select Method</option>
                    <option value="Amount">Fixed Amount</option>
                    <option value="Percentage">Percentage</option>
                  </select>
                </div>

                {item.discountMethod && (
                  <div className="w-full">
                    <label htmlFor={`discountValue-${index}`}>
                      {item.discountMethod === "Amount" ? "Discount Amount ($)" : "Discount Percentage (%)"}
                    </label>
                    <input
                      id={`discountValue-${index}`}
                      type="number"
                      value={item.discountValue}
                      onChange={(e) => handleItemChange(index, 'discountValue', parseFloat(e.target.value))}
                      min={0}
                      max={item.discountMethod === "Percentage" ? 100 : undefined}
                      step={0.01}
                      required
                      placeholder={item.discountMethod === "Amount" ? "Enter amount" : "Enter percentage (0-100)"}
                      className="block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex bg-white px-4 py-4 rounded-2xl justify-between items-center">
          <button
            type="button"
            onClick={handleAddItem}
            className="primary-btn mr-2 flex items-center gap-1"
          >
            <FaPlus className="text-white" />
            ADD ITEM
          </button>
          <div className="flex">
            <Link to={`/dashboard/super-admin/discount-management`}>
              <button type="submit" className="btn-common-outline mr-3">
                Go Back
              </button>
            </Link>

            <button type="submit" className="primary-btn">
              Create Discount
            </button>
          </div>
        </div>

        {message && <p className="text-green-600">{message}</p>}
        {error && <p className="text-red-600">{error}</p>}
      </form>
    </div>
  );
};

export default CreateCustomDiscount;
