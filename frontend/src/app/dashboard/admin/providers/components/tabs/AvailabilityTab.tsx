"use client";

import React, { useState } from "react";
import { 
  Calendar, 
  Plus, 
  Clock, 
  MapPin, 
  ChevronRight,
  MoreVertical,
  CalendarDays,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAvailability } from "../../hooks/useAvailability";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AvailabilityTabProps {
  provider: any;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

import { AvailabilityBlockPanel } from "../dialogs/AvailabilityBlockPanel";

export function AvailabilityTab({ provider }: AvailabilityTabProps) {
  const { availability, loading, addBlock, updateBlock, removeBlock, refresh } = useAvailability(provider?.id);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  if (!provider) return null;

  const handleEdit = (slot: any) => {
    setSelectedSlot(slot);
    setIsPanelOpen(true);
  };

  const handleCreate = () => {
    setSelectedSlot(null);
    setIsPanelOpen(true);
  };

  // Group by day
  const groupedAvailability = DAYS.map((day, index) => ({
    day,
    dayIndex: index,
    slots: availability.filter(a => a.day_of_week === index).sort((a, b) => a.start_time.localeCompare(b.start_time))
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {/* ... (rest of the header) */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/20">
        <div>
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-0.5">Clinical Presence</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Administrative oversight of weekly clinic blocks</p>
        </div>
        <Button onClick={handleCreate} className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md shadow-indigo-100 transition-all active:scale-95 cursor-pointer">
          <Plus className="w-3 h-3 mr-1.5" />
          Assign Block
        </Button>
      </div>

      <ScrollArea className="flex-1 bg-white">
        <div className="p-5">
           <div className="grid grid-cols-1 gap-1 max-w-4xl">
              {groupedAvailability.map(({ day, slots }) => (
                <div key={day} className="group flex items-start gap-4 p-2 rounded-2xl transition-all hover:bg-slate-50/50 border border-transparent hover:border-slate-100">
                   <div className="w-24 shrink-0 pt-1">
                      <p className="text-[11px] font-black text-slate-800 tracking-tight mb-1 uppercase">{day}</p>
                      {slots.length > 0 ? (
                        <Badge className="h-4 px-1.5 bg-emerald-50 text-emerald-600 border-emerald-100 text-[8px] font-black uppercase tracking-widest">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="h-4 px-1.5 text-slate-300 border-slate-100 text-[8px] font-black uppercase tracking-widest">Vacant</Badge>
                      )}
                   </div>

                   <div className="flex-1 space-y-1.5">
                      {slots.length > 0 ? (
                        slots.map((slot: any) => (
                          <div key={slot.id} className="relative bg-white rounded-xl border border-slate-100 p-3 shadow-sm hover:shadow-md transition-all group/slot cursor-pointer" onClick={() => handleEdit(slot)}>
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                      <Clock className="w-4 h-4 text-indigo-600" />
                                   </div>
                                   <div>
                                      <div className="flex items-center gap-2">
                                        <p className="text-[11px] font-black text-slate-800 tracking-tight uppercase">
                                          {slot.start_time.substring(0, 5)} — {slot.end_time.substring(0, 5)}
                                        </p>
                                        {slot.break_start && (
                                          <Badge variant="ghost" className="h-3.5 px-1 bg-amber-50 text-amber-600 text-[7px] font-black uppercase tracking-widest border border-amber-100">Intervention</Badge>
                                        )}
                                      </div>
                                      <p className="text-[8px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">
                                        {slot.notes || "Clinical Consultation Buffer"}
                                      </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover/slot:opacity-100 transition-opacity">
                                   <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md hover:bg-slate-100 cursor-pointer">
                                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                   </Button>
                                </div>
                             </div>
                             
                             {/* Break period visualization if exists */}
                             {slot.break_start && (
                               <div className="mt-2 pt-2 border-t border-slate-50 flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                  <Activity className="w-2.5 h-2.5 text-amber-500" />
                                  Clinical Interval: {slot.break_start.substring(0, 5)} - {slot.break_end.substring(0, 5)}
                               </div>
                             )}
                          </div>
                        ))
                      ) : (
                        <div className="h-12 rounded-xl border border-dashed border-slate-100 flex items-center justify-center bg-slate-50/30">
                           <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Operational Null</p>
                        </div>
                      )}
                   </div>
                </div>
              ))}
           </div>
        </div>
      </ScrollArea>

      <AvailabilityBlockPanel 
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onSuccess={refresh}
        initialData={selectedSlot}
        provider={provider}
        addBlock={addBlock}
        updateBlock={updateBlock}
        removeBlock={removeBlock}
      />
    </div>
  );
}
