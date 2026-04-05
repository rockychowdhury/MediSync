"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { servicesApi } from "@/lib/api/services";
import { useWaitlist } from "./hooks/useWaitlist";
import { useWaitlistWebSocket } from "./hooks/useWaitlistWebSocket";
import { CommandBar } from "./components/CommandBar";
import { FilterToolbar } from "./components/FilterToolbar";
import { ServiceColumnsView } from "./components/views/ServiceColumnsView";
import { ListView } from "./components/views/ListView";
import { AnalyticsView } from "./components/views/AnalyticsView";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { waitlistApi } from "@/lib/api/waitlist";

export default function AdminWaitlistPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [view, setView] = useState<'columns' | 'list' | 'analytics'>('columns');
  const [services, setServices] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const {
    entries,
    entriesByService,
    loading,
    stats,
    filters,
    updateFilters,
    refresh
  } = useWaitlist();

  // Fetch reference services
  useEffect(() => {
    if (isAuthenticated) {
      servicesApi.getServices({ is_active: true }).then(res => {
        if (res.success) setServices(res.data || []);
      });
    }
  }, [isAuthenticated]);

  // Fetch analytics if in analytics view
  useEffect(() => {
    if (view === 'analytics' && isAuthenticated) {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      waitlistApi.getAnalytics({ date_from: weekAgo, date_to: today }).then(res => {
        if (res.success) setAnalyticsData(res.data);
      });
    }
  }, [view, isAuthenticated]);

  // Real-time syncing
  useWaitlistWebSocket({
    enabled: isAuthenticated,
    onRefresh: refresh,
    onEntryAdded: () => refresh(),
    onEntryAssigned: () => refresh(),
    onPositionsUpdated: () => refresh()
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const handleAction = (action: string, entry: any) => {
    setSelectedEntry(entry);
    if (action === 'assign') setIsAssignModalOpen(true);
    if (action === 'details') setIsDetailDrawerOpen(true);
    if (action === 'cancel') {
        // Implement cancel logic or open a confirmation
        if (confirm(`Are you sure you want to cancel the waitlist entry for ${entry.patient?.name}?`)) {
            waitlistApi.updateWaitlistEntry(entry.id, { status: 'cancelled' }).then((res: any) => {
                if (res.success) {
                    toast.success("Entry cancelled successfully");
                    refresh();
                }
            });
        }
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-700 pb-6 gap-6 relative">
      <div className="shrink-0">
        <PageHeader
          breadcrumbs={["Home", "Operations", "Waitlist"]}
          title="Clinical Waitlist"
          description="Real-time registry for patient queue management & auto-promotion visibility."
          actionContent={
            <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95 gap-3"
            >
              <Plus className="w-4 h-4" />
              Add to Waitlist
            </Button>
          }
        />
      </div>

      {/* KPI Section */}
      <CommandBar 
        stats={stats} 
        onFilterStatus={(s) => updateFilters({ status: s })}
      />

      {/* Filter / View Toggle Section */}
      <FilterToolbar 
        filters={filters}
        updateFilters={updateFilters}
        view={view}
        setView={setView}
        services={services}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
         {view === 'columns' && (
           <ServiceColumnsView 
             entriesByService={entriesByService} 
             services={services}
             loading={loading}
             onAssign={(e) => handleAction('assign', e)}
             onViewDetails={(e) => handleAction('details', e)}
             onAction={handleAction}
           />
         )}
         {view === 'list' && (
           <ListView 
             entries={entries} 
             loading={loading} 
             onAction={handleAction}
           />
         )}
         {view === 'analytics' && (
           <AnalyticsView data={analyticsData} />
         )}
      </div>

      {/* Overlays */}
      <AddToWaitlistModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
        services={services}
        onSuccess={refresh}
      />

      <ManualAssignModal 
        open={isAssignModalOpen}
        onOpenChange={setIsAssignModalOpen}
        entry={selectedEntry}
        onSuccess={refresh}
      />

      <WaitlistEntryDrawer 
        open={isDetailDrawerOpen}
        onOpenChange={setIsDetailDrawerOpen}
        entry={selectedEntry}
        onAction={handleAction}
      />
    </div>
  );
}

import { AddToWaitlistModal } from "./components/modals/AddToWaitlistModal";
import { ManualAssignModal } from "./components/modals/ManualAssignModal";
import { WaitlistEntryDrawer } from "./components/drawers/WaitlistEntryDrawer";
import { toast } from "sonner";
