import api from "./api"

export const getCurrentUser = async () => {
    const response  = await api.get("/user/me");
    console.log(api)
    return response.data;
}

export const getSuggesetedUsers = async () => {
  const response = await api.get("/user/suggested");
  return response.data;
}

export const getUserByUsername = async (username) => {
  const response = await api.get(`/user/${username}`);
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.put("/user/me", profileData);

  return response.data;
};

export const followOrUnfollow = async (userId) => {
  const response = await api.post(`/user/${userId}/follow`);
  return response.data;
};

export const searchUsers = async(query, page=1, limit=12, options={}) => {
  const response = await api.get("/user/search", {
    params: { q: query, page, limit },
    signal: options.signal,
  });
  return response.data;
}

export const getShareSuggestions = async () => {
  const response = await api.get("/user/share-suggestions");
  return response.data;
};

export const getUserFollowers = async (userIdOrUsername) => {
  const response = await api.get(`/user/${userIdOrUsername}/followers`);
  return response.data;
};

export const getUserFollowing = async (userIdOrUsername) => {
  const response = await api.get(`/user/${userIdOrUsername}/following`);
  return response.data;
};

export const removeFollower = async (targetUserId) => {
  const response = await api.post(`/user/${targetUserId}/remove-follower`);
  return response.data;
};

export const blockUser = async (userId) => {
  const response = await api.post(`/user/block/${userId}`);
  return response.data;
};

export const getBlockedUsers = async () => {
  const response = await api.get("/user/blocked");
  return response.data;
};