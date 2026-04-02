import apiClient from "./client";
import type { ApiResponse } from "@/types/api";

export interface Permission {
  id: number;
  name: string;
  description: string | null;
  resource_type: string | null;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: Permission[];
}

export const rbacApi = {
  /** Master list of granular permissions grouped by resource area */
  getPermissions: async (params?: any) => {
    const response = await apiClient.get<ApiResponse<Permission[]>>("/rbac/permissions", { params });
    return response.data;
  },

  /** Creates a new granular permission (Admin only) */
  createPermission: async (data: any) => {
    const response = await apiClient.post<ApiResponse<Permission>>("/rbac/permissions", data);
    return response.data;
  },

  /** List roles with their current permission sets */
  getRoles: async () => {
    const response = await apiClient.get<ApiResponse<Role[]>>("/rbac/roles");
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
