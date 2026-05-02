import { useState, useEffect, useRef } from 'react';

export function useMelliBarListen(userId: string | number) {
  const [context, setContext] = useState<any>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef<number>(1000); // 1 s initial back‑off
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (!userId) return;

    const url = new URL('/ws/melli-bar', window.location.origin);
    url.searchParams.set('user', String(userId));
    const ws = new WebSocket(url.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      // reset back‑off on successful connection
      backoffRef.current = 1000;
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setContext(data);
      } catch {
        console.warn('Invalid JSON received from MelliBar WebSocket');
      }
    };

    ws.onerror = (err) => {
      // errors trigger close handler; just log here
      console.error('MelliBar WebSocket error:', err);
    };

    ws.onclose = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        // exponential back‑off with max 30 s
        backoffRef.current = Math.min(backoffRef.current * 2, 30000);
        connect();
      }, backoffRef.current);
    };
  };

  useEffect(() => {
    connect();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [userId]);

  return context;
}