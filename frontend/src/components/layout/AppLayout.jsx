import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

// import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import MessagePill from "@/components/message/MessagePill";
import socket from "@/services/socket";
import Sidebar from "./Sidebar";

const AppLayout = () => {
  const { pathname } = useLocation();

  const isExplore = pathname === "/explore";
  const isMessages = pathname === "/messages";

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);

  useEffect(() => {
    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
    };

    const handleConnectError = (error) => {
      console.error(
        "Socket connection failed:",
        error.message,
      );
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] dark:bg-black">
      <Sidebar
        notificationsOpen={notificationsOpen}
        onNotificationsClick={() => {
          setNotificationsOpen(true);
        }}
      />

      <div className="flex min-h-screen w-full min-w-0 md:pl-[72px]">
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>

        {!isExplore && !isMessages && <RightSidebar />}
      </div>

      {notificationsOpen && (
        <NotificationPanel
          onClose={() => setNotificationsOpen(false)}
        />
      )}

      <MessagePill />
    </div>
  );
};

export default AppLayout;