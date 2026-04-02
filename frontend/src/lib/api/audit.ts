import apiClient from "./client";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { ActivityLog, ActivityLogStats, ActivityLogQueryParams } from "@/types/audit";

export const auditApi = {
  /** Retrieves a paginated and filtered list of system activity logs */
  getLogs: async (params?: ActivityLogQueryParams) => {
    const response = await apiClient.get<PaginatedResponse<ActivityLog>>("/activity-logs", { 
      params 
    });
    return response.data;
  },

  /** Retrieves summary statistics for activity logs */
  getStats: async () => {
    const response = await apiClient.get<ApiResponse<ActivityLogStats>>("/activity-logs/stats");
    return response.data;
  },

  /** Retrieves technical details of a specific log entry */
  getLogDetails: async (id: number) => {
    const response = await apiClient.get<ApiResponse<ActivityLog>>(`/activity-logs/${id}`);
    return response.data;
  }
};
