export default function LeadsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-8 w-32 rounded-lg bg-muted" />
        <div className="mt-2 h-4 w-72 rounded-lg bg-muted" />
      </div>

      <div className="space-y-8">
        {/* Metric tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border border-white/[0.04] bg-card" />
          ))}
        </div>

        {/* Charts: Bar + Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
            <div className="mb-4 h-5 w-44 rounded-lg bg-muted" />
            <div className="h-[260px] rounded-xl bg-muted" />
          </div>
          <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
            <div className="mb-4 h-5 w-36 rounded-lg bg-muted" />
            <div className="h-[260px] rounded-xl bg-muted" />
          </div>
        </div>

        {/* Recent Signals table */}
        <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
          <div className="mb-4 h-5 w-32 rounded-lg bg-muted" />
          <div className="space-y-0">
            <div className="flex gap-4 border-b border-white/[0.04] pb-3">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="ml-auto h-3 w-12 rounded bg-muted" />
              <div className="h-3 w-16 rounded bg-muted" />
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-white/[0.04] last:border-0">
                <div className="h-4 w-48 rounded bg-muted" />
                <div className="h-5 w-16 rounded-full bg-muted" />
                <div className="ml-auto h-4 w-8 rounded bg-muted" />
                <div className="h-4 w-16 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl border border-white/[0.04] bg-card" />
          ))}
        </div>
      </div>
    </div>
  );
}
