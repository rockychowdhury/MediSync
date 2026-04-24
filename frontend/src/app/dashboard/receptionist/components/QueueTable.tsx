"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MoreVertical } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import { StatusBadge, getStatusRowClass } from "@/components/dashboard/receptionist/StatusBadge";
import { PriorityBadge } from "@/components/dashboard/receptionist/PriorityBadge";

interface QueueTableProps {
  appointments: Appointment[];
  showProviderColumn?: boolean;
  onStatusChange: (id: string, newStatus: string) => void;
  onCancel: (id: string) => void;
  onReschedule: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export function QueueTable({
  appointments,
  showProviderColumn = true,
  onStatusChange,
  onCancel,
  onReschedule,
  onViewDetails,
}: QueueTableProps) {
  // Sorting: Priority first (emergency, urgent, standard), then time
  const sortedAppointments = [...appointments].sort((a, b) => {
    // 1. Terminal states go to the bottom
    const isTerminalA = ["completed", "cancelled", "no_show"].includes(a.status);
    const isTerminalB = ["completed", "cancelled", "no_show"].includes(b.status);
    if (isTerminalA && !isTerminalB) return 1;
    if (!isTerminalA && isTerminalB) return -1;

    // 2. Priority
    const priorityWeight = { emergency: 0, urgent: 1, standard: 2 };
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[a.priority] - priorityWeight[b.priority];
    }

    // 3. Time
    return new Date(a.appointment_date + "T" + a.start_time).getTime() - 
           new Date(b.appointment_date + "T" + b.start_time).getTime();
  });

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <CalendarIcon className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">No appointments scheduled</h3>
        <p className="text-sm text-slate-500 mt-1">There are no appointments for the selected view.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto hidden-scrollbar">
      <table className="w-full text-left text-[13px]">
        <thead className="bg-white sticky top-0 z-10">
          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[11px] tracking-wider">
            <th className="py-3 px-4 w-12 text-center">#</th>
            <th className="py-3 px-4">Time</th>
            <th className="py-3 px-4">Patient</th>
            <th className="py-3 px-4">Service {showProviderColumn && "& Provider"}</th>
            <th className="py-3 px-4">Priority</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedAppointments.map((apt, index) => {
            const isTerminal = ["completed", "cancelled", "no_show"].includes(apt.status);
            
            return (
              <tr 
                key={apt.id} 
                className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer ${getStatusRowClass(apt.status)} ${isTerminal ? "opacity-60" : ""}`}
                onClick={(e) => {
                  // Don't open drawer if clicking on buttons
                  if ((e.target as HTMLElement).closest('button')) return;
                  onViewDetails(apt.id);
                }}
              >
                <td className="py-3 px-4 text-center text-slate-400 font-bold">{index + 1}</td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="font-bold text-slate-900">{formatTime(apt.start_time)}</div>
                  <div className="text-xs text-slate-500">{apt.duration_minutes} min</div>
                </td>
                <td className="py-3 px-4">
                  <div className={`font-bold text-slate-900 ${apt.status === 'cancelled' ? 'line-through opacity-70' : ''}`}>
                    {apt.patient_name}
                  </div>
                  <div className="text-xs text-slate-500">{apt.patient_phone}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-700">{apt.service_name}</div>
                  {showProviderColumn && <div className="text-xs text-slate-500">{apt.provider_name}</div>}
                </td>
                <td className="py-3 px-4">
                  <PriorityBadge priority={apt.priority} />
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status={apt.status} />
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <ActionButtons 
                    apt={apt} 
                    onStatusChange={onStatusChange}
                    onCancel={onCancel}
                    onReschedule={onReschedule}
                    onViewDetails={onViewDetails}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Sub-component for rendering actions based on status
function ActionButtons({ 
  apt, 
  onStatusChange, 
  onCancel, 
  onReschedule,
  onViewDetails 
}: { 
  apt: Appointment; 
  onStatusChange: (id: string, s: string) => void;
  onCancel: (id: string) => void;
  onReschedule: (id: string) => void;
  onViewDetails: (id: string) => void;
}) {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="flex items-center justify-end gap-2 relative" onClick={e => e.stopPropagation()}>
      {apt.status === "scheduled" && (
        <>
          <button onClick={() => onCancel(apt.id)} className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1">Cancel</button>
          <button onClick={() => onStatusChange(apt.id, "checked_in")} className="text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">Check In</button>
        </>
      )}
      {apt.status === "checked_in" && (
        <button onClick={() => onStatusChange(apt.id, "in_progress")} className="text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors">Start</button>
      )}
      {apt.status === "in_progress" && (
        <button onClick={() => onStatusChange(apt.id, "completed")} className="text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors">Complete</button>
      )}
      {["completed", "cancelled", "no_show"].includes(apt.status) && (
        <button onClick={() => onViewDetails(apt.id)} className="text-xs font-bold text-blue-600 hover:underline px-2 py-1">View</button>
      )}

      {/* More Options Dropdown */}
      {!["completed", "cancelled", "no_show"].includes(apt.status) && (
        <div className="relative">
          <button 
            onClick={() => setShowMore(!showMore)} 
            onBlur={() => setTimeout(() => setShowMore(false), 200)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMore && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button onClick={() => onViewDetails(apt.id)} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">View Details</button>
              <button onClick={() => onReschedule(apt.id)} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Reschedule</button>
              {apt.status === "scheduled" && (
                <button onClick={() => onStatusChange(apt.id, "no_show")} className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50">Mark No-Show</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helpers
function formatTime(timeStr: string) {
  if (!timeStr) return "";
  try {
    const [hours, minutes] = timeStr.split(":");
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return format(date, "h:mm a");
  } catch (e) {
    return timeStr;
  }
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
      <line x1="16" x2="16" y1="2" y2="6"/>
      <line x1="8" x2="8" y1="2" y2="6"/>
      <line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  );
}
