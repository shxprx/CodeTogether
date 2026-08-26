import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useWebSocket — custom hook for WebSocket communication.
 *
 * No auto-reconnect (per spec). If disconnected, shows
 * "Disconnected. Refresh to reconnect."
 *
 * @param {string|null} url - WebSocket URL. Pass null to skip connecting.
 * @param {function} onMessage - called with parsed JSON on each message
 * @returns {{ sendMessage, connectionStatus }}
 */
export function useWebSocket(url, onMessage) {
  const wsRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting | connected | disconnected

  useEffect(() => {
    if (!url) return;

    setConnectionStatus('connecting');

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessage(message);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
    };

    ws.onerror = () => {
      setConnectionStatus('disconnected');
    };

    return () => {
      ws.close();
    };
  }, [url]); // intentionally omit onMessage — it's stable via useCallback at the call-site

  const sendMessage = useCallback((type, payload = {}) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }, []);

  return { sendMessage, connectionStatus };
}
