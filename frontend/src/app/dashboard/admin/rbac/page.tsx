"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { 
  ShieldCheck, 
  Settings2, 
  Users, 
  ArrowRight, 
  HelpCircle,
  Activity,
  ChevronDown,
  Layers
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

// Components
import { RolePermissionMatrix } from "./components/RolePermissionMatrix";
import { PermissionsTable } from "./components/PermissionsTable";
import { RolesTable } from "./components/RolesTable";
import { PermissionDialog } from "./components/PermissionDialog";
import { RoleDialog } from "./components/RoleDialog";
import { DeleteConfirmDialog } from "./components/DeleteConfirmDialog";

// Hooks
import { usePermissions } from "./hooks/usePermissions";
import { useRoles } from "./hooks/useRoles";
import { useRolePermissions } from "./hooks/useRolePermissions";

// Types
import { Permission, Role } from "@/lib/api/rbac";

export default function AdministrativeRBACPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // Hooks
  const { 
    permissions, 
    fetchPermissions, 
    createPermission, 
    updatePermission, 
    deletePermission,
    loading: loadingPermissions 
  } = usePermissions();

  const { 
    roles, 
    fetchRoles, 
    createRole, 
    updateRole, 
    deleteRole, 
    fetchRoleUsers,
    loading: loadingRoles 
  } = useRoles();

  const {
    rolePermissionsMap,
    pendingCells,
    initializeMap,
    assignPermission,
    revokePermission,
  } = useRolePermissions();

  // Local UI State
  const [activeSection, setActiveSection] = useState("matrix");
  const [isNavSticky, setIsNavSticky] = useState(false);
  
  // Dialog States
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [activePerm, setActivePerm] = useState<Permission | null>(null);
  
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "perm" | "role"; data: any } | null>(null);

  // Refs for Scrolling
  const matrixRef = useRef<HTMLDivElement>(null);
  const permsRef = useRef<HTMLDivElement>(null);
  const rolesRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const loadData = useCallback(async () => {
    const [pRes, rRes] = await Promise.all([fetchPermissions(), fetchRoles()]);
    // Map initialization is handled by useEffect when roles change
  }, [fetchPermissions, fetchRoles]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  useEffect(() => {
    if (roles.length > 0) {
      initializeMap(roles);
    }
  }, [roles, initializeMap]);

  // Sticky Nav & Section Observer
  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        setIsNavSticky(window.scrollY > 400);
      }

      const sections = [
        { id: "matrix", ref: matrixRef },
        { id: "permissions", ref: permsRef },
        { id: "roles", ref: rolesRef },
      ];

      const current = sections.find((s) => {
        if (!s.ref.current) return false;
        const rect = s.ref.current.getBoundingClientRect();
        return rect.top <= 200 && rect.bottom >= 200;
      });

      if (current) setActiveSection(current.id);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const ref = id === "matrix" ? matrixRef : id === "permissions" ? permsRef : rolesRef;
    if (ref.current) {
      const offset = 120;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = ref.current.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  // Handlers
  const handlePermSubmit = async (data: { name: string; description: string }) => {
    if (activePerm) {
      await updatePermission(activePerm.id, { description: data.description });
    } else {
      await createPermission(data);
    }
    setActivePerm(null);
  };

  const handleRoleSubmit = async (data: { name: string; description: string; initialPermissions?: number[] }) => {
    if (activeRole) {
      await updateRole(activeRole.id, { description: data.description });
    } else {
      const newRole = await createRole({ name: data.name, description: data.description });
      if (newRole && data.initialPermissions?.length) {
        await assignPermission(newRole.id, data.initialPermissions[0]); // Simple example, should handle all
      }
    }
    setActiveRole(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "perm") {
      await deletePermission(deleteTarget.data.id);
    } else {
      await deleteRole(deleteTarget.data.id);
    }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const getImpactWarning = () => {
    if (!deleteTarget) return "";
    if (deleteTarget.type === "perm") {
      const assignedCount = roles.filter(r => rolePermissionsMap[r.id]?.has(deleteTarget.data.id)).length;
      return assignedCount > 0 
        ? `This capability is currently granted to ${assignedCount} role(s). Deleting it will revoke these privileges globally.` 
        : "This capability is not currently assigned to any institutional roles.";
    } else {
      return `Deleting the ${deleteTarget.data.name} role will immediately revoke access for ${deleteTarget.data.user_count} active users.`;
    }
  };

  return (
    <div className="flex-1 min-h-[200vh] flex flex-col gap-6 py-6 bg-slate-50/50">
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-indigo-600 origin-left z-[100]" 
        style={{ scaleX }}
      />

      <div className="px-4 lg:px-8 max-w-[1600px] mx-auto w-full space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
             <PageHeader 
               breadcrumbs={["System Administration", "Security", "Access Governance"]} 
               title="Institutional RBAC Registry" 
             />
             <p className="text-xs font-medium text-slate-500 max-w-2xl leading-relaxed">
               Manage global security policy through granular capability definitions and institutional role matrices. 
               All changes are applied in real-time across active operational sessions.
             </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Matrix State</span>
                   <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">Active & Enforced</span>
                   </div>
                </div>
                <div className="w-px h-8 bg-slate-100" />
                <HelpCircle className="w-5 h-5 text-slate-300 hover:text-indigo-500 cursor-help transition-colors" />
             </div>
          </div>
        </header>

        {/* Anchor Nav Overlay */}
        <div 
          ref={navRef}
          className={cn(
            "p-1.5 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl z-50 transition-all duration-500 flex items-center gap-1",
            isNavSticky ? "fixed top-6 left-1/2 -translate-x-1/2" : "relative w-fit"
          )}
        >
          {[
            { id: "matrix", label: "Permission Matrix", icon: Layers },
            { id: "permissions", label: "Capabilities", icon: Settings2 },
            { id: "roles", label: "Institutional Roles", icon: ShieldCheck },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 group",
                activeSection === item.id 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-3.5 h-3.5 transition-colors", activeSection === item.id ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-600")} />
              <span className="text-[10px] font-black uppercase tracking-[0.1em]">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Section A: Role Permission Matrix */}
        <section ref={matrixRef} className="space-y-6 pt-4 scroll-mt-32">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-200">
               <Layers className="w-6 h-6" />
            </div>
            <div>
               <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Security Policy Matrix</h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                 <Activity className="w-3 h-3 text-emerald-500" />
                 Operational Policy State (READ/WRITE)
               </p>
            </div>
          </div>
          
          <RolePermissionMatrix 
            roles={roles}
            permissions={permissions}
            rolePermissionsMap={rolePermissionsMap}
            pendingCells={pendingCells}
            onAssign={assignPermission}
            onRevoke={revokePermission}
          />
        </section>

        <div className="grid grid-cols-1 gap-12 py-8">
           {/* Section B: Permissions Table */}
           <section ref={permsRef} className="space-y-6 scroll-mt-32">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-100">
                  <Settings2 className="w-6 h-6" />
               </div>
               <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Granular Capabilities</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                    Define and manage independent feature flags and institutional permissions
                  </p>
               </div>
             </div>
             
             <PermissionsTable 
               permissions={permissions}
               roles={roles}
               rolePermissionsMap={rolePermissionsMap}
               onAdd={() => { setActivePerm(null); setPermDialogOpen(true); }}
               onEdit={(p) => { setActivePerm(p); setPermDialogOpen(true); }}
               onDelete={(p) => { setDeleteTarget({ type: "perm", data: p }); setDeleteDialogOpen(true); }}
             />
           </section>

           <div className="w-full h-px bg-slate-200 flex items-center justify-center">
              <div className="bg-slate-50 px-8">
                 <Settings2 className="w-5 h-5 text-slate-300" />
              </div>
           </div>

           {/* Section C: Roles Table */}
           <section ref={rolesRef} className="space-y-6 scroll-mt-32">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-100">
                  <ShieldCheck className="w-6 h-6" />
               </div>
               <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Institutional Role Ledger</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                    Manage system hierarchies and primary personnel groupings
                  </p>
               </div>
             </div>
             
             <RolesTable 
               roles={roles}
               onAdd={() => { setActiveRole(null); setRoleDialogOpen(true); }}
               onEdit={(r) => { setActiveRole(r); setRoleDialogOpen(true); }}
               onDelete={(r) => { setDeleteTarget({ type: "role", data: r }); setDeleteDialogOpen(true); }}
               onManageInMatrix={(r) => scrollTo("matrix")}
               fetchUsers={fetchRoleUsers}
             />
           </section>
        </div>
      </div>

      {/* Footer Utility */}
      <footer className="mt-20 py-12 border-t border-slate-200 bg-white">
         <div className="max-w-[1600px] mx-auto px-8 flex justify-between items-center text-slate-400">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">MediSync Security Governance Layer</span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest">
               Hand-crafted institutional security interface © 2026
            </p>
         </div>
      </footer>

      {/* Dialogs */}
      <PermissionDialog 
        open={permDialogOpen}
        onOpenChange={setPermDialogOpen}
        permission={activePerm}
        onSubmit={handlePermSubmit}
      />
      
      <RoleDialog 
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        role={activeRole}
        permissions={permissions}
        onSubmit={handleRoleSubmit}
      />
      
      <DeleteConfirmDialog 
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={deleteTarget?.type === "perm" ? "Decommission Capability" : "Decommission Role"}
        entityName={deleteTarget?.data?.name || ""}
        entityDescription={deleteTarget?.data?.description}
        impactWarning={getImpactWarning()}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
