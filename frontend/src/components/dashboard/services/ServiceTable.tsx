"use client";

import React, { useState } from "react";
import { 
  MoreVertical, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Clock,
  DollarSign,
  Tag,
  Filter,
  Briefcase
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { servicesApi } from "@/lib/api/services";


interface ServiceTableProps {
  services: any[];
  categories: string[];
  onUpdate: () => void;
}

export function ServiceTable({
  services,
  categories,
  onUpdate,
}: ServiceTableProps) {
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredServices = categoryFilter === "all" 
    ? services 
    : services.filter(s => s.category === categoryFilter);

  const toggleStatus = async (service: any) => {
    try {
      const res = await servicesApi.updateService(service.id, { is_active: !service.is_active });
      if (res.success) onUpdate();
    } catch (error) {
      console.error("Failed to toggle service status", error);
    }
  };

  return (
    <DashboardCard className="p-0 overflow-hidden border-slate-200 shadow-sm rounded-3xl flex flex-col min-h-[500px]">
      <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">
               <Briefcase className="w-4 h-4" />
            </div>
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none">Clinical Catalog Ledger</h3>
         </div>
         
         <div className="flex items-center gap-3">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
               <SelectTrigger className="w-[180px] h-9 rounded-xl border-slate-200 bg-white font-bold text-[10px] uppercase tracking-widest text-slate-600">
                  <SelectValue placeholder="All Categories" />
               </SelectTrigger>
               <SelectContent className="rounded-xl border-slate-200 shadow-2xl">
                  <SelectItem value="all" className="font-bold text-[10px] uppercase tracking-widest">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat} className="font-bold text-[10px] uppercase tracking-widest">{cat}</SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/30 border-b border-slate-100">
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Procedure Identity</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Protocol</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Yield</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Credential Status</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Interactive Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {filteredServices.map((svc) => (
              <tr key={svc.id} className="hover:bg-slate-50/80 transition-all duration-300 group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-black text-slate-800 tracking-tight block leading-tight">{svc.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center">
                      <Tag className="w-3 h-3 mr-1.5 text-blue-400" />
                      {svc.category}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center text-slate-600 font-bold text-xs gap-2">
                       <Clock className="w-3.5 h-3.5 text-slate-300" />
                       {svc.duration_minutes}m Duration
                    </div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                       +{svc.buffer_minutes}m Transition Time
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center text-blue-600 font-black text-xs gap-1.5">
                      <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                         <DollarSign className="w-3.5 h-3.5" />
                      </div>
                      ${svc.base_fee}
                   </div>
                </td>
                <td className="px-6 py-4">
                   <Badge 
                    variant="outline" 
                    className={`rounded-xl py-1 px-3 text-[9px] font-black uppercase tracking-widest border transition-all ${svc.is_active ? "bg-green-50 text-green-700 border-green-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}
                   >
                     {svc.is_active ? "Operational" : "Decommissioned"}
                   </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 pr-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Button 
                      variant="ghost" 
                      onClick={() => toggleStatus(svc)}
                      className={`h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${svc.is_active ? "text-red-500 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}
                    >
                      {svc.is_active ? <XCircle className="w-3.5 h-3.5 mr-2" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-2" />}
                      {svc.is_active ? "Deactivate" : "Reinstate"}
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="h-9 w-9 p-0 text-slate-300 hover:text-slate-600 rounded-xl"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredServices.length === 0 && (
               <tr>
                <td colSpan={5} className="py-24 text-center text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] leading-relaxed italic">
                   No Clinical Services Registered in Catalog
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
