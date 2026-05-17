"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { appointmentsApi } from "@/lib/api/appointments";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CancelAppointmentDialogProps {
  appointmentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CancelAppointmentDialog({
  appointmentId,
  isOpen,
  onClose,
  onSuccess,
}: CancelAppointmentDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!appointmentId) return;
    if (reason.length < 10) {
      toast.error("Please provide a reason of at least 10 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await appointmentsApi.updateStatus(appointmentId, "cancelled", reason);
      if (res.success) {
        toast.success("Appointment cancelled successfully");
        onSuccess();
        onClose();
        setReason("");
      }
    } catch (e) {
      toast.error("Failed to cancel appointment");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[120] transition-opacity" onClick={onClose} />
      
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-[130] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">Cancel Appointment</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 bg-slate-50/50">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3 text-amber-800 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong className="block mb-1">Waitlist Auto-Promotion Active</strong>
              Cancelling this appointment will trigger the system to automatically notify the next eligible patient on the waitlist for this slot.
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Reason for Cancellation</label>
            <textarea 
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g., Patient requested cancellation due to illness..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 min-h-[100px] resize-none"
            />
            <div className="text-[10px] text-right text-slate-400">{reason.length}/10 min characters</div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            Keep Appointment
          </button>
          <button 
            onClick={handleCancel}
            disabled={loading || reason.length < 10}
            className="px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-xl shadow-md shadow-red-600/20 disabled:opacity-50 hover:bg-red-700 transition-colors"
          >
            {loading ? "Cancelling..." : "Confirm Cancellation"}
          </button>
        </div>
      </div>
    </>
  );
}
