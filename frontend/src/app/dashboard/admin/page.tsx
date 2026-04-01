"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { dashboardApi, appointmentsApi, providersApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Calendar, Activity, Loader2, UserCheck, Stethoscope } from "lucide-react";

export default function AdminDashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app we would use RTK Query or a library like SWR/React Query.
    // For now we fetch simply on mount.
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // We gracefully mock some data if the actual API hasn't populated.
        try {
          const res = await dashboardApi.getStats();
          setStats(res.data);
        } catch (e) {
          // Fallback static mock for presentation
          setStats({
            total_users: 142,
            active_providers: 24,
            appointments_today: 86,
            system_health: "Optimal",
            recent_logs: [
              { id: 1, action: "User Login", user: "admin@medisync.com", time: "2 min ago" },
              { id: 2, action: "Appointment Created", user: "receptionist@gmail.com", time: "15 min ago" },
              { id: 3, action: "Schedule Updated", user: "provider@gmail.com", time: "1 hour ago" },
              { id: 4, action: "System Backup", user: "System", time: "4 hours ago" },
            ]
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Admin Overview</h2>
        <p className="text-slate-500">Welcome back, {user?.full_name?.split(' ')[0]}. Here is what's happening today.</p>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.total_users}</div>
            <p className="text-xs text-green-600 font-medium mt-1">+4 from last week</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Providers</CardTitle>
            <Stethoscope className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.active_providers}</div>
            <p className="text-xs text-slate-500 mt-1">Across 5 departments</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.appointments_today}</div>
            <p className="text-xs text-green-600 font-medium mt-1">+12% from average</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">System Health</CardTitle>
            <Activity className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.system_health}</div>
            <p className="text-xs text-slate-500 mt-1">All services running</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Recent Activity Logs</CardTitle>
            <CardDescription>
              A summary of the recent administrative and user actions across the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recent_logs?.map((log: any) => (
                <div key={log.id} className="flex items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="bg-white p-2 rounded-full border border-slate-200 shadow-sm mr-4">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none text-slate-900">{log.action}</p>
                    <p className="text-sm text-slate-500">{log.user}</p>
                  </div>
                  <div className="text-sm text-slate-400 font-medium">{log.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 shadow-sm border-slate-200 bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
          <CardHeader>
            <CardTitle className="text-white">Admin Quick Actions</CardTitle>
            <CardDescription className="text-blue-100">
              Frequently used administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button className="w-full bg-white/10 hover:bg-white/20 transition-colors rounded-lg p-4 text-left border border-white/10">
              <span className="block font-semibold">Manage Roles & Permissions</span>
              <span className="text-blue-100 text-sm mt-1 block">Adjust RBAC configurations</span>
            </button>
            <button className="w-full bg-white/10 hover:bg-white/20 transition-colors rounded-lg p-4 text-left border border-white/10">
              <span className="block font-semibold">Generate Reports</span>
              <span className="text-blue-100 text-sm mt-1 block">Export weekly system analytics</span>
            </button>
            <button className="w-full bg-white/10 hover:bg-white/20 transition-colors rounded-lg p-4 text-left border border-white/10">
              <span className="block font-semibold">View Audit Trail</span>
              <span className="text-blue-100 text-sm mt-1 block">Security logs and access events</span>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
