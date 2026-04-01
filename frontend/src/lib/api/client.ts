import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from "axios";
import { siteConfig } from "@/config/site";
import type { ApiError } from "@/types/api";

/** Axios instance pre-configured for the MediSync backend API */
const apiClient: AxiosInstance = axios.create({
  baseURL: "/api/v1", // Requests hit Next.js rewrites proxy
  timeout: siteConfig.apiTimeout,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Crucial: send HTTPOnly cookies
});

/* ── Request Interceptor ── */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // With HTTPOnly Cookies handled securely by browser/proxy,
    // we simply return the config without local storage injections.
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Response Interceptor ── */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // The AuthObserver component natively watches for 401 unauthenticated
    // status codes from `/api/v1/profile/me` checks globally avoiding
    // race conditions, so we do not globally redirect from here.
    return Promise.reject(error);
  }
);

export default apiClient;
