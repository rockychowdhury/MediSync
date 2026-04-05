"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function ChartSkeleton() {
  return (
    <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm flex flex-col h-full min-h-[350px] animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-100 rounded-md" />
          <div className="h-3 w-48 bg-slate-50 rounded-md" />
        </div>
      </div>
      <div className="flex-1 w-full bg-slate-50/50 rounded-2xl flex items-end justify-around p-4 gap-2">
        {[40, 70, 45, 90, 65, 30].map((h, i) => (
          <div 
            key={i} 
            className="w-full bg-slate-100 rounded-t-lg" 
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}
