"use client";

import { cn } from "@/lib/utils";

interface CapacityBarProps {
  current: number;
  max: number;
  showLabel?: boolean;
  className?: string;
}

export function CapacityBar({ current, max, showLabel = true, className }: CapacityBarProps) {
  // Guard against divide by zero or negative max
  const safeMax = Math.max(1, max);
  const percentage = Math.min(100, Math.max(0, (current / safeMax) * 100));
  
  let colorClass = "bg-emerald-500";
  if (percentage >= 100) {
    colorClass = "bg-red-500";
  } else if (percentage >= 70) {
    colorClass = "bg-amber-500";
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-[11px] font-bold">
          <span className="text-slate-500">Capacity</span>
          <span className={cn(
            percentage >= 100 ? "text-red-600" : "text-slate-700"
          )}>
            {current} / {max}
          </span>
        </div>
      )}
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
