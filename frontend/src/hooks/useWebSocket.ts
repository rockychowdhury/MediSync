import { useEffect, useRef, useState } from "react";

interface WebSocketMessage {
  event: string;
  data: any;
  timestamp: string;
  channel: string;
}

interface UseWebSocketOptions {
  channel: string;
  onMessage?: (message: WebSocketMessage) => void;
  enabled?: boolean;
  token?: string | null;
}

export function useWebSocket({ channel, onMessage, enabled = true, token = null }: UseWebSocketOptions) {

  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Store onMessage in a ref so it never causes reconnections
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!enabled) {
      // Clean up any existing connection when disabled
      if (wsRef.current) {
        wsRef.current.close(1000, "Disabled");
        wsRef.current = null;
      }
      return;
    }

    let unmounted = false;

    function connect() {
      if (unmounted) return;

      // Close any stale connection first
      if (wsRef.current) {
        wsRef.current.close(1000, "Reconnecting");
        wsRef.current = null;
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      let wsUrl = `${protocol}//${host}/api/v1/ws/${channel}`;

      if (token) {
        wsUrl += `?token=${token}`;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmounted) { ws.close(); return; }
        setIsConnected(true);
        console.log(`[WebSocket] Connected to channel: ${channel}`);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessageRef.current?.(message);
        } catch (error) {
          console.error(`[WebSocket] Failed to parse message from ${channel}:`, error);
        }
      };

      ws.onclose = (event) => {
        if (unmounted) return;
        setIsConnected(false);
        console.log(`[WebSocket] Closed: ${channel} (Code: ${event.code}, Reason: ${event.reason || "None"})`);

        // Only auto-reconnect if not intentionally closed by us or disabled
        if (event.code !== 1000 && enabled) {
          console.log(`[WebSocket] Attempting reconnection to ${channel} in 5s...`);
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        }
      };

      ws.onerror = (error) => {
        console.error(`[WebSocket] Error on ${channel}:`, error);
      };
    }


    connect();

    return () => {
      unmounted = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
        wsRef.current = null;
      }
    };
  }, [channel, enabled]); // Only reconnect when channel or enabled changes

  return { isConnected };
}
