"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { appointmentsApi } from "@/lib/api/appointments";
import { providersApi } from "@/lib/api/providers";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
// Components
import { TodayHeader } from "./components/TodayHeader";
import { ProviderSubTabs } from "./components/ProviderSubTabs";
import { QueueTable } from "./components/QueueTable";
import { TodaySidebar } from "./components/TodaySidebar";
import { SkeletonRows } from "@/components/dashboard/receptionist/SkeletonRows";
import type { Appointment } from "@/types/appointment";

export default function ReceptionistQueuePage() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [activeProviderId, setActiveProviderId] = useState("all");

  const [stats, setStats] = useState({
    scheduled: 0,
    checked_in: 0,
    in_progress: 0,
    completed: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      // Fetch appointments for today
      const aptsRes = await appointmentsApi.getAppointments({ date: today, page_size: 1000 });
      if (aptsRes.success) {
        setAppointments(aptsRes.data);
        
        // Calculate stats
        const newStats = { scheduled: 0, checked_in: 0, in_progress: 0, completed: 0 };
        aptsRes.data.forEach((apt: Appointment) => {
          if (apt.status === "scheduled") newStats.scheduled++;
          else if (apt.status === "checked_in") newStats.checked_in++;
          else if (apt.status === "in_progress") newStats.in_progress++;
          else if (apt.status === "completed") newStats.completed++;
        });
        setStats(newStats);
      }

      // Fetch providers
      const provRes = await providersApi.getProviders();
      if (provRes.success) {
        // We also need capacity for each provider
        // Assuming there is an endpoint or we can use the dashboard one
        // Fallback: mock capacity for now if endpoint isn't wired
        const providersWithCapacity = provRes.data.map((p: any) => ({
          provider_id: p.id,
          name: p.full_name,
          current_load: 0, // Would fetch from capacity endpoint
          max_capacity: p.daily_capacity || 8
        }));
        
        // Let's filter to only those who have appointments today
        const activeProviderIds = new Set(aptsRes.data.map((a: Appointment) => a.provider_id));
        const activeProviders = providersWithCapacity.filter((p: any) => activeProviderIds.has(p.provider_id));
        
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
    // In a full implementation, we'd wire up useWebSocket here
  }, [fetchData]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      // Optimistic update
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
      
      const res = await appointmentsApi.updateStatus(id, newStatus);
      if (res.success) {
        toast.success(`Appointment status updated to ${newStatus}`);
        fetchData(); // Refresh to ensure sync
      }
    } catch (e) {
      toast.error("Failed to update status");
      fetchData(); // Revert on failure
    }
  };

  const handleCancel = async (id: string) => {
    // This should open a modal, but for now we'll do a simple confirm prompt
    // until we implement the Cancel Dialog
    const reason = window.prompt("Reason for cancellation?");
    if (!reason) return;
    
    try {
      const res = await appointmentsApi.updateStatus(id, "cancelled", reason);
      if (res.success) {
        toast.success("Appointment cancelled");
        fetchData();
      }
    } catch (e) {
      toast.error("Failed to cancel appointment");
    }
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
              <div className="p-4">
                <SkeletonRows rows={8} />
              </div>
            ) : (
              <QueueTable 
                appointments={filteredAppointments}
                showProviderColumn={activeProviderId === "all"}
                onStatusChange={handleStatusChange}
                onCancel={handleCancel}
                onReschedule={(id) => toast.info("Reschedule flow not yet implemented")}
                onViewDetails={(id) => toast.info("Detail drawer not yet implemented")}
              />
            )}
          </div>
        </DashboardCard>

        {/* Sidebar only visible on xl screens */}
        <TodaySidebar />
      </div>
    </div>
  );
}
