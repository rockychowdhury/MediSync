import React, { useState } from "react";
import { 
  User, 
  Calendar, 
  ListOrdered, 
  BellRing, 
  History, 
  MoreVertical, 
  Edit, 
  PlusCircle, 
  ShieldOff, 
  Loader2, 
  CheckCircle2, 
  BadgeCheck,
  ChevronLeft,
  Mail,
  Phone,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ProfileTab } from "./tabs/ProfileTab";
import { AppointmentsTab } from "./tabs/AppointmentsTab";
import { WaitlistTab } from "./tabs/WaitlistTab";
import { NotificationsTab } from "./tabs/NotificationsTab";
import { AuditTab } from "./tabs/AuditTab";

import { 
  usePatientAppointments, 
  usePatientWaitlist, 
  usePatientNotifications, 
  usePatientAudit 
} from "../hooks/usePatientActivity";

interface PatientDetailPanelProps {
  patient: any;
  stats: any;
  loading: boolean;
  onEdit: (patient: any) => void;
  onBook: (patient: any) => void;
  onStatusChange: (active: boolean) => void;
  onToggleNotifications: (val: boolean) => void;
  onRefresh: () => void;
}

export function PatientDetailPanel({
  patient,
  stats,
  loading,
  onEdit,
  onBook,
  onStatusChange,
  onToggleNotifications,
  onRefresh
}: PatientDetailPanelProps) {
  const [activeTab, setActiveTab] = useState("profile");

  const { appointments, loading: apptsLoading } = usePatientAppointments(patient?.id);
  const { waitlist, loading: waitlistLoading, removeEntry } = usePatientWaitlist(patient?.id);
  const { notifications, loading: notifsLoading, resend } = usePatientNotifications(patient?.id);
  const { auditLogs, loading: auditLoading } = usePatientAudit(patient?.id);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-white animate-in fade-in duration-500">
        <div className="relative">
           <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
           </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Decrypting Registry Record...</p>
      </div>
    );
  }

  if (!patient) return null;

  const initials = patient.name.split(" ").map((n: any) => n[0]).join("").toUpperCase().substring(0, 2);

  return (
    <div className="flex-1 flex flex-col h-full bg-white animate-in fade-in slide-in-from-right-4 duration-700 overflow-hidden">
      {/* Header section (persistent) */}
      <header className="shrink-0 p-8 pt-10 border-b border-slate-50 bg-slate-50/30 backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
           <BadgeCheck size={180} strokeWidth={3} className="text-blue-600" />
        </div>

        <div className="flex items-start justify-between relative">
          <div className="flex gap-6">
            <div className="relative">
               <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-blue-500/20 transform -rotate-3 hover:rotate-0 transition-transform">
                  {initials}
               </div>
               <div className={cn(
                 "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center",
                 patient.is_active ? "bg-green-500" : "bg-slate-300"
               )}>
                  {patient.is_active && <CheckCircle2 className="w-3 h-3 text-white" />}
               </div>
            </div>
            
            <div className="space-y-2">
               <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">{patient.name}</h2>
                  <Badge variant="outline" className={cn(
                    "h-6 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest gap-2",
                    patient.is_active ? "bg-green-50 text-green-600 border-green-100" : "bg-slate-50 text-slate-400 border-slate-100"
                  )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", patient.is_active ? "bg-green-500" : "bg-slate-300")} />
                    {patient.is_active ? "Active Unit" : "Deactivated"}
                  </Badge>
               </div>

               <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-300" /> {patient.phone || "—"}</span>
                  <span className="text-slate-200">|</span>
                  <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-300" /> {patient.email || "—"}</span>
                  <span className="text-slate-200">|</span>
                  <span className="flex items-center gap-1.5 italic">Patient since {format(new Date(patient.created_at), "yyyy")}</span>
               </div>

               <div className="flex items-center gap-3 pt-1">
                   <div className="px-3 py-1 bg-white border border-slate-100 rounded-lg shadow-sm flex items-center gap-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total interactions</p>
                      <p className="text-xs font-black text-blue-600">{stats?.total_appointments || "0"}</p>
                   </div>
                   {patient.notification_opt_out && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 text-[10px] uppercase font-black tracking-widest gap-2 h-7 px-3">
                        🔕 OPTED-OUT
                      </Badge>
                   )}
               </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <Button variant="outline" onClick={() => onEdit(patient)} className="h-10 rounded-xl border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-[10px] font-black uppercase tracking-widest px-5 gap-2 transition-all active:scale-95 shadow-sm">
                <Edit className="w-4 h-4" />
                Edit Record
             </Button>
             <Button onClick={() => onBook(patient)} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-6 gap-2 transition-all active:scale-95 shadow-lg shadow-blue-100">
                <PlusCircle className="w-4 h-4" />
                Book Interaction
             </Button>
             <DropdownMenu>
                <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm transition-all active:scale-95")}>
                   <MoreVertical className="w-5 h-5 text-slate-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl border-slate-100 p-2">
                   <DropdownMenuItem onClick={() => onToggleNotifications(!patient.notification_opt_out)} className="rounded-xl px-4 py-3 gap-3">
                      <BellRing className="w-4 h-4 text-blue-600" />
                      <div className="flex-1">
                         <p className="text-xs font-black uppercase text-slate-800">{patient.notification_opt_out ? "Enable" : "Disable"} Comms</p>
                         <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Appointment Alerts</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-200" />
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => onStatusChange(!patient.is_active)} className={cn("rounded-xl px-4 py-3 gap-3", patient.is_active ? "text-red-600" : "text-blue-600")}>
                      <ShieldOff className="w-4 h-4" />
                      <div className="flex-1">
                         <p className="text-xs font-black uppercase">{patient.is_active ? "Deactivate" : "Activate"} Record</p>
                         <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Registry visibility</p>
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-30" />
                   </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Tabs list section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="shrink-0 px-8 bg-slate-50/30 backdrop-blur-sm border-b border-slate-50">
          <TabsList className="h-14 bg-transparent gap-8" variant="line">
            <TabsTrigger value="profile" className="h-14 rounded-none border-b-2 border-transparent data-active:border-blue-600 data-active:bg-transparent bg-transparent px-0 font-black text-[11px] uppercase tracking-[0.25em] text-slate-400 data-active:text-blue-600 gap-2">
               <User className="w-4 h-4" />
               Profile
            </TabsTrigger>
            <TabsTrigger value="appointments" className="h-14 rounded-none border-b-2 border-transparent data-active:border-blue-600 data-active:bg-transparent bg-transparent px-0 font-black text-[11px] uppercase tracking-[0.25em] text-slate-400 data-active:text-blue-600 gap-2">
               <Calendar className="w-4 h-4" />
               Interactions ({appointments.length})
            </TabsTrigger>
            <TabsTrigger value="waitlist" className="h-14 rounded-none border-b-2 border-transparent data-active:border-blue-600 data-active:bg-transparent bg-transparent px-0 font-black text-[11px] uppercase tracking-[0.25em] text-slate-400 data-active:text-blue-600 gap-2">
               <ListOrdered className="w-4 h-4" />
               Waitlist {waitlist.filter(w => w.status === 'waiting').length > 0 && <Badge className="bg-red-500 h-4 px-1 ml-1">{waitlist.filter(w => w.status === 'waiting').length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="h-14 rounded-none border-b-2 border-transparent data-active:border-blue-600 data-active:bg-transparent bg-transparent px-0 font-black text-[11px] uppercase tracking-[0.25em] text-slate-400 data-active:text-blue-600 gap-2">
               <BellRing className="w-4 h-4" />
               Logs
            </TabsTrigger>
            <TabsTrigger value="audit" className="h-14 rounded-none border-b-2 border-transparent data-active:border-blue-600 data-active:bg-transparent bg-transparent px-0 font-black text-[11px] uppercase tracking-[0.25em] text-slate-400 data-active:text-blue-600 gap-2">
               <History className="w-4 h-4" />
               Audit
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
          <TabsContent value="profile" className="m-0 focus-visible:ring-0">
             <ProfileTab 
              patient={patient} 
              stats={stats} 
              onEdit={() => onEdit(patient)} 
              onToggleNotifications={onToggleNotifications}
             />
          </TabsContent>
          
          <TabsContent value="appointments" className="m-0 focus-visible:ring-0">
             <AppointmentsTab 
                appointments={appointments} 
                onBook={() => onBook(patient)} 
                onViewDetails={(appt) => console.log("View appt details", appt)}
             />
          </TabsContent>

          <TabsContent value="waitlist" className="m-0 focus-visible:ring-0">
             <WaitlistTab 
                waitlist={waitlist} 
                onAdd={() => console.log("Add to waitlist")} 
                onRemove={removeEntry}
             />
          </TabsContent>

          <TabsContent value="notifications" className="m-0 focus-visible:ring-0">
             <NotificationsTab 
                notifications={notifications} 
                onResend={resend}
             />
          </TabsContent>

          <TabsContent value="audit" className="m-0 focus-visible:ring-0">
             <AuditTab logs={auditLogs} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
