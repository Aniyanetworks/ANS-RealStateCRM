import React, { ReactNode } from "react";
import { useAppSelector } from "../redux/hooks";
import { Navigate} from "react-router-dom";

interface PermissionType {
  permission: String[];
  userTypePermission: String[];
  children: ReactNode;
  user: any;
}

const hasPermissionForSlug = (permissionSlug: String[], userTypePermission: String[], user: any): boolean => {
    const permissionSlugs = Array.isArray(permissionSlug) ? permissionSlug : [permissionSlug];

  if ((!user?.userRole || user?.userRole?.permissions.length === 0) || permissionSlugs.length === 0) {
    const isPermission = userTypePermission.some((type)=> type == user.userType);

    return isPermission;
  }
  else
  {
    return permissionSlugs?.some((slug) =>
        user?.userRole?.permissions.some(
            (permission: any) => permission?.permission?.slug === slug
        )
    );
  }
};
const PermissonRoute: React.FC<PermissionType> = ({ children, permission, userTypePermission }) => {
  const { user } = useAppSelector((state) => state.user);
  const isPermission = hasPermissionForSlug(permission, userTypePermission, user);

  if(isPermission)
  {
    return children;
  }
  else
  {
     return <Navigate to={"/"} />;
  }
};
export default PermissonRoute;
