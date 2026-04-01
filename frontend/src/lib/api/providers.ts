import apiClient from "./client";

export const providersApi = {
  getProviders: async (params?: any) => {
    return apiClient.get("/providers/", { params });
  },
  getProviderById: async (id: string) => {
    return apiClient.get(`/providers/${id}`);
  },
  getProviderTimeOff: async (providerId: string) => {
    return apiClient.get(`/provider_time_off/${providerId}`);
  }
};
