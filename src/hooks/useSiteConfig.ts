'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-057c.up.railway.app';

let _cache: Record<string, any> | null = null;
let _promise: Promise<Record<string, any>> | null = null;

async function fetchConfig(): Promise<Record<string, any>> {
  if (_cache) return _cache;
  if (_promise) return _promise;
  _promise = fetch(`${API}/api/config`)
    .then(r => r.ok ? r.json() : { data: {} })
    .then(j => { _cache = j.data || {}; return _cache!; })
    .catch(() => { _promise = null; return {}; });
  return _promise;
}

export function useSiteConfig(): Record<string, any> {
  const [config, setConfig] = useState<Record<string, any>>(_cache || {});
  useEffect(() => {
    fetchConfig().then(setConfig);
  }, []);
  return config;
}
