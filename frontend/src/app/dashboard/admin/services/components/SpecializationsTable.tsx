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
import { 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Search, 
  Layers,
  Activity,
  Fingerprint
} from "lucide-react";
import { Specialization } from "@/types/provider";

interface SpecializationsTableProps {
  specializations: Specialization[];
  onEdit: (specialization: Specialization) => void;
  onDelete: (specialization: Specialization) => void;
}

export function SpecializationsTable({ specializations, onEdit, onDelete }: SpecializationsTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm shadow-slate-100/50">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/95 backdrop-blur z-20 border-b border-slate-200 sticky top-0">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="py-4 pl-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[400px]">Departmental Identity</TableHead>
              <TableHead className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Operational State</TableHead>
              <TableHead className="py-4 pr-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Options</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {specializations.map((spec) => (
              <TableRow key={spec.id} className="hover:bg-slate-50/50 border-b border-slate-50 last:border-b-0 transition-all group h-[72px]">
                <TableCell className="py-4 pl-8">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center text-[12px] font-black uppercase shrink-0 shadow-sm transition-transform group-hover:scale-105">
                       <Layers className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[14px] font-bold text-slate-800 leading-tight uppercase tracking-tight">
                         {spec.name}
                       </span>
                       <div className="flex items-center gap-1.5 mt-1">
                          <Fingerprint className="w-2.5 h-2.5 text-slate-300" />
                          <code className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest leading-none">
                            DEP_ID_{spec.id}
                          </code>
                       </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4 px-6">
                   <div className="inline-flex items-center gap-2 bg-emerald-50 px-2.5 py-1 rounded-xl text-[10px] text-emerald-600 font-bold border border-emerald-100 uppercase tracking-widest">
                      <Activity className="w-3 h-3 text-emerald-400" />
                      Active Registry
                   </div>
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
                        onClick={() => onEdit(spec)}
                        className="gap-2.5 p-2.5 text-xs font-bold text-slate-700 hover:text-indigo-600 cursor-pointer rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Modify Listing
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(spec)}
                        className="gap-2.5 p-2.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Decommission
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {specializations.length === 0 && (
               <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="py-32 text-center">
                     <div className="flex flex-col items-center justify-center gap-3">
                        <Search className="w-10 h-10 text-slate-200" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                           No Specializations defined
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
