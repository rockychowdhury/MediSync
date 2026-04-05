"use client";

import React from "react";
import { format } from "date-fns";
import { Wifi, WifiOff } from "lucide-react";

interface DashboardHeaderProps {
  userName: string;
  isLive: boolean;
}

export function DashboardHeader({ userName, isLive }: DashboardHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {getGreeting()}, {userName} 👋
        </h1>
        <p className="text-slate-500 font-bold text-sm mt-1">
          Here's what's happening at MediSync today.
        </p>
      </div>

      <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-slate-100 shadow-sm self-start md:self-auto">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            {isLive ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-300"></span>
            )}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${isLive ? 'text-emerald-600' : 'text-slate-400'}`}>
            {isLive ? 'Live Connection' : 'Reconnecting...'}
          </span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">
          {format(new Date(), "EEE, d MMMM yyyy")}
        </span>
      </div>
    </div>
  );
}
