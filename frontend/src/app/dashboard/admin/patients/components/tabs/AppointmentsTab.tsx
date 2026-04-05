import React, { useState } from "react";
import { Calendar, Clock, User, ChevronDown, ChevronUp, ExternalLink, Download, Plus, AlertTriangle, CheckCircle2, XCircle, Clock4, Info } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AppointmentsTabProps {
  appointments: any[];
  onBook: () => void;
  onViewDetails: (appt: any) => void;
}

export function AppointmentsTab({ appointments, onBook, onViewDetails }: AppointmentsTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const upcoming = appointments.filter(a => ["scheduled", "confirmed"].includes(a.status));
  const past = appointments.filter(a => ["completed", "in_progress"].includes(a.status));
  const cancelled = appointments.filter(a => ["cancelled", "no_show"].includes(a.status));

  const StatusBadge = ({ status }: { status: string }) => {
    const config: any = {
      scheduled: { label: "Scheduled", color: "bg-blue-50 text-blue-600 border-blue-100", icon: Clock4 },
      confirmed: { label: "Confirmed", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle2 },
      in_progress: { label: "In Progress", color: "bg-amber-50 text-amber-600 border-amber-100", icon: Clock },
      completed: { label: "Completed", color: "bg-slate-50 text-slate-600 border-slate-100", icon: CheckCircle2 },
      cancelled: { label: "Cancelled", color: "bg-rose-50 text-rose-600 border-rose-100", icon: XCircle },
      no_show: { label: "No-Show", color: "bg-red-50 text-red-600 border-red-100", icon: AlertTriangle },
    };
    const { label, color, icon: Icon } = config[status] || { label: status, color: "bg-slate-50 text-slate-600 border-slate-100", icon: Info };
    return (
      <Badge variant="outline" className={cn("h-6 px-2 rounded-lg text-[9px] font-black uppercase tracking-widest gap-1.5", color)}>
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const AppointmentRow = ({ appt }: { appt: any }) => {
    const isExpanded = expandedId === appt.id;
    return (
      <div className={cn(
        "group border rounded-2xl transition-all overflow-hidden mb-3 mx-8",
        isExpanded ? "border-blue-200 bg-blue-50/20 shadow-lg shadow-blue-500/5 ring-1 ring-blue-100" : "border-slate-100 bg-white hover:border-slate-200"
      )}>
        <div 
          className="p-4 flex items-center justify-between cursor-pointer"
          onClick={() => setExpandedId(isExpanded ? null : appt.id)}
        >
          <div className="flex items-center gap-5">
             <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] font-black text-slate-400 uppercase">{format(new Date(appt.appointment_start), "MMM")}</span>
                <span className="text-sm font-black text-slate-800">{format(new Date(appt.appointment_start), "dd")}</span>
             </div>
             <div>
                <p className="text-xs font-black text-slate-800 flex items-center gap-2">
                  {appt.service?.name || "General Consultation"}
                  {appt.priority === "urgent" && <Badge className="bg-red-500 hover:bg-red-600 text-[8px] font-black uppercase tracking-widest h-4 px-1 line-clamp-1">Urgent</Badge>}
                </p>
                <div className="flex items-center gap-3 mt-1">
                   <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5">
                     <Clock className="w-3 h-3" />
                     {format(new Date(appt.appointment_start), "hh:mm a")} — {appt.service?.duration || 30} min
                   </p>
                   <span className="text-slate-300">•</span>
                   <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5">
                     <User className="w-3 h-3" />
                     Dr. {appt.provider?.user?.name || "TBA"}
                   </p>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <StatusBadge status={appt.status} />
             <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
             </div>
          </div>
        </div>

        {isExpanded && (
           <div className="px-4 pb-4 pt-2 border-t border-blue-100 space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white/50 rounded-xl border border-blue-50">
                 <div>
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Unit ID</p>
                    <p className="text-[10px] font-mono font-bold text-slate-600">{appt.id}</p>
                 </div>
                 <div>
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Checked In</p>
                    <p className="text-[10px] font-bold text-slate-600">{appt.check_in_time ? format(new Date(appt.check_in_time), "hh:mm a") : "—"}</p>
                 </div>
                 <div>
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Completed At</p>
                    <p className="text-[10px] font-bold text-slate-600">{appt.completion_time ? format(new Date(appt.completion_time), "hh:mm a") : "—"}</p>
                 </div>
                 <div>
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Booked On</p>
                    <p className="text-[10px] font-bold text-slate-600">{format(new Date(appt.created_at), "dd MMM, yyyy")}</p>
                 </div>
              </div>
              
              <div className="p-4 bg-white/50 rounded-xl border border-blue-50">
                 <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-2">Registry Notes</p>
                 <p className="text-xs text-slate-600 leading-relaxed italic">
                    {appt.notes || "No clinical notes provided for this unit interaction."}
                 </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                 <Button variant="ghost" size="sm" onClick={() => onViewDetails(appt)} className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 px-5 gap-2 transition-all active:scale-95">
                    Full Registry Details
                    <ExternalLink className="w-3.5 h-3.5" />
                 </Button>
              </div>
           </div>
        )}
      </div>
    );
  };

  const SectionHeader = ({ title, count, icon: Icon, colorClass }: any) => (
    <div className="px-8 py-6 sticky top-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-between border-b border-slate-50 mb-6">
       <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", colorClass)}>
             <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                {title} 
                <span className="ml-2 px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black border border-slate-100">
                    {count}
                </span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-widest font-bold">Historical data across registry</p>
          </div>
       </div>
    </div>
  );

  return (
    <div className="h-full space-y-0">
      <div className="px-8 pt-8 pb-4 flex items-center justify-between bg-white border-b border-slate-50 sticky top-0 z-20">
         <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-3">
               <Calendar className="w-6 h-6 text-blue-600" />
               Clinical Registry
            </h2>
            <p className="text-xs text-slate-500 mt-1">Timeline of all unit interactions and planned visits</p>
         </div>
         <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="h-10 rounded-xl border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600 px-5 gap-2 transition-all active:scale-95">
               <Download className="w-4 h-4" />
               Export CSV
            </Button>
            <Button onClick={onBook} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-6 gap-2 transition-all active:scale-95 shadow-lg shadow-blue-100">
               <Plus className="w-4 h-4" />
               Book Interaction
            </Button>
         </div>
      </div>

      <div className="pb-12">
        {upcoming.length > 0 && (
          <div className="mb-12 overflow-hidden">
            <SectionHeader title="Active & Upcoming" count={upcoming.length} icon={Clock4} colorClass="bg-blue-50 text-blue-600 border-blue-100" />
            <div className="space-y-1">
              {upcoming.map(appt => <AppointmentRow key={appt.id} appt={appt} />)}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div className="mb-12 overflow-hidden">
            <SectionHeader title="Completed interactions" count={past.length} icon={CheckCircle2} colorClass="bg-emerald-50 text-emerald-600 border-emerald-100" />
            <div className="space-y-1">
              {past.map(appt => <AppointmentRow key={appt.id} appt={appt} />)}
            </div>
          </div>
        )}

        {cancelled.length > 0 && (
          <div className="mb-12 overflow-hidden">
            <SectionHeader title="Administrative flags" count={cancelled.length} icon={XCircle} colorClass="bg-red-50 text-red-600 border-red-100" />
            <div className="space-y-1">
              {cancelled.map(appt => <AppointmentRow key={appt.id} appt={appt} />)}
            </div>
          </div>
        )}

        {appointments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
             <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                <Calendar className="w-12 h-12 text-slate-200" />
             </div>
             <div className="space-y-2">
                <h4 className="text-lg font-black text-slate-800">No Registry Data</h4>
                <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                   This patient has no recorded unit interactions. Start by booking a new appointment.
                </p>
             </div>
             <Button onClick={onBook} className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-widest px-8 transition-all active:scale-95 shadow-xl shadow-blue-500/20">
                Register First Visit
             </Button>
          </div>
        )}
      </div>
    </div>
  );
}
