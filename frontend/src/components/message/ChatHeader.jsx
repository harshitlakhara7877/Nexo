import { ArrowLeft, Info } from "lucide-react";

const getName = (person) =>
  person?.name || person?.username || "Nexo user";

function UserAvatar({ user }) {
  const name = getName(user);

  return (
    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF0E8] font-semibold text-[#FF4D00] dark:bg-[#2A180E]">
      {user?.profilePicture?.url ? (
        <img
          src={user.profilePicture.url}
          alt={`${name}'s profile`}
          className="size-full object-cover"
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}

export default function ChatHeader({
  contact,
  onBack,
  showDetails,
  onToggleDetails,
}) {
  if (!contact) return null;

  return (
    <header className="flex h-[78px] shrink-0 items-center gap-3 border-b border-[#E4E1DB] bg-white px-4 sm:px-6 dark:border-[#262626] dark:bg-black">
      {/* Back button: visible on mobile */}
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to conversations"
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-[#686A72] transition hover:bg-[#F7F6F3] dark:text-neutral-400 dark:hover:bg-[#1E1E1E] md:hidden"
      >
        <ArrowLeft size={19} />
      </button>

      <UserAvatar user={contact} />

      {/* Contact information */}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold text-[#1B1C20] dark:text-white">
          {getName(contact)}
        </h2>

        <p className="mt-1 truncate text-xs text-[#686A72] dark:text-neutral-400">
          @{contact.username}
        </p>
      </div>

      {/* Conversation details */}
      <button
        type="button"
        onClick={onToggleDetails}
        aria-label={
          showDetails ? "Hide conversation details" : "Conversation details"
        }
        aria-pressed={showDetails}
        title="Conversation details"
        className={`flex size-10 shrink-0 items-center justify-center rounded-full transition hover:bg-[#F7F6F3] dark:hover:bg-[#1E1E1E] ${
          showDetails ? "text-[#FF4D00]" : "text-[#686A72] dark:text-neutral-400"
        }`}
      >
        <Info
          size={23}
          strokeWidth={2}
          className={showDetails ? "fill-[#FFF0E8] dark:fill-[#2A180E]" : ""}
        />
      </button>
    </header>
  );
}