import { useState, useEffect, useCallback } from "react";
import { providersApi } from "@/lib/api/providers";
import { toast } from "sonner";

export function useProviderDetail(providerId: string | null) {
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!providerId) {
      setProvider(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await providersApi.getProviderById(providerId);
      if (response.success) {
        setProvider(response.data);
      } else {
        setError("Provider not found");
      }
    } catch (err) {
      console.error("Failed to fetch provider detail", err);
      setError("Failed to load clinical profile");
      toast.error("Internal clinical data synchronization failed");
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const updateStatus = async (status: string) => {
    if (!providerId) return;
    try {
      const response = await providersApi.updateProviderStatus(providerId, status);
      if (response.success) {
          setProvider(prev => ({ ...prev, status }));
          toast.success(`Provider presence set to ${status}`);
      }
    } catch (error) {
      toast.error("Failed to update clinical presence");
    }
  };

  return {
    provider,
    loading,
    error,
    updateStatus,
    refresh: fetchDetail,
  };
}
