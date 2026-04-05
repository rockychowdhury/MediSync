import React from "react";
import { 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  XCircle, 
  CheckCircle, 
  Calendar,
  ListOrdered,
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DeactivateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  patient: any;
  loading: boolean;
}

export function DeactivateDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  patient, 
  loading 
}: DeactivateDialogProps) {
  if (!patient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 border-none bg-white rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 pb-4">
           <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center text-red-600 mb-6 border border-red-100">
              <ShieldAlert className="w-8 h-8" />
           </div>
           
           <DialogHeader className="text-left space-y-2">
              <DialogTitle className="text-xl font-black text-slate-800 tracking-tight">Deactivate Registry Record?</DialogTitle>
              <DialogDescription className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
                 You are about to suspend clinical registry access for:
              </DialogDescription>
           </DialogHeader>

           <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <p className="text-sm font-black text-slate-800">{patient.name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{patient.email || patient.phone || "No contact info"}</p>
           </div>

           <div className="mt-8 space-y-4">
              <div className="flex items-start gap-4">
                 <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                    <Info className="w-4 h-4" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Administrative Impact</p>
                    <ul className="mt-2 space-y-2">
                       <li className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          All historical data will be preserved.
                       </li>
                       <li className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                          New interaction booking will be disabled.
                       </li>
                    </ul>
                 </div>
              </div>
           </div>
        </div>

        <div className="p-8 pt-4 flex gap-4">
           <Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-2xl border-slate-200 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
              Discard Changes
           </Button>
           <Button 
            disabled={loading}
            onClick={onConfirm} 
            className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 transition-all active:scale-95 gap-2"
           >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              Suspend Record
           </Button>
        </div>
        
        <div className="px-8 pb-8">
           <p className="text-[9px] text-slate-400 text-center font-bold px-4">
              This action is fully reversible from the administrative console at any time by reactivating the record.
           </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
