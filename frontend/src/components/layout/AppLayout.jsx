import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

const AppLayout = () => {
  const { pathname } = useLocation();
  const isExplore = pathname === "/explore";

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="flex min-h-screen w-full">
        {isExplore ? (
          /*
           * EXPLORE:
           * Sidebar hidden initially.
           * Hover over the far-left edge to reveal it.
           */
          <div className="group fixed inset-y-0 left-0 z-[100] w-3">
            <aside
              className="
                absolute inset-y-0 left-0 w-64
                -translate-x-full
                transition-transform duration-200 ease-in-out
                group-hover:translate-x-0
                group-focus-within:translate-x-0
              "
            >
              <Sidebar isFixed={false} />
            </aside>
          </div>
        ) : (
          <Sidebar />
        )}

        {/* Main page content */}
        <main className="min-w-0 ml-50 flex-1">
          <Outlet />
        </main>

        {/* Hide the right sidebar on Explore */}
        {!isExplore && <RightSidebar />}
      </div>
    </div>
  );
};

export default AppLayout;