import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Search,
  Bell,
  MessageCircle,
  User,
  LogOut,
  PlaySquare,
  CircleFadingPlusIcon,
  Menu,
  Settings as SettingsIcon,
  Bookmark,
  Moon,
  Sun,
  AlertCircle,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../../context/AuthContext";
import { useNoti } from "@/context/NotificationContext";
import { useTheme } from "@/context/ThemeContext";
import ReportProblemDialog from "./ReportProblemDialog";

const Sidebar = ({ notificationsOpen, onNotificationsClick }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNoti();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [moreOpen, setMoreOpen] = useState(false);
  const [reportProblemOpen, setReportProblemOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setMoreOpen(false);
    await logout();
    navigate("/");
  };

  const handleReportProblem = () => {
    setMoreOpen(false);
    setReportProblemOpen(true);
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
      icon: PlaySquare,
    },
    {
      name: "Search",
      path: "/search",
      icon: Search,
    },
    {
      name: "Create",
      path: "/create",
      icon: CircleFadingPlusIcon,
    },
    {
      name: "Notifications",
      icon: Bell,
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

  const navItemClass = (isActive) => `
    flex h-12 w-full shrink-0 items-center
    justify-center gap-0
    rounded-xl px-0 py-3 text-sm font-medium
    overflow-visible transition-colors
    group-hover/sidebar:justify-start
    group-hover/sidebar:gap-4
    group-hover/sidebar:px-4
    ${
      isActive
        ? "bg-orange-50 text-[#FF4D00]"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }
  `;

  const navItemContent = (item) => {
    const Icon = item.icon;
    const isNotificationItem = item.name === "Notifications";

    return (
      <>
        {/* Icon and badge stay together in both sidebar states */}
        <span className="relative flex size-[22px] shrink-0 items-center justify-center overflow-visible">
          <Icon size={25} className="shrink-0" />

          {isNotificationItem && unreadCount > 0 && (
            <span
              className="
                absolute -right-2 top-1.5 z-10
                flex h-5 min-w-5 items-center justify-center
                rounded-full 
                bg-[#FF4D00] px-1
                text-[10px] font-bold leading-none text-white
              "
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </span>

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
      </>
    );
  };

  return (
    <div
      className="
        group/sidebar fixed left-0 top-0 z-50
        flex h-dvh w-[78px] flex-col
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
            overflow-hidden rounded-xl bg-[#FFF0E8] dark:bg-[#2A180E]
            p-1 transition-transform duration-200 group-hover/sidebar:scale-105
          "
        >
          <img
            src="/logo.png"
            alt="Nexo"
            className="size-full object-contain"
          />
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
      <nav className="flex min-h-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto">
        {navItems.map((item) => {
          const isNotificationItem = item.name === "Notifications";

          if (isNotificationItem) {
            return (
              <button
                key={item.name}
                type="button"
                title={item.name}
                aria-label={
                  unreadCount > 0
                    ? `Notifications, ${unreadCount} unread`
                    : "Notifications"
                }
                aria-expanded={Boolean(notificationsOpen)}
                onClick={onNotificationsClick}
                className={navItemClass(notificationsOpen)}
              >
                {navItemContent(item)}
              </button>
            );
          }

          return (
            <NavLink
              key={item.name}
              to={item.path}
              title={item.name}
              className={({ isActive }) => navItemClass(isActive)}
            >
              {navItemContent(item)}
            </NavLink>
          );
        })}
      </nav>

      {/* Current User */}
      <div
        className="
          mb-4 flex h-14 shrink-0 items-center
          justify-center gap-0
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
          {user?.username?.charAt(0).toUpperCase() || "U"}
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

      {/* More Menu & Popup */}
      <div ref={moreRef} className="relative mt-auto">
        {moreOpen && (
          <div
            className="
              fixed bottom-20 left-3 z-50 w-64
              rounded-2xl border border-[#E4E1DB] bg-white p-1.5 shadow-2xl
              dark:border-[#383838] dark:bg-[#262626]
            "
          >
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  navigate("/settings");
                }}
                className="flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium text-[#1B1C20] transition hover:bg-gray-100 dark:text-white dark:hover:bg-[#333333]"
              >
                <SettingsIcon size={19} className="shrink-0" />
                <span>Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  navigate("/bookmarks");
                }}
                className="flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium text-[#1B1C20] transition hover:bg-gray-100 dark:text-white dark:hover:bg-[#333333]"
              >
                <Activity size={19} className="shrink-0" />
                <span>Your Activity</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  navigate("/bookmarks");
                }}
                className="flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium text-[#1B1C20] transition hover:bg-gray-100 dark:text-white dark:hover:bg-[#333333]"
              >
                <Bookmark size={19} className="shrink-0" />
                <span>Saved</span>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium text-[#1B1C20] transition hover:bg-gray-100 dark:text-white dark:hover:bg-[#333333]"
              >
                <span className="flex items-center gap-3.5">
                  {theme === "dark" ? (
                    <Sun size={19} className="shrink-0" />
                  ) : (
                    <Moon size={19} className="shrink-0" />
                  )}
                  <span>Switch appearance</span>
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {theme}
                </span>
              </button>

              <button
                type="button"
                onClick={handleReportProblem}
                className="flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium text-[#1B1C20] transition hover:bg-gray-100 dark:text-white dark:hover:bg-[#333333]"
              >
                <AlertCircle size={19} className="shrink-0" />
                <span>Report a problem</span>
              </button>

              <div className="my-1 h-[1px] bg-[#E4E1DB] dark:bg-[#383838]" />

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <LogOut size={19} className="shrink-0" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          title="More"
          aria-expanded={moreOpen}
          className={`
            flex h-12 w-full shrink-0 items-center
            justify-center gap-0 overflow-hidden
            rounded-xl px-0 py-3 text-sm font-medium
            transition
            group-hover/sidebar:justify-start
            group-hover/sidebar:gap-4
            group-hover/sidebar:px-4
            ${
              moreOpen
                ? "bg-orange-50 font-bold text-[#FF4D00] dark:bg-[#2A160E]"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-[#1E1E1E] dark:hover:text-white"
            }
          `}
        >
          <Menu size={23} className="shrink-0" />

          <span
            className="
              max-w-0 overflow-hidden whitespace-nowrap opacity-0
              transition-[max-width,opacity] duration-200
              group-hover/sidebar:max-w-40
              group-hover/sidebar:opacity-100
            "
          >
            More
          </span>
        </button>
      </div>

      <ReportProblemDialog
        open={reportProblemOpen}
        onOpenChange={setReportProblemOpen}
      />
    </div>
  );
};

export default Sidebar;