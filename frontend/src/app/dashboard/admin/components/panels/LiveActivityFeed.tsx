"use client";

import React, { useEffect, useState } from "react";
import { Activity, Clock, User, PlusCircle, Trash, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ActivityLog {
  id: string;
  action_type: string;
  entity_type: string;
  user_name: string;
  created_at: string;
  metadata?: any;
}

interface LiveActivityFeedProps {
  initialLogs: ActivityLog[];
  newLogs: ActivityLog[];
}

export function LiveActivityFeed({ initialLogs, newLogs }: LiveActivityFeedProps) {
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs);

  useEffect(() => {
    if (newLogs.length > 0) {
      // Prepend new logs and keep last 20
      setLogs((prev) => [...newLogs, ...prev].slice(0, 20));
    }
  }, [newLogs]);

  const getActionIcon = (action: string) => {
    if (action.includes("create")) return <PlusCircle className="text-emerald-500" size={14} />;
    if (action.includes("delete")) return <Trash className="text-rose-500" size={14} />;
    if (action.includes("update")) return <Activity className="text-blue-500" size={14} />;
    return <Clock className="text-slate-400" size={14} />;
  };

  const getLogColor = (action: string) => {
    if (action.includes("create")) return "border-emerald-100 bg-emerald-50/30";
    if (action.includes("delete")) return "border-rose-100 bg-rose-50/30";
    if (action.includes("update")) return "border-blue-100 bg-blue-50/30";
    return "border-slate-100 bg-slate-50/30";
  };

  return (
    <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-col h-full min-h-[440px]">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </div>
          <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">Live Activity</h3>
        </div>
        <a 
          href="/dashboard/admin/audit" 
          className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
        >
          View Full Log →
        </a>
      </div>

      <div className="flex-1 overflow-y-auto hidden-scrollbar pr-1 relative">
        <div className="absolute left-[13px] top-2 bottom-4 w-px bg-slate-100"></div>
        
        <div className="space-y-6 pt-2">
          {logs.map((log, index) => (
            <div 
              key={log.id} 
              className={cn(
                "relative pl-8 animate-in fade-in slide-in-from-left-2 duration-500",
                index === 0 && "scale-105 origin-left"
              )}
            >
              <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110">
                {getActionIcon(log.action_type)}
              </div>
              
              <div className={cn(
                "p-3.5 rounded-2xl border transition-all hover:shadow-sm",
                getLogColor(log.action_type)
              )}>
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-[12px] font-black text-slate-800 tracking-tight leading-tight">
                    {log.action_type.replace(/_/g, " ")} {log.entity_type}
                  </h4>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap ml-2">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true }).replace("about ", "")}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-4 h-4 rounded-full bg-slate-200 border border-white flex items-center justify-center overflow-hidden">
                    <User size={10} className="text-slate-500" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">
                    {log.user_name || "System"}
                  </span>
                </div>

                {log.metadata && (
                  <div className="mt-2.5 p-2 bg-white/50 rounded-lg border border-white/80 text-[10px] font-medium text-slate-600 line-clamp-2">
                    {JSON.stringify(log.metadata)}
                  </div>
                )}
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Activity className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-[12px] font-black uppercase tracking-widest opacity-60">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
