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
  timeout = 30 * 60 * 1000, // Default to 20 minutes
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [userLogout] = useUserLogoutMutation();
  const timer = useRef<NodeJS.Timeout | null>(null);
  const logoutInProgress = useRef(false);

  // Store activity time and broadcast to other tabs
  const resetTimer = useCallback(() => {
    const now = Date.now().toString();
    localStorage.setItem("lastActivity", now);
    // This will trigger the storage event in other tabs
  }, []);

  const handleLogout = useCallback(async () => {
    // Prevent multiple simultaneous logout calls
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
    // Store initial activity time
    resetTimer();

    // Function to check for inactivity
    const checkInactivity = () => {
      const lastActivity = parseInt(localStorage.getItem("lastActivity") || "0", 10);
      if (Date.now() - lastActivity > timeout) {
        handleLogout();
      }
    };

    // Monitor user activity and reset the timer
    const activityHandler = () => resetTimer();
    
    // Events to track user activity
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    
    events.forEach(event => {
      window.addEventListener(event, activityHandler);
    });

    // Set an interval to check for inactivity
    timer.current = setInterval(checkInactivity, 10000); // Check every 10 seconds

    // Sync activity across tabs using the 'storage' event
    const storageListener = (event: StorageEvent) => {
      if (event.key === "lastActivity") {
        // Reset our timer when we detect activity in another tab
        if (timer.current) {
          clearInterval(timer.current);
        }
        timer.current = setInterval(checkInactivity, 10000);
      }
    };
    
    window.addEventListener("storage", storageListener);

    // Cleanup
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