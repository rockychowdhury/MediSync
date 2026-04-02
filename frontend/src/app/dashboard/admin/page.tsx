"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { DashboardCard, MetricCard } from "@/components/dashboard/ui/DashboardCard";
import { dashboardApi } from "@/lib/api";
import { Loader2, Users, Calendar, Activity, AlertCircle, ArrowRight, UserCheck, Shield } from "lucide-react";

export default function AdminDashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(true);

  // Fallback mock states mapped to dashboard.md specs
  const stats = {
    appointments_today: 142,
    waitlist_count: 5,
    no_show_rate: "4.2%",
    total_providers: 24,
    // Provider utilization mock
    providers: [
      { id: 1, name: "Dr. Sarah Jenkins", specialization: "Cardiology", booked: 7, max: 8 },
      { id: 2, name: "Dr. Marcus Chen", specialization: "General Practice", booked: 12, max: 12 },
      { id: 3, name: "Dr. Emily Taylor", specialization: "Pediatrics", booked: 4, max: 10 },
      { id: 4, name: "Dr. Robert Wilson", specialization: "Orthopedics", booked: 9, max: 10 },
    ],
    // Recent logs mock
    logs: [
      { id: 1, action: "Patient Checked In", actor: "Anna (Receptionist)", type: "update", time: "2m ago" },
      { id: 2, action: "Appointment Cancelled", actor: "System", type: "system", time: "15m ago" },
      { id: 3, action: "User Promoted to Provider", actor: "Admin", type: "create", time: "1h ago" },
      { id: 4, action: "Waitlist Assigned", actor: "Dr. Jenkins", type: "update", time: "2h ago" },
      { id: 5, action: "New Lead Created", actor: "Admin", type: "create", time: "3h ago" },
    ],
    // Waitlist mock
    waitlist: [
      { id: 1, name: "James Collins", service: "Annual Checkup", priority: "Standard", wait_time: "45 mins" },
      { id: 2, name: "Maria Garcia", service: "Urgent Consultation", priority: "Urgent", wait_time: "12 mins" },
      { id: 3, name: "David Kim", service: "Follow-up", priority: "Standard", wait_time: "1h 20m" },
    ]
  };

  useEffect(() => {
    // Artificial load to demonstrate UI states
    setTimeout(() => setLoading(false), 600);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      <PageHeader 
        breadcrumbs={["Home", "Admin", "Overview"]} 
        title={`Welcome back, ${user?.full_name?.split(' ')[0] || 'Admin'}`} 
      />

      {/* 4-Column KPI Stats matching UI Reference */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Total Appts Today" 
          value={stats.appointments_today} 
          trendText="12.5% from yesterday" 
          isPositive={true} 
        />
        <MetricCard 
          title="Current Waitlist Queue" 
          value={stats.waitlist_count} 
          trendText="Wait times normal" 
          isPositive={true} 
        />
        <MetricCard 
          title="Active Providers" 
          value={stats.total_providers} 
          trendText="2 on leave today" 
          isPositive={false} 
        />
        <MetricCard 
          title="No-Show Rate" 
          value={stats.no_show_rate} 
          trendText="0.4% from avg" 
          isPositive={true} 
        />
      </div>

      {/* Main Complex Grid */}
      <div className="grid gap-6 md:grid-cols-12 mt-4">
        
        {/* Left Column (Spans 8) */}
        <div className="md:col-span-8 flex flex-col gap-6">
          
          {/* Provider Utilization */}
          <DashboardCard>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-[17px] font-bold text-slate-900 tracking-tight">Provider Utilization</h3>
                <p className="text-[13px] font-medium text-slate-500">Live capacity metrics for today's schedule</p>
              </div>
              <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">View All</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats.providers.map(provider => {
                const percentage = (provider.booked / provider.max) * 100;
                let colorClass = "bg-green-500";
                if (percentage >= 100) colorClass = "bg-red-500";
                else if (percentage >= 75) colorClass = "bg-amber-400";
                
                return (
                  <div key={provider.id} className="p-4 rounded-xl border border-slate-100 bg-[#fafafa]">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-[14px] text-slate-800">{provider.name}</div>
                        <div className="text-[12px] font-semibold text-slate-500">{provider.specialization}</div>
                      </div>
                      <div className="text-[13px] font-bold text-slate-700 bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                        {provider.booked} / {provider.max}
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </DashboardCard>

          {/* Waitlist Snapshot */}
          <DashboardCard>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-[17px] font-bold text-slate-900 tracking-tight">Waitlist Snapshot</h3>
                <p className="text-[13px] font-medium text-slate-500">Top prioritized waiting patients</p>
              </div>
              <button className="text-sm border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                Manage Queue
              </button>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 font-semibold text-slate-500 uppercase tracking-wider">Patient Name</th>
                    <th className="text-left py-3 font-semibold text-slate-500 uppercase tracking-wider">Service</th>
                    <th className="text-left py-3 font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                    <th className="text-right py-3 font-semibold text-slate-500 uppercase tracking-wider">Waiting For</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.waitlist.map(entry => (
                    <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 font-bold text-slate-800">{entry.name}</td>
                      <td className="py-3.5 font-medium text-slate-600">{entry.service}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                          entry.priority === 'Urgent' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {entry.priority}
                        </span>
                      </td>
                      <td className="py-3.5 font-semibold text-slate-700 text-right">{entry.wait_time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>

        </div>

        {/* Right Column (Spans 4) */}
        <div className="md:col-span-4 flex flex-col gap-6">
          
          {/* Live Activity Feed */}
          <DashboardCard className="h-full">
            <h3 className="text-[17px] font-bold text-slate-900 tracking-tight mb-6">Activity Feed</h3>
            
            <div className="space-y-6">
              {stats.logs.map((log, index) => (
                <div key={log.id} className="relative pl-6">
                  {/* Timeline line */}
                  {index !== stats.logs.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-[-24px] w-px bg-slate-100"></div>
                  )}
                  {/* Timeline dot */}
                  <div className={`absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full border-[3px] border-white shadow-sm flex items-center justify-center ${
                    log.type === 'create' ? 'bg-green-500' :
                    log.type === 'system' ? 'bg-indigo-500' : 'bg-amber-500'
                  }`}></div>
                  
                  <div className="space-y-1">
                    <p className="text-[14px] font-bold text-slate-800 leading-tight">{log.action}</p>
                    <div className="flex justify-between items-center text-[12px] font-medium text-slate-500">
                      <span>{log.actor}</span>
                      <span>{log.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-8 py-2 text-sm font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-100">
              View Audit Log
            </button>
          </DashboardCard>

        </div>
      </div>
    </div>
  );
}
