import { useRef, useState } from "react";
import { ArrowLeft, ImagePlus, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { createPost } from "@/services/postService";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
];

export default function CreatePost() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, JPEG, and WebP images are allowed");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setImage(file);

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
  };

  const handleRemoveImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);
    setPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!image) {
      toast.error("Please select an image");
      return;
    }

    if (caption.trim().length > 600) {
      toast.error("Caption must be 600 characters or less");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("image", image);
      formData.append("caption", caption.trim());

      const data = await createPost(formData);

      if (!data.success) {
        toast.error(data.message || "Failed to create post");
        return;
      }

      toast.success("Post created successfully");

      navigate("/profile");
    } catch (error) {
      console.error("Create post error:", error);

      toast.error(
        error.response?.data?.message ||
          "Something went wrong while creating the post"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] px-6 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E4E1DB] bg-white text-[#1B1C20] transition hover:bg-[#F7F6F3]"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-2xl font-semibold text-[#1B1C20]">
              Create Post
            </h1>

            <p className="text-sm text-[#686A72]">
              Share photo & videos with your Friends 
            </p>
          </div>
        </div>

        {/* Main Card */}
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-[#E4E1DB] bg-white shadow-sm"
        >
          <div className="grid min-h-[560px] md:grid-cols-2">
            {/* Image Section */}
            <div className="flex min-h-[500px] items-center justify-center border-b border-[#E4E1DB] bg-[#F7F6F3] p-6 md:border-b-0 md:border-r">
              {!preview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-full min-h-[450px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E4E1DB] bg-white transition hover:border-[#FF4D00] hover:bg-[#FFF8F5]"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF0E9] text-[#FF4D00]">
                    <ImagePlus size={30} />
                  </div>

                  <p className="text-base font-medium text-[#1B1C20]">
                    Select an image
                  </p>

                  <p className="mt-1 text-sm text-[#9A9CA3]">
                    JPG, PNG, JPEG or WebP
                  </p>

                  <p className="mt-1 text-xs text-[#9A9CA3]">
                    Maximum size: 5MB
                  </p>
                </button>
              ) : (
                <div className="relative flex h-full min-h-[450px] w-full items-center justify-center overflow-hidden rounded-xl bg-black">
                  <img
                    src={preview}
                    alt="Post preview"
                    className="max-h-[560px] max-w-full object-contain"
                  />

                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Details Section */}
            <div className="flex flex-col p-6">
              <div>
                <label
                  htmlFor="caption"
                  className="mb-2 block text-sm font-medium text-[#1B1C20]"
                >
                  Caption
                </label>

                <textarea
                  id="caption"
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  maxLength={600}
                  placeholder="Write a caption..."
                  rows={8}
                  className="w-full resize-none rounded-xl border border-[#E4E1DB] bg-[#F7F6F3] px-4 py-3 text-sm text-[#1B1C20] outline-none transition placeholder:text-[#9A9CA3] focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/10"
                />

                <div className="mt-2 flex justify-end">
                  <span className="text-xs text-[#9A9CA3]">
                    {caption.length}/600
                  </span>
                </div>
              </div>

              {/* Post Info */}
              <div className="mt-6 rounded-xl bg-[#F7F6F3] p-4">
                <p className="text-sm font-medium text-[#1B1C20]">
                  Before you post
                </p>

                <ul className="mt-2 space-y-1 text-xs text-[#686A72]">
                  <li>• Use a clear image</li>
                  <li>• Keep your caption within 600 characters</li>
                  <li>• Be respectful to the Nexo community</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="mt-auto flex gap-3 pt-8">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  className="flex-1 rounded-xl border border-[#E4E1DB] px-5 py-3 text-sm font-medium text-[#1B1C20] transition hover:bg-[#F7F6F3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!image || loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF4D00] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#E04400] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    "Share Post"
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}