"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { PageHeader } from "@/components/dashboard/ui/PageHeader";
import { 
  ShieldCheck, 
  Settings2, 
  Activity,
  Layers
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
  const [activeTab, setActiveTab] = useState("matrix");
  
  // Dialog States
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [activePerm, setActivePerm] = useState<Permission | null>(null);
  
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "perm" | "role"; data: any } | null>(null);

  const loadData = useCallback(async () => {
    await Promise.all([fetchPermissions(), fetchRoles()]);
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
        await assignPermission(newRole.id, data.initialPermissions[0]); 
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
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="shrink-0 px-1">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
             <PageHeader 
               breadcrumbs={["Home", "Admin", "Access Governance"]} 
               title="Institutional RBAC Registry" 
             />
             <p className="text-xs font-semibold text-slate-500 max-w-2xl leading-relaxed mt-[-20px]">
               Manage global security policy through granular capability definitions and institutional role matrices. 
               All changes are applied in real-time across active operational sessions.
             </p>
          </div>
        </header>

        {/* Modern Tab Navigation (Centered) */}
        <div className="flex justify-center mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-fit">
            <TabsList className="bg-slate-100/80 backdrop-blur p-1.5 rounded-2xl border border-slate-200">
              <TabsTrigger 
                value="matrix" 
                className="rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
              >
                <Layers className="w-3.5 h-3.5 mr-2" />
                Permission Matrix
              </TabsTrigger>
              <TabsTrigger 
                value="capabilities" 
                className="rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
              >
                <Settings2 className="w-3.5 h-3.5 mr-2" />
                Capabilities
              </TabsTrigger>
              <TabsTrigger 
                value="roles" 
                className="rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-2" />
                Institutional Roles
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Conditional Section Rendering */}
      <div className="flex-1 min-h-0 overflow-auto pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
          <TabsContent value="matrix" className="m-0 h-full">
            <div className="space-y-6 pt-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 px-1">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
                   <Layers className="w-5 h-5" />
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
            </div>
          </TabsContent>

          <TabsContent value="capabilities" className="m-0 h-full">
            <div className="space-y-6 pt-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 px-1">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                   <Settings2 className="w-5 h-5" />
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
            </div>
          </TabsContent>

          <TabsContent value="roles" className="m-0 h-full">
            <div className="space-y-6 pt-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 px-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
                   <ShieldCheck className="w-5 h-5" />
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
                onManageInMatrix={() => setActiveTab("matrix")}
                fetchUsers={fetchRoleUsers}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

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
