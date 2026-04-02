/** Standard API response wrapper matching backend APIResponse */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

/** Paginated API response — matches backend APIResponse.paginated_success shape */
export interface PaginatedResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    pagination: {
      total: number;
      skip: number;
      limit: number;
    };
  };
}

/** API error shape */
export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  status_code?: number;
}
