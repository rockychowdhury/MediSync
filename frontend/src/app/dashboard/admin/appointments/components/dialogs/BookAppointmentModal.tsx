"use client";

import React, { useState } from "react";
import { 
  X, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Search,
  Stethoscope,
  Info,
  ShieldCheck,
  Zap,
  AlertTriangle,
  History,
  FileText
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useBooking } from "../../hooks/useBooking";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useAppointmentActions } from "../../hooks/useAppointmentActions";
import { appointmentsApi } from "@/lib/api/appointments";
import { providersApi } from "@/lib/api/providers";

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
}: BookAppointmentModalProps) {
  const {
    step,
    patients,
    providers,
    services,
    availableSlots,
    bookingData,
    loading,
    submitting,
    searchPatients,
    updateBookingData,
    nextStep,
    prevStep,
    confirmBooking,
    setStep
  } = useBooking(() => {
    onSuccess();
    onClose();
  });

  const [patientSearch, setPatientSearch] = useState("");

  const handleSearch = (val: string) => {
    setPatientSearch(val);
    searchPatients(val);
  };

  const currentPatient = patients.find((p: any) => p.id === bookingData.patient_id);
  const currentProvider = providers.find((p: any) => p.id === bookingData.provider_id);
  const currentService = services.find((s: any) => s.id === bookingData.service_id);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden border-none shadow-2xl rounded-[3rem] bg-white">
        <div className="flex h-[600px]">
          {/* Sidebar: Step Progress */}
          <div className="w-[260px] bg-slate-900 p-10 text-white flex flex-col relative shrink-0">
             <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                <ShieldCheck className="w-64 h-64 -ml-20 -mt-20 opacity-10" />
             </div>
             
             <div className="relative z-10 mb-12">
                <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                   <Zap className="w-5 h-5 text-white" />
                </div>
                <DialogTitle className="text-2xl font-black tracking-tighter leading-none mb-1">
                  New Unit
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Appointment Registry
                </DialogDescription>
             </div>

             <div className="relative z-10 flex-1 space-y-8">
                {[
                  { n: 1, label: "Patient Unit", icon: User },
                  { n: 2, label: "Medical Resource", icon: Stethoscope },
                  { n: 3, label: "Timing Slot", icon: Clock },
                  { n: 4, label: "Finalize Protocol", icon: CheckCircle2 },
                ].map((s) => (
                  <div 
                    key={s.n} 
                    className={cn(
                      "flex items-center gap-4 transition-all duration-500",
                      step === s.n ? "translate-x-2" : "opacity-40 grayscale"
                    )}
                  >
                    <div className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs transition-colors",
                        step === s.n ? "bg-white text-slate-900 shadow-xl" : "bg-slate-800 text-slate-500"
                    )}>
                      {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
                    </div>
                    <div>
                       <div className={cn("text-[10px] font-black uppercase tracking-widest leading-none mb-1", step === s.n ? "text-blue-400" : "text-slate-500")}>Phase {s.n}</div>
                       <div className="text-[13px] font-bold text-slate-100">{s.label}</div>
                    </div>
                  </div>
                ))}
             </div>
             
             <div className="relative z-10 pt-10 border-t border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  HIPAA SECURE
                </div>
             </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 bg-white p-10">
            <ScrollArea className="flex-1 -mx-4 px-4 pr-6">
              {/* Step 1: Patient Selection */}
              {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="space-y-1">
                      <h3 className="text-3xl font-black text-slate-800 tracking-tighter">Locate Patient</h3>
                      <p className="text-sm text-slate-400 font-medium">Search the medical registry for the patient record.</p>
                   </div>
                   <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      <Input 
                        placeholder="Name, ID or Registry Number..."
                        className="h-14 pl-12 rounded-[1.25rem] border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-sm font-bold shadow-inner"
                        value={patientSearch}
                        onChange={(e) => handleSearch(e.target.value)}
                      />
                   </div>
                   <div className="space-y-3">
                      {patients.map(p => (
                        <button 
                          key={p.id}
                          onClick={() => updateBookingData({ patient_id: p.id })}
                          className={cn(
                            "w-full text-left p-5 rounded-[1.5rem] border transition-all flex items-center justify-between group",
                            bookingData.patient_id === p.id 
                             ? "bg-blue-600 border-blue-600 shadow-xl shadow-blue-100 text-white" 
                             : "bg-white border-slate-100 hover:border-slate-300"
                          )}
                        >
                           <div className="flex items-center gap-4">
                              <div className={cn(
                                "h-11 w-11 rounded-2xl flex items-center justify-center font-black text-sm",
                                bookingData.patient_id === p.id ? "bg-white/20" : "bg-slate-50 border border-slate-100"
                              )}>
                                {p.name[0]}
                              </div>
                              <div>
                                 <div className="text-[14px] font-bold leading-tight">{p.name}</div>
                                 <div className={cn("text-[10px] font-medium uppercase tracking-wider", bookingData.patient_id === p.id ? "text-blue-100" : "text-slate-400")}>
                                   MRN: {p.id.slice(-6).toUpperCase()}
                                 </div>
                              </div>
                           </div>
                           {bookingData.patient_id === p.id && <CheckCircle2 className="w-5 h-5" />}
                        </button>
                      ))}
                      {patientSearch.length > 0 && patients.length === 0 && (
                        <div className="py-20 text-center opacity-40 grayscale flex flex-col items-center">
                           <User className="w-12 h-12 mb-4" />
                           <p className="text-xs font-bold uppercase tracking-widest">No Matches Encountered</p>
                        </div>
                      )}
                   </div>
                </div>
              )}

              {/* Step 2: Provider & Service */}
              {step === 2 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="space-y-1">
                      <h3 className="text-3xl font-black text-slate-800 tracking-tighter">Medical Resource</h3>
                      <p className="text-sm text-slate-400 font-medium">Assign a clinician and specific professional protocol.</p>
                   </div>
                   
                   <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Assign Clinician</label>
                        <div className="grid grid-cols-2 gap-3">
                           {providers.map((p: any) => (
                             <button 
                                key={p.id}
                                onClick={() => updateBookingData({ provider_id: p.id })}
                                className={cn(
                                  "text-left p-4 rounded-2xl border transition-all flex items-center gap-3 overflow-hidden group relative",
                                  bookingData.provider_id === p.id 
                                   ? "bg-blue-50 border-blue-200 ring-1 ring-blue-600/10" 
                                   : "bg-white border-slate-100 hover:border-slate-200"
                                )}
                             >
                                <div className={cn(
                                  "h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors",
                                  bookingData.provider_id === p.id ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400"
                                )}>
                                  {p.user.name[0]}
                                </div>
                                <div className="min-w-0">
                                   <div className={cn("text-[13px] font-bold leading-tight truncate", bookingData.provider_id === p.id ? "text-blue-700" : "text-slate-700")}>{p.user.name}</div>
                                   <div className="text-[10px] font-medium text-slate-400 truncate tracking-tight">{p.specialization?.name}</div>
                                </div>
                                {bookingData.provider_id === p.id && <div className="absolute top-2 right-2"><ShieldCheck className="w-3.5 h-3.5 text-blue-400" /></div>}
                             </button>
                           ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Select Protocol</label>
                        <div className="grid grid-cols-1 gap-2">
                           {services.map((s: any) => (
                             <button 
                                key={s.id}
                                onClick={() => updateBookingData({ service_id: s.id })}
                                className={cn(
                                  "text-left px-5 py-4 rounded-2xl border transition-all flex items-center justify-between group",
                                  bookingData.service_id === s.id 
                                   ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-600/10" 
                                   : "bg-white border-slate-100 hover:border-slate-200"
                                )}
                             >
                                <div className="flex items-center gap-4">
                                   <div className={cn(
                                      "h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs transition-colors",
                                      bookingData.service_id === s.id ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-400"
                                   )}>
                                     <Stethoscope className="w-4 h-4" />
                                   </div>
                                   <div className={cn("text-[14px] font-bold", bookingData.service_id === s.id ? "text-indigo-700" : "text-slate-700")}>{s.name}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                   <Badge variant="outline" className="rounded-lg text-[10px] bg-white opacity-60 px-2 py-0.5">{s.duration_minutes}m</Badge>
                                </div>
                             </button>
                           ))}
                        </div>
                      </div>
                   </div>
                </div>
              )}

              {/* Step 3: Slot Selection */}
              {step === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="space-y-1">
                      <h3 className="text-3xl font-black text-slate-800 tracking-tighter">Timing Slot</h3>
                      <p className="text-sm text-slate-400 font-medium">Select a verified free slot for the clinical procedure.</p>
                   </div>
                   
                   <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-3 block">Target Registry Date</label>
                        <Input 
                          type="date"
                          className="h-14 rounded-2xl border-slate-200 bg-white shadow-sm font-bold text-sm"
                          value={bookingData.date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => updateBookingData({ date: e.target.value })}
                        />
                      </div>
                      
                      <div className="col-span-3 mt-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-3 block">Available Shifts</label>
                        <div className="grid grid-cols-4 gap-2">
                           {availableSlots.length === 0 ? (
                             <div className="col-span-4 py-20 text-center opacity-40 flex flex-col items-center">
                               <Info className="w-10 h-10 mb-4" />
                               <p className="text-xs font-bold uppercase tracking-widest">No Availability Found</p>
                               <p className="text-[10px] font-medium mt-1">Please adjust clinician or date.</p>
                             </div>
                           ) : availableSlots.map((slot: any, i: number) => (
                             <button
                                key={i}
                                disabled={!slot.available}
                                onClick={() => updateBookingData({ start_time: slot.start, end_time: slot.end })}
                                className={cn(
                                  "p-3 rounded-2xl border transition-all text-center relative overflow-hidden group",
                                  !slot.available && "opacity-20 grayscale cursor-not-allowed",
                                  bookingData.start_time === slot.start
                                   ? "bg-blue-600 border-blue-600 shadow-xl shadow-blue-100 text-white" 
                                   : "bg-white border-slate-100 hover:border-slate-300"
                                )}
                             >
                                <div className="text-[13px] font-black tracking-tight">{format(parseISO(slot.start), "HH:mm")}</div>
                                {bookingData.start_time === slot.start && <div className="absolute top-1 right-1"><ShieldCheck className="w-3 h-3 text-blue-200" /></div>}
                             </button>
                           ))}
                        </div>
                      </div>
                   </div>
                </div>
              )}

              {/* Step 4: Finalize */}
              {step === 4 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
                   <div className="space-y-1">
                      <h3 className="text-3xl font-black text-slate-800 tracking-tighter">Finalize Protocol</h3>
                      <p className="text-sm text-slate-400 font-medium">Verify data integrity and authorize clinical record creation.</p>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-6">
                      <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
                           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Summary</div>
                           <Badge variant="outline" className="bg-white text-blue-600 font-black text-[9px] uppercase tracking-widest">VERIFIED</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-y-4">
                           <div>
                              <div className="text-[9px] font-black text-slate-400 uppercase mb-0.5">PATIENT</div>
                              <div className="text-xs font-bold text-slate-800">{currentPatient?.name}</div>
                           </div>
                           <div>
                              <div className="text-[9px] font-black text-slate-400 uppercase mb-0.5">CLINICIAN</div>
                              <div className="text-xs font-bold text-slate-800">{currentProvider?.user?.name}</div>
                           </div>
                           <div>
                              <div className="text-[9px] font-black text-slate-400 uppercase mb-0.5">PROTOCOL</div>
                              <div className="text-xs font-bold text-slate-800">{currentService?.name}</div>
                           </div>
                           <div>
                              <div className="text-[9px] font-black text-slate-400 uppercase mb-0.5">SCHEDULED</div>
                              <div className="text-xs font-black text-blue-600">{format(parseISO(bookingData.start_time), "MMM dd, HH:mm")}</div>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                         <div className="flex items-center gap-2 mb-2">
                           <FileText className="w-3.5 h-3.5 text-slate-400" />
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Notes (Optional)</label>
                         </div>
                         <Textarea 
                            placeholder="Add symptoms, intake notes or special instructions..."
                            className="min-h-[100px] rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all text-sm font-medium resize-none"
                            value={bookingData.notes}
                            onChange={(e) => updateBookingData({ notes: e.target.value })}
                         />
                      </div>

                      {/* Administrative Overrides */}
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                         <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Operations & Control</div>
                         
                         <div className="flex items-center justify-between p-4 bg-orange-50/30 rounded-2xl border border-orange-100/50">
                            <div className="flex flex-col">
                               <span className="text-[12px] font-bold text-orange-800 leading-none mb-1 flex items-center gap-2">
                                 <Zap className="w-3.5 h-3.5" /> Emergency Bypass
                               </span>
                               <span className="text-[10px] text-orange-600 opacity-70">Override provider capacity and availability locks.</span>
                            </div>
                            <Switch 
                              checked={bookingData.override_capacity}
                              onCheckedChange={(val) => updateBookingData({ override_capacity: val })}
                            />
                         </div>

                         {bookingData.override_capacity && (
                           <div className="animate-in slide-in-from-top-2 duration-300">
                              <Input 
                                placeholder="Formal override justification required..."
                                className="h-12 rounded-xl border-orange-200 bg-orange-50/20 text-xs font-bold text-orange-900 placeholder:text-orange-300"
                                value={bookingData.override_reason}
                                onChange={(e) => updateBookingData({ override_reason: e.target.value })}
                              />
                           </div>
                         )}

                         <div className="flex gap-2">
                            {['standard', 'urgent', 'emergency'].map(p => (
                               <button
                                  key={p}
                                  onClick={() => updateBookingData({ priority: p })}
                                  className={cn(
                                    "flex-1 py-3 rounded-xl border font-black text-[9px] uppercase tracking-[0.2em] transition-all",
                                    bookingData.priority === p 
                                      ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200" 
                                      : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                                  )}
                               >
                                 {p}
                               </button>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
              )}
            </ScrollArea>

            <div className="shrink-0 flex items-center justify-between pt-8 border-t border-slate-50 bg-white">
               <Button 
                variant="ghost" 
                onClick={step === 1 ? onClose : prevStep} 
                className="h-12 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all flex gap-2"
               >
                 {step === 1 ? <X className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                 {step === 1 ? "CANCEL" : "PREVIOUS"}
               </Button>
               
               {step < 4 ? (
                 <Button 
                    onClick={nextStep}
                    disabled={
                      (step === 1 && !bookingData.patient_id) ||
                      (step === 2 && (!bookingData.provider_id || !bookingData.service_id)) ||
                      (step === 3 && !bookingData.start_time)
                    }
                    className="h-12 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all hover:translate-x-1 active:scale-95 shadow-xl shadow-blue-100 flex gap-2"
                 >
                   PROCEED
                   <ChevronRight className="w-4 h-4" />
                 </Button>
               ) : (
                 <Button 
                    onClick={confirmBooking}
                    disabled={submitting || (bookingData.override_capacity && !bookingData.override_reason)}
                    className="h-12 px-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-2xl shadow-blue-200/50 flex gap-2"
                 >
                   {submitting ? "AUTHORIZING..." : "COMMIT TO REGISTRY"}
                   <ShieldCheck className="w-4 h-4" />
                 </Button>
               )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
