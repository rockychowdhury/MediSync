import React from "react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function DashboardCard({ children, className, noPadding = false }: DashboardCardProps) {
  return (
    <div 
      className={cn(
        "bg-white rounded-[20px] shadow-sm border border-slate-100/80 overflow-hidden flex flex-col",
        !noPadding && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

// Special wrapper for the prominent numbers shown in the image (like "12 New Leads")
interface MetricCardProps {
  title: string;
  value: string | number;
  trendText?: string;
  isPositive?: boolean;
}

export function MetricCard({ title, value, trendText, isPositive = true }: MetricCardProps) {
  return (
    <DashboardCard className="items-center justify-center text-center p-8">
      <div className="text-[42px] font-bold text-slate-800 leading-none mb-2 font-heading tracking-tight">
        {value}
      </div>
      <div className="text-[15px] font-bold text-slate-700 tracking-tight leading-none mb-2">
        {title}
      </div>
      {trendText && (
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          {isPositive ? "+" : "-"}{trendText}
        </div>
      )}
    </DashboardCard>
  );
}
