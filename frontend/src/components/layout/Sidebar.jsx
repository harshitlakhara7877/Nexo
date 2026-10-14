import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  Heart,
  MessageCircle,
  Bookmark,
  User,
  LogOut,
  PlusSquare,
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
      name: "Create",
      path: "/create",
      icon: PlusSquare,
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
      name: "Profile",
      path: "/profile",
      icon: User,
    },
  ];

  return (
    <div
      className="
        group/sidebar fixed left-0 top-0 z-50
        flex h-dvh w-[72px] flex-col
        overflow-hidden
        bg-[#F7F6F3] px-2 py-6
        transition-[width] duration-200 ease-in-out
        hover:w-64
      "
    >
      {/* Logo */}
      <NavLink
        to="/home"
        aria-label="Nexo home"
        className="
          mb-20 flex h-11 shrink-0 items-center
          justify-center gap-0 
          group-hover/sidebar:justify-start
          group-hover/sidebar:gap-3 
          group-hover/sidebar:px-5
          group-focus-within/sidebar:justify-start
          group-focus-within/sidebar:gap-3
          group-focus-within/sidebar:px-4
        "
      >
        <span
          className="
            flex size-9 shrink-0 items-center justify-center
            rounded-xl bg-[#FFF0E8]
            text-xl font-extrabold text-[#FF4D00]
          "
        >
          N
        </span>

        <span
          className="
            max-w-0 overflow-hidden whitespace-nowrap
            text-2xl font-bold text-[#FF4D00] opacity-0
            transition-[max-width,opacity] duration-200
            group-hover/sidebar:max-w-40
            group-hover/sidebar:opacity-100
            group-focus-within/sidebar:max-w-40
            group-focus-within/sidebar:opacity-100
          "
        >
          Nexo
        </span>
      </NavLink>

      {/* Navigation */}
      <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              title={item.name}
              className={({ isActive }) =>
                `
                  flex h-12 w-full shrink-0 items-center
                  justify-center gap-0 overflow-hidden
                  rounded-xl px-0 py-3 text-sm font-medium
                  transition-colors
                  group-hover/sidebar:justify-start
                  group-hover/sidebar:gap-4
                  group-hover/sidebar:px-4
                  ${
                    isActive
                      ? "bg-orange-50 text-[#FF4D00]"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }
                `
              }
            >
              <Icon size={21} className="shrink-0" />

              <span
                className="
                  max-w-0 overflow-hidden whitespace-nowrap opacity-0
                  transition-[max-width,opacity] duration-200
                  group-hover/sidebar:max-w-40
                  group-hover/sidebar:opacity-100
                "
              >
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div
        className="
          mb-4 flex h-14 shrink-0 items-center
          justify-center gap-0 overflow-hidden
          rounded-xl px-0 py-3
          transition-all duration-200
          group-hover/sidebar:justify-start
          group-hover/sidebar:gap-3
          group-hover/sidebar:px-3
        "
      >
        <div
          className="
            flex size-10 shrink-0 items-center justify-center
            rounded-full bg-orange-100 font-semibold
            text-[#FF4D00]
          "
        >
          {user?.username?.charAt(0).toUpperCase()}
        </div>

        <div
          className="
            max-w-0 overflow-hidden whitespace-nowrap opacity-0
            transition-[max-width,opacity] duration-200
            group-hover/sidebar:max-w-40
            group-hover/sidebar:opacity-100
          "
        >
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
        type="button"
        onClick={handleLogout}
        title="Logout"
        className="
          flex h-12 w-full shrink-0 items-center
          justify-center gap-0 overflow-hidden
          rounded-xl px-0 py-3 text-sm font-medium
          text-gray-600 transition
          hover:bg-gray-50 hover:text-red-500
          group-hover/sidebar:justify-start
          group-hover/sidebar:gap-4
          group-hover/sidebar:px-4
        "
      >
        <LogOut size={21} className="shrink-0" />

        <span
          className="
            max-w-0 overflow-hidden whitespace-nowrap opacity-0
            transition-[max-width,opacity] duration-200
            group-hover/sidebar:max-w-40
            group-hover/sidebar:opacity-100
          "
        >
          Logout
        </span>
      </button>
    </div>
  );
};

export default Sidebar;