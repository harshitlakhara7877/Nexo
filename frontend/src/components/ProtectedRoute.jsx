import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F6F3] dark:bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="size-12 animate-pulse">
            <img src="/logo.png" alt="Nexo" className="size-full object-contain" />
          </div>
          <p className="text-sm font-medium text-[#FF4D00]">Loading Nexo...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;