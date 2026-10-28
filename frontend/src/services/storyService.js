import api from "./api";

export const createStory = async (formData) => {
  const response = await api.post("/story/create", formData);
  return response.data;
};

export const getFeedStories = async () => {
  const response = await api.get("/story/feed");
  return response.data;
};

export const getArchivedStories = async () => {
  const response = await api.get("/story/archive");
  return response.data;
};

export const viewStory = async (storyId) => {
  const response = await api.post(`/story/${storyId}/view`);
  return response.data;
};

export const deleteStory = async (storyId) => {
  const response = await api.delete(`/story/${storyId}`);
  return response.data;
};

export const likeStory = async (storyId) => {
  const response = await api.post(`/story/${storyId}/like`);
  return response.data;
};

export const archiveStory = async (storyId) => {
  const response = await api.patch(`/story/${storyId}/archive`);
  return response.data;
};
