"use client";

import React, { useState } from "react";
import { 
  Calendar, 
  Plus, 
  Clock, 
  MapPin, 
  ChevronRight,
  MoreVertical,
  CalendarDays
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
      <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Recurring Schedule</h3>
          <p className="text-sm text-slate-500">Manage standard weekly clinic hours and break periods.</p>
        </div>
        <Button onClick={handleCreate} className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[12px] uppercase tracking-wider shadow-lg shadow-blue-100 transition-all active:scale-95">
          <Plus className="w-4 h-4 mr-2" />
          Add Time Block
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-8">
           <div className="grid grid-cols-1 gap-4 max-w-4xl">
              {groupedAvailability.map(({ day, slots }) => (
                <div key={day} className="group flex items-start gap-6 p-4 rounded-3xl transition-all hover:bg-slate-50 border border-transparent hover:border-slate-100">
                   <div className="w-32 shrink-0 pt-2">
                      <p className="text-sm font-black text-slate-800 tracking-tight mb-1">{day}</p>
                      {slots.length > 0 ? (
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 h-5 text-[10px] uppercase font-bold">Working</Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-300 border-slate-100 h-5 text-[10px] uppercase font-bold">Off Day</Badge>
                      )}
                   </div>

                   <div className="flex-1 space-y-3">
                      {slots.length > 0 ? (
                        slots.map((slot: any) => (
                          <div key={slot.id} className="relative bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all group/slot cursor-pointer" onClick={() => handleEdit(slot)}>
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                      <Clock className="w-5 h-5 text-blue-600" />
                                   </div>
                                   <div>
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-black text-slate-800 tracking-tight">
                                          {slot.start_time.substring(0, 5)} — {slot.end_time.substring(0, 5)}
                                        </p>
                                        {slot.break_start && (
                                          <Badge variant="ghost" className="bg-amber-50 text-amber-600 text-[9px] uppercase font-bold h-4">Break Inc.</Badge>
                                        )}
                                      </div>
                                      <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">
                                        {slot.notes || "Standard Clinic Consultation"}
                                      </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover/slot:opacity-100 transition-opacity">
                                   <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100">
                                      <ChevronRight className="w-4 h-4 text-slate-400" />
                                   </Button>
                                </div>
                             </div>
                             
                             {/* Break period visualization if exists */}
                             {slot.break_start && (
                               <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  <Clock className="w-3 h-3" />
                                  Lunch Break: {slot.break_start.substring(0, 5)} - {slot.break_end.substring(0, 5)}
                               </div>
                             )}
                          </div>
                        ))
                      ) : (
                        <div className="h-16 rounded-2xl border-2 border-dashed border-slate-100 flex items-center justify-center">
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">No Shifts Assigned</p>
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
