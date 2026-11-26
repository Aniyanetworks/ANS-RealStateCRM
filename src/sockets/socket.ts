import { io, Socket } from "socket.io-client";
import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { baseUrl } from "../utils/constant";

const SOCKET_URL = baseUrl.replace(/\/$/, ''); // Backend URL
// const SOCKET_URL = "http://localhost:4000"; 

interface SocketConfig {
  options?: {
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    reconnectionDelayMax?: number;
    randomizationFactor?: number;
    auth?: {
      token?: string;
    };
  };
}

export const useSocket = (config: SocketConfig = {}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeUsers, setActiveUsers] = useState<number[]>([]);
  const { user } = useSelector((state: any) => state.user);

  // Initialize and connect the socket
  const connectSocket = useCallback(() => {
    if (!socket) {
      const newSocket = io(SOCKET_URL, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        auth: {
          token: localStorage.getItem("accessToken") || "",
          ...config.options?.auth,
        },
        ...config.options,
      });

      // Listen for connection
      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
        newSocket.emit("addNewUser", { userId: user.id });
      });

      // Listen for disconnection
      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      // Listen for active users
      newSocket.on("updateActiveUsers", (users: number[]) => {
        console.log("Received active users:", users);
        setActiveUsers(users);
      });

      // Handle connection errors
      newSocket.on("connect_error", (error) => {
        console.error("Connection Error:", error.message);
      });

      setSocket(newSocket);
    }
  }, [socket, config]);

  // Disconnect the socket
  const disconnectSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      console.log("Socket disconnected");
    }
  }, [socket]);

  // Cleanup the socket connection on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, [disconnectSocket]);

  return { socket, connectSocket, disconnectSocket, activeUsers };
};
