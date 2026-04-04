"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2,
  MoreHorizontal,
  Command,
  Database
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Permission, Role } from "@/lib/api/rbac";

interface PermissionsTableProps {
  permissions: Permission[];
  roles: Role[];
  rolePermissionsMap: Record<number, Set<number>>;
  onAdd: () => void;
  onEdit: (permission: Permission) => void;
  onDelete: (permission: Permission) => void;
}

export function PermissionsTable({
  permissions,
  roles,
  rolePermissionsMap,
  onAdd,
  onEdit,
  onDelete,
}: PermissionsTableProps) {
  const [search, setSearch] = useState("");
  const [resourceFilter, setResourceFilter] = useState("all");

  const resources = useMemo(() => {
    const resSet = new Set<string>();
    permissions.forEach((p) => {
      if (p.name.includes(".")) resSet.add(p.name.split(".")[0]);
    });
    return Array.from(resSet).sort();
  }, [permissions]);

  const filteredPermissions = useMemo(() => {
    return permissions.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      const matchesResource =
        resourceFilter === "all" || p.name.startsWith(`${resourceFilter}.`);
      return matchesSearch && matchesResource;
    });
  }, [permissions, search, resourceFilter]);

  const getAssignedRoles = (permId: number) => {
    return roles.filter((role) => rolePermissionsMap[role.id]?.has(permId));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Capabilities Registry</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {filteredPermissions.length} Active System Permissions
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search capabilities..."
              className="pl-9 h-9 w-full md:w-60 bg-white border-slate-200 text-xs font-medium focus-visible:ring-1 focus-visible:ring-indigo-400"
            />
          </div>
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-[140px] h-9 bg-white border-slate-200 uppercase text-[10px] font-black tracking-widest hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2">
                <Database className="w-3 h-3 text-slate-400" />
                <SelectValue placeholder="Resource" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200">
              <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest">Everywhere</SelectItem>
              {resources.map((res) => (
                <SelectItem key={res} value={res} className="uppercase text-[10px] font-black tracking-widest">
                  {res}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={onAdd} className="h-9 gap-2 text-[10px] font-black uppercase tracking-widest px-4 shadow-sm active:scale-95 transition-all">
            <Plus className="w-3.5 h-3.5" />
            New Capability
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm shadow-slate-100/50">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/95 backdrop-blur z-20 border-b border-slate-200 sticky top-0">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="py-4 pl-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[280px]">Capability ID</TableHead>
                <TableHead className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Functional Scope</TableHead>
                <TableHead className="py-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assignment Matrix</TableHead>
                <TableHead className="py-4 pr-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPermissions.map((p) => {
                const assignedRoles = getAssignedRoles(p.id);
                const resource = p.name.includes(".") ? p.name.split(".")[0] : "general";
                const action = p.name.includes(".") ? p.name.split(".")[1] : p.name;

                return (
                  <TableRow key={p.id} className="hover:bg-slate-50/50 border-b border-slate-50 last:border-b-0 transition-all group h-[72px]">
                    <TableCell className="py-4 pl-8">
                      <div className="flex flex-col gap-1.5">
                         <div className="flex items-center gap-2">
                            <div className="relative overflow-hidden flex items-center bg-slate-100/80 border border-slate-200/50 rounded-md px-2 py-0.5 group-hover:bg-white transition-colors">
                               <Command className="w-3 h-3 text-slate-400 mr-2" />
                               <span className="text-[11px] font-mono font-bold text-slate-600 uppercase">
                                 {resource}
                               </span>
                               <span className="text-slate-300 mx-1.5 font-bold">/</span>
                               <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight">
                                 {action}
                               </span>
                            </div>
                         </div>
                         <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            System Active
                         </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 max-w-sm">
                      <p className="text-[13px] leading-relaxed text-slate-600 font-medium line-clamp-1">
                        {p.description || "Institutional security boundary defining specific operational access."}
                      </p>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5 min-w-[200px]">
                        {assignedRoles.length > 0 ? (
                          assignedRoles.map((role) => (
                             <Badge key={role.id} variant="outline" className="px-2 py-0.5 rounded-lg bg-indigo-50 border-indigo-100 text-[9px] font-black text-indigo-600 uppercase tracking-widest ring-1 ring-indigo-200/50">
                               {role.name}
                             </Badge>
                          ))
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                            Unassigned Entry
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 pr-8 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 rounded-xl group-hover:scale-105 transition-transform">
                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 p-2 rounded-xl shadow-xl border-slate-200">
                          <DropdownMenuItem 
                            onClick={() => onEdit(p)}
                            className="gap-2 p-2.5 text-xs font-bold text-slate-700 hover:text-indigo-600 cursor-pointer rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit Policy
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDelete(p)}
                            className="gap-2 p-2.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Decommission
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredPermissions.length === 0 && (
                 <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4} className="py-32 text-center">
                       <div className="flex flex-col items-center justify-center gap-3">
                          <Search className="w-10 h-10 text-slate-200" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                             Zero Analysis Results
                          </p>
                       </div>
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
