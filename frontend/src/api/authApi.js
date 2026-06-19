import client from "./client";

export const login = async ({ email, password }) => {
  const response = await client.post("/api/auth/login", { email, password });
  return response.data;
};

export const register = async ({ email, password, full_name }) => {
  const response = await client.post("/api/auth/register", {
    email,
    password,
    full_name,
  });
  return response.data;
};

export const getMe = async () => {
  const response = await client.get("/api/auth/me");
  return response.data;
};
