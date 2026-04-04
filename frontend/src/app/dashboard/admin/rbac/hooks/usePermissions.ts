import { useState, useCallback } from "react";
import { rbacApi, Permission } from "@/lib/api/rbac";
import { toast } from "sonner";

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rbacApi.getPermissions();
      if (res.success) {
        setPermissions(res.data || []);
      } else {
        toast.error(res.message || "Failed to fetch permissions");
      }
    } catch (error) {
      toast.error("An error occurred while fetching permissions");
    } finally {
      setLoading(false);
    }
  }, []);

  const createPermission = async (data: { name: string; description?: string }) => {
    try {
      const res = await rbacApi.createPermission(data);
      if (res.success && res.data) {
        setPermissions((prev) => [...prev, res.data!]);
        toast.success(`Permission created: ${res.data.name}`);
        return res.data;
      } else {
        toast.error(res.message || "Failed to create permission");
      }
    } catch (error) {
      toast.error("An error occurred while creating permission");
    }
    return null;
  };

  const updatePermission = async (id: number, data: { description: string }) => {
    try {
      const res = await rbacApi.updatePermission(id, data);
      if (res.success && res.data) {
        setPermissions((prev) =>
          prev.map((p) => (p.id === id ? res.data! : p))
        );
        toast.success("Permission updated");
        return res.data;
      } else {
        toast.error(res.message || "Failed to update permission");
      }
    } catch (error) {
      toast.error("An error occurred while updating permission");
    }
    return null;
  };

  const deletePermission = async (id: number) => {
    try {
      const res = await rbacApi.deletePermission(id);
      if (res.success) {
        setPermissions((prev) => prev.filter((p) => p.id !== id));
        toast.success("Permission deleted");
        return true;
      } else {
        toast.error(res.message || "Failed to delete permission");
      }
    } catch (error) {
      toast.error("An error occurred while deleting permission");
    }
    return false;
  };

  return {
    permissions,
    setPermissions,
    loading,
    fetchPermissions,
    createPermission,
    updatePermission,
    deletePermission,
  };
}
