export interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  required_specialization_id: string;
  required_specialization_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
