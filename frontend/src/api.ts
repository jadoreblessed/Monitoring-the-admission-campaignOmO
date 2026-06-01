import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const API = axios.create({ baseURL: API_BASE });

export default API;

export const fetchMetrics = (params: Record<string, string | number> = {}) =>
  API.get("/dashboard/", { params });
export const fetchByProgram = () => API.get("/dashboard/by-program");
export const fetchBySource = () => API.get("/dashboard/by-source");
export const fetchByDate = (days: number = 30) =>
  API.get("/dashboard/by-date", { params: { days } });
export const fetchApplications = (params: Record<string, string> = {}) =>
  API.get("/applications/", { params });
export const fetchPrograms = () => API.get("/programs/");
export const exportCSV = () => {
  window.location.href = `${API_BASE}/export/raw`;
};
