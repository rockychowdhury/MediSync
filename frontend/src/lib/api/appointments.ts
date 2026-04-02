import apiClient from "./client";

export const appointmentsApi = {
  getAppointments: async (params?: any) => {
    const response = await apiClient.get("/appointments", { params });
    return response.data;
  },
  getProviderQueue: async (providerId: string) => {
    const response = await apiClient.get(`/appointments/providers/${providerId}/queue`);
    return response.data;
  },
  getProviderCapacity: async (providerId: string, params?: any) => {
    const response = await apiClient.get(`/appointments/providers/${providerId}/capacity`, { params });
    return response.data;
  },
  getWaitlist: async () => {
    const response = await apiClient.get("/waitlist");
    return response.data;
  },
  createAppointment: async (data: any) => {
    const response = await apiClient.post("/appointments", data);
    return response.data;
  },
  updateStatus: async (id: string, status: string, reason?: string) => {
    const response = await apiClient.patch(`/appointments/${id}/status`, { status, cancellation_reason: reason });
    return response.data;
  },
  getAppointment: async (id: string) => {
    const response = await apiClient.get(`/appointments/${id}`);
    return response.data;
  }
};
