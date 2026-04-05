import React from "react";
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  History, 
  Clock, 
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandBarProps {
  stats: {
    waiting_now: number;
    assigned_today: number;
    cancelled_today: number;
    expired_today: number;
    avg_wait_minutes_today: number;
    emergency_waiting: number;
  } | null;
  onFilterStatus?: (status: string) => void;
}

export function CommandBar({ stats, onFilterStatus }: CommandBarProps) {
  if (!stats) return (
    <div className="grid grid-cols-5 gap-4 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-24 bg-slate-100 rounded-3xl" />
      ))}
    </div>
  );

  const kpis = [
    {
      label: "Waiting",
      value: stats.waiting_now,
      sub: "Right now",
      icon: Users,
      color: "blue",
      status: "waiting"
    },
    {
      label: "Assigned",
      value: stats.assigned_today,
      sub: "Today",
      icon: CheckCircle2,
      color: "emerald",
      status: "assigned"
    },
    {
      label: "Cancelled",
      value: stats.cancelled_today,
      sub: "Today",
      icon: XCircle,
      color: "slate",
      status: "cancelled"
    },
    {
      label: "Expired",
      value: stats.expired_today,
      sub: "Today",
      icon: History,
      color: "amber",
      status: "expired"
    },
    {
      label: "Avg. Wait",
      value: `${stats.avg_wait_minutes_today}m`,
      sub: "Today's avg",
      icon: Clock,
      color: "violet",
      status: null
    }
  ];

  return (
    <div className="space-y-4">
      {/* Emergency Alert Banner */}
      {stats.emergency_waiting > 0 && (
        <div className="flex items-center justify-between bg-red-600 p-4 rounded-2xl text-white shadow-xl shadow-red-500/20 animate-in slide-in-from-top duration-500">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                 <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                 <h4 className="text-sm font-black uppercase tracking-widest">Immediate Action Required</h4>
                 <p className="text-xs font-bold opacity-80">{stats.emergency_waiting} emergency patient{stats.emergency_waiting > 1 ? 's are' : ' is'} waiting in the queue.</p>
              </div>
           </div>
           <button 
             onClick={() => onFilterStatus?.('emergency')}
             className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
           >
              Prioritize Now <ArrowRight className="w-3 h-3" />
           </button>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            onClick={() => kpi.status && onFilterStatus?.(kpi.status)}
            className={cn(
              "group relative overflow-hidden p-6 rounded-3xl bg-white border border-slate-100 shadow-sm transition-all hover:shadow-xl active:scale-95 text-left",
              kpi.status && "cursor-pointer"
            )}
          >
            <div className={cn(
               "absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 rounded-full opacity-5 group-hover:opacity-10 transition-opacity",
               `bg-${kpi.color}-500`
            )} />
            
            <div className="flex flex-col h-full justify-between gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                `bg-${kpi.color}-50`,
                `text-${kpi.color}-600`
              )}>
                <kpi.icon className="w-5 h-5" />
              </div>
              
              <div>
                <div className="text-2xl font-black text-slate-800 tracking-tight">{kpi.value}</div>
                <div className="text-[10px] items-center gap-1.5 flex font-black uppercase tracking-widest text-slate-400 mt-1">
                  {kpi.label}
                  <span className="w-1 h-1 rounded-full bg-slate-200" />
                  <span className="opacity-60">{kpi.sub}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
