"use client";

import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { cn } from "@/lib/utils";

interface AppointmentFlowChartProps {
  data: {
    scheduled: number;
    checked_in: number;
    in_progress: number;
    completed: number;
    total_today: number;
    progress_percent: number;
  };
}

export function AppointmentFlowChart({ data }: AppointmentFlowChartProps) {
  const chartData = [
    { name: "Scheduled", value: data.scheduled, color: "#6366f1" },
    { name: "Checked In", value: data.checked_in, color: "#8b5cf6" },
    { name: "In Progress", value: data.in_progress, color: "#f59e0b" },
    { name: "Completed", value: data.completed, color: "#10b981" },
  ];

  return (
    <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-col h-full min-h-[320px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">Appointment Flow</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Daily operational progress</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-slate-900">{data.progress_percent}%</span>
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">of targets met</p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                padding: '12px'
              }}
              labelStyle={{ fontWeight: 900, fontSize: '12px', marginBottom: '4px', color: '#1e293b' }}
              itemStyle={{ fontWeight: 700, fontSize: '11px' }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-50">
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-1000 ease-out" 
            style={{ width: `${data.progress_percent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>Daily Start</span>
          <span>Target Met</span>
        </div>
      </div>
    </div>
  );
}
