import client from "./client";

export const sendMessage = async ({ message, history }) => {
  const response = await client.post("/api/chat", {
    message,
    history,
  });
  return response.data;
};

export const getChatHistory = async () => {
  const response = await client.get("/api/chat/history");
  return response.data;
};

export const clearChatHistory = async () => {
  const response = await client.delete("/api/chat/history");
  return response.data;
};
