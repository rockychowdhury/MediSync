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
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm shadow-slate-100/50 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto no-scrollbar relative [scrollbar-width:thin] scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <Table className="w-full text-left border-collapse">
          <TableHeader className="bg-slate-50/95 backdrop-blur z-20 border-b border-slate-200 sticky top-0">
            <TableRow className="hover:bg-transparent border-none h-8">
              <TableHead className="py-0 pl-6 text-[8.5px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none w-[280px]">Service Identity</TableHead>
              <TableHead className="py-0 px-6 text-[8.5px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none">Required Expertise</TableHead>
              <TableHead className="py-0 px-6 text-[8.5px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none">Operational Metrics</TableHead>
              <TableHead className="py-0 px-6 text-[8.5px] font-black text-slate-400 uppercase tracking-[0.1em] leading-none text-center">Registry Status</TableHead>
              <TableHead className="py-0 pr-6 text-[8.5px] font-black text-slate-400 uppercase tracking-[0.1em] text-right leading-none">Ops</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-50">
            {services.map((service) => (
              <TableRow 
                key={service.id} 
                className="hover:bg-slate-50/50 border-b border-slate-50 last:border-b-0 transition-all group h-[64px] cursor-pointer"
                onClick={() => onEdit(service)}
              >
                <TableCell className="py-3 pl-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 duration-500">
                       <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                       <span className="text-[12px] font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors truncate">
                         {service.name}
                       </span>
                       <div className="flex items-center gap-1 mt-1">
                          <code className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">
                            REF: {service.id.slice(0, 8)}
                          </code>
                       </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-6">
                  <Badge variant="outline" className="px-2 py-0.5 rounded-lg bg-indigo-50/30 border-indigo-100 text-[8.5px] font-black text-indigo-600 uppercase tracking-widest ring-1 ring-indigo-200/20">
                    {service.required_specialization_name || "General"}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 px-6">
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px]">
                     <Clock className="w-3 h-3 text-slate-300" />
                     {service.duration_minutes}m Duration
                  </div>
                </TableCell>
                <TableCell className="py-3 px-6 text-center">
                   <div className="inline-flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${service.is_active ? "bg-emerald-500" : "bg-slate-300"} shadow-lg shadow-emerald-100 animate-pulse`} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${service.is_active ? "text-emerald-600" : "text-slate-400"}`}>
                        {service.is_active ? "Active" : "Locked"}
                      </span>
                   </div>
                </TableCell>
                <TableCell className="py-3 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="sm" className="h-7 w-7 hover:bg-slate-100 rounded-lg transition-all cursor-pointer">
                        <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 p-1.5 rounded-xl shadow-xl border-slate-100">
                      <DropdownMenuItem 
                        onClick={() => onEdit(service)}
                        className="gap-2 p-2 text-[11px] font-bold text-slate-700 hover:text-indigo-600 cursor-pointer rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3 h-3" /> Update Asset
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(service)}
                        className="gap-2 p-2 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Decommission
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {services.length === 0 && (
               <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="py-24 text-center">
                     <div className="flex flex-col items-center justify-center gap-3">
                        <Search className="w-8 h-8 text-slate-100" />
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                           Registry Null
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
