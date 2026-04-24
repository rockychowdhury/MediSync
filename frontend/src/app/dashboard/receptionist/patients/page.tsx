"use client";

import { useState, useEffect, useCallback } from "react";
import { patientsApi } from "@/lib/api/patients";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { Search, Plus } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";

import { PatientTable } from "./components/PatientTable";
import { PatientDetailDrawer } from "@/components/dashboard/receptionist/modals/PatientDetailDrawer";

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Drawer states
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page_size: 1000,
        is_active: activeOnly ? true : undefined
      };
      if (debouncedSearch.length >= 2) {
        params.search = debouncedSearch;
      }

      const res = await patientsApi.getPatients(params);
      if (res.success) {
        setPatients(res.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeOnly]);

  useEffect(() => {
    // Only fetch if search is empty or has at least 2 chars
    if (debouncedSearch.length === 0 || debouncedSearch.length >= 2) {
      fetchPatients();
    }
  }, [fetchPatients, debouncedSearch]);

  const handleViewDetails = (id: string) => {
    setSelectedPatientId(id);
    setIsDrawerOpen(true);
  };

  const handleBookAppointment = (id: string) => {
    toast.info(`Book appointment modal for patient ${id} not yet implemented`);
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 pb-12">
      <div className="shrink-0 mb-6">
        <PageHeader 
          breadcrumbs={["Home", "Reception", "Patients"]} 
          title="Patient Directory"
          description="Manage patient records, view history, and update contact preferences."
        />
      </div>

      <div className="flex flex-col gap-6">
        {/* Search Bar */}
        <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
              placeholder="Search by name, phone number, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${activeOnly ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${activeOnly ? 'transform translate-x-4' : ''}`}></div>
              </div>
              <span className="text-sm font-bold text-slate-700">Active Only</span>
            </label>

            <div className="w-px h-6 bg-slate-200 hidden md:block" />

            <button 
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
              onClick={() => toast.info("Create patient modal not yet implemented")}
            >
              <Plus className="w-4 h-4" />
              <span>New Patient</span>
            </button>
          </div>
        </div>

        {/* Info message for short search */}
        {searchQuery.length > 0 && searchQuery.length < 2 && (
          <div className="text-sm text-slate-500 ml-2">Type at least 2 characters to search...</div>
        )}

        <PatientTable 
          patients={patients}
          isLoading={loading}
          searchQuery={debouncedSearch}
          onViewDetails={handleViewDetails}
          onBookAppointment={handleBookAppointment}
        />
      </div>

      <PatientDetailDrawer 
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedPatientId(null);
        }}
        patientId={selectedPatientId}
        onBookAppointment={handleBookAppointment}
      />
    </div>
  );
}
