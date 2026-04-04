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
  Layers, 
  Filter,
  CheckCircle2,
  MoreHorizontal
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
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Capabilities Registry</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {filteredPermissions.length} Active System Permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search capabilities..."
              className="pl-9 h-10 w-full md:w-64 bg-white border-slate-200"
            />
          </div>
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-[140px] h-10 bg-white border-slate-200 uppercase text-[10px] font-black tracking-widest">
              <SelectValue placeholder="Resource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everywhere</SelectItem>
              {resources.map((res) => (
                <SelectItem key={res} value={res} className="uppercase text-[10px] font-black tracking-widest">
                  {res}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={onAdd} className="h-10 gap-2 font-bold px-4">
            <Plus className="w-4 h-4" />
            New Capability
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm shadow-slate-100/50">
        <Table>
          <TableHeader className="bg-slate-50/50 border-b border-slate-100">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Capability ID</TableHead>
              <TableHead className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Functional Scope</TableHead>
              <TableHead className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignment Matrix</TableHead>
              <TableHead className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ledger Options</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPermissions.map((p) => {
              const assignedRoles = getAssignedRoles(p.id);
              const resource = p.name.includes(".") ? p.name.split(".")[0] : "general";
              const action = p.name.includes(".") ? p.name.split(".")[1] : p.name;

              return (
                <TableRow key={p.id} className="hover:bg-slate-50/30 border-b border-slate-100 last:border-b-0 transition-colors group">
                  <TableCell className="py-5 px-6">
                    <div className="flex flex-col gap-1.5">
                       <div className="flex items-center gap-2">
                          <code className="text-xs font-mono font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-400 uppercase tracking-tighter">
                            {resource}
                          </code>
                          <span className="text-slate-300">/</span>
                          <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                            {action}
                          </span>
                       </div>
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Validated capability
                       </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-6 max-w-sm">
                    <p className="text-[11px] leading-relaxed text-slate-500 line-clamp-2">
                      {p.description || "No specific policy description provided."}
                    </p>
                  </TableCell>
                  <TableCell className="py-5 px-6">
                    <div className="flex flex-wrap gap-1.5">
                      {assignedRoles.length > 0 ? (
                        assignedRoles.map((role) => (
                           <div key={role.id} className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100/50 text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                             {role.name}
                           </div>
                        ))
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 rounded-lg">
                          <MoreHorizontal className="w-4 h-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 p-2 rounded-xl">
                        <DropdownMenuItem 
                          onClick={() => onEdit(p)}
                          className="gap-2 p-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Policy
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(p)}
                          className="gap-2 p-2.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer rounded-lg"
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
               <TableRow>
                  <TableCell colSpan={4} className="py-32 text-center">
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                        Search generated no security matches
                     </p>
                  </TableCell>
               </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
