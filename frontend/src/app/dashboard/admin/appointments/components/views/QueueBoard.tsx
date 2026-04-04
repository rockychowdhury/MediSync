"use client";

import React, { useMemo } from "react";
import { 
  Clock, 
  User, 
  CheckCircle2, 
  MoreVertical,
  Activity,
  ArrowRight,
  AlertCircle,
  Timer,
  TimerReset,
  Stethoscope,
  ChevronRight,
  UserRound,
  ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { cn } from "@/lib/utils";

interface QueueBoardProps {
  appointments: any[];
  loading: boolean;
  onEventClick: (appt: any) => void;
  onAction: (id: string, action: string) => void;
}

export function QueueBoard({
  appointments,
  loading,
  onEventClick,
  onAction,
}: QueueBoardProps) {
  
  const columns = [
    { id: "scheduled", label: "Upcoming", icon: Clock, color: "text-blue-600", bg: "bg-blue-50/50" },
    { id: "checked_in", label: "Waiting Room", icon: Timer, color: "text-amber-600", bg: "bg-amber-50/50" },
    { id: "in_progress", label: "In Consultation", icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50/50" },
    { id: "completed", label: "Discharged", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50/50" },
  ];

  const groupedAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todays = appointments.filter(a => a.appointment_start.startsWith(today));
    
    return {
      scheduled: todays.filter(a => a.status === "scheduled").sort((a,b) => a.appointment_start.localeCompare(b.appointment_start)),
      checked_in: todays.filter(a => a.status === "checked_in").sort((a,b) => (a.checked_in_at || '').localeCompare(b.checked_in_at || '')),
      in_progress: todays.filter(a => a.status === "in_progress"),
      completed: todays.filter(a => a.status === "completed").slice(0, 10), // Only show recent 10
    };
  }, [appointments]);

  if (loading && appointments.length === 0) {
    return (
      <div className="grid grid-cols-4 gap-6 h-full">
         {columns.map(c => (
           <div key={c.id} className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 flex flex-col p-6 animate-pulse">
              <div className="h-6 w-32 bg-slate-100 rounded-lg mb-6" />
              <div className="space-y-4">
                 <div className="h-32 bg-white rounded-3xl border border-slate-100" />
                 <div className="h-32 bg-white rounded-3xl border border-slate-100" />
              </div>
           </div>
         ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-6 h-full min-h-0">
      {columns.map((column) => {
        const appts = (groupedAppointments as any)[column.id];
        
        return (
          <div key={column.id} className="flex flex-col h-full bg-slate-50/50 rounded-[2.5rem] border border-slate-200/60 shadow-inner overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-6 py-5 flex items-center justify-between shrink-0 bg-white/40 backdrop-blur-sm border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                 <div className={cn("p-1.5 rounded-lg bg-white shadow-sm ring-1 ring-black/5", column.color)}>
                   <column.icon className="w-4 h-4" />
                 </div>
                 <span className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none mt-0.5">
                   {column.label}
                 </span>
              </div>
              <Badge variant="outline" className="rounded-lg bg-white border-slate-200 text-slate-600 font-bold px-2 py-0.5 text-[10px]">
                {appts.length}
              </Badge>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 pb-4">
                {appts.map((appt: any, i: number) => (
                  <div 
                    key={appt.id}
                    onClick={() => onEventClick(appt)}
                    className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all active:scale-[0.98] group cursor-pointer animate-in fade-in zoom-in-95 duration-500"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {/* Status Specific Top Info */}
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-1.5">
                          {appt.priority === "emergency" && (
                            <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-100 font-black text-[8px] uppercase px-1.5 py-0.5 h-4 flex gap-1">
                               <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                               EMERGENCY
                            </Badge>
                          )}
                          {appt.status === "checked_in" && (
                             <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600 uppercase tracking-tighter">
                                <TimerReset className="w-3 h-3" />
                                Waiting {differenceInMinutes(new Date(), parseISO(appt.checked_in_at))}m
                             </div>
                          )}
                          {appt.status === "in_progress" && (
                             <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-600 uppercase tracking-tighter">
                                <Activity className="w-3 h-3 animate-pulse" />
                                ACTIVE SESSION
                             </div>
                          )}
                       </div>
                       <span className="text-[10px] font-mono font-bold text-slate-300">
                         #{appt.appointment_number}
                       </span>
                    </div>

                    {/* Patient Context */}
                    <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[13px] font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                         {appt.patient?.name?.[0]}
                       </div>
                       <div className="flex flex-col min-w-0">
                          <span className="text-[14px] font-bold text-slate-800 leading-tight truncate">
                            {appt.patient?.name}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 truncate opacity-80">
                            {appt.service?.name}
                          </span>
                       </div>
                    </div>

                    {/* Operational Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                       <div className="flex items-center gap-1.5">
                          <UserRound className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-[11px] font-bold text-slate-500 truncate max-w-[80px]">
                            {appt.provider?.user?.name?.split(' ')[0]}
                          </span>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end">
                             <div className="text-[11px] font-black text-blue-600">{format(parseISO(appt.appointment_start), "HH:mm")}</div>
                          </div>
                          {column.id !== "completed" && (
                             <Button 
                              variant="ghost" 
                              size="icon" 
                              className={cn(
                                "h-8 w-8 rounded-xl bg-slate-50 opacity-0 group-hover:opacity-100 hover:bg-blue-600 hover:text-white transition-all transform scale-75 group-hover:scale-100",
                                column.color
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                const next: any = {
                                  scheduled: "checked_in",
                                  checked_in: "in_progress",
                                  in_progress: "completed"
                                };
                                onAction(appt.id, next[column.id]);
                              }}
                             >
                                <ArrowRight className="w-4 h-4" />
                             </Button>
                          )}
                       </div>
                    </div>
                  </div>
                ))}

                {appts.length === 0 && (
                  <div className="py-20 flex flex-col items-center gap-3 opacity-20 filter grayscale">
                     <ShieldCheck className="w-12 h-12 text-slate-300" />
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] font-slate-400">Section Clear</span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
