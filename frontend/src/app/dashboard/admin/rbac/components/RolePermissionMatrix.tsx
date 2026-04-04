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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck,
  Lock,
  Search,
} from "lucide-react";
import { Role, Permission } from "@/lib/api/rbac";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RolePermissionMatrixProps {
  roles: Role[];
  permissions: Permission[];
  rolePermissionsMap: Record<number, Set<number>>;
  pendingCells: Set<string>;
  onAssign: (roleId: number, permissionId: number) => Promise<void>;
  onRevoke: (roleId: number, permissionId: number) => Promise<void>;
}

const PROTECTED_PERMISSIONS = ["rbac.manage"];

export function RolePermissionMatrix({
  roles,
  permissions,
  rolePermissionsMap,
  pendingCells,
  onAssign,
  onRevoke,
}: RolePermissionMatrixProps) {
  const [search, setSearch] = useState("");

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    const lowerSearch = search.toLowerCase();

    const filtered = permissions.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerSearch) ||
        p.description?.toLowerCase().includes(lowerSearch)
    );

    filtered.forEach((p) => {
      const resource = p.name.includes(".") ? p.name.split(".")[0] : "general";
      if (!groups[resource]) groups[resource] = [];
      groups[resource].push(p);
    });

    return groups;
  }, [permissions, search]);

  const isLocked = (roleName: string, permissionName: string) => {
    if (PROTECTED_PERMISSIONS.includes(permissionName)) {
      return {
        locked: true,
        reason:
          roleName === "admin"
            ? "Admins must have RBAC access"
            : "Only Admins can manage RBAC",
      };
    }
    return { locked: false, reason: "" };
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter permissions..."
            className="pl-9 bg-white border-slate-200 text-sm font-medium"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm shadow-slate-100/50">
        <div className="overflow-x-auto">
          <Table className="border-collapse">
            <TableHeader className="bg-slate-50/95 backdrop-blur z-20 border-b border-slate-200 sticky top-0">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[300px] min-w-[300px] py-4 pl-8 sticky left-0 z-30 bg-slate-50/95 backdrop-blur border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Capability Identity
                  </span>
                </TableHead>
                {roles.map((role) => (
                  <TableHead key={role.id} className="min-w-[140px] text-center px-4 py-4 border-r border-slate-100 last:border-r-0">
                    <div className="flex flex-col items-center gap-1.5 group">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-400 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                            <ShieldCheck className="w-3.5 h-3.5" />
                         </div>
                         <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">
                            {role.name}
                         </span>
                      </div>
                      <div className="px-2 py-0.5 bg-slate-100 rounded-full text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                        {role.user_count} Personnel
                      </div>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedPermissions).map(([resource, perms]) => (
                <React.Fragment key={resource}>
                  <TableRow className="bg-slate-50/30 hover:bg-slate-50/50 border-none group h-[40px]">
                    <TableCell
                      colSpan={roles.length + 1}
                      className="py-2.5 pl-8 sticky left-0 z-10 bg-inherit border-b border-slate-100"
                    >
                      <div className="flex items-center gap-2 w-full text-left">
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">
                          {resource}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                  {perms.map((p) => (
                    <TableRow
                      key={p.id}
                      className="hover:bg-slate-50/50 transition-all border-b border-slate-50 last:border-b-0 group h-[72px]"
                    >
                      <TableCell className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/50 py-4 pl-8 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.01)] transition-all">
                        <div className="flex flex-col">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="text-[11px] font-mono leading-none cursor-help">
                                  <span className="text-slate-400">
                                    {p.name.split(".")[0]}.
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {p.name.split(".")[1]}
                                  </span>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="bg-slate-900 text-white border-0 py-2 px-3 text-[10px] leading-relaxed max-w-[200px]">
                                {p.description || "No description provided."}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      {roles.map((role) => {
                        const { locked, reason } = isLocked(role.name, p.name);
                        const isAssigned = rolePermissionsMap[role.id]?.has(p.id) ?? false;
                        const isPending = pendingCells.has(`${role.id}:${p.id}`);

                        return (
                          <TableCell
                            key={`${role.id}-${p.id}`}
                            className="text-center py-2 border-r border-slate-100 last:border-r-0"
                          >
                            {locked ? (
                              <TooltipProvider>
                                <Tooltip>
                                <TooltipTrigger>
                                  <span className="flex justify-center">
                                    <span className={`p-1.5 rounded-lg ${isAssigned ? "text-indigo-600 bg-indigo-50 border border-indigo-100" : "text-slate-400 bg-slate-50 border border-slate-200"}`}>
                                       <Lock className="w-3.5 h-3.5" />
                                    </span>
                                  </span>
                                </TooltipTrigger>
                                  <TooltipContent side="top" className="text-[10px] font-bold">
                                    {reason}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <div className="flex justify-center group/cell relative">
                                <Checkbox
                                  checked={isAssigned}
                                  onCheckedChange={(checked) => {
                                    if (checked) onAssign(role.id, p.id);
                                    else onRevoke(role.id, p.id);
                                  }}
                                  disabled={isPending}
                                  className={`h-4.5 w-4.5 transition-all duration-300 ${isAssigned ? "border-indigo-600 bg-indigo-600 shadow-sm shadow-indigo-100" : "border-slate-300 bg-white"}`}
                                />
                                {isPending && (
                                   <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                                      <div 
                                         className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"
                                      />
                                   </div>
                                )}
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
              {Object.keys(groupedPermissions).length === 0 && (
                <TableRow>
                  <TableCell colSpan={roles.length + 1} className="py-20 text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      No matching permissions found
                    </p>
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
