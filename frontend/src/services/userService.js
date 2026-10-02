import api from "./api"

export const getCurrentUser = async () => {
    const response  = await api.get("/user/me");
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