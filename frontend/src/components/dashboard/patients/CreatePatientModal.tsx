"use client";

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
import { Checkbox } from "@/components/ui/checkbox";
import { patientsApi } from "@/lib/api";
import { Loader2, UserPlus, ShieldCheck } from "lucide-react";

interface CreatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePatientModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePatientModalProps) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "other",
    notification_opt_out: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await patientsApi.createPatient(formData);
      if (res.success) {
        onSuccess();
        onClose();
        setFormData({
          name: "",
          email: "",
          phone: "",
          date_of_birth: "",
          gender: "other",
          notification_opt_out: false,
        });
      }
    } catch (error) {
      console.error("Failed to create patient", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl border-slate-200 p-0 overflow-hidden bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <DialogHeader className="p-8 bg-slate-50/80 border-b border-slate-100 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <UserPlus className="w-24 h-24 rotate-12" />
           </div>
           <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                <UserPlus className="w-5 h-5" />
              </div>
              Clinical Intake Form
           </DialogTitle>
           <DialogDescription className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 ml-1">
             New Patient Registration Protocol
           </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Full Legal Name</Label>
            <Input 
              required
              placeholder="Case-sensitive full name"
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              className="h-11 rounded-xl border-slate-200 bg-white focus:ring-blue-500 font-semibold text-slate-700 placeholder:text-slate-300 transition-all focus:shadow-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Email Address</Label>
                <Input 
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="h-11 rounded-xl border-slate-200 bg-white focus:ring-blue-500 font-semibold text-slate-700 text-sm"
                />
             </div>
             <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Phone Number</Label>
                <Input 
                  required
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                  className="h-11 rounded-xl border-slate-200 bg-white focus:ring-blue-500 font-semibold text-slate-700 text-sm"
                />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Date of Birth</Label>
                <Input 
                  type="date"
                  required
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData(p => ({ ...p, date_of_birth: e.target.value }))}
                  className="h-11 rounded-xl border-slate-200 bg-white focus:ring-blue-500 font-semibold text-slate-700 text-sm"
                />
             </div>
             <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Gender Identity</Label>
                <Select 
                  defaultValue="other"
                  onValueChange={(val: string) => setFormData(p => ({ ...p, gender: val }))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white focus:ring-blue-500 font-semibold text-slate-700">
                    <SelectValue placeholder="Identify gender" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl overflow-hidden">
                    <SelectItem value="male" className="font-semibold">Male</SelectItem>
                    <SelectItem value="female" className="font-semibold">Female</SelectItem>
                    <SelectItem value="non-binary" className="font-semibold">Non-binary</SelectItem>
                    <SelectItem value="other" className="font-semibold">Other / Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
             </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
             <div className="flex items-start space-x-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                <Checkbox 
                  id="notifications" 
                  checked={formData.notification_opt_out}
                  onCheckedChange={(val: boolean) => setFormData(p => ({ ...p, notification_opt_out: val }))}
                  className="mt-1 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded"
                />
                <div className="grid gap-1.5 leading-none">
                  <label 
                    htmlFor="notifications" 
                    className="text-[11px] font-black text-slate-600 leading-tight uppercase tracking-tight"
                  >
                    Notification Silence Protocol
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Opt-out from automated clinical SMS and email reminders.
                  </p>
                </div>
             </div>
          </div>
        </form>

        <DialogFooter className="p-8 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="flex-1 h-12 rounded-2xl font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest text-[10px] transition-all"
          >
            Abort Entry
          </Button>
          <Button 
            disabled={loading}
            onClick={handleSubmit}
            className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-blue-100 text-xs uppercase tracking-widest"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Verify & Commit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
