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
  },
  updateProviderStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/providers/${id}/status`, { status });
    return response.data;
  },
  getProviderStats: async (id: string, dateFrom: string, dateTo: string) => {
    const response = await apiClient.get(`/providers/${id}/stats`, { 
      params: { date_from: dateFrom, date_to: dateTo } 
    });
    return response.data;
  },
  approveTimeOff: async (id: number) => {
    const response = await apiClient.patch(`/time-off/${id}/approve`);
    return response.data;
  },
  rejectTimeOff: async (id: number, reason: string) => {
    const response = await apiClient.patch(`/time-off/${id}/reject`, { rejection_reason: reason });
    return response.data;
  },
  getNonProviders: async (params?: any) => {
    const response = await apiClient.get("/users/non-providers", { params });
    return response.data;
  }
};
