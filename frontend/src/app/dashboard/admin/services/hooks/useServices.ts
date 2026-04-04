import { useState, useCallback } from "react";
import { servicesApi } from "@/lib/api/services";
import { Service } from "@/types/service";
import { toast } from "sonner";

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await servicesApi.getServices();
      if (res.success) {
        setServices(res.data || []);
      } else {
        toast.error(res.message || "Failed to fetch services");
      }
    } catch (error) {
      toast.error("An error occurred while fetching services");
    } finally {
      setLoading(false);
    }
  }, []);

  const createService = async (data: { 
    name: string; 
    duration_minutes: number; 
    required_specialization_id: string;
    is_active?: boolean;
  }) => {
    try {
      const res = await servicesApi.createService(data);
      if (res.success && res.data) {
        setServices((prev) => [...prev, res.data!]);
        toast.success(`Service created: ${res.data.name}`);
        return res.data;
      } else {
        toast.error(res.message || "Failed to create service");
      }
    } catch (error) {
      toast.error("An error occurred while creating service");
    }
    return null;
  };

  const updateService = async (id: string, data: Partial<Service>) => {
    try {
      const res = await servicesApi.updateService(id, data);
      if (res.success && res.data) {
        setServices((prev) =>
          prev.map((s) => (s.id === id ? res.data! : s))
        );
        toast.success("Service updated");
        return res.data;
      } else {
        toast.error(res.message || "Failed to update service");
      }
    } catch (error) {
      toast.error("An error occurred while updating service");
    }
    return null;
  };

  const deleteService = async (id: string) => {
    try {
      // Assuming delete endpoint exists based on implementation patterns
      const res = await servicesApi.deleteService(id);
      if (res.success) {
        setServices((prev) => prev.filter((s) => s.id !== id));
        toast.success("Service deleted");
        return true;
      } else {
        toast.error(res.message || "Failed to delete service");
      }
    } catch (error) {
      toast.error("An error occurred while deleting service");
    }
    return false;
  };

  return {
    services,
    loading,
    fetchServices,
    createService,
    updateService,
    deleteService,
  };
}
