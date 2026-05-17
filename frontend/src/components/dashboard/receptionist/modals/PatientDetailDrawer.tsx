"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { patientsApi } from "@/lib/api/patients";
import { appointmentsApi } from "@/lib/api/appointments";
import { StatusBadge } from "@/components/dashboard/receptionist/StatusBadge";
import { toast } from "sonner";
import type { Appointment } from "@/types/appointment";

interface PatientDetailDrawerProps {
  patientId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onBookAppointment: (patientId: string) => void;
}

export function PatientDetailDrawer({
  patientId,
  isOpen,
  onClose,
  onBookAppointment,
}: PatientDetailDrawerProps) {
  const [patient, setPatient] = useState<any>(null);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past, setPast] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Form state
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (!isOpen || !patientId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [patientRes, upcomingRes, pastRes] = await Promise.all([
          patientsApi.getPatient(patientId),
          appointmentsApi.getAppointments({ 
            patient_id: patientId, 
            date_from: format(new Date(), "yyyy-MM-dd"),
            status: "scheduled,checked_in,in_progress",
            page_size: 5
          }),
          appointmentsApi.getAppointments({ 
            patient_id: patientId, 
            date_to: format(new Date(Date.now() - 86400000), "yyyy-MM-dd"),
            page_size: 10,
            sort: "date_desc" // Depending on API support
          }),
        ]);

        if (patientRes.success) {
          setPatient(patientRes.data);
          setFormData(patientRes.data);
        }
        if (upcomingRes.success) setUpcoming(upcomingRes.data);
        if (pastRes.success) setPast(pastRes.data);
      } catch (error) {
        console.error("Failed to load patient details", error);
        toast.error("Failed to load patient details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    setIsEditing(false);
    setShowHistory(false);
  }, [patientId, isOpen]);

  const handleSave = async () => {
    try {
      const res = await patientsApi.updatePatient(patientId!, formData);
      if (res.success) {
        toast.success("Patient details updated");
        setPatient(res.data);
        setIsEditing(false);
      }
    } catch (e) {
      toast.error("Failed to update patient");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 w-[520px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col overflow-hidden animate-in slide-in-from-right">
        {loading || !patient ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900">{patient.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {patient.is_active ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200">Active</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200">Inactive</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={`text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${isEditing ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-blue-600"}`}
                >
                  {isEditing ? "Cancel" : "Edit"}
                </button>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto hidden-scrollbar p-6 space-y-8 bg-slate-50/50">
              
              {/* Section 1 - Personal Info */}
              <div className="bg-white rounded-[20px] border border-slate-100 p-5 shadow-sm">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Personal Info</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Full Name" value={formData.name} editable={isEditing} onChange={(v: any) => setFormData({...formData, name: v})} />
                    <Field label="Date of Birth" value={formData.date_of_birth} editable={isEditing} type="date" onChange={(v: any) => setFormData({...formData, date_of_birth: v})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Phone" value={formData.phone} editable={isEditing} onChange={(v: any) => setFormData({...formData, phone: v})} />
                    <Field label="Email" value={formData.email} editable={isEditing} type="email" onChange={(v: any) => setFormData({...formData, email: v})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gender</label>
                      {isEditing ? (
                        <select 
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          value={formData.gender || ""}
                          onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        >
                          <option value="">Select...</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      ) : (
                        <span className="text-sm font-medium text-slate-900">{patient.gender || "Not specified"}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Notifications</label>
                      {isEditing ? (
                        <label className="flex items-center gap-2 mt-1">
                          <input 
                            type="checkbox" 
                            checked={formData.notification_opt_out}
                            onChange={(e) => setFormData({...formData, notification_opt_out: e.target.checked})}
                          />
                          <span className="text-sm font-medium text-slate-700">Opt out of SMS/Email</span>
                        </label>
                      ) : (
                        <span className="text-sm font-medium text-slate-900">
                          {patient.notification_opt_out ? "Opted Out" : "Enabled"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-6 flex justify-end">
                    <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700">
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              {/* Section 2 - Upcoming Appointments */}
              <div className="bg-white rounded-[20px] border border-slate-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Upcoming Appointments</h3>
                  <button 
                    onClick={() => { onClose(); onBookAppointment(patient.id); }}
                    className="text-[11px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                  >
                    + Book New
                  </button>
                </div>

                {upcoming.length > 0 ? (
                  <div className="space-y-3">
                    {upcoming.map(apt => (
                      <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                        <div>
                          <div className="text-xs font-bold text-slate-900 mb-0.5">{formatDate(apt.appointment_date)} · {formatTime(apt.start_time)}</div>
                          <div className="text-[11px] text-slate-500">{apt.service_name} • {apt.provider_name}</div>
                        </div>
                        <StatusBadge status={apt.status} size="sm" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-slate-400 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                    No upcoming appointments
                  </div>
                )}
              </div>

              {/* Section 3 - Past Appointments */}
              <div className="bg-white rounded-[20px] border border-slate-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Past Appointments</h3>
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 px-2 py-1 rounded transition-colors"
                  >
                    {showHistory ? "Hide history" : "Show history"}
                  </button>
                </div>

                {showHistory && (
                  past.length > 0 ? (
                    <div className="space-y-3 mt-4">
                      {past.map(apt => (
                        <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 opacity-70">
                          <div>
                            <div className="text-xs font-bold text-slate-900 mb-0.5">{formatDate(apt.appointment_date)}</div>
                            <div className="text-[11px] text-slate-500">{apt.service_name} • {apt.provider_name}</div>
                          </div>
                          <StatusBadge status={apt.status} size="sm" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-sm text-slate-400 mt-4">
                      No past appointments
                    </div>
                  )
                )}
              </div>

            </div>
          </>
        )}
      </div>
    </>
  );
}

function Field({ label, value, editable, type = "text", onChange }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
      {editable ? (
        <input 
          type={type}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <span className="text-sm font-medium text-slate-900">{value || "—"}</span>
      )}
    </div>
  );
}

function formatDate(dateStr: string) {
  try { return format(new Date(dateStr), "d MMM yyyy"); } catch(e) { return dateStr; }
}

function formatTime(timeStr: string) {
  if (!timeStr) return "";
  try {
    const [hours, minutes] = timeStr.split(":");
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return format(date, "h:mm a");
  } catch(e) { return timeStr; }
}
