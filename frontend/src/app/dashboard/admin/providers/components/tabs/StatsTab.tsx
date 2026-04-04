"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { providersApi } from "@/lib/api/providers";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StatsTabProps {
  provider: any;
}

export function StatsTab({ provider }: StatsTabProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("monthly");

  useEffect(() => {
    const fetchStats = async () => {
      if (!provider?.id) return;
      setLoading(true);
      try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const res = await providersApi.getProviderStats(
          provider.id, 
          thirtyDaysAgo.toISOString().split('T')[0], 
          now.toISOString().split('T')[0]
        );
        if (res.success) setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch clinical stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [provider?.id]);

  if (loading && !stats) return (
     <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hydrating Performance Data...</p>
     </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Performance Analytics</h3>
          <p className="text-sm text-slate-500">Clinical throughput, appointment completion, and patient retention metrics.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-10 px-5 rounded-xl border-slate-200 font-bold text-[11px] uppercase tracking-wider text-slate-600">
             <Calendar className="w-4 h-4 mr-2" />
             Last 30 Days
             <ChevronDown className="w-4 h-4 ml-2" />
           </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-8 space-y-8 max-w-6xl">
           {/* KPI Cards */}
           <div className="grid grid-cols-4 gap-6">
              {[
                { label: "Completed", value: stats?.totals?.completed || 0, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
                { label: "Cancelled", value: stats?.totals?.cancelled || 0, icon: XCircle, color: "text-rose-500", bg: "bg-rose-50" },
                { label: "No-Show", value: stats?.totals?.no_show || 0, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
                { label: "Dur. (Avg)", value: `${stats?.averages?.appointment_duration_minutes || 0}m`, icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
              ].map((kpi, i) => (
                <Card key={i} className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                  <CardContent className="p-6">
                     <div className="flex items-center gap-3 mb-3">
                        <div className={`w-8 h-8 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                           <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                        </div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</h3>
                     </div>
                     <p className="text-2xl font-black text-slate-800 tracking-tighter">{kpi.value}</p>
                  </CardContent>
                </Card>
              ))}
           </div>

           {/* Chart Section */}
           <div className="grid grid-cols-2 gap-8">
              <Card className="rounded-[40px] border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
                 <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Appointment Volume</CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 pt-0">
                    <div className="h-[250px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={stats?.daily_volumes || []}>
                             <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                   <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                             <XAxis dataKey="date" hide />
                             <YAxis hide />
                             <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontSize: '12px' }}
                             />
                             <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </CardContent>
              </Card>

              <Card className="rounded-[40px] border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
                 <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Performance Ratios</CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 pt-0">
                    <div className="h-[250px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: 'Completed', value: stats?.totals?.completed || 0 },
                            { name: 'Canceled', value: stats?.totals?.cancelled || 0 },
                            { name: 'No-Show', value: stats?.totals?.no_show || 0 },
                          ]}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} dy={10} />
                             <YAxis hide />
                             <Tooltip 
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontSize: '12px' }}
                             />
                             <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </CardContent>
              </Card>
           </div>

           {/* Metrics Grid */}
           <div className="grid grid-cols-3 gap-8 pt-4">
              <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col justify-between">
                 <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">No-Show Potential</h4>
                    <p className="text-3xl font-black text-rose-600 tracking-tighter">{stats?.rates?.no_show_percent || 0}%</p>
                 </div>
                 <p className="text-[11px] font-medium text-slate-400 leading-relaxed mt-4 italic">
                    * Calculated based on clinical attendance history.
                 </p>
              </div>

              <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col justify-between">
                 <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Working Days</h4>
                    <p className="text-3xl font-black text-slate-800 tracking-tighter">{stats?.working_days || 0} <span className="text-lg text-slate-400">Total</span></p>
                 </div>
                 <p className="text-[11px] font-medium text-slate-400 leading-relaxed mt-4 italic">
                    * Active clinic days in current period.
                 </p>
              </div>

              <div className="p-8 bg-blue-600 rounded-3xl border border-blue-500 shadow-xl shadow-blue-100 flex flex-col justify-between text-white">
                 <div>
                    <h4 className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2">Utilisation Rate</h4>
                    <p className="text-3xl font-black tracking-tighter">78.5%</p>
                 </div>
                 <div className="flex items-center gap-2 mt-4">
                    <TrendingUp className="w-4 h-4 text-blue-200" />
                    <p className="text-[11px] font-bold uppercase tracking-widest">+5.2% vs Prev.</p>
                 </div>
              </div>
           </div>
        </div>
      </ScrollArea>
    </div>
  );
}
