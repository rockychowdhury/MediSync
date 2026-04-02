import apiClient from "./client";

export const timeOffApi = {
  getTimeOff: async (params?: any) => {
    const response = await apiClient.get("/time-off", { params });
    return response.data;
  },
  getProviderTimeOff: async (providerId: string) => {
    const response = await apiClient.get(`/time-off/provider/${providerId}`);
    return response.data;
  },
  createTimeOff: async (data: any) => {
    const response = await apiClient.post("/time-off", data);
    return response.data;
  },
  approveTimeOff: async (id: number | string) => {
    const response = await apiClient.patch(`/time-off/${id}/approve`);
    return response.data;
  },
  rejectTimeOff: async (id: number | string) => {
    const response = await apiClient.patch(`/time-off/${id}/reject`);
    return response.data;
  }
};
