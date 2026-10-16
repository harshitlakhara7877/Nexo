import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";
import { useEffect } from "react";
import socket from "@/services/socket";

const AppLayout = () => {
  const { pathname } = useLocation();
  const isExplore = pathname === "/explore";
  const isMessages = pathname === "/messages";

  useEffect(() => {
  const handleConnect = () => {
    console.log("Socket connected:", socket.id);
  };

  const handleConnectError = (error) => {
    console.error("Socket connection failed:", error.message);
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
    <div className="min-h-screen w-full bg-[#fafafa]">
      <Sidebar />

      {/* Main page content */}
      <div className="flex min-h-screen w-full min-w-0 md:pl-[72px]">
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>

        {!isExplore && !isMessages && <RightSidebar />}
      </div>
    </div>
  );
};

export default AppLayout;
