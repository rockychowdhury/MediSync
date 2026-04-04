"use client";

import React, { useState } from "react";
import { 
  AlertTriangle, 
  X, 
  Info,
  CalendarX,
  MessageSquare,
  ShieldAlert
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppointmentActions } from "../../hooks/useAppointmentActions";

interface CancelDialogProps {
  appointment: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CancelDialog({
  appointment,
  isOpen,
  onClose,
  onSuccess,
}: CancelDialogProps) {
  const [reason, setReason] = useState("");
  const { updateStatus, processing } = useAppointmentActions(() => {
    onSuccess();
    onClose();
    setReason("");
  });

  const handleCancel = async () => {
    if (!reason.trim()) return;
    await updateStatus(appointment.id, "cancelled", reason);
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white/95 backdrop-blur-xl">
        <div className="bg-rose-600 p-8 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
             <CalendarX className="w-32 h-32 -mr-8 -mt-8 rotate-12" />
          </div>
          <div className="relative z-10 flex items-center justify-between mb-4">
             <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                <AlertTriangle className="w-6 h-6 text-white" />
             </div>
             <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-white/10 text-white/80">
                <X className="w-4 h-4" />
             </Button>
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight mb-1 relative z-10">
            Terminate Appointment
          </DialogTitle>
          <DialogDescription className="text-rose-100 font-medium text-xs uppercase tracking-widest relative z-10">
            REGISTRY UNIT: {appointment.appointment_number}
          </DialogDescription>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex gap-4 items-start ring-1 ring-black/[0.02]">
             <div className="mt-1 h-8 w-8 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-rose-500 shadow-sm">
                <ShieldAlert className="w-4 h-4" />
             </div>
             <div>
                <p className="text-sm font-bold text-slate-800 leading-tight mb-1">Impact Analysis</p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                   Cancellation will free up the slot for {appointment.provider?.user?.name} and trigger waitlist automation for wait times. This action is logged for clinical auditing.
                </p>
             </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Formal Cancellation Reason</label>
             </div>
             <Textarea 
                placeholder="Briefly explain the cause (e.g., patient emergency, clinic reschedule)..."
                className="min-h-[120px] rounded-2xl border-slate-200 focus:ring-blue-600 focus:border-blue-600 bg-slate-50/50 transition-all resize-none shadow-inner"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
             />
             <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium pl-1">
                <Info className="w-3 h-3" />
                This explanation will be shared with the provider and stored in logs.
             </div>
          </div>
        </div>

        <DialogFooter className="p-8 pt-0 flex gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="flex-1 h-14 rounded-2xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          >
            Go Back
          </Button>
          <Button 
            onClick={handleCancel}
            disabled={!reason.trim() || processing}
            className="flex-[1.5] h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-rose-100 disabled:opacity-50"
          >
            {processing ? "Processing..." : "Confirm Termination"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
