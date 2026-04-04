"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { 
  BriefcaseMedical, 
  Settings2, 
  Activity,
  Layers,
  Plus,
  ArrowRight
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

// Components
import { ServicesTable } from "./components/ServicesTable";
import { SpecializationsTable } from "./components/SpecializationsTable";
import { ServiceDialog } from "./components/ServiceDialog";
import { SpecializationDialog } from "./components/SpecializationDialog";
import { DeleteConfirmDialog } from "./components/DeleteConfirmDialog";

// Hooks
import { useServices } from "./hooks/useServices";
import { useSpecializations } from "./hooks/useSpecializations";

// Types
import { Service } from "@/types/service";
import { Specialization } from "@/types/provider";

export default function ServicesManagementPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // Hooks
  const { 
    services, 
    fetchServices, 
    createService, 
    updateService, 
    deleteService,
    loading: loadingServices 
  } = useServices();

  const { 
    specializations, 
    fetchSpecializations, 
    createSpecialization, 
    updateSpecialization, 
    deleteSpecialization, 
    loading: loadingSpecializations 
  } = useSpecializations();

  // Local UI State
  const [activeTab, setActiveTab] = useState("services");
  
  // Dialog States
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [activeService, setActiveService] = useState<Service | null>(null);
  
  const [specDialogOpen, setSpecDialogOpen] = useState(false);
  const [activeSpec, setActiveSpec] = useState<Specialization | null>(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "service" | "spec"; data: any } | null>(null);

  const loadData = useCallback(async () => {
    await Promise.all([fetchServices(), fetchSpecializations()]);
  }, [fetchServices, fetchSpecializations]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Handlers
  const handleServiceSubmit = async (data: any) => {
    if (activeService) {
      await updateService(activeService.id, data);
    } else {
      await createService(data);
    }
    setActiveService(null);
  };

  const handleSpecSubmit = async (data: any) => {
    if (activeSpec) {
      await updateSpecialization(activeSpec.id, data);
    } else {
      await createSpecialization(data);
    }
    setActiveSpec(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "service") {
      await deleteService(deleteTarget.data.id);
    } else {
      await deleteSpecialization(deleteTarget.data.id);
    }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const getImpactWarning = () => {
    if (!deleteTarget) return "";
    if (deleteTarget.type === "service") {
      return `Decommissioning the "${deleteTarget.data.name}" asset will immediately remove it from the patient registration and portal interfaces. 
      Pending appointments for this service may experience operational disruption.`;
    } else {
      return `Deleting the "${deleteTarget.data.name}" department tag will immediately detach it from all active provider profiles and affiliated services. 
      This action should only be performed if the department is no longer operational.`;
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="shrink-0 px-1">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
             <PageHeader 
               breadcrumbs={["Home", "Admin", "Operations"]} 
               title="Clinical Registry Management" 
             />
             <p className="text-xs font-semibold text-slate-500 max-w-2xl leading-relaxed mt-[-20px]">
               Maintain the institutional registry of clinical services and departmental specializations. 
               All modifications are reflected in real-time across patient scheduling and provider assignment workflows.
             </p>
          </div>
          
          <Button 
            onClick={() => {
              if (activeTab === "services") { setActiveService(null); setServiceDialogOpen(true); }
              else { setActiveSpec(null); setSpecDialogOpen(true); }
            }}
            className="rounded-2xl bg-slate-900 hover:bg-black text-white h-11 px-6 gap-2 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95"
          >
             <Plus className="w-4 h-4" />
             {activeTab === "services" ? "Register Service" : "Add Discipline"}
          </Button>
        </header>

        {/* Modern Tab Navigation (Centered) */}
        <div className="flex justify-center mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-fit">
            <TabsList className="bg-slate-100/80 backdrop-blur p-1.5 rounded-2xl border border-slate-200">
              <TabsTrigger 
                value="services" 
                className="rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
              >
                <BriefcaseMedical className="w-3.5 h-3.5 mr-2" />
                Services Registry
              </TabsTrigger>
              <TabsTrigger 
                value="specializations" 
                className="rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
              >
                <Layers className="w-3.5 h-3.5 mr-2" />
                Medical Disciplines
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Conditional Content Rendering */}
      <div className="flex-1 min-h-0 overflow-auto pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
          <TabsContent value="services" className="m-0 h-full">
            <div className="space-y-6 pt-4 animate-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center gap-4 px-1">
                 <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                    <BriefcaseMedical className="w-5 h-5" />
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Clinical Assets</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                       <Activity className="w-3 h-3 text-emerald-500" />
                       Operational Services Registry (Write-Enabled)
                    </p>
                 </div>
               </div>
               
               <ServicesTable 
                 services={services}
                 onEdit={(s) => { setActiveService(s); setServiceDialogOpen(true); }}
                 onDelete={(s) => { setDeleteTarget({ type: "service", data: s }); setDeleteDialogOpen(true); }}
               />
            </div>
          </TabsContent>

          <TabsContent value="specializations" className="m-0 h-full">
            <div className="space-y-6 pt-4 animate-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center gap-4 px-1">
                 <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
                    <Layers className="w-5 h-5" />
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Departmental Taxonomy</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                       Manage institutional expertise categories and clinical routing flags
                    </p>
                 </div>
               </div>
               
               <SpecializationsTable 
                 specializations={specializations}
                 onEdit={(s) => { setActiveSpec(s); setSpecDialogOpen(true); }}
                 onDelete={(s) => { setDeleteTarget({ type: "spec", data: s }); setDeleteDialogOpen(true); }}
               />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Management Dialogs */}
      <ServiceDialog 
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        service={activeService}
        specializations={specializations}
        onSubmit={handleServiceSubmit}
      />
      
      <SpecializationDialog 
        open={specDialogOpen}
        onOpenChange={setSpecDialogOpen}
        specialization={activeSpec}
        onSubmit={handleSpecSubmit}
      />
      
      <DeleteConfirmDialog 
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={deleteTarget?.type === "service" ? "Decommission Asset" : "Decommission Department"}
        entityName={deleteTarget?.data?.name || ""}
        impactWarning={getImpactWarning()}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
