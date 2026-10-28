import api from "./api";

export const getConversations = async () => {
  const response = await api.get("/message/conversations");
  return response.data;
};

export const getMessages = async (userId) => {
  const response = await api.get(`/message/all/${userId}`);
  return response.data;
};

export const sendMessage = async (receiverId, content) => {
  const payload =
    content instanceof FormData
      ? content
      : typeof content === "object" && content !== null
        ? content
        : { message: content };

  const response = await api.post(
    `/message/send/${receiverId}`,
    payload
  );

  return response.data;
};

export const searchMessagePeople = async (query) => {
  const response = await api.get("/message/people", {params: { q: query },});
  return response.data;
};

export const markConversationRead = async (userId) => {
  const response = await api.patch(`/message/read/${userId}`);
  return response.data;
};

export const deleteConversation = async (userId) => {
  const response = await api.delete(`/message/conversations/with/${userId}`);
  return response.data;
};

export const reportUser = async (userId, payload) => {
  const response = await api.post(`/message/report/${userId}`,payload);

  return response.data;
};

export const toggleMuteConversation = async (userId) => {
  const response = await api.patch(`/message/mute/${userId}`);
  return response.data;
};