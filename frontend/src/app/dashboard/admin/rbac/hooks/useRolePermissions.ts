import { useState, useCallback } from "react";
import { rbacApi, Role } from "@/lib/api/rbac";
import { toast } from "sonner";

export function useRolePermissions() {
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<number, Set<number>>>({});
  const [pendingCells, setPendingCells] = useState<Set<string>>(new Set());

  const initializeMap = useCallback((roles: Role[]) => {
    const map: Record<number, Set<number>> = {};
    roles.forEach((role) => {
      map[role.id] = new Set(role.permissions.map((p) => p.id));
    });
    setRolePermissionsMap(map);
  }, []);

  const assignPermission = async (roleId: number, permissionId: number) => {
    const cellKey = `${roleId}:${permissionId}`;
    setPendingCells((prev) => {
      const next = new Set(prev);
      next.add(cellKey);
      return next;
    });

    try {
      // Current API expects a list of IDs to OVERWRITE or MERGE.
      // Our backend assign_permissions merges, but we might want to just send the one ID if we had an endpoint.
      // But based on user feedback, we use individual calls. 
      // The current backend assign_role_permissions takes RolePermissionUpdate { permission_ids: list[int] }
      // This is a bit inefficient for single toggle but works.
      
      const currentPermissions = Array.from(rolePermissionsMap[roleId] || []);
      const res = await rbacApi.assignRolePermissions(roleId, [permissionId]);
      
      if (res.success) {
        setRolePermissionsMap((prev) => {
          const next = { ...prev };
          if (!next[roleId]) next[roleId] = new Set();
          next[roleId].add(permissionId);
          return next;
        });
      } else {
        toast.error(res.message || "Failed to assign permission");
      }
    } catch (error) {
      toast.error("An error occurred while assigning permission");
    } finally {
      setPendingCells((prev) => {
        const next = new Set(prev);
        next.delete(cellKey);
        return next;
      });
    }
  };

  const revokePermission = async (roleId: number, permissionId: number) => {
    const cellKey = `${roleId}:${permissionId}`;
    setPendingCells((prev) => {
      const next = new Set(prev);
      next.add(cellKey);
      return next;
    });

    try {
      const res = await rbacApi.revokeRolePermission(roleId, permissionId);
      if (res.success) {
        setRolePermissionsMap((prev) => {
          const next = { ...prev };
          if (next[roleId]) {
            next[roleId].delete(permissionId);
          }
          return next;
        });
      } else {
        toast.error(res.message || "Failed to revoke permission");
      }
    } catch (error) {
      toast.error("An error occurred while revoking permission");
    } finally {
      setPendingCells((prev) => {
        const next = new Set(prev);
        next.delete(cellKey);
        return next;
      });
    }
  };

  return {
    rolePermissionsMap,
    pendingCells,
    initializeMap,
    assignPermission,
    revokePermission,
    setRolePermissionsMap,
  };
}
