import api from "./api"

export const getFeed = async () => {
    const response = await api.get("/post/feed");

    return response.data;
}


export const createPost = async (formData) => {
  const response = await api.post("/post/create", formData);

  return response.data;
};