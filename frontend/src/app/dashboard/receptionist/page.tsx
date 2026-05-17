"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { appointmentsApi } from "@/lib/api/appointments";
import { dashboardApi } from "@/lib/api/dashboard";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { toast } from "sonner";
// Components
import { TodayHeader } from "./components/TodayHeader";
import { ProviderSubTabs } from "./components/ProviderSubTabs";
import { QueueTable } from "./components/QueueTable";
import { TodaySidebar } from "./components/TodaySidebar";
import { SkeletonRows } from "@/components/dashboard/receptionist/SkeletonRows";
// Modals & Drawers
import { CancelAppointmentDialog } from "@/components/dashboard/receptionist/modals/CancelAppointmentDialog";
import { AppointmentDetailDrawer } from "@/components/dashboard/receptionist/modals/AppointmentDetailDrawer";
import { BookAppointmentModal } from "@/components/dashboard/receptionist/modals/BookAppointmentModal";
import type { Appointment } from "@/types/appointment";

export default function ReceptionistQueuePage() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [activeProviderId, setActiveProviderId] = useState("all");
  const [stats, setStats] = useState({ scheduled: 0, checked_in: 0, in_progress: 0, completed: 0 });

  // Modal/drawer state
  const [cancelDialogId, setCancelDialogId] = useState<string | null>(null);
  const [detailDrawerId, setDetailDrawerId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const [aptsRes, utilRes] = await Promise.all([
        appointmentsApi.getAppointments({ start_date: today, end_date: today, limit: 500 }),
        dashboardApi.getProviderUtilisation().catch(() => null),
      ]);

      if (aptsRes.success) {
        setAppointments(aptsRes.data);
        const newStats = { scheduled: 0, checked_in: 0, in_progress: 0, completed: 0 };
        aptsRes.data.forEach((apt: Appointment) => {
          if (apt.status in newStats) newStats[apt.status as keyof typeof newStats]++;
        });
        setStats(newStats);
      }

      // Build provider tabs from real utilisation data
      if (utilRes?.success && utilRes.data?.providers) {
        const activeProviderIds = new Set(aptsRes.data.map((a: Appointment) => a.provider_id));
        const activeProviders = utilRes.data.providers
          .filter((p: any) => activeProviderIds.has(p.provider_id))
          .map((p: any) => ({
            provider_id: p.provider_id,
            name: p.name,
            current_load: p.current_load ?? 0,
            max_capacity: p.max_capacity ?? 8,
          }));
        setProviders(activeProviders);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load queue data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for appointment_booked events from the FloatingBookButton
  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener("appointment_booked", handler);
    return () => window.removeEventListener("appointment_booked", handler);
  }, [fetchData]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
      const res = await appointmentsApi.updateStatus(id, newStatus);
      if (res.success) {
        toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
        fetchData();
      }
    } catch (e) {
      toast.error("Failed to update status");
      fetchData();
    }
  };

  const handleCancelSuccess = () => {
    setCancelDialogId(null);
    fetchData();
  };

  const handleRescheduleSuccess = () => {
    setRescheduleId(null);
    fetchData();
  };

  const filteredAppointments = activeProviderId === "all" 
    ? appointments 
    : appointments.filter(a => a.provider_id === activeProviderId);

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 pb-12">
      <div className="shrink-0 mb-6">
        <TodayHeader stats={stats} />
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        <DashboardCard className="flex-1 flex flex-col p-0 min-w-0">
          <ProviderSubTabs 
            providers={providers} 
            activeProviderId={activeProviderId} 
            onSelect={setActiveProviderId} 
          />
          
          <div className="flex-1 overflow-y-auto hidden-scrollbar bg-white">
            {loading ? (
              <div className="p-4"><SkeletonRows rows={8} /></div>
            ) : (
              <QueueTable 
                appointments={filteredAppointments}
                showProviderColumn={activeProviderId === "all"}
                onStatusChange={handleStatusChange}
                onCancel={(id) => setCancelDialogId(id)}
                onReschedule={(id) => setRescheduleId(id)}
                onViewDetails={(id) => setDetailDrawerId(id)}
              />
            )}
          </div>
        </DashboardCard>

        <TodaySidebar />
      </div>

      {/* Cancel Dialog */}
      <CancelAppointmentDialog
        appointmentId={cancelDialogId}
        isOpen={!!cancelDialogId}
        onClose={() => setCancelDialogId(null)}
        onSuccess={handleCancelSuccess}
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

      {/* Reschedule Modal (reuses BookAppointmentModal) */}
      <BookAppointmentModal
        isOpen={!!rescheduleId}
        onClose={() => setRescheduleId(null)}
        onSuccess={handleRescheduleSuccess}
        rescheduleAppointmentId={rescheduleId || undefined}
      />
    </div>
  );
}
