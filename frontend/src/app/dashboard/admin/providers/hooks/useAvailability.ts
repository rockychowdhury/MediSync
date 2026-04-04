import { useState, useEffect, useCallback } from "react";
import { availabilityApi } from "@/lib/api/availability";
import { toast } from "sonner";

export function useAvailability(providerId: string | null) {
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAvailability = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    try {
      const response = await availabilityApi.getAvailability(providerId);
      if (response.success) {
        setAvailability(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch availability", error);
      toast.error("Failed to load clinical schedule");
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const addBlock = async (data: any) => {
    try {
      const response = await availabilityApi.createAvailability({
        ...data,
        provider_id: providerId,
      });
      if (response.success) {
        setAvailability(prev => [...prev, response.data]);
        toast.success("Schedule block added");
      }
    } catch (error) {
      toast.error("Failed to add schedule block");
    }
  };

  const updateBlock = async (id: number, data: any) => {
    try {
      const response = await availabilityApi.updateAvailability(id, data);
      if (response.success) {
        setAvailability(prev => prev.map(b => (b.id === id ? response.data : b)));
        toast.success("Schedule block updated");
      }
    } catch (error) {
      toast.error("Failed to update schedule block");
    }
  };

  const removeBlock = async (id: number) => {
    try {
      const response = await availabilityApi.deleteAvailability(id);
      if (response.success) {
        setAvailability(prev => prev.filter(b => b.id !== id));
        toast.success("Schedule block removed");
      }
    } catch (error) {
      toast.error("Failed to remove schedule block");
    }
  };

  return {
    availability,
    loading,
    addBlock,
    updateBlock,
    removeBlock,
    refresh: fetchAvailability,
  };
}
