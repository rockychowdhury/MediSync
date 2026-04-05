"use client";

import React from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIChipProps {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  isLive?: boolean;
  icon: React.ReactNode;
  color: string;
  inverseTrend?: boolean;
}

function KPIChip({ 
  label, 
  value, 
  trend, 
  trendLabel, 
  isLive, 
  icon, 
  color,
  inverseTrend = false
}: KPIChipProps) {
  const isPositive = trend ? (inverseTrend ? trend < 0 : trend > 0) : null;
  const isNeutral = trend === 0;

  return (
    <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
      <div className={cn("absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform", color)}>
        {icon}
      </div>
      
      <div className="flex items-center gap-2 mb-3">
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm border", color.replace('text-', 'bg-').replace('text-white', 'text-slate-900') + '/10', color.replace('text-', 'border-').replace('text-white', 'border-slate-100') + '/20')}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 14, className: color })}
      </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black text-slate-900 tracking-tight">{value}</span>
        {isLive && (
          <span className="flex h-2 w-2 mb-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 min-h-[16px]">
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
            isNeutral ? "bg-slate-50 text-slate-400" :
            isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {isNeutral ? <Minus size={10} /> : isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(trend)}%
          </div>
        )}
        {trendLabel && (
          <span className="text-[10px] font-medium text-slate-400">{trendLabel}</span>
        )}
      </div>
    </div>
  );
}

interface KPIStripProps {
  data: any;
}

export function KPIStrip({ data }: KPIStripProps) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      <KPIChip
        label="Today's Bookings"
        value={data.appointments.total_today}
        trend={data.trends.bookings_vs_yesterday_pct}
        trendLabel="vs yesterday"
        icon={<Activity />}
        color="text-blue-600"
      />
      <KPIChip
        label="Completed"
        value={data.appointments.completed}
        trend={data.trends.completed_vs_yesterday_pct}
        trendLabel="vs yesterday"
        icon={<CheckCircle2 />}
        color="text-emerald-600"
      />
      <KPIChip
        label="In Progress"
        value={data.appointments.in_progress}
        isLive={true}
        trendLabel="active right now"
        icon={<Activity />}
        color="text-amber-600"
      />
      <KPIChip
        label="Scheduled"
        value={data.appointments.scheduled}
        trendLabel="remaining today"
        icon={<Clock />}
        color="text-indigo-600"
      />
      <KPIChip
        label="Waitlist Active"
        value={data.waitlist.total_waiting}
        trend={data.trends.waitlist_vs_24h_ago}
        trendLabel="patients waiting"
        icon={<Users />}
        color="text-purple-600"
      />
      <KPIChip
        label="No-Show Rate"
        value={`${data.appointments.no_show_rate_today}%`}
        trend={data.appointments.no_show_rate_today - data.appointments.no_show_rate_yesterday}
        trendLabel="vs yesterday"
        icon={<AlertCircle />}
        color="text-rose-600"
        inverseTrend={true}
      />
    </div>
  );
}
