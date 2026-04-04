"use client";

import React, { useState } from "react";
import { Search, Filter, ChevronRight, MoreVertical, ShieldCheck, Clock, UserCheck, UserX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface ProviderListProps {
  providers: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filters: any;
  onFilterChange: (filters: any) => void;
  loading: boolean;
}

export function ProviderList({ 
  providers, 
  selectedId, 
  onSelect, 
  filters, 
  onFilterChange, 
  loading 
}: ProviderListProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header & Search */}
      <div className="p-5 border-b border-slate-100 space-y-4 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Workforce Registry</h3>
          <Badge variant="outline" className="h-6 rounded-lg bg-blue-50 text-blue-600 border-blue-100 font-bold">
            {providers.length} Staff
          </Badge>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input 
            placeholder="Search clinician..." 
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-10 h-10 border-slate-100 rounded-xl bg-slate-50 focus:bg-white text-sm font-semibold transition-all"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading && (
            <div className="p-8 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mx-auto" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hydrating Clinical Registry...</p>
            </div>
          )}

          {!loading && providers.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-sm font-bold text-slate-400">No providers found</p>
            </div>
          )}

          {providers.map((p) => {
            const isSelected = selectedId === p.id;
            const statusColor = p.status === "available" ? "bg-emerald-500" : p.status === "on_leave" ? "bg-amber-500" : "bg-slate-400";
            
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                className={`
                  w-full text-left p-3 rounded-2xl transition-all duration-300 group relative
                  ${isSelected ? "bg-blue-600 text-white shadow-xl shadow-blue-100/50 scale-[1.02]" : "hover:bg-slate-50 text-slate-700"}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center">
                       {/* Placeholder for real clinical avatar */}
                       <span className={`text-xs font-black ${isSelected ? "text-blue-200" : "text-slate-400"}`}>
                         {p.user?.name?.substring(0, 2).toUpperCase() || "DR"}
                       </span>
                    </div>
                    {/* Status Dot */}
                    <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 ${isSelected ? "border-blue-600 " : "border-white"} ${statusColor}`} />
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-1.5 truncate">
                      <p className={`text-[13px] font-black truncate ${isSelected ? "text-white" : "text-slate-800"}`}>
                        {p.user?.name}
                      </p>
                      {p.emergency_enabled && (
                        <ShieldCheck className={`w-3 h-3 ${isSelected ? "text-blue-300" : "text-rose-500"}`} />
                      )}
                    </div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider truncate mb-1 ${isSelected ? "text-blue-200" : "text-slate-400"}`}>
                      {p.specialization?.name || "General Practice"}
                    </p>
                    
                    {/* Capacity Indicator - Lazy loaded/Simulated for list view context */}
                    <div className={`h-1 rounded-full w-full max-w-[80px] overflow-hidden ${isSelected ? "bg-blue-800/50" : "bg-slate-100"}`}>
                       <div className="h-full bg-blue-400 rounded-full w-[65%]" />
                    </div>
                  </div>
                  
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-all ${isSelected ? "text-white translate-x-1" : "text-slate-300 opacity-0 group-hover:opacity-100"}`} />
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
