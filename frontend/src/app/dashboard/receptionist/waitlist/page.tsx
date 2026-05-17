"use client";

import { useState, useEffect, useCallback } from "react";
import { waitlistApi } from "@/lib/api/waitlist";
import { servicesApi } from "@/lib/api/services";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { QueueEntry } from "@/types/queue";

import { WaitTimeEstimatesStrip } from "./components/WaitTimeEstimatesStrip";
import { WaitlistTable } from "./components/WaitlistTable";
import { AssignWaitlistModal } from "@/components/dashboard/receptionist/modals/AssignWaitlistModal";
import { AddToWaitlistModal } from "@/components/dashboard/receptionist/modals/AddToWaitlistModal";
import { AppointmentDetailDrawer } from "@/components/dashboard/receptionist/modals/AppointmentDetailDrawer";
import { CancelAppointmentDialog } from "@/components/dashboard/receptionist/modals/CancelAppointmentDialog";

export default function WaitlistPage() {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEstimates, setLoadingEstimates] = useState(true);
  
  const [filters, setFilters] = useState({
    service_id: "",
    priority: "all",
    status: "waiting"
  });

  // Modal/drawer state
  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailAppointmentId, setDetailAppointmentId] = useState<string | null>(null);

  const fetchWaitlist = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { 
        status: filters.status, 
        sort: "priority_desc,queue_position_asc",
        limit: 500 
      };
      if (filters.service_id) params.service_id = filters.service_id;
      if (filters.priority !== "all") params.priority = filters.priority;

      const res = await waitlistApi.getWaitlist(params);
      if (res.success) {
        setEntries(res.data);
      }
    } catch (e) {
      toast.error("Failed to load waitlist");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchEstimates = useCallback(async () => {
    setLoadingEstimates(true);
    try {
      const res = await waitlistApi.getStats();
      if (res.success && res.data) {
        // Transform stats data into per-service estimates
        // The stats endpoint returns daily KPIs — we'll derive estimates from waiting entries
        const serviceMap = new Map<string, { service_name: string; count: number; totalWait: number }>();
        
        // Group current waiting entries by service to compute estimates
        const waitRes = await waitlistApi.getWaitlist({ status: "waiting", limit: 500 });
        if (waitRes.success) {
          for (const entry of waitRes.data) {
            const key = entry.service_id || "unknown";
            if (!serviceMap.has(key)) {
              serviceMap.set(key, { service_name: entry.service_name, count: 0, totalWait: 0 });
            }
            const svc = serviceMap.get(key)!;
            svc.count++;
            svc.totalWait += entry.estimated_wait_minutes || 15; // default 15 min if not set
          }
        }

        const estimatesList = Array.from(serviceMap.entries()).map(([id, data]) => ({
          service_id: id,
          service_name: data.service_name,
          estimated_minutes: Math.round(data.totalWait / Math.max(1, data.count)),
          queue_count: data.count,
        }));

        setEstimates(estimatesList);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEstimates(false);
    }
  }, []);

  useEffect(() => {
    fetchWaitlist();
    fetchEstimates();
    
    servicesApi.getServices().then(res => {
      if (res.success) setServices(res.data);
    });
  }, [fetchWaitlist, fetchEstimates]);

  const handleCancelEntry = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from the waitlist?`)) return;
    try {
      const res = await waitlistApi.deleteWaitlistEntry(id);
      if (res.success) {
        toast.success("Removed from waitlist");
        fetchWaitlist();
        fetchEstimates();
      }
    } catch (e) {
      toast.error("Failed to cancel entry");
    }
  };

  const handleAssignClick = (entry: QueueEntry) => {
    setSelectedEntry(entry);
    setIsAssignModalOpen(true);
  };

  const handleViewAppointment = (appointmentId: string) => {
    setDetailAppointmentId(appointmentId);
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 pb-12">
      <div className="shrink-0 mb-6">
        <PageHeader 
          breadcrumbs={["Home", "Reception", "Waitlist"]} 
          title="Waitlist Queue"
          description="Manage live waiting queues and assign patients to newly freed time slots."
          actionContent={
            <button 
              className="flex items-center space-x-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-colors"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              <span>Add to Waitlist</span>
            </button>
          }
        />
      </div>

      <div className="flex flex-col gap-6 min-h-0">
        <WaitTimeEstimatesStrip estimates={estimates} isLoading={loadingEstimates} />
        
        {/* Filter Bar */}
        <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-4 flex flex-wrap gap-4 items-center">
          <select
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
            value={filters.service_id}
            onChange={(e) => setFilters({ ...filters, service_id: e.target.value })}
          >
            <option value="">All Services</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          >
            <option value="all">All Priorities</option>
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgent</option>
            <option value="standard">Standard</option>
          </select>

          <select
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="waiting">Waiting Only</option>
            <option value="assigned">Assigned</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <WaitlistTable 
          entries={entries}
          isLoading={loading}
          onAssign={handleAssignClick}
          onCancel={handleCancelEntry}
          onViewAppointment={handleViewAppointment}
        />
      </div>

      {/* Add to Waitlist Modal */}
      <AddToWaitlistModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchWaitlist();
          fetchEstimates();
        }}
      />

      {/* Assign Waitlist Modal */}
      <AssignWaitlistModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        entry={selectedEntry}
        onSuccess={() => {
          setIsAssignModalOpen(false);
          fetchWaitlist();
          fetchEstimates();
        }}
      />

      {/* Appointment Detail Drawer (for viewing assigned appointments) */}
      <AppointmentDetailDrawer
        appointmentId={detailAppointmentId}
        isOpen={!!detailAppointmentId}
        onClose={() => setDetailAppointmentId(null)}
        onStatusChange={() => setDetailAppointmentId(null)}
        onCancel={() => setDetailAppointmentId(null)}
        onReschedule={() => setDetailAppointmentId(null)}
      />
    </div>
  );
}
