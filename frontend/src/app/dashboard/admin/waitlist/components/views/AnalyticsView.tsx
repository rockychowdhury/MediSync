import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie
} from "recharts";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";

const COLORS = ["#3b82f6", "#10b981", "#64748b", "#f59e0b", "#ef4444", "#8b5cf6"];

export function AnalyticsView({ data }: { data: any }) {
  if (!data) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
       <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
       <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Synthesizing Metrics...</div>
    </div>
  );

  const outcomesData = [
    { name: 'Assigned', value: data.summary?.assigned || 0, color: '#10b981' },
    { name: 'Cancelled', value: data.summary?.cancelled || 0, color: '#64748b' },
    { name: 'Expired', value: data.summary?.expired || 0, color: '#ef4444' },
  ].filter(o => o.value > 0);

  return (
    <div className="flex-1 overflow-y-auto hidden-scrollbar pb-20 pr-2">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Summary Stats Cards */}
          <DashboardCard className="p-8 bg-blue-600 text-white border-none shadow-xl shadow-blue-500/20">
             <h4 className="text-[11px] font-black uppercase tracking-widest opacity-60 mb-2">Total Registrations</h4>
             <div className="text-4xl font-black">{data.summary?.total_added || 0}</div>
             <p className="text-[10px] font-bold mt-4 opacity-80 uppercase tracking-widest">Selected Period</p>
          </DashboardCard>
          
          <DashboardCard className="p-8">
             <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Conversion Rate</h4>
             <div className="text-4xl font-black text-slate-800">{data.summary?.conversion_rate || 0}%</div>
             <p className="text-[10px] font-black text-emerald-600 mt-4 uppercase tracking-widest bg-emerald-50 inline-block px-2 py-1 rounded-lg">Waitlist to Appt</p>
          </DashboardCard>

          <DashboardCard className="p-8">
             <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Auto-Promotion</h4>
             <div className="text-4xl font-black text-slate-800">{data.summary?.auto_assigned || 0}</div>
             <p className="text-[10px] font-black text-blue-600 mt-4 uppercase tracking-widest bg-blue-50 inline-block px-2 py-1 rounded-lg">System Managed</p>
          </DashboardCard>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Outcome Distribution - Pie Chart */}
          <DashboardCard className="p-8 lg:col-span-1">
             <h4 className="text-[14px] font-black uppercase tracking-widest text-slate-800 mb-8 border-b border-slate-50 pb-4">Outcome Distribution</h4>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                        data={outcomesData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                         {outcomesData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      />
                   </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="flex justify-center gap-6 mt-4">
                {outcomesData.map(o => (
                  <div key={o.name} className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: o.color }} />
                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{o.name}</span>
                  </div>
                ))}
             </div>
          </DashboardCard>

          {/* Volume by Service */}
          <DashboardCard className="p-8 lg:col-span-1">
             <h4 className="text-[14px] font-black uppercase tracking-widest text-slate-800 mb-8 border-b border-slate-50 pb-4">Volume by Service</h4>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={data.by_service || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="service_name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#3b82f6">
                         {(data.by_service || []).map((entry: any, index: number) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </DashboardCard>

          {/* Volume by Priority */}
          <DashboardCard className="p-8 lg:col-span-2">
             <h4 className="text-[14px] font-black uppercase tracking-widest text-slate-800 mb-8 border-b border-slate-50 pb-4">Volume by Priority</h4>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={data.by_priority || []} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="priority" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40}>
                         {(data.by_priority || []).map((entry: any, index: number) => (
                           <Cell 
                             key={`cell-${index}`} 
                             fill={entry.priority === 'emergency' ? '#ef4444' : entry.priority === 'urgent' ? '#f59e0b' : '#3b82f6'} 
                           />
                         ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </DashboardCard>
       </div>
    </div>
  );
}
