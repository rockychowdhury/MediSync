import { useState } from 'react';
import { appointmentsApi } from '@/lib/api/appointments';
import { toast } from 'sonner';

export const useAppointmentActions = (onSuccess?: () => void) => {
  const [processing, setProcessing] = useState(false);

  const updateStatus = async (id: string, status: string, reason?: string) => {
    setProcessing(true);
    try {
      const res = await appointmentsApi.updateStatus(id, status, reason);
      if (res.success) {
        toast.success("Status Updated", { 
          description: `Appointment is now set to ${status}.` 
        });
        if (onSuccess) onSuccess();
      } else {
        toast.error("Process Failed", { description: res.message || "Failed to update status." });
      }
    } catch (error: any) {
      toast.error("Network Error", { 
        description: error.response?.data?.detail || "Could not connect to the clinical server." 
      });
    } finally {
      setProcessing(false);
    }
  };

  const bulkUpdateStatus = async (ids: string[], status: string, reason?: string) => {
    setProcessing(true);
    try {
      const res = await appointmentsApi.bulkUpdateStatus(ids, status, reason);
      if (res.success) {
        toast.success("Batch Updated", { 
          description: `Successfully updated ${res.data.success_count} records.` 
        });
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      toast.error("Batch Failed", { 
        description: error.response?.data?.detail || "Failed to process bulk status change." 
      });
    } finally {
      setProcessing(false);
    }
  };

  const reschedule = async (id: string, data: any) => {
    setProcessing(true);
    try {
      const res = await appointmentsApi.reschedule(id, data);
      if (res.success) {
        toast.success("Appointment Rescheduled", { 
          description: "New slot has been confirmed and synced." 
        });
        if (onSuccess) onSuccess();
        return true;
      }
    } catch (error: any) {
      toast.error("Reschedule Conflict", { 
        description: error.response?.data?.detail || "Could not move appointment to the requested slot." 
      });
    } finally {
      setProcessing(false);
    }
    return false;
  };

  return {
    updateStatus,
    bulkUpdateStatus,
    reschedule,
    processing
  };
};
