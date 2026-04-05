"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import type { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, 
  Users, 
  ArrowLeft,
  ShieldCheck,
  BadgeCheck
} from "lucide-react";

import { usePatients } from "./hooks/usePatients";
import { usePatientDetail } from "./hooks/usePatientDetail";
import { PatientList } from "./components/PatientList";
import { PatientDetailPanel } from "./components/PatientDetailPanel";
import { PatientFormDrawer } from "./components/PatientFormDrawer";
import { DeactivateDialog } from "./components/DeactivateDialog";

export default function PatientsManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // Master Selection & UI State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);

  // Data Hooks
  const { 
    patients, 
    loading: listLoading, 
    loadingMore, 
    hasMore, 
    totalCount, 
    filters, 
    updateFilters, 
    loadMore, 
    refresh: refreshList 
  } = usePatients();

  const { 
    patient, 
    stats, 
    loading: detailLoading, 
    refresh: refreshDetail, 
    updateStatus,
  } = usePatientDetail(selectedId);

  // Handle Initial Selection from URL
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) setSelectedId(id);
  }, [searchParams]);

  if (!isAuthenticated) return null;

  const handleCreate = () => {
    setEditingPatient(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (p: any) => {
    setEditingPatient(p);
    setIsDrawerOpen(true);
  };

  const handleBook = (p: any) => {
    router.push(`/dashboard/admin/appointments?patient_id=${p.id}`);
  };

  const handleToggleStatus = (val: boolean) => {
    if (!val) {
      setIsDeactivateOpen(true);
    } else {
      updateStatus(true);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-1000 overflow-hidden">
      {/* 1. Page Header Area */}
      <div className="shrink-0 mb-4 px-1">
        <PageHeader 
          breadcrumbs={["Home", "Admin", "Registry"]} 
          title="Patient Master Registry"
          description="Manage clinical enrollment, demographics, and unit history logs."
          actionContent={
            <div className="flex items-center gap-3">
               <div className="hidden lg:flex items-center space-x-2 text-[10px] font-black text-blue-600 bg-blue-50/50 px-4 py-2 rounded-2xl border border-blue-100 shadow-sm uppercase tracking-widest mr-2">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 shadow-sm"></span>
                  </span>
                  Registry Sync Active
                </div>
                <Button 
                  onClick={handleCreate}
                  className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[12px] uppercase tracking-wider shadow-lg shadow-blue-100 transition-all active:scale-95"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Enroll Patient
                </Button>
            </div>
          }
        />
        <div className="mt-2 flex items-center gap-2">
           <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 text-[10px] font-black uppercase tracking-widest gap-2 py-1 px-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              HIPAA Compliant Workstation
           </Badge>
           <p className="text-[10px] text-slate-400 italic">Sensitive data is encrypted during transit and at rest.</p>
        </div>
      </div>

      {/* 2. Main Workspace (Split View) */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* LEFT: MASTER LIST */}
        <div className="w-[340px] h-full overflow-hidden hidden md:block">
          <PatientList 
            patients={patients}
            selectedId={selectedId}
            onSelect={setSelectedId}
            filters={filters}
            onFilterChange={updateFilters}
            loading={listLoading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={loadMore}
            totalCountCount={totalCount}
            onNewPatient={handleCreate}
            onEdit={handleEdit}
            onBook={handleBook}
            onDeactivate={(p) => { setSelectedId(p.id); setIsDeactivateOpen(true); }}
          />
        </div>

        {/* RIGHT: DETAIL WORKSPACE */}
        <div className="flex-1 h-full bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col relative group/workspace">
           {selectedId ? (
              <PatientDetailPanel 
                patient={patient}
                stats={stats}
                loading={detailLoading}
                onEdit={handleEdit}
                onBook={handleBook}
                onStatusChange={handleToggleStatus}
                onToggleNotifications={(val) => console.log("Toggle notifications", val)}
                onRefresh={refreshDetail}
              />
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-8 animate-in fade-in duration-1000">
                <div className="relative">
                   <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner group-hover/workspace:rotate-3 transition-transform duration-700">
                      <Users className="w-12 h-12 text-slate-200" />
                   </div>
                   <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white shadow-xl flex items-center justify-center border border-slate-50">
                      <BadgeCheck className="w-5 h-5 text-blue-500" />
                   </div>
                </div>
                
                <div className="max-w-xs space-y-3">
                   <h3 className="text-xl font-black text-slate-800 tracking-tight">Clinical Knowledge Base</h3>
                   <p className="text-xs text-slate-400 font-bold leading-relaxed uppercase tracking-widest">
                      Select a record from the registry to manage demographics, unit history, and audit logs.
                   </p>
                </div>

                <div className="flex flex-col gap-3 w-48">
                   <Button onClick={handleCreate} className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/10 transition-all active:scale-95">
                      Register First Patient
                   </Button>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* 3. Operational Drawers & Modals */}
      <PatientFormDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        patient={editingPatient}
        onSuccess={() => {
           refreshList();
           if (selectedId) refreshDetail();
        }}
      />

      <DeactivateDialog 
        isOpen={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        onConfirm={async () => {
           await updateStatus(false);
           setIsDeactivateOpen(false);
           refreshList();
        }}
        patient={patient}
        loading={detailLoading}
      />
    </div>
  );
}
