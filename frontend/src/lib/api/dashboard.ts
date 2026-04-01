import apiClient from "./client";

export const dashboardApi = {
  getStats: async () => {
    return apiClient.get("/activity_logs/stats");
  },
  getActivityLogs: async (limit = 10, skip = 0) => {
    return apiClient.get("/activity_logs/", { params: { limit, skip } });
  }
};
