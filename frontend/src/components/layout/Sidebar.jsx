import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  Heart,
  MessageCircle,
  Bookmark,
  User,
  LogOut,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    {
      name: "Home",
      path: "/home",
      icon: Home,
    },
    {
      name: "Explore",
      path: "/explore",
      icon: Search,
    },
    {
      name: "Notifications",
      path: "/notifications",
      icon: Heart,
    },
    {
      name: "Messages",
      path: "/messages",
      icon: MessageCircle,
    },
    {
      name: "Bookmarks",
      path: "/bookmarks",
      icon: Bookmark,
    },
    {
      name: "Profile",
      path: "/profile",
      icon: User,
    },
  ];

  return (
    <div className="fixed top-0 left-0  flex h-screen w-64 flex-col border-r bg-white px-5 py-6">
      {/* Logo */}
      <NavLink
        to="/home"
        className="mb-10 px-3 text-3xl font-bold text-[#FF4D00]"
      >
        Nexo
      </NavLink>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-orange-50 text-[#FF4D00]"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              <Icon size={21} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="mb-4 flex items-center gap-3 rounded-xl px-3 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-semibold text-[#FF4D00]">
          {user?.username?.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {user?.name || user?.username}
          </p>

          <p className="truncate text-xs text-gray-500">
            @{user?.username}
          </p>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-red-500"
      >
        <LogOut size={21} />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default Sidebar;