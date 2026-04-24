"use client";

import { useState } from "react";
import { format, parseISO, startOfWeek, addDays, getHours, getMinutes, isSameDay } from "date-fns";
import type { Appointment } from "@/types/appointment";

interface AppointmentCalendarProps {
  appointments: Appointment[];
  isLoading: boolean;
  onViewDetails: (id: string) => void;
}

export function AppointmentCalendar({
  appointments,
  isLoading,
  onViewDetails,
}: AppointmentCalendarProps) {
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");

  if (isLoading) {
    return (
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-8 h-[600px] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Simplified custom Day View implementation for now.
  // In a real app, a library like react-big-calendar is recommended, 
  // but we build a simple grid to satisfy the requirement without adding dependencies.
  
  const renderDayView = () => {
    // Generate hours 08:00 to 18:00
    const hours = Array.from({ length: 11 }).map((_, i) => i + 8);

    return (
      <div className="flex flex-col h-[600px] overflow-y-auto border border-slate-100 rounded-xl">
        {hours.map(hour => {
          // Find appointments in this hour (roughly)
          const aptsThisHour = appointments.filter(a => {
            if (!a.start_time) return false;
            const h = parseInt(a.start_time.split(":")[0], 10);
            return h === hour;
          });

          return (
            <div key={hour} className="flex border-b border-slate-100 min-h-[80px]">
              <div className="w-20 shrink-0 border-r border-slate-100 p-3 text-xs font-bold text-slate-400 bg-slate-50 text-right">
                {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </div>
              <div className="flex-1 p-2 flex flex-wrap gap-2 relative">
                {aptsThisHour.map(apt => (
                  <button 
                    key={apt.id}
                    onClick={() => onViewDetails(apt.id)}
                    className="p-2 rounded-lg border text-left flex-1 min-w-[200px] bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <div className="text-[11px] font-bold text-blue-800 mb-1">
                      {format(parseISO(`2000-01-01T${apt.start_time}`), "h:mm a")} · {apt.provider_name}
                    </div>
                    <div className="font-bold text-slate-900 text-sm truncate">{apt.patient_name}</div>
                    <div className="text-xs text-slate-500 truncate">{apt.service_name}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center px-2">
        <h3 className="font-bold text-slate-800">Calendar View</h3>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setViewMode("day")} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === "day" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Day</button>
          <button onClick={() => setViewMode("week")} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === "week" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Week</button>
          <button onClick={() => setViewMode("month")} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === "month" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Month</button>
        </div>
      </div>
      
      {viewMode === "day" && renderDayView()}
      {viewMode !== "day" && (
        <div className="h-[500px] flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
          <CalendarIcon className="w-12 h-12 mb-4 opacity-20" />
          <p className="font-medium text-sm">Advanced calendar view ({viewMode}) requires a charting library like react-big-calendar.</p>
          <p className="text-xs mt-1">Showing basic Day view structure for now.</p>
        </div>
      )}
    </div>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  );
}
