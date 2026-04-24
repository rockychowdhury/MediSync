"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Clock, 
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  History,
  Plane
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTimeOff } from "../../hooks/useTimeOff";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { TimeOffPanel } from "../dialogs/TimeOffPanel";
import { cn } from "@/lib/utils";

interface TimeOffTabProps {
  provider: any;
}

export function TimeOffTab({ provider }: TimeOffTabProps) {
  const { timeOff, loading, addTimeOff, approveRequest, rejectRequest, refresh } = useTimeOff(provider?.id);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  if (!provider) return null;

  const pending = timeOff.filter((t: any) => t.status === "pending");
  const upcoming = timeOff.filter((t: any) => t.status === "approved" && new Date(t.start_date) > new Date());
  const past = timeOff.filter((t: any) => (t.status === "approved" && new Date(t.start_date) <= new Date()) || t.status === "rejected");

  const RequestCard = ({ request }: { request: any }) => {
    const isPending = request.status === "pending";
    const isRejected = request.status === "rejected";
    
    return (
      <div className="group bg-white rounded-xl border border-slate-100 p-3.5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
        {isPending && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
        {isRejected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />}
        
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
              isPending ? 'bg-indigo-50 text-indigo-600' : isRejected ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            )}>
               {isPending ? <Clock className="w-4 h-4" /> : isRejected ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-[11px] font-black text-slate-800 tracking-tight uppercase">
                  {new Date(request.start_date).toLocaleDateString()} 
                  {request.end_date !== request.start_date && ` — ${new Date(request.end_date).toLocaleDateString()}`}
                </p>
                <Badge className={cn(
                  "h-4 px-1.5 text-[7px] font-black uppercase tracking-widest",
                  isPending ? "bg-indigo-50 text-indigo-600 border-indigo-100" : 
                  isRejected ? "bg-rose-50 text-rose-600 border-rose-100" : 
                  "bg-emerald-50 text-emerald-600 border-emerald-100"
                )}>
                  {request.status}
                </Badge>
              </div>
              <div className="text-[10px] text-slate-400 font-bold mb-2 flex items-center gap-2 uppercase tracking-wide">
                {request.reason || "Operational Leave"}
                <Separator orientation="vertical" className="h-2 bg-slate-200" />
                <span className="text-[8px] font-black text-slate-300">
                  {request.start_time ? `${request.start_time} - ${request.end_time}` : "Full Rotation"}
                </span>
              </div>

              {isPending && (
                <div className="flex items-center gap-1.5 pt-1">
                  <Button 
                    onClick={() => approveRequest(request.id)}
                    className="h-7 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-black text-[8px] uppercase tracking-widest shadow-sm shadow-indigo-100 cursor-pointer"
                  >
                    Confirm
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => rejectRequest(request.id, "Administrative oversight required")}
                    className="h-7 px-3 border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-md font-black text-[8px] uppercase tracking-widest cursor-pointer"
                  >
                    Dismiss
                  </Button>
                </div>
              )}

              {isRejected && request.rejection_reason && (
                <div className="mt-2 p-2 bg-rose-50/30 rounded-lg border border-rose-50 text-[9px] text-rose-600 font-bold flex items-start gap-2">
                   <AlertCircle className="w-3 h-3 shrink-0" />
                   {request.rejection_reason}
                </div>
              )}
            </div>
          </div>

          <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest pt-1 shrink-0">
            ID: PTO-{request.id?.substring(0, 4)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/20">
        <div>
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-0.5">Leave Registry</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Administrative tracking of clinical absence requests</p>
        </div>
        <Button onClick={() => setIsPanelOpen(true)} className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md shadow-indigo-100 transition-all active:scale-95 cursor-pointer">
          <Plus className="w-3 h-3 mr-1.5" />
          Plan Leave
        </Button>
      </div>

      <ScrollArea className="flex-1 bg-white">
        <div className="p-5 space-y-8 max-w-4xl">
          {pending.length > 0 && (
            <section className="animate-in fade-in slide-in-from-top-2 duration-500">
               <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Clock className="w-3.5 h-3.5" />
                 Pending Review
               </h4>
               <div className="grid grid-cols-1 gap-2">
                 {pending.map((r: any) => <RequestCard key={r.id} request={r} />)}
               </div>
            </section>
          )}

          <section className="animate-in fade-in slide-in-from-top-4 duration-700">
             <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Plane className="w-3.5 h-3.5 text-emerald-500" />
               Upcoming Interval
             </h4>
             <div className="grid grid-cols-1 gap-2">
               {upcoming.length > 0 ? (
                 upcoming.map((r: any) => <RequestCard key={r.id} request={r} />)
               ) : (
                 <div className="p-6 text-center bg-slate-50/50 border border-dashed border-slate-100 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">No scheduled absence</p>
                 </div>
               )}
             </div>
          </section>

          <section className="animate-in fade-in slide-in-from-top-6 duration-1000">
             <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <History className="w-3.5 h-3.5" />
                Registry Archive
             </h4>
             <div className="grid grid-cols-1 gap-2 opacity-60">
                {past.slice(0, 5).map((r: any) => <RequestCard key={r.id} request={r} />)}
             </div>
          </section>
        </div>
      </ScrollArea>

      <TimeOffPanel 
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onSuccess={refresh}
        provider={provider}
        addTimeOff={addTimeOff}
      />
    </div>
  );
}
