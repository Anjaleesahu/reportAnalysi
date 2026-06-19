import client from "./client";

export const logDaily = async ({ date, sleep_hours, water_ml, symptoms }) => {
  const response = await client.post("/api/tracking/log", {
    date,
    sleep_hours,
    water_ml,
    symptoms,
  });
  return response.data;
};

export const getHistory = async (days = 15) => {
  const response = await client.get(`/api/tracking/history?days=${days}`);
  return response.data;
};

export const getSummary = async () => {
  const response = await client.get("/api/tracking/summary");
  return response.data;
};
