/* ============================================
   MediSync TypeScript Types — Index
   Re-exports all domain types
   ============================================ */

export type { User, UserRole, UserStatus } from "./user";
export type { Provider, ProviderStatus, Specialization } from "./provider";
export type { Service } from "./service";
export type {
  Appointment,
  AppointmentStatus,
  AppointmentPriority,
} from "./appointment";
export type { QueueEntry, QueuePriority } from "./queue";
export type { Schedule, ScheduleType } from "./schedule";
export type { AnalyticsData, DashboardSummary } from "./analytics";
export type { ApiResponse, PaginatedResponse, ApiError } from "./api";
