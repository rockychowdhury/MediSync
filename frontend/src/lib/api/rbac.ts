import apiClient from "./client";
import type { ApiResponse } from "@/types/api";

export interface Permission {
  id: number;
  name: string;
  description: string | null;
}

export interface UserSimple {
  id: string;
  name: string;
  email: string;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: Permission[];
  user_count: number;
  permission_count: number;
}

export const rbacApi = {
  /** Master list of granular permissions */
  getPermissions: async (params?: any) => {
    const response = await apiClient.get<ApiResponse<Permission[]>>("/rbac/permissions", { params });
    return response.data;
  },

  /** Creates a new granular permission (Admin only) */
  createPermission: async (data: { name: string; description?: string }) => {
    const response = await apiClient.post<ApiResponse<Permission>>("/rbac/permissions", data);
    return response.data;
  },

  /** Updates an existing permission (Admin only) */
  updatePermission: async (id: number, data: { description: string }) => {
    const response = await apiClient.put<ApiResponse<Permission>>(`/rbac/permissions/${id}`, data);
    return response.data;
  },

  /** Deletes a permission (Admin only) */
  deletePermission: async (id: number) => {
    const response = await apiClient.delete<ApiResponse<any>>(`/rbac/permissions/${id}`);
    return response.data;
  },

  /** List roles with their current permission sets */
  getRoles: async () => {
    const response = await apiClient.get<ApiResponse<Role[]>>("/rbac/roles");
    return response.data;
  },

  /** Creates a new role (Admin only) */
  createRole: async (data: { name: string; description?: string }) => {
    const response = await apiClient.post<ApiResponse<Role>>("/rbac/roles", data);
    return response.data;
  },

  /** Updates an existing role (Admin only) */
  updateRole: async (id: number, data: { description: string }) => {
    const response = await apiClient.put<ApiResponse<Role>>(`/rbac/roles/${id}`, data);
    return response.data;
  },

  /** Deletes a role (Admin only) */
  deleteRole: async (id: number) => {
    const response = await apiClient.delete<ApiResponse<any>>(`/rbac/roles/${id}`);
    return response.data;
  },

  /** List users assigned to a specific role */
  getRoleUsers: async (roleId: number) => {
    const response = await apiClient.get<ApiResponse<UserSimple[]>>(`/rbac/roles/${roleId}/users`);
    return response.data;
  },

  /** Assign a set of permission IDs to a role */
  assignRolePermissions: async (roleId: number, permissionIds: number[]) => {
    const response = await apiClient.post<ApiResponse<Role>>(`/rbac/roles/${roleId}/permissions`, { 
      permission_ids: permissionIds 
    });
    return response.data;
  },

  /** Revoke a specific permission from a role */
  revokeRolePermission: async (roleId: number, permissionId: number) => {
    const response = await apiClient.delete<ApiResponse<Role>>(`/rbac/roles/${roleId}/permissions/${permissionId}`);
    return response.data;
  }
};
