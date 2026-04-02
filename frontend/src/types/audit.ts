export interface ActivityLog {
  id: number;
  user_id: string | null;
  user_name: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  description: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}

export interface ActivityLogStats {
  total_actions_24h: number;
  failed_logins_24h: number;
  top_active_users_24h: {
    user_id: string;
    user_name: string;
    count: number;
  }[];
}

export interface ActivityLogQueryParams {
  skip?: number;
  limit?: number;
  user_id?: string;
  action_type?: string;
  entity_type?: string;
  entity_id?: string;
  start_date?: string;
  end_date?: string;
}
