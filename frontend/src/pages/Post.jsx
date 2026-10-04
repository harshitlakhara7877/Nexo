import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import api from "@/services/api";
import PostCard from "@/components/post/PostCard";

export default function Post() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await api.get(`/post/${id}`);

        if (!response.data?.success) {
          throw new Error(
            response.data?.message || "Post not found"
          );
        }

        setPost(response.data.post);
      } catch (error) {
        console.error("Fetch post error:", error);

        toast.error(
          error.response?.data?.message ||
            "Failed to load post"
        );

        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F6F3]">
        <Loader2
          size={30}
          className="animate-spin text-[#FF4D00]"
        />
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#F7F6F3] px-4 py-6">
      <div className="mx-auto w-full max-w-2xl">
        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#686A72] transition hover:bg-white hover:text-[#1B1C20]"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <PostCard post={post} />
      </div>
    </main>
  );
}