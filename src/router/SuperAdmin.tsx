import { ReactNode } from "react";
import { useAppSelector } from "../redux/hooks";
import { Navigate, useLocation } from "react-router-dom";

const SuperAdmin = ({ children }: { children: ReactNode }) => {
  const { accessToken,user } = useAppSelector((state) => state.user);

  const location = useLocation();

  if (accessToken) {
    if (user && (user.userType === "superAdmin")) {
        return children;
    }
  }
  return <Navigate to={"/"} state={{ from: location }} replace />;
};

export default SuperAdmin;

