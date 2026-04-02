import apiClient from "./client";
import type { ApiResponse } from "@/types/api";
import type { User } from "@/types/user";

export interface UserCreatePayload {
  full_name: string;
  email: string;
  password?: string;
  role: string;
}

export interface UserUpdatePayload {
  full_name?: string;
  email?: string;
  role?: string;
}

export const usersApi = {
  getUsers: () =>
    apiClient.get<ApiResponse<User[]>>("/users"),

  createUser: (data: UserCreatePayload) =>
    apiClient.post<ApiResponse<User>>("/users/", data),

  getUserById: (id: string) =>
    apiClient.get<ApiResponse<User>>(`/users/${id}`),

  updateUser: (id: string, data: UserUpdatePayload) =>
    apiClient.put<ApiResponse<User>>(`/users/${id}`, data),

  deleteUser: (id: string) =>
    apiClient.delete<ApiResponse>(`/users/${id}`),

  activateUser: (id: string) =>
    apiClient.patch<ApiResponse<User>>(`/users/${id}/activate`),

  deactivateUser: (id: string) =>
    apiClient.patch<ApiResponse<User>>(`/users/${id}/deactivate`),

  getUserAudit: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/users/${id}/audit`),
};
