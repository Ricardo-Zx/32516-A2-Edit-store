/**
 * Shared axios instance: injects the JWT bearer token on every request
 * and exposes describeError() for consistent user-facing messages.
 *
 * @author Mengshan Wang
 */
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function describeError(error, fallback = "Something went wrong.") {
  if (!error) return fallback;
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
  if (error.message) return error.message;
  return fallback;
}

export default api;
