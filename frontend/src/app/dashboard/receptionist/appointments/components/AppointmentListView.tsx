"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import type { Appointment } from "@/types/appointment";
import { StatusBadge, getStatusRowClass } from "@/components/dashboard/receptionist/StatusBadge";
import { PriorityBadge } from "@/components/dashboard/receptionist/PriorityBadge";
import { SkeletonRows } from "@/components/dashboard/receptionist/SkeletonRows";

interface AppointmentListViewProps {
  appointments: Appointment[];
  isLoading: boolean;
  onStatusChange: (id: string, newStatus: string) => void;
  onCancel: (id: string) => void;
  onReschedule: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export function AppointmentListView({
  appointments,
  isLoading,
  onStatusChange,
  onCancel,
  onReschedule,
  onViewDetails,
}: AppointmentListViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  if (isLoading) {
    return (
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-4">
        <SkeletonRows rows={10} columns={7} />
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <SearchIcon className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">No appointments found</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          No appointments match your current filters. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(appointments.length / itemsPerPage);
  const currentData = appointments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      <div className="w-full overflow-x-auto hidden-scrollbar">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[11px] tracking-wider">
              <th className="py-3 px-4">Apt #</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Patient</th>
              <th className="py-3 px-4">Service</th>
              <th className="py-3 px-4">Provider</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((apt) => {
              const isTerminal = ["completed", "cancelled", "no_show"].includes(apt.status);
              
              return (
                <tr 
                  key={apt.id} 
                  className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer ${getStatusRowClass(apt.status)} ${isTerminal ? "opacity-60" : ""}`}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button')) return;
                    onViewDetails(apt.id);
                  }}
                >
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">{apt.appointment_number || apt.id.substring(0,8)}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-bold text-slate-900">{formatDate(apt.appointment_date)} · {formatTime(apt.start_time)}</div>
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
                    <div className="text-xs text-slate-500">{apt.duration_minutes} min</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">{apt.provider_name}</td>
                  <td className="py-3 px-4"><PriorityBadge priority={apt.priority} /></td>
                  <td className="py-3 px-4"><StatusBadge status={apt.status} /></td>
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

      {/* Pagination */}
      <div className="border-t border-slate-100 p-4 flex items-center justify-between bg-white">
        <div className="text-xs text-slate-500 font-medium">
          Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, appointments.length)} of {appointments.length} appointments
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded border border-slate-200 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-700 px-2">Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded border border-slate-200 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ActionButtons sub-component (same logic as QueueTable, simplified)
function ActionButtons({ apt, onStatusChange, onCancel, onReschedule, onViewDetails }: any) {
  const [showMore, setShowMore] = useState(false);
  return (
    <div className="flex items-center justify-end gap-2 relative" onClick={e => e.stopPropagation()}>
      {apt.status === "scheduled" && (
        <button onClick={() => onStatusChange(apt.id, "checked_in")} className="text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">Check In</button>
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

      {!["completed", "cancelled", "no_show"].includes(apt.status) && (
        <div className="relative">
          <button onClick={() => setShowMore(!showMore)} onBlur={() => setTimeout(() => setShowMore(false), 200)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md">
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMore && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50">
              <button onClick={() => onViewDetails(apt.id)} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">View Details</button>
              <button onClick={() => onReschedule(apt.id)} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Reschedule</button>
              <button onClick={() => onCancel(apt.id)} className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50">Cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string) {
  try { return format(new Date(dateStr), "d MMM yyyy"); } catch(e) { return dateStr; }
}

function formatTime(timeStr: string) {
  if (!timeStr) return "";
  try {
    const [hours, minutes] = timeStr.split(":");
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return format(date, "h:mm a");
  } catch(e) { return timeStr; }
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  );
}
