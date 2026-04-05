import React from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Clock, 
  Calendar, 
  ShieldAlert, 
  History, 
  FileText,
  Activity,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Phone,
  Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface WaitlistEntryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: any;
  onAction?: (action: string, entry: any) => void;
}

export function WaitlistEntryDrawer({ open, onOpenChange, entry, onAction }: WaitlistEntryDrawerProps) {
  if (!entry) return null;

  const statusIcons = {
    waiting: <Activity className="w-5 h-5 text-amber-500" />,
    assigned: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    cancelled: <XCircle className="w-5 h-5 text-slate-400" />,
    expired: <History className="w-5 h-5 text-red-400" />
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] p-0 flex flex-col border-none shadow-[0_0_50px_rgba(0,0,0,0.1)]">
        <header className="shrink-0 p-10 bg-slate-900 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <ShieldAlert size={160} strokeWidth={3} />
           </div>
           
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/30 border border-blue-400">
                    <User className="w-6 h-6 text-white" />
                 </div>
                 <div className="px-4 py-1.5 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                    Registry # {entry.id.substring(0, 8)}
                 </div>
              </div>
              
              <SheetTitle className="text-3xl font-black tracking-tight text-white">{entry.patient?.name}</SheetTitle>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
                 <span>Position: {entry.queue_order || "Auto"}</span>
                 <span className="w-1 h-1 rounded-full bg-slate-700" />
                 <span className={cn(
                   entry.priority === 'emergency' ? "text-red-400" : 
                   entry.priority === 'urgent' ? "text-amber-400" : "text-blue-400"
                 )}>{entry.priority} Priority</span>
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
           {/* Quick Stats Grid */}
           <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Wait Time</p>
                 <p className="text-xl font-black text-slate-800">1h 14m</p>
              </div>
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Current Status</p>
                 <div className="flex items-center gap-2">
                    {statusIcons[entry.status as keyof typeof statusIcons]}
                    <p className="text-xl font-black text-slate-800 capitalize">{entry.status}</p>
                 </div>
              </div>
           </div>

           {/* Section: Clinical Metadata */}
           <div className="space-y-6">
              <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-4">Clinical Metadata</h4>
              <div className="space-y-4">
                 <div className="flex justify-between items-start">
                    <div>
                       <p className="text-xs font-black text-slate-800">Requested Service</p>
                       <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">{entry.service?.name || "N/A"}</p>
                    </div>
                    <div>
                       <p className="text-xs font-black text-slate-800 text-right">Preferred Unit</p>
                       <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1 text-right">{entry.provider_name || "Any Available"}</p>
                    </div>
                 </div>

                 <div className="p-6 rounded-3xl bg-blue-50/50 border border-blue-100">
                    <div className="flex items-center gap-2 mb-3">
                       <FileText className="w-4 h-4 text-blue-600" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Triage Notes</span>
                    </div>
                    <p className="text-[13px] font-medium text-slate-700 leading-relaxed italic">
                       "{entry.notes || "No clinical notes provided for this registry entry."}"
                    </p>
                 </div>
              </div>
           </div>

           {/* Section: Action Logs */}
           <div className="space-y-6">
              <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-4">Registry Lifecycle</h4>
              <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                 <div className="flex gap-4 relative">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 border-4 border-white shadow-sm shrink-0 z-10" />
                    <div>
                       <p className="text-[13px] font-black text-slate-800">Added to Waitlist</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(entry.created_at), "MMM dd, yyyy • HH:mm")}</p>
                    </div>
                 </div>
                 <div className="flex gap-4 relative opacity-50">
                    <div className="w-6 h-6 rounded-full bg-slate-200 border-4 border-white shadow-sm shrink-0 z-10" />
                    <div>
                       <p className="text-[13px] font-black text-slate-800">Pending Assignment</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Provider Availability</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <SheetFooter className="p-10 border-t border-slate-50 mt-auto bg-slate-50/50">
           <div className="grid grid-cols-2 gap-4 w-full">
              <Button 
                variant="outline"
                className="h-14 rounded-2xl border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-white"
                onClick={() => onAction?.('cancel', entry)}
              >
                 Cancel Entry
              </Button>
              <Button 
                className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 gap-3"
                onClick={() => onAction?.('assign', entry)}
              >
                 Manual Assign <ArrowRight className="w-4 h-4" />
              </Button>
           </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
