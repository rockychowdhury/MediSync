"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  X, 
  Eye, 
  User, 
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Calendar,
  Clock,
  AlertCircle,
  CheckSquare,
  Square,
  ShieldAlert,
  ArrowRightLeft,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppointmentActions } from "../../hooks/useAppointmentActions";
import { appointmentsApi } from "@/lib/api/appointments";
import { providersApi } from "@/lib/api/providers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO } from "date-fns";

interface ListViewProps {
  appointments: any[];
  loading: boolean;
  pagination: {
    total: number;
    skip: number;
    limit: number;
  };
  onPageChange: (newSkip: number) => void;
  onViewDetails: (id: string) => void;
  onAction: (id: string, action: string) => void;
  onBulkAction: (ids: string[], action: string) => void;
}

export function ListView({
  appointments,
  loading,
  pagination,
  onPageChange,
  onViewDetails,
  onAction,
  onBulkAction
}: ListViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedIds.length === appointments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(appointments.map(a => a.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev: string[]) => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getStatusConfig = (status: string) => {
    const configs: any = {
      scheduled: { label: "Scheduled", color: "text-blue-600", bg: "bg-blue-50/50", border: "border-blue-100" },
      checked_in: { label: "Checked In", color: "text-amber-600", bg: "bg-amber-50/50", border: "border-amber-100" },
      in_progress: { label: "In Progress", color: "text-indigo-600", bg: "bg-indigo-50/50", border: "border-indigo-100" },
      completed: { label: "Completed", color: "text-emerald-600", bg: "bg-emerald-50/50", border: "border-emerald-100" },
      cancelled: { label: "Cancelled", color: "text-rose-600", bg: "bg-rose-50/50", border: "border-rose-100" },
      no_show: { label: "No Show", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" },
    };
    return configs[status] || configs.scheduled;
  };

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case "emergency": return <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" title="Emergency" />;
      case "urgent": return <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" title="Urgent" />;
      default: return <div className="h-2 w-2 rounded-full bg-slate-300" title="Standard" />;
    }
  };

  const startRange = pagination.total === 0 ? 0 : pagination.skip + 1;
  const endRange = Math.min(pagination.skip + pagination.limit, pagination.total);

  return (
    <div className="relative flex flex-col h-full bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 px-6 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300">
           <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 border-r border-slate-700 pr-4 mr-2">
             {selectedIds.length} Selected
           </span>
           <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-[11px] font-bold text-white hover:bg-slate-800 rounded-xl gap-2"
                onClick={() => onBulkAction(selectedIds, "checked_in")}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                Check-In All
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-[11px] font-bold text-rose-400 hover:bg-rose-950/30 rounded-xl gap-2"
                onClick={() => onBulkAction(selectedIds, "cancelled")}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Cancel All
              </Button>
           </div>
           <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-lg text-slate-500 hover:text-white"
              onClick={() => setSelectedIds([])}
            >
              <X className="w-3.5 h-3.5" />
           </Button>
        </div>
      )}

      <div className="flex-1 overflow-x-auto overflow-y-auto no-scrollbar">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50/50 backdrop-blur-md">
              <th className="px-6 py-5 border-b border-slate-100">
                 <button onClick={toggleSelectAll} className="text-slate-400 hover:text-blue-600 transition-colors">
                   {selectedIds.length === appointments.length && appointments.length > 0 ? (
                     <CheckSquare className="w-4.5 h-4.5 text-blue-600" />
                   ) : (
                     <Square className="w-4.5 h-4.5" />
                   )}
                 </button>
              </th>
              <th className="px-6 py-5 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient Unit</th>
              <th className="px-6 py-5 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Medical Slot</th>
              <th className="px-6 py-5 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinician</th>
              <th className="px-6 py-5 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocol</th>
              <th className="px-6 py-5 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
              <th className="px-6 py-5 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right pr-10">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && appointments.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                   <td className="px-6 py-6"><div className="h-4 w-4 bg-slate-100 rounded" /></td>
                   <td className="px-6 py-6"><div className="h-10 w-40 bg-slate-50 rounded-2xl" /></td>
                   <td className="px-6 py-6"><div className="h-10 w-32 bg-slate-50 rounded-2xl" /></td>
                   <td className="px-6 py-6"><div className="h-10 w-32 bg-slate-50 rounded-2xl" /></td>
                   <td className="px-6 py-6"><div className="h-6 w-24 bg-slate-50 rounded-xl" /></td>
                   <td className="px-6 py-6"><div className="h-6 w-20 bg-slate-50 rounded-xl" /></td>
                   <td className="px-6 py-6"><div className="ml-auto h-8 w-8 bg-slate-50 rounded-xl" /></td>
                </tr>
              ))
            ) : appointments.map((appt) => {
              const statusCfg = getStatusConfig(appt.status);
              const isSelected = selectedIds.includes(appt.id);
              
              return (
                <tr 
                  key={appt.id} 
                  className={cn(
                    "hover:bg-blue-50/30 transition-all duration-300 group relative",
                    isSelected && "bg-blue-50/50"
                  )}
                >
                  <td className="px-6 py-5">
                    <button onClick={() => toggleSelect(appt.id)} className="transition-colors">
                       {isSelected ? (
                         <CheckSquare className="w-4.5 h-4.5 text-blue-600" />
                       ) : (
                         <Square className="w-4.5 h-4.5 text-slate-200 group-hover:text-slate-300" />
                       )}
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[13px] shadow-sm transform group-hover:rotate-6 transition-transform">
                          {appt.patient?.name?.[0] || "P"}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full border border-slate-200 ring-2 ring-white">
                           {getPriorityIndicator(appt.priority)}
                        </div>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <button 
                          onClick={() => onViewDetails(appt.id)}
                          className="text-[14px] font-bold text-slate-800 truncate hover:text-blue-600 transition-colors text-left"
                        >
                          {appt.patient?.name}
                        </button>
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tighter">
                          Unit {appt.appointment_number}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-[14px] font-black text-blue-600 mb-0.5">
                        <Clock className="w-3.5 h-3.5 opacity-50" />
                        {format(parseISO(appt.appointment_start), "hh:mm aa")}
                      </div>
                      <div className="text-[11px] font-medium text-slate-400">
                        {format(parseISO(appt.appointment_start), "MMM dd, yyyy")}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 group/prov pointer-events-none">
                       <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                          <User className="w-4 h-4" />
                       </div>
                       <div className="text-[13px] font-bold text-slate-600">{appt.provider?.user?.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant="outline" className="rounded-lg bg-slate-50 text-slate-500 border-slate-200 font-bold text-[10px] uppercase tracking-wider py-1 px-3">
                      {appt.service?.name}
                    </Badge>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant="outline" className={cn("rounded-lg font-bold text-[10px] uppercase tracking-wider py-1 px-3 shadow-sm", statusCfg.bg, statusCfg.color, statusCfg.border)}>
                      {statusCfg.label}
                    </Badge>
                  </td>
                  <td className="px-6 py-5 text-right pr-6">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onViewDetails(appt.id)}
                        className="h-10 w-10 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                       >
                        <Eye className="w-4.5 h-4.5" />
                       </Button>
                       <DropdownMenu>
                         <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-10 w-10 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl")}>
                            <MoreHorizontal className="w-4.5 h-4.5" />
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl shadow-xl border-slate-100">
                            <DropdownMenuItem onClick={() => onAction(appt.id, "checked_in")} className="rounded-lg py-2 h-10 font-bold text-slate-600 text-xs gap-2">
                               <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                               Mark Check-In
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAction(appt.id, "reschedule")} className="rounded-lg py-2 h-10 font-bold text-slate-600 text-xs gap-2">
                               <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                               Reschedule Unit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAction(appt.id, "cancelled")} className="rounded-lg py-2 h-10 font-bold text-rose-600 text-xs gap-2">
                               <Trash2 className="w-4 h-4" />
                               Terminate Unit
                            </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
            {appointments.length === 0 && !loading && (
               <tr>
                <td colSpan={7} className="py-32 text-center">
                   <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-700">
                      <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200">
                         <Calendar className="w-10 h-10" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-black text-slate-800 tracking-tight">Registry Empty</p>
                        <p className="text-xs text-slate-400 font-medium max-w-[200px] mx-auto leading-relaxed">
                          No clinical records match the current operational filter parameters.
                        </p>
                      </div>
                      <Button variant="outline" className="mt-2 rounded-xl text-[11px] font-bold h-9">
                        Clear All Filters
                      </Button>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="shrink-0 px-8 py-6 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Operational Metrics</div>
           <div className="text-[11px] font-bold text-slate-500">
             SHOWING <span className="text-blue-600">{startRange}-{endRange}</span> OF <span className="text-slate-800">{pagination.total}</span> REGISTRY UNITS
           </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(0, pagination.skip - pagination.limit))}
            disabled={pagination.skip === 0 || loading}
            className="h-10 px-4 rounded-xl border-slate-200 bg-white shadow-sm text-slate-600 font-bold text-[11px] hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-30 flex gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            BACK
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.skip + pagination.limit)}
            disabled={pagination.skip + pagination.limit >= pagination.total || loading}
            className="h-10 px-4 rounded-xl border-slate-200 bg-white shadow-sm text-slate-600 font-bold text-[11px] hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-30 flex gap-2"
          >
            NEXT
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
