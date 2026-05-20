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
// Добавьте эти функции в конец файла api.ts

export const registerApplicant = (data: {
  full_name: string;
  email: string;
  phone?: string;
  region?: string;
  password: string;
}) => API.post("/cabinet/auth/register", data);

export const loginApplicant = (data: { email: string; password: string }) =>
  API.post("/cabinet/auth/login", data);

export const fetchMyApplications = (token: string) =>
  API.get("/cabinet/my-applications", { headers: { Authorization: `Bearer ${token}` } });

export const fetchProfile = (token: string) =>
  API.get("/cabinet/profile", { headers: { Authorization: `Bearer ${token}` } });

export const updateProfile = (token: string, data: { full_name?: string; phone?: string; region?: string }) =>
  API.put("/cabinet/profile", data, { headers: { Authorization: `Bearer ${token}` } });

export const createApplication = (token: string, data: {
  applicant_id: number;
  program_id: number;
  source: string;
  wave: number;
  score?: number;
}) => API.post("/cabinet/apply", data, { headers: { Authorization: `Bearer ${token}` } });

export const cancelApplication = (token: string, applicationId: number) =>
  API.delete(`/cabinet/application/${applicationId}`, { headers: { Authorization: `Bearer ${token}` } });

export const fetchApplicationDetail = (token: string, applicationId: number) =>
  API.get(`/cabinet/application/${applicationId}`, { headers: { Authorization: `Bearer ${token}` } });