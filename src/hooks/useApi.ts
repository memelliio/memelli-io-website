'use client';

import { useAuth } from '../contexts/auth';
import { API_URL } from '@/lib/config';

type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  /** When the server returns an error status but includes a response body, it is preserved here. */
  errorData?: any;
};

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null }
): Promise<ApiResponse<T>> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  try {
    const res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { data: null, error: err.error ?? err.message ?? `HTTP ${res.status}`, errorData: err.data ?? err };
    }
    const json = await res.json();
    // API wraps responses in { success, data } — unwrap automatically.
    // When the response also contains `meta` (pagination), preserve the
    // envelope so callers can access both `data` and `meta`.
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      const data: T = 'meta' in json ? { data: json.data, meta: json.meta } as T : json.data;
      return { data, error: null };
    }
    return { data: json as T, error: null };
  } catch (e: unknown) {
    return { data: null, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/** Read token directly from localStorage — instant, no waiting for auth context */
function getTokenImmediate(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('memelli_live_token') ||
    localStorage.getItem('memelli_token') ||
    localStorage.getItem('memelli_dev_token') ||
    null
  );
}

export function useApi() {
  const { token: contextToken } = useAuth();
  // Use context token if available, otherwise read directly from localStorage
  // This ensures API calls work immediately even before auth context finishes validation
  const token = contextToken || getTokenImmediate();

  function get<T>(path: string): Promise<ApiResponse<T>> {
    return request<T>(path, { method: 'GET', token });
  }

  function post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return request<T>(path, { method: 'POST', body: JSON.stringify(body), token });
  }

  function patch<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    return request<T>(path, { method: 'PATCH', body: JSON.stringify(body), token });
  }

  function del<T>(path: string): Promise<ApiResponse<T>> {
    return request<T>(path, { method: 'DELETE', token });
  }

  /** Upload FormData (file uploads). Does NOT set Content-Type — the browser adds the multipart boundary automatically. */
  async function upload<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    try {
      const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { data: null, error: err.error ?? err.message ?? `HTTP ${res.status}` };
      }
      const json = await res.json();
      // Auto-unwrap { success, data } envelope just like other methods
      const data: T = json && typeof json === 'object' && 'success' in json && 'data' in json
        ? json.data
        : json;
      return { data, error: null };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : 'Network error' };
    }
  }

  /** Base API URL for constructing download/preview URLs (img src, iframe src, a href). */
  const baseUrl = API_URL;

  return { get, post, patch, del, upload, baseUrl };
}
