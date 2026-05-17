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
import { BookAppointmentModal } from "@/components/dashboard/receptionist/modals/BookAppointmentModal";
import { CancelAppointmentDialog } from "@/components/dashboard/receptionist/modals/CancelAppointmentDialog";
import { AppointmentDetailDrawer } from "@/components/dashboard/receptionist/modals/AppointmentDetailDrawer";
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

  // Modal / drawer state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [cancelDialogId, setCancelDialogId] = useState<string | null>(null);
  const [detailDrawerId, setDetailDrawerId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);

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
        start_date: filters.date_from,
        end_date: filters.date_to,
        limit: 500,
      };
      if (filters.provider_id) params.provider_id = filters.provider_id;
      if (filters.service_id) params.service_id = filters.service_id;
      if (filters.status.length > 0) params.status = filters.status.join(",");
      if (filters.search) params.search = filters.search;

      const res = await appointmentsApi.getAppointments(params);
      if (res.success) setAppointments(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Listen for appointment_booked events from FloatingBookButton
  useEffect(() => {
    const handler = () => fetchAppointments();
    window.addEventListener("appointment_booked", handler);
    return () => window.removeEventListener("appointment_booked", handler);
  }, [fetchAppointments]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await appointmentsApi.updateStatus(id, newStatus);
      if (res.success) {
        toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
        fetchAppointments();
      }
    } catch { toast.error("Failed to update status"); }
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
              onClick={() => setIsBookModalOpen(true)}
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
            onCancel={(id) => setCancelDialogId(id)}
            onReschedule={(id) => setRescheduleId(id)}
            onViewDetails={(id) => setDetailDrawerId(id)}
          />
        ) : (
          <AppointmentCalendar 
            appointments={appointments}
            isLoading={loading}
            onViewDetails={(id) => setDetailDrawerId(id)}
          />
        )}
      </div>

      {/* Book / Reschedule Modal */}
      <BookAppointmentModal
        isOpen={isBookModalOpen || !!rescheduleId}
        onClose={() => { setIsBookModalOpen(false); setRescheduleId(null); }}
        onSuccess={() => { setIsBookModalOpen(false); setRescheduleId(null); fetchAppointments(); }}
        rescheduleAppointmentId={rescheduleId || undefined}
      />

      {/* Cancel Dialog */}
      <CancelAppointmentDialog
        appointmentId={cancelDialogId}
        isOpen={!!cancelDialogId}
        onClose={() => setCancelDialogId(null)}
        onSuccess={() => { setCancelDialogId(null); fetchAppointments(); }}
      />

      {/* Detail Drawer */}
      <AppointmentDetailDrawer
        appointmentId={detailDrawerId}
        isOpen={!!detailDrawerId}
        onClose={() => setDetailDrawerId(null)}
        onStatusChange={(id, status) => { setDetailDrawerId(null); handleStatusChange(id, status); }}
        onCancel={(id) => { setDetailDrawerId(null); setCancelDialogId(id); }}
        onReschedule={(id) => { setDetailDrawerId(null); setRescheduleId(id); }}
      />
    </div>
  );
}
