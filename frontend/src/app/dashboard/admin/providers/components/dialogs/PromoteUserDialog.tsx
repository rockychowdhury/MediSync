"use client";

import React, { useState, useEffect } from "react";
import { 
  UserPlus, 
  Search, 
  Stethoscope, 
  ShieldCheck, 
  ChevronRight,
  Loader2,
  CheckCircle2,
  Award,
  DollarSign
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { providersApi } from "@/lib/api/providers";
import { specializationsApi } from "@/lib/api/specializations";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface PromoteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PromoteUserDialog({ isOpen, onClose, onSuccess }: PromoteUserDialogProps) {
  const [step, setStep] = useState(1);
  const [users, setUsers] = useState<any[]>([]);
  const [specializations, setSpecializations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  // Selection State
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    specialization_id: null as number | null,
    consultation_fee: "150.00",
    max_daily_appointments: 8,
    emergency_enabled: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchSpecializations();
    }
  }, [isOpen, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await providersApi.getNonProviders({ search });
      if (res.success) setUsers(res.data || []);
    } catch (error) {
      toast.error("Failed to fetch eligible users");
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecializations = async () => {
    try {
      const res = await specializationsApi.getSpecializations();
      if (res.success) setSpecializations(res.data || []);
    } catch (error) {
      console.error("Failed to fetch specializations", error);
    }
  };

  const handlePromote = async () => {
    if (!selectedUser || !formData.specialization_id) return;
    setIsSubmitting(true);
    try {
      const res = await providersApi.promoteToProvider({
        id: selectedUser.id,
        ...formData,
        consultation_fee: parseFloat(formData.consultation_fee)
      });
      if (res.success) {
        toast.success(`${selectedUser.name} promoted to clinical provider`);
        onSuccess();
        reset();
      }
    } catch (error) {
      toast.error("Promotion failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setStep(1);
    setSelectedUser(null);
    setFormData({
        specialization_id: null,
        consultation_fee: "150.00",
        max_daily_appointments: 8,
        emergency_enabled: false
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[32px] border-none shadow-2xl">
        <div className="flex h-[600px]">
          {/* Left Sidebar Info */}
          <div className="w-[200px] bg-slate-900 p-8 flex flex-col justify-between text-white shrink-0">
             <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6">
                   <UserPlus className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-xl font-black tracking-tighter leading-tight mb-2">Promote to Provider</h2>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Clinical Onboarding</p>
             </div>
             
             <div className="space-y-4">
                <div className={`flex items-center gap-3 transition-opacity ${step === 1 ? 'opacity-100' : 'opacity-40'}`}>
                   <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center text-[10px] font-black">1</div>
                   <p className="text-[10px] font-black uppercase tracking-widest">Select User</p>
                </div>
                <div className={`flex items-center gap-3 transition-opacity ${step === 2 ? 'opacity-100' : 'opacity-40'}`}>
                   <div className="w-6 h-6 rounded-full border-2 border-slate-700 flex items-center justify-center text-[10px] font-black">2</div>
                   <p className="text-[10px] font-black uppercase tracking-widest">Identity</p>
                </div>
             </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col bg-white">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="hidden">Onboarding Wizard</DialogTitle>
              {step === 1 ? (
                <>
                  <div className="relative group mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input 
                      placeholder="Search users for clinical promotion..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 h-11 border-slate-100 rounded-2xl bg-slate-50 focus:bg-white text-sm font-semibold transition-all"
                    />
                  </div>
                  <DialogDescription className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Only active staff without provider profiles are eligible.</DialogDescription>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
                        <CheckCircle2 className="w-6 h-6 text-blue-600" />
                     </div>
                     <div>
                        <p className="text-lg font-black text-slate-800">{selectedUser?.name}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedUser?.email}</p>
                     </div>
                  </div>
                  <Separator />
                </>
              )}
            </DialogHeader>

            <ScrollArea className="flex-1 px-8 py-2">
              {step === 1 ? (
                <div className="grid grid-cols-1 gap-2 pb-4">
                  {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                       <Loader2 className="w-8 h-8 animate-spin text-blue-500 opacity-50" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Registry...</p>
                    </div>
                  ) : users.length > 0 ? (
                    users.map(u => (
                      <button 
                        key={u.id}
                        onClick={() => { setSelectedUser(u); setStep(2); }}
                        className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-left"
                      >
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 italic">
                               {u.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                               <p className="text-sm font-black text-slate-800">{u.name}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{u.role_name}</p>
                            </div>
                         </div>
                         <ChevronRight className="w-4 h-4 text-slate-300" />
                      </button>
                    ))
                  ) : (
                    <div className="py-20 text-center opacity-50">
                       <p className="text-sm font-bold text-slate-400">No eligible staff found</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6 pb-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Specialization</label>
                      <div className="grid grid-cols-2 gap-2">
                        {specializations.map(s => (
                          <button
                            key={s.id}
                            onClick={() => setFormData({ ...formData, specialization_id: s.id })}
                            className={`p-3 rounded-xl border text-[11px] font-bold uppercase transition-all ${
                              formData.specialization_id === s.id 
                                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" 
                                : "bg-white text-slate-600 border-slate-100 hover:border-slate-300 shadow-sm"
                            }`}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Consultation Fee</label>
                          <div className="relative">
                             <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                             <Input 
                               type="number" 
                               value={formData.consultation_fee}
                               onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                               className="pl-8 h-11 rounded-xl border-slate-100 font-bold" 
                             />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Daily Cap</label>
                          <Input 
                            type="number" 
                            value={formData.max_daily_appointments}
                            onChange={(e) => setFormData({ ...formData, max_daily_appointments: parseInt(e.target.value) })}
                            className="h-11 rounded-xl border-slate-100 font-bold text-center" 
                          />
                       </div>
                    </div>

                    <button
                        onClick={() => setFormData({ ...formData, emergency_enabled: !formData.emergency_enabled })}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                          formData.emergency_enabled 
                            ? "bg-rose-50 border-rose-200 text-rose-700" 
                            : "bg-slate-50 border-slate-100 text-slate-500"
                        }`}
                    >
                       <div className="flex items-center gap-3">
                          <ShieldCheck className={formData.emergency_enabled ? "text-rose-600" : "text-slate-400"} />
                          <div className="text-left">
                             <p className="text-[10px] font-black uppercase tracking-widest">Emergency Priority</p>
                             <p className="text-[11px] font-medium opacity-80">Eligible for urgent care dispatching.</p>
                          </div>
                       </div>
                       <div className={`w-10 h-5 rounded-full relative transition-all ${formData.emergency_enabled ? 'bg-rose-600' : 'bg-slate-300'}`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.emergency_enabled ? 'right-1' : 'left-1'}`} />
                       </div>
                    </button>
                  </div>
                </div>
              )}
            </ScrollArea>

            <DialogFooter className="p-8 pt-4 border-t border-slate-50 bg-slate-50/30">
               <div className="flex w-full items-center justify-between gap-4">
                  <Button 
                    variant="ghost" 
                    onClick={step === 1 ? onClose : () => setStep(1)}
                    className="h-12 px-6 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-400 hover:text-slate-600"
                  >
                    {step === 1 ? "Cancel" : "Back Step"}
                  </Button>
                  
                  {step === 2 && (
                    <Button 
                      onClick={handlePromote}
                      disabled={isSubmitting || !formData.specialization_id}
                      className="h-12 flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Onboarding...
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4 mr-2" />
                          Finalize Clinical Promotion
                        </>
                      )}
                    </Button>
                  )}
               </div>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
