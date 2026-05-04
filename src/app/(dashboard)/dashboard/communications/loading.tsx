export default function CommunicationsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 w-44 rounded-lg bg-muted" />
        <div className="mt-2 h-4 w-72 rounded-lg bg-muted" />
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-white/[0.04] bg-card" />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-card p-4">
            <div className="h-11 w-11 rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-3 w-28 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>

      {/* Call Volume chart */}
      <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
        <div className="mb-4 h-5 w-40 rounded-lg bg-muted" />
        <div className="h-[300px] rounded-xl bg-muted" />
      </div>

      {/* Recent Calls + Recent Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/[0.04] bg-card overflow-hidden">
            <div className="p-6 pb-4">
              <div className="h-5 w-32 rounded-lg bg-muted" />
            </div>
            <div className="divide-y divide-white/[0.04]">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-8 w-8 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-32 rounded bg-muted" />
                    <div className="h-3 w-48 rounded bg-muted" />
                  </div>
                  <div className="h-3 w-14 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
