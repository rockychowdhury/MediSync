"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "next/navigation";
import type { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { toast } from "sonner";

// New Core Hooks
import { useAppointments } from "./hooks/useAppointments";
import { useAppointmentActions } from "./hooks/useAppointmentActions";
import { useAppointmentWebSocket } from "./hooks/useAppointmentWebSocket";

// New UI Components
import { KPICommandBar } from "./components/KPICommandBar";
import { FilterToolbar } from "./components/FilterToolbar";

// New Views
import { ListView } from "./components/views/ListView";
import { CalendarView } from "./components/views/CalendarView";
import { QueueBoard } from "./components/views/QueueBoard";

// New Dialogs & Drawers
import { AppointmentDetailDrawer } from "./components/AppointmentDetailDrawer";
import { BookAppointmentModal } from "./components/dialogs/BookAppointmentModal";
import { CancelDialog } from "./components/dialogs/CancelDialog";
import { RescheduleDialog } from "./components/dialogs/RescheduleDialog";

// Data APIs for metadata
import { providersApi } from "@/lib/api/providers";
import { servicesApi } from "@/lib/api/services";

export default function AppointmentsPage() {
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  // View State
  const [activeView, setActiveView] = useState<"list" | "calendar" | "queue">("list");
  
  // Data State via Hook
  const { 
    appointments, 
    stats, 
    loading, 
    filters, 
    pagination, 
    updateFilters, 
    handlePageChange, 
    refresh 
  } = useAppointments();

  const { bulkUpdateStatus } = useAppointmentActions(refresh);

  // Metadata State
  const [providers, setProviders] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  // Dialog/Drawer State
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);

  // Initial Metadata Fetch
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [pRes, sRes] = await Promise.all([
          providersApi.getProviders(),
          servicesApi.getServices()
        ]);
        if (pRes.success) setProviders(pRes.data || []);
        if (sRes.success) setServices(sRes.data || []);
      } catch (err) {
        console.error("Metadata fetch failed", err);
      }
    };
    if (isAuthenticated) fetchMetadata();
  }, [isAuthenticated]);

  // Handle URL Entry for specific patients
  useEffect(() => {
    const patientId = searchParams.get("patient_id");
    if (patientId) {
      setIsBookModalOpen(true);
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  // WebSocket Integration for Real-time
  useAppointmentWebSocket({
    enabled: isAuthenticated,
    onEvent: (event) => {
      if (event.startsWith("appointment_") || event === "queue_updated") {
        refresh();
      }
    }
  });

  // Action Handlers
  const handleViewDetails = (apptId: string) => {
    const appt = appointments.find(a => a.id === apptId);
    if (appt) {
      setSelectedAppointment(appt);
      setIsDetailOpen(true);
    }
  };

  const handleAction = (id: string, action: string) => {
    const appt = appointments.find(a => a.id === id);
    if (!appt) return;

    setSelectedAppointment(appt);
    
    if (action === "cancelled") {
      setIsCancelDialogOpen(true);
    } else if (action === "reschedule") {
      setIsRescheduleDialogOpen(true);
    } else {
      // Direct status updates (checked_in, in_progress, completed)
      const { updateStatus } = useAppointmentActions(refresh);
      // Note: This is an anti-pattern calling hook in handler, 
      // but if we expose it better we avoid it. 
      // Let's use a standalone update logic or the one from the Drawer.
    }
  };

  // Dedicated direct update outside hook context for simplicity in handler
  const directUpdate = async (id: string, status: string) => {
    const { appointmentsApi } = await import("@/lib/api/appointments");
    try {
      const res = await appointmentsApi.updateStatus(id, status);
      if (res.success) {
        toast.success("Registry Synced", { description: `Unit set to ${status.replace('_', ' ')}.` });
        refresh();
      }
    } catch (err) {
      toast.error("Process Failed");
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-1000 pb-4">
      {/* Dynamic Header */}
      <div className="shrink-0">
        <PageHeader 
          breadcrumbs={["Home", "Admin", "Registry"]} 
          title="Clinical Operations"
          actionContent={
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-2 text-[10px] font-black text-blue-600 bg-blue-50/50 px-4 py-2 rounded-[1.25rem] border border-blue-100 shadow-sm ring-1 ring-blue-500/10">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  LANCET SYNC: ONLINE
              </div>
            </div>
          }
        />
      </div>

      {/* Real-time KPI Bar */}
      <KPICommandBar stats={stats} loading={loading} />

      {/* Advanced Toolbar */}
      <FilterToolbar 
        onSearch={(val) => updateFilters({ search: val || undefined })}
        onFilterChange={(key, val) => updateFilters({ [key]: val })}
        onViewChange={setActiveView}
        onNewAppointment={() => setIsBookModalOpen(true)}
        onExport={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/appointments/export`, '_blank')}
        currentView={activeView}
        filters={filters}
        providers={providers}
        services={services}
      />

      {/* Primary Display Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
        {activeView === "list" && (
          <ListView 
            appointments={appointments}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onViewDetails={handleViewDetails}
            onAction={(id, action) => {
              if (["cancelled", "reschedule"].includes(action)) {
                handleAction(id, action);
              } else {
                directUpdate(id, action);
              }
            }}
            onBulkAction={(ids, action) => bulkUpdateStatus(ids, action)}
          />
        )}

        {activeView === "calendar" && (
          <CalendarView 
            appointments={appointments}
            providers={providers}
            loading={loading}
            onEventClick={handleViewDetails}
          />
        )}

        {activeView === "queue" && (
          <QueueBoard 
            appointments={appointments}
            loading={loading}
            onEventClick={handleViewDetails}
            onAction={directUpdate}
          />
        )}
      </div>

      {/* Operational Overlays */}
      <AppointmentDetailDrawer 
        appointment={selectedAppointment}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onStatusUpdate={refresh}
        onReschedule={(appt) => { setIsDetailOpen(false); setIsRescheduleDialogOpen(true); }}
        onCancel={(appt) => { setIsDetailOpen(false); setIsCancelDialogOpen(true); }}
      />

      <BookAppointmentModal 
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={refresh}
      />

      <CancelDialog 
        appointment={selectedAppointment}
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onSuccess={refresh}
      />

      <RescheduleDialog 
        appointment={selectedAppointment}
        isOpen={isRescheduleDialogOpen}
        onClose={() => setIsRescheduleDialogOpen(false)}
        onSuccess={refresh}
      />

    </div>
  );
}
