"use client";

import React, { useState, useMemo } from "react";
import { 
  Check, 
  X, 
  ShieldCheck, 
  Lock, 
  Layers, 
  Activity, 
  Database, 
  Globe, 
  ShieldAlert,
  Loader2,
  ChevronDown,
  ArrowRight
} from "lucide-react";
import { rbacApi, Role, Permission } from "@/lib/api/rbac";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface PermissionMatrixProps {
  role: Role;
  permissions: Permission[];
  onUpdate: () => void;
}

export function PermissionMatrix({
  role,
  permissions,
  onUpdate,
}: PermissionMatrixProps) {
  const [loadingIds, setLoadingIds] = useState<number[]>([]);

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    permissions.forEach((p) => {
      const parts = p.name.includes(".") ? p.name.split(".") : p.name.split(":");
      const group = parts[0].toUpperCase();
      if (!groups[group]) groups[group] = [];
      groups[group].push(p);
    });
    return groups;
  }, [permissions]);

  const hasPermission = (permissionId: number) => {
    return role.permissions?.some((p) => p.id === permissionId);
  };

  const togglePermission = async (permissionId: number, isAssigned: boolean) => {
    setLoadingIds(p => [...p, permissionId]);
    try {
       if (isAssigned) {
          await rbacApi.revokeRolePermission(role.id, permissionId);
       } else {
          await rbacApi.assignRolePermissions(role.id, [permissionId]);
       }
       onUpdate();
    } catch (error) {
       console.error("Failed to update security mapping", error);
    } finally {
       setLoadingIds(p => p.filter(id => id !== permissionId));
    }
  };

  return (
    <div className="p-10 space-y-12 animate-in fade-in duration-500">
       {Object.entries(groupedPermissions).map(([group, perms]) => (
          <section key={group} className="space-y-6">
             <div className="flex items-center gap-4 mb-4">
                <div className="h-[1px] flex-1 bg-slate-100"></div>
                <div className="flex items-center gap-2 group cursor-default">
                   <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all duration-300">
                      <Layers className="w-4 h-4" />
                   </div>
                   <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">{group} CONTROL GROUP</h3>
                </div>
                <div className="h-[1px] flex-1 bg-slate-100"></div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {perms.map((p) => {
                   const assigned = hasPermission(p.id);
                   const loading = loadingIds.includes(p.id);

                   return (
                      <div 
                        key={p.id} 
                        className={`p-5 rounded-3xl border transition-all duration-500 group relative overflow-hidden flex flex-col justify-between h-[140px] ${
                          assigned 
                            ? "bg-blue-50/50 border-blue-200 shadow-xl shadow-blue-100/30" 
                            : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 grayscale hover:grayscale-0"
                        }`}
                      >
                         <div className="flex items-start justify-between">
                            <div className="space-y-1">
                               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.name.split(/[.:]/)[1] || "Action"}</div>
                               <h4 className={`text-xs font-black uppercase tracking-tight leading-none ${assigned ? "text-blue-700" : "text-slate-700"}`}>
                                  {p.name.replace(/^[a-z]+[.:]/, '').replace(/_/g, ' ')}
                               </h4>
                            </div>
                            <div className="relative">
                               <Checkbox 
                                  checked={assigned}
                                  onCheckedChange={() => togglePermission(p.id, assigned)}
                                  disabled={loading}
                                  className={`w-7 h-7 rounded-xl border-2 transition-all duration-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 ${
                                     assigned ? "border-blue-300" : "border-slate-200"
                                  } shadow-inner cursor-pointer`}
                               />
                               {loading && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[1px] rounded-xl">
                                     <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                  </div>
                               )}
                            </div>
                         </div>

                         <div className="mt-4 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-slate-400 italic leading-tight max-w-[80%]">
                               {p.description || "Interactive security trigger for the unified clinical core system."}
                            </p>
                            {assigned && <ShieldCheck className="w-4 h-4 text-blue-500/50 group-hover:scale-125 transition-transform" />}
                         </div>

                         {/* Subtle Background Icon */}
                         <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.08] pointer-events-none transition-opacity">
                            <Lock className="w-16 h-16" />
                         </div>
                      </div>
                   );
                })}
             </div>
          </section>
       ))}

       {permissions.length === 0 && (
          <div className="py-24 text-center">
             <ShieldAlert className="w-12 h-12 text-slate-200 mx-auto mb-4" />
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-relaxed italic">No Procedural Security Triggers Identified in Core Policy Environment</p>
          </div>
       )}

       {/* Matrix Footer / Summary */}
       <footer className="mt-16 p-8 bg-slate-50/50 rounded-[40px] border border-slate-100 shadow-inner flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
             <div className="flex flex-col items-center">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Security Yield</div>
                <div className="text-3xl font-black text-blue-600 leading-none">
                   {Math.round((role.permissions?.length / permissions.length) * 100 || 0)}%
                </div>
             </div>
             <div className="h-10 w-px bg-slate-200" />
             <div>
                <div className="text-[11px] font-black text-slate-700 uppercase tracking-tight mb-1">Active Policy Enforcement</div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   {role.permissions?.length} Active Triggers / {permissions.length} Global Vectors
                </p>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <Button 
               variant="ghost" 
               className="h-12 px-6 rounded-2xl font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest text-[10px] bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md"
             >
                Export Policy Ledger
             </Button>
          </div>
       </footer>
    </div>
  );
}
