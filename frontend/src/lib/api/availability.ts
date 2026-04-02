import apiClient from "./client";

export const availabilityApi = {
  getProviderAvailability: async (providerId: string) => {
    const response = await apiClient.get(`/availability/${providerId}`);
    return response.data;
  },
  createAvailability: async (data: any) => {
    const response = await apiClient.post("/availability", data);
    return response.data;
  },
  updateAvailability: async (id: number | string, data: any) => {
    const response = await apiClient.put(`/availability/${id}`, data);
    return response.data;
  },
  deleteAvailability: async (id: number | string) => {
    const response = await apiClient.delete(`/availability/${id}`);
    return response.data;
  }
};
