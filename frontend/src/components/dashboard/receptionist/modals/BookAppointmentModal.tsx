"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Clock, User, Stethoscope, ChevronRight, CheckCircle2, Loader2, Shield, Search, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { PatientSearchInput } from "@/components/dashboard/receptionist/PatientSearchInput";
import { servicesApi } from "@/lib/api/services";
import { providersApi } from "@/lib/api/providers";
import { appointmentsApi } from "@/lib/api/appointments";
import { patientsApi } from "@/lib/api/patients";
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

  // Inline Patient Creation states
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    name: "",
    phone: "",
    email: "",
    date_of_birth: "",
    gender: "",
    notification_opt_out: false
  });
  const [registeringPatient, setRegisteringPatient] = useState(false);

  const handleRegisterPatientInline = async () => {
    if (!newPatientData.name.trim()) {
      toast.error("Patient name is required");
      return;
    }
    setRegisteringPatient(true);
    try {
      const res = await patientsApi.createPatient(newPatientData);
      if (res.success) {
        toast.success("Patient registered and selected successfully");
        setPatient(res.data);
        setShowNewPatientForm(false);
        setNewPatientData({
          name: "", phone: "", email: "", date_of_birth: "", gender: "", notification_opt_out: false
        });
        window.dispatchEvent(new CustomEvent("patient_created"));
      } else {
        toast.error("Failed to register patient");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to register patient");
    } finally {
      setRegisteringPatient(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setShowNewPatientForm(false);
      setNewPatientData({
        name: "", phone: "", email: "", date_of_birth: "", gender: "", notification_opt_out: false
      });
      if (prefillPatientId) {
        patientsApi.getPatient(prefillPatientId).then(r => {
          if (r.success) setPatient(r.data);
        });
      } else {
        setPatient(null);
      }
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
      <div 
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-[1.5px] z-[100] animate-in fade-in duration-250 ease-out will-change-[opacity]" 
        onClick={onClose} 
      />
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform-gpu w-full max-w-2xl min-h-[600px] max-h-[600px] bg-white rounded-[28px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] z-[100] flex flex-col overflow-hidden animate-in zoom-in-[97%] duration-300 cubic-bezier(0.16, 1, 0.3, 1) will-change-[transform,opacity] border border-slate-100/50"
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white relative z-10 shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {rescheduleAppointmentId ? "Reschedule Appointment" : "Book New Appointment"}
            </h2>
            {rescheduleAppointmentId && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase tracking-wider">Rescheduling Itinerary</span>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        
        {/* Stepper */}
        <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between max-w-md mx-auto relative">
            {/* Connecting Line Background */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200" />
            {/* Connecting Line Active */}
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 transition-all duration-500" 
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
            
            {[1,2,3,4].map(s => (
              <div key={s} className="relative z-10 flex flex-col items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 shadow-sm border-2",
                  step === s ? "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100 scale-105" : 
                  step > s ? "bg-emerald-500 border-emerald-500 text-white" : 
                  "bg-white border-slate-200 text-slate-400"
                )}>
                  {step > s ? <CheckCircle2 className="w-4 h-4 stroke-[3]" /> : s}
                </div>
                <span className={cn(
                  "absolute -bottom-6 text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-colors duration-300 hidden sm:block",
                  step >= s ? "text-slate-800" : "text-slate-400"
                )}>
                  {s === 1 ? "Patient" : s === 2 ? "Service" : s === 3 ? "Time" : "Confirm"}
                </span>
              </div>
            ))}
          </div>
          {/* Extra spacer for absolute bottom labels */}
          <div className="h-4 hidden sm:block" />
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto hidden-scrollbar flex-1 min-h-[380px] max-h-[380px] bg-white">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200 ease-out will-change-[opacity] min-h-[315px] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {showNewPatientForm ? "Create New Patient Profile" : "Patient Directory"}
                  </h3>
                  {patient && !showNewPatientForm && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200/50">
                      Selected
                    </span>
                  )}
                </div>

                {showNewPatientForm ? (
                  <div className="space-y-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name *</label>
                        <input 
                          type="text"
                          required
                          value={newPatientData.name}
                          onChange={e => setNewPatientData({ ...newPatientData, name: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone Number</label>
                        <input 
                          type="tel"
                          value={newPatientData.phone}
                          onChange={e => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
                          placeholder="e.g. (555) 123-4567"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</label>
                        <input 
                          type="email"
                          value={newPatientData.email}
                          onChange={e => setNewPatientData({ ...newPatientData, email: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
                          placeholder="e.g. john@example.com"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date of Birth</label>
                        <input 
                          type="date"
                          value={newPatientData.date_of_birth}
                          onChange={e => setNewPatientData({ ...newPatientData, date_of_birth: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-700"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gender</label>
                        <select 
                          value={newPatientData.gender}
                          onChange={e => setNewPatientData({ ...newPatientData, gender: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-700"
                        >
                          <option value="">Select...</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 mt-4 sm:col-span-2 bg-white p-3 rounded-xl border border-slate-100/60">
                        <input 
                          type="checkbox"
                          id="inline_opt_out"
                          checked={newPatientData.notification_opt_out}
                          onChange={e => setNewPatientData({ ...newPatientData, notification_opt_out: e.target.checked })}
                          className="text-blue-600 focus:ring-blue-500 rounded border-slate-300 w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="inline_opt_out" className="text-xs font-bold text-slate-500 cursor-pointer select-none">
                          Opt out of automated clinical notifications
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                      <button 
                        type="button" 
                        onClick={() => setShowNewPatientForm(false)}
                        className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        disabled={!newPatientData.name.trim() || registeringPatient}
                        onClick={handleRegisterPatientInline}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-98"
                      >
                        {registeringPatient && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                        Save & Select
                      </button>
                    </div>
                  </div>
                ) : patient ? (
                  <div className="p-4 border border border-blue-100 bg-blue-50/30 rounded-2xl flex items-center justify-between transition-all duration-300 hover:bg-blue-50/50">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-50">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-black text-slate-900 tracking-tight text-sm">{patient.name}</div>
                        <div className="text-[11px] text-slate-500 font-semibold mt-0.5">{patient.phone || patient.email || "No contact details provided"}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setPatient(null)} 
                      className="px-3 py-1.5 text-xs font-black text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      Change Patient
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <PatientSearchInput onSelect={setPatient} autoFocus onCreateNew={() => setShowNewPatientForm(true)} />
                    
                    {/* Visual Enhancement Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex gap-3.5 transition-all hover:bg-slate-50">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Search className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 tracking-tight mb-0.5">Quick Search</h4>
                          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">Instantly match existing records via patient name, email, or telephone.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowNewPatientForm(true)}
                        className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex gap-3.5 text-left hover:bg-blue-50/30 hover:border-blue-200 transition-all group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                          <Plus className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 tracking-tight mb-0.5 group-hover:text-blue-600 transition-colors">New Registration</h4>
                          <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">Enroll a first-time clinical profile immediately in the workspace queue.</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200 ease-out will-change-[opacity] min-h-[315px]">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Select Clinical Service</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  {services.map(s => (
                    <label 
                      key={s.id} 
                      className={cn(
                        "flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden group select-none",
                        service?.id === s.id ? "border-blue-600 bg-blue-50/30 shadow-md shadow-blue-500/5 ring-1 ring-blue-600/50" : "border-slate-100 bg-white hover:border-blue-300 hover:shadow-sm"
                      )}
                    >
                      <input 
                        type="radio" 
                        name="service" 
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 transition-all" 
                        checked={service?.id === s.id}
                        onChange={() => setService(s)}
                      />
                      <div className="flex-1">
                        <div className="font-black text-slate-900 tracking-tight text-sm group-hover:text-blue-600 transition-colors">{s.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {s.duration_minutes} Minutes
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Priority Assessment</h3>
                <div className="flex gap-3">
                  {(["standard", "urgent", "emergency"] as const).map(p => (
                    <label 
                      key={p} 
                      className={cn(
                        "flex-1 text-center p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 uppercase tracking-widest text-[10px] font-black select-none",
                        priority === p ? (
                          p === "emergency" ? "border-red-500 bg-red-50/50 text-red-700 ring-1 ring-red-500" :
                          p === "urgent" ? "border-amber-500 bg-amber-50/50 text-amber-700 ring-1 ring-amber-500" :
                          "border-blue-600 bg-blue-50/30 text-blue-700 ring-1 ring-blue-600"
                        ) : "border-slate-100 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                      )}
                    >
                      <input type="radio" className="sr-only" checked={priority === p} onChange={() => setPriority(p)} />
                      {p}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200 ease-out will-change-[opacity] min-h-[315px]">
              <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <div>
                  <h4 className="font-black text-slate-900 tracking-tight text-xs uppercase tracking-wider">Clinical Care Assignment</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Let the scheduling algorithm allocate availability or pick a specific provider.</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={autoAssign} 
                      onChange={e => { setAutoAssign(e.target.checked); setProvider(null); setTimeSlot(null); }} 
                    />
                    <div className={cn("block w-11 h-6 rounded-full transition-colors duration-300", autoAssign ? 'bg-blue-600' : 'bg-slate-200')}></div>
                    <div className={cn("absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm", autoAssign ? 'transform translate-x-5' : '')}></div>
                  </div>
                  <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Auto</span>
                </label>
              </div>

              {!autoAssign && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Select Provider</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                    {providers.map(p => (
                      <label 
                        key={p.id} 
                        className={cn(
                          "flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 select-none",
                          provider?.id === p.id ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-600/50" : "border-slate-100 bg-white hover:border-blue-300"
                        )}
                      >
                        <input type="radio" className="sr-only" checked={provider?.id === p.id} onChange={() => { setProvider(p); setTimeSlot(null); }} />
                        <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors", provider?.id === p.id ? "border-blue-600" : "border-slate-300")}>
                          {provider?.id === p.id && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 tracking-tight text-xs">{p.full_name}</div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{p.specialization?.name || "Clinical Practitioner"}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Select Target Date
                  </h3>
                  <input 
                    type="date" 
                    value={date} 
                    min={format(new Date(), "yyyy-MM-dd")} 
                    onChange={e => { setDate(e.target.value); setTimeSlot(null); }} 
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200/80 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Available Slots
                    </span>
                    {slots.length > 0 && !loadingSlots && (
                      <span className="text-[9px] bg-slate-100 text-slate-600 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {slots.filter(s => s.available).length} Free
                      </span>
                    )}
                  </h3>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-10 bg-slate-50/50 border border-slate-100 border-dashed rounded-2xl">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                  ) : slots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                      {slots.map((slot, idx) => (
                        <button 
                          key={idx} 
                          disabled={!slot.available} 
                          onClick={() => setTimeSlot(slot)}
                          className={cn(
                            "py-2.5 rounded-xl text-xs font-black tracking-wider transition-all duration-300 border text-center select-none shadow-sm",
                            !slot.available 
                              ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed opacity-60 shadow-none' 
                              : timeSlot?.start === slot.start 
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10 scale-102 ring-2 ring-blue-600/30' 
                                : 'bg-white border-slate-100 text-slate-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/10'
                          )}
                          title={slot.reason || undefined}
                        >
                          {fmtSlot(slot.start)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-xs font-bold text-slate-400 bg-slate-50/50 border border-slate-100 border-dashed rounded-2xl uppercase tracking-wider">
                      {(!autoAssign && !provider) ? "Choose Provider First" : "No available times"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200 ease-out will-change-[opacity] min-h-[315px] flex flex-col justify-between">
              <div className="bg-blue-50/30 border border-blue-100 rounded-3xl p-6 text-center">
                <div className="w-14 h-14 bg-white text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md border border-blue-50">
                  <Calendar className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-base font-black text-slate-900 tracking-tight mb-1">Verify Booking Scope</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">Review the clinical itinerary before initializing the registry transaction.</p>
              </div>
              <div className="grid grid-cols-2 gap-y-5 gap-x-8 px-4 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Patient Record</span>
                  <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-blue-500" /> {patient?.name}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Clinical Entitlement</span>
                  <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-500" /> {service?.name}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Itinerary Target</span>
                  <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500" /> {date} at {timeSlot ? fmtSlot(timeSlot.start) : "—"}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Assigned Practitioner</span>
                  <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-indigo-500" /> {autoAssign ? "Automated Dispatch" : provider?.full_name}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between bg-white rounded-b-3xl">
          <button 
            onClick={() => setStep(step - 1)} 
            disabled={step === 1 || loading} 
            className={cn(
              "px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-0"
            )}
          >
            Back
          </button>
          {step < 4 ? (
            <button 
              onClick={() => setStep(step + 1)} 
              disabled={(step === 1 && !patient) || (step === 2 && !service) || (step === 3 && (!timeSlot || (!autoAssign && !provider)))}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-slate-950/10 disabled:opacity-50 disabled:pointer-events-none active:scale-98 transition-all"
            >
              Continue <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          ) : (
            <button 
              onClick={handleBook} 
              disabled={loading} 
              className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:pointer-events-none active:scale-98 transition-all"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              Confirm Booking
            </button>
          )}
        </div>
      </div>
    </>
  );
}
