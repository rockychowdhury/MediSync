import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { User } from "@/types/user";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: User;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  role: string;
}

export const authApi = {
  login: (data: LoginPayload) =>
    apiClient.post<ApiResponse<LoginResponse>>("/auth/login", data),

  register: (data: RegisterPayload) =>
    apiClient.post<ApiResponse<User>>("/auth/register", data),

  logout: () =>
    apiClient.post<ApiResponse>("/auth/logout"),

  me: () =>
    apiClient.get<ApiResponse<User>>("/auth/me"),

  changePassword: (data: { current_password: string; new_password: string }) =>
    apiClient.put<ApiResponse>("/auth/change-password", data),

  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse>("/auth/forgot-password", { email }),

  resetPassword: (data: { token: string; new_password: string }) =>
    apiClient.post<ApiResponse>("/auth/reset-password", data),
};
