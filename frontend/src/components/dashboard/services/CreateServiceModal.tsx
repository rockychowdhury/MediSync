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
import { servicesApi } from "@/lib/api";
import { Loader2, Plus, Briefcase, DollarSign, Clock } from "lucide-react";

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  specializations: any[];
  categories: string[];
  onSuccess: () => void;
}

export function CreateServiceModal({
  isOpen,
  onClose,
  specializations,
  categories,
  onSuccess,
}: CreateServiceModalProps) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    duration_minutes: "30",
    buffer_minutes: "15",
    specialization_id: "",
    base_fee: "100.00",
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await servicesApi.createService({
        ...formData,
        duration_minutes: parseInt(formData.duration_minutes),
        buffer_minutes: parseInt(formData.buffer_minutes),
        specialization_id: parseInt(formData.specialization_id),
        base_fee: parseFloat(formData.base_fee)
      });
      if (res.success) {
        onSuccess();
        onClose();
        setFormData({
            name: "",
            description: "",
            category: "",
            duration_minutes: "30",
            buffer_minutes: "15",
            specialization_id: "",
            base_fee: "100.00",
            is_active: true,
        });
      }
    } catch (error) {
      console.error("Failed to create clinical service", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px] rounded-3xl border-slate-200 p-0 overflow-hidden bg-white shadow-2xl">
        <DialogHeader className="p-8 bg-slate-50/80 border-b border-slate-100 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <Briefcase className="w-24 h-24 rotate-12" />
           </div>
           <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                <Plus className="w-5 h-5" />
              </div>
              Procedural Intake
           </DialogTitle>
           <DialogDescription className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 ml-1">
             Define Clinical Service Protocol
           </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
           <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Designation</Label>
              <Input 
                required
                placeholder="e.g., Specialized Clinical Consultation"
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                className="h-11 rounded-xl border-slate-200 bg-white focus:ring-blue-500 font-semibold text-slate-700 transition-all focus:shadow-md"
              />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specialization Focus</Label>
                <Select 
                  required
                  value={formData.specialization_id}
                  onValueChange={(val) => setFormData(p => ({ ...p, specialization_id: val }))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-700">
                    <SelectValue placeholder="Identify Role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-2xl overflow-hidden">
                    {specializations.map(spec => (
                      <SelectItem key={spec.id} value={spec.id.toString()} className="font-bold text-xs uppercase tracking-tight">{spec.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category Domain</Label>
                <Select 
                  required
                  value={formData.category}
                  onValueChange={(val) => setFormData(p => ({ ...p, category: val }))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-700">
                    <SelectValue placeholder="Identify Domain" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-2xl overflow-hidden">
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat} className="font-bold text-xs uppercase tracking-tight">{cat}</SelectItem>
                    ))}
                    <SelectItem value="Specialized" className="font-bold text-xs uppercase tracking-tight">New Category (Manual)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinical Duration</Label>
                <Select 
                  value={formData.duration_minutes}
                  onValueChange={(val) => setFormData(p => ({ ...p, duration_minutes: val }))}
                >
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-2xl">
                     <SelectItem value="15" className="font-bold text-xs">15 Minutes</SelectItem>
                     <SelectItem value="30" className="font-bold text-xs">30 Minutes</SelectItem>
                     <SelectItem value="45" className="font-bold text-xs">45 Minutes</SelectItem>
                     <SelectItem value="60" className="font-bold text-xs">60 Minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buffer Interval</Label>
                <Input 
                  type="number"
                  value={formData.buffer_minutes}
                  onChange={(e) => setFormData(p => ({ ...p, buffer_minutes: e.target.value }))}
                  className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-700"
                />
              </div>
           </div>

           <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Procedural Fee</Label>
              <div className="relative">
                 <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <Input 
                   type="number"
                   step="0.01"
                   value={formData.base_fee}
                   onChange={(e) => setFormData(p => ({ ...p, base_fee: e.target.value }))}
                   className="h-11 pl-10 rounded-xl border-slate-200 bg-white font-bold text-slate-700"
                 />
              </div>
           </div>
        </form>

        <DialogFooter className="p-8 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="flex-1 h-12 rounded-2xl font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest text-[10px] transition-all bg-white border border-slate-200 shadow-sm"
          >
            Abort Inclusion
          </Button>
          <Button 
            disabled={loading}
            onClick={handleSubmit}
            className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-blue-100 text-xs uppercase tracking-widest"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Verify & Register Service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
