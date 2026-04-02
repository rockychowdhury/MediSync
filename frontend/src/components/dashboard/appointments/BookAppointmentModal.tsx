"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { appointmentsApi } from "@/lib/api/appointments";
import { patientsApi } from "@/lib/api/patients";
import { servicesApi } from "@/lib/api/services";
import { providersApi } from "@/lib/api/providers";

import { Loader2, Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { format, addHours, startOfToday } from "date-fns";
import { cn } from "@/lib/utils";

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: Date;
  prefilledPatientId?: string | null;
}

export function BookAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  initialDate = new Date(),
  prefilledPatientId,
}: BookAppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [patients, setPatients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    patient_id: "",
    service_id: "",
    provider_id: "",
    start_time: format(initialDate, "yyyy-MM-dd'T'HH:mm"),
    notes: "",
    priority: "normal",
  });

  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const loadInitialData = async () => {
        setFetching(true);
        try {
          const [pts, srvs, prvs] = await Promise.all([
            patientsApi.getPatients({ limit: 100 }),
            servicesApi.getServices(),
            providersApi.getProviders(),
          ]);
          if (pts.success) setPatients(pts.data);
          if (srvs.success) setServices(srvs.data);
          if (prvs.success) setProviders(prvs.data);
        } catch (error) {
          console.error("Failed to load modal data", error);
        } finally {
          setFetching(false);
        }
      };
      loadInitialData();
      // Auto-select prefilled patient when redirected from Patients page
      if (prefilledPatientId) {
        setFormData(prev => ({ ...prev, patient_id: prefilledPatientId }));
      }
    }
  }, [isOpen, prefilledPatientId]);


  const checkAvailability = async (providerId: string, time: string) => {
    if (!providerId || !time) return;
    try {
      const res = await appointmentsApi.getProviderCapacity(providerId, { 
        start_time: time,
        end_time: format(addHours(new Date(time), 1), "yyyy-MM-dd'T'HH:mm") 
      });
      if (res.success && res.data && res.data.available_slots === 0) {
        setAvailabilityError("This clinician is fully booked at the selected time.");
      } else {
        setAvailabilityError(null);
      }
    } catch (e) {
      console.warn("Availability check failed", e);
    }
  };

  useEffect(() => {
    if (formData.provider_id && formData.start_time) {
      checkAvailability(formData.provider_id, formData.start_time);
    }
  }, [formData.provider_id, formData.start_time]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await appointmentsApi.createAppointment(formData);
      if (res.success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Booking error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl border-slate-200 p-0 overflow-hidden bg-white shadow-2xl">
        <DialogHeader className="p-8 bg-slate-50/50 border-b border-slate-100">
           <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                <CalendarIcon className="w-5 h-5" />
              </div>
              Book New Appointment
           </DialogTitle>
           <DialogDescription className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 ml-1">
             Manual scheduler for administrative use.
           </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {fetching ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-xs font-bold uppercase">Preparing Clinician Data...</p>
            </div>
          ) : (
            <>
              {/* Patient Selection */}
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Patient</Label>
                <Select 
                  onValueChange={(val: string) => setFormData(p => ({ ...p, patient_id: val }))}
                  required
                >
                  <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white focus:ring-blue-500 font-semibold text-slate-700">
                    <SelectValue placeholder="Search or select patient..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl overflow-hidden">
                    {patients.map(p => (
                      <SelectItem key={p.id} value={p.id} className="cursor-pointer focus:bg-blue-50 transition-colors">
                         {p.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Service Selection */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Type</Label>
                  <Select 
                    onValueChange={(val: string) => setFormData(p => ({ ...p, service_id: val }))}
                    required
                  >
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white focus:ring-blue-500 font-semibold text-slate-700">
                      <SelectValue placeholder="Pick service" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl overflow-hidden">
                      {services.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Provider Selection */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinician</Label>
                  <Select 
                    onValueChange={(val: string) => setFormData(p => ({ ...p, provider_id: val }))}
                    required
                  >
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white focus:ring-blue-500 font-semibold text-slate-700">
                      <SelectValue placeholder="Assigned provider" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl overflow-hidden">
                      {providers.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.user?.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Date & Time */}
                <div className="space-y-2">
                   <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Scheduled At</Label>
                   <Input 
                    type="datetime-local" 
                    value={formData.start_time}
                    min={format(startOfToday(), "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => setFormData(p => ({ ...p, start_time: e.target.value }))}
                    className="h-12 rounded-xl border-slate-200 bg-white focus:ring-blue-500 font-semibold text-slate-700 text-sm"
                   />
                </div>

                {/* Priority Selection */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Urgency</Label>
                  <Select 
                    defaultValue="normal"
                    onValueChange={(val: string) => setFormData(p => ({ ...p, priority: val }))}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white focus:ring-blue-500 font-semibold text-slate-700">
                      <SelectValue placeholder="Priority level" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl overflow-hidden">
                      <SelectItem value="low">Low (Routine)</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High (Urgent)</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {availabilityError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-red-600 uppercase tracking-tight leading-relaxed">
                    {availabilityError}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                 <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinician Notes (Optional)</Label>
                 <Input 
                  placeholder="Reason for appointment or special instructions..."
                  value={formData.notes}
                  onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                  className="h-12 rounded-xl border-slate-200 bg-white focus:ring-blue-500 font-semibold text-slate-700 placeholder:text-slate-300"
                 />
              </div>
            </>
          )}
        </form>

        <DialogFooter className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="flex-1 h-12 rounded-2xl font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest text-xs"
          >
            Cancel Session
          </Button>
          <Button 
            disabled={loading || fetching || !!availabilityError}
            onClick={handleSubmit}
            className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-100 text-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Confirm Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
