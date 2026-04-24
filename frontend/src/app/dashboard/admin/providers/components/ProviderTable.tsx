"use client";

import React from "react";
import {
  Mail,
  Calendar,
  ShieldCheck,
  Eye,
  UserCheck,
  UserX,
  Stethoscope,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ProviderTableProps {
  providers: any[];
  loading: boolean;
  onSelectProvider: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

export function ProviderTable({
  providers,
  loading,
  onSelectProvider,
  onStatusChange,
}: ProviderTableProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "available":
        return { color: "bg-emerald-500", label: "Available", textColor: "text-emerald-600" };
      case "on_leave":
        return { color: "bg-amber-500", label: "On Leave", textColor: "text-amber-600" };
      case "busy":
        return { color: "bg-blue-500", label: "Busy", textColor: "text-blue-600" };
      default:
        return { color: "bg-slate-400", label: status || "Unknown", textColor: "text-slate-500" };
    }
  };

  return (
    <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-500">
      <div className="flex-1 overflow-y-auto [scrollbar-width:thin] scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md">
            <tr className="border-b border-slate-100 h-8">
              <th className="px-6 py-0 text-[8.5px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none">Clinical Staff</th>
              <th className="px-6 py-0 text-[8.5px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none">Specialization</th>
              <th className="px-6 py-0 text-[8.5px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none">Provider Status</th>
              <th className="px-6 py-0 text-[8.5px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none">Emergency</th>
              <th className="px-6 py-0 text-[8.5px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none">Enrollment</th>
              <th className="px-6 py-0 text-[8.5px] font-black text-slate-400 uppercase tracking-[0.1em] text-right leading-none">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {providers.map((p) => {
              const statusConfig = getStatusConfig(p.status);
              const isInactive = p.user?.is_active === false;

              return (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50/50 transition-all duration-300 group cursor-pointer"
                  onClick={() => onSelectProvider(p.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-indigo-500 flex items-center justify-center font-black text-[10px] uppercase border border-indigo-100 group-hover:scale-110 transition-transform duration-500">
                        {p.user?.name?.substring(0, 2).toUpperCase() || "DR"}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[12px] font-black text-slate-800 tracking-tight leading-none mb-1 group-hover:text-blue-600 transition-colors truncate">
                          {p.user?.name || "Unknown"}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center truncate">
                          <Mail className="w-2.5 h-2.5 mr-1 opacity-50" />
                          {p.user?.email || "—"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-2.5">
                    <Badge variant="outline" className="rounded-xl px-2 py-0.5 bg-white border-slate-100 text-slate-600 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                      <Stethoscope className="w-2.5 h-2.5 text-indigo-500" />
                      {p.specialization?.name || "General"}
                    </Badge>
                  </td>
                  <td className="px-6 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full shadow-lg", statusConfig.color, isInactive && "bg-red-400")} />
                      <span className={cn("text-[9px] font-black uppercase tracking-widest", isInactive ? "text-red-400" : statusConfig.textColor)}>
                        {isInactive ? "Inactive" : statusConfig.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-2.5">
                    {p.emergency_enabled ? (
                      <Badge className="rounded-xl px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Active
                      </Badge>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">—</span>
                    )}
                  </td>
                  <td className="px-6 py-2.5">
                    <div className="flex items-center text-slate-500 font-bold text-[10px] gap-2">
                      <Calendar className="w-3 h-3 text-slate-300" />
                      {p.created_at ? format(new Date(p.created_at), "MMM d, yyyy") : "—"}
                    </div>
                  </td>
                  <td className="px-6 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectProvider(p.id);
                              }}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 text-white border-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5">View Profile</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <div className="h-4 w-px bg-slate-100 mx-0.5" />

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-8 w-8 p-0 rounded-lg transition-all cursor-pointer",
                                p.status === "available"
                                  ? "text-slate-400 hover:text-orange-600 hover:bg-orange-50/50"
                                  : "text-green-500 hover:text-green-700 hover:bg-green-50"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(p.id, p.status === "available" ? "unavailable" : "available");
                              }}
                            >
                              {p.status === "available" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 text-white border-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5">
                            {p.status === "available" ? "Set Unavailable" : "Set Available"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </td>
                </tr>
              );
            })}
            {providers.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="py-32 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4 border border-dashed border-slate-200">
                    <Stethoscope className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">No Clinical Staff Detected in Registry</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-8 py-4 border-t border-slate-100 bg-slate-50/30 shrink-0">
        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {providers.length} Provider{providers.length !== 1 ? "s" : ""} in Registry
        </div>
      </div>
    </div>
  );
}
