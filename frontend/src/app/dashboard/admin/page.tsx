"use client";

import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { DashboardCard, MetricCard } from "@/components/dashboard/ui/DashboardCard";
import { Loader2 } from "lucide-react";

import { auditApi } from "@/lib/api/audit";
import { appointmentsApi } from "@/lib/api/appointments";
import { providersApi } from "@/lib/api/providers";
import { appointmentsApi as waitlistApiClient } from "@/lib/api/appointments";
import type { ActivityLog } from "@/types/audit";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Real stats from backend
  const [stats, setStats] = useState({
    appointments_today: 0,
    waitlist_count: 0,
    total_providers: 0,
    no_show_rate: "—",
  });
  const [providers, setProviders] = useState<any[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

      const [apptsRes, provsRes, logsRes] = await Promise.all([
        appointmentsApi.getAppointments({ start_date: startOfDay, end_date: endOfDay, limit: 1 }),
        providersApi.getProviders({ limit: 100 }),
        auditApi.getLogs({ limit: 10 }),
      ]);

      if (apptsRes.success) {
        const total = apptsRes.meta?.pagination?.total ?? 0;
        setStats(s => ({ ...s, appointments_today: total }));
      }
      if (provsRes.success) {
        const provList = provsRes.data || [];
        setProviders(provList.slice(0, 8)); // show top 8 in utilization widget
        setStats(s => ({ ...s, total_providers: provsRes.meta?.pagination?.total ?? provList.length }));
      }
      if (logsRes.success) {
        setLogs(logsRes.data || []);
      }
    } catch (error: any) {
      if (error?.response?.status !== 401 && error?.response?.status !== 403) {
        console.error("Failed to fetch dashboard data", error);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchDashboardData]);

  // Real-Time WebSocket Streaming
  useWebSocket({
    channel: "dashboard:admin",
    enabled: isAuthenticated,
    onMessage: (event) => {
      if (
        event.event === "audit_log_created" ||
        event.event === "appointment_created" ||
        event.event === "appointment_updated"
      ) {
        fetchDashboardData();
      }
    }
  });

  if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      
      <div className="shrink-0 mb-4">
        <PageHeader breadcrumbs={["Home", "Admin", "Overview"]} title={`Welcome back, ${user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Admin'}`} />
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mt-2">
          <MetricCard title="Total Appts Today" value={stats.appointments_today} trendText="Today's schedule" isPositive={true} />
          <MetricCard title="Active Providers" value={stats.total_providers} trendText="Clinical staff" isPositive={true} />
          <a
            href="/dashboard/admin/waitlist"
            className="flex flex-col justify-between p-5 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-200 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waitlist Queue</span>
            </div>
            <span className="text-2xl font-black text-slate-800 group-hover:text-amber-600 transition-colors">View Live →</span>
            <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Pending queue</span>
          </a>
          <MetricCard title="No-Show Rate" value={stats.no_show_rate} trendText="Historical avg" isPositive={true} />
        </div>

      </div>

      <div className="flex-1 min-h-0 grid gap-4 md:grid-cols-12 pb-2">
        
        {/* Left Column */}
        <div className="md:col-span-8 flex flex-col gap-4 min-h-0">
          
          {/* Provider Utilization */}
          <DashboardCard className="flex-1 min-h-0 p-5 flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-[16px] font-bold text-slate-900">Provider Utilization</h3>
              <a href="/dashboard/admin/providers" className="text-[11px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest">Manage →</a>
            </div>
            
            {providers.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-[12px] font-medium">
                No providers registered yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto hidden-scrollbar pr-2 pb-2">
                {providers.map(provider => {
                  const max = provider.max_daily_appointments || 1;
                  // Utilization is approximate — actual booked count needs a separate query per provider
                  // For now show capacity as reference
                  const name = provider.user?.name || provider.user?.full_name || "Provider";
                  const spec = provider.specialization?.name || "General";
                  return (
                    <div key={provider.id} className="p-3 rounded-xl border border-slate-100 bg-[#fbfbfc]">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-[13px] text-slate-800 truncate max-w-[140px]">{name}</div>
                          <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{spec}</div>
                        </div>
                        <div className="text-[12px] font-bold text-slate-700">Cap: {max}/day</div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${provider.status === 'available' ? 'bg-green-400' : provider.status === 'busy' ? 'bg-red-400' : 'bg-amber-400'}`}
                          style={{ width: provider.status === 'busy' ? '100%' : provider.status === 'available' ? '60%' : '30%' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DashboardCard>

          {/* Quick Links */}
          <DashboardCard className="shrink-0 p-5">
            <h3 className="text-[16px] font-bold text-slate-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Appointments", href: "/dashboard/admin/appointments", color: "bg-blue-50 text-blue-700 border-blue-100" },
                { label: "Patients", href: "/dashboard/admin/patients", color: "bg-green-50 text-green-700 border-green-100" },
                { label: "Providers", href: "/dashboard/admin/providers", color: "bg-purple-50 text-purple-700 border-purple-100" },
                { label: "Audit Log", href: "/dashboard/admin/audit", color: "bg-amber-50 text-amber-700 border-amber-100" },
              ].map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`p-3 rounded-xl border text-center text-[11px] font-black uppercase tracking-widest ${link.color} hover:opacity-80 transition-opacity`}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </DashboardCard>
        </div>

        {/* Right Column — Activity Feed */}
        <div className="md:col-span-4 min-h-0 flex">
          <DashboardCard className="w-full flex flex-col p-5">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-[16px] font-bold text-slate-900">Activity Feed</h3>
              <a href="/dashboard/admin/audit" className="text-[12px] font-bold text-blue-600 hover:text-blue-800">View all</a>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto hidden-scrollbar">
              <div className="space-y-4 pt-1">
                {logs.length === 0 ? (
                  <div className="text-[13px] text-slate-500 font-medium py-4 text-center">No recent activity.</div>
                ) : logs.map((log, index) => {
                  const isLast = index === logs.length - 1;
                  const dotColor = log.action_type.includes('create') ? 'bg-green-500' : 
                                   log.action_type.includes('delete') ? 'bg-red-500' : 
                                   log.user_name === 'System' ? 'bg-indigo-500' : 'bg-amber-500';
                  
                  return (
                    <div key={log.id} className="relative pl-5">
                      {!isLast && <div className="absolute left-[7px] top-5 bottom-[-20px] w-[1.5px] bg-slate-100"></div>}
                      <div className={`absolute left-0 top-1 w-[16px] h-[16px] rounded-full border-[2.5px] border-white flex items-center justify-center ${dotColor}`}></div>
                      <div className="space-y-0.5">
                        <p className="text-[13px] font-bold text-slate-800 break-words">{log.action_type} - {log.entity_type}</p>
                        <div className="flex justify-between items-center text-[11px] font-medium text-slate-400 mt-1">
                          <span className="truncate pr-2">{log.user_name || 'System'}</span>
                          <span className="whitespace-nowrap flex-shrink-0">
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
