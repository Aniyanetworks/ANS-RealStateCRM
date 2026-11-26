// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any

import { useAppSelector } from "../redux/hooks";

// Define interfaces for permission and user structure
export interface Permission {
  permission: {
    slug: string;
  };
}

export interface UserRole {
  permissions: Permission[];
}

export interface User {
  userRole?: UserRole;
}

// Custom hook to check if the user has the specified permission based on the slug
export const usePermissions = () => {
  const { user } = useAppSelector((state) => state.user); // Access user from Redux state

  // Utility function to check if the user has permission for the provided slug
  const hasPermissionForSlug = (permissionSlug: string): boolean => {
    if (!user?.userRole || user?.userRole?.permissions.length === 0) {
      return true; // Default behavior if no permissions are defined
    }
    // console.log(' user.userRole.', user.userRole)
    return user?.userRole?.permissions.some(
      (permission) => permission?.permission?.slug === permissionSlug
    );
  };

  return { hasPermissionForSlug };
};
