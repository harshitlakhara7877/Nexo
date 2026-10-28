import { useEffect, useState, useRef, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Archive,
  Eye,
  Heart,
  Send,
  Volume2,
  VolumeX,
  Play,
  Pause,
  MoreHorizontal,
  Flag,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import {
  viewStory,
  deleteStory,
  likeStory,
  archiveStory,
} from "@/services/storyService";
import { sendMessage, reportUser } from "@/services/messageService";
import ReportDialog from "@/components/message/ReportDialog";

export default function StoryViewer({
  storyGroups = [],
  initialGroupIndex = 0,
  onClose,
  onStoryDeleted,
  currentUserId,
}) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [playPauseIndicator, setPlayPauseIndicator] = useState(null);

  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const indicatorTimeoutRef = useRef(null);

  const currentGroup = storyGroups[groupIndex];
  const stories = currentGroup?.stories || [];
  const currentStory = stories[storyIndex];

  const isVideo = currentStory?.media?.mediaType === "video";
  const author = currentStory?.author || currentGroup?.author;
  const authorId = String(author?._id || author?.id || author || "");
  const isOwn = authorId === String(currentUserId);

  // Local like state for immediate responsiveness
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    if (currentStory) {
      const likes = currentStory.likes || [];
      setIsLiked(likes.some((id) => String(id) === String(currentUserId)));
      setLikeCount(likes.length);
    }
  }, [currentStory, currentUserId]);

  // Mark story as viewed
  useEffect(() => {
    if (currentStory?._id && !isOwn) {
      viewStory(currentStory._id).catch(() => {});
    }
  }, [currentStory?._id, isOwn]);

  // Reset state when story changes
  useEffect(() => {
    setProgress(0);
    setReplyText("");
    setShowMoreMenu(false);
    setShowDeleteConfirm(false);
  }, [groupIndex, storyIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (indicatorTimeoutRef.current) clearTimeout(indicatorTimeoutRef.current);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, []);

  // Try playback with sound, fallback to muted if browser rejects autoplay with audio
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    // Always attempt unmuted first
    video.muted = false;

    const attemptPlay = async () => {
      try {
        await video.play();
        setIsMuted(false);
      } catch {
        // Autoplay with sound rejected by browser policy: fall back to muted
        video.muted = true;
        setIsMuted(true);
        try {
          await video.play();
        } catch {
          // Both audio and muted play failed
        }
      }
    };

    attemptPlay();

    return () => {
      video.pause();
    };
  }, [groupIndex, storyIndex, isVideo]);

  // Sync muted state to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Pause / Resume video when isPaused changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    if (isPaused) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [isPaused, isVideo]);

  const handleNext = useCallback(() => {
    if (storyIndex < stories.length - 1) {
      setStoryIndex((prev) => prev + 1);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex((prev) => prev + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  }, [storyIndex, stories.length, groupIndex, storyGroups.length, onClose]);

  const handlePrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
    } else if (groupIndex > 0) {
      const prevGroup = storyGroups[groupIndex - 1];
      setGroupIndex((prev) => prev - 1);
      setStoryIndex(Math.max(0, (prevGroup?.stories?.length || 1) - 1));
    }
  }, [storyIndex, groupIndex, storyGroups]);

  // Story timer for images (only when not paused)
  useEffect(() => {
    if (isPaused || isVideo || !currentStory) return;

    const interval = 50;
    const totalDuration = 5000; // 5 seconds display for image stories
    const step = (interval / totalDuration) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timerRef.current);
          handleNext();
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [groupIndex, storyIndex, isPaused, isVideo, currentStory, handleNext]);

  // Flash play/pause indicator animation
  const flashIndicator = (type) => {
    if (indicatorTimeoutRef.current) clearTimeout(indicatorTimeoutRef.current);
    setPlayPauseIndicator(type);
    indicatorTimeoutRef.current = setTimeout(() => {
      setPlayPauseIndicator(null);
    }, 600);
  };

  // Toggle play/pause by clicking main media area
  const handleMediaClick = (e) => {
    e.stopPropagation();
    // If muted due to autoplay policy, unmute on first user interaction
    if (isMuted && videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    flashIndicator(nextPaused ? "pause" : "play");
  };

  const handleLike = async (e) => {
    if (e) e.stopPropagation();
    if (!currentStory?._id || likeLoading) return;
    try {
      setLikeLoading(true);
      const res = await likeStory(currentStory._id);
      if (res?.success) {
        setIsLiked(res.isLiked);
        setLikeCount(res.likeCount);
      }
    } catch {
      toast.error("Failed to update like");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    const text = replyText.trim();
    if (!text || !authorId || sendingReply) return;

    try {
      setSendingReply(true);
      await sendMessage(authorId, { message: text });
      toast.success(`Reply sent to @${author?.username || "user"}`);
      setReplyText("");
      setIsPaused(false);
    } catch (err) {
      console.error("Reply error:", err);
      toast.error("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const handleDelete = async () => {
    if (!currentStory?._id || deleting) return;
    setDeleting(true);
    try {
      await deleteStory(currentStory._id);
      toast.success("Story deleted");
      setShowDeleteConfirm(false);
      setShowMoreMenu(false);
      if (onStoryDeleted) onStoryDeleted(currentStory._id);
      if (stories.length <= 1) {
        if (storyGroups.length <= 1) {
          onClose();
        } else {
          handleNext();
        }
      } else {
        handleNext();
      }
    } catch {
      toast.error("Failed to delete story");
    } finally {
      setDeleting(false);
    }
  };

  const handleArchive = async () => {
    if (!currentStory?._id || archiving) return;
    setArchiving(true);
    try {
      await archiveStory(currentStory._id);
      toast.success("Story archived to your archive");
      setShowMoreMenu(false);
      if (onStoryDeleted) onStoryDeleted(currentStory._id);
      if (stories.length <= 1) {
        if (storyGroups.length <= 1) {
          onClose();
        } else {
          handleNext();
        }
      } else {
        handleNext();
      }
    } catch {
      toast.error("Failed to archive story");
    } finally {
      setArchiving(false);
    }
  };

  const handleCopyLink = (e) => {
    if (e) e.stopPropagation();
    if (!currentStory?._id) return;
    const url = `${window.location.origin}/story/${currentStory._id}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => toast.success("Story link copied to clipboard"))
        .catch(() => toast.error("Unable to copy link"));
    } else {
      window.prompt("Story link:", url);
    }
    setShowMoreMenu(false);
  };

  const handleReportSubmit = async ({ reason, details }) => {
    if (!authorId) return;
    try {
      await reportUser(authorId, {
        reason,
        details: `Story report (${currentStory?._id}): ${details || "Reported from story viewer"}`,
      });
      toast.success("Story report submitted. Thank you for keeping Nexo safe.");
    } catch (err) {
      console.error("Report story error:", err);
      toast.error(err.response?.data?.message || "Failed to submit report.");
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diffHours = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60)
    );
    if (diffHours < 1) return "Just now";
    return `${diffHours}h`;
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 text-white select-none">
      {/* Top right close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 z-50 flex size-10 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur transition hover:bg-black/80 hover:text-white"
        title="Close"
      >
        <X size={24} />
      </button>

      {/* Main story card matching Instagram desktop layout */}
      <div className="relative flex h-full max-h-[92dvh] w-auto max-w-[420px] aspect-[9/16] flex-col overflow-hidden rounded-2xl bg-[#111111] shadow-2xl">
        {/* Top Progress Bars */}
        <div className="absolute top-2.5 left-0 right-0 z-30 flex gap-1.5 px-3">
          {stories.map((s, idx) => (
            <div
              key={s._id || idx}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/30 backdrop-blur"
            >
              <div
                className="h-full bg-white transition-all duration-75 ease-linear"
                style={{
                  width:
                    idx < storyIndex
                      ? "100%"
                      : idx === storyIndex
                      ? `${progress}%`
                      : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header */}
        <div className="absolute top-6 left-0 right-0 z-30 flex items-center justify-between px-3.5 py-1">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 overflow-hidden rounded-full bg-gray-700">
              {author?.profilePicture?.url ? (
                <img
                  src={author.profilePicture.url}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-sm font-bold">
                  {author?.username?.charAt(0).toUpperCase() || "U"}
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white drop-shadow">
                {author?.username || "user"}
              </span>
              <span className="text-[11px] text-white/70">
                {formatTimeAgo(currentStory.createdAt)}
              </span>
            </div>
          </div>

          {/* Action icons on header: sound (video only), pause/play, 3-dot More menu */}
          <div className="flex items-center gap-1.5 text-white/90">
            {isVideo && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="flex size-8 items-center justify-center rounded-full hover:bg-black/40"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const nextPaused = !isPaused;
                setIsPaused(nextPaused);
                flashIndicator(nextPaused ? "pause" : "play");
              }}
              className="flex size-8 items-center justify-center rounded-full hover:bg-black/40"
              title={isPaused ? "Play" : "Pause"}
            >
              {isPaused ? <Play size={17} /> : <Pause size={17} />}
            </button>

            {/* 3-Dot More Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoreMenu(!showMoreMenu);
                }}
                className="flex size-8 items-center justify-center rounded-full hover:bg-black/40"
                title="More options"
              >
                <MoreHorizontal size={18} />
              </button>

              {showMoreMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMoreMenu(false);
                    }}
                  />
                  <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#242424] shadow-2xl backdrop-blur">
                    {/* Copy Link */}
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-white transition hover:bg-white/10"
                    >
                      <Link2 size={15} />
                      Copy link
                    </button>

                    {isOwn ? (
                      <>
                        <button
                          type="button"
                          disabled={archiving}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive();
                          }}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                        >
                          <Archive size={15} />
                          {archiving ? "Archiving..." : "Archive Story"}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(true);
                            setShowMoreMenu(false);
                          }}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-red-400 transition hover:bg-white/10"
                        >
                          <Trash2 size={15} />
                          Delete Story
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMoreMenu(false);
                          setIsPaused(true);
                          setReportOpen(true);
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-red-400 transition hover:bg-white/10"
                      >
                        <Flag size={15} />
                        Report
                      </button>
                    )}

                    {/* Cancel */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMoreMenu(false);
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold text-white/70 transition hover:bg-white/10 border-t border-white/5"
                    >
                      <X size={15} />
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Media area with click to toggle play/pause */}
        <div
          className="relative flex flex-1 cursor-pointer items-center justify-center bg-black"
          onClick={handleMediaClick}
        >
          {isVideo ? (
            <video
              ref={videoRef}
              src={currentStory.media?.url}
              playsInline
              muted={isMuted}
              onTimeUpdate={() => {
                if (videoRef.current?.duration) {
                  setProgress(
                    (videoRef.current.currentTime / videoRef.current.duration) *
                      100
                  );
                }
              }}
              onEnded={handleNext}
              className="size-full max-h-full max-w-full object-contain pointer-events-none"
            />
          ) : (
            <img
              src={currentStory.media?.url}
              alt=""
              className="size-full max-h-full max-w-full object-contain pointer-events-none"
            />
          )}

          {/* Centered Play/Pause flash animation */}
          {playPauseIndicator && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <div className="animate-[ping_0.5s_ease-out_forwards] rounded-full bg-black/60 p-4 backdrop-blur">
                {playPauseIndicator === "pause" ? (
                  <Pause size={38} className="text-white fill-white" />
                ) : (
                  <Play size={38} className="text-white fill-white ml-0.5" />
                )}
              </div>
            </div>
          )}

          {/* Caption overlay */}
          {currentStory.caption?.trim() && (
            <div
              className="absolute bottom-20 left-4 right-4 rounded-xl bg-black/60 p-3 text-center text-sm backdrop-blur"
              onClick={(e) => e.stopPropagation()}
            >
              {currentStory.caption}
            </div>
          )}

          {/* Viewers count for own story */}
          {isOwn && (
            <div
              className="absolute bottom-20 left-4 z-30 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs text-white/80 backdrop-blur"
              onClick={(e) => e.stopPropagation()}
            >
              <Eye size={13} />
              <span>{currentStory.viewers?.length || 0} views</span>
            </div>
          )}
        </div>

        {/* Edge tap zones for navigation */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-0 top-16 bottom-20 w-[18%] cursor-pointer z-20"
        />
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-0 top-16 bottom-20 w-[18%] cursor-pointer z-20"
        />

        {/* Bottom Interaction Bar (Reply, Like, Send) */}
        {!isOwn && (
          <div
            className="absolute bottom-3 left-0 right-0 z-30 flex items-center gap-2.5 px-3.5 py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSendReply} className="flex-1">
              <input
                type="text"
                value={replyText}
                onFocus={() => setIsPaused(true)}
                onBlur={() => !replyText && setIsPaused(false)}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${author?.username || "user"}...`}
                className="w-full rounded-full border border-white/40 bg-black/40 px-4 py-2 text-xs text-white placeholder-white/60 backdrop-blur outline-none transition focus:border-white focus:bg-black/70"
              />
            </form>

            {/* Like Heart Button */}
            <button
              type="button"
              onClick={handleLike}
              disabled={likeLoading}
              className="flex size-9 items-center justify-center rounded-full text-white transition hover:scale-110 active:scale-95"
              title={isLiked ? "Unlike story" : "Like story"}
            >
              <Heart
                size={22}
                className={
                  isLiked ? "fill-[#FF4D00] text-[#FF4D00]" : "text-white"
                }
              />
            </button>

            {/* Send Paper Plane Button */}
            <button
              type="button"
              onClick={handleSendReply}
              disabled={!replyText.trim() || sendingReply}
              className="flex size-9 items-center justify-center rounded-full text-white transition hover:scale-110 disabled:opacity-50"
              title="Send reply"
            >
              <Send size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Desktop Chevron Navigation (outside card) */}
      {(storyIndex > 0 || groupIndex > 0) && (
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-6 top-1/2 -translate-y-1/2 flex size-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/40 max-sm:hidden"
          title="Previous story"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {(storyIndex < stories.length - 1 ||
        groupIndex < storyGroups.length - 1) && (
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 flex size-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/40 max-sm:hidden"
          title="Next story"
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-[#242424] p-6 text-center shadow-2xl border border-white/10">
            <Trash2 size={32} className="mx-auto mb-3 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Delete Story?</h3>
            <p className="mt-2 text-sm text-neutral-400">
              This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Story Dialog */}
      <ReportDialog
        open={reportOpen}
        onOpenChange={(open) => {
          setReportOpen(open);
          if (!open) setIsPaused(false);
        }}
        contact={author}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
}
