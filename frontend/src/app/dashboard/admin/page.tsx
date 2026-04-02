"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { DashboardCard, MetricCard } from "@/components/dashboard/ui/DashboardCard";
import { Loader2 } from "lucide-react";

import { auditApi } from "@/lib/api";
import type { ActivityLog } from "@/types/audit";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const stats = {
    appointments_today: 142,
    waitlist_count: 5,
    no_show_rate: "4.2%",
    total_providers: 24,
    providers: [
      { id: 1, name: "Dr. Sarah Jenkins", specialization: "Cardiology", booked: 7, max: 8 },
      { id: 2, name: "Dr. Marcus Chen", specialization: "General Practice", booked: 12, max: 12 },
      { id: 3, name: "Dr. Emily Taylor", specialization: "Pediatrics", booked: 4, max: 10 },
      { id: 4, name: "Dr. Robert Wilson", specialization: "Orthopedics", booked: 9, max: 10 },
    ],
    waitlist: [
      { id: 1, name: "James Collins", service: "Checkup", priority: "Standard", wait: "45m" },
      { id: 2, name: "Maria Garcia", service: "Urgent", priority: "Urgent", wait: "12m" },
      { id: 3, name: "David Kim", service: "Follow-up", priority: "Standard", wait: "1h" },
    ]
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await auditApi.getLogs({ limit: 10 });
        if (res.success) {
          setLogs(res.data);
        }
      } catch (error: any) {
        if (error?.response?.status !== 401 && error?.response?.status !== 403) {
          console.error("Failed to fetch dashboard activity logs", error);
        }
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // True Real-Time WebSocket Streaming
  useWebSocket({
    channel: "dashboard:admin",
    enabled: isAuthenticated,
    onMessage: (event) => {
      if (event.event === "audit_log_created" && event.data) {
        setLogs((prev) => {
          // Prevent duplicates
          if (prev.some((log) => log.id === event.data?.id)) return prev;
          
          // Re-fetch dynamically to get relations (user_name etc) and trim to 10 automatically
          auditApi.getLogs({ limit: 10 }).then(res => {
             if (res.success) setLogs(res.data);
          });
          return prev;
        });
      }
    }
  });

  if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      
      <div className="shrink-0 mb-4">
        <PageHeader breadcrumbs={["Home", "Admin", "Overview"]} title={`Welcome back, ${user?.full_name?.split(' ')[0] || 'Admin'}`} />
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mt-2">
          <MetricCard title="Total Appts Today" value={stats.appointments_today} trendText="12.5% vs yday" isPositive={true} />
          <MetricCard title="Live Waitlist" value={stats.waitlist_count} trendText="Normal bounds" isPositive={true} />
          <MetricCard title="Active Providers" value={stats.total_providers} trendText="2 on leave" isPositive={false} />
          <MetricCard title="No-Show Rate" value={stats.no_show_rate} trendText="0.4% from avg" isPositive={true} />
        </div>
      </div>

      <div className="flex-1 min-h-0 grid gap-4 md:grid-cols-12 pb-2">
        
        {/* Left Column */}
        <div className="md:col-span-8 flex flex-col gap-4 min-h-0">
          
          {/* Provider Utilization Box constrained */}
          <DashboardCard className="flex-1 min-h-0 p-5 flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-[16px] font-bold text-slate-900">Provider Utilization</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto hidden-scrollbar pr-2 pb-2">
              {stats.providers.map(provider => {
                const percentage = (provider.booked / provider.max) * 100;
                const colorClass = percentage >= 100 ? "bg-red-500" : percentage >= 75 ? "bg-amber-400" : "bg-green-500";
                return (
                  <div key={provider.id} className="p-3 rounded-xl border border-slate-100 bg-[#fbfbfc]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-[13px] text-slate-800">{provider.name}</div>
                      </div>
                      <div className="text-[12px] font-bold text-slate-700">{provider.booked}/{provider.max}</div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                      <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </DashboardCard>

          {/* Waitlist Box constrained */}
          <DashboardCard className="flex-1 min-h-0 p-5 flex flex-col">
            <h3 className="text-[16px] font-bold text-slate-900 mb-3 shrink-0">Waitlist Snapshot</h3>
            <div className="flex-1 min-h-0 overflow-y-auto hidden-scrollbar">
              <table className="w-full text-[12px]">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="border-b border-slate-100">
                    <th className="text-left font-semibold text-slate-500 uppercase pb-2">Name</th>
                    <th className="text-left font-semibold text-slate-500 uppercase pb-2">Service</th>
                    <th className="text-right font-semibold text-slate-500 uppercase pb-2">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.waitlist.map(entry => (
                    <tr key={entry.id} className="border-b border-slate-50">
                      <td className="py-2.5 font-bold text-slate-800">{entry.name}</td>
                      <td className="py-2.5 font-medium text-slate-600 truncate max-w-[100px]">{entry.service}</td>
                      <td className="py-2.5 text-right"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${entry.priority === 'Urgent' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{entry.priority}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        </div>

        {/* Right Column */}
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
