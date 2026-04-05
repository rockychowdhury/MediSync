"use client";

import React, { useMemo } from "react";
import { 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  Cell 
} from "recharts";
import { cn } from "@/lib/utils";

interface HeatmapData {
  day_of_week: number;
  hour: number;
  count: number;
}

interface HourlyHeatmapProps {
  data: HeatmapData[];
}

export function HourlyHeatmap({ data }: HourlyHeatmapProps) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Recharts Scatter version of heatmap
  const chartData = useMemo(() => {
    return data.map(item => ({
      x: item.hour,
      y: item.day_of_week,
      z: item.count,
      name: `${days[item.day_of_week]} at ${item.hour}:00`
    }));
  }, [data]);

  const maxCount = useMemo(() => Math.max(...data.map(d => d.count), 1), [data]);

  const getColor = (count: number) => {
    const ratio = count / maxCount;
    if (ratio === 0) return "#f8fafc";
    if (ratio < 0.3) return "#dbeafe";
    if (ratio < 0.6) return "#60a5fa";
    return "#1d4ed8";
  };

  return (
    <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-col h-full min-h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">Hourly Heatmap</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Appointment density across week</p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -20 }}>
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Hour" 
              domain={[8, 20]} 
              ticks={[8, 10, 12, 14, 16, 18, 20]}
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
              label={{ value: 'Hour of Day', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Day" 
              domain={[-0.5, 6.5]} 
              ticks={[0, 1, 2, 3, 4, 5, 6]}
              tickFormatter={(val) => days[val]}
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
            />
            <ZAxis type="number" dataKey="z" range={[50, 400]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                padding: '12px'
              }}
              labelStyle={{ fontWeight: 900, fontSize: '11px', marginBottom: '4px', color: '#1e293b' }}
              itemStyle={{ fontWeight: 700, fontSize: '10px' }}
              formatter={(value: any, name: any) => [value, "Appts"]}
            />
            <Scatter name="Appointments" data={chartData}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.z)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-100" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Low</span>
        </div>
        <div className="flex items-center gap-1.5 text-blue-600">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <span className="text-[9px] font-black uppercase tracking-widest">Peak</span>
        </div>
      </div>
    </div>
  );
}
