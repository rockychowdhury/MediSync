"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Clock, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Trash2
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface AvailabilityBlockPanelProps {
  provider: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  addBlock: (data: any) => Promise<void>;
  updateBlock: (id: number, data: any) => Promise<void>;
  removeBlock: (id: number) => Promise<void>;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function AvailabilityBlockPanel({ 
  provider, 
  isOpen, 
  onClose, 
  onSuccess, 
  initialData,
  addBlock,
  updateBlock,
  removeBlock
}: AvailabilityBlockPanelProps) {
  const [formData, setFormData] = useState({
    day_of_week: 1, // Default Monday
    start_time: "09:00",
    end_time: "17:00",
    break_start: "",
    break_end: "",
    is_working_day: true,
    notes: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        day_of_week: initialData.day_of_week,
        start_time: initialData.start_time.substring(0, 5),
        end_time: initialData.end_time.substring(0, 5),
        break_start: initialData.break_start?.substring(0, 5) || "",
        break_end: initialData.break_end?.substring(0, 5) || "",
        is_working_day: initialData.is_working_day,
        notes: initialData.notes || ""
      });
    } else {
       setFormData({
         day_of_week: 1,
         start_time: "09:00",
         end_time: "17:00",
         break_start: "",
         break_end: "",
         is_working_day: true,
         notes: ""
       });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (initialData) {
        await updateBlock(initialData.id, formData);
      } else {
        await addBlock(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;
    setIsSubmitting(true);
    try {
      await removeBlock(initialData.id);
      onSuccess();
      onClose();
    } catch (error) {
      // Error handled by hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const Toggle = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
    <button
      onClick={onClick}
      className={`flex-1 h-11 px-4 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all ${
        active 
          ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" 
          : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[440px] sm:max-w-[440px] p-0 flex flex-col border-none shadow-2xl">
        <SheetHeader className="p-8 bg-slate-900 text-white shrink-0 rounded-bl-[40px]">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-400" />
             </div>
             <SheetTitle className="text-2xl font-black text-white tracking-tight">Recurring Shift</SheetTitle>
          </div>
          <SheetDescription className="text-slate-400 text-sm font-medium">
             Configure standard weekly clinic hours for <span className="text-blue-400 font-bold">Dr. {provider?.user?.name?.split(' ')[1]}</span>.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 bg-white">
          <div className="p-8 space-y-8 pb-32">
             {/* Day Selection */}
             <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Operating Day</label>
                <div className="grid grid-cols-4 gap-2">
                   {DAYS.map((day, i) => (
                     <button
                        key={day}
                        onClick={() => setFormData({ ...formData, day_of_week: i })}
                        className={`h-10 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                          formData.day_of_week === i 
                            ? "bg-blue-50 border-blue-200 text-blue-600" 
                            : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100"
                        }`}
                     >
                        {day.substring(0, 3)}
                     </button>
                   ))}
                </div>
             </div>

             <Separator />

             {/* Shift Times */}
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Shift Start
                   </label>
                   <Input 
                    type="time" 
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="h-12 rounded-2xl border-slate-100 font-black text-lg text-slate-800 focus:ring-blue-500 transition-all" 
                   />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Shift End
                   </label>
                   <Input 
                    type="time" 
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="h-12 rounded-2xl border-slate-100 font-black text-lg text-slate-800 focus:ring-blue-500 transition-all" 
                   />
                </div>
             </div>

             {/* Break Times */}
             <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Lunch/Break Period</p>
                   <Badge variant="ghost" className="text-[9px] uppercase font-bold text-slate-400">Optional</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <Input 
                    type="time" 
                    placeholder="None"
                    value={formData.break_start}
                    onChange={(e) => setFormData({ ...formData, break_start: e.target.value })}
                    className="h-11 rounded-xl border-white bg-white font-bold text-slate-600 focus:ring-blue-500 shadow-sm" 
                   />
                   <Input 
                    type="time" 
                    placeholder="None"
                    value={formData.break_end}
                    onChange={(e) => setFormData({ ...formData, break_end: e.target.value })}
                    className="h-11 rounded-xl border-white bg-white font-bold text-slate-600 focus:ring-blue-500 shadow-sm" 
                   />
                </div>
             </div>

             {/* Notes */}
             <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Shift Remarks</label>
                <Input 
                  placeholder="e.g. Standard Clinic Shift, Senior Rounds..." 
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="h-12 rounded-2xl border-slate-100 font-semibold"
                />
             </div>
          </div>
        </ScrollArea>

        <SheetFooter className="p-8 pb-10 bg-white border-t border-slate-100">
           <div className="w-full flex items-center gap-4">
              {initialData && (
                <Button 
                  variant="ghost" 
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="h-12 w-12 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-blue-100 transition-all hover:scale-[1.01]"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  initialData ? "Update Shift" : "Assign Shift"
                )}
              </Button>
           </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
