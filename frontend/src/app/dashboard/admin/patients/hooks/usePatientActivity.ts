import { useState, useEffect, useCallback } from "react";
import { appointmentsApi } from "@/lib/api/appointments";
import { waitlistApi } from "@/lib/api/waitlist";
import { notificationsApi } from "@/lib/api/notifications";
import { auditApi } from "@/lib/api/audit";
import { toast } from "sonner";

export function usePatientAppointments(patientId: string | null) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = useCallback(async () => {
    if (!patientId) {
      setAppointments([]);
      return;
    }
    setLoading(true);
    try {
      const response = await appointmentsApi.getAppointments({ 
        patient_id: patientId,
        sort: "appointment_start_desc",
        page_size: 100 
      });
      if (response.success) {
        setAppointments(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch patient appointments", error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, loading, refresh: fetchAppointments };
}

export function usePatientWaitlist(patientId: string | null) {
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWaitlist = useCallback(async () => {
    if (!patientId) {
      setWaitlist([]);
      return;
    }
    setLoading(true);
    try {
      const response = await waitlistApi.getWaitlist({ 
        patient_id: patientId,
        sort: "created_at_desc" 
      });
      if (response.success) {
        setWaitlist(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch patient waitlist", error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchWaitlist();
  }, [fetchWaitlist]);

  const removeEntry = async (id: string | number) => {
    try {
      const response = await waitlistApi.deleteWaitlistEntry(id);
      if (response.success) {
        toast.success("Entry removed from waitlist.");
        fetchWaitlist();
      }
    } catch (error) {
      toast.error("Process failed.");
    }
  };

  return { waitlist, loading, refresh: fetchWaitlist, removeEntry };
}

export function usePatientNotifications(patientId: string | null) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!patientId) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      const response = await notificationsApi.getNotifications({ 
        recipient_id: patientId,
        recipient_type: "patient",
        sort: "created_at_desc",
        page_size: 50 
      });
      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch patient notifications", error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const resend = async (id: string | number) => {
    try {
      const response = await notificationsApi.resendNotification(id);
      if (response.success) {
        toast.success("Notification resent.");
        fetchNotifications();
      }
    } catch (error) {
      toast.error("Process failed.");
    }
  };

  return { notifications, loading, refresh: fetchNotifications, resend };
}

export function usePatientAudit(patientId: string | null) {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAudit = useCallback(async () => {
    if (!patientId) {
      setAuditLogs([]);
      return;
    }
    setLoading(true);
    try {
      const response = await auditApi.getLogs({ 
        entity_type: "patient", 
        entity_id: Number(patientId), // Map back to number if API expects it
        sort: "created_at_desc",
        page_size: 50 
      } as any);
      if (response.success) {
        setAuditLogs(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch patient audit", error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  return { auditLogs, loading, refresh: fetchAudit };
}
