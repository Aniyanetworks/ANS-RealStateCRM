import React, { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppDispatch } from "../redux/hooks";
import { useUserLogoutMutation } from "../redux/api/userSlice";
import { clearUser } from "../redux/slices/userSlice";
import { api } from "../redux/api/apiSlice";

interface InactivityLogoutProps {
  timeout?: number;
}

const InactivityLogout: React.FC<InactivityLogoutProps> = ({
  timeout = 30 * 60 * 1000,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [userLogout] = useUserLogoutMutation();
  const timer = useRef<NodeJS.Timeout | null>(null);
  const logoutInProgress = useRef(false);

  const resetTimer = useCallback(() => {
    const now = Date.now().toString();
    localStorage.setItem("lastActivity", now);
  }, []);

  const handleLogout = useCallback(async () => {
    if (logoutInProgress.current) return;
    logoutInProgress.current = true;
    
    try {
      await userLogout("").unwrap();
      toast.error("Login session expired!");
    } catch (error: any) {
      toast.error("Login session expired!");
    }
    
    dispatch(api.util.resetApiState());
    dispatch(clearUser());

    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("lastActivity");

    logoutInProgress.current = false;
    navigate("/login");
  }, [userLogout, dispatch, navigate]);

  useEffect(() => {
    resetTimer();

    const checkInactivity = () => {
      const lastActivity = parseInt(localStorage.getItem("lastActivity") || "0", 10);
      if (Date.now() - lastActivity > timeout) {
        handleLogout();
      }
    };

    const activityHandler = () => resetTimer();
    
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    
    events.forEach(event => {
      window.addEventListener(event, activityHandler);
    });

    timer.current = setInterval(checkInactivity, 10000);

    const storageListener = (event: StorageEvent) => {
      if (event.key === "lastActivity") {
        if (timer.current) {
          clearInterval(timer.current);
        }
        timer.current = setInterval(checkInactivity, 10000);
      }
    };
    
    window.addEventListener("storage", storageListener);

    return () => {
      if (timer.current) clearInterval(timer.current);
      
      events.forEach(event => {
        window.removeEventListener(event, activityHandler);
      });
      
      window.removeEventListener("storage", storageListener);
    };
  }, [timeout, resetTimer, handleLogout]);

  return null;
};

export default InactivityLogout;