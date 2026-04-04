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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Search, 
  Clock, 
  Stethoscope,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Service } from "@/types/service";

interface ServicesTableProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}

export function ServicesTable({ services, onEdit, onDelete }: ServicesTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm shadow-slate-100/50">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/95 backdrop-blur z-20 border-b border-slate-200 sticky top-0">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="py-4 pl-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[300px]">Service Identity</TableHead>
              <TableHead className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Required Expertise</TableHead>
              <TableHead className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Operational Metrics</TableHead>
              <TableHead className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</TableHead>
              <TableHead className="py-4 pr-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Options</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id} className="hover:bg-slate-50/50 border-b border-slate-50 last:border-b-0 transition-all group h-[72px]">
                <TableCell className="py-4 pl-8">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center text-[12px] font-black uppercase shrink-0 shadow-sm transition-transform group-hover:scale-105">
                       <Stethoscope className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[14px] font-bold text-slate-800 leading-tight">
                         {service.name}
                       </span>
                       <div className="flex items-center gap-1.5 mt-1">
                          <code className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                            SVC_{service.id.slice(0, 8)}
                          </code>
                       </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4 px-6">
                   <div className="flex items-center gap-2">
                      <Badge variant="outline" className="px-2 py-0.5 rounded-lg bg-indigo-50 border-indigo-100 text-[9px] font-black text-indigo-600 uppercase tracking-widest ring-1 ring-indigo-200/50">
                        {service.required_specialization_name || "General Practice"}
                      </Badge>
                   </div>
                </TableCell>
                <TableCell className="py-4 px-6">
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                         <Clock className="w-3.5 h-3.5 text-slate-300" />
                         <span className="text-[13px] font-bold text-slate-600">{service.duration_minutes} min</span>
                      </div>
                   </div>
                </TableCell>
                <TableCell className="py-4 px-6 text-center">
                   {service.is_active ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
                         <CheckCircle2 className="w-3 h-3" /> Active
                      </div>
                   ) : (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                         <AlertCircle className="w-3 h-3" /> Inactive
                      </div>
                   )}
                </TableCell>
                <TableCell className="py-4 pr-8 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 rounded-xl group-hover:scale-105 transition-transform">
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 p-2 rounded-xl shadow-xl border-slate-100">
                      <DropdownMenuItem 
                        onClick={() => onEdit(service)}
                        className="gap-2.5 p-2.5 text-xs font-bold text-slate-700 hover:text-indigo-600 cursor-pointer rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Modify Service
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(service)}
                        className="gap-2.5 p-2.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Decommission
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {services.length === 0 && (
               <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="py-32 text-center">
                     <div className="flex flex-col items-center justify-center gap-3">
                        <Search className="w-10 h-10 text-slate-200" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                           Zero Assets in Registry
                        </p>
                     </div>
                  </TableCell>
               </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
