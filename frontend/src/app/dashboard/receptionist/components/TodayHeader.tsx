"use client";

import { format } from "date-fns";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";

interface TodayHeaderProps {
  stats: {
    scheduled: number;
    checked_in: number;
    in_progress: number;
    completed: number;
  };
}

export function TodayHeader({ stats }: TodayHeaderProps) {
  const today = new Date();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Today's Queue
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          {format(today, "EEEE, d MMMM yyyy")}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <StatChip label="Scheduled" value={stats.scheduled} colorClass="text-slate-700 bg-slate-100" />
        <StatChip label="Checked In" value={stats.checked_in} colorClass="text-blue-700 bg-blue-50" />
        <StatChip label="In Progress" value={stats.in_progress} colorClass="text-amber-700 bg-amber-50" />
        <StatChip label="Completed" value={stats.completed} colorClass="text-emerald-700 bg-emerald-50" />
      </div>
    </div>
  );
}

function StatChip({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent ${colorClass.replace('text-', 'border-').replace(/50|100/, '200')}`}>
      <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">{label}</span>
      <span className={`text-sm font-black ${colorClass.split(' ')[0]}`}>{value}</span>
    </div>
  );
}
