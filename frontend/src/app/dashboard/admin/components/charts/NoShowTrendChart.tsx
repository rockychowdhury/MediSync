"use client";

import React, { useMemo } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface DailyTrend {
  date: string;
  total: number;
  no_show: number;
  cancelled: number;
  no_show_rate: number;
  cancellation_rate: number;
}

interface NoShowTrendChartProps {
  data: DailyTrend[];
  averages: {
    no_show_rate: number;
    cancellation_rate: number;
  };
}

export function NoShowTrendChart({ data, averages }: NoShowTrendChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      formattedDate: format(parseISO(item.date), "MMM d")
    }));
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-col h-full min-h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">Efficiency Trends</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">No-show vs. Cancellation rates</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <span className="text-lg font-black text-rose-600 leading-none">{averages.no_show_rate}%</span>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Avg No-Show</p>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-amber-600 leading-none">{averages.cancellation_rate}%</span>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Avg Cancel</p>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorNoShow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCancel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="formattedDate" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
              unit="%"
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                padding: '12px'
              }}
              labelStyle={{ fontWeight: 900, fontSize: '11px', marginBottom: '4px', color: '#1e293b' }}
              itemStyle={{ fontWeight: 700, fontSize: '10px' }}
            />
            <Area 
              type="monotone" 
              dataKey="no_show_rate" 
              stroke="#f43f5e" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorNoShow)" 
              name="No-Show %"
            />
            <Area 
              type="monotone" 
              dataKey="cancellation_rate" 
              stroke="#f59e0b" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorCancel)" 
              name="Cancel %"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
