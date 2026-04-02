"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  patientsApi, 
  appointmentsApi 
} from "@/lib/api";
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck
} from "lucide-react";
import { format } from "date-fns";

interface PatientDetailDrawerProps {
  patientId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function PatientDetailDrawer({
  patientId,
  isOpen,
  onClose,
  onUpdate,
}: PatientDetailDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<any>({
    name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    is_active: true,
  });

  const loadData = useCallback(async () => {
    if (!patientId || !isOpen) return;
    setFetching(true);
    try {
      const [patRes, apptsRes] = await Promise.all([
        patientsApi.getPatient(patientId),
        appointmentsApi.getAppointments({ patient_id: patientId, status: "scheduled", limit: 5 })
      ]);

      if (patRes.success) {
        setPatient(patRes.data);
        setFormData({
          name: patRes.data.name || patRes.data.full_name,
          email: patRes.data.email,
          phone: patRes.data.phone,
          date_of_birth: patRes.data.date_of_birth,
          gender: patRes.data.gender,
          is_active: patRes.data.is_active,
        });
      }
      if (apptsRes.success) {
        setAppointments(apptsRes.data);
      }
    } catch (error) {
      console.error("Failed to load patient details", error);
    } finally {
      setFetching(false);
    }
  }, [patientId, isOpen]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await patientsApi.updatePatient(patientId, formData);
      if (res.success) {
        onUpdate();
        loadData();
      }
    } catch (error) {
      console.error("Failed to update patient", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await patientsApi.updatePatient(patientId, { is_active: !formData.is_active });
      if (res.success) {
        onUpdate();
        loadData();
      }
    } catch (error) {
      console.error("Failed to toggle status", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DrawerContent className="sm:max-w-md border-l border-slate-200 shadow-2xl flex flex-col bg-white">
        <DrawerHeader className="p-8 bg-slate-50/50 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
             <Badge 
              variant="outline" 
              className={`rounded-xl py-1 px-3 text-[10px] font-black uppercase tracking-widest border ${formData.is_active ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}`}
             >
                {formData.is_active ? "Verified Profile" : "Suspended"}
             </Badge>
             <button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors">
               <XCircle className="w-5 h-5" />
             </button>
          </div>
          <DrawerTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
              <UserCheck className="w-5 h-5" />
            </div>
            Patient Insight
          </DrawerTitle>
          <DrawerDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">
            Detailed Profile Analysis & Clinical History
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {fetching ? (
            <div className="flex flex-col justify-center items-center h-48 animate-pulse text-slate-300">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <span className="text-[10px] font-black uppercase tracking-widest">Hydrating Profile...</span>
            </div>
          ) : (
            <>
              {/* Profile Editor Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-[1px] flex-1 bg-slate-100"></div>
                  <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">Core Identity</h3>
                  <div className="h-[1px] flex-1 bg-slate-100"></div>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</Label>
                    <Input 
                      value={formData.name}
                      onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                      className="h-11 rounded-xl border-slate-200 font-semibold focus:shadow-md transition-all text-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Email</Label>
                      <Input 
                        value={formData.email}
                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                        className="h-11 rounded-xl border-slate-200 font-semibold text-slate-600 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Link</Label>
                      <Input 
                        value={formData.phone}
                        onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                        className="h-11 rounded-xl border-slate-200 font-semibold text-slate-600 text-sm"
                      />
                    </div>
                  </div>

                  <Button 
                    disabled={loading}
                    className="w-full h-11 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-blue-50 transition-all active:scale-95"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Commit Identity Changes"}
                  </Button>
                </form>
              </section>

              {/* Upcoming Appointments Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-[1px] flex-1 bg-slate-100"></div>
                  <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">Clinical Roadmap</h3>
                  <div className="h-[1px] flex-1 bg-slate-100"></div>
                </div>

                <div className="space-y-3">
                  {appointments.length > 0 ? (
                    appointments.map((appt) => (
                      <div key={appt.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all duration-300 hover:shadow-md hover:shadow-blue-50/50">
                        <div className="flex items-center justify-between mb-2">
                           <div className="text-[11px] font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">#{appt.appointment_number}</div>
                           <Badge className="bg-white text-blue-600 border-blue-100 rounded-lg text-[9px] font-black uppercase">{appt.status}</Badge>
                        </div>
                        <div className="space-y-2">
                           <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                             <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                             {format(new Date(appt.start_time), "MMMM d, yyyy")}
                           </div>
                           <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                             <Clock className="w-3.5 h-3.5 text-slate-400" />
                             {format(new Date(appt.start_time), "h:mm a")}
                           </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 px-6 rounded-3xl bg-slate-50/30 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                       <AlertCircle className="w-6 h-6 text-slate-300 mb-3" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">No Active Appointments Scheduled</p>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>

        <DrawerFooter className="p-8 bg-slate-50/50 border-t border-slate-100 flex-shrink-0 flex flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={toggleStatus}
            className={`flex-1 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.is_active ? "text-red-600 border-red-100 hover:bg-red-50" : "text-green-600 border-green-100 hover:bg-green-50"}`}
          >
            {formData.is_active ? "Suspend Access" : "Reinstate Access"}
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="flex-1 h-12 rounded-2xl font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest text-[10px]"
          >
            Close Insight
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
