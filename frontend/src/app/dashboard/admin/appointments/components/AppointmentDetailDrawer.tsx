"use client";

import React, { useEffect, useState } from "react";
import { 
  X, 
  User, 
  Calendar as CalendarIcon, 
  Clock, 
  Tag, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  Mail,
  Stethoscope,
  ChevronRight,
  History,
  Info,
  CalendarDays,
  ShieldCheck,
  UserRound,
  ArrowRightLeft
} from "lucide-react";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAppointmentActions } from "../hooks/useAppointmentActions";
import apiClient from "@/lib/api/client";

interface AppointmentDetailDrawerProps {
  appointment: any;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: () => void;
  onReschedule: (appt: any) => void;
  onCancel: (appt: any) => void;
}

export function AppointmentDetailDrawer({
  appointment,
  isOpen,
  onClose,
  onStatusUpdate,
  onReschedule,
  onCancel,
}: AppointmentDetailDrawerProps) {
  const { updateStatus, processing } = useAppointmentActions(onStatusUpdate);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (isOpen && appointment?.id) {
       const fetchLogs = async () => {
         setLoadingLogs(true);
         try {
           const res = await apiClient.get(`/activity_logs`, {
             params: { entity_id: appointment.id, entity_type: 'appointment' }
           });
           if (res.data.success) {
             setLogs(res.data.data || []);
           }
         } catch (err) {
           console.error("Failed to load audit logs", err);
         } finally {
           setLoadingLogs(false);
         }
       };
       fetchLogs();
    }
  }, [isOpen, appointment?.id]);

  if (!appointment) return null;

  const getStatusConfig = (status: string) => {
    const configs: any = {
      scheduled: { label: "Scheduled", color: "text-blue-600", bg: "bg-blue-50/50", border: "border-blue-100", icon: CalendarIcon },
      checked_in: { label: "Checked In", color: "text-amber-600", bg: "bg-amber-50/50", border: "border-amber-100", icon: Clock },
      in_progress: { label: "In Progress", color: "text-indigo-600", bg: "bg-indigo-50/50", border: "border-indigo-100", icon: Activity },
      completed: { label: "Completed", color: "text-emerald-600", bg: "bg-emerald-50/50", border: "border-emerald-100", icon: CheckCircle2 },
      cancelled: { label: "Cancelled", color: "text-rose-600", bg: "bg-rose-50/50", border: "border-rose-100", icon: X },
      no_show: { label: "No Show", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", icon: AlertCircle },
    };
    return configs[status] || configs.scheduled;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: any = {
      emergency: "bg-rose-100 text-rose-700 border-rose-200",
      urgent: "bg-amber-100 text-amber-700 border-amber-200",
      standard: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return colors[priority] || colors.standard;
  };

  const statusConfig = getStatusConfig(appointment.status);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl p-0 border-l border-slate-200 shadow-2xl flex flex-col bg-slate-50/50 backdrop-blur-xl">
        {/* Header Section */}
        <div className="bg-white border-b border-slate-100 p-6 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <Info className="w-48 h-48 -mr-12 -mt-12" />
          </div>
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex gap-2">
              <Badge variant="outline" className={cn("rounded-lg font-bold text-[10px] uppercase tracking-[0.15em] py-1 px-3 shadow-sm", statusConfig.bg, statusConfig.color, statusConfig.border)}>
                {statusConfig.label}
              </Badge>
              <Badge variant="outline" className={cn("rounded-lg font-bold text-[10px] uppercase tracking-[0.15em] py-1 px-3 shadow-sm", getPriorityBadge(appointment.priority))}>
                {appointment.priority}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-slate-100 h-8 w-8">
               <X className="w-5 h-5 text-slate-400" />
            </Button>
          </div>
          
          <div className="relative z-10">
            <SheetTitle className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
              Clinical Detail
            </SheetTitle>
            <SheetDescription className="text-slate-400 font-mono text-[11px] font-bold tracking-widest uppercase">
              REGISTRY ID: {appointment.appointment_number}
            </SheetDescription>
          </div>
        </div>

        {/* Content Area */}
        <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 bg-white border-b border-slate-100 shrink-0">
            <TabsList className="bg-transparent h-14 p-0 gap-8 justify-start">
              <TabsTrigger value="details" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 text-xs font-bold uppercase tracking-widest text-slate-400 data-[state=active]:text-blue-600 flex gap-2">
                <Info className="w-3.5 h-3.5" />
                Medical Specs
              </TabsTrigger>
              <TabsTrigger value="audit" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 text-xs font-bold uppercase tracking-widest text-slate-400 data-[state=active]:text-blue-600 flex gap-2">
                <History className="w-3.5 h-3.5" />
                Audit Trail
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            <TabsContent value="details" className="m-0 space-y-6">
              {/* Patient Information */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm ring-1 ring-black/5 flex items-center gap-5 group hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-200 group-hover:rotate-3 transition-transform">
                  {appointment.patient?.name?.[0]}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-black text-blue-600/60 uppercase tracking-[0.25em] mb-1">Patient Profile</div>
                  <div className="text-xl font-bold text-slate-800 leading-tight mb-1">{appointment.patient?.name}</div>
                  <div className="flex items-center gap-3 text-slate-400 text-xs font-medium uppercase tracking-tight">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {appointment.patient?.phone}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                    <span>MRN: {appointment.patient?.id?.slice(-6).toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Provider Information */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm ring-1 ring-black/5 flex items-center gap-5 group hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center text-xl font-black group-hover:rotate-3 transition-transform">
                  <UserRound className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1">Assigned Clinician</div>
                  <div className="text-xl font-bold text-slate-800 leading-tight mb-1">{appointment.provider?.user?.name}</div>
                  <div className="flex items-center gap-3 text-slate-400 text-xs font-medium uppercase tracking-tight">
                    <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" /> {appointment.service?.name}</span>
                  </div>
                </div>
              </div>

              {/* Scheduling Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm ring-1 ring-black/5">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                     <CalendarDays className="w-3.5 h-3.5" /> Scheduled Date
                   </div>
                   <div className="text-lg font-bold text-slate-800 tracking-tight">
                     {format(new Date(appointment.appointment_start), "EEEE")}
                   </div>
                   <div className="text-sm font-medium text-slate-500">
                     {format(new Date(appointment.appointment_start), "MMMM dd, yyyy")}
                   </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm ring-1 ring-black/5">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                     <Clock className="w-3.5 h-3.5" /> Time Slot
                   </div>
                   <div className="text-lg font-bold text-blue-600 tracking-tight">
                     {format(new Date(appointment.appointment_start), "hh:mm aa")}
                   </div>
                   <div className="text-sm font-medium text-slate-500">
                     {appointment.service?.duration_minutes}m Duration
                   </div>
                </div>
              </div>

              {/* Clinical Notes */}
              {appointment.notes && (
                <div className="bg-amber-50/30 p-6 rounded-[2.5rem] border border-amber-100/50 relative overflow-hidden group hover:bg-amber-50/50 transition-colors">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                     <FileText className="w-12 h-12" />
                  </div>
                  <div className="text-[10px] font-black text-amber-600/80 uppercase tracking-[0.25em] mb-3 flex items-center gap-2 relative z-10">
                     <FileText className="w-3.5 h-3.5" /> Provider Memo
                  </div>
                  <p className="text-sm font-medium text-amber-900 leading-relaxed italic relative z-10">
                    "{appointment.notes}"
                  </p>
                </div>
              )}

              {/* Status Timestamps */}
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200 overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Activity className="w-24 h-24" />
                 </div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 flex items-center gap-2 relative z-10">
                    <ShieldCheck className="w-3.5 h-3.5" /> Pipeline Integrity
                 </div>
                 <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                      <span className="text-xs font-bold text-slate-500">BOOKED</span>
                      <span className="font-mono text-xs text-slate-100">{format(new Date(appointment.created_at), "MMM dd, HH:mm")}</span>
                    </div>
                    {appointment.checked_in_at && (
                      <div className="flex justify-between items-center pb-4 border-b border-slate-800 transition-all animate-in fade-in slide-in-from-left-2">
                        <span className="text-xs font-bold text-slate-500">CHECKED IN</span>
                        <span className="font-mono text-xs text-blue-400">{format(new Date(appointment.checked_in_at), "MMM dd, HH:mm")}</span>
                      </div>
                    )}
                    {appointment.completed_at && (
                      <div className="flex justify-between items-center pb-4 border-b border-slate-800 transition-all animate-in fade-in slide-in-from-left-2">
                        <span className="text-xs font-bold text-slate-500">COMPLETED</span>
                        <span className="font-mono text-xs text-emerald-400">{format(new Date(appointment.completed_at), "MMM dd, HH:mm")}</span>
                      </div>
                    )}
                 </div>
              </div>
            </TabsContent>

            <TabsContent value="audit" className="m-0">
               {loadingLogs ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scanning History...</span>
                 </div>
               ) : logs.length === 0 ? (
                 <div className="text-center py-20 px-8">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <History className="w-8 h-8 text-slate-300" />
                    </div>
                    <div className="text-sm font-bold text-slate-600 mb-1">No Trace Found</div>
                    <p className="text-xs text-slate-400 font-medium">This record has no verifiable audit log currently stored in the registry.</p>
                 </div>
               ) : (
                 <div className="space-y-6 relative before:absolute before:left-3.5 before:top-4 before:bottom-8 before:w-0.5 before:bg-slate-200/60">
                   {logs.map((log, i) => (
                     <div key={log.id} className="relative pl-10 animate-in fade-in slide-in-from-left-2 transition-all" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="absolute left-0 top-1.5 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center z-10 transition-colors hover:border-blue-300">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm ring-1 ring-black/[0.02]">
                           <div className="flex justify-between items-start mb-2">
                             <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{log.action_type.replace(/_/g, ' ')}</div>
                             <div className="text-[9px] font-bold text-slate-300 font-mono">{format(new Date(log.created_at), "HH:mm:ss")}</div>
                           </div>
                           <p className="text-xs font-medium text-slate-500 leading-relaxed mb-3 pr-2">
                             {log.description}
                           </p>
                           <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                             <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                               <div className="h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center text-[7px] text-slate-500 uppercase">{log.user_name[0]}</div>
                               {log.user_name}
                             </div>
                             <div className="text-[10px] font-medium text-slate-300">{format(new Date(log.created_at), "MMM dd")}</div>
                           </div>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Action Footer */}
        <div className="bg-white border-t border-slate-100 p-8 shrink-0">
          <div className="flex gap-3">
             {appointment.status === "scheduled" && (
                <Button 
                onClick={() => updateStatus(appointment.id, "checked_in")} 
                disabled={processing}
                className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.25rem] font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-blue-100"
               >
                 Register Check-In
               </Button>
             )}
              {appointment.status === "checked_in" && (
                <Button 
                onClick={() => updateStatus(appointment.id, "in_progress")} 
                disabled={processing}
                className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.25rem] font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-indigo-100"
               >
                 Initiate Session
               </Button>
             )}
             {appointment.status === "in_progress" && (
               <Button 
                onClick={() => updateStatus(appointment.id, "completed")} 
                disabled={processing}
                className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.25rem] font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-emerald-100"
               >
                 Complete Session
               </Button>
             )}

             {/* Functional Actions */}
             <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-14 w-14 rounded-[1.25rem] border-slate-200 bg-white hover:bg-slate-50 hover:text-blue-600 transition-all active:scale-[0.98]"
                  onClick={() => onReschedule(appointment)}
                  title="Reschedule"
                >
                  <ArrowRightLeft className="w-5 h-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-14 w-14 rounded-[1.25rem] border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all active:scale-[0.98]"
                  onClick={() => onCancel(appointment)}
                  title="Cancel"
                >
                  <AlertCircle className="w-5 h-5" />
                </Button>
             </div>
          </div>
          
          <div className="mt-6 flex justify-center">
             <Button variant="ghost" onClick={onClose} className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] h-8 bg-transparent hover:bg-transparent hover:text-slate-600">
               Close Clinical Insight
             </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Minimal placeholder icons
function Activity(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
}
