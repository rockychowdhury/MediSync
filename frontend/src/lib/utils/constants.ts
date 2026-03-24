/** MediSync application-wide constants */

export const APP_NAME = "MediSync";

/** Appointment status options with labels and colors */
export const APPOINTMENT_STATUS = {
  scheduled: { label: "Scheduled", color: "bg-ocean-blue text-white" },
  checked_in: { label: "Checked In", color: "bg-vibrant-teal text-white" },
  in_progress: { label: "In Progress", color: "bg-teal-blue text-white" },
  completed: { label: "Completed", color: "bg-action-green text-white" },
  cancelled: { label: "Cancelled", color: "bg-destructive text-white" },
  no_show: { label: "No Show", color: "bg-muted-foreground text-white" },
  waitlisted: { label: "Waitlisted", color: "bg-soft-mint text-deep-navy" },
} as const;

/** Queue priority levels */
export const QUEUE_PRIORITY = {
  standard: { label: "Standard", color: "bg-ocean-blue text-white" },
  urgent: { label: "Urgent", color: "bg-warning text-white" },
  emergency: { label: "Emergency", color: "bg-destructive text-white" },
} as const;

/** Provider availability status */
export const PROVIDER_STATUS = {
  available: { label: "Available", color: "bg-action-green text-white" },
  on_leave: { label: "On Leave", color: "bg-muted-foreground text-white" },
  busy: { label: "Busy", color: "bg-destructive text-white" },
} as const;

/** Pagination defaults */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMITS: [10, 25, 50, 100],
} as const;

/** Service duration options (minutes) */
export const SERVICE_DURATIONS = [15, 30, 45, 60, 90, 120] as const;
