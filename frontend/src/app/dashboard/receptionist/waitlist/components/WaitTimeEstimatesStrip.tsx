"use client";

import { Clock, Activity } from "lucide-react";

interface Estimate {
  service_id: string;
  service_name: string;
  estimated_minutes: number;
  queue_count: number;
}

interface WaitTimeEstimatesStripProps {
  estimates: Estimate[];
  isLoading: boolean;
}

export function WaitTimeEstimatesStrip({ estimates, isLoading }: WaitTimeEstimatesStripProps) {
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto hidden-scrollbar pb-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="min-w-[240px] h-[88px] bg-white rounded-[16px] border border-slate-100 p-4 animate-pulse flex flex-col justify-between">
            <div className="h-4 w-1/2 bg-slate-100 rounded" />
            <div className="flex justify-between">
              <div className="h-5 w-1/3 bg-slate-100 rounded" />
              <div className="h-5 w-1/4 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (estimates.length === 0) {
    return null; // Don't show the strip if nobody is waiting
  }

  return (
    <div className="flex gap-4 overflow-x-auto hidden-scrollbar pb-2">
      {estimates.map(est => {
        // Compute a rough visual "load" based on queue count
        // Assuming > 5 is high load for visual purposes
        const percentage = Math.min(100, (est.queue_count / 10) * 100);
        let barColor = "bg-emerald-500";
        if (est.queue_count > 5) barColor = "bg-amber-500";
        if (est.queue_count > 10) barColor = "bg-red-500";

        return (
          <div key={est.service_id} className="min-w-[240px] bg-white rounded-[16px] shadow-sm border border-slate-100 p-4 flex flex-col gap-3 shrink-0">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-slate-700 text-sm truncate pr-2">{est.service_name}</h4>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold shrink-0">
                {est.queue_count} waiting
              </span>
            </div>
            
            <div className="flex flex-col gap-2 mt-auto">
              <div className="flex items-center gap-1.5 text-sm font-black text-slate-900">
                <Clock className="w-4 h-4 text-amber-500" />
                ~{est.estimated_minutes} min wait
              </div>
              
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
