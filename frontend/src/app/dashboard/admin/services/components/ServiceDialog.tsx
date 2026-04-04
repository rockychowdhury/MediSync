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
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-slate-200 shadow-2xl">
        <DialogHeader className="p-8 bg-slate-900 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Stethoscope size={80} />
          </div>
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
            {service ? "Modify Asset" : "Register Service"}
          </DialogTitle>
          <DialogDescription className="text-indigo-200/60 font-bold uppercase tracking-widest text-[10px] mt-1">
            Institutional Clinical Resource Management
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Service Label</Label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. General Consultation"
                  className="pl-10 h-11 rounded-xl border-slate-200 font-bold text-slate-700 bg-slate-50/50 focus:bg-white transition-all shadow-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duration (Min)</Label>
                 <div className="relative">
                   <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                   <Input
                     type="number"
                     required
                     min={1}
                     value={formData.duration_minutes}
                     onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                     className="pl-10 h-11 rounded-xl border-slate-200 font-bold text-slate-700 bg-slate-50/50 focus:bg-white transition-all shadow-none"
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operational State</Label>
                 <div className="flex items-center h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <Switch 
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                    <span className="ml-3 text-[11px] font-black uppercase tracking-tight text-slate-600">
                      {formData.is_active ? "Active" : "Disabled"}
                    </span>
                 </div>
               </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Required Expertise</Label>
              <Select
                value={formData.required_specialization_id}
                onValueChange={(val) => setFormData({ ...formData, required_specialization_id: val })}
              >
                <SelectTrigger className="h-11 rounded-xl border-slate-200 font-bold text-slate-700 bg-slate-50/50 focus:bg-white transition-all shadow-none">
                   <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-500" />
                      <SelectValue placeholder="Select Specialization" />
                   </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                  {specializations.map((spec) => (
                    <SelectItem key={spec.id} value={spec.id} className="text-xs font-bold py-2.5 cursor-pointer">
                      {spec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-[0.15em] shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Processing..." : service ? "Update Service Portfolio" : "Confirm Registration"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
