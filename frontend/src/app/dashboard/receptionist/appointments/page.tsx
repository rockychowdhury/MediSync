"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { appointmentsApi } from "@/lib/api/appointments";
import { providersApi } from "@/lib/api/providers";
import { servicesApi } from "@/lib/api/services";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { AppointmentsFilterBar, AppointmentFilters } from "./components/AppointmentsFilterBar";
import { AppointmentListView } from "./components/AppointmentListView";
import { AppointmentCalendar } from "./components/AppointmentCalendar";
import type { Appointment } from "@/types/appointment";

export default function AppointmentsPage() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [filters, setFilters] = useState<AppointmentFilters>({
    date_from: format(new Date(), "yyyy-MM-dd"),
    date_to: format(new Date(), "yyyy-MM-dd"),
    provider_id: "",
    service_id: "",
    status: [],
    search: "",
  });

  // Load dropdown data once
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [provRes, servRes] = await Promise.all([
          providersApi.getProviders(),
          servicesApi.getServices(),
        ]);
        if (provRes.success) setProviders(provRes.data);
        if (servRes.success) setServices(servRes.data);
      } catch (error) {
        console.error("Failed to load metadata", error);
      }
    };
    fetchMetadata();
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        date_from: filters.date_from,
        date_to: filters.date_to,
        page_size: 1000,
      };
      if (filters.provider_id) params.provider_id = filters.provider_id;
      if (filters.service_id) params.service_id = filters.service_id;
      if (filters.status.length > 0) params.status = filters.status.join(",");
      if (filters.search) params.search = filters.search;

      const res = await appointmentsApi.getAppointments(params);
      if (res.success) {
        setAppointments(res.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await appointmentsApi.updateStatus(id, newStatus);
      if (res.success) {
        toast.success(`Appointment status updated to ${newStatus}`);
        fetchAppointments();
      }
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const handleCancel = async (id: string) => {
    const reason = window.prompt("Reason for cancellation?");
    if (!reason) return;
    try {
      const res = await appointmentsApi.updateStatus(id, "cancelled", reason);
      if (res.success) {
        toast.success("Appointment cancelled");
        fetchAppointments();
      }
    } catch (e) {
      toast.error("Failed to cancel appointment");
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 pb-12">
      <div className="shrink-0 mb-6">
        <PageHeader 
          breadcrumbs={["Home", "Reception", "Appointments"]} 
          title="All Appointments"
          description="Browse and manage the full appointment schedule across all dates and providers."
          actionContent={
            <button 
              className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors"
              onClick={() => toast.info("Book appointment modal not yet implemented")}
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          }
        />
      </div>

      <div className="flex flex-col gap-6">
        <AppointmentsFilterBar 
          filters={filters}
          onChange={setFilters}
          view={view}
          onViewChange={setView}
          providers={providers}
          services={services}
        />

        {view === "list" ? (
          <AppointmentListView 
            appointments={appointments}
            isLoading={loading}
            onStatusChange={handleStatusChange}
            onCancel={handleCancel}
            onReschedule={() => toast.info("Reschedule flow not yet implemented")}
            onViewDetails={() => toast.info("Detail drawer not yet implemented")}
          />
        ) : (
          <AppointmentCalendar 
            appointments={appointments}
            isLoading={loading}
            onViewDetails={() => toast.info("Detail drawer not yet implemented")}
          />
        )}
      </div>
    </div>
  );
}
