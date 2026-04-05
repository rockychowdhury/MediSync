"use client";
 
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, ShieldAlert, Fingerprint } from "lucide-react";
 
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
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }
 
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] p-0 overflow-hidden rounded-[24px] border-slate-200 shadow-2xl bg-white outline-none">
        <DialogHeader className="p-6 bg-slate-900 text-white relative flex flex-col items-center justify-center text-center overflow-hidden">
          {/* Abstract background icon */}
          <div className="absolute -right-4 -bottom-6 opacity-10 animate-pulse">
            <Trash2 size={120} />
          </div>
          
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 backdrop-blur-md flex items-center justify-center border border-rose-500/30 mb-4 z-10">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
          </div>
          
          <DialogTitle className="text-xl font-black uppercase tracking-tight z-10">
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-1 z-10 leading-none">
            Institutional Registry Decoupling
          </DialogDescription>
        </DialogHeader>
 
        <div className="p-6 space-y-5">
           <div className="text-center space-y-1.5 px-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">System Confirmation Required</h3>
              <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                Are you prepared to decommission <span className="font-bold text-slate-900 underline decoration-rose-500 decoration-2 underline-offset-2">"{entityName}"</span> from the clinical directory?
              </p>
           </div>
 
           <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100/60 space-y-2.5 relative group">
             <div className="flex items-center gap-2 text-rose-600">
                <Fingerprint className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">Security Risk Analysis</span>
             </div>
             <p className="text-[11px] font-bold text-rose-900/70 leading-relaxed pl-5 border-l-2 border-rose-200">
               {impactWarning}
             </p>
           </div>
 
           <div className="pt-2 flex flex-col sm:flex-row gap-3">
             <Button
               variant="ghost"
               onClick={() => onOpenChange(false)}
               className="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all cursor-pointer"
             >
               Abort Operation
             </Button>
             <Button
               onClick={handleConfirm}
               disabled={loading}
               className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
             >
               {loading ? "Processing..." : "Purge Registry"}
             </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
