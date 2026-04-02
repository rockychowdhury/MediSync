import apiClient from "./client";

export const specializationsApi = {
  getSpecializations: async (params?: any) => {
    const response = await apiClient.get("/specializations", { params });
    return response.data;
  },
  getSpecializationById: async (id: number | string) => {
    const response = await apiClient.get(`/specializations/${id}`);
    return response.data;
  },
  createSpecialization: async (data: any) => {
    const response = await apiClient.post("/specializations", data);
    return response.data;
  },
  updateSpecialization: async (id: number | string, data: any) => {
    const response = await apiClient.put(`/specializations/${id}`, data);
    return response.data;
  },
  deleteSpecialization: async (id: number | string) => {
    const response = await apiClient.delete(`/specializations/${id}`);
    return response.data;
  }
};
