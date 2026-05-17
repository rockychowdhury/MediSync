"use client";

import { useState, useEffect } from "react";
import { X, Clock, Loader2 } from "lucide-react";
import { waitlistApi } from "@/lib/api/waitlist";
import { servicesApi } from "@/lib/api/services";
import { providersApi } from "@/lib/api/providers";
import { PatientSearchInput } from "@/components/dashboard/receptionist/PatientSearchInput";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddToWaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddToWaitlistModal({ isOpen, onClose, onSuccess }: AddToWaitlistModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  
  const [patient, setPatient] = useState<any>(null);
  const [serviceId, setServiceId] = useState("");
  const [priority, setPriority] = useState<"standard"|"urgent"|"emergency">("standard");
  const [providerId, setProviderId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPatient(null);
      setServiceId("");
      setPriority("standard");
      setProviderId("");
      setNotes("");
      
      servicesApi.getServices().then(res => { if (res.success) setServices(res.data); });
      providersApi.getProviders().then(res => { if (res.success) setProviders(res.data); });
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload: any = {
        patient_id: patient.id,
        service_id: serviceId,
        priority: priority,
        notes: notes || undefined,
      };
      if (providerId) payload.preferred_provider_id = providerId;
      
      const res = await waitlistApi.addToWaitlist(payload);
      if (res.success) {
        toast.success("Added to waitlist");
        onSuccess();
        onClose();
      }
    } catch (e) {
      toast.error("Failed to add to waitlist");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity" onClick={onClose} />
      
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-[70] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Add to Waitlist</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 bg-slate-50/50">
          
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Patient *</label>
            {patient ? (
              <div className="p-3 border border-slate-200 bg-white rounded-xl flex items-center justify-between">
                <span className="font-bold text-slate-900">{patient.name}</span>
                <button onClick={() => setPatient(null)} className="text-xs font-bold text-blue-600 hover:underline">Change</button>
              </div>
            ) : (
              <PatientSearchInput onSelect={setPatient} />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Service Required *</label>
            <select 
              value={serviceId} onChange={e => setServiceId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="">Select Service...</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Priority *</label>
            <div className="flex gap-2">
              {(["standard", "urgent", "emergency"] as const).map(p => (
                <label key={p} className={cn(
                  "flex-1 text-center p-2 rounded-xl border cursor-pointer transition-all",
                  priority === p ? 
                    p === "emergency" ? "border-red-600 bg-red-50 text-red-700 font-bold" :
                    p === "urgent" ? "border-amber-500 bg-amber-50 text-amber-700 font-bold" :
                    "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                )}>
                  <input type="radio" className="sr-only" checked={priority === p} onChange={() => setPriority(p)} />
                  <span className="capitalize text-sm">{p}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Preferred Provider (Optional)</label>
            <select 
              value={providerId} onChange={e => setProviderId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="">No Preference</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Notes</label>
            <textarea 
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g., Prefers morning appointments..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 min-h-[80px] resize-none"
            />
          </div>

        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading || !patient || !serviceId} 
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-md hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Join Waitlist
          </button>
        </div>
      </div>
    </>
  );
}
