import { useState, useCallback } from "react";
import { servicesApi } from "@/lib/api/services";
import { Service } from "@/types/service";
import { toast } from "sonner";

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(15);
  const [categories, setCategories] = useState<string[]>([]);

  const fetchServices = useCallback(async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    category?: string;
    specialization_id?: string;
    is_active?: boolean;
  }) => {
    setLoading(true);
    try {
      const res = await servicesApi.getServices({
        skip: params?.skip ?? 0,
        limit: params?.limit ?? limit,
        search: params?.search,
        category: params?.category,
        specialization_id: params?.specialization_id,
        is_active: params?.is_active
      });

      if (res.success) {
        setServices(res.data || []);
        if (res.meta?.pagination) {
          setTotal(res.meta.pagination.total);
          setSkip(res.meta.pagination.skip);
          setLimit(res.meta.pagination.limit);
        }
      } else {
        toast.error(res.message || "Failed to fetch services");
      }
    } catch (error) {
      toast.error("An error occurred while fetching services");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await servicesApi.getCategories();
      if (res.success) {
        setCategories(res.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch service categories", error);
    }
  }, []);

  const createService = async (data: any) => {
    try {
      const res = await servicesApi.createService(data);
      if (res.success && res.data) {
        fetchServices({ skip, limit });
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
        fetchServices({ skip, limit });
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
      const res = await servicesApi.deleteService(id);
      if (res.success) {
        fetchServices({ skip, limit });
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
    total,
    skip,
    limit,
    categories,
    fetchServices,
    fetchCategories,
    createService,
    updateService,
    deleteService,
  };
}
