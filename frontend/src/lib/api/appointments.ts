import apiClient from "./client";

export const appointmentsApi = {
  getAppointments: async (params?: any) => {
    return apiClient.get("/appointments/", { params });
  },
  getProviderQueue: async (providerId: string) => {
    return apiClient.get(`/appointments/providers/${providerId}/queue`);
  },
  getProviderCapacity: async (providerId: string, params?: any) => {
    return apiClient.get(`/appointments/providers/${providerId}/capacity`, { params });
  },
  getWaitlist: async () => {
    return apiClient.get("/waitlist/");
  }
};
