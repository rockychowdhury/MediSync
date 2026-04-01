export type UserRole = "admin" | "receptionist" | "provider";
export type UserStatus = "active" | "inactive";

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  role_name?: UserRole; // FastAPI UserResponse schema mapping
  status: UserStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
