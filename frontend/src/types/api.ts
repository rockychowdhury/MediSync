/** Standard API response wrapper matching backend APIResponse */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

/** Paginated API response */
export interface PaginatedResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/** API error shape */
export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  status_code?: number;
}
