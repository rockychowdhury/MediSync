import apiClient from "./client";

export const servicesApi = {
  getServices: async (params?: any) => {
    const response = await apiClient.get("/services", { params });
    return response.data;
  },
  getServiceById: async (id: string) => {
    const response = await apiClient.get(`/services/${id}`);
    return response.data;
  },
  getCategories: async () => {
    const response = await apiClient.get("/services/categories");
    return response.data;
  },
  createService: async (data: any) => {
    const response = await apiClient.post("/services", data);
    return response.data;
  },
  updateService: async (id: string, data: any) => {
    const response = await apiClient.put(`/services/${id}`, data);
    return response.data;
  }
};
