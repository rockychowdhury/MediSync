import { useState, useCallback } from "react";
import { rbacApi, Role, UserSimple } from "@/lib/api/rbac";
import { toast } from "sonner";

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rbacApi.getRoles();
      if (res.success) {
        setRoles(res.data || []);
      } else {
        toast.error(res.message || "Failed to fetch roles");
      }
    } catch (error) {
      toast.error("An error occurred while fetching roles");
    } finally {
      setLoading(false);
    }
  }, []);

  const createRole = async (data: { name: string; description?: string }) => {
    try {
      const res = await rbacApi.createRole(data);
      if (res.success && res.data) {
        setRoles((prev) => [...prev, res.data!]);
        toast.success(`Role created: ${res.data.name}`);
        return res.data;
      } else {
        toast.error(res.message || "Failed to create role");
      }
    } catch (error) {
      toast.error("An error occurred while creating role");
    }
    return null;
  };

  const updateRole = async (id: number, data: { description: string }) => {
    try {
      const res = await rbacApi.updateRole(id, data);
      if (res.success && res.data) {
        setRoles((prev) =>
          prev.map((r) => (r.id === id ? res.data! : r))
        );
        toast.success("Role updated");
        return res.data;
      } else {
        toast.error(res.message || "Failed to update role");
      }
    } catch (error) {
      toast.error("An error occurred while updating role");
    }
    return null;
  };

  const deleteRole = async (id: number) => {
    try {
      const res = await rbacApi.deleteRole(id);
      if (res.success) {
        setRoles((prev) => prev.filter((r) => r.id !== id));
        toast.success("Role deleted");
        return true;
      } else {
        toast.error(res.message || "Failed to delete role");
      }
    } catch (error) {
      toast.error("An error occurred while deleting role");
    }
    return false;
  };

  const fetchRoleUsers = async (roleId: number): Promise<UserSimple[]> => {
    try {
      const res = await rbacApi.getRoleUsers(roleId);
      if (res.success && res.data) {
        return res.data;
      }
    } catch (error) {
      console.error("Failed to fetch role users", error);
    }
    return [];
  };

  return {
    roles,
    setRoles,
    loading,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    fetchRoleUsers,
  };
}
