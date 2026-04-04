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
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Lock,
  Search,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Role, Permission } from "@/lib/api/rbac";
import { motion, AnimatePresence } from "framer-motion";
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
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

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

  const toggleGroup = (resource: string) => {
    const next = new Set(collapsedGroups);
    if (next.has(resource)) next.delete(resource);
    else next.add(resource);
    setCollapsedGroups(next);
  };

  const expandAll = () => setCollapsedGroups(new Set());
  const collapseAll = () => setCollapsedGroups(new Set(Object.keys(groupedPermissions)));

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
            className="pl-9 bg-white border-slate-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={expandAll}
            className="text-[11px] font-bold uppercase tracking-tight gap-2"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={collapseAll}
            className="text-[11px] font-bold uppercase tracking-tight gap-2"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            Collapse All
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm shadow-slate-100/50">
        <div className="overflow-x-auto">
          <Table className="border-collapse">
            <TableHeader className="bg-slate-50 border-b border-slate-100 sticky top-0 z-20">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[300px] min-w-[300px] py-6 px-6 sticky left-0 z-30 bg-slate-50 border-r border-slate-100 shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Permission Capability
                  </span>
                </TableHead>
                {roles.map((role) => (
                  <TableHead key={role.id} className="min-w-[140px] text-center px-4 py-6 border-r border-slate-100/50 last:border-r-0">
                    <div className="flex flex-col items-center gap-1.5 group">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                            <ShieldCheck className="w-3.5 h-3.5" />
                         </div>
                         <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                            {role.name}
                         </span>
                      </div>
                      <div className="px-2 py-0.5 bg-slate-100 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                        {role.user_count} Users
                      </div>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedPermissions).map(([resource, perms]) => (
                <React.Fragment key={resource}>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50 border-none group">
                    <TableCell
                      colSpan={roles.length + 1}
                      className="py-2 px-6 sticky left-0 z-10 bg-inherit border-b border-slate-100"
                    >
                      <button
                        onClick={() => toggleGroup(resource)}
                        className="flex items-center gap-2 w-full text-left"
                      >
                        {collapsedGroups.has(resource) ? (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">
                          {resource}
                        </span>
                      </button>
                    </TableCell>
                  </TableRow>
                  <AnimatePresence initial={false}>
                    {!collapsedGroups.has(resource) &&
                      perms.map((p) => (
                        <motion.tr
                          key={p.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="hover:bg-slate-50/30 transition-colors border-b border-slate-100 last:border-b-0 group"
                        >
                          <TableCell className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/50 py-4 px-6 border-r border-slate-100 shadow-[2px_0_4px_rgba(0,0,0,0.01)] transition-colors">
                            <div className="flex flex-col">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-[11px] font-mono leading-none cursor-help">
                                      <span className="text-slate-300">
                                        {p.name.split(".")[0]}.
                                      </span>
                                      <span className="font-bold text-slate-600">
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
                                className="text-center py-2 border-r border-slate-100/50 last:border-r-0"
                              >
                                {locked ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex justify-center">
                                          <div className={`p-1.5 rounded-lg ${isAssigned ? "text-indigo-500 bg-indigo-50/50" : "text-slate-300 bg-slate-50"}`}>
                                             <Lock className="w-3.5 h-3.5" />
                                          </div>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="text-[10px]">
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
                                      className={`transition-all duration-300 ${isAssigned ? "border-indigo-600 bg-indigo-600 shadow-sm shadow-indigo-100" : "border-slate-300"}`}
                                    />
                                    {isPending && (
                                       <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                                          <motion.div 
                                             animate={{ rotate: 360 }}
                                             transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                             className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full"
                                          />
                                       </div>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            );
                          })}
                        </motion.tr>
                      ))}
                  </AnimatePresence>
                </React.Fragment>
              ))}
              {Object.keys(groupedPermissions).length === 0 && (
                 <TableRow>
                    <TableCell colSpan={roles.length + 1} className="py-20 text-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
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
