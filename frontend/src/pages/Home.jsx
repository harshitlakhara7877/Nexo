import { useEffect, useState } from "react";
import { getFeed } from "../services/postService";
import PostCard from "../components/post/PostCard";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getFeed();

      setPosts(data.posts || []);
    } catch (error) {
      console.error("Fetch feed error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load your feed."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // if (loading) {
  //   return (
  //     <div className="flex min-h-screen items-center justify-center">
  //       <p className="text-sm text-gray-500">
  //         Loading your feed...
  //       </p>
  //     </div>
  //   );
  // }

  // if (error) {
  //   return (
  //     <div className="flex min-h-screen items-center justify-center p-6">
  //       <div className="rounded-xl border bg-white p-6 text-center">
  //         <p className="font-medium text-red-500">
  //           {error}
  //         </p>

  //         <button
  //           onClick={fetchPosts}
  //           className="mt-4 rounded-lg bg-[#FF4D00] px-4 py-2 text-sm font-medium text-white"
  //         >
  //           Try again
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  // if (posts.length === 0) {
  //   return (
  //     <div className="flex min-h-screen items-center justify-center p-6">
  //       <div className="text-center">
  //         <h2 className="text-xl font-semibold">
  //           No posts yet
  //         </h2>

  //         <p className="mt-2 text-sm text-gray-500">
  //           Posts from your community will appear here.
  //         </p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">
        Home
      </h1>

      <div className="mt-6 space-y-6">
        {[1,2,3,4,5].map((post, index) => (
          <PostCard 
          key={index}
          // post={post}
           />
        ))}
      </div>
    </div>
  );
};

export default Home;
