"use client";

import React from "react";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  User, 
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";

interface AppointmentListViewProps {
  appointments: any[];
  loading: boolean;
  pagination: {
    total: number;
    skip: number;
    limit: number;
  };
  onPageChange: (newSkip: number) => void;
  onAction: (id: string, action: string) => void;
  onViewDetails: (id: string) => void;
}

export function AppointmentListView({
  appointments,
  loading,
  pagination,
  onPageChange,
  onAction,
  onViewDetails,
}: AppointmentListViewProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled": return "bg-blue-50 text-blue-700 border-blue-100";
      case "checked-in": return "bg-amber-50 text-amber-700 border-amber-100";
      case "in-progress": return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "completed": return "bg-green-50 text-green-700 border-green-100";
      case "cancelled": return "bg-red-50 text-red-700 border-red-100";
      case "no-show": return "bg-slate-50 text-slate-700 border-slate-100";
      default: return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 bg-white border border-slate-200 rounded-3xl">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    );
  }

  const startRange = pagination.total === 0 ? 0 : pagination.skip + 1;
  const endRange = Math.min(pagination.skip + pagination.limit, pagination.total);

  return (
    <DashboardCard className="p-0 overflow-hidden border-slate-200 shadow-sm rounded-3xl flex flex-col">
      <div className="flex-1 overflow-x-auto min-h-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Provider</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Service</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Time</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {appointments.map((appt) => (
              <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase tracking-tighter">
                      {appt.patient?.full_name?.[0] || "P"}
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-slate-700">{appt.patient?.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-medium">{appt.appointment_number}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-[13px] text-slate-600 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {appt.provider?.user?.full_name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-[13px] text-slate-600 font-medium">{appt.service?.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <div className="text-[13px] font-bold text-slate-700">
                      {new Date(appt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {new Date(appt.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className={`rounded-lg py-1 px-2.5 text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(appt.status)}`}>
                    {appt.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onViewDetails(appt.id)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onAction(appt.id, "checked-in")}
                      disabled={appt.status === "checked-in" || appt.status === "completed" || appt.status === "cancelled"}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-30"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onAction(appt.id, "cancelled")}
                      disabled={appt.status === "completed" || appt.status === "cancelled"}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {appointments.length === 0 && !loading && (
               <tr>
                <td colSpan={6} className="py-20 text-center text-slate-400 font-medium text-sm">
                  No appointments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Showing <span className="text-blue-600">{startRange}</span> to <span className="text-blue-600">{endRange}</span> of <span className="text-slate-600">{pagination.total}</span> Results
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(0, pagination.skip - pagination.limit))}
            disabled={pagination.skip === 0 || loading}
            className="h-8 px-3 rounded-xl border-slate-200 text-slate-500 font-bold text-xs hover:bg-white active:scale-95 transition-all disabled:opacity-30"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.skip + pagination.limit)}
            disabled={pagination.skip + pagination.limit >= pagination.total || loading}
            className="h-8 px-3 rounded-xl border-slate-200 text-slate-500 font-bold text-xs hover:bg-white active:scale-95 transition-all disabled:opacity-30"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </DashboardCard>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
