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
import { Layers, Activity, Fingerprint } from "lucide-react";
import { Specialization } from "@/types/provider";

interface SpecializationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specialization: Specialization | null;
  onSubmit: (data: any) => Promise<void>;
}

export function SpecializationDialog({
  open,
  onOpenChange,
  specialization,
  onSubmit,
}: SpecializationDialogProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (specialization) {
      setName(specialization.name);
    } else {
      setName("");
    }
  }, [specialization, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ name });
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] p-0 overflow-hidden rounded-[24px] border-slate-200 shadow-2xl bg-white outline-none">
        <DialogHeader className="p-6 bg-slate-900 text-white relative flex flex-col items-center justify-center text-center overflow-hidden shrink-0">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Layers size={100} />
          </div>
          
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 backdrop-blur-md flex items-center justify-center border border-indigo-500/30 mb-3 z-10">
            <Layers className="w-5 h-5 text-indigo-400" />
          </div>
          
          <DialogTitle className="text-xl font-black uppercase tracking-tight z-10">
            {specialization ? "Refine Discipline" : "New Taxonomy Entry"}
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-1 z-10 leading-none">
            Institutional Expertise Mapping
          </DialogDescription>
        </DialogHeader>
 
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 ml-1">Discipline Designation</Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-focus-within:border-indigo-200 transition-colors">
                  <Activity className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Molecular Cardiology"
                  className="pl-13 h-11 rounded-xl border-slate-200 font-bold text-slate-700 bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-none placeholder:text-slate-300 placeholder:font-medium"
                />
              </div>
            </div>
 
            {specialization && (
               <div className="p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Fingerprint className="w-3.5 h-3.5 text-slate-300" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Registry ID</span>
                  </div>
                  <code className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    REF_{specialization.id}
                  </code>
               </div>
            )}
          </div>
 
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-[0.15em] shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Synchronizing..." : specialization ? "Apply Taxonomy Update" : "Establish Department"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
