// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import {
  useEffect,
  useState,
} from 'react';

import {
  Button,
  Modal,
} from 'antd';
import toast from 'react-hot-toast';
import {
  FaEdit,
  FaPlusCircle,
  FaTrash,
} from 'react-icons/fa';
import {
  Link,
  useNavigate,
} from 'react-router-dom';

import TableLoader from '../../../../../components/loader/TableLoader';
import {
  useDeleteSingleDiscountMutation,
  useGetDiscountListDataQuery,
} from '../../../../../redux/api/superadmin/discount-management/discountManagementSlice';
import { usePermissions } from '../../../../../utils/permissionUtils';

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
  discountItems: DiscountItem[];
}

const DiscountManagement = () => {
  const { hasPermissionForSlug } = usePermissions();
  const navigate = useNavigate();
  
  // States
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<string | null>(null);

  // API Hooks
  const { data, isLoading } = useGetDiscountListDataQuery('');
  const [deleteDiscount] = useDeleteSingleDiscountMutation();

  useEffect(() => {
    if (data?.data?.discounts) {
      setDiscounts([...data.data.discounts].sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, [data]);

  // Handlers
  const showDeleteConfirm = (id: string) => {
    setDiscountToDelete(id);
    setIsModalVisible(true);
  };

  const handleDeleteCancel = () => {
    setIsModalVisible(false);
    setDiscountToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (discountToDelete) {
      try {
        await deleteDiscount(discountToDelete).unwrap();
        toast.success('Discount deleted successfully!');
        handleDeleteCancel();
      } catch (error) {
        toast.error('Failed to delete discount');
        console.error('Delete error:', error);
      }
    }
  };

  if (isLoading) {
    return <TableLoader />;
  }

  return (
    <div className="pb-32">
      <div className="flex items-center justify-between mb-5">
        <div>
          <button
            onClick={() => navigate("/dashboard/super-admin/plan-management")}
            className="ml-2 px-4 py-2 rounded-md bg-gray-200"
          >
            Go Back to Plans
          </button>
        </div>
        
        <div className="flex justify-between items-center">
          {/* {hasPermissionForSlug("create-discounts") && ( */}
            <Link
              to="/dashboard/super-admin/discount-management/create-custom"
              className="text-[16px] hover:text-primaryPurple duration-100"
            >
              <button className="primary-btn flex items-center gap-1 mx-3">
                <FaPlusCircle className="text-lg" />
                Create Discount
              </button>
            </Link>
          {/* )} */}
        </div>
      </div>

      <div className="mx-auto p-6 bg-white rounded-md shadow-sm">
        {discounts.length === 0 ? (
          <p>No discounts available.</p>
        ) : (
          <ul className="space-y-4">
            {discounts.map((discount, index) => (
              <li key={discount.id} className="border border-gray-300 rounded-sm p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className=" font-semibold">
                    {index + 1}. {discount.name}
                  </h3>
                  <div className="space-x-4 flex items-center">
                    {/* {hasPermissionForSlug("edit-discounts") && ( */}
                      <Link to={`/dashboard/super-admin/discount-management/edit/${discount.uuid}`}>
                        <FaEdit className="text-blue-600 hover:text-blue-700 cursor-pointer" />
                      </Link>
                    {/* )} */}
                    {/* {hasPermissionForSlug("delete-discounts") && ( */}
                      <FaTrash
                        className="text-red-600 hover:text-red-700 cursor-pointer"
                        onClick={() => showDeleteConfirm(discount.id)}
                      />
                    {/* )} */}
                  </div>
                </div>

                <ul className="list-disc pl-5 space-y-2">
                  {discount.discountItems.map((item, itemIndex) => {
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
                      <li key={itemIndex} className="text-sm">
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
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Delete"
        open={isModalVisible}
        onCancel={handleDeleteCancel}
        footer={[
          <Button key="cancel" onClick={handleDeleteCancel}>
            Cancel
          </Button>,
          <Button key="delete" type="primary" danger onClick={handleDeleteConfirm}>
            Delete
          </Button>,
        ]}
      >
        <p>Are you sure you want to delete this discount?</p>
      </Modal>
    </div>
  );
};

export default DiscountManagement;