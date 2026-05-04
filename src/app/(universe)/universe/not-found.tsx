'use client';

import { useEffect } from 'react';
import { API_URL } from '@/lib/config';
import Link from 'next/link';

/**
 * Universe-level 404 page.
 * Auto-reports missing pages to the Navigation Health Monitor.
 */
export default function UniverseNotFound() {
  useEffect(() => {
    const token = localStorage.getItem('memelli_token');
    if (!token) return;

    const pathname = window.location.pathname;

    fetch(`${API_URL}/api/admin/nav-health/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        route: pathname,
        menuItem: pathname.split('/').pop() ?? 'Unknown',
        httpStatus: 404,
        errorType: 'page_not_found' as const,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        environment: API_URL.includes('localhost') ? 'local' : 'production',
      }),
    }).catch(() => {
      // Silently fail
    });
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/15 border border-yellow-500/30">
        <span className="text-3xl font-bold text-yellow-400">404</span>
      </div>
      <div>
        <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Page not found</h2>
        <p className="mt-2 max-w-md text-sm text-[hsl(var(--muted-foreground))]">
          This missing page has been automatically reported to the Navigation Health Monitor.
        </p>
      </div>
      <Link
        href="/universe"
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-blue-500 transition-colors"
      >
        Back to Overview
      </Link>
    </div>
  );
}
