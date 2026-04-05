"use client";

import React, { useMemo } from "react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts";
import { cn } from "@/lib/utils";

interface ServiceDemand {
  service_id: string;
  service_name: string;
  count: number;
  percent: number;
}

interface ServiceDemandChartProps {
  data: ServiceDemand[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6"];

export function ServiceDemandChart({ data }: ServiceDemandChartProps) {
  const chartData = useMemo(() => {
    return data.map(item => ({
      name: item.service_name,
      value: item.count,
      percent: item.percent
    }));
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-col h-full min-h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">Service Demand</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Distribution of specialties</p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                padding: '12px'
              }}
              labelStyle={{ fontWeight: 900, fontSize: '11px', marginBottom: '4px', color: '#1e293b' }}
              itemStyle={{ fontWeight: 700, fontSize: '10px' }}
              formatter={(value: any, name: any, props: any) => [`${value} (${props.payload.percent}%)`, name]}
            />
            <Legend 
              verticalAlign="bottom" 
              align="center"
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
