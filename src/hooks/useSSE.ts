'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth';
import { useNotificationStore } from '@/stores/notifications';
import { API_URL } from '@/lib/config';

// ─── Types ────────────────────────────────────────────────────────────────────

type SSEHandler = (event: { type: string; data: any }) => void;

interface UseSSEReturn {
  connected: boolean;
  reconnect: () => void;
  disconnect: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSSE(handlers?: Record<string, SSEHandler>): UseSSEReturn {
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);

  const esRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const { addNotification, setSseConnected } = useNotificationStore();

  // Keep a stable ref for addNotification so it doesn't trigger reconnects
  const addNotificationRef = useRef(addNotification);
  addNotificationRef.current = addNotification;

  const setSseConnectedRef = useRef(setSseConnected);
  setSseConnectedRef.current = setSseConnected;

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setConnected(false);
    setSseConnectedRef.current(false);
  }, []);

  const connect = useCallback(() => {
    if (!token) return;
    cleanup();

    const url = `${API_URL}/api/sse/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
      setSseConnectedRef.current(true);
      retriesRef.current = 0;
    };

    es.onmessage = (event) => {
      let parsed: any;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        // Non-JSON payloads (e.g. keepalive pings) — ignore
        return;
      }

      const eventType: string = parsed.type ?? 'message';

      // Dispatch to notification store for notification-type events
      if (
        eventType === 'notification' ||
        eventType === 'info' ||
        eventType === 'success' ||
        eventType === 'warning' ||
        eventType === 'error'
      ) {
        addNotificationRef.current({
          type: eventType === 'notification' ? (parsed.level ?? 'info') : eventType,
          title: parsed.title ?? 'New notification',
          message: parsed.message,
          actionUrl: parsed.actionUrl,
          category: parsed.category,
        });
      }

      // Call matching custom handler
      const handler = handlersRef.current?.[eventType];
      if (handler) {
        handler({ type: eventType, data: parsed });
      }

      // Also call wildcard handler if provided
      const wildcardHandler = handlersRef.current?.['*'];
      if (wildcardHandler) {
        wildcardHandler({ type: eventType, data: parsed });
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setConnected(false);
      setSseConnectedRef.current(false);

      // Exponential backoff capped at MAX_DELAY_MS
      const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retriesRef.current), MAX_DELAY_MS);
      retriesRef.current += 1;
      timerRef.current = setTimeout(connect, delay);
    };
  }, [token, cleanup]);

  const reconnect = useCallback(() => {
    retriesRef.current = 0;
    connect();
  }, [connect]);

  const disconnect = useCallback(() => {
    retriesRef.current = 0;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setConnected(false);
    setSseConnectedRef.current(false);
  }, []);

  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);

  return { connected, reconnect, disconnect };
}
