import { useWebSocket } from '@/hooks/useWebSocket';
import { useCallback } from 'react';

interface UseAppointmentWebSocketOptions {
  providerId?: string;
  onEvent?: (event: string, data: any) => void;
  enabled?: boolean;
}

export const useAppointmentWebSocket = ({ 
  providerId, 
  onEvent, 
  enabled = true 
}: UseAppointmentWebSocketOptions) => {
  
  const handleMessage = useCallback((message: any) => {
    if (onEvent) {
      onEvent(message.event, message.data);
    }
  }, [onEvent]);

  // Global Dashboard Channel
  useWebSocket({
    channel: 'dashboard:global',
    enabled,
    onMessage: handleMessage
  });

  // Provider-Specific Queue Channel
  useWebSocket({
    channel: providerId ? `queue:${providerId}` : '',
    enabled: enabled && !!providerId,
    onMessage: handleMessage
  });

  return {};
};
