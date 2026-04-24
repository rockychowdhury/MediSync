export type QueuePriority = "standard" | "urgent" | "emergency";
export type WaitlistStatus = "waiting" | "assigned" | "cancelled" | "expired";

export interface QueueEntry {
  id: string;
  patient_id?: string;
  patient_name: string;
  patient_phone?: string;
  service_id?: string;
  service_name: string;
  provider_id?: string | null;
  preferred_provider_name?: string | null;
  appointment_id?: string;
  assigned_appointment_id?: string | null;
  priority: QueuePriority;
  queue_position: number;
  estimated_wait_minutes?: number;
  requested_date?: string | null;
  notes?: string;
  added_at: string;
  assigned_at?: string | null;
  cancelled_at?: string | null;
  expired_at?: string | null;
  assignment_method?: "manual" | "auto" | null;
  status: WaitlistStatus;
}
