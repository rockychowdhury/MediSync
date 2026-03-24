import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from "axios";
import { siteConfig } from "@/config/site";
import type { ApiError } from "@/types/api";

/** Axios instance pre-configured for the MediSync backend API */
const apiClient: AxiosInstance = axios.create({
  baseURL: siteConfig.apiUrl,
  timeout: siteConfig.apiTimeout,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ── Request Interceptor ── */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Attach JWT token from localStorage if present
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Response Interceptor ── */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Token expired or unauthorized — clear auth state
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
