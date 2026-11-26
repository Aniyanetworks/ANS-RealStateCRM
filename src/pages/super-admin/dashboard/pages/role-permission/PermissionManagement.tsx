/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any
import type { TableProps } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import "react-quill-new/dist/quill.snow.css";
import { NavLink, useParams } from "react-router-dom";
import {
  useCreatePermissionMutation,
  useGetPermissionListQuery,
} from "../../../../../redux/api/superadmin/permissionManagementSlice";
import {
  useGetRoleListQuery,
  useGetSingleRoleQuery,
} from "../../../../../redux/api/superadmin/roleManagementSlice";
type TableRowSelection<T extends object = object> =
  TableProps<T>["rowSelection"];
interface DataType {
  key?: React.Key;
  name: string;
  userType: string;
  status: string;
  uuid: string;
}
const PermissionManagement = () => {
  const [uuid, setUuid] = useState(null); // Track selected role UUID
  const { uuid: getUuid } = useParams(); // Get the uuid from URL params (optional)

  useEffect(() => {
    if (getUuid) {
      setUuid(getUuid); // Set the uuid state if it's available
    }
  }, [getUuid]); // Dependency array: triggers when getUuid changes
  const { uuid: selectedUuid } = useParams(); // Get the uuid from URL params (optional)
  const [permissionData, setPermissionData] = useState([]);
  const { data, isLoading, refetch } = useGetPermissionListQuery(uuid);
  const {
    data: roleData,
    isLoading: roleIsLoading,
    refetch: roleRefetch,
  } = useGetSingleRoleQuery(uuid);
  const {
    data: selectedRoleData,
    isLoading: selectedRoleIsLoading,
    refetch: selectedRoleRefetch,
  } = useGetSingleRoleQuery(selectedUuid);
  const {
    data: getRoleListData,
    isLoading: getRoleListIsLoading,
    refetch: getRoleListRefetch,
  } = useGetRoleListQuery("");
  const [roleListData, setRoleListData] = useState<DataType[]>([]);
  const [createPermission] = useCreatePermissionMutation();
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [roleWisePermissions, setRoleWisePermissions] = useState({});
  const [selectAllCategories, setSelectAllCategories] = useState(false);

  useEffect(() => {
    setPermissionData(data?.data?.permissions || []);
    setRoleWisePermissions(roleData?.data?.role?.permissions || []);
  }, [data, roleData]);

  useEffect(() => {
    setRoleListData(getRoleListData?.data?.roles || []);
    setPermissionData(data?.data?.permissions || []);
    // const permissions = roleData?.data?.role?.permissions || [];

    let permissions = "";

    if (roleData?.data?.role?.permissions.length != 0) {
      permissions = roleData?.data?.role?.permissions || [];
    } else {
      permissions = roleData?.data?.role?.importRole?.permissions || [];
    }

    // Check if roleWisePermissions is an array
    if (Array.isArray(permissions)) {
      setRoleWisePermissions(permissions);
    } else {
      // If not an array, set it as an empty array or handle it differently
      setRoleWisePermissions([]);
    }
  }, [data, roleData, roleListData]);

  useEffect(() => {
    // Only proceed if roleWisePermissions is an array
    if (Array.isArray(roleWisePermissions)) {
      const initialSelectedPermissions = {};
      roleWisePermissions.forEach((permission) => {
        const categoryId = permission.permission.category.id; // Assuming category is part of permission
        if (!initialSelectedPermissions[categoryId]) {
          initialSelectedPermissions[categoryId] = [];
        }
        initialSelectedPermissions[categoryId].push(permission.permissionId); // Assuming permissionId is part of permission
      });

      setSelectedPermissions(initialSelectedPermissions);
    }
  }, [roleWisePermissions]);

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit,
    setValue,
  } = useForm();

  // Handle selecting/deselecting all permissions in a category
  const handleSelectAll = (categoryId) => {
    const categoryPermissions = permissionData.filter(
      (permission) => permission.category.id === categoryId
    );
    setSelectedPermissions((prevState) => ({
      ...prevState,
      [categoryId]: categoryPermissions.map((permission) => permission.id),
    }));
  };

  const handleDeselectAll = (categoryId) => {
    setSelectedPermissions((prevState) => ({
      ...prevState,
      [categoryId]: [],
    }));
  };

  // Handle selecting/deselecting a specific permission
  const handleCheckboxChange = (categoryId, permissionId) => {
    setSelectedPermissions((prevState) => {
      const categoryPermissions = prevState[categoryId] || [];
      if (categoryPermissions.includes(permissionId)) {
        return {
          ...prevState,
          [categoryId]: categoryPermissions.filter((id) => id !== permissionId),
        };
      } else {
        return {
          ...prevState,
          [categoryId]: [...categoryPermissions, permissionId],
        };
      }
    });
  };

  // Handle global select/deselect all categories
  const handleSelectAllCategories = () => {
    setSelectAllCategories(!selectAllCategories);
    permissionData.forEach((permission) => {
      const categoryId = permission.category.id;
      if (selectAllCategories) {
        handleDeselectAll(categoryId);
      } else {
        handleSelectAll(categoryId);
      }
    });
  };

  // On form submission, prepare the data
  const onSubmit = async () => {
    // Flatten selectedPermissions and map the category IDs to an array of permission IDs
    const permissionIds = Object.values(selectedPermissions).flat();

    const dataToSubmit = {
      roleId: selectedRoleData?.data?.role?.id,
      permissions: permissionIds, // Flattened permission IDs
    };

    try {
      const response = await createPermission(dataToSubmit);

      if (response?.error?.data?.status === false) {
        toast.error(response?.error.data?.message);
      } else if (response?.data?.status === true) {
        toast.success(response?.data?.message);
      } else {
        toast.error("Unknown error occurred");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to save permissions");
    }
  };

  const handleRoleChange = (roleUuid) => {
    setUuid(roleUuid);
  };

  return (
    <div className="pb-32">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mx-auto">
          <div className="flex flex-col justify-between items-center mb-5 p-3 bg-white shadow-lg rounded-lg">
            {/* Top Section: Manage Permissions */}
            {selectedRoleData?.data?.role?.isDefault == "no" ? (
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Manage Permissions
              </h2>
            ) : (
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                View Permissions
              </h2>
            )}

            {/* Select Role Section */}
            <div className="flex flex-col md:flex-row justify-between items-center w-full ">
              {selectedRoleData?.data?.role?.isDefault == "no" && (
                <>
                  <div className="flex items-center space-x-4 ">
                    <span className="font-normal text-gray-700 whitespace-nowrap">
                      Import Role Form
                    </span>
                    <select
                      {...register("roleId")}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#243451] focus:border-[#243451] shadow-sm"
                    >
                      <option value="">Select Role Type</option>
                      {roleListData?.map((role) => (
                        <option
                          key={role.uuid}
                          value={role.uuid}
                          selected={
                            role.uuid === roleData?.data?.role?.importRole?.uuid
                          }
                        >
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              {/* Bottom Section: Role Display */}
              <div className="flex justify-center items-center mt-auto">
                <h2 className="text-center font-bold text-white bg-[#243451] p-2 rounded-lg shadow-md ml-0 md:ml-4">
                  Role:{" "}
                  <span className="font-normal">
                    {selectedRoleData?.data?.role?.name}
                  </span>
                </h2>
              </div>

              {/* Save Changes Button */}
              <div className="flex items-center justify-center space-x-4 mt-4 md:mt-0">
                {selectedRoleData?.data?.role?.isDefault == "no" && (
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#243451] text-white rounded-md hover:bg-[#9F8667] transition-all duration-300"
                  >
                    Save Changes
                  </button>
                )}
                <NavLink
                  to={`/dashboard/super-admin/role-permission/role-management`}
                  className="px-6 py-2 bg-[#243451] text-white rounded-md hover:bg-[#9F8667] transition-all duration-300"
                >
                  Go Back
                </NavLink>
              </div>
            </div>
          </div>

          {/* Select/Deselect All Categories */}
          {selectedRoleData?.data?.role?.isDefault == "no" && (
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                checked={selectAllCategories}
                onChange={handleSelectAllCategories}
                className="mr-2"
              />
              <span className="font-semibold">
                Select/Deselect All Categories
              </span>
            </div>
          )}

          {/* Render permission categories with checkboxes in a grid layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {permissionData.length > 0 &&
              [
                ...new Set(
                  permissionData.map((permission) => permission.category.id)
                ),
              ] // Extract unique category IDs
                .map((categoryId) => {
                  const categoryPermissions = permissionData.filter(
                    (permission) => permission.category.id === categoryId
                  );
                  const category = categoryPermissions[0]?.category; // Since category is the same for all permissions in the category

                  // Check if all permissions in the category are selected
                  const isAllSelected = categoryPermissions.every(
                    (permission) =>
                      selectedPermissions[categoryId]?.includes(permission.id)
                  );

                  return (
                    <div
                      key={categoryId}
                      className="border rounded-lg p-4 bg-white shadow-md"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={() =>
                              isAllSelected
                                ? handleDeselectAll(categoryId)
                                : handleSelectAll(categoryId)
                            }
                            disabled={
                              selectedRoleData?.data?.role?.isDefault == "yes"
                            }
                            className="mr-2"
                          />
                          <span className="font-semibold text-lg">
                            {category?.name}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {categoryPermissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center"
                          >
                            <input
                              type="checkbox"
                              disabled={
                                selectedRoleData?.data?.role?.isDefault == "yes"
                              }
                              checked={selectedPermissions[
                                categoryId
                              ]?.includes(permission.id)}
                              onChange={() =>
                                handleCheckboxChange(categoryId, permission.id)
                              }
                              className="mr-2"
                            />
                            <span>{permission.shortName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
          </div>

          <div className="mt-6 flex justify-center">
            {selectedRoleData?.data?.role?.isDefault == "no" && (
              <button
                type="submit"
                className="px-6 py-2 bg-[#243451] 0 text-white rounded-md hover:bg-[#9F8667] transition"
              >
                Save Changes
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default PermissionManagement;
