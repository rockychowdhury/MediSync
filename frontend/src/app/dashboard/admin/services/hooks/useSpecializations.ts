import { useState, useCallback } from "react";
import { specializationsApi } from "@/lib/api/specializations";
import { Specialization } from "@/types/provider";
import { toast } from "sonner";

export function useSpecializations() {
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(15);

  const fetchSpecializations = useCallback(async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
  }) => {
    setLoading(true);
    try {
      const res = await specializationsApi.getSpecializations({
        skip: params?.skip ?? 0,
        limit: params?.limit ?? limit,
        search: params?.search
      });

      if (res.success) {
        setSpecializations(res.data || []);
        if (res.meta?.pagination) {
          setTotal(res.meta.pagination.total);
          setSkip(res.meta.pagination.skip);
          setLimit(res.meta.pagination.limit);
        }
      } else {
        toast.error(res.message || "Failed to fetch specializations");
      }
    } catch (error) {
      toast.error("An error occurred while fetching specializations");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const createSpecialization = async (data: { name: string, description?: string }) => {
    try {
      const res = await specializationsApi.createSpecialization(data);
      if (res.success && res.data) {
        fetchSpecializations({ skip, limit });
        toast.success(`Specialization created: ${res.data.name}`);
        return res.data;
      } else {
        toast.error(res.message || "Failed to create specialization");
      }
    } catch (error) {
      toast.error("An error occurred while creating specialization");
    }
    return null;
  };

  const updateSpecialization = async (id: string, data: { name: string, description?: string }) => {
    try {
      const res = await specializationsApi.updateSpecialization(id, data);
      if (res.success && res.data) {
        fetchSpecializations({ skip, limit });
        toast.success("Specialization updated");
        return res.data;
      } else {
        toast.error(res.message || "Failed to update specialization");
      }
    } catch (error) {
      toast.error("An error occurred while updating specialization");
    }
    return null;
  };

  const deleteSpecialization = async (id: string) => {
    try {
      const res = await specializationsApi.deleteSpecialization(id);
      if (res.success) {
        fetchSpecializations({ skip, limit });
        toast.success("Specialization deleted");
        return true;
      } else {
        toast.error(res.message || "Failed to delete specialization");
      }
    } catch (error) {
      toast.error("An error occurred while deleting specialization");
    }
    return false;
  };

  return {
    specializations,
    loading,
    total,
    skip,
    limit,
    fetchSpecializations,
    createSpecialization,
    updateSpecialization,
    deleteSpecialization,
  };
}
