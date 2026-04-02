"use client";

import React from "react";
import { 
  Eye, 
  Plus, 
  Mail, 
  Phone, 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MoreVertical 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";

interface PatientTableProps {
  patients: any[];
  loading: boolean;
  pagination: {
    total: number;
    skip: number;
    limit: number;
  };
  onPageChange: (newSkip: number) => void;
  onViewPatient: (id: string) => void;
  onBookAppointment: (patient: any) => void;
}

export function PatientTable({
  patients,
  loading,
  pagination,
  onPageChange,
  onViewPatient,
  onBookAppointment,
}: PatientTableProps) {
  const startRange = pagination.total === 0 ? 0 : pagination.skip + 1;
  const endRange = Math.min(pagination.skip + pagination.limit, pagination.total);

  if (loading && patients.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-white border border-slate-200 rounded-3xl animate-in fade-in duration-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Querying Records...</span>
      </div>
    );
  }

  return (
    <DashboardCard className="p-0 overflow-hidden border-slate-200 shadow-sm rounded-3xl flex flex-col min-h-[400px]">
      <div className="flex-1 overflow-x-auto min-h-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Patient Details</th>
              <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
              <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Demographics</th>
              <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Account Status</th>
              <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Interactive Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {patients.map((pat) => (
              <tr key={pat.id} className="hover:bg-slate-50/80 transition-all group duration-300">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs uppercase tracking-tighter shadow-inner ring-1 ring-blue-50 transition-all group-hover:scale-110">
                      {pat.name?.[0] || pat.full_name?.[0] || "P"}
                    </div>
                    <div>
                      <div className="text-[14px] font-black text-slate-800 tracking-tight">{pat.name || pat.full_name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">#{pat.id.slice(-8).toUpperCase()}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 space-y-1.5">
                   <div className="flex items-center gap-2 text-slate-600 font-semibold text-xs leading-none">
                     <Mail className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                     {pat.email || "—"}
                   </div>
                   <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs leading-none">
                     <Phone className="w-3.5 h-3.5 text-slate-300 group-hover:text-green-500 transition-colors" />
                     {pat.phone || "—"}
                   </div>
                </td>
                <td className="px-6 py-4">
                   <div className="flex flex-col">
                     <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                        {pat.date_of_birth ? new Date(pat.date_of_birth).toLocaleDateString() : "—"}
                     </div>
                     <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                        {pat.gender || "—"}
                     </div>
                   </div>
                </td>
                <td className="px-6 py-4">
                   <Badge 
                    variant="outline" 
                    className={`rounded-xl py-1 px-3 text-[10px] font-black uppercase tracking-widest border transition-all ${pat.is_active ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}`}
                   >
                     {pat.is_active ? "Verified Active" : "Suspended"}
                   </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pr-2">
                    <Button 
                      variant="ghost" 
                      onClick={() => onViewPatient(pat.id)}
                      className="h-9 px-4 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-blue-100/50 hover:shadow-lg transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 mr-2" />
                      View Profile
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => onBookAppointment(pat)}
                      className="h-9 w-9 p-0 text-green-600 hover:bg-green-50 border border-transparent hover:border-green-100 rounded-xl shadow-green-100/50 hover:shadow-lg transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {patients.length === 0 && !loading && (
               <tr>
                <td colSpan={5} className="py-24 text-center text-slate-400 font-bold text-xs uppercase tracking-[0.2em] leading-relaxed">
                   No Records Found in Clinical Database
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
          Ledger Entry {startRange} — {endRange} <span className="mx-2 text-slate-200">|</span> Total {pagination.total} Records
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => onPageChange(Math.max(0, pagination.skip - pagination.limit))}
            disabled={pagination.skip === 0 || loading}
            className="h-9 px-5 rounded-xl border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-white active:scale-95 transition-all shadow-sm hover:shadow-md disabled:opacity-20"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            Prior
          </Button>
          <Button
            variant="outline"
            onClick={() => onPageChange(pagination.skip + pagination.limit)}
            disabled={pagination.skip + pagination.limit >= pagination.total || loading}
            className="h-9 px-5 rounded-xl border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-white active:scale-95 transition-all shadow-sm hover:shadow-md disabled:opacity-20"
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
