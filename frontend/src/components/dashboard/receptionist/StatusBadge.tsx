"use client";

import { cn } from "@/lib/utils";
import {
  Clock,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import type { AppointmentStatus } from "@/types/appointment";
import type { WaitlistStatus } from "@/types/queue";

/* ──────────────────────────────────────────────────────────
   Status configuration maps
   ────────────────────────────────────────────────────────── */

const appointmentStatusConfig: Record<
  AppointmentStatus,
  { label: string; className: string; Icon: React.ElementType | null; pulse?: boolean }
> = {
  scheduled: {
    label: "Scheduled",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    Icon: Calendar,
  },
  checked_in: {
    label: "Checked In",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    Icon: Clock,
  },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    Icon: Activity,
    pulse: true,
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-slate-50 text-slate-400 border-slate-200",
    Icon: XCircle,
  },
  no_show: {
    label: "No-Show",
    className: "bg-red-50 text-red-600 border-red-200",
    Icon: AlertTriangle,
  },
  waitlisted: {
    label: "Waitlisted",
    className: "bg-violet-50 text-violet-600 border-violet-200",
    Icon: Clock,
  },
};

const waitlistStatusConfig: Record<
  WaitlistStatus,
  { label: string; className: string; pulse?: boolean }
> = {
  waiting: {
    label: "Waiting",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    pulse: true,
  },
  assigned: {
    label: "Assigned",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-slate-50 text-slate-400 border-slate-200",
  },
  expired: {
    label: "Expired",
    className: "bg-red-50 text-red-500 border-red-200",
  },
};

/* ──────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────── */

interface StatusBadgeProps {
  status: AppointmentStatus | WaitlistStatus;
  variant?: "appointment" | "waitlist";
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({
  status,
  variant = "appointment",
  size = "sm",
  className,
}: StatusBadgeProps) {
  const config =
    variant === "waitlist"
      ? waitlistStatusConfig[status as WaitlistStatus]
      : appointmentStatusConfig[status as AppointmentStatus];

  if (!config) return null;

  const Icon =
    variant === "appointment"
      ? (appointmentStatusConfig[status as AppointmentStatus]?.Icon ?? null)
      : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border font-bold whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        config.className,
        className
      )}
    >
      {config.pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-40" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {Icon && (
        <Icon
          className={cn(
            "shrink-0",
            size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5",
            config.pulse && "animate-pulse"
          )}
        />
      )}
      {config.label}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────
   Row background helper — used by queue / list tables
   ────────────────────────────────────────────────────────── */

export function getStatusRowClass(status: AppointmentStatus): string {
  switch (status) {
    case "checked_in":
      return "bg-blue-50/30";
    case "in_progress":
      return "bg-amber-50/30";
    case "completed":
      return "bg-emerald-50/20 opacity-70";
    case "cancelled":
      return "bg-slate-50/40 opacity-60";
    case "no_show":
      return "bg-red-50/20 opacity-60";
    default:
      return "";
  }
}
