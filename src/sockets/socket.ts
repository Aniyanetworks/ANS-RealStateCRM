import { io, Socket } from "socket.io-client";
import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { baseUrl } from "../utils/constant";

const SOCKET_URL = baseUrl.replace(/\/$/, '');

const DEMO_NO_SOCKET = true as boolean;

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

  const connectSocket = useCallback(() => {
    if (DEMO_NO_SOCKET) return;
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

      newSocket.on("connect", () => {
        newSocket.emit("addNewUser", { userId: user.id });
      });

      newSocket.on("disconnect", () => {
      });

      newSocket.on("updateActiveUsers", (users: number[]) => {
        setActiveUsers(users);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Connection Error:", error.message);
      });

      setSocket(newSocket);
    }
  }, [socket, config]);

  const disconnectSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [socket]);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, [disconnectSocket]);

  return { socket, connectSocket, disconnectSocket, activeUsers };
};
