"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  CalendarDays,
  Plane
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface TimeOffPanelProps {
  provider: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  addTimeOff: (data: any) => Promise<void>;
}

export function TimeOffPanel({ 
  provider, 
  isOpen, 
  onClose, 
  onSuccess,
  addTimeOff
}: TimeOffPanelProps) {
  const [formData, setFormData] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    start_time: "",
    end_time: "",
    reason: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        start_time: "",
        end_time: "",
        reason: ""
      });
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await addTimeOff({
        ...formData,
        provider_id: provider?.id,
        is_approved: false // Initial state
      });
      onSuccess();
      onClose();
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[440px] sm:max-w-[440px] p-0 flex flex-col border-none shadow-2xl">
        <SheetHeader className="p-8 bg-slate-900 text-white shrink-0 rounded-bl-[40px]">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                <Plane className="w-5 h-5 text-indigo-400" />
             </div>
             <SheetTitle className="text-2xl font-black text-white tracking-tight">Plan Leave</SheetTitle>
          </div>
          <SheetDescription className="text-slate-400 text-sm font-medium">
             Register ad-hoc time off or administrative leave for <span className="text-indigo-400 font-bold">Dr. {provider?.user?.name?.split(' ')[1]}</span>.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 bg-white">
          <div className="p-8 space-y-8 pb-32">
             {/* Dates */}
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Start Date
                   </label>
                   <Input 
                    type="date" 
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="h-12 rounded-2xl border-slate-100 font-black text-sm text-slate-800 transition-all" 
                   />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> End Date
                   </label>
                   <Input 
                    type="date" 
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="h-12 rounded-2xl border-slate-100 font-black text-sm text-slate-800 transition-all" 
                   />
                </div>
             </div>

             <Separator />

             {/* Times (Optional) */}
             <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Partial Day Selection</p>
                   <Badge variant="ghost" className="text-[9px] uppercase font-bold text-slate-400">Leave blank for full day</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <Input 
                    type="time" 
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="h-11 rounded-xl border-white bg-white font-bold text-slate-600 shadow-sm" 
                   />
                   <Input 
                    type="time" 
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="h-11 rounded-xl border-white bg-white font-bold text-slate-600 shadow-sm" 
                   />
                </div>
             </div>

             {/* Reason */}
             <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Reason for Leave</label>
                <Input 
                  placeholder="e.g. Vacation, Conference, Medical Leave..." 
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="h-12 rounded-2xl border-slate-100 font-semibold"
                />
             </div>

             <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0" />
                <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                   Leave requests are marked as <span className="font-black text-indigo-600">PENDING</span> by default and must be approved by an administrator before schedules are adjusted. Existing appointments during this period will be flagged for rescheduling.
                </p>
             </div>
          </div>
        </ScrollArea>

        <SheetFooter className="p-8 pb-10 bg-white border-t border-slate-100">
           <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 transition-all hover:scale-[1.01]"
           >
             {isSubmitting ? (
               <Loader2 className="w-5 h-5 animate-spin" />
             ) : (
               "Submit Request"
             )}
           </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
