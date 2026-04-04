import { useState, useEffect, useCallback } from "react";
import { providersApi } from "@/lib/api/providers";
import { toast } from "sonner";

export function useTimeOff(providerId: string | null) {
  const [timeOff, setTimeOff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTimeOff = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    try {
      const response = await providersApi.getProviderTimeOff(providerId);
      if (response.success) {
        setTimeOff(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch time off", error);
      toast.error("Failed to load clinical leave history");
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    fetchTimeOff();
  }, [fetchTimeOff]);

  const addTimeOff = async (data: any) => {
    try {
      const response = await providersApi.promoteToProvider(data); // This is just a placeholder endpoint for now until we define time-off creation specifically
      // Wait, we should use a proper endpoint when available
      if (response.success) {
        setTimeOff(prev => [...prev, response.data]);
        toast.success("Planned leave registered");
      }
    } catch (error) {
      toast.error("Failed to register leave");
    }
  };

  const approveRequest = async (id: number) => {
    try {
      const response = await providersApi.approveTimeOff(id);
      if (response.success) {
        setTimeOff(prev => prev.map(t => (t.id === id ? { ...t, is_approved: true, status: 'approved' } : t)));
        toast.success("Leave request approved");
      }
    } catch (error) {
      toast.error("Approval failed");
    }
  };

  const rejectRequest = async (id: number, reason: string) => {
    try {
      const response = await providersApi.rejectTimeOff(id, reason);
      if (response.success) {
        setTimeOff(prev => prev.map(t => (t.id === id ? { ...t, is_approved: false, status: 'rejected' } : t)));
        toast.success("Leave request rejected");
      }
    } catch (error) {
      toast.error("Rejection failed");
    }
  };

  return {
    timeOff,
    loading,
    addTimeOff,
    approveRequest,
    rejectRequest,
    refresh: fetchTimeOff,
  };
}
