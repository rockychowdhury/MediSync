import apiClient from "./client";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { User } from "@/types/user";

export { type User };

export interface UserCreatePayload {
  name: string;
  email: string;
  password?: string;
  role_id: number;
}

export interface UserUpdatePayload {
  name?: string;
  email?: string;
  role_id?: number;
  is_active?: boolean;
}

export const usersApi = {
  /** Paginated user retrieval with filtering */
  getUsers: async (params?: any) => {
    const response = await apiClient.get<PaginatedResponse<User>>("/users", { params });
    return response.data;
  },

  /** Administrative creation of new staff/clinical accounts */
  createUser: async (data: UserCreatePayload) => {
    const response = await apiClient.post<ApiResponse<User>>("/users/", data);
    return response.data;
  },

  /** Detailed profile retrieval */
  getUserById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  },

  /** Update user profile or core security attributes */
  updateUser: async (id: string, data: UserUpdatePayload) => {
    const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data;
  },

  /** Soft-deletion of user credentials */
  deleteUser: async (id: string) => {
    const response = await apiClient.delete<ApiResponse>(`/users/${id}`);
    return response.data;
  },

  /** Immediate reinstatement of a suspended account */
  activateUser: async (id: string) => {
    const response = await apiClient.patch<ApiResponse>(`/users/${id}/activate`);
    return response.data;
  },

  /** Immediate suspension of an account (security lockdown) */
  deactivateUser: async (id: string) => {
    const response = await apiClient.patch<ApiResponse>(`/users/${id}/deactivate`);
    return response.data;
  },

  /** Historical audit trail of actions performed by this user */
  getUserAudit: async (id: string, params?: any) => {
    const response = await apiClient.get<PaginatedResponse<any>>(`/users/${id}/audit`, { params });
    return response.data;
  },
};
