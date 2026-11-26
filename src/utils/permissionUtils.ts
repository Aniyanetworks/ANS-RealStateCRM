// @ts-nocheck
// eslint-disable @typescript-eslint/no-explicit-any

import { useAppSelector } from "../redux/hooks";

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

export const usePermissions = () => {
  const { user } = useAppSelector((state) => state.user);

  const hasPermissionForSlug = (permissionSlug: string): boolean => {
    if (!user?.userRole || user?.userRole?.permissions.length === 0) {
      return true;
    }
    return user?.userRole?.permissions.some(
      (permission) => permission?.permission?.slug === permissionSlug
    );
  };

  return { hasPermissionForSlug };
};
