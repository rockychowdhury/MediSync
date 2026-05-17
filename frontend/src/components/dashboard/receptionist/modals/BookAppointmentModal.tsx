"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Clock, User, Stethoscope, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { PatientSearchInput } from "@/components/dashboard/receptionist/PatientSearchInput";
import { PatientFormDrawer } from "@/components/dashboard/receptionist/modals/PatientFormDrawer";
import { servicesApi } from "@/lib/api/services";
import { providersApi } from "@/lib/api/providers";
import { appointmentsApi } from "@/lib/api/appointments";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefillPatientId?: string;
  prefillServiceId?: string;
  rescheduleAppointmentId?: string;
}

interface SlotData {
  start: string; end: string; available: boolean; reason?: string | null;
  provider_id?: string; provider_name?: string;
}

export function BookAppointmentModal({
  isOpen, onClose, onSuccess, prefillPatientId, prefillServiceId, rescheduleAppointmentId,
}: BookAppointmentModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [priority, setPriority] = useState<"standard"|"urgent"|"emergency">("standard");
  const [autoAssign, setAutoAssign] = useState(true);
  const [provider, setProvider] = useState<any>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [timeSlot, setTimeSlot] = useState<SlotData | null>(null);
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (!prefillPatientId) setPatient(null);
      if (!prefillServiceId) setService(null);
      setPriority("standard"); setAutoAssign(true); setProvider(null);
      setTimeSlot(null); setDate(format(new Date(), "yyyy-MM-dd")); setSlots([]);
      servicesApi.getServices().then(r => { if (r.success) setServices(r.data); });
      providersApi.getProviders().then(r => { if (r.success) setProviders(r.data); });
    }
  }, [isOpen, prefillPatientId, prefillServiceId]);

  useEffect(() => {
    if (step !== 3 || !service) return;
    if (!autoAssign && provider && date) {
      fetchSlots(provider.id, date, service.id);
    } else if (autoAssign && date && providers.length > 0) {
      fetchSlotsAutoAssign(date, service.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, date, provider, autoAssign, service]);

  const fetchSlots = async (pid: string, d: string, sid: string) => {
    setLoadingSlots(true); setSlots([]); setTimeSlot(null);
    try {
      const res = await appointmentsApi.getAvailableSlots(pid, d, sid);
      if (res.success && res.data?.slots) setSlots(res.data.slots);
    } catch { toast.error("Failed to load time slots"); }
    finally { setLoadingSlots(false); }
  };

  const fetchSlotsAutoAssign = async (d: string, sid: string) => {
    setLoadingSlots(true); setSlots([]); setTimeSlot(null);
    try {
      const all: SlotData[] = [];
      for (const p of providers.slice(0, 5)) {
        try {
          const res = await appointmentsApi.getAvailableSlots(p.id, d, sid);
          if (res.success && res.data?.slots) {
            for (const s of res.data.slots) {
              if (s.available) all.push({ ...s, provider_id: p.id, provider_name: p.full_name });
            }
          }
        } catch { /* skip */ }
      }
      const seen = new Set<string>();
      const unique = all.filter(s => { if (seen.has(s.start)) return false; seen.add(s.start); return true; });
      unique.sort((a, b) => a.start.localeCompare(b.start));
      setSlots(unique);
    } catch { /* ignore */ }
    finally { setLoadingSlots(false); }
  };

  const fmtSlot = (iso: string) => {
    try {
      if (iso.includes("T")) return format(parseISO(iso), "h:mm a");
      const [h, m] = iso.split(":"); const d = new Date(); d.setHours(+h); d.setMinutes(+m);
      return format(d, "h:mm a");
    } catch { return iso; }
  };

  const handleBook = async () => {
    setLoading(true);
    try {
      if (rescheduleAppointmentId && timeSlot) {
        const res = await appointmentsApi.reschedule(rescheduleAppointmentId, {
          appointment_start: timeSlot.start, appointment_end: timeSlot.end,
          provider_id: autoAssign ? (timeSlot.provider_id || providers[0]?.id) : provider.id,
        });
        if (res.success) toast.success("Appointment rescheduled");
      } else {
        const res = await appointmentsApi.createAppointment({
          patient_id: patient.id, service_id: service.id,
          provider_id: autoAssign ? (timeSlot?.provider_id || providers[0]?.id) : provider.id,
          appointment_start: timeSlot?.start, appointment_end: timeSlot?.end, priority,
        });
        if (res.success) toast.success("Appointment booked");
      }
      onSuccess(); onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to book appointment");
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-white rounded-2xl shadow-2xl z-50 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {rescheduleAppointmentId ? "Reschedule Appointment" : "Book New Appointment"}
            </h2>
            {rescheduleAppointmentId && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase tracking-wider">Rescheduling Flow</span>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        {/* Stepper */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-6 py-3">
          {[1,2,3,4].map(s => (
            <div key={s} className="flex-1 flex items-center">
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors", step === s ? "bg-blue-600 text-white" : step > s ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500")}>
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              <div className="ml-2 text-xs font-bold uppercase tracking-wider hidden sm:block mr-2" style={{ color: step >= s ? '#0f172a' : '#94a3b8' }}>
                {s === 1 ? "Patient" : s === 2 ? "Service" : s === 3 ? "Time" : "Confirm"}
              </div>
              {s < 4 && <div className="flex-1 h-px bg-slate-200 mx-2" />}
            </div>
          ))}
        </div>
        {/* Content */}
        <div className="p-6 overflow-y-auto hidden-scrollbar flex-1 bg-white">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <h3 className="text-sm font-bold text-slate-700">Find or Create Patient</h3>
              {patient ? (
                <div className="p-4 border border-blue-200 bg-blue-50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm"><User className="w-5 h-5" /></div>
                    <div>
                      <div className="font-bold text-slate-900">{patient.name}</div>
                      <div className="text-xs text-slate-500">{patient.phone || patient.email || "No contact info"}</div>
                    </div>
                  </div>
                  <button onClick={() => setPatient(null)} className="text-xs font-bold text-blue-600 hover:underline">Change</button>
                </div>
              ) : (
                <PatientSearchInput onSelect={setPatient} autoFocus onCreateNew={() => setIsPatientFormOpen(true)} />
              )}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-300">
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3">Select Service</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services.map(s => (
                    <label key={s.id} className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all", service?.id === s.id ? "border-blue-600 bg-blue-50/50 shadow-sm" : "border-slate-200 hover:border-blue-300")}>
                      <input type="radio" name="service" className="w-4 h-4 text-blue-600" checked={service?.id === s.id} onChange={() => setService(s)} />
                      <div><div className="font-bold text-slate-900 text-sm">{s.name}</div><div className="text-xs text-slate-500">{s.duration_minutes} min</div></div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3">Priority Level</h3>
                <div className="flex gap-3">
                  {(["standard", "urgent", "emergency"] as const).map(p => (
                    <label key={p} className={cn("flex-1 text-center p-3 rounded-xl border cursor-pointer transition-all", priority === p ? (p === "emergency" ? "border-red-600 bg-red-50 text-red-700 font-bold" : p === "urgent" ? "border-amber-500 bg-amber-50 text-amber-700 font-bold" : "border-blue-600 bg-blue-50 text-blue-700 font-bold") : "border-slate-200 text-slate-600 hover:border-slate-300")}>
                      <input type="radio" className="sr-only" checked={priority === p} onChange={() => setPriority(p)} /><span className="capitalize text-sm">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div><h4 className="font-bold text-slate-800 text-sm">Provider Assignment</h4><p className="text-xs text-slate-500">Auto-assign or select specifically.</p></div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={autoAssign} onChange={e => { setAutoAssign(e.target.checked); setProvider(null); setTimeSlot(null); }} />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${autoAssign ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${autoAssign ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <span className="text-xs font-bold text-slate-700">Auto Assign</span>
                </label>
              </div>
              {!autoAssign && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Select Provider</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                    {providers.map(p => (
                      <label key={p.id} className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all", provider?.id === p.id ? "border-blue-600 bg-blue-50/50 shadow-sm" : "border-slate-200 hover:border-blue-300")}>
                        <input type="radio" className="sr-only" checked={provider?.id === p.id} onChange={() => { setProvider(p); setTimeSlot(null); }} />
                        <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center", provider?.id === p.id ? "border-blue-600" : "border-slate-300")}>{provider?.id === p.id && <div className="w-2 h-2 rounded-full bg-blue-600" />}</div>
                        <div className="font-bold text-slate-900 text-sm">{p.full_name}</div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Select Date</h3>
                  <input type="date" value={date} min={format(new Date(), "yyyy-MM-dd")} onChange={e => { setDate(e.target.value); setTimeSlot(null); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Available Slots</h3>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                  ) : slots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {slots.map((slot, idx) => (
                        <button key={idx} disabled={!slot.available} onClick={() => setTimeSlot(slot)}
                          className={cn("py-2 rounded-lg text-sm font-bold transition-all border text-center", !slot.available ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed opacity-60' : timeSlot?.start === slot.start ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400')}
                          title={slot.reason || undefined}>{fmtSlot(slot.start)}</button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-sm text-slate-400 bg-slate-50 rounded-xl border border-slate-100 border-dashed">{(!autoAssign && !provider) ? "Select a provider first" : "No slots available"}</div>
                  )}
                </div>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Calendar className="w-8 h-8" /></div>
                <h3 className="text-lg font-black text-slate-900 mb-1">Ready to Confirm</h3>
                <p className="text-sm text-slate-500">Please review the details below.</p>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 px-4">
                <div className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient</span><span className="text-sm font-bold text-slate-900 flex items-center gap-2"><User className="w-3.5 h-3.5 text-slate-400" /> {patient?.name}</span></div>
                <div className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Service</span><span className="text-sm font-bold text-slate-900 flex items-center gap-2"><Stethoscope className="w-3.5 h-3.5 text-slate-400" /> {service?.name}</span></div>
                <div className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date & Time</span><span className="text-sm font-bold text-slate-900 flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-slate-400" /> {date} at {timeSlot ? fmtSlot(timeSlot.start) : "—"}</span></div>
                <div className="flex flex-col gap-1"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Provider</span><span className="text-sm font-bold text-slate-900">{autoAssign ? "Auto Assigned" : provider?.full_name}</span></div>
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white rounded-b-2xl">
          <button onClick={() => setStep(step - 1)} disabled={step === 1 || loading} className={cn("px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-0")}>Back</button>
          {step < 4 ? (
            <button onClick={() => setStep(step + 1)} disabled={(step === 1 && !patient) || (step === 2 && !service) || (step === 3 && (!timeSlot || (!autoAssign && !provider)))}
              className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-md disabled:opacity-50 hover:bg-slate-800 transition-colors">Continue <ChevronRight className="w-4 h-4" /></button>
          ) : (
            <button onClick={handleBook} disabled={loading} className="flex items-center gap-2 px-8 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 hover:bg-blue-700 transition-colors">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}Confirm Booking</button>
          )}
        </div>
      </div>
      <PatientFormDrawer patientId={null} isOpen={isPatientFormOpen} onClose={() => setIsPatientFormOpen(false)} onSuccess={() => { setIsPatientFormOpen(false); toast.success("Patient created — search and select them above."); }} />
    </>
  );
}
