import { useState, useEffect, useCallback, useMemo } from 'react';
import { waitlistApi } from '@/lib/api/waitlist';
import { toast } from 'sonner';

export interface WaitlistFilters {
  serviceId?: string;
  providerId?: string;
  status?: string; // comma-separated
  priority?: string; // comma-separated
  search?: string;
  requestedDate?: string;
}

export function useWaitlist(initialFilters: WaitlistFilters = { status: 'waiting' }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<WaitlistFilters>(initialFilters);
  const [stats, setStats] = useState<any>(null);
  const [pagination, setPagination] = useState({ total: 0, skip: 0, limit: 50 });

  const fetchWaitlist = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        skip: pagination.skip,
        limit: pagination.limit,
      };
      
      const res = await waitlistApi.getWaitlist(params);
      if (res.success) {
        setEntries(res.data || []);
        setPagination(prev => ({ ...prev, total: res.pagination?.total || 0 }));
      }
    } catch (err) {
      console.error('Failed to fetch waitlist', err);
      toast.error('Failed to load waitlist entries');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.skip, pagination.limit]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await waitlistApi.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  }, []);

  useEffect(() => {
    fetchWaitlist();
    fetchStats();
  }, [fetchWaitlist, fetchStats]);

  const updateFilters = useCallback((newFilters: Partial<WaitlistFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, skip: 0 })); // Reset to first page on filter change
  }, []);

  const refresh = useCallback(() => {
    fetchWaitlist();
    fetchStats();
  }, [fetchWaitlist, fetchStats]);

  // Group entries by service for column view
  const entriesByService = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    entries.forEach(entry => {
      const sId = entry.service_id;
      if (!grouped[sId]) grouped[sId] = [];
      grouped[sId].push(entry);
    });
    return grouped;
  }, [entries]);

  return {
    entries,
    entriesByService,
    loading,
    stats,
    filters,
    pagination,
    updateFilters,
    setPagination,
    refresh,
    setEntries // For optimistic updates from WebSockets
  };
}
