"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { providersApi } from "@/lib/api/providers";
import { servicesApi } from "@/lib/api/services";
import { specializationsApi } from "@/lib/api/specializations";
import { useWebSocket } from "@/hooks/useWebSocket";
import { 
  Stethoscope, 
  Briefcase, 
  Plus, 
  Search,
  Filter,
  UserPlus,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Components (To be built next)
import { ProviderGrid } from "@/components/dashboard/providers/ProviderGrid";
import { ServiceTable } from "@/components/dashboard/services/ServiceTable";
import { ProviderDetailDrawer } from "@/components/dashboard/providers/ProviderDetailDrawer";
import { CreateServiceModal } from "@/components/dashboard/services/CreateServiceModal";
import { PromoteUserModal } from "@/components/dashboard/providers/PromoteUserModal";
import { SpecializationPanel } from "@/components/dashboard/services/SpecializationPanel";

export default function ProvidersServicesPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [activeTab, setActiveTab] = useState<"providers" | "services">("providers");
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [providers, setProviders] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [specializations, setSpecializations] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Search state for each tab
  const [providerSearch, setProviderSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");

  // UI State
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isSpecPanelOpen, setIsSpecPanelOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [provsRes, servsRes, specsRes, catsRes] = await Promise.all([
        providersApi.getProviders(),
        servicesApi.getServices(),
        specializationsApi.getSpecializations(),
        servicesApi.getCategories()
      ]);

      if (provsRes.success) setProviders(provsRes.data || []);
      if (servsRes.success) setServices(servsRes.data || []);
      if (specsRes.success) setSpecializations(specsRes.data || []);
      if (catsRes.success) setCategories(catsRes.data || []);

    } catch (error) {
      console.error("Failed to fetch workforce data", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time updates
  useWebSocket({
    channel: "dashboard:admin",
    enabled: isAuthenticated,
    onMessage: (event) => {
      const relevantEvents = [
        "provider_created", "provider_updated", 
        "service_created", "service_updated",
        "specialization_created", "specialization_updated"
      ];
      if (relevantEvents.includes(event.event)) {
        fetchData();
      }
    },
  });

  const openProviderDetails = (id: string) => {
    setSelectedProviderId(id);
    setIsDetailOpen(true);
  };

  // Derived filtered lists (client-side for instant UX; data already loaded)
  const filteredProviders = providers.filter(p => {
    if (!providerSearch) return true;
    const name = (p.user?.name || p.user?.full_name || "").toLowerCase();
    const spec = (p.specialization?.name || "").toLowerCase();
    return name.includes(providerSearch.toLowerCase()) || spec.includes(providerSearch.toLowerCase());
  });

  const filteredServices = services.filter(s => {
    if (!serviceSearch) return true;
    const name = (s.name || "").toLowerCase();
    const cat = (s.category || "").toLowerCase();
    return name.includes(serviceSearch.toLowerCase()) || cat.includes(serviceSearch.toLowerCase());
  });

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-700 pb-6 overflow-hidden">
      <div className="shrink-0 mb-6">
        <PageHeader 
          breadcrumbs={["Home", "Admin", "Workforce"]} 
          title="Clinical Workforce"
          actionContent={
            <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
               <Button
                variant={activeTab === "providers" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("providers")}
                className={`h-9 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === "providers" ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-slate-400 hover:text-slate-600"}`}
               >
                 <Stethoscope className="w-3.5 h-3.5 mr-2" />
                 Providers
               </Button>
               <Button
                variant={activeTab === "services" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("services")}
                className={`h-9 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === "services" ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-slate-400 hover:text-slate-600"}`}
               >
                 <Briefcase className="w-3.5 h-3.5 mr-2" />
                 Services
               </Button>
            </div>
          }
        />
      </div>

      {loading && providers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center animate-pulse">
           <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4 opacity-50" />
           <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Workforce Management...</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-2 custom-scrollbar">
          {activeTab === "providers" ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
               <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input 
                      placeholder="Search clinical staff..." 
                      value={providerSearch}
                      onChange={e => setProviderSearch(e.target.value)}
                      className="pl-10 h-11 border-slate-200 rounded-2xl bg-white shadow-sm focus:shadow-md transition-all font-semibold"
                    />
                  </div>
                  <Button 
                    onClick={() => setIsPromoteModalOpen(true)}
                    className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Promote User
                  </Button>
               </div>
               
               <ProviderGrid 
                providers={filteredProviders}
                onProviderClick={openProviderDetails}
               />

            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-left-4 duration-500 pb-10">
               <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 max-w-md relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input 
                      placeholder="Search clinical services..." 
                      value={serviceSearch}
                      onChange={e => setServiceSearch(e.target.value)}
                      className="pl-10 h-11 border-slate-200 rounded-2xl bg-white shadow-sm focus:shadow-md transition-all font-semibold"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => setIsSpecPanelOpen(!isSpecPanelOpen)}
                      className="h-11 px-6 rounded-2xl border-slate-200 font-black text-[11px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                      Specializations
                    </Button>
                    <Button 
                      onClick={() => setIsServiceModalOpen(true)}
                      className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Service
                    </Button>
                  </div>
               </div>

               {isSpecPanelOpen && (
                 <SpecializationPanel 
                  specializations={specializations}
                  onUpdate={fetchData}
                 />
               )}
               
               <ServiceTable 
                services={filteredServices}
                categories={categories}
                onUpdate={fetchData}
               />

            </div>
          )}
        </div>
      )}

      {/* Modals & Drawers */}
      <ProviderDetailDrawer 
        providerId={selectedProviderId}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        specializations={specializations}
        onUpdate={fetchData}
      />

      <PromoteUserModal 
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        specializations={specializations}
        onSuccess={fetchData}
      />

      <CreateServiceModal 
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        specializations={specializations}
        categories={categories}
        onSuccess={fetchData}
      />
    </div>
  );
}
