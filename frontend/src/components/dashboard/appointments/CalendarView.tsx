"use client";

import React, { useMemo, useState } from "react";
import { format, startOfDay, endOfDay, addHours, startOfWeek, addDays, isSameDay } from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MoreHorizontal,
  User,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  
  // Hours for the vertical axis (8 AM to 8 PM)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled": return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200";
      case "checked-in": return "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200";
      case "in-progress": return "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200";
      case "completed": return "bg-green-100 text-green-700 border-green-200 hover:bg-green-200";
      case "cancelled": return "bg-red-50 text-red-700 border-red-100 hover:bg-red-100 opacity-60";
      default: return "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200";
    }
  };

  const getApptPosition = (startTime: string, duration: number = 30) => {
    const date = new Date(startTime);
    const startHour = date.getHours();
    const startMin = date.getMinutes();
    
    // Relative to 8 AM
    const minutesSinceStart = (startHour - 8) * 60 + startMin;
    const top = (minutesSinceStart / 60) * 100; // 100px per hour
    const height = (duration / 60) * 100;
    
    return { top: `${top}px`, height: `${height}px` };
  };

  const filteredProviders = useMemo(() => providers.slice(0, 5), [providers]); // Limit for layout

  return (
    <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden h-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            {format(currentDate, "MMMM d, yyyy")}
          </h2>
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setCurrentDate(d => addDays(d, -1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-xs font-bold text-slate-600" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setCurrentDate(d => addDays(d, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <Badge variant="outline" className="bg-white border-slate-200 text-slate-500 font-bold px-3 py-1 rounded-lg">
             Day View
           </Badge>
        </div>
      </div>

      {/* Grid Area */}
      <div className="flex-1 overflow-auto relative min-h-0 custom-scrollbar">
        <div className="flex min-w-[800px] h-full relative" style={{ height: `${hours.length * 100}px` }}>
          
          {/* Time Labels */}
          <div className="w-20 shrink-0 border-r border-slate-100 bg-slate-50/30 sticky left-0 z-10">
            {hours.map((hour) => (
              <div key={hour} className="h-[100px] text-right pr-3 pt-2 text-[11px] font-bold text-slate-400">
                {hour > 12 ? `${hour-12} PM` : `${hour} AM`}
              </div>
            ))}
          </div>

          {/* Provider Lanes */}
          <div className="flex-1 flex h-full">
            {filteredProviders.map((provider) => (
              <div key={provider.id} className="flex-1 min-w-[150px] border-r border-slate-100 relative group">
                <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-slate-100 py-3 px-4 text-center">
                   <div className="text-[13px] font-bold text-slate-700 truncate">{provider.user?.full_name}</div>
                   <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{provider.specialization?.name}</div>
                </div>

                {/* Grid Lines */}
                {hours.map((hour) => (
                  <div key={hour} className="absolute left-0 right-0 h-px bg-slate-100/60" style={{ top: `${(hour - 8 + 1) * 100}px` }}></div>
                ))}
                
                {/* Appointments for this Provider on current day */}
                {appointments
                  .filter(a => a.provider_id === provider.id && isSameDay(new Date(a.start_time), currentDate))
                  .map((appt) => {
                    const pos = getApptPosition(appt.start_time, appt.duration);
                    return (
                      <div 
                        key={appt.id}
                        onClick={() => onEventClick?.(appt)}
                        className={cn(
                          "absolute inset-x-1.5 z-20 rounded-xl border p-2 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95 group/appt overflow-hidden",
                          getStatusColor(appt.status)
                        )}
                        style={pos}
                      >
                        <div className="flex flex-col h-full">
                          <div className="flex items-center justify-between gap-1 mb-1">
                             <div className="text-[11px] font-bold truncate leading-none">{appt.patient?.full_name}</div>
                             <div className="text-[9px] font-bold opacity-60 shrink-0">
                               {format(new Date(appt.start_time), "h:mm aa")}
                             </div>
                          </div>
                          <div className="text-[10px] font-medium opacity-80 truncate mb-1">
                            {appt.service?.name}
                          </div>
                          <div className="mt-auto flex items-center gap-2 opacity-0 group-hover/appt:opacity-100 transition-opacity">
                             <Activity className="w-3 h-3" />
                             <div className="text-[9px] font-bold uppercase tracking-wider">{appt.status}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            ))}
          </div>

          {/* Current Time Indicator */}
          {isSameDay(new Date(), currentDate) && new Date().getHours() >= 8 && new Date().getHours() <= 20 && (
             <div 
               className="absolute left-20 right-0 h-0.5 bg-red-500 z-30 pointer-events-none before:content-[''] before:absolute before:-left-1 before:-top-1 before:w-2.5 before:h-2.5 before:bg-red-500 before:rounded-full shadow-sm"
               style={{ top: `${((new Date().getHours() - 8) * 60 + new Date().getMinutes()) / 60 * 100}px` }}
             ></div>
          )}
        </div>
      </div>
    </div>
  );
}
