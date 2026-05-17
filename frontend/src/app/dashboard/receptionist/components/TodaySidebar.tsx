"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { waitlistApi } from "@/lib/api/waitlist";
import { appointmentsApi } from "@/lib/api/appointments";
import { dashboardApi } from "@/lib/api/dashboard";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { CapacityBar } from "@/components/dashboard/receptionist/CapacityBar";
import { StatusBadge } from "@/components/dashboard/receptionist/StatusBadge";
import { PriorityBadge } from "@/components/dashboard/receptionist/PriorityBadge";

export function TodaySidebar() {
  const [waitlistEntries, setWaitlistEntries] = useState<any[]>([]);
  const [waitlistTotal, setWaitlistTotal] = useState(0);
  const [providers, setProviders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch top waitlist entries
        const waitlistRes = await waitlistApi.getWaitlist({ status: "waiting", page_size: 3 });
        if (waitlistRes.success) {
          setWaitlistEntries(waitlistRes.data);
          setWaitlistTotal(waitlistRes.meta.pagination.total);
        }

        // Fetch all providers capacities via the dashboard API client
        const utilRes = await dashboardApi.getProviderUtilisation().catch(() => null);
        if (utilRes?.success) {
          setProviders(utilRes.data.providers);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="w-72 flex-shrink-0 flex flex-col gap-4 animate-pulse">
        <div className="h-64 bg-slate-100 rounded-[20px]" />
        <div className="h-64 bg-slate-100 rounded-[20px]" />
      </div>
    );
  }

  return (
    <div className="w-72 flex-shrink-0 flex flex-col gap-4 hidden xl:flex">
      
      {/* Card 1: Waitlist Snapshot */}
      <DashboardCard className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Waiting Queue</h3>
          <span className="bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {waitlistTotal} Waiting
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {waitlistEntries.length > 0 ? (
            waitlistEntries.map(entry => (
              <div key={entry.id} className="text-sm p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col gap-1.5">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-slate-900 truncate pr-2">{entry.patient_name}</span>
                  <span className="font-black text-slate-400 text-[11px]">#{entry.queue_position}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 truncate">{entry.service_name}</span>
                  <PriorityBadge priority={entry.priority} />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-sm text-slate-400">Queue is empty</div>
          )}
        </div>

        <Link href="/dashboard/receptionist/waitlist" className="text-[12px] font-bold text-blue-600 text-center hover:underline pt-2 border-t border-slate-100">
          View Full Waitlist →
        </Link>
      </DashboardCard>

      {/* Card 2: Provider Status Grid */}
      <DashboardCard className="p-5 flex flex-col gap-4">
        <h3 className="font-bold text-slate-800">Provider Status</h3>
        
        <div className="flex flex-col gap-4">
          {providers.length > 0 ? (
            providers.map(p => (
              <div key={p.provider_id} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-700">{p.name.split(" ")[0]}</span>
                  <StatusBadge 
                    status={p.status === "available" ? "completed" : "no_show"} 
                    variant="appointment"
                    size="sm"
                  />
                </div>
                <CapacityBar current={p.current_load} max={p.max_capacity} showLabel={true} />
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-sm text-slate-400">No active providers</div>
          )}
        </div>
      </DashboardCard>

    </div>
  );
}
