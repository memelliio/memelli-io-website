export default function AnalyticsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-28 rounded-lg bg-muted" />
        <div className="mt-2 h-4 w-72 rounded-lg bg-muted" />
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-white/[0.04] bg-card" />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.04] bg-card p-6">
            <div className="mb-3 h-4 w-28 rounded bg-muted" />
            <div className="h-12 rounded-lg bg-muted" />
          </div>
        ))}
      </div>

      {/* Engine Performance */}
      <div>
        <div className="mb-5 h-3 w-36 rounded bg-muted" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.04] bg-card p-6">
              <div className="mb-4 h-5 w-24 rounded-lg bg-muted" />
              <div className="space-y-2.5">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="h-3 w-20 rounded bg-muted" />
                    <div className="h-3 w-10 rounded bg-muted" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Events */}
      <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
        <div className="mb-4 h-5 w-44 rounded-lg bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-5 w-24 rounded-full bg-muted" />
              <div className="h-3 flex-1 rounded bg-muted" />
              <div className="h-3 w-14 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
