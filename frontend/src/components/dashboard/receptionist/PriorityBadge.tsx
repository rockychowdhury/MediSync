"use client";

import { cn } from "@/lib/utils";
import type { AppointmentPriority } from "@/types/appointment";
import type { QueuePriority } from "@/types/queue";

interface PriorityBadgeProps {
  priority: AppointmentPriority | QueuePriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  if (priority === "standard") return null; // Standard has no badge per spec

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
        priority === "emergency" && "bg-red-100 text-red-700",
        priority === "urgent" && "bg-amber-100 text-amber-700",
        className
      )}
    >
      {priority}
    </span>
  );
}
