"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  providersApi, 
  servicesApi 
} from "@/lib/api";
import { 
  Loader2, 
  User, 
  Mail, 
  Award,
  Calendar,
  Clock,
  Briefcase,
  Plus,
  X,
  Stethoscope,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { AvailabilityGrid } from "./AvailabilityGrid";
import { TimeOffManager } from "./TimeOffManager";

interface ProviderDetailDrawerProps {
  providerId: string | null;
  isOpen: boolean;
  onClose: () => void;
  specializations: any[];
  onUpdate: () => void;
}

export function ProviderDetailDrawer({
  providerId,
  isOpen,
  onClose,
  specializations,
  onUpdate,
}: ProviderDetailDrawerProps) {
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "schedule" | "time-off">("profile");
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<any>(null);
  const [allServices, setAllServices] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<any>({
    specialization_id: "",
    max_daily_appointments: 10,
    status: "available",
    consultation_fee: 0,
  });

  const loadData = useCallback(async () => {
    if (!providerId || !isOpen) return;
    setFetching(true);
    try {
      const [provRes, servRes] = await Promise.all([
        providersApi.getProviderById(providerId),
        servicesApi.getServices()
      ]);

      if (provRes.success) {
        setProvider(provRes.data);
        setFormData({
          specialization_id: provRes.data.specialization_id.toString(),
          max_daily_appointments: provRes.data.max_daily_appointments,
          status: provRes.data.status,
          consultation_fee: provRes.data.consultation_fee,
        });
      }
      if (servRes.success) setAllServices(servRes.data || []);
    } catch (error) {
      console.error("Failed to load provider details", error);
    } finally {
      setFetching(false);
    }
  }, [providerId, isOpen]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId) return;
    setLoading(true);
    try {
      const res = await providersApi.updateProvider(providerId, {
        ...formData,
        specialization_id: parseInt(formData.specialization_id),
        max_daily_appointments: parseInt(formData.max_daily_appointments),
        consultation_fee: parseFloat(formData.consultation_fee)
      });
      if (res.success) {
        onUpdate();
        loadData();
      }
    } catch (error) {
      console.error("Failed to update provider profile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (serviceId: string) => {
    if (!providerId) return;
    setLoading(true);
    try {
      const res = await providersApi.assignServiceToProvider(providerId, serviceId);
      if (res.success) loadData();
    } catch (error) {
      console.error("Failed to assign service", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    if (!providerId) return;
    setLoading(true);
    try {
      const res = await providersApi.removeServiceFromProvider(providerId, serviceId);
      if (res.success) loadData();
    } catch (error) {
      console.error("Failed to remove service", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DrawerContent className="sm:max-w-2xl border-l border-slate-200 shadow-2xl flex flex-col bg-white">
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          <DrawerHeader className="p-8 bg-slate-50/50 border-b border-slate-100 flex-shrink-0 relative">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                   <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-100 group transition-all">
                     <Stethoscope className="w-6 h-6" />
                   </div>
                   <div>
                      <DrawerTitle className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">
                        {provider?.user?.full_name || "Clinician Perspective"}
                      </DrawerTitle>
                      <DrawerDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-none">
                        Workforce Registry Entry #{providerId?.slice(-6).toUpperCase()}
                      </DrawerDescription>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <Badge variant="outline" className={`rounded-xl py-1 px-3 text-[10px] font-black uppercase tracking-widest border transition-all ${formData.status === 'available' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                      {formData.status?.replace('_', ' ')}
                   </Badge>
                   <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                     <X className="w-5 h-5" />
                   </button>
                </div>
             </div>

             <div className="flex items-center gap-6 mt-4">
                <button 
                  onClick={() => setActiveSubTab("profile")}
                  className={`text-[11px] font-black uppercase tracking-[0.15em] transition-all relative pb-2 ${activeSubTab === "profile" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
                >
                  General Profile
                  {activeSubTab === "profile" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full animate-in fade-in duration-300"></div>}
                </button>
                <button 
                  onClick={() => setActiveSubTab("schedule")}
                  className={`text-[11px] font-black uppercase tracking-[0.15em] transition-all relative pb-2 ${activeSubTab === "schedule" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Clinician Scheduler
                  {activeSubTab === "schedule" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full animate-in fade-in duration-300"></div>}
                </button>
                <button 
                  onClick={() => setActiveSubTab("time-off")}
                  className={`text-[11px] font-black uppercase tracking-[0.15em] transition-all relative pb-2 ${activeSubTab === "time-off" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Clinical Leave
                  {activeSubTab === "time-off" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full animate-in fade-in duration-300"></div>}
                </button>
             </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {fetching ? (
               <div className="flex flex-col justify-center items-center h-64 text-slate-300 animate-pulse">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Compiling Clinician Insights...</span>
               </div>
            ) : (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {activeSubTab === "profile" && (
                    <div className="space-y-10">
                       {/* Identity & Configuration */}
                       <section className="space-y-6">
                         <div className="flex items-center gap-3 mb-2">
                           <div className="h-[1px] flex-1 bg-slate-100"></div>
                           <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">Clinical Identity</h3>
                           <div className="h-[1px] flex-1 bg-slate-100"></div>
                         </div>

                         <form onSubmit={handleUpdate} className="space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                               <div className="space-y-1.5">
                                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Daily Throughput</Label>
                                 <Input 
                                   type="number"
                                   value={formData.max_daily_appointments}
                                   onChange={(e) => setFormData((p: any) => ({ ...p, max_daily_appointments: e.target.value }))}
                                   className="h-11 rounded-xl border-slate-200 font-bold bg-slate-50/30 focus:bg-white focus:shadow-md transition-all text-slate-700"
                                 />
                               </div>
                               <div className="space-y-1.5">
                                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specialization Role</Label>
                                 <Select 
                                    value={formData.specialization_id}
                                    onValueChange={(val: string) => setFormData((p: any) => ({ ...p, specialization_id: val }))}
                                 >
                                   <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/30 focus:bg-white font-bold text-slate-700">
                                      <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent className="rounded-xl border-slate-200 shadow-2xl">
                                      {specializations.map((spec) => (
                                        <SelectItem key={spec.id} value={spec.id.toString()} className="font-bold text-xs uppercase tracking-tight">
                                          {spec.name}
                                        </SelectItem>
                                      ))}
                                   </SelectContent>
                                 </Select>
                               </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                               <div className="space-y-1.5">
                                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Consultation Fee</Label>
                                 <Input 
                                   type="number"
                                   value={formData.consultation_fee}
                                   onChange={(e) => setFormData((p: any) => ({ ...p, consultation_fee: e.target.value }))}
                                   className="h-11 rounded-xl border-slate-200 font-bold bg-slate-50/30 focus:bg-white transition-all text-slate-700"
                                 />
                               </div>
                               <div className="space-y-1.5">
                                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Status</Label>
                                 <Select 
                                    value={formData.status}
                                    onValueChange={(val: string) => setFormData((p: any) => ({ ...p, status: val }))}
                                 >
                                   <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/30 focus:bg-white font-bold text-slate-700">
                                      <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent className="rounded-xl border-slate-200 shadow-2xl">
                                      <SelectItem value="available" className="font-bold text-xs uppercase text-green-600">Available</SelectItem>
                                      <SelectItem value="busy" className="font-bold text-xs uppercase text-red-600">Busy (Engaged)</SelectItem>
                                      <SelectItem value="on_leave" className="font-bold text-xs uppercase text-amber-600">On Clinical Leave</SelectItem>
                                   </SelectContent>
                                 </Select>
                               </div>
                            </div>

                            <Button 
                              disabled={loading}
                              className="w-full h-11 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-sm hover:shadow-blue-50 transition-all"
                            >
                              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Commit Professional Changes"}
                            </Button>
                         </form>
                       </section>

                       {/* Professional Catalog Section */}
                       <section className="space-y-6">
                         <div className="flex items-center gap-3 mb-2">
                           <div className="h-[1px] flex-1 bg-slate-100"></div>
                           <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">Assigned Clinical Procedures</h3>
                           <div className="h-[1px] flex-1 bg-slate-100"></div>
                         </div>

                         <div className="flex flex-wrap gap-2">
                            {provider?.services?.map((svc: any) => (
                              <Badge key={svc.id} className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-xl font-bold text-[11px] group transition-all">
                                {svc.name}
                                <button 
                                  onClick={() => handleRemoveService(svc.id)}
                                  className="ml-2 text-blue-300 hover:text-blue-600 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </Badge>
                            ))}
                            {(!provider?.services || provider.services.length === 0) && (
                               <div className="text-[10px] font-bold text-slate-400 italic px-2">No procedures currently assigned to this clinician.</div>
                            )}
                         </div>

                         <div className="mt-4 pt-4 border-t border-slate-50">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Link New Service</Label>
                            <Select onValueChange={handleAddService}>
                               <SelectTrigger className="h-10 rounded-xl border-slate-100 bg-slate-50/50 hover:bg-white transition-all text-xs font-bold text-slate-600">
                                  <div className="flex items-center">
                                    <Plus className="w-3.5 h-3.5 mr-2" />
                                    Assign clinical protocol...
                                  </div>
                               </SelectTrigger>
                               <SelectContent className="rounded-xl border-slate-200 shadow-2xl">
                                  {allServices
                                    .filter(s => !provider?.services?.some((ps: any) => ps.id === s.id))
                                    .map(svc => (
                                      <SelectItem key={svc.id} value={svc.id} className="font-bold text-xs">
                                        {svc.name}
                                      </SelectItem>
                                    ))
                                  }
                               </SelectContent>
                            </Select>
                         </div>
                       </section>
                    </div>
                  )}

                  {activeSubTab === "schedule" && (
                    <AvailabilityGrid 
                      providerId={providerId!}
                      onUpdate={loadData}
                    />
                  )}

                  {activeSubTab === "time-off" && (
                    <TimeOffManager 
                      providerId={providerId!}
                      onUpdate={loadData}
                    />
                  )}
               </div>
            )}
          </div>
        </div>

        <DrawerFooter className="p-8 bg-slate-50/50 border-t border-slate-100 flex-shrink-0 flex flex-row gap-4">
           <div className="flex-1 flex items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md group">
              <ShieldCheck className="w-8 h-8 text-green-500 mr-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              <div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Credential</div>
                 <div className="text-[11px] font-black text-slate-800 tracking-tight">VERIFIED CLINICIAN REGISTRY</div>
              </div>
           </div>
           <Button 
            variant="ghost" 
            onClick={onClose} 
            className="w-40 h-16 rounded-2xl font-black text-slate-400 hover:text-slate-600 uppercase tracking-[0.2em] text-[10px] transition-all bg-white border border-slate-200 shadow-sm hover:shadow-md"
           >
             Dismiss Profile
           </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
