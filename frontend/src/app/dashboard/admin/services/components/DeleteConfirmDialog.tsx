"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Trash2, Fingerprint } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  entityName: string;
  impactWarning: string;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  entityName,
  impactWarning,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-slate-200 shadow-2xl">
        <DialogHeader className="p-8 bg-rose-900 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Trash2 size={80} />
          </div>
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
            {title}
          </DialogTitle>
          <DialogDescription className="text-rose-200/60 font-bold uppercase tracking-widest text-[10px] mt-1">
            Permanent System Decommission
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6 bg-white">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center border border-rose-100">
                <AlertCircle className="w-8 h-8 text-rose-500" />
             </div>
             <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Confirm Deletion</h3>
                <p className="text-[13px] text-slate-500 font-medium mt-1">
                  Are you absolutely certain you want to decommission <span className="font-bold text-rose-600">"{entityName}"</span>?
                </p>
             </div>
          </div>

          <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 space-y-2">
            <div className="flex items-center gap-2 text-orange-700">
               <Fingerprint className="w-3.5 h-3.5" />
               <span className="text-[10px] font-black uppercase tracking-widest">Impact Analysis</span>
            </div>
            <p className="text-[11px] font-bold text-orange-800/80 leading-relaxed">
              {impactWarning}
            </p>
          </div>

          <DialogFooter className="pt-2 gap-3 flex-col sm:flex-row">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-[0.15em] shadow-xl shadow-rose-100 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Confirm Removal"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
