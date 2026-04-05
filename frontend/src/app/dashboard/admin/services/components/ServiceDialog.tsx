"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Service } from "@/types/service";
import { Specialization } from "@/types/provider";
import { Stethoscope, Clock, ShieldCheck } from "lucide-react";

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  specializations: Specialization[];
  onSubmit: (data: any) => Promise<void>;
}

export function ServiceDialog({
  open,
  onOpenChange,
  service,
  specializations,
  onSubmit,
}: ServiceDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    duration_minutes: 30,
    required_specialization_id: "",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        duration_minutes: service.duration_minutes,
        required_specialization_id: service.required_specialization_id,
        is_active: service.is_active,
      });
    } else {
      setFormData({
        name: "",
        duration_minutes: 30,
        required_specialization_id: specializations[0]?.id || "",
        is_active: true,
      });
    }
  }, [service, open, specializations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] p-0 overflow-hidden rounded-[24px] border-slate-200 shadow-2xl bg-white outline-none">
        <DialogHeader className="p-6 bg-slate-900 text-white relative flex flex-col items-center justify-center text-center overflow-hidden shrink-0">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Stethoscope size={100} />
          </div>
          
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 backdrop-blur-md flex items-center justify-center border border-indigo-500/30 mb-3 z-10">
            <Stethoscope className="w-5 h-5 text-indigo-400" />
          </div>
          
          <DialogTitle className="text-xl font-black uppercase tracking-tight z-10">
            {service ? "Update Portfolio" : "Resource Enrollment"}
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-1 z-10 leading-none">
            Institutional Asset Registry Management
          </DialogDescription>
        </DialogHeader>
 
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 ml-1">Asset Nomenclature</Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-focus-within:border-indigo-200 transition-colors">
                  <Stethoscope className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Diagnostic Imaging"
                  className="pl-13 h-11 rounded-xl border-slate-200 font-bold text-slate-700 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-none placeholder:text-slate-300 placeholder:font-medium"
                />
              </div>
            </div>
 
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 ml-1">Tempo (Min)</Label>
                 <div className="relative group">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-focus-within:border-indigo-200 transition-colors">
                     <Clock className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                   </div>
                   <Input
                     type="number"
                     required
                     min={1}
                     value={formData.duration_minutes}
                     onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                     className="pl-13 h-11 rounded-xl border-slate-200 font-bold text-slate-700 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-none"
                   />
                 </div>
               </div>
 
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 ml-1">Visibility</Label>
                 <div className="flex items-center h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/30 group">
                    <Switch 
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                    <span className={`ml-3 text-[10px] font-black uppercase tracking-tight transition-colors ${formData.is_active ? "text-emerald-600" : "text-slate-400"}`}>
                      {formData.is_active ? "Active" : "Locked"}
                    </span>
                 </div>
               </div>
            </div>
 
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 ml-1">Departmental Alignment</Label>
              <Select
                value={formData.required_specialization_id}
                onValueChange={(val) => setFormData({ ...formData, required_specialization_id: val })}
              >
                <SelectTrigger className="h-11 rounded-xl border-slate-200 font-bold text-slate-700 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-none outline-none">
                   <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                      </div>
                      <SelectValue placeholder="Select Taxonomy" />
                   </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-2xl p-1">
                  {specializations.map((spec) => (
                    <SelectItem key={spec.id} value={spec.id} className="text-xs font-bold py-2.5 px-3 cursor-pointer rounded-lg focus:bg-indigo-50 focus:text-indigo-600 transition-colors">
                      {spec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
 
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-[0.15em] shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Synchronizing..." : service ? "Update Resource Identity" : "Commit to Registry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
