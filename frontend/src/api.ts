import axios from "axios";

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000" });

export const fetchMetrics = () => API.get("/dashboard/");
export const fetchByProgram = () => API.get("/dashboard/by-program");
export const fetchBySource = () => API.get("/dashboard/by-source");
export const fetchByDate = (days: number = 30) => API.get("/dashboard/by-date", { params: { days } });
export const fetchApplications = (params: Record<string, string> = {}) =>
  API.get("/applications/", { params });
export const exportCSV = () => {
  window.location.href = `${import.meta.env.VITE_API_URL ?? "http://111.88.250.70:8000"}/export/raw`;
};
