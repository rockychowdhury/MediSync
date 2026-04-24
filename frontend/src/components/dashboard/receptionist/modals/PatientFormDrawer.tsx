"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";
import { patientsApi } from "@/lib/api/patients";
import { toast } from "sonner";

interface PatientFormDrawerProps {
  patientId: string | null; // null = create new
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PatientFormDrawer({
  patientId,
  isOpen,
  onClose,
  onSuccess,
}: PatientFormDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    date_of_birth: "",
    gender: "",
    notification_opt_out: false
  });

  useEffect(() => {
    if (isOpen) {
      if (patientId) {
        setFetching(true);
        patientsApi.getPatient(patientId).then(res => {
          if (res.success) {
            setFormData({
              name: res.data.name || "",
              phone: res.data.phone || "",
              email: res.data.email || "",
              date_of_birth: res.data.date_of_birth || "",
              gender: res.data.gender || "",
              notification_opt_out: res.data.notification_opt_out || false
            });
          }
        }).finally(() => setFetching(false));
      } else {
        setFormData({
          name: "", phone: "", email: "", date_of_birth: "", gender: "", notification_opt_out: false
        });
      }
    }
  }, [isOpen, patientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (patientId) {
        res = await patientsApi.updatePatient(patientId, formData);
      } else {
        res = await patientsApi.createPatient(formData);
      }
      
      if (res.success) {
        toast.success(`Patient ${patientId ? 'updated' : 'created'} successfully`);
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error(`Failed to ${patientId ? 'update' : 'create'} patient`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[60] transform transition-transform duration-300 flex flex-col overflow-hidden animate-in slide-in-from-right">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <UserPlus className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-slate-900">{patientId ? "Edit Patient" : "New Patient"}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {fetching ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto hidden-scrollbar flex flex-col">
            <div className="p-6 space-y-5 flex-1 bg-slate-50/50">
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Full Name *</label>
                <input 
                  type="text" required
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Phone</label>
                  <input 
                    type="tel"
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Date of Birth</label>
                  <input 
                    type="date"
                    value={formData.date_of_birth} onChange={e => setFormData({...formData, date_of_birth: e.target.value})}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                <input 
                  type="email"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gender</label>
                <select 
                  value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="mt-2 p-4 bg-white border border-slate-200 rounded-xl flex items-start gap-3">
                <input 
                  type="checkbox" id="opt_out"
                  checked={formData.notification_opt_out} onChange={e => setFormData({...formData, notification_opt_out: e.target.checked})}
                  className="mt-1 text-blue-600 focus:ring-blue-500 rounded border-slate-300"
                />
                <label htmlFor="opt_out" className="text-sm text-slate-700 font-medium">
                  Opt out of automated notifications
                  <span className="block text-xs text-slate-500 font-normal mt-0.5">Patient will not receive SMS or email reminders for appointments.</span>
                </label>
              </div>

            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-md hover:bg-slate-800 transition-colors disabled:opacity-50">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {patientId ? "Save Changes" : "Create Patient"}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
