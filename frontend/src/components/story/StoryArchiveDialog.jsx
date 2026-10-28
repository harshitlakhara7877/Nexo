import { useState, useEffect, useCallback } from "react";
import { X, Archive, Loader2, Play } from "lucide-react";
import { getArchivedStories } from "@/services/storyService";
import StoryViewer from "./StoryViewer";
import { useAuth } from "@/context/AuthContext";

export default function StoryArchiveDialog({ isOpen, onClose }) {
  const { user } = useAuth();
  const [archivedStories, setArchivedStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);

  const fetchArchive = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getArchivedStories();
      if (res?.success && Array.isArray(res.stories)) {
        setArchivedStories(res.stories);
      } else {
        setArchivedStories([]);
      }
    } catch (err) {
      console.error("Failed to load archived stories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchArchive();
    }
  }, [isOpen, fetchArchive]);

  const currentUserId = String(user?._id || user?.id || "");

  const handleStoryClick = (story) => {
    // Structure as a single story group for StoryViewer
    setActiveStoryGroup({
      author: user,
      stories: [story],
    });
  };

  const handleStoryDeleted = () => {
    setActiveStoryGroup(null);
    fetchArchive();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="relative flex h-[540px] w-full max-w-[500px] flex-col overflow-hidden rounded-2xl border border-[#E4E1DB] bg-white text-[#1B1C20] shadow-2xl dark:border-[#262626] dark:bg-[#121212] dark:text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative flex items-center justify-between border-b border-[#E4E1DB] px-5 py-3.5 dark:border-[#262626]">
            <div className="flex items-center gap-2">
              <Archive size={18} className="text-[#FF4D00]" />
              <h2 className="text-base font-semibold">Story Archive</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-[#686A72] transition hover:bg-[#F7F6F3] hover:text-[#1B1C20] dark:text-neutral-400 dark:hover:bg-[#202020] dark:hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 size={26} className="animate-spin text-[#FF4D00]" />
              </div>
            ) : archivedStories.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#FFF0E8] text-[#FF4D00] dark:bg-[#202020]">
                  <Archive size={22} />
                </div>
                <h3 className="text-base font-semibold">No Archived Stories</h3>
                <p className="mt-1 max-w-xs text-xs text-[#686A72] dark:text-neutral-400">
                  Stories you share will be archived here automatically after 24 hours. Only you can see your archive.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                {archivedStories.map((story) => {
                  const isVideo = story.media?.mediaType === "video";
                  const dateStr = new Date(story.createdAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <div
                      key={story._id}
                      onClick={() => handleStoryClick(story)}
                      className="group relative aspect-[9/16] cursor-pointer overflow-hidden rounded-xl bg-black/10 dark:bg-black/40"
                    >
                      {isVideo ? (
                        <video
                          src={story.media?.url}
                          className="size-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <img
                          src={story.media?.url}
                          alt=""
                          className="size-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      )}

                      {/* Video indicator */}
                      {isVideo && (
                        <span className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white backdrop-blur">
                          <Play size={12} fill="white" />
                        </span>
                      )}

                      {/* Date overlay */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2 text-center text-[11px] font-medium text-white">
                        {dateStr}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Viewer if viewing an archived story */}
      {activeStoryGroup && (
        <StoryViewer
          storyGroups={[activeStoryGroup]}
          initialGroupIndex={0}
          currentUserId={currentUserId}
          onClose={() => setActiveStoryGroup(null)}
          onStoryDeleted={handleStoryDeleted}
        />
      )}
    </>
  );
}
