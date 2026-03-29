import axios from "axios";

const API = axios.create({ baseURL: "http://127.0.0.1:8000" });

// метрики дашборда
export const fetchMetrics = () => API.get("/dashboard/");

// метрики по программам
export const fetchByProgram = () => API.get("/dashboard/by-program");

// список заявок с фильтрами
export const fetchApplications = (params: Record<string, string>) =>
  API.get("/applications/", { params });

// экспорт CSV
export const exportCSV = () => {
  window.open("http://127.0.0.1:8000/export/raw", "_blank");
};