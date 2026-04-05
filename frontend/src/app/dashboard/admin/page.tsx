"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Loader2 } from "lucide-react";
import { format, subDays } from "date-fns";

import { dashboardApi } from "@/lib/api/dashboard";
import { useWebSocket } from "@/hooks/useWebSocket";

// Core Components
import { DashboardHeader } from "./components/DashboardHeader";
import { KPIStrip } from "./components/KPIStrip";
import { AlertBannerZone } from "./components/AlertBannerZone";
import { QuickActionsRow } from "./components/QuickActionsRow";

// Panels
import { AppointmentFlowChart } from "./components/panels/AppointmentFlowChart";
import { ProviderUtilisationGrid } from "./components/panels/ProviderUtilisationGrid";
import { WaitlistSnapshotPanel } from "./components/panels/WaitlistSnapshotPanel";
import { LiveActivityFeed } from "./components/panels/LiveActivityFeed";

// Charts
import { HourlyHeatmap } from "./components/charts/HourlyHeatmap";
import { ServiceDemandChart } from "./components/charts/ServiceDemandChart";
import { NoShowTrendChart } from "./components/charts/NoShowTrendChart";
import { ChartSkeleton } from "./components/charts/ChartSkeleton";

export default function AdminDashboardPage() {
  const { user, isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(true);
  
  const [summaryData, setSummaryData] = useState<any>(null);
  const [utilisationData, setUtilisationData] = useState<any>(null);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [demandData, setDemandData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any>(null);
  
  const [newLogs, setNewLogs] = useState<any[]>([]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await dashboardApi.getSummary();
      if (res.success) setSummaryData(res.data);
    } catch (err) {
      console.error("Failed to fetch dashboard summary", err);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const fetchDetailedData = useCallback(async () => {
    try {
      const today = new Date();
      const last7Days = format(subDays(today, 7), "yyyy-MM-dd");
      const todayStr = format(today, "yyyy-MM-dd");

      const [utilRes, heatRes, demandRes, trendRes] = await Promise.all([
        dashboardApi.getProviderUtilisation(),
        dashboardApi.getAppointmentsByHour(last7Days, todayStr),
        dashboardApi.getServiceDemand(last7Days, todayStr),
        dashboardApi.getNoShowTrend(last7Days, todayStr)
      ]);

      if (utilRes.success) setUtilisationData(utilRes.data.providers);
      if (heatRes.success) setHeatmapData(heatRes.data.data);
      if (demandRes.success) setDemandData(demandRes.data.services);
      if (trendRes.success) setTrendData(trendRes.data);
    } catch (err) {
      console.error("Failed to fetch detailed dashboard data", err);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSummary();
      fetchDetailedData();
    }
  }, [isAuthenticated, fetchSummary, fetchDetailedData]);

  // Real-Time Sync via WebSocket
  const { isConnected } = useWebSocket({
    channel: "dashboard:global",
    enabled: isAuthenticated,
    token: token,
    onMessage: (event) => {
      // Refresh summary for any operational change
      fetchSummary();
      
      // If it's a provider change, refresh utilisation too
      if (event.event.startsWith("provider_")) {
        dashboardApi.getProviderUtilisation().then(res => {
          if (res.success) setUtilisationData(res.data.providers);
        });
      }

      // Add to live feed if it's a creation/deletion event
      if (event.event.includes("_created") || event.event.includes("_deleted") || event.event.includes("_updated")) {
        const newLog = {
          id: Math.random().toString(36).substr(2, 9),
          action_type: event.event.split("_")[1],
          entity_type: event.event.split("_")[0],
          user_name: "System",
          created_at: new Date().toISOString(),
          metadata: event.data
        };
        setNewLogs(prev => [newLog, ...prev].slice(0, 5));
      }
    }
  });

  if (loadingSummary || !summaryData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Initialising Clinical Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-700">
      
      <DashboardHeader 
        userName={user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Admin'} 
        isLive={isConnected} 
      />

      <KPIStrip data={summaryData} />

      <AlertBannerZone alerts={summaryData.alerts} />

      <QuickActionsRow />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Operational Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AppointmentFlowChart data={summaryData.appointments} />
            <WaitlistSnapshotPanel data={{
              ...summaryData.waitlist,
              recent_entries: [] // Backend summary currently doesn't include individual entries, could be expanded later
            }} />
          </div>

          {loadingDetails ? (
            <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-col h-[400px] animate-pulse">
              <div className="h-4 w-32 bg-slate-100 rounded-md mb-6" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-16 bg-slate-50/50 rounded-2xl" />
                ))}
              </div>
            </div>
          ) : (
            <ProviderUtilisationGrid providers={utilisationData || []} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {loadingDetails ? <ChartSkeleton /> : <ServiceDemandChart data={demandData || []} />}
            {loadingDetails ? <ChartSkeleton /> : (
              <NoShowTrendChart 
                data={trendData?.days || []} 
                averages={trendData?.averages || { no_show_rate: 0, cancellation_rate: 0 }} 
              />
            )}
          </div>
        </div>

        {/* Side Column */}
        <div className="flex flex-col gap-8">
          <LiveActivityFeed initialLogs={[]} newLogs={newLogs} />
          {loadingDetails ? <ChartSkeleton /> : <HourlyHeatmap data={heatmapData || []} />}
          
          <div className="bg-blue-600 p-8 rounded-[32px] text-white relative overflow-hidden group shadow-lg">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Loader2 size={120} />
            </div>
            <h4 className="text-xl font-black mb-2">Need Help?</h4>
            <p className="text-[13px] font-medium opacity-80 mb-6">Access MediSync documentation or contact system support.</p>
            <button className="bg-white text-blue-600 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-sm">
              Documentation →
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
