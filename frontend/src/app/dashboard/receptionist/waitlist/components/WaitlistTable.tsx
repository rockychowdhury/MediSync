"use client";

import { useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Users, Phone } from "lucide-react";
import { StatusBadge, getStatusRowClass } from "@/components/dashboard/receptionist/StatusBadge";
import { PriorityBadge } from "@/components/dashboard/receptionist/PriorityBadge";
import { SkeletonRows } from "@/components/dashboard/receptionist/SkeletonRows";
import type { QueueEntry } from "@/types/queue";

interface WaitlistTableProps {
  entries: QueueEntry[];
  isLoading: boolean;
  onAssign: (entry: QueueEntry) => void;
  onCancel: (id: string, name: string) => void;
  onViewAppointment: (appointmentId: string) => void;
}

export function WaitlistTable({
  entries,
  isLoading,
  onAssign,
  onCancel,
  onViewAppointment,
}: WaitlistTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-4">
        <SkeletonRows rows={8} columns={8} />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">No patients in the waiting queue</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Great news — everyone has been seen or has a scheduled slot.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      <div className="w-full overflow-x-auto hidden-scrollbar">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[11px] tracking-wider">
              <th className="py-3 px-4 text-center w-12">Pos</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Patient</th>
              <th className="py-3 px-4">Service</th>
              <th className="py-3 px-4">Provider Pref</th>
              <th className="py-3 px-4">Requested</th>
              <th className="py-3 px-4">Waiting Since</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isTerminal = ["assigned", "cancelled", "expired"].includes(entry.status);
              
              return (
                <tr 
                  key={entry.id} 
                  className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${
                    entry.status === 'waiting' ? 'bg-white' : 'bg-slate-50/40 opacity-70'
                  }`}
                >
                  <td className="py-3 px-4 text-center font-black text-lg text-slate-300">
                    #{entry.queue_position}
                  </td>
                  <td className="py-3 px-4"><PriorityBadge priority={entry.priority} /></td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{entry.patient_name}</div>
                    <div className="text-xs text-slate-500">{entry.patient_phone || "No phone"}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-700">{entry.service_name}</div>
                    <div className="text-xs text-slate-500">
                      Est. wait: {entry.estimated_wait_minutes ? `~${entry.estimated_wait_minutes}m` : 'Unknown'}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600">
                    {entry.preferred_provider_name || "Any Available"}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600">
                    {entry.requested_date ? entry.requested_date : "First Available"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-900 font-medium" title={entry.added_at}>
                      {formatDistanceToNow(parseISO(entry.added_at), { addSuffix: true })}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={entry.status} variant="waitlist" />
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {entry.status === "waiting" && (
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => onCancel(entry.id, entry.patient_name)}
                          className="text-xs font-bold text-slate-400 hover:text-red-600 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => onAssign(entry)}
                          className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
                        >
                          Assign Now
                        </button>
                      </div>
                    )}
                    {entry.status === "assigned" && entry.assigned_appointment_id && (
                      <button 
                        onClick={() => onViewAppointment(entry.assigned_appointment_id!)}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        View Appointment
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
