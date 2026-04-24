import { useState, useEffect, useCallback } from 'react';
import { appointmentsApi } from '@/lib/api/appointments';
import { toast } from 'sonner';
import { useSearchParams, useRouter } from 'next/navigation';

export const useAppointments = (initialFilters: any = {}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Sync filters with URL if needed, but let's keep it in state for now
  const [filters, setFilters] = useState({
    skip: 0,
    limit: 10,
    status: searchParams.get('status') || undefined,
    provider_id: searchParams.get('provider_id') || undefined,
    search: searchParams.get('search') || undefined,
    ...initialFilters
  });
  
  const [pagination, setPagination] = useState({ total: 0, skip: 0, limit: 10 });

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentsApi.getAppointments(filters);
      if (res.success) {
        setAppointments(res.data || []);
        if (res.meta?.pagination) {
          setPagination(res.meta.pagination);
        }
      }
    } catch (error) {
      console.error("Failed to load appointments", error);
      toast.error("Network Error", { description: "Could not fetch clinical records." });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await appointmentsApi.getTodayStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error("Failed to load stats", error);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const updateFilters = (newFilters: any) => {
    setFilters((prev: any) => ({ ...prev, ...newFilters, skip: 0 }));
    // Optional: Sync with URL
  };

  const handlePageChange = (newSkip: number) => {
    setFilters((prev: any) => ({ ...prev, skip: newSkip }));
  };

  return {
    appointments,
    stats,
    loading,
    filters,
    pagination,
    updateFilters,
    handlePageChange,
    refresh: () => { 
      fetchAppointments(); 
      fetchStats(); 
    }
  };
};
