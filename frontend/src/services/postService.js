import api from "./api"

export const getFeed = async () => {
    const response = await api.get("/post/feed");

    return response.data;
}


export const createPost = async (formData) => {
  const response = await api.post("/post/create", formData);
  
  return response.data;
};

export const likePost = async (postId) => {
    const response = await api.post(`/post/${postId}/like`);

    return response.data;
}

export const dislikePost = async (postId) => {
    const response = await api.post(`/post/${postId}/dislike`);

    return response.data;
}

export const addComment = async(postId, text) => {
  const response = await api.post(`/post/${postId}/comment`, {text});

  return response.data;
}

export const getComments = async(postId) => {
  const response = await api.get(`/post/${postId}/comment/all`);

  return response.data;
}

export const getDiscoverPosts = async (page = 1, limit = 12, options={}) => {
  const response = await api.get("/post/discover", {
    params: { page, limit },
    signal: options.signal,
  });

  return response.data;
};

export const searchPosts = async ( query, page = 1, limit = 12,options={}) => {
  const response = await api.get("/post/search", {
    params: { q:query, page, limit },
    signal: options.signal,
  });

  return response.data;
};


export const getUserPosts = async () => {
  const response = await api.get("/post/posts");
  return response.data;
};


export const getPostsByUsername = async(username) => {
  const response = await api.get(`/post/by-user/${username}`);
  return response.data;
}

export const getLikedPosts = async () => {
  const response = await api.get("/post/liked");
  return response.data;
};

export const getBookmarkedPosts = async () => {
  const response = await api.get("/post/bookmarked");
  return response.data;
};

export const toggleBookmark = async (postId) => {
  const response = await api.post(`/post/${postId}/bookmark`);
  return response.data;
};

export const deletePost = async (postId) => {
  const response = await api.delete(`/post/delete/${postId}`);
  return response.data;
};

