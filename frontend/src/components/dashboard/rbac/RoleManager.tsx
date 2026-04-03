"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  ShieldCheck, 
  ChevronRight, 
  Loader2, 
  ShieldAlert, 
  Info,
  Lock,
  Zap,
  Activity,
  History
} from "lucide-react";
import { rbacApi, Role, Permission } from "@/lib/api/rbac";
import { PermissionMatrix } from "./PermissionMatrix";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RoleManagerProps {
  roles: Role[];
  loading: boolean;
  onUpdate: () => void;
}

export function RoleManager({
  roles,
  loading,
  onUpdate,
}: RoleManagerProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [fetchingPermissions, setFetchingPermissions] = useState(false);

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  const loadPermissions = useCallback(async () => {
    setFetchingPermissions(true);
    try {
      const res = await rbacApi.getPermissions();
      if (res.success) {
        setAllPermissions(res.data || []);
      }
    } catch (error) {
      console.error("Failed to load permissions master list", error);
    } finally {
      setFetchingPermissions(false);
    }
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  useEffect(() => {
    if (roles.length > 0 && selectedRoleId === null) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 animate-in fade-in duration-500">
      {/* Role Sidebar */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        <div className="px-1">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              Institutional Roles
           </h3>
        </div>
        
        <ScrollArea className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-2">
           <div className="space-y-1">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                    selectedRoleId === role.id 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                      : "text-slate-600 hover:bg-slate-50 hover:px-6"
                  }`}
                >
                  <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] uppercase ${
                        selectedRoleId === role.id ? "bg-white/20" : "bg-slate-100 text-slate-400"
                     }`}>
                        {role.name?.[0]}
                     </div>
                     <div className="text-left">
                        <div className="text-xs font-black uppercase tracking-tight">{role.name}</div>
                        <div className={`text-[9px] font-bold uppercase tracking-widest ${
                           selectedRoleId === role.id ? "text-blue-100" : "text-slate-400"
                        }`}>
                           {role.permissions?.length || 0} Permissions
                        </div>
                     </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedRoleId === role.id ? "translate-x-1" : "opacity-0 group-hover:opacity-100"}`} />
                </button>
              ))}
           </div>
        </ScrollArea>

        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 space-y-2 relative overflow-hidden group">
           <Zap className="absolute -right-2 -bottom-2 w-16 h-16 text-blue-100 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700" />
           <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-relaxed relative">
              System roles define the primary permission boundary of the workforce. Security policy updates are applied in real-time across all active sessions.
           </p>
        </div>
      </div>

      {/* Permission Content Area */}
      <div className="lg:col-span-9 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {!selectedRole ? (
           <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Security Policy...</p>
           </div>
        ) : (
           <div className="flex flex-col h-full">
              <header className="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
                          <Lock className="w-5 h-5" />
                       </div>
                       <div>
                          <h2 className="text-sm font-black text-slate-800 tracking-tight leading-none uppercase">{selectedRole.name} Matrix</h2>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedRole.description || "Policy configuration ledger for active operational role."}</div>
                       </div>
                    </div>

                    <div className="flex items-center gap-8">
                       <div className="flex flex-col items-end">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Policy State</div>
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                             <span className="text-[10px] font-black text-green-600 uppercase tracking-tight leading-none">ACTIVE & ENFORCED</span>
                          </div>
                       </div>
                       <div className="h-10 w-px bg-slate-100" />
                       <div className="flex flex-col items-end">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Last Audit</div>
                          <div className="flex items-center gap-2">
                             <History className="w-3.5 h-3.5 text-slate-300" />
                             <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight leading-none">REAL-TIME SYNC</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </header>

              <ScrollArea className="flex-1 custom-scrollbar">
                 {fetchingPermissions ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                       <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    </div>
                 ) : (
                    <PermissionMatrix 
                       role={selectedRole}
                       permissions={allPermissions}
                       onUpdate={onUpdate}
                    />
                 )}
              </ScrollArea>
           </div>
        )}
      </div>
    </div>
  );
}
