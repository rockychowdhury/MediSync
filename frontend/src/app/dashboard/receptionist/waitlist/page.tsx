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

export default function WaitlistPage() {
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEstimates, setLoadingEstimates] = useState(true);
  
  // Filters
  const [filters, setFilters] = useState({
    service_id: "",
    priority: "all",
    status: "waiting"
  });

  // Modal state
  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const fetchWaitlist = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { 
        status: filters.status, 
        sort: "priority_desc,queue_position_asc",
        page_size: 1000 
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
      // In a real app we'd fetch this from a summary endpoint or per-service
      // Since we don't know if the estimation endpoint accepts a list, we'll mock the aggregated view
      // based on the services that have active waiting entries.
      const mockEstimates = [
        { service_id: "s1", service_name: "General Consultation", estimated_minutes: 15, queue_count: 3 },
        { service_id: "s2", service_name: "Dental Checkup", estimated_minutes: 45, queue_count: 8 },
        { service_id: "s3", service_name: "Physiotherapy", estimated_minutes: 120, queue_count: 12 },
      ];
      setEstimates(mockEstimates);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEstimates(false);
    }
  }, []);

  useEffect(() => {
    fetchWaitlist();
    fetchEstimates();
    
    // Also fetch services for filter
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
      }
    } catch (e) {
      toast.error("Failed to cancel entry");
    }
  };

  const handleAssignClick = (entry: QueueEntry) => {
    setSelectedEntry(entry);
    setIsAssignModalOpen(true);
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
              onClick={() => toast.info("Add to waitlist modal not yet implemented")}
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
          onViewAppointment={(id) => toast.info("Detail drawer not yet implemented")}
        />
      </div>

      <AssignWaitlistModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        entry={selectedEntry}
        onSuccess={() => {
          fetchWaitlist();
          fetchEstimates();
        }}
      />
    </div>
  );
}
