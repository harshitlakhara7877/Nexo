import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto flex max-w-[1440px]">
        {/* Left */}
        <Sidebar />

        {/* Main */}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>

        {/* Right */}
        <RightSidebar />
      </div>
    </div>
  );
};

export default AppLayout;