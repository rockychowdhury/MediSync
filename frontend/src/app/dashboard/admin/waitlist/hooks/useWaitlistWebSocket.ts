import { useWebSocket } from "@/hooks/useWebSocket";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface WebSocketEvent {
  event: string;
  data: any;
  channel: string;
}

export function useWaitlistWebSocket({
  enabled = true,
  serviceIds = [] as string[],
  onRefresh = () => {},
  onEntryAdded = (entry: any) => {},
  onEntryAssigned = (data: any) => {},
  onPositionsUpdated = (serviceId: string) => {},
}) {
  const [subscribedChannels, setSubscribedChannels] = useState<string[]>([]);

  // Calculate channels to subscribe to
  useEffect(() => {
    const channels = ["dashboard:global"];
    serviceIds.forEach(id => {
      channels.push(`waitlist:${id}`);
    });
    setSubscribedChannels(channels);
  }, [serviceIds]);

  const handleMessage = useCallback((event: WebSocketEvent) => {
    const { event: eventName, data } = event;

    switch (eventName) {
      case "waitlist_entry_added":
        onEntryAdded(data);
        // If it's an emergency, we might want a special alert handled here or by the page
        if (data.priority === "emergency") {
          toast.error("⚡ EMERGENCY: New patient added to waitlist!");
        }
        break;

      case "waitlist_assigned":
        onEntryAssigned(data);
        toast.success(`✓ Patient assigned from waitlist - service column updated.`);
        break;

      case "queue_positions_updated":
        onPositionsUpdated(data.service_id);
        break;

      case "waitlist_entry_cancelled":
      case "waitlist_entry_expired":
      case "waitlist_entry_updated":
        onRefresh(); // Simplest approach: refresh when data changes
        break;

      default:
        break;
    }
  }, [onEntryAdded, onEntryAssigned, onPositionsUpdated, onRefresh]);

  // Connect to global channel
  useWebSocket({
    channel: "dashboard:global",
    enabled,
    onMessage: handleMessage,
  });

  // Dynamic subscriptions for service channels
  // Note: Our current useWebSocket might need adjustment to handle multiple channels or dynamic ones better
  // For now, we'll rely on the dashboard:global for core updates and refresh accordingly
  // If we needed specific high-perf per-service updates, we'd add multiple useWebSocket calls or update the hook
}
