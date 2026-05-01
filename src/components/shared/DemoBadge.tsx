'use client';

/**
 * Badge shown when a page is displaying demo/fallback data instead of
 * real API data. Provides clear visual signal to the user.
 */
export function DemoBadge({ reason }: { reason?: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
      Demo Data
      {reason && <span className="text-amber-500/70 ml-1">— {reason}</span>}
    </div>
  );
}

/**
 * Inline banner variant for placing at the top of a page.
 */
export function DemoBanner({ reason }: { reason?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-2.5 mb-4">
      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
      <span className="text-xs text-amber-400 font-medium">
        Showing demo data{reason ? ` — ${reason}` : ''}. Connect API endpoint to see live data.
      </span>
    </div>
  );
}
