import apiClient from "./client";

export const dashboardApi = {
  getSummary: async () => {
    const response = await apiClient.get("/dashboard/summary");
    return response.data;
  },
  getProviderUtilisation: async () => {
    const response = await apiClient.get("/dashboard/provider-utilisation");
    return response.data;
  },
  getAppointmentsByHour: async (dateFrom: string, dateTo: string) => {
    const response = await apiClient.get("/dashboard/appointments-by-hour", {
      params: { date_from: dateFrom, date_to: dateTo }
    });
    return response.data;
  },
  getServiceDemand: async (dateFrom: string, dateTo: string, limit: number = 5) => {
    const response = await apiClient.get("/dashboard/service-demand", {
      params: { date_from: dateFrom, date_to: dateTo, limit }
    });
    return response.data;
  },
  getNoShowTrend: async (dateFrom: string, dateTo: string) => {
    const response = await apiClient.get("/dashboard/no-show-trend", {
      params: { date_from: dateFrom, date_to: dateTo }
    });
    return response.data;
  }
};
