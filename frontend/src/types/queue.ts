export type QueuePriority = "standard" | "urgent" | "emergency";

export interface QueueEntry {
  id: string;
  appointment_id: string;
  patient_name: string;
  service_name: string;
  priority: QueuePriority;
  queue_position: number;
  estimated_wait_minutes?: number;
  added_at: string;
  assigned_at?: string;
  status: "waiting" | "assigned" | "removed";
}
