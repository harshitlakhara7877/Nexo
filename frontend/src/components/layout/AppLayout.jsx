import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

const AppLayout = () => {
  const { pathname } = useLocation();
  const isExplore = pathname === "/explore";
  const isMessages = pathname === "/messages";

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
