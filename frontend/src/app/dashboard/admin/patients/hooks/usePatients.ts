import { useState, useEffect, useCallback, useRef } from "react";
import { patientsApi } from "@/lib/api/patients";
import { toast } from "sonner";

export interface PatientFilters {
  search: string;
  status: "active" | "inactive" | "all";
  sort: "name_asc" | "name_desc" | "newest" | "oldest" | "last_visit";
  notificationOptOut: boolean;
  hasUpcoming: boolean;
}

export function usePatients() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 30;

  const [filters, setFilters] = useState<PatientFilters>({
    search: "",
    status: "active",
    sort: "name_asc",
    notificationOptOut: false,
    hasUpcoming: false,
  });

  const fetchPatients = useCallback(async (isInitial = true) => {
    if (isInitial) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const params: any = {
        page: isInitial ? 1 : page + 1,
        page_size: pageSize,
        search: filters.search || undefined,
        sort: filters.sort,
        notification_opt_out: filters.notificationOptOut || undefined,
        has_upcoming: filters.hasUpcoming || undefined,
      };

      if (filters.status !== "all") {
        params.is_active = filters.status === "active";
      }

      const response = await patientsApi.getPatients(params);
      
      if (response.success) {
        const newData = response.data || [];
        setPatients(prev => isInitial ? newData : [...prev, ...newData]);
        setHasMore(newData.length === pageSize);
        setTotalCount(response.meta?.pagination?.total || 0);
        if (!isInitial) setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error("Failed to fetch patients", error);
      toast.error("Failed to load patient records");
    } finally {
      if (isInitial) setLoading(false);
      else setLoadingMore(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchPatients(true);
  }, [filters.search, filters.status, filters.sort, filters.notificationOptOut, filters.hasUpcoming]);

  const updateFilters = (newFilters: Partial<PatientFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchPatients(false);
    }
  };

  return {
    patients,
    loading,
    loadingMore,
    hasMore,
    totalCount,
    filters,
    updateFilters,
    loadMore,
    refresh: () => fetchPatients(true),
  };
}
