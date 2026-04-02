"use client";

import React, { useState } from "react";
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
  MapPin,
  Stethoscope,
  ChevronRight
} from "lucide-react";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { appointmentsApi } from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AppointmentDetailDrawerProps {
  appointment: any;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: () => void;
}

export function AppointmentDetailDrawer({
  appointment,
  isOpen,
  onClose,
  onStatusUpdate,
}: AppointmentDetailDrawerProps) {
  const [updating, setUpdating] = useState(false);

  if (!appointment) return null;

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await appointmentsApi.updateStatus(appointment.id, newStatus);
      if (res.success) {
        onStatusUpdate();
        onClose();
      }
    } catch (error) {
      console.error("Failed to update status", error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      scheduled: "bg-blue-50 text-blue-700 border-blue-100",
      "checked-in": "bg-amber-50 text-amber-700 border-amber-100",
      "in-progress": "bg-indigo-50 text-indigo-700 border-indigo-100",
      completed: "bg-green-50 text-green-700 border-green-100",
      cancelled: "bg-red-50 text-red-700 border-red-100",
    };
    return colors[status.toLowerCase()] || "bg-slate-50 text-slate-700 border-slate-100";
  };

  const timelineSteps = [
    { label: "Booked", status: "scheduled", time: appointment.created_at },
    { label: "Check-In", status: "checked-in", time: appointment.check_in_time },
    { label: "Started", status: "in-progress", time: appointment.started_at },
    { label: "Completed", status: "completed", time: appointment.completed_at },
  ];

  return (
    <Drawer open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DrawerContent className="max-w-md ml-auto h-full rounded-none rounded-l-3xl border-l border-slate-200 shadow-2xl overflow-hidden flex flex-col bg-slate-50">
        <DrawerHeader className="bg-white border-b border-slate-100 py-6 px-8">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className={`rounded-lg font-bold text-[10px] uppercase tracking-wider py-1 px-3 ${getStatusBadge(appointment.status)}`}>
              {appointment.status}
            </Badge>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-slate-100">
               <X className="w-5 h-5 text-slate-400" />
            </Button>
          </div>
          <DrawerTitle className="text-2xl font-black text-slate-800 tracking-tight">
            Appointment Details
          </DrawerTitle>
          <DrawerDescription className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
            #{appointment.appointment_number}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Patient Card */}
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] mb-5 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Patient Information
            </h3>
            <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-50">
               <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-blue-100">
                 {appointment.patient?.full_name?.[0]}
               </div>
               <div>
                  <div className="text-lg font-bold text-slate-800">{appointment.patient?.full_name}</div>
                  <div className="text-[13px] text-slate-500 font-medium">Male • 32 Years Old</div>
               </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-3 text-[13px] text-slate-600 font-semibold group">
                 <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                   <Phone className="w-3.5 h-3.5" />
                 </div>
                 {appointment.patient?.phone || "+1 (555) 000-0000"}
              </div>
              <div className="flex items-center gap-3 text-[13px] text-slate-600 font-semibold group">
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                {appointment.patient?.email || "patient@example.com"}
              </div>
            </div>
          </section>

          {/* Appointment Metadata */}
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-5 flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Appointment Data
            </h3>
            <div className="space-y-5">
               <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[11px] text-slate-400 font-bold uppercase mb-1">Service Type</div>
                    <div className="text-[13px] font-bold text-slate-700">{appointment.service?.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400 font-bold uppercase mb-1">Duration</div>
                    <div className="text-[13px] font-bold text-slate-700">{appointment.duration} Minutes</div>
                  </div>
               </div>
               
               <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-500 shadow-sm">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Assigned Provider</div>
                    <div className="text-[13px] font-bold text-slate-700">{appointment.provider?.user?.full_name}</div>
                  </div>
               </div>

               <div className="pt-2">
                 <div className="text-[11px] text-slate-400 font-bold uppercase mb-2 flex items-center">
                   <Clock className="w-3 h-3 mr-1" /> Scheduled Time
                 </div>
                 <div className="text-sm font-bold text-slate-800">
                   {format(new Date(appointment.start_time), "EEEE, MMMM d, yyyy")}
                 </div>
                 <div className="text-lg font-black text-blue-600 tracking-tight">
                   {format(new Date(appointment.start_time), "h:mm aa")}
                 </div>
               </div>

               {appointment.notes && (
                 <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
                    <div className="text-[11px] text-amber-600 font-black uppercase mb-1 flex items-center">
                      <FileText className="w-3.5 h-3.5 mr-1" /> Clinical Notes
                    </div>
                    <p className="text-xs font-medium text-amber-800 leading-relaxed italic">
                      "{appointment.notes}"
                    </p>
                 </div>
               )}
            </div>
          </section>

          {/* Timeline */}
          <section className="px-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Execution Timeline</h3>
            <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timelineSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-5 relative group">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 border-white flex items-center justify-center z-10 transition-all",
                    step.time ? "bg-blue-600 shadow-lg shadow-blue-100 ring-2 ring-blue-50" : "bg-slate-200"
                  )}>
                    {step.time && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className={cn("text-xs font-bold", step.time ? "text-slate-800" : "text-slate-400")}>{step.label}</div>
                    {step.time && <div className="text-[10px] text-blue-500 font-black">{format(new Date(step.time), "h:mm aa")}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <DrawerFooter className="bg-white border-t border-slate-100 p-8 space-y-3 shrink-0">
          <div className="flex gap-3">
             {appointment.status === "scheduled" && (
               <Button 
                onClick={() => handleUpdateStatus("checked-in")} 
                disabled={updating}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-100"
               >
                 Mark Check-In
               </Button>
             )}
             {appointment.status === "checked-in" && (
               <Button 
                onClick={() => handleUpdateStatus("in-progress")} 
                disabled={updating}
                className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-100"
               >
                 Start Session
               </Button>
             )}
             {appointment.status === "in-progress" && (
               <Button 
                onClick={() => handleUpdateStatus("completed")} 
                disabled={updating}
                 className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-green-100"
               >
                 Complete Session
               </Button>
             )}
            
            {(appointment.status === "scheduled" || appointment.status === "checked-in") && (
              <Button 
                variant="outline" 
                onClick={() => handleUpdateStatus("cancelled")}
                disabled={updating}
                className="h-12 w-12 p-0 text-red-500 border-red-100 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors"
              >
                <AlertCircle className="w-5 h-5" />
              </Button>
            )}
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" className="w-full text-slate-400 text-xs font-bold uppercase tracking-widest h-10 hover:bg-transparent">Close Panel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
