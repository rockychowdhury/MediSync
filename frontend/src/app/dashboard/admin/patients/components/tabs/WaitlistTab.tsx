import React from "react";
import { ListOrdered, Clock, Calendar, Plus, XCircle, CheckCircle, AlertTriangle, User, Info } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WaitlistTabProps {
  waitlist: any[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export function WaitlistTab({ waitlist, onAdd, onRemove }: WaitlistTabProps) {
  const active = waitlist.filter(w => w.status === "waiting");
  const past = waitlist.filter(w => w.status !== "waiting");

  const WaitlistEntry = ({ entry, isActive }: { entry: any; isActive?: boolean }) => (
    <div className={cn(
      "p-6 rounded-2xl border transition-all mb-4 mx-8 relative overflow-hidden group",
      isActive ? "border-amber-200 bg-amber-50/20 shadow-md shadow-amber-500/5 ring-1 ring-amber-100" : "border-slate-100 bg-white"
    )}>
      {isActive && (
        <div className="absolute top-0 right-0 p-2">
           <Badge className="bg-amber-500 text-[8px] font-black uppercase tracking-widest h-5 px- w-20 justify-center">Active Queue</Badge>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-start gap-5">
           <div className={cn(
             "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
             isActive ? "bg-amber-100 border-amber-200 text-amber-600" : "bg-slate-50 border-slate-100 text-slate-400"
           )}>
              {entry.status === "assigned" ? <CheckCircle className="w-6 h-6" /> : entry.status === "cancelled" ? <XCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
           </div>
           
           <div>
              <p className="text-sm font-black text-slate-800 flex items-center gap-3">
                 {entry.service?.name || "Service Not Specified"}
                 {entry.priority === "urgent" && <Badge className="bg-red-500 text-[8px] font-black uppercase tracking-widest h-4 px-1">Urgent</Badge>}
              </p>
              
              <div className="mt-2 space-y-2">
                 <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Added {format(new Date(entry.created_at), "dd MMM yyyy")}</span>
                    <span className="text-slate-200">|</span>
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {entry.provider ? `Dr. ${entry.provider.user.name}` : "Any Provider"}</span>
                 </div>
                 
                 {isActive && (
                    <div className="flex items-center gap-3 py-2 px-3 bg-white/50 rounded-xl border border-amber-100 w-fit">
                       <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                          <ListOrdered className="w-3.5 h-3.5" />
                          Queue Position: #{entry.queue_position || "—"}
                       </p>
                       <span className="text-amber-200">•</span>
                       <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          Est. Wait: {entry.estimated_wait || "30-45"} min
                       </p>
                    </div>
                 )}
                 
                 {entry.status === "assigned" && entry.appointment_id && (
                    <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 w-fit px-3 py-1 rounded-lg border border-emerald-100">
                       <CheckCircle className="w-3 h-3" />
                       Assigned to unit: {entry.appointment_id}
                    </div>
                 )}
              </div>
           </div>
        </div>

        {isActive && (
           <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onRemove(entry.id)}
            className="h-9 px-4 rounded-xl text-red-600 hover:bg-red-50 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
           >
              Remove
           </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full">
      <div className="px-8 pt-8 pb-4 flex items-center justify-between bg-white border-b border-slate-50 sticky top-0 z-20">
         <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-3">
               <ListOrdered className="w-6 h-6 text-amber-600" />
               Waitlist Management
            </h2>
            <p className="text-xs text-slate-500 mt-1">Manage queue entries and prioritize clinical availability</p>
         </div>
         <Button onClick={onAdd} className="h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-widest px-6 gap-2 transition-all active:scale-95 shadow-lg shadow-amber-100">
            <Plus className="w-4 h-4" />
            Add to Queue
         </Button>
      </div>

      <div className="py-8">
        {active.length > 0 && (
          <div className="mb-12">
            <div className="px-8 mb-6 flex items-center gap-3">
               <Badge className="bg-amber-50 text-amber-600 border-amber-100 uppercase font-black text-[9px] tracking-widest px-3 h-7 rounded-lg">Active ( {active.length} )</Badge>
            </div>
            {active.map(entry => <WaitlistEntry key={entry.id} entry={entry} isActive />)}
          </div>
        )}

        {past.length > 0 && (
          <div>
            <div className="px-8 mb-6 flex items-center gap-3">
               <Badge className="bg-slate-50 text-slate-400 border-slate-100 uppercase font-black text-[9px] tracking-widest px-3 h-7 rounded-lg">History ( {past.length} )</Badge>
            </div>
            {past.map(entry => <WaitlistEntry key={entry.id} entry={entry} />)}
          </div>
        )}

        {waitlist.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
             <div className="w-24 h-24 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-100 transform rotate-12">
                <ListOrdered className="w-12 h-12 text-slate-200" />
             </div>
             <div className="space-y-2">
                <h4 className="text-lg font-black text-slate-800">Queue is empty</h4>
                <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                   This patient is not currently waiting for any services.
                </p>
             </div>
             <Button onClick={onAdd} className="h-12 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black uppercase tracking-widest px-8 transition-all active:scale-95 shadow-xl shadow-amber-500/20">
                Add to Waitlist
             </Button>
          </div>
        )}
      </div>
    </div>
  );
}
