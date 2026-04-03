"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { rbacApi, Role } from "@/lib/api/rbac";
import { RoleManager } from "@/components/dashboard/rbac/RoleManager";
import { Loader2, ShieldCheck, UserCheck, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AccessGovernancePage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rbacApi.getRoles();
      if (res.success) {
        setRoles(res.data || []);
      }
    } catch (error) {
      console.error("Failed to load roles", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadRoles();
    }
  }, [isAuthenticated, loadRoles]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 py-5 animate-in fade-in duration-700 bg-slate-50/30">
      <PageHeader 
        breadcrumbs={["Admin", "Governance", "Access Governance"]} 
        title="Access Governance" 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0 px-2 lg:px-4">
        <Card className="border-slate-200 shadow-sm relative overflow-hidden group rounded-2xl">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Institutional Roles</span>
              </div>
            </div>
            <div className="text-3xl font-black text-slate-800 tracking-tight mt-2">
              {roles.length || "—"}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm relative overflow-hidden group rounded-2xl">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Active Matrix State</span>
              </div>
            </div>
            <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2 flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               Locked & Enforced
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm relative overflow-hidden group rounded-2xl text-right flex items-center justify-end">
           <Activity className="w-16 h-16 absolute -right-4 -bottom-4 text-slate-100/50 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 pointer-events-none" />
           <div className="mr-8 text-right z-10">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Security Policy</div>
              <div className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Real-Time RBAC</div>
           </div>
        </Card>
      </div>

      <div className="flex-1 min-h-0 flex flex-col px-2 lg:px-4">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Synchronizing Security Policy...</p>
          </div>
        ) : (
          <RoleManager roles={roles} loading={loading} onUpdate={loadRoles} />
        )}
      </div>
    </div>
  );
}
