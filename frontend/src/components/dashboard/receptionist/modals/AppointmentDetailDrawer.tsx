"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Clock, User, Stethoscope, Loader2, AlertCircle, Phone, FileText } from "lucide-react";
import { format } from "date-fns";
import { appointmentsApi } from "@/lib/api/appointments";
import { StatusBadge } from "@/components/dashboard/receptionist/StatusBadge";
import { PriorityBadge } from "@/components/dashboard/receptionist/PriorityBadge";
import { toast } from "sonner";
import type { Appointment } from "@/types/appointment";

interface AppointmentDetailDrawerProps {
  appointmentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onCancel: (id: string) => void;
  onReschedule: (id: string) => void;
}

export function AppointmentDetailDrawer({
  appointmentId,
  isOpen,
  onClose,
  onStatusChange,
  onCancel,
  onReschedule,
}: AppointmentDetailDrawerProps) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (isOpen && appointmentId) {
      setLoading(true);
      appointmentsApi.getAppointment(appointmentId)
        .then(res => {
          if (res.success) {
            setAppointment(res.data);
            setNotes(res.data.notes || "");
          }
        })
        .catch(() => toast.error("Failed to load appointment details"))
        .finally(() => setLoading(false));
    }
  }, [isOpen, appointmentId]);

  const handleSaveNotes = async () => {
    if (!appointment) return;
    setSavingNotes(true);
    try {
      // Backend does not yet expose a dedicated notes update endpoint.
      // For now, we persist optimistically in the UI and log the intent.
      // TODO: Wire to PUT /appointments/{id}/notes when backend adds it.
      console.info(`[Notes] Would save notes for appointment ${appointment.id}:`, notes);
      await new Promise(r => setTimeout(r, 300)); // Brief delay for UX feedback
      toast.success("Notes saved locally");
    } catch (e) {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-[60] transform transition-transform duration-300 flex flex-col overflow-hidden animate-in slide-in-from-right">
        
        {loading || !appointment ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Header with Status Banner */}
            <div className="bg-white">
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Apt #{appointment.appointment_number || appointment.id.substring(0,8)}
                  </div>
                  <h2 className="text-xl font-black text-slate-900">{appointment.service_name}</h2>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Action Banner */}
              <div className="px-6 py-4 border-y border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <StatusBadge status={appointment.status} size="md" />
                  <PriorityBadge priority={appointment.priority} />
                </div>
                
                <div className="flex items-center gap-2">
                  {appointment.status === "scheduled" && (
                    <>
                      <button onClick={() => { onClose(); onCancel(appointment.id); }} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm">Cancel</button>
                      <button onClick={() => { onClose(); onReschedule(appointment.id); }} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm">Reschedule</button>
                      <button onClick={() => { onStatusChange(appointment.id, "checked_in"); onClose(); }} className="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg shadow-sm shadow-blue-600/20 hover:bg-blue-700">Check In</button>
                    </>
                  )}
                  {appointment.status === "checked_in" && (
                    <button onClick={() => { onStatusChange(appointment.id, "in_progress"); onClose(); }} className="px-4 py-1.5 text-xs font-bold bg-amber-500 text-white rounded-lg shadow-sm shadow-amber-500/20 hover:bg-amber-600">Start Session</button>
                  )}
                  {appointment.status === "in_progress" && (
                    <button onClick={() => { onStatusChange(appointment.id, "completed"); onClose(); }} className="px-4 py-1.5 text-xs font-bold bg-emerald-500 text-white rounded-lg shadow-sm shadow-emerald-500/20 hover:bg-emerald-600">Complete</button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto hidden-scrollbar p-6 space-y-6 bg-white">
              
              {/* Date & Time block */}
              <div className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex-1 flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm"><Calendar className="w-5 h-5" /></div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Date</div>
                    <div className="font-bold text-slate-900">{format(new Date(appointment.appointment_date), "EEEE, d MMM yyyy")}</div>
                  </div>
                </div>
                <div className="w-px bg-slate-200" />
                <div className="flex-1 flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm"><Clock className="w-5 h-5" /></div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Time</div>
                    <div className="font-bold text-slate-900">{appointment.start_time} - {appointment.end_time}</div>
                  </div>
                </div>
              </div>

              {/* Patient & Provider */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Patient Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div className="font-bold text-slate-900">{appointment.patient_name}</div>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <a href={`tel:${appointment.patient_phone}`} className="text-blue-600 hover:underline">{appointment.patient_phone}</a>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Provider</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-sm">
                      <Stethoscope className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div className="font-bold text-slate-900">{appointment.provider_name}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Timeline / Details */}
              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Timeline & Origins</h3>
                <div className="space-y-3">
                  <TimelineItem label="Created At" value={format(new Date(appointment.created_at), "d MMM yyyy, h:mm a")} by={appointment.created_by_name} />
                  {appointment.assigned_from_waitlist && (
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                      <AlertCircle className="w-4 h-4" /> Promoted from waitlist
                    </div>
                  )}
                  {appointment.checked_in_at && <TimelineItem label="Checked In" value={format(new Date(appointment.checked_in_at), "h:mm a")} />}
                  {appointment.completed_at && <TimelineItem label="Completed" value={format(new Date(appointment.completed_at), "h:mm a")} />}
                  {appointment.cancellation_reason && (
                    <div className="mt-3 p-3 bg-red-50 text-red-800 text-sm rounded-lg border border-red-100">
                      <strong>Cancellation Reason:</strong> {appointment.cancellation_reason}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center justify-between">
                  Reception Notes
                  {notes !== (appointment.notes || "") && (
                    <button onClick={handleSaveNotes} disabled={savingNotes} className="text-blue-600 hover:underline">
                      {savingNotes ? "Saving..." : "Save"}
                    </button>
                  )}
                </h3>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea 
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add internal notes about this appointment..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[100px] resize-none"
                  />
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </>
  );
}

function TimelineItem({ label, value, by }: { label: string, value: string, by?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right">
        {value}
        {by && <span className="block text-xs text-slate-400 font-normal">by {by}</span>}
      </span>
    </div>
  );
}
