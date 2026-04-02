import apiClient from "./client";

export const patientsApi = {
  getPatients: async (params?: any) => {
    const response = await apiClient.get("/patients", { params });
    return response.data;
  },
  getPatient: async (id: string | number) => {
    const response = await apiClient.get(`/patients/${id}`);
    return response.data;
  },
  createPatient: async (data: any) => {
    const response = await apiClient.post("/patients", data);
    return response.data;
  },
  updatePatient: async (id: string | number, data: any) => {
    const response = await apiClient.put(`/patients/${id}`, data);
    return response.data;
  }
};
