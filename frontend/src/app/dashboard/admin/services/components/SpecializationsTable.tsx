"use client";

import React from "react";
import { 
  Edit3, 
  Trash2, 
  Search, 
  Layers,
  Fingerprint,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Specialization } from "@/types/provider";

interface SpecializationsTableProps {
  specializations: Specialization[];
  loading: boolean;
  onEdit: (specialization: Specialization) => void;
  onDelete: (specialization: Specialization) => void;
  onView?: (specialization: Specialization) => void;
}

export function SpecializationsTable({ 
  specializations, 
  loading, 
  onEdit, 
  onDelete,
  onView
}: SpecializationsTableProps) {
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-500 delay-150 relative">
      <div 
        ref={tableContainerRef}
        className="flex-1 overflow-x-hidden overflow-y-auto no-scrollbar relative rounded-t-[inherit]"
      >
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky rounded-2xl top-0 z-20 bg-slate-50/80 backdrop-blur-md">
            <tr className="border-b border-slate-100 h-10">
              <th className="px-4 py-0 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Specialization</th>
              <th className="px-4 py-0 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right leading-none w-[100px]">Ops</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {specializations.map((spec) => (
              <tr key={spec.id} className="hover:bg-slate-50/50 transition-all duration-300 group h-[52px]">
                <td className="px-4 py-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 border border-slate-800 group-hover:scale-110 transition-transform duration-500">
                       <Layers className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                       <span className="text-[12px] font-black text-slate-800 leading-none group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate">
                         {spec.name}
                       </span>
                       <div className="flex items-center gap-1 mt-1.5">
                          <Fingerprint className="w-2.5 h-2.5 text-slate-200" />
                          <code className="text-[9px] font-black text-slate-200 uppercase tracking-widest leading-none truncate">
                            DEP_{spec.id}
                          </code>
                       </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-0 text-right">
                   <div className="flex items-center justify-end gap-1 relative">
                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onView?.(spec)}
                            className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white transition-all"
                           >
                             <Info className="w-3 h-3" />
                           </Button>
                         </TooltipTrigger>
                          <TooltipContent 
                            collisionBoundary={tableContainerRef.current || undefined}
                            className="bg-slate-900 text-white border-0 p-0 shadow-2xl rounded-2xl overflow-hidden max-w-[320px] w-auto"
                          >
                             <div className="flex items-stretch min-h-[80px]">
                                <div className="w-[100px] p-3.5 bg-indigo-600 flex flex-col justify-between shrink-0">
                                   <p className="font-black text-white uppercase tracking-[0.2em] text-[7px] opacity-80 leading-tight">
                                     Taxonomy<br/>Identity
                                   </p>
                                   <h5 className="font-black text-white text-[11px] leading-tight mt-auto uppercase tracking-tight truncate">
                                     {spec.name}
                                   </h5>
                                </div>
                                <div className="flex-1 p-3.5 flex items-center bg-slate-900">
                                   <p className="text-slate-300 font-bold leading-relaxed text-[10px]">
                                     {spec.description || "Institutional expertise mapping and clinical categories."}
                                   </p>
                                </div>
                             </div>
                          </TooltipContent>
                       </Tooltip>
                     </TooltipProvider>

                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onEdit(spec)}
                            className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-all"
                           >
                             <Edit3 className="w-3 h-3" />
                           </Button>
                         </TooltipTrigger>
                         <TooltipContent className="bg-slate-900 text-white border-0 text-[10px] font-black uppercase tracking-widest px-3 py-1.5">Modify Discipline</TooltipContent>
                       </Tooltip>
                     </TooltipProvider>

                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onDelete(spec)}
                            className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-all"
                           >
                             <Trash2 className="w-3 h-3" />
                           </Button>
                         </TooltipTrigger>
                         <TooltipContent className="bg-slate-900 text-white border-0 text-[10px] font-black uppercase tracking-widest px-3 py-1.5">Decommission</TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                   </div>
                </td>
              </tr>
            ))}
            {specializations.length === 0 && (
               <tr>
                  <td colSpan={2} className="py-24 text-center">
                     <div className="flex flex-col items-center justify-center gap-3">
                        <Search className="w-8 h-8 text-slate-100" />
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                           Taxonomy Null
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
