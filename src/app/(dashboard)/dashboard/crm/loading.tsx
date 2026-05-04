export default function CRMLoading() {
  return (
    <div className="space-y-8 bg-card min-h-screen p-8 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 w-32 rounded-lg bg-muted" />
        <div className="mt-2 h-4 w-64 rounded-lg bg-muted" />
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-white/[0.04] bg-card" />
        ))}
      </div>

      {/* Quick action buttons */}
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-28 rounded-xl bg-muted" />
        ))}
      </div>

      {/* Pipeline + Recent Deals side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
          <div className="mb-6 h-6 w-36 rounded-lg bg-muted" />
          <div className="space-y-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-28 rounded bg-muted" />
                  <div className="h-4 w-16 rounded bg-muted" />
                </div>
                <div className="h-2 w-full rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
          <div className="mb-6 h-6 w-32 rounded-lg bg-muted" />
          <div className="space-y-0 divide-y divide-white/[0.04]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-4">
                <div className="space-y-2">
                  <div className="h-4 w-36 rounded bg-muted" />
                  <div className="h-3 w-20 rounded bg-muted" />
                </div>
                <div className="h-4 w-16 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Velocity chart placeholder */}
      <div className="rounded-2xl border border-white/[0.04] bg-card p-6">
        <div className="mb-4 h-6 w-32 rounded-lg bg-muted" />
        <div className="h-[260px] rounded-xl bg-muted" />
      </div>
    </div>
  );
}
