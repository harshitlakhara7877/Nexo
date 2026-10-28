import { useState } from "react";
import {
  Bell,
  ChevronRight,
  Flag,
  ShieldBan,
  Trash2,
  X,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { toggleMuteConversation } from "@/services/messageService";
import { blockUser } from "@/services/userService";

const getName = (user) => user?.name || user?.username || "Nexo user";

export default function ChatDetails({
  contact,
  initialMuted = false,
  initialBlocked = false,
  onMuteChanged,
  onBlockChanged,
  onClose,
  onReport,
  onDelete,
}) {
  const [muted, setMuted] = useState(initialMuted);
  const [muting, setMuting] = useState(false);

  const [blocked, setBlocked] = useState(initialBlocked);
  const [blocking, setBlocking] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  const navigate = useNavigate();

  const handleToggleMute = async () => {
    if (!contact?._id || muting) return;
    const prevMuted = muted;
    const nextMuted = !prevMuted;
    setMuted(nextMuted);
    setMuting(true);

    try {
      const res = await toggleMuteConversation(contact._id);
      if (res?.success) {
        setMuted(res.isMuted);
        onMuteChanged?.(res.isMuted);
        toast.success(
          res.isMuted ? "Conversation muted" : "Conversation unmuted"
        );
      } else {
        throw new Error(res?.message || "Failed to update mute state");
      }
    } catch (err) {
      setMuted(prevMuted);
      toast.error(
        err.response?.data?.message || err.message || "Failed to update mute state"
      );
    } finally {
      setMuting(false);
    }
  };

  const handleConfirmBlock = async () => {
    if (!contact?._id || blocking) return;
    setBlocking(true);

    try {
      const res = await blockUser(contact._id);
      if (res?.success) {
        setBlocked(res.isBlocked);
        onBlockChanged?.(res.isBlocked);
        toast.success(res.isBlocked ? "User blocked" : "User unblocked");
        setShowBlockDialog(false);
      } else {
        throw new Error(res?.message || "Failed to update block state");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to update block state"
      );
    } finally {
      setBlocking(false);
    }
  };

  return (
    <>
      <aside className="absolute inset-y-0 right-0 z-20 flex w-[min(320px,88vw)] shrink-0 flex-col border-l border-[#E4E1DB] bg-white dark:border-[#262626] dark:bg-[#121212] shadow-xl lg:static lg:w-[400px] lg:shadow-none">
        {/* Heading */}
        <header className="flex h-[78px] shrink-0 items-center justify-between border-b border-[#E4E1DB] dark:border-[#262626] px-5">
          <h2 className="text-lg font-semibold text-[#1B1C20] dark:text-white">
            Details
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="flex size-9 items-center justify-center rounded-full text-[#686A72] dark:text-neutral-400 transition hover:bg-[#F7F6F3] dark:hover:bg-[#1E1E1E] hover:text-[#FF4D00]"
          >
            <X size={19} />
          </button>
        </header>

        {/* Scrollable details */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Mute row */}
          <div className="flex items-center gap-3 border-b border-[#E4E1DB] dark:border-[#262626] px-5 py-4">
            <Bell size={20} className="shrink-0 text-[#1B1C20] dark:text-white" />

            <span className="flex-1 text-sm font-medium text-[#1B1C20] dark:text-white">
              Mute messages
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={muted}
              disabled={muting}
              aria-label="Mute messages"
              onClick={handleToggleMute}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                muted ? "bg-[#FF4D00]" : "bg-[#D6D6D6] dark:bg-[#333]"
              }`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${
                  muted ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Members */}
          <section className="border-b border-[#E4E1DB] dark:border-[#262626] px-5 py-5">
            <h3 className="mb-4 text-sm font-semibold text-[#1B1C20] dark:text-white">
              Members
            </h3>

            <button
              type="button"
              onClick={() => {
                if (contact?.username) {
                  navigate(`/profile/${encodeURIComponent(contact.username)}`);
                }
              }}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-[#F7F6F3] dark:hover:bg-[#1E1E1E]"
            >
              <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF0E8] text-lg font-semibold text-[#FF4D00] dark:bg-[#2A180E]">
                {contact?.profilePicture?.url ? (
                  <img
                    src={contact.profilePicture.url}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  getName(contact).charAt(0).toUpperCase()
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[#1B1C20] dark:text-white">
                  {getName(contact)}
                </span>

                <span className="mt-0.5 block truncate text-xs text-[#686A72] dark:text-neutral-400">
                  @{contact?.username}
                </span>
              </span>

              <ChevronRight size={17} className="text-[#85858D] dark:text-neutral-500" />
            </button>
          </section>

          {/* Other options */}
          <section className="border-b border-[#E4E1DB] dark:border-[#262626] py-3">
            <button
              type="button"
              onClick={() => {
                toast.info("Nicknames are available for group chats");
              }}
              className="flex w-full items-center justify-between px-5 py-3 text-left text-sm text-[#1B1C20] dark:text-white transition hover:bg-[#F7F6F3] dark:hover:bg-[#1E1E1E]"
            >
              Nicknames
              <ChevronRight size={17} className="text-[#85858D] dark:text-neutral-500" />
            </button>

            {/* Block / Unblock */}
            <button
              type="button"
              onClick={() => setShowBlockDialog(true)}
              className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm text-[#1B1C20] dark:text-white transition hover:bg-[#F7F6F3] dark:hover:bg-[#1E1E1E]"
            >
              {blocked ? (
                <>
                  <ShieldCheck size={18} className="text-green-500" />
                  Unblock
                </>
              ) : (
                <>
                  <ShieldBan size={18} />
                  Block
                </>
              )}
            </button>

            {/* Report */}
            <button
              type="button"
              onClick={onReport}
              className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Flag size={18} />
              Report
            </button>

            {/* Delete chat */}
            <button
              type="button"
              onClick={onDelete}
              className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 size={18} />
              Delete chat
            </button>
          </section>
        </div>
      </aside>

      {/* Block Confirmation Dialog */}
      {showBlockDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowBlockDialog(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#E4E1DB] bg-white p-6 shadow-2xl dark:border-[#262626] dark:bg-[#181818]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/40">
                <ShieldBan size={28} />
              </span>

              <h3 className="mt-4 text-base font-semibold text-[#1B1C20] dark:text-white">
                {blocked ? `Unblock @${contact?.username}?` : `Block @${contact?.username}?`}
              </h3>

              <p className="mt-2 text-sm leading-5 text-[#686A72] dark:text-neutral-400">
                {blocked
                  ? "They will be able to message you and see your profile again."
                  : "They won't be able to send you messages or view your profile. Existing messages will be preserved."}
              </p>

              <div className="mt-6 flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => setShowBlockDialog(false)}
                  className="flex-1 rounded-xl border border-[#E4E1DB] px-4 py-2.5 text-sm font-semibold text-[#1B1C20] transition hover:bg-[#F7F6F3] dark:border-[#333] dark:text-white dark:hover:bg-[#222]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={blocking}
                  onClick={handleConfirmBlock}
                  className={`flex-1 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${
                    blocked
                      ? "bg-[#FF4D00] hover:bg-[#e64400]"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {blocking ? (
                    <LoaderCircle size={16} className="mx-auto animate-spin" />
                  ) : blocked ? (
                    "Unblock"
                  ) : (
                    "Block"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
