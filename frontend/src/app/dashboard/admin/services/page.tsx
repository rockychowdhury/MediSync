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
      <div className="shrink-0">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
          <div className="space-y-0 flex-1">
             <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-slate-300 mb-4">
               <span>Admin</span>
               <ArrowRight className="w-2.5 h-2.5 text-slate-200" />
               <span>Operations</span>
               <ArrowRight className="w-2.5 h-2.5 text-slate-200" />
               <span className="text-indigo-600">Clinical Registry</span>
             </div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">
               Clinical Infrastructure
             </h1>
             <p className="text-[11px] font-bold text-slate-400 max-w-2xl leading-relaxed uppercase tracking-widest">
               Orchestrate the institutional hierarchy of healthcare assets and specialized departmental categories.
             </p>
          </div>
          
          <Button 
            onClick={() => {
              if (activeTab === "services") { setActiveService(null); setServiceDialogOpen(true); }
              else { setActiveSpec(null); setSpecDialogOpen(true); }
            }}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-6 gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95 cursor-pointer"
          >
             <Plus className="w-4 h-4" />
             {activeTab === "services" ? "Register Resource" : "Add Discipline"}
          </Button>
        </header>

        {/* Modern Tab Navigation (Integrated) */}
        <div className="flex items-center gap-4 mt-8 px-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-fit">
            <TabsList className="bg-slate-50/50 backdrop-blur-sm p-1 rounded-xl border border-slate-200/60 shadow-sm">
              <TabsTrigger 
                value="services" 
                className="rounded-lg px-6 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all cursor-pointer"
              >
                <BriefcaseMedical className="w-3.5 h-3.5 mr-2" />
                Resource Registry
              </TabsTrigger>
              <TabsTrigger 
                value="specializations" 
                className="rounded-lg px-6 py-1.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 mr-2" />
                Departmental Taxonomy
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="h-px bg-slate-100 grow" />
        </div>
      </div>

      {/* Conditional Content Rendering */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          <TabsContent value="services" className="m-0 flex-1 flex flex-col overflow-hidden outline-none data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 duration-500">
             <div className="flex items-center gap-3 px-1 mb-6 mt-4 shrink-0">
               <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                  <Activity className="w-4 h-4" />
               </div>
               <div>
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none">Operational Assets</h2>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     Registry Status: Active / Read-Write
                  </p>
               </div>
             </div>
             
             <ServicesTable 
               services={services}
               onEdit={(s) => { setActiveService(s); setServiceDialogOpen(true); }}
               onDelete={(s) => { setDeleteTarget({ type: "service", data: s }); setDeleteDialogOpen(true); }}
             />
          </TabsContent>

          <TabsContent value="specializations" className="m-0 flex-1 flex flex-col overflow-hidden outline-none data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 duration-500">
             <div className="flex items-center gap-3 px-1 mb-6 mt-4 shrink-0">
               <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
                  <Settings2 className="w-4 h-4" />
               </div>
               <div>
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none">Disciplines Registry</h2>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
                     Institutional Expertise Mapping & Clinical Categories
                  </p>
               </div>
             </div>
             
             <SpecializationsTable 
               specializations={specializations}
               onEdit={(s) => { setActiveSpec(s); setSpecDialogOpen(true); }}
               onDelete={(s) => { setDeleteTarget({ type: "spec", data: s }); setDeleteDialogOpen(true); }}
             />
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
