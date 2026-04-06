"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit3, 
  Trash2, 
  Search, 
  Clock, 
  Stethoscope,
  Eye,
  Power,
  Info,
  Fingerprint
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Service } from "@/types/service";
import { cn } from "@/lib/utils";

interface ServicesTableProps {
  services: Service[];
  loading: boolean;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onStatusToggle?: (service: Service) => void;
  onView?: (service: Service) => void;
}

export function ServicesTable({ 
  services, 
  loading, 
  onEdit, 
  onDelete, 
  onStatusToggle, 
  onView 
}: ServicesTableProps) {
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-500">
      <div 
        ref={tableContainerRef}
        className="flex-1 overflow-x-hidden overflow-y-auto no-scrollbar relative rounded-t-[inherit]"
      >
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md">
            <tr className="border-b border-slate-100 h-10">
              <th className="px-3 py-0 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none w-[30%]">Service Identity</th>
              <th className="px-3 py-0 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none w-[15%]">Duration</th>
              <th className="px-3 py-0 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none w-[25%]">Categorization</th>
              <th className="px-3 py-0 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none text-center w-[15%]">Status</th>
              <th className="px-3 py-0 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right leading-none w-[15%]">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-slate-50/50 transition-all duration-300 group h-[56px]">
                <td className="px-3 py-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 text-slate-400 flex items-center justify-center font-black text-xs uppercase border border-slate-200 group-hover:scale-110 transition-transform duration-500 shrink-0">
                       <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                       <span className="text-[12px] font-black text-slate-800 tracking-tight leading-none mb-1.5 group-hover:text-indigo-600 transition-colors uppercase truncate">
                         {service.name}
                       </span>
                       <div className="flex items-center gap-1.5 min-w-0">
                          <Fingerprint className="w-2.5 h-2.5 text-slate-300" />
                          <code className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none truncate">
                            {service.id.slice(0, 8)}
                          </code>
                       </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-0">
                   <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-300" />
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest whitespace-nowrap">
                        {service.duration_minutes}m
                      </span>
                   </div>
                </td>
                <td className="px-3 py-0">
                   <div className="flex flex-col gap-1.5">
                    <Badge variant="outline" className="rounded-lg px-2 py-0.5 bg-white border-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit whitespace-nowrap truncate max-w-full">
                      {service.required_specialization?.name || "General Care"}
                    </Badge>
                  </div>
                </td>
                <td className="px-3 py-0">
                   <div className="flex items-center justify-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${service.is_active ? "bg-emerald-500 shadow-emerald-100" : "bg-slate-300"} shadow-lg animate-pulse`} />
                      <span className={`text-[8px] font-black uppercase tracking-widest ${service.is_active ? "text-emerald-700" : "text-slate-400"} whitespace-nowrap`}>
                        {service.is_active ? "OP" : "LKD"}
                      </span>
                   </div>
                </td>
                <td className="px-3 py-0 text-right">
                   <div className="flex items-center justify-end gap-1 focus-within:z-10 relative">
                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onView?.(service)}
                            className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white transition-all font-black text-xs"
                           >
                             <Eye className="w-3 h-3" />
                           </Button>
                         </TooltipTrigger>
                         <TooltipContent 
                           collisionBoundary={tableContainerRef.current || undefined}
                           className="bg-slate-900 text-white border-0 text-[10px] font-black uppercase tracking-widest px-3 py-1.5"
                         >
                           View Insight
                         </TooltipContent>
                       </Tooltip>
                     </TooltipProvider>

                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onEdit(service)}
                            className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-all"
                           >
                             <Edit3 className="w-3 h-3" />
                           </Button>
                         </TooltipTrigger>
                         <TooltipContent 
                          collisionBoundary={tableContainerRef.current || undefined}
                          className="bg-slate-900 text-white border-0 text-[10px] font-black uppercase tracking-widest px-3 py-1.5"
                         >
                           Modify Asset
                         </TooltipContent>
                       </Tooltip>
                     </TooltipProvider>

                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onStatusToggle?.(service)}
                            className={cn(
                              "h-7 w-7 p-0 rounded-lg transition-all",
                              service.is_active 
                                ? "text-slate-400 hover:text-orange-600 hover:bg-white" 
                                : "text-emerald-500 hover:text-emerald-700 hover:bg-white"
                            )}
                           >
                             <Power className="w-3 h-3" />
                           </Button>
                         </TooltipTrigger>
                         <TooltipContent 
                          collisionBoundary={tableContainerRef.current || undefined}
                          className="bg-slate-900 text-white border-0 text-[10px] font-black uppercase tracking-widest px-3 py-1.5"
                         >
                            {service.is_active ? "Lock Protocol" : "Verify & Activate"}
                         </TooltipContent>
                       </Tooltip>
                     </TooltipProvider>

                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onDelete(service)}
                            className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-all"
                           >
                             <Trash2 className="w-3 h-3" />
                           </Button>
                         </TooltipTrigger>
                         <TooltipContent 
                          collisionBoundary={tableContainerRef.current || undefined}
                          className="bg-slate-900 text-white border-0 text-[10px] font-black uppercase tracking-widest px-3 py-1.5"
                         >
                           Decommission
                         </TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                   </div>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
               <tr>
                  <td colSpan={4} className="py-24 text-center">
                     <div className="flex flex-col items-center justify-center gap-3">
                        <Search className="w-8 h-8 text-slate-100" />
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                           Registry Null
                        </p>
                     </div>
                  </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
