import { useRef, useState } from "react";
import { X, ImagePlus, LoaderCircle, Film } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { createStory } from "@/services/storyService";

export default function CreateStoryDialog({ open, onOpenChange, onStoryCreated }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const isVideo = file?.type?.startsWith("video/");

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/") && !selected.type.startsWith("video/")) {
      toast.error("Please select a valid image or video file.");
      return;
    }

    if (selected.size > 50 * 1024 * 1024) {
      toast.error("File size must be under 50 MB.");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleReset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview("");
    setCaption("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || uploading) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("media", file);
      if (caption.trim()) {
        formData.append("caption", caption.trim());
      }

      const response = await createStory(formData);
      if (!response?.success) {
        throw new Error(response?.message || "Failed to create story.");
      }

      toast.success("Story shared successfully!");
      handleReset();
      onOpenChange(false);
      if (onStoryCreated) onStoryCreated(response.story);
    } catch (error) {
      console.error("Create story error:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to share story.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen && !uploading) handleReset();
        onOpenChange(newOpen);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="!flex max-h-[90vh] w-[calc(100%-24px)] max-w-[460px] flex-col gap-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E4E1DB] bg-white p-0 text-[#1B1C20] shadow-2xl dark:border-[#383838] dark:bg-[#262626] dark:text-white"
      >
        <header className="relative flex h-[52px] shrink-0 items-center justify-between border-b border-[#EEECE8] px-4 dark:border-[#383838]">
          <DialogTitle className="text-base font-bold">Create Story</DialogTitle>
          <button
            type="button"
            disabled={uploading}
            onClick={() => onOpenChange(false)}
            className="flex size-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-[#383838]"
          >
            <X size={19} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col p-5 gap-4 overflow-y-auto">
          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E4E1DB] bg-[#F7F6F3] p-6 text-center transition hover:border-[#FF4D00] hover:bg-[#FFF0E8]/20 dark:border-[#383838] dark:bg-[#1E1E1E] dark:hover:border-[#FF4D00]"
            >
              <div className="flex size-14 items-center justify-center rounded-full bg-[#FFF0E8] text-[#FF4D00] dark:bg-[#2A160E]">
                <ImagePlus size={26} />
              </div>
              <p className="mt-3 text-sm font-semibold">Select a photo or video</p>
              <p className="mt-1 text-xs text-[#686A72] dark:text-gray-400">
                Stories disappear from the feed after 24 hours.
              </p>
            </div>
          ) : (
            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-black">
              {isVideo ? (
                <video
                  src={preview}
                  controls
                  playsInline
                  className="max-h-[360px] w-full object-contain"
                />
              ) : (
                <img
                  src={preview}
                  alt="Story preview"
                  className="max-h-[360px] w-full object-contain"
                />
              )}

              <button
                type="button"
                disabled={uploading}
                onClick={handleReset}
                className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {preview && (
            <div>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={300}
                placeholder="Add a caption... (optional)"
                className="w-full rounded-xl border border-[#E4E1DB] bg-[#F7F6F3] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#FF4D00] dark:border-[#383838] dark:bg-[#1A1A1A] dark:text-white"
              />
            </div>
          )}

          {preview && (
            <button
              type="submit"
              disabled={uploading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#FF4D00] font-semibold text-white transition hover:bg-[#E64400] disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Sharing story...
                </>
              ) : (
                "Share to Story"
              )}
            </button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
