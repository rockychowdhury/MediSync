import apiClient from "./client";

export const notificationsApi = {
  getNotifications: async (params?: any) => {
    const response = await apiClient.get("/notifications", { params });
    return response.data;
  },
  resendNotification: async (id: string | number) => {
    const response = await apiClient.post(`/notifications/${id}/resend`);
    return response.data;
  }
};
