'use client';

import { useEffect } from 'react';

export default function LandingBuilderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Landing Builder Error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
        <svg className="h-7 w-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Failed to load landing builder</h2>
        <p className="mt-2 max-w-md text-sm text-zinc-500">An unexpected error occurred.</p>
        {error.message && (
          <p className="mt-2 max-w-md rounded-lg bg-zinc-900 px-4 py-2 font-mono text-xs text-red-400/80">{error.message}</p>
        )}
      </div>
      <button onClick={reset} className="rounded-xl bg-white/[0.06] border border-white/[0.08] px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/[0.10] hover:text-white transition-all duration-200">
        Try again
      </button>
    </div>
  );
}
