import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  ChevronRight,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

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
      {
        title: "Privacy & Safety",
        description: "Privacy controls and blocked accounts.",
        icon: ShieldCheck,
        comingSoon: true,
      },
      {
        title: "Account & Security",
        description: "Password and account security options.",
        icon: LockKeyhole,
        comingSoon: true,
      },
    ],
  },
];

const Settings = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#F7F6F3] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-[#686A72] transition hover:bg-white hover:text-[#1B1C20]"
        >
          <ArrowLeft size={17} />
          Back to profile
        </button>

        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1B1C20]">
            Settings
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#686A72]">
            Manage your Nexo account and saved content.
          </p>
        </header>

        <div className="space-y-7">
          {settingsGroups.map((group) => (
            <section key={group.heading}>
              <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-[#8B8D94]">
                {group.heading}
              </h2>

              <div className="overflow-hidden rounded-2xl border border-[#E4E1DB] bg-white">
                {group.items.map((item, index) => {
                  const Icon = item.icon;
                  const isDisabled = item.comingSoon;

                  return (
                    <button
                      key={item.title}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        if (item.path) navigate(item.path);
                      }}
                      className={`flex w-full items-center gap-4 px-4 py-4 text-left transition sm:px-5 ${
                        index > 0 ? "border-t border-[#EEECE8]" : ""
                      } ${
                        isDisabled
                          ? "cursor-default"
                          : "hover:bg-[#FCFAF7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF4D00]"
                      }`}
                    >
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                          isDisabled
                            ? "bg-[#F5F4F1] text-[#8B8D94]"
                            : "bg-[#FFF0E8] text-[#FF4D00]"
                        }`}
                      >
                        <Icon size={19} strokeWidth={1.8} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-[#1B1C20]">
                            {item.title}
                          </span>

                          {isDisabled && (
                            <span className="rounded-full bg-[#F5F4F1] px-2 py-0.5 text-[10px] font-medium text-[#8B8D94]">
                              Coming soon
                            </span>
                          )}
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-[#85858D]">
                          {item.description}
                        </span>
                      </span>

                      {!isDisabled && (
                        <ChevronRight
                          size={18}
                          className="shrink-0 text-[#9A9CA3]"
                        />
                      )}
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