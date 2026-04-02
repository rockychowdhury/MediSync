"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Clock, 
  Plus, 
  Trash2, 
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { availabilityApi } from "@/lib/api/availability";

import { Badge } from "@/components/ui/badge";

interface AvailabilityGridProps {
  providerId: string;
  onUpdate: () => void;
}

const DAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

export function AvailabilityGrid({
  providerId,
  onUpdate,
}: AvailabilityGridProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [slots, setSlots] = useState<any[]>([]);
  
  const [newSlot, setNewSlot] = useState({
    day_of_week: "1", // Monday default
    start_time: "09:00",
    end_time: "17:00",
  });

  const loadSlots = useCallback(async () => {
    setFetching(true);
    try {
      const res = await availabilityApi.getProviderAvailability(providerId);
      if (res.success) setSlots(res.data || []);
    } catch (error) {
      console.error("Failed to fetch availability", error);
    } finally {
      setFetching(false);
    }
  }, [providerId]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await availabilityApi.createAvailability({
        provider_id: providerId,
        day_of_week: parseInt(newSlot.day_of_week),
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        is_working_day: true
      });
      if (res.success) {
        loadSlots();
        onUpdate();
      }
    } catch (error: any) {
      alert(error.response?.data?.detail || "Conflict detected in schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this clinical availability block?")) return;
    try {
      const res = await availabilityApi.deleteAvailability(id);
      if (res.success) {
        loadSlots();
        onUpdate();
      }
    } catch (error) {
      console.error("Failed to delete slot", error);
    }
  };

  return (
    <div className="space-y-10">
      {/* Configuration Form */}
      <section className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-inner">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
             <Plus className="w-4 h-4" />
           </div>
           <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">New Clinical Block</h4>
        </div>

        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
           <div className="space-y-1.5">
              <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Day</Label>
              <Select 
                value={newSlot.day_of_week}
                onValueChange={(val) => setNewSlot(p => ({ ...p, day_of_week: val }))}
              >
                <SelectTrigger className="h-10 rounded-xl border-slate-100 bg-white font-bold text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl overflow-hidden">
                  {DAYS.map((day, idx) => (
                    <SelectItem key={idx} value={idx.toString()} className="font-bold text-xs">{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
           </div>
           
           <div className="space-y-1.5">
              <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Clock In</Label>
              <Input 
                type="time"
                value={newSlot.start_time}
                onChange={(e) => setNewSlot(p => ({ ...p, start_time: e.target.value }))}
                className="h-10 rounded-xl border-slate-100 bg-white font-bold text-xs"
              />
           </div>

           <div className="space-y-1.5">
              <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Clock Out</Label>
              <Input 
                type="time"
                value={newSlot.end_time}
                onChange={(e) => setNewSlot(p => ({ ...p, end_time: e.target.value }))}
                className="h-10 rounded-xl border-slate-100 bg-white font-bold text-xs"
              />
           </div>

           <Button 
            disabled={loading}
            className="h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95"
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Link Block"}
           </Button>
        </form>
      </section>

      {/* Structured Grid View */}
      <section className="space-y-6">
         <div className="flex items-center gap-3 mb-2">
            <div className="h-[1px] flex-1 bg-slate-100"></div>
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">Clinical Roadmap</h3>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
         </div>

         {fetching ? (
            <div className="flex justify-center py-10">
               <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
            </div>
         ) : (
            <div className="space-y-3">
              {DAYS.map((day, idx) => {
                const daySlots = slots.filter(s => s.day_of_week === idx);
                return (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100 group transition-all hover:bg-slate-50/50">
                    <div className="w-24 text-[11px] font-black text-slate-400 uppercase tracking-tighter pt-1.5">{day}</div>
                    <div className="flex-1 flex flex-wrap gap-2">
                       {daySlots.length > 0 ? (
                         daySlots.map((s) => (
                           <Badge key={s.id} variant="outline" className="bg-white border-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-bold group/badge hover:border-red-200 transition-all">
                             <Clock className="w-3 h-3 mr-1.5 text-blue-500" />
                             {s.start_time.slice(0, 5)} — {s.end_time.slice(0, 5)}
                             <button 
                              onClick={() => handleDelete(s.id)}
                              className="ml-2 w-0 overflow-hidden group-hover/badge:w-3.5 transition-all text-red-300 hover:text-red-600"
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           </Badge>
                         ))
                       ) : (
                         <div className="text-[10px] font-bold text-slate-300 italic pt-1.5">No Clinical Hours Registered</div>
                       )}
                    </div>
                  </div>
                );
              })}
            </div>
         )}
      </section>

      <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100 flex items-center gap-3">
         <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
         <p className="text-[10px] text-blue-600 font-bold leading-relaxed">
           Availability changes are applied immediately to the scheduling engine. Existing appointments will not be cancelled automatically.
         </p>
      </div>
    </div>
  );
}
