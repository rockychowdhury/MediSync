/**
 * Shared TypeScript types used across the application.
 */

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data: T | null;
    meta: Record<string, unknown>;
}

export interface ApiError {
    success: false;
    message: string;
    errors: unknown;
    error_code: string | null;
}

export interface PaginationMeta {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
}

export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: "admin" | "receptionist" | "provider";
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
