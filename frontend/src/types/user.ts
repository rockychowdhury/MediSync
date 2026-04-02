export type UserRole = "admin" | "receptionist" | "provider";
export type UserStatus = "active" | "inactive";

export interface User {
  id: string;
  name: string; // Backend source
  full_name?: string; // Frontend legacy/alias
  email: string;
  role_id: number;
  role?: UserRole;
  role_name?: string;
  status?: UserStatus;
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}
