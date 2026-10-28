import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  ChevronRight,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const settingsGroups = [
  {
    heading: "Saved content",
    items: [
      {
        title: "Bookmarks",
        description: "View and manage posts you've saved.",
        icon: Bookmark,
        path: "/bookmarks",
      },
    ],
  },
  {
    heading: "Your account",
    items: [
      {
        title: "Edit profile",
        description: "Update your name, photo, and bio.",
        icon: UserRound,
        path: "/profile/edit",
      },
    ],
  },
];

const Settings = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="min-h-screen bg-[#F7F6F3] px-4 py-6 sm:px-6 lg:px-8 dark:bg-black">
      <div className="mx-auto w-full max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-[#686A72] transition hover:bg-white hover:text-[#1B1C20] dark:text-neutral-400 dark:hover:bg-[#181818] dark:hover:text-white"
        >
          <ArrowLeft size={17} />
          Back to profile
        </button>

        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1B1C20] dark:text-white">
            Settings
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#686A72] dark:text-neutral-400">
            Manage your Nexo account and saved content.
          </p>
        </header>

        <div className="space-y-7">
          {/* Appearance Preference */}
          <section>
            <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-[#8B8D94] dark:text-neutral-400">
              Appearance
            </h2>
            <div className="overflow-hidden rounded-2xl border border-[#E4E1DB] bg-white dark:border-[#262626] dark:bg-[#121212]">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-[#FCFAF7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF4D00] sm:px-5 dark:hover:bg-[#1A1A1A]"
              >
                <div className="flex items-center gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0E8] text-[#FF4D00] dark:bg-[#2A180E]">
                    {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
                  </span>
                  <div>
                    <span className="font-semibold text-sm text-[#1B1C20] dark:text-white">
                      Dark mode
                    </span>
                    <p className="text-xs text-[#686A72] dark:text-neutral-400">
                      {theme === "dark"
                        ? "Dark appearance is currently enabled"
                        : "Light appearance is currently enabled"}
                    </p>
                  </div>
                </div>
                <div
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    theme === "dark" ? "bg-[#FF4D00]" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      theme === "dark" ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </button>
            </div>
          </section>

          {settingsGroups.map((group) => (
            <section key={group.heading}>
              <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-[#8B8D94] dark:text-neutral-400">
                {group.heading}
              </h2>

              <div className="overflow-hidden rounded-2xl border border-[#E4E1DB] bg-white dark:border-[#262626] dark:bg-[#121212]">
                {group.items.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => {
                        if (item.path) navigate(item.path);
                      }}
                      className={`flex w-full items-center gap-4 px-4 py-4 text-left transition sm:px-5 hover:bg-[#FCFAF7] dark:hover:bg-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF4D00] ${
                        index > 0 ? "border-t border-[#EEECE8] dark:border-[#262626]" : ""
                      }`}
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0E8] text-[#FF4D00] dark:bg-[#2A180E]">
                        <Icon size={19} strokeWidth={1.8} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-[#1B1C20] dark:text-white">
                          {item.title}
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-[#85858D] dark:text-neutral-400">
                          {item.description}
                        </span>
                      </span>

                      <ChevronRight
                        size={18}
                        className="shrink-0 text-[#9A9CA3] dark:text-neutral-500"
                      />
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Settings;
