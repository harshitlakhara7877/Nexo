import { useEffect, useState } from "react";
import { getFeed } from "../services/postService";

import PostFeed from "@/components/post/PostFeed";

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">
        Home
      </h1>

      <div className="w-full flex flex-col mx-auto justify-center max-w-2xl mt-6 space-y-6">
        <PostFeed />
      </div>
    </div>
  );
};

export default Home;
