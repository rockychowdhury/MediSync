"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "next/navigation";
import type { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { AppointmentToolbar } from "@/components/dashboard/appointments/AppointmentToolbar";
import { appointmentsApi } from "@/lib/api/appointments";
import { providersApi } from "@/lib/api/providers";
import { servicesApi } from "@/lib/api/services";

import { useWebSocket } from "@/hooks/useWebSocket";
import { toast } from "sonner";


import { AppointmentListView } from "@/components/dashboard/appointments/AppointmentListView";
import { CalendarView } from "@/components/dashboard/appointments/CalendarView";
import { AppointmentDetailDrawer } from "@/components/dashboard/appointments/AppointmentDetailDrawer";
import { BookAppointmentModal } from "@/components/dashboard/appointments/BookAppointmentModal";

export default function AppointmentsPage() {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [view, setView] = useState<"calendar" | "list">("list");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [prefilledPatientId, setPrefilledPatientId] = useState<string | null>(null);

  useEffect(() => {
    const patientId = searchParams.get("patient_id");
    if (patientId) {
      setPrefilledPatientId(patientId);
      setIsBookModalOpen(true);
      // Optional: Clear params after reading to avoid re-opening on refresh
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  const [filters, setFilters] = useState<any>({
    skip: 0,
    limit: 10,
    // Note: start_date and end_date are now optional
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
      const [apptsRes, provsRes, servsRes] = await Promise.all([
        appointmentsApi.getAppointments(filters),
        providersApi.getProviders(),
        servicesApi.getServices(),
      ]);

      if (apptsRes.success) {
        setAppointments(apptsRes.data || []);
        if (apptsRes.meta?.pagination) {
          const { total, skip, limit } = apptsRes.meta.pagination;
          setPagination({ total, skip, limit });
        }
      }
      if (provsRes.success) setProviders(provsRes.data || []);
      if (servsRes.success) setServices(servsRes.data || []);
    } catch (error) {
      console.error("Failed to fetch appointments data", error);
      toast.error("Failed to load appointments", { description: "Check your connection and try again." });
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
      if (event.event === "appointment_created" || event.event === "appointment_updated") {
        fetchData();
      }
    },
  });

  const handleSearch = (val: string) => {
    setFilters((prev: any) => ({ ...prev, search: val || undefined, skip: 0 }));
  };

  const handleFilterChange = (key: string, val: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: val === "all" ? undefined : val, skip: 0 }));
  };

  const handlePageChange = (newSkip: number) => {
    setFilters((prev: any) => ({ ...prev, skip: newSkip }));
  };

  const openDetails = (id: string) => {
    const appt = appointments.find(a => a.id === id);
    if (appt) {
      setSelectedAppointment(appt);
      setIsDetailOpen(true);
    }
  };

  const handleAction = async (id: string, status: string) => {
    try {
      const res = await appointmentsApi.updateStatus(id, status);
      if (res.success) {
        fetchData();
        toast.success("Status updated", { description: `Appointment set to ${status}.` });
      }
    } catch (error) {
      console.error(`Failed to update appointment ${id} to ${status}`, error);
      toast.error("Failed to update status");
    }
  };


  return (
    <div className="h-full flex flex-col animate-in fade-in duration-700 pb-4">
      <div className="shrink-0 mb-2">
        <PageHeader 
          breadcrumbs={["Home", "Admin", "Appointments"]} 
          title="Clinical Operations"
          actionContent={
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-2 text-[11px] font-black text-blue-600 bg-blue-50/50 px-4 py-2 rounded-2xl border border-blue-100 shadow-sm">
                  <span className="relative flex h-2.5 w-2.5 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 shadow-sm"></span>
                  </span>
                  LANCET SYNC ACTIVE
                </div>
            </div>
          }
        />
      </div>

      <AppointmentToolbar 
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onViewChange={setView}
        onNewAppointment={() => setIsBookModalOpen(true)}
        currentView={view}
        providers={providers}
        services={services}
      />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {view === "calendar" ? (
          <CalendarView 
            appointments={appointments} 
            providers={providers} 
            loading={loading}
            onEventClick={(appt: any) => {
              setSelectedAppointment(appt);
              setIsDetailOpen(true);
            }}
          />
        ) : (
          <AppointmentListView 
            appointments={appointments} 
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onViewDetails={openDetails}
            onAction={handleAction}
          />
        )}
      </div>

      {/* Detail Drawer */}
      <AppointmentDetailDrawer 
        appointment={selectedAppointment}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onStatusUpdate={fetchData}
      />

      {/* Book Appointment Modal */}
      <BookAppointmentModal 
        isOpen={isBookModalOpen}
        onClose={() => {
          setIsBookModalOpen(false);
          setPrefilledPatientId(null);
        }}
        onSuccess={fetchData}
        prefilledPatientId={prefilledPatientId}
      />

    </div>
  );
}
