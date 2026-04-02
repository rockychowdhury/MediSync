"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Users, 
  ShieldCheck, 
  Plus, 
  Search, 
  Filter,
  UserPlus,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Lock
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  usersApi, 
  rbacApi 
} from "@/lib/api";
import { UserTable } from "@/components/dashboard/users/UserTable";
import { CreateUserModal } from "@/components/dashboard/users/CreateUserModal";
import { RoleManager } from "@/components/dashboard/rbac/RoleManager";
import { toast } from "sonner";

export default function UsersAndRolesPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, skip: 0, limit: 10 });
  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadUsers = useCallback(async (skip = 0) => {
    setLoading(true);
    try {
      const res = await usersApi.getUsers({ 
        skip, 
        limit: pagination.limit, 
        search 
      });
      if (res.success) {
         setUsers(res.data || []);
         if (res.meta?.pagination) {
           const { total, skip: s, limit } = res.meta.pagination;
           setPagination(p => ({ ...p, total, skip: s, limit }));
         }
      }
    } catch (error) {
      console.error("Failed to load users", error);
      toast.error("Failed to load user registry");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, search]);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rbacApi.getRoles();
      if (res.success) {
        setRoles(res.data);
      }
    } catch (error) {
      console.error("Failed to load roles", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Always load both on mount so CreateUserModal has roles available immediately
  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    if (activeTab === "users") loadUsers(0);
  }, [activeTab, loadUsers]);


  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700 bg-slate-50/30 min-h-screen">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-2xl shadow-blue-200">
                 {activeTab === "users" ? <Users className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              </div>
              <div>
                 <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
                   {activeTab === "users" ? "Identity Management" : "Access Governance"}
                 </h1>
                 <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1.5 ml-0.5">
                   {activeTab === "users" ? "Staff Credential Registry & Lifecycle" : "Role-Based Security Policy & RBAC Matrix"}
                 </p>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "users" && (
             <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all active:scale-95 shadow-xl shadow-blue-100 flex items-center gap-2 group text-xs uppercase tracking-widest"
             >
               <UserPlus className="w-4 h-4 group-hover:rotate-12 transition-transform" />
               Enroll New Staff
             </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => activeTab === "users" ? loadUsers(pagination.skip) : loadRoles()}
            className="h-12 w-12 p-0 rounded-2xl border-slate-200 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all font-black"
          >
             <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Primary Navigation Cluster */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
         <TabsList className="bg-white border border-slate-200 p-1.5 rounded-3xl h-16 shadow-lg shadow-slate-100/50 w-full md:w-fit">
            <TabsTrigger 
              value="users" 
              className="px-8 rounded-2xl py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
               User Registry
            </TabsTrigger>
            <TabsTrigger 
              value="roles" 
              className="px-8 rounded-2xl py-3 font-black text-xs uppercase tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
               Security Policy (RBAC)
            </TabsTrigger>
         </TabsList>

         <TabsContent value="users" className="space-y-6 outline-none">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
               <div className="relative flex-1 group w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                  <Input 
                    placeholder="Refine staff lookup by name or email identity..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-12 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:shadow-xl transition-all font-semibold text-slate-700"
                  />
               </div>
               <div className="flex items-center gap-2 w-full md:w-fit">
                  <Button variant="ghost" className="h-12 px-6 rounded-2xl font-black text-slate-400 uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all">
                     <Filter className="w-3.5 h-3.5 mr-2" />
                     Advanced Filters
                  </Button>
               </div>
            </div>

            {loading && users.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-slate-200">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Compiling Identity Registry...</p>
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
         </TabsContent>

         <TabsContent value="roles" className="outline-none">
            <RoleManager 
              roles={roles} 
              loading={loading}
              onUpdate={loadRoles}
            />
         </TabsContent>
      </Tabs>

      <CreateUserModal 
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
