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

export const updateProfile = async (fields) => {
  const response = await client.put("/api/auth/me", fields);
  return response.data;
};

export const changePassword = async ({ current_password, new_password }) => {
  const response = await client.post("/api/auth/change-password", {
    current_password,
    new_password,
  });
  return response.data;
};
