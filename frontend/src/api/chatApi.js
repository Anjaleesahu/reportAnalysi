import client from "./client";

export const sendMessage = async ({ message, history }) => {
  const response = await client.post("/api/chat", {
    message,
    history,
  });
  return response.data;
};
