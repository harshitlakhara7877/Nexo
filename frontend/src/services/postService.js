import api from "./api"

export const getFeed = async () => {
    const response = await api.get("/post/feed");

    return response.data;
}