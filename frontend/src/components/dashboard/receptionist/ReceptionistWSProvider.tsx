"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { appointmentsApi } from "@/lib/api/appointments";
import type { Appointment } from "@/types/appointment";
import type { QueueEntry } from "@/types/queue";

interface ReceptionistWSContextValue {
  isConnected: boolean;
  liveCounts: Record<string, number>;
}

const ReceptionistWSContext = createContext<ReceptionistWSContextValue>({
  isConnected: false,
  liveCounts: {},
});

export function useReceptionistWS() {
  return useContext(ReceptionistWSContext);
}

export function ReceptionistWSProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempt = useRef(0);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Use absolute URL pointing to backend
    // Typically in Next.js you'd proxy or connect directly
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api/v1/ws/dashboard:global";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttempt.current = 0;
      console.log("Global WS connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
      
      // Reconnection backoff strategy: 3s -> 15s -> 60s max
      const delay = Math.min(3000 * Math.pow(2, reconnectAttempt.current), 60000);
      reconnectAttempt.current += 1;
      
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };

    ws.onerror = (error) => {
      console.error("WS Error:", error);
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const handleMessage = (message: any) => {
    switch (message.type) {
      case "live_count_update":
        setLiveCounts(prev => ({
          ...prev,
          [message.data.key]: message.data.count
        }));
        break;
        
      case "waitlist_alert":
        if (message.data.priority === "emergency") {
          toast.error(`Emergency: ${message.data.patient_name} joined waitlist`, {
            duration: 8000,
            description: `Requires immediate attention for ${message.data.service_name}`
          });
        }
        break;
        
      case "appointment_auto_assigned":
        toast.success(`Slot Auto-Assigned`, {
          description: `${message.data.patient_name} assigned to ${message.data.provider_name} at ${message.data.time}`
        });
        break;
        
      // Future implementations: listen to specific data changes to trigger SWR/React Query invalidations
    }
  };

  return (
    <ReceptionistWSContext.Provider value={{ isConnected, liveCounts }}>
      {children}
    </ReceptionistWSContext.Provider>
  );
}
