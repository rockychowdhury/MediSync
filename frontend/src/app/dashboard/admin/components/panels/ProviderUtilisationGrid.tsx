"use client";

import React from "react";
import { Users, MoreHorizontal, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProviderUtilisation {
  id: string;
  name: string;
  specialization: string;
  status: string;
  booked_today: number;
  max_daily_appointments: number;
  utilisation_percent: number;
  remaining_slots: number;
}

interface ProviderUtilisationGridProps {
  providers: ProviderUtilisation[];
}

export function ProviderUtilisationGrid({ providers }: ProviderUtilisationGridProps) {
  return (
    <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-col h-full min-h-[400px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">Provider Utilisation</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Real-time capacity tracking</p>
        </div>
        <a 
          href="/dashboard/admin/providers" 
          className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
        >
          <MoreHorizontal size={18} />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 overflow-y-auto hidden-scrollbar pr-1">
        {providers.map((provider) => {
          const isOverloaded = provider.utilisation_percent > 90;
          const isBusy = provider.status === "busy";
          const isAvailable = provider.status === "available";

          return (
            <div 
              key={provider.id} 
              className={cn(
                "p-4 rounded-2xl border border-slate-50 transition-all hover:border-slate-200 group relative",
                isOverloaded ? "bg-rose-50/30" : "bg-slate-50/50"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0">
                  <h4 className="text-[13px] font-black text-slate-800 truncate pr-2 group-hover:text-blue-600 transition-colors">
                    {provider.name}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                    {provider.specialization}
                  </p>
                </div>
                <div className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                  isAvailable ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                  isBusy ? "bg-amber-50 text-amber-600 border-amber-100" :
                  "bg-slate-50 text-slate-500 border-slate-200"
                )}>
                  {provider.status}
                </div>
              </div>

              <div className="flex justify-between items-end mb-2">
                <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                  {provider.booked_today} / {provider.max_daily_appointments} Slots
                </span>
                <span className={cn(
                  "text-[12px] font-black tracking-tight",
                  isOverloaded ? "text-rose-600" : "text-slate-900"
                )}>
                  {provider.utilisation_percent}%
                </span>
              </div>

              <div className="w-full bg-slate-200/50 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-700 ease-out",
                    isOverloaded ? "bg-rose-500" :
                    provider.utilisation_percent > 70 ? "bg-amber-500" : "bg-blue-500"
                  )}
                  style={{ width: `${Math.min(100, provider.utilisation_percent)}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Remain: {provider.remaining_slots}</span>
                {isOverloaded && <AlertCircle size={12} className="text-rose-500 animate-pulse" />}
              </div>
            </div>
          );
        })}

        {providers.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
            <Users className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-[12px] font-black uppercase tracking-widest opacity-60">No providers active today</p>
          </div>
        )}
      </div>
    </div>
  );
}
