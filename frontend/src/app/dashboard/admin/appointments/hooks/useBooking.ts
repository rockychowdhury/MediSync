import { useState, useCallback, useEffect } from 'react';
import { providersApi } from '@/lib/api/providers';
import { servicesApi } from '@/lib/api/services';
import { patientsApi } from '@/lib/api/patients';
import { appointmentsApi } from '@/lib/api/appointments';
import { toast } from 'sonner';

export const useBooking = (onSuccess?: () => void) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Data for selections
  const [patients, setPatients] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);

  // Selected state
  const [bookingData, setBookingData] = useState<any>({
    patient_id: '',
    provider_id: '',
    service_id: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    notes: '',
    priority: 'standard',
    override_capacity: false,
    override_reason: ''
  });

  // Load initial data
  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      try {
        const [pRes, sRes] = await Promise.all([
          providersApi.getProviders(),
          servicesApi.getServices()
        ]);
        if (pRes.success) setProviders(pRes.data);
        if (sRes.success) setServices(sRes.data);
      } catch (err) {
        toast.error("Failed to load booking resources.");
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, []);

  // Fetch slots when provider, service, or date changes
  useEffect(() => {
    if (bookingData.provider_id && bookingData.service_id && bookingData.date) {
      const fetchSlots = async () => {
        try {
          const res = await appointmentsApi.getAvailableSlots(
            bookingData.provider_id, 
            bookingData.date, 
            bookingData.service_id
          );
          if (res.success) {
            setAvailableSlots(res.data.slots || []);
          }
        } catch (err) {
          console.error("Failed to fetch slots", err);
        }
      };
      fetchSlots();
    }
  }, [bookingData.provider_id, bookingData.service_id, bookingData.date]);

  const searchPatients = useCallback(async (query: string) => {
    if (query.length < 2) return;
    try {
      const res = await patientsApi.getPatients({ search: query, limit: 5 });
      if (res.success) setPatients(res.data);
    } catch (err) {
      console.error("Patient search failed", err);
    }
  }, []);

  const updateBookingData = (data: Partial<typeof bookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const confirmBooking = async () => {
    setSubmitting(true);
    try {
      // Validate emergency override
      if (bookingData.override_capacity && !bookingData.override_reason) {
        toast.error("Validation Error", { description: "Override reason is required." });
        setSubmitting(false);
        return;
      }

      const payload = {
        patient_id: bookingData.patient_id,
        provider_id: bookingData.provider_id,
        service_id: bookingData.service_id,
        appointment_start: bookingData.start_time,
        appointment_end: bookingData.end_time,
        notes: bookingData.notes,
        priority: bookingData.priority,
        override_capacity: bookingData.override_capacity,
        override_reason: bookingData.override_reason
      };

      const res = await appointmentsApi.createAppointment(payload);
      if (res.success) {
        toast.success("Appointment Confirmed", { 
          description: `Booking ${res.data.appointment_number} has been created.` 
        });
        if (onSuccess) onSuccess();
        return true;
      }
    } catch (err: any) {
      toast.error("Booking Conflict", { 
        description: err.response?.data?.detail || "The selected slot is no longer available." 
      });
    } finally {
      setSubmitting(false);
    }
    return false;
  };

  return {
    step,
    patients,
    providers,
    services,
    availableSlots,
    bookingData,
    loading,
    submitting,
    searchPatients,
    updateBookingData,
    nextStep,
    prevStep,
    confirmBooking,
    setStep
  };
};
