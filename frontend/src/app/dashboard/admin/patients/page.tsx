"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import type { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { PatientToolbar } from "@/components/dashboard/patients/PatientToolbar";
import { PatientTable } from "@/components/dashboard/patients/PatientTable";
import { CreatePatientModal } from "@/components/dashboard/patients/CreatePatientModal";
import { PatientDetailDrawer } from "@/components/dashboard/patients/PatientDetailDrawer";
import { patientsApi } from "@/lib/api";
import { useWebSocket } from "@/hooks/useWebSocket";
import { UserCheck } from "lucide-react";

export default function PatientsPage() {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [filters, setFilters] = useState<any>({
    skip: 0,
    limit: 10,
    search: undefined,
    is_active: undefined,
  });

  const [pagination, setPagination] = useState({
    total: 0,
    skip: 0,
    limit: 10
  });

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await patientsApi.getPatients(filters);
      if (res.success) {
        setPatients(res.data || []);
        if (res.pagination_data) {
          setPagination(res.pagination_data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch patients data", error);
    } finally {
      setLoading(false);
    }
  }, [filters, isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time updates
  useWebSocket({
    channel: "dashboard:admin",
    enabled: isAuthenticated,
    onMessage: (event) => {
      if (event.event === "patient_created" || event.event === "patient_updated") {
        fetchData();
      }
    },
  });

  const handleSearch = (val: string) => {
    setFilters((prev: any) => ({ ...prev, search: val || undefined, skip: 0 }));
  };

  const handleFilterChange = (key: string, val: string) => {
    let finalVal: any = val;
    if (val === "true") finalVal = true;
    if (val === "false") finalVal = false;
    if (val === "all") finalVal = undefined;
    
    setFilters((prev: any) => ({ ...prev, [key]: finalVal, skip: 0 }));
  };

  const handlePageChange = (newSkip: number) => {
    setFilters((prev: any) => ({ ...prev, skip: newSkip }));
  };

  const openDetails = (id: string) => {
    setSelectedPatientId(id);
    setIsDetailOpen(true);
  };

  const handleBookAppointment = (patient: any) => {
    // Redirect to appointments page with patient_id pre-filled in query
    router.push(`/dashboard/admin/appointments?patient_id=${patient.id}&patient_name=${encodeURIComponent(patient.name || patient.full_name)}`);
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-700 pb-4">
      <div className="shrink-0 mb-2">
        <PageHeader 
          breadcrumbs={["Home", "Admin", "Patients"]} 
          title="Patient Registry"
          actionContent={
            <div className="flex items-center gap-3">
               <div className="flex items-center space-x-2 text-[10px] font-black text-green-600 bg-green-50/50 px-4 py-2 rounded-2xl border border-green-100 shadow-sm uppercase tracking-widest">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-sm"></span>
                  </span>
                  Clinical Sync Verified
                </div>
            </div>
          }
        />
      </div>

      <PatientToolbar 
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onNewPatient={() => setIsCreateModalOpen(true)}
      />

      <div className="flex-1 min-h-0">
        <PatientTable 
          patients={patients}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onViewPatient={openDetails}
          onBookAppointment={handleBookAppointment}
        />
      </div>

      {/* Create Patient Modal */}
      <CreatePatientModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchData}
      />

      {/* Patient Detail Drawer */}
      <PatientDetailDrawer 
        patientId={selectedPatientId}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdate={fetchData}
      />
    </div>
  );
}
