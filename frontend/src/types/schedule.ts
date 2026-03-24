export type ScheduleType = "leave" | "unavailable" | "custom_hours";

export interface Schedule {
  id: string;
  provider_id: string;
  provider_name?: string;
  schedule_type: ScheduleType;
  start_date: string;
  end_date: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}
