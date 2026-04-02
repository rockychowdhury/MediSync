"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { servicesApi } from "@/lib/api/services";
import { appointmentsApi } from "@/lib/api/appointments";
import { useWebSocket } from "@/hooks/useWebSocket";
import { toast } from "sonner";
import {
  Loader2,
  Clock,
  User,
  AlertCircle,
  ChevronUp,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function AdminWaitlistPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      const res = await servicesApi.getServices();
      if (res.success) {
        const list = res.data || [];
        setServices(list);
        if (list.length > 0 && !selectedServiceId) {
          setSelectedServiceId(list[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch services", err);
    }
  }, [selectedServiceId]);

  const fetchWaitlist = useCallback(async () => {
    if (!selectedServiceId) return;
    setLoading(true);
    try {
      const res = await appointmentsApi.getWaitlist();
      if (res.success) {
        // Filter client-side by service since the API requires service_id query param
        setWaitlist(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch waitlist", err);
      toast.error("Failed to load waitlist");
    } finally {
      setLoading(false);
    }
  }, [selectedServiceId]);

  useEffect(() => {
    if (isAuthenticated) fetchServices();
  }, [isAuthenticated, fetchServices]);

  useEffect(() => {
    if (isAuthenticated && selectedServiceId) fetchWaitlist();
  }, [isAuthenticated, selectedServiceId, fetchWaitlist]);

  useWebSocket({
    channel: "dashboard:admin",
    enabled: isAuthenticated,
    onMessage: (event) => {
      if (event.event === "waitlist_created" || event.event === "waitlist_removed") {
        fetchWaitlist();
      }
    },
  });

  const handleRemove = async (id: string) => {
    setRemoving(id);
    try {
      const res = await fetch(`/api/v1/waitlist/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Patient removed from waitlist");
        fetchWaitlist();
      }
    } catch (err) {
      toast.error("Failed to remove from waitlist");
    } finally {
      setRemoving(null);
    }
  };

  const priorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent": return "bg-red-50 text-red-700 border-red-100";
      case "high": return "bg-orange-50 text-orange-700 border-orange-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 pb-4">
      <div className="shrink-0 mb-4">
        <PageHeader
          breadcrumbs={["Home", "Admin", "Waitlist"]}
          title="Live Waitlist Queue"
          actionContent={
            <div className="flex items-center space-x-2 text-[11px] font-black text-amber-600 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100 shadow-sm">
              <span className="relative flex h-2.5 w-2.5 mr-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              LIVE QUEUE
            </div>
          }
        />
      </div>

      {/* Service Selector */}
      <div className="shrink-0 mb-4 flex items-center gap-4">
        <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Filter by Service:</div>
        <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
          <SelectTrigger className="w-64 h-10 rounded-xl border-slate-200 font-bold text-sm text-slate-700 bg-white shadow-sm">
            <SelectValue placeholder="Select a service..." />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-2xl">
            {services.map(s => (
              <SelectItem key={s.id} value={s.id} className="font-bold text-sm">{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          onClick={fetchWaitlist}
          disabled={loading}
          className="h-10 w-10 p-0 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <DashboardCard className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="font-black text-slate-800 text-[14px] uppercase tracking-widest">Queue</h3>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {waitlist.length} Pending
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto hidden-scrollbar">
          {loading && waitlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Loading Queue...</span>
            </div>
          ) : waitlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">No patients in queue</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Requested Date</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {waitlist.map((entry, idx) => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[13px] border border-blue-100">
                        {idx + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-xs uppercase">
                          {entry.patient?.name?.[0] || "P"}
                        </div>
                        <div>
                          <div className="font-black text-slate-800 text-[13px]">
                            {entry.patient?.name || entry.patient?.full_name || "Patient"}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            #{entry.patient_id?.slice(-6).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700 text-[13px]">
                        {entry.service?.name || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`rounded-xl py-1 px-3 text-[10px] font-black uppercase tracking-widest border ${priorityColor(entry.priority)}`}>
                        {entry.priority || "standard"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[12px] font-semibold text-slate-600">
                        {entry.requested_date ? new Date(entry.requested_date).toLocaleDateString() : "Any"}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <span className="text-[12px] text-slate-500 truncate block">{entry.notes || "—"}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={removing === entry.id}
                        onClick={() => handleRemove(entry.id)}
                        className="h-9 w-9 p-0 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 opacity-0 group-hover:opacity-100"
                      >
                        {removing === entry.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DashboardCard>
    </div>
  );
}
