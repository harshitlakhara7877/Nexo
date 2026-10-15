import { useState } from "react";
import {
  Bell,
  ChevronRight,
  Flag,
  ShieldBan,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const getName = (user) => user?.name || user?.username || "Nexo user";

export default function ChatDetails({ contact, onClose, onReport, onDelete }) {
  const [muted, setMuted] = useState(false);
  const navigate = useNavigate();

  return (
    <aside className="absolute inset-y-0 right-0 z-20 flex w-[min(320px,88vw)] shrink-0 flex-col border-l border-[#E4E1DB] bg-white shadow-xl lg:static lg:w-[400px] lg:shadow-none">
      {/* Heading */}
      <header className="flex h-[78px] shrink-0 items-center justify-between border-b border-[#E4E1DB] px-5">
        <h2 className="text-lg font-semibold text-[#1B1C20]">Details</h2>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="flex size-9 items-center justify-center rounded-full text-[#686A72] transition hover:bg-[#F7F6F3] hover:text-[#FF4D00]"
        >
          <X size={19} />
        </button>
      </header>

      {/* Scrollable details */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Mute */}
        <div className="flex items-center gap-3 border-b border-[#E4E1DB] px-5 py-4">
          <Bell size={20} className="shrink-0 text-[#1B1C20]" />

          <span className="flex-1 text-sm font-medium text-[#1B1C20]">
            Mute messages
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={muted}
            aria-label="Mute messages"
            onClick={() => setMuted((current) => !current)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              muted ? "bg-[#FF4D00]" : "bg-[#D6D6D6]"
            }`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${
                muted ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Participant */}
        <section className="border-b border-[#E4E1DB] px-5 py-5">
          <h3 className="mb-4 text-sm font-semibold text-[#1B1C20]">Members</h3>

          <button
            type="button"
            onClick={() => {
              if (contact?.username) {
                navigate(`/profile/${encodeURIComponent(contact.username)}`);
              }
            }}
            className="flex w-full items-center gap-3 rounded-xl text-left transition hover:bg-[#F7F6F3]"
          >
            <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFF0E8] text-lg font-semibold text-[#FF4D00]">
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
              <span className="block truncate text-sm font-semibold text-[#1B1C20]">
                {getName(contact)}
              </span>

              <span className="mt-1 block truncate text-xs text-[#686A72]">
                @{contact?.username}
              </span>
            </span>

            <ChevronRight size={17} className="text-[#85858D]" />
          </button>
        </section>

        {/* Other conversation options */}
        <section className="border-b border-[#E4E1DB] py-3">
          <button
            type="button"
            onClick={() => {
              // Nickname editing can be added separately.
            }}
            className="flex w-full items-center justify-between px-5 py-3 text-left text-sm text-[#1B1C20] transition hover:bg-[#F7F6F3]"
          >
            Nicknames
            <ChevronRight size={17} className="text-[#85858D]" />
          </button>

          <button
            type="button"
            onClick={() => {
              // Connect this to the block-user API when implemented.
            }}
            className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm text-[#1B1C20] transition hover:bg-[#F7F6F3]"
          >
            <ShieldBan size={18} />
            Block
          </button>

          <button
            type="button"
            onClick={onReport}
            className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm text-red-500 transition hover:bg-red-50"
          >
            <Flag size={18} />
            Report
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm text-red-500 transition hover:bg-red-50"
          >
            <Trash2 size={18} />
            Delete chat
          </button>
        </section>
      </div>
    </aside>
  );
}
