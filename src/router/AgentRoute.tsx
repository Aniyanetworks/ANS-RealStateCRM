import { ReactNode } from "react";
import { useAppSelector } from "../redux/hooks";
import { Navigate, useLocation } from "react-router-dom";

const AgentRoute = ({ children }: { children: ReactNode }) => {
  const { accessToken,user } = useAppSelector((state) => state.user);

  const location = useLocation();

  if (accessToken) {
    if (user && (user.userType === "agent")) {
        return children;
    }
  }
  return <Navigate to={"/login"} state={{ from: location }} replace />;
};

export default AgentRoute;

// this is the wrapper  component to protect all route
