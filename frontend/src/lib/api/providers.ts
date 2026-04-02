import apiClient from "./client";

export const providersApi = {
  getProviders: async (params?: any) => {
    const response = await apiClient.get("/providers", { params });
    return response.data;
  },
  getProviderById: async (id: string) => {
    const response = await apiClient.get(`/providers/${id}`);
    return response.data;
  },
  getProviderTimeOff: async (providerId: string) => {
    const response = await apiClient.get(`/time-off/${providerId}`);
    return response.data;
  },
  updateProvider: async (id: string, data: any) => {
    const response = await apiClient.put(`/providers/${id}`, data);
    return response.data;
  },
  assignServiceToProvider: async (providerId: string, serviceId: string) => {
    const response = await apiClient.post(`/providers/${providerId}/services/${serviceId}`);
    return response.data;
  },
  removeServiceFromProvider: async (providerId: string, serviceId: string) => {
    const response = await apiClient.delete(`/providers/${providerId}/services/${serviceId}`);
    return response.data;
  },
  getUsersForPromotion: async (params?: any) => {
    const response = await apiClient.get("/users", { params });
    return response.data;
  },
  promoteToProvider: async (data: any) => {
    const response = await apiClient.post("/providers", data);
    return response.data;
  }
};
