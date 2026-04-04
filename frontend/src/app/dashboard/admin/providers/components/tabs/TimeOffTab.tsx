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
      <div className="group bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
        {isPending && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500" />}
        {isRejected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500" />}
        
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isPending ? 'bg-blue-50 text-blue-600' : isRejected ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
               {isPending ? <Clock className="w-6 h-6" /> : isRejected ? <XCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-1">
                <p className="text-base font-black text-slate-800 tracking-tight">
                  {new Date(request.start_date).toLocaleDateString()} 
                  {request.end_date !== request.start_date && ` — ${new Date(request.end_date).toLocaleDateString()}`}
                </p>
                <Badge className={`h-5 text-[9px] uppercase font-bold tracking-wider ${
                  isPending ? "bg-blue-50 text-blue-600 border-blue-100" : 
                  isRejected ? "bg-rose-50 text-rose-600 border-rose-100" : 
                  "bg-emerald-50 text-emerald-600 border-emerald-100"
                }`}>
                  {request.status}
                </Badge>
              </div>
              <div className="text-sm text-slate-500 font-medium mb-3 flex items-center gap-2">
                {request.reason || "Planned Personal Leave"}
                <Separator orientation="vertical" className="h-3" />
                <span className="text-xs uppercase font-bold tracking-widest text-slate-400">
                  {request.start_time ? `${request.start_time} - ${request.end_time}` : "Full Day"}
                </span>
              </div>

              {isPending && (
                <div className="flex items-center gap-2 pt-2 transition-opacity">
                  <Button 
                    onClick={() => approveRequest(request.id)}
                    className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] uppercase shadow-lg shadow-emerald-100"
                  >
                    Approve
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => rejectRequest(request.id, "Administrative review pending")}
                    className="h-8 px-4 border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-lg font-bold text-[10px] uppercase"
                  >
                    Reject
                  </Button>
                </div>
              )}

              {isRejected && request.rejection_reason && (
                <div className="mt-3 p-3 bg-rose-50/50 rounded-xl border border-rose-50 text-[11px] text-rose-700 font-medium flex items-start gap-2">
                   <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                   {request.rejection_reason}
                </div>
              )}
            </div>
          </div>

          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest pt-1">
            Ref: PTO-{request.id}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Clinical Leave Registry</h3>
          <p className="text-sm text-slate-500">Track and manage ad-hoc time off and administrative leave requests.</p>
        </div>
        <Button onClick={() => setIsPanelOpen(true)} className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[12px] uppercase tracking-wider shadow-lg shadow-blue-100 transition-all active:scale-95">
          <Plus className="w-4 h-4 mr-2" />
          Plan Leave
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-8 space-y-12 max-w-4xl">
          {pending.length > 0 && (
            <section className="animate-in fade-in slide-in-from-top-2 duration-500">
               <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Clock className="w-4 h-4" />
                 Pending Approval
               </h4>
               <div className="grid grid-cols-1 gap-4">
                 {pending.map((r: any) => <RequestCard key={r.id} request={r} />)}
               </div>
            </section>
          )}

          <section className="animate-in fade-in slide-in-from-top-4 duration-700">
             <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
               <Plane className="w-4 h-4 text-emerald-500" />
               Upcoming Leave
             </h4>
             <div className="grid grid-cols-1 gap-4">
               {upcoming.length > 0 ? (
                 upcoming.map((r: any) => <RequestCard key={r.id} request={r} />)
               ) : (
                 <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No upcoming leave scheduled</p>
                 </div>
               )}
             </div>
          </section>

          <section className="animate-in fade-in slide-in-from-top-6 duration-1000">
             <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <History className="w-4 h-4" />
                History & Archive
             </h4>
             <div className="grid grid-cols-1 gap-4 opacity-70">
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
