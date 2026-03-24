export type ProviderStatus = "available" | "on_leave" | "busy";

export interface Specialization {
  id: string;
  name: string;
}

export interface Provider {
  id: string;
  user_id: string;
  full_name: string;
  specialization: Specialization;
  daily_capacity: number;
  current_load: number;
  status: ProviderStatus;
  is_active: boolean;
  contact_number?: string;
  created_at: string;
  updated_at: string;
}
