import apiClient from "./client";
import type { LoginFormData } from "../validations/auth";

export const authApi = {
  login: async (data: LoginFormData) => {
    // FastAPI requires form data for OAuth2
    const formData = new URLSearchParams();
    formData.append("username", data.email);
    formData.append("password", data.password);

    return apiClient.post("/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },
  
  logout: async () => {
    return apiClient.post("/auth/logout");
  },

  me: async () => {
    return apiClient.get("/profile/me");
  },

  forgotPassword: async (email: string) => {
    return apiClient.post("/auth/forgot-password", { email });
  },

  resetPassword: async (token: string, new_password: string) => {
    return apiClient.post("/auth/reset-password", { token, new_password });
  }
};
