export default function DashboardLoading() {
  return (
    <div className="space-y-10 p-8 animate-pulse">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-64 rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-80 rounded-lg bg-muted" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-16 rounded-full bg-muted" />
          <div className="h-6 w-20 rounded-full bg-muted" />
        </div>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-white/[0.04] bg-card" />
        ))}
      </div>

      {/* System Health card */}
      <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
        <div className="mb-4 h-5 w-36 rounded-lg bg-muted" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl border border-white/[0.04] bg-card" />
          ))}
        </div>
      </div>

      {/* Agent Pools card */}
      <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
        <div className="mb-4 h-5 w-40 rounded-lg bg-muted" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl border border-white/[0.04] bg-card" />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="mb-4 h-3 w-28 rounded bg-muted" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl border border-white/[0.04] bg-card" />
          ))}
        </div>
      </div>

      {/* Live Feed + Activity side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
          <div className="mb-4 h-5 w-24 rounded-lg bg-muted" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
          <div className="mb-4 h-5 w-32 rounded-lg bg-muted" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>

      {/* Product cards */}
      <div>
        <div className="mb-4 h-3 w-28 rounded bg-muted" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl border border-white/[0.04] bg-card" />
          ))}
        </div>
      </div>
    </div>
  );
}
