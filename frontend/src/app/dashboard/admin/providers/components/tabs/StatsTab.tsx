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
      <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/20">
        <div>
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-0.5">Clinical Audit</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Throughput performance and scheduled outcomes</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="h-8 px-3 rounded-lg border-slate-200 font-black text-[9px] uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-all cursor-pointer bg-white">
             <Calendar className="w-3 h-3 mr-1.5" />
             Last 30 Days
             <ChevronDown className="w-3 h-3 ml-1.5" />
           </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 bg-white">
        <div className="p-5 space-y-6 max-w-6xl">
           {/* KPI Cards */}
           <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Completed", value: stats?.totals?.completed || 0, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
                { label: "Cancelled", value: stats?.totals?.cancelled || 0, icon: XCircle, color: "text-rose-500", bg: "bg-rose-50" },
                { label: "No-Show", value: stats?.totals?.no_show || 0, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
                { label: "Load (Avg)", value: `${stats?.averages?.appointment_duration_minutes || 0}m`, icon: Clock, color: "text-indigo-500", bg: "bg-indigo-50" },
              ].map((kpi, i) => (
                <Card key={i} className="rounded-2xl border-slate-100 shadow-sm overflow-hidden bg-slate-50/30">
                  <CardContent className="p-4">
                     <div className="flex items-center gap-2 mb-2">
                        <div className={`w-7 h-7 rounded-lg ${kpi.bg} flex items-center justify-center shrink-0`}>
                           <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                        </div>
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</h3>
                     </div>
                     <p className="text-xl font-black text-slate-800 tracking-tighter">{kpi.value}</p>
                  </CardContent>
                </Card>
              ))}
           </div>

           {/* Chart Section */}
           <div className="grid grid-cols-2 gap-4">
              <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden bg-white">
                 <CardHeader className="p-5 pb-2">
                    <CardTitle className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Appointment Flux</CardTitle>
                 </CardHeader>
                 <CardContent className="p-5 pt-0">
                    <div className="h-[180px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={stats?.daily_volumes || []}>
                             <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                   <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                             <XAxis dataKey="date" hide />
                             <YAxis hide />
                             <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontSize: '10px' }}
                             />
                             <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </CardContent>
              </Card>

              <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden bg-white">
                 <CardHeader className="p-5 pb-2">
                    <CardTitle className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Institutional Ratios</CardTitle>
                 </CardHeader>
                 <CardContent className="p-5 pt-0">
                    <div className="h-[180px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: 'Completed', value: stats?.totals?.completed || 0 },
                            { name: 'Canceled', value: stats?.totals?.cancelled || 0 },
                            { name: 'No-Show', value: stats?.totals?.no_show || 0 },
                          ]}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }} dy={10} />
                             <YAxis hide />
                             <Tooltip 
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontSize: '10px' }}
                             />
                             <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </CardContent>
              </Card>
           </div>

           {/* Metrics Grid */}
           <div className="grid grid-cols-3 gap-4">
              <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                 <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Attrition Index</h4>
                 <p className="text-2xl font-black text-rose-600 tracking-tighter">{stats?.rates?.no_show_percent || 0}%</p>
                 <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-wide">* Historical Nullity Rate</p>
              </div>

              <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                 <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Clinic Blocks</h4>
                 <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats?.working_days || 0} <span className="text-sm text-slate-400">Days</span></p>
                 <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-wide">* Period Rotation Count</p>
              </div>

              <div className="p-5 bg-indigo-600 rounded-2xl border border-indigo-500 shadow-md shadow-indigo-100 text-white">
                 <h4 className="text-[9px] font-black text-indigo-100 uppercase tracking-widest mb-1">Utilisation Rate</h4>
                 <p className="text-2xl font-black tracking-tighter">78.5%</p>
                 <div className="flex items-center gap-1.5 mt-2">
                    <TrendingUp className="w-3 h-3 text-indigo-100" />
                    <p className="text-[9px] font-black uppercase tracking-widest">+5.2% Vol.</p>
                 </div>
              </div>
           </div>
        </div>
      </ScrollArea>
    </div>
  );
}
