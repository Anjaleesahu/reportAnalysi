import client from "./client";

export const uploadReport = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await client.post("/api/reports/upload", formData);
  return response.data;
};

export const getHistory = async ({ skip, limit } = {}) => {
  const response = await client.get("/api/reports/history", { params: { skip, limit } });
  return response.data;
};

export const addLabValue = async (reportId, { test_name, value, unit }) => {
  const response = await client.post(`/api/reports/${reportId}/lab-values`, { test_name, value, unit });
  return response.data;
};

export const updateLabValue = async (labId, { test_name, value, unit }) => {
  const response = await client.put(`/api/reports/lab-values/${labId}`, { test_name, value, unit });
  return response.data;
};

export const deleteLabValue = async (labId) => {
  const response = await client.delete(`/api/reports/lab-values/${labId}`);
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

// Download the original uploaded file (auth header is sent via the axios client).
export const downloadReportFile = async (reportId, filename = "report") => {
  const response = await client.get(`/api/reports/${reportId}/file`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
