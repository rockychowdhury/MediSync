"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { X, Loader2 } from "lucide-react";
import { providersApi } from "@/lib/api/providers";
import { appointmentsApi } from "@/lib/api/appointments";
import { waitlistApi } from "@/lib/api/waitlist";
import { CapacityBar } from "@/components/dashboard/receptionist/CapacityBar";
import { toast } from "sonner";
import type { QueueEntry } from "@/types/queue";

interface AssignWaitlistModalProps {
  entry: QueueEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignWaitlistModal({ entry, isOpen, onClose, onSuccess }: AssignWaitlistModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [providers, setProviders] = useState<any[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && entry) {
      setStep(1); setSelectedProvider(null); setSelectedSlot(null);
      setSelectedDate(entry.requested_date || format(new Date(), "yyyy-MM-dd"));
      const fetchProviders = async () => {
        setLoadingProviders(true);
        try {
          const [provRes, utilRes] = await Promise.all([
            providersApi.getProviders(),
            fetch("/api/v1/dashboard/provider-utilisation").then(r => r.json()).catch(() => null),
          ]);
          if (provRes.success) {
            const utilMap = new Map<string, any>();
            if (utilRes?.success && utilRes.data?.providers) {
              for (const u of utilRes.data.providers) utilMap.set(u.provider_id, u);
            }
            setProviders(provRes.data.map((p: any) => {
              const util = utilMap.get(p.id);
              return { ...p, max_capacity: util?.max_capacity || p.daily_capacity || 8, current_load: util?.current_load ?? 0 };
            }));
          }
        } catch { toast.error("Failed to load providers"); }
        finally { setLoadingProviders(false); }
      };
      fetchProviders();
    }
  }, [isOpen, entry]);

  // Fetch real slots when step 2 is reached
  useEffect(() => {
    if (step === 2 && selectedProvider && entry?.service_id) {
      const fetchSlots = async () => {
        setLoadingSlots(true); setAvailableSlots([]); setSelectedSlot(null);
        try {
          const res = await appointmentsApi.getAvailableSlots(selectedProvider, selectedDate, entry.service_id!);
          if (res.success && res.data?.slots) setAvailableSlots(res.data.slots);
        } catch { toast.error("Failed to load slots"); }
        finally { setLoadingSlots(false); }
      };
      fetchSlots();
    }
  }, [step, selectedProvider, selectedDate, entry]);

  const fmtSlot = (iso: string) => {
    try {
      if (iso.includes("T")) { const d = new Date(iso); return format(d, "h:mm a"); }
      const [h, m] = iso.split(":"); const d = new Date(); d.setHours(+h); d.setMinutes(+m); return format(d, "h:mm a");
    } catch { return iso; }
  };

  const handleAssign = async () => {
    if (!entry || !selectedProvider || !selectedSlot) return;
    setIsSubmitting(true);
    try {
      const res = await waitlistApi.manualAssign(entry.id, {
        provider_id: selectedProvider,
        appointment_start: selectedSlot.start.includes("T") ? selectedSlot.start : `${selectedDate}T${selectedSlot.start}:00`,
      });
      if (res.success) { toast.success(`Assigned to ${fmtSlot(selectedSlot.start)}`); onSuccess(); onClose(); }
    } catch { toast.error("Failed to assign appointment"); }
    finally { setIsSubmitting(false); }
  };

  if (!isOpen || !entry) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-900">Assign from Waitlist</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">{entry.patient_name} — {entry.service_name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto hidden-scrollbar bg-slate-50/50 flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700">Step 1: Select Provider</h3>
              {loadingProviders ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
              ) : providers.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {providers.map(p => (
                    <label key={p.id} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${selectedProvider === p.id ? "border-blue-600 bg-blue-50/50" : "border-slate-200 bg-white hover:border-blue-300"}`}>
                      <div className="flex items-center gap-4">
                        <input type="radio" name="provider" className="w-4 h-4 text-blue-600 focus:ring-blue-500" checked={selectedProvider === p.id} onChange={() => setSelectedProvider(p.id)} />
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            {p.full_name}
                            {entry.preferred_provider_name === p.full_name && (
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">Patient Pref</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">{p.specialization?.name || "Provider"}</div>
                        </div>
                      </div>
                      <div className="w-32"><CapacityBar current={p.current_load} max={p.max_capacity} showLabel /></div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 text-center rounded-xl border border-slate-200"><p className="text-sm font-medium text-slate-600">No providers available.</p></div>
              )}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-700 flex items-center justify-between">
                Step 2: Select Date & Time
                <button onClick={() => setStep(1)} className="text-blue-600 hover:underline text-xs">← Back to Providers</button>
              </h3>
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Select Date</label>
                  <input type="date" value={selectedDate} min={format(new Date(), "yyyy-MM-dd")} onChange={e => setSelectedDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Available Slots</label>
                  {loadingSlots ? (
                    <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableSlots.map((slot, idx) => (
                        <button key={idx} disabled={!slot.available} onClick={() => setSelectedSlot(slot)}
                          className={`py-2 rounded-lg text-sm font-bold transition-all border ${!slot.available ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed opacity-60' : selectedSlot?.start === slot.start ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400'}`}
                          title={slot.reason}>{fmtSlot(slot.start)}</button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-sm text-slate-400 bg-slate-50 rounded-xl border border-slate-100 border-dashed">No available slots for this date</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
          {step === 1 ? (
            <button onClick={() => setStep(2)} disabled={!selectedProvider} className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-md disabled:opacity-50 hover:bg-slate-800 transition-colors">Next Step →</button>
          ) : (
            <button onClick={handleAssign} disabled={!selectedSlot || isSubmitting} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 hover:bg-blue-700 transition-colors">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}Assign & Book</button>
          )}
        </div>
      </div>
    </>
  );
}
