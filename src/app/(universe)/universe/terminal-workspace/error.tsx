'use client';

import { useEffect } from 'react';
import { API_URL } from '@/lib/config';

export default function TerminalWorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('memelli_token') : null;
    if (token) {
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '/unknown';
      fetch(`${API_URL}/api/admin/nav-health/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          route: pathname,
          menuItem: 'terminal-workspace',
          httpStatus: 500,
          errorType: 'render_error' as const,
          timestamp: new Date().toISOString(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'ssr',
          environment: API_URL.includes('localhost') ? 'local' : 'production',
        }),
      }).catch(() => {});
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 border border-red-500/30">
        <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Terminal Workspace failed to load</h2>
        <p className="mt-2 max-w-md text-sm text-[hsl(var(--muted-foreground))]">This error has been automatically reported to the Navigation Health Monitor.</p>
        {error.message && (
          <p className="mt-2 max-w-md rounded-lg bg-[hsl(var(--card))] px-4 py-2 font-mono text-xs text-red-400">{error.message}</p>
        )}
      </div>
      <button onClick={reset} className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-blue-500 transition-colors">
        Try again
      </button>
    </div>
  );
}
