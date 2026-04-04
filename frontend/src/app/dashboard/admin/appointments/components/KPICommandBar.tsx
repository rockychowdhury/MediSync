import React from "react";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar as CalendarIcon,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICommandBarProps {
  stats: any;
  loading?: boolean;
}

export const KPICommandBar = ({ stats, loading }: KPICommandBarProps) => {
  const items = [
    {
      label: "TOTAL SCHEDULED",
      value: stats?.total || 0,
      icon: CalendarIcon,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-200"
    },
    {
      label: "CHECKED IN",
      value: (stats?.counts?.checked_in || 0) + (stats?.counts?.in_progress || 0),
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50/50",
      borderColor: "border-blue-100"
    },
    {
      label: "COMPLETED",
      value: stats?.counts?.completed || 0,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50/50",
      borderColor: "border-emerald-100"
    },
    {
        label: "NO SHOW",
        value: `${stats?.counts?.no_show || 0} (${stats?.no_show_rate_percent || 0.0}%)`,
        icon: AlertCircle,
        color: "text-rose-600",
        bgColor: "bg-rose-50/50",
        borderColor: "border-rose-100"
    },
    {
      label: "ACTIVE PROVIDERS",
      value: stats?.active_providers || 0,
      icon: Activity,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50/50",
      borderColor: "border-indigo-100"
    }
  ];

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-4 px-1 no-scrollbar">
      {items.map((item, i) => (
        <div 
          key={i}
          className={cn(
            "flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-sm shrink-0 animate-in fade-in slide-in-from-top-1 duration-500 group hover:scale-[1.02] transition-all",
            item.bgColor,
            item.borderColor
          )}
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className={cn("p-2 rounded-xl bg-white shadow-sm ring-1 ring-black/5 group-hover:rotate-6 transition-transform", item.color)}>
            <item.icon className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-slate-500/80 uppercase leading-none mb-1.5">
              {item.label}
            </span>
            <span className={cn("text-xl font-black tracking-tighter leading-none font-mono", item.color)}>
              {loading ? "---" : item.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
