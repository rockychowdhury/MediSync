import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  UserPlus, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Zap, 
  Clock, 
  ShieldAlert,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { patientsApi } from "@/lib/api/patients";
import { waitlistApi } from "@/lib/api/waitlist";
import { toast } from "sonner";

interface AddToWaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: any[];
  onSuccess: () => void;
}

export function AddToWaitlistModal({ open, onOpenChange, services, onSuccess }: AddToWaitlistModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const [formData, setFormData] = useState({
    patient_id: "",
    service_id: "",
    priority: "standard",
    notes: "",
    provider_id: undefined as string | undefined
  });

  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const searchPatients = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await patientsApi.getPatients({ search: searchQuery });
      if (res.success) setPatients(res.data || []);
    } catch (err) {
      toast.error("Failed to search patients");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setFormData(prev => ({ ...prev, patient_id: patient.id }));
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!formData.service_id) {
       toast.error("Please select a service");
       return;
    }

    setLoading(true);
    try {
      const res = await waitlistApi.addToWaitlist(formData);
      if (res.success) {
        toast.success("Patient added to waitlist registry");
        onSuccess();
        onOpenChange(false);
        reset();
      } else {
        toast.error(res.message || "Failed to add to waitlist");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setFormData({
      patient_id: "",
      service_id: "",
      priority: "standard",
      notes: "",
      provider_id: undefined
    });
    setSelectedPatient(null);
    setSearchQuery("");
    setPatients([]);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if(!val) reset(); }}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[32px] shadow-2xl">
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <UserPlus size={140} strokeWidth={3} />
           </div>
           
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
                    <Plus className="w-5 h-5 text-white" />
                 </div>
                 <div className="px-3 py-1 rounded-full bg-white/10 text-[9px] font-black uppercase tracking-widest border border-white/10">
                    Step {step} of 3
                 </div>
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight">Waitlist Registry</DialogTitle>
              <DialogDescription className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">
                 Initialize new clinical queue entry
              </DialogDescription>
           </div>
        </div>

        <div className="p-8 bg-white min-h-[400px] flex flex-col">
           {step === 1 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search Patient Registry</Label>
                   <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                      <Input 
                        placeholder="Search name, phone, or MRN..." 
                        className="pl-11 h-14 rounded-2xl bg-slate-50 border-slate-100 focus:ring-blue-500/20 text-sm font-bold shadow-inner"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchPatients()}
                      />
                      <Button 
                        size="sm" 
                        onClick={searchPatients}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 rounded-xl bg-slate-900 hover:bg-black text-[9px] font-black uppercase tracking-widest px-4 transition-all"
                      >
                         {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : "Registry Search"}
                      </Button>
                   </div>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto hidden-scrollbar">
                   {patients.map(p => (
                     <button 
                       key={p.id}
                       onClick={() => handleSelectPatient(p)}
                       className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                     >
                        <div className="flex items-center gap-4 text-left">
                           <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-400 text-xs shadow-sm">
                              {p.name[0]}
                           </div>
                           <div>
                              <p className="text-[14px] font-black text-slate-800">{p.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.phone || "No phone"}</p>
                           </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                     </button>
                   ))}
                   {patients.length === 0 && !searching && searchQuery && (
                     <div className="py-10 text-center opacity-40 italic text-sm">No registry matches found.</div>
                   )}
                </div>
             </div>
           )}

           {step === 2 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="p-5 flex items-center gap-4 bg-blue-50 rounded-2xl border border-blue-100 mb-2">
                   <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                      {selectedPatient?.name[0]}
                   </div>
                   <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-blue-600">Selected Recipient</p>
                      <p className="text-lg font-black text-slate-800 leading-none mt-1">{selectedPatient?.name}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Service Unit</Label>
                   <Select onValueChange={(val) => setFormData(p => ({ ...p, service_id: val }))}>
                      <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-sm font-bold px-5">
                         <SelectValue placeholder="Select service module..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl shadow-2xl border-slate-100 p-2">
                         {services.map(s => (
                           <SelectItem key={s.id} value={s.id} className="rounded-xl py-3 px-4 font-bold text-slate-700">
                              {s.name}
                           </SelectItem>
                         ))}
                      </SelectContent>
                   </Select>
                </div>

                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Urgency Level</Label>
                   <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'standard', label: 'Standard', icon: Clock, color: 'text-slate-400', bg: 'bg-slate-50' },
                        { id: 'urgent', label: 'Urgent', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50/50' },
                        { id: 'emergency', label: 'Emergency', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50/50' }
                      ].map(p => (
                        <button 
                          key={p.id}
                          onClick={() => setFormData(f => ({ ...f, priority: p.id }))}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2",
                            formData.priority === p.id 
                              ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-105" 
                              : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200"
                          )}
                        >
                           <p.icon size={18} className={formData.priority === p.id ? "text-white" : p.color} />
                           <span className="text-[9px] font-black uppercase tracking-widest">{p.label}</span>
                        </button>
                      ))}
                   </div>
                </div>
             </div>
           )}

           {step === 3 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Notes (Internal Only)</Label>
                   <Textarea 
                      placeholder="Add specific triage details or patient concerns..." 
                      className="min-h-[150px] rounded-2xl bg-slate-50 border-slate-100 text-sm font-medium p-6 focus:ring-blue-500/20"
                      value={formData.notes}
                      onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                   />
                </div>

                <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center gap-5">
                   <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 size={24} />
                   </div>
                   <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Position Analysis</p>
                      <p className="text-sm font-bold text-slate-700 leading-tight mt-1">
                         Patient will be added at <span className="font-black text-emerald-700">Level {formData.priority === 'emergency' ? '1' : formData.priority === 'urgent' ? '2' : 'Trailing'}</span> priority rank.
                      </p>
                   </div>
                </div>
             </div>
           )}

           <div className="mt-auto pt-10 flex gap-4">
              {step > 1 && (
                <Button 
                  variant="ghost" 
                  onClick={() => setStep(step - 1)}
                  className="h-14 rounded-2xl border border-slate-100 text-[10px] font-black uppercase tracking-widest px-8 hover:bg-slate-50"
                  disabled={loading}
                >
                   <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              )}
              <Button 
                onClick={step === 3 ? handleSubmit : () => setStep(step + 1)}
                className="flex-1 h-14 rounded-2xl bg-slate-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 gap-3"
                disabled={loading || (step === 2 && !formData.service_id)}
              >
                 {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                  step === 3 ? "Initialize Registry" : "Continue Action"}
                 <ChevronRight className="w-4 h-4" />
              </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
