export interface Service {
  id: string;
  name: string;
  description?: string;
  category: string;
  duration_minutes: number;
  buffer_time_minutes: number;
  required_specialization_id: string;
  required_specialization_name?: string;
  fee: string | number;
  billing_code: string;
  required_specialization?: {
    id: number | string;
    name: string;
    description?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
