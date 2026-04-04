"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Calendar, 
  Clock, 
  ArrowRightLeft,
  User,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  AlertCircle
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, addMinutes, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useAppointmentActions } from "../../hooks/useAppointmentActions";
import { appointmentsApi } from "@/lib/api/appointments";
import { providersApi } from "@/lib/api/providers";

interface RescheduleDialogProps {
  appointment: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RescheduleDialog({
  appointment,
  isOpen,
  onClose,
  onSuccess,
}: RescheduleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const { reschedule, processing } = useAppointmentActions(() => {
    onSuccess();
    onClose();
  });

  // Load providers for same service
  useEffect(() => {
    if (isOpen && appointment?.service_id) {
      const loadProviders = async () => {
        setLoading(true);
        try {
          const res = await providersApi.getProviders({ service_id: appointment.service_id });
          if (res.success) setProviders(res.data);
          setSelectedProvider(appointment.provider_id);
          setSelectedDate(new Date().toISOString().split('T')[0]);
        } finally {
          setLoading(false);
        }
      };
      loadProviders();
    }
  }, [isOpen, appointment?.service_id, appointment?.provider_id]);

  // Load slots
  useEffect(() => {
    if (selectedProvider && selectedDate && appointment?.service_id) {
       const fetchSlots = async () => {
         try {
           const res = await appointmentsApi.getAvailableSlots(selectedProvider, selectedDate, appointment.service_id);
           if (res.success) setSlots(res.data.slots || []);
         } catch (err) {
           console.error("Failed to fetch slots", err);
         }
       };
       fetchSlots();
    }
  }, [selectedProvider, selectedDate, appointment?.service_id]);

  const handleReschedule = async () => {
    if (!selectedSlot) return;
    await reschedule(appointment.id, {
      provider_id: selectedProvider,
      service_id: appointment.service_id,
      appointment_start: selectedSlot.start,
      appointment_end: selectedSlot.end,
      notes: appointment.notes
    });
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white">
        <div className="bg-blue-600 p-8 text-white flex justify-between items-start relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
             <ArrowRightLeft className="w-48 h-48 -mr-12 -mt-12 rotate-12" />
          </div>
          <div className="relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 mb-4 shadow-sm">
                <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-3xl font-black tracking-tighter mb-1">
              Atomic Reschedule
            </DialogTitle>
            <DialogDescription className="text-blue-100 font-bold text-[11px] font-mono uppercase tracking-widest">
              ID: {appointment.appointment_number} • Patient: {appointment.patient?.name}
            </DialogDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-white/10 text-white/80 relative z-10">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-5 h-[480px]">
          {/* Left Panel: Providers & Date */}
          <div className="col-span-2 border-r border-slate-100 bg-slate-50/50 p-6 flex flex-col gap-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Date</label>
              <Input 
                type="date" 
                className="h-12 rounded-2xl border-slate-200 bg-white shadow-sm font-bold text-sm"
                value={selectedDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Select Provider</label>
              <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="space-y-2">
                   {providers.map(p => (
                     <button
                        key={p.id}
                        onClick={() => setSelectedProvider(p.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 group",
                          selectedProvider === p.id 
                            ? "bg-white border-blue-200 shadow-md ring-1 ring-blue-50" 
                            : "bg-transparent border-transparent hover:bg-white hover:border-slate-200"
                        )}
                     >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-colors",
                          selectedProvider === p.id ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "bg-white text-slate-400 border border-slate-200 group-hover:border-blue-200"
                        )}>
                          {p.user.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn("text-sm font-bold truncate leading-tight mb-0.5", selectedProvider === p.id ? "text-slate-800" : "text-slate-500")}>{p.user.name}</div>
                          <div className="text-[10px] text-slate-400 font-medium truncate">{p.specialization?.name}</div>
                        </div>
                     </button>
                   ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Right Panel: Slot Selection */}
          <div className="col-span-3 p-8 flex flex-col min-h-0 bg-white">
            <div className="flex items-center justify-between mb-6">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Time Slots</label>
               {selectedSlot && (
                 <Badge variant="outline" className="rounded-lg bg-blue-50 text-blue-600 border-blue-100 font-black text-[9px] uppercase tracking-wider py-0.5 px-2">
                   Selected: {format(parseISO(selectedSlot.start), "HH:mm")}
                 </Badge>
               )}
            </div>

            <ScrollArea className="flex-1 -mx-2 px-2">
               {slots.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center py-20 text-center px-8">
                    <AlertCircle className="w-12 h-12 text-slate-200 mb-4" />
                    <p className="text-sm font-bold text-slate-500">No Free Slots</p>
                    <p className="text-xs text-slate-400 font-medium">The selected provider is fully booked or on leave for this day.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-3 gap-3">
                    {slots.map((slot, i) => (
                      <button
                        key={i}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot)}
                        className={cn(
                          "p-4 rounded-3xl border transition-all text-center group relative",
                          !slot.available && "opacity-30 grayscale pointer-events-none",
                          selectedSlot?.start === slot.start
                            ? "bg-blue-600 border-blue-600 shadow-xl shadow-blue-100 -translate-y-1"
                            : "bg-slate-50 border-slate-100 hover:border-blue-200 hover:bg-white"
                        )}
                      >
                         <div className={cn("text-xs font-black tracking-tight", selectedSlot?.start === slot.start ? "text-white" : "text-slate-600")}>
                           {format(parseISO(slot.start), "hh:mm aa")}
                         </div>
                         {selectedSlot?.start === slot.start && (
                           <div className="absolute -top-1 -right-1">
                              <ShieldCheck className="w-4 h-4 text-white fill-blue-600" />
                           </div>
                         )}
                      </button>
                    ))}
                 </div>
               )}
            </ScrollArea>

            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-4 bg-white/80 backdrop-blur sticky bottom-0">
               <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Clock className="w-5 h-5" />
               </div>
               <div className="flex-1">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Estimated Change</div>
                  <div className="text-sm font-bold text-slate-700">
                    {selectedSlot ? (
                      <>{format(new Date(appointment.appointment_start), "MMM dd")} → <span className="text-blue-600">{format(parseISO(selectedSlot.start), "MMM dd")}</span></>
                    ) : 'Pending selection'}
                  </div>
               </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="flex-1 h-14 rounded-2xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          >
            Abort Change
          </Button>
          <Button 
            onClick={handleReschedule}
            disabled={!selectedSlot || processing}
            className="flex-[1.5] h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-xl shadow-blue-100"
          >
            {processing ? "Updating Registry..." : "Confirm Reschedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
