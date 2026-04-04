import { useState, useCallback } from "react";
import { specializationsApi } from "@/lib/api/specializations";
import { Specialization } from "@/types/provider";
import { toast } from "sonner";

export function useSpecializations() {
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSpecializations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await specializationsApi.getSpecializations();
      if (res.success) {
        setSpecializations(res.data || []);
      } else {
        toast.error(res.message || "Failed to fetch specializations");
      }
    } catch (error) {
      toast.error("An error occurred while fetching specializations");
    } finally {
      setLoading(false);
    }
  }, []);

  const createSpecialization = async (data: { name: string }) => {
    try {
      const res = await specializationsApi.createSpecialization(data);
      if (res.success && res.data) {
        setSpecializations((prev) => [...prev, res.data!]);
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

  const updateSpecialization = async (id: string, data: { name: string }) => {
    try {
      const res = await specializationsApi.updateSpecialization(id, data);
      if (res.success && res.data) {
        setSpecializations((prev) =>
          prev.map((s) => (s.id === id ? res.data! : s))
        );
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
        setSpecializations((prev) => prev.filter((s) => s.id !== id));
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
    fetchSpecializations,
    createSpecialization,
    updateSpecialization,
    deleteSpecialization,
  };
}
