export type AppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"
  | "waitlisted";

export type AppointmentPriority = "standard" | "urgent" | "emergency";

export interface Appointment {
  id: string;
  appointment_number?: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  service_id: string;
  service_name?: string;
  provider_id?: string;
  provider_name?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}
