import { useState, useEffect, useCallback } from "react";
import { providersApi } from "@/lib/api/providers";
import { toast } from "sonner";

export interface ProviderFilters {
  search: string;
  status: string;
  specialization_id: number | null;
  showInactive: boolean;
}

export function useProviders() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProviderFilters>({
    search: "",
    status: "all",
    specialization_id: null,
    showInactive: false,
  });

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.status !== "all") params.status = filters.status;
      if (filters.specialization_id) params.specialization_id = filters.specialization_id;
      if (filters.search) params.search = filters.search;
      
      const response = await providersApi.getProviders(params);
      if (response.success) {
        // Filter inactive on client side if not desired, or handle via API if supported
        let data = response.data || [];
        if (!filters.showInactive) {
          data = data.filter((p: any) => p.user?.is_active !== false);
        }
        setProviders(data);
      }
    } catch (error) {
      console.error("Failed to fetch providers", error);
      toast.error("Failed to load clinical workforce");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const updateFilters = (newFilters: Partial<ProviderFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    providers,
    loading,
    filters,
    updateFilters,
    refresh: fetchProviders,
  };
}
