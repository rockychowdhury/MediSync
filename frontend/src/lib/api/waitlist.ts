import apiClient from "./client";

export const waitlistApi = {
  getWaitlist: async (params?: any) => {
    const response = await apiClient.get("/waitlist", { params });
    return response.data;
  },
  addToWaitlist: async (data: any) => {
    const response = await apiClient.post("/waitlist", data);
    return response.data;
  },
  updateWaitlistEntry: async (id: string | number, data: any) => {
    const response = await apiClient.put(`/waitlist/${id}`, data);
    return response.data;
  },
  deleteWaitlistEntry: async (id: string | number) => {
    const response = await apiClient.delete(`/waitlist/${id}`);
    return response.data;
  },
  manualAssign: async (id: string | number, data: { provider_id: string; appointment_start: string }) => {
    const response = await apiClient.post(`/waitlist/${id}/assign`, data);
    return response.data;
  },
  getStats: async () => {
    const response = await apiClient.get("/waitlist/stats/today");
    return response.data;
  },
  getAnalytics: async (params: { date_from: string; date_to: string }) => {
    const response = await apiClient.get("/waitlist/analytics", { params });
    return response.data;
  },
  getEstimatedWait: async (service_id: string, queue_position: number) => {
    const response = await apiClient.get(`/waitlist/estimated-wait/${service_id}`, { 
      params: { queue_position } 
    });
    return response.data;
  },
  expireEntries: async (beforeDate: string) => {
    const response = await apiClient.post("/waitlist/expire", { before_date: beforeDate });
    return response.data;
  }
};
