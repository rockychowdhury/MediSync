export interface DashboardSummary {
  today_total: number;
  today_completed: number;
  today_pending: number;
  today_cancelled: number;
  queue_count: number;
  provider_utilization: ProviderUtilization[];
  recent_activity: ActivityLogEntry[];
}

export interface ProviderUtilization {
  provider_id: string;
  provider_name: string;
  capacity: number;
  current_load: number;
  utilization_percent: number;
}

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  description: string;
  created_at: string;
}

export interface AnalyticsData {
  period: string;
  total_appointments: number;
  completed: number;
  cancelled: number;
  no_shows: number;
  completion_rate: number;
  no_show_rate: number;
  average_wait_time_minutes: number;
}
