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
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-slate-200 shadow-2xl">
        <DialogHeader className="p-8 bg-indigo-900 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Layers size={80} />
          </div>
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
            {specialization ? "Modify Expertise" : "Register Discipline"}
          </DialogTitle>
          <DialogDescription className="text-indigo-200/60 font-bold uppercase tracking-widest text-[10px] mt-1">
            Departmental Specialization Registry
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Specialization Name</Label>
              <div className="relative">
                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cardiology, Pediatrics"
                  className="pl-10 h-11 rounded-xl border-slate-200 font-bold text-slate-700 bg-slate-50/50 focus:bg-white transition-all shadow-none"
                />
              </div>
            </div>

            {specialization && (
               <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Fingerprint className="w-3.5 h-3.5 text-slate-300" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Reference</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-600">ID_{specialization.id}</span>
               </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-indigo-900 hover:bg-indigo-950 text-white font-black uppercase tracking-[0.15em] shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Syncing..." : specialization ? "Apply System Update" : "Establish Department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
