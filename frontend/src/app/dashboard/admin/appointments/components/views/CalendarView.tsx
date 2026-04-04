"use client";

import React, { useMemo, useState, useEffect } from "react";
import { 
  format, 
  startOfDay, 
  endOfDay, 
  addHours, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  parseISO,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  addWeeks,
  subWeeks,
  subDays
} from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User,
  Activity,
  Calendar as CalendarIcon,
  LayoutGrid,
  Filter,
  Maximize2,
  Minimize2,
  AlertCircle,
  MoreVertical,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CalendarViewProps {
  appointments: any[];
  providers: any[];
  loading: boolean;
  onEventClick?: (appt: any) => void;
}

export function CalendarView({
  appointments,
  providers,
  loading,
  onEventClick,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  
  // Hours for the vertical axis (8 AM to 8 PM)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled": return "bg-blue-50 text-blue-700 border-blue-200/50 hover:bg-blue-100 hover:border-blue-300";
      case "checked_in": return "bg-amber-50 text-amber-700 border-amber-200/50 hover:bg-amber-100 hover:border-amber-300";
      case "in_progress": return "bg-indigo-50 text-indigo-700 border-indigo-200/50 hover:bg-indigo-100 hover:border-indigo-300";
      case "completed": return "bg-emerald-50 text-emerald-700 border-emerald-200/50 hover:bg-emerald-100 hover:border-emerald-300";
      case "cancelled": return "bg-rose-50 text-rose-700 border-rose-100/50 opacity-60";
      case "no_show": return "bg-slate-50 text-slate-500 border-slate-200/50 opacity-60";
      default: return "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
    }
  };

  const getApptPosition = (startTime: string, endTime: string) => {
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    
    // Relative to 8 AM
    const minutesSinceStart = (start.getHours() - 8) * 60 + start.getMinutes();
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    
    const top = (minutesSinceStart / 60) * 80; // 80px per hour
    const height = (durationMinutes / 60) * 80;
    
    return { top: `${top}px`, height: `${height}px` };
  };

  const days = useMemo(() => {
    if (viewMode === "day") return [currentDate];
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate, viewMode]);

  // For Day View: Filter only relevant providers (those with appts or limited list)
  const activeProviders = useMemo(() => {
    if (viewMode === "week") return [];
    return providers.slice(0, 8); // Top 8 for Day View layout
  }, [providers, viewMode]);

  const navigate = (direction: number) => {
    if (viewMode === "day") setCurrentDate(d => addDays(d, direction));
    else setCurrentDate(d => addWeeks(d, direction));
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* Calendar Navigation Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-white/80 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
             <h2 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">
               {format(currentDate, viewMode === "day" ? "MMMM dd" : "MMMM yyyy")}
             </h2>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
               {viewMode === "day" ? format(currentDate, "EEEE") : "Clinical Week View"}
             </span>
          </div>
          
          <div className="flex items-center bg-slate-50 border border-slate-200/60 rounded-2xl p-1 shadow-inner">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white hover:text-blue-600 transition-all" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-[11px] font-black tracking-widest text-slate-500 hover:text-blue-600 hover:bg-white" onClick={() => setCurrentDate(new Date())}>
              TODAY
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white hover:text-blue-600 transition-all" onClick={() => navigate(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
           <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-8 rounded-xl text-[10px] font-black tracking-widest px-4", viewMode === "day" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400")}
            onClick={() => setViewMode("day")}
          >
            DAY
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-8 rounded-xl text-[10px] font-black tracking-widest px-4", viewMode === "week" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400")}
            onClick={() => setViewMode("week")}
          >
            WEEK
          </Button>
        </div>
      </div>

      {/* Planner Grid Area */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
        {/* Day Labels Overlay for Week View */}
        {viewMode === "week" && (
           <div className="flex border-b border-slate-100 sticky top-0 bg-white z-10 pl-[80px]">
              {days.map((day, i) => (
                <div key={i} className={cn(
                  "flex-1 py-4 text-center border-r border-slate-50",
                  isToday(day) && "bg-blue-50/30"
                )}>
                   <div className={cn("text-[10px] font-black uppercase tracking-widest leading-none mb-1", isToday(day) ? "text-blue-600" : "text-slate-400")}>
                     {format(day, "EEE")}
                   </div>
                   <div className={cn("text-lg font-black tracking-tighter", isToday(day) ? "text-blue-700" : "text-slate-800")}>
                     {format(day, "dd")}
                   </div>
                </div>
              ))}
           </div>
        )}

        <ScrollArea className="flex-1">
          <div className="flex h-full relative" style={{ minHeight: `${hours.length * 80}px` }}>
            
            {/* Time Axis Labels */}
            <div className="w-[80px] shrink-0 border-r border-slate-100 bg-slate-50/20 sticky left-0 z-10 flex flex-col">
              {hours.map((hour) => (
                <div key={hour} className="h-[80px] flex items-start justify-end pr-4 pt-2 group relative">
                  <span className="text-[11px] font-black text-slate-300 group-hover:text-blue-400 transition-colors">
                    {hour > 12 ? `${hour-12} PM` : `${hour} AM`}
                  </span>
                  <div className="absolute left-full top-0 w-4 h-px bg-slate-100" />
                </div>
              ))}
            </div>

            {/* Main Content: Lane/Grid */}
            <div className="flex-1 flex h-full">
              {viewMode === "day" ? (
                // Day View with Provider Lanes
                <div className="flex-1 flex h-full min-w-0 overflow-x-auto no-scrollbar">
                  {activeProviders.map((provider) => (
                    <div key={provider.id} className="flex-1 min-w-[200px] border-r border-slate-50 relative group">
                      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-100 py-4 px-4 text-center flex flex-col items-center">
                         <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-black text-slate-400 mb-2">
                           {provider.user?.name?.[0]}
                         </div>
                         <div className="text-[13px] font-bold text-slate-800 leading-tight truncate w-full">{provider.user?.name}</div>
                         <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate w-full opacity-60">
                           {provider.specialization?.name}
                         </div>
                      </div>

                      {/* Grid Horizontal Guidelines */}
                      {hours.map((hour) => (
                        <div key={hour} className="absolute left-0 right-0 h-px bg-slate-50/50" style={{ top: `${(hour - 8 + 1) * 80}px` }} />
                      ))}
                      
                      {/* Events for this provider on this day */}
                      {appointments
                        .filter(a => a.provider_id === provider.id && isSameDay(parseISO(a.appointment_start), currentDate))
                        .map((appt) => {
                          const pos = getApptPosition(appt.appointment_start, appt.appointment_end);
                          return (
                            <div 
                              key={appt.id}
                              onClick={() => onEventClick?.(appt)}
                              className={cn(
                                "absolute inset-x-2 z-20 rounded-2xl border p-3 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95 group/appt overflow-hidden flex flex-col",
                                getStatusColor(appt.status)
                              )}
                              style={pos}
                            >
                              <div className="flex items-start justify-between gap-1 mb-1 relative z-10">
                                 <div className="text-[12px] font-black leading-[1.1] truncate pr-1">
                                   {appt.patient?.name}
                                 </div>
                                 <Badge variant="outline" className="h-4 p-0 px-1 font-mono text-[8px] font-black border-current/20 opacity-60">
                                   {format(parseISO(appt.appointment_start), "HH:mm")}
                                 </Badge>
                              </div>
                              <div className="text-[10px] font-bold opacity-60 leading-tight mb-2 truncate">
                                {appt.service?.name}
                              </div>
                              
                              <div className="mt-auto flex items-center gap-1.5 translate-y-4 opacity-0 group-hover/appt:translate-y-0 group-hover/appt:opacity-100 transition-all duration-300">
                                 <div className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                                 <span className="text-[9px] font-black uppercase tracking-widest opacity-80">{appt.status.replace(/_/g, ' ')}</span>
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  ))}
                </div>
              ) : (
                // Week View with Day Columns
                <div className="flex-1 flex h-full divide-x divide-slate-50">
                  {days.map((day, i) => (
                    <div key={i} className={cn(
                      "flex-1 relative group",
                      isToday(day) && "bg-blue-50/10"
                    )}>
                      {/* Timeline Lines */}
                      {hours.map((hour) => (
                        <div key={hour} className="absolute left-0 right-0 h-px bg-slate-50" style={{ top: `${(hour - 8 + 1) * 80}px` }} />
                      ))}

                      {/* Events for this day */}
                      {appointments
                        .filter(a => isSameDay(parseISO(a.appointment_start), day))
                        .map((appt) => {
                          const pos = getApptPosition(appt.appointment_start, appt.appointment_end);
                          return (
                            <div 
                              key={appt.id}
                              onClick={() => onEventClick?.(appt)}
                              className={cn(
                                "absolute inset-x-1.5 z-20 rounded-xl border p-2 cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg group/appt flex flex-col",
                                getStatusColor(appt.status)
                              )}
                              style={pos}
                            >
                               <div className="text-[10px] font-black leading-tight truncate mb-0.5">
                                 {appt.patient?.name}
                               </div>
                               <div className="text-[8px] font-bold opacity-50 font-mono">
                                 {format(parseISO(appt.appointment_start), "HH:mm")} • {appt.provider?.user?.name?.split(' ')[0]}
                               </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Time Indicator Line */}
            {isSameDay(new Date(), currentDate) && viewMode === "day" && new Date().getHours() >= 8 && new Date().getHours() <= 20 && (
               <div 
                 className="absolute left-[80px] right-0 h-0.5 bg-rose-500/80 z-30 pointer-events-none flex items-center"
                 style={{ top: `${((new Date().getHours() - 8) * 60 + new Date().getMinutes()) / 60 * 80}px` }}
               >
                 <div className="h-3 w-3 bg-rose-500 rounded-full border-2 border-white -ml-1.5 shadow-sm" />
                 <div className="h-[1px] flex-1 bg-gradient-to-r from-rose-500/50 to-transparent" />
               </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer Info */}
      <div className="shrink-0 px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
         <div className="flex gap-4">
           {["scheduled", "checked_in", "in_progress", "completed"].map(s => (
             <div key={s} className="flex items-center gap-1.5">
               <div className={cn("h-2 w-2 rounded-full", getStatusColor(s).split(' ')[0])} />
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.replace(/_/g, ' ')}</span>
             </div>
           ))}
         </div>
         <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            08:00 AM - 08:00 PM
         </div>
      </div>
    </div>
  );
}
