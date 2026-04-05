import { useState, useEffect, useCallback } from "react";
import { patientsApi } from "@/lib/api/patients";
import { toast } from "sonner";

export function usePatientDetail(patientId: string | null) {
  const [patient, setPatient] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!patientId) {
      setPatient(null);
      setStats(null);
      return;
    }

    setLoading(true);
    try {
      const response = await patientsApi.getPatient(patientId);
      if (response.success) {
        setPatient(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch patient detail", error);
      toast.error("Failed to load patient record");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const fetchStats = useCallback(async () => {
    if (!patientId) return;

    setStatsLoading(true);
    try {
      const response = await patientsApi.getPatientStats(patientId);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch patient stats", error);
    } finally {
      setStatsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchDetail();
    fetchStats();
  }, [fetchDetail, fetchStats]);

  const updateStatus = async (isActive: boolean) => {
    if (!patientId) return;
    try {
      const response = isActive 
        ? await patientsApi.activatePatient(patientId) 
        : await patientsApi.deactivatePatient(patientId);
      
      if (response.success) {
        toast.success(`Patient record ${isActive ? "reactivated" : "deactivated"}`);
        fetchDetail();
      }
    } catch (error) {
      toast.error("Process failed");
    }
  };

  return {
    patient,
    stats,
    loading,
    statsLoading,
    refresh: fetchDetail,
    refreshStats: fetchStats,
    updateStatus,
  };
}
