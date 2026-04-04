import apiClient from "./client";

export const appointmentsApi = {
  getAppointments: async (params?: any) => {
    const response = await apiClient.get("/appointments", { params });
    return response.data;
  },
  getProviderQueue: async (providerId: string, date: string) => {
    const response = await apiClient.get(`/appointments/providers/${providerId}/queue`, { params: { target_date: date } });
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
  bulkUpdateStatus: async (ids: string[], status: string, reason?: string) => {
    const response = await apiClient.post("/appointments/bulk/status", { appointment_ids: ids, status, cancellation_reason: reason });
    return response.data;
  },
  reschedule: async (id: string, data: any) => {
    const response = await apiClient.post(`/appointments/${id}/reschedule`, data);
    return response.data;
  },
  getAppointment: async (id: string) => {
    const response = await apiClient.get(`/appointments/${id}`);
    return response.data;
  },
  getTodayStats: async (date?: string) => {
    const response = await apiClient.get("/appointments/stats/today", { params: { target_date: date } });
    return response.data;
  },
  getWeeklyStats: async (start_date: string, end_date: string) => {
    const response = await apiClient.get("/appointments/stats/weekly", { params: { start_date, end_date } });
    return response.data;
  },
  getMonthlyStats: async (start_date: string, end_date: string) => {
    const response = await apiClient.get("/appointments/stats/monthly", { params: { start_date, end_date } });
    return response.data;
  },
  getAvailableSlots: async (providerId: string, date: string, serviceId: string) => {
    const response = await apiClient.get(`/appointments/providers/${providerId}/available-slots`, { 
      params: { target_date: date, service_id: serviceId } 
    });
    return response.data;
  },
  exportAppointments: async (params?: any) => {
    const response = await apiClient.get("/appointments/export", { 
      params,
      responseType: 'blob' 
    });
    return response.data;
  }
};
