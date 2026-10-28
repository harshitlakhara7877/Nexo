import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFeedStories } from "@/services/storyService";
import StoryViewer from "./StoryViewer";
import CreateStoryDialog from "./CreateStoryDialog";

export default function StoriesRow() {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGroupIndex, setActiveGroupIndex] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getFeedStories();
      const groups = res?.storyGroups || res?.stories || [];
      if (Array.isArray(groups)) {
        setStoryGroups(groups);
      }
    } catch (err) {
      console.error("Failed to load feed stories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const currentUserId = String(user?._id || user?.id || "");

  // Find current user's group index
  const ownGroupIndex = storyGroups.findIndex(
    (g) => String(g.author?._id || g.author?.id || g.author) === currentUserId
  );
  const ownGroup = ownGroupIndex !== -1 ? storyGroups[ownGroupIndex] : null;

  const hasOwnStories = Boolean(ownGroup && ownGroup.stories?.length > 0);

  const handleOwnClick = () => {
    if (hasOwnStories) {
      setActiveGroupIndex(ownGroupIndex);
    } else {
      setCreateOpen(true);
    }
  };

  const handleStoryDeleted = (deletedId) => {
    // Refresh feed stories
    fetchStories();
  };

  const isGroupUnviewed = (group) => {
    if (typeof group?.hasUnviewed === "boolean") return group.hasUnviewed;
    if (!group?.stories || group.stories.length === 0) return false;
    return group.stories.some((s) => {
      const viewers = s.viewers || [];
      return !viewers.some(
        (v) => String(v?.user?._id || v?.user || v) === currentUserId,
      );
    });
  };

  return (
    <>
      <div className="w-full rounded-2xl border border-[#E4E1DB] bg-white p-4 shadow-sm dark:border-[#262626] dark:bg-[#121212]">
        <div className="flex items-center gap-4 overflow-x-auto pb-1 scrollbar-none">
          {/* Current User Story Item */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="relative cursor-pointer" onClick={handleOwnClick}>
              <div
                className={`flex size-16 items-center justify-center rounded-full p-[2.5px] transition hover:scale-105 ${
                  hasOwnStories
                    ? isGroupUnviewed(ownGroup)
                      ? "bg-gradient-to-tr from-[#FF4D00] via-[#FF8A00] to-[#FFA200]"
                      : "border-2 border-[#D1D5DB] dark:border-[#383838]"
                    : "border-2 border-dashed border-[#D1D5DB] dark:border-[#383838]"
                }`}
              >
                <div className="size-full overflow-hidden rounded-full bg-[#FFF0E8] dark:bg-[#202020] p-[2px]">
                  {user?.profilePicture?.url ? (
                    <img
                      src={user.profilePicture.url}
                      alt={user.username || "Your story"}
                      className="size-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center font-bold text-[#FF4D00]">
                      {user?.username?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              </div>

              {/* Add Story Plus button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreateOpen(true);
                }}
                className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-[#FF4D00] text-white ring-2 ring-white dark:ring-[#121212] transition hover:bg-[#E64400]"
                title="Add to story"
              >
                <Plus size={13} strokeWidth={3} />
              </button>
            </div>
            <span className="w-16 truncate text-center text-xs font-medium text-[#1B1C20] dark:text-neutral-300">
              Your story
            </span>
          </div>

          {/* Other Users' Stories */}
          {storyGroups.map((group, idx) => {
            const author = group.author;
            const authorId = String(author?._id || author?.id || author);
            if (authorId === currentUserId) return null; // Own story already rendered first

            const unviewed = isGroupUnviewed(group);

            return (
              <button
                key={author?._id || author?.id || idx}
                type="button"
                onClick={() => setActiveGroupIndex(idx)}
                className="flex flex-col items-center gap-1.5 shrink-0 focus:outline-none"
              >
                <div
                  className={`flex size-16 items-center justify-center rounded-full p-[2.5px] transition hover:scale-105 ${
                    unviewed
                      ? "bg-gradient-to-tr from-[#FF4D00] via-[#FF8A00] to-[#FFA200]"
                      : "border-2 border-[#E4E1DB] dark:border-[#333333]"
                  }`}
                >
                  <div className="size-full overflow-hidden rounded-full bg-white dark:bg-[#121212] p-[2px]">
                    {author?.profilePicture?.url ? (
                      <img
                        src={author.profilePicture.url}
                        alt={author.username || "Story"}
                        className="size-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-[#FFF0E8] font-bold text-[#FF4D00] dark:bg-[#202020]">
                        {author?.username?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                </div>
                <span className="w-16 truncate text-center text-xs text-[#1B1C20] dark:text-neutral-300">
                  {author?.username || "user"}
                </span>
              </button>
            );
          })}

          {/* Loading state placeholders if loading */}
          {loading && storyGroups.length === 0 && (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 animate-pulse">
                  <div className="size-16 rounded-full bg-[#E4E1DB]/60 dark:bg-[#262626]" />
                  <div className="h-2.5 w-12 rounded bg-[#E4E1DB]/60 dark:bg-[#262626]" />
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {activeGroupIndex !== null && (
        <StoryViewer
          storyGroups={storyGroups}
          initialGroupIndex={activeGroupIndex}
          currentUserId={currentUserId}
          onClose={() => setActiveGroupIndex(null)}
          onStoryDeleted={handleStoryDeleted}
        />
      )}

      {/* Create Story Dialog Modal */}
      <CreateStoryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onStoryCreated={fetchStories}
      />
    </>
  );
}
