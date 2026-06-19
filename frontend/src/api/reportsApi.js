import client from "./client";

export const uploadReport = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await client.post("/api/reports/upload", formData);
  return response.data;
};

export const getHistory = async () => {
  const response = await client.get("/api/reports/history");
  return response.data;
};

export const getLabTrends = async () => {
  const response = await client.get("/api/reports/lab-trends");
  return response.data;
};

export const getReport = async (reportId) => {
  const response = await client.get(`/api/reports/${reportId}`);
  return response.data;
};

export const deleteReport = async (reportId) => {
  const response = await client.delete(`/api/reports/${reportId}`);
  return response.data;
};

// NOTE: BiomarkerComparison historically calls these paths WITHOUT the `/api`
// prefix. Kept exactly as-is to preserve existing behavior byte-for-byte.
export const getHistoryUnprefixed = async () => {
  const response = await client.get("/reports/history");
  return response.data;
};

export const getReportUnprefixed = async (reportId) => {
  const response = await client.get(`/reports/${reportId}`);
  return response.data;
};
