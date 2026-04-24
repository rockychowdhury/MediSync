"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { X, Calendar as CalendarIcon, Loader2 } from "lucide-react";
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
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && entry) {
      setStep(1);
      setSelectedProvider(null);
      setSelectedSlot(null);
      setSelectedDate(entry.requested_date || format(new Date(), "yyyy-MM-dd"));
      
      const fetchProviders = async () => {
        setLoadingProviders(true);
        try {
          // If the backend had the precise filtering endpoint:
          // const res = await providersApi.getProviders({ service_id: entry.service_id, date: selectedDate, priority: entry.priority });
          const res = await providersApi.getProviders(); // Fallback for now
          if (res.success) {
            setProviders(res.data.map((p: any) => ({ ...p, max_capacity: 8, current_load: Math.floor(Math.random() * 8) }))); // Mock capacity for UI demo
          }
        } catch (e) {
          toast.error("Failed to load providers");
        } finally {
          setLoadingProviders(false);
        }
      };
      
      fetchProviders();
    }
  }, [isOpen, entry]);

  useEffect(() => {
    if (step === 2 && selectedProvider) {
      const fetchSlots = async () => {
        setLoadingSlots(true);
        try {
          // Waitlist manual assign expects us to find a slot. 
          // If the available-slots endpoint is not ready, we will mock a few slots.
          // const res = await appointmentsApi.getAvailableSlots(selectedProvider, selectedDate, entry!.service_id!);
          
          // Mock slots
          setTimeout(() => {
            const mockSlots = [
              { start: "09:00", available: false, reason: "Booked" },
              { start: "09:30", available: true },
              { start: "10:00", available: true },
              { start: "10:30", available: true },
              { start: "11:00", available: false, reason: "Break" },
            ];
            setAvailableSlots(mockSlots);
            setLoadingSlots(false);
          }, 500);
        } catch (e) {
          toast.error("Failed to load slots");
          setLoadingSlots(false);
        }
      };
      
      fetchSlots();
    }
  }, [step, selectedProvider, selectedDate, entry]);

  const handleAssign = async () => {
    if (!entry || !selectedProvider || !selectedSlot) return;
    
    setIsSubmitting(true);
    try {
      // Create appointment and mark waitlist as assigned
      const payload = {
        provider_id: selectedProvider,
        appointment_start: `${selectedDate}T${selectedSlot}:00Z`,
      };
      
      const res = await waitlistApi.manualAssign(entry.id, payload);
      
      if (res.success) {
        toast.success(`Assigned to ${selectedSlot}`);
        onSuccess();
        onClose();
      }
    } catch (e) {
      toast.error("Failed to assign appointment");
    } finally {
      setIsSubmitting(false);
    }
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
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
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
                    <label 
                      key={p.id} 
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${selectedProvider === p.id ? "border-blue-600 bg-blue-50/50" : "border-slate-200 bg-white hover:border-blue-300"}`}
                    >
                      <div className="flex items-center gap-4">
                        <input 
                          type="radio" 
                          name="provider" 
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
                          checked={selectedProvider === p.id}
                          onChange={() => setSelectedProvider(p.id)}
                        />
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
                      <div className="w-32">
                        <CapacityBar current={p.current_load} max={p.max_capacity} showLabel />
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 text-center rounded-xl border border-slate-200">
                  <p className="text-sm font-medium text-slate-600">No providers available for this service.</p>
                </div>
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
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Available Slots</label>
                  {loadingSlots ? (
                    <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableSlots.map((slot, idx) => (
                        <button
                          key={idx}
                          disabled={!slot.available}
                          onClick={() => setSelectedSlot(slot.start)}
                          className={`py-2 rounded-lg text-sm font-bold transition-all border ${
                            !slot.available 
                              ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed opacity-60' 
                              : selectedSlot === slot.start
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400'
                          }`}
                          title={slot.reason}
                        >
                          {slot.start}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            Cancel
          </button>
          
          {step === 1 ? (
            <button 
              onClick={() => setStep(2)}
              disabled={!selectedProvider}
              className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-md disabled:opacity-50 hover:bg-slate-800 transition-colors"
            >
              Next Step →
            </button>
          ) : (
            <button 
              onClick={handleAssign}
              disabled={!selectedSlot || isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Assign & Book
            </button>
          )}
        </div>
      </div>
    </>
  );
}
