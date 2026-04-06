"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { 
  BriefcaseMedical, 
  Search, 
  Plus,
  RefreshCw,
  XCircle,
  Stethoscope,
  Layers,
  ChevronLeft,
  ChevronRight,
  Power
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  
  // Registry Hooks
  const { 
    services, 
    loading: loadingServices,
    total: totalServices,
    skip: skipServices,
    limit: limitServices,
    categories,
    fetchServices, 
    fetchCategories,
    createService, 
    updateService, 
    deleteService
  } = useServices();

  const { 
    specializations, 
    loading: loadingSpecializations,
    total: totalSpecs,
    skip: skipSpecs,
    limit: limitSpecs,
    fetchSpecializations, 
    createSpecialization, 
    updateSpecialization, 
    deleteSpecialization
  } = useSpecializations();

  // Search & Filter State
  const [serviceSearch, setServiceSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [specIdFilter, setSpecIdFilter] = useState<string>("all");
  const debouncedServiceSearch = useDebounce(serviceSearch, 300);

  const [specSearch, setSpecSearch] = useState("");
  const debouncedSpecSearch = useDebounce(specSearch, 500);

  // Dialog States
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [activeService, setActiveService] = useState<Service | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  
  const [specDialogOpen, setSpecDialogOpen] = useState(false);
  const [activeSpec, setActiveSpec] = useState<Specialization | null>(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "service" | "spec"; data: any } | null>(null);

  // Data Loading
  const loadServices = useCallback(() => {
    if (!isAuthenticated) return;
    fetchServices({
      skip: 0,
      limit: limitServices,
      search: debouncedServiceSearch,
      category: categoryFilter === "all" ? undefined : categoryFilter,
      specialization_id: specIdFilter === "all" ? undefined : specIdFilter,
      is_active: statusFilter === "all" ? undefined : statusFilter === "active"
    });
  }, [fetchServices, limitServices, debouncedServiceSearch, categoryFilter, specIdFilter, statusFilter, isAuthenticated]);

  const loadSpecs = useCallback(() => {
    if (!isAuthenticated) return;
    fetchSpecializations({
      skip: 0,
      limit: limitSpecs,
      search: debouncedSpecSearch
    });
  }, [fetchSpecializations, limitSpecs, debouncedSpecSearch, isAuthenticated]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    loadSpecs();
  }, [loadSpecs]);

  // Handlers
  const handleServiceSubmit = async (data: any) => {
    if (activeService) {
      await updateService(activeService.id, data);
    } else {
      await createService(data);
    }
    setServiceDialogOpen(false);
    setActiveService(null);
  };

  const handleSpecSubmit = async (data: any) => {
    if (activeSpec) {
      await updateSpecialization(activeSpec.id.toString(), data);
    } else {
      await createSpecialization(data);
    }
    setSpecDialogOpen(false);
    setActiveSpec(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "service") {
      await deleteService(deleteTarget.data.id);
    } else {
      await deleteSpecialization(deleteTarget.data.id.toString());
    }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const clearServiceFilters = () => {
    setServiceSearch("");
    setCategoryFilter("all");
    setSpecIdFilter("all");
    setStatusFilter("all");
  };

  const hasServiceFilters = serviceSearch !== "" || categoryFilter !== "all" || specIdFilter !== "all" || statusFilter !== "all";

  return (
    <div className="h-full flex flex-col gap-4 py-5 animate-in fade-in duration-700 bg-slate-50/30">
      <PageHeader 
        breadcrumbs={["Admin", "Governance", "Clinical Infrastructure"]} 
        title="Clinical Infrastructure" 
      />

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 px-1 pt-2 overflow-hidden">
        
        {/* ─── Left Pane: Services Registry ────────────────────────── */}
        <div className="flex flex-col gap-4 min-w-0 min-h-0 flex-1">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 px-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                <BriefcaseMedical className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Clinical Services</h2>
            </div>

            <div className="flex items-center gap-2 flex-1 justify-end">
              <div className="flex items-center gap-2 flex-1 max-w-[580px]">
                <div className="w-[140px] shrink-0">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-9 border-slate-200/60 bg-white/80 rounded-xl font-bold text-[10px] uppercase tracking-widest focus:ring-indigo-500/10">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <SelectValue placeholder="Domain" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-2xl p-1">
                      <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest py-2 px-3">All Domains</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-[10px] font-black uppercase tracking-widest py-2 px-3">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative group/search flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within/search:text-indigo-500 transition-all" />
                  <Input 
                    placeholder="Lookup assets..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="h-9 pl-9 border-slate-200/60 bg-white/80 focus-visible:ring-2 focus-visible:ring-indigo-500/10 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm w-full"
                  />
                </div>
              </div>

              {hasServiceFilters && (
                <Button 
                  variant="ghost" 
                  onClick={clearServiceFilters}
                  className="h-9 w-9 p-0 rounded-xl text-rose-500 hover:bg-rose-50 transition-all shadow-sm border border-rose-100 bg-white"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              )}

              <Button 
                onClick={() => { setActiveService(null); setIsViewOnly(false); setServiceDialogOpen(true); }}
                className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black transition-all shadow-md shadow-indigo-100 flex items-center gap-2 text-[10px] uppercase tracking-widest cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Register
              </Button>
            </div>
          </div>

          <ServicesTable 
            services={services}
            loading={loadingServices}
            onEdit={(s) => { setActiveService(s); setIsViewOnly(false); setServiceDialogOpen(true); }}
            onView={(s) => { setActiveService(s); setIsViewOnly(true); setServiceDialogOpen(true); }}
            onDelete={(s) => { setDeleteTarget({ type: "service", data: s }); setDeleteDialogOpen(true); }}
            onStatusToggle={(s) => {
               updateService(s.id, { is_active: !s.is_active });
            }}
          />

          <div className="flex items-center justify-between px-2 py-1 shrink-0">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
               Displaying {services.length} of {totalServices} Clinical Assets
             </p>
             <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={skipServices === 0}
                  onClick={() => fetchServices({ skip: Math.max(0, skipServices - limitServices) })}
                  className={cn(
                    "h-8 w-8 p-0 rounded-lg transition-all cursor-pointer",
                    skipServices > 0 
                      ? "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 shadow-sm" 
                      : "border-slate-100 text-slate-300 bg-slate-50/50"
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={skipServices + limitServices >= totalServices}
                  onClick={() => fetchServices({ skip: skipServices + limitServices })}
                  className={cn(
                    "h-8 w-8 p-0 rounded-lg transition-all cursor-pointer",
                    skipServices + limitServices < totalServices
                      ? "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 shadow-sm" 
                      : "border-slate-100 text-slate-300 bg-slate-50/50"
                  )}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
             </div>
          </div>
        </div>

        {/* ─── Right Pane: Taxonomy Registry ──────────────────────── */}
        <div className="flex flex-col gap-4 min-h-0 flex-1">
           <div className="flex items-center justify-between shrink-0 px-1">
             <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Taxonomy</h2>
             </div>
             
             <div className="flex items-center gap-2">
                <Button 
                  onClick={() => { setActiveSpec(null); setSpecDialogOpen(true); }}
                  className="h-9 w-9 p-0 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={loadSpecs}
                  className="h-9 w-9 p-0 rounded-xl border-slate-200 bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSpecializations ? "animate-spin" : ""}`} />
                </Button>
             </div>
           </div>

           <div className="relative group/search shrink-0 px-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within/search:text-indigo-500 transition-all" />
              <Input 
                placeholder="Lookup disciplines..."
                value={specSearch}
                onChange={(e) => setSpecSearch(e.target.value)}
                className="h-9 min-h-0 pl-10 border-slate-200/60 bg-white/80 focus-visible:ring-2 focus-visible:ring-indigo-500/10 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm w-full"
              />
           </div>

           <SpecializationsTable 
             specializations={specializations}
             loading={loadingSpecializations}
             onEdit={(s) => { setActiveSpec(s); setSpecDialogOpen(true); }}
             onDelete={(s) => { setDeleteTarget({ type: "spec", data: s }); setDeleteDialogOpen(true); }}
             onView={(s) => { setActiveSpec(s); setSpecDialogOpen(true); }}
           />

           <div className="flex items-center justify-between px-1 py-1 shrink-0">
              <div className="flex items-center gap-1.5 overflow-hidden">
                 <div className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{totalSpecs} Definitions</p>
              </div>
              <div className="flex items-center gap-1.5">
                 <Button 
                   variant="outline" 
                   size="sm" 
                   disabled={skipSpecs === 0}
                   onClick={() => fetchSpecializations({ skip: Math.max(0, skipSpecs - limitSpecs) })}
                   className={cn(
                    "h-7 w-7 p-0 rounded-lg transition-all cursor-pointer",
                    skipSpecs > 0 
                      ? "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 shadow-sm" 
                      : "border-slate-100 text-slate-300 bg-slate-50/50"
                  )}
                 >
                   <ChevronLeft className="w-3.5 h-3.5" />
                 </Button>
                 <Button 
                   variant="outline" 
                   size="sm"
                   disabled={skipSpecs + limitSpecs >= totalSpecs}
                   onClick={() => fetchSpecializations({ skip: skipSpecs + limitSpecs })}
                   className={cn(
                    "h-7 w-7 p-0 rounded-lg transition-all cursor-pointer",
                    skipSpecs + limitSpecs < totalSpecs
                      ? "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 shadow-sm" 
                      : "border-slate-100 text-slate-300 bg-slate-50/50"
                  )}
                 >
                   <ChevronRight className="w-3.5 h-3.5" />
                 </Button>
              </div>
           </div>
        </div>
      </div>

      {/* Management Dialogs */}
      <ServiceDialog 
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        service={activeService}
        viewOnly={isViewOnly}
        specializations={specializations}
        categories={categories}
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
        title={deleteTarget?.type === "service" ? "Decommission Asset" : "Decommission Discipline"}
        entityName={deleteTarget?.data?.name || ""}
        impactWarning={
          deleteTarget?.type === "service" 
            ? "Decommissioning this asset will immediately remove it from patient-facing catalogs. Pending schedules may be disrupted."
            : "Decommissioning this discipline will detach it from all affiliated clinical services and staff profiles."
        }
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
