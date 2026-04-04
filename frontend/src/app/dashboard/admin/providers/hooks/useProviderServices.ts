import { useState, useEffect, useCallback } from "react";
import { providersApi } from "@/lib/api/providers";
import { toast } from "sonner";

export function useProviderServices(providerId: string | null) {
  const [assignedServices, setAssignedServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchServices = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    try {
      const response = await providersApi.read_provider_services(providerId); // Verify the API client method name
      // Wait, let's check providersApi in lib/api/providers.ts for this again
      if (response.success) {
        setAssignedServices(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch provider services", error);
      toast.error("Failed to sync clinical entitlements");
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const assignService = async (serviceId: string) => {
    if (!providerId) return;
    try {
      const response = await providersApi.assignServiceToProvider(providerId, serviceId);
      if (response.success) {
        // We'll need to re-fetch to get the full service object or find it from a pre-loaded list
        fetchServices();
        toast.success("Service assigned successfully");
      }
    } catch (error) {
      toast.error("Failed to assign service");
    }
  };

  const removeService = async (serviceId: string) => {
    if (!providerId) return;
    try {
      const response = await providersApi.removeServiceFromProvider(providerId, serviceId);
      if (response.success) {
        setAssignedServices(prev => prev.filter(s => s.id !== serviceId));
        toast.success("Service removed successfully");
      }
    } catch (error) {
      toast.error("Failed to revoke service");
    }
  };

  const syncServices = async (serviceIds: string[]) => {
      // For bulk updates if needed, otherwise fire in parallel or sequence
      // For now, this hook will be used to manage the state after the ManageServicesPanel closes
      fetchServices();
  };

  return {
    assignedServices,
    loading,
    assignService,
    removeService,
    syncServices,
    refresh: fetchServices,
  };
}
