"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  entityName: string;
  entityDescription?: string | null;
  impactWarning?: string;
  loading?: boolean;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  entityName,
  entityDescription,
  impactWarning,
  loading,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            This action is permanent and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Deleting:</span>
             <span className="text-sm font-mono font-bold text-slate-800">{entityName}</span>
             {entityDescription && (
                <span className="text-[11px] text-slate-500 italic mt-1">"{entityDescription}"</span>
             )}
          </div>

          <div className="flex gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800">
             <AlertCircle className="w-5 h-5 shrink-0" />
             <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-tight leading-none">System Impact Warning</p>
                <p className="text-xs font-medium leading-relaxed">
                   {impactWarning || "All associated relationships and configurations will be permanently removed from the system."}
                </p>
             </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Keep it
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Confirm & Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
