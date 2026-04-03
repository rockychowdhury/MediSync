"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { 
  Users, 
  UserPlus,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Activity,
  Plus
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { usersApi, rbacApi } from "@/lib/api";
import { UserTable } from "@/components/dashboard/users/UserTable";
import { CreateUserDialog } from "@/components/dashboard/users/CreateUserDialog";
import { toast } from "sonner";

export default function WorkforceIdentityPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [pagination, setPagination] = useState<{
    total: number;
    skip: number;
    limit: number;
    role_id?: number;
    is_active?: boolean;
  }>({ total: 0, skip: 0, limit: 25 });
  
  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadUsers = useCallback(async (
    skip = 0, 
    role_id?: number | null, 
    is_active?: boolean | null
  ) => {
    setLoading(true);
    
    // Determine the parameters to send
    const targetRoleId = role_id === null ? undefined : (role_id !== undefined ? role_id : pagination.role_id);
    const targetIsActive = is_active === null ? undefined : (is_active !== undefined ? is_active : pagination.is_active);

    try {
      const res = await usersApi.getUsers({ 
        skip, 
        limit: pagination.limit, 
        search,
        role_id: targetRoleId,
        is_active: targetIsActive
      });

      if (res.success) {
        setUsers(res.data || []);
        if (res.meta?.pagination) {
          const { total, skip: s, limit } = res.meta.pagination;
          setPagination({ 
            total, 
            skip: s, 
            limit, 
            role_id: targetRoleId, 
            is_active: targetIsActive 
          });
        }
      }
    } catch (error) {
      console.error("Failed to load users", error);
      toast.error("Failed to synchronize user registry");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, pagination.role_id, pagination.is_active, search]);

  const loadRoles = useCallback(async () => {
    try {
      const res = await rbacApi.getRoles();
      if (res.success) {
        setRoles(res.data || []);
      }
    } catch (error) {
      console.error("Failed to load roles", error);
    }
  }, []);

  // Initial Data Synchronization
  useEffect(() => {
    if (isAuthenticated) {
      loadRoles();
      loadUsers(0);
    }
  }, [isAuthenticated, loadRoles, loadUsers]);

  return (
    <div className="h-full flex flex-col gap-4 py-5 animate-in fade-in duration-700 bg-slate-50/30">
      <PageHeader 
        breadcrumbs={["Admin", "Governance", "Workforce Identity"]} 
        title="Workforce Identity" 
      />


      {/* ─── Control Toolbar ────────────────────────────────────── */}
      <div className="px-0 shrink-0">
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
            <Input 
              placeholder="Lookup staff by identity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadUsers(0)}
              className="h-9 pl-9 border-0 bg-transparent focus-visible:ring-0 shadow-none font-bold text-xs text-slate-700 w-full"
            />
          </div>

          <div className="hidden md:block h-4 w-px bg-slate-100 shrink-0" />

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Role Filter */}
            <Select 
              value={pagination.role_id?.toString() || "all"} 
              onValueChange={(v) => loadUsers(0, v === "all" ? null : parseInt(v))}
            >
              <SelectTrigger className="h-8 w-full md:w-40 rounded-lg border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest shadow-none hover:bg-slate-100 transition-colors border-none">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-slate-400" />
                  <SelectValue placeholder="All Roles" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200">
                <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()} className="text-[10px] font-black uppercase tracking-widest">{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select 
              value={pagination.is_active?.toString() || "all"} 
              onValueChange={(v) => loadUsers(0, undefined, v === "all" ? null : v === "true")}
            >
              <SelectTrigger className="h-8 w-full md:w-36 rounded-lg border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest shadow-none hover:bg-slate-100 transition-colors border-none">
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 text-slate-400" />
                  <SelectValue placeholder="All Status" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200">
                <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest">All Status</SelectItem>
                <SelectItem value="true" className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Active Only</SelectItem>
                <SelectItem value="false" className="text-[10px] font-black uppercase tracking-widest text-rose-600">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            <div className="h-4 w-px bg-slate-100 shrink-0 hidden md:block" />

            <div className="flex items-center gap-2 shrink-0">
               <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="h-8 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black transition-all active:scale-95 shadow-sm flex items-center gap-2 group text-[9px] uppercase tracking-widest"
               >
                 <UserPlus className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                 Enroll
               </Button>
               <Button 
                variant="outline" 
                onClick={() => loadUsers(pagination.skip)}
                className="h-8 w-8 p-0 rounded-lg border-slate-200 bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-black shadow-sm"
              >
                 <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Registry Table ─────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col ">
        {loading && users.length === 0 ? (
           <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Compiling Identity Registry...</p>
           </div>
        ) : (
           <UserTable 
            users={users} 
            loading={loading}
            total={pagination.total}
            skip={pagination.skip}
            limit={pagination.limit}
            onPageChange={(skip: number) => loadUsers(skip)}
            onUpdate={() => loadUsers(pagination.skip)}
            roles={roles}
           />
        )}
      </div>

      <CreateUserDialog 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        roles={roles}
        onSuccess={() => {
           loadUsers(0);
           setIsCreateModalOpen(false);
           toast.success("Account Enrolled", {
             description: "User identity has been successfully registered in the workforce registry.",
           });
        }}
      />
    </div>
  );
}
