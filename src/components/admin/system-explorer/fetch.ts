// Shared fetch helper for system-explorer tabs.
// Mirrors the auth pattern in apps/web/src/app/admin/chat/page.tsx — pulls
// the SUPER_ADMIN bearer from localStorage and falls through on localhost.

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("memelli_token");
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

// Format a Date / ISO string in mm/dd/yyyy hh:mm — matches the platform date law.
export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try {
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(dt.getMonth() + 1)}/${pad(dt.getDate())}/${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  } catch {
    return String(d);
  }
}

// Use a pollable hook pattern: every mounted tab refetches on a 5–10s interval
// so the operator sees freshness without manual reload. The hook returns
// { data, error, loading, refetch }.
import { useCallback, useEffect, useRef, useState } from "react";

export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number = 8000
): { data: T | null; error: string | null; loading: boolean; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  // Stash the fetcher in a ref so the polling effect doesn't re-subscribe on every render
  // (callers will typically inline a new function each render).
  const fnRef = useRef(fetcher);
  fnRef.current = fetcher;

  const run = useCallback(async () => {
    try {
      const v = await fnRef.current();
      setData(v);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    void run();
    const id = setInterval(() => {
      if (!alive) return;
      void run();
    }, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [run, intervalMs]);

  return { data, error, loading, refetch: run };
}
