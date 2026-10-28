import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { getUnreadNotificationCount } from "@/services/notificationService";
import socket from "@/services/socket";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await getUnreadNotificationCount();

      if (response?.success) {
        setUnreadCount(Math.max(0, Number(response.unreadCount) || 0));
      }
    } catch (error) {
      console.error("Refresh notification count error:", error);
    }
  }, []);

  useEffect(() => {
    let active = true;

    getUnreadNotificationCount()
      .then((response) => {
        if (active && response?.success) {
          setUnreadCount(Math.max(0, Number(response.unreadCount) || 0));
        }
      })
      .catch((error) => {
        if (active) {
          console.error("Load notification count error:", error);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleNewNotification = (payload = {}) => {
      const nextUnreadCount = payload.unreadCount;

      if (
        typeof nextUnreadCount === "number" &&
        Number.isFinite(nextUnreadCount)
      ) {
        setUnreadCount(Math.max(nextUnreadCount, 0));
      }
    };

    const handleNotificationRead = (payload = {}) => {
      if (typeof payload.unreadCount === "number") {
        setUnreadCount(Math.max(0, payload.unreadCount));
      } else {
        refreshUnreadCount();
      }
    };

    // handle when network connectivity breaks to one user and other user send some notification
    const handleSocketConnect = () => {
      refreshUnreadCount();
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("notification:read", handleNotificationRead);
    socket.on("connect", handleSocketConnect);
    
    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:read", handleNotificationRead);
      socket.off("connect", handleSocketConnect);
    };
  }, [refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        setUnreadCount,
        refreshUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNoti = () => useContext(NotificationContext);
